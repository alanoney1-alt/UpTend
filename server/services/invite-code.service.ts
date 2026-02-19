/**
 * Invite Code Service
 *
 * Handles validation, redemption, and discount lookup for pro invite codes.
 * Founding pros receive a temporary fee discount (default 10 pp off) for 30 days.
 */

import { db } from "../db.js";
import { eq, and, gt, sql } from "drizzle-orm";
import { proInviteCodes, proCodeRedemptions } from "@shared/schema";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ValidateResult {
  valid: boolean;
  discountPercent?: number;
  durationDays?: number;
  reason?: string;
}

export interface ActiveDiscount {
  hasDiscount: boolean;
  discountPercent: number;
  discountExpiresAt: Date | null;
  daysRemaining: number;
  codeName?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase();
}

// ── Core Functions ────────────────────────────────────────────────────────────

/**
 * Validate a code without redeeming it.
 * Returns discount info if valid, or an error reason if not.
 */
export async function validateInviteCode(rawCode: string): Promise<ValidateResult> {
  const code = normalizeCode(rawCode);
  if (!code) return { valid: false, reason: "Code is required" };

  const [row] = await db
    .select()
    .from(proInviteCodes)
    .where(eq(proInviteCodes.code, code))
    .limit(1);

  if (!row) return { valid: false, reason: "Invalid invite code" };
  if (!row.isActive) return { valid: false, reason: "This code is no longer active" };
  if (row.expiresAt && row.expiresAt < new Date()) {
    return { valid: false, reason: "This code has expired" };
  }
  if (row.maxUses !== null && row.currentUses >= row.maxUses) {
    return { valid: false, reason: "This code has reached its maximum number of uses" };
  }

  return {
    valid: true,
    discountPercent: row.discountPercent,
    durationDays: row.durationDays,
  };
}

/**
 * Redeem a code for a pro. Idempotent — silently succeeds if already redeemed.
 * Returns the discount info that was applied.
 */
export async function redeemInviteCode(
  rawCode: string,
  proId: string
): Promise<{ success: boolean; discountPercent: number; discountExpiresAt: Date; alreadyRedeemed?: boolean }> {
  const code = normalizeCode(rawCode);

  // Check existing redemption
  const [existing] = await db
    .select()
    .from(proCodeRedemptions)
    .where(eq(proCodeRedemptions.proId, proId))
    .limit(1);

  if (existing) {
    return {
      success: true,
      discountPercent: existing.discountPercent,
      discountExpiresAt: existing.discountExpiresAt,
      alreadyRedeemed: true,
    };
  }

  // Validate again under DB read
  const [row] = await db
    .select()
    .from(proInviteCodes)
    .where(eq(proInviteCodes.code, code))
    .limit(1);

  if (!row || !row.isActive) throw new Error("Invalid or inactive invite code");
  if (row.expiresAt && row.expiresAt < new Date()) throw new Error("Invite code has expired");
  if (row.maxUses !== null && row.currentUses >= row.maxUses) {
    throw new Error("Invite code has reached its usage limit");
  }

  const discountExpiresAt = new Date();
  discountExpiresAt.setDate(discountExpiresAt.getDate() + row.durationDays);

  // Insert redemption and increment usage atomically
  await db.transaction(async (tx) => {
    await tx.insert(proCodeRedemptions).values({
      proId,
      codeId: row.id,
      discountPercent: row.discountPercent,
      discountExpiresAt,
    });

    await tx
      .update(proInviteCodes)
      .set({ currentUses: sql`${proInviteCodes.currentUses} + 1` })
      .where(eq(proInviteCodes.id, row.id));
  });

  return {
    success: true,
    discountPercent: row.discountPercent,
    discountExpiresAt,
  };
}

/**
 * Get the active discount for a pro (if any).
 * Returns discountPercent = 0 when there is no active discount.
 */
export async function getActiveDiscount(proId: string): Promise<ActiveDiscount> {
  const now = new Date();

  const [redemption] = await db
    .select({
      discountPercent: proCodeRedemptions.discountPercent,
      discountExpiresAt: proCodeRedemptions.discountExpiresAt,
      code: proInviteCodes.code,
    })
    .from(proCodeRedemptions)
    .innerJoin(proInviteCodes, eq(proCodeRedemptions.codeId, proInviteCodes.id))
    .where(
      and(
        eq(proCodeRedemptions.proId, proId),
        gt(proCodeRedemptions.discountExpiresAt, now)
      )
    )
    .limit(1);

  if (!redemption) {
    return { hasDiscount: false, discountPercent: 0, discountExpiresAt: null, daysRemaining: 0 };
  }

  const msRemaining = redemption.discountExpiresAt.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

  return {
    hasDiscount: true,
    discountPercent: redemption.discountPercent,
    discountExpiresAt: redemption.discountExpiresAt,
    daysRemaining,
    codeName: redemption.code,
  };
}

/**
 * Apply invite-code discount on top of the base fee rate.
 * Returns the adjusted (lowered) fee rate, clamped to minimum 0.
 */
export async function applyInviteDiscount(proId: string, baseFeeRate: number): Promise<number> {
  const discount = await getActiveDiscount(proId);
  if (!discount.hasDiscount) return baseFeeRate;
  const adjusted = baseFeeRate - discount.discountPercent / 100;
  return Math.max(0, adjusted);
}
