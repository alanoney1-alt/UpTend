import type { Express } from "express";
import { db } from "../db";
import {
  neighborhoods, neighborhoodMembers, neighborhoodRecommendations,
  haulerProfiles,
} from "@shared/schema";
import { eq, and, desc, sql, count } from "drizzle-orm";
import { requireAuth, requireCustomer } from "../auth-middleware";
import { z } from "zod";
import { users } from "@shared/models/auth";

const GROUP_DISCOUNT_THRESHOLD = 3;
const GROUP_DISCOUNT_PERCENT = 15;

const recommendSchema = z.object({
  haulerId: z.string().min(1),
  serviceType: z.string().min(1),
  rating: z.number().min(1).max(5),
  review: z.string().optional(),
});

export function registerNeighborhoodRoutes(app: Express) {
  // GET /api/neighborhoods/mine — find neighborhood by user zip
  app.get("/api/neighborhoods/mine", requireAuth, requireCustomer, async (req: any, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) return res.status(404).json({ error: "User not found" });

      const zipCode = (user as any).zipCode || (user as any).zip;
      if (!zipCode) {
        return res.status(400).json({ error: "No zip code on your profile. Update your address first." });
      }

      // Auto-create neighborhood if it doesn't exist
      let [neighborhood] = await db.select().from(neighborhoods)
        .where(eq(neighborhoods.zipCode, zipCode));

      if (!neighborhood) {
        [neighborhood] = await db.insert(neighborhoods).values({
          name: `${zipCode} Neighbors`,
          zipCode,
          city: (user as any).city || "Unknown",
          state: (user as any).state || "Unknown",
          memberCount: 0,
        }).returning();
      }

      // Check membership
      const [membership] = await db.select().from(neighborhoodMembers)
        .where(and(
          eq(neighborhoodMembers.neighborhoodId, neighborhood.id),
          eq(neighborhoodMembers.customerId, userId),
        ));

      res.json({ ...neighborhood, isMember: !!membership });
    } catch (error) {
      console.error("Error fetching neighborhood:", error);
      res.status(500).json({ error: "Failed to fetch neighborhood" });
    }
  });

  // POST /api/neighborhoods/join
  app.post("/api/neighborhoods/join", requireAuth, requireCustomer, async (req: any, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const { neighborhoodId } = req.body;
      if (!neighborhoodId) return res.status(400).json({ error: "neighborhoodId required" });

      // Check if already a member
      const [existing] = await db.select().from(neighborhoodMembers)
        .where(and(
          eq(neighborhoodMembers.neighborhoodId, neighborhoodId),
          eq(neighborhoodMembers.customerId, userId),
        ));
      if (existing) return res.status(409).json({ error: "Already a member" });

      const [member] = await db.insert(neighborhoodMembers).values({
        neighborhoodId,
        customerId: userId,
      }).returning();

      // Increment member count
      await db.update(neighborhoods)
        .set({ memberCount: sql`${neighborhoods.memberCount} + 1` })
        .where(eq(neighborhoods.id, neighborhoodId));

      res.status(201).json(member);
    } catch (error) {
      console.error("Error joining neighborhood:", error);
      res.status(500).json({ error: "Failed to join neighborhood" });
    }
  });

  // GET /api/neighborhoods/:id/feed — recommendations + activity
  app.get("/api/neighborhoods/:id/feed", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;

      const [neighborhood] = await db.select().from(neighborhoods)
        .where(eq(neighborhoods.id, id));
      if (!neighborhood) return res.status(404).json({ error: "Neighborhood not found" });

      const recs = await db.select().from(neighborhoodRecommendations)
        .where(eq(neighborhoodRecommendations.neighborhoodId, id))
        .orderBy(desc(neighborhoodRecommendations.createdAt))
        .limit(50);

      // Aggregate popular services
      const popularServices = await db
        .select({
          serviceType: neighborhoodRecommendations.serviceType,
          count: count(),
          avgRating: sql<number>`avg(${neighborhoodRecommendations.rating})::real`,
        })
        .from(neighborhoodRecommendations)
        .where(eq(neighborhoodRecommendations.neighborhoodId, id))
        .groupBy(neighborhoodRecommendations.serviceType)
        .orderBy(desc(count()))
        .limit(10);

      // Check group discount eligibility
      const groupDeals = popularServices
        .filter((s: any) => Number(s.count) >= GROUP_DISCOUNT_THRESHOLD)
        .map((s: any) => ({
          serviceType: s.serviceType,
          neighborsBooked: Number(s.count),
          discountPercent: GROUP_DISCOUNT_PERCENT,
        }));

      res.json({
        neighborhood,
        recommendations: recs,
        popularServices,
        groupDeals,
      });
    } catch (error) {
      console.error("Error fetching neighborhood feed:", error);
      res.status(500).json({ error: "Failed to fetch neighborhood feed" });
    }
  });

  // POST /api/neighborhoods/:id/recommend
  app.post("/api/neighborhoods/:id/recommend", requireAuth, requireCustomer, async (req: any, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const { id } = req.params;
      const parsed = recommendSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
      }

      // Verify membership
      const [membership] = await db.select().from(neighborhoodMembers)
        .where(and(
          eq(neighborhoodMembers.neighborhoodId, id),
          eq(neighborhoodMembers.customerId, userId),
        ));
      if (!membership) {
        return res.status(403).json({ error: "Join the neighborhood first" });
      }

      const [rec] = await db.insert(neighborhoodRecommendations).values({
        neighborhoodId: id,
        customerId: userId,
        haulerId: parsed.data.haulerId,
        serviceType: parsed.data.serviceType,
        rating: parsed.data.rating,
        review: parsed.data.review || null,
      }).returning();

      res.status(201).json(rec);
    } catch (error) {
      console.error("Error creating recommendation:", error);
      res.status(500).json({ error: "Failed to create recommendation" });
    }
  });

  // GET /api/neighborhoods/:id/group-discount — check group discount
  app.get("/api/neighborhoods/:id/group-discount", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { serviceType } = req.query;

      if (!serviceType) return res.status(400).json({ error: "serviceType query param required" });

      const [result] = await db
        .select({ count: count() })
        .from(neighborhoodRecommendations)
        .where(and(
          eq(neighborhoodRecommendations.neighborhoodId, id),
          eq(neighborhoodRecommendations.serviceType, serviceType as string),
        ));

      const neighborsBooked = Number(result?.count || 0);
      const eligible = neighborsBooked >= GROUP_DISCOUNT_THRESHOLD;

      res.json({
        serviceType,
        neighborsBooked,
        eligible,
        discountPercent: eligible ? GROUP_DISCOUNT_PERCENT : 0,
      });
    } catch (error) {
      console.error("Error checking group discount:", error);
      res.status(500).json({ error: "Failed to check group discount" });
    }
  });
}
