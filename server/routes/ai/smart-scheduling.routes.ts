/**
 * AI Smart Scheduling API Routes
 */

import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../auth-middleware";
import type { DatabaseStorage } from "../../storage/impl/database-storage";
import { createChatCompletion } from "../../services/ai/anthropic-client";
import { db } from "../../db";
import { smartScheduleSuggestions } from "../../../shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

export function createSmartSchedulingRoutes(storage: DatabaseStorage) {
  const router = Router();

  // POST /api/ai/schedule/suggest
  const suggestSchema = z.object({
    serviceType: z.string(),
    address: z.string(),
    propertyId: z.string().optional(),
    flexibility: z.enum(["flexible", "moderate", "specific"]).default("moderate"),
    preferredTimeOfDay: z.enum(["morning", "afternoon", "evening", "any"]).optional(),
  });

  router.post("/schedule/suggest", requireAuth, async (req, res) => {
    try {
      const validated = suggestSchema.parse(req.body);
      const userId = ((req.user as any).userId || (req.user as any).id);

      const today = new Date().toISOString().split("T")[0];
      const aiResponse = await createChatCompletion({
        systemPrompt: `You are a smart scheduling AI for UpTend home services. Suggest 2-3 optimal time slots. Return ONLY a valid JSON array of objects with: suggestedDate (YYYY-MM-DD within next 14 days from ${today}), suggestedTimeSlot (morning|afternoon|evening), reasoning (string), confidenceScore (0-1), factorsConsidered (object with proAvailability number, weatherScore 0-1, demandLevel low|medium|high, priceOptimization 0-1), availablePros (number 1-15), estimatedPrice (number USD), weatherOptimal (boolean).`,
        messages: [{
          role: "user",
          content: `Suggest optimal scheduling for "${validated.serviceType}" at "${validated.address}". Flexibility: ${validated.flexibility}. Preferred time: ${validated.preferredTimeOfDay || "any"}.`,
        }],
        maxTokens: 1024,
        temperature: 0.7,
      });

      let suggestions: any[];
      try {
        suggestions = JSON.parse(aiResponse.content);
        if (!Array.isArray(suggestions)) suggestions = [suggestions];
      } catch {
        suggestions = [{
          suggestedDate: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
          suggestedTimeSlot: validated.preferredTimeOfDay || "morning",
          reasoning: aiResponse.content.substring(0, 200),
          confidenceScore: 0.8,
          factorsConsidered: { proAvailability: 5, weatherScore: 0.8, demandLevel: "medium", priceOptimization: 0.75 },
          availablePros: 5,
          estimatedPrice: 200,
          weatherOptimal: true,
        }];
      }

      // Insert directly using raw SQL to match actual DB columns
      const created = [];
      for (const sug of suggestions) {
        const id = nanoid();
        const now = new Date().toISOString();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await db.execute(sql`INSERT INTO smart_schedule_suggestions 
          (id, user_id, service_type, suggested_date, suggested_time_slot, reasoning, confidence_score, factors_considered, available_pros, estimated_price, weather_optimal, accepted, created_at, expires_at, scheduling_reason)
          VALUES (${id}, ${userId}, ${validated.serviceType}, ${sug.suggestedDate}, ${sug.suggestedTimeSlot || "morning"}, ${sug.reasoning || "AI suggestion"}, ${sug.confidenceScore || 0.8}, ${JSON.stringify(sug.factorsConsidered || {})}, ${sug.availablePros || 5}, ${sug.estimatedPrice || 200}, ${sug.weatherOptimal ?? true}, false, ${now}, ${expiresAt}, ${sug.reasoning || "AI-optimized scheduling"})`);
        created.push({
          id,
          userId,
          serviceType: validated.serviceType,
          suggestedDate: sug.suggestedDate,
          suggestedTimeSlot: sug.suggestedTimeSlot,
          reasoning: sug.reasoning,
          confidenceScore: sug.confidenceScore,
          factorsConsidered: sug.factorsConsidered,
          availablePros: sug.availablePros,
          estimatedPrice: sug.estimatedPrice,
          weatherOptimal: sug.weatherOptimal,
          accepted: false,
          createdAt: now,
          expiresAt,
        });
      }

      res.json({
        success: true,
        suggestions: created,
      });
    } catch (error: any) {
      console.error("Error creating schedule suggestions:", error);
      res.status(400).json({
        error: error.message || "Failed to create schedule suggestions",
      });
    }
  });

  // GET /api/ai/schedule/suggestions
  router.get("/schedule/suggestions", requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const now = new Date().toISOString();
      const rows = await db.execute(sql`SELECT * FROM smart_schedule_suggestions WHERE user_id = ${userId} AND accepted = false AND expires_at >= ${now} ORDER BY confidence_score DESC`);

      const suggestions = rows.rows.map((s: any) => ({
        ...s,
        factorsConsidered: typeof s.factors_considered === "string" ? (() => { try { return JSON.parse(s.factors_considered); } catch { return s.factors_considered; } })() : s.factors_considered,
      }));

      res.json({ success: true, suggestions });
    } catch (error: any) {
      console.error("Error fetching schedule suggestions:", error);
      res.status(500).json({ error: error.message || "Failed to fetch schedule suggestions" });
    }
  });

  // POST /api/ai/schedule/suggestions/:id/accept
  router.post("/schedule/suggestions/:id/accept", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await db.execute(sql`UPDATE smart_schedule_suggestions SET accepted = true, accepted_at = ${new Date().toISOString()} WHERE id = ${id}`);
      res.json({ success: true, message: "Suggestion accepted" });
    } catch (error: any) {
      console.error("Error accepting suggestion:", error);
      res.status(400).json({ error: error.message || "Failed to accept suggestion" });
    }
  });

  // POST /api/ai/schedule/suggestions/:id/reject
  router.post("/schedule/suggestions/:id/reject", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await db.execute(sql`UPDATE smart_schedule_suggestions SET expires_at = ${new Date().toISOString()} WHERE id = ${id}`);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error rejecting suggestion:", error);
      res.status(400).json({ error: error.message || "Failed to reject suggestion" });
    }
  });

  return router;
}

export default createSmartSchedulingRoutes;
