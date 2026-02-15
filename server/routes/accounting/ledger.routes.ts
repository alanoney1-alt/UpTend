import type { Express, Request, Response } from "express";
import { db } from "../../db";
import { ledgerAccounts, ledgerEntries } from "@shared/schema";
import { eq, and, gte, lte, desc, sql, count } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../../middleware/auth";
import { randomUUID } from "crypto";

export function registerLedgerRoutes(app: Express): void {
  // GET /api/accounting/ledger - paginated ledger entries with filters
  app.get("/api/accounting/ledger", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const offset = (page - 1) * limit;
      const accountId = req.query.accountId as string;
      const referenceType = req.query.referenceType as string;
      const startDate = req.query.start as string;
      const endDate = req.query.end as string;

      const conditions = [];
      if (accountId) conditions.push(eq(ledgerEntries.accountId, accountId));
      if (referenceType) conditions.push(eq(ledgerEntries.referenceType, referenceType));
      if (startDate) conditions.push(gte(ledgerEntries.createdAt, new Date(startDate)));
      if (endDate) conditions.push(lte(ledgerEntries.createdAt, new Date(endDate)));

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [entries, [countResult]] = await Promise.all([
        db.select().from(ledgerEntries).where(where).orderBy(desc(ledgerEntries.createdAt)).limit(limit).offset(offset),
        db.select({ total: count() }).from(ledgerEntries).where(where),
      ]);

      res.json({ entries, total: countResult?.total || 0, page, limit });
    } catch (error: any) {
      console.error("[ACCOUNTING] Ledger query error:", error.message);
      res.status(500).json({ error: "Failed to fetch ledger entries" });
    }
  });

  // GET /api/accounting/accounts - list all accounts with balances
  app.get("/api/accounting/accounts", requireAuth, requireAdmin, async (_req: Request, res: Response) => {
    try {
      const accounts = await db.select().from(ledgerAccounts).orderBy(ledgerAccounts.type, ledgerAccounts.name);
      res.json(accounts);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch accounts" });
    }
  });

  // GET /api/accounting/accounts/:id/entries - entries for specific account
  app.get("/api/accounting/accounts/:id/entries", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const offset = parseInt(req.query.offset as string) || 0;

      const entries = await db
        .select()
        .from(ledgerEntries)
        .where(eq(ledgerEntries.accountId, req.params.id))
        .orderBy(desc(ledgerEntries.createdAt))
        .limit(limit)
        .offset(offset);

      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch account entries" });
    }
  });

  // POST /api/accounting/manual-entry - create manual journal entry
  app.post("/api/accounting/manual-entry", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { entries, description } = req.body as {
        entries: Array<{ accountId: string; debit?: number; credit?: number }>;
        description: string;
      };

      if (!entries || entries.length < 2) {
        return res.status(400).json({ error: "At least 2 entries required for a journal entry" });
      }

      let totalDebits = 0;
      let totalCredits = 0;
      for (const e of entries) {
        totalDebits += Math.round((e.debit || 0) * 100) / 100;
        totalCredits += Math.round((e.credit || 0) * 100) / 100;
      }
      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        return res.status(400).json({ error: `Debits ($${totalDebits}) must equal credits ($${totalCredits})` });
      }

      const transactionId = randomUUID();
      const userId = (req as any).user?.id || "admin";

      await db.transaction(async (tx) => {
        for (const e of entries) {
          await tx.insert(ledgerEntries).values({
            transactionId,
            accountId: e.accountId,
            debit: Math.round((e.debit || 0) * 100) / 100,
            credit: Math.round((e.credit || 0) * 100) / 100,
            description,
            referenceType: "manual",
            createdBy: userId,
          });

          const netChange = Math.round(((e.debit || 0) - (e.credit || 0)) * 100) / 100;
          await tx
            .update(ledgerAccounts)
            .set({ balance: sql`${ledgerAccounts.balance} + ${netChange}` })
            .where(eq(ledgerAccounts.id, e.accountId));
        }
      });

      res.json({ transactionId, message: "Journal entry created" });
    } catch (error: any) {
      console.error("[ACCOUNTING] Manual entry error:", error.message);
      res.status(500).json({ error: "Failed to create journal entry" });
    }
  });

  // GET /api/accounting/balance-sheet
  app.get("/api/accounting/balance-sheet", requireAuth, requireAdmin, async (_req: Request, res: Response) => {
    try {
      const accounts = await db.select().from(ledgerAccounts).orderBy(ledgerAccounts.type, ledgerAccounts.name);

      const grouped: Record<string, Array<{ id: string; name: string; balance: number; subtype: string | null }>> = {
        asset: [],
        liability: [],
        equity: [],
      };

      let totalAssets = 0;
      let totalLiabilities = 0;
      let totalEquity = 0;

      for (const a of accounts) {
        if (a.type === "asset") {
          grouped.asset.push({ id: a.id, name: a.name, balance: a.balance, subtype: a.subtype });
          totalAssets += a.balance;
        } else if (a.type === "liability") {
          // Liabilities have negative balances in our system (credits increase, stored as negative net)
          grouped.liability.push({ id: a.id, name: a.name, balance: Math.abs(a.balance), subtype: a.subtype });
          totalLiabilities += Math.abs(a.balance);
        } else if (a.type === "equity") {
          grouped.equity.push({ id: a.id, name: a.name, balance: Math.abs(a.balance), subtype: a.subtype });
          totalEquity += Math.abs(a.balance);
        }
      }

      res.json({
        assets: { accounts: grouped.asset, total: Math.round(totalAssets * 100) / 100 },
        liabilities: { accounts: grouped.liability, total: Math.round(totalLiabilities * 100) / 100 },
        equity: { accounts: grouped.equity, total: Math.round(totalEquity * 100) / 100 },
        balanced: Math.abs(totalAssets - totalLiabilities - totalEquity) < 0.01,
        generatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to generate balance sheet" });
    }
  });

  // GET /api/accounting/profit-loss
  app.get("/api/accounting/profit-loss", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const start = req.query.start as string;
      const end = req.query.end as string;

      if (!start || !end) {
        return res.status(400).json({ error: "start and end dates required" });
      }

      const startDate = new Date(start);
      const endDate = new Date(end);

      // Get all revenue and expense entries in range
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

      const revenue: Array<{ name: string; amount: number }> = [];
      const expenses: Array<{ name: string; amount: number }> = [];
      let totalRevenue = 0;
      let totalExpenses = 0;

      for (const entry of entries) {
        const account = accountMap.get(entry.accountId);
        if (!account) continue;

        if (account.type === "revenue") {
          const amount = Math.round((entry.totalCredit - entry.totalDebit) * 100) / 100;
          revenue.push({ name: account.name, amount });
          totalRevenue += amount;
        } else if (account.type === "expense") {
          const amount = Math.round((entry.totalDebit - entry.totalCredit) * 100) / 100;
          expenses.push({ name: account.name, amount });
          totalExpenses += amount;
        }
      }

      res.json({
        period: { start, end },
        revenue: { items: revenue, total: Math.round(totalRevenue * 100) / 100 },
        expenses: { items: expenses, total: Math.round(totalExpenses * 100) / 100 },
        grossProfit: Math.round((totalRevenue - totalExpenses) * 100) / 100,
        netIncome: Math.round((totalRevenue - totalExpenses) * 100) / 100,
        generatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to generate P&L" });
    }
  });

  // GET /api/accounting/cash-flow
  app.get("/api/accounting/cash-flow", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const start = req.query.start as string;
      const end = req.query.end as string;

      if (!start || !end) {
        return res.status(400).json({ error: "start and end dates required" });
      }

      const startDate = new Date(start);
      const endDate = new Date(end);

      // Get cash account entries
      const [cashAccount] = await db.select().from(ledgerAccounts).where(eq(ledgerAccounts.name, "Cash (Stripe)")).limit(1);
      if (!cashAccount) return res.json({ inflows: 0, outflows: 0, net: 0 });

      const cashEntries = await db
        .select()
        .from(ledgerEntries)
        .where(
          and(
            eq(ledgerEntries.accountId, cashAccount.id),
            gte(ledgerEntries.createdAt, startDate),
            lte(ledgerEntries.createdAt, endDate)
          )
        )
        .orderBy(desc(ledgerEntries.createdAt));

      let inflows = 0;
      let outflows = 0;
      const byType: Record<string, { inflow: number; outflow: number }> = {};

      for (const e of cashEntries) {
        inflows += e.debit;
        outflows += e.credit;
        const type = e.referenceType || "other";
        if (!byType[type]) byType[type] = { inflow: 0, outflow: 0 };
        byType[type].inflow += e.debit;
        byType[type].outflow += e.credit;
      }

      res.json({
        period: { start, end },
        inflows: Math.round(inflows * 100) / 100,
        outflows: Math.round(outflows * 100) / 100,
        net: Math.round((inflows - outflows) * 100) / 100,
        byType,
        currentBalance: cashAccount.balance,
        generatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to generate cash flow" });
    }
  });
}
