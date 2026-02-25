/**
 * Insurance Tiered Requirement Service
 *
 * Tier 1 ($0-$1,000 earnings): Platform coverage, no insurance required
 * Tier 2 ($1,000-$5,000): Per-job coverage recommended
 * Tier 3 ($5,000+): Monthly GL policy required
 */

import { db } from "../db";
import { serviceRequests, haulerProfiles } from "../../shared/schema";
import { eq, and, sql } from "drizzle-orm";

// -- Types --

export interface InsuranceTier {
  tier: 1 | 2 | 3;
  required: false | "recommended" | true;
  covered: "platform" | "per-job" | "self";
  message: string;
  earningsTotal: number;
}

export interface InsuranceStatus {
  hasInsurance: boolean;
  provider: string;
  policyNumber: string;
  expirationDate: string;
  coverageAmount: number;
  tier: "platform" | "per-job" | "monthly";
  verified: boolean;
}

export interface InsuranceAlert {
  type: "expiring" | "tier_transition" | "required" | "congratulations";
  message: string;
  urgency: "low" | "medium" | "high";
}

// -- In-memory insurance store (would be DB table in production) --

interface StoredInsurance {
  proId: string;
  provider: string;
  policyNumber: string;
  expirationDate: string;
  coverageAmount: number;
  verified: boolean;
  updatedAt: string;
}

const insuranceStore: Map<string, StoredInsurance> = new Map();

// -- Earnings cache --

const earningsCache: Map<string, { total: number; calculatedAt: number }> = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// -- Core Functions --

async function getProEarnings(proId: string): Promise<number> {
  const cached = earningsCache.get(proId);
  if (cached && Date.now() - cached.calculatedAt < CACHE_TTL_MS) {
    return cached.total;
  }

  try {
    const result = await db.execute(sql`
      SELECT COALESCE(SUM(final_price), 0) as total
      FROM service_requests
      WHERE assigned_hauler_id = ${proId}
        AND status IN ('completed', 'paid')
    `);
    const total = Number((result.rows[0] as any)?.total || 0);
    earningsCache.set(proId, { total, calculatedAt: Date.now() });
    return total;
  } catch {
    return 0;
  }
}

export function invalidateEarningsCache(proId: string): void {
  earningsCache.delete(proId);
}

export async function getInsuranceRequirement(proId: string): Promise<InsuranceTier> {
  const earnings = await getProEarnings(proId);

  if (earnings >= 5000) {
    return {
      tier: 3,
      required: true,
      covered: "self",
      message: "Monthly GL policy required to continue accepting jobs",
      earningsTotal: earnings,
    };
  }
  if (earnings >= 1000) {
    return {
      tier: 2,
      required: "recommended",
      covered: "per-job",
      message: "Per-job coverage recommended -- $5-12 per job",
      earningsTotal: earnings,
    };
  }
  return {
    tier: 1,
    required: false,
    covered: "platform",
    message: "Covered by UpTend platform policy",
    earningsTotal: earnings,
  };
}

export async function checkInsuranceStatus(proId: string): Promise<InsuranceStatus> {
  const stored = insuranceStore.get(proId);
  const requirement = await getInsuranceRequirement(proId);

  if (!stored) {
    return {
      hasInsurance: false,
      provider: "",
      policyNumber: "",
      expirationDate: "",
      coverageAmount: 0,
      tier: requirement.tier === 1 ? "platform" : requirement.tier === 2 ? "per-job" : "monthly",
      verified: false,
    };
  }

  return {
    hasInsurance: true,
    provider: stored.provider,
    policyNumber: stored.policyNumber,
    expirationDate: stored.expirationDate,
    coverageAmount: stored.coverageAmount,
    tier: requirement.tier === 1 ? "platform" : requirement.tier === 2 ? "per-job" : "monthly",
    verified: stored.verified,
  };
}

export async function updateInsurance(
  proId: string,
  data: {
    provider: string;
    policyNumber: string;
    expirationDate: string;
    coverageAmount: number;
  }
): Promise<StoredInsurance> {
  const record: StoredInsurance = {
    proId,
    provider: data.provider,
    policyNumber: data.policyNumber,
    expirationDate: data.expirationDate,
    coverageAmount: data.coverageAmount,
    verified: false,
    updatedAt: new Date().toISOString(),
  };
  insuranceStore.set(proId, record);

  // Update hauler profile
  try {
    await db
      .update(haulerProfiles)
      .set({ hasInsurance: true } as any)
      .where(eq(haulerProfiles.userId, proId));
  } catch {
    // Non-fatal
  }

  return record;
}

export async function verifyInsurance(proId: string): Promise<boolean> {
  const stored = insuranceStore.get(proId);
  if (!stored) return false;
  stored.verified = true;
  stored.updatedAt = new Date().toISOString();
  insuranceStore.set(proId, stored);
  return true;
}

export async function getInsuranceAlerts(proId: string): Promise<InsuranceAlert[]> {
  const alerts: InsuranceAlert[] = [];
  const requirement = await getInsuranceRequirement(proId);
  const status = await checkInsuranceStatus(proId);
  const earnings = requirement.earningsTotal;

  // Tier transition warnings
  if (earnings >= 800 && earnings < 1000) {
    alerts.push({
      type: "tier_transition",
      message: `You've earned $${Math.round(earnings).toLocaleString()} -- insurance will be recommended at $1,000`,
      urgency: "low",
    });
  }

  if (earnings >= 4000 && earnings < 5000) {
    alerts.push({
      type: "tier_transition",
      message: `You've earned $${Math.round(earnings).toLocaleString()} -- monthly coverage will be required at $5,000`,
      urgency: "medium",
    });
  }

  // Expiration warnings
  if (status.hasInsurance && status.expirationDate) {
    const expDate = new Date(status.expirationDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 0) {
      alerts.push({
        type: "expiring",
        message: "Your insurance has expired. Please update your coverage.",
        urgency: "high",
      });
    } else if (daysUntilExpiry <= 14) {
      alerts.push({
        type: "expiring",
        message: `Your insurance expires in ${daysUntilExpiry} days. Renew now to avoid interruption.`,
        urgency: "medium",
      });
    } else if (daysUntilExpiry <= 30) {
      alerts.push({
        type: "expiring",
        message: `Your insurance expires in ${daysUntilExpiry} days.`,
        urgency: "low",
      });
    }
  }

  // Required but missing
  if (requirement.tier === 3 && !status.hasInsurance) {
    alerts.push({
      type: "required",
      message: "Insurance is required to continue accepting jobs. Get covered in 60 seconds.",
      urgency: "high",
    });
  }

  return alerts;
}

export async function shouldBlockJobAcceptance(proId: string): Promise<boolean> {
  const requirement = await getInsuranceRequirement(proId);
  if (requirement.tier !== 3) return false;

  const status = await checkInsuranceStatus(proId);
  if (!status.hasInsurance) return true;

  // Check if expired
  if (status.expirationDate) {
    const expDate = new Date(status.expirationDate);
    if (expDate < new Date()) return true;
  }

  return false;
}

/**
 * Check if a pro has their own verified insurance (for matching engine bonus).
 */
export async function hasVerifiedInsurance(proId: string): Promise<boolean> {
  const stored = insuranceStore.get(proId);
  if (!stored || !stored.verified) return false;
  if (stored.expirationDate) {
    const expDate = new Date(stored.expirationDate);
    if (expDate < new Date()) return false;
  }
  return true;
}
