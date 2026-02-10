import type { Express } from "express";
import propertyRoutes from "./property.routes";
import appliancesRoutes from "./appliances.routes";
import warrantiesRoutes from "./warranties.routes";
import insuranceRoutes from "./insurance.routes";
import documentsRoutes from "./documents.routes";
import healthEventsRoutes from "./health-events.routes";

/**
 * Register Property Intelligence routes
 * All routes for properties, appliances, warranties, insurance, documents, and health events
 */
export function registerPropertyIntelligenceRoutes(app: Express): void {
  app.use("/api", propertyRoutes);
  app.use("/api", appliancesRoutes);
  app.use("/api", warrantiesRoutes);
  app.use("/api", insuranceRoutes);
  app.use("/api", documentsRoutes);
  app.use("/api", healthEventsRoutes);
}
