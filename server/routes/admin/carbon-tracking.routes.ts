import type { Express } from "express";
import { storage } from "../../storage";
import { requireAuth } from "../../middleware/auth";

export function registerCarbonTrackingRoutes(app: Express) {
  // ==========================================
  // ADMIN CARBON CREDIT TRACKING DASHBOARD
  // ==========================================

  // Get platform-wide carbon tracking analytics
  app.get("/api/admin/carbon-tracking", requireAuth, async (req, res) => {
    try {
      // Check if user is admin
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      // Get platform-wide sustainability stats
      const platformStats = await storage.getPlatformSustainabilityStats();

      // Get all ESG impact logs for detailed analysis
      const esgSummary = await storage.getEsgSummary();

      // Get all carbon credits
      const allHaulers = await storage.getAllHaulers();

      // Calculate per-Pro sustainability scores
      const proScores = await Promise.all(
        allHaulers.map(async (hauler) => {
          const logs = await storage.getEsgImpactLogsByHauler(hauler.id);

          if (logs.length === 0) {
            return {
              proId: hauler.id,
              proName: hauler.haulerInfo?.companyName || hauler.name || "Unknown Pro",
              totalJobs: 0,
              totalWasteLbs: 0,
              recycledLbs: 0,
              donatedLbs: 0,
              landfilledLbs: 0,
              diversionRate: 0,
              co2SavedLbs: 0,
            };
          }

          const totalWasteLbs = logs.reduce((sum, log) =>
            sum + (log.recycledLbs || 0) + (log.donatedLbs || 0) + (log.landfilledLbs || 0) + (log.ewastedLbs || 0), 0
          );

          const recycledLbs = logs.reduce((sum, log) => sum + (log.recycledLbs || 0), 0);
          const donatedLbs = logs.reduce((sum, log) => sum + (log.donatedLbs || 0), 0);
          const landfilledLbs = logs.reduce((sum, log) => sum + (log.landfilledLbs || 0), 0);
          const co2SavedLbs = logs.reduce((sum, log) => sum + (log.carbonSavedLbs || 0), 0);

          const divertedLbs = recycledLbs + donatedLbs;
          const diversionRate = totalWasteLbs > 0 ? (divertedLbs / totalWasteLbs) * 100 : 0;

          return {
            proId: hauler.id,
            proName: hauler.haulerInfo?.companyName || hauler.name || "Unknown Pro",
            totalJobs: logs.length,
            totalWasteLbs,
            recycledLbs,
            donatedLbs,
            landfilledLbs,
            diversionRate,
            co2SavedLbs,
          };
        })
      );

      // Filter out pros with no jobs and sort by diversion rate
      const activeProScores = proScores
        .filter(score => score.totalJobs > 0)
        .sort((a, b) => b.diversionRate - a.diversionRate);

      // Calculate monthly trends (last 6 months)
      const now = new Date();
      const monthlyData = [];

      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        monthlyData.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          monthKey,
          totalJobs: 0,
          co2SavedKg: 0,
          wasteDivertedLbs: 0,
          diversionRate: 0,
        });
      }

      // TODO: Implement actual monthly aggregation from ESG impact logs
      // For now, distribute the totals evenly (placeholder logic)
      const monthCount = monthlyData.length;
      if (platformStats && monthCount > 0) {
        const avgJobsPerMonth = (platformStats.totalJobsAudited || 0) / monthCount;
        const avgCo2PerMonth = (platformStats.totalCo2SavedKg || 0) / monthCount;
        const avgDivertedPerMonth = (platformStats.totalLandfillDivertedLbs || 0) / monthCount;

        monthlyData.forEach(month => {
          month.totalJobs = Math.round(avgJobsPerMonth);
          month.co2SavedKg = avgCo2PerMonth;
          month.wasteDivertedLbs = avgDivertedPerMonth;
          month.diversionRate = platformStats.avgDiversionRate || 0;
        });
      }

      // Calculate carbon credit market value
      const carbonCreditMarketRate = 15; // $15 per metric ton CO2e (conservative estimate)
      const totalMetricTonsCO2e = (platformStats?.totalCo2SavedKg || 0) / 1000;
      const estimatedCreditValue = totalMetricTonsCO2e * carbonCreditMarketRate;

      // Get actual carbon credits from database
      // Note: Carbon credits are generated per service request, need to aggregate
      // For now, return calculated estimate

      res.json({
        overview: {
          totalJobs: platformStats?.totalJobsAudited || 0,
          totalCo2SavedKg: platformStats?.totalCo2SavedKg || 0,
          totalCo2SavedMetricTons: totalMetricTonsCO2e,
          totalWasteDivertedLbs: platformStats?.totalLandfillDivertedLbs || 0,
          totalRecycledLbs: platformStats?.totalRecycledLbs || 0,
          totalDonatedLbs: platformStats?.totalDonatedLbs || 0,
          totalLandfilledLbs: platformStats?.totalLandfilledLbs || 0,
          avgDiversionRate: platformStats?.avgDiversionRate || 0,
          treesEquivalent: platformStats?.treesEquivalent || 0,
          waterSavedGallons: platformStats?.waterSavedGallons || 0,
          estimatedCreditValue,
          carbonCreditMarketRate,
          lastUpdatedAt: platformStats?.updatedAt || new Date().toISOString(),
        },
        monthlyTrends: monthlyData,
        proLeaderboard: activeProScores.slice(0, 20), // Top 20 pros
        totalActivePros: activeProScores.length,
      });
    } catch (error) {
      console.error("Carbon tracking dashboard error:", error);
      res.status(500).json({ error: "Failed to fetch carbon tracking data" });
    }
  });

  // Export carbon tracking data for registry submissions
  app.get("/api/admin/carbon-tracking/export", requireAuth, async (req, res) => {
    try {
      // Check if user is admin
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const platformStats = await storage.getPlatformSustainabilityStats();

      // Generate CSV export format
      const csvRows = [
        ["UpTend Platform Carbon Credit Report"],
        [`Generated: ${new Date().toISOString()}`],
        [],
        ["Metric", "Value", "Unit"],
        ["Total Jobs Audited", platformStats?.totalJobsAudited || 0, "count"],
        ["Total CO2 Saved", (platformStats?.totalCo2SavedKg || 0) / 1000, "metric tons"],
        ["Total Waste Diverted", platformStats?.totalLandfillDivertedLbs || 0, "lbs"],
        ["Recycled Material", platformStats?.totalRecycledLbs || 0, "lbs"],
        ["Donated Material", platformStats?.totalDonatedLbs || 0, "lbs"],
        ["Landfilled Material", platformStats?.totalLandfilledLbs || 0, "lbs"],
        ["Average Diversion Rate", platformStats?.avgDiversionRate || 0, "%"],
        ["Trees Equivalent", platformStats?.treesEquivalent || 0, "trees"],
        ["Water Saved", platformStats?.waterSavedGallons || 0, "gallons"],
        [],
        ["Calculation Method: EPA WARM Model v15"],
        ["Verification: Automated AI + Pro verification photos"],
        ["Certification Status: Platform self-reported"],
      ];

      const csvContent = csvRows.map(row => row.join(",")).join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="uptend-carbon-report-${Date.now()}.csv"`);
      res.send(csvContent);
    } catch (error) {
      console.error("Carbon export error:", error);
      res.status(500).json({ error: "Failed to export carbon tracking data" });
    }
  });
}
