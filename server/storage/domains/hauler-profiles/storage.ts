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

export class HaulerProfilesStorage {
  async getHaulerProfile(userId: string): Promise<HaulerProfile | undefined> {
    const [profile] = await db.select().from(haulerProfiles).where(eq(haulerProfiles.userId, userId));
    return profile || undefined;
  }

  async getHaulerProfileById(id: string): Promise<HaulerProfile | undefined> {
    const [profile] = await db.select().from(haulerProfiles).where(eq(haulerProfiles.id, id));
    return profile || undefined;
  }

  async getAllHaulerProfiles(): Promise<HaulerProfile[]> {
    return db.select().from(haulerProfiles);
  }

  async createHaulerProfile(profile: InsertHaulerProfile): Promise<HaulerProfile> {
    const [newProfile] = await db.insert(haulerProfiles).values(profile).returning();
    return newProfile;
  }

  async updateHaulerProfile(id: string, updates: Partial<HaulerProfile>): Promise<HaulerProfile | undefined> {
    const [profile] = await db.update(haulerProfiles)
      .set(updates)
      .where(eq(haulerProfiles.id, id))
      .returning();
    return profile || undefined;
  }

  // TODO: CROSS-DOMAIN COMPOSITION REQUIRED
  // This method requires access to the users domain to fetch user data
  // When implementing the composition layer, inject a getUser method or users storage instance
  async getAvailableHaulers(): Promise<HaulerWithProfile[]> {
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
  // Complex composition: users + hauler profiles + vehicles
  async getAvailableHaulersWithVehicles(): Promise<HaulerWithProfileAndVehicle[]> {
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

  async checkInHauler(profileId: string, lat?: number, lng?: number): Promise<HaulerProfile | undefined> {
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

  async checkOutHauler(profileId: string): Promise<HaulerProfile | undefined> {
    const [profile] = await db.update(haulerProfiles)
      .set({ isAvailable: false })
      .where(eq(haulerProfiles.id, profileId))
      .returning();
    return profile || undefined;
  }

  // TODO: CROSS-DOMAIN COMPOSITION REQUIRED
  // This method requires access to the users domain
  async getAllHaulers(): Promise<HaulerWithProfile[]> {
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
}
