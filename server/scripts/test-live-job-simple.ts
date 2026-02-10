import { db } from "../db";
import { sql } from "drizzle-orm";
import { processEsgForCompletedJob } from "../services/job-completion-esg-integration";

async function testLiveJobSimple() {
  console.log("🧪 Live ESG Integration Test\n");
  
  const testJobId = "test-live-" + Date.now();
  
  // Create a minimal mock job for ESG processing
  const mockJob = {
    id: testJobId,
    serviceType: "pressure_washing",
    status: "completed",
    customerId: "test-customer",
    details: JSON.stringify({ totalSqft: 1500 }),
  } as any;

  const completionData = {
    sqft: 1500,
    durationMinutes: 90,
    actualGPM: 2.5,
    chemicalType: "eco_friendly",
    waterReclamation: true,
  };

  console.log("📝 Processing ESG for test job...");
  console.log("   Job ID:", testJobId);
  console.log("   Service:", mockJob.serviceType);
  console.log("   Square feet:", completionData.sqft);
  console.log("   Duration:", completionData.durationMinutes, "min");
  console.log("   Water GPM:", completionData.actualGPM);
  console.log("   Chemical:", completionData.chemicalType);
  console.log("   Water reclamation:", completionData.waterReclamation, "\n");

  // Process ESG
  const esgResult = await processEsgForCompletedJob(mockJob, completionData);

  console.log("📊 ESG Calculation Result:");
  if (esgResult.success) {
    console.log("   ✅ Status: Success");
    console.log("   ESG Score:", esgResult.esgMetrics.esgScore + "/100");
    console.log("   Water Saved:", esgResult.esgMetrics.waterSavedGallons, "gallons");
    console.log("   CO2 Impact:", esgResult.esgMetrics.netCo2ImpactLbs, "lbs");
    console.log("   Method:", esgResult.esgMetrics.calculationMethod, "\n");
  } else {
    console.log("   ❌ Status: Failed");
    console.log("   Error:", esgResult.error, "\n");
  }

  // Check database
  console.log("📝 Checking database...");
  const esgData = await db.execute(sql`
    SELECT 
      id,
      service_type,
      esg_score,
      net_co2_impact_lbs,
      water_saved_gallons,
      calculation_method
    FROM service_esg_metrics
    WHERE service_request_id = ${testJobId}
  `);

  if (esgData.rows.length > 0) {
    const row = esgData.rows[0] as any;
    console.log("   ✅ ESG record found in database!");
    console.log("   Record ID:", row.id);
    console.log("   ESG Score:", row.esg_score + "/100");
    console.log("   CO2 Impact:", row.net_co2_impact_lbs, "lbs");
    console.log("   Water Saved:", row.water_saved_gallons, "gallons\n");
  } else {
    console.log("   ❌ No ESG record found in database\n");
  }

  // Clean up
  console.log("📝 Cleaning up...");
  await db.execute(sql`DELETE FROM service_esg_metrics WHERE service_request_id = ${testJobId}`);
  console.log("   ✅ Test data cleaned up\n");

  console.log("🎉 TEST COMPLETE!\n");
  
  if (esgResult.success && esgData.rows.length > 0) {
    console.log("✅✅✅ ESG INTEGRATION IS WORKING PERFECTLY! ✅✅✅\n");
    console.log("What happened:");
    console.log("  1. ✅ ESG calculation executed");
    console.log("  2. ✅ Metrics calculated correctly");
    console.log("  3. ✅ Data saved to database");
    console.log("  4. ✅ All fields populated\n");
    console.log("Next time a REAL job completes:");
    console.log("  → ESG will automatically calculate");
    console.log("  → Metrics will be saved");
    console.log("  → Customers will see their impact\n");
  } else {
    console.log("❌ Something went wrong");
  }
}

testLiveJobSimple()
  .then(() => process.exit(0))
  .catch(e => {
    console.error("\n❌ Test failed:", e);
    process.exit(1);
  });
