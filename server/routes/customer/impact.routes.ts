import type { Express } from "express";
import { storage } from "../../storage";

export function registerCustomerImpactRoutes(app: Express) {
  // Get customer's aggregated environmental impact
  app.get("/api/my-impact", async (req, res) => {
    try {
      if (!req.user || req.user.role !== "customer") {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Get all ESG impact logs for this customer
      const impactLogs = await storage.getEsgImpactLogsByCustomer((req.user as any).userId || (req.user as any).id);

      // Get all environmental certificates
      const serviceRequests = await storage.getServiceRequestsByCustomer((req.user as any).userId || (req.user as any).id);
      const completedJobs = serviceRequests.filter(r => r.status === "completed");

      // Aggregate data
      const totalJobs = completedJobs.length;

      const totalWeightDiverted = impactLogs.reduce(
        (sum, log) => sum + (log.recycledWeightLbs || 0) + (log.donatedWeightLbs || 0),
        0
      );

      const totalRecycled = impactLogs.reduce(
        (sum, log) => sum + (log.recycledWeightLbs || 0),
        0
      );

      const totalDonated = impactLogs.reduce(
        (sum, log) => sum + (log.donatedWeightLbs || 0),
        0
      );

      const totalLandfilled = impactLogs.reduce(
        (sum, log) => sum + (log.landfilledWeightLbs || 0),
        0
      );

      const totalCarbonOffset = impactLogs.reduce(
        (sum, log) => sum + (log.carbonFootprintLbs || 0),
        0
      );

      // Calculate average diversion rate
      const avgDiversionRate = totalJobs > 0
        ? impactLogs.reduce((sum, log) => sum + (log.diversionRate || 0), 0) / impactLogs.length
        : 0;

      // Calculate trees equivalent (approx 48 lbs CO2 per tree per year)
      const treesEquivalent = totalCarbonOffset / 48;

      // Calculate water saved (recycling saves approx 7,000 gallons per ton)
      const waterSavedGallons = (totalRecycled / 2000) * 7000;

      res.json({
        totalJobs,
        totalWeightDiverted: Math.round(totalWeightDiverted),
        itemsRecycled: Math.round(totalRecycled),
        itemsDonated: Math.round(totalDonated),
        itemsLandfilled: Math.round(totalLandfilled),
        carbonOffsetLbs: Math.round(totalCarbonOffset),
        treesEquivalent: Math.round(treesEquivalent * 10) / 10, // One decimal place
        waterSavedGallons: Math.round(waterSavedGallons),
        diversionRate: Math.round(avgDiversionRate),
        impactLogs: impactLogs.slice(0, 10), // Last 10 jobs
      });
    } catch (error) {
      console.error("Get customer impact error:", error);
      res.status(500).json({ error: "Failed to fetch impact data" });
    }
  });
}
