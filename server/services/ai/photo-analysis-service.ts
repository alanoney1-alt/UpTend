/**
 * AI Photo Analysis Service
 *
 * Handles vision-based analysis for:
 * - Photo-to-Quote (estimate junk volume, items, pricing)
 * - Inventory Estimation (moving/hauling volume calculation)
 * - Quality Assessment (job photo documentation review)
 *
 * NOW POWERED BY OpenAI GPT-5.2 for maximum image analysis accuracy.
 * (Previously used Claude — switched for better object detection & counting)
 */

import { analyzeForQuote, assessJobPhotos } from "./openai-vision-client";

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
  const analysis = await analyzeForQuote(photoUrls, "junk-removal");

  // Calculate price range based on volume and complexity
  const truckSize = analysis.truckSize || "medium";
  const basePrice = truckSize === "large" ? 400 : truckSize === "medium" ? 250 : 150;
  const difficultyMultiplier = analysis.accessDifficulty === "difficult" ? 1.3 : analysis.accessDifficulty === "moderate" ? 1.1 : 1.0;
  const hazardSurcharge = (analysis.hazardousItems?.length || 0) > 0 ? 50 : 0;

  return {
    detectedItems: analysis.detectedItems || [],
    estimatedVolume: `${analysis.estimatedVolumeCubicFeet || 200} cubic feet`,
    estimatedWeight: analysis.estimatedWeightLbs || 500,
    truckSize,
    laborHours: analysis.laborHours || 3,
    estimatedPriceMin: Math.round(basePrice * 0.9 * difficultyMultiplier + hazardSurcharge),
    estimatedPriceMax: Math.round(basePrice * 1.4 * difficultyMultiplier + hazardSurcharge),
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
  const analysis = await analyzeForQuote(photoUrls, "pressure-washing");

  const sqft = analysis.estimatedSqft || 500;
  const pricePerSqft = analysis.cleaningDifficulty === "heavy" ? 0.35 :
                        analysis.cleaningDifficulty === "moderate" ? 0.25 : 0.18;

  return {
    estimatedSqft: sqft,
    surfaceType: analysis.surfaceType || "concrete",
    cleaningDifficulty: analysis.cleaningDifficulty || "moderate",
    estimatedWaterGallons: Math.round(sqft * 0.5),
    estimatedHours: analysis.estimatedHours || 2.5,
    estimatedPrice: Math.round(sqft * pricePerSqft),
    recommendations: analysis.recommendations || [],
  };
}

export async function assessJobQuality(photoUrls: string[], serviceType?: string): Promise<{
  photoQualityScore: number;
  documentationScore: number;
  overallScore: number;
  positiveHighlights: string[];
  improvementSuggestions: string[];
}> {
  const result = await assessJobPhotos(photoUrls, serviceType || "general home service");

  return {
    photoQualityScore: result.photoQualityScore,
    documentationScore: result.documentationScore,
    overallScore: result.overallScore,
    positiveHighlights: result.positiveHighlights,
    improvementSuggestions: result.improvementSuggestions,
  };
}

export default {
  analyzeJunkRemovalPhotos,
  analyzePressureWashingArea,
  assessJobQuality,
};
