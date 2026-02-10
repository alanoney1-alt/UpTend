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

export default router;
