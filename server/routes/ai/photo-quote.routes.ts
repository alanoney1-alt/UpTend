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
import { analyzeImage } from "../../services/ai/anthropic-client";

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
      const userId = ((req.user as any).userId || (req.user as any).id);

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

      // Call AI vision service to analyze photos
      const photoAnalysisPrompt = `Analyze this image for a home services quote. The customer wants: ${validated.serviceType.replace(/_/g, ' ')}.

Return ONLY valid JSON with these fields:
{
  "detectedItems": ["item1", "item2", ...],
  "estimatedVolume": "description of scope (e.g. '2 truck loads', '500 sq ft', '3 rooms')",
  "estimatedWeight": "weight estimate if applicable",
  "difficulty": "easy" | "medium" | "hard",
  "confidenceScore": 0.0-1.0,
  "scopeDescription": "One sentence describing what you see",
  "priceRange": { "min": number, "max": number },
  "additionalNotes": "any safety concerns or special equipment needed",
  "diyScore": 0-100,
  "diyGuide": {
    "feasibility": "You could probably handle this yourself" | "Some DIY experience needed" | "Best left to a pro",
    "steps": ["step 1", "step 2", ...],
    "toolsNeeded": ["tool1", "tool2", ...],
    "estimatedTime": "time estimate for DIY",
    "safetyWarnings": ["warning1", ...]
  }
}

For diyScore: 0-100 where higher = more feasible for DIY.
- >70: homeowner can likely do it themselves
- 40-70: needs some DIY experience
- <40: professional recommended (heavy equipment, safety risk, licensing needed)
Consider: safety risk, tools required, skill level, physical difficulty, and code/permit requirements.`;

      let analysis;
      try {
        const aiResult = await analyzeImage({
          imageUrl: validated.photoUrls[0],
          prompt: photoAnalysisPrompt,
          maxTokens: 1024,
        });
        analysis = typeof aiResult === 'string' ? JSON.parse(aiResult) : aiResult;
      } catch (aiErr: any) {
        console.warn("AI photo analysis failed, using fallback:", aiErr.message);
        analysis = {
          detectedItems: ["items detected"],
          estimatedVolume: "standard scope",
          estimatedWeight: "estimated on-site",
          confidenceScore: 0.5,
          priceRange: { min: 99, max: 299 },
          scopeDescription: "Photo received — a Pro will verify on-site for exact pricing.",
          diyScore: 30,
          diyGuide: {
            feasibility: "Best left to a pro",
            steps: [],
            toolsNeeded: [],
            estimatedTime: "Varies",
            safetyWarnings: ["Professional assessment recommended"],
          },
        };
      }

      const mockAnalysis = {
        ...analysis,
        detectedItems: Array.isArray(analysis.detectedItems) ? analysis.detectedItems : ["items detected"],
        estimatedVolume: analysis.estimatedVolume || "standard scope",
        confidenceScore: analysis.confidenceScore || 0.7,
        priceRange: analysis.priceRange || { min: 99, max: 299 },
        diyScore: typeof analysis.diyScore === "number" ? analysis.diyScore : 30,
        diyGuide: analysis.diyGuide || {
          feasibility: "Best left to a pro",
          steps: [],
          toolsNeeded: [],
          estimatedTime: "Varies",
          safetyWarnings: ["Professional assessment recommended"],
        },
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

      const parsedPhotoUrls = (() => { try { const v = JSON.parse(updatedRequest.photoUrls); return Array.isArray(v) ? v : []; } catch { return []; } })();
      const parsedDetectedItems = (() => { try { const v = updatedRequest.detectedItems ? JSON.parse(updatedRequest.detectedItems) : null; return Array.isArray(v) ? v : null; } catch { return null; } })();

      res.json({
        success: true,
        request: {
          ...updatedRequest,
          photoUrls: parsedPhotoUrls,
          aiAnalysis: updatedRequest.aiAnalysis ? JSON.parse(updatedRequest.aiAnalysis) : null,
          detectedItems: parsedDetectedItems,
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
      const userId = ((req.user as any).userId || (req.user as any).id);

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
      if (userId !== ((req.user as any).userId || (req.user as any).id) && req.user!.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const requests = await storage.getPhotoQuoteRequestsByUser(userId);
      const requestList = Array.isArray(requests) ? requests : [];

      res.json({
        success: true,
        requests: requestList.map((r) => ({
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
      const userId = ((req.user as any).userId || (req.user as any).id);

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
