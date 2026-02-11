/**
 * Service-Specific ESG Calculation Engine
 *
 * Provides EPA-based calculations for each service type with audit-ready formulas.
 * All constants are documented with sources for B2B compliance reporting.
 */

export interface ServiceEsgCalculation {
  totalCo2SavedLbs: number;
  totalCo2EmittedLbs: number;
  netCo2ImpactLbs: number;
  waterSavedGallons?: number;
  waterUsedGallons?: number;
  energySavedKwh?: number;
  esgScore: number; // 0-100
  breakdown: Record<string, any>;
  calculationMethod: string;
}

// ==========================================
// PRESSURE WASHING
// ==========================================

export interface PressureWashingParams {
  sqft: number;
  durationMinutes: number;
  actualGPM: number;
  chemicalUsedOz?: number;
  chemicalType?: "standard" | "eco_friendly";
  waterReclamation?: boolean;
}

/**
 * Pressure Washing ESG Calculator
 *
 * Constants:
 * - Standard GPM: 4.0 (EPA WaterSense baseline)
 * - Standard chemical: 8 oz per 100 sqft, 0.10 lbs CO2e/oz (petroleum-based cleaners)
 * - Eco-friendly chemical: 0.02 lbs CO2e/oz (plant-based cleaners)
 * - Water reclamation: 80% savings credit
 * - Water treatment CO2: 0.008 lbs CO2/gallon (EPA wastewater treatment)
 */
export function calculatePressureWashingEsg(params: PressureWashingParams): ServiceEsgCalculation {
  const STANDARD_GPM = 4.0;
  const STANDARD_CHEMICAL_OZ_PER_100SQFT = 8;
  const STANDARD_CHEMICAL_CO2E_PER_OZ = 0.10;
  const ECO_CHEMICAL_CO2E_PER_OZ = 0.02;
  const WATER_RECLAMATION_CREDIT = 0.80;
  const WATER_TREATMENT_CO2_PER_GALLON = 0.008;

  // Water calculations
  const actualWaterUsedGallons = (params.actualGPM * params.durationMinutes);
  const standardWaterUsedGallons = (STANDARD_GPM * params.durationMinutes);
  const waterSavedGallons = Math.max(0, standardWaterUsedGallons - actualWaterUsedGallons);
  const waterReclamationBonus = params.waterReclamation ? actualWaterUsedGallons * WATER_RECLAMATION_CREDIT : 0;
  const totalWaterSaved = waterSavedGallons + waterReclamationBonus;

  // Chemical calculations
  const standardChemicalOz = (params.sqft / 100) * STANDARD_CHEMICAL_OZ_PER_100SQFT;
  const actualChemicalOz = params.chemicalUsedOz || standardChemicalOz;
  const chemicalCo2ePerOz = params.chemicalType === "eco_friendly" ? ECO_CHEMICAL_CO2E_PER_OZ : STANDARD_CHEMICAL_CO2E_PER_OZ;
  const chemicalSavingsLbs = (standardChemicalOz * STANDARD_CHEMICAL_CO2E_PER_OZ) - (actualChemicalOz * chemicalCo2ePerOz);

  // Water treatment credits
  const waterTreatmentCreditsLbs = totalWaterSaved * WATER_TREATMENT_CO2_PER_GALLON;

  // Total impact
  const totalCo2SavedLbs = chemicalSavingsLbs + waterTreatmentCreditsLbs;
  const totalCo2EmittedLbs = actualChemicalOz * chemicalCo2ePerOz;
  const netCo2ImpactLbs = totalCo2SavedLbs - totalCo2EmittedLbs;

  // ESG Score (0-100)
  const waterEfficiency = Math.min(100, (totalWaterSaved / standardWaterUsedGallons) * 100);
  const chemicalScore = Math.min(100, (chemicalSavingsLbs / (standardChemicalOz * STANDARD_CHEMICAL_CO2E_PER_OZ)) * 100);
  const reclamationBonus = params.waterReclamation ? 20 : 0;
  const esgScore = Math.min(100, (waterEfficiency * 0.4) + (chemicalScore * 0.3) + (reclamationBonus * 0.3));

  return {
    totalCo2SavedLbs,
    totalCo2EmittedLbs,
    netCo2ImpactLbs,
    waterSavedGallons: totalWaterSaved,
    waterUsedGallons: actualWaterUsedGallons,
    esgScore: Math.round(esgScore),
    breakdown: {
      waterSavedGallons: waterSavedGallons,
      waterReclamationBonus: waterReclamationBonus,
      chemicalSavingsLbs: chemicalSavingsLbs,
      waterTreatmentCreditsLbs: waterTreatmentCreditsLbs,
      waterEfficiency: Math.round(waterEfficiency),
      chemicalScore: Math.round(chemicalScore),
    },
    calculationMethod: "EPA WaterSense + EPA Wastewater Treatment Emissions",
  };
}

// ==========================================
// GUTTER CLEANING
// ==========================================

export interface GutterCleaningParams {
  linearFeet: number;
  debrisDisposalMethod?: "composted" | "landfilled" | "mixed";
  stormPreventionCredit?: boolean; // Did cleaning prevent potential water damage?
}

/**
 * Gutter Cleaning ESG Calculator
 *
 * Constants:
 * - Debris weight: 0.5 lbs per linear foot (industry average)
 * - Organic debris: 70% of total (leaves, pine needles)
 * - Composted organic: 0.15 lbs CO2e per lb (EPA WARM model - composting food scraps)
 * - Landfilled organic: 0.50 lbs CO2e per lb (methane generation)
 * - Storm prevention credit: 50 lbs CO2e per job (water damage repair emissions)
 */
export function calculateGutterCleaningEsg(params: GutterCleaningParams): ServiceEsgCalculation {
  const DEBRIS_WEIGHT_PER_LINEAR_FOOT = 0.5;
  const ORGANIC_DEBRIS_PERCENTAGE = 0.70;
  const COMPOSTED_CO2E_PER_LB = 0.15;
  const LANDFILLED_CO2E_PER_LB = 0.50;
  const STORM_PREVENTION_CREDIT_LBS = 50;

  // Debris calculations
  const totalDebrisLbs = params.linearFeet * DEBRIS_WEIGHT_PER_LINEAR_FOOT;
  const organicDebrisLbs = totalDebrisLbs * ORGANIC_DEBRIS_PERCENTAGE;
  const inorganicDebrisLbs = totalDebrisLbs - organicDebrisLbs;

  // Disposal method impact
  let co2SavedFromComposting = 0;
  let co2EmittedFromDisposal = 0;

  if (params.debrisDisposalMethod === "composted") {
    co2EmittedFromDisposal = organicDebrisLbs * COMPOSTED_CO2E_PER_LB;
    co2SavedFromComposting = organicDebrisLbs * (LANDFILLED_CO2E_PER_LB - COMPOSTED_CO2E_PER_LB);
  } else if (params.debrisDisposalMethod === "landfilled") {
    co2EmittedFromDisposal = organicDebrisLbs * LANDFILLED_CO2E_PER_LB;
  } else {
    // Mixed - assume 50% composted
    const compostedPortion = organicDebrisLbs * 0.5;
    const landfilledPortion = organicDebrisLbs * 0.5;
    co2EmittedFromDisposal = (compostedPortion * COMPOSTED_CO2E_PER_LB) + (landfilledPortion * LANDFILLED_CO2E_PER_LB);
    co2SavedFromComposting = compostedPortion * (LANDFILLED_CO2E_PER_LB - COMPOSTED_CO2E_PER_LB);
  }

  // Storm prevention credit
  const stormPreventionCreditLbs = params.stormPreventionCredit ? STORM_PREVENTION_CREDIT_LBS : 0;

  // Total impact
  const totalCo2SavedLbs = co2SavedFromComposting + stormPreventionCreditLbs;
  const totalCo2EmittedLbs = co2EmittedFromDisposal;
  const netCo2ImpactLbs = totalCo2SavedLbs - totalCo2EmittedLbs;

  // ESG Score (0-100)
  const disposalScore = params.debrisDisposalMethod === "composted" ? 100 :
                        params.debrisDisposalMethod === "mixed" ? 50 : 0;
  const preventionScore = params.stormPreventionCredit ? 100 : 50;
  const esgScore = (disposalScore * 0.6) + (preventionScore * 0.4);

  return {
    totalCo2SavedLbs,
    totalCo2EmittedLbs,
    netCo2ImpactLbs,
    esgScore: Math.round(esgScore),
    breakdown: {
      totalDebrisLbs,
      organicDebrisLbs,
      inorganicDebrisLbs,
      co2SavedFromComposting,
      stormPreventionCreditLbs,
      disposalScore,
      preventionScore,
    },
    calculationMethod: "EPA WARM Model (Composting) + Storm Prevention Credit",
  };
}

// ==========================================
// POOL CLEANING
// ==========================================

export interface PoolCleaningParams {
  poolSizeGallons: number;
  chemicalOptimizationPct?: number; // % reduction from standard chemical load
  leakDetected?: boolean;
  leakGallonsPerDaySaved?: number;
  filterEfficiencyImprovement?: boolean;
}

/**
 * Pool Cleaning ESG Calculator
 *
 * Constants:
 * - Standard chemical load: 0.0013 lbs per gallon per month (EPA pool chemical standards)
 * - Chemical production CO2: 0.20 lbs CO2e per lb of chemical
 * - Water treatment: 0.008 lbs CO2 per gallon (EPA)
 * - Filter energy: 0.5 kWh per day (standard pool pump)
 * - Energy CO2: 0.92 lbs CO2 per kWh (U.S. grid average)
 */
export function calculatePoolCleaningEsg(params: PoolCleaningParams): ServiceEsgCalculation {
  const STANDARD_CHEMICAL_LBS_PER_GALLON_PER_MONTH = 0.0013;
  const CHEMICAL_PRODUCTION_CO2E_PER_LB = 0.20;
  const WATER_TREATMENT_CO2_PER_GALLON = 0.008;
  const FILTER_ENERGY_KWH_PER_DAY = 0.5;
  const ENERGY_CO2_PER_KWH = 0.92;

  // Chemical optimization
  const optimizationPct = params.chemicalOptimizationPct || 0;
  const standardChemicalLbs = params.poolSizeGallons * STANDARD_CHEMICAL_LBS_PER_GALLON_PER_MONTH;
  const optimizedChemicalLbs = standardChemicalLbs * (1 - optimizationPct / 100);
  const chemicalSavedLbs = standardChemicalLbs - optimizedChemicalLbs;
  const chemicalCo2SavedLbs = chemicalSavedLbs * CHEMICAL_PRODUCTION_CO2E_PER_LB;

  // Water savings from leak detection
  const waterSavedGallons = params.leakDetected && params.leakGallonsPerDaySaved ?
    params.leakGallonsPerDaySaved * 30 : 0; // Monthly savings
  const waterCo2SavedLbs = waterSavedGallons * WATER_TREATMENT_CO2_PER_GALLON;

  // Filter efficiency improvement
  const filterEnergySavedKwh = params.filterEfficiencyImprovement ? FILTER_ENERGY_KWH_PER_DAY * 30 * 0.20 : 0; // 20% improvement
  const filterCo2SavedLbs = filterEnergySavedKwh * ENERGY_CO2_PER_KWH;

  // Total impact
  const totalCo2SavedLbs = chemicalCo2SavedLbs + waterCo2SavedLbs + filterCo2SavedLbs;
  const totalCo2EmittedLbs = optimizedChemicalLbs * CHEMICAL_PRODUCTION_CO2E_PER_LB;
  const netCo2ImpactLbs = totalCo2SavedLbs - totalCo2EmittedLbs;

  // ESG Score (0-100)
  const chemicalScore = Math.min(100, optimizationPct);
  const leakScore = params.leakDetected ? 100 : 50;
  const filterScore = params.filterEfficiencyImprovement ? 100 : 50;
  const esgScore = (chemicalScore * 0.4) + (leakScore * 0.3) + (filterScore * 0.3);

  return {
    totalCo2SavedLbs,
    totalCo2EmittedLbs,
    netCo2ImpactLbs,
    waterSavedGallons,
    energySavedKwh: filterEnergySavedKwh,
    esgScore: Math.round(esgScore),
    breakdown: {
      chemicalSavedLbs,
      chemicalCo2SavedLbs,
      waterSavedGallons,
      waterCo2SavedLbs,
      filterEnergySavedKwh,
      filterCo2SavedLbs,
      chemicalScore,
      leakScore,
      filterScore,
    },
    calculationMethod: "EPA Pool Chemical Standards + Water Treatment Emissions + U.S. Grid Energy",
  };
}

// ==========================================
// HOME CLEANING (PolishUp™)
// ==========================================

export interface HomeCleaningParams {
  sqft: number;
  productType: "standard" | "eco_friendly";
  productUsedOz: number;
  waterUsedGallons: number;
  reusableClothsUsed: number;
}

/**
 * Home Cleaning ESG Calculator
 *
 * Constants:
 * - Standard product: 4 oz per 100 sqft, 0.06 lbs CO2e/oz
 * - Eco-friendly product: 0.01 lbs CO2e/oz
 * - Standard water: 2 gal per 100 sqft
 * - Water treatment: 0.008 lbs CO2/gallon
 * - Reusable cloth credit: 0.5 lbs CO2e per use (vs disposable paper towels)
 */
export function calculateHomeCleaningEsg(params: HomeCleaningParams): ServiceEsgCalculation {
  const STANDARD_PRODUCT_OZ_PER_100SQFT = 4;
  const STANDARD_PRODUCT_CO2E_PER_OZ = 0.06;
  const ECO_PRODUCT_CO2E_PER_OZ = 0.01;
  const STANDARD_WATER_GAL_PER_100SQFT = 2;
  const WATER_TREATMENT_CO2_PER_GALLON = 0.008;
  const REUSABLE_CLOTH_CREDIT_LBS = 0.5;

  // Product calculations
  const standardProductOz = (params.sqft / 100) * STANDARD_PRODUCT_OZ_PER_100SQFT;
  const productCo2ePerOz = params.productType === "eco_friendly"
    ? ECO_PRODUCT_CO2E_PER_OZ
    : STANDARD_PRODUCT_CO2E_PER_OZ;
  const productCo2Saved = (standardProductOz * STANDARD_PRODUCT_CO2E_PER_OZ) -
                          (params.productUsedOz * productCo2ePerOz);

  // Water calculations
  const standardWaterGallons = (params.sqft / 100) * STANDARD_WATER_GAL_PER_100SQFT;
  const waterSaved = Math.max(0, standardWaterGallons - params.waterUsedGallons);
  const waterCo2Saved = waterSaved * WATER_TREATMENT_CO2_PER_GALLON;

  // Reusable supplies bonus
  const reusableBonus = params.reusableClothsUsed * REUSABLE_CLOTH_CREDIT_LBS;

  // Total impact
  const totalCo2SavedLbs = productCo2Saved + waterCo2Saved + reusableBonus;
  const totalCo2EmittedLbs = params.productUsedOz * productCo2ePerOz;
  const netCo2ImpactLbs = totalCo2SavedLbs - totalCo2EmittedLbs;

  // ESG Score
  const productScore = params.productType === "eco_friendly" ? 100 :
                       Math.min(100, (productCo2Saved / (standardProductOz * STANDARD_PRODUCT_CO2E_PER_OZ)) * 100);
  const waterScore = Math.min(100, (waterSaved / standardWaterGallons) * 100);
  const reusableScore = Math.min(100, params.reusableClothsUsed * 20);
  const esgScore = (productScore * 0.4) + (waterScore * 0.3) + (reusableScore * 0.3);

  return {
    totalCo2SavedLbs,
    totalCo2EmittedLbs,
    netCo2ImpactLbs,
    waterSavedGallons: waterSaved,
    esgScore: Math.round(esgScore),
    breakdown: {
      productCo2Saved,
      waterCo2Saved,
      reusableBonus,
      productScore: Math.round(productScore),
      waterScore: Math.round(waterScore),
      reusableScore: Math.round(reusableScore),
    },
    calculationMethod: "EPA Cleaning Product Standards + Water Treatment Emissions",
  };
}

// ==========================================
// LANDSCAPING (FreshCut™)
// ==========================================

export interface LandscapingParams {
  lawnSqft: number;
  treesPlanted?: number;
  mulchLbs?: number;
  equipmentType: "gas_mower" | "electric_mower" | "manual";
  durationHours: number;
  organicFertilizer?: boolean;
}

/**
 * Landscaping ESG Calculator
 *
 * Constants:
 * - Lawn carbon sequestration: 0.15 lbs CO2/sqft/year (EPA)
 * - Tree carbon sequestration: 48 lbs CO2/tree/year (Arbor Day Foundation)
 * - Mulch carbon storage: 0.2 lbs CO2/lb
 * - Gas mower emissions: 2.5 lbs CO2/hour (EPA)
 * - Electric mower emissions: 0.8 lbs CO2/hour (U.S. grid average)
 * - Manual equipment: 0 emissions
 */
export function calculateLandscapingEsg(params: LandscapingParams): ServiceEsgCalculation {
  const LAWN_CO2_SEQUESTRATION_PER_SQFT = 0.15;
  const TREE_CO2_SEQUESTRATION = 48;
  const MULCH_CO2_STORAGE_PER_LB = 0.2;
  const GAS_MOWER_CO2_PER_HOUR = 2.5;
  const ELECTRIC_MOWER_CO2_PER_HOUR = 0.8;

  // Carbon sequestration
  const lawnSequestration = params.lawnSqft * LAWN_CO2_SEQUESTRATION_PER_SQFT;
  const treeSequestration = (params.treesPlanted || 0) * TREE_CO2_SEQUESTRATION;
  const mulchStorage = (params.mulchLbs || 0) * MULCH_CO2_STORAGE_PER_LB;
  const totalSequestered = lawnSequestration + treeSequestration + mulchStorage;

  // Equipment emissions
  let equipmentEmissions = 0;
  switch (params.equipmentType) {
    case "gas_mower":
      equipmentEmissions = params.durationHours * GAS_MOWER_CO2_PER_HOUR;
      break;
    case "electric_mower":
      equipmentEmissions = params.durationHours * ELECTRIC_MOWER_CO2_PER_HOUR;
      break;
    case "manual":
      equipmentEmissions = 0;
      break;
  }

  // Organic fertilizer bonus
  const organicBonus = params.organicFertilizer ? 10 : 0;

  // Net impact
  const totalCo2SavedLbs = totalSequestered + organicBonus;
  const totalCo2EmittedLbs = equipmentEmissions;
  const netCo2ImpactLbs = totalCo2SavedLbs - totalCo2EmittedLbs;

  // ESG Score
  const sequestrationScore = Math.min(100, (totalSequestered / 100) * 50);
  const equipmentScore = params.equipmentType === "manual" ? 100 :
                         params.equipmentType === "electric_mower" ? 70 : 40;
  const organicScore = params.organicFertilizer ? 100 : 50;
  const esgScore = (sequestrationScore * 0.4) + (equipmentScore * 0.4) + (organicScore * 0.2);

  return {
    totalCo2SavedLbs,
    totalCo2EmittedLbs,
    netCo2ImpactLbs,
    esgScore: Math.round(esgScore),
    breakdown: {
      lawnSequestration,
      treeSequestration,
      mulchStorage,
      equipmentEmissions,
      organicBonus,
      sequestrationScore: Math.round(sequestrationScore),
      equipmentScore,
      organicScore,
    },
    calculationMethod: "EPA Lawn Sequestration + Arbor Day Foundation + EPA Equipment Emissions",
  };
}

// ==========================================
// HANDYMAN (FixIt™)
// ==========================================

export interface HandymanParams {
  repairType: "appliance" | "furniture" | "hvac" | "plumbing" | "electrical" | "general";
  itemsRepaired: number;
  recycledMaterialsLbs?: number;
  preventedReplacement?: boolean;
}

/**
 * Handyman ESG Calculator
 *
 * Constants (replacement emissions avoided):
 * - Appliance repair: 150 lbs CO2e
 * - Furniture repair: 75 lbs CO2e
 * - HVAC repair: 500 lbs CO2e
 * - Plumbing repair: 100 lbs CO2e
 * - Electrical repair: 80 lbs CO2e
 * - Recycled materials credit: 1.5 lbs CO2e per lb
 */
export function calculateHandymanEsg(params: HandymanParams): ServiceEsgCalculation {
  const REPAIR_CREDITS: Record<string, number> = {
    appliance: 150,
    furniture: 75,
    hvac: 500,
    plumbing: 100,
    electrical: 80,
    general: 50,
  };
  const RECYCLED_MATERIAL_CO2E_PER_LB = 1.5;

  // Repair vs replace credits
  const repairCredit = REPAIR_CREDITS[params.repairType] * params.itemsRepaired;
  const replacementAvoidedCredit = params.preventedReplacement ? repairCredit * 0.5 : 0;

  // Material efficiency
  const materialEfficiency = (params.recycledMaterialsLbs || 0) * RECYCLED_MATERIAL_CO2E_PER_LB;

  // Total impact
  const totalCo2SavedLbs = repairCredit + replacementAvoidedCredit + materialEfficiency;
  const totalCo2EmittedLbs = 0; // Repairs don't emit, they prevent
  const netCo2ImpactLbs = totalCo2SavedLbs;

  // ESG Score
  const repairScore = Math.min(100, (repairCredit / 200) * 100);
  const replacementScore = params.preventedReplacement ? 100 : 50;
  const materialScore = Math.min(100, materialEfficiency * 10);
  const esgScore = (repairScore * 0.5) + (replacementScore * 0.3) + (materialScore * 0.2);

  return {
    totalCo2SavedLbs,
    totalCo2EmittedLbs,
    netCo2ImpactLbs,
    esgScore: Math.round(esgScore),
    breakdown: {
      repairCredit,
      replacementAvoidedCredit,
      materialEfficiency,
      repairScore: Math.round(repairScore),
      replacementScore,
      materialScore: Math.round(materialScore),
    },
    calculationMethod: "Repair vs Replace Lifecycle Analysis + EPA Waste Reduction",
  };
}

// ==========================================
// MOVING LABOR & FURNITURE MOVING
// ==========================================

export interface MovingParams {
  distanceMiles: number;
  truckType: "standard" | "hybrid" | "electric";
  reusableBlankets: number;
  plasticWrapAvoided?: boolean;
  reusableBinsUsed: number;
  routeOptimized?: boolean;
}

/**
 * Moving Labor ESG Calculator
 *
 * Constants:
 * - Standard truck: 0.9 lbs CO2/mile
 * - Hybrid truck: 0.6 lbs CO2/mile
 * - Electric truck: 0.3 lbs CO2/mile
 * - Reusable blanket credit: 5 lbs CO2e per blanket (vs disposable)
 * - Plastic wrap avoided: 2 lbs CO2e per roll
 * - Reusable bin credit: 10 lbs CO2e per bin (vs cardboard)
 * - Route optimization: 15% emissions reduction
 */
export function calculateMovingEsg(params: MovingParams): ServiceEsgCalculation {
  const TRUCK_CO2_PER_MILE: Record<string, number> = {
    standard: 0.9,
    hybrid: 0.6,
    electric: 0.3,
  };
  const REUSABLE_BLANKET_CREDIT = 5;
  const PLASTIC_WRAP_CREDIT = 2;
  const REUSABLE_BIN_CREDIT = 10;
  const ROUTE_OPTIMIZATION_REDUCTION = 0.15;

  // Transportation emissions
  const baseEmissions = params.distanceMiles * TRUCK_CO2_PER_MILE[params.truckType];
  const routeSavings = params.routeOptimized ? baseEmissions * ROUTE_OPTIMIZATION_REDUCTION : 0;
  const standardEmissions = params.distanceMiles * TRUCK_CO2_PER_MILE.standard;
  const transportSavings = standardEmissions - baseEmissions;

  // Packaging savings
  const blanketSavings = params.reusableBlankets * REUSABLE_BLANKET_CREDIT;
  const plasticSavings = params.plasticWrapAvoided ? PLASTIC_WRAP_CREDIT * 10 : 0;
  const binSavings = params.reusableBinsUsed * REUSABLE_BIN_CREDIT;

  // Total impact
  const totalCo2SavedLbs = transportSavings + routeSavings + blanketSavings + plasticSavings + binSavings;
  const totalCo2EmittedLbs = baseEmissions - routeSavings;
  const netCo2ImpactLbs = totalCo2SavedLbs - totalCo2EmittedLbs;

  // ESG Score
  const transportScore = Math.min(100, (transportSavings / standardEmissions) * 100);
  const packagingScore = Math.min(100, ((blanketSavings + plasticSavings + binSavings) / 100) * 100);
  const routeScore = params.routeOptimized ? 100 : 50;
  const esgScore = (transportScore * 0.4) + (packagingScore * 0.3) + (routeScore * 0.3);

  return {
    totalCo2SavedLbs,
    totalCo2EmittedLbs,
    netCo2ImpactLbs,
    esgScore: Math.round(esgScore),
    breakdown: {
      transportSavings,
      routeSavings,
      blanketSavings,
      plasticSavings,
      binSavings,
      transportScore: Math.round(transportScore),
      packagingScore: Math.round(packagingScore),
      routeScore,
    },
    calculationMethod: "EPA Vehicle Emissions + Packaging Lifecycle Analysis",
  };
}

// ==========================================
// CARPET CLEANING (DeepFiber™)
// ==========================================

export interface CarpetCleaningParams {
  sqft: number;
  method: "hot_water_extraction" | "low_moisture" | "dry_cleaning";
  ecoFriendlyProducts: boolean;
  carpetLifeExtension?: boolean;
}

/**
 * Carpet Cleaning ESG Calculator
 *
 * Constants:
 * - Hot water extraction: 0.15 gal/sqft
 * - Low-moisture: 0.02 gal/sqft
 * - Dry cleaning: 0 gal/sqft
 * - Standard chemical: 0.08 lbs CO2e/oz per 100 sqft
 * - Eco chemical: 0.01 lbs CO2e/oz per 100 sqft
 * - Carpet life extension: 500 lbs CO2e (replacement avoided)
 */
export function calculateCarpetCleaningEsg(params: CarpetCleaningParams): ServiceEsgCalculation {
  const WATER_USAGE_GAL_PER_SQFT: Record<string, number> = {
    hot_water_extraction: 0.15,
    low_moisture: 0.02,
    dry_cleaning: 0,
  };
  const STANDARD_METHOD_WATER = 0.15;
  const WATER_TREATMENT_CO2_PER_GALLON = 0.008;
  const STANDARD_CHEMICAL_CO2E = 0.08;
  const ECO_CHEMICAL_CO2E = 0.01;
  const CARPET_LIFE_EXTENSION_CREDIT = 500;

  // Water efficiency
  const actualWaterGal = params.sqft * WATER_USAGE_GAL_PER_SQFT[params.method];
  const standardWaterGal = params.sqft * STANDARD_METHOD_WATER;
  const waterSaved = Math.max(0, standardWaterGal - actualWaterGal);
  const waterCo2Saved = waterSaved * WATER_TREATMENT_CO2_PER_GALLON;

  // Chemical efficiency
  const chemicalCo2e = params.ecoFriendlyProducts ? ECO_CHEMICAL_CO2E : STANDARD_CHEMICAL_CO2E;
  const chemicalUnits = params.sqft / 100;
  const chemicalSavings = (STANDARD_CHEMICAL_CO2E - chemicalCo2e) * chemicalUnits;

  // Carpet life extension
  const lifeExtensionCredit = params.carpetLifeExtension ? CARPET_LIFE_EXTENSION_CREDIT : 0;

  // Total impact
  const totalCo2SavedLbs = waterCo2Saved + chemicalSavings + lifeExtensionCredit;
  const totalCo2EmittedLbs = chemicalCo2e * chemicalUnits;
  const netCo2ImpactLbs = totalCo2SavedLbs - totalCo2EmittedLbs;

  // ESG Score
  const waterScore = Math.min(100, (waterSaved / standardWaterGal) * 100);
  const chemicalScore = params.ecoFriendlyProducts ? 100 : 50;
  const lifeExtensionScore = params.carpetLifeExtension ? 100 : 50;
  const esgScore = (waterScore * 0.3) + (chemicalScore * 0.3) + (lifeExtensionScore * 0.4);

  return {
    totalCo2SavedLbs,
    totalCo2EmittedLbs,
    netCo2ImpactLbs,
    waterSavedGallons: waterSaved,
    esgScore: Math.round(esgScore),
    breakdown: {
      waterSaved,
      waterCo2Saved,
      chemicalSavings,
      lifeExtensionCredit,
      waterScore: Math.round(waterScore),
      chemicalScore,
      lifeExtensionScore,
    },
    calculationMethod: "EPA Water Treatment + Carpet Lifecycle Analysis",
  };
}

// ==========================================
// LIGHT DEMOLITION (TearDown™)
// ==========================================

export interface LightDemolitionParams {
  totalWeightLbs: number;
  woodSalvagedLbs: number;
  metalSalvagedLbs: number;
  concreteSalvagedLbs: number;
  method: "deconstruction" | "standard_demolition";
  hazmatProperlyDisposed?: boolean;
}

/**
 * Light Demolition ESG Calculator
 *
 * Constants (EPA WARM Model):
 * - Wood salvage: 2.13 lbs CO2e/lb
 * - Metal salvage: 1.57 lbs CO2e/lb
 * - Concrete salvage: 0.5 lbs CO2e/lb
 * - Deconstruction methodology: 1.5× multiplier
 * - Standard demolition: 1.0× multiplier
 * - Hazmat proper disposal: 1000 lbs CO2e credit (vs improper)
 */
export function calculateLightDemolitionEsg(params: LightDemolitionParams): ServiceEsgCalculation {
  const WOOD_CO2E_PER_LB = 2.13;
  const METAL_CO2E_PER_LB = 1.57;
  const CONCRETE_CO2E_PER_LB = 0.5;
  const DECONSTRUCTION_MULTIPLIER = 1.5;
  const STANDARD_MULTIPLIER = 1.0;
  const HAZMAT_CREDIT = 1000;

  // Salvage value
  const woodCredit = params.woodSalvagedLbs * WOOD_CO2E_PER_LB;
  const metalCredit = params.metalSalvagedLbs * METAL_CO2E_PER_LB;
  const concreteCredit = params.concreteSalvagedLbs * CONCRETE_CO2E_PER_LB;
  const baseSalvageValue = woodCredit + metalCredit + concreteCredit;

  // Methodology multiplier
  const methodologyMultiplier = params.method === "deconstruction"
    ? DECONSTRUCTION_MULTIPLIER
    : STANDARD_MULTIPLIER;
  const salvageValue = baseSalvageValue * methodologyMultiplier;

  // Hazmat handling
  const hazmatCredit = params.hazmatProperlyDisposed ? HAZMAT_CREDIT : 0;

  // Salvage rate
  const totalSalvaged = params.woodSalvagedLbs + params.metalSalvagedLbs + params.concreteSalvagedLbs;
  const salvageRate = (totalSalvaged / params.totalWeightLbs) * 100;

  // Total impact
  const totalCo2SavedLbs = salvageValue + hazmatCredit;
  const totalCo2EmittedLbs = 0;
  const netCo2ImpactLbs = totalCo2SavedLbs;

  // ESG Score
  const salvageScore = Math.min(100, salvageRate);
  const methodScore = params.method === "deconstruction" ? 100 : 60;
  const hazmatScore = params.hazmatProperlyDisposed ? 100 : 0;
  const esgScore = (salvageScore * 0.5) + (methodScore * 0.3) + (hazmatScore * 0.2);

  return {
    totalCo2SavedLbs,
    totalCo2EmittedLbs,
    netCo2ImpactLbs,
    esgScore: Math.round(esgScore),
    breakdown: {
      woodCredit,
      metalCredit,
      concreteCredit,
      salvageValue,
      hazmatCredit,
      salvageRate: Math.round(salvageRate),
      salvageScore: Math.round(salvageScore),
      methodScore,
      hazmatScore,
    },
    calculationMethod: "EPA WARM Model + Deconstruction Best Practices",
  };
}

// ==========================================
// JUNK REMOVAL (Legacy Integration)
// ==========================================

export interface JunkRemovalParams {
  totalWeightLbs: number;
  recycledWeightLbs: number;
  donatedWeightLbs: number;
  ewasteWeightLbs?: number;
  haulDistanceMiles: number;
}

/**
 * Junk Removal ESG Calculator
 *
 * Integrates with existing EPA WARM model calculations
 * Uses standard diversion rates and CO2 factors
 */
export function calculateJunkRemovalEsg(params: JunkRemovalParams): ServiceEsgCalculation {
  const AVG_CO2E_PER_LB_DIVERTED = 0.5; // EPA WARM average
  const TRANSPORT_CO2_PER_MILE = 0.9;
  const EWASTE_BONUS_MULTIPLIER = 2.0;

  // Diversion calculations
  const totalDiverted = params.recycledWeightLbs + params.donatedWeightLbs + (params.ewasteWeightLbs || 0);
  const diversionRate = (totalDiverted / params.totalWeightLbs) * 100;
  const landfilled = params.totalWeightLbs - totalDiverted;

  // CO2 savings from diversion
  const diversionCredit = totalDiverted * AVG_CO2E_PER_LB_DIVERTED;
  const ewasteBonus = (params.ewasteWeightLbs || 0) * AVG_CO2E_PER_LB_DIVERTED * (EWASTE_BONUS_MULTIPLIER - 1);

  // Transport emissions
  const transportEmissions = params.haulDistanceMiles * TRANSPORT_CO2_PER_MILE;

  // Total impact
  const totalCo2SavedLbs = diversionCredit + ewasteBonus;
  const totalCo2EmittedLbs = transportEmissions;
  const netCo2ImpactLbs = totalCo2SavedLbs - totalCo2EmittedLbs;

  // ESG Score
  const diversionScore = Math.min(100, diversionRate);
  const ewasteScore = (params.ewasteWeightLbs || 0) > 0 ? 100 : 50;
  const esgScore = (diversionScore * 0.7) + (ewasteScore * 0.3);

  return {
    totalCo2SavedLbs,
    totalCo2EmittedLbs,
    netCo2ImpactLbs,
    esgScore: Math.round(esgScore),
    breakdown: {
      totalDiverted,
      diversionRate: Math.round(diversionRate),
      diversionCredit,
      ewasteBonus,
      transportEmissions,
      landfilled,
      diversionScore: Math.round(diversionScore),
      ewasteScore,
    },
    calculationMethod: "EPA WARM Model + Carbon Credit Service Integration",
  };
}

// ==========================================
// MAIN CALCULATION ROUTER
// ==========================================

export async function calculateServiceEsg(
  serviceType: string,
  params: Record<string, any>
): Promise<ServiceEsgCalculation> {
  switch (serviceType) {
    case "pressure_washing":
      return calculatePressureWashingEsg(params as PressureWashingParams);
    case "gutter_cleaning":
      return calculateGutterCleaningEsg(params as GutterCleaningParams);
    case "pool_cleaning":
      return calculatePoolCleaningEsg(params as PoolCleaningParams);
    case "home_cleaning":
    case "cleaning":
      return calculateHomeCleaningEsg(params as HomeCleaningParams);
    case "landscaping":
      return calculateLandscapingEsg(params as LandscapingParams);
    case "handyman":
      return calculateHandymanEsg(params as HandymanParams);
    case "moving_labor":
    case "furniture_moving":
      return calculateMovingEsg(params as MovingParams);
    case "carpet_cleaning":
      return calculateCarpetCleaningEsg(params as CarpetCleaningParams);
    case "light_demolition":
      return calculateLightDemolitionEsg(params as LightDemolitionParams);
    case "junk_removal":
      return calculateJunkRemovalEsg(params as JunkRemovalParams);
    default:
      throw new Error(`ESG calculation not implemented for service type: ${serviceType}`);
  }
}
