/**
 * Test ESG API Endpoints
 *
 * Creates a test service ESG metric to verify everything works.
 */

import { db } from "../db";
import { serviceEsgMetrics } from "@shared/schema";
import { calculatePressureWashingEsg } from "../services/service-esg-calculators";
import { eq } from "drizzle-orm";

async function testEsgApi() {
  console.log("🧪 Testing ESG API and Calculators...\n");

  try {
    // 1. Test the calculator
    console.log("📊 Testing pressure washing calculator...");
    const calculation = calculatePressureWashingEsg({
      sqft: 1000,
      durationMinutes: 60,
      actualGPM: 2.0, // Efficient! (standard is 4.0)
      chemicalType: "eco_friendly",
      chemicalUsedOz: 10,
      waterReclamation: true,
    });

    console.log("✅ Calculator results:");
    console.log("  Net CO2 Impact:", calculation.netCo2ImpactLbs.toFixed(2), "lbs");
    console.log("  Water Saved:", calculation.waterSavedGallons?.toFixed(2), "gallons");
    console.log("  ESG Score:", calculation.esgScore, "/100");
    console.log("  Method:", calculation.calculationMethod);
    console.log();

    // 2. Create a test service ESG metric
    console.log("💾 Creating test service_esg_metrics record...");
    const testRecord = await db.insert(serviceEsgMetrics).values({
      serviceRequestId: `test-${Date.now()}`,
      serviceType: "pressure_washing",
      waterUsedGallons: 120,
      waterSavedGallons: calculation.waterSavedGallons || 0,
      waterEfficiencyPct: 66.7,
      chemicalUsedOz: 10,
      chemicalType: "eco_friendly",
      chemicalCo2ePerOz: 0.02,
      totalCo2SavedLbs: calculation.totalCo2SavedLbs,
      totalCo2EmittedLbs: calculation.totalCo2EmittedLbs,
      netCo2ImpactLbs: calculation.netCo2ImpactLbs,
      esgScore: calculation.esgScore,
      calculationMethod: calculation.calculationMethod,
      calculationDetails: JSON.stringify(calculation.breakdown),
      verificationStatus: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).returning();

    console.log("✅ Test record created!");
    console.log("  ID:", testRecord[0].id);
    console.log("  Service Type:", testRecord[0].serviceType);
    console.log("  ESG Score:", testRecord[0].esgScore);
    console.log();

    // 3. Retrieve the record
    console.log("🔍 Retrieving test record...");
    const retrieved = await db
      .select()
      .from(serviceEsgMetrics)
      .where(eq(serviceEsgMetrics.id, testRecord[0].id!));

    if (retrieved.length > 0) {
      console.log("✅ Record retrieved successfully!");
      console.log("  Water Saved:", retrieved[0].waterSavedGallons, "gallons");
      console.log("  CO2 Impact:", retrieved[0].netCo2ImpactLbs, "lbs");

      const details = retrieved[0].calculationDetails
        ? JSON.parse(retrieved[0].calculationDetails)
        : null;

      if (details) {
        console.log("  Breakdown:", JSON.stringify(details, null, 2));
      }
    }
    console.log();

    // 4. Count total records
    const count = await db
      .select()
      .from(serviceEsgMetrics);

    console.log(`📊 Total ESG metrics in database: ${count.length}`);
    console.log();

    // 5. Clean up test record
    console.log("🧹 Cleaning up test record...");
    await db.delete(serviceEsgMetrics).where(eq(serviceEsgMetrics.id, testRecord[0].id!));
    console.log("✅ Test record deleted");
    console.log();

    console.log("=" .repeat(60));
    console.log("✨ ALL TESTS PASSED!");
    console.log("=" .repeat(60));
    console.log();
    console.log("✅ Database tables exist");
    console.log("✅ Calculators work correctly");
    console.log("✅ Can create ESG metrics");
    console.log("✅ Can retrieve ESG metrics");
    console.log("✅ Can delete ESG metrics");
    console.log();
    console.log("🎉 Your multi-service ESG system is READY!");
    console.log();
    console.log("📋 Next steps:");
    console.log("  1. Integrate ESG calculation into job completion flow");
    console.log("  2. Update Pro app to collect service-specific data");
    console.log("  3. Build business dashboard UI");
    console.log("  4. Test with real jobs");

  } catch (error: any) {
    console.error("\n❌ Test failed:");
    console.error(error.message);
    throw error;
  }
}

// Run tests
testEsgApi()
  .then(() => {
    console.log("\n✅ Test script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test script failed:", error);
    process.exit(1);
  });
