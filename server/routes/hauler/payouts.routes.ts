/**
 * Pro Payout Routes
 * 
 * Handles Stripe Connect onboarding, payout history, stats, and instant payouts.
 */

import { Router, type Request, type Response } from "express";
import { db } from "../../db";
import { eq, desc, sql } from "drizzle-orm";
import { proPayoutAccounts, proPayouts, haulerProfiles } from "@shared/schema";
import {
  createConnectAccount,
  generateOnboardingLink,
  checkAccountStatus,
  initiateInstantPayout,
  getPayoutHistory,
  getPayoutStats,
  createTransferForJob,
} from "../../services/stripe-connect";
import { storage } from "../../storage";
import { logError } from "../../utils/logger";

export function registerPayoutRoutes(app: any) {
  const router = Router();

  // ── Pro Routes ──

  // Create Connect account + return onboarding link
  router.post("/setup", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
      const userId = ((req.user as any).userId || (req.user as any).id);

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const [profile] = await db
        .select()
        .from(haulerProfiles)
        .where(eq(haulerProfiles.userId, userId))
        .limit(1);

      if (!profile) return res.status(404).json({ error: "Pro profile not found" });

      // Check if already has an account
      const [existing] = await db
        .select()
        .from(proPayoutAccounts)
        .where(eq(proPayoutAccounts.proId, userId))
        .limit(1);

      let accountId: string;
      if (existing?.stripeConnectAccountId && existing.onboardingComplete) {
        return res.json({
          accountId: existing.stripeConnectAccountId,
          onboardingComplete: true,
          message: "Already set up",
        });
      }

      if (existing?.stripeConnectAccountId) {
        accountId = existing.stripeConnectAccountId;
      } else {
        const firstName = (user as any).firstName || (user as any).fullName?.split(" ")[0] || "Pro";
        const lastName = (user as any).lastName || (user as any).fullName?.split(" ").slice(1).join(" ") || "";
        accountId = await createConnectAccount(userId, user.email || "", firstName, lastName);
      }

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const onboardingUrl = await generateOnboardingLink(
        userId,
        `${baseUrl}/pro/payouts/setup/complete`,
        `${baseUrl}/pro/payouts/setup/refresh`
      );

      res.json({ accountId, onboardingUrl, onboardingComplete: false });
    } catch (error: any) {
      logError(error, "POST /api/pro/payouts/setup");
      res.status(500).json({ error: error.message });
    }
  });

  // Check onboarding status
  router.get("/setup/status", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
      const userId = ((req.user as any).userId || (req.user as any).id);
      const status = await checkAccountStatus(userId);
      res.json(status);
    } catch (error: any) {
      logError(error, "GET /api/pro/payouts/setup/status");
      res.status(500).json({ error: error.message });
    }
  });

  // Generate new onboarding link
  router.get("/setup/refresh", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
      const userId = ((req.user as any).userId || (req.user as any).id);

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const url = await generateOnboardingLink(
        userId,
        `${baseUrl}/pro/payouts/setup/complete`,
        `${baseUrl}/pro/payouts/setup/refresh`
      );

      res.json({ url });
    } catch (error: any) {
      logError(error, "GET /api/pro/payouts/setup/refresh");
      res.status(500).json({ error: error.message });
    }
  });

  // Payout history
  router.get("/history", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
      const userId = ((req.user as any).userId || (req.user as any).id);
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await getPayoutHistory(userId, limit, offset);
      res.json(result);
    } catch (error: any) {
      logError(error, "GET /api/pro/payouts/history");
      res.status(500).json({ error: error.message });
    }
  });

  // Earnings stats
  router.get("/stats", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
      const userId = ((req.user as any).userId || (req.user as any).id);
      const stats = await getPayoutStats(userId);
      res.json(stats);
    } catch (error: any) {
      logError(error, "GET /api/pro/payouts/stats");
      res.status(500).json({ error: error.message });
    }
  });

  // Request instant payout
  router.post("/:id/instant", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
      const userId = ((req.user as any).userId || (req.user as any).id);
      const result = await initiateInstantPayout(userId, req.params.id);
      res.json(result);
    } catch (error: any) {
      logError(error, "POST /api/pro/payouts/:id/instant");
      res.status(400).json({ error: error.message });
    }
  });

  // Get payout settings
  router.get("/settings", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
      const userId = ((req.user as any).userId || (req.user as any).id);

      const [account] = await db
        .select()
        .from(proPayoutAccounts)
        .where(eq(proPayoutAccounts.proId, userId))
        .limit(1);

      if (!account) {
        return res.json({ setup: false, payoutSpeed: "standard", instantPayoutEligible: false });
      }

      res.json({
        setup: true,
        payoutSpeed: account.payoutSpeed,
        instantPayoutEligible: account.instantPayoutEligible,
        bankLast4: account.bankLast4,
        bankName: account.bankName,
        debitCardLast4: account.debitCardLast4,
        onboardingComplete: account.onboardingComplete,
        stripeAccountStatus: account.stripeAccountStatus,
      });
    } catch (error: any) {
      logError(error, "GET /api/pro/payouts/settings");
      res.status(500).json({ error: error.message });
    }
  });

  // Update payout settings
  router.put("/settings", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
      const userId = ((req.user as any).userId || (req.user as any).id);
      const { payoutSpeed } = req.body;

      if (payoutSpeed && !["standard", "instant"].includes(payoutSpeed)) {
        return res.status(400).json({ error: "Invalid payout speed" });
      }

      await db
        .update(proPayoutAccounts)
        .set({ payoutSpeed, updatedAt: new Date().toISOString() })
        .where(eq(proPayoutAccounts.proId, userId));

      res.json({ success: true });
    } catch (error: any) {
      logError(error, "PUT /api/pro/payouts/settings");
      res.status(500).json({ error: error.message });
    }
  });

  // Dashboard endpoint (combined stats + recent payouts + settings)
  router.get("/dashboard", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
      const userId = ((req.user as any).userId || (req.user as any).id);

      const [stats, history, accountResult] = await Promise.all([
        getPayoutStats(userId),
        getPayoutHistory(userId, 5, 0),
        db.select().from(proPayoutAccounts).where(eq(proPayoutAccounts.proId, userId)).limit(1),
      ]);

      const account = accountResult[0] || null;

      res.json({
        stats,
        recentPayouts: history.payouts,
        account: account
          ? {
              onboardingComplete: account.onboardingComplete,
              stripeAccountStatus: account.stripeAccountStatus,
              payoutSpeed: account.payoutSpeed,
              instantPayoutEligible: account.instantPayoutEligible,
              bankLast4: account.bankLast4,
              bankName: account.bankName,
            }
          : null,
      });
    } catch (error: any) {
      logError(error, "GET /api/pro/payouts/dashboard");
      res.status(500).json({ error: error.message });
    }
  });

  app.use("/api/pro/payouts", router);

  // ── Admin Routes ──

  const adminRouter = Router();

  adminRouter.get("/", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
      const user = req.user as any;
      if (user.role !== "admin") return res.status(403).json({ error: "Admin only" });

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const payoutsList = await db
        .select()
        .from(proPayouts)
        .orderBy(desc(proPayouts.createdAt))
        .limit(limit)
        .offset(offset);

      const countResult = await db.execute(sql`SELECT COUNT(*) as count FROM pro_payouts`);
      const total = Number((countResult.rows[0] as any)?.count || 0);

      res.json({ payouts: payoutsList, total });
    } catch (error: any) {
      logError(error, "GET /api/admin/payouts");
      res.status(500).json({ error: error.message });
    }
  });

  adminRouter.get("/summary", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
      const user = req.user as any;
      if (user.role !== "admin") return res.status(403).json({ error: "Admin only" });

      const result = await db.execute(sql`
        SELECT
          COALESCE(SUM(CASE WHEN status = 'paid' THEN net_payout ELSE 0 END), 0) as total_paid,
          COALESCE(SUM(CASE WHEN status IN ('pending', 'processing') THEN net_payout ELSE 0 END), 0) as total_pending,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
          COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
          COALESCE(SUM(CASE WHEN status = 'paid' THEN platform_fee ELSE 0 END), 0) as total_fees_collected
        FROM pro_payouts
      `);

      const row = result.rows[0] as any;
      res.json({
        totalPaid: Number(row?.total_paid || 0),
        totalPending: Number(row?.total_pending || 0),
        failedCount: Number(row?.failed_count || 0),
        paidCount: Number(row?.paid_count || 0),
        totalFeesCollected: Number(row?.total_fees_collected || 0),
      });
    } catch (error: any) {
      logError(error, "GET /api/admin/payouts/summary");
      res.status(500).json({ error: error.message });
    }
  });

  adminRouter.post("/retry/:payoutId", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
      const user = req.user as any;
      if (user.role !== "admin") return res.status(403).json({ error: "Admin only" });

      const [payout] = await db
        .select()
        .from(proPayouts)
        .where(eq(proPayouts.id, req.params.payoutId))
        .limit(1);

      if (!payout) return res.status(404).json({ error: "Payout not found" });
      if (payout.status !== "failed") return res.status(400).json({ error: "Can only retry failed payouts" });
      if (!payout.serviceRequestId) return res.status(400).json({ error: "No job associated with payout" });

      // Delete the failed record so createTransferForJob won't see a duplicate
      await db.delete(proPayouts).where(eq(proPayouts.id, payout.id));

      const result = await createTransferForJob(payout.serviceRequestId);
      res.json({ success: true, ...result });
    } catch (error: any) {
      logError(error, "POST /api/admin/payouts/retry/:payoutId");
      res.status(500).json({ error: error.message });
    }
  });

  app.use("/api/admin/payouts", adminRouter);
}
