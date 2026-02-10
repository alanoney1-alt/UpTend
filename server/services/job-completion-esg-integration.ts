/**
 * Job Completion ESG Integration
 *
 * This service integrates ESG calculation and tracking into the job completion flow.
 * Called after a service request is marked as "completed" to automatically calculate
 * and store environmental impact metrics.
 */

import { EsgStorage } from "../storage/domains/esg/storage";
import { calculateServiceEsg } from "./service-esg-calculators";
import type { ServiceRequest } from "@shared/schema";

const esgStorage = new EsgStorage();

/**
 * Calculate and store ESG metrics for a completed service
 *
 * @param serviceRequest - The completed service request
 * @param completionData - Additional data from job completion (Pro inputs, measurements, etc.)
 * @returns ESG metrics object or null if calculation failed
 */
export async function processEsgForCompletedJob(
  serviceRequest: ServiceRequest,
  completionData: Record<string, any> = {}
): Promise<{
  success: boolean;
  esgMetrics?: any;
  error?: string;
}> {
  try {
    console.log(`[ESG] Processing ESG metrics for job ${serviceRequest.id}, service: ${serviceRequest.serviceType}`);

    // Map job data to calculator parameters
    const calculatorParams = mapJobDataToCalculatorParams(
      serviceRequest.serviceType,
      serviceRequest,
      completionData
    );

    // Skip ESG calculation for services we don't have calculators for yet
    if (!calculatorParams || Object.keys(calculatorParams).length === 0) {
      console.log(`[ESG] No calculator params for service type: ${serviceRequest.serviceType}`);
      return { success: false, error: "Service type not supported for ESG tracking yet" };
    }

    // Calculate ESG metrics using service-specific calculator
    const calculation = await calculateServiceEsg(
      serviceRequest.serviceType,
      calculatorParams
    );

    console.log(`[ESG] Calculation result:`, {
      esgScore: calculation.esgScore,
      netCo2Impact: calculation.netCo2ImpactLbs,
      waterSaved: calculation.waterSavedGallons,
    });

    // Store ESG metrics in database
    const esgMetrics = await esgStorage.createServiceEsgMetrics({
      serviceRequestId: serviceRequest.id,
      serviceType: serviceRequest.serviceType,

      // Water metrics
      waterUsedGallons: calculatorParams.waterUsedGallons || calculation.waterUsedGallons || 0,
      waterSavedGallons: calculation.waterSavedGallons || 0,
      waterEfficiencyPct: calculatorParams.waterEfficiencyPct || 0,

      // Energy metrics
      energyUsedKwh: calculatorParams.energyUsedKwh || 0,
      energySavedKwh: calculation.energySavedKwh || 0,

      // Chemical metrics
      chemicalUsedOz: calculatorParams.chemicalUsedOz || 0,
      chemicalType: calculatorParams.chemicalType || null,
      chemicalCo2ePerOz: calculatorParams.chemicalCo2ePerOz || 0,

      // Material metrics
      materialsSalvagedLbs: calculatorParams.materialsSalvagedLbs || 0,
      salvageRate: calculatorParams.salvageRate || 0,

      // Service-specific metrics
      preventionValue: calculatorParams.preventionValue || 0,
      repairVsReplaceSavings: calculatorParams.repairVsReplaceSavings || 0,
      routeOptimizationSavings: calculatorParams.routeOptimizationSavings || 0,
      carbonSequestered: calculatorParams.carbonSequestered || 0,

      // Aggregated impact (from calculator)
      totalCo2SavedLbs: calculation.totalCo2SavedLbs,
      totalCo2EmittedLbs: calculation.totalCo2EmittedLbs,
      netCo2ImpactLbs: calculation.netCo2ImpactLbs,
      esgScore: calculation.esgScore,

      // Metadata
      calculationMethod: calculation.calculationMethod,
      verificationStatus: "pending",
      calculationDetails: JSON.stringify(calculation.breakdown),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log(`[ESG] ✅ ESG metrics saved successfully for job ${serviceRequest.id}`);

    return {
      success: true,
      esgMetrics: {
        id: esgMetrics.id,
        esgScore: esgMetrics.esgScore,
        netCo2ImpactLbs: esgMetrics.netCo2ImpactLbs,
        waterSavedGallons: esgMetrics.waterSavedGallons,
        calculationMethod: esgMetrics.calculationMethod,
        breakdown: calculation.breakdown,
      },
    };
  } catch (error: any) {
    console.error(`[ESG] ❌ Failed to process ESG metrics for job ${serviceRequest.id}:`, error);

    // Don't fail job completion if ESG calculation fails
    return {
      success: false,
      error: error.message || "ESG calculation failed",
    };
  }
}

/**
 * Map service request data to calculator parameters
 *
 * This function extracts relevant data from the service request and completion data,
 * and transforms it into the format expected by the service-specific ESG calculators.
 */
function mapJobDataToCalculatorParams(
  serviceType: string,
  serviceRequest: ServiceRequest,
  completionData: Record<string, any>
): Record<string, any> | null {
  // Parse completion data (may be stored as JSON string)
  const details = typeof serviceRequest.details === "string"
    ? JSON.parse(serviceRequest.details || "{}")
    : serviceRequest.details || {};

  switch (serviceType) {
    case "pressure_washing":
    case "freshwash":
      return {
        sqft: completionData.sqft || details.totalSqft || details.squareFootage || 1000,
        durationMinutes: completionData.durationMinutes || details.duration || 60,
        actualGPM: completionData.actualGPM || details.waterGPM || 3.0,
        chemicalType: completionData.chemicalType || details.chemicalType || "standard",
        chemicalUsedOz: completionData.chemicalUsedOz || details.chemicalUsed || 0,
        waterReclamation: completionData.waterReclamation || details.waterReclamation || false,
      };

    case "gutter_cleaning":
    case "gutterflush":
      return {
        linearFeet: completionData.linearFeet || details.gutterLinearFeet || details.perimeter || 100,
        debrisDisposalMethod: completionData.debrisDisposal || details.debrisDisposal || "mixed",
        stormPreventionCredit: true, // Always credit for preventative maintenance
      };

    case "pool_cleaning":
    case "poolspark":
      return {
        poolSizeGallons: completionData.poolSize || details.poolGallons || 20000,
        chemicalOptimizationPct: completionData.chemicalOptimization || 0,
        leakDetected: completionData.leakDetected || false,
        leakGallonsPerDaySaved: completionData.leakGallonsSaved || 0,
        filterEfficiencyImprovement: completionData.filterImprovement || false,
      };

    case "home_cleaning":
    case "cleaning":
    case "polishup":
      return {
        sqft: completionData.sqft || details.sqft || details.squareFootage || 1500,
        productType: completionData.productType || details.productType || "eco_friendly",
        productUsedOz: completionData.productUsed || 16,
        waterUsedGallons: completionData.waterUsed || 10,
        reusableClothsUsed: completionData.reusableClothsUsed || 5,
      };

    case "landscaping":
    case "freshcut":
      return {
        lawnSqft: completionData.lawnSqft || details.lawnSqft || 5000,
        treesPlanted: completionData.treesPlanted || 0,
        mulchLbs: completionData.mulchLbs || 0,
        equipmentType: completionData.equipmentType || "gas_mower",
        durationHours: completionData.durationHours || (details.duration ? details.duration / 60 : 2),
        organicFertilizer: completionData.organicFertilizer || false,
      };

    case "handyman":
    case "fixit":
      return {
        repairType: completionData.repairType || details.repairType || "general",
        itemsRepaired: completionData.itemsRepaired || details.itemCount || 1,
        recycledMaterialsLbs: completionData.recycledMaterials || 0,
        preventedReplacement: completionData.preventedReplacement !== false, // Default true
      };

    case "moving_labor":
    case "furniture_moving":
    case "liftcrew":
      return {
        distanceMiles: completionData.distanceMiles || details.distanceMiles || 10,
        truckType: completionData.truckType || details.truckType || "standard",
        reusableBlankets: completionData.reusableBlankets || 20,
        plasticWrapAvoided: completionData.plasticWrapAvoided !== false, // Default true
        reusableBinsUsed: completionData.reusableBins || 10,
        routeOptimized: completionData.routeOptimized !== false, // Default true
      };

    case "carpet_cleaning":
    case "deepfiber":
      return {
        sqft: completionData.carpetSqft || details.carpetSqft || details.sqft || 1000,
        method: completionData.method || details.cleaningMethod || "hot_water_extraction",
        ecoFriendlyProducts: completionData.ecoFriendly !== false, // Default true
        carpetLifeExtension: true, // Always credit for maintenance
      };

    case "light_demolition":
    case "teardown":
      return {
        totalWeightLbs: completionData.totalWeight || details.totalWeightLbs || 1000,
        woodSalvagedLbs: completionData.woodSalvaged || details.woodSalvaged || 0,
        metalSalvagedLbs: completionData.metalSalvaged || details.metalSalvaged || 0,
        concreteSalvagedLbs: completionData.concreteSalvaged || details.concreteSalvaged || 0,
        method: completionData.method || details.demolitionMethod || "standard_demolition",
        hazmatProperlyDisposed: completionData.hazmatDisposed || false,
      };

    case "junk_removal":
    case "bulksnap":
      return {
        totalWeightLbs: completionData.totalWeight || details.totalWeightLbs || 500,
        recycledWeightLbs: completionData.recycledWeight || details.recycledWeightLbs || 0,
        donatedWeightLbs: completionData.donatedWeight || details.donatedWeightLbs || 0,
        ewasteWeightLbs: completionData.ewasteWeight || details.ewasteWeightLbs || 0,
        haulDistanceMiles: completionData.haulDistance || details.haulDistanceMiles || 10,
      };

    default:
      // Service type not supported for ESG tracking yet
      console.log(`[ESG] Service type ${serviceType} not mapped to ESG calculator`);
      return null;
  }
}

/**
 * Get ESG metrics for a completed job (for display to customer)
 */
export async function getJobEsgMetrics(serviceRequestId: string) {
  try {
    const metrics = await esgStorage.getServiceEsgMetricsByRequest(serviceRequestId);

    if (!metrics) {
      return null;
    }

    const details = metrics.calculationDetails
      ? JSON.parse(metrics.calculationDetails)
      : {};

    return {
      esgScore: metrics.esgScore,
      netCo2ImpactLbs: metrics.netCo2ImpactLbs,
      waterSavedGallons: metrics.waterSavedGallons,
      energySavedKwh: metrics.energySavedKwh,
      calculationMethod: metrics.calculationMethod,
      breakdown: details,

      // Friendly display values
      treesEquivalent: Math.round((metrics.netCo2ImpactLbs || 0) / 48), // 1 tree = ~48 lbs CO2/year
      milesNotDriven: Math.round((metrics.netCo2ImpactLbs || 0) / 0.9), // ~0.9 lbs CO2/mile
    };
  } catch (error) {
    console.error("[ESG] Failed to get job ESG metrics:", error);
    return null;
  }
}

/**
 * Format ESG metrics for customer display
 */
export function formatEsgMetricsForDisplay(metrics: any): string {
  if (!metrics) {
    return "Environmental impact data not available for this service yet.";
  }

  const parts: string[] = [];

  // CO2 impact
  if (metrics.netCo2ImpactLbs > 0) {
    parts.push(`✅ Reduced CO2 emissions by ${Math.round(metrics.netCo2ImpactLbs)} lbs`);

    if (metrics.treesEquivalent > 0) {
      parts.push(`   (equivalent to planting ${metrics.treesEquivalent} tree${metrics.treesEquivalent > 1 ? 's' : ''})`);
    }
  }

  // Water savings
  if (metrics.waterSavedGallons > 0) {
    parts.push(`💧 Saved ${Math.round(metrics.waterSavedGallons)} gallons of water`);
  }

  // Energy savings
  if (metrics.energySavedKwh > 0) {
    parts.push(`⚡ Saved ${Math.round(metrics.energySavedKwh)} kWh of energy`);
  }

  // ESG score
  parts.push(`⭐ ESG Score: ${metrics.esgScore}/100`);

  return parts.join('\n');
}

export default {
  processEsgForCompletedJob,
  getJobEsgMetrics,
  formatEsgMetricsForDisplay,
};
