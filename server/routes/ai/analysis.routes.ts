import type { Express } from "express";
import { storage } from "../../storage";
import { analyzePhotosForQuote, analyzeVideoFramesForQuote, analyzePhotosForHazards } from "../../services/ai-analysis";
import { analyzePhotos, getQuickEstimate } from "../../photoAnalysisService";

// Rate limiting maps
const videoAnalysisRateLimits = new Map<string, { count: number; resetAt: number }>();
const photoAnalysisRateLimits = new Map<string, { count: number; resetAt: number }>();
const PHOTO_ANALYSIS_RATE_LIMIT = 10;
const PHOTO_ANALYSIS_WINDOW_MS = 15 * 60 * 1000;
const MAX_BASE64_SIZE = 10 * 1024 * 1024;

export function registerAiAnalysisRoutes(app: Express) {
  // ==========================================
  // AI PHOTO ANALYSIS (for quotes)
  // ==========================================

  // Analyze photos for service quote generation (unauthenticated allowed)
  app.post("/api/ai/analyze-photos", async (req, res) => {
    try {
      // Rate limiting for unauthenticated users
      if (!req.user) {
        const clientIp = req.ip || req.socket.remoteAddress || "unknown";
        const now = Date.now();

        const rateLimit = photoAnalysisRateLimits.get(clientIp);
        if (rateLimit) {
          if (now < rateLimit.resetAt) {
            if (rateLimit.count >= PHOTO_ANALYSIS_RATE_LIMIT) {
              return res.status(429).json({
                error: "Too many requests. Please try again later or sign up for unlimited quotes.",
                retryAfter: Math.ceil((rateLimit.resetAt - now) / 1000)
              });
            }
            rateLimit.count++;
          } else {
            photoAnalysisRateLimits.set(clientIp, { count: 1, resetAt: now + PHOTO_ANALYSIS_WINDOW_MS });
          }
        } else {
          photoAnalysisRateLimits.set(clientIp, { count: 1, resetAt: now + PHOTO_ANALYSIS_WINDOW_MS });
        }
      }

      const { photoUrls, serviceType } = req.body;

      if (!photoUrls || !Array.isArray(photoUrls) || photoUrls.length === 0) {
        return res.status(400).json({ error: "photoUrls array is required" });
      }

      if (!serviceType) {
        return res.status(400).json({ error: "serviceType is required" });
      }

      const validServiceTypes = ["junk_removal", "furniture_moving", "garage_cleanout", "estate_cleanout"];
      if (!validServiceTypes.includes(serviceType)) {
        return res.status(400).json({ error: "Invalid serviceType" });
      }

      const analysis = await analyzePhotosForQuote(photoUrls, serviceType);

      const validLoadSizes = ["small", "medium", "large", "extra_large"];
      const loadSize = validLoadSizes.includes(analysis.recommendedLoadSize)
        ? analysis.recommendedLoadSize
        : "medium";

      const quote = await storage.calculateQuote({
        serviceType: serviceType as "junk_removal" | "furniture_moving" | "garage_cleanout" | "estate_cleanout",
        loadSize: loadSize as "small" | "medium" | "large" | "extra_large",
      });

      // Store estimate with temporary ID (will link to request later on booking)
      const estimate = await storage.createAiEstimate({
        requestId: null, // Will be linked when user books
        photoUrls,
        identifiedItems: analysis.identifiedItems,
        estimatedVolumeCubicFt: analysis.estimatedVolumeCubicFt,
        recommendedLoadSize: analysis.recommendedLoadSize,
        confidence: analysis.confidence,
        suggestedPrice: quote.totalPrice,
        reasoning: analysis.reasoning,
        rawResponse: analysis.rawResponse,
        createdAt: new Date().toISOString(),
      });

      res.json({
        id: estimate.id, // Return the ID so frontend can reference it
        ...analysis,
        suggestedPrice: quote.totalPrice,
        suggestedPriceMin: quote.priceMin,
        suggestedPriceMax: quote.priceMax,
        aiConfidence: quote.confidence,
        priceBreakdown: quote.breakdown,
      });
    } catch (error) {
      console.error("AI analysis error:", error);
      res.status(500).json({ error: "Failed to analyze photos" });
    }
  });

  // ==========================================
  // AI VIDEO ANALYSIS (for quotes)
  // ==========================================

  // Analyze video frames for service quote generation
  app.post("/api/ai/analyze-video", async (req, res) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || "unknown";
      const now = Date.now();

      const rateLimit = videoAnalysisRateLimits.get(clientIp);
      if (rateLimit) {
        if (now < rateLimit.resetAt) {
          if (rateLimit.count >= 5) {
            return res.status(429).json({
              error: "Too many video analysis requests. Please try again later.",
              retryAfter: Math.ceil((rateLimit.resetAt - now) / 1000)
            });
          }
          rateLimit.count++;
        } else {
          videoAnalysisRateLimits.set(clientIp, { count: 1, resetAt: now + 15 * 60 * 1000 });
        }
      } else {
        videoAnalysisRateLimits.set(clientIp, { count: 1, resetAt: now + 15 * 60 * 1000 });
      }

      const { frames, serviceType } = req.body;

      if (!frames || !Array.isArray(frames) || frames.length === 0) {
        return res.status(400).json({ error: "frames array is required (base64 image data URLs)" });
      }

      if (frames.length > 12) {
        return res.status(400).json({ error: "Maximum 12 frames allowed" });
      }

      if (!serviceType) {
        return res.status(400).json({ error: "serviceType is required" });
      }

      const validServiceTypes = ["junk_removal", "furniture_moving", "garage_cleanout", "estate_cleanout", "truck_unloading"];
      if (!validServiceTypes.includes(serviceType)) {
        return res.status(400).json({ error: "Invalid serviceType" });
      }

      const analysis = await analyzeVideoFramesForQuote(frames, serviceType);

      const validLoadSizes = ["small", "medium", "large", "extra_large"];
      const loadSize = validLoadSizes.includes(analysis.recommendedLoadSize)
        ? analysis.recommendedLoadSize
        : "medium";

      const quote = await storage.calculateQuote({
        serviceType: serviceType as "junk_removal" | "furniture_moving" | "garage_cleanout" | "estate_cleanout",
        loadSize: loadSize as "small" | "medium" | "large" | "extra_large",
      });

      // Store estimate with temporary ID (will link to request later on booking)
      const estimate = await storage.createAiEstimate({
        requestId: null, // Will be linked when user books
        photoUrls: [], // Video frames not stored as URLs
        identifiedItems: analysis.identifiedItems,
        estimatedVolumeCubicFt: analysis.estimatedVolumeCubicFt,
        recommendedLoadSize: analysis.recommendedLoadSize,
        confidence: analysis.confidence * 1.05, // +5% confidence boost for video
        suggestedPrice: quote.totalPrice,
        reasoning: analysis.reasoning,
        rawResponse: analysis.rawResponse,
        createdAt: new Date().toISOString(),
      });

      res.json({
        id: estimate.id, // Return the ID so frontend can reference it
        ...analysis,
        suggestedPrice: quote.totalPrice,
        suggestedPriceMin: quote.priceMin,
        suggestedPriceMax: quote.priceMax,
        aiConfidence: quote.confidence,
        priceBreakdown: quote.breakdown,
        analysisType: "video",
      });
    } catch (error) {
      console.error("AI video analysis error:", error);
      res.status(500).json({ error: "Failed to analyze video" });
    }
  });

  // ==========================================
  // PHOTO ANALYSIS (with rate limiting)
  // ==========================================

  // Analyze photos with rate limiting (alternative endpoint)
  app.post("/api/photos/analyze", async (req, res) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || "unknown";
      const now = Date.now();

      const rateLimit = photoAnalysisRateLimits.get(clientIp);
      if (rateLimit) {
        if (now < rateLimit.resetAt) {
          if (rateLimit.count >= PHOTO_ANALYSIS_RATE_LIMIT) {
            return res.status(429).json({
              error: "Too many requests. Please try again later.",
              retryAfter: Math.ceil((rateLimit.resetAt - now) / 1000)
            });
          }
          rateLimit.count++;
        } else {
          photoAnalysisRateLimits.set(clientIp, { count: 1, resetAt: now + PHOTO_ANALYSIS_WINDOW_MS });
        }
      } else {
        photoAnalysisRateLimits.set(clientIp, { count: 1, resetAt: now + PHOTO_ANALYSIS_WINDOW_MS });
      }

      const { photoUrls } = req.body;

      if (!photoUrls || !Array.isArray(photoUrls) || photoUrls.length === 0) {
        return res.status(400).json({ error: "photoUrls array is required" });
      }

      if (photoUrls.length > 5) {
        return res.status(400).json({ error: "Maximum 5 photos allowed" });
      }

      for (const url of photoUrls) {
        if (typeof url !== "string") {
          return res.status(400).json({ error: "Invalid photo URL format" });
        }

        if (url.startsWith("data:")) {
          if (!url.match(/^data:image\/(jpeg|jpg|png|gif|webp);base64,/i)) {
            return res.status(400).json({ error: "Invalid image format. Use JPEG, PNG, GIF, or WebP" });
          }
          if (url.length > MAX_BASE64_SIZE) {
            return res.status(400).json({ error: "Image too large. Maximum 10MB per image" });
          }
        } else {
          return res.status(400).json({ error: "Only base64 data URLs are accepted for security" });
        }
      }

      const analysis = await analyzePhotos(photoUrls);

      res.json({
        estimatedVolumeCubicFt: analysis.estimatedVolumeCubicFt,
        suggestedPrice: analysis.suggestedPrice,
        itemBreakdown: analysis.itemBreakdown,
        reasoning: analysis.reasoning,
        recommendedLoadSize: analysis.recommendedLoadSize,
        confidence: analysis.confidence,
      });
    } catch (error) {
      console.error("Photo analysis error:", error);
      res.status(500).json({ error: "Failed to analyze photos" });
    }
  });

  // ==========================================
  // SERVICE REQUEST PHOTO ANALYSIS
  // ==========================================

  // Analyze photos for an existing service request
  app.post("/api/service-requests/:id/analyze", async (req, res) => {
    try {
      const request = await storage.getServiceRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Service request not found" });
      }

      if (!request.photoUrls || request.photoUrls.length === 0) {
        return res.status(400).json({ error: "No photos to analyze" });
      }

      const analysis = await analyzePhotosForQuote(request.photoUrls, request.serviceType);

      const validLoadSizes = ["small", "medium", "large", "extra_large"];
      const loadSize = validLoadSizes.includes(analysis.recommendedLoadSize)
        ? analysis.recommendedLoadSize
        : "medium";

      const quote = await storage.calculateQuote({
        serviceType: request.serviceType as "junk_removal" | "furniture_moving" | "garage_cleanout" | "estate_cleanout",
        loadSize: loadSize as "small" | "medium" | "large" | "extra_large",
      });

      const estimate = await storage.createAiEstimate({
        requestId: request.id,
        photoUrls: request.photoUrls,
        identifiedItems: analysis.identifiedItems,
        estimatedVolumeCubicFt: analysis.estimatedVolumeCubicFt,
        recommendedLoadSize: analysis.recommendedLoadSize,
        confidence: analysis.confidence,
        suggestedPrice: quote.totalPrice,
        reasoning: analysis.reasoning,
        rawResponse: analysis.rawResponse,
        createdAt: new Date().toISOString(),
      });

      res.json({
        estimate,
        priceBreakdown: quote.breakdown,
      });
    } catch (error) {
      console.error("AI analysis error:", error);
      res.status(500).json({ error: "Failed to analyze service request photos" });
    }
  });

  // Get AI estimate for a service request
  app.get("/api/ai-estimates/:requestId", async (req, res) => {
    try {
      const estimate = await storage.getAiEstimateByRequest(req.params.requestId);
      if (!estimate) {
        return res.status(404).json({ error: "No AI estimate found for this request" });
      }
      res.json(estimate);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch AI estimate" });
    }
  });

  // Get AI estimate by ID (for unauthenticated quote flow)
  app.get("/api/ai-estimates/quote/:id", async (req, res) => {
    try {
      const estimate = await storage.getAiEstimate(req.params.id);
      if (!estimate) {
        return res.status(404).json({ error: "Quote not found" });
      }
      res.json(estimate);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch quote" });
    }
  });
}
