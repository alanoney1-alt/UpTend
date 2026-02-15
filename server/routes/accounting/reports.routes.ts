import type { Express, Request, Response } from "express";
import { db } from "../../db";
import { ledgerAccounts, ledgerEntries, monthlyReports } from "@shared/schema";
import { eq, and, gte, lte, desc, sql, count } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../../middleware/auth";
import { calculateRunway } from "../../services/accounting-service";

export function registerReportsRoutes(app: Express): void {
  // GET /api/accounting/reports/monthly?year=&month=
  app.get("/api/accounting/reports/monthly", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;

      const [report] = await db
        .select()
        .from(monthlyReports)
        .where(and(eq(monthlyReports.year, year), eq(monthlyReports.month, month)))
        .limit(1);

      if (!report) {
        return res.json({ year, month, message: "Report not yet generated", data: null });
      }

      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch monthly report" });
    }
  });

  // GET /api/accounting/reports/dashboard
  app.get("/api/accounting/reports/dashboard", requireAuth, requireAdmin, async (_req: Request, res: Response) => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const accounts = await db.select().from(ledgerAccounts);
      const revenueIds = accounts.filter((a) => a.type === "revenue").map((a) => a.id);
      const expenseIds = accounts.filter((a) => a.type === "expense").map((a) => a.id);

      // Helper to sum credits for revenue accounts in a date range
      async function getRevenue(start: Date, end: Date): Promise<number> {
        if (revenueIds.length === 0) return 0;
        const [result] = await db
          .select({ total: sql<number>`COALESCE(SUM(${ledgerEntries.credit} - ${ledgerEntries.debit}), 0)` })
          .from(ledgerEntries)
          .where(
            and(
              sql`${ledgerEntries.accountId} = ANY(${revenueIds})`,
              gte(ledgerEntries.createdAt, start),
              lte(ledgerEntries.createdAt, end)
            )
          );
        return Math.round((result?.total || 0) * 100) / 100;
      }

      async function getExpenses(start: Date, end: Date): Promise<number> {
        if (expenseIds.length === 0) return 0;
        const [result] = await db
          .select({ total: sql<number>`COALESCE(SUM(${ledgerEntries.debit} - ${ledgerEntries.credit}), 0)` })
          .from(ledgerEntries)
          .where(
            and(
              sql`${ledgerEntries.accountId} = ANY(${expenseIds})`,
              gte(ledgerEntries.createdAt, start),
              lte(ledgerEntries.createdAt, end)
            )
          );
        return Math.round((result?.total || 0) * 100) / 100;
      }

      const [revenueToday, revenueWeek, revenueMonth, expensesMonth, revenueLastMonth, expensesLastMonth] =
        await Promise.all([
          getRevenue(todayStart, now),
          getRevenue(weekStart, now),
          getRevenue(monthStart, now),
          getExpenses(monthStart, now),
          getRevenue(lastMonthStart, monthStart),
          getExpenses(lastMonthStart, monthStart),
        ]);

      // Get payout total this month
      const payoutAccount = accounts.find((a) => a.name === "Pro Payouts");
      let payoutsMonth = 0;
      if (payoutAccount) {
        const [r] = await db
          .select({ total: sql<number>`COALESCE(SUM(${ledgerEntries.debit}), 0)` })
          .from(ledgerEntries)
          .where(
            and(
              eq(ledgerEntries.accountId, payoutAccount.id),
              gte(ledgerEntries.createdAt, monthStart),
              lte(ledgerEntries.createdAt, now)
            )
          );
        payoutsMonth = Math.round((r?.total || 0) * 100) / 100;
      }

      // MRR from B2B subscriptions (last 30 days)
      const subAccount = accounts.find((a) => a.name === "B2B Subscription Revenue");
      let mrr = 0;
      if (subAccount) {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
        const [r] = await db
          .select({ total: sql<number>`COALESCE(SUM(${ledgerEntries.credit}), 0)` })
          .from(ledgerEntries)
          .where(
            and(
              eq(ledgerEntries.accountId, subAccount.id),
              gte(ledgerEntries.createdAt, thirtyDaysAgo)
            )
          );
        mrr = Math.round((r?.total || 0) * 100) / 100;
      }

      const grossMargin = revenueMonth > 0 ? Math.round(((revenueMonth - expensesMonth) / revenueMonth) * 10000) / 100 : 0;
      const monthlyBurn = expensesLastMonth || expensesMonth;
      const runway = await calculateRunway(monthlyBurn);

      res.json({
        revenueToday,
        revenueWeek,
        revenueMonth,
        expensesMonth,
        payoutsMonth,
        grossMargin,
        mrr,
        burnRate: monthlyBurn,
        runway: runway.runwayMonths,
        cashBalance: runway.cashBalance,
        generatedAt: now.toISOString(),
      });
    } catch (error: any) {
      console.error("[ACCOUNTING] Dashboard error:", error.message);
      res.status(500).json({ error: "Failed to load dashboard" });
    }
  });

  // GET /api/accounting/reports/unit-economics
  app.get("/api/accounting/reports/unit-economics", requireAuth, requireAdmin, async (_req: Request, res: Response) => {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get job entries with metadata containing serviceType
      const entries = await db
        .select()
        .from(ledgerEntries)
        .where(
          and(
            eq(ledgerEntries.referenceType, "job"),
            gte(ledgerEntries.createdAt, monthStart)
          )
        );

      const byService: Record<string, { revenue: number; payouts: number; jobs: Set<string> }> = {};

      for (const e of entries) {
        const meta = e.metadata as any;
        const serviceType = meta?.serviceType || "unknown";
        if (!byService[serviceType]) byService[serviceType] = { revenue: 0, payouts: 0, jobs: new Set() };
        byService[serviceType].revenue += e.credit;
        byService[serviceType].payouts += e.debit;
        if (e.referenceId) byService[serviceType].jobs.add(e.referenceId);
      }

      const breakdown = Object.entries(byService).map(([service, data]) => ({
        serviceType: service,
        revenue: Math.round(data.revenue * 100) / 100,
        payouts: Math.round(data.payouts * 100) / 100,
        margin: Math.round((data.revenue - data.payouts) * 100) / 100,
        jobCount: data.jobs.size,
        avgRevPerJob: data.jobs.size > 0 ? Math.round((data.revenue / data.jobs.size) * 100) / 100 : 0,
      }));

      res.json({ period: "current_month", breakdown });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to compute unit economics" });
    }
  });

  // GET /api/accounting/reports/export?format=csv&start=&end=
  app.get("/api/accounting/reports/export", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const start = req.query.start as string;
      const end = req.query.end as string;

      const conditions = [];
      if (start) conditions.push(gte(ledgerEntries.createdAt, new Date(start)));
      if (end) conditions.push(lte(ledgerEntries.createdAt, new Date(end)));

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const entries = await db
        .select()
        .from(ledgerEntries)
        .where(where)
        .orderBy(desc(ledgerEntries.createdAt))
        .limit(10000);

      const accounts = await db.select().from(ledgerAccounts);
      const accountMap = new Map(accounts.map((a) => [a.id, a.name]));

      const header = "Date,Transaction ID,Account,Debit,Credit,Description,Type,Reference ID\n";
      const rows = entries.map((e) => {
        const date = e.createdAt ? new Date(e.createdAt).toISOString().split("T")[0] : "";
        const accountName = (accountMap.get(e.accountId) || "").replace(/,/g, " ");
        const desc = (e.description || "").replace(/,/g, " ").replace(/"/g, '""');
        return `${date},${e.transactionId},${accountName},${e.debit.toFixed(2)},${e.credit.toFixed(2)},"${desc}",${e.referenceType || ""},${e.referenceId || ""}`;
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=uptend-ledger-export.csv`);
      res.send(header + rows.join("\n"));
    } catch (error: any) {
      res.status(500).json({ error: "Failed to export" });
    }
  });

  // POST /api/accounting/reports/generate-monthly
  app.post("/api/accounting/reports/generate-monthly", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const year = parseInt(req.body.year) || new Date().getFullYear();
      const month = parseInt(req.body.month) || new Date().getMonth() + 1;

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const entries = await db
        .select({
          accountId: ledgerEntries.accountId,
          totalDebit: sql<number>`COALESCE(SUM(${ledgerEntries.debit}), 0)`,
          totalCredit: sql<number>`COALESCE(SUM(${ledgerEntries.credit}), 0)`,
        })
        .from(ledgerEntries)
        .where(and(gte(ledgerEntries.createdAt, startDate), lte(ledgerEntries.createdAt, endDate)))
        .groupBy(ledgerEntries.accountId);

      const accounts = await db.select().from(ledgerAccounts);
      const accountMap = new Map(accounts.map((a) => [a.id, a]));

      const revenueBreakdown: Record<string, number> = {};
      const expenseBreakdown: Record<string, number> = {};
      let totalRevenue = 0;
      let totalExpenses = 0;

      for (const e of entries) {
        const account = accountMap.get(e.accountId);
        if (!account) continue;
        if (account.type === "revenue") {
          const amt = Math.round((e.totalCredit - e.totalDebit) * 100) / 100;
          revenueBreakdown[account.name] = amt;
          totalRevenue += amt;
        } else if (account.type === "expense") {
          const amt = Math.round((e.totalDebit - e.totalCredit) * 100) / 100;
          expenseBreakdown[account.name] = amt;
          totalExpenses += amt;
        }
      }

      totalRevenue = Math.round(totalRevenue * 100) / 100;
      totalExpenses = Math.round(totalExpenses * 100) / 100;
      const grossProfit = Math.round((totalRevenue - totalExpenses) * 100) / 100;

      // Upsert monthly report
      const [existing] = await db
        .select()
        .from(monthlyReports)
        .where(and(eq(monthlyReports.year, year), eq(monthlyReports.month, month)))
        .limit(1);

      const reportData = { revenueBreakdown, expenseBreakdown };

      if (existing) {
        await db
          .update(monthlyReports)
          .set({ totalRevenue, totalExpenses, grossProfit, netIncome: grossProfit, reportData, generatedAt: new Date() })
          .where(eq(monthlyReports.id, existing.id));
      } else {
        await db.insert(monthlyReports).values({
          year,
          month,
          totalRevenue,
          totalExpenses,
          grossProfit,
          netIncome: grossProfit,
          reportData,
        });
      }

      res.json({ year, month, totalRevenue, totalExpenses, grossProfit, message: "Monthly report generated" });
    } catch (error: any) {
      console.error("[ACCOUNTING] Report generation error:", error.message);
      res.status(500).json({ error: "Failed to generate monthly report" });
    }
  });
}
