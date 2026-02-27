/**
 * AI Seasonal Home Advisor API Routes
 */

import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../auth-middleware";
import type { DatabaseStorage } from "../../storage/impl/database-storage";
import { nanoid } from "nanoid";
import { createChatCompletion } from "../../services/ai/anthropic-client";
import { db } from "../../db";
import { sql } from "drizzle-orm";

export function createSeasonalAdvisorRoutes(storage: DatabaseStorage) {
  const router = Router();

  // GET /api/ai/seasonal/advisories - Get seasonal advisories for user
  router.get("/seasonal/advisories", requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const now = new Date().toISOString();

      const result = await db.execute(sql`
        SELECT * FROM seasonal_advisories 
        WHERE (user_id = ${userId} OR zip_code IS NOT NULL)
          AND status = 'active'
          AND (expires_at IS NULL OR expires_at >= ${now})
        ORDER BY created_at DESC LIMIT 20
      `);

      res.json({
        success: true,
        advisories: result.rows.map((a: any) => ({
          ...a,
          recommendedServices: a.recommended_services,
        })),
      });
    } catch (error: any) {
      console.error("Error fetching seasonal advisories:", error);
      res.status(500).json({ error: error.message || "Failed to fetch seasonal advisories" });
    }
  });

  // GET /api/ai/seasonal/advisories/:zipCode - Get advisories by zip code
  router.get("/seasonal/advisories/:zipCode", async (req, res) => {
    try {
      const { zipCode } = req.params;
      if (!/^\d{5}$/.test(zipCode)) {
        return res.status(400).json({ error: "Invalid zip code format" });
      }

      const now = new Date().toISOString();
      const result = await db.execute(sql`
        SELECT * FROM seasonal_advisories 
        WHERE zip_code = ${zipCode} AND status = 'active'
          AND (expires_at IS NULL OR expires_at >= ${now})
        ORDER BY created_at DESC LIMIT 20
      `);

      res.json({ success: true, zipCode, advisories: result.rows });
    } catch (error: any) {
      console.error("Error fetching seasonal advisories:", error);
      res.status(500).json({ error: error.message || "Failed to fetch seasonal advisories" });
    }
  });

  // POST /api/ai/seasonal/generate - Generate seasonal advisories for a zip code
  const generateSchema = z.object({
    zipCode: z.string().regex(/^\d{5}$/),
    season: z.enum(["spring", "summer", "fall", "winter"]),
    propertyId: z.string().optional(),
    force: z.boolean().default(false),
  });

  router.post("/seasonal/generate", requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const validated = generateSchema.parse(req.body);

      // Call AI to generate seasonal advisories
      const aiResponse = await createChatCompletion({
        systemPrompt: `You are a home maintenance expert for UpTend. Generate seasonal advisories as JSON. Return an array of 2-4 objects. Each must have: triggerType (seasonal_reminder|weather_alert|preventive_maintenance|cost_saving), title (string), message (string 1-2 sentences), urgency (high|medium|low), category (string like "exterior", "plumbing", "hvac", "landscaping"), recommendedServices (array of service slug objects like [{service: "gutter_cleaning", reason: "..."}]), estimatedSavings (number, dollars saved if acted on). Return ONLY valid JSON array.`,
        messages: [{
          role: "user",
          content: `Generate seasonal home maintenance advisories for zip code ${validated.zipCode} during ${validated.season}. Consider typical weather and maintenance needs.`,
        }],
        maxTokens: 1024,
        temperature: 0.7,
      });

      let advisoryData: any[];
      try {
        advisoryData = JSON.parse(aiResponse.content);
        if (!Array.isArray(advisoryData)) advisoryData = [advisoryData];
      } catch {
        advisoryData = [{
          triggerType: "seasonal_reminder",
          title: `${validated.season.charAt(0).toUpperCase() + validated.season.slice(1)} Maintenance`,
          message: aiResponse.content.substring(0, 200),
          urgency: "medium",
          category: "general",
          recommendedServices: [],
          estimatedSavings: 0,
        }];
      }

      const created = [];
      for (const adv of advisoryData) {
        const id = nanoid();
        const now = new Date().toISOString();
        const expiresAt = new Date(Date.now() + 90 * 86400000).toISOString();
        const propertyId = validated.propertyId || "system";

        await db.execute(sql`INSERT INTO seasonal_advisories 
          (id, property_id, user_id, trigger_type, trigger_data, title, message, urgency, category, recommended_services, estimated_savings, status, created_at, expires_at, zip_code)
          VALUES (${id}, ${propertyId}, ${userId}, ${adv.triggerType || "seasonal_reminder"}, ${JSON.stringify({ season: validated.season, zipCode: validated.zipCode })}, ${adv.title || "Seasonal Advisory"}, ${adv.message || ""}, ${adv.urgency || "medium"}, ${adv.category || "general"}, ${JSON.stringify(adv.recommendedServices || [])}, ${adv.estimatedSavings || 0}, 'active', ${now}, ${expiresAt}, ${validated.zipCode})`);

        created.push({ id, title: adv.title, message: adv.message, urgency: adv.urgency, category: adv.category });
      }

      res.json({
        success: true,
        message: `Generated ${created.length} seasonal advisories for ${validated.zipCode}`,
        advisories: created,
      });
    } catch (error: any) {
      console.error("Error generating seasonal advisories:", error);
      res.status(400).json({ error: error.message || "Failed to generate seasonal advisories" });
    }
  });

  return router;
}

export default createSeasonalAdvisorRoutes;
