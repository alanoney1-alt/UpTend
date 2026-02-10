import type { Express } from "express";
import { storage } from "../../storage";
import { requireAuth } from "../../middleware/auth";
import { requireBusinessTeamAccess } from "../../auth-middleware";

export function registerHoaEsgMetricsRoutes(app: Express) {
  // ==========================================
  // HOA ESG METRICS & REPORTING
  // ==========================================

  // Get aggregated ESG metrics for all properties in HOA portfolio
  app.get("/api/business/:businessAccountId/esg-metrics", requireAuth, requireBusinessTeamAccess("canAccessEsgReports"), async (req, res) => {
    try {
      const { businessAccountId } = req.params;

      // Team access already verified by middleware

      // Get all properties for this business account
      const properties = await storage.getHoaPropertiesByBusinessAccount(businessAccountId);

      if (properties.length === 0) {
        return res.json({
          totalJobsCompleted: 0,
          totalWasteDivertedLbs: 0,
          totalCo2AvoidedLbs: 0,
          totalWaterSavedGallons: 0,
          treesEquivalent: 0,
          diversionRate: 0,
          carbonCreditsEarned: 0,
          carbonCreditsValue: 0,
          propertyBreakdown: [],
          monthlyTrends: [],
        });
      }

      // Get property addresses (for quick lookup)
      const propertyMap = new Map(properties.map(p => [p.id, p.address]));

      // Get all ESG impact logs for properties in this portfolio
      // Note: This requires matching service requests to property addresses
      // For now, we'll use a simpler approach and aggregate by matching addresses

      let totalJobsCompleted = 0;
      let totalWasteDivertedLbs = 0;
      let totalCo2AvoidedLbs = 0;
      let totalWaterSavedGallons = 0;
      let totalRecycledLbs = 0;
      let totalDonatedLbs = 0;
      let totalLandfilledLbs = 0;

      const propertyBreakdown: Map<string, any> = new Map();
      const monthlyData: Map<string, any> = new Map();

      // Initialize property breakdown
      properties.forEach(property => {
        propertyBreakdown.set(property.id, {
          propertyId: property.id,
          address: property.address,
          jobsCompleted: 0,
          wasteDivertedLbs: 0,
          co2AvoidedLbs: 0,
          recycledLbs: 0,
          donatedLbs: 0,
          landfilledLbs: 0,
          diversionRate: 0,
        });
      });

      // Get all service requests and ESG logs
      // In a real implementation, you'd want to filter by property addresses
      // For demonstration, we'll aggregate sample data

      // Sample calculation - in production, query actual ESG impact logs
      for (const property of properties) {
        // Mock data for demonstration
        const jobsForProperty = Math.floor(Math.random() * 10) + 1;
        const wasteDiverted = jobsForProperty * (300 + Math.random() * 200);
        const co2Avoided = wasteDiverted * 0.5;
        const recycled = wasteDiverted * 0.6;
        const donated = wasteDiverted * 0.15;
        const landfilled = wasteDiverted * 0.25;

        totalJobsCompleted += jobsForProperty;
        totalWasteDivertedLbs += wasteDiverted;
        totalCo2AvoidedLbs += co2Avoided;
        totalRecycledLbs += recycled;
        totalDonatedLbs += donated;
        totalLandfilledLbs += landfilled;

        const diversionRate = ((recycled + donated) / (recycled + donated + landfilled)) * 100;

        propertyBreakdown.set(property.id, {
          propertyId: property.id,
          address: property.address,
          jobsCompleted: jobsForProperty,
          wasteDivertedLbs: Math.round(wasteDiverted),
          co2AvoidedLbs: Math.round(co2Avoided),
          diversionRate: Math.round(diversionRate),
        });
      }

      // Calculate water saved (rough estimate: 50 gallons per 100 lbs diverted)
      totalWaterSavedGallons = Math.round((totalWasteDivertedLbs / 100) * 50);

      // Calculate trees equivalent (1 tree = ~48 lbs CO2/year)
      const treesEquivalent = totalCo2AvoidedLbs / 48;

      // Calculate overall diversion rate
      const diversionRate = totalWasteDivertedLbs > 0
        ? ((totalRecycledLbs + totalDonatedLbs) / (totalRecycledLbs + totalDonatedLbs + totalLandfilledLbs)) * 100
        : 0;

      // Calculate carbon credits (1 credit = 1 metric ton CO2)
      const carbonCreditsEarned = (totalCo2AvoidedLbs / 2204.62); // lbs to metric tons
      const carbonCreditsValue = carbonCreditsEarned * 15; // $15 per credit estimate

      // Generate monthly trends (last 6 months)
      const months = ['January', 'February', 'March', 'April', 'May', 'June'];
      const monthlyTrends = months.map((month, index) => {
        const jobsInMonth = Math.floor(totalJobsCompleted / 6 * (0.8 + Math.random() * 0.4));
        const wasteInMonth = (totalWasteDivertedLbs / 6) * (0.8 + Math.random() * 0.4);
        const co2InMonth = (totalCo2AvoidedLbs / 6) * (0.8 + Math.random() * 0.4);

        return {
          month,
          jobsCompleted: jobsInMonth,
          wasteDivertedLbs: Math.round(wasteInMonth),
          co2AvoidedLbs: Math.round(co2InMonth),
        };
      });

      res.json({
        totalJobsCompleted,
        totalWasteDivertedLbs: Math.round(totalWasteDivertedLbs),
        totalCo2AvoidedLbs: Math.round(totalCo2AvoidedLbs),
        totalWaterSavedGallons,
        treesEquivalent: Math.round(treesEquivalent * 10) / 10,
        diversionRate: Math.round(diversionRate),
        carbonCreditsEarned: Math.round(carbonCreditsEarned * 10) / 10,
        carbonCreditsValue: Math.round(carbonCreditsValue),
        propertyBreakdown: Array.from(propertyBreakdown.values()),
        monthlyTrends,
      });
    } catch (error) {
      console.error("Get ESG metrics error:", error);
      res.status(500).json({ error: "Failed to fetch ESG metrics" });
    }
  });

  // Get carbon credits for HOA (detailed breakdown)
  app.get("/api/business/:businessAccountId/carbon-credits", requireAuth, requireBusinessTeamAccess("canAccessEsgReports"), async (req, res) => {
    try {
      const { businessAccountId } = req.params;

      // Team access already verified by middleware

      // Get carbon credits for this business account
      const carbonCredits = await storage.getCarbonCreditsByBusinessAccount(businessAccountId);

      // Aggregate totals
      const totalCredits = carbonCredits.reduce((sum, credit) => sum + (credit.creditsEarned || 0), 0);
      const totalValue = carbonCredits.reduce((sum, credit) => sum + ((credit.creditsEarned || 0) * 15), 0);
      const totalAllocated = carbonCredits.reduce((sum, credit) =>
        sum + (credit.status === 'allocated' ? (credit.creditsEarned || 0) : 0), 0
      );
      const totalAvailable = carbonCredits.reduce((sum, credit) =>
        sum + (credit.status === 'available' ? (credit.creditsEarned || 0) : 0), 0
      );

      res.json({
        totalCredits,
        totalValue,
        totalAllocated,
        totalAvailable,
        credits: carbonCredits,
      });
    } catch (error) {
      console.error("Get carbon credits error:", error);
      res.status(500).json({ error: "Failed to fetch carbon credits" });
    }
  });
}
