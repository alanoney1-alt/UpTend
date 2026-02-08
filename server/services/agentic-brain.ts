import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  timeout: 60000, // 60 seconds
});

function getFullImageUrl(path: string): string {
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  const devDomain = process.env.REPLIT_DEV_DOMAIN;
  if (devDomain) {
    const baseUrl = devDomain.startsWith("http") ? devDomain : `https://${devDomain}`;
    return `${baseUrl}${path}`;
  }
  return path;
}

export interface TriageItem {
  name: string;
  classification: "junk" | "donation" | "hazardous" | "recyclable" | "e_waste";
  estimatedWeightLbs: number;
  quantity: number;
  hazardNotes?: string;
  estimatedValue?: number;
}

export interface TriageResult {
  overallClassification: string;
  confidence: number;
  inventory: TriageItem[];
  totalEstimatedWeightLbs: number;
  totalItemCount: number;
  hazardousItemCount: number;
  donationItemCount: number;
  recyclableItemCount: number;
  guaranteedPrice: number;
  recommendedCrewSize: number;
  recommendedVehicleType: string;
  specialEquipmentNeeded: string[];
  safetyWarnings: string[];
  rawResponse: string;
}

export async function runInstantTriage(photoUrls: string[]): Promise<TriageResult> {
  const imageContent = photoUrls.map((url) => ({
    type: "image_url" as const,
    image_url: { url: getFullImageUrl(url) },
  }));

  const systemPrompt = `You are an expert AI triage agent for UpTend, a home services platform. Analyze photos of items and classify each one into categories.

For EACH item visible, determine:
- name: descriptive name
- classification: one of "junk" (trash/unusable), "donation" (usable, donate to Habitat for Humanity etc), "hazardous" (paint, chemicals, batteries, asbestos), "recyclable" (metal, cardboard, plastics), "e_waste" (electronics, computers, TVs)
- estimatedWeightLbs: weight estimate in pounds
- quantity: how many of this item
- hazardNotes: any safety handling notes (especially for hazardous items)
- estimatedValue: resale/donation value if applicable

Also determine:
- overallClassification: the dominant category ("junk", "donation", "hazardous", "recyclable", "e_waste", or "mixed" if varied)
- confidence: 0-1 confidence score
- guaranteedPrice: estimated fixed price for removal (base $99 for small loads, $149 medium, $249 large, $399 extra large, add $50 per hazardous item, add $25 per heavy item over 100lbs)
- recommendedCrewSize: 1-4 workers needed
- recommendedVehicleType: "pickup_truck", "cargo_van", "box_truck", or "flatbed"
- specialEquipmentNeeded: array of special equipment like "dollies", "straps", "hazmat_gloves", "respirator"
- safetyWarnings: array of safety warnings for crew

Return valid JSON with these exact fields.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze these photos. Identify and classify every visible item. Provide a Visual Bill of Lading with guaranteed pricing." },
            ...imageContent,
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const raw = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);
    const inventory: TriageItem[] = (parsed.inventory || parsed.items || []).map((item: any) => ({
      name: item.name || "Unknown Item",
      classification: item.classification || "junk",
      estimatedWeightLbs: item.estimatedWeightLbs || item.weight || 10,
      quantity: item.quantity || 1,
      hazardNotes: item.hazardNotes || item.hazard_notes,
      estimatedValue: item.estimatedValue || item.estimated_value || 0,
    }));

    const totalWeight = inventory.reduce((sum, i) => sum + i.estimatedWeightLbs * i.quantity, 0);
    const totalItems = inventory.reduce((sum, i) => sum + i.quantity, 0);

    return {
      overallClassification: parsed.overallClassification || parsed.overall_classification || "mixed",
      confidence: parsed.confidence || 0.7,
      inventory,
      totalEstimatedWeightLbs: totalWeight,
      totalItemCount: totalItems,
      hazardousItemCount: inventory.filter(i => i.classification === "hazardous").length,
      donationItemCount: inventory.filter(i => i.classification === "donation").length,
      recyclableItemCount: inventory.filter(i => i.classification === "recyclable" || i.classification === "e_waste").length,
      guaranteedPrice: parsed.guaranteedPrice || parsed.guaranteed_price || 149,
      recommendedCrewSize: parsed.recommendedCrewSize || parsed.recommended_crew_size || 2,
      recommendedVehicleType: parsed.recommendedVehicleType || parsed.recommended_vehicle_type || "cargo_van",
      specialEquipmentNeeded: parsed.specialEquipmentNeeded || parsed.special_equipment_needed || [],
      safetyWarnings: parsed.safetyWarnings || parsed.safety_warnings || [],
      rawResponse: raw,
    };
  } catch (error: any) {
    console.error("AI Triage error:", error.message);
    return {
      overallClassification: "mixed",
      confidence: 0,
      inventory: [],
      totalEstimatedWeightLbs: 0,
      totalItemCount: 0,
      hazardousItemCount: 0,
      donationItemCount: 0,
      recyclableItemCount: 0,
      guaranteedPrice: 149,
      recommendedCrewSize: 2,
      recommendedVehicleType: "cargo_van",
      specialEquipmentNeeded: [],
      safetyWarnings: [],
      rawResponse: `Error: ${error.message}`,
    };
  }
}

export interface SentimentResult {
  sentimentScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  keyPhrases: string[];
  issues: string[];
  recommendedAction: string;
  urgencyReason?: string;
}

export async function analyzeSentiment(text: string, context?: { sourceType?: string; customerName?: string }): Promise<SentimentResult> {
  const systemPrompt = `You are a Revenue Protection AI agent for UpTend. Analyze customer messages, reviews, and feedback to detect unhappiness BEFORE it becomes a public negative review.

Score the sentiment from -1.0 (extremely negative) to 1.0 (extremely positive).
Classify risk level:
- "low": Score > 0.2, customer is satisfied
- "medium": Score -0.2 to 0.2, neutral or mildly unhappy
- "high": Score -0.6 to -0.2, clearly unhappy, might post negative review
- "critical": Score < -0.6, very angry, likely to post bad review or dispute charges

Extract:
- keyPhrases: phrases indicating sentiment (positive or negative)
- issues: specific problems mentioned (e.g., "late arrival", "overcharged", "rude worker", "damage")
- recommendedAction: specific action to take (e.g., "Send apology with 15% discount", "Escalate to manager", "Call customer within 1 hour")
- urgencyReason: why this is urgent (only for high/critical)

Source type context: ${context?.sourceType || "unknown"}
Return valid JSON.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze this text for sentiment and risk:\n\n"${text}"` },
      ],
      response_format: { type: "json_object" },
      max_tokens: 800,
    });

    const raw = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);

    return {
      sentimentScore: parsed.sentimentScore ?? parsed.sentiment_score ?? 0,
      riskLevel: parsed.riskLevel || parsed.risk_level || "low",
      keyPhrases: parsed.keyPhrases || parsed.key_phrases || [],
      issues: parsed.issues || [],
      recommendedAction: parsed.recommendedAction || parsed.recommended_action || "Monitor - no immediate action needed",
      urgencyReason: parsed.urgencyReason || parsed.urgency_reason,
    };
  } catch (error: any) {
    console.error("Sentiment analysis error:", error.message);
    return {
      sentimentScore: 0,
      riskLevel: "low",
      keyPhrases: [],
      issues: [],
      recommendedAction: "AI analysis failed - manual review recommended",
    };
  }
}

export interface ConflictShieldResult {
  preExistingDamage: Array<{ location: string; type: string; severity: string; description: string }>;
  preExistingDamageCount: number;
  newDamageDetected: boolean;
  newDamage: Array<{ location: string; type: string; severity: string; description: string }>;
  confidence: number;
  summary: string;
  recommendation: string;
  rawResponse: string;
}

export async function runConflictShield(
  beforePhotos: string[],
  afterPhotos?: string[]
): Promise<ConflictShieldResult> {
  const beforeContent = beforePhotos.map((url) => ({
    type: "image_url" as const,
    image_url: { url: getFullImageUrl(url) },
  }));

  const afterContent = afterPhotos?.map((url) => ({
    type: "image_url" as const,
    image_url: { url: getFullImageUrl(url) },
  })) || [];

  const hasAfter = afterContent.length > 0;

  const systemPrompt = `You are an AI Conflict Shield agent for UpTend. Your job is to protect the company and workers from false damage claims.

${hasAfter ? "You are comparing BEFORE and AFTER photos of a job site." : "You are analyzing BEFORE photos to document pre-existing conditions."}

For BEFORE photos, carefully scan for:
- Scratches, dents, scuffs on walls, floors, door frames
- Existing stains, marks, or wear patterns
- Broken or damaged items
- Pre-existing structural issues

${hasAfter ? `For AFTER photos, determine:
- Was any NEW damage caused during the job?
- Compare each area visible in both sets
- Note any changes not present in BEFORE photos` : ""}

Return JSON with:
- preExistingDamage: array of {location, type, severity ("minor"/"moderate"/"major"), description}
- preExistingDamageCount: number
- newDamageDetected: boolean ${hasAfter ? "(compare before/after)" : "(false since no after photos)"}
- newDamage: array of {location, type, severity, description} ${hasAfter ? "" : "(empty since no after photos)"}
- confidence: 0-1
- summary: brief text summary
- recommendation: "clear" (no issues), "pre_existing_documented" (damage found but pre-existing), "new_damage_found" (new damage detected), or "inconclusive"`;

  try {
    const userContent: any[] = [
      { type: "text", text: `BEFORE photos (${beforePhotos.length} images):` },
      ...beforeContent,
    ];

    if (hasAfter) {
      userContent.push(
        { type: "text", text: `AFTER photos (${afterPhotos!.length} images):` },
        ...afterContent
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1500,
    });

    const raw = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);

    return {
      preExistingDamage: parsed.preExistingDamage || parsed.pre_existing_damage || [],
      preExistingDamageCount: parsed.preExistingDamageCount || parsed.pre_existing_damage_count || 0,
      newDamageDetected: parsed.newDamageDetected || parsed.new_damage_detected || false,
      newDamage: parsed.newDamage || parsed.new_damage || [],
      confidence: parsed.confidence || 0.7,
      summary: parsed.summary || "Analysis complete",
      recommendation: parsed.recommendation || "inconclusive",
      rawResponse: raw,
    };
  } catch (error: any) {
    console.error("Conflict Shield error:", error.message);
    return {
      preExistingDamage: [],
      preExistingDamageCount: 0,
      newDamageDetected: false,
      newDamage: [],
      confidence: 0,
      summary: `AI analysis failed: ${error.message}`,
      recommendation: "inconclusive",
      rawResponse: `Error: ${error.message}`,
    };
  }
}

export interface DispatchRecommendationResult {
  recommendedCrewSize: number;
  recommendedVehicleType: string;
  estimatedTotalWeightLbs: number;
  estimatedVolumeCubicFt: number;
  estimatedDurationHours: number;
  fuelEfficiencyScore: number;
  greenMatchPriority: boolean;
  reasoning: string;
}

export function generateDispatchRecommendation(triageResult: TriageResult): DispatchRecommendationResult {
  const weight = triageResult.totalEstimatedWeightLbs;
  const items = triageResult.totalItemCount;
  const hasHazardous = triageResult.hazardousItemCount > 0;

  let crewSize = 2;
  if (weight > 2000 || items > 30) crewSize = 4;
  else if (weight > 1000 || items > 15) crewSize = 3;
  else if (weight < 200 && items <= 5) crewSize = 1;

  if (hasHazardous) crewSize = Math.max(crewSize, 2);

  let vehicleType = "cargo_van";
  if (weight > 3000) vehicleType = "box_truck";
  else if (weight > 1500) vehicleType = "box_truck";
  else if (weight < 500 && items <= 10) vehicleType = "pickup_truck";

  const volumeEstimate = weight * 0.15;

  let durationHours = 2;
  if (items > 30) durationHours = 5;
  else if (items > 20) durationHours = 4;
  else if (items > 10) durationHours = 3;
  else if (items <= 3) durationHours = 1;

  if (hasHazardous) durationHours += 0.5;

  const donationRatio = triageResult.donationItemCount / Math.max(items, 1);
  const recyclableRatio = triageResult.recyclableItemCount / Math.max(items, 1);
  const greenScore = Math.round((donationRatio + recyclableRatio) * 100);
  const greenPriority = greenScore > 50;

  const reasons: string[] = [];
  reasons.push(`${items} items totaling ~${Math.round(weight)} lbs`);
  if (hasHazardous) reasons.push(`${triageResult.hazardousItemCount} hazardous items require trained handling`);
  if (triageResult.donationItemCount > 0) reasons.push(`${triageResult.donationItemCount} items can be donated`);
  if (triageResult.recyclableItemCount > 0) reasons.push(`${triageResult.recyclableItemCount} items recyclable`);
  if (greenPriority) reasons.push("High diversion rate - prioritize fuel-efficient crew");

  return {
    recommendedCrewSize: crewSize,
    recommendedVehicleType: vehicleType,
    estimatedTotalWeightLbs: weight,
    estimatedVolumeCubicFt: Math.round(volumeEstimate),
    estimatedDurationHours: durationHours,
    fuelEfficiencyScore: greenScore,
    greenMatchPriority: greenPriority,
    reasoning: reasons.join(". ") + ".",
  };
}
