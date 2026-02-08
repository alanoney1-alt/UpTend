import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  timeout: 60000, // 60 seconds
});

export interface AiAnalysisResult {
  identifiedItems: string[];
  estimatedVolumeCubicFt: number;
  recommendedLoadSize: "small" | "medium" | "large" | "extra_large";
  recommendedTruckSize: "pickup" | "cargo_van" | "box_truck_small" | "box_truck_large";
  confidence: number;
  reasoning: string;
  rawResponse: string;
  // Pressure washing specific fields
  totalSqft?: number;
  surfaces?: Array<{
    type: string;
    dimensions?: string;
    sqft: number;
    condition?: string;
    estimatedTime?: string;
  }>;
}

const LOAD_SIZE_VOLUMES = {
  small: { min: 0, max: 100, description: "up to 100 cubic ft" },
  medium: { min: 100, max: 300, description: "100-300 cubic ft" },
  large: { min: 300, max: 600, description: "300-600 cubic ft" },
  extra_large: { min: 600, max: 1200, description: "600+ cubic ft" },
};

function getFullImageUrl(path: string): string {
  if (path.startsWith("http")) {
    return path;
  }
  
  // Get the base URL from environment - REPL_SLUG and REPL_OWNER for dev, or use REPLIT_DEV_DOMAIN
  const devDomain = process.env.REPLIT_DEV_DOMAIN;
  if (devDomain) {
    // Ensure it has https:// prefix
    const baseUrl = devDomain.startsWith("http") ? devDomain : `https://${devDomain}`;
    return `${baseUrl}${path}`;
  }
  
  // Fallback: try to construct from REPL_SLUG and REPL_OWNER
  const replSlug = process.env.REPL_SLUG;
  const replOwner = process.env.REPL_OWNER;
  if (replSlug && replOwner) {
    return `https://${replSlug}.${replOwner}.repl.co${path}`;
  }
  
  // Last resort - return the path (will likely fail, but provides debug info)
  console.warn("Could not construct full URL for:", path);
  return path;
}

export async function analyzePhotosForQuote(
  photoUrls: string[],
  serviceType: string
): Promise<AiAnalysisResult> {
  if (!photoUrls || photoUrls.length === 0) {
    return {
      identifiedItems: [],
      estimatedVolumeCubicFt: 0,
      recommendedLoadSize: "medium",
      recommendedTruckSize: "cargo_van",
      confidence: 0,
      reasoning: "No photos provided for analysis",
      rawResponse: "",
    };
  }

  const imageContent = photoUrls.map((url) => ({
    type: "image_url" as const,
    image_url: {
      url: getFullImageUrl(url),
    },
  }));
  
  console.log("AI Analysis - Image URLs:", imageContent.map(i => i.image_url.url));

  let systemPrompt = `You are an expert estimator for a hauling and junk removal service. Analyze the provided photos to estimate:
1. What items need to be hauled/moved
2. The approximate total volume in cubic feet
3. The recommended load size category
4. The recommended truck size needed

Load size categories:
- small: up to 100 cubic feet (a few boxes, small furniture pieces)
- medium: 100-300 cubic feet (several furniture items, multiple boxes)
- large: 300-600 cubic feet (full room contents, large furniture sets)
- extra_large: 600+ cubic feet (multiple rooms, estate cleanouts)

Truck size categories:
- pickup: Small pickup truck, good for small loads up to 100 cu ft
- cargo_van: Cargo van, good for medium loads 100-250 cu ft
- box_truck_small: Small box truck (12-14ft), good for 250-500 cu ft
- box_truck_large: Large box truck (16-20ft), good for 500+ cu ft

The service type is: ${serviceType}

Note: All jobs require 2 people for labor. Consider the size and weight of items when recommending truck size.

Respond in JSON format:
{
  "identifiedItems": ["item1", "item2", ...],
  "estimatedVolumeCubicFt": <number>,
  "recommendedLoadSize": "small" | "medium" | "large" | "extra_large",
  "recommendedTruckSize": "pickup" | "cargo_van" | "box_truck_small" | "box_truck_large",
  "confidence": <0-1 decimal representing your confidence>,
  "reasoning": "Brief explanation of your estimate including truck recommendation"
}`;

  // Special handling for pressure washing
  if (serviceType === "pressure_washing" || serviceType === "surface-wash") {
    systemPrompt = `You are an expert pressure washing estimator. Analyze the provided photos to calculate total square footage of surfaces to be cleaned.

For each surface in the photos, estimate:
1. Surface type (driveway, siding, deck, patio, fence, sidewalk, etc.)
2. Approximate dimensions (length × width in feet)
3. Square footage calculation
4. Surface condition (clean, mildly dirty, heavily stained, etc.)
5. Reference objects used for scale estimation (cars, doors, people, etc.)

Estimation guidelines:
- Use visible reference objects for scale (standard car = ~15ft long, door = ~7ft tall, person = ~6ft)
- For driveways: measure visible length × width
- For siding: estimate perimeter × visible height per story (8-10ft per floor)
- For decks/patios: estimate length × width of walking surface
- For fences: estimate linear feet × average height (typically 6ft)

Pricing context:
- Rate: $0.25 per square foot
- Minimum: $150 (600 sqft minimum)
- Estimated time: ~300-400 sqft per hour

Respond in JSON format:
{
  "totalSqft": <number>,
  "surfaces": [
    {
      "type": "driveway" | "siding" | "deck" | "patio" | "fence" | "sidewalk" | "other",
      "dimensions": "length x width description",
      "sqft": <number>,
      "condition": "clean" | "mildly dirty" | "heavily stained" | "moderate dirt",
      "estimatedTime": "time estimate in hours"
    }
  ],
  "identifiedItems": ["list of surfaces"],
  "estimatedVolumeCubicFt": 0,
  "recommendedLoadSize": "medium",
  "recommendedTruckSize": "cargo_van",
  "confidence": <0-1 decimal>,
  "reasoning": "Explanation of measurement approach and any assumptions made"
}`;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze these photos and provide an estimate for the hauling job.",
            },
            ...imageContent,
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const rawResponse = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(rawResponse);

    const result: AiAnalysisResult = {
      identifiedItems: parsed.identifiedItems || [],
      estimatedVolumeCubicFt: parsed.estimatedVolumeCubicFt || 0,
      recommendedLoadSize: parsed.recommendedLoadSize || "medium",
      recommendedTruckSize: parsed.recommendedTruckSize || "cargo_van",
      confidence: parsed.confidence || 0.5,
      reasoning: parsed.reasoning || "Analysis completed",
      rawResponse,
    };

    // Add pressure washing specific fields if present
    if (parsed.totalSqft) {
      result.totalSqft = parsed.totalSqft;
    }
    if (parsed.surfaces) {
      result.surfaces = parsed.surfaces;
    }

    return result;
  } catch (error) {
    console.error("AI analysis error:", error);
    return {
      identifiedItems: [],
      estimatedVolumeCubicFt: 0,
      recommendedLoadSize: "medium",
      recommendedTruckSize: "cargo_van",
      confidence: 0,
      reasoning: `Analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      rawResponse: "",
    };
  }
}

export async function analyzeVideoFramesForQuote(
  frames: string[],
  serviceType: string
): Promise<AiAnalysisResult> {
  if (!frames || frames.length === 0) {
    return {
      identifiedItems: [],
      estimatedVolumeCubicFt: 0,
      recommendedLoadSize: "medium",
      recommendedTruckSize: "cargo_van",
      confidence: 0,
      reasoning: "No video frames provided for analysis",
      rawResponse: "",
    };
  }

  const frameContent = frames.slice(0, 12).map((frame) => ({
    type: "image_url" as const,
    image_url: {
      url: frame.startsWith("data:") ? frame : getFullImageUrl(frame),
    },
  }));

  const systemPrompt = `You are an expert estimator for a hauling and junk removal service. You are analyzing frames extracted from a customer's video walkthrough of their items.

IMPORTANT: These are sequential frames from a video walkthrough, so items may appear in multiple frames from different angles. Do NOT double-count items that appear across multiple frames - identify unique items by tracking them across frames.

Your task:
1. Identify ALL unique items visible across all frames (consolidate duplicates seen from different angles)
2. Estimate the total volume in cubic feet
3. Determine the appropriate load size category
4. Determine the recommended truck size

Load size categories:
- small: up to 100 cubic feet (a few boxes, small furniture pieces)
- medium: 100-300 cubic feet (several furniture items, multiple boxes)
- large: 300-600 cubic feet (full room contents, large furniture sets)
- extra_large: 600+ cubic feet (multiple rooms, estate cleanouts)

Truck size categories:
- pickup: Small pickup truck, good for small loads up to 100 cu ft
- cargo_van: Cargo van, good for medium loads 100-250 cu ft
- box_truck_small: Small box truck (12-14ft), good for 250-500 cu ft
- box_truck_large: Large box truck (16-20ft), good for 500+ cu ft

The service type is: ${serviceType}

Note: Video walkthroughs typically provide better coverage than photos because the customer can show everything from multiple angles. Give higher confidence scores when the video provides comprehensive coverage.

Respond in JSON format:
{
  "identifiedItems": ["item1", "item2", ...],
  "estimatedVolumeCubicFt": <number>,
  "recommendedLoadSize": "small" | "medium" | "large" | "extra_large",
  "recommendedTruckSize": "pickup" | "cargo_van" | "box_truck_small" | "box_truck_large",
  "confidence": <0-1 decimal representing your confidence>,
  "reasoning": "Brief explanation of your estimate"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `These are ${frameContent.length} frames extracted from a customer's video walkthrough. Analyze all frames together to identify unique items and provide a hauling estimate. Remember: items may appear in multiple frames from different angles - do not double-count.`,
            },
            ...frameContent,
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1500,
    });

    const rawResponse = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(rawResponse);

    return {
      identifiedItems: parsed.identifiedItems || [],
      estimatedVolumeCubicFt: parsed.estimatedVolumeCubicFt || 0,
      recommendedLoadSize: parsed.recommendedLoadSize || "medium",
      recommendedTruckSize: parsed.recommendedTruckSize || "cargo_van",
      confidence: Math.min((parsed.confidence || 0.5) + 0.05, 1.0),
      reasoning: parsed.reasoning || "Analysis completed from video walkthrough",
      rawResponse,
    };
  } catch (error) {
    console.error("AI video analysis error:", error);
    return {
      identifiedItems: [],
      estimatedVolumeCubicFt: 0,
      recommendedLoadSize: "medium",
      recommendedTruckSize: "cargo_van",
      confidence: 0,
      reasoning: `Video analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      rawResponse: "",
    };
  }
}

// Truck costs (flat fee per job)
const TRUCK_COSTS = {
  pickup: 50,
  cargo_van: 75,
  box_truck_small: 125,
  box_truck_large: 200,
};

// 2-person labor is always included (flat rate per job)
const TWO_PERSON_LABOR_COST = 150;

export function calculatePriceFromAiEstimate(
  analysis: AiAnalysisResult,
  serviceType: string,
  basePrices: Record<string, number>
): { totalPrice: number; priceMin: number; priceMax: number; confidence: number; breakdown: { label: string; amount: number }[] } {
  const loadMultipliers = {
    small: 1.0,
    medium: 1.5,
    large: 2.2,
    extra_large: 3.0,
  };

  const serviceBasePrice = basePrices[serviceType] || 89;
  const multiplier = loadMultipliers[analysis.recommendedLoadSize] || 1.5;
  const baseAmount = Math.round(serviceBasePrice * multiplier);
  
  const truckCost = TRUCK_COSTS[analysis.recommendedTruckSize] || TRUCK_COSTS.cargo_van;
  
  const breakdown = [
    { label: "Base service rate", amount: baseAmount },
    { label: "2-person crew labor", amount: TWO_PERSON_LABOR_COST },
    { label: `Truck (${analysis.recommendedTruckSize.replace(/_/g, " ")})`, amount: truckCost },
  ];
  
  const totalPrice = baseAmount + TWO_PERSON_LABOR_COST + truckCost;
  const varianceFactor = analysis.confidence >= 0.8 ? 0.10 : analysis.confidence >= 0.6 ? 0.20 : 0.30;
  const priceMin = Math.round(totalPrice * (1 - varianceFactor));
  const priceMax = Math.round(totalPrice * (1 + varianceFactor));

  return { totalPrice, priceMin, priceMax, confidence: analysis.confidence, breakdown };
}

// ==========================================
// AI Safety Co-Pilot - Hazard Detection
// ==========================================
export interface SafetyAlert {
  alertType: string;
  severity: "info" | "warning" | "danger";
  description: string;
  safetyInstructions: string;
  disposalGuideUrl?: string;
}

export interface SafetyAnalysisResult {
  alerts: SafetyAlert[];
  overallRisk: "low" | "medium" | "high";
  safeToStart: boolean;
}

export async function analyzePhotosForHazards(
  photoUrls: string[],
  serviceType: string
): Promise<SafetyAnalysisResult> {
  if (!photoUrls || photoUrls.length === 0) {
    return { alerts: [], overallRisk: "low", safeToStart: true };
  }

  const imageContent = photoUrls.map((url) => ({
    type: "image_url" as const,
    image_url: { url: url.startsWith("data:") ? url : getFullImageUrl(url) },
  }));

  const systemPrompt = `You are an AI safety inspector for a hauling/junk removal service. A worker (Pro) has taken photos of items they need to handle on-site. Analyze the photos for potential safety hazards.

Look for:
- Hazardous materials: paint cans, chemicals, solvents, cleaning products, aerosol cans, batteries, propane tanks, motor oil, pesticides
- Sharp/dangerous objects: broken glass, exposed nails, metal shards, syringes
- Heavy items requiring special equipment: safes, pianos, cast iron tubs, marble counters
- Biohazards: mold, animal waste, medical waste
- Electrical hazards: exposed wiring, old appliances with frayed cords
- Structural risks: unstable stacks, overhead items that could fall

For each hazard found, classify severity:
- "info": Minor concern, standard precautions sufficient
- "warning": Moderate risk, specific PPE or technique required
- "danger": High risk, may require specialized handling or disposal

Respond in JSON format:
{
  "alerts": [
    {
      "alertType": "hazmat" | "sharp_objects" | "heavy_item" | "biohazard" | "electrical" | "structural",
      "severity": "info" | "warning" | "danger",
      "description": "What the hazard is",
      "safetyInstructions": "Specific safety instructions for the worker",
      "disposalGuideUrl": "Optional URL to disposal guide"
    }
  ],
  "overallRisk": "low" | "medium" | "high",
  "safeToStart": true/false
}

If no hazards are found, return an empty alerts array with overallRisk "low" and safeToStart true.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: `Analyze these on-site photos for safety hazards. Service type: ${serviceType}` },
            ...imageContent,
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1500,
    });

    const rawResponse = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(rawResponse);
    return {
      alerts: parsed.alerts || [],
      overallRisk: parsed.overallRisk || "low",
      safeToStart: parsed.safeToStart !== false,
    };
  } catch (error) {
    console.error("AI safety analysis error:", error);
    return { alerts: [], overallRisk: "low", safeToStart: true };
  }
}

// ==========================================
// Circular Economy Tracker - AI Junk Categorization
// ==========================================
export interface DisposalCategorization {
  items: {
    name: string;
    category: string;
    weight_estimate_lbs: number;
    recycling_potential: string;
    disposal_method: string;
  }[];
  totals: {
    total_weight_lbs: number;
    recycled_lbs: number;
    donated_lbs: number;
    landfilled_lbs: number;
    e_waste_lbs: number;
    diversion_rate: number;
  };
  environmental_impact: {
    trees_equivalent: number;
    water_saved_gallons: number;
    energy_saved_kwh: number;
    co2_avoided_lbs: number;
  };
}

export async function categorizeItemsForDisposal(
  items: string[],
  photoUrls?: string[]
): Promise<DisposalCategorization> {
  const imageContent = (photoUrls || []).slice(0, 4).map((url) => ({
    type: "image_url" as const,
    image_url: { url: url.startsWith("data:") ? url : getFullImageUrl(url) },
  }));

  const systemPrompt = `You are an environmental sustainability expert for a junk removal service. Categorize items for optimal disposal to maximize recycling and diversion from landfills.

Disposal categories:
- "recycling": Metals, cardboard, clean plastics, glass
- "donation": Furniture, clothing, appliances in working condition
- "e_waste": Electronics, TVs, computers, phones, batteries
- "hazmat": Chemicals, paint, solvents, fluorescent bulbs
- "metal_scrap": Pure metals, appliances for scrap
- "compost": Yard waste, food waste, wood
- "landfill": Non-recyclable, contaminated, or mixed waste

Environmental impact calculations (approximate):
- 1 lb recycled metal = 0.5 lbs CO2 avoided, 2 gallons water saved
- 1 lb recycled paper/cardboard = 0.3 lbs CO2 avoided, 3.5 gallons water saved
- 1 lb diverted from landfill = 0.2 lbs CO2 avoided
- 1 lb donated = 0.1 lbs CO2 avoided (avoiding new production)
- Trees equivalent: 1 tree absorbs ~48 lbs CO2/year
- Energy: 1 lb recycled aluminum saves ~7 kWh

Items to categorize: ${JSON.stringify(items)}

Respond in JSON:
{
  "items": [{"name": "item", "category": "recycling", "weight_estimate_lbs": 10, "recycling_potential": "high", "disposal_method": "Take to metal recycling center"}],
  "totals": {"total_weight_lbs": 0, "recycled_lbs": 0, "donated_lbs": 0, "landfilled_lbs": 0, "e_waste_lbs": 0, "diversion_rate": 0.7},
  "environmental_impact": {"trees_equivalent": 0.5, "water_saved_gallons": 20, "energy_saved_kwh": 5, "co2_avoided_lbs": 24}
}`;

  try {
    const messageContent: any[] = [
      { type: "text", text: `Categorize these items for sustainable disposal: ${items.join(", ")}` },
    ];
    if (imageContent.length > 0) {
      messageContent.push(...imageContent);
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: messageContent },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const rawResponse = response.choices[0]?.message?.content || "{}";
    return JSON.parse(rawResponse);
  } catch (error) {
    console.error("AI categorization error:", error);
    return {
      items: items.map(name => ({ name, category: "landfill", weight_estimate_lbs: 20, recycling_potential: "unknown", disposal_method: "Standard disposal" })),
      totals: { total_weight_lbs: items.length * 20, recycled_lbs: 0, donated_lbs: 0, landfilled_lbs: items.length * 20, e_waste_lbs: 0, diversion_rate: 0 },
      environmental_impact: { trees_equivalent: 0, water_saved_gallons: 0, energy_saved_kwh: 0, co2_avoided_lbs: 0 },
    };
  }
}

// ==========================================
// Carbon Estimation - EPA 2026 Emission Factors
// ==========================================
export interface CarbonEstimate {
  carbonFootprintLbs: number;
  carbonFootprintKg: number;
  carbonOffsetCost: number;
  treesEquivalent: number;
  fuelType: string;
  breakdown: {
    transportEmissions: number;
    disposalEmissions: number;
    offsetCredits: number;
    methaneEquivalentLbs?: number;
    metalDiversionCreditLbs?: number;
    avoidedEmissionsKg?: number;
    waterSavedGallons?: number;
    cleanerOffset?: number;
  };
  serviceFactors?: {
    methaneFactorApplied?: boolean;
    methaneCo2EquivalentLbs?: number;
    metalDivertedLbs?: number;
    avoidedEmissionsKg?: number;
    seerRatingOld?: number;
    seerRatingNew?: number;
    cleanerType?: string;
    waterUsedGallons?: number;
    waterSavedGallons?: number;
  };
  taxCreditAlerts?: TaxCreditAlert[];
}

export interface TaxCreditAlert {
  code: string;
  title: string;
  description: string;
  potentialSavings?: string;
}

export interface ServiceFactorInput {
  serviceType: string;
  metalWeightLbs?: number;
  seerRatingOld?: number;
  seerRatingNew?: number;
  annualCoolingHours?: number;
  btuCapacity?: number;
  cleanerType?: 'chemical' | 'bio_based';
  waterUsedGallons?: number;
}

const CO2_PER_GAL_GAS_GRAMS = 8887;
const CO2_PER_GAL_DIESEL_GRAMS = 10180;

const TRUCK_PROFILES: Record<string, { mpg: number; fuel: 'gas' | 'diesel' }> = {
  small:  { mpg: 12, fuel: 'gas' },
  medium: { mpg: 10, fuel: 'gas' },
  large:  { mpg: 8,  fuel: 'diesel' },
};

export function calculateMoveImpact(miles: number, truckSize: string = 'medium') {
  const profile = TRUCK_PROFILES[truckSize] || TRUCK_PROFILES.medium;
  const fuelFactor = profile.fuel === 'diesel' ? CO2_PER_GAL_DIESEL_GRAMS : CO2_PER_GAL_GAS_GRAMS;
  const totalEmissionsKg = (miles / profile.mpg) * fuelFactor / 1000;

  return {
    total_kg_co2: parseFloat(totalEmissionsKg.toFixed(2)),
    total_lbs_co2: parseFloat((totalEmissionsKg * 2.20462).toFixed(2)),
    trees_equivalent: parseFloat((totalEmissionsKg / 22).toFixed(2)),
    fuel_type: profile.fuel,
  };
}

export function estimateCarbonFootprint(
  distanceMiles: number,
  totalWeightLbs: number,
  disposalBreakdown: { recycled: number; donated: number; landfilled: number; eWaste: number },
  truckSize: string = 'medium',
  serviceFactors?: ServiceFactorInput
): CarbonEstimate {
  const LANDFILL_EMISSIONS_PER_LB = 0.04;
  const RECYCLING_OFFSET_PER_LB = -0.02;
  const CARBON_OFFSET_PRICE_PER_LB = 0.015;
  const METHANE_GWP = 25;
  const LANDFILL_METHANE_LBS_PER_LB = 0.012;
  const METAL_RECYCLING_CREDIT_PER_LB = 0.08;
  const CHEMICAL_CLEANER_CO2_PER_GALLON = 2.5;
  const BIO_CLEANER_CO2_PER_GALLON = 0.4;
  const AVG_WATER_PER_CLEANING_JOB_GAL = 30;
  const US_GRID_CO2_PER_KWH_KG = 0.42;

  const moveImpact = calculateMoveImpact(distanceMiles, truckSize);
  const transportEmissions = moveImpact.total_lbs_co2;

  const landfillEmissions = (disposalBreakdown.landfilled / 100) * totalWeightLbs * LANDFILL_EMISSIONS_PER_LB;
  const recyclingOffset = (disposalBreakdown.recycled / 100) * totalWeightLbs * RECYCLING_OFFSET_PER_LB;
  let disposalEmissions = landfillEmissions + recyclingOffset;

  let methaneEquivalentLbs = 0;
  let metalDiversionCreditLbs = 0;
  let avoidedEmissionsKg = 0;
  let waterSavedGallons = 0;
  let cleanerOffset = 0;
  const factors: CarbonEstimate['serviceFactors'] = {};
  const taxAlerts: TaxCreditAlert[] = [];

  const svcType = serviceFactors?.serviceType || '';

  if (svcType === 'junk_removal' || svcType === 'garage_cleanout' || svcType === 'estate_cleanout') {
    const landfilledLbs = (disposalBreakdown.landfilled / 100) * totalWeightLbs;
    methaneEquivalentLbs = landfilledLbs * LANDFILL_METHANE_LBS_PER_LB * METHANE_GWP;
    disposalEmissions += methaneEquivalentLbs;
    factors.methaneFactorApplied = true;
    factors.methaneCo2EquivalentLbs = parseFloat(methaneEquivalentLbs.toFixed(2));

    const metalLbs = serviceFactors?.metalWeightLbs || 0;
    if (metalLbs > 0) {
      metalDiversionCreditLbs = metalLbs * METAL_RECYCLING_CREDIT_PER_LB;
      disposalEmissions -= metalDiversionCreditLbs;
      factors.metalDivertedLbs = metalLbs;
    }

    if (totalWeightLbs > 500) {
      taxAlerts.push({
        code: "CHARITABLE_DONATION",
        title: "Charitable Donation Deduction",
        description: "Items donated through UpTend partners may qualify for a charitable donation tax deduction.",
        potentialSavings: "Varies by item value",
      });
    }
  }

  if (svcType === 'hvac') {
    const oldSeer = serviceFactors?.seerRatingOld || 10;
    const newSeer = serviceFactors?.seerRatingNew || 20;
    const btu = serviceFactors?.btuCapacity || 36000;
    const hours = serviceFactors?.annualCoolingHours || 1000;
    const oldKwhPerYear = (btu / (oldSeer * 1000)) * hours;
    const newKwhPerYear = (btu / (newSeer * 1000)) * hours;
    const annualSavingsKwh = oldKwhPerYear - newKwhPerYear;
    avoidedEmissionsKg = annualSavingsKwh * US_GRID_CO2_PER_KWH_KG * 10;
    factors.avoidedEmissionsKg = parseFloat(avoidedEmissionsKg.toFixed(2));
    factors.seerRatingOld = oldSeer;
    factors.seerRatingNew = newSeer;

    if (newSeer >= 16) {
      taxAlerts.push({
        code: "25C_ENERGY_EFFICIENCY",
        title: "Energy Efficiency Tax Credit (25C)",
        description: `Upgrading to a SEER2 ${newSeer} unit may qualify for a federal energy efficiency tax credit of up to $2,000.`,
        potentialSavings: "Up to $2,000",
      });
    }
  }

  if (svcType === 'cleaning') {
    const waterUsed = serviceFactors?.waterUsedGallons || AVG_WATER_PER_CLEANING_JOB_GAL;
    waterSavedGallons = Math.max(0, AVG_WATER_PER_CLEANING_JOB_GAL - waterUsed);
    const cType = serviceFactors?.cleanerType || 'chemical';
    if (cType === 'bio_based') {
      cleanerOffset = (CHEMICAL_CLEANER_CO2_PER_GALLON - BIO_CLEANER_CO2_PER_GALLON) * 2;
      disposalEmissions -= cleanerOffset;
    }
    factors.cleanerType = cType;
    factors.waterUsedGallons = waterUsed;
    factors.waterSavedGallons = waterSavedGallons;
  }

  if (svcType === 'furniture_moving' || svcType === 'truck_unloading') {
    if (distanceMiles > 50) {
      taxAlerts.push({
        code: "SEC_217",
        title: "Moving Expense Deduction (Section 217)",
        description: `This ${distanceMiles.toFixed(0)}-mile move may be eligible for a moving expense deduction if job-related (active-duty military).`,
        potentialSavings: "Varies by total moving costs",
      });
    }
  }

  disposalEmissions = Math.max(-transportEmissions, disposalEmissions);
  const totalEmissions = Math.max(0, transportEmissions + disposalEmissions);
  const carbonOffsetCost = Math.round(totalEmissions * CARBON_OFFSET_PRICE_PER_LB * 100) / 100;
  const totalKg = totalEmissions * 0.453592;

  return {
    carbonFootprintLbs: Math.round(totalEmissions * 100) / 100,
    carbonFootprintKg: Math.round(totalKg * 100) / 100,
    carbonOffsetCost,
    treesEquivalent: parseFloat((totalKg / 22).toFixed(2)),
    fuelType: moveImpact.fuel_type,
    breakdown: {
      transportEmissions: Math.round(transportEmissions * 100) / 100,
      disposalEmissions: Math.round(disposalEmissions * 100) / 100,
      offsetCredits: Math.round(recyclingOffset * 100) / 100,
      methaneEquivalentLbs: parseFloat(methaneEquivalentLbs.toFixed(2)),
      metalDiversionCreditLbs: parseFloat(metalDiversionCreditLbs.toFixed(2)),
      avoidedEmissionsKg: parseFloat(avoidedEmissionsKg.toFixed(2)),
      waterSavedGallons: parseFloat(waterSavedGallons.toFixed(2)),
      cleanerOffset: parseFloat(cleanerOffset.toFixed(2)),
    },
    serviceFactors: Object.keys(factors).length > 0 ? factors : undefined,
    taxCreditAlerts: taxAlerts.length > 0 ? taxAlerts : undefined,
  };
}

export function getTaxCreditAlerts(serviceType: string, distanceMiles: number = 0, seerRating?: number): TaxCreditAlert[] {
  const alerts: TaxCreditAlert[] = [];

  if ((serviceType === 'furniture_moving' || serviceType === 'truck_unloading') && distanceMiles > 50) {
    alerts.push({
      code: "SEC_217",
      title: "Moving Expense Deduction (Section 217)",
      description: `This ${distanceMiles.toFixed(0)}-mile move may be eligible for a moving expense deduction if job-related (active-duty military).`,
      potentialSavings: "Varies by total moving costs",
    });
  }

  if (serviceType === 'hvac' && seerRating && seerRating >= 16) {
    alerts.push({
      code: "25C_ENERGY_EFFICIENCY",
      title: "Energy Efficiency Tax Credit (25C)",
      description: `Upgrading to a SEER2 ${seerRating} unit may qualify for a federal energy efficiency tax credit of up to $2,000.`,
      potentialSavings: "Up to $2,000",
    });
  }

  if (serviceType === 'junk_removal' || serviceType === 'garage_cleanout' || serviceType === 'estate_cleanout') {
    alerts.push({
      code: "CHARITABLE_DONATION",
      title: "Charitable Donation Deduction",
      description: "Items donated through UpTend partners may qualify for a charitable donation tax deduction.",
      potentialSavings: "Varies by item value",
    });
  }

  return alerts;
}

// ==========================================
// Predictive Job Bundling - AI add-on suggestions
// ==========================================
export interface BundlingSuggestion {
  suggestedServiceType: string;
  suggestedItems: string[];
  reason: string;
  estimatedAdditionalCost: number;
  discountPercent: number;
}

export async function generateBundlingSuggestions(
  identifiedItems: string[],
  serviceType: string,
  photoUrls?: string[]
): Promise<BundlingSuggestion[]> {
  const imageContent = (photoUrls || []).slice(0, 4).map((url) => ({
    type: "image_url" as const,
    image_url: { url: url.startsWith("data:") ? url : getFullImageUrl(url) },
  }));

  const systemPrompt = `You are an AI assistant for a home services platform (UpTend). Based on the items a customer wants removed/moved, suggest additional services they might need.

Available service types: junk_removal, furniture_moving, garage_cleanout, estate_cleanout, truck_unloading

Current service: ${serviceType}
Items identified: ${JSON.stringify(identifiedItems)}

Common bundling patterns:
- Old appliances visible? Suggest recycling pickup service
- Moving furniture? Suggest junk removal for items they don't want to keep
- Garage cleanout? Suggest donation pickup for usable items
- E-waste visible (old TVs, computers)? Suggest e-waste recycling add-on
- Large items with an old item replacement? Suggest hauling away the old one

Only suggest relevant add-ons, max 3 suggestions. Each suggestion should save the customer money vs. booking separately.

Respond in JSON:
{
  "suggestions": [
    {
      "suggestedServiceType": "junk_removal",
      "suggestedItems": ["old sofa", "broken bookshelf"],
      "reason": "I noticed old furniture items that could be removed alongside your main service",
      "estimatedAdditionalCost": 45,
      "discountPercent": 15
    }
  ]
}

Return empty suggestions array if nothing relevant to suggest.`;

  try {
    const messageContent: any[] = [
      { type: "text", text: `Based on these items, suggest relevant add-on services: ${identifiedItems.join(", ")}` },
    ];
    if (imageContent.length > 0) {
      messageContent.push(...imageContent);
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: messageContent },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const rawResponse = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(rawResponse);
    return parsed.suggestions || [];
  } catch (error) {
    console.error("AI bundling suggestions error:", error);
    return [];
  }
}

// ==========================================
// Circular Economy Agent - AI Disposal Classification
// ==========================================
export interface DisposalClassification {
  itemName: string;
  category: "donate" | "recycle" | "resell" | "landfill" | "e_waste" | "hazardous";
  estimatedWeightLbs: number;
  destinationName: string;
  destinationAddress: string;
  estimatedValue: number;
  co2AvoidedLbs: number;
  reasoning: string;
}

export async function classifyItemsForDisposal(
  photoUrls: string[],
  itemDescriptions: string[]
): Promise<DisposalClassification[]> {
  const imageContent = photoUrls.slice(0, 6).map((url) => ({
    type: "image_url" as const,
    image_url: { url: url.startsWith("data:") ? url : getFullImageUrl(url) },
  }));

  const systemPrompt = `You are a Circular Economy AI agent for a junk removal platform. Analyze the items and classify each for optimal environmental disposal.

For each item, determine:
1. Can it be DONATED? (Furniture, appliances in working condition → Habitat for Humanity, Goodwill, Salvation Army)
2. Can it be RECYCLED? (Metals, cardboard, plastics → local recycling center)
3. Can it be RESOLD? (Electronics, tools, collectibles → Facebook Marketplace, eBay)
4. Is it E-WASTE? (Electronics, batteries, TVs → Best Buy, Staples e-waste programs)
5. Is it HAZARDOUS? (Paint, chemicals, asbestos → local HHW facility)
6. LANDFILL only as last resort

CO2 avoidance estimates:
- Recycling: ~0.5 lbs CO2 avoided per lb of material
- Donation: ~0.8 lbs CO2 avoided per lb (avoids new manufacturing)
- Resale: ~1.0 lbs CO2 avoided per lb
- E-waste proper disposal: ~2.0 lbs CO2 avoided per lb

Items described: ${itemDescriptions.join(", ")}

Respond in JSON:
{ "items": [{ "itemName": "string", "category": "donate|recycle|resell|landfill|e_waste|hazardous", "estimatedWeightLbs": number, "destinationName": "string", "destinationAddress": "Nearest local facility", "estimatedValue": number, "co2AvoidedLbs": number, "reasoning": "string" }] }`;

  try {
    const messageContent: any[] = [];
    if (imageContent.length > 0) {
      messageContent.push({ type: "text", text: "Photos of items to classify:" });
      messageContent.push(...imageContent);
    }
    messageContent.push({ type: "text", text: `Classify these items for disposal: ${itemDescriptions.join(", ")}` });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: messageContent },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const rawResponse = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(rawResponse);
    return parsed.items || [];
  } catch (error) {
    console.error("AI circular economy classification error:", error);
    return itemDescriptions.map(item => ({
      itemName: item,
      category: "landfill" as const,
      estimatedWeightLbs: 20,
      destinationName: "Local waste facility",
      destinationAddress: "Contact local municipality",
      estimatedValue: 0,
      co2AvoidedLbs: 0,
      reasoning: `Classification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    }));
  }
}

// ==========================================
// Carbon-Intelligent Dispatch Scoring
// ==========================================
export interface DispatchRoute {
  jobId: string;
  pickupLat: number;
  pickupLng: number;
  estimatedDistanceMiles: number;
}

export interface CarbonOptimizedBatch {
  batchedJobs: string[];
  region: string;
  totalDistanceMiles: number;
  optimizedDistanceMiles: number;
  deadheadMilesSaved: number;
  co2SavedLbs: number;
  discountSuggestion: number;
}

const DISPATCH_CO2_PER_MILE_LBS = calculateMoveImpact(1, 'medium').total_lbs_co2;

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateCarbonOptimizedBatches(
  jobs: DispatchRoute[],
  maxBatchDistance: number = 5
): CarbonOptimizedBatch[] {
  if (jobs.length === 0) return [];

  const batches: CarbonOptimizedBatch[] = [];
  const assigned = new Set<string>();

  for (const job of jobs) {
    if (assigned.has(job.jobId)) continue;

    const nearby = jobs.filter(j =>
      !assigned.has(j.jobId) &&
      j.jobId !== job.jobId &&
      haversineDistance(job.pickupLat, job.pickupLng, j.pickupLat, j.pickupLng) <= maxBatchDistance
    );

    if (nearby.length === 0) {
      assigned.add(job.jobId);
      continue;
    }

    const batchJobs = [job, ...nearby.slice(0, 4)];
    const totalIndividual = batchJobs.reduce((sum, j) => sum + j.estimatedDistanceMiles * 2, 0);
    const optimized = batchJobs.reduce((sum, j) => sum + j.estimatedDistanceMiles, 0) * 1.2;
    const saved = Math.max(0, totalIndividual - optimized);

    batchJobs.forEach(j => assigned.add(j.jobId));

    const centerLat = batchJobs.reduce((s, j) => s + j.pickupLat, 0) / batchJobs.length;
    const centerLng = batchJobs.reduce((s, j) => s + j.pickupLng, 0) / batchJobs.length;

    batches.push({
      batchedJobs: batchJobs.map(j => j.jobId),
      region: `${centerLat.toFixed(2)},${centerLng.toFixed(2)}`,
      totalDistanceMiles: totalIndividual,
      optimizedDistanceMiles: optimized,
      deadheadMilesSaved: saved,
      co2SavedLbs: saved * DISPATCH_CO2_PER_MILE_LBS,
      discountSuggestion: Math.min(15, Math.round(saved * 0.5)),
    });
  }

  return batches;
}

// ==========================================
// Tax Credit Eligibility AI
// ==========================================
export interface TaxCreditEligibility {
  eligible: boolean;
  creditType: string;
  estimatedAmount: number;
  requirements: string[];
  qualifyingDetails: string;
}

export async function analyzeTaxCreditEligibility(
  serviceType: string,
  itemDescriptions: string[],
  totalWeight: number,
  diversionRate: number
): Promise<TaxCreditEligibility> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a tax compliance AI for a home services platform. Analyze if a completed job qualifies for federal or state tax deductions/credits.

Common qualifying scenarios:
- 25C Energy Efficiency: HVAC repairs/upgrades qualifying for up to $2,000 credit
- Charitable Donation: Donated items to qualified nonprofits (Habitat, Goodwill) = fair market value deduction
- Recycling Credits: Some states offer credits for verified recycling
- Small Business Equipment: Section 179 for business equipment disposal/replacement
- Green Business: ESG compliance credits for waste diversion above 50%

Service type: ${serviceType}
Items: ${itemDescriptions.join(", ")}
Total weight: ${totalWeight} lbs
Diversion rate: ${(diversionRate * 100).toFixed(0)}%

Respond in JSON:
{
  "eligible": true/false,
  "creditType": "Type of credit/deduction",
  "estimatedAmount": dollar amount,
  "requirements": ["requirement1", "requirement2"],
  "qualifyingDetails": "Why this qualifies"
}`
        },
        { role: "user", content: `Analyze tax credit eligibility for this ${serviceType} job with ${itemDescriptions.length} items totaling ${totalWeight} lbs and ${(diversionRate * 100).toFixed(0)}% diversion rate.` }
      ],
      response_format: { type: "json_object" },
      max_tokens: 800,
    });

    const rawResponse = response.choices[0]?.message?.content || "{}";
    return JSON.parse(rawResponse);
  } catch (error) {
    console.error("Tax credit eligibility analysis error:", error);
    return {
      eligible: diversionRate > 0.5,
      creditType: "Charitable Donation Deduction",
      estimatedAmount: diversionRate > 0.5 ? Math.round(totalWeight * 0.15) : 0,
      requirements: ["Keep itemized receipt", "Verify nonprofit status of donation center"],
      qualifyingDetails: diversionRate > 0.5
        ? `${(diversionRate * 100).toFixed(0)}% diversion rate qualifies for charitable donation deduction`
        : "Diversion rate too low for tax credit qualification",
    };
  }
}

// ==========================================
// AI Receipt Scanner for Compliance Vault
// ==========================================
export interface ReceiptScanResult {
  vendorName: string;
  amount: number;
  date: string;
  category: string;
  taxDeductible: boolean;
  lineItems: string[];
}

export async function scanReceipt(receiptImageUrl: string): Promise<ReceiptScanResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI receipt scanner for a home services platform. Extract key information from the receipt image.

Categories for classification:
- vehicle_expense: Gas, oil, tires, vehicle repairs
- supplies: Work tools, equipment, safety gear
- insurance: Vehicle or business insurance payments
- business_license: Permits, licenses, certifications
- disposal_fees: Dump fees, recycling center fees
- communication: Phone, internet for business use
- other: Anything else

Respond in JSON:
{
  "vendorName": "Vendor/Store name",
  "amount": total dollar amount as number,
  "date": "YYYY-MM-DD",
  "category": "category from list above",
  "taxDeductible": true/false,
  "lineItems": ["item1", "item2"]
}`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Scan this receipt and extract the information:" },
            { type: "image_url", image_url: { url: receiptImageUrl.startsWith("data:") ? receiptImageUrl : getFullImageUrl(receiptImageUrl) } },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 800,
    });

    const rawResponse = response.choices[0]?.message?.content || "{}";
    return JSON.parse(rawResponse);
  } catch (error) {
    console.error("Receipt scan error:", error);
    return {
      vendorName: "Unknown",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      category: "other",
      taxDeductible: false,
      lineItems: [],
    };
  }
}

// ==========================================
// Green Guarantee - AI Disposal Receipt Verification
// ==========================================
export interface DisposalReceiptVerification {
  isDisposalReceipt: boolean;
  facilityName: string;
  receiptDate: string;
  amountPaid: number;
  confidence: number;
  isValidDate: boolean;
  rejectionReason?: string;
}

export async function verifyDisposalReceipt(receiptImageUrl: string): Promise<DisposalReceiptVerification> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI receipt verification agent for UpTend's Green Guarantee program. Your job is to verify that a photo is a legitimate waste disposal, recycling, or donation receipt.

You must determine:
1. Is this actually a waste disposal / recycling / donation receipt? (Not a restaurant receipt, not a gas receipt, etc.)
2. What is the facility name?
3. What date is on the receipt?
4. What amount was paid (disposal/tipping fee)?
5. Does the date match today's date (${today})?

Respond in JSON:
{
  "isDisposalReceipt": true/false,
  "facilityName": "Name of disposal/recycling facility",
  "receiptDate": "YYYY-MM-DD",
  "amountPaid": dollar amount as number,
  "confidence": 0.0 to 1.0,
  "isValidDate": true if receipt date is today (${today}),
  "rejectionReason": "reason if not a valid disposal receipt, or date mismatch"
}

Be strict: only approve actual waste disposal, recycling center, landfill, donation center, or e-waste drop-off receipts.`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Verify this disposal receipt for the Green Guarantee rebate program:" },
            { type: "image_url", image_url: { url: receiptImageUrl.startsWith("data:") ? receiptImageUrl : getFullImageUrl(receiptImageUrl) } },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 800,
    });

    const rawResponse = response.choices[0]?.message?.content || "{}";
    return JSON.parse(rawResponse);
  } catch (error) {
    console.error("Disposal receipt verification error:", error);
    return {
      isDisposalReceipt: false,
      facilityName: "Unknown",
      receiptDate: "",
      amountPaid: 0,
      confidence: 0,
      isValidDate: false,
      rejectionReason: "AI verification failed - please try again",
    };
  }
}

// ==========================================
// AI Conflict Resolution - Before/After Photo Comparison
// ==========================================
export interface ConflictAnalysisResult {
  damageDetected: boolean;
  damageDescription: string;
  affectedItems: string[];
  preExistingDamage: string[];
  newDamage: string[];
  confidence: number;
  recommendation: "customer_favor" | "pycker_favor" | "needs_review";
  reasoning: string;
}

export async function analyzeDisputePhotos(
  beforePhotos: string[],
  afterPhotos: string[],
  damagePhotos: string[],
  disputeDescription: string
): Promise<ConflictAnalysisResult> {
  const beforeContent = beforePhotos.slice(0, 4).map((url) => ({
    type: "image_url" as const,
    image_url: { url: url.startsWith("data:") ? url : getFullImageUrl(url) },
  }));
  const afterContent = afterPhotos.slice(0, 4).map((url) => ({
    type: "image_url" as const,
    image_url: { url: url.startsWith("data:") ? url : getFullImageUrl(url) },
  }));
  const damageContent = damagePhotos.slice(0, 4).map((url) => ({
    type: "image_url" as const,
    image_url: { url: url.startsWith("data:") ? url : getFullImageUrl(url) },
  }));

  const systemPrompt = `You are an AI dispute resolution specialist for a home services platform. A customer has filed a damage complaint. Compare the before and after photos to determine if damage occurred during the service.

Customer's complaint: ${disputeDescription}

Your analysis should:
1. Identify items visible in BEFORE photos and note their condition
2. Compare the same items in AFTER photos
3. Check if the claimed damage appears in the BEFORE photos (pre-existing)
4. Examine any specific damage photos submitted
5. Determine if the damage is new (caused during service) or pre-existing

Be fair and objective. Consider:
- Lighting differences between photos don't indicate damage
- Different angles might make things look different
- Focus on structural damage, scratches, dents, breaks, stains

Respond in JSON:
{
  "damageDetected": true/false,
  "damageDescription": "What damage was found",
  "affectedItems": ["item1", "item2"],
  "preExistingDamage": ["damages visible in before photos"],
  "newDamage": ["damages only visible in after photos"],
  "confidence": 0.0-1.0,
  "recommendation": "customer_favor" | "pycker_favor" | "needs_review",
  "reasoning": "Detailed explanation of the analysis"
}`;

  try {
    const messageContent: any[] = [
      { type: "text", text: "BEFORE photos (taken before service started):" },
      ...beforeContent,
      { type: "text", text: "AFTER photos (taken after service completed):" },
      ...afterContent,
    ];
    if (damageContent.length > 0) {
      messageContent.push({ type: "text", text: "DAMAGE photos (submitted by customer):" });
      messageContent.push(...damageContent);
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: messageContent },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1500,
    });

    const rawResponse = response.choices[0]?.message?.content || "{}";
    return JSON.parse(rawResponse);
  } catch (error) {
    console.error("AI conflict analysis error:", error);
    return {
      damageDetected: false,
      damageDescription: "Analysis could not be completed",
      affectedItems: [],
      preExistingDamage: [],
      newDamage: [],
      confidence: 0,
      recommendation: "needs_review",
      reasoning: `Analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export interface InventoryItem {
  itemName: string;
  estimatedValue: number;
  brandDetected: string | null;
  condition: "like_new" | "good" | "fair" | "poor" | "scrap";
}

export async function catalogItemsForInsurance(
  photoUrls: string[]
): Promise<InventoryItem[]> {
  try {
    if (!photoUrls || photoUrls.length === 0) {
      return [];
    }

    const imageContents = photoUrls.slice(0, 4).map((url) => ({
      type: "image_url" as const,
      image_url: { url: getFullImageUrl(url), detail: "high" as const },
    }));

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an insurance inventory auditor. Identify high-value items (TVs, furniture, electronics, appliances, gym equipment) in the photos. Extract brand, model info, and condition. Return JSON only.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze these photos and catalog all identifiable items for home insurance documentation. For each item return:
- itemName: descriptive name (e.g. "65-inch Samsung Smart TV")
- estimatedValue: estimated replacement value in USD
- brandDetected: brand name if visible, null otherwise
- condition: one of "like_new", "good", "fair", "poor", "scrap"

Return a JSON object: { "items": [...] }`,
            },
            ...imageContents,
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const rawResponse = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(rawResponse);
    return (parsed.items || []).map((item: any) => ({
      itemName: item.itemName || "Unknown Item",
      estimatedValue: Number(item.estimatedValue) || 0,
      brandDetected: item.brandDetected || null,
      condition: ["like_new", "good", "fair", "poor", "scrap"].includes(item.condition)
        ? item.condition
        : "good",
    }));
  } catch (error) {
    console.error("AI inventory cataloging error:", error);
    return [];
  }
}

export function generateResaleDescription(item: {
  itemName: string;
  brandDetected?: string | null;
  condition?: string | null;
  estimatedValue?: number | null;
}): string {
  const brand = item.brandDetected ? `${item.brandDetected} ` : "";
  const conditionLabel = {
    like_new: "Like New",
    good: "Good",
    fair: "Fair",
    poor: "Fair",
    scrap: "For Parts",
  }[item.condition || "good"] || "Good";

  const price = item.estimatedValue
    ? `$${Math.round(item.estimatedValue * 0.6)}`
    : "Make an offer";

  return `Selling a ${brand}${item.itemName}. Condition: ${conditionLabel}. Picked up today. ${price}.`;
}
