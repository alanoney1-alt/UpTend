/**
 * AI Smart Scheduling API Routes
 *
 * Endpoints:
 * - POST /api/ai/schedule/suggest - Get AI-optimized scheduling suggestions
 * - GET /api/ai/schedule/suggestions - Get active suggestions for user
 * - POST /api/ai/schedule/suggestions/:id/accept - Accept a suggestion
 * - POST /api/ai/schedule/suggestions/:id/reject - Reject a suggestion
 */

import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../auth-middleware";
import type { DatabaseStorage } from "../../storage/impl/database-storage";
import { nanoid } from "nanoid";

export function createSmartSchedulingRoutes(storage: DatabaseStorage) {
  const router = Router();

  // ==========================================
  // POST /api/ai/schedule/suggest
  // Get AI-optimized scheduling suggestions
  // ==========================================
  const suggestSchema = z.object({
    serviceType: z.string(),
    address: z.string(),
    flexibility: z.enum(["flexible", "moderate", "specific"]).default("moderate"),
    preferredTimeOfDay: z.enum(["morning", "afternoon", "evening", "any"]).optional(),
  });

  router.post("/schedule/suggest", requireAuth, async (req, res) => {
    try {
      const validated = suggestSchema.parse(req.body);
      const userId = req.user!.id;

      // TODO: Call AI scheduling service that considers:
      // - Pro availability in the area
      // - Weather forecast
      // - Demand patterns
      // - Price optimization
      // - User's past booking patterns

      // Mock suggestions for now
      const mockSuggestions = [
        {
          id: nanoid(),
          userId,
          serviceType: validated.serviceType,
          suggestedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          suggestedTimeSlot: "morning",
          reasoning: "High pro availability, optimal weather conditions, 15% cost savings",
          confidenceScore: 0.92,
          factorsConsidered: JSON.stringify({
            proAvailability: 8,
            weatherScore: 0.95,
            demandLevel: "low",
            priceOptimization: 0.85,
          }),
          availablePros: 8,
          estimatedPrice: 180,
          weatherOptimal: true,
          accepted: false,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        },
        {
          id: nanoid(),
          userId,
          serviceType: validated.serviceType,
          suggestedDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          suggestedTimeSlot: "afternoon",
          reasoning: "Weekend availability, multiple pros competing for jobs",
          confidenceScore: 0.88,
          factorsConsidered: JSON.stringify({
            proAvailability: 12,
            weatherScore: 0.90,
            demandLevel: "medium",
            priceOptimization: 0.80,
          }),
          availablePros: 12,
          estimatedPrice: 195,
          weatherOptimal: true,
          accepted: false,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      const created = await Promise.all(
        mockSuggestions.map((suggestion) => storage.createSmartScheduleSuggestion(suggestion))
      );

      res.json({
        success: true,
        suggestions: created.map((s) => ({
          ...s,
          factorsConsidered: JSON.parse(s.factorsConsidered),
        })),
      });
    } catch (error: any) {
      console.error("Error creating schedule suggestions:", error);
      res.status(400).json({
        error: error.message || "Failed to create schedule suggestions",
      });
    }
  });

  // ==========================================
  // GET /api/ai/schedule/suggestions
  // Get active suggestions for user
  // ==========================================
  router.get("/schedule/suggestions", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const suggestions = await storage.getActiveScheduleSuggestionsByUser(userId);

      res.json({
        success: true,
        suggestions: suggestions.map((s) => ({
          ...s,
          factorsConsidered: JSON.parse(s.factorsConsidered),
        })),
      });
    } catch (error: any) {
      console.error("Error fetching schedule suggestions:", error);
      res.status(500).json({
        error: error.message || "Failed to fetch schedule suggestions",
      });
    }
  });

  // ==========================================
  // POST /api/ai/schedule/suggestions/:id/accept
  // Accept a scheduling suggestion
  // ==========================================
  router.post("/schedule/suggestions/:id/accept", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // TODO: Verify suggestion belongs to user and is still valid
      // TODO: Create actual service request with the suggested date/time

      await storage.updateSmartScheduleSuggestion(id, { accepted: true });

      res.json({
        success: true,
        message: "Suggestion accepted, creating service request...",
        serviceRequestId: nanoid(), // Mock
      });
    } catch (error: any) {
      console.error("Error accepting suggestion:", error);
      res.status(400).json({
        error: error.message || "Failed to accept suggestion",
      });
    }
  });

  // ==========================================
  // POST /api/ai/schedule/suggestions/:id/reject
  // Reject a scheduling suggestion
  // ==========================================
  router.post("/schedule/suggestions/:id/reject", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Mark suggestion as expired
      await storage.updateSmartScheduleSuggestion(id, {
        expiresAt: new Date().toISOString(),
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error rejecting suggestion:", error);
      res.status(400).json({
        error: error.message || "Failed to reject suggestion",
      });
    }
  });

  return router;
}

export default createSmartSchedulingRoutes;
