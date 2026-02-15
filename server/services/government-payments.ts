/**
 * Government Payment Service
 * 
 * Handles 50/50 split payments for government work orders:
 * - 50% upfront when admin accepts quote & assigns pro
 * - 50% on verified completion
 * 
 * Also tracks float exposure (cash out to pros before government pays us).
 */

import { db } from "../db";
import { eq, and, sql, desc, inArray, gte, lte } from "drizzle-orm";
import {
  contractWorkOrders,
  governmentFloatLedger,
  governmentFloatSettings,
  contractInvoices,
  governmentContracts,
  proPayoutAccounts,
  proPayouts,
  haulerProfiles,
} from "@shared/schema";
import { getUncachableStripeClient } from "../stripeClient";
import { logProPayout } from "./accounting-service";
import { sendEmail, sendSms } from "./notifications";
import { logAudit } from "./government-contracts";

// ==========================================
// Float Ledger Helpers
// ==========================================

async function getCurrentFloatBalance(): Promise<number> {
  const result = await db.execute(sql`
    SELECT COALESCE(SUM(amount), 0) as balance
    FROM government_float_ledger
  `);
  return Number((result.rows[0] as any)?.balance || 0);
}

async function appendFloatLedger(entry: {
  contractId: string;
  workOrderId?: string;
  entryType: string;
  amount: number;
  description: string;
  stripeTransferId?: string;
  stripePaymentId?: string;
}): Promise<void> {
  const currentBalance = await getCurrentFloatBalance();
  const balanceAfter = currentBalance + entry.amount;

  await db.insert(governmentFloatLedger).values({
    contractId: entry.contractId,
    workOrderId: entry.workOrderId,
    entryType: entry.entryType,
    amount: entry.amount,
    balanceAfter,
    description: entry.description,
    stripeTransferId: entry.stripeTransferId,
    stripePaymentId: entry.stripePaymentId,
  });
}

function formatDollars(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ==========================================
// Upfront Payment (50% on assignment)
// ==========================================

export async function processUpfrontPayment(workOrderId: string): Promise<{
  success: boolean;
  transferId?: string;
  amount?: number;
  error?: string;
}> {
  const [workOrder] = await db.select().from(contractWorkOrders)
    .where(eq(contractWorkOrders.id, workOrderId));
  if (!workOrder) throw new Error("Work order not found");
  if (!workOrder.assignedProId) throw new Error("No pro assigned to work order");
  if (!workOrder.acceptedQuoteAmount) throw new Error("No accepted quote amount");

  // Idempotency: skip if already paid
  if (workOrder.upfrontPaymentStatus === "paid") {
    return { success: true, transferId: workOrder.upfrontPaymentTransferId || undefined, amount: workOrder.upfrontPaymentAmount || 0 };
  }

  const upfrontAmount = Math.round((workOrder.acceptedQuoteAmount || 0) / 2);
  const proId = workOrder.assignedProId;

  // Mark as processing
  await db.update(contractWorkOrders).set({
    upfrontPaymentAmount: upfrontAmount,
    upfrontPaymentStatus: "processing",
  }).where(eq(contractWorkOrders.id, workOrderId));

  try {
    // Get pro's Stripe Connect account
    const [payoutAccount] = await db.select().from(proPayoutAccounts)
      .where(eq(proPayoutAccounts.proId, proId)).limit(1);

    if (!payoutAccount?.stripeConnectAccountId || !payoutAccount.onboardingComplete) {
      throw new Error(`Pro ${proId} does not have a connected Stripe account`);
    }

    const stripe = await getUncachableStripeClient();
    const idempotencyKey = `gov-upfront-${workOrderId}`;

    const transfer = await stripe.transfers.create({
      amount: upfrontAmount,
      currency: "usd",
      destination: payoutAccount.stripeConnectAccountId,
      transfer_group: `gov-wo-${workOrderId}`,
      metadata: {
        workOrderId,
        proId,
        type: "government_upfront",
        split: "50_50",
      },
    }, { idempotencyKey });

    // Update work order
    await db.update(contractWorkOrders).set({
      upfrontPaymentStatus: "paid",
      upfrontPaymentTransferId: transfer.id,
      upfrontPaidAt: new Date(),
      paymentStatus: "partial",
    }).where(eq(contractWorkOrders.id, workOrderId));

    // Log to float ledger (positive = cash out)
    await appendFloatLedger({
      contractId: workOrder.contractId,
      workOrderId,
      entryType: "upfront_paid",
      amount: upfrontAmount,
      description: `Upfront payment (50%) for "${workOrder.title}" to pro ${proId}`,
      stripeTransferId: transfer.id,
    });

    // Log to accounting ledger
    await logProPayout(proId, upfrontAmount / 100, workOrderId);

    // Record in pro_payouts
    const scheduledFor = new Date();
    scheduledFor.setDate(scheduledFor.getDate() + 2);
    if (scheduledFor.getDay() === 0) scheduledFor.setDate(scheduledFor.getDate() + 1);
    if (scheduledFor.getDay() === 6) scheduledFor.setDate(scheduledFor.getDate() + 2);

    await db.insert(proPayouts).values({
      proId,
      stripeTransferId: transfer.id,
      amount: upfrontAmount,
      platformFee: 0,
      netPayout: upfrontAmount,
      feeRate: 0,
      status: "pending",
      scheduledFor: scheduledFor.toISOString(),
      idempotencyKey,
    });

    // Check float threshold
    await checkFloatThreshold();

    // Audit
    await logAudit(workOrder.contractId, "upfront_payment_processed", "work_order", workOrderId, null, {
      amount: upfrontAmount, transferId: transfer.id,
    });

    return { success: true, transferId: transfer.id, amount: upfrontAmount };
  } catch (error: any) {
    // Mark as failed but don't block assignment
    await db.update(contractWorkOrders).set({
      upfrontPaymentStatus: "failed",
    }).where(eq(contractWorkOrders.id, workOrderId));

    await logAudit(workOrder.contractId, "upfront_payment_failed", "work_order", workOrderId, null, {
      error: error.message,
    });

    return { success: false, error: error.message };
  }
}

// ==========================================
// Completion Payment (remaining 50%)
// ==========================================

export async function processCompletionPayment(workOrderId: string): Promise<{
  success: boolean;
  transferId?: string;
  amount?: number;
  error?: string;
}> {
  const [workOrder] = await db.select().from(contractWorkOrders)
    .where(eq(contractWorkOrders.id, workOrderId));
  if (!workOrder) throw new Error("Work order not found");
  if (!workOrder.assignedProId) throw new Error("No pro assigned");

  // Must have upfront paid first
  if (workOrder.upfrontPaymentStatus !== "paid") {
    throw new Error("Upfront payment must be completed before completion payment");
  }

  // Idempotency
  if (workOrder.completionPaymentStatus === "paid") {
    return { success: true, transferId: workOrder.completionPaymentTransferId || undefined, amount: workOrder.completionPaymentAmount || 0 };
  }

  const totalQuote = workOrder.acceptedQuoteAmount || 0;
  const upfrontPaid = workOrder.upfrontPaymentAmount || 0;
  const completionAmount = totalQuote - upfrontPaid;
  const proId = workOrder.assignedProId;

  await db.update(contractWorkOrders).set({
    completionPaymentAmount: completionAmount,
    completionPaymentStatus: "processing",
  }).where(eq(contractWorkOrders.id, workOrderId));

  try {
    const [payoutAccount] = await db.select().from(proPayoutAccounts)
      .where(eq(proPayoutAccounts.proId, proId)).limit(1);

    if (!payoutAccount?.stripeConnectAccountId || !payoutAccount.onboardingComplete) {
      throw new Error(`Pro ${proId} does not have a connected Stripe account`);
    }

    const stripe = await getUncachableStripeClient();
    const idempotencyKey = `gov-completion-${workOrderId}`;

    const transfer = await stripe.transfers.create({
      amount: completionAmount,
      currency: "usd",
      destination: payoutAccount.stripeConnectAccountId,
      transfer_group: `gov-wo-${workOrderId}`,
      metadata: {
        workOrderId,
        proId,
        type: "government_completion",
        split: "50_50",
      },
    }, { idempotencyKey });

    await db.update(contractWorkOrders).set({
      completionPaymentStatus: "paid",
      completionPaymentTransferId: transfer.id,
      completionPaidAt: new Date(),
      paymentStatus: "paid",
    }).where(eq(contractWorkOrders.id, workOrderId));

    await appendFloatLedger({
      contractId: workOrder.contractId,
      workOrderId,
      entryType: "completion_paid",
      amount: completionAmount,
      description: `Completion payment (50%) for "${workOrder.title}" to pro ${proId}`,
      stripeTransferId: transfer.id,
    });

    await logProPayout(proId, completionAmount / 100, workOrderId);

    const scheduledFor = new Date();
    scheduledFor.setDate(scheduledFor.getDate() + 2);
    if (scheduledFor.getDay() === 0) scheduledFor.setDate(scheduledFor.getDate() + 1);
    if (scheduledFor.getDay() === 6) scheduledFor.setDate(scheduledFor.getDate() + 2);

    await db.insert(proPayouts).values({
      proId,
      stripeTransferId: transfer.id,
      amount: completionAmount,
      platformFee: 0,
      netPayout: completionAmount,
      feeRate: 0,
      status: "pending",
      scheduledFor: scheduledFor.toISOString(),
      idempotencyKey,
    });

    await checkFloatThreshold();

    await logAudit(workOrder.contractId, "completion_payment_processed", "work_order", workOrderId, null, {
      amount: completionAmount, transferId: transfer.id,
    });

    return { success: true, transferId: transfer.id, amount: completionAmount };
  } catch (error: any) {
    await db.update(contractWorkOrders).set({
      completionPaymentStatus: "failed",
    }).where(eq(contractWorkOrders.id, workOrderId));

    await logAudit(workOrder.contractId, "completion_payment_failed", "work_order", workOrderId, null, {
      error: error.message,
    });

    return { success: false, error: error.message };
  }
}

// ==========================================
// Record Government Payment Received
// ==========================================

export async function recordGovernmentPayment(
  contractId: string,
  invoiceId: string,
  amount: number, // cents
  checkOrEftNumber: string
): Promise<void> {
  // Update the invoice
  await db.update(contractInvoices).set({
    status: "paid",
    paymentReceivedDate: new Date().toISOString().split("T")[0],
    paymentAmount: amount,
    checkNumber: checkOrEftNumber.startsWith("EFT") ? undefined : checkOrEftNumber,
    eftNumber: checkOrEftNumber.startsWith("EFT") ? checkOrEftNumber : undefined,
  }).where(eq(contractInvoices.id, invoiceId));

  // Log to float ledger (negative = cash in)
  await appendFloatLedger({
    contractId,
    entryType: "government_payment_received",
    amount: -amount,
    description: `Government payment received: ${checkOrEftNumber} for invoice ${invoiceId}`,
    stripePaymentId: checkOrEftNumber,
  });

  await logAudit(contractId, "government_payment_received", "invoice", invoiceId, null, {
    amount, checkOrEftNumber,
  });
}

// ==========================================
// Float Exposure
// ==========================================

export async function getFloatExposure(): Promise<{
  totalCommitted: number;
  totalPaidOut: number;
  totalReceived: number;
  currentExposure: number;
  activeWorkOrders: number;
  pendingInvoices: number;
}> {
  // Total committed = sum of accepted quotes on active (assigned/in_progress/completed) work orders
  const committedResult = await db.execute(sql`
    SELECT COALESCE(SUM(accepted_quote_amount), 0) as total
    FROM contract_work_orders
    WHERE status IN ('assigned', 'in_progress', 'completed', 'verified')
      AND accepted_quote_amount > 0
  `);
  const totalCommitted = Number((committedResult.rows[0] as any)?.total || 0);

  // Total paid out (positive entries in float ledger)
  const paidOutResult = await db.execute(sql`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM government_float_ledger
    WHERE amount > 0
  `);
  const totalPaidOut = Number((paidOutResult.rows[0] as any)?.total || 0);

  // Total received (negative entries = cash in, return as positive)
  const receivedResult = await db.execute(sql`
    SELECT COALESCE(ABS(SUM(amount)), 0) as total
    FROM government_float_ledger
    WHERE amount < 0
  `);
  const totalReceived = Number((receivedResult.rows[0] as any)?.total || 0);

  const currentExposure = totalPaidOut - totalReceived;

  // Count active work orders
  const activeResult = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM contract_work_orders
    WHERE status IN ('assigned', 'in_progress', 'completed')
      AND accepted_quote_amount > 0
  `);
  const activeWorkOrders = Number((activeResult.rows[0] as any)?.count || 0);

  // Count pending invoices
  const pendingResult = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM contract_invoices
    WHERE status IN ('submitted', 'under_review', 'approved')
  `);
  const pendingInvoices = Number((pendingResult.rows[0] as any)?.count || 0);

  return { totalCommitted, totalPaidOut, totalReceived, currentExposure, activeWorkOrders, pendingInvoices };
}

// ==========================================
// Float Threshold Check
// ==========================================

export async function checkFloatThreshold(): Promise<{
  overThreshold: boolean;
  overAutoHold: boolean;
  currentExposure: number;
}> {
  const settings = await getOrCreateSettings();
  const exposure = await getFloatExposure();

  const overThreshold = exposure.currentExposure > settings.maxFloatExposure;
  const overAutoHold = exposure.currentExposure > settings.autoHoldThreshold;

  if (overThreshold) {
    // Send alerts
    if (settings.alertEmail) {
      try {
        await sendEmail({
          to: settings.alertEmail,
          subject: `⚠️ Float Exposure Alert: ${formatDollars(exposure.currentExposure)}`,
          text: `Current government contract float exposure is ${formatDollars(exposure.currentExposure)}, which exceeds the alert threshold of ${formatDollars(settings.maxFloatExposure)}.\n\nTotal paid out: ${formatDollars(exposure.totalPaidOut)}\nTotal received: ${formatDollars(exposure.totalReceived)}\nActive work orders: ${exposure.activeWorkOrders}\nPending invoices: ${exposure.pendingInvoices}`,
          html: `<h2>Float Exposure Alert</h2><p>Current exposure: <strong>${formatDollars(exposure.currentExposure)}</strong></p><p>Threshold: ${formatDollars(settings.maxFloatExposure)}</p>`,
        });
      } catch (e) { /* non-blocking */ }
    }
    if (settings.alertSms) {
      try {
        await sendSms({
          to: settings.alertSms,
          body: `⚠️ UpTend Float Alert: Exposure at ${formatDollars(exposure.currentExposure)} exceeds ${formatDollars(settings.maxFloatExposure)} threshold.`,
        });
      } catch (e) { /* non-blocking */ }
    }
  }

  return { overThreshold, overAutoHold, currentExposure: exposure.currentExposure };
}

// ==========================================
// Float Forecast
// ==========================================

export async function getFloatForecast(daysAhead: number = 30): Promise<Array<{
  date: string;
  expectedOut: number;
  expectedIn: number;
  projectedExposure: number;
}>> {
  const exposure = await getFloatExposure();
  let runningExposure = exposure.currentExposure;
  const forecast: Array<{ date: string; expectedOut: number; expectedIn: number; projectedExposure: number }> = [];

  // Get work orders assigned but not yet paid upfront
  const pendingUpfront = await db.select().from(contractWorkOrders)
    .where(and(
      eq(contractWorkOrders.status, "assigned"),
      eq(contractWorkOrders.upfrontPaymentStatus, "pending")
    ));

  // Get work orders completed but not yet paid completion
  const pendingCompletion = await db.select().from(contractWorkOrders)
    .where(and(
      eq(contractWorkOrders.status, "completed"),
      eq(contractWorkOrders.completionPaymentStatus, "pending"),
      eq(contractWorkOrders.upfrontPaymentStatus, "paid")
    ));

  // Get pending government invoices
  const pendingInvoices = await db.select().from(contractInvoices)
    .where(inArray(contractInvoices.status, ["submitted", "under_review", "approved"]));

  const today = new Date();

  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    let expectedOut = 0;
    let expectedIn = 0;

    // Spread pending upfront payments over first 7 days (they happen as pros get assigned)
    if (i < 7 && pendingUpfront.length > 0) {
      const dailyUpfront = pendingUpfront.reduce((sum, wo) => sum + Math.round((wo.acceptedQuoteAmount || 0) / 2), 0) / 7;
      expectedOut += Math.round(dailyUpfront);
    }

    // Spread pending completion payments over days 7-21
    if (i >= 7 && i < 21 && pendingCompletion.length > 0) {
      const dailyCompletion = pendingCompletion.reduce((sum, wo) => {
        const total = wo.acceptedQuoteAmount || 0;
        const upfront = wo.upfrontPaymentAmount || 0;
        return sum + (total - upfront);
      }, 0) / 14;
      expectedOut += Math.round(dailyCompletion);
    }

    // Check if any invoices are due around this date
    for (const inv of pendingInvoices) {
      if (inv.dueDate === dateStr) {
        expectedIn += inv.totalAmount;
      }
    }

    runningExposure += expectedOut - expectedIn;

    forecast.push({
      date: dateStr,
      expectedOut,
      expectedIn,
      projectedExposure: runningExposure,
    });
  }

  return forecast;
}

// ==========================================
// Settings
// ==========================================

async function getOrCreateSettings() {
  const [existing] = await db.select().from(governmentFloatSettings).limit(1);
  if (existing) return existing;

  const [created] = await db.insert(governmentFloatSettings).values({
    maxFloatExposure: 50000000, // $500k
    autoHoldThreshold: 100000000, // $1M
  }).returning();
  return created;
}

export async function getFloatSettings() {
  return getOrCreateSettings();
}

export async function updateFloatSettings(updates: {
  maxFloatExposure?: number;
  alertEmail?: string;
  alertSms?: string;
  autoHoldThreshold?: number;
}) {
  const settings = await getOrCreateSettings();
  const [updated] = await db.update(governmentFloatSettings).set({
    ...updates,
    updatedAt: new Date(),
  }).where(eq(governmentFloatSettings.id, settings.id)).returning();
  return updated;
}

// ==========================================
// Float Alerts
// ==========================================

export async function getFloatAlerts(): Promise<Array<{
  type: string;
  severity: "warning" | "critical";
  message: string;
  data?: any;
}>> {
  const alerts: Array<{ type: string; severity: "warning" | "critical"; message: string; data?: any }> = [];
  const settings = await getOrCreateSettings();
  const exposure = await getFloatExposure();

  // Float threshold alerts
  if (exposure.currentExposure > settings.autoHoldThreshold) {
    alerts.push({
      type: "float_auto_hold",
      severity: "critical",
      message: `Float exposure (${formatDollars(exposure.currentExposure)}) exceeds auto-hold threshold (${formatDollars(settings.autoHoldThreshold)}). New work orders should be paused.`,
      data: { currentExposure: exposure.currentExposure, threshold: settings.autoHoldThreshold },
    });
  } else if (exposure.currentExposure > settings.maxFloatExposure) {
    alerts.push({
      type: "float_over_threshold",
      severity: "warning",
      message: `Float exposure (${formatDollars(exposure.currentExposure)}) exceeds alert threshold (${formatDollars(settings.maxFloatExposure)}).`,
      data: { currentExposure: exposure.currentExposure, threshold: settings.maxFloatExposure },
    });
  }

  // Aging invoices (>30 days)
  const agingResult = await db.execute(sql`
    SELECT id, invoice_number, total_amount, due_date, contract_id
    FROM contract_invoices
    WHERE status IN ('submitted', 'under_review', 'approved')
      AND due_date IS NOT NULL
      AND due_date < ${new Date().toISOString().split("T")[0]}
  `);

  for (const row of agingResult.rows as any[]) {
    const daysOverdue = Math.floor((Date.now() - new Date(row.due_date).getTime()) / 86400000);
    const annualRate = 0.035;
    const interest = Math.round(row.total_amount * (annualRate / 365) * daysOverdue);
    alerts.push({
      type: "aging_invoice",
      severity: daysOverdue > 60 ? "critical" : "warning",
      message: `Invoice ${row.invoice_number} is ${daysOverdue} days overdue (${formatDollars(row.total_amount)}). Prompt Payment Act interest: ${formatDollars(interest)}.`,
      data: { invoiceId: row.id, daysOverdue, interest, totalAmount: row.total_amount },
    });
  }

  // Failed payments
  const failedResult = await db.execute(sql`
    SELECT id, title, upfront_payment_status, completion_payment_status
    FROM contract_work_orders
    WHERE upfront_payment_status = 'failed' OR completion_payment_status = 'failed'
  `);

  for (const row of failedResult.rows as any[]) {
    alerts.push({
      type: "failed_payment",
      severity: "critical",
      message: `Payment failed for work order "${row.title}". Requires manual retry.`,
      data: { workOrderId: row.id },
    });
  }

  return alerts;
}

// ==========================================
// Float Ledger Query
// ==========================================

export async function getFloatLedger(page: number = 1, limit: number = 50) {
  const offset = (page - 1) * limit;

  const entries = await db.select().from(governmentFloatLedger)
    .orderBy(desc(governmentFloatLedger.createdAt))
    .limit(limit)
    .offset(offset);

  const countResult = await db.execute(sql`SELECT COUNT(*) as count FROM government_float_ledger`);
  const total = Number((countResult.rows[0] as any)?.count || 0);

  return { entries, total, page, limit, totalPages: Math.ceil(total / limit) };
}
