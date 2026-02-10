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
} from "../services/service-esg-calculators";

async function testAllCalculators() {
  console.log("🧪 Testing All ESG Calculators...\n");

  let passed = 0;
  let failed = 0;

  // Test 1: Pressure Washing
  try {
    const result = calculatePressureWashingEsg({
      sqft: 1000,
      durationMinutes: 60,
      actualGPM: 2.0,
      chemicalType: "eco_friendly",
      waterReclamation: true,
    });
    console.assert(result.esgScore >= 0 && result.esgScore <= 100, "ESG score in valid range");
    console.assert(result.waterSavedGallons && result.waterSavedGallons > 0, "Water saved calculated");
    console.log("✅ Pressure Washing:", result.esgScore, "score,", result.waterSavedGallons?.toFixed(1), "gal saved");
    passed++;
  } catch (e) {
    console.error("❌ Pressure Washing failed:", e);
    failed++;
  }

  // Test 2: Gutter Cleaning
  try {
    const result = calculateGutterCleaningEsg({
      linearFeet: 150,
      debrisDisposalMethod: "composted",
      stormPreventionCredit: true,
    });
    console.assert(result.esgScore >= 0 && result.esgScore <= 100);
    console.log("✅ Gutter Cleaning:", result.esgScore, "score,", result.netCo2ImpactLbs.toFixed(1), "lbs CO2");
    passed++;
  } catch (e) {
    console.error("❌ Gutter Cleaning failed:", e);
    failed++;
  }

  // Test 3: Pool Cleaning
  try {
    const result = calculatePoolCleaningEsg({
      poolSizeGallons: 20000,
      chemicalOptimizationPct: 15,
      leakDetected: false,
      filterEfficiencyImprovement: true,
    });
    console.assert(result.esgScore >= 0 && result.esgScore <= 100);
    console.log("✅ Pool Cleaning:", result.esgScore, "score");
    passed++;
  } catch (e) {
    console.error("❌ Pool Cleaning failed:", e);
    failed++;
  }

  // Test 4: Home Cleaning
  try {
    const result = calculateHomeCleaningEsg({
      sqft: 1500,
      productType: "eco_friendly",
      productUsedOz: 16,
      waterUsedGallons: 10,
      reusableClothsUsed: 5,
    });
    console.assert(result.esgScore >= 0 && result.esgScore <= 100);
    console.log("✅ Home Cleaning:", result.esgScore, "score");
    passed++;
  } catch (e) {
    console.error("❌ Home Cleaning failed:", e);
    failed++;
  }

  // Test 5: Landscaping
  try {
    const result = calculateLandscapingEsg({
      lawnSqft: 5000,
      treesPlanted: 2,
      mulchLbs: 50,
      equipmentType: "electric_mower",
      durationHours: 2,
      organicFertilizer: true,
    });
    console.assert(result.esgScore >= 0 && result.esgScore <= 100);
    console.log("✅ Landscaping:", result.esgScore, "score,", result.netCo2ImpactLbs.toFixed(1), "lbs CO2");
    passed++;
  } catch (e) {
    console.error("❌ Landscaping failed:", e);
    failed++;
  }

  // Test 6: Handyman
  try {
    const result = calculateHandymanEsg({
      repairType: "appliance",
      itemsRepaired: 2,
      recycledMaterialsLbs: 10,
      preventedReplacement: true,
    });
    console.assert(result.esgScore >= 0 && result.esgScore <= 100);
    console.log("✅ Handyman:", result.esgScore, "score,", result.netCo2ImpactLbs.toFixed(1), "lbs CO2 saved");
    passed++;
  } catch (e) {
    console.error("❌ Handyman failed:", e);
    failed++;
  }

  // Test 7: Moving
  try {
    const result = calculateMovingEsg({
      distanceMiles: 15,
      truckType: "standard",
      reusableBlankets: 25,
      plasticWrapAvoided: true,
      reusableBinsUsed: 15,
      routeOptimized: true,
    });
    console.assert(result.esgScore >= 0 && result.esgScore <= 100);
    console.log("✅ Moving:", result.esgScore, "score");
    passed++;
  } catch (e) {
    console.error("❌ Moving failed:", e);
    failed++;
  }

  // Test 8: Carpet Cleaning
  try {
    const result = calculateCarpetCleaningEsg({
      sqft: 1000,
      method: "low_moisture",
      ecoFriendlyProducts: true,
      carpetLifeExtension: true,
    });
    console.assert(result.esgScore >= 0 && result.esgScore <= 100);
    console.log("✅ Carpet Cleaning:", result.esgScore, "score");
    passed++;
  } catch (e) {
    console.error("❌ Carpet Cleaning failed:", e);
    failed++;
  }

  // Test 9: Light Demolition
  try {
    const result = calculateLightDemolitionEsg({
      totalWeightLbs: 2000,
      woodSalvagedLbs: 500,
      metalSalvagedLbs: 200,
      concreteSalvagedLbs: 300,
      method: "selective_deconstruction",
      hazmatProperlyDisposed: true,
    });
    console.assert(result.esgScore >= 0 && result.esgScore <= 100);
    console.log("✅ Light Demolition:", result.esgScore, "score");
    passed++;
  } catch (e) {
    console.error("❌ Light Demolition failed:", e);
    failed++;
  }

  // Test 10: Junk Removal
  try {
    const result = calculateJunkRemovalEsg({
      totalWeightLbs: 1000,
      recycledWeightLbs: 400,
      donatedWeightLbs: 200,
      ewasteWeightLbs: 50,
      haulDistanceMiles: 12,
    });
    console.assert(result.esgScore >= 0 && result.esgScore <= 100);
    console.log("✅ Junk Removal:", result.esgScore, "score,", result.netCo2ImpactLbs.toFixed(1), "lbs CO2 saved");
    passed++;
  } catch (e) {
    console.error("❌ Junk Removal failed:", e);
    failed++;
  }

  console.log(`\n📊 Results: ${passed}/10 passed, ${failed}/10 failed`);

  if (failed === 0) {
    console.log("✅ ALL CALCULATOR TESTS PASSED\n");
    process.exit(0);
  } else {
    console.error("❌ SOME CALCULATOR TESTS FAILED\n");
    process.exit(1);
  }
}

testAllCalculators();
