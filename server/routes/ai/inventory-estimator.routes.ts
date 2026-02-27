/**
 * AI Inventory Estimator API Routes (#18)
 *
 * Photo-based volume estimation for junk removal.
 * Customer photos junk → AI estimates cubic yards, items, weight → accurate quote.
 *
 * Endpoints:
 * - POST /api/ai/inventory-estimate - Upload junk photos → get volume estimate
 * - GET /api/ai/inventory-estimate/:id - Get estimate details
 * - POST /api/ai/inventory-estimate/:id/book - Book based on estimate
 */

import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../auth-middleware";
import type { DatabaseStorage } from "../../storage/impl/database-storage";
import { nanoid } from "nanoid";
import { analyzeImageOpenAI as analyzeImage } from "../../services/ai/openai-vision-client";

export function createInventoryEstimatorRoutes(storage: DatabaseStorage) {
  const router = Router();

  // POST /api/ai/inventory-estimate
  const estimateSchema = z.object({
    photoUrls: z.array(z.string()).min(1).max(10),
    customerDescription: z.string().optional(),
    propertyId: z.string().optional(),
  });

  router.post("/inventory-estimate", requireAuth, async (req, res) => {
    try {
      const validated = estimateSchema.parse(req.body);
      const userId = ((req.user as any).userId || (req.user as any).id);

      const startTime = Date.now();
      let aiEstimate: any;

      try {
        const aiResult = await analyzeImage({
          imageUrl: validated.photoUrls[0],
          prompt: `You are an expert junk removal estimator. Analyze this image of items to be removed.
${validated.customerDescription ? `Customer says: "${validated.customerDescription}"` : ""}

Return ONLY valid JSON:
{
  "estimatedCubicYards": number (0.5 to 20),
  "estimatedWeightLbs": number,
  "estimatedItemCount": number,
  "confidence": 0.0-1.0,
  "detectedItems": [{"item": "couch", "quantity": 1, "estimatedCuYd": 2.5, "recyclable": false, "donateable": true}, ...],
  "recyclablePercentage": number (0-100),
  "donateableItems": ["item1", "item2"],
  "truckLoadsNeeded": number (0.25, 0.5, 0.75, 1, 1.5, 2, etc),
  "difficulty": "easy" | "medium" | "hard",
  "pricingFactors": [{"factor": "stairs", "impact": "+$50"}, ...],
  "estimatedPriceLow": number,
  "estimatedPriceHigh": number,
  "specialNotes": "any safety or access concerns"
}`,
          maxTokens: 2048,
        });

        aiEstimate = typeof aiResult === 'string' ? JSON.parse(aiResult) : aiResult;
      } catch (aiErr: any) {
        console.warn("AI inventory estimation failed:", aiErr.message);
        aiEstimate = {
          estimatedCubicYards: 3,
          estimatedWeightLbs: 400,
          estimatedItemCount: 10,
          confidence: 0.4,
          detectedItems: [{ item: "mixed items", quantity: 1, estimatedCuYd: 3, recyclable: false }],
          recyclablePercentage: 20,
          donateableItems: [],
          truckLoadsNeeded: 1,
          estimatedPriceLow: 199,
          estimatedPriceHigh: 399,
          specialNotes: "Photo analysis unavailable - estimate is approximate. Pro will confirm on-site.",
        };
      }

      const processingTime = Date.now() - startTime;

      // Save to DB - map AI fields to actual schema columns
      const estimate = await storage.createInventoryEstimate({
        id: nanoid(),
        userId,
        initiatedBy: "customer",
        serviceType: "junk_removal",
        serviceRequestId: null,
        photoUrls: validated.photoUrls,
        roomInventories: {
          customerDescription: validated.customerDescription || null,
          detectedItems: Array.isArray(aiEstimate.detectedItems) ? aiEstimate.detectedItems : [],
          donateableItems: Array.isArray(aiEstimate.donateableItems) ? aiEstimate.donateableItems : [],
          recyclablePercentage: aiEstimate.recyclablePercentage,
          pricingFactors: aiEstimate.pricingFactors || [],
        },
        totalItems: aiEstimate.estimatedItemCount || null,
        totalEstimatedWeight: aiEstimate.estimatedWeightLbs || null,
        estimatedTruckLoads: aiEstimate.truckLoadsNeeded || null,
        generatedPriceMin: aiEstimate.estimatedPriceLow || null,
        generatedPriceMax: aiEstimate.estimatedPriceHigh || null,
        priceBreakdown: aiEstimate.pricingFactors || null,
        junkCategorization: Array.isArray(aiEstimate.detectedItems) ? aiEstimate.detectedItems : null,
        processingTimeMs: processingTime,
        createdAt: new Date().toISOString(),
      });

      res.json({
        success: true,
        estimate: {
          id: estimate.id,
          ...aiEstimate,
          processingTimeMs: processingTime,
        },
      });
    } catch (error: any) {
      console.error("Error creating inventory estimate:", error);
      res.status(400).json({ error: error.message || "Failed to create estimate" });
    }
  });

  // GET /api/ai/inventory-estimate/:id
  router.get("/inventory-estimate/:id", requireAuth, async (req, res) => {
    try {
      const estimate = await storage.getInventoryEstimate(req.params.id);
      if (!estimate || estimate.userId !== ((req.user as any).userId || (req.user as any).id)) {
        return res.status(404).json({ error: "Estimate not found" });
      }
      res.json({ success: true, estimate });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/ai/inventory-estimate/:id/book
  router.post("/inventory-estimate/:id/book", requireAuth, async (req, res) => {
    try {
      const estimate = await storage.getInventoryEstimate(req.params.id);
      if (!estimate || estimate.userId !== ((req.user as any).userId || (req.user as any).id)) {
        return res.status(404).json({ error: "Estimate not found" });
      }
      await storage.updateInventoryEstimate(estimate.id, { status: "booked" });
      res.json({
        success: true,
        message: "Estimate linked to booking - proceed to service request creation",
        estimateId: estimate.id,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}

export default createInventoryEstimatorRoutes;
