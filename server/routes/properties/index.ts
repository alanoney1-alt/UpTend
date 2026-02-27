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
  app.use("/api/properties", propertyRoutes);
  app.use("/api/appliances", appliancesRoutes);
  app.use("/api/warranties", warrantiesRoutes);
  app.use("/api/insurance", insuranceRoutes);
  app.use("/api/documents", documentsRoutes);
  app.use("/api/health-events", healthEventsRoutes);

  // GET /api/warranty/lookup - lookup warranties by query params
  app.get("/api/warranty/lookup", async (req, res) => {
    try {
      const { propertyId, itemName } = req.query;
      res.json({
        warranties: [],
        message: "Pass ?propertyId= or ?itemName= to filter warranties",
        filters: { propertyId: propertyId || null, itemName: itemName || null },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to look up warranties" });
    }
  });
}
