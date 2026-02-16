/**
 * Same-Day Service Guarantee API Routes
 *
 * Endpoints:
 * - GET /api/same-day/available?serviceType=X&zip=Y — check same-day availability
 * - PATCH /api/same-day/opt-in — pro toggles same-day availability
 */

import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { haulerProfiles } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../auth-middleware";
import { z } from "zod";

// Premium pricing multiplier for same-day service
const SAME_DAY_MULTIPLIER = 1.25;

const availabilityQuerySchema = z.object({
  serviceType: z.string(),
  zip: z.string().min(5).max(10),
});

const optInSchema = z.object({
  sameDayAvailable: z.boolean(),
  sameDayRadius: z.number().min(1).max(100).optional(),
});

export function registerSameDayRoutes(app: Express) {
  // GET /api/same-day/available — check if same-day pros exist for service+zip
  app.get("/api/same-day/available", async (req: Request, res: Response) => {
    try {
      const validated = availabilityQuerySchema.parse(req.query);

      const db = (storage as any).db;
      if (!db) return res.status(500).json({ error: "Database not available" });

      
      

      // Find available pros who opted into same-day and serve this service type
      const pros = await db
        .select({
          id: haulerProfiles.id,
          companyName: haulerProfiles.companyName,
          rating: haulerProfiles.rating,
          sameDayRadius: haulerProfiles.sameDayRadius,
        })
        .from(haulerProfiles)
        .where(
          and(
            eq(haulerProfiles.sameDayAvailable, true),
            eq(haulerProfiles.isAvailable, true),
            sql`${haulerProfiles.serviceTypes} @> ARRAY[${validated.serviceType}]::text[]`
          )
        )
        .limit(10);

      const available = pros.length > 0;

      res.json({
        success: true,
        available,
        proCount: pros.length,
        premiumMultiplier: SAME_DAY_MULTIPLIER,
        message: available
          ? `${pros.length} pro${pros.length > 1 ? "s" : ""} available for same-day service`
          : "No same-day pros available in your area right now",
      });
    } catch (error: any) {
      console.error("Error checking same-day availability:", error);
      res.status(400).json({ error: error.message || "Failed to check availability" });
    }
  });

  // PATCH /api/same-day/opt-in — pro toggles same-day settings
  app.patch("/api/same-day/opt-in", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Authentication required" });
      const userId = (req.user as any).userId || (req.user as any).id;
      const validated = optInSchema.parse(req.body);

      const db = (storage as any).db;
      if (!db) return res.status(500).json({ error: "Database not available" });

      
      

      const updates: any = { sameDayAvailable: validated.sameDayAvailable };
      if (validated.sameDayRadius !== undefined) {
        updates.sameDayRadius = validated.sameDayRadius;
      }

      await db.update(haulerProfiles).set(updates).where(eq(haulerProfiles.userId, userId));

      res.json({
        success: true,
        sameDayAvailable: validated.sameDayAvailable,
        sameDayRadius: validated.sameDayRadius,
        message: validated.sameDayAvailable
          ? "Same-day availability enabled! You'll receive same-day job requests."
          : "Same-day availability disabled.",
      });
    } catch (error: any) {
      console.error("Error updating same-day opt-in:", error);
      res.status(400).json({ error: error.message || "Failed to update same-day settings" });
    }
  });

  // GET /api/same-day/multiplier — get premium pricing info
  app.get("/api/same-day/multiplier", async (_req: Request, res: Response) => {
    res.json({
      success: true,
      multiplier: SAME_DAY_MULTIPLIER,
      description: "Same-day service includes a 25% premium for guaranteed availability",
    });
  });
}
