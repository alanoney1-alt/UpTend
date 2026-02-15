import type { Express } from "express";
import { storage } from "../../storage";
import { db } from "../../db";
import { esgImpactLogs, serviceRequests } from "@shared/schema";
import { eq, inArray, sql } from "drizzle-orm";
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

      // Match service requests to HOA property addresses
      const propertyAddresses = properties.map(p => p.address);
      const matchedRequests = await db.select({ id: serviceRequests.id, pickupAddress: serviceRequests.pickupAddress })
        .from(serviceRequests)
        .where(inArray(serviceRequests.pickupAddress, propertyAddresses));

      // Build address → serviceRequestIds map
      const addressToRequestIds = new Map<string, string[]>();
      for (const sr of matchedRequests) {
        const list = addressToRequestIds.get(sr.pickupAddress) || [];
        list.push(sr.id);
        addressToRequestIds.set(sr.pickupAddress, list);
      }

      const allRequestIds = matchedRequests.map(r => r.id);

      // Fetch ESG impact logs for all matched service requests
      let esgLogs: typeof esgImpactLogs.$inferSelect[] = [];
      if (allRequestIds.length > 0) {
        esgLogs = await db.select().from(esgImpactLogs)
          .where(inArray(esgImpactLogs.serviceRequestId, allRequestIds));
      }

      // Index ESG logs by serviceRequestId
      const esgByRequest = new Map<string, typeof esgImpactLogs.$inferSelect>();
      for (const log of esgLogs) {
        esgByRequest.set(log.serviceRequestId, log);
      }

      let totalJobsCompleted = 0;
      let totalWasteDivertedLbs = 0;
      let totalCo2AvoidedLbs = 0;
      let totalWaterSavedGallons = 0;
      let totalRecycledLbs = 0;
      let totalDonatedLbs = 0;
      let totalLandfilledLbs = 0;

      const propertyBreakdown: Map<string, any> = new Map();
      const monthlyData: Map<string, { jobs: number; waste: number; co2: number }> = new Map();

      for (const property of properties) {
        const requestIds = addressToRequestIds.get(property.address) || [];
        let propJobs = 0;
        let propWaste = 0;
        let propCo2 = 0;
        let propRecycled = 0;
        let propDonated = 0;
        let propLandfilled = 0;
        let propWater = 0;

        for (const reqId of requestIds) {
          const log = esgByRequest.get(reqId);
          if (!log) continue;
          propJobs++;
          const recycled = (log.recycledWeightLbs || 0);
          const donated = (log.donatedWeightLbs || 0);
          const landfilled = (log.landfilledWeightLbs || 0);
          const diverted = recycled + donated;
          propWaste += diverted;
          propCo2 += (log.carbonSavedLbs || 0);
          propRecycled += recycled;
          propDonated += donated;
          propLandfilled += landfilled;
          propWater += (log.waterSavedGallons || 0);

          // Aggregate monthly trends by createdAt month
          const month = log.createdAt.substring(0, 7); // "YYYY-MM"
          const existing = monthlyData.get(month) || { jobs: 0, waste: 0, co2: 0 };
          existing.jobs++;
          existing.waste += diverted;
          existing.co2 += (log.carbonSavedLbs || 0);
          monthlyData.set(month, existing);
        }

        totalJobsCompleted += propJobs;
        totalWasteDivertedLbs += propWaste;
        totalCo2AvoidedLbs += propCo2;
        totalRecycledLbs += propRecycled;
        totalDonatedLbs += propDonated;
        totalLandfilledLbs += propLandfilled;
        totalWaterSavedGallons += propWater;

        const totalForRate = propRecycled + propDonated + propLandfilled;
        const divRate = totalForRate > 0 ? ((propRecycled + propDonated) / totalForRate) * 100 : 0;

        propertyBreakdown.set(property.id, {
          propertyId: property.id,
          address: property.address,
          jobsCompleted: propJobs,
          wasteDivertedLbs: Math.round(propWaste),
          co2AvoidedLbs: Math.round(propCo2),
          diversionRate: Math.round(divRate),
        });
      }

      // Trees equivalent (1 tree absorbs ~48 lbs CO2/year)
      const treesEquivalent = totalCo2AvoidedLbs / 48;

      // Overall diversion rate
      const totalForRate = totalRecycledLbs + totalDonatedLbs + totalLandfilledLbs;
      const diversionRate = totalForRate > 0
        ? ((totalRecycledLbs + totalDonatedLbs) / totalForRate) * 100
        : 0;

      // Carbon credits (1 credit = 1 metric ton CO2 = 2204.62 lbs)
      const carbonCreditsEarned = totalCo2AvoidedLbs / 2204.62;
      const carbonCreditsValue = carbonCreditsEarned * 15; // $15 per credit estimate

      // Monthly trends sorted chronologically (last 6 months)
      const monthlyTrends = Array.from(monthlyData.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([month, data]) => ({
          month,
          jobsCompleted: data.jobs,
          wasteDivertedLbs: Math.round(data.waste),
          co2AvoidedLbs: Math.round(data.co2),
        }));

      res.json({
        totalJobsCompleted,
        totalWasteDivertedLbs: Math.round(totalWasteDivertedLbs),
        totalCo2AvoidedLbs: Math.round(totalCo2AvoidedLbs),
        totalWaterSavedGallons: Math.round(totalWaterSavedGallons),
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
