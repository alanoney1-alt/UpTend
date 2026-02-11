/**
 * AI Pro Features API Routes
 *
 * Routes for pro-specific AI features:
 * - Route Optimizer
 * - Quality Scoring
 * - Inventory Estimator
 * - Fraud Detection (admin)
 */

import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../auth-middleware";
import type { DatabaseStorage } from "../../storage/impl/database-storage";
import { nanoid } from "nanoid";

export function createProFeaturesRoutes(storage: DatabaseStorage) {
  const router = Router();

  // ==========================================
  // ROUTE OPTIMIZER
  // ==========================================

  // POST /api/ai/pro/route/optimize - Get optimized route for today's jobs
  const optimizeRouteSchema = z.object({
    date: z.string(),
    jobIds: z.array(z.string()).min(2),
  });

  router.post("/pro/route/optimize", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "hauler") {
        return res.status(403).json({ error: "Pro access required" });
      }

      const validated = optimizeRouteSchema.parse(req.body);
      const proId = req.user!.id;

      // TODO: Call route optimization algorithm (TSP solver)
      // For now, return mock optimization
      const mockOptimization = {
        id: nanoid(),
        haulerId: proId,
        optimizationDate: validated.date,
        jobIds: JSON.stringify(validated.jobIds),
        originalRoute: JSON.stringify(validated.jobIds),
        optimizedRoute: JSON.stringify([...validated.jobIds].reverse()), // Mock: reverse order
        originalDistanceMiles: 45.2,
        optimizedDistanceMiles: 32.8,
        distanceSavedMiles: 12.4,
        timeSavedMinutes: 35,
        fuelSavedGallons: 0.62,
        co2SavedLbs: 12.4,
        optimizationAlgorithm: "tsp_genetic",
        trafficDataUsed: true,
        weatherConsidered: false,
        accepted: false,
        createdAt: new Date().toISOString(),
        appliedAt: null,
      };

      const optimization = await storage.createRouteOptimization(mockOptimization);

      res.json({
        success: true,
        optimization: {
          ...optimization,
          jobIds: JSON.parse(optimization.jobIds),
          originalRoute: JSON.parse(optimization.originalRoute),
          optimizedRoute: JSON.parse(optimization.optimizedRoute),
        },
      });
    } catch (error: any) {
      console.error("Error optimizing route:", error);
      res.status(400).json({
        error: error.message || "Failed to optimize route",
      });
    }
  });

  // GET /api/ai/pro/route/history - Get route optimization history
  router.get("/pro/route/history", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "hauler") {
        return res.status(403).json({ error: "Pro access required" });
      }

      const proId = req.user!.id;
      const { startDate, endDate } = req.query;

      const optimizations = await storage.getRouteOptimizationsByHauler(
        proId,
        startDate as string,
        endDate as string
      );

      res.json({
        success: true,
        optimizations: optimizations.map((opt) => ({
          ...opt,
          jobIds: JSON.parse(opt.jobIds),
          originalRoute: JSON.parse(opt.originalRoute),
          optimizedRoute: JSON.parse(opt.optimizedRoute),
        })),
      });
    } catch (error: any) {
      console.error("Error fetching route history:", error);
      res.status(500).json({
        error: error.message || "Failed to fetch route history",
      });
    }
  });

  // GET /api/ai/pro/route/stats - Get aggregated route optimization stats
  router.get("/pro/route/stats", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "hauler") {
        return res.status(403).json({ error: "Pro access required" });
      }

      const proId = req.user!.id;
      const stats = await storage.getRouteOptimizationStats(proId);

      res.json({
        success: true,
        stats,
      });
    } catch (error: any) {
      console.error("Error fetching route stats:", error);
      res.status(500).json({
        error: error.message || "Failed to fetch route stats",
      });
    }
  });

  // ==========================================
  // QUALITY SCORING
  // ==========================================

  // GET /api/ai/pro/quality/score - Get latest quality score
  router.get("/pro/quality/score", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "hauler") {
        return res.status(403).json({ error: "Pro access required" });
      }

      const proId = req.user!.id;
      const score = await storage.getLatestProQualityScore(proId);

      if (!score) {
        return res.json({
          success: true,
          score: null,
          message: "No quality score available yet. Complete more jobs to get scored!",
        });
      }

      res.json({
        success: true,
        score: {
          ...score,
          strengths: score.strengths ? JSON.parse(score.strengths) : null,
          improvementAreas: score.improvementAreas ? JSON.parse(score.improvementAreas) : null,
          trainingRecommendations: score.trainingRecommendations
            ? JSON.parse(score.trainingRecommendations)
            : null,
        },
      });
    } catch (error: any) {
      console.error("Error fetching quality score:", error);
      res.status(500).json({
        error: error.message || "Failed to fetch quality score",
      });
    }
  });

  // GET /api/ai/pro/quality/history - Get quality score history
  router.get("/pro/quality/history", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "hauler") {
        return res.status(403).json({ error: "Pro access required" });
      }

      const proId = req.user!.id;
      const limit = parseInt((req.query.limit as string) || "12");

      const history = await storage.getProQualityScoreHistory(proId, limit);

      res.json({
        success: true,
        history: history.map((score) => ({
          ...score,
          strengths: score.strengths ? JSON.parse(score.strengths) : null,
          improvementAreas: score.improvementAreas ? JSON.parse(score.improvementAreas) : null,
          trainingRecommendations: score.trainingRecommendations
            ? JSON.parse(score.trainingRecommendations)
            : null,
        })),
      });
    } catch (error: any) {
      console.error("Error fetching quality history:", error);
      res.status(500).json({
        error: error.message || "Failed to fetch quality history",
      });
    }
  });

  // GET /api/ai/pro/quality/assessment/:serviceRequestId - Get job quality assessment
  router.get("/pro/quality/assessment/:serviceRequestId", requireAuth, async (req, res) => {
    try {
      const { serviceRequestId } = req.params;
      const assessment = await storage.getJobQualityAssessment(serviceRequestId);

      if (!assessment) {
        return res.status(404).json({ error: "Assessment not found" });
      }

      // Only allow Pro or admin to view
      if (assessment.haulerId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json({
        success: true,
        assessment: {
          ...assessment,
          positiveHighlights: assessment.positiveHighlights
            ? JSON.parse(assessment.positiveHighlights)
            : null,
          improvementSuggestions: assessment.improvementSuggestions
            ? JSON.parse(assessment.improvementSuggestions)
            : null,
        },
      });
    } catch (error: any) {
      console.error("Error fetching assessment:", error);
      res.status(500).json({
        error: error.message || "Failed to fetch assessment",
      });
    }
  });

  // ==========================================
  // INVENTORY ESTIMATOR
  // ==========================================

  // POST /api/ai/pro/inventory/estimate - Create inventory estimate
  const inventoryEstimateSchema = z.object({
    serviceRequestId: z.string(),
    propertyType: z.string().optional(),
    bedrooms: z.number().optional(),
    sqft: z.number().optional(),
    photoUrls: z.array(z.string().url()).optional(),
  });

  router.post("/pro/inventory/estimate", requireAuth, async (req, res) => {
    try {
      const validated = inventoryEstimateSchema.parse(req.body);
      const userId = req.user!.id;

      // TODO: Call AI vision model to analyze photos and estimate inventory
      // Mock estimate for now
      const mockEstimate = {
        id: nanoid(),
        serviceRequestId: validated.serviceRequestId,
        userId,
        propertyType: validated.propertyType || null,
        bedrooms: validated.bedrooms || null,
        sqft: validated.sqft || null,
        photoUrls: validated.photoUrls ? JSON.stringify(validated.photoUrls) : null,
        aiDetectedItems: JSON.stringify(["furniture", "boxes", "appliances", "electronics"]),
        estimatedVolumeCuft: 450,
        estimatedWeightLbs: 600,
        estimatedTruckSize: "large",
        estimatedLaborHours: 4.5,
        estimatedPrice: 350,
        confidenceScore: 0.87,
        comparableJobsData: JSON.stringify({ similarJobs: 23, avgPrice: 340 }),
        createdAt: new Date().toISOString(),
        acceptedByPro: false,
        actualVolumeCuft: null,
        actualWeightLbs: null,
      };

      const estimate = await storage.createInventoryEstimate(mockEstimate);

      res.json({
        success: true,
        estimate: {
          ...estimate,
          photoUrls: estimate.photoUrls ? JSON.parse(estimate.photoUrls) : null,
          aiDetectedItems: estimate.aiDetectedItems ? JSON.parse(estimate.aiDetectedItems) : null,
          comparableJobsData: estimate.comparableJobsData
            ? JSON.parse(estimate.comparableJobsData)
            : null,
        },
      });
    } catch (error: any) {
      console.error("Error creating inventory estimate:", error);
      res.status(400).json({
        error: error.message || "Failed to create inventory estimate",
      });
    }
  });

  // GET /api/ai/pro/inventory/estimate/:serviceRequestId - Get estimate for job
  router.get("/pro/inventory/estimate/:serviceRequestId", requireAuth, async (req, res) => {
    try {
      const { serviceRequestId } = req.params;
      const estimate = await storage.getInventoryEstimateByServiceRequest(serviceRequestId);

      if (!estimate) {
        return res.status(404).json({ error: "Estimate not found" });
      }

      res.json({
        success: true,
        estimate: {
          ...estimate,
          photoUrls: estimate.photoUrls ? JSON.parse(estimate.photoUrls) : null,
          aiDetectedItems: estimate.aiDetectedItems ? JSON.parse(estimate.aiDetectedItems) : null,
          comparableJobsData: estimate.comparableJobsData
            ? JSON.parse(estimate.comparableJobsData)
            : null,
        },
      });
    } catch (error: any) {
      console.error("Error fetching inventory estimate:", error);
      res.status(500).json({
        error: error.message || "Failed to fetch inventory estimate",
      });
    }
  });

  // ==========================================
  // FRAUD DETECTION (Admin Only)
  // ==========================================

  // GET /api/ai/admin/fraud/alerts - Get pending fraud alerts
  router.get("/admin/fraud/alerts", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const alerts = await storage.getPendingFraudAlerts();

      res.json({
        success: true,
        alerts: alerts.map((alert) => ({
          ...alert,
          detectedPatterns: alert.detectedPatterns ? JSON.parse(alert.detectedPatterns) : null,
          evidenceData: alert.evidenceData ? JSON.parse(alert.evidenceData) : null,
        })),
      });
    } catch (error: any) {
      console.error("Error fetching fraud alerts:", error);
      res.status(500).json({
        error: error.message || "Failed to fetch fraud alerts",
      });
    }
  });

  // POST /api/ai/admin/fraud/alerts/:id/review - Review fraud alert
  const reviewAlertSchema = z.object({
    reviewStatus: z.enum(["cleared", "flagged", "suspended"]),
    resolution: z.string(),
    actionTaken: z.string().optional(),
  });

  router.post("/admin/fraud/alerts/:id/review", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { id } = req.params;
      const validated = reviewAlertSchema.parse(req.body);

      await storage.updateFraudAlert(id, {
        reviewStatus: validated.reviewStatus,
        resolution: validated.resolution,
        actionTaken: validated.actionTaken || null,
        reviewedBy: req.user!.id,
        reviewedAt: new Date().toISOString(),
        resolvedAt: new Date().toISOString(),
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error reviewing fraud alert:", error);
      res.status(400).json({
        error: error.message || "Failed to review fraud alert",
      });
    }
  });

  return router;
}

export default createProFeaturesRoutes;
