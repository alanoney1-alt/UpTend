/**
 * AI Business & Admin Features API Routes
 *
 * Routes for business and admin AI features:
 * - Portfolio Dashboard (Property Managers)
 * - Marketing Content Generator
 * - Voice Booking Sessions
 * - Move-In Wizard
 * - Document Scanner
 * - Neighborhood Intelligence
 */

import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../auth-middleware";
import type { DatabaseStorage } from "../../storage/impl/database-storage";
import { nanoid } from "nanoid";

export function createBusinessFeaturesRoutes(storage: DatabaseStorage) {
  const router = Router();

  // ==========================================
  // PORTFOLIO DASHBOARD (Property Managers)
  // ==========================================

  // GET /api/ai/business/portfolio/health - Get latest health report
  router.get("/business/portfolio/health", requireAuth, async (req, res) => {
    try {
      const { businessAccountId } = req.query;

      if (!businessAccountId) {
        return res.status(400).json({ error: "businessAccountId required" });
      }

      // TODO: Verify user has access to this business account

      const report = await storage.getLatestPortfolioHealthReport(businessAccountId as string);

      if (!report) {
        return res.json({
          success: true,
          report: null,
          message: "No health report available yet",
        });
      }

      res.json({
        success: true,
        report: {
          ...report,
          vendorPerformanceScores: report.vendorPerformanceScores
            ? JSON.parse(report.vendorPerformanceScores)
            : null,
          upcomingSeasonalNeeds: report.upcomingSeasonalNeeds
            ? JSON.parse(report.upcomingSeasonalNeeds)
            : null,
          riskProperties: report.riskProperties ? JSON.parse(report.riskProperties) : null,
          costSavingOpportunities: report.costSavingOpportunities
            ? JSON.parse(report.costSavingOpportunities)
            : null,
          recommendedActions: report.recommendedActions
            ? JSON.parse(report.recommendedActions)
            : null,
        },
      });
    } catch (error: any) {
      console.error("Error fetching portfolio health:", error);
      res.status(500).json({
        error: error.message || "Failed to fetch portfolio health",
      });
    }
  });

  // GET /api/ai/business/portfolio/history - Get health report history
  router.get("/business/portfolio/history", requireAuth, async (req, res) => {
    try {
      const { businessAccountId, limit } = req.query;

      if (!businessAccountId) {
        return res.status(400).json({ error: "businessAccountId required" });
      }

      const history = await storage.getPortfolioHealthReportHistory(
        businessAccountId as string,
        parseInt((limit as string) || "12")
      );

      res.json({
        success: true,
        history: history.map((report) => ({
          ...report,
          vendorPerformanceScores: report.vendorPerformanceScores
            ? JSON.parse(report.vendorPerformanceScores)
            : null,
          upcomingSeasonalNeeds: report.upcomingSeasonalNeeds
            ? JSON.parse(report.upcomingSeasonalNeeds)
            : null,
          riskProperties: report.riskProperties ? JSON.parse(report.riskProperties) : null,
          costSavingOpportunities: report.costSavingOpportunities
            ? JSON.parse(report.costSavingOpportunities)
            : null,
          recommendedActions: report.recommendedActions
            ? JSON.parse(report.recommendedActions)
            : null,
        })),
      });
    } catch (error: any) {
      console.error("Error fetching portfolio history:", error);
      res.status(500).json({
        error: error.message || "Failed to fetch portfolio history",
      });
    }
  });

  // ==========================================
  // MARKETING CONTENT GENERATOR (Admin)
  // ==========================================

  // POST /api/ai/marketing/generate - Generate marketing content
  const generateContentSchema = z.object({
    contentType: z.enum(["email", "social", "blog", "ad", "sms"]),
    targetAudience: z.string().optional(),
    serviceType: z.string().optional(),
    season: z.string().optional(),
    zipCode: z.string().optional(),
    tone: z.enum(["professional", "friendly", "urgent", "informative"]).default("professional"),
    keywords: z.array(z.string()).optional(),
  });

  router.post("/marketing/generate", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const validated = generateContentSchema.parse(req.body);

      // TODO: Call AI service to generate marketing content
      // Mock content for now
      const mockContent = {
        id: nanoid(),
        contentType: validated.contentType,
        targetAudience: validated.targetAudience || null,
        serviceType: validated.serviceType || null,
        season: validated.season || null,
        zipCode: validated.zipCode || null,
        generatedContent: `**${validated.contentType.toUpperCase()} Content Generated**\n\nThis is AI-generated marketing content ready for your campaign. Perfect for ${validated.targetAudience || "all customers"}!`,
        contentFormat: "markdown",
        tone: validated.tone,
        keywords: validated.keywords ? JSON.stringify(validated.keywords) : null,
        callToAction: "Book Now - Limited Time Offer!",
        performanceMetrics: null,
        aBTestVariant: null,
        status: "draft",
        createdBy: req.user!.id,
        approvedBy: null,
        createdAt: new Date().toISOString(),
        publishedAt: null,
      };

      const content = await storage.createAiMarketingContent(mockContent);

      res.json({
        success: true,
        content: {
          ...content,
          keywords: content.keywords ? JSON.parse(content.keywords) : null,
        },
      });
    } catch (error: any) {
      console.error("Error generating marketing content:", error);
      res.status(400).json({
        error: error.message || "Failed to generate marketing content",
      });
    }
  });

  // GET /api/ai/marketing/content - Get marketing content list
  router.get("/marketing/content", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { contentType, status } = req.query;

      const content = await storage.getAiMarketingContentByType(
        (contentType as string) || "email",
        status as string
      );

      res.json({
        success: true,
        content: content.map((c) => ({
          ...c,
          keywords: c.keywords ? JSON.parse(c.keywords) : null,
          performanceMetrics: c.performanceMetrics ? JSON.parse(c.performanceMetrics) : null,
        })),
      });
    } catch (error: any) {
      console.error("Error fetching marketing content:", error);
      res.status(500).json({
        error: error.message || "Failed to fetch marketing content",
      });
    }
  });

  // ==========================================
  // MOVE-IN WIZARD
  // ==========================================

  // POST /api/ai/move-in/plan - Create move-in plan
  const moveInPlanSchema = z.object({
    propertyAddress: z.string(),
    moveInDate: z.string(),
    propertyType: z.string().optional(),
    bedrooms: z.number().optional(),
    hasPets: z.boolean().default(false),
  });

  router.post("/move-in/plan", requireAuth, async (req, res) => {
    try {
      const validated = moveInPlanSchema.parse(req.body);
      const userId = req.user!.id;

      // TODO: Call AI service to generate personalized move-in checklist
      // Mock plan for now
      const mockChecklist = {
        week1: ["Schedule junk removal", "Book deep cleaning", "Gutter inspection"],
        week2: ["Pressure washing", "Pool cleaning", "Lawn maintenance setup"],
        week3: ["HVAC inspection", "Smart home setup", "Security system"],
      };

      const mockServices = [
        { service: "junk_removal", priority: 1, estimatedCost: 200 },
        { service: "deep_cleaning", priority: 1, estimatedCost: 150 },
        { service: "pressure_washing", priority: 2, estimatedCost: 180 },
      ];

      const plan = await storage.createMoveInPlan({
        id: nanoid(),
        userId,
        propertyAddress: validated.propertyAddress,
        moveInDate: validated.moveInDate,
        propertyType: validated.propertyType || null,
        bedrooms: validated.bedrooms || null,
        hasPets: validated.hasPets,
        aiChecklist: JSON.stringify(mockChecklist),
        recommendedServices: JSON.stringify(mockServices),
        estimatedTotalCost: 530,
        priorityOrder: JSON.stringify([1, 2, 3]),
        weatherConsiderations: JSON.stringify({ bestDays: ["Mon", "Tue", "Wed"] }),
        completedTasks: JSON.stringify([]),
        status: "planning",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      res.json({
        success: true,
        plan: {
          ...plan,
          aiChecklist: JSON.parse(plan.aiChecklist),
          recommendedServices: JSON.parse(plan.recommendedServices),
          priorityOrder: JSON.parse(plan.priorityOrder),
          weatherConsiderations: JSON.parse(plan.weatherConsiderations),
          completedTasks: JSON.parse(plan.completedTasks),
        },
      });
    } catch (error: any) {
      console.error("Error creating move-in plan:", error);
      res.status(400).json({
        error: error.message || "Failed to create move-in plan",
      });
    }
  });

  // GET /api/ai/move-in/plans - Get user's move-in plans
  router.get("/move-in/plans", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const plans = await storage.getMoveInPlansByUser(userId);

      res.json({
        success: true,
        plans: plans.map((plan) => ({
          ...plan,
          aiChecklist: JSON.parse(plan.aiChecklist),
          recommendedServices: JSON.parse(plan.recommendedServices),
          priorityOrder: JSON.parse(plan.priorityOrder),
          weatherConsiderations: JSON.parse(plan.weatherConsiderations),
          completedTasks: JSON.parse(plan.completedTasks),
        })),
      });
    } catch (error: any) {
      console.error("Error fetching move-in plans:", error);
      res.status(500).json({
        error: error.message || "Failed to fetch move-in plans",
      });
    }
  });

  // ==========================================
  // DOCUMENT SCANNER
  // ==========================================

  // POST /api/ai/documents/scan - Scan document/receipt
  const scanDocumentSchema = z.object({
    documentType: z.enum(["receipt", "invoice", "contract", "permit", "other"]),
    imageUrl: z.string().url(),
    serviceRequestId: z.string().optional(),
  });

  router.post("/documents/scan", requireAuth, async (req, res) => {
    try {
      const validated = scanDocumentSchema.parse(req.body);
      const userId = req.user!.id;

      // TODO: Call OCR service to extract text and structured data
      // Mock scan for now
      const mockExtractedData = {
        vendorName: "Green Earth Recycling",
        totalAmount: 45.5,
        serviceDate: "2024-02-08",
        lineItems: [
          { description: "Wood recycling", weight: 120, amount: 25.0 },
          { description: "Metal recycling", weight: 80, amount: 20.5 },
        ],
      };

      const scan = await storage.createDocumentScan({
        id: nanoid(),
        userId,
        serviceRequestId: validated.serviceRequestId || null,
        documentType: validated.documentType,
        imageUrl: validated.imageUrl,
        extractedText: "Sample receipt text...",
        structuredData: JSON.stringify(mockExtractedData),
        vendorName: mockExtractedData.vendorName,
        totalAmount: mockExtractedData.totalAmount,
        serviceDate: mockExtractedData.serviceDate,
        lineItems: JSON.stringify(mockExtractedData.lineItems),
        confidenceScore: 0.94,
        verificationStatus: "pending",
        createdAt: new Date().toISOString(),
        verifiedAt: null,
      });

      res.json({
        success: true,
        scan: {
          ...scan,
          structuredData: JSON.parse(scan.structuredData!),
          lineItems: JSON.parse(scan.lineItems!),
        },
      });
    } catch (error: any) {
      console.error("Error scanning document:", error);
      res.status(400).json({
        error: error.message || "Failed to scan document",
      });
    }
  });

  // GET /api/ai/documents/scans - Get user's document scans
  router.get("/documents/scans", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const scans = await storage.getDocumentScansByUser(userId);

      res.json({
        success: true,
        scans: scans.map((scan) => ({
          ...scan,
          structuredData: scan.structuredData ? JSON.parse(scan.structuredData) : null,
          lineItems: scan.lineItems ? JSON.parse(scan.lineItems) : null,
        })),
      });
    } catch (error: any) {
      console.error("Error fetching document scans:", error);
      res.status(500).json({
        error: error.message || "Failed to fetch document scans",
      });
    }
  });

  // ==========================================
  // NEIGHBORHOOD INTELLIGENCE
  // ==========================================

  // GET /api/ai/neighborhood/:zipCode - Get neighborhood intelligence
  router.get("/neighborhood/:zipCode", async (req, res) => {
    try {
      const { zipCode } = req.params;

      if (!/^\d{5}$/.test(zipCode)) {
        return res.status(400).json({ error: "Invalid zip code format" });
      }

      // Mock mode: Return mock neighborhood intelligence data
      res.json({
        success: true,
        report: {
          zipCode,
          reportDate: new Date().toISOString().split('T')[0],
          totalJobs: 127,
          avgJobValue: 245.50,
          popularServices: ["junk_removal", "pressure_washing", "gutter_cleaning"],
          seasonalTrends: {
            spring: ["landscaping", "gutter_cleaning"],
            summer: ["pressure_washing", "pool_cleaning"],
            fall: ["leaf_removal", "gutter_cleaning"],
            winter: ["snow_removal", "appliance_removal"]
          },
          competitorPricing: {
            junk_removal: { low: 150, avg: 225, high: 350 },
            pressure_washing: { low: 100, avg: 175, high: 275 }
          },
          marketSaturationScore: 65,
          growthOpportunityScore: 78,
          recommendations: [
            "Focus on pressure washing services in summer months",
            "Bundle gutter cleaning with roof inspection for higher value",
            "Target new residential developments in area"
          ]
        },
        message: "Mock data - configure ANTHROPIC_API_KEY for AI-generated insights"
      });
    } catch (error: any) {
      console.error("Error fetching neighborhood intelligence:", error);
      res.status(500).json({
        error: error.message || "Failed to fetch neighborhood intelligence",
      });
    }
  });

  // GET /api/ai/neighborhood/:zipCode/history - Get historical neighborhood data
  router.get("/neighborhood/:zipCode/history", async (req, res) => {
    try {
      const { zipCode } = req.params;
      const limit = parseInt((req.query.limit as string) || "6");

      if (!/^\d{5}$/.test(zipCode)) {
        return res.status(400).json({ error: "Invalid zip code format" });
      }

      const history = await storage.getNeighborhoodIntelligenceHistory(zipCode, limit);

      res.json({
        success: true,
        history: history.map((report) => ({
          ...report,
          seasonalDemandPatterns: report.seasonalDemandPatterns
            ? JSON.parse(report.seasonalDemandPatterns)
            : null,
          topServiceTypes: report.topServiceTypes ? JSON.parse(report.topServiceTypes) : null,
          recommendedServices: report.recommendedServices
            ? JSON.parse(report.recommendedServices)
            : null,
          recommendedPricing: report.recommendedPricing
            ? JSON.parse(report.recommendedPricing)
            : null,
          marketingInsights: report.marketingInsights
            ? JSON.parse(report.marketingInsights)
            : null,
          dataSources: report.dataSources ? JSON.parse(report.dataSources) : null,
        })),
      });
    } catch (error: any) {
      console.error("Error fetching neighborhood history:", error);
      res.status(500).json({
        error: error.message || "Failed to fetch neighborhood history",
      });
    }
  });

  return router;
}

export default createBusinessFeaturesRoutes;
