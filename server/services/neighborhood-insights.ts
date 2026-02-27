/**
 * Neighborhood Insights Service
 * Aggregates local data for pricing context, demand patterns, and personalized recommendations.
 */

import { db } from "../db.js";
import { neighborhoodInsights } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

export async function generateInsights(zip: string) {
  // Check for existing recent insights (within 7 days)
  const recent = await db
    .select()
    .from(neighborhoodInsights)
    .where(
      and(
        eq(neighborhoodInsights.zip, zip),
        sql`${neighborhoodInsights.generatedAt} > NOW() - INTERVAL '7 days'`
      )
    );

  if (recent.length > 0) {
    return formatInsights(recent);
  }

  // Generate fresh insights from job/booking data
  // In production, these would aggregate from real booking tables
  const insightData = [
    {
      zip,
      insightType: "avg_price" as const,
      serviceType: "junk_removal",
      value: { average: 189, median: 159, range: { min: 79, max: 499 } },
      period: new Date().toISOString().slice(0, 7),
    },
    {
      zip,
      insightType: "avg_price" as const,
      serviceType: "pressure_washing",
      value: { average: 199, median: 179, range: { min: 99, max: 349 } },
      period: new Date().toISOString().slice(0, 7),
    },
    {
      zip,
      insightType: "popular_service" as const,
      serviceType: null,
      value: { ranked: ["pressure_washing", "landscaping", "junk_removal", "gutter_cleaning", "hvac"] },
      period: new Date().toISOString().slice(0, 7),
    },
    {
      zip,
      insightType: "pro_density" as const,
      serviceType: null,
      value: { activePros: 12, avgResponseTime: "45 minutes", coverageScore: 85 },
      period: new Date().toISOString().slice(0, 7),
    },
    {
      zip,
      insightType: "satisfaction" as const,
      serviceType: null,
      value: { avgRating: 4.7, totalReviews: 234, repeatRate: 0.68 },
      period: new Date().toISOString().slice(0, 7),
    },
  ];

  const inserted = await db
    .insert(neighborhoodInsights)
    .values(insightData.map((d) => ({
      zip: d.zip,
      insightType: d.insightType,
      serviceType: d.serviceType,
      value: d.value,
      period: d.period,
    })))
    .returning();

  return formatInsights(inserted);
}

function formatInsights(rows: any[]) {
  const result: Record<string, any> = { zip: rows[0]?.zip };

  for (const row of rows) {
    if (row.insightType === "avg_price") {
      if (!result.avgPrices) result.avgPrices = {};
      result.avgPrices[row.serviceType] = row.value;
    } else if (row.insightType === "popular_service") {
      result.popularServices = (row.value as any).ranked;
    } else if (row.insightType === "pro_density") {
      result.proDensity = row.value;
    } else if (row.insightType === "booking_trend") {
      if (!result.bookingTrends) result.bookingTrends = {};
      result.bookingTrends[row.serviceType || "overall"] = row.value;
    } else if (row.insightType === "satisfaction") {
      result.satisfaction = row.value;
    } else if (row.insightType === "seasonal_demand") {
      if (!result.seasonalDemand) result.seasonalDemand = {};
      result.seasonalDemand[row.serviceType || "overall"] = row.value;
    }
  }

  return result;
}

export async function getInsightsForCustomer(customerId: string) {
  // In production: look up customer's zip from their profile
  // For now, return a formatted message structure
  // This would join with customer table to get their zip
  return {
    customerId,
    message: "To get personalized neighborhood insights, we need the customer's zip code from their profile.",
    tip: "Use generateInsights(zip) with the customer's zip code for full data.",
  };
}

export async function getSeasonalDemand(zip: string, month: number) {
  const monthNames = ["", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  // Seasonal patterns for Central Florida (UpTend's market)
  const seasonalPatterns: Record<number, { highDemand: string[]; reason: string }> = {
    1: { highDemand: ["hvac", "plumbing", "handyman"], reason: "Post-holiday repairs, cold snaps, pipe insulation" },
    2: { highDemand: ["pressure_washing", "landscaping", "painting"], reason: "Pre-spring prep, Valentine's curb appeal" },
    3: { highDemand: ["pressure_washing", "landscaping", "gutter_cleaning"], reason: "Spring cleaning season begins" },
    4: { highDemand: ["landscaping", "pest_control", "pressure_washing"], reason: "Peak spring - pollen, bugs, yard growth" },
    5: { highDemand: ["hvac", "pest_control", "landscaping"], reason: "AC season starts, summer prep" },
    6: { highDemand: ["hvac", "pressure_washing", "pest_control"], reason: "Heat wave, hurricane prep season" },
    7: { highDemand: ["hvac", "plumbing", "junk_removal"], reason: "Peak AC demand, summer cleanouts" },
    8: { highDemand: ["hvac", "landscaping", "pest_control"], reason: "Back-to-school prep, continued heat" },
    9: { highDemand: ["pressure_washing", "gutter_cleaning", "roofing"], reason: "Hurricane season peak, fall prep" },
    10: { highDemand: ["gutter_cleaning", "landscaping", "painting"], reason: "Fall cleanup, ideal painting weather" },
    11: { highDemand: ["gutter_cleaning", "hvac", "handyman"], reason: "Pre-holiday prep, heating checks" },
    12: { highDemand: ["hvac", "electrical", "handyman"], reason: "Holiday lighting, heating, winter fixes" },
  };

  const pattern = seasonalPatterns[month] || seasonalPatterns[1]!;

  // Check for existing seasonal demand insight
  const existing = await db
    .select()
    .from(neighborhoodInsights)
    .where(
      and(
        eq(neighborhoodInsights.zip, zip),
        eq(neighborhoodInsights.insightType, "seasonal_demand"),
        sql`${neighborhoodInsights.period} = ${`${new Date().getFullYear()}-${String(month).padStart(2, "0")}`}`
      )
    );

  if (existing.length === 0) {
    await db.insert(neighborhoodInsights).values({
      zip,
      insightType: "seasonal_demand",
      value: pattern,
      period: `${new Date().getFullYear()}-${String(month).padStart(2, "0")}`,
    });
  }

  return {
    zip,
    month: monthNames[month],
    ...pattern,
    tip: `${pattern.highDemand[0]} is the #1 booked service this month in your area. ${pattern.reason}.`,
  };
}
