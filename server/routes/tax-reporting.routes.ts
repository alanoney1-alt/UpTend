/**
 * Tax Reporting Routes
 * Monthly, quarterly, annual reports and 1099-K data for pros and business partners.
 */

import type { Express, Request, Response } from "express";
import {
  generateMonthlyReport,
  generateQuarterlySummary,
  generateAnnualSummary,
  generate1099Data,
  monthlyReportToCSV,
  annualExportToCSV,
} from "../services/tax-reporting";

function getUserId(req: Request): string | null {
  if (!req.isAuthenticated?.() || !req.user) return null;
  return (req.user as any).userId || (req.user as any).id;
}

export function registerTaxReportingRoutes(app: Express) {
  // GET /api/tax/monthly/:year/:month
  app.get("/api/tax/monthly/:year/:month", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    try {
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ error: "Invalid year or month" });
      }

      const report = await generateMonthlyReport(userId, month, year);

      if (req.query.format === "csv") {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=uptend-tax-${year}-${String(month).padStart(2, "0")}.csv`);
        return res.send(monthlyReportToCSV(report));
      }

      res.json(report);
    } catch (error: any) {
      console.error("Tax monthly report error:", error);
      res.status(500).json({ error: "Failed to generate monthly report" });
    }
  });

  // GET /api/tax/quarterly/:year/:quarter
  app.get("/api/tax/quarterly/:year/:quarter", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    try {
      const year = parseInt(req.params.year);
      const quarter = parseInt(req.params.quarter);
      if (isNaN(year) || isNaN(quarter) || quarter < 1 || quarter > 4) {
        return res.status(400).json({ error: "Invalid year or quarter" });
      }

      const summary = await generateQuarterlySummary(userId, quarter, year);
      res.json(summary);
    } catch (error: any) {
      console.error("Tax quarterly report error:", error);
      res.status(500).json({ error: "Failed to generate quarterly report" });
    }
  });

  // GET /api/tax/annual/:year
  app.get("/api/tax/annual/:year", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    try {
      const year = parseInt(req.params.year);
      if (isNaN(year)) return res.status(400).json({ error: "Invalid year" });

      const summary = await generateAnnualSummary(userId, year);
      res.json(summary);
    } catch (error: any) {
      console.error("Tax annual report error:", error);
      res.status(500).json({ error: "Failed to generate annual report" });
    }
  });

  // GET /api/tax/1099/:year
  app.get("/api/tax/1099/:year", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    try {
      const year = parseInt(req.params.year);
      if (isNaN(year)) return res.status(400).json({ error: "Invalid year" });

      const data = await generate1099Data(userId, year);
      res.json(data);
    } catch (error: any) {
      console.error("Tax 1099 report error:", error);
      res.status(500).json({ error: "Failed to generate 1099 data" });
    }
  });

  // GET /api/tax/export/:year — downloadable CSV with all transactions
  app.get("/api/tax/export/:year", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    try {
      const year = parseInt(req.params.year);
      if (isNaN(year)) return res.status(400).json({ error: "Invalid year" });

      const reports = [];
      for (let m = 1; m <= 12; m++) {
        reports.push(await generateMonthlyReport(userId, m, year));
      }

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=uptend-tax-export-${year}.csv`);
      res.send(annualExportToCSV(reports));
    } catch (error: any) {
      console.error("Tax export error:", error);
      res.status(500).json({ error: "Failed to export tax data" });
    }
  });
}
