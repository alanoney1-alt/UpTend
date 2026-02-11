import { eq, and } from "drizzle-orm";
import { db } from "../../../db";
import { haulerProfiles, pyckerVehicles, users } from "@shared/schema";
import type {
  HaulerProfile,
  InsertHaulerProfile,
  HaulerWithProfile,
  HaulerWithProfileAndVehicle,
  PyckerVehicle,
  User,
} from "@shared/schema";

export class ProProfilesStorage {
  async getProProfile(userId: string): Promise<HaulerProfile | undefined> {
    const [profile] = await db.select().from(haulerProfiles).where(eq(haulerProfiles.userId, userId));
    return profile || undefined;
  }

  async getProProfileById(id: string): Promise<HaulerProfile | undefined> {
    const [profile] = await db.select().from(haulerProfiles).where(eq(haulerProfiles.id, id));
    return profile || undefined;
  }

  async getAllProProfiles(): Promise<HaulerProfile[]> {
    return db.select().from(haulerProfiles);
  }

  async createProProfile(profile: InsertHaulerProfile): Promise<HaulerProfile> {
    const [newProfile] = await db.insert(haulerProfiles).values(profile).returning();
    return newProfile;
  }

  async updateProProfile(id: string, updates: Partial<HaulerProfile>): Promise<HaulerProfile | undefined> {
    const [profile] = await db.update(haulerProfiles)
      .set(updates)
      .where(eq(haulerProfiles.id, id))
      .returning();
    return profile || undefined;
  }

  // TODO: CROSS-DOMAIN COMPOSITION REQUIRED
  // This method requires access to the users domain to fetch user data
  // When implementing the composition layer, inject a getUser method or users storage instance
  async getAvailablePros(): Promise<HaulerWithProfile[]> {
    const profiles = await db.select().from(haulerProfiles).where(eq(haulerProfiles.isAvailable, true));
    const results: HaulerWithProfile[] = [];
    for (const profile of profiles) {
      // TEMPORARY: Direct DB access - should use injected users storage
      const [user] = await db.select().from(users).where(eq(users.id, profile.userId));
      if (user) {
        results.push({ ...user, profile });
      }
    }
    return results;
  }

  // TODO: CROSS-DOMAIN COMPOSITION REQUIRED
  // This method requires access to both users and vehicles domains
  // Complex composition: users + Pro profiles + vehicles
  async getAvailableProsWithVehicles(): Promise<HaulerWithProfileAndVehicle[]> {
    const profiles = await db.select().from(haulerProfiles).where(eq(haulerProfiles.isAvailable, true));
    const results: HaulerWithProfileAndVehicle[] = [];
    for (const profile of profiles) {
      // TEMPORARY: Direct DB access - should use injected users storage
      const [user] = await db.select().from(users).where(eq(users.id, profile.userId));
      if (user) {
        let activeVehicle: PyckerVehicle | undefined = undefined;
        if (profile.activeVehicleId) {
          const [vehicle] = await db.select().from(pyckerVehicles).where(eq(pyckerVehicles.id, profile.activeVehicleId));
          activeVehicle = vehicle || undefined;
        }
        results.push({ ...user, profile, activeVehicle });
      }
    }
    return results;
  }

  async checkInPro(profileId: string, lat?: number, lng?: number): Promise<HaulerProfile | undefined> {
    const [profile] = await db.update(haulerProfiles)
      .set({
        isAvailable: true,
        lastCheckedIn: new Date().toISOString(),
        ...(lat !== undefined && { currentLat: lat }),
        ...(lng !== undefined && { currentLng: lng }),
      })
      .where(eq(haulerProfiles.id, profileId))
      .returning();
    return profile || undefined;
  }

  async checkOutPro(profileId: string): Promise<HaulerProfile | undefined> {
    const [profile] = await db.update(haulerProfiles)
      .set({ isAvailable: false })
      .where(eq(haulerProfiles.id, profileId))
      .returning();
    return profile || undefined;
  }

  // TODO: CROSS-DOMAIN COMPOSITION REQUIRED
  // This method requires access to the users domain
  async getAllPros(): Promise<HaulerWithProfile[]> {
    const profiles = await db.select().from(haulerProfiles);
    const results: HaulerWithProfile[] = [];
    for (const profile of profiles) {
      // TEMPORARY: Direct DB access - should use injected users storage
      const [user] = await db.select().from(users).where(eq(users.id, profile.userId));
      if (user) {
        results.push({ ...user, profile });
      }
    }
    return results;
  }

  // Legacy aliases for backward compatibility
  getHaulerProfile = this.getProProfile;
  getHaulerProfileById = this.getProProfileById;
  getAllHaulerProfiles = this.getAllProProfiles;
  createHaulerProfile = this.createProProfile;
  updateHaulerProfile = this.updateProProfile;
  getAvailableHaulers = this.getAvailablePros;
  getAvailableHaulersWithVehicles = this.getAvailableProsWithVehicles;
  checkInHauler = this.checkInPro;
  checkOutHauler = this.checkOutPro;
  getAllHaulers = this.getAllPros;
}
