/**
 * Fleet Tracking Routes
 * 
 * POST /api/fleet/location  — pro posts their lat/lng
 * GET  /api/fleet/locations — dispatcher gets all active pro locations
 */

import type { Express } from "express";
import { requireAuth } from "../../auth-middleware";
import { db } from "../../db";
import { locationHistory, haulerProfiles } from "@shared/schema";
import { eq, desc, sql, gt } from "drizzle-orm";
import { z } from "zod";

const postLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
  heading: z.number().optional(),
  speed: z.number().optional(),
  jobId: z.string().optional(),
});

export function registerFleetRoutes(app: Express) {
  // POST /api/fleet/location — pro posts their current position
  app.post("/api/fleet/location", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      const data = postLocationSchema.parse(req.body);

      const [record] = await db.insert(locationHistory).values({
        userId,
        lat: data.lat,
        lng: data.lng,
        accuracy: data.accuracy ?? null,
        heading: data.heading ?? null,
        speed: data.speed ?? null,
        jobId: data.jobId ?? null,
        recordedAt: new Date().toISOString(),
      }).returning();

      // Also update hauler profile current position
      await db.update(haulerProfiles)
        .set({ currentLat: data.lat, currentLng: data.lng, lastCheckedIn: new Date().toISOString() })
        .where(eq(haulerProfiles.userId, userId));

      res.json({ success: true, location: record });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid location data", details: error.errors });
      }
      console.error("Error posting fleet location:", error);
      res.status(500).json({ error: "Failed to post location" });
    }
  });

  // GET /api/fleet/locations — get all active pro locations (last 30 min)
  app.get("/api/fleet/locations", requireAuth, async (req, res) => {
    try {
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

      // Get latest location per pro from hauler_profiles where recently active
      const activePros = await db.select({
        userId: haulerProfiles.userId,
        companyName: haulerProfiles.companyName,
        lat: haulerProfiles.currentLat,
        lng: haulerProfiles.currentLng,
        lastCheckedIn: haulerProfiles.lastCheckedIn,
        isAvailable: haulerProfiles.isAvailable,
        vehicleType: haulerProfiles.vehicleType,
      })
        .from(haulerProfiles)
        .where(gt(haulerProfiles.lastCheckedIn, thirtyMinAgo));

      res.json({
        success: true,
        count: activePros.length,
        locations: activePros.filter(p => p.lat != null && p.lng != null),
      });
    } catch (error) {
      console.error("Error fetching fleet locations:", error);
      res.status(500).json({ error: "Failed to fetch fleet locations" });
    }
  });
}
