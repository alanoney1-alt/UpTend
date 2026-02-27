/**
 * Business Billing Routes
 * Authenticated business user endpoints for billing management
 */

import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { db } from "../../db";
import {
  businessAccounts,
  businessTeamMembers,
  weeklyBillingRuns,
  billingLineItems,
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  generateBillingRun,
  getEligibleJobs,
} from "../../services/weekly-billing";
import { getUncachableStripeClient } from "../../stripeClient";

const router = Router();

// Helper: get business account for current user
async function getBusinessAccountForUser(userId: string) {
  // Check if user owns an account
  const [account] = await db
    .select()
    .from(businessAccounts)
    .where(eq(businessAccounts.userId, userId))
    .limit(1);
  if (account) return account;

  // Check team membership
  const [member] = await db
    .select()
    .from(businessTeamMembers)
    .where(
      and(
        eq(businessTeamMembers.userId, userId),
        eq(businessTeamMembers.isActive, true),
        eq(businessTeamMembers.invitationStatus, "accepted")
      )
    )
    .limit(1);

  if (member) {
    const [teamAccount] = await db
      .select()
      .from(businessAccounts)
      .where(eq(businessAccounts.id, member.businessAccountId))
      .limit(1);
    return teamAccount ?? null;
  }

  return null;
}

// GET /api/business/billing/runs - list billing runs
router.get("/billing/runs", requireAuth, async (req, res) => {
  try {
    const userId = ((req.user as any).userId || (req.user as any).id);
    const account = await getBusinessAccountForUser(userId);
    if (!account) return res.status(404).json({ error: "Business account not found" });

    const runs = await db
      .select()
      .from(weeklyBillingRuns)
      .where(eq(weeklyBillingRuns.businessAccountId, account.id))
      .orderBy(desc(weeklyBillingRuns.createdAt));

    res.json(runs);
  } catch (err: any) {
    console.error("[BillingRoutes] Error fetching runs:", err);
    res.status(500).json({ error: "Failed to fetch billing runs" });
  }
});

// GET /api/business/billing/runs/:id - billing run detail
router.get("/billing/runs/:id", requireAuth, async (req, res) => {
  try {
    const userId = ((req.user as any).userId || (req.user as any).id);
    const account = await getBusinessAccountForUser(userId);
    if (!account) return res.status(404).json({ error: "Business account not found" });

    const [run] = await db
      .select()
      .from(weeklyBillingRuns)
      .where(
        and(
          eq(weeklyBillingRuns.id, req.params.id),
          eq(weeklyBillingRuns.businessAccountId, account.id)
        )
      )
      .limit(1);

    if (!run) return res.status(404).json({ error: "Billing run not found" });

    const items = await db
      .select()
      .from(billingLineItems)
      .where(eq(billingLineItems.billingRunId, run.id));

    res.json({ ...run, lineItems: items });
  } catch (err: any) {
    console.error("[BillingRoutes] Error fetching run detail:", err);
    res.status(500).json({ error: "Failed to fetch billing run" });
  }
});

// GET /api/business/billing/preview - dry run preview for current week
router.get("/billing/preview", requireAuth, async (req, res) => {
  try {
    const userId = ((req.user as any).userId || (req.user as any).id);
    const account = await getBusinessAccountForUser(userId);
    if (!account) return res.status(404).json({ error: "Business account not found" });

    // Current week: Mon-Sun
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setUTCHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 7);

    const eligibleJobs = await getEligibleJobs(
      account.id,
      monday.toISOString(),
      sunday.toISOString()
    );

    const totalAmount = eligibleJobs.reduce((sum, j) => sum + (j.finalPrice ?? 0), 0);

    res.json({
      weekStart: monday.toISOString(),
      weekEnd: sunday.toISOString(),
      jobCount: eligibleJobs.length,
      totalAmount,
      jobs: eligibleJobs.map((j) => ({
        id: j.id,
        propertyAddress: `${j.pickupAddress}, ${j.pickupCity} ${j.pickupZip}`,
        serviceType: j.serviceType,
        completedAt: j.completedAt,
        customerSignoffAt: j.customerSignoffAt,
        totalCharge: j.finalPrice ?? 0,
        proName: j.proName,
      })),
    });
  } catch (err: any) {
    console.error("[BillingRoutes] Error generating preview:", err);
    res.status(500).json({ error: "Failed to generate billing preview" });
  }
});

// GET /api/business/billing/settings - get billing settings
router.get("/billing/settings", requireAuth, async (req, res) => {
  try {
    const userId = ((req.user as any).userId || (req.user as any).id);
    const account = await getBusinessAccountForUser(userId);
    if (!account) return res.status(404).json({ error: "Business account not found" });

    res.json({
      billingFrequency: account.billingFrequency ?? "weekly",
      autoBillingEnabled: account.autoBillingEnabled ?? true,
      billingContactEmail: account.billingContactEmail ?? account.primaryContactEmail,
      billingDayOfWeek: account.billingDayOfWeek ?? 1,
      hasPaymentMethod: !!(account.paymentMethodId && account.stripeCustomerId),
      paymentMethodLast4: null, // Populated below if available
    });
  } catch (err: any) {
    console.error("[BillingRoutes] Error fetching settings:", err);
    res.status(500).json({ error: "Failed to fetch billing settings" });
  }
});

// PUT /api/business/billing/settings - update billing settings
router.put("/billing/settings", requireAuth, async (req, res) => {
  try {
    const userId = ((req.user as any).userId || (req.user as any).id);
    const account = await getBusinessAccountForUser(userId);
    if (!account) return res.status(404).json({ error: "Business account not found" });

    const { autoBillingEnabled, billingContactEmail, billingDayOfWeek } = req.body;

    const updates: Record<string, any> = {};
    if (typeof autoBillingEnabled === "boolean") updates.autoBillingEnabled = autoBillingEnabled;
    if (typeof billingContactEmail === "string") updates.billingContactEmail = billingContactEmail;
    if (typeof billingDayOfWeek === "number" && billingDayOfWeek >= 0 && billingDayOfWeek <= 6) {
      updates.billingDayOfWeek = billingDayOfWeek;
    }

    if (Object.keys(updates).length > 0) {
      await db
        .update(businessAccounts)
        .set(updates)
        .where(eq(businessAccounts.id, account.id));
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error("[BillingRoutes] Error updating settings:", err);
    res.status(500).json({ error: "Failed to update billing settings" });
  }
});

// POST /api/business/billing/payment-method - setup Stripe payment method
router.post("/billing/payment-method", requireAuth, async (req, res) => {
  try {
    const userId = ((req.user as any).userId || (req.user as any).id);
    const account = await getBusinessAccountForUser(userId);
    if (!account) return res.status(404).json({ error: "Business account not found" });

    const stripe = await getUncachableStripeClient();

    // Create or get Stripe customer
    let customerId = account.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: account.businessName,
        email: account.billingContactEmail || account.primaryContactEmail || undefined,
        metadata: { businessAccountId: account.id },
      });
      customerId = customer.id;
      await db
        .update(businessAccounts)
        .set({ stripeCustomerId: customerId })
        .where(eq(businessAccounts.id, account.id));
    }

    // Create setup intent for collecting payment method
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      metadata: { businessAccountId: account.id },
    });

    res.json({
      clientSecret: setupIntent.client_secret,
      customerId,
    });
  } catch (err: any) {
    console.error("[BillingRoutes] Error creating setup intent:", err);
    res.status(500).json({ error: "Failed to create payment setup" });
  }
});

// POST /api/business/billing/confirm-payment-method - confirm after setup
router.post("/billing/confirm-payment-method", requireAuth, async (req, res) => {
  try {
    const userId = ((req.user as any).userId || (req.user as any).id);
    const account = await getBusinessAccountForUser(userId);
    if (!account) return res.status(404).json({ error: "Business account not found" });

    const { paymentMethodId } = req.body;
    if (!paymentMethodId) return res.status(400).json({ error: "paymentMethodId required" });

    await db
      .update(businessAccounts)
      .set({ paymentMethodId })
      .where(eq(businessAccounts.id, account.id));

    res.json({ success: true });
  } catch (err: any) {
    console.error("[BillingRoutes] Error confirming payment method:", err);
    res.status(500).json({ error: "Failed to confirm payment method" });
  }
});

export default router;
