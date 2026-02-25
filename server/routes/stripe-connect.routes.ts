/**
 * Stripe Connect Routes
 * Onboarding, status, dashboard links, payouts, and webhooks for pros/businesses.
 */

import type { Express, Request, Response } from "express";
import {
  createConnectedAccount,
  generateOnboardingLink,
  getAccountStatus,
  generateDashboardLink,
  getPayoutHistory,
  handleConnectWebhookEvent,
} from "../services/stripe-connect";
import { db } from "../db";
import { haulerProfiles } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { users } from "../../shared/models/auth";

export function registerStripeConnectRoutes(app: Express) {
  // POST /api/stripe/connect/onboard — start Stripe Connect onboarding
  app.post("/api/stripe/connect/onboard", async (req: Request, res: Response) => {
    if (!req.isAuthenticated?.() || !req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      const { type } = req.body; // 'pro' or 'business'

      // Get user email
      const [user] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if already has a connected account
      const [profile] = await db
        .select({ stripeAccountId: haulerProfiles.stripeAccountId })
        .from(haulerProfiles)
        .where(eq(haulerProfiles.userId, userId))
        .limit(1);

      let accountId = profile?.stripeAccountId;

      if (!accountId) {
        const account = await createConnectedAccount(userId, user.email, type || "pro");
        accountId = account.id;
      }

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const link = await generateOnboardingLink(
        accountId!,
        `${baseUrl}/pro/payouts/setup/complete`
      );

      res.json({ url: link.url || link._mock ? `${baseUrl}/pro/payouts/setup/complete?setup=mock` : null, accountId });
    } catch (error: any) {
      console.error("Stripe Connect onboard error:", error);
      res.status(500).json({ error: "Failed to start onboarding" });
    }
  });

  // GET /api/stripe/connect/status — check onboarding status
  app.get("/api/stripe/connect/status", async (req: Request, res: Response) => {
    if (!req.isAuthenticated?.() || !req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const userId = (req.user as any).userId || (req.user as any).id;

      const [profile] = await db
        .select({
          stripeAccountId: haulerProfiles.stripeAccountId,
          stripeOnboardingComplete: haulerProfiles.stripeOnboardingComplete,
        })
        .from(haulerProfiles)
        .where(eq(haulerProfiles.userId, userId))
        .limit(1);

      if (!profile?.stripeAccountId) {
        return res.json({
          hasAccount: false,
          onboardingComplete: false,
          chargesEnabled: false,
          payoutsEnabled: false,
        });
      }

      const status = await getAccountStatus(profile.stripeAccountId);

      res.json({
        hasAccount: true,
        accountId: profile.stripeAccountId,
        onboardingComplete: profile.stripeOnboardingComplete,
        ...status,
      });
    } catch (error: any) {
      console.error("Stripe Connect status error:", error);
      res.status(500).json({ error: "Failed to check status" });
    }
  });

  // GET /api/stripe/connect/dashboard-link — Stripe Express dashboard
  app.get("/api/stripe/connect/dashboard-link", async (req: Request, res: Response) => {
    if (!req.isAuthenticated?.() || !req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const userId = (req.user as any).userId || (req.user as any).id;

      const [profile] = await db
        .select({ stripeAccountId: haulerProfiles.stripeAccountId })
        .from(haulerProfiles)
        .where(eq(haulerProfiles.userId, userId))
        .limit(1);

      if (!profile?.stripeAccountId) {
        return res.status(400).json({ error: "No connected account. Complete payout setup first." });
      }

      const link = await generateDashboardLink(profile.stripeAccountId);
      res.json({ url: link.url });
    } catch (error: any) {
      console.error("Stripe Connect dashboard link error:", error);
      res.status(500).json({ error: "Failed to generate dashboard link" });
    }
  });

  // GET /api/stripe/connect/payouts — payout history
  app.get("/api/stripe/connect/payouts", async (req: Request, res: Response) => {
    if (!req.isAuthenticated?.() || !req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      const { startDate, endDate } = req.query;

      const [profile] = await db
        .select({ stripeAccountId: haulerProfiles.stripeAccountId })
        .from(haulerProfiles)
        .where(eq(haulerProfiles.userId, userId))
        .limit(1);

      if (!profile?.stripeAccountId) {
        return res.json({ payouts: [] });
      }

      const result = await getPayoutHistory(
        profile.stripeAccountId,
        startDate as string,
        endDate as string
      );

      res.json(result);
    } catch (error: any) {
      console.error("Stripe Connect payouts error:", error);
      res.status(500).json({ error: "Failed to fetch payouts" });
    }
  });

  // POST /api/stripe/connect/webhook — Stripe Connect webhook
  app.post("/api/stripe/connect/webhook", async (req: Request, res: Response) => {
    try {
      // In production, verify webhook signature with stripe.webhooks.constructEvent
      const event = req.body;
      await handleConnectWebhookEvent(event);
      res.json({ received: true });
    } catch (error: any) {
      console.error("Stripe Connect webhook error:", error);
      res.status(400).json({ error: "Webhook processing failed" });
    }
  });
}
