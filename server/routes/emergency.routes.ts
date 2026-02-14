import type { Express } from "express";
import { db } from "../db";
import { emergencyRequests, haulerProfiles } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, requireCustomer } from "../auth-middleware";
import { broadcastToJob } from "../websocket";
import { z } from "zod";

const EMERGENCY_TYPES = [
  "water_damage", "fire_damage", "lockout", "broken_pipe",
  "electrical_emergency", "gas_leak", "storm_damage",
] as const;

const createEmergencySchema = z.object({
  emergencyType: z.enum(EMERGENCY_TYPES),
  description: z.string().optional(),
  photoUrls: z.array(z.string()).optional(),
  addressLine1: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().min(5),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export function registerEmergencyRoutes(app: Express) {
  // POST /api/emergency/request — create emergency request
  app.post("/api/emergency/request", requireAuth, requireCustomer, async (req: any, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const parsed = createEmergencySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
      }

      const data = parsed.data;

      // Create emergency request with DB-level insert (atomic)
      const [emergency] = await db.insert(emergencyRequests).values({
        customerId: userId,
        emergencyType: data.emergencyType,
        description: data.description || null,
        photoUrls: data.photoUrls || [],
        addressLine1: data.addressLine1,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        lat: data.lat || null,
        lng: data.lng || null,
        status: "searching",
        pricingMultiplier: 2.0,
      }).returning();

      // Find available pros within radius and notify via WebSocket
      const availablePros = await db.select().from(haulerProfiles).where(
        eq(haulerProfiles.isAvailable, true)
      ).limit(50);

      // Broadcast emergency to all available pros via their job room
      for (const pro of availablePros) {
        broadcastToJob(`pro-${pro.userId}`, {
          type: "emergency_request",
          emergencyId: emergency.id,
          emergencyType: data.emergencyType,
          description: data.description,
          city: data.city,
          state: data.state,
          pricingMultiplier: 2.0,
        });
      }

      // Also broadcast to the emergency-specific room
      broadcastToJob(`emergency-${emergency.id}`, {
        type: "emergency_status",
        status: "searching",
        emergencyId: emergency.id,
      });

      res.status(201).json(emergency);
    } catch (error) {
      console.error("Error creating emergency request:", error);
      res.status(500).json({ error: "Failed to create emergency request" });
    }
  });

  // POST /api/emergency/:id/accept — pro accepts (race-condition safe)
  app.post("/api/emergency/:id/accept", requireAuth, async (req: any, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const { id } = req.params;
      const { etaMinutes } = req.body;

      // Use UPDATE ... WHERE status = 'searching' for race-condition safety
      // Only the first pro to run this gets the assignment
      const [updated] = await db.update(emergencyRequests)
        .set({
          status: "accepted",
          assignedHaulerId: userId,
          etaMinutes: etaMinutes || 30,
          acceptedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(and(
          eq(emergencyRequests.id, id),
          eq(emergencyRequests.status, "searching"),
        ))
        .returning();

      if (!updated) {
        return res.status(409).json({ error: "Emergency already accepted by another pro" });
      }

      // Notify customer via WebSocket
      broadcastToJob(`emergency-${id}`, {
        type: "emergency_status",
        status: "accepted",
        emergencyId: id,
        assignedHaulerId: userId,
        etaMinutes: etaMinutes || 30,
      });

      res.json(updated);
    } catch (error) {
      console.error("Error accepting emergency:", error);
      res.status(500).json({ error: "Failed to accept emergency" });
    }
  });

  // GET /api/emergency/status/:id — real-time status
  app.get("/api/emergency/status/:id", requireAuth, async (req: any, res) => {
    try {
      const [emergency] = await db.select().from(emergencyRequests)
        .where(eq(emergencyRequests.id, req.params.id));

      if (!emergency) {
        return res.status(404).json({ error: "Emergency request not found" });
      }

      // If a pro is assigned, fetch their profile for ETA info
      let proInfo = null;
      if (emergency.assignedHaulerId) {
        const [profile] = await db.select().from(haulerProfiles)
          .where(eq(haulerProfiles.userId, emergency.assignedHaulerId));
        if (profile) {
          proInfo = {
            companyName: profile.companyName,
            rating: profile.rating,
            phone: profile.phone,
          };
        }
      }

      res.json({ ...emergency, proInfo });
    } catch (error) {
      console.error("Error fetching emergency status:", error);
      res.status(500).json({ error: "Failed to fetch emergency status" });
    }
  });

  // GET /api/emergency/types — list emergency service types
  app.get("/api/emergency/types", (_req, res) => {
    res.json(EMERGENCY_TYPES.map(type => ({
      id: type,
      label: type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    })));
  });
}
