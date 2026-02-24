import { db } from "../db";
import { ledgerAccounts, ledgerEntries, manualExpenses } from "@shared/schema";
import { eq, and, sql, isNull } from "drizzle-orm";
import { randomUUID } from "crypto";

// Account name constants for lookups
const ACCOUNTS = {
  CASH_STRIPE: "Cash (Stripe)",
  ACCOUNTS_RECEIVABLE: "Accounts Receivable",
  STRIPE_PROCESSING_RESERVE: "Stripe Processing Reserve",
  ACCOUNTS_PAYABLE: "Accounts Payable (Pro Payouts)",
  SALES_TAX_PAYABLE: "Sales Tax Payable",
  DISPUTE_RESERVE: "Dispute Reserve",
  DEFERRED_REVENUE: "Deferred Revenue (B2B prepaid)",
  CONSUMER_PLATFORM_FEES: "Consumer Platform Fees",
  B2B_SUBSCRIPTION_REVENUE: "B2B Subscription Revenue",
  B2B_TRANSACTION_FEES: "B2B Transaction Fees",
  AI_HOME_SCAN_REVENUE: "Home DNA Scan Revenue",
  GOVERNMENT_CONTRACT_REVENUE: "Government Contract Revenue",
  INSURANCE_SURCHARGE_REVENUE: "Insurance Surcharge Revenue",
  REFERRAL_FEE_REVENUE: "Referral Fee Revenue",
  PRO_PAYOUTS: "Pro Payouts",
  STRIPE_PROCESSING_FEES: "Stripe Processing Fees",
  REFUNDS_ISSUED: "Refunds Issued",
  DISPUTE_LOSSES: "Dispute Losses",
  SMS_COSTS: "SMS/Communication Costs",
  REFERRAL_PAYOUTS: "Referral Payouts",
  INFRASTRUCTURE_COSTS: "Infrastructure Costs",
  INSURANCE_COSTS: "Insurance Costs",
  OWNERS_EQUITY: "Owner's Equity",
  RETAINED_EARNINGS: "Retained Earnings",
  INVESTOR_CAPITAL: "Investor Capital",
} as const;

// Cache account IDs after first lookup
let accountCache: Record<string, string> = {};

async function getAccountId(name: string): Promise<string> {
  if (accountCache[name]) return accountCache[name];
  const [account] = await db.select().from(ledgerAccounts).where(eq(ledgerAccounts.name, name)).limit(1);
  if (!account) throw new Error(`Ledger account not found: ${name}`);
  accountCache[name] = account.id;
  return account.id;
}

/** Clear account cache (useful after seeding) */
export function clearAccountCache(): void {
  accountCache = {};
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Create atomic ledger entries within a transaction.
 * All entries share the same transactionId.
 * Debits must equal credits.
 */
async function createJournalEntry(
  entries: Array<{
    accountName: string;
    debit?: number;
    credit?: number;
    description: string;
    referenceType: string;
    referenceId?: string;
    metadata?: Record<string, unknown>;
  }>,
  createdBy: string = "system"
): Promise<string> {
  const transactionId = randomUUID();

  // Validate debits = credits
  let totalDebits = 0;
  let totalCredits = 0;
  for (const e of entries) {
    totalDebits += round2(e.debit || 0);
    totalCredits += round2(e.credit || 0);
  }
  if (Math.abs(totalDebits - totalCredits) > 0.01) {
    throw new Error(`Journal entry imbalanced: debits=${totalDebits} credits=${totalCredits}`);
  }

  // Resolve all account IDs first
  const resolved = await Promise.all(
    entries.map(async (e) => ({
      ...e,
      accountId: await getAccountId(e.accountName),
    }))
  );

  await db.transaction(async (tx) => {
    for (const e of resolved) {
      await tx.insert(ledgerEntries).values({
        transactionId,
        accountId: e.accountId,
        debit: round2(e.debit || 0),
        credit: round2(e.credit || 0),
        description: e.description,
        referenceType: e.referenceType,
        referenceId: e.referenceId || null,
        metadata: e.metadata || null,
        createdBy,
      });

      // Update running balance on account
      // Assets/Expenses: balance increases with debits
      // Liabilities/Equity/Revenue: balance increases with credits
      const netChange = round2((e.debit || 0) - (e.credit || 0));
      await tx
        .update(ledgerAccounts)
        .set({ balance: sql`${ledgerAccounts.balance} + ${netChange}` })
        .where(eq(ledgerAccounts.id, e.accountId));
    }
  });

  return transactionId;
}

/**
 * Called after Stripe capture on job completion.
 * Debits Cash, credits Revenue (platform fee) + Accounts Payable (pro payout).
 */
export async function logJobPayment(
  job: { id: string; serviceType?: string },
  paymentResult: { totalAmount: number; platformFee: number; haulerPayout: number; stripeFee?: number }
): Promise<string> {
  const entries = [
    {
      accountName: ACCOUNTS.CASH_STRIPE,
      debit: round2(paymentResult.totalAmount),
      description: `Payment captured for job ${job.id}`,
      referenceType: "job",
      referenceId: job.id,
      metadata: { serviceType: job.serviceType },
    },
    {
      accountName: ACCOUNTS.CONSUMER_PLATFORM_FEES,
      credit: round2(paymentResult.platformFee),
      description: `Platform fee for job ${job.id}`,
      referenceType: "job",
      referenceId: job.id,
    },
    {
      accountName: ACCOUNTS.ACCOUNTS_PAYABLE,
      credit: round2(paymentResult.haulerPayout),
      description: `Pro payout owed for job ${job.id}`,
      referenceType: "job",
      referenceId: job.id,
    },
  ];

  return createJournalEntry(entries);
}

/**
 * Called after Stripe transfer to pro.
 * Debits AP, credits Cash.
 */
export async function logProPayout(
  proId: string,
  amount: number,
  jobId?: string
): Promise<string> {
  return createJournalEntry([
    {
      accountName: ACCOUNTS.ACCOUNTS_PAYABLE,
      debit: round2(amount),
      description: `Pro payout to ${proId}${jobId ? ` for job ${jobId}` : ""}`,
      referenceType: "payout",
      referenceId: jobId || proId,
    },
    {
      accountName: ACCOUNTS.CASH_STRIPE,
      credit: round2(amount),
      description: `Cash out for pro payout to ${proId}`,
      referenceType: "payout",
      referenceId: jobId || proId,
    },
  ]);
}

/**
 * Stripe processing fee.
 * Debits Expense, credits Cash.
 */
export async function logStripeFee(
  amount: number,
  paymentIntentId: string
): Promise<string> {
  return createJournalEntry([
    {
      accountName: ACCOUNTS.STRIPE_PROCESSING_FEES,
      debit: round2(amount),
      description: `Stripe fee for ${paymentIntentId}`,
      referenceType: "expense",
      referenceId: paymentIntentId,
    },
    {
      accountName: ACCOUNTS.CASH_STRIPE,
      credit: round2(amount),
      description: `Cash out for Stripe fee ${paymentIntentId}`,
      referenceType: "expense",
      referenceId: paymentIntentId,
    },
  ]);
}

/**
 * Refund issued.
 * Debits Refund Expense, credits Cash.
 */
export async function logRefund(
  job: { id: string },
  amount: number
): Promise<string> {
  return createJournalEntry([
    {
      accountName: ACCOUNTS.REFUNDS_ISSUED,
      debit: round2(amount),
      description: `Refund for job ${job.id}`,
      referenceType: "refund",
      referenceId: job.id,
    },
    {
      accountName: ACCOUNTS.CASH_STRIPE,
      credit: round2(amount),
      description: `Cash out for refund on job ${job.id}`,
      referenceType: "refund",
      referenceId: job.id,
    },
  ]);
}

/**
 * Dispute created.
 * Debits Dispute Losses, credits Dispute Reserve.
 */
export async function logDispute(
  dispute: { id: string; amount: number; reason?: string }
): Promise<string> {
  const amount = round2(dispute.amount / 100); // Stripe amounts are in cents
  return createJournalEntry([
    {
      accountName: ACCOUNTS.DISPUTE_LOSSES,
      debit: amount,
      description: `Dispute ${dispute.id}: ${dispute.reason || "unknown"}`,
      referenceType: "dispute",
      referenceId: dispute.id,
      metadata: { reason: dispute.reason },
    },
    {
      accountName: ACCOUNTS.DISPUTE_RESERVE,
      credit: amount,
      description: `Reserve for dispute ${dispute.id}`,
      referenceType: "dispute",
      referenceId: dispute.id,
    },
  ]);
}

/**
 * B2B subscription payment.
 * Debits Cash, credits B2B Revenue.
 */
export async function logSubscriptionPayment(
  subscription: { id: string; amount: number; businessAccountId?: string }
): Promise<string> {
  return createJournalEntry([
    {
      accountName: ACCOUNTS.CASH_STRIPE,
      debit: round2(subscription.amount),
      description: `Subscription payment ${subscription.id}`,
      referenceType: "subscription",
      referenceId: subscription.id,
      metadata: { businessAccountId: subscription.businessAccountId },
    },
    {
      accountName: ACCOUNTS.B2B_SUBSCRIPTION_REVENUE,
      credit: round2(subscription.amount),
      description: `B2B subscription revenue ${subscription.id}`,
      referenceType: "subscription",
      referenceId: subscription.id,
    },
  ]);
}

/**
 * Manual expense logging.
 * Debits the specified expense account, credits Cash.
 */
export async function logManualExpense(
  expense: { id: string; accountId: string; amount: number; description?: string }
): Promise<string> {
  // Look up account name from accountId
  const [account] = await db.select().from(ledgerAccounts).where(eq(ledgerAccounts.id, expense.accountId)).limit(1);
  if (!account) throw new Error(`Account not found: ${expense.accountId}`);

  return createJournalEntry([
    {
      accountName: account.name,
      debit: round2(expense.amount),
      description: expense.description || `Manual expense`,
      referenceType: "expense",
      referenceId: expense.id,
    },
    {
      accountName: ACCOUNTS.CASH_STRIPE,
      credit: round2(expense.amount),
      description: `Cash out for expense ${expense.id}`,
      referenceType: "expense",
      referenceId: expense.id,
    },
  ]);
}

/**
 * Referral payout.
 * Debits Referral Payouts expense, credits Cash.
 */
export async function logReferralPayout(
  referralId: string,
  amount: number
): Promise<string> {
  return createJournalEntry([
    {
      accountName: ACCOUNTS.REFERRAL_PAYOUTS,
      debit: round2(amount),
      description: `Referral payout ${referralId}`,
      referenceType: "payout",
      referenceId: referralId,
    },
    {
      accountName: ACCOUNTS.CASH_STRIPE,
      credit: round2(amount),
      description: `Cash out for referral payout ${referralId}`,
      referenceType: "payout",
      referenceId: referralId,
    },
  ]);
}

/**
 * Calculate runway: cash balance / monthly burn rate.
 */
export async function calculateRunway(monthlyBurn: number): Promise<{ cashBalance: number; monthlyBurn: number; runwayMonths: number }> {
  const [cashAccount] = await db
    .select()
    .from(ledgerAccounts)
    .where(eq(ledgerAccounts.name, ACCOUNTS.CASH_STRIPE))
    .limit(1);

  const cashBalance = cashAccount?.balance || 0;
  const runwayMonths = monthlyBurn > 0 ? round2(cashBalance / monthlyBurn) : Infinity;

  return { cashBalance: round2(cashBalance), monthlyBurn: round2(monthlyBurn), runwayMonths };
}

/**
 * Seed the chart of accounts if they don't exist.
 */
export async function seedLedgerAccounts(): Promise<void> {
  const existing = await db.select().from(ledgerAccounts).limit(1);
  if (existing.length > 0) return;

  const accounts: Array<{ name: string; type: string; subtype: string }> = [
    // Assets
    { name: "Cash (Stripe)", type: "asset", subtype: "cash" },
    { name: "Accounts Receivable", type: "asset", subtype: "receivable" },
    { name: "Stripe Processing Reserve", type: "asset", subtype: "reserve" },
    // Liabilities
    { name: "Accounts Payable (Pro Payouts)", type: "liability", subtype: "payable" },
    { name: "Sales Tax Payable", type: "liability", subtype: "tax" },
    { name: "Dispute Reserve", type: "liability", subtype: "reserve" },
    { name: "Deferred Revenue (B2B prepaid)", type: "liability", subtype: "deferred" },
    // Revenue
    { name: "Consumer Platform Fees", type: "revenue", subtype: "platform" },
    { name: "B2B Subscription Revenue", type: "revenue", subtype: "subscription" },
    { name: "B2B Transaction Fees", type: "revenue", subtype: "transaction" },
    { name: "Home DNA Scan Revenue", type: "revenue", subtype: "ai" },
    { name: "Government Contract Revenue", type: "revenue", subtype: "government" },
    { name: "Insurance Surcharge Revenue", type: "revenue", subtype: "insurance" },
    { name: "Referral Fee Revenue", type: "revenue", subtype: "referral" },
    // Expenses
    { name: "Pro Payouts", type: "expense", subtype: "payout" },
    { name: "Stripe Processing Fees", type: "expense", subtype: "processing" },
    { name: "Refunds Issued", type: "expense", subtype: "refund" },
    { name: "Dispute Losses", type: "expense", subtype: "dispute" },
    { name: "SMS/Communication Costs", type: "expense", subtype: "communication" },
    { name: "Referral Payouts", type: "expense", subtype: "referral" },
    { name: "Infrastructure Costs", type: "expense", subtype: "infrastructure" },
    { name: "Insurance Costs", type: "expense", subtype: "insurance" },
    // Equity
    { name: "Owner's Equity", type: "equity", subtype: "owner" },
    { name: "Retained Earnings", type: "equity", subtype: "retained" },
    { name: "Investor Capital", type: "equity", subtype: "investor" },
  ];

  for (const acct of accounts) {
    await db.insert(ledgerAccounts).values({
      name: acct.name,
      type: acct.type,
      subtype: acct.subtype,
      isSystem: true,
      balance: 0,
    });
  }

  clearAccountCache();
  console.log(`[ACCOUNTING] Seeded ${accounts.length} ledger accounts`);
}
