/**
 * OpenAI Vision Client
 *
 * Handles all image/photo analysis using OpenAI GPT-5.2 vision.
 * Used for tasks requiring high visual accuracy:
 * - Photo-to-Quote (junk removal, pressure washing, etc.)
 * - Inventory detection & cataloging
 * - Appliance scanning (brand/model/serial extraction)
 * - Before/after job verification
 * - Quality assessment of pro work photos
 *
 * Claude remains the conversational AI (George chat, text generation).
 * OpenAI handles the "eyes" — image analysis where accuracy matters most.
 */

import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

if (!OPENAI_API_KEY) {
  console.warn("⚠️  OPENAI_API_KEY not set. Vision features will use mock responses.");
}

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: OPENAI_API_KEY, timeout: 60000 });
  }
  return client;
}

// ─── Core Vision Analysis ────────────────────────────────────────────────────

export interface VisionAnalysisOptions {
  imageUrls: string[];          // Up to 8 images
  prompt: string;
  systemPrompt?: string;
  model?: string;
  maxTokens?: number;
  jsonMode?: boolean;           // Force JSON output
}

export async function analyzeImages(options: VisionAnalysisOptions): Promise<any> {
  const {
    imageUrls,
    prompt,
    systemPrompt,
    model = "gpt-5.2",
    maxTokens = 4096,
    jsonMode = true,
  } = options;

  if (!OPENAI_API_KEY) {
    console.warn("[OpenAI Vision] No API key — returning mock response");
    return {
      _mock: true,
      analysis: "Mock vision analysis — set OPENAI_API_KEY for real results",
    };
  }

  const imageContent = imageUrls.slice(0, 8).map((url) => ({
    type: "image_url" as const,
    image_url: { url, detail: "high" as const },
  }));

  try {
    const response = await getClient().chat.completions.create({
      model,
      messages: [
        ...(systemPrompt
          ? [{ role: "system" as const, content: systemPrompt }]
          : []),
        {
          role: "user" as const,
          content: [{ type: "text" as const, text: prompt }, ...imageContent],
        },
      ],
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      // GPT-5.x uses max_completion_tokens; older models use max_tokens
      ...(model.startsWith("gpt-5") ? { max_completion_tokens: maxTokens } : { max_tokens: maxTokens }),
    });

    const content = response.choices[0]?.message?.content || "";

    if (jsonMode) {
      try {
        return JSON.parse(content);
      } catch {
        console.warn("[OpenAI Vision] Failed to parse JSON, returning raw text");
        return { analysis: content };
      }
    }

    return { analysis: content };
  } catch (error: any) {
    console.error("[OpenAI Vision] API error:", error.message);
    throw new Error(`OpenAI Vision error: ${error.message}`);
  }
}

// ─── Specialized Analysis Functions ──────────────────────────────────────────

/**
 * Analyze photos for service quoting (junk removal, pressure washing, etc.)
 */
export async function analyzeForQuote(imageUrls: string[], serviceType: string): Promise<any> {
  const prompts: Record<string, string> = {
    "junk-removal": `Analyze this photo for junk removal estimation. Identify every visible item.
Return JSON:
{
  "detectedItems": ["item1", "item2", ...],
  "estimatedVolumeCubicFeet": number,
  "estimatedWeightLbs": number,
  "truckSize": "small" | "medium" | "large",
  "laborHours": number (realistic estimate),
  "confidenceScore": 0.0-1.0,
  "itemBreakdown": [{"item": "couch", "quantity": 1, "category": "furniture", "disposalMethod": "donation|landfill|recycle"}],
  "accessDifficulty": "easy" | "moderate" | "difficult" (stairs, narrow paths, etc.),
  "hazardousItems": ["paint cans", etc.] or [],
  "notes": "any relevant observations"
}`,

    "pressure-washing": `Analyze this photo for pressure washing estimation.
Return JSON:
{
  "estimatedSqft": number,
  "surfaceType": "concrete" | "wood" | "brick" | "siding" | "stone" | "composite",
  "surfaceCondition": "light soiling" | "moderate" | "heavy staining" | "mold/mildew" | "oil stains",
  "cleaningDifficulty": "light" | "moderate" | "heavy",
  "estimatedHours": number,
  "psiRecommendation": number,
  "softWashRecommended": boolean,
  "confidenceScore": 0.0-1.0,
  "recommendations": ["tip1", "tip2"],
  "notes": "any relevant observations"
}`,

    "gutter-cleaning": `Analyze this photo for gutter cleaning estimation.
Return JSON:
{
  "gutterLengthFeet": number (estimated linear feet),
  "clogLevel": "light" | "moderate" | "heavy" | "severe",
  "debrisType": ["leaves", "pine needles", "shingle granules", etc.],
  "stories": 1 | 2 | 3,
  "accessDifficulty": "easy" | "moderate" | "difficult",
  "downspoutCount": number (if visible),
  "damageVisible": boolean,
  "damageNotes": "description if damage visible",
  "estimatedHours": number,
  "confidenceScore": 0.0-1.0,
  "notes": "any relevant observations"
}`,

    "landscaping": `Analyze this photo for landscaping estimation.
Return JSON:
{
  "yardSizeSqft": number (estimated),
  "currentCondition": "well-maintained" | "needs attention" | "overgrown" | "neglected",
  "grassType": "bermuda" | "st. augustine" | "zoysia" | "mixed" | "unknown",
  "treesCount": number,
  "hedgesLinearFeet": number,
  "flowerbedsSqft": number,
  "irrigationVisible": boolean,
  "servicesNeeded": ["mowing", "edging", "trimming", "mulching", "weeding", etc.],
  "estimatedHours": number,
  "confidenceScore": 0.0-1.0,
  "notes": "any relevant observations"
}`,

    default: `Analyze this photo for a home service quote estimation.
Return JSON:
{
  "serviceType": "detected service type",
  "scopeDescription": "what work is needed",
  "estimatedHours": number,
  "difficultyLevel": "easy" | "moderate" | "difficult",
  "materialsNeeded": ["item1", "item2"],
  "confidenceScore": 0.0-1.0,
  "notes": "any relevant observations"
}`,
  };

  const prompt = prompts[serviceType] || prompts.default;

  return analyzeImages({
    imageUrls,
    prompt,
    systemPrompt: "You are an expert home services estimator with 20+ years of experience in the Orlando, FL metro area. Be precise and conservative with estimates. Base pricing on Central Florida market rates.",
    jsonMode: true,
  });
}

/**
 * Extract appliance info from model plate / label photo
 */
export async function scanAppliance(imageUrls: string[]): Promise<{
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  category: string | null;
  subcategory: string | null;
  manufacturingDate: string | null;
  energyRating: string | null;
  confidence: { overall: number; brand: number; model: number; serial: number; category: number };
}> {
  const result = await analyzeImages({
    imageUrls,
    prompt: `Analyze this appliance photo. Extract all identifying information from the model plate, label, or the appliance itself.

Return JSON:
{
  "brand": "manufacturer name" or null,
  "model": "model number" or null,
  "serialNumber": "serial number" or null,
  "category": "refrigerator" | "washer" | "dryer" | "dishwasher" | "oven" | "microwave" | "hvac" | "water_heater" | "garbage_disposal" | "other",
  "subcategory": "french_door_refrigerator" | "top_load_washer" | etc. or null,
  "manufacturingDate": "YYYY-MM" or null (from serial number decode or label),
  "energyRating": "Energy Star" or rating if visible, or null,
  "estimatedAge": "X years" or null,
  "estimatedValue": number (current market value in USD) or null,
  "confidence": {
    "overall": 0.0-1.0,
    "brand": 0.0-1.0,
    "model": 0.0-1.0,
    "serial": 0.0-1.0,
    "category": 0.0-1.0
  },
  "notes": "any observations about condition, potential issues, etc."
}

Be especially precise with model numbers and serial numbers — every character matters for warranty lookups.`,
    systemPrompt: "You are an expert appliance technician and home inspector. Read model plates and labels with extreme precision. If you can't read a character clearly, indicate uncertainty.",
    jsonMode: true,
  });

  return {
    brand: result.brand || null,
    model: result.model || null,
    serialNumber: result.serialNumber || null,
    category: result.category || null,
    subcategory: result.subcategory || null,
    manufacturingDate: result.manufacturingDate || null,
    energyRating: result.energyRating || null,
    confidence: result.confidence || { overall: 0.5, brand: 0.5, model: 0.5, serial: 0.5, category: 0.5 },
  };
}

/**
 * Verify job completion quality (before/after comparison)
 */
export async function assessJobPhotos(imageUrls: string[], serviceType: string): Promise<{
  photoQualityScore: number;
  workQualityScore: number;
  documentationScore: number;
  overallScore: number;
  beforeAfterDetected: boolean;
  positiveHighlights: string[];
  issues: string[];
  improvementSuggestions: string[];
}> {
  const result = await analyzeImages({
    imageUrls,
    prompt: `Assess these job completion photos for a ${serviceType} service.

Return JSON:
{
  "photoQualityScore": 0-100 (clarity, lighting, angles, coverage),
  "workQualityScore": 0-100 (quality of the actual work visible),
  "documentationScore": 0-100 (before/after coverage, multiple angles, detail shots),
  "overallScore": 0-100 (weighted average),
  "beforeAfterDetected": true/false (are there clear before AND after photos?),
  "completionVerified": true/false (does the work appear complete?),
  "positiveHighlights": ["thorough cleanup", "professional finish", etc.],
  "issues": ["missed spot in corner", "debris left behind", etc.] or [],
  "improvementSuggestions": ["add close-up shots", "better lighting", etc.],
  "customerSafeToShow": true/false (photos appropriate to share with customer)
}`,
    systemPrompt: "You are a quality assurance inspector for a home services platform. Be fair but thorough. Focus on work quality and whether the job appears complete and professional.",
    jsonMode: true,
  });

  return {
    photoQualityScore: result.photoQualityScore || 0,
    workQualityScore: result.workQualityScore || 0,
    documentationScore: result.documentationScore || 0,
    overallScore: result.overallScore || 0,
    beforeAfterDetected: result.beforeAfterDetected || false,
    positiveHighlights: result.positiveHighlights || [],
    issues: result.issues || [],
    improvementSuggestions: result.improvementSuggestions || [],
  };
}

/**
 * Analyze home exterior for Home DNA Scan
 */
export async function analyzeHomeExterior(imageUrls: string[]): Promise<any> {
  return analyzeImages({
    imageUrls,
    prompt: `Analyze this home exterior photo for a comprehensive home maintenance scan.

Return JSON:
{
  "roofCondition": { "score": 0-100, "issues": [], "urgency": "none"|"low"|"medium"|"high" },
  "gutterCondition": { "score": 0-100, "issues": [], "urgency": "..." },
  "exteriorWalls": { "score": 0-100, "issues": [], "material": "stucco|vinyl|brick|...", "urgency": "..." },
  "driveway": { "score": 0-100, "issues": [], "material": "concrete|asphalt|paver", "urgency": "..." },
  "landscaping": { "score": 0-100, "issues": [], "urgency": "..." },
  "windowsAndDoors": { "score": 0-100, "issues": [], "urgency": "..." },
  "poolArea": { "score": 0-100, "issues": [], "urgency": "..." } or null,
  "overallScore": 0-100,
  "immediateActions": ["fix X", "clean Y"],
  "preventiveMaintenance": ["schedule gutter cleaning", "seal driveway"],
  "estimatedMaintenanceCost": { "immediate": number, "annual": number },
  "climateRisks": ["hurricane prep needed", "UV damage on south wall", etc.]
}

Focus on Central Florida climate concerns: hurricanes, UV exposure, humidity/mold, tropical storms.`,
    systemPrompt: "You are a licensed Florida home inspector with 25+ years of experience in the Orlando metro area. Provide actionable, honest assessments. Don't create problems that don't exist, but don't miss real ones.",
    jsonMode: true,
  });
}

/**
 * Drop-in replacement for anthropic-client's analyzeImage().
 * Routes use this signature: analyzeImage({ imageUrl, prompt, maxTokens })
 */
export async function analyzeImageOpenAI(options: {
  imageUrl: string;
  prompt: string;
  model?: string;
  maxTokens?: number;
}): Promise<any> {
  const { imageUrl, prompt, maxTokens = 2048 } = options;
  return analyzeImages({
    imageUrls: [imageUrl],
    prompt,
    maxTokens,
    jsonMode: true,
  });
}

export default {
  analyzeImages,
  analyzeForQuote,
  scanAppliance,
  assessJobPhotos,
  analyzeHomeExterior,
  analyzeImageOpenAI,
};
