import { db } from "../../../db";
import { eq, sql } from "drizzle-orm";
import {
  pyckerOnlineStatus,
  haulerProfiles,
  users,
  type PyckerOnlineStatus,
  type InsertPyckerOnlineStatus,
  type HaulerProfile,
} from "@shared/schema";

export class PyckerStatusStorage {
  async getPyckerOnlineStatus(pyckerId: string): Promise<PyckerOnlineStatus | undefined> {
    const [status] = await db.select()
      .from(pyckerOnlineStatus)
      .where(eq(pyckerOnlineStatus.pyckerId, pyckerId));
    return status || undefined;
  }

  async updatePyckerLocation(data: InsertPyckerOnlineStatus): Promise<PyckerOnlineStatus> {
    // Upsert - update if exists, insert if not
    const existing = await this.getPyckerOnlineStatus(data.pyckerId);

    if (existing) {
      const [updated] = await db.update(pyckerOnlineStatus)
        .set({
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: data.accuracy,
          status: data.status,
          currentJobId: data.currentJobId,
          lastUpdated: data.lastUpdated,
          expiresAt: data.expiresAt,
          locationConsentGiven: data.locationConsentGiven,
          consentGivenAt: data.consentGivenAt,
        })
        .where(eq(pyckerOnlineStatus.pyckerId, data.pyckerId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(pyckerOnlineStatus)
        .values(data)
        .returning();
      return created;
    }
  }

  async setPyckerOffline(pyckerId: string): Promise<void> {
    await db.delete(pyckerOnlineStatus)
      .where(eq(pyckerOnlineStatus.pyckerId, pyckerId));
  }

  async getOnlinePyckersNearby(lat: number, lng: number, radiusMiles: number): Promise<(PyckerOnlineStatus & { haulerProfile: HaulerProfile; distance: number })[]> {
    // Use Haversine formula to calculate distance
    // 3959 is the radius of Earth in miles
    const now = new Date().toISOString();

    const results = await db.execute(sql`
      SELECT
        pos.pycker_id,
        pos.latitude,
        pos.longitude,
        pos.status,
        hp.id as profile_id,
        hp.company_name,
        hp.vehicle_type,
        hp.capabilities,
        hp.offers_labor_only,
        hp.capacity,
        hp.rating,
        hp.jobs_completed,
        hp.pycker_tier,
        hp.hourly_rate,
        hp.review_count,
        hp.is_available,
        u.first_name,
        u.last_name,
        u.profile_image_url,
        (3959 * acos(
          cos(radians(${lat})) * cos(radians(pos.latitude)) *
          cos(radians(pos.longitude) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(pos.latitude))
        )) AS distance
      FROM pycker_online_status pos
      JOIN hauler_profiles hp ON pos.pycker_id = hp.id
      JOIN users u ON hp.user_id = u.id
      WHERE pos.status = 'available'
        AND pos.expires_at > ${now}
        AND (3959 * acos(
          cos(radians(${lat})) * cos(radians(pos.latitude)) *
          cos(radians(pos.longitude) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(pos.latitude))
        )) <= ${radiusMiles}
      ORDER BY distance ASC
    `);

    return (results.rows || []) as (PyckerOnlineStatus & { haulerProfile: HaulerProfile; distance: number })[];
  }

  async cleanupExpiredPyckerLocations(): Promise<number> {
    const now = new Date().toISOString();
    const result = await db.delete(pyckerOnlineStatus)
      .where(sql`${pyckerOnlineStatus.expiresAt} < ${now}`);
    return result.rowCount || 0;
  }
}
