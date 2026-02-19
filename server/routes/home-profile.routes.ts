/**
 * Home CRM / Home Profile Routes
 *
 * Endpoints:
 * - CRUD /api/home/profiles        — home profiles
 * - CRUD /api/home/service-history  — service history records
 * - CRUD /api/home/appliances       — home appliances
 * - GET  /api/home/dashboard        — aggregated home dashboard
 */

import { Router, type Express } from "express";
import { z } from "zod";
import { db } from "../db";
import { homeProfiles, homeServiceHistory, homeAppliances } from "../../shared/schema";
import { eq, desc, and, lte, gte, sql } from "drizzle-orm";
import { requireAuth } from "../auth-middleware";

export function registerHomeProfileRoutes(app: Express) {
  const router = Router();

  // ==========================================
  // HOME PROFILES CRUD
  // ==========================================
  const profileSchema = z.object({
    address: z.string().min(5),
    city: z.string().min(2),
    state: z.string().min(2),
    zip: z.string().min(5),
    homeType: z.enum(["single_family", "condo", "townhouse", "apartment", "duplex", "other"]).default("single_family"),
    squareFootage: z.number().positive().optional(),
    yearBuilt: z.number().min(1800).max(2030).optional(),
    bedrooms: z.number().min(0).max(20).optional(),
    bathrooms: z.number().min(0).max(20).optional(),
    lotSize: z.string().optional(),
    photoUrl: z.string().url().optional(),
  });

  router.get("/profiles", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      const profiles = await db.select().from(homeProfiles)
        .where(eq(homeProfiles.customerId, userId))
        .orderBy(desc(homeProfiles.createdAt));
      res.json({ success: true, profiles });
    } catch (error: any) {
      console.error("Home profiles fetch error:", error);
      res.status(500).json({ error: "Failed to fetch profiles" });
    }
  });

  router.get("/profiles/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      const [profile] = await db.select().from(homeProfiles)
        .where(and(eq(homeProfiles.id, req.params.id), eq(homeProfiles.customerId, userId)))
        .limit(1);
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      res.json({ success: true, profile });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  router.post("/profiles", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      const validated = profileSchema.parse(req.body);
      const [profile] = await db.insert(homeProfiles).values({
        customerId: userId,
        ...validated,
        squareFootage: validated.squareFootage?.toString() || null,
        yearBuilt: validated.yearBuilt?.toString() || null,
        bedrooms: validated.bedrooms?.toString() || null,
        bathrooms: validated.bathrooms?.toString() || null,
        createdAt: new Date().toISOString(),
      }).returning();
      res.status(201).json({ success: true, profile });
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: error.errors });
      console.error("Home profile create error:", error);
      res.status(500).json({ error: "Failed to create profile" });
    }
  });

  router.put("/profiles/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      const validated = profileSchema.partial().parse(req.body);
      const [updated] = await db.update(homeProfiles)
        .set({
          ...validated,
          squareFootage: validated.squareFootage?.toString(),
          yearBuilt: validated.yearBuilt?.toString(),
          bedrooms: validated.bedrooms?.toString(),
          bathrooms: validated.bathrooms?.toString(),
        })
        .where(and(eq(homeProfiles.id, req.params.id), eq(homeProfiles.customerId, userId)))
        .returning();
      if (!updated) return res.status(404).json({ error: "Profile not found" });
      res.json({ success: true, profile: updated });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  router.delete("/profiles/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      const [deleted] = await db.delete(homeProfiles)
        .where(and(eq(homeProfiles.id, req.params.id), eq(homeProfiles.customerId, userId)))
        .returning();
      if (!deleted) return res.status(404).json({ error: "Profile not found" });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete profile" });
    }
  });

  // ==========================================
  // SERVICE HISTORY CRUD
  // ==========================================
  const serviceHistorySchema = z.object({
    homeProfileId: z.string(),
    serviceType: z.string().min(1),
    provider: z.string().optional(),
    date: z.string(),
    cost: z.number().positive().optional(),
    notes: z.string().optional(),
    receiptUrl: z.string().url().optional(),
    warrantyExpiry: z.string().optional(),
  });

  router.get("/service-history/:homeProfileId", requireAuth, async (req, res) => {
    try {
      const records = await db.select().from(homeServiceHistory)
        .where(eq(homeServiceHistory.homeProfileId, req.params.homeProfileId))
        .orderBy(desc(homeServiceHistory.date));
      res.json({ success: true, history: records });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch service history" });
    }
  });

  router.post("/service-history", requireAuth, async (req, res) => {
    try {
      const validated = serviceHistorySchema.parse(req.body);
      const [record] = await db.insert(homeServiceHistory).values({
        ...validated,
        cost: validated.cost?.toString() || null,
        createdAt: new Date().toISOString(),
      }).returning();
      res.status(201).json({ success: true, record });
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: error.errors });
      res.status(500).json({ error: "Failed to create service history record" });
    }
  });

  router.put("/service-history/:id", requireAuth, async (req, res) => {
    try {
      const validated = serviceHistorySchema.partial().parse(req.body);
      const [updated] = await db.update(homeServiceHistory)
        .set({ ...validated, cost: validated.cost?.toString() })
        .where(eq(homeServiceHistory.id, req.params.id))
        .returning();
      if (!updated) return res.status(404).json({ error: "Record not found" });
      res.json({ success: true, record: updated });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update record" });
    }
  });

  router.delete("/service-history/:id", requireAuth, async (req, res) => {
    try {
      const [deleted] = await db.delete(homeServiceHistory)
        .where(eq(homeServiceHistory.id, req.params.id))
        .returning();
      if (!deleted) return res.status(404).json({ error: "Record not found" });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete record" });
    }
  });

  // ==========================================
  // APPLIANCES CRUD
  // ==========================================
  const applianceSchema = z.object({
    homeProfileId: z.string(),
    name: z.string().min(1),
    brand: z.string().optional(),
    model: z.string().optional(),
    purchaseDate: z.string().optional(),
    warrantyExpiry: z.string().optional(),
    lastServiceDate: z.string().optional(),
    notes: z.string().optional(),
  });

  router.get("/appliances/:homeProfileId", requireAuth, async (req, res) => {
    try {
      const appliances = await db.select().from(homeAppliances)
        .where(eq(homeAppliances.homeProfileId, req.params.homeProfileId))
        .orderBy(homeAppliances.name);
      res.json({ success: true, appliances });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch appliances" });
    }
  });

  router.post("/appliances", requireAuth, async (req, res) => {
    try {
      const validated = applianceSchema.parse(req.body);
      const [appliance] = await db.insert(homeAppliances).values({
        ...validated,
        createdAt: new Date().toISOString(),
      }).returning();
      res.status(201).json({ success: true, appliance });
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: error.errors });
      res.status(500).json({ error: "Failed to create appliance" });
    }
  });

  router.put("/appliances/:id", requireAuth, async (req, res) => {
    try {
      const validated = applianceSchema.partial().parse(req.body);
      const [updated] = await db.update(homeAppliances)
        .set(validated)
        .where(eq(homeAppliances.id, req.params.id))
        .returning();
      if (!updated) return res.status(404).json({ error: "Appliance not found" });
      res.json({ success: true, appliance: updated });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update appliance" });
    }
  });

  router.delete("/appliances/:id", requireAuth, async (req, res) => {
    try {
      const [deleted] = await db.delete(homeAppliances)
        .where(eq(homeAppliances.id, req.params.id))
        .returning();
      if (!deleted) return res.status(404).json({ error: "Appliance not found" });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete appliance" });
    }
  });

  // ==========================================
  // GET /api/home/dashboard
  // Aggregated home dashboard view
  // ==========================================
  router.get("/dashboard", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;

      // Get all home profiles
      const profiles = await db.select().from(homeProfiles)
        .where(eq(homeProfiles.customerId, userId));

      if (profiles.length === 0) {
        return res.json({
          success: true,
          profiles: [],
          upcomingMaintenance: [],
          expiringWarranties: [],
          recentServices: [],
          stats: { totalHomes: 0, totalServices: 0, totalAppliances: 0 },
        });
      }

      const profileIds = profiles.map((p) => p.id);

      // Get all service history and appliances for user's homes
      const allHistory: any[] = [];
      const allAppliances: any[] = [];
      for (const pid of profileIds) {
        const h = await db.select().from(homeServiceHistory).where(eq(homeServiceHistory.homeProfileId, pid));
        const a = await db.select().from(homeAppliances).where(eq(homeAppliances.homeProfileId, pid));
        allHistory.push(...h);
        allAppliances.push(...a);
      }

      // Recent services (last 10)
      const recentServices = allHistory
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
        .slice(0, 10);

      // Expiring warranties (next 90 days)
      const now = new Date();
      const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      const nowStr = now.toISOString().split("T")[0];
      const futureStr = ninetyDays.toISOString().split("T")[0];

      const expiringWarranties = allAppliances
        .filter((a) => a.warrantyExpiry && a.warrantyExpiry >= nowStr && a.warrantyExpiry <= futureStr)
        .sort((a, b) => (a.warrantyExpiry || "").localeCompare(b.warrantyExpiry || ""));

      // Also check service history warranties
      const expiringServiceWarranties = allHistory
        .filter((h) => h.warrantyExpiry && h.warrantyExpiry >= nowStr && h.warrantyExpiry <= futureStr);

      res.json({
        success: true,
        profiles,
        recentServices,
        expiringWarranties: [
          ...expiringWarranties.map((a) => ({ type: "appliance", name: a.name, brand: a.brand, expires: a.warrantyExpiry })),
          ...expiringServiceWarranties.map((s) => ({ type: "service", name: s.serviceType, provider: s.provider, expires: s.warrantyExpiry })),
        ],
        stats: {
          totalHomes: profiles.length,
          totalServices: allHistory.length,
          totalAppliances: allAppliances.length,
        },
      });
    } catch (error: any) {
      console.error("Home dashboard error:", error);
      res.status(500).json({ error: "Failed to load dashboard" });
    }
  });

  // GET /api/home-profile/:userId — return user's home profiles (alt path for tests)
  app.get("/api/home-profile/:userId", requireAuth, async (req, res) => {
    try {
      const profiles = await db.select().from(homeProfiles)
        .where(eq(homeProfiles.customerId, req.params.userId))
        .orderBy(desc(homeProfiles.createdAt));
      res.json({ success: true, profiles });
    } catch (error: any) {
      console.error("Home profile fetch error:", error);
      res.status(500).json({ error: "Failed to fetch home profiles" });
    }
  });

  app.use("/api/home", router);
}
