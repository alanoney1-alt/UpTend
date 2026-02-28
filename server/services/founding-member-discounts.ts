/**
 * Founding Member Discount Service
 * 
 * Handles:
 * - $25 credit on first booking
 * - 10% off first 10 jobs
 * - Stacking: job 1 gets $25 off THEN 10% off remainder
 * - Jobs 2-10: 10% off
 * - Job 11+: full price
 * 
 * All amounts in CENTS internally, converted to dollars at API boundary.
 */

import { db } from "../db";
import { sql } from "drizzle-orm";

const FOUNDING_CREDIT_CENTS = 2500; // $25
const FOUNDING_DISCOUNT_PERCENT = 10; // 10%
const FOUNDING_DISCOUNT_MAX_JOBS = 10;

export interface FoundingDiscount {
  isFoundingMember: boolean;
  creditApplied: number;      // cents
  discountPercent: number;     // 0 or 10
  discountAmount: number;      // cents
  totalSavings: number;        // cents
  jobNumber: number;           // which founding job this is (1-10, or 0 if not eligible)
  originalAmount: number;      // cents (what they'd pay without discounts)
  finalAmount: number;         // cents (what they actually pay)
}

/**
 * Calculate founding member discount for a given customer and job amount.
 * Does NOT mutate state -- call applyFoundingDiscount after payment succeeds.
 */
export async function calculateFoundingDiscount(
  customerId: string,
  amountCents: number
): Promise<FoundingDiscount> {
  const noDiscount: FoundingDiscount = {
    isFoundingMember: false,
    creditApplied: 0,
    discountPercent: 0,
    discountAmount: 0,
    totalSavings: 0,
    jobNumber: 0,
    originalAmount: amountCents,
    finalAmount: amountCents,
  };

  try {
    // Check if user is a founding member
    const result = await db.execute(sql`
      SELECT is_founding_member, founding_credit_remaining, founding_discount_jobs_used
      FROM users WHERE id = ${customerId}
    `);

    const user = result.rows[0] as any;
    if (!user?.is_founding_member) return noDiscount;

    const creditRemaining = Number(user.founding_credit_remaining || 0);
    const jobsUsed = Number(user.founding_discount_jobs_used || 0);

    // Past 10 jobs -- no more founding perks
    if (jobsUsed >= FOUNDING_DISCOUNT_MAX_JOBS && creditRemaining <= 0) {
      return noDiscount;
    }

    const jobNumber = jobsUsed + 1;
    let runningAmount = amountCents;
    let creditApplied = 0;
    let discountPercent = 0;
    let discountAmount = 0;

    // Step 1: Apply $25 credit if available
    if (creditRemaining > 0) {
      creditApplied = Math.min(creditRemaining, runningAmount);
      runningAmount -= creditApplied;
    }

    // Step 2: Apply 10% off remainder if within first 10 jobs
    if (jobsUsed < FOUNDING_DISCOUNT_MAX_JOBS && runningAmount > 0) {
      discountPercent = FOUNDING_DISCOUNT_PERCENT;
      discountAmount = Math.round(runningAmount * discountPercent / 100);
      runningAmount -= discountAmount;
    }

    const totalSavings = creditApplied + discountAmount;

    return {
      isFoundingMember: true,
      creditApplied,
      discountPercent,
      discountAmount,
      totalSavings,
      jobNumber,
      originalAmount: amountCents,
      finalAmount: amountCents - totalSavings,
    };
  } catch (err) {
    console.error("[FoundingDiscount] Error calculating discount:", err);
    return noDiscount;
  }
}

/**
 * Apply founding member discount after successful payment.
 * Decrements credit, increments job counter, logs to ledger.
 */
export async function applyFoundingDiscount(
  customerId: string,
  jobId: string,
  discount: FoundingDiscount
): Promise<void> {
  if (!discount.isFoundingMember || discount.totalSavings === 0) return;

  try {
    // Update user record: decrement credit, increment jobs used
    await db.execute(sql`
      UPDATE users SET
        founding_credit_remaining = GREATEST(0, founding_credit_remaining - ${discount.creditApplied}),
        founding_discount_jobs_used = founding_discount_jobs_used + 1
      WHERE id = ${customerId}
    `);

    // Log to audit ledger
    await db.execute(sql`
      INSERT INTO founding_discount_ledger 
        (user_id, job_id, credit_applied, discount_percent, discount_amount, total_savings, founding_jobs_count)
      VALUES 
        (${customerId}, ${jobId}, ${discount.creditApplied}, ${discount.discountPercent}, 
         ${discount.discountAmount}, ${discount.totalSavings}, ${discount.jobNumber})
    `);

    console.log(`[FoundingDiscount] Applied to job ${jobId}: $${(discount.totalSavings / 100).toFixed(2)} savings (credit: $${(discount.creditApplied / 100).toFixed(2)}, ${discount.discountPercent}% off: $${(discount.discountAmount / 100).toFixed(2)}). Job #${discount.jobNumber}/10.`);
  } catch (err) {
    console.error("[FoundingDiscount] Error applying discount:", err);
    // Don't throw -- payment already went through, log the error for manual reconciliation
  }
}

/**
 * Link a founding member signup to a user account.
 * Called during registration when email matches a founding_members entry.
 * Sets up their $25 credit and founding member flag.
 */
export async function linkFoundingMember(userId: string, email: string): Promise<boolean> {
  try {
    // Check if this email signed up as a founding member
    const result = await db.execute(sql`
      SELECT id, member_type FROM founding_members 
      WHERE email = ${email} AND linked_user_id IS NULL
      LIMIT 1
    `);

    if (result.rows.length === 0) return false;

    const founding = result.rows[0] as any;

    // Mark user as founding member with $25 credit
    await db.execute(sql`
      UPDATE users SET
        is_founding_member = true,
        founding_member_type = ${founding.member_type},
        founding_credit_remaining = ${FOUNDING_CREDIT_CENTS},
        founding_discount_jobs_used = 0,
        founding_joined_at = NOW()
      WHERE id = ${userId}
    `);

    // Link the founding member record
    await db.execute(sql`
      UPDATE founding_members SET linked_user_id = ${userId} WHERE id = ${founding.id}
    `);

    console.log(`[FoundingDiscount] Linked founding member ${email} (${founding.member_type}) to user ${userId}. $25 credit activated.`);
    return true;
  } catch (err) {
    console.error("[FoundingDiscount] Error linking founding member:", err);
    return false;
  }
}

/**
 * Get founding member status for display (profile, checkout, etc.)
 */
export async function getFoundingStatus(customerId: string) {
  try {
    const result = await db.execute(sql`
      SELECT is_founding_member, founding_member_type, founding_credit_remaining, 
             founding_discount_jobs_used, founding_joined_at
      FROM users WHERE id = ${customerId}
    `);

    const user = result.rows[0] as any;
    if (!user?.is_founding_member) {
      return { isFoundingMember: false };
    }

    const creditRemaining = Number(user.founding_credit_remaining || 0);
    const jobsUsed = Number(user.founding_discount_jobs_used || 0);
    const jobsRemaining = Math.max(0, FOUNDING_DISCOUNT_MAX_JOBS - jobsUsed);

    return {
      isFoundingMember: true,
      memberType: user.founding_member_type,
      creditRemaining: creditRemaining / 100, // dollars
      discountJobsRemaining: jobsRemaining,
      discountJobsUsed: jobsUsed,
      joinedAt: user.founding_joined_at,
    };
  } catch (err) {
    console.error("[FoundingDiscount] Error getting status:", err);
    return { isFoundingMember: false };
  }
}
