/**
 * ESG Routes Registration
 * Registers all ESG-related endpoints
 */

import type { Express } from "express";
import { requireAuth } from "../../middleware/auth";
import serviceMetricsRoutes from "./service-metrics.routes";
import calculationsRoutes from "./calculations.routes";
import reportsRoutes from "./reports.routes";

export function registerEsgRoutes(app: Express) {
  // Service-specific ESG metrics routes
  app.use("/api/esg", requireAuth, serviceMetricsRoutes);

  // ESG calculation endpoints
  app.use("/api/esg", requireAuth, calculationsRoutes);

  // ESG reporting endpoints
  app.use("/api/esg", requireAuth, reportsRoutes);
}
