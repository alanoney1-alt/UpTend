/**
 * AI Services Index
 *
 * Central export point for all AI services
 */

export * from "./anthropic-client";
export * from "./openai-vision-client";
export * from "./concierge-service";
export * from "./photo-analysis-service";
export * from "./route-optimization-service";
export * from "./quality-scoring-service";
export * from "./fraud-detection-service";

import anthropicClient from "./anthropic-client";
import openaiVisionClient from "./openai-vision-client";
import conciergeService from "./concierge-service";
import photoAnalysisService from "./photo-analysis-service";
import routeOptimizationService from "./route-optimization-service";
import qualityScoringService from "./quality-scoring-service";
import fraudDetectionService from "./fraud-detection-service";

export default {
  anthropicClient,
  openaiVisionClient,
  conciergeService,
  photoAnalysisService,
  routeOptimizationService,
  qualityScoringService,
  fraudDetectionService,
};
