/**
 * AI Quality Scoring Service
 *
 * Calculates comprehensive quality scores for pros based on:
 * - Job completion rate
 * - On-time performance
 * - Customer ratings
 * - ESG compliance
 * - Photo documentation
 * - Repeat customer rate
 */

export interface ProPerformanceData {
  completedJobs: number;
  totalJobs: number;
  onTimeJobs: number;
  customerRatings: number[];
  esgScores: number[];
  photosProvided: number;
  photosRequired: number;
  repeatCustomers: number;
  totalCustomers: number;
}

export interface QualityScoreResult {
  overallScore: number; // 0-100
  tier: "platinum" | "gold" | "silver" | "bronze";
  componentScores: {
    completionRate: number;
    onTimeRate: number;
    customerSatisfaction: number;
    esgCompliance: number;
    documentation: number;
    customerRetention: number;
  };
  strengths: string[];
  improvementAreas: string[];
  trainingRecommendations: string[];
  nextTierRequirements?: string[];
}

export async function calculateQualityScore(
  data: ProPerformanceData
): Promise<QualityScoreResult> {
  // Calculate component scores (0-100 each)
  const completionRate = (data.completedJobs / data.totalJobs) * 100;
  const onTimeRate = (data.onTimeJobs / data.completedJobs) * 100;
  const customerSatisfaction =
    data.customerRatings.length > 0
      ? (data.customerRatings.reduce((a, b) => a + b, 0) / data.customerRatings.length / 5) * 100
      : 0;
  const esgCompliance =
    data.esgScores.length > 0
      ? data.esgScores.reduce((a, b) => a + b, 0) / data.esgScores.length
      : 0;
  const documentation = (data.photosProvided / data.photosRequired) * 100;
  const customerRetention = (data.repeatCustomers / data.totalCustomers) * 100;

  const componentScores = {
    completionRate: Math.round(completionRate),
    onTimeRate: Math.round(onTimeRate),
    customerSatisfaction: Math.round(customerSatisfaction),
    esgCompliance: Math.round(esgCompliance),
    documentation: Math.round(documentation),
    customerRetention: Math.round(customerRetention),
  };

  // Weighted overall score
  const overallScore = Math.round(
    completionRate * 0.25 +
      onTimeRate * 0.20 +
      customerSatisfaction * 0.25 +
      esgCompliance * 0.15 +
      documentation * 0.10 +
      customerRetention * 0.05
  );

  // Determine tier
  const tier = getTier(overallScore);

  // Identify strengths (scores >= 90)
  const strengths: string[] = [];
  if (componentScores.completionRate >= 90)
    strengths.push("Excellent job completion rate");
  if (componentScores.onTimeRate >= 90) strengths.push("Consistently on-time");
  if (componentScores.customerSatisfaction >= 90)
    strengths.push("Outstanding customer satisfaction");
  if (componentScores.esgCompliance >= 90)
    strengths.push("Strong ESG compliance");
  if (componentScores.documentation >= 90)
    strengths.push("Excellent photo documentation");

  // Identify improvement areas (scores < 80)
  const improvementAreas: string[] = [];
  if (componentScores.completionRate < 80)
    improvementAreas.push("Job completion rate needs improvement");
  if (componentScores.onTimeRate < 80)
    improvementAreas.push("On-time performance can be better");
  if (componentScores.customerSatisfaction < 80)
    improvementAreas.push("Focus on customer satisfaction");
  if (componentScores.esgCompliance < 80)
    improvementAreas.push("Improve ESG compliance");
  if (componentScores.documentation < 80)
    improvementAreas.push("Provide better photo documentation");

  // Training recommendations
  const trainingRecommendations = getTrainingRecommendations(componentScores);

  // Next tier requirements
  const nextTierRequirements =
    tier !== "platinum" ? getNextTierRequirements(tier, overallScore) : undefined;

  return {
    overallScore,
    tier,
    componentScores,
    strengths,
    improvementAreas,
    trainingRecommendations,
    nextTierRequirements,
  };
}

function getTier(score: number): "platinum" | "gold" | "silver" | "bronze" {
  if (score >= 90) return "platinum";
  if (score >= 80) return "gold";
  if (score >= 70) return "silver";
  return "bronze";
}

function getTrainingRecommendations(scores: Record<string, number>): string[] {
  const recommendations: string[] = [];

  if (scores.onTimeRate < 85) {
    recommendations.push("Time Management: Learn to better estimate job duration and arrival times");
  }
  if (scores.customerSatisfaction < 85) {
    recommendations.push(
      "Customer Service: Complete the 'Exceeding Expectations' training module"
    );
  }
  if (scores.esgCompliance < 85) {
    recommendations.push(
      "ESG Best Practices: Review proper disposal methods and documentation requirements"
    );
  }
  if (scores.documentation < 85) {
    recommendations.push(
      "Photo Documentation: Watch the 'Perfect Job Photos' tutorial video"
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("Maintain excellent performance! Consider mentoring new pros.");
  }

  return recommendations;
}

function getNextTierRequirements(
  currentTier: string,
  currentScore: number
): string[] {
  const nextTier = currentTier === "bronze" ? "silver" : currentTier === "silver" ? "gold" : "platinum";
  const requiredScore = nextTier === "platinum" ? 90 : nextTier === "gold" ? 80 : 70;
  const pointsNeeded = requiredScore - currentScore;

  return [
    `Achieve ${requiredScore}+ overall score (${pointsNeeded} points needed)`,
    "Maintain 90%+ on-time rate for 30 days",
    "Complete at least 25 jobs in the tier qualification period",
    `Average customer rating: 4.5+ stars`,
  ];
}

export default {
  calculateQualityScore,
};
