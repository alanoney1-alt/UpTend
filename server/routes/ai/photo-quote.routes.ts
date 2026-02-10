/**
 * AI Photo-to-Quote API Routes
 *
 * Endpoints:
 * - POST /api/ai/photo-quote - Upload photos and get instant quote
 * - GET /api/ai/photo-quote/:id - Get photo quote request details
 * - GET /api/ai/photo-quote/user/:userId - Get user's photo quote history
 * - POST /api/ai/photo-quote/:id/convert - Convert quote to service request
 */

import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../auth-middleware";
import type { DatabaseStorage } from "../../storage/impl/database-storage";
import { nanoid } from "nanoid";

export function createPhotoQuoteRoutes(storage: DatabaseStorage) {
  const router = Router();

  // ==========================================
  // POST /api/ai/photo-quote
  // Upload photos and get AI-generated quote
  // ==========================================
  const photoQuoteSchema = z.object({
    serviceType: z.string(),
    photoUrls: z.array(z.string().url()).min(1).max(10),
    additionalNotes: z.string().optional(),
  });

  router.post("/photo-quote", requireAuth, async (req, res) => {
    try {
      const validated = photoQuoteSchema.parse(req.body);
      const userId = req.user!.id;

      // Create photo quote request
      const request = await storage.createPhotoQuoteRequest({
        id: nanoid(),
        userId,
        serviceType: validated.serviceType,
        photoUrls: JSON.stringify(validated.photoUrls),
        aiAnalysis: null,
        detectedItems: null,
        estimatedScope: null,
        estimatedPriceMin: null,
        estimatedPriceMax: null,
        confidenceScore: null,
        proQuotesSent: 0,
        status: "analyzing",
        createdAt: new Date().toISOString(),
        analyzedAt: null,
      });

      // TODO: Call AI vision service to analyze photos
      // For now, return placeholder analysis
      const mockAnalysis = {
        detectedItems: ["furniture", "boxes", "appliances"],
        estimatedVolume: "2 truck loads",
        estimatedWeight: "500-700 lbs",
        confidenceScore: 0.85,
        priceRange: { min: 250, max: 400 },
      };

      // Update with analysis results
      const updatedRequest = await storage.updatePhotoQuoteRequest(request.id, {
        aiAnalysis: JSON.stringify(mockAnalysis),
        detectedItems: JSON.stringify(mockAnalysis.detectedItems),
        estimatedScope: mockAnalysis.estimatedVolume,
        estimatedPriceMin: mockAnalysis.priceRange.min,
        estimatedPriceMax: mockAnalysis.priceRange.max,
        confidenceScore: mockAnalysis.confidenceScore,
        status: "analyzed",
        analyzedAt: new Date().toISOString(),
      });

      res.json({
        success: true,
        request: {
          ...updatedRequest,
          photoUrls: JSON.parse(updatedRequest.photoUrls),
          aiAnalysis: updatedRequest.aiAnalysis ? JSON.parse(updatedRequest.aiAnalysis) : null,
          detectedItems: updatedRequest.detectedItems ? JSON.parse(updatedRequest.detectedItems) : null,
        },
      });
    } catch (error: any) {
      console.error("Error creating photo quote:", error);
      res.status(400).json({
        error: error.message || "Failed to create photo quote",
      });
    }
  });

  // ==========================================
  // GET /api/ai/photo-quote/:id
  // Get photo quote request details
  // ==========================================
  router.get("/photo-quote/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const request = await storage.getPhotoQuoteRequest(id);
      if (!request) {
        return res.status(404).json({ error: "Photo quote not found" });
      }

      // Allow user or admin to view
      if (request.userId !== userId && req.user!.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json({
        success: true,
        request: {
          ...request,
          photoUrls: JSON.parse(request.photoUrls),
          aiAnalysis: request.aiAnalysis ? JSON.parse(request.aiAnalysis) : null,
          detectedItems: request.detectedItems ? JSON.parse(request.detectedItems) : null,
        },
      });
    } catch (error: any) {
      console.error("Error fetching photo quote:", error);
      res.status(500).json({
        error: error.message || "Failed to fetch photo quote",
      });
    }
  });

  // ==========================================
  // GET /api/ai/photo-quote/user/:userId
  // Get user's photo quote history
  // ==========================================
  router.get("/photo-quote/user/:userId", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;

      // Only allow users to view their own quotes or admins
      if (userId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const requests = await storage.getPhotoQuoteRequestsByUser(userId);

      res.json({
        success: true,
        requests: requests.map((r) => ({
          ...r,
          photoUrls: JSON.parse(r.photoUrls),
          aiAnalysis: r.aiAnalysis ? JSON.parse(r.aiAnalysis) : null,
          detectedItems: r.detectedItems ? JSON.parse(r.detectedItems) : null,
        })),
      });
    } catch (error: any) {
      console.error("Error fetching photo quotes:", error);
      res.status(500).json({
        error: error.message || "Failed to fetch photo quotes",
      });
    }
  });

  // ==========================================
  // POST /api/ai/photo-quote/:id/convert
  // Convert photo quote to actual service request
  // ==========================================
  router.post("/photo-quote/:id/convert", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const request = await storage.getPhotoQuoteRequest(id);
      if (!request || request.userId !== userId) {
        return res.status(404).json({ error: "Photo quote not found" });
      }

      if (request.status !== "analyzed") {
        return res.status(400).json({ error: "Quote is not ready yet" });
      }

      // TODO: Create actual service request from photo quote
      // This would integrate with the existing service request creation flow

      // Update photo quote status
      await storage.updatePhotoQuoteRequest(id, {
        status: "converted",
        proQuotesSent: 3, // Mock: sent to 3 pros
      });

      res.json({
        success: true,
        message: "Photo quote converted to service request",
        serviceRequestId: nanoid(), // Mock service request ID
      });
    } catch (error: any) {
      console.error("Error converting photo quote:", error);
      res.status(400).json({
        error: error.message || "Failed to convert photo quote",
      });
    }
  });

  return router;
}

export default createPhotoQuoteRoutes;
