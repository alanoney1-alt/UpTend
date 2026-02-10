/**
 * Service-Specific ESG Calculation Endpoints
 *
 * Provides individual endpoints for each service type's ESG calculation.
 * These endpoints are "calculation-only" - they don't persist to database.
 * Use POST /api/esg/service-metrics to calculate AND store.
 */

import { Router } from "express";
import { z } from "zod";
import {
  calculatePressureWashingEsg,
  calculateGutterCleaningEsg,
  calculatePoolCleaningEsg,
  calculateHomeCleaningEsg,
  calculateLandscapingEsg,
  calculateHandymanEsg,
  calculateMovingEsg,
  calculateCarpetCleaningEsg,
  calculateLightDemolitionEsg,
  calculateJunkRemovalEsg,
  type PressureWashingParams,
  type GutterCleaningParams,
  type PoolCleaningParams,
  type HomeCleaningParams,
  type LandscapingParams,
  type HandymanParams,
  type MovingParams,
  type CarpetCleaningParams,
  type LightDemolitionParams,
  type JunkRemovalParams,
} from "../../services/service-esg-calculators";

const router = Router();

// ==========================================
// POST /api/esg/calculate/pressure-washing
// ==========================================
const pressureWashingSchema = z.object({
  sqft: z.number().positive(),
  durationMinutes: z.number().positive(),
  actualGPM: z.number().positive(),
  chemicalUsedOz: z.number().optional(),
  chemicalType: z.enum(["standard", "eco_friendly"]).optional(),
  waterReclamation: z.boolean().optional(),
});

router.post("/calculate/pressure-washing", async (req, res) => {
  try {
    const params = pressureWashingSchema.parse(req.body) as PressureWashingParams;
    const calculation = calculatePressureWashingEsg(params);

    res.json({
      success: true,
      serviceType: "pressure_washing",
      calculation,
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || "Invalid pressure washing parameters",
    });
  }
});

// ==========================================
// POST /api/esg/calculate/gutter-cleaning
// ==========================================
const gutterCleaningSchema = z.object({
  linearFeet: z.number().positive(),
  debrisDisposalMethod: z.enum(["composted", "landfilled", "mixed"]).optional(),
  stormPreventionCredit: z.boolean().optional(),
});

router.post("/calculate/gutter-cleaning", async (req, res) => {
  try {
    const params = gutterCleaningSchema.parse(req.body) as GutterCleaningParams;
    const calculation = calculateGutterCleaningEsg(params);

    res.json({
      success: true,
      serviceType: "gutter_cleaning",
      calculation,
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || "Invalid gutter cleaning parameters",
    });
  }
});

// ==========================================
// POST /api/esg/calculate/pool-cleaning
// ==========================================
const poolCleaningSchema = z.object({
  poolSizeGallons: z.number().positive(),
  chemicalOptimizationPct: z.number().min(0).max(100).optional(),
  leakDetected: z.boolean().optional(),
  leakGallonsPerDaySaved: z.number().optional(),
  filterEfficiencyImprovement: z.boolean().optional(),
});

router.post("/calculate/pool-cleaning", async (req, res) => {
  try {
    const params = poolCleaningSchema.parse(req.body) as PoolCleaningParams;
    const calculation = calculatePoolCleaningEsg(params);

    res.json({
      success: true,
      serviceType: "pool_cleaning",
      calculation,
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || "Invalid pool cleaning parameters",
    });
  }
});

// ==========================================
// POST /api/esg/calculate/home-cleaning
// ==========================================
const homeCleaningSchema = z.object({
  sqft: z.number().positive(),
  productType: z.enum(["standard", "eco_friendly"]),
  productUsedOz: z.number().positive(),
  waterUsedGallons: z.number().positive(),
  reusableClothsUsed: z.number().min(0),
});

router.post("/calculate/home-cleaning", async (req, res) => {
  try {
    const params = homeCleaningSchema.parse(req.body) as HomeCleaningParams;
    const calculation = calculateHomeCleaningEsg(params);

    res.json({
      success: true,
      serviceType: "home_cleaning",
      calculation,
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || "Invalid home cleaning parameters",
    });
  }
});

// ==========================================
// POST /api/esg/calculate/landscaping
// ==========================================
const landscapingSchema = z.object({
  lawnSqft: z.number().positive(),
  treesPlanted: z.number().min(0).optional(),
  mulchLbs: z.number().min(0).optional(),
  equipmentType: z.enum(["gas_mower", "electric_mower", "manual"]),
  durationHours: z.number().positive(),
  organicFertilizer: z.boolean().optional(),
});

router.post("/calculate/landscaping", async (req, res) => {
  try {
    const params = landscapingSchema.parse(req.body) as LandscapingParams;
    const calculation = calculateLandscapingEsg(params);

    res.json({
      success: true,
      serviceType: "landscaping",
      calculation,
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || "Invalid landscaping parameters",
    });
  }
});

// ==========================================
// POST /api/esg/calculate/handyman
// ==========================================
const handymanSchema = z.object({
  repairType: z.enum(["appliance", "furniture", "hvac", "plumbing", "electrical", "general"]),
  itemsRepaired: z.number().positive(),
  recycledMaterialsLbs: z.number().min(0).optional(),
  preventedReplacement: z.boolean().optional(),
});

router.post("/calculate/handyman", async (req, res) => {
  try {
    const params = handymanSchema.parse(req.body) as HandymanParams;
    const calculation = calculateHandymanEsg(params);

    res.json({
      success: true,
      serviceType: "handyman",
      calculation,
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || "Invalid handyman parameters",
    });
  }
});

// ==========================================
// POST /api/esg/calculate/moving
// ==========================================
const movingSchema = z.object({
  distanceMiles: z.number().positive(),
  truckType: z.enum(["standard", "hybrid", "electric"]),
  reusableBlankets: z.number().min(0),
  plasticWrapAvoided: z.boolean().optional(),
  reusableBinsUsed: z.number().min(0),
  routeOptimized: z.boolean().optional(),
});

router.post("/calculate/moving", async (req, res) => {
  try {
    const params = movingSchema.parse(req.body) as MovingParams;
    const calculation = calculateMovingEsg(params);

    res.json({
      success: true,
      serviceType: "moving",
      calculation,
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || "Invalid moving parameters",
    });
  }
});

// ==========================================
// POST /api/esg/calculate/carpet-cleaning
// ==========================================
const carpetCleaningSchema = z.object({
  sqft: z.number().positive(),
  method: z.enum(["hot_water_extraction", "low_moisture", "dry_cleaning"]),
  ecoFriendlyProducts: z.boolean(),
  carpetLifeExtension: z.boolean().optional(),
});

router.post("/calculate/carpet-cleaning", async (req, res) => {
  try {
    const params = carpetCleaningSchema.parse(req.body) as CarpetCleaningParams;
    const calculation = calculateCarpetCleaningEsg(params);

    res.json({
      success: true,
      serviceType: "carpet_cleaning",
      calculation,
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || "Invalid carpet cleaning parameters",
    });
  }
});

// ==========================================
// POST /api/esg/calculate/light-demolition
// ==========================================
const lightDemolitionSchema = z.object({
  totalWeightLbs: z.number().positive(),
  woodSalvagedLbs: z.number().min(0),
  metalSalvagedLbs: z.number().min(0),
  concreteSalvagedLbs: z.number().min(0),
  method: z.enum(["deconstruction", "standard_demolition"]),
  hazmatProperlyDisposed: z.boolean().optional(),
});

router.post("/calculate/light-demolition", async (req, res) => {
  try {
    const params = lightDemolitionSchema.parse(req.body) as LightDemolitionParams;
    const calculation = calculateLightDemolitionEsg(params);

    res.json({
      success: true,
      serviceType: "light_demolition",
      calculation,
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || "Invalid light demolition parameters",
    });
  }
});

// ==========================================
// POST /api/esg/calculate/junk-removal
// ==========================================
const junkRemovalSchema = z.object({
  totalWeightLbs: z.number().positive(),
  recycledWeightLbs: z.number().min(0),
  donatedWeightLbs: z.number().min(0),
  ewasteWeightLbs: z.number().min(0).optional(),
  haulDistanceMiles: z.number().min(0),
});

router.post("/calculate/junk-removal", async (req, res) => {
  try {
    const params = junkRemovalSchema.parse(req.body) as JunkRemovalParams;
    const calculation = calculateJunkRemovalEsg(params);

    res.json({
      success: true,
      serviceType: "junk_removal",
      calculation,
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || "Invalid junk removal parameters",
    });
  }
});

// ==========================================
// POST /api/esg/calculate/batch
// Calculate multiple services at once
// ==========================================
const batchCalculateSchema = z.object({
  calculations: z.array(
    z.object({
      serviceType: z.string(),
      params: z.record(z.any()),
    })
  ),
});

router.post("/calculate/batch", async (req, res) => {
  try {
    const { calculations } = batchCalculateSchema.parse(req.body);
    const results = [];

    for (const calc of calculations) {
      try {
        let calculation;
        switch (calc.serviceType) {
          case "pressure_washing":
            calculation = calculatePressureWashingEsg(calc.params as PressureWashingParams);
            break;
          case "gutter_cleaning":
            calculation = calculateGutterCleaningEsg(calc.params as GutterCleaningParams);
            break;
          case "pool_cleaning":
            calculation = calculatePoolCleaningEsg(calc.params as PoolCleaningParams);
            break;
          case "home_cleaning":
          case "cleaning":
            calculation = calculateHomeCleaningEsg(calc.params as HomeCleaningParams);
            break;
          case "landscaping":
            calculation = calculateLandscapingEsg(calc.params as LandscapingParams);
            break;
          case "handyman":
            calculation = calculateHandymanEsg(calc.params as HandymanParams);
            break;
          case "moving_labor":
          case "furniture_moving":
          case "moving":
            calculation = calculateMovingEsg(calc.params as MovingParams);
            break;
          case "carpet_cleaning":
            calculation = calculateCarpetCleaningEsg(calc.params as CarpetCleaningParams);
            break;
          case "light_demolition":
            calculation = calculateLightDemolitionEsg(calc.params as LightDemolitionParams);
            break;
          case "junk_removal":
            calculation = calculateJunkRemovalEsg(calc.params as JunkRemovalParams);
            break;
          default:
            throw new Error(`Unsupported service type: ${calc.serviceType}`);
        }

        results.push({
          serviceType: calc.serviceType,
          success: true,
          calculation,
        });
      } catch (error: any) {
        results.push({
          serviceType: calc.serviceType,
          success: false,
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      results,
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || "Invalid batch calculation request",
    });
  }
});

export default router;
