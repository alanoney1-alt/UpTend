/**
 * Pro Matching Engine
 * 
 * Finds the top 3 pros for a job based on a weighted Value Score algorithm.
 * CRITICAL: Never expose pro's last name, phone, email, or business name.
 */

import { db } from "../db";
import { haulerProfiles, haulerReviews, serviceRequests } from "../../shared/schema";
import { eq, sql, and, inArray } from "drizzle-orm";
import { getEffectiveRate, PLATFORM_SERVICE_RATES } from "../routes/pro-pricing.routes";
import { calculateFees } from "./fee-calculator-v2";
import { users } from "../../shared/models/auth";

export interface MatchedPro {
  proId: string;
  firstName: string;
  rating: number;
  completedJobs: number;
  tenureMonths: number;
  price: number;
  valueScore: number;
  verified: boolean;
  insured: boolean;
  businessVerified: boolean;
  independentlyInsured: boolean;
}

export interface MatchResult {
  matches: MatchedPro[];
  matchId: string;
}

// In-memory match store (would be DB/Redis in production)
const matchStore: Map<string, {
  matches: MatchedPro[];
  serviceType: string;
  scope: any;
  location: string;
  createdAt: string;
}> = new Map();

export function getStoredMatch(matchId: string) {
  return matchStore.get(matchId) || null;
}

/**
 * Value Score Algorithm (weighted composite 0-100):
 * - Rating (30%): star rating from reviews
 * - Reliability (20%): job completion rate, on-time rate
 * - Price-to-value (20%): rate relative to quality score
 * - Proximity (15%): distance to job site (simulated)
 * - Experience (15%): total jobs completed + tenure on platform
 *
 * Adjustments applied after base score:
 * - New Pro Boost: +15 to +0 for pros with 0-10 completed jobs (linear decay)
 * - Busy Pro Cooldown: -10 for pros with 3+ jobs this week (only when 3+ pros available)
 */

/**
 * New Pro Boost: gives new pros visibility.
 * +15 points at 0 jobs, linearly decreasing to +0 at 10 jobs.
 */
function calculateNewProBoost(completedJobs: number): number {
  if (completedJobs >= 10) return 0;
  return Math.round((15 * (10 - completedJobs)) / 10 * 100) / 100;
}

/**
 * Query how many jobs a pro has been assigned this week.
 */
async function getWeeklyJobCount(proId: string): Promise<number> {
  try {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
    const weekStartStr = weekStart.toISOString();

    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(serviceRequests)
      .where(
        and(
          eq(serviceRequests.assignedHaulerId, proId),
          sql`${serviceRequests.createdAt} >= ${weekStartStr}`,
          sql`${serviceRequests.status} IN ('requested', 'accepted', 'in_progress', 'completed')`,
        )
      );
    return result[0]?.count || 0;
  } catch {
    return 0;
  }
}

function calculateValueScore(
  rating: number,
  completedJobs: number,
  tenureMonths: number,
  price: number,
  avgPrice: number,
  verified: boolean,
): number {
  // Rating score (0-100, 30% weight)
  const ratingScore = (rating / 5) * 100;

  // Reliability score (0-100, 20% weight) - proxy from rating + verified status
  const reliabilityScore = Math.min(100, (rating / 5) * 80 + (verified ? 20 : 0));

  // Price-to-value (0-100, 20% weight) - better value = higher score
  // A pro priced at or below average with high quality gets high score
  const priceRatio = avgPrice > 0 ? price / avgPrice : 1;
  const priceValueScore = Math.max(0, Math.min(100, (2 - priceRatio) * 50 + (ratingScore * 0.5)));

  // Proximity score (0-100, 15% weight) - simulated (would use geocoding)
  const proximityScore = 70 + Math.random() * 30; // 70-100 range simulated

  // Experience score (0-100, 15% weight)
  const jobsScore = Math.min(100, (completedJobs / 100) * 80);
  const tenureScore = Math.min(100, (tenureMonths / 24) * 80);
  const experienceScore = jobsScore * 0.6 + tenureScore * 0.4;

  // Weighted composite
  const valueScore = 
    ratingScore * 0.30 +
    reliabilityScore * 0.20 +
    priceValueScore * 0.20 +
    proximityScore * 0.15 +
    experienceScore * 0.15;

  return Math.round(valueScore * 100) / 100;
}

export async function matchProsForJob(
  serviceType: string,
  scope: any,
  location: string,
  customerPreferences?: any,
): Promise<MatchResult> {
  // Query available pros that support this service type
  const pros = await db
    .select({
      id: haulerProfiles.id,
      userId: haulerProfiles.userId,
      rating: haulerProfiles.rating,
      jobsCompleted: haulerProfiles.jobsCompleted,
      verified: haulerProfiles.verified,
      hasInsurance: haulerProfiles.hasInsurance,
      isAvailable: haulerProfiles.isAvailable,
      canAcceptJobs: haulerProfiles.canAcceptJobs,
      businessPartnerId: haulerProfiles.businessPartnerId,
      createdAt: sql`(SELECT created_at FROM users WHERE id = ${haulerProfiles.userId})`,
    })
    .from(haulerProfiles)
    .where(
      sql`${haulerProfiles.serviceTypes}::text[] @> ARRAY[${serviceType}]::text[]`
    )
    .limit(20);

  // Also get first names from users table
  const userIds = pros.map(p => p.userId);
  let userMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const userRows = await db
      .select({ id: users.id, firstName: users.firstName })
      .from(users)
      .where(inArray(users.id, userIds));
    for (const u of userRows) {
      userMap[u.id] = u.firstName || "Pro";
    }
  }

  // Get average rate for price-to-value calculation
  const platformRate = PLATFORM_SERVICE_RATES[serviceType];
  const avgPrice = platformRate ? platformRate.recommendedRate : 150;

  // Build scored list with async adjustments (new pro boost + busy cooldown)
  const now = Date.now();
  const totalProsForService = pros.length;

  // Pre-fetch weekly job counts for all pros in parallel
  const weeklyCountsMap: Record<string, number> = {};
  await Promise.all(
    pros.map(async (pro) => {
      weeklyCountsMap[pro.userId] = await getWeeklyJobCount(pro.userId);
    })
  );

  const scoredPros: MatchedPro[] = pros.map((pro) => {
    const price = getEffectiveRate(pro.userId, serviceType);
    const createdAt = pro.createdAt as string;
    const tenureMs = createdAt ? now - new Date(createdAt).getTime() : 0;
    const tenureMonths = Math.max(1, Math.round(tenureMs / (30 * 24 * 60 * 60 * 1000)));
    const rating = pro.rating || 4.5;
    const completedJobs = pro.jobsCompleted || 0;
    const verified = pro.verified || false;
    const insured = pro.hasInsurance || false;
    const businessVerified = !!(pro.businessPartnerId);

    let valueScore = calculateValueScore(
      rating,
      completedJobs,
      tenureMonths,
      price,
      avgPrice,
      verified,
    );

    // New Pro Boost: help new pros get discovered
    const newProBoost = calculateNewProBoost(completedJobs);
    valueScore += newProBoost;

    // Business Verified Boost: +5 for pros backed by insured companies
    if (businessVerified) {
      valueScore += 5;
    }

    // Independently Insured Boost: +3 for pros with their own verified GL policy
    if (insured && !businessVerified) {
      valueScore += 3;
    }

    // Busy Pro Cooldown: spread work across the pool
    // Only applies when there are 3+ qualified pros for this service
    const weeklyJobs = weeklyCountsMap[pro.userId] || 0;
    if (weeklyJobs >= 3 && totalProsForService >= 3) {
      valueScore -= 10;
    }

    // Clamp to reasonable range
    valueScore = Math.max(0, Math.min(100, valueScore));
    valueScore = Math.round(valueScore * 100) / 100;

    return {
      proId: pro.userId,
      firstName: userMap[pro.userId] || "Pro",
      rating: Math.round(rating * 10) / 10,
      completedJobs,
      tenureMonths,
      price,
      valueScore,
      verified,
      insured,
      businessVerified,
      independentlyInsured: insured && !businessVerified,
    };
  });

  // Sort by value score descending (NOT by price)
  scoredPros.sort((a, b) => b.valueScore - a.valueScore);

  // Take top 3
  const top3 = scoredPros.slice(0, 3);

  // If no real pros found, return platform defaults
  if (top3.length === 0) {
    const defaultPrice = avgPrice;
    top3.push({
      proId: "default-1",
      firstName: "Marcus",
      rating: 4.9,
      completedJobs: 47,
      tenureMonths: 14,
      price: defaultPrice,
      valueScore: 88.5,
      verified: true,
      insured: true,
      businessVerified: false,
      independentlyInsured: false,
    });
    top3.push({
      proId: "default-2",
      firstName: "David",
      rating: 4.7,
      completedJobs: 32,
      tenureMonths: 9,
      price: Math.round(defaultPrice * 0.95),
      valueScore: 82.3,
      verified: true,
      insured: true,
      businessVerified: false,
      independentlyInsured: false,
    });
    top3.push({
      proId: "default-3",
      firstName: "James",
      rating: 4.6,
      completedJobs: 18,
      tenureMonths: 5,
      price: Math.round(defaultPrice * 1.05),
      valueScore: 76.1,
      verified: false,
      insured: true,
      businessVerified: false,
      independentlyInsured: false,
    });
  }

  // Generate match ID and store
  const matchId = `sm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  matchStore.set(matchId, {
    matches: top3,
    serviceType,
    scope,
    location,
    createdAt: new Date().toISOString(),
  });

  // Auto-expire after 1 hour
  setTimeout(() => matchStore.delete(matchId), 60 * 60 * 1000);

  return { matches: top3, matchId };
}
