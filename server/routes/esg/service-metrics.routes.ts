/**
 * Service-Specific ESG Metrics API Routes
 *
 * Endpoints:
 * - POST /api/esg/service-metrics - Create ESG metrics for a service
 * - GET /api/esg/service-metrics/:serviceRequestId - Get metrics by service request
 * - GET /api/esg/service-types/:serviceType/aggregate - Get aggregated metrics by service type
 */

import { Router } from "express";
import { z } from "zod";
import { EsgStorage } from "../../storage/domains/esg/storage";
import { calculateServiceEsg } from "../../services/service-esg-calculators";

const router = Router();
const esgStorage = new EsgStorage();

// ==========================================
// POST /api/esg/service-metrics
// Create ESG metrics for a completed service
// ==========================================
const createServiceMetricsSchema = z.object({
  serviceRequestId: z.string(),
  serviceType: z.string(),
  calculationParams: z.record(z.any()),
  verificationStatus: z.enum(["pending", "verified", "audited"]).optional(),
});

router.post("/service-metrics", async (req, res) => {
  try {
    const validated = createServiceMetricsSchema.parse(req.body);

    // Calculate ESG metrics using service-specific calculator
    const calculation = await calculateServiceEsg(
      validated.serviceType,
      validated.calculationParams
    );

    // Store metrics in database
    const metrics = await esgStorage.createServiceEsgMetrics({
      serviceRequestId: validated.serviceRequestId,
      serviceType: validated.serviceType,
      waterUsedGallons: validated.calculationParams.actualWaterUsedGallons || calculation.waterUsedGallons || 0,
      waterSavedGallons: calculation.waterSavedGallons || 0,
      waterEfficiencyPct: validated.calculationParams.waterEfficiency || 0,
      energyUsedKwh: validated.calculationParams.energyUsedKwh || 0,
      energySavedKwh: calculation.energySavedKwh || 0,
      chemicalUsedOz: validated.calculationParams.chemicalUsedOz || 0,
      chemicalType: validated.calculationParams.chemicalType || null,
      chemicalCo2ePerOz: validated.calculationParams.chemicalCo2ePerOz || 0,
      materialsSalvagedLbs: validated.calculationParams.materialsSalvagedLbs || 0,
      salvageRate: validated.calculationParams.salvageRate || 0,
      preventionValue: validated.calculationParams.preventionValue || 0,
      repairVsReplaceSavings: validated.calculationParams.repairVsReplaceSavings || 0,
      routeOptimizationSavings: validated.calculationParams.routeOptimizationSavings || 0,
      carbonSequestered: validated.calculationParams.carbonSequestered || 0,
      totalCo2SavedLbs: calculation.totalCo2SavedLbs,
      totalCo2EmittedLbs: calculation.totalCo2EmittedLbs,
      netCo2ImpactLbs: calculation.netCo2ImpactLbs,
      esgScore: calculation.esgScore,
      calculationMethod: calculation.calculationMethod,
      verificationStatus: validated.verificationStatus || "pending",
      calculationDetails: JSON.stringify(calculation.breakdown),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      metrics,
      calculation,
    });
  } catch (error: any) {
    console.error("Error creating service ESG metrics:", error);
    res.status(400).json({
      error: error.message || "Failed to create service ESG metrics",
    });
  }
});

// ==========================================
// GET /api/esg/service-metrics/:serviceRequestId
// Get ESG metrics for a specific service request
// ==========================================
router.get("/service-metrics/:serviceRequestId", async (req, res) => {
  try {
    const { serviceRequestId } = req.params;

    const metrics = await esgStorage.getServiceEsgMetricsByRequest(serviceRequestId);

    if (!metrics) {
      return res.status(404).json({
        error: "ESG metrics not found for this service request",
      });
    }

    // Parse calculation details if present
    const calculationDetails = metrics.calculationDetails
      ? JSON.parse(metrics.calculationDetails)
      : null;

    res.json({
      success: true,
      metrics: {
        ...metrics,
        calculationDetails,
      },
    });
  } catch (error: any) {
    console.error("Error fetching service ESG metrics:", error);
    res.status(500).json({
      error: error.message || "Failed to fetch service ESG metrics",
    });
  }
});

// ==========================================
// GET /api/esg/service-types/:serviceType/aggregate
// Get aggregated ESG metrics by service type
// ==========================================
const aggregateQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  verificationStatus: z.enum(["pending", "verified", "audited"]).optional(),
});

router.get("/service-types/:serviceType/aggregate", async (req, res) => {
  try {
    const { serviceType } = req.params;
    const query = aggregateQuerySchema.parse(req.query);

    // Get aggregate stats
    const aggregate = await esgStorage.getServiceEsgAggregateByType(serviceType);

    // Get detailed metrics with filters
    const metrics = await esgStorage.getServiceEsgMetricsByType(serviceType, {
      startDate: query.startDate,
      endDate: query.endDate,
      verificationStatus: query.verificationStatus,
    });

    res.json({
      success: true,
      serviceType,
      aggregate,
      metrics: metrics.map((m) => ({
        ...m,
        calculationDetails: m.calculationDetails ? JSON.parse(m.calculationDetails) : null,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching service type aggregate:", error);
    res.status(500).json({
      error: error.message || "Failed to fetch service type aggregate",
    });
  }
});

// ==========================================
// PUT /api/esg/service-metrics/:id
// Update ESG metrics (e.g., verification status, recalculation)
// ==========================================
const updateServiceMetricsSchema = z.object({
  verificationStatus: z.enum(["pending", "verified", "audited"]).optional(),
  recalculate: z.boolean().optional(),
  calculationParams: z.record(z.any()).optional(),
});

router.put("/service-metrics/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const validated = updateServiceMetricsSchema.parse(req.body);

    // Get existing metrics
    const existing = await esgStorage.getServiceEsgMetricsByRequest(id);
    if (!existing) {
      return res.status(404).json({ error: "ESG metrics not found" });
    }

    let updates: any = {};

    // Update verification status
    if (validated.verificationStatus) {
      updates.verificationStatus = validated.verificationStatus;
    }

    // Recalculate if requested
    if (validated.recalculate && validated.calculationParams) {
      const calculation = await calculateServiceEsg(
        existing.serviceType,
        validated.calculationParams
      );

      updates = {
        ...updates,
        totalCo2SavedLbs: calculation.totalCo2SavedLbs,
        totalCo2EmittedLbs: calculation.totalCo2EmittedLbs,
        netCo2ImpactLbs: calculation.netCo2ImpactLbs,
        esgScore: calculation.esgScore,
        calculationMethod: calculation.calculationMethod,
        calculationDetails: JSON.stringify(calculation.breakdown),
      };
    }

    const updatedMetrics = await esgStorage.updateServiceEsgMetrics(id, updates);

    res.json({
      success: true,
      metrics: updatedMetrics,
    });
  } catch (error: any) {
    console.error("Error updating service ESG metrics:", error);
    res.status(400).json({
      error: error.message || "Failed to update service ESG metrics",
    });
  }
});

// ==========================================
// GET /api/esg/service-types/aggregate/all
// Get aggregated ESG metrics for all service types
// ==========================================
router.get("/service-types/aggregate/all", async (req, res) => {
  try {
    const query = aggregateQuerySchema.parse(req.query);

    // Get aggregate for all service types
    const aggregates = await esgStorage.getServiceEsgAggregateAll({
      startDate: query.startDate,
      endDate: query.endDate,
      verificationStatus: query.verificationStatus,
    });

    res.json({
      success: true,
      data: aggregates,
    });
  } catch (error: any) {
    console.error("Error fetching all service type aggregates:", error);
    res.status(500).json({
      error: error.message || "Failed to fetch all service type aggregates",
    });
  }
});

// ==========================================
// GET /api/esg/summary
// Get platform-wide ESG summary (used by esg-impact-dashboard)
// ==========================================
router.get("/summary", async (_req, res) => {
  try {
    const summary = await esgStorage.getEsgSummary();
    res.json(summary);
  } catch (error: any) {
    console.error("Error fetching ESG summary:", error);
    res.status(500).json({ error: error.message || "Failed to fetch ESG summary" });
  }
});

// ==========================================
// GET /api/esg/impact/:serviceRequestId
// Get ESG impact log for a specific service request
// ==========================================
router.get("/impact/:serviceRequestId", async (req, res) => {
  try {
    const { serviceRequestId } = req.params;
    const log = await esgStorage.getEsgImpactLogByRequest(serviceRequestId);
    if (!log) {
      return res.status(404).json({ error: "ESG impact log not found" });
    }
    res.json(log);
  } catch (error: any) {
    console.error("Error fetching ESG impact log:", error);
    res.status(500).json({ error: error.message || "Failed to fetch ESG impact log" });
  }
});

// ==========================================
// GET /api/esg/customer/:customerId
// Get all ESG impact logs for a customer
// ==========================================
router.get("/customer/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;
    const logs = await esgStorage.getEsgImpactLogsByCustomer(customerId);
    res.json(logs);
  } catch (error: any) {
    console.error("Error fetching customer ESG logs:", error);
    res.status(500).json({ error: error.message || "Failed to fetch customer ESG logs" });
  }
});

// ==========================================
// GET /api/esg/reports/:businessAccountId
// Get ESG reports for a business account
// ==========================================
router.get("/reports/:businessAccountId", async (req, res) => {
  try {
    const { businessAccountId } = req.params;
    const reports = await esgStorage.getEsgReportsByBusiness(businessAccountId);
    res.json(reports);
  } catch (error: any) {
    console.error("Error fetching ESG reports:", error);
    res.status(500).json({ error: error.message || "Failed to fetch ESG reports" });
  }
});

// ==========================================
// POST /api/esg/generate-report
// Generate a new ESG report for a business account
// ==========================================
const generateReportSchema = z.object({
  businessAccountId: z.string(),
  month: z.number().min(1).max(12),
  year: z.number(),
});

router.post("/generate-report", async (req, res) => {
  try {
    const { businessAccountId, month, year } = generateReportSchema.parse(req.body);

    // Get metrics for the specified month
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

    const metrics = await esgStorage.getAllServiceEsgMetrics({
      startDate,
      endDate,
    });

    const totalCo2SavedLbs = metrics.reduce((sum, m) => sum + (m.totalCo2SavedLbs || 0), 0);
    const totalWaterSaved = metrics.reduce((sum, m) => sum + (m.waterSavedGallons || 0), 0);
    const totalEnergySaved = metrics.reduce((sum, m) => sum + (m.energySavedKwh || 0), 0);
    const co2SavedKg = totalCo2SavedLbs * 0.453592;

    // Create the report
    const report = await esgStorage.createEsgReport({
      businessAccountId,
      reportMonth: month,
      reportYear: year,
      totalJobsCount: metrics.length,
      co2SavedKg: parseFloat(co2SavedKg.toFixed(2)),
      landfillDiversionLbs: 0,
      taxCreditsUnlockedUsd: parseFloat((co2SavedKg * 0.05).toFixed(2)),
      waterSavedGallons: parseFloat(totalWaterSaved.toFixed(2)),
      energySavedKwh: parseFloat(totalEnergySaved.toFixed(2)),
      totalCarbonFootprintLbs: metrics.reduce((sum, m) => sum + (m.totalCo2EmittedLbs || 0), 0),
      deadheadMilesSaved: 0,
      circularEconomyLbs: 0,
      auditReady: true,
      reportData: JSON.stringify({ metrics: metrics.length }),
      generatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    // Build the ledger response the frontend expects
    const ledger = {
      co2_saved_kg: co2SavedKg,
      landfill_diversion_lbs: 0,
      tax_credits_unlocked_usd: co2SavedKg * 0.05,
      water_saved_gallons: totalWaterSaved,
      energy_saved_kwh: totalEnergySaved,
      total_jobs: metrics.length,
    };

    res.json({
      success: true,
      report,
      ledger,
    });
  } catch (error: any) {
    console.error("Error generating ESG report:", error);
    res.status(400).json({ error: error.message || "Failed to generate ESG report" });
  }
});

export default router;
