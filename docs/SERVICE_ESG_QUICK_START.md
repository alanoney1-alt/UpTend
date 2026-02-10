# Service ESG Quick Start Guide

A developer's guide to implementing ESG tracking for the remaining 8 services.

---

## 🎯 Goal

Add ESG calculation support for these remaining services:
- Home Cleaning (PolishUp™)
- Landscaping (FreshCut™)
- Handyman (FixIt™)
- Moving Labor
- Furniture Moving
- Carpet Cleaning (DeepFiber™)
- Light Demolition (TearDown™)
- Junk Removal (already implemented in legacy system)

---

## 📋 Step-by-Step: Adding a New Service ESG Calculator

### 1. Define the Calculation Formula

Document your formula with EPA sources. Example structure:

```typescript
/**
 * [Service Name] ESG Calculator
 *
 * Constants:
 * - Constant Name: Value (Source: EPA/Industry Standard)
 * - Example: Standard water usage: 10 gal/sqft (EPA WaterSense)
 */
```

### 2. Create the Interface

In `/server/services/service-esg-calculators.ts`:

```typescript
export interface YourServiceParams {
  // Service-specific inputs
  sqft?: number;
  durationMinutes?: number;
  // ... other params
}
```

### 3. Implement the Calculator Function

```typescript
export function calculateYourServiceEsg(params: YourServiceParams): ServiceEsgCalculation {
  // 1. Define constants
  const STANDARD_VALUE = 10.0;
  const ECO_VALUE = 5.0;

  // 2. Calculate metrics
  const actualValue = params.actualValue || STANDARD_VALUE;
  const savings = STANDARD_VALUE - actualValue;

  // 3. Calculate CO2 impact
  const co2Saved = savings * CO2_FACTOR;
  const co2Emitted = actualValue * CO2_FACTOR;
  const netCo2 = co2Saved - co2Emitted;

  // 4. Calculate ESG score (0-100)
  const efficiency = Math.min(100, (savings / STANDARD_VALUE) * 100);
  const esgScore = efficiency; // Weight as appropriate

  // 5. Return standardized result
  return {
    totalCo2SavedLbs: co2Saved,
    totalCo2EmittedLbs: co2Emitted,
    netCo2ImpactLbs: netCo2,
    waterSavedGallons: waterSavings, // if applicable
    energySavedKwh: energySavings, // if applicable
    esgScore: Math.round(esgScore),
    breakdown: {
      // Detailed breakdown for transparency
      savings,
      efficiency: Math.round(efficiency),
      // ... other metrics
    },
    calculationMethod: "EPA Source + Industry Standard",
  };
}
```

### 4. Add to Main Router

In the same file, update `calculateServiceEsg`:

```typescript
export async function calculateServiceEsg(
  serviceType: string,
  params: Record<string, any>
): Promise<ServiceEsgCalculation> {
  switch (serviceType) {
    case "pressure_washing":
      return calculatePressureWashingEsg(params as PressureWashingParams);
    case "your_service":
      return calculateYourServiceEsg(params as YourServiceParams);
    // ... existing cases
    default:
      throw new Error(`ESG calculation not implemented for service type: ${serviceType}`);
  }
}
```

### 5. Add API Endpoint

In `/server/routes/esg/calculations.routes.ts`:

```typescript
const yourServiceSchema = z.object({
  param1: z.number().positive(),
  param2: z.string().optional(),
  // ... validation rules
});

router.post("/calculate/your-service", async (req, res) => {
  try {
    const params = yourServiceSchema.parse(req.body) as YourServiceParams;
    const calculation = calculateYourServiceEsg(params);

    res.json({
      success: true,
      serviceType: "your_service",
      calculation,
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || "Invalid parameters",
    });
  }
});
```

### 6. Update Batch Calculator

Add your service to the batch endpoint's switch statement:

```typescript
case "your_service":
  calculation = calculateYourServiceEsg(calc.params as YourServiceParams);
  break;
```

### 7. Test Your Calculator

```bash
# Test calculation endpoint
curl -X POST http://localhost:5000/api/esg/calculate/your-service \
  -H "Content-Type: application/json" \
  -d '{"param1": 100, "param2": "value"}'

# Test persistence
curl -X POST http://localhost:5000/api/esg/service-metrics \
  -H "Authorization: Bearer <token>" \
  -d '{
    "serviceRequestId": "sr_123",
    "serviceType": "your_service",
    "calculationParams": {"param1": 100, "param2": "value"}
  }'
```

---

## 📊 ESG Score Guidelines

Your ESG score should be **0-100** and represent overall sustainability:

- **90-100:** Exceptional sustainability (eco-friendly products, zero waste, high efficiency)
- **70-89:** Good sustainability (above average efficiency, some eco practices)
- **50-69:** Average sustainability (industry standard practices)
- **30-49:** Below average (some waste, inefficiencies)
- **0-29:** Poor sustainability (high waste, energy inefficient)

**Weighting Example:**
```typescript
const esgScore = (metric1Score * 0.4) + (metric2Score * 0.3) + (metric3Score * 0.3);
```

Adjust weights based on service impact priorities.

---

## 🔬 EPA & Industry Sources

### Water
- EPA WaterSense: Standard water usage baselines
- Wastewater treatment: 0.008 lbs CO2/gallon

### Energy
- U.S. grid average: 0.92 lbs CO2/kWh
- Natural gas: 12.1 lbs CO2/therm

### Materials
- EPA WARM Model: CO2e factors for materials
  - Paper: 2.94 lbs CO2e/lb
  - Plastic: 2.0 lbs CO2e/lb
  - Metal: 1.57 lbs CO2e/lb
  - Wood: 2.13 lbs CO2e/lb

### Chemicals
- Petroleum-based cleaners: 0.10 lbs CO2e/oz
- Plant-based cleaners: 0.02 lbs CO2e/oz

### Transportation
- Standard truck: 0.9 lbs CO2/mile
- Hybrid truck: 0.6 lbs CO2/mile

---

## 🧮 Common Calculation Patterns

### Pattern 1: Efficiency Comparison
```typescript
const actualValue = params.actual;
const standardValue = INDUSTRY_STANDARD;
const savings = standardValue - actualValue;
const efficiencyPct = (savings / standardValue) * 100;
```

### Pattern 2: Material Diversion
```typescript
const totalMaterialLbs = params.total;
const recycledLbs = params.recycled;
const donatedLbs = params.donated;
const landfilledLbs = totalMaterialLbs - recycledLbs - donatedLbs;
const diversionRate = ((recycledLbs + donatedLbs) / totalMaterialLbs) * 100;
```

### Pattern 3: Product Substitution
```typescript
const standardProduct = {
  usage: 10,
  co2ePerUnit: 0.10,
};
const ecoProduct = {
  usage: params.usage || 8,
  co2ePerUnit: 0.02,
};
const savings = (standardProduct.usage * standardProduct.co2ePerUnit) -
                (ecoProduct.usage * ecoProduct.co2ePerUnit);
```

### Pattern 4: Prevention Value
```typescript
// Maintenance preventing future emissions
const preventionCredit = params.preventsMaintenance ? MAINTENANCE_CO2 : 0;
// Example: HVAC repair prevents 500 lbs CO2 from replacement
```

---

## 🎨 Example: Home Cleaning Calculator

```typescript
export interface HomeCleaningParams {
  sqft: number;
  productType: "standard" | "eco_friendly";
  productUsedOz: number;
  waterUsedGallons: number;
  reusableClothsUsed: number;
}

export function calculateHomeCleaningEsg(params: HomeCleaningParams): ServiceEsgCalculation {
  // Constants (EPA/Industry sources)
  const STANDARD_PRODUCT_OZ_PER_100SQFT = 4;
  const STANDARD_PRODUCT_CO2E_PER_OZ = 0.06;
  const ECO_PRODUCT_CO2E_PER_OZ = 0.01;
  const STANDARD_WATER_GAL_PER_100SQFT = 2;
  const WATER_TREATMENT_CO2_PER_GALLON = 0.008;
  const REUSABLE_CLOTH_CREDIT_LBS = 0.5; // vs disposable paper towels

  // Calculate standard baseline
  const standardProductOz = (params.sqft / 100) * STANDARD_PRODUCT_OZ_PER_100SQFT;
  const standardWaterGallons = (params.sqft / 100) * STANDARD_WATER_GAL_PER_100SQFT;

  // Product score
  const productCo2ePerOz = params.productType === "eco_friendly"
    ? ECO_PRODUCT_CO2E_PER_OZ
    : STANDARD_PRODUCT_CO2E_PER_OZ;
  const productCo2Saved = (standardProductOz * STANDARD_PRODUCT_CO2E_PER_OZ) -
                          (params.productUsedOz * productCo2ePerOz);

  // Water score
  const waterSaved = Math.max(0, standardWaterGallons - params.waterUsedGallons);
  const waterCo2Saved = waterSaved * WATER_TREATMENT_CO2_PER_GALLON;

  // Reusable bonus
  const reusableBonus = params.reusableClothsUsed * REUSABLE_CLOTH_CREDIT_LBS;

  // Total impact
  const totalCo2SavedLbs = productCo2Saved + waterCo2Saved + reusableBonus;
  const totalCo2EmittedLbs = params.productUsedOz * productCo2ePerOz;
  const netCo2ImpactLbs = totalCo2SavedLbs - totalCo2EmittedLbs;

  // ESG Score
  const productScore = params.productType === "eco_friendly" ? 100 :
                       Math.min(100, (productCo2Saved / (standardProductOz * STANDARD_PRODUCT_CO2E_PER_OZ)) * 100);
  const waterScore = Math.min(100, (waterSaved / standardWaterGallons) * 100);
  const reusableScore = Math.min(100, params.reusableClothsUsed * 20); // 5 cloths = 100
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
```

---

## ✅ Validation Checklist

Before submitting your calculator:

- [ ] All constants documented with sources
- [ ] ESG score is 0-100
- [ ] Negative values handled (use `Math.max(0, ...)`)
- [ ] Breakdown includes all key metrics
- [ ] `calculationMethod` cites EPA/industry sources
- [ ] Zod schema validates all inputs
- [ ] API endpoint added to routes
- [ ] Switch case added to main router
- [ ] Manual testing completed
- [ ] Example calculation documented

---

## 🚨 Common Pitfalls

1. **Negative Savings:** Always use `Math.max(0, savings)` to prevent negative values
2. **Division by Zero:** Check for zero denominators before dividing
3. **Score > 100:** Use `Math.min(100, score)` to cap at 100
4. **Missing Units:** Always specify units (lbs, gallons, kWh, oz)
5. **Undocumented Constants:** Every constant needs a source citation

---

## 📞 Need Help?

- Review existing calculators in `/server/services/service-esg-calculators.ts`
- Check EPA WARM model: https://www.epa.gov/warm
- Reference implementation plan: `/docs/PHASE_1_IMPLEMENTATION_SUMMARY.md`

---

**Happy Calculating! 🌱**
