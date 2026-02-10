# Integration Guide - ESG Calculation in Job Completion Flow

## Overview

Now that the database migration is complete, you need to integrate ESG calculation into your job completion workflow.

---

## Step 1: Find Job Completion Handler

**Location:** Probably in one of these files:
- `/server/routes/jobs/completion.routes.ts`
- `/server/routes/service-requests.routes.ts`
- `/server/services/job-completion-service.ts`

Look for code that:
- Marks a service request as "completed"
- Triggers payment capture
- Sends completion notifications

---

## Step 2: Add ESG Calculation

After job is marked complete, add this code:

```typescript
import { EsgStorage } from "../storage/domains/esg/storage";
import { calculateServiceEsg } from "../services/service-esg-calculators";

const esgStorage = new EsgStorage();

// After job completion...
try {
  // Get service-specific parameters from the job data
  const calculationParams = mapJobDataToCalculatorParams(
    serviceRequest.serviceType,
    serviceRequest
  );

  // Calculate ESG metrics
  const calculation = await calculateServiceEsg(
    serviceRequest.serviceType,
    calculationParams
  );

  // Store in database
  await esgStorage.createServiceEsgMetrics({
    serviceRequestId: serviceRequest.id,
    serviceType: serviceRequest.serviceType,
    waterUsedGallons: calculationParams.waterUsedGallons || 0,
    waterSavedGallons: calculation.waterSavedGallons || 0,
    waterEfficiencyPct: calculationParams.waterEfficiencyPct || 0,
    energyUsedKwh: calculationParams.energyUsedKwh || 0,
    energySavedKwh: calculation.energySavedKwh || 0,
    chemicalUsedOz: calculationParams.chemicalUsedOz || 0,
    chemicalType: calculationParams.chemicalType || null,
    chemicalCo2ePerOz: calculationParams.chemicalCo2ePerOz || 0,
    materialsSalvagedLbs: calculationParams.materialsSalvagedLbs || 0,
    salvageRate: calculationParams.salvageRate || 0,
    preventionValue: calculationParams.preventionValue || 0,
    repairVsReplaceSavings: calculationParams.repairVsReplaceSavings || 0,
    routeOptimizationSavings: calculationParams.routeOptimizationSavings || 0,
    carbonSequestered: calculationParams.carbonSequestered || 0,
    totalCo2SavedLbs: calculation.totalCo2SavedLbs,
    totalCo2EmittedLbs: calculation.totalCo2EmittedLbs,
    netCo2ImpactLbs: calculation.netCo2ImpactLbs,
    esgScore: calculation.esgScore,
    calculationMethod: calculation.calculationMethod,
    verificationStatus: "pending",
    calculationDetails: JSON.stringify(calculation.breakdown),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  console.log(`✅ ESG metrics saved for job ${serviceRequest.id}`);
} catch (error) {
  console.error("❌ Failed to calculate ESG metrics:", error);
  // Don't fail job completion if ESG calculation fails
}
```

---

## Step 3: Map Job Data to Calculator Parameters

Create a helper function to map service request data to calculator params:

```typescript
function mapJobDataToCalculatorParams(
  serviceType: string,
  serviceRequest: any
): Record<string, any> {
  switch (serviceType) {
    case "pressure_washing":
      return {
        sqft: serviceRequest.propertyDetails?.sqft || 1000,
        durationMinutes: serviceRequest.actualDuration || 60,
        actualGPM: serviceRequest.equipmentDetails?.gpm || 3.0,
        chemicalType: serviceRequest.chemicalType || "standard",
        chemicalUsedOz: serviceRequest.chemicalUsedOz || 0,
        waterReclamation: serviceRequest.waterReclamation || false,
      };

    case "gutter_cleaning":
      return {
        linearFeet: serviceRequest.propertyDetails?.gutterLinearFeet || 100,
        debrisDisposalMethod: serviceRequest.debrisDisposal || "mixed",
        stormPreventionCredit: true, // Always give credit for maintenance
      };

    case "pool_cleaning":
      return {
        poolSizeGallons: serviceRequest.poolDetails?.gallons || 20000,
        chemicalOptimizationPct: serviceRequest.chemicalOptimization || 0,
        leakDetected: serviceRequest.leakDetected || false,
        leakGallonsPerDaySaved: serviceRequest.leakGallonsSaved || 0,
        filterEfficiencyImprovement: serviceRequest.filterImprovement || false,
      };

    case "home_cleaning":
    case "cleaning":
      return {
        sqft: serviceRequest.propertyDetails?.sqft || 1500,
        productType: serviceRequest.productType || "eco_friendly",
        productUsedOz: serviceRequest.productUsedOz || 16,
        waterUsedGallons: serviceRequest.waterUsed || 10,
        reusableClothsUsed: serviceRequest.reusableClothsUsed || 5,
      };

    case "landscaping":
      return {
        lawnSqft: serviceRequest.propertyDetails?.lawnSqft || 5000,
        treesPlanted: serviceRequest.treesPlanted || 0,
        mulchLbs: serviceRequest.mulchLbs || 0,
        equipmentType: serviceRequest.equipmentType || "gas_mower",
        durationHours: serviceRequest.actualDuration ? serviceRequest.actualDuration / 60 : 2,
        organicFertilizer: serviceRequest.organicFertilizer || false,
      };

    case "handyman":
      return {
        repairType: serviceRequest.repairType || "general",
        itemsRepaired: serviceRequest.itemsRepaired || 1,
        recycledMaterialsLbs: serviceRequest.recycledMaterials || 0,
        preventedReplacement: serviceRequest.preventedReplacement || true,
      };

    case "moving_labor":
    case "furniture_moving":
      return {
        distanceMiles: serviceRequest.distanceMiles || 10,
        truckType: serviceRequest.truckType || "standard",
        reusableBlankets: serviceRequest.reusableBlankets || 20,
        plasticWrapAvoided: serviceRequest.plasticWrapAvoided || true,
        reusableBinsUsed: serviceRequest.reusableBins || 10,
        routeOptimized: serviceRequest.routeOptimized || true,
      };

    case "carpet_cleaning":
      return {
        sqft: serviceRequest.propertyDetails?.carpetSqft || 1000,
        method: serviceRequest.cleaningMethod || "hot_water_extraction",
        ecoFriendlyProducts: serviceRequest.ecoFriendly || true,
        carpetLifeExtension: true, // Always give credit for maintenance
      };

    case "light_demolition":
      return {
        totalWeightLbs: serviceRequest.totalWeightLbs || 1000,
        woodSalvagedLbs: serviceRequest.woodSalvaged || 0,
        metalSalvagedLbs: serviceRequest.metalSalvaged || 0,
        concreteSalvagedLbs: serviceRequest.concreteSalvaged || 0,
        method: serviceRequest.demolitionMethod || "standard_demolition",
        hazmatProperlyDisposed: serviceRequest.hazmatDisposed || false,
      };

    case "junk_removal":
      return {
        totalWeightLbs: serviceRequest.totalWeightLbs || 500,
        recycledWeightLbs: serviceRequest.recycledWeightLbs || 0,
        donatedWeightLbs: serviceRequest.donatedWeightLbs || 0,
        ewasteWeightLbs: serviceRequest.ewasteWeightLbs || 0,
        haulDistanceMiles: serviceRequest.haulDistanceMiles || 10,
      };

    default:
      // Return empty params for unknown service types
      return {};
  }
}
```

---

## Step 4: Test with a Real Job

1. Complete a pressure washing job through your Pro app
2. Check the `service_esg_metrics` table:

```sql
SELECT * FROM service_esg_metrics ORDER BY created_at DESC LIMIT 5;
```

3. Verify:
   - ✅ Record was created
   - ✅ ESG score is calculated (0-100)
   - ✅ CO2 impact is tracked
   - ✅ Service-specific metrics are populated

---

## Step 5: Display ESG Data to Customers

After job completion, show the customer their environmental impact:

**In the completion screen/email:**

```
🌱 Your Environmental Impact

This pressure washing job:
✅ Saved 216 gallons of water
✅ Reduced CO2 emissions by 9.3 lbs
⭐ ESG Score: 71/100

Thanks for choosing eco-friendly services!
```

**Get the data:**

```typescript
import { EsgStorage } from "../storage/domains/esg/storage";

const esgStorage = new EsgStorage();

// After job completion
const esgMetrics = await esgStorage.getServiceEsgMetricsByRequest(serviceRequestId);

if (esgMetrics) {
  // Show to customer
  return {
    waterSavedGallons: esgMetrics.waterSavedGallons,
    co2ImpactLbs: esgMetrics.netCo2ImpactLbs,
    esgScore: esgMetrics.esgScore,
    calculationDetails: JSON.parse(esgMetrics.calculationDetails || '{}'),
  };
}
```

---

## Step 6: Update Pro App Forms

For accurate ESG data, the Pro app needs to collect service-specific inputs.

**Example: Pressure Washing Job Completion Form**

Add these fields:
- [x] Square feet cleaned (number input)
- [x] Job duration (auto-tracked or manual input)
- [ ] Water pressure used (GPM selector: 1.5, 2.0, 2.5, 3.0, 4.0+)
- [ ] Chemical type (dropdown: Standard / Eco-Friendly)
- [ ] Water reclamation used? (checkbox)

**Example: Gutter Cleaning Form**

Add these fields:
- [x] Linear feet of gutters (number input)
- [ ] Debris disposal method (dropdown: Composted / Landfilled / Mixed)
- [ ] Prevented water damage? (checkbox - default YES)

**Repeat for all 11 services** (see full list in GO_LIVE_CHECKLIST.md)

---

## Step 7: Monitor and Iterate

After integration:

1. **Check error logs** - Are ESG calculations failing?
2. **Validate data quality** - Are Pros inputting realistic values?
3. **Spot check calculations** - Do the ESG scores make sense?
4. **Gather Pro feedback** - Is the form too complicated?

---

## Troubleshooting

### "Calculator params are undefined"
- Check that Pro app is sending the required fields
- Use default/estimated values if actual data isn't available
- Log what params are being passed to calculators

### "ESG metrics not being created"
- Check error logs in job completion handler
- Verify `createServiceEsgMetrics` is being called
- Make sure `serviceType` matches calculator expectations

### "ESG scores seem wrong"
- Review calculator constants in `/server/services/service-esg-calculators.ts`
- Check EPA WARM model factors
- Verify units (gallons vs liters, lbs vs kg)

---

## Success Criteria

You'll know it's working when:

✅ Every completed job has an ESG metrics record
✅ Customers see their environmental impact after jobs
✅ Admin dashboard shows ESG trends
✅ Pros see their sustainability performance
✅ B2B clients can export ESG compliance reports

---

## Questions?

Reference files:
- Calculator formulas: `/server/services/service-esg-calculators.ts`
- Storage methods: `/server/storage/domains/esg/storage.ts`
- API endpoints: `/server/routes/esg/`
- Test script: `/server/scripts/test-esg-api.ts`

**The database is ready. The calculators work. Now wire it up!**
