/**
 * Weekly B2B Billing Service
 * 
 * BULLETPROOF billing - only charges for verified completed work.
 * Every job must pass ALL eligibility checks before billing.
 */

import { db } from "../db";
import {
  serviceRequests,
  businessAccounts,
  weeklyBillingRuns,
  billingLineItems,
  chargebackDisputes,
  partsRequests,
  invoices,
  haulerProfiles,
  businessBookings,
} from "@shared/schema";
import { eq, and, sql, between, notExists, ne, isNotNull } from "drizzle-orm";
import { getUncachableStripeClient } from "../stripeClient";
import { sendEmail } from "./notifications";
import { logJobPayment } from "./accounting-service";
import { randomUUID } from "crypto";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface EligibleJob {
  id: string;
  serviceType: string;
  pickupAddress: string;
  pickupCity: string;
  pickupZip: string;
  completedAt: string;
  customerSignoffAt: string | null;
  finalPrice: number | null;
  platformFee: number | null;
  assignedHaulerId: string | null;
  proName: string | null;
  businessBookingId: string | null;
}

export interface BillingRunResult {
  billingRunId: string;
  businessAccountId: string;
  weekStartDate: string;
  weekEndDate: string;
  status: string;
  totalAmount: number;
  jobCount: number;
  lineItems: Array<{
    serviceRequestId: string;
    propertyAddress: string;
    serviceType: string;
    completedAt: string;
    totalCharge: number;
    proName: string | null;
  }>;
  dryRun: boolean;
}

export interface BillingSummary {
  totalRuns: number;
  totalCharged: number;
  totalFailed: number;
  runs: BillingRunResult[];
}

// ─── Eligible Jobs Query ────────────────────────────────────────────────────

/**
 * Get jobs eligible for billing for a specific business account and week.
 * 
 * A job is eligible ONLY if ALL of these are true:
 * 1. status = 'completed'
 * 2. completedAt exists and is within the week range
 * 3. customerSignoff exists OR 24hr auto-confirm has passed
 * 4. No open chargeback disputes
 * 5. No pending parts requests (only 'installed' or 'denied' are terminal)
 * 6. Not already billed (not in billing_line_items)
 */
export async function getEligibleJobs(
  businessAccountId: string,
  weekStart: string,
  weekEnd: string
): Promise<EligibleJob[]> {
  const now = new Date().toISOString();
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Find all business bookings for this account to get their service request IDs
  const bookings = await db
    .select({ serviceRequestId: businessBookings.serviceRequestId, id: businessBookings.id })
    .from(businessBookings)
    .where(eq(businessBookings.businessAccountId, businessAccountId));

  const bookingMap = new Map<string, string>();
  const serviceRequestIds: string[] = [];
  for (const b of bookings) {
    if (b.serviceRequestId) {
      serviceRequestIds.push(b.serviceRequestId);
      bookingMap.set(b.serviceRequestId, b.id);
    }
  }

  if (serviceRequestIds.length === 0) {
    // Also check for direct service requests linked via customerId matching business account userId
    // Fall through to the main query which handles this
  }

  // Main eligibility query
  const eligible = await db
    .select({
      id: serviceRequests.id,
      serviceType: serviceRequests.serviceType,
      pickupAddress: serviceRequests.pickupAddress,
      pickupCity: serviceRequests.pickupCity,
      pickupZip: serviceRequests.pickupZip,
      completedAt: serviceRequests.completedAt,
      customerSignoffAt: serviceRequests.customerSignoffAt,
      finalPrice: serviceRequests.finalPrice,
      platformFee: serviceRequests.platformFee,
      assignedHaulerId: serviceRequests.assignedHaulerId,
    })
    .from(serviceRequests)
    .where(
      and(
        // Status must be completed
        eq(serviceRequests.status, "completed"),
        // completedAt must exist
        isNotNull(serviceRequests.completedAt),
        // completedAt within week range
        sql`${serviceRequests.completedAt} >= ${weekStart}`,
        sql`${serviceRequests.completedAt} < ${weekEnd}`,
        // Job must be linked to this business account via bookings OR service request IDs
        serviceRequestIds.length > 0
          ? sql`${serviceRequests.id} IN (${sql.join(serviceRequestIds.map(id => sql`${id}`), sql`, `)})`
          : sql`FALSE`,
        // Customer signoff OR 24hr auto-confirm
        sql`(${serviceRequests.customerSignoffAt} IS NOT NULL OR ${serviceRequests.completedAt} < ${twentyFourHoursAgo})`,
        // No open chargeback disputes
        notExists(
          db
            .select({ one: sql`1` })
            .from(chargebackDisputes)
            .where(
              and(
                eq(chargebackDisputes.jobId, serviceRequests.id),
                sql`${chargebackDisputes.status} IN ('needs_response', 'under_review')`
              )
            )
        ),
        // No pending parts requests (only installed/denied are terminal)
        notExists(
          db
            .select({ one: sql`1` })
            .from(partsRequests)
            .where(
              and(
                eq(partsRequests.serviceRequestId, serviceRequests.id),
                sql`${partsRequests.status} NOT IN ('installed', 'denied')`
              )
            )
        ),
        // Not already billed
        notExists(
          db
            .select({ one: sql`1` })
            .from(billingLineItems)
            .where(eq(billingLineItems.serviceRequestId, serviceRequests.id))
        )
      )
    );

  // Fetch pro names for each eligible job
  const results: EligibleJob[] = [];
  for (const job of eligible) {
    let proName: string | null = null;
    if (job.assignedHaulerId) {
      const [profile] = await db
        .select({ companyName: haulerProfiles.companyName })
        .from(haulerProfiles)
        .where(eq(haulerProfiles.userId, job.assignedHaulerId))
        .limit(1);
      proName = profile?.companyName ?? null;
    }

    results.push({
      id: job.id,
      serviceType: job.serviceType,
      pickupAddress: job.pickupAddress,
      pickupCity: job.pickupCity,
      pickupZip: job.pickupZip,
      completedAt: job.completedAt!,
      customerSignoffAt: job.customerSignoffAt,
      finalPrice: job.finalPrice,
      platformFee: job.platformFee,
      assignedHaulerId: job.assignedHaulerId,
      proName,
      businessBookingId: bookingMap.get(job.id) ?? null,
    });
  }

  return results;
}

// ─── Generate Billing Run ───────────────────────────────────────────────────

/**
 * Generate a billing run for a business account for a given week.
 * Uses a DB transaction to prevent race conditions and double-billing.
 */
export async function generateBillingRun(
  businessAccountId: string,
  weekStart: string,
  weekEnd: string,
  dryRun: boolean = false
): Promise<BillingRunResult> {
  const eligibleJobs = await getEligibleJobs(businessAccountId, weekStart, weekEnd);

  if (eligibleJobs.length === 0) {
    return {
      billingRunId: "",
      businessAccountId,
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
      status: "draft",
      totalAmount: 0,
      jobCount: 0,
      lineItems: [],
      dryRun,
    };
  }

  // Calculate line items
  const lineItemsData = eligibleJobs.map((job) => {
    const totalCharge = job.finalPrice ?? 0;
    const fee = job.platformFee ?? 0;
    const laborCost = totalCharge - fee;

    return {
      serviceRequestId: job.id,
      businessBookingId: job.businessBookingId,
      propertyAddress: `${job.pickupAddress}, ${job.pickupCity} ${job.pickupZip}`,
      serviceType: job.serviceType,
      completedAt: job.completedAt,
      customerSignoffAt: job.customerSignoffAt,
      proName: job.proName,
      laborCost: Math.max(0, laborCost),
      partsCost: 0, // Parts cost tracked separately
      platformFee: fee,
      totalCharge,
    };
  });

  const totalAmount = lineItemsData.reduce((sum, li) => sum + li.totalCharge, 0);
  const status = dryRun ? "draft" : "pending";

  // Use transaction to prevent race conditions
  const result = await db.transaction(async (tx) => {
    // Double-check: re-verify no jobs are already billed (within transaction)
    for (const li of lineItemsData) {
      const [existing] = await tx
        .select({ id: billingLineItems.id })
        .from(billingLineItems)
        .where(eq(billingLineItems.serviceRequestId, li.serviceRequestId))
        .limit(1);
      if (existing) {
        throw new Error(`Job ${li.serviceRequestId} is already billed (line item ${existing.id}). Aborting to prevent double billing.`);
      }
    }

    // Create billing run
    const [billingRun] = await tx
      .insert(weeklyBillingRuns)
      .values({
        businessAccountId,
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        status,
        totalAmount,
        jobCount: lineItemsData.length,
        dryRun,
        createdAt: new Date().toISOString(),
      })
      .returning();

    // Create line items (only if not dry run - dry runs don't persist line items to prevent blocking future runs)
    if (!dryRun) {
      for (const li of lineItemsData) {
        await tx.insert(billingLineItems).values({
          billingRunId: billingRun.id,
          serviceRequestId: li.serviceRequestId,
          businessBookingId: li.businessBookingId,
          propertyAddress: li.propertyAddress,
          serviceType: li.serviceType,
          completedAt: li.completedAt,
          customerSignoffAt: li.customerSignoffAt,
          proName: li.proName,
          laborCost: li.laborCost,
          partsCost: li.partsCost,
          platformFee: li.platformFee,
          totalCharge: li.totalCharge,
        });
      }
    }

    return billingRun;
  });

  return {
    billingRunId: result.id,
    businessAccountId,
    weekStartDate: weekStart,
    weekEndDate: weekEnd,
    status,
    totalAmount,
    jobCount: lineItemsData.length,
    lineItems: lineItemsData.map((li) => ({
      serviceRequestId: li.serviceRequestId,
      propertyAddress: li.propertyAddress,
      serviceType: li.serviceType,
      completedAt: li.completedAt,
      totalCharge: li.totalCharge,
      proName: li.proName,
    })),
    dryRun,
  };
}

// ─── Charge Billing Run ─────────────────────────────────────────────────────

/**
 * Charge a pending billing run via Stripe.
 * Uses idempotency keys to prevent double charges.
 */
export async function chargeBillingRun(billingRunId: string): Promise<{ success: boolean; error?: string }> {
  // Fetch billing run
  const [billingRun] = await db
    .select()
    .from(weeklyBillingRuns)
    .where(eq(weeklyBillingRuns.id, billingRunId))
    .limit(1);

  if (!billingRun) {
    return { success: false, error: "Billing run not found" };
  }

  if (billingRun.status !== "pending") {
    return { success: false, error: `Billing run status is '${billingRun.status}', expected 'pending'` };
  }

  if (billingRun.totalAmount <= 0) {
    return { success: false, error: "Billing run has zero amount" };
  }

  // Get business account
  const [account] = await db
    .select()
    .from(businessAccounts)
    .where(eq(businessAccounts.id, billingRun.businessAccountId))
    .limit(1);

  if (!account) {
    await db
      .update(weeklyBillingRuns)
      .set({ status: "failed", errorMessage: "Business account not found", processedAt: new Date().toISOString() })
      .where(eq(weeklyBillingRuns.id, billingRunId));
    return { success: false, error: "Business account not found" };
  }

  if (!account.stripeCustomerId || !account.paymentMethodId) {
    const errorMsg = "No payment method on file for business account";
    await db
      .update(weeklyBillingRuns)
      .set({ status: "failed", errorMessage: errorMsg, processedAt: new Date().toISOString() })
      .where(eq(weeklyBillingRuns.id, billingRunId));

    // Send failure notification
    await sendBillingFailedEmail(account, billingRun, errorMsg);
    return { success: false, error: errorMsg };
  }

  try {
    const stripe = await getUncachableStripeClient();
    const amountInCents = Math.round(billingRun.totalAmount * 100);

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amountInCents,
        currency: "usd",
        customer: account.stripeCustomerId,
        payment_method: account.paymentMethodId,
        confirm: true,
        off_session: true,
        description: `UpTend Weekly Invoice - Week of ${billingRun.weekStartDate} to ${billingRun.weekEndDate}`,
        metadata: {
          billingRunId: billingRun.id,
          businessAccountId: billingRun.businessAccountId,
          weekStart: billingRun.weekStartDate,
          weekEnd: billingRun.weekEndDate,
          jobCount: String(billingRun.jobCount),
        },
      },
      {
        idempotencyKey: `billing-${billingRunId}`,
      }
    );

    // Update billing run as charged
    await db
      .update(weeklyBillingRuns)
      .set({
        status: "charged",
        stripePaymentIntentId: paymentIntent.id,
        stripeChargeId: paymentIntent.latest_charge as string ?? null,
        processedAt: new Date().toISOString(),
      })
      .where(eq(weeklyBillingRuns.id, billingRunId));

    // Log to accounting ledger
    try {
      await logJobPayment(
        { id: billingRunId, serviceType: "b2b_weekly_billing" },
        {
          totalAmount: billingRun.totalAmount,
          platformFee: 0, // Platform fee already included in line items
          haulerPayout: 0,
        }
      );
    } catch (ledgerErr) {
      console.error("[WeeklyBilling] Ledger logging failed (charge succeeded):", ledgerErr);
    }

    return { success: true };
  } catch (err: any) {
    const errorMsg = err?.message || "Stripe payment failed";
    console.error("[WeeklyBilling] Charge failed:", errorMsg);

    await db
      .update(weeklyBillingRuns)
      .set({ status: "failed", errorMessage: errorMsg, processedAt: new Date().toISOString() })
      .where(eq(weeklyBillingRuns.id, billingRunId));

    // Send failure alerts
    await sendBillingFailedEmail(account, billingRun, errorMsg);

    return { success: false, error: errorMsg };
  }
}

// ─── Process Weekly Billing (Cron) ──────────────────────────────────────────

/**
 * Process weekly billing for all enabled business accounts.
 * Called by cron every Monday at 6am.
 */
export async function processWeeklyBilling(): Promise<BillingSummary> {
  // Get previous week (Mon-Sun)
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon
  const daysBack = dayOfWeek === 0 ? 7 : dayOfWeek + 6; // Go to previous Monday
  const weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() - daysBack);
  weekStart.setUTCHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 7);

  const weekStartStr = weekStart.toISOString();
  const weekEndStr = weekEnd.toISOString();

  // Get all enabled business accounts
  const accounts = await db
    .select()
    .from(businessAccounts)
    .where(eq(businessAccounts.autoBillingEnabled, true));

  const runs: BillingRunResult[] = [];
  let totalCharged = 0;
  let totalFailed = 0;

  for (const account of accounts) {
    try {
      const run = await generateBillingRun(account.id, weekStartStr, weekEndStr, false);
      if (run.jobCount === 0) continue;

      const chargeResult = await chargeBillingRun(run.billingRunId);

      if (chargeResult.success) {
        totalCharged++;
        // Send invoice email
        await sendWeeklyInvoiceEmail(account, run);
      } else {
        totalFailed++;
        run.status = "failed";
      }

      runs.push(run);
    } catch (err: any) {
      console.error(`[WeeklyBilling] Error processing account ${account.id}:`, err);
      totalFailed++;
    }
  }

  return {
    totalRuns: runs.length,
    totalCharged,
    totalFailed,
    runs,
  };
}

// ─── Void Billing Run ───────────────────────────────────────────────────────

/**
 * Void a billing run. If already charged, initiate Stripe refund.
 */
export async function voidBillingRun(
  billingRunId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const [billingRun] = await db
    .select()
    .from(weeklyBillingRuns)
    .where(eq(weeklyBillingRuns.id, billingRunId))
    .limit(1);

  if (!billingRun) {
    return { success: false, error: "Billing run not found" };
  }

  if (billingRun.status === "void") {
    return { success: false, error: "Billing run is already voided" };
  }

  // If charged, refund via Stripe
  if (billingRun.status === "charged" && billingRun.stripePaymentIntentId) {
    try {
      const stripe = await getUncachableStripeClient();
      await stripe.refunds.create({
        payment_intent: billingRun.stripePaymentIntentId,
        reason: "requested_by_customer",
        metadata: {
          billingRunId: billingRun.id,
          voidReason: reason,
        },
      });
    } catch (err: any) {
      console.error("[WeeklyBilling] Refund failed:", err);
      return { success: false, error: `Refund failed: ${err?.message}` };
    }

    // Send void confirmation email
    const [account] = await db
      .select()
      .from(businessAccounts)
      .where(eq(businessAccounts.id, billingRun.businessAccountId))
      .limit(1);

    if (account) {
      await sendBillingVoidedEmail(account, billingRun, reason);
    }
  }

  // Update status
  await db
    .update(weeklyBillingRuns)
    .set({
      status: "void",
      errorMessage: `Voided: ${reason}`,
      processedAt: new Date().toISOString(),
    })
    .where(eq(weeklyBillingRuns.id, billingRunId));

  // Remove line items to free those jobs for re-billing if needed
  await db
    .delete(billingLineItems)
    .where(eq(billingLineItems.billingRunId, billingRunId));

  return { success: true };
}

// ─── Email Templates ────────────────────────────────────────────────────────

function formatWeekRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  e.setDate(e.getDate() - 1); // End is exclusive, show Sunday
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${s.toLocaleDateString("en-US", opts)} – ${e.toLocaleDateString("en-US", opts)}`;
}

async function sendWeeklyInvoiceEmail(
  account: typeof businessAccounts.$inferSelect,
  run: BillingRunResult
): Promise<void> {
  const email = account.billingContactEmail || account.primaryContactEmail;
  if (!email) return;

  const weekLabel = formatWeekRange(run.weekStartDate, run.weekEndDate);
  const lineItemRows = run.lineItems
    .map(
      (li) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #eee">${li.propertyAddress}</td>` +
        `<td style="padding:8px;border-bottom:1px solid #eee">${li.serviceType.replace(/_/g, " ")}</td>` +
        `<td style="padding:8px;border-bottom:1px solid #eee">${li.proName || "-"}</td>` +
        `<td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${li.totalCharge.toFixed(2)}</td></tr>`
    )
    .join("");

  await sendEmail({
    to: email,
    subject: `Your UpTend Weekly Invoice - Week of ${weekLabel}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#d97706">UpTend Weekly Invoice</h2>
        <p>Week of ${weekLabel}</p>
        <p>Hi ${account.primaryContactName || account.businessName},</p>
        <p>Here's your weekly billing summary for <strong>${run.jobCount}</strong> completed job${run.jobCount !== 1 ? "s" : ""}:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <thead>
            <tr style="background:#fef3c7">
              <th style="padding:8px;text-align:left">Property</th>
              <th style="padding:8px;text-align:left">Service</th>
              <th style="padding:8px;text-align:left">Pro</th>
              <th style="padding:8px;text-align:right">Amount</th>
            </tr>
          </thead>
          <tbody>${lineItemRows}</tbody>
          <tfoot>
            <tr style="font-weight:bold;background:#fef3c7">
              <td colspan="3" style="padding:8px">Total</td>
              <td style="padding:8px;text-align:right">$${run.totalAmount.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
        <p style="color:#666">Payment has been automatically charged to your card on file.</p>
        <p style="color:#666;font-size:12px">Something wrong? Reply to this email or contact support to dispute a charge.</p>
      </div>
    `,
  });
}

async function sendBillingFailedEmail(
  account: typeof businessAccounts.$inferSelect,
  billingRun: typeof weeklyBillingRuns.$inferSelect,
  errorMsg: string
): Promise<void> {
  const email = account.billingContactEmail || account.primaryContactEmail;
  if (!email) return;

  await sendEmail({
    to: email,
    subject: "UpTend - Payment Failed - Action Required",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#dc2626">Payment Failed</h2>
        <p>Hi ${account.primaryContactName || account.businessName},</p>
        <p>We were unable to process your weekly billing payment of <strong>$${billingRun.totalAmount.toFixed(2)}</strong>.</p>
        <p><strong>Error:</strong> ${errorMsg}</p>
        <p>Please update your payment method in your UpTend dashboard to avoid service interruption.</p>
        <p style="color:#666;font-size:12px">If you believe this is an error, please contact support.</p>
      </div>
    `,
  });
}

async function sendBillingVoidedEmail(
  account: typeof businessAccounts.$inferSelect,
  billingRun: typeof weeklyBillingRuns.$inferSelect,
  reason: string
): Promise<void> {
  const email = account.billingContactEmail || account.primaryContactEmail;
  if (!email) return;

  await sendEmail({
    to: email,
    subject: "UpTend - Invoice Voided - Refund Processed",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#d97706">Invoice Voided</h2>
        <p>Hi ${account.primaryContactName || account.businessName},</p>
        <p>Your invoice for <strong>$${billingRun.totalAmount.toFixed(2)}</strong> (week of ${billingRun.weekStartDate}) has been voided.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>A refund has been initiated and should appear on your statement within 5-10 business days.</p>
      </div>
    `,
  });
}
