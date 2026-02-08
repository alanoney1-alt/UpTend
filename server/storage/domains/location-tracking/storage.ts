import { db } from "../../../db";
import { locationHistory, type LocationHistory, type InsertLocationHistory } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export interface ILocationTrackingStorage {
  addLocationHistory(location: InsertLocationHistory): Promise<LocationHistory>;
  getLocationHistory(userId: string, jobId?: string): Promise<LocationHistory[]>;
  getLatestLocation(userId: string): Promise<LocationHistory | undefined>;
}

export class LocationTrackingStorage implements ILocationTrackingStorage {
  // Note: updateUserLocation is defined in the users domain
  private async updateUserLocation(userId: string, lat: number, lng: number): Promise<void> {
    // This method will be implemented by composing with UsersStorage
    // For now, we'll leave it as a placeholder that needs to be wired up
  }

  async addLocationHistory(location: InsertLocationHistory): Promise<LocationHistory> {
    const [newLocation] = await db.insert(locationHistory).values(location).returning();

    if (location.userId) {
      await this.updateUserLocation(location.userId, location.lat, location.lng);
    }

    return newLocation;
  }

  async getLocationHistory(userId: string, jobId?: string): Promise<LocationHistory[]> {
    if (jobId) {
      return db.select().from(locationHistory)
        .where(and(eq(locationHistory.userId, userId), eq(locationHistory.jobId, jobId)))
        .orderBy(desc(locationHistory.recordedAt));
    }
    return db.select().from(locationHistory)
      .where(eq(locationHistory.userId, userId))
      .orderBy(desc(locationHistory.recordedAt));
  }

  async getLatestLocation(userId: string): Promise<LocationHistory | undefined> {
    const [location] = await db.select().from(locationHistory)
      .where(eq(locationHistory.userId, userId))
      .orderBy(desc(locationHistory.recordedAt))
      .limit(1);
    return location || undefined;
  }
}
