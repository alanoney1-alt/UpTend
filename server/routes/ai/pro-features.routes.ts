/**
 * AI Pro Features API Routes
 * Route Optimizer, Quality Scoring, Inventory Estimator, Fraud Detection
 */

import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../auth-middleware";
import type { DatabaseStorage } from "../../storage/impl/database-storage";
import { nanoid } from "nanoid";
import { optimizeRoute } from "../../services/ai/route-optimization-service";
import { createChatCompletion, analyzeImage } from "../../services/ai/anthropic-client";
import { db } from "../../db";
import { sql } from "drizzle-orm";

export function createProFeaturesRoutes(storage: DatabaseStorage) {
  const router = Router();

  // ==========================================
  // ROUTE OPTIMIZER (in-memory, no DB table)
  // ==========================================

  const optimizeRouteSchema = z.object({
    date: z.string(),
    jobs: z.array(z.object({
      jobId: z.string(),
      address: z.string(),
      lat: z.number(),
      lng: z.number(),
      estimatedDuration: z.number().default(60),
    })).min(2),
    startLocation: z.object({ lat: z.number(), lng: z.number() }).optional(),
  });

  router.post("/pro/route/optimize", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "hauler") {
        return res.status(403).json({ error: "Pro access required" });
      }
      const validated = optimizeRouteSchema.parse(req.body);
      const startLoc = validated.startLocation || { lat: validated.jobs[0].lat, lng: validated.jobs[0].lng };

      const result = await optimizeRoute({
        jobs: validated.jobs,
        startLocation: startLoc,
      });

      res.json({
        success: true,
        optimization: {
          date: validated.date,
          optimizedRoute: result.optimizedRoute,
          totalDistance: result.totalDistance,
          totalTime: result.totalTime,
          savings: result.savings,
          routeSteps: result.routeSteps,
          algorithm: "tsp_nearest_neighbor",
        },
      });
    } catch (error: any) {
      console.error("Error optimizing route:", error);
      res.status(400).json({ error: error.message || "Failed to optimize route" });
    }
  });

  // ==========================================
  // QUALITY SCORING
  // ==========================================

  router.get("/pro/quality/score", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "hauler") {
        return res.status(403).json({ error: "Pro access required" });
      }
      const proId = ((req.user as any).userId || (req.user as any).id);

      const result = await db.execute(sql`
        SELECT * FROM pro_quality_scores WHERE hauler_id = ${proId} ORDER BY created_at DESC LIMIT 1
      `);

      if (result.rows.length === 0) {
        return res.json({ success: true, score: null, message: "No quality score available yet. Complete more jobs to get scored!" });
      }

      res.json({ success: true, score: result.rows[0] });
    } catch (error: any) {
      console.error("Error fetching quality score:", error);
      res.status(500).json({ error: error.message || "Failed to fetch quality score" });
    }
  });

  router.get("/pro/quality/history", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "hauler") {
        return res.status(403).json({ error: "Pro access required" });
      }
      const proId = ((req.user as any).userId || (req.user as any).id);
      const limit = parseInt((req.query.limit as string) || "12");

      const result = await db.execute(sql`
        SELECT * FROM pro_quality_scores WHERE hauler_id = ${proId} ORDER BY created_at DESC LIMIT ${limit}
      `);

      res.json({ success: true, history: result.rows });
    } catch (error: any) {
      console.error("Error fetching quality history:", error);
      res.status(500).json({ error: error.message || "Failed to fetch quality history" });
    }
  });

  router.get("/pro/quality/assessment/:serviceRequestId", requireAuth, async (req, res) => {
    try {
      const { serviceRequestId } = req.params;
      const result = await db.execute(sql`
        SELECT * FROM job_quality_assessments WHERE service_request_id = ${serviceRequestId} LIMIT 1
      `);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Assessment not found" });
      }

      const assessment = result.rows[0] as any;
      const userId = ((req.user as any).userId || (req.user as any).id);
      if (assessment.hauler_id !== userId && req.user!.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json({ success: true, assessment });
    } catch (error: any) {
      console.error("Error fetching assessment:", error);
      res.status(500).json({ error: error.message || "Failed to fetch assessment" });
    }
  });

  // ==========================================
  // INVENTORY ESTIMATOR
  // ==========================================

  const inventoryEstimateSchema = z.object({
    propertyType: z.string(),
    rooms: z.record(z.array(z.string())).optional(),
    bedrooms: z.number().optional(),
    sqft: z.number().optional(),
    photoUrl: z.string().url().optional(),
  });

  router.post("/pro/inventory/estimate", requireAuth, async (req, res) => {
    try {
      const validated = inventoryEstimateSchema.parse(req.body);
      const userId = ((req.user as any).userId || (req.user as any).id);

      // Use AI vision if photo provided, otherwise text-based
      let aiEstimate: any;

      if (validated.photoUrl) {
        try {
          aiEstimate = await analyzeImage({
            imageUrl: validated.photoUrl,
            prompt: `Analyze for junk removal / moving estimate. Return JSON: {rooms: {roomName: [items]}, totalItems: number, cubicFeet: number, weightLbs: number, truckSize: "small"|"medium"|"large", laborHours: number, estimatedCost: number, donateableItems: [items], confidence: 0-1}. Return ONLY JSON.`,
          });
        } catch (e) {
          console.warn("Vision failed, using text estimation", e);
        }
      }

      if (!aiEstimate || !aiEstimate.rooms) {
        const aiResponse = await createChatCompletion({
          systemPrompt: "You estimate junk removal / moving inventory. Return ONLY JSON: {rooms: {roomName: [items]}, totalItems: number, cubicFeet: number, weightLbs: number, truckSize: small|medium|large, laborHours: number, estimatedCost: number, priceLow: number, priceHigh: number, donateableItems: [items], confidence: 0-1}.",
          messages: [{
            role: "user",
            content: `Estimate inventory: property=${validated.propertyType}, bedrooms=${validated.bedrooms || "unknown"}, sqft=${validated.sqft || "unknown"}. ${validated.rooms ? "Rooms: " + JSON.stringify(validated.rooms) : ""}`,
          }],
          maxTokens: 512,
        });
        try {
          aiEstimate = JSON.parse(aiResponse.content);
        } catch {
          aiEstimate = { rooms: { "main": ["misc items"] }, totalItems: 20, cubicFeet: 300, weightLbs: 400, truckSize: "medium", laborHours: 3, estimatedCost: 250, priceLow: 200, priceHigh: 350, donateableItems: [], confidence: 0.6 };
        }
      }

      const id = nanoid();
      const now = new Date().toISOString();
      await db.execute(sql`INSERT INTO inventory_estimates 
        (id, user_id, property_type, room_inventory, total_items, estimated_cubic_feet, estimated_weight_lbs, truck_size_needed, labor_hours_estimated, estimated_cost, confidence_score, donateable_items, estimated_price_low, estimated_price_high, created_at, updated_at)
        VALUES (${id}, ${userId}, ${validated.propertyType}, ${JSON.stringify(aiEstimate.rooms || {})}, ${aiEstimate.totalItems || 20}, ${aiEstimate.cubicFeet || 300}, ${aiEstimate.weightLbs || 400}, ${aiEstimate.truckSize || "medium"}, ${aiEstimate.laborHours || 3}, ${aiEstimate.estimatedCost || 250}, ${aiEstimate.confidence || 0.7}, ${JSON.stringify(aiEstimate.donateableItems || [])}, ${aiEstimate.priceLow || aiEstimate.estimatedCost * 0.8 || 200}, ${aiEstimate.priceHigh || aiEstimate.estimatedCost * 1.3 || 350}, ${now}, ${now})`);

      res.json({
        success: true,
        estimate: {
          id,
          propertyType: validated.propertyType,
          roomInventory: aiEstimate.rooms,
          totalItems: aiEstimate.totalItems,
          estimatedCubicFeet: aiEstimate.cubicFeet,
          estimatedWeightLbs: aiEstimate.weightLbs,
          truckSizeNeeded: aiEstimate.truckSize,
          laborHoursEstimated: aiEstimate.laborHours,
          estimatedCost: aiEstimate.estimatedCost,
          confidenceScore: aiEstimate.confidence,
          donateableItems: aiEstimate.donateableItems,
          estimatedPriceLow: aiEstimate.priceLow,
          estimatedPriceHigh: aiEstimate.priceHigh,
        },
      });
    } catch (error: any) {
      console.error("Error creating inventory estimate:", error);
      res.status(400).json({ error: error.message || "Failed to create inventory estimate" });
    }
  });

  router.get("/pro/inventory/estimate/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const result = await db.execute(sql`SELECT * FROM inventory_estimates WHERE id = ${id} LIMIT 1`);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Estimate not found" });
      }
      res.json({ success: true, estimate: result.rows[0] });
    } catch (error: any) {
      console.error("Error fetching inventory estimate:", error);
      res.status(500).json({ error: error.message || "Failed to fetch inventory estimate" });
    }
  });

  // ==========================================
  // FRAUD DETECTION (Admin Only)
  // ==========================================

  router.get("/admin/fraud/alerts", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const result = await db.execute(sql`SELECT * FROM fraud_alerts WHERE status = 'pending' OR status IS NULL ORDER BY created_at DESC LIMIT 50`);
      res.json({ success: true, alerts: result.rows });
    } catch (error: any) {
      console.error("Error fetching fraud alerts:", error);
      res.status(500).json({ error: error.message || "Failed to fetch fraud alerts" });
    }
  });

  const reviewAlertSchema = z.object({
    resolution: z.string(),
    status: z.enum(["cleared", "confirmed", "investigating"]),
  });

  router.post("/admin/fraud/alerts/:id/review", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const { id } = req.params;
      const validated = reviewAlertSchema.parse(req.body);
      const adminId = ((req.user as any).userId || (req.user as any).id);

      await db.execute(sql`UPDATE fraud_alerts SET status = ${validated.status}, resolution = ${validated.resolution}, reviewed_by = ${adminId}, reviewed_at = ${new Date().toISOString()} WHERE id = ${id}`);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error reviewing fraud alert:", error);
      res.status(400).json({ error: error.message || "Failed to review fraud alert" });
    }
  });

  return router;
}

export default createProFeaturesRoutes;
