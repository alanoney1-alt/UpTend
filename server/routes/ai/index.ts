/**
 * AI Features Router - Central Hub
 *
 * Aggregates all AI feature routes into a single router
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

export function createAiRoutes(storage: DatabaseStorage) {
  const router = Router();

  // Mount all AI feature routes under /api/ai
  router.use("/ai", createConciergeRoutes(storage));
  router.use("/ai", createPhotoQuoteRoutes(storage));
  router.use("/ai", createSeasonalAdvisorRoutes(storage));
  router.use("/ai", createSmartSchedulingRoutes(storage));
  router.use("/ai", createProFeaturesRoutes(storage));
  router.use("/ai", createBusinessFeaturesRoutes(storage));

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
