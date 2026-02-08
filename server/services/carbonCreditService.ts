/**
 * Carbon Credit Calculation Service
 *
 * Based on EPA WARM (Waste Reduction Model) methodology
 * Calculates carbon credits (CO2e) from waste diversion
 *
 * Standard: 1 Carbon Credit = 1 Metric Ton CO2e avoided
 *
 * Market Value (as of 2024):
 * - Voluntary carbon market: $10-30/ton CO2e
 * - Compliance market: $30-80/ton CO2e
 * - Premium verified credits: $50-150/ton CO2e
 */

import { storage } from "../storage";

// EPA WARM Model conversion factors (Metric Tons CO2e per Ton of material)
// These represent the GHG emissions AVOIDED by diverting waste from landfill
const MATERIAL_CO2E_FACTORS = {
  // High-impact materials
  paper_cardboard: 3.46,      // Recycling paper avoids logging + manufacturing
  metals_aluminum: 9.13,      // Aluminum recycling is extremely carbon-efficient
  metals_steel: 1.57,         // Steel recycling avoids mining + smelting
  plastics_pet: 2.07,         // Plastics recycling avoids petroleum extraction
  plastics_hdpe: 1.82,
  plastics_mixed: 1.50,       // Mixed plastics (lower because some aren't recyclable)

  // Medium-impact materials
  wood_lumber: 2.13,          // Reusing wood avoids logging + processing
  furniture_wood: 0.98,       // Wood furniture (partially recyclable)
  furniture_metal: 1.20,      // Metal furniture
  glass: 0.31,                // Glass recycling (less impactful but still valuable)
  textiles: 5.24,             // Textile recycling/donation (high manufacturing footprint)

  // Lower-impact materials
  food_waste: 0.12,           // Composting vs landfill (biodegrades either way, but composting is cleaner)
  yard_waste: 0.15,           // Composting yard waste
  mixed_waste: 2.00,          // Default for unspecified mixed waste

  // Electronics (e-waste)
  electronics_large: 0.47,    // Large appliances
  electronics_small: 0.20,    // Small electronics

  // Construction materials
  concrete: 0.01,             // Concrete (low GHG impact, but diversion saves landfill space)
  drywall: 0.04,              // Drywall
  carpet: 5.70,               // Carpet recycling (high manufacturing footprint)
};

// Carbon credit market pricing (USD per metric ton CO2e)
export const CARBON_CREDIT_MARKET_VALUE = {
  voluntary_low: 10,          // Low-end voluntary market
  voluntary_avg: 20,          // Average voluntary market
  voluntary_high: 30,         // Premium voluntary credits
  compliance_avg: 50,         // Compliance market average
  verified_premium: 100,      // Premium verified credits (Gold Standard, Verra)
};

interface CarbonCreditCalculation {
  creditsGenerated: number;        // Metric tons CO2e
  marketValueLow: number;          // USD (conservative estimate)
  marketValueAvg: number;          // USD (average market rate)
  marketValueHigh: number;         // USD (optimistic estimate)
  wasteWeightLbs: number;
  wasteWeightTons: number;
  diversionRate: number;           // % of waste diverted from landfill
  calculationMethod: string;
  breakdown: {
    materialType: string;
    weightLbs: number;
    co2eFactor: number;
    creditsGenerated: number;
  }[];
}

/**
 * Calculate carbon credits from a completed job
 * Uses waste categorization from ESG tracking + EPA WARM factors
 */
export async function calculateCarbonCreditsForJob(
  serviceRequestId: string
): Promise<CarbonCreditCalculation> {
  // Get the ESG impact log for this job
  const esgLogs = await storage.getEsgImpactLogsByRequest(serviceRequestId);

  if (esgLogs.length === 0) {
    // No ESG data, use conservative default estimation
    return calculateDefaultCredits(serviceRequestId);
  }

  const breakdown: CarbonCreditCalculation['breakdown'] = [];
  let totalCredits = 0;
  let totalWeightLbs = 0;
  let totalDivertedLbs = 0;

  // Calculate credits for each material type
  for (const log of esgLogs) {
    const weightLbs = log.recyclePoundsReported || 0 +
                     (log.donatePoundsReported || 0) +
                     (log.landfillPoundsReported || 0);

    const divertedLbs = (log.recyclePoundsReported || 0) +
                        (log.donatePoundsReported || 0);

    totalWeightLbs += weightLbs;
    totalDivertedLbs += divertedLbs;

    if (divertedLbs > 0) {
      // Determine material type and CO2e factor
      const materialType = determineMaterialType(log.disposalCategory);
      const co2eFactor = MATERIAL_CO2E_FACTORS[materialType] || MATERIAL_CO2E_FACTORS.mixed_waste;

      // Convert pounds to metric tons (1 ton = 2204.62 lbs)
      const weightTons = divertedLbs / 2204.62;
      const credits = weightTons * co2eFactor;

      totalCredits += credits;

      breakdown.push({
        materialType,
        weightLbs: divertedLbs,
        co2eFactor,
        creditsGenerated: credits,
      });
    }
  }

  const diversionRate = totalWeightLbs > 0 ? (totalDivertedLbs / totalWeightLbs) : 0;

  return {
    creditsGenerated: Math.round(totalCredits * 1000) / 1000, // Round to 3 decimal places
    marketValueLow: Math.round(totalCredits * CARBON_CREDIT_MARKET_VALUE.voluntary_low),
    marketValueAvg: Math.round(totalCredits * CARBON_CREDIT_MARKET_VALUE.voluntary_avg),
    marketValueHigh: Math.round(totalCredits * CARBON_CREDIT_MARKET_VALUE.verified_premium),
    wasteWeightLbs: totalWeightLbs,
    wasteWeightTons: totalWeightLbs / 2204.62,
    diversionRate,
    calculationMethod: "EPA_WARM_Model_v15",
    breakdown,
  };
}

/**
 * Default credit calculation when no ESG data is available
 * Uses conservative estimates based on service type
 */
async function calculateDefaultCredits(serviceRequestId: string): Promise<CarbonCreditCalculation> {
  const serviceRequest = await storage.getServiceRequest(serviceRequestId);

  if (!serviceRequest) {
    throw new Error("Service request not found");
  }

  // Conservative default estimates by service type
  const defaults: Record<string, { weightLbs: number, diversionRate: number }> = {
    junk_removal: { weightLbs: 500, diversionRate: 0.65 },
    furniture_moving: { weightLbs: 0, diversionRate: 0 }, // Moving doesn't generate credits
    garage_cleanout: { weightLbs: 800, diversionRate: 0.70 },
    estate_cleanout: { weightLbs: 2000, diversionRate: 0.60 },
    light_demolition: { weightLbs: 1500, diversionRate: 0.50 },
  };

  const estimate = defaults[serviceRequest.serviceType] || defaults.junk_removal;
  const divertedLbs = estimate.weightLbs * estimate.diversionRate;
  const weightTons = divertedLbs / 2204.62;
  const credits = weightTons * MATERIAL_CO2E_FACTORS.mixed_waste;

  return {
    creditsGenerated: Math.round(credits * 1000) / 1000,
    marketValueLow: Math.round(credits * CARBON_CREDIT_MARKET_VALUE.voluntary_low),
    marketValueAvg: Math.round(credits * CARBON_CREDIT_MARKET_VALUE.voluntary_avg),
    marketValueHigh: Math.round(credits * CARBON_CREDIT_MARKET_VALUE.verified_premium),
    wasteWeightLbs: estimate.weightLbs,
    wasteWeightTons: estimate.weightLbs / 2204.62,
    diversionRate: estimate.diversionRate,
    calculationMethod: "Default_Conservative_Estimate",
    breakdown: [{
      materialType: "mixed_waste",
      weightLbs: divertedLbs,
      co2eFactor: MATERIAL_CO2E_FACTORS.mixed_waste,
      creditsGenerated: credits,
    }],
  };
}

/**
 * Determine material type from ESG disposal category
 */
function determineMaterialType(category: string | null): keyof typeof MATERIAL_CO2E_FACTORS {
  if (!category) return "mixed_waste";

  const categoryLower = category.toLowerCase();

  // Map disposal categories to material types
  if (categoryLower.includes("paper") || categoryLower.includes("cardboard")) return "paper_cardboard";
  if (categoryLower.includes("metal") || categoryLower.includes("aluminum")) return "metals_aluminum";
  if (categoryLower.includes("steel") || categoryLower.includes("iron")) return "metals_steel";
  if (categoryLower.includes("plastic")) return "plastics_mixed";
  if (categoryLower.includes("wood") || categoryLower.includes("lumber")) return "wood_lumber";
  if (categoryLower.includes("furniture")) return "furniture_wood";
  if (categoryLower.includes("glass")) return "glass";
  if (categoryLower.includes("textile") || categoryLower.includes("fabric") || categoryLower.includes("clothing")) return "textiles";
  if (categoryLower.includes("electronic") || categoryLower.includes("e-waste") || categoryLower.includes("appliance")) return "electronics_large";
  if (categoryLower.includes("carpet")) return "carpet";
  if (categoryLower.includes("food")) return "food_waste";
  if (categoryLower.includes("yard") || categoryLower.includes("organic")) return "yard_waste";

  return "mixed_waste";
}

/**
 * Create carbon credit record for a completed job
 * Allocates credits to the HOA/business account if job came from their community
 */
export async function createCarbonCreditRecord(
  serviceRequestId: string,
  businessAccountId?: string
) {
  const calculation = await calculateCarbonCreditsForJob(serviceRequestId);

  // Create carbon credit record
  const carbonCredit = await storage.createCarbonCredit({
    businessAccountId: businessAccountId || null,
    serviceRequestId,
    creditsGenerated: calculation.creditsGenerated,
    calculationMethod: calculation.calculationMethod,
    wasteWeightLbs: calculation.wasteWeightLbs,
    landfillDiversionRate: calculation.diversionRate,
    certificationStatus: "pending",
    marketValue: calculation.marketValueAvg,
    createdAt: new Date().toISOString(),
  });

  // Update business account carbon credit balance
  if (businessAccountId) {
    const account = await storage.getBusinessAccount(businessAccountId);
    if (account) {
      await storage.updateBusinessAccount(businessAccountId, {
        carbonCreditBalance: (account.carbonCreditBalance || 0) + calculation.creditsGenerated,
        carbonCreditsGenerated: (account.carbonCreditsGenerated || 0) + calculation.creditsGenerated,
      });
    }
  }

  return { carbonCredit, calculation };
}

/**
 * Calculate potential carbon credit earnings for an HOA
 * Used for sales/demo calculator
 */
export function estimateCarbonCreditRevenue(params: {
  numberOfProperties: number;
  avgJobsPerPropertyPerYear?: number;
  avgWeightPerJobLbs?: number;
  diversionRate?: number;
}): {
  annualCredits: number;
  annualRevenueLow: number;
  annualRevenueAvg: number;
  annualRevenueHigh: number;
  monthlyCredits: number;
  monthlyRevenueAvg: number;
} {
  const jobsPerProperty = params.avgJobsPerPropertyPerYear || 0.3; // Conservative: 30% of homes per year
  const weightPerJob = params.avgWeightPerJobLbs || 500; // Conservative average
  const diversionRate = params.diversionRate || 0.65; // 65% diversion rate

  const totalJobs = params.numberOfProperties * jobsPerProperty;
  const totalWeightLbs = totalJobs * weightPerJob;
  const divertedWeightLbs = totalWeightLbs * diversionRate;
  const divertedWeightTons = divertedWeightLbs / 2204.62;

  const annualCredits = divertedWeightTons * MATERIAL_CO2E_FACTORS.mixed_waste;

  return {
    annualCredits: Math.round(annualCredits * 100) / 100,
    annualRevenueLow: Math.round(annualCredits * CARBON_CREDIT_MARKET_VALUE.voluntary_low),
    annualRevenueAvg: Math.round(annualCredits * CARBON_CREDIT_MARKET_VALUE.voluntary_avg),
    annualRevenueHigh: Math.round(annualCredits * CARBON_CREDIT_MARKET_VALUE.verified_premium),
    monthlyCredits: Math.round((annualCredits / 12) * 100) / 100,
    monthlyRevenueAvg: Math.round((annualCredits / 12) * CARBON_CREDIT_MARKET_VALUE.voluntary_avg),
  };
}
