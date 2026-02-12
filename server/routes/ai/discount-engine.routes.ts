/**
 * Multi-Service Discount Engine API Routes
 *
 * AI-powered service bundle suggestions and smart discount calculations.
 *
 * Endpoints:
 * - POST /api/ai/bundles/suggest — Suggest complementary service bundles
 * - POST /api/ai/bundles/calculate — Calculate bundle pricing
 * - GET  /api/ai/bundles/popular — Popular bundles
 */

import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../auth-middleware";
import { createChatCompletion } from "../../services/ai/anthropic-client";
import type { DatabaseStorage } from "../../storage/impl/database-storage";

const suggestSchema = z.object({
  serviceType: z.string().min(1),
  propertyData: z.object({
    type: z.string().optional(),
    size: z.string().optional(),
    bedrooms: z.number().optional(),
    hasYard: z.boolean().optional(),
  }).optional(),
  previousServices: z.array(z.string()).optional(),
});

const calculateSchema = z.object({
  services: z.array(z.string().min(1)).min(2, "At least 2 services required for a bundle"),
});

const STANDARD_PRICES: Record<string, number> = {
  "junk-removal": 149,
  "moving": 299,
  "cleaning": 129,
  "landscaping": 179,
  "handyman": 99,
  "painting": 249,
  "pressure-washing": 119,
  "appliance-removal": 89,
  "garage-cleanout": 199,
  "estate-cleanout": 399,
};

const POPULAR_BUNDLES = [
  {
    id: "move-ready",
    name: "Move-Ready Bundle",
    services: ["moving", "cleaning", "junk-removal"],
    discountPercent: 15,
    description: "Everything you need for a smooth move",
  },
  {
    id: "curb-appeal",
    name: "Curb Appeal Bundle",
    services: ["landscaping", "pressure-washing", "painting"],
    discountPercent: 12,
    description: "Transform your home's exterior",
  },
  {
    id: "fresh-start",
    name: "Fresh Start Bundle",
    services: ["junk-removal", "cleaning", "handyman"],
    discountPercent: 10,
    description: "Declutter and refresh your space",
  },
  {
    id: "full-cleanout",
    name: "Full Cleanout Bundle",
    services: ["estate-cleanout", "junk-removal", "cleaning"],
    discountPercent: 18,
    description: "Complete property cleanout solution",
  },
];

export function createDiscountEngineRoutes(storage: DatabaseStorage) {
  const router = Router();

  // POST /bundles/suggest
  router.post("/bundles/suggest", requireAuth, async (req, res) => {
    try {
      const validated = suggestSchema.parse(req.body);
      const userId = (req.user as any).userId || (req.user as any).id;

      const systemPrompt = `You are a service bundle recommendation engine for UpTend, a home services marketplace.
Return ONLY valid JSON (no markdown, no code fences).

Available services: junk-removal, moving, cleaning, landscaping, handyman, painting, pressure-washing, appliance-removal, garage-cleanout, estate-cleanout.

Return this exact JSON structure:
{
  "suggestedBundle": {
    "name": "<creative bundle name>",
    "services": ["<service1>", "<service2>", ...],
    "discountPercent": <number 5-20>,
    "totalSavings": <number>,
    "reasoning": "<why these services complement each other>"
  },
  "alternativeBundles": [
    { "name": "<name>", "services": ["..."], "discountPercent": <number>, "reasoning": "<brief>" }
  ]
}`;

      const userMessage = `Suggest service bundles for a customer who needs: ${validated.serviceType}
${validated.propertyData ? `Property: ${JSON.stringify(validated.propertyData)}` : ""}
${validated.previousServices?.length ? `Previous services: ${validated.previousServices.join(", ")}` : ""}`;

      try {
        const aiResponse = await createChatCompletion({
          messages: [{ role: "user", content: userMessage }],
          systemPrompt,
          maxTokens: 1024,
        });

        const parsed = JSON.parse(aiResponse.content);
        return res.json({ success: true, ...parsed, generatedAt: new Date().toISOString() });
      } catch {
        // Fallback: find a matching popular bundle
        const match = POPULAR_BUNDLES.find(b => b.services.includes(validated.serviceType.toLowerCase()));
        const fallback = match || POPULAR_BUNDLES[0];
        const prices = fallback.services.map(s => STANDARD_PRICES[s] ?? 149);
        const total = prices.reduce((a, b) => a + b, 0);
        const savings = Math.round(total * fallback.discountPercent / 100);

        return res.json({
          success: true,
          suggestedBundle: {
            name: fallback.name,
            services: fallback.services,
            discountPercent: fallback.discountPercent,
            totalSavings: savings,
            reasoning: fallback.description,
          },
          alternativeBundles: [],
          generatedAt: new Date().toISOString(),
          note: "Using curated bundle recommendations",
        });
      }
    } catch (err: any) {
      if (err.name === "ZodError") {
        return res.status(400).json({ error: "Validation error", details: err.errors });
      }
      console.error("Bundle suggest error:", err);
      return res.status(500).json({ error: "Failed to suggest bundles" });
    }
  });

  // POST /bundles/calculate
  router.post("/bundles/calculate", requireAuth, async (req, res) => {
    try {
      const validated = calculateSchema.parse(req.body);
      const userId = (req.user as any).userId || (req.user as any).id;

      const individualPrices: Record<string, number> = {};
      for (const svc of validated.services) {
        individualPrices[svc] = STANDARD_PRICES[svc.toLowerCase()] ?? 149;
      }
      const totalIndividual = Object.values(individualPrices).reduce((a, b) => a + b, 0);

      // Discount tiers: 2 services = 8%, 3 = 12%, 4+ = 15%
      const count = validated.services.length;
      const baseDiscount = count >= 4 ? 15 : count >= 3 ? 12 : 8;

      try {
        const systemPrompt = `You are a bundle pricing engine. Return ONLY valid JSON.
Given these services and individual prices, determine an appropriate bundle discount.

Return: { "discountPercent": <number 5-20>, "reasoning": "<brief>" }`;

        const aiResponse = await createChatCompletion({
          messages: [{ role: "user", content: `Services: ${JSON.stringify(individualPrices)}. Total: $${totalIndividual}. Service count: ${count}.` }],
          systemPrompt,
          maxTokens: 256,
        });

        const parsed = JSON.parse(aiResponse.content);
        const discountPct = Math.min(20, Math.max(5, parsed.discountPercent));
        const discountAmount = Math.round(totalIndividual * discountPct / 100);
        const bundlePrice = totalIndividual - discountAmount;

        return res.json({
          success: true,
          bundle: {
            services: validated.services,
            individualPrices,
            totalIndividual,
            discountPercent: discountPct,
            discountAmount,
            bundlePrice,
            reasoning: parsed.reasoning,
          },
          generatedAt: new Date().toISOString(),
        });
      } catch {
        const discountAmount = Math.round(totalIndividual * baseDiscount / 100);
        return res.json({
          success: true,
          bundle: {
            services: validated.services,
            individualPrices,
            totalIndividual,
            discountPercent: baseDiscount,
            discountAmount,
            bundlePrice: totalIndividual - discountAmount,
            reasoning: `Standard ${baseDiscount}% multi-service discount for ${count} services`,
          },
          generatedAt: new Date().toISOString(),
          note: "Using standard discount tiers",
        });
      }
    } catch (err: any) {
      if (err.name === "ZodError") {
        return res.status(400).json({ error: "Validation error", details: err.errors });
      }
      console.error("Bundle calculate error:", err);
      return res.status(500).json({ error: "Failed to calculate bundle pricing" });
    }
  });

  // GET /bundles/popular
  router.get("/bundles/popular", requireAuth, async (_req, res) => {
    try {
      const enriched = POPULAR_BUNDLES.map(b => {
        const prices = b.services.map(s => STANDARD_PRICES[s] ?? 149);
        const total = prices.reduce((a, c) => a + c, 0);
        const discount = Math.round(total * b.discountPercent / 100);
        return {
          ...b,
          individualTotal: total,
          bundlePrice: total - discount,
          savings: discount,
        };
      });

      return res.json({ success: true, bundles: enriched, generatedAt: new Date().toISOString() });
    } catch (err) {
      console.error("Popular bundles error:", err);
      return res.status(500).json({ error: "Failed to retrieve popular bundles" });
    }
  });

  return router;
}

export default createDiscountEngineRoutes;
