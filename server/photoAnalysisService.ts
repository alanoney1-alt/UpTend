import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  timeout: 60000, // 60 seconds
});

export interface PhotoAnalysisResult {
  identifiedItems: string[];
  estimatedVolumeCubicFt: number;
  recommendedLoadSize: "small" | "medium" | "large" | "extra_large" | "full";
  suggestedServiceType: "junk_removal" | "furniture_moving" | "garage_cleanout" | "truck_unloading";
  confidence: number;
  suggestedPrice: number;
  suggestedPriceMin: number;
  suggestedPriceMax: number;
  reasoning: string;
  itemBreakdown: {
    item: string;
    estimatedWeight: string;
    estimatedVolume: string;
    specialHandling?: string;
  }[];
}

export interface CleanlinessScoreResult {
  score: number; // 1-10 scale
  confidence: number; // 0-1
  reasoning: string;
  areasOfConcern: string[];
  highlights: string[];
}

// Pricing must match client/src/lib/bundle-pricing.ts loadSizePackages
// Standard pickup truck bed = 8 cubic yards = 216 cubic feet
const LOAD_SIZE_THRESHOLDS = {
  small: { maxVolume: 27, basePrice: 99 },        // Minimum/1/8 truck (0-27 cu ft): $99 if ≤25, $149 if 26-27
  medium: { maxVolume: 54, basePrice: 199 },      // 1/4 truck (28-54 cu ft)
  large: { maxVolume: 108, basePrice: 299 },      // 1/2 truck (55-108 cu ft)
  extra_large: { maxVolume: 162, basePrice: 399 }, // 3/4 truck (109-162 cu ft)
  full: { maxVolume: Infinity, basePrice: 449 },  // Full truck (163+ cu ft)
};

export async function analyzePhotos(photoUrls: string[]): Promise<PhotoAnalysisResult> {
  const imageContents = photoUrls.map((url) => ({
    type: "image_url" as const,
    image_url: { url },
  }));

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert junk removal and moving estimator. Analyze photos to identify items, estimate their volume and weight, and provide accurate pricing quotes.

CRITICAL: Standard pickup truck bed = 8 cubic yards = 216 cubic feet. Use this as reference for load size calculations.

Your task:
1. Identify all items visible in the photos
2. Estimate total volume in cubic feet (be precise!)
3. Map volume to truck load tier (minimum, 1/8, 1/4, 1/2, 3/4, or full)
4. Flag items requiring special handling (mattresses, appliances, electronics, hazardous materials)
5. Determine the best service type
6. Provide price estimate based on load tier + complexity factors

Load size tiers (VOLUME-BASED TRUCK PRICING):
- small: Under 1/8 truck (0-25 cu ft): $99 minimum | 1/8 truck (26-27 cu ft): $149
- medium: 1/4 truck (28-54 cu ft): $199
- large: 1/2 truck (55-108 cu ft): $299
- extra_large: 3/4 truck (109-162 cu ft): $399
- full: Full truck (163+ cu ft / 6+ cubic yards): $449

Service types:
- junk_removal: General trash, debris, unwanted items
- furniture_moving: Furniture transportation
- garage_cleanout: Complete garage cleanout service
- truck_unloading: Rental truck or moving trailer unloading

Special handling flags (add to itemBreakdown):
- Mattresses: "mattress" - Disposal fee +$25
- Appliances (fridges, washers, etc): "appliance" - Heavy lift +$25
- Electronics (TVs 50"+, treadmills): "electronics" - E-waste fee +$15
- Hazardous (paint, chemicals, batteries): "hazardous" - Special disposal +$75
- Stairs/Lift required: Note in reasoning

Add complexity factors to base price:
- Heavy items (100+ lbs each): +$25 per item
- Stairs: +$25 flat fee
- Long carry distance (50+ ft): +$30
- Hazardous materials: +$75 per item

Respond in JSON format only.`,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analyze these photos and provide a detailed estimate. Return a JSON object with: identifiedItems (array of item names), estimatedVolumeCubicFt (number - be precise, standard pickup = 216 cu ft), recommendedLoadSize (small/medium/large/extra_large/full), suggestedServiceType (junk_removal/furniture_moving/garage_cleanout/truck_unloading), confidence (0-1), suggestedPrice (number based on truck volume tiers: minimum $99, 1/8 truck $149, 1/4 truck $199, 1/2 truck $299, 3/4 truck $399, full truck $449, plus complexity factors), reasoning (string explaining the estimate and which truck tier it falls into), and itemBreakdown (array of objects with item, estimatedWeight, estimatedVolume, and specialHandling if item is mattress/appliance/electronics/hazardous).",
          },
          ...imageContents,
        ],
      },
    ],
    max_completion_tokens: 2048,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content || "{}";
  
  try {
    const parsed = JSON.parse(content);
    
    const volume = parsed.estimatedVolumeCubicFt || 100;
    let recommendedLoadSize: PhotoAnalysisResult["recommendedLoadSize"] = "medium";
    let suggestedPrice: number;

    if (volume <= LOAD_SIZE_THRESHOLDS.small.maxVolume) {
      recommendedLoadSize = "small";
      // Distinguish between minimum load ($99) and 1/8 truck ($149)
      suggestedPrice = volume <= 25 ? 99 : 149;
    } else if (volume <= LOAD_SIZE_THRESHOLDS.medium.maxVolume) {
      recommendedLoadSize = "medium";
      suggestedPrice = LOAD_SIZE_THRESHOLDS.medium.basePrice; // $199 (1/4 truck)
    } else if (volume <= LOAD_SIZE_THRESHOLDS.large.maxVolume) {
      recommendedLoadSize = "large";
      suggestedPrice = LOAD_SIZE_THRESHOLDS.large.basePrice; // $299 (1/2 truck)
    } else if (volume <= LOAD_SIZE_THRESHOLDS.extra_large.maxVolume) {
      recommendedLoadSize = "extra_large";
      suggestedPrice = LOAD_SIZE_THRESHOLDS.extra_large.basePrice; // $399 (3/4 truck)
    } else {
      recommendedLoadSize = "full";
      suggestedPrice = LOAD_SIZE_THRESHOLDS.full.basePrice; // $449 (full truck)
    }
    
    const finalConfidence = parsed.confidence || 0.8;
    const finalPrice = parsed.suggestedPrice || suggestedPrice;
    const varianceFactor = finalConfidence >= 0.8 ? 0.10 : finalConfidence >= 0.6 ? 0.20 : 0.30;
    const priceMin = Math.round(finalPrice * (1 - varianceFactor));
    const priceMax = Math.round(finalPrice * (1 + varianceFactor));

    return {
      identifiedItems: parsed.identifiedItems || [],
      estimatedVolumeCubicFt: volume,
      recommendedLoadSize: parsed.recommendedLoadSize || recommendedLoadSize,
      suggestedServiceType: parsed.suggestedServiceType || "junk_removal",
      confidence: finalConfidence,
      suggestedPrice: finalPrice,
      suggestedPriceMin: priceMin,
      suggestedPriceMax: priceMax,
      reasoning: parsed.reasoning || "Based on the items visible in the photos.",
      itemBreakdown: parsed.itemBreakdown || [],
    };
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    return {
      identifiedItems: [],
      estimatedVolumeCubicFt: 100,
      recommendedLoadSize: "medium",
      suggestedServiceType: "junk_removal",
      confidence: 0.5,
      suggestedPrice: 149,
      suggestedPriceMin: 105,
      suggestedPriceMax: 195,
      reasoning: "Unable to analyze photos. Using default estimate.",
      itemBreakdown: [],
    };
  }
}

// Pricing must match bundle-pricing.ts loadSizePackages
export async function getQuickEstimate(description: string): Promise<{
  estimatedPrice: number;
  loadSize: string;
  confidence: number;
  breakdown: string;
}> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a junk removal and moving price estimator. Given a description, provide a quick price estimate.

Volume-based truck pricing (standard pickup truck bed = 216 cubic feet):
- Minimum load: $99 (1-2 small items, under 25 cu ft)
- 1/8 truck: $149 (2-4 items, ~27 cu ft)
- 1/4 truck: $${LOAD_SIZE_THRESHOLDS.medium.basePrice} (4-6 items, ~54 cu ft)
- 1/2 truck: $${LOAD_SIZE_THRESHOLDS.large.basePrice} (6-10 items, ~108 cu ft)
- 3/4 truck: $${LOAD_SIZE_THRESHOLDS.extra_large.basePrice} (11-15 items, ~162 cu ft)
- Full truck: $${LOAD_SIZE_THRESHOLDS.full.basePrice} (15+ items, full truckload ~216+ cu ft)

Return JSON with: estimatedPrice (number matching above tiers), loadSize (small/medium/large/extra_large/full), confidence (0-1), breakdown (string explanation including which truck tier).`,
      },
      {
        role: "user",
        content: description,
      },
    ],
    max_completion_tokens: 512,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content || "{}";
  
  try {
    const parsed = JSON.parse(content);
    return {
      estimatedPrice: parsed.estimatedPrice || LOAD_SIZE_THRESHOLDS.medium.basePrice,
      loadSize: parsed.loadSize || "medium",
      confidence: parsed.confidence || 0.7,
      breakdown: parsed.breakdown || "Standard estimate based on description.",
    };
  } catch {
    return {
      estimatedPrice: LOAD_SIZE_THRESHOLDS.medium.basePrice,
      loadSize: "medium",
      confidence: 0.5,
      breakdown: "Default estimate.",
    };
  }
}

/**
 * Score cleanliness level from before/after photos for PolishUp cleaning service
 * Returns a 1-10 score with reasoning and specific observations
 */
export async function scoreCleanliness(photoUrls: string[]): Promise<CleanlinessScoreResult> {
  const imageContents = photoUrls.map((url) => ({
    type: "image_url" as const,
    image_url: { url },
  }));

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a professional home cleaning inspector with expertise in evaluating cleanliness standards.

Analyze photos to score overall cleanliness on a 1-10 scale:

1-2: Severely unclean - visible dirt, grime, clutter throughout, obvious neglect
3-4: Poor - noticeable dirt on surfaces, stains, dust accumulation, needs deep cleaning
5-6: Fair - Some visible dirt/dust, surfaces not fully cleaned, acceptable but could improve
7-8: Good - Most surfaces clean, minor dust in corners, generally well-maintained
9-10: Excellent - All surfaces spotless, no visible dirt/dust, professionally cleaned

Evaluation criteria:
- Surface cleanliness (counters, floors, appliances)
- Dust levels on furniture and fixtures
- Bathroom cleanliness (toilet, shower, sink, mirrors)
- Kitchen cleanliness (stove, sink, counters, appliances)
- Floor condition (swept, mopped, no debris)
- Windows and mirrors (streaks, spots, clarity)
- Organization and decluttering
- Overall attention to detail

Provide specific observations in:
- areasOfConcern: List any areas needing improvement
- highlights: List areas that were exceptionally clean

Be objective and consistent in scoring. A score of 7-8 is typical for a good professional clean.
9-10 should be reserved for truly exceptional, spotless results.

Respond in JSON format only.`,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analyze these photos and score the cleanliness level. Return a JSON object with: score (1-10 integer), confidence (0-1 number), reasoning (detailed explanation of the score), areasOfConcern (array of strings listing problem areas), and highlights (array of strings listing exceptionally clean areas).",
          },
          ...imageContents,
        ],
      },
    ],
    max_completion_tokens: 1024,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content || "{}";

  try {
    const parsed = JSON.parse(content);

    return {
      score: Math.min(Math.max(parsed.score || 5, 1), 10), // Clamp to 1-10
      confidence: Math.min(Math.max(parsed.confidence || 0.8, 0), 1), // Clamp to 0-1
      reasoning: parsed.reasoning || "Standard cleanliness assessment based on visual inspection.",
      areasOfConcern: parsed.areasOfConcern || [],
      highlights: parsed.highlights || [],
    };
  } catch (error) {
    console.error("Failed to parse cleanliness scoring response:", error);
    return {
      score: 5,
      confidence: 0.5,
      reasoning: "Unable to analyze photos. Using default assessment.",
      areasOfConcern: [],
      highlights: [],
    };
  }
}
