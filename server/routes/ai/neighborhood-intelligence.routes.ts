/**
 * AI Neighborhood Intelligence API Routes (#25)
 *
 * Aggregated, anonymized insights by geography. The "data moat" product.
 *
 * Endpoints:
 * - GET /api/ai/intelligence/neighborhoods - List available reports
 * - GET /api/ai/intelligence/neighborhoods/:zipCode - Get specific report
 * - POST /api/ai/intelligence/generate/:zipCode - Generate/refresh report
 */

import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../auth-middleware";
import type { DatabaseStorage } from "../../storage/impl/database-storage";
import { nanoid } from "nanoid";

export function createNeighborhoodIntelligenceRoutes(storage: DatabaseStorage) {
  const router = Router();

  // GET /api/ai/intelligence/neighborhoods
  router.get("/intelligence/neighborhoods", async (req, res) => {
    try {
      const zipCode = (req.query.zipCode as string) || "32801";
      const reports = await storage.getNeighborhoodIntelligenceHistory(zipCode, 50);
      res.json({ success: true, reports });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/ai/intelligence/neighborhoods/:zipCode
  router.get("/intelligence/neighborhoods/:zipCode", async (req, res) => {
    try {
      const { zipCode } = req.params;
      if (!/^\d{5}$/.test(zipCode)) {
        return res.status(400).json({ error: "Invalid zip code" });
      }

      const report = await storage.getLatestNeighborhoodIntelligence(zipCode);
      if (!report) {
        return res.status(404).json({ error: "No report available for this zip code" });
      }

      res.json({ success: true, report });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/ai/intelligence/generate/:zipCode - Admin: generate report
  router.post("/intelligence/generate/:zipCode", requireAuth, async (req, res) => {
    try {
      const { zipCode } = req.params;
      if (!/^\d{5}$/.test(zipCode)) {
        return res.status(400).json({ error: "Invalid zip code" });
      }

      // Aggregate data from completed jobs in this zip code
      // Aggregate job stats for this zip (simplified — future: full aggregation query)
      const jobStats = { totalProperties: 0, avgHealthScore: null, topServices: [], avgDiversionRate: null, totalCo2Saved: null, avgSpend: null };

      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
      const periodEnd = now.toISOString();

      const report = await storage.createNeighborhoodIntelligence({
        id: nanoid(),
        zipCode,
        neighborhood: null,
        city: "Orlando",
        state: "FL",
        periodStart,
        periodEnd,
        totalPropertiesAnalyzed: jobStats?.totalProperties || 0,
        totalJobsAnalyzed: 0,
        averageHealthScore: jobStats?.avgHealthScore || null,
        topMaintenanceIssues: null,
        serviceDemandByType: null,
        seasonalPatterns: null,
        avgDiversionRate: jobStats?.avgDiversionRate || null,
        avgCo2SavedPerJob: null,
        sustainabilityTrend: null,
        averageSpendPerHome: jobStats?.avgSpend || null,
        reportPdfUrl: null,
        isPublic: false,
        createdAt: new Date().toISOString(),
        reportPeriod: "quarterly",
      });

      res.json({ success: true, report });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}

export default createNeighborhoodIntelligenceRoutes;
