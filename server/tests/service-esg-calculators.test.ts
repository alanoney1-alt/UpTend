/**
 * Service ESG Calculator Tests
 *
 * Unit tests for service-specific ESG calculations
 */

import { describe, it, expect } from "vitest";
import {
  calculatePressureWashingEsg,
  calculateGutterCleaningEsg,
  calculatePoolCleaningEsg,
  calculateServiceEsg,
  type PressureWashingParams,
  type GutterCleaningParams,
  type PoolCleaningParams,
} from "../services/service-esg-calculators";

describe("Pressure Washing ESG Calculator", () => {
  it("calculates water savings correctly", () => {
    const params: PressureWashingParams = {
      sqft: 1000,
      durationMinutes: 60,
      actualGPM: 2.0, // 50% reduction from standard 4.0 GPM
    };

    const result = calculatePressureWashingEsg(params);

    expect(result.waterSavedGallons).toBeGreaterThan(0);
    expect(result.totalCo2SavedLbs).toBeGreaterThan(0);
    expect(result.esgScore).toBeGreaterThanOrEqual(0);
    expect(result.esgScore).toBeLessThanOrEqual(100);
  });

  it("rewards eco-friendly chemicals", () => {
    const standardParams: PressureWashingParams = {
      sqft: 1000,
      durationMinutes: 60,
      actualGPM: 3.0,
      chemicalUsedOz: 80,
      chemicalType: "standard",
    };

    const ecoParams: PressureWashingParams = {
      sqft: 1000,
      durationMinutes: 60,
      actualGPM: 3.0,
      chemicalUsedOz: 80,
      chemicalType: "eco_friendly",
    };

    const standardResult = calculatePressureWashingEsg(standardParams);
    const ecoResult = calculatePressureWashingEsg(ecoParams);

    expect(ecoResult.esgScore).toBeGreaterThan(standardResult.esgScore);
    expect(ecoResult.totalCo2EmittedLbs).toBeLessThan(standardResult.totalCo2EmittedLbs);
  });

  it("rewards water reclamation", () => {
    const noReclamationParams: PressureWashingParams = {
      sqft: 1000,
      durationMinutes: 60,
      actualGPM: 3.0,
      waterReclamation: false,
    };

    const reclamationParams: PressureWashingParams = {
      sqft: 1000,
      durationMinutes: 60,
      actualGPM: 3.0,
      waterReclamation: true,
    };

    const noReclamationResult = calculatePressureWashingEsg(noReclamationParams);
    const reclamationResult = calculatePressureWashingEsg(reclamationParams);

    expect(reclamationResult.waterSavedGallons).toBeGreaterThan(noReclamationResult.waterSavedGallons!);
    expect(reclamationResult.esgScore).toBeGreaterThan(noReclamationResult.esgScore);
  });

  it("has valid breakdown details", () => {
    const params: PressureWashingParams = {
      sqft: 1000,
      durationMinutes: 60,
      actualGPM: 2.0,
      chemicalType: "eco_friendly",
      waterReclamation: true,
    };

    const result = calculatePressureWashingEsg(params);

    expect(result.breakdown).toBeDefined();
    expect(result.breakdown.waterSavedGallons).toBeDefined();
    expect(result.breakdown.chemicalSavingsLbs).toBeDefined();
    expect(result.breakdown.waterEfficiency).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.chemicalScore).toBeGreaterThanOrEqual(0);
  });
});

describe("Gutter Cleaning ESG Calculator", () => {
  it("calculates debris weight correctly", () => {
    const params: GutterCleaningParams = {
      linearFeet: 200,
    };

    const result = calculateGutterCleaningEsg(params);

    expect(result.breakdown.totalDebrisLbs).toBe(100); // 200 ft × 0.5 lbs/ft
    expect(result.breakdown.organicDebrisLbs).toBe(70); // 70% organic
  });

  it("rewards composting over landfilling", () => {
    const landfilledParams: GutterCleaningParams = {
      linearFeet: 200,
      debrisDisposalMethod: "landfilled",
    };

    const compostedParams: GutterCleaningParams = {
      linearFeet: 200,
      debrisDisposalMethod: "composted",
    };

    const landfilledResult = calculateGutterCleaningEsg(landfilledParams);
    const compostedResult = calculateGutterCleaningEsg(compostedParams);

    expect(compostedResult.esgScore).toBeGreaterThan(landfilledResult.esgScore);
    expect(compostedResult.totalCo2SavedLbs).toBeGreaterThan(landfilledResult.totalCo2SavedLbs);
  });

  it("awards storm prevention credit", () => {
    const noPreventionParams: GutterCleaningParams = {
      linearFeet: 200,
      stormPreventionCredit: false,
    };

    const preventionParams: GutterCleaningParams = {
      linearFeet: 200,
      stormPreventionCredit: true,
    };

    const noPreventionResult = calculateGutterCleaningEsg(noPreventionParams);
    const preventionResult = calculateGutterCleaningEsg(preventionParams);

    expect(preventionResult.totalCo2SavedLbs).toBeGreaterThan(noPreventionResult.totalCo2SavedLbs);
    expect(preventionResult.breakdown.stormPreventionCreditLbs).toBe(50);
  });

  it("handles mixed disposal method", () => {
    const params: GutterCleaningParams = {
      linearFeet: 200,
      debrisDisposalMethod: "mixed",
    };

    const result = calculateGutterCleaningEsg(params);

    expect(result.esgScore).toBeGreaterThan(0);
    expect(result.esgScore).toBeLessThan(100);
    expect(result.breakdown.co2SavedFromComposting).toBeGreaterThan(0);
  });
});

describe("Pool Cleaning ESG Calculator", () => {
  it("calculates chemical optimization correctly", () => {
    const params: PoolCleaningParams = {
      poolSizeGallons: 20000,
      chemicalOptimizationPct: 30, // 30% reduction
    };

    const result = calculatePoolCleaningEsg(params);

    expect(result.breakdown.chemicalSavedLbs).toBeGreaterThan(0);
    expect(result.breakdown.chemicalCo2SavedLbs).toBeGreaterThan(0);
    expect(result.esgScore).toBeGreaterThanOrEqual(0);
  });

  it("rewards leak detection", () => {
    const noLeakParams: PoolCleaningParams = {
      poolSizeGallons: 20000,
      leakDetected: false,
    };

    const leakParams: PoolCleaningParams = {
      poolSizeGallons: 20000,
      leakDetected: true,
      leakGallonsPerDaySaved: 10,
    };

    const noLeakResult = calculatePoolCleaningEsg(noLeakParams);
    const leakResult = calculatePoolCleaningEsg(leakParams);

    expect(leakResult.waterSavedGallons).toBeGreaterThan(0);
    expect(leakResult.totalCo2SavedLbs).toBeGreaterThan(noLeakResult.totalCo2SavedLbs);
  });

  it("rewards filter efficiency improvement", () => {
    const noImprovementParams: PoolCleaningParams = {
      poolSizeGallons: 20000,
      filterEfficiencyImprovement: false,
    };

    const improvementParams: PoolCleaningParams = {
      poolSizeGallons: 20000,
      filterEfficiencyImprovement: true,
    };

    const noImprovementResult = calculatePoolCleaningEsg(noImprovementParams);
    const improvementResult = calculatePoolCleaningEsg(improvementParams);

    expect(improvementResult.energySavedKwh).toBeGreaterThan(0);
    expect(improvementResult.breakdown.filterEnergySavedKwh).toBeGreaterThan(0);
    expect(improvementResult.esgScore).toBeGreaterThan(noImprovementResult.esgScore);
  });

  it("has all score components weighted correctly", () => {
    const params: PoolCleaningParams = {
      poolSizeGallons: 20000,
      chemicalOptimizationPct: 50,
      leakDetected: true,
      leakGallonsPerDaySaved: 10,
      filterEfficiencyImprovement: true,
    };

    const result = calculatePoolCleaningEsg(params);

    expect(result.breakdown.chemicalScore).toBeDefined();
    expect(result.breakdown.leakScore).toBeDefined();
    expect(result.breakdown.filterScore).toBeDefined();
    expect(result.esgScore).toBeGreaterThan(50); // Should be good with all optimizations
  });
});

describe("Service ESG Router", () => {
  it("routes pressure washing correctly", async () => {
    const result = await calculateServiceEsg("pressure_washing", {
      sqft: 1000,
      durationMinutes: 60,
      actualGPM: 2.0,
    });

    expect(result).toBeDefined();
    expect(result.esgScore).toBeGreaterThanOrEqual(0);
    expect(result.calculationMethod).toContain("EPA");
  });

  it("routes gutter cleaning correctly", async () => {
    const result = await calculateServiceEsg("gutter_cleaning", {
      linearFeet: 200,
      debrisDisposalMethod: "composted",
    });

    expect(result).toBeDefined();
    expect(result.esgScore).toBeGreaterThanOrEqual(0);
  });

  it("routes pool cleaning correctly", async () => {
    const result = await calculateServiceEsg("pool_cleaning", {
      poolSizeGallons: 20000,
      chemicalOptimizationPct: 30,
    });

    expect(result).toBeDefined();
    expect(result.esgScore).toBeGreaterThanOrEqual(0);
  });

  it("throws error for unsupported service type", async () => {
    await expect(
      calculateServiceEsg("unsupported_service", {})
    ).rejects.toThrow("ESG calculation not implemented");
  });
});

describe("ESG Calculation Standards", () => {
  it("all calculators return scores between 0-100", async () => {
    const services = [
      { type: "pressure_washing", params: { sqft: 1000, durationMinutes: 60, actualGPM: 2.0 } },
      { type: "gutter_cleaning", params: { linearFeet: 200 } },
      { type: "pool_cleaning", params: { poolSizeGallons: 20000 } },
    ];

    for (const service of services) {
      const result = await calculateServiceEsg(service.type, service.params);
      expect(result.esgScore).toBeGreaterThanOrEqual(0);
      expect(result.esgScore).toBeLessThanOrEqual(100);
    }
  });

  it("all calculators have required fields", async () => {
    const result = await calculateServiceEsg("pressure_washing", {
      sqft: 1000,
      durationMinutes: 60,
      actualGPM: 2.0,
    });

    expect(result.totalCo2SavedLbs).toBeDefined();
    expect(result.totalCo2EmittedLbs).toBeDefined();
    expect(result.netCo2ImpactLbs).toBeDefined();
    expect(result.esgScore).toBeDefined();
    expect(result.breakdown).toBeDefined();
    expect(result.calculationMethod).toBeDefined();
  });

  it("all calculators have documented calculation methods", async () => {
    const services = [
      { type: "pressure_washing", params: { sqft: 1000, durationMinutes: 60, actualGPM: 2.0 } },
      { type: "gutter_cleaning", params: { linearFeet: 200 } },
      { type: "pool_cleaning", params: { poolSizeGallons: 20000 } },
    ];

    for (const service of services) {
      const result = await calculateServiceEsg(service.type, service.params);
      expect(result.calculationMethod).toBeTruthy();
      expect(result.calculationMethod.length).toBeGreaterThan(10);
    }
  });
});
