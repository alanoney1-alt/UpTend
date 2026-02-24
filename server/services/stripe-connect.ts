/**
 * Stripe Connect Service
 * 
 * Handles pro payouts via Stripe Connect Express accounts.
 * - Account creation & onboarding
 * - Transfers for completed jobs
 * - Instant payouts
 * - Payout history & stats
 */

import { getUncachableStripeClient } from "../stripeClient";
import { db } from "../db";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import {
 proPayoutAccounts,
 proPayouts,
 serviceRequests,
 haulerProfiles,
} from "@shared/schema";
import { getFeeRate } from "./fee-calculator";
import { logProPayout } from "./accounting-service";
import { sendEmail, sendSms } from "./notifications";
import { logError } from "../utils/logger";

const MIN_PAYOUT_FLOOR_CENTS = 5000; // $50

// ── Account Management ──

export async function createConnectAccount(
 proId: string,
 email: string,
 firstName: string,
 lastName: string
): Promise<string> {
 const stripe = await getUncachableStripeClient();

 const account = await stripe.accounts.create({
 type: "express",
 email,
 capabilities: {
 transfers: { requested: true },
 },
 business_type: "individual",
 individual: {
 first_name: firstName,
 last_name: lastName,
 email,
 },
 metadata: {
 proId,
 platform: "uptend",
 },
 });

 // Upsert payout account record
 const existing = await db
 .select()
 .from(proPayoutAccounts)
 .where(eq(proPayoutAccounts.proId, proId))
 .limit(1);

 if (existing.length > 0) {
 await db
 .update(proPayoutAccounts)
 .set({
 stripeConnectAccountId: account.id,
 stripeAccountStatus: "pending",
 updatedAt: new Date().toISOString(),
 })
 .where(eq(proPayoutAccounts.proId, proId));
 } else {
 await db.insert(proPayoutAccounts).values({
 proId,
 stripeConnectAccountId: account.id,
 stripeAccountStatus: "pending",
 });
 }

 return account.id;
}

export async function generateOnboardingLink(
 proId: string,
 returnUrl: string,
 refreshUrl: string
): Promise<string> {
 const stripe = await getUncachableStripeClient();

 const [payoutAccount] = await db
 .select()
 .from(proPayoutAccounts)
 .where(eq(proPayoutAccounts.proId, proId))
 .limit(1);

 if (!payoutAccount?.stripeConnectAccountId) {
 throw new Error("No Stripe Connect account found for this pro");
 }

 const link = await stripe.accountLinks.create({
 account: payoutAccount.stripeConnectAccountId,
 refresh_url: refreshUrl,
 return_url: returnUrl,
 type: "account_onboarding",
 });

 return link.url;
}

export async function checkAccountStatus(proId: string): Promise<{
 status: string;
 onboardingComplete: boolean;
 chargesEnabled: boolean;
 payoutsEnabled: boolean;
 requirements: string[];
 instantPayoutEligible: boolean;
}> {
 const stripe = await getUncachableStripeClient();

 const [payoutAccount] = await db
 .select()
 .from(proPayoutAccounts)
 .where(eq(proPayoutAccounts.proId, proId))
 .limit(1);

 if (!payoutAccount?.stripeConnectAccountId) {
 return {
 status: "not_setup",
 onboardingComplete: false,
 chargesEnabled: false,
 payoutsEnabled: false,
 requirements: [],
 instantPayoutEligible: false,
 };
 }

 const account = await stripe.accounts.retrieve(payoutAccount.stripeConnectAccountId);

 const chargesEnabled = account.charges_enabled ?? false;
 const payoutsEnabled = account.payouts_enabled ?? false;
 const requirements = account.requirements?.currently_due ?? [];
 const onboardingComplete = chargesEnabled && payoutsEnabled && requirements.length === 0;

 // Determine status
 let status = "pending";
 if (onboardingComplete) {
 status = "active";
 } else if (account.requirements?.disabled_reason) {
 status = "disabled";
 } else if (requirements.length > 0) {
 status = "restricted";
 }

 // Check instant payout eligibility (requires debit card external account)
 let instantPayoutEligible = false;
 try {
 const externalAccounts = await stripe.accounts.listExternalAccounts(
 payoutAccount.stripeConnectAccountId,
 { object: "card", limit: 10 }
 );
 instantPayoutEligible = externalAccounts.data.some(
 (acc: any) => acc.object === "card" && acc.available_payout_methods?.includes("instant")
 );
 } catch {
 // ignore
 }

 // Get bank info
 let bankLast4: string | null = null;
 let bankName: string | null = null;
 let debitCardLast4: string | null = null;
 try {
 const bankAccounts = await stripe.accounts.listExternalAccounts(
 payoutAccount.stripeConnectAccountId,
 { object: "bank_account", limit: 1 }
 );
 if (bankAccounts.data.length > 0) {
 const bank = bankAccounts.data[0] as any;
 bankLast4 = bank.last4;
 bankName = bank.bank_name;
 }
 const cards = await stripe.accounts.listExternalAccounts(
 payoutAccount.stripeConnectAccountId,
 { object: "card", limit: 1 }
 );
 if (cards.data.length > 0) {
 debitCardLast4 = (cards.data[0] as any).last4;
 }
 } catch {
 // ignore
 }

 await db
 .update(proPayoutAccounts)
 .set({
 stripeAccountStatus: status,
 onboardingComplete,
 instantPayoutEligible,
 bankLast4,
 bankName,
 debitCardLast4,
 updatedAt: new Date().toISOString(),
 })
 .where(eq(proPayoutAccounts.proId, proId));

 return {
 status,
 onboardingComplete,
 chargesEnabled,
 payoutsEnabled,
 requirements,
 instantPayoutEligible,
 };
}

// ── Transfers & Payouts ──

export async function createTransferForJob(serviceRequestId: string): Promise<{
 transferId: string;
 amount: number;
 netPayout: number;
 platformFee: number;
 feeRate: number;
}> {
 // Look up the completed job
 const [job] = await db
 .select()
 .from(serviceRequests)
 .where(eq(serviceRequests.id, serviceRequestId))
 .limit(1);

 if (!job) throw new Error(`Job not found: ${serviceRequestId}`);
 if (job.status !== "completed") throw new Error(`Job not completed: ${serviceRequestId}`);
 if (!job.assignedHaulerId) throw new Error(`No pro assigned to job: ${serviceRequestId}`);

 // Check for duplicate transfer
 const existingPayout = await db
 .select()
 .from(proPayouts)
 .where(eq(proPayouts.serviceRequestId, serviceRequestId))
 .limit(1);

 if (existingPayout.length > 0) {
 throw new Error(`Transfer already exists for job: ${serviceRequestId}`);
 }

 const proId = job.assignedHaulerId;

 // Get pro profile for LLC status and cert count
 const [profile] = await db
 .select()
 .from(haulerProfiles)
 .where(eq(haulerProfiles.userId, proId))
 .limit(1);

 const isLlc = profile?.isVerifiedLlc || false;

 // Count active certs
 const certResult = await db.execute(sql`
 SELECT COUNT(*) as count FROM pro_certifications
 WHERE pro_id = ${proId}
 AND status = 'completed'
 AND (expires_at IS NULL OR expires_at > ${new Date().toISOString()})
 `);
 const activeCertCount = Number((certResult.rows[0] as any)?.count || 0);

 // Calculate fee
 const feeRate = getFeeRate(isLlc, activeCertCount);
 const totalAmountDollars = job.finalPrice || job.livePrice || job.priceEstimate || 0;
 const totalAmountCents = Math.round(totalAmountDollars * 100);
 const platformFeeCents = Math.round(totalAmountCents * feeRate);
 let netPayoutCents = totalAmountCents - platformFeeCents;

 // Enforce $50 minimum payout floor (non-recurring only)
 const recurringServices = ["pool_cleaning", "landscaping"];
 const isRecurring = recurringServices.includes(job.serviceType);
 if (!isRecurring && netPayoutCents < MIN_PAYOUT_FLOOR_CENTS && totalAmountCents >= MIN_PAYOUT_FLOOR_CENTS) {
 netPayoutCents = MIN_PAYOUT_FLOOR_CENTS;
 }

 // Get pro's Connect account
 const [payoutAccount] = await db
 .select()
 .from(proPayoutAccounts)
 .where(eq(proPayoutAccounts.proId, proId))
 .limit(1);

 if (!payoutAccount?.stripeConnectAccountId || !payoutAccount.onboardingComplete) {
 throw new Error(`Pro ${proId} does not have a connected Stripe account`);
 }

 const stripe = await getUncachableStripeClient();
 const idempotencyKey = `transfer-${serviceRequestId}`;

 const transfer = await stripe.transfers.create(
 {
 amount: netPayoutCents,
 currency: "usd",
 destination: payoutAccount.stripeConnectAccountId,
 transfer_group: serviceRequestId,
 metadata: {
 serviceRequestId,
 proId,
 feeRate: feeRate.toString(),
 platformFee: platformFeeCents.toString(),
 },
 },
 { idempotencyKey }
 );

 // Calculate scheduled arrival (2 business days)
 const scheduledFor = new Date();
 scheduledFor.setDate(scheduledFor.getDate() + 2);
 // Skip weekends
 if (scheduledFor.getDay() === 0) scheduledFor.setDate(scheduledFor.getDate() + 1);
 if (scheduledFor.getDay() === 6) scheduledFor.setDate(scheduledFor.getDate() + 2);

 await db.insert(proPayouts).values({
 proId,
 serviceRequestId,
 stripeTransferId: transfer.id,
 amount: totalAmountCents,
 platformFee: platformFeeCents,
 netPayout: netPayoutCents,
 feeRate,
 status: "pending",
 scheduledFor: scheduledFor.toISOString(),
 idempotencyKey,
 });

 return {
 transferId: transfer.id,
 amount: totalAmountCents,
 netPayout: netPayoutCents,
 platformFee: platformFeeCents,
 feeRate,
 };
}

export async function initiateInstantPayout(
 proId: string,
 payoutId: string
): Promise<{ payoutId: string; amount: number; fee: number }> {
 const [payout] = await db
 .select()
 .from(proPayouts)
 .where(and(eq(proPayouts.id, payoutId), eq(proPayouts.proId, proId)))
 .limit(1);

 if (!payout) throw new Error("Payout not found");
 if (payout.status !== "pending" && payout.status !== "processing") {
 throw new Error(`Cannot instant-payout: status is ${payout.status}`);
 }
 if (payout.instantPayout) throw new Error("Already an instant payout");

 const [payoutAccount] = await db
 .select()
 .from(proPayoutAccounts)
 .where(eq(proPayoutAccounts.proId, proId))
 .limit(1);

 if (!payoutAccount?.instantPayoutEligible) {
 throw new Error("Instant payouts not eligible. Add a debit card to your account.");
 }

 // Calculate instant fee: 1.5% of net payout, minimum $0.50
 const instantFeeCents = Math.max(50, Math.round(payout.netPayout * 0.015));
 const payoutAmountCents = payout.netPayout - instantFeeCents;

 if (payoutAmountCents <= 0) throw new Error("Payout amount too small for instant payout");

 const stripe = await getUncachableStripeClient();

 // Create payout on the connected account
 const stripePayout = await stripe.payouts.create(
 {
 amount: payoutAmountCents,
 currency: "usd",
 method: "instant",
 metadata: {
 proId,
 payoutId,
 instantFee: instantFeeCents.toString(),
 },
 },
 {
 stripeAccount: payoutAccount.stripeConnectAccountId!,
 idempotencyKey: `instant-payout-${payoutId}`,
 }
 );

 await db
 .update(proPayouts)
 .set({
 instantPayout: true,
 instantFee: instantFeeCents,
 stripePayoutId: stripePayout.id,
 })
 .where(eq(proPayouts.id, payoutId));

 return {
 payoutId: stripePayout.id,
 amount: payoutAmountCents,
 fee: instantFeeCents,
 };
}

export async function processJobCompletion(serviceRequestId: string): Promise<void> {
 try {
 const [job] = await db
 .select()
 .from(serviceRequests)
 .where(eq(serviceRequests.id, serviceRequestId))
 .limit(1);

 if (!job || job.status !== "completed" || !job.assignedHaulerId) {
 console.log(`[PAYOUT] Skipping payout for job ${serviceRequestId}: not ready`);
 return;
 }

 // Check if pro has a connected account
 const [payoutAccount] = await db
 .select()
 .from(proPayoutAccounts)
 .where(eq(proPayoutAccounts.proId, job.assignedHaulerId))
 .limit(1);

 if (!payoutAccount?.onboardingComplete) {
 console.log(`[PAYOUT] Pro ${job.assignedHaulerId} not onboarded for payouts, skipping auto-transfer`);
 return;
 }

 const result = await createTransferForJob(serviceRequestId);

 // Log to accounting
 const netPayoutDollars = result.netPayout / 100;
 await logProPayout(job.assignedHaulerId, netPayoutDollars, serviceRequestId).catch(
 (err) => console.error("[PAYOUT] Accounting log failed:", err.message)
 );

 // Calculate arrival date
 const arrivalDate = new Date();
 arrivalDate.setDate(arrivalDate.getDate() + 2);
 if (arrivalDate.getDay() === 0) arrivalDate.setDate(arrivalDate.getDate() + 1);
 if (arrivalDate.getDay() === 6) arrivalDate.setDate(arrivalDate.getDate() + 2);
 const arrivalStr = arrivalDate.toLocaleDateString("en-US", {
 weekday: "long",
 month: "short",
 day: "numeric",
 });

 // Notify pro
 const [profile] = await db
 .select()
 .from(haulerProfiles)
 .where(eq(haulerProfiles.userId, job.assignedHaulerId))
 .limit(1);

 if (profile?.phone) {
 sendSms({
 to: profile.phone,
 message: ` Payment of $${(result.netPayout / 100).toFixed(2)} is on its way! Expected arrival: ${arrivalStr}. View details in your UpTend dashboard.`,
 }).catch((err) => console.error("[PAYOUT] SMS notification failed:", err.message));
 }

 console.log(
 `[PAYOUT] Transfer ${result.transferId} created for job ${serviceRequestId}: $${(result.netPayout / 100).toFixed(2)} to pro ${job.assignedHaulerId}`
 );
 } catch (error: any) {
 // Don't throw - payout failures shouldn't block job completion
 logError(error, "processJobCompletion failed", { serviceRequestId });
 console.error(`[PAYOUT] Failed for job ${serviceRequestId}:`, error.message);
 }
}

// ── History & Stats ──

export async function getPayoutHistory(
 proId: string,
 limit: number = 20,
 offset: number = 0
): Promise<{ payouts: any[]; total: number }> {
 const payoutsList = await db
 .select({
 id: proPayouts.id,
 serviceRequestId: proPayouts.serviceRequestId,
 amount: proPayouts.amount,
 platformFee: proPayouts.platformFee,
 netPayout: proPayouts.netPayout,
 feeRate: proPayouts.feeRate,
 instantPayout: proPayouts.instantPayout,
 instantFee: proPayouts.instantFee,
 status: proPayouts.status,
 scheduledFor: proPayouts.scheduledFor,
 paidAt: proPayouts.paidAt,
 createdAt: proPayouts.createdAt,
 jobServiceType: serviceRequests.serviceType,
 jobAddress: serviceRequests.pickupAddress,
 })
 .from(proPayouts)
 .leftJoin(serviceRequests, eq(proPayouts.serviceRequestId, serviceRequests.id))
 .where(eq(proPayouts.proId, proId))
 .orderBy(desc(proPayouts.createdAt))
 .limit(limit)
 .offset(offset);

 const countResult = await db.execute(
 sql`SELECT COUNT(*) as count FROM pro_payouts WHERE pro_id = ${proId}`
 );
 const total = Number((countResult.rows[0] as any)?.count || 0);

 return { payouts: payoutsList, total };
}

export async function getPayoutStats(proId: string): Promise<{
 totalEarned: number;
 thisMonth: number;
 thisWeek: number;
 pending: number;
 pendingCount: number;
 nextPayoutDate: string | null;
 nextPayoutAmount: number;
 instantFeeSaved: number;
}> {
 const now = new Date();

 // Start of week (Sunday)
 const weekStart = new Date(now);
 weekStart.setDate(now.getDate() - now.getDay());
 weekStart.setHours(0, 0, 0, 0);

 // Start of month
 const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

 // Total earned (all paid payouts)
 const totalResult = await db.execute(
 sql`SELECT COALESCE(SUM(net_payout), 0) as total FROM pro_payouts WHERE pro_id = ${proId} AND status = 'paid'`
 );
 const totalEarned = Number((totalResult.rows[0] as any)?.total || 0);

 // This month
 const monthResult = await db.execute(
 sql`SELECT COALESCE(SUM(net_payout), 0) as total FROM pro_payouts WHERE pro_id = ${proId} AND status = 'paid' AND paid_at >= ${monthStart.toISOString()}`
 );
 const thisMonth = Number((monthResult.rows[0] as any)?.total || 0);

 // This week
 const weekResult = await db.execute(
 sql`SELECT COALESCE(SUM(net_payout), 0) as total FROM pro_payouts WHERE pro_id = ${proId} AND status = 'paid' AND paid_at >= ${weekStart.toISOString()}`
 );
 const thisWeek = Number((weekResult.rows[0] as any)?.total || 0);

 // Pending
 const pendingResult = await db.execute(
 sql`SELECT COALESCE(SUM(net_payout), 0) as total, COUNT(*) as count FROM pro_payouts WHERE pro_id = ${proId} AND status IN ('pending', 'processing')`
 );
 const pending = Number((pendingResult.rows[0] as any)?.total || 0);
 const pendingCount = Number((pendingResult.rows[0] as any)?.count || 0);

 // Next payout
 const [nextPayout] = await db
 .select()
 .from(proPayouts)
 .where(and(eq(proPayouts.proId, proId), eq(proPayouts.status, "pending")))
 .orderBy(proPayouts.scheduledFor)
 .limit(1);

 // Instant fee savings (total instant fees that would have been charged on standard payouts)
 const feeSavedResult = await db.execute(
 sql`SELECT COALESCE(SUM(GREATEST(50, ROUND(net_payout * 0.015))), 0) as total FROM pro_payouts WHERE pro_id = ${proId} AND status = 'paid' AND instant_payout = false`
 );
 const instantFeeSaved = Number((feeSavedResult.rows[0] as any)?.total || 0);

 return {
 totalEarned,
 thisMonth,
 thisWeek,
 pending,
 pendingCount,
 nextPayoutDate: nextPayout?.scheduledFor || null,
 nextPayoutAmount: nextPayout?.netPayout || 0,
 instantFeeSaved,
 };
}

// ── Webhook Helpers ──

export async function updatePayoutByTransferId(
 stripeTransferId: string,
 update: Partial<{
 status: string;
 paidAt: string;
 failureReason: string;
 }>
): Promise<void> {
 await db
 .update(proPayouts)
 .set(update)
 .where(eq(proPayouts.stripeTransferId, stripeTransferId));
}

export async function updatePayoutByStripePayoutId(
 stripePayoutId: string,
 update: Partial<{
 status: string;
 paidAt: string;
 failureReason: string;
 }>
): Promise<void> {
 await db
 .update(proPayouts)
 .set(update)
 .where(eq(proPayouts.stripePayoutId, stripePayoutId));
}

export async function updateAccountByStripeId(
 stripeConnectAccountId: string,
 update: Partial<{
 stripeAccountStatus: string;
 onboardingComplete: boolean;
 instantPayoutEligible: boolean;
 bankLast4: string | null;
 bankName: string | null;
 debitCardLast4: string | null;
 }>
): Promise<void> {
 await db
 .update(proPayoutAccounts)
 .set({ ...update, updatedAt: new Date().toISOString() })
 .where(eq(proPayoutAccounts.stripeConnectAccountId, stripeConnectAccountId));
}

export async function getPayoutAccountByStripeId(stripeConnectAccountId: string) {
 const [account] = await db
 .select()
 .from(proPayoutAccounts)
 .where(eq(proPayoutAccounts.stripeConnectAccountId, stripeConnectAccountId))
 .limit(1);
 return account || null;
}

export async function getPayoutByTransferId(stripeTransferId: string) {
 const [payout] = await db
 .select()
 .from(proPayouts)
 .where(eq(proPayouts.stripeTransferId, stripeTransferId))
 .limit(1);
 return payout || null;
}

export async function getPayoutByStripePayoutId(stripePayoutId: string) {
 const [payout] = await db
 .select()
 .from(proPayouts)
 .where(eq(proPayouts.stripePayoutId, stripePayoutId))
 .limit(1);
 return payout || null;
}
