/**
 * AI Features Router - Central Hub
 *
 * Aggregates all 13 AI feature routes into a single router
 */

import { Router, type Express } from "express";
import type { DatabaseStorage } from "../../storage/impl/database-storage";
import { storage } from "../../storage";
import createConciergeRoutes from "./concierge.routes";
import createPhotoQuoteRoutes from "./photo-quote.routes";
import createSeasonalAdvisorRoutes from "./seasonal-advisor.routes";
import createSmartSchedulingRoutes from "./smart-scheduling.routes";
import createProFeaturesRoutes from "./pro-features.routes";
import createBusinessFeaturesRoutes from "./business-features.routes";
import createDocumentScannerRoutes from "./document-scanner.routes";
import createInventoryEstimatorRoutes from "./inventory-estimator.routes";
import createFraudDetectionRoutes from "./fraud-detection.routes";
import createMarketingContentRoutes from "./marketing-content.routes";
import createVoiceBookingRoutes from "./voice-booking.routes";
import createNeighborhoodIntelligenceRoutes from "./neighborhood-intelligence.routes";
import createProTierEngineRoutes from "./pro-tier-engine.routes";
import createDispatchIntelligenceRoutes from "./dispatch-intelligence.routes";
import createDynamicPricingRoutes from "./dynamic-pricing.routes";
import createDiscountEngineRoutes from "./discount-engine.routes";
import createGuideRoutes from "./guide.routes";

export function createAiRoutes(storage: DatabaseStorage) {
  const router = Router();

  // Home Score endpoint - alias for /api/home-score with userId param support
  router.get("/ai/home-score/:userId?", async (req, res) => {
    try {
      const userId = req.params.userId || (req.user as any)?.userId || (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Try DB lookup
      try {
        const { db } = await import("../../db");
        const { sql } = await import("drizzle-orm");
        const result = await db.execute(sql`
          SELECT * FROM home_scores WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 1
        `);
        if (result.rows && result.rows.length > 0) {
          const row: any = result.rows[0];
          return res.json({
            totalScore: row.total_score || 650,
            maintenanceHealth: row.maintenance_health || 70,
            documentationHealth: row.documentation_health || 60,
            safetyHealth: row.safety_health || 80,
            label: row.label || "Good",
            percentile: row.percentile || 65,
            history: [],
          });
        }
      } catch {
        // Table may not exist
      }

      // Default response
      res.json({
        totalScore: 650,
        maintenanceHealth: 70,
        documentationHealth: 60,
        safetyHealth: 80,
        label: "Good",
        percentile: 65,
        history: [],
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Mount all AI feature routes under /api/ai
  // Concierge chat alias for React Native app: /api/ai/concierge/chat → /api/ai/chat
  const conciergeRoutes = createConciergeRoutes(storage);
  router.use("/ai", conciergeRoutes);                          // #9  AI Concierge
  router.use("/ai/concierge", conciergeRoutes);                // React Native alias
  router.use("/ai", createPhotoQuoteRoutes(storage));          // #10 Photo-to-Quote
  router.use("/ai", createSeasonalAdvisorRoutes(storage));     // #11 Seasonal Advisor
  router.use("/ai", createSmartSchedulingRoutes(storage));     // #12 Smart Scheduling
  router.use("/ai", createProFeaturesRoutes(storage));         // #15 Route Optimizer + #17 Quality Scoring
  router.use("/ai", createBusinessFeaturesRoutes(storage));    // #13 Move-In Wizard + #20 Portfolio Dashboard
  router.use("/ai", createDocumentScannerRoutes(storage));     // #14 Document Scanner
  router.use("/ai", createInventoryEstimatorRoutes(storage));  // #18 Inventory Estimator
  router.use("/ai", createFraudDetectionRoutes(storage));      // #22 Fraud Detection
  router.use("/ai", createMarketingContentRoutes(storage));    // #23 Marketing Content
  router.use("/ai", createVoiceBookingRoutes(storage));        // #24 Voice Booking
  router.use("/ai", createNeighborhoodIntelligenceRoutes(storage)); // #25 Neighborhood Intelligence
  router.use("/ai", createProTierEngineRoutes(storage));             // Pro Tier Engine
  router.use("/ai", createDispatchIntelligenceRoutes(storage));      // Dispatch Intelligence
  router.use("/ai", createDynamicPricingRoutes(storage));           // #26 Dynamic Pricing
  router.use("/ai", createDiscountEngineRoutes(storage));           // #27 Discount Engine
  router.use("/ai", createGuideRoutes(storage));                   // UpTend Guide Assistant

  return router;
}

/**
 * Register all AI capability routes
 */
export function registerAiCapabilityRoutes(app: Express) {
  const aiRouter = createAiRoutes(storage);
  app.use("/api", aiRouter);
}

export default createAiRoutes;
