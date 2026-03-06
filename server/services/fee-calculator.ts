/**
 * Fee Calculator Service
 * 
 * TWO fee models:
 * 
 * 1. UNLICENSED SERVICES (junk removal, cleaning, pressure washing, handyman, etc.)
 *    - Flat 15% from pro + 5% from customer = 20% total
 *    - No negotiation, same for everyone
 * 
 * 2. LICENSED TRADES (HVAC, plumbing, electrical, roofing, etc.)
 *    - Custom % of total job, negotiated per partner (stored in hauler_profiles.custom_fee_rate)
 *    - + 5% from customer
 *    - Example: 10% partner rate on $500 job = $50 to UpTend + $25 from customer = $75 total
 * 
 * All fees are % of TOTAL JOB PRICE, not out of profit.
 */

import { db } from "../db";
import { eq, and, sql } from "drizzle-orm";
import { haulerProfiles, proCertifications, serviceRequests } from "@shared/schema";
import { getActiveDiscount } from "./invite-code.service.js";

// ── Service Classification ──

// Licensed trades = custom negotiated % per partner
// Unlicensed services = flat 15% always
export const LICENSED_TRADES = new Set([
  'hvac',
  'plumbing',
  'electrical',
  'roofing',
  'general_contracting',
]);

export const UNLICENSED_SERVICES = new Set([
  'junk_removal',
  'home_cleaning',
  'pressure_washing',
  'gutter_cleaning',
  'pool_cleaning',
  'handyman',
  'moving_labor',
  'carpet_cleaning',
  'light_demolition',
  'landscaping',
  'painting',
  'garage_cleanout',
]);

export function isLicensedTrade(serviceType: string): boolean {
  return LICENSED_TRADES.has(serviceType);
}

export function getCustomerFeeRate(serviceType: string): number {
  return isLicensedTrade(serviceType) ? CUSTOMER_FEE_LICENSED : CUSTOMER_FEE_UNLICENSED;
}

// Flat rate for all unlicensed work — no negotiation
export const UNLICENSED_FEE_RATE = 0.15; // 15% from pro
// Customer fee depends on service type:
// - Unlicensed: 5% customer fee (covers guarantee, insurance, platform)
// - Licensed trades: 0% customer fee (partner's negotiated rate covers it)
export const CUSTOMER_FEE_UNLICENSED = 0.05; // 5%
export const CUSTOMER_FEE_LICENSED = 0.00;   // 0% — zero cost to customer for licensed work

// ── Tier Definitions (legacy, kept for unlicensed services) ──

export interface FeeTier {
  name: string;
  minCerts: number;
  nonLlcRate: number;
  llcRate: number;
}

export const FEE_TIERS: FeeTier[] = [
  { name: "Standard",        minCerts: 0, nonLlcRate: 0.15, llcRate: 0.15 },
];

export const TOTAL_CERTIFICATIONS = 6;

// ── Pure Functions (no DB) ──

export function getFeeRate(isLlc: boolean, activeCertCount: number): number {
  // Walk tiers in reverse to find the highest qualifying tier
  for (let i = FEE_TIERS.length - 1; i >= 0; i--) {
    if (activeCertCount >= FEE_TIERS[i].minCerts) {
      return isLlc ? FEE_TIERS[i].llcRate : FEE_TIERS[i].nonLlcRate;
    }
  }
  return 0.15;
}

export function getFeePercent(isLlc: boolean, activeCertCount: number): number {
  return Math.round(getFeeRate(isLlc, activeCertCount) * 100);
}

export function getCurrentTier(activeCertCount: number): FeeTier {
  for (let i = FEE_TIERS.length - 1; i >= 0; i--) {
    if (activeCertCount >= FEE_TIERS[i].minCerts) {
      return FEE_TIERS[i];
    }
  }
  return FEE_TIERS[0];
}

export function getNextTier(activeCertCount: number): FeeTier | null {
  const current = getCurrentTier(activeCertCount);
  const idx = FEE_TIERS.indexOf(current);
  return idx < FEE_TIERS.length - 1 ? FEE_TIERS[idx + 1] : null;
}

export function getAllTiers(): FeeTier[] {
  return [...FEE_TIERS];
}

// ── Fee Status Result ──

export interface FeeStatus {
  feeRate: number;
  feePercent: number;
  tier: string;
  activeCertCount: number;
  isLlc: boolean;
  nextTierCertsNeeded: number;
  nextTierRate: number | null;
  nextTierPercent: number | null;
  monthlySavings: number;
  projectedNextTierSavings: number;
  recentEarnings: number;
  tiers: Array<{
    name: string;
    minCerts: number;
    rate: number;
    percent: number;
    isCurrent: boolean;
    isUnlocked: boolean;
  }>;
  // Invite code discount (if active)
  inviteDiscount?: {
    discountPercent: number;
    daysRemaining: number;
    codeName?: string;
  };
}

// ── DB-backed calculation ──

export async function calculatePlatformFee(proId: string): Promise<FeeStatus> {
  // Get pro profile (proId here is the userId on hauler_profiles)
  const [profile] = await db
    .select({
      id: haulerProfiles.id,
      isVerifiedLlc: haulerProfiles.isVerifiedLlc,
      customFeeRate: haulerProfiles.customFeeRate,
    })
    .from(haulerProfiles)
    .where(eq(haulerProfiles.userId, proId))
    .limit(1);

  const isLlc = profile?.isVerifiedLlc || false;
  const haulerProfileId = profile?.id ?? null;

  // Count active (completed, not expired) certifications
  const now = new Date().toISOString();
  const activeCertsResult = await db.execute(sql`
    SELECT COUNT(*) as count FROM pro_certifications
    WHERE pro_id = ${proId}
      AND status = 'completed'
      AND (expires_at IS NULL OR expires_at > ${now})
  `);
  const activeCertCount = Number((activeCertsResult.rows[0] as any)?.count || 0);

  // Fee model depends on service type:
  // - Licensed trades: use partner's custom negotiated rate (custom_fee_rate)
  // - Unlicensed services: always flat 15%, no exceptions
  // The customFeeRate field is ONLY used for licensed trade partners
  const baseFeeRate = profile?.customFeeRate != null
    ? profile.customFeeRate
    : UNLICENSED_FEE_RATE; // Default 15% for everyone without a custom rate

  // Apply invite code discount if active (lookup by hauler profile id)
  const inviteDiscount = haulerProfileId
    ? await getActiveDiscount(haulerProfileId)
    : { hasDiscount: false, discountPercent: 0, discountExpiresAt: null, daysRemaining: 0 };
  const feeRate = inviteDiscount.hasDiscount
    ? Math.max(0, baseFeeRate - inviteDiscount.discountPercent / 100)
    : baseFeeRate;

  const feePercent = Math.round(feeRate * 100);
  const currentTier = getCurrentTier(activeCertCount);
  const nextTier = getNextTier(activeCertCount);

  const nextTierCertsNeeded = nextTier ? nextTier.minCerts - activeCertCount : 0;
  const nextTierRate = nextTier ? (isLlc ? nextTier.llcRate : nextTier.nonLlcRate) : null;
  const nextTierPercent = nextTierRate !== null ? Math.round(nextTierRate * 100) : null;

  // Recent earnings (last 30 days) for savings calculation
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const earningsResult = await db.execute(sql`
    SELECT COALESCE(SUM(total_price), 0) as total
    FROM service_requests
    WHERE assigned_hauler_id = ${proId}
      AND status IN ('completed', 'paid')
      AND created_at > ${thirtyDaysAgo.toISOString()}
  `);
  const recentEarnings = Number((earningsResult.rows[0] as any)?.total || 0);

  // Flat 15% platform fee
  const baselineRate = 0.15;
  const monthlySavings = Math.round(recentEarnings * (baselineRate - feeRate) * 100) / 100;

  // Projected savings at next tier
  const projectedNextTierSavings = nextTierRate !== null
    ? Math.round(recentEarnings * (feeRate - nextTierRate) * 100) / 100
    : 0;

  // Build tier ladder for display
  const tiers = FEE_TIERS.map(t => ({
    name: t.name,
    minCerts: t.minCerts,
    rate: isLlc ? t.llcRate : t.nonLlcRate,
    percent: Math.round((isLlc ? t.llcRate : t.nonLlcRate) * 100),
    isCurrent: t.name === currentTier.name,
    isUnlocked: activeCertCount >= t.minCerts,
  }));

  return {
    feeRate,
    feePercent,
    tier: currentTier.name,
    activeCertCount,
    isLlc,
    nextTierCertsNeeded,
    nextTierRate,
    nextTierPercent,
    monthlySavings,
    projectedNextTierSavings,
    recentEarnings,
    tiers,
    ...(inviteDiscount.hasDiscount && {
      inviteDiscount: {
        discountPercent: inviteDiscount.discountPercent,
        daysRemaining: inviteDiscount.daysRemaining,
        codeName: inviteDiscount.codeName,
      },
    }),
  };
}

/**
 * Check if completing a certification just crossed a fee tier threshold.
 * Returns the old and new rates if a tier change happened, null otherwise.
 */
export async function checkFeeReduction(
  proId: string,
  newActiveCertCount: number
): Promise<{
  tierChanged: boolean;
  oldRate: number;
  newRate: number;
  oldTier: string;
  newTier: string;
  monthlySavings: number;
} | null> {
  const [profile] = await db
    .select({ isVerifiedLlc: haulerProfiles.isVerifiedLlc })
    .from(haulerProfiles)
    .where(eq(haulerProfiles.userId, proId))
    .limit(1);

  const isLlc = profile?.isVerifiedLlc || false;
  const oldRate = getFeeRate(isLlc, newActiveCertCount - 1);
  const newRate = getFeeRate(isLlc, newActiveCertCount);

  if (oldRate === newRate) return null;

  const oldTier = getCurrentTier(newActiveCertCount - 1);
  const newTier = getCurrentTier(newActiveCertCount);

  // Estimate monthly savings
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const earningsResult = await db.execute(sql`
    SELECT COALESCE(SUM(total_price), 0) as total
    FROM service_requests
    WHERE assigned_hauler_id = ${proId}
      AND status IN ('completed', 'paid')
      AND created_at > ${thirtyDaysAgo.toISOString()}
  `);
  const recentEarnings = Number((earningsResult.rows[0] as any)?.total || 0);
  const monthlySavings = Math.round(recentEarnings * (oldRate - newRate) * 100) / 100;

  return {
    tierChanged: true,
    oldRate,
    newRate,
    oldTier: oldTier.name,
    newTier: newTier.name,
    monthlySavings,
  };
}
