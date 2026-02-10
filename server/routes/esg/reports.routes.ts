/**
 * ESG Reports API Routes
 *
 * PDF, CSV, and Scope 3 emissions report generation
 */

import { Router } from "express";
import { z } from "zod";
import { storage } from "../../storage";
import { esgReportGenerator } from "../../services/esg-report-generator";

const router = Router();

// ==========================================
// GET /api/esg/reports/scope3
// Generate Scope 3 emissions report
// ==========================================
const scope3Schema = z.object({
  businessAccountId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
});

router.get("/reports/scope3", async (req, res) => {
  try {
    const { businessAccountId, startDate, endDate } = scope3Schema.parse(req.query);

    // Verify user has access to this business account
    // @ts-ignore
    const userId = req.user?.id;
    const membership = await storage.getTeamMemberByUserAndBusiness(userId, businessAccountId);
    if (!membership || !membership.canAccessEsgReports) {
      return res.status(403).json({ error: "Insufficient permissions to access ESG reports" });
    }

    const report = await esgReportGenerator.generateScope3Report(
      businessAccountId,
      startDate,
      endDate
    );

    res.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error("Error generating Scope 3 report:", error);
    res.status(400).json({
      error: error.message || "Failed to generate Scope 3 report",
    });
  }
});

// ==========================================
// GET /api/esg/reports/csv
// Download CSV export of ESG metrics
// ==========================================
router.get("/reports/csv", async (req, res) => {
  try {
    const { businessAccountId, startDate, endDate } = scope3Schema.parse(req.query);

    // Verify access
    // @ts-ignore
    const userId = req.user?.id;
    const membership = await storage.getTeamMemberByUserAndBusiness(userId, businessAccountId);
    if (!membership || !membership.canAccessEsgReports) {
      return res.status(403).json({ error: "Insufficient permissions to access ESG reports" });
    }

    // Fetch all ESG metrics for the business (simplified - would need proper query)
    // For now, return sample data
    const metrics = [
      {
        serviceType: "pressure_washing",
        createdAt: "2024-01-15",
        totalCo2SavedLbs: 15.2,
        totalCo2EmittedLbs: 1.6,
        netCo2ImpactLbs: 13.6,
        waterSavedGallons: 192,
        energySavedKwh: 0,
        esgScore: 87,
        calculationMethod: "EPA WaterSense + EPA Wastewater Treatment Emissions",
      },
    ];

    const csv = esgReportGenerator.generateCsvExport(metrics);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=esg-report-${businessAccountId}.csv`);
    res.send(csv);
  } catch (error: any) {
    console.error("Error generating CSV export:", error);
    res.status(400).json({
      error: error.message || "Failed to generate CSV export",
    });
  }
});

// ==========================================
// GET /api/esg/reports/pdf
// Generate PDF report data
// ==========================================
router.get("/reports/pdf", async (req, res) => {
  try {
    const { businessAccountId, startDate, endDate } = scope3Schema.parse(req.query);

    // Verify access
    // @ts-ignore
    const userId = req.user?.id;
    const membership = await storage.getTeamMemberByUserAndBusiness(userId, businessAccountId);
    if (!membership || !membership.canAccessEsgReports) {
      return res.status(403).json({ error: "Insufficient permissions to access ESG reports" });
    }

    // Get business account
    const businessAccount = await storage.getBusinessAccount(businessAccountId);
    if (!businessAccount) {
      return res.status(404).json({ error: "Business account not found" });
    }

    // Get Scope 3 report
    const scope3Report = await esgReportGenerator.generateScope3Report(
      businessAccountId,
      startDate,
      endDate
    );

    // Get metrics (simplified)
    const metrics = [
      {
        serviceType: "pressure_washing",
        totalCo2SavedLbs: 15.2,
        totalCo2EmittedLbs: 1.6,
        netCo2ImpactLbs: 13.6,
        waterSavedGallons: 192,
        energySavedKwh: 0,
        esgScore: 87,
        calculationMethod: "EPA WaterSense",
      },
    ];

    const pdfData = esgReportGenerator.generatePdfReportData(
      businessAccount,
      metrics,
      scope3Report
    );

    res.json({
      success: true,
      pdfData,
    });
  } catch (error: any) {
    console.error("Error generating PDF report:", error);
    res.status(400).json({
      error: error.message || "Failed to generate PDF report",
    });
  }
});

// ==========================================
// GET /api/esg/reports/certificate
// Generate compliance certificate
// ==========================================
router.get("/reports/certificate", async (req, res) => {
  try {
    const { businessAccountId } = z.object({ businessAccountId: z.string() }).parse(req.query);

    // Verify access
    // @ts-ignore
    const userId = req.user?.id;
    const membership = await storage.getTeamMemberByUserAndBusiness(userId, businessAccountId);
    if (!membership || !membership.canAccessEsgReports) {
      return res.status(403).json({ error: "Insufficient permissions to access ESG reports" });
    }

    // Get business account
    const businessAccount = await storage.getBusinessAccount(businessAccountId);
    if (!businessAccount) {
      return res.status(404).json({ error: "Business account not found" });
    }

    // Get metrics (simplified)
    const metrics = [
      { totalCo2SavedLbs: 15.2, esgScore: 87 },
      { totalCo2SavedLbs: 20.5, esgScore: 92 },
    ];

    const certificate = esgReportGenerator.generateComplianceCertificate(
      businessAccount,
      metrics
    );

    res.json({
      success: true,
      certificate,
    });
  } catch (error: any) {
    console.error("Error generating certificate:", error);
    res.status(400).json({
      error: error.message || "Failed to generate certificate",
    });
  }
});

export default router;
