import { processEsgForCompletedJob, getJobEsgMetrics, formatEsgMetricsForDisplay } from "../services/job-completion-esg-integration";
import type { ServiceRequest } from "@shared/schema";

async function testJobCompletionIntegration() {
  console.log("🧪 Testing Job Completion ESG Integration...\n");

  let passed = 0;
  let failed = 0;

  // Test 1: Pressure Washing Job
  try {
    const mockServiceRequest = {
      id: "test-pressure-wash-" + Date.now(),
      serviceType: "pressure_washing",
      status: "completed",
      customerId: "test-customer",
      details: JSON.stringify({ totalSqft: 1000 }),
    } as any;

    const completionData = {
      sqft: 1000,
      durationMinutes: 60,
      actualGPM: 2.5,
      chemicalType: "eco_friendly",
      waterReclamation: true,
    };

    const result = await processEsgForCompletedJob(mockServiceRequest, completionData);
    
    console.assert(result.success === true, "Job processing succeeded");
    console.assert(result.esgMetrics, "ESG metrics returned");
    console.assert(result.esgMetrics.esgScore >= 0 && result.esgMetrics.esgScore <= 100, "Valid ESG score");
    
    console.log("✅ Pressure Washing Job:", result.esgMetrics.esgScore, "score,", result.esgMetrics.waterSavedGallons, "gal saved");
    passed++;

    // Clean up
    const { EsgStorage } = await import("../storage/domains/esg/storage");
    const esgStorage = new EsgStorage();
    await esgStorage.deleteServiceEsgMetrics(result.esgMetrics.id);
  } catch (e) {
    console.error("❌ Pressure Washing Job failed:", e);
    failed++;
  }

  // Test 2: Gutter Cleaning Job
  try {
    const mockServiceRequest = {
      id: "test-gutter-" + Date.now(),
      serviceType: "gutter_cleaning",
      status: "completed",
      customerId: "test-customer",
      details: JSON.stringify({ perimeter: 120 }),
    } as any;

    const completionData = {
      linearFeet: 120,
      debrisDisposal: "composted",
    };

    const result = await processEsgForCompletedJob(mockServiceRequest, completionData);
    
    console.assert(result.success === true);
    console.assert(result.esgMetrics);
    
    console.log("✅ Gutter Cleaning Job:", result.esgMetrics.esgScore, "score");
    passed++;

    // Clean up
    const { EsgStorage } = await import("../storage/domains/esg/storage");
    const esgStorage = new EsgStorage();
    await esgStorage.deleteServiceEsgMetrics(result.esgMetrics.id);
  } catch (e) {
    console.error("❌ Gutter Cleaning Job failed:", e);
    failed++;
  }

  // Test 3: Handyman Job
  try {
    const mockServiceRequest = {
      id: "test-handyman-" + Date.now(),
      serviceType: "handyman",
      status: "completed",
      customerId: "test-customer",
      details: JSON.stringify({ itemCount: 3 }),
    } as any;

    const completionData = {
      itemsRepaired: 3,
      repairType: "appliance",
      preventedReplacement: true,
    };

    const result = await processEsgForCompletedJob(mockServiceRequest, completionData);
    
    console.assert(result.success === true);
    console.assert(result.esgMetrics);
    
    console.log("✅ Handyman Job:", result.esgMetrics.esgScore, "score");
    passed++;

    // Clean up
    const { EsgStorage } = await import("../storage/domains/esg/storage");
    const esgStorage = new EsgStorage();
    await esgStorage.deleteServiceEsgMetrics(result.esgMetrics.id);
  } catch (e) {
    console.error("❌ Handyman Job failed:", e);
    failed++;
  }

  // Test 4: Unsupported Service Type
  try {
    const mockServiceRequest = {
      id: "test-unsupported-" + Date.now(),
      serviceType: "unknown_service",
      status: "completed",
      customerId: "test-customer",
      details: "{}",
    } as any;

    const result = await processEsgForCompletedJob(mockServiceRequest, {});
    
    console.assert(result.success === false, "Unsupported service returns failure");
    console.assert(result.error, "Error message provided");
    
    console.log("✅ Unsupported Service Type: correctly rejected");
    passed++;
  } catch (e) {
    console.error("❌ Unsupported Service Type test failed:", e);
    failed++;
  }

  // Test 5: Format ESG Metrics for Display
  try {
    const mockMetrics = {
      esgScore: 75,
      netCo2ImpactLbs: 150,
      waterSavedGallons: 200,
      energySavedKwh: 10,
      treesEquivalent: 3,
    };

    const formatted = formatEsgMetricsForDisplay(mockMetrics);
    
    console.assert(formatted.includes("✅"), "Contains success icons");
    console.assert(formatted.includes("150 lbs"), "Contains CO2 data");
    console.assert(formatted.includes("200 gallons"), "Contains water data");
    console.assert(formatted.includes("75/100"), "Contains ESG score");
    
    console.log("✅ Format Display: correctly formatted");
    passed++;
  } catch (e) {
    console.error("❌ Format Display failed:", e);
    failed++;
  }

  console.log(`\n📊 Results: ${passed}/5 passed, ${failed}/5 failed`);

  if (failed === 0) {
    console.log("✅ ALL INTEGRATION TESTS PASSED\n");
    process.exit(0);
  } else {
    console.error("❌ SOME INTEGRATION TESTS FAILED\n");
    process.exit(1);
  }
}

testJobCompletionIntegration();
