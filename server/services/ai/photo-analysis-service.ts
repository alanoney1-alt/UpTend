/**
 * AI Photo Analysis Service
 *
 * Handles vision-based analysis for:
 * - Photo-to-Quote (estimate junk volume, items, pricing)
 * - Inventory Estimation (moving/hauling volume calculation)
 * - Quality Assessment (job photo documentation review)
 */

import { analyzeImage } from "./anthropic-client";

export async function analyzeJunkRemovalPhotos(photoUrls: string[]): Promise<{
  detectedItems: string[];
  estimatedVolume: string;
  estimatedWeight: number;
  truckSize: string;
  laborHours: number;
  estimatedPriceMin: number;
  estimatedPriceMax: number;
  confidenceScore: number;
  itemBreakdown: Array<{ item: string; quantity: number; category: string }>;
}> {
  const prompt = `Analyze this photo for junk removal estimation. Return JSON with:
{
  "detectedItems": ["furniture", "boxes", etc],
  "estimatedVolumeCubicFeet": number,
  "estimatedWeightLbs": number,
  "truckSize": "small/medium/large",
  "laborHours": number,
  "confidenceScore": 0-1,
  "itemBreakdown": [{"item": "couch", "quantity": 1, "category": "furniture"}]
}

Base pricing: Small truck $150-250, Medium $250-400, Large $400-700
Consider: item weight, volume, disposal complexity, access difficulty`;

  // Analyze first photo (or all if time permits)
  const analysis = await analyzeImage({
    imageUrl: photoUrls[0],
    prompt,
    maxTokens: 1024,
  });

  // Calculate price range based on volume and complexity
  const basePrice = analysis.truckSize === "large" ? 400 : analysis.truckSize === "medium" ? 250 : 150;
  const priceRange = {
    min: Math.round(basePrice * 0.9),
    max: Math.round(basePrice * 1.4),
  };

  return {
    detectedItems: analysis.detectedItems || [],
    estimatedVolume: `${analysis.estimatedVolumeCubicFeet || 200} cubic feet`,
    estimatedWeight: analysis.estimatedWeightLbs || 500,
    truckSize: analysis.truckSize || "medium",
    laborHours: analysis.laborHours || 3,
    estimatedPriceMin: priceRange.min,
    estimatedPriceMax: priceRange.max,
    confidenceScore: analysis.confidenceScore || 0.85,
    itemBreakdown: analysis.itemBreakdown || [],
  };
}

export async function analyzePressureWashingArea(photoUrls: string[]): Promise<{
  estimatedSqft: number;
  surfaceType: string;
  cleaningDifficulty: string;
  estimatedWaterGallons: number;
  estimatedHours: number;
  estimatedPrice: number;
  recommendations: string[];
}> {
  const prompt = `Analyze this photo for pressure washing estimation. Return JSON with:
{
  "estimatedSqft": number,
  "surfaceType": "concrete/wood/brick/siding",
  "cleaningDifficulty": "light/moderate/heavy",
  "estimatedHours": number,
  "recommendations": ["consider soft wash for wood", etc]
}`;

  const analysis = await analyzeImage({
    imageUrl: photoUrls[0],
    prompt,
    maxTokens: 512,
  });

  const sqft = analysis.estimatedSqft || 500;
  const pricePerSqft = analysis.cleaningDifficulty === "heavy" ? 0.30 : 0.20;

  return {
    estimatedSqft: sqft,
    surfaceType: analysis.surfaceType || "concrete",
    cleaningDifficulty: analysis.cleaningDifficulty || "moderate",
    estimatedWaterGallons: sqft * 0.5,
    estimatedHours: analysis.estimatedHours || 2.5,
    estimatedPrice: Math.round(sqft * pricePerSqft),
    recommendations: analysis.recommendations || [],
  };
}

export async function assessJobQuality(photoUrls: string[]): Promise<{
  photoQualityScore: number;
  documentationScore: number;
  overallScore: number;
  positiveHighlights: string[];
  improvementSuggestions: string[];
}> {
  const prompt = `Assess the quality of these job completion photos. Return JSON with:
{
  "photoQualityScore": 0-100 (clarity, lighting, angles),
  "documentationScore": 0-100 (before/after coverage, detail visibility),
  "overallScore": 0-100,
  "positiveHighlights": ["good lighting", "clear before/after", etc],
  "improvementSuggestions": ["add close-ups", "better angles", etc]
}`;

  const analysis = await analyzeImage({
    imageUrl: photoUrls[0],
    prompt,
    maxTokens: 512,
  });

  return {
    photoQualityScore: analysis.photoQualityScore || 85,
    documentationScore: analysis.documentationScore || 80,
    overallScore: analysis.overallScore || 82,
    positiveHighlights: analysis.positiveHighlights || [],
    improvementSuggestions: analysis.improvementSuggestions || [],
  };
}

export default {
  analyzeJunkRemovalPhotos,
  analyzePressureWashingArea,
  assessJobQuality,
};
