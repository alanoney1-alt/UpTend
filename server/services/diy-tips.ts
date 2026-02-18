/**
 * DIY Tips Service
 * Helps customers with simple tasks while driving pro bookings for complex ones.
 */

import { db } from "../db.js";
import { diyTips } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

// Simple scope heuristics: if scope suggests complexity, don't suggest DIY
const SIMPLE_SCOPE_KEYWORDS: Record<string, string[]> = {
  gutter_cleaning: ["1-story", "single story", "one story", "small", "basic"],
  pressure_washing: ["driveway", "walkway", "patio", "small deck"],
  landscaping: ["trim", "edge", "mulch small", "basic"],
  plumbing: ["slow drain", "running toilet", "shower head", "unclog"],
  hvac: ["filter", "thermostat"],
  painting: ["touch up", "small area", "patch"],
  electrical: ["light switch", "outlet cover"],
  cleaning: ["dishwasher", "disposal", "garbage disposal"],
  handyman: ["squeaky", "door", "minor"],
};

export async function getDIYTip(serviceType: string) {
  const tips = await db
    .select()
    .from(diyTips)
    .where(eq(diyTips.serviceType, serviceType))
    .limit(5);

  if (tips.length === 0) return null;
  // Return a random tip for variety
  return tips[Math.floor(Math.random() * tips.length)];
}

export async function getSeasonalDIYTips(month: number) {
  const tips = await db
    .select()
    .from(diyTips)
    .where(sql`${diyTips.seasonalRelevance}::jsonb @> ${JSON.stringify([month])}::jsonb`);

  return tips;
}

export function shouldSuggestDIY(serviceType: string, scope: string): boolean {
  const keywords = SIMPLE_SCOPE_KEYWORDS[serviceType];
  if (!keywords) return false;
  const lower = scope.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

export async function getDIYvsPro(serviceType: string) {
  const tip = await getDIYTip(serviceType);
  if (!tip) {
    return {
      serviceType,
      recommendation: "pro",
      message: "This service is best handled by a professional. Book with UpTend for guaranteed quality.",
    };
  }

  // Estimate pro cost as DIY savings + some base
  const proCost = (tip.estimatedSavings as number) + 49; // booking fee baseline
  const proTime = 30; // avg pro arrival + work

  return {
    serviceType,
    diy: {
      title: tip.title,
      difficulty: tip.difficulty,
      estimatedTime: `${tip.estimatedTime} minutes`,
      estimatedCost: "$0 – $20 (materials)",
      tools: tip.toolsNeeded,
      safetyWarnings: tip.safetyWarnings,
      risk: tip.difficulty === "easy" ? "Low" : tip.difficulty === "medium" ? "Medium" : "High",
    },
    pro: {
      estimatedCost: `$${proCost}`,
      estimatedTime: `${proTime} minutes (including arrival)`,
      guarantee: "100% satisfaction guarantee",
      insurance: "Fully insured and licensed",
      convenience: "No tools needed, no cleanup",
    },
    whenToCallPro: tip.whenToCallPro,
    savings: `$${tip.estimatedSavings} if you DIY`,
    recommendation: tip.difficulty === "easy" ? "diy" : "consider_pro",
  };
}
