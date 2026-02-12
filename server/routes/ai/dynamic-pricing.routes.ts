/**
 * Dynamic Pricing Engine API Routes
 *
 * AI-powered pricing considering demand, time of day, season, weather, pro availability.
 *
 * Endpoints:
 * - POST /api/ai/pricing/calculate — AI-optimized price with breakdown
 * - GET  /api/ai/pricing/factors/:zipCode — Current pricing factors for a zip
 */

import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../auth-middleware";
import { createChatCompletion } from "../../services/ai/anthropic-client";
import type { DatabaseStorage } from "../../storage/impl/database-storage";

const calculateSchema = z.object({
  serviceType: z.string().min(1),
  zipCode: z.string().regex(/^\d{5}$/, "Must be a 5-digit zip code"),
  scheduledDate: z.string(),
  loadEstimate: z.string().min(1),
  urgency: z.enum(["standard", "priority", "emergency"]).optional().default("standard"),
});

function getFallbackPricing(serviceType: string, urgency: string) {
  const basePrices: Record<string, number> = {
    "junk-removal": 149,
    "moving": 299,
    "cleaning": 129,
    "landscaping": 179,
    "handyman": 99,
  };
  const base = basePrices[serviceType.toLowerCase()] ?? 149;
  const surgeFactor = urgency === "emergency" ? 1.5 : urgency === "priority" ? 1.25 : 1.0;
  const finalPrice = Math.round(base * surgeFactor * 100) / 100;
  return {
    basePrice: base,
    surgeFactor,
    seasonalAdjustment: 1.0,
    demandMultiplier: 1.0,
    weatherImpact: 0,
    finalPrice,
    savingsVsStandard: 0,
    currency: "USD",
    confidence: "fallback" as const,
    breakdown: {
      base,
      surgeAmount: Math.round((finalPrice - base) * 100) / 100,
      seasonalAmount: 0,
      demandAmount: 0,
      weatherAmount: 0,
    },
  };
}

export function createDynamicPricingRoutes(storage: DatabaseStorage) {
  const router = Router();

  // POST /pricing/calculate
  router.post("/pricing/calculate", requireAuth, async (req, res) => {
    try {
      const validated = calculateSchema.parse(req.body);
      const userId = (req.user as any).userId || (req.user as any).id;

      const now = new Date();
      const scheduled = new Date(validated.scheduledDate);
      const month = scheduled.getMonth();
      const hour = scheduled.getHours();
      const dayOfWeek = scheduled.getDay();

      const systemPrompt = `You are a pricing engine for UpTend, a home services marketplace. 
Return ONLY valid JSON (no markdown, no code fences). Analyze the request and return dynamic pricing.

Consider:
- Service type and typical market rates
- Time of day (early morning/evening premium)
- Day of week (weekend premium)  
- Season (summer peak for outdoor, winter for indoor)
- Urgency level
- Load estimate size

Return this exact JSON structure:
{
  "basePrice": <number>,
  "surgeFactor": <number 0.8-2.0>,
  "seasonalAdjustment": <number 0.9-1.3>,
  "demandMultiplier": <number 0.85-1.5>,
  "weatherImpact": <number -20 to +30>,
  "finalPrice": <number>,
  "savingsVsStandard": <number>,
  "currency": "USD",
  "confidence": "high"|"medium"|"low",
  "reasoning": "<brief explanation>",
  "breakdown": {
    "base": <number>,
    "surgeAmount": <number>,
    "seasonalAmount": <number>,
    "demandAmount": <number>,
    "weatherAmount": <number>
  }
}`;

      const userMessage = `Calculate pricing for:
- Service: ${validated.serviceType}
- Zip Code: ${validated.zipCode}
- Scheduled: ${validated.scheduledDate} (month=${month}, hour=${hour}, dayOfWeek=${dayOfWeek})
- Load Estimate: ${validated.loadEstimate}
- Urgency: ${validated.urgency}
- Current time: ${now.toISOString()}`;

      try {
        const aiResponse = await createChatCompletion({
          messages: [{ role: "user", content: userMessage }],
          systemPrompt,
          maxTokens: 1024,
        });

        const parsed = JSON.parse(aiResponse);
        return res.json({
          success: true,
          pricing: parsed,
          requestId: `price-${Date.now()}`,
          generatedAt: now.toISOString(),
        });
      } catch (aiErr) {
        console.warn("AI pricing unavailable, using fallback:", (aiErr as Error).message);
        const fallback = getFallbackPricing(validated.serviceType, validated.urgency);
        return res.json({
          success: true,
          pricing: fallback,
          requestId: `price-${Date.now()}`,
          generatedAt: now.toISOString(),
          note: "Pricing calculated using standard rates",
        });
      }
    } catch (err: any) {
      if (err.name === "ZodError") {
        return res.status(400).json({ error: "Validation error", details: err.errors });
      }
      console.error("Pricing calculate error:", err);
      return res.status(500).json({ error: "Failed to calculate pricing" });
    }
  });

  // GET /pricing/factors/:zipCode
  router.get("/pricing/factors/:zipCode", requireAuth, async (req, res) => {
    try {
      const zipCode = req.params.zipCode;
      if (!/^\d{5}$/.test(zipCode)) {
        return res.status(400).json({ error: "Invalid zip code format" });
      }

      const now = new Date();
      const systemPrompt = `You are a market analysis engine for UpTend home services marketplace.
Return ONLY valid JSON (no markdown, no code fences).

Return this exact JSON structure:
{
  "zipCode": "<zip>",
  "demandLevel": "low"|"medium"|"high"|"very_high",
  "proAvailability": "scarce"|"limited"|"moderate"|"abundant",
  "weatherImpact": { "condition": "<description>", "priceEffect": <number -10 to +15>, "advisory": "<text>" },
  "peakHours": [<array of peak hour numbers>],
  "seasonalTrend": "<description>",
  "averageWaitDays": <number>,
  "topServices": [<top 3 services in demand>]
}`;

      try {
        const aiResponse = await createChatCompletion({
          messages: [{ role: "user", content: `Analyze current pricing factors for zip code ${zipCode}. Current date/time: ${now.toISOString()}` }],
          systemPrompt,
          maxTokens: 512,
        });

        const parsed = JSON.parse(aiResponse);
        return res.json({ success: true, factors: parsed, generatedAt: now.toISOString() });
      } catch {
        return res.json({
          success: true,
          factors: {
            zipCode,
            demandLevel: "medium",
            proAvailability: "moderate",
            weatherImpact: { condition: "Normal", priceEffect: 0, advisory: "No weather impact" },
            peakHours: [9, 10, 11, 14, 15],
            seasonalTrend: "Standard demand",
            averageWaitDays: 3,
            topServices: ["junk-removal", "moving", "cleaning"],
          },
          generatedAt: now.toISOString(),
          note: "Using standard market estimates",
        });
      }
    } catch (err) {
      console.error("Pricing factors error:", err);
      return res.status(500).json({ error: "Failed to retrieve pricing factors" });
    }
  });

  return router;
}

export default createDynamicPricingRoutes;
