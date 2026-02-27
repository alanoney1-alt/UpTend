/**
 * Admin Billing Routes
 * Admin-only endpoints for billing oversight and management
 */

import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { db } from "../../db";
import {
  weeklyBillingRuns,
  billingLineItems,
  businessAccounts,
  serviceRequests,
} from "@shared/schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import {
  processWeeklyBilling,
  generateBillingRun,
  chargeBillingRun,
  voidBillingRun,
} from "../../services/weekly-billing";

const router = Router();

// Middleware: verify admin role
function requireAdmin(req: any, res: any, next: any) {
  const role = (req.user as any)?.role;
  if (role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

// POST /api/admin/billing/process-all - trigger weekly billing for all accounts
router.post("/billing/process-all", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const summary = await processWeeklyBilling();
    res.json(summary);
  } catch (err: any) {
    console.error("[AdminBilling] Error processing all:", err);
    res.status(500).json({ error: "Failed to process weekly billing" });
  }
});

// POST /api/admin/billing/process/:businessAccountId - trigger for one account
router.post("/billing/process/:businessAccountId", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { businessAccountId } = req.params;

    // Get previous week
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const daysBack = dayOfWeek === 0 ? 7 : dayOfWeek + 6;
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() - daysBack);
    weekStart.setUTCHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 7);

    const run = await generateBillingRun(
      businessAccountId,
      weekStart.toISOString(),
      weekEnd.toISOString(),
      false
    );

    if (run.jobCount === 0) {
      return res.json({ message: "No eligible jobs for billing", run });
    }

    const chargeResult = await chargeBillingRun(run.billingRunId);
    res.json({ run, chargeResult });
  } catch (err: any) {
    console.error("[AdminBilling] Error processing account:", err);
    res.status(500).json({ error: err?.message || "Failed to process billing" });
  }
});

// GET /api/admin/billing/runs - all billing runs
router.get("/billing/runs", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status, businessAccountId, limit: limitStr } = req.query;
    const limit = Math.min(parseInt(limitStr as string) || 100, 500);

    let query = db
      .select({
        run: weeklyBillingRuns,
        businessName: businessAccounts.businessName,
      })
      .from(weeklyBillingRuns)
      .leftJoin(businessAccounts, eq(weeklyBillingRuns.businessAccountId, businessAccounts.id))
      .orderBy(desc(weeklyBillingRuns.createdAt))
      .limit(limit);

    // Apply filters via raw conditions
    const conditions: any[] = [];
    if (status && typeof status === "string") {
      conditions.push(eq(weeklyBillingRuns.status, status));
    }
    if (businessAccountId && typeof businessAccountId === "string") {
      conditions.push(eq(weeklyBillingRuns.businessAccountId, businessAccountId));
    }

    const runs = conditions.length > 0
      ? await db
          .select({
            run: weeklyBillingRuns,
            businessName: businessAccounts.businessName,
          })
          .from(weeklyBillingRuns)
          .leftJoin(businessAccounts, eq(weeklyBillingRuns.businessAccountId, businessAccounts.id))
          .where(and(...conditions))
          .orderBy(desc(weeklyBillingRuns.createdAt))
          .limit(limit)
      : await query;

    res.json(
      runs.map((r) => ({
        ...r.run,
        businessName: r.businessName,
      }))
    );
  } catch (err: any) {
    console.error("[AdminBilling] Error fetching runs:", err);
    res.status(500).json({ error: "Failed to fetch billing runs" });
  }
});

// POST /api/admin/billing/void/:billingRunId - void a billing run
router.post("/billing/void/:billingRunId", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { billingRunId } = req.params;
    const { reason } = req.body;

    if (!reason || typeof reason !== "string") {
      return res.status(400).json({ error: "Void reason is required" });
    }

    const result = await voidBillingRun(billingRunId, reason);
    res.json(result);
  } catch (err: any) {
    console.error("[AdminBilling] Error voiding run:", err);
    res.status(500).json({ error: "Failed to void billing run" });
  }
});

// GET /api/admin/billing/reconciliation - reconciliation report
router.get("/billing/reconciliation", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, businessAccountId, status } = req.query;

    const conditions: any[] = [];
    if (startDate && typeof startDate === "string") {
      conditions.push(gte(weeklyBillingRuns.weekStartDate, startDate));
    }
    if (endDate && typeof endDate === "string") {
      conditions.push(lte(weeklyBillingRuns.weekEndDate, endDate));
    }
    if (businessAccountId && typeof businessAccountId === "string") {
      conditions.push(eq(weeklyBillingRuns.businessAccountId, businessAccountId));
    }
    if (status && typeof status === "string") {
      conditions.push(eq(weeklyBillingRuns.status, status));
    }

    const runs = await db
      .select()
      .from(weeklyBillingRuns)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(weeklyBillingRuns.createdAt))
      .limit(200);

    // Get line items for each run
    const results = [];
    for (const run of runs) {
      const items = await db
        .select()
        .from(billingLineItems)
        .where(eq(billingLineItems.billingRunId, run.id));

      const [account] = await db
        .select({ businessName: businessAccounts.businessName })
        .from(businessAccounts)
        .where(eq(businessAccounts.id, run.businessAccountId))
        .limit(1);

      results.push({
        ...run,
        businessName: account?.businessName ?? "Unknown",
        lineItems: items.map((li) => ({
          ...li,
          jobId: li.serviceRequestId,
        })),
      });
    }

    res.json(results);
  } catch (err: any) {
    console.error("[AdminBilling] Error fetching reconciliation:", err);
    res.status(500).json({ error: "Failed to fetch reconciliation" });
  }
});

export function registerAdminBillingRoutes(app: any) {
  app.use("/api/admin", router);
}
