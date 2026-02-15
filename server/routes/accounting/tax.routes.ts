import type { Express, Request, Response } from "express";
import { db } from "../../db";
import { taxRecords, ledgerEntries, ledgerAccounts } from "@shared/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../../middleware/auth";

export function registerTaxRoutes(app: Express): void {
  // GET /api/accounting/tax/1099-summary?year=
  app.get("/api/accounting/tax/1099-summary", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();

      const records = await db
        .select()
        .from(taxRecords)
        .where(eq(taxRecords.year, year))
        .orderBy(desc(taxRecords.totalEarnings));

      const needsFiling = records.filter((r) => r.totalEarnings >= 600 && !r.form1099Filed);
      const filed = records.filter((r) => r.form1099Filed);

      res.json({
        year,
        total: records.length,
        needsFiling: needsFiling.length,
        filed: filed.length,
        records,
        threshold: 600,
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch 1099 summary" });
    }
  });

  // GET /api/accounting/tax/pro/:proId?year=
  app.get("/api/accounting/tax/pro/:proId", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();

      const [record] = await db
        .select()
        .from(taxRecords)
        .where(and(eq(taxRecords.proId, req.params.proId), eq(taxRecords.year, year)))
        .limit(1);

      if (!record) {
        return res.json({
          proId: req.params.proId,
          year,
          totalEarnings: 0,
          totalJobs: 0,
          form1099Filed: false,
          w9OnFile: false,
        });
      }

      res.json(record);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch pro tax record" });
    }
  });

  // POST /api/accounting/tax/1099-generate?year= - generate/update 1099 data from ledger
  app.post("/api/accounting/tax/1099-generate", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31T23:59:59`);

      // Get all payout entries grouped by referenceId (proId)
      const payoutEntries = await db
        .select({
          referenceId: ledgerEntries.referenceId,
          total: sql<number>`SUM(${ledgerEntries.debit})`,
          jobCount: sql<number>`COUNT(*)`,
        })
        .from(ledgerEntries)
        .where(
          and(
            eq(ledgerEntries.referenceType, "payout"),
            gte(ledgerEntries.createdAt, startDate),
            lte(ledgerEntries.createdAt, endDate)
          )
        )
        .groupBy(ledgerEntries.referenceId);

      let generated = 0;
      for (const entry of payoutEntries) {
        if (!entry.referenceId) continue;

        // Upsert tax record
        const [existing] = await db
          .select()
          .from(taxRecords)
          .where(and(eq(taxRecords.proId, entry.referenceId), eq(taxRecords.year, year)))
          .limit(1);

        if (existing) {
          await db
            .update(taxRecords)
            .set({
              totalEarnings: Math.round((entry.total || 0) * 100) / 100,
              totalJobs: entry.jobCount || 0,
            })
            .where(eq(taxRecords.id, existing.id));
        } else {
          await db.insert(taxRecords).values({
            proId: entry.referenceId,
            year,
            totalEarnings: Math.round((entry.total || 0) * 100) / 100,
            totalJobs: entry.jobCount || 0,
          });
        }
        generated++;
      }

      res.json({ year, generated, message: `Updated ${generated} tax records` });
    } catch (error: any) {
      console.error("[ACCOUNTING] 1099 generate error:", error.message);
      res.status(500).json({ error: "Failed to generate 1099 data" });
    }
  });

  // GET /api/accounting/tax/quarterly-estimate
  app.get("/api/accounting/tax/quarterly-estimate", requireAuth, requireAdmin, async (_req: Request, res: Response) => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const startDate = new Date(`${year}-01-01`);

      // Get YTD revenue and expenses
      const entries = await db
        .select({
          accountId: ledgerEntries.accountId,
          totalDebit: sql<number>`COALESCE(SUM(${ledgerEntries.debit}), 0)`,
          totalCredit: sql<number>`COALESCE(SUM(${ledgerEntries.credit}), 0)`,
        })
        .from(ledgerEntries)
        .where(gte(ledgerEntries.createdAt, startDate))
        .groupBy(ledgerEntries.accountId);

      const accounts = await db.select().from(ledgerAccounts);
      const accountMap = new Map(accounts.map((a) => [a.id, a]));

      let ytdRevenue = 0;
      let ytdExpenses = 0;

      for (const e of entries) {
        const account = accountMap.get(e.accountId);
        if (!account) continue;
        if (account.type === "revenue") ytdRevenue += e.totalCredit - e.totalDebit;
        if (account.type === "expense") ytdExpenses += e.totalDebit - e.totalCredit;
      }

      const ytdNetIncome = ytdRevenue - ytdExpenses;
      // Estimate 21% corporate tax rate (C-Corp)
      const estimatedTax = Math.max(0, ytdNetIncome * 0.21);
      const quarter = Math.ceil((now.getMonth() + 1) / 3);

      res.json({
        year,
        quarter,
        ytdRevenue: Math.round(ytdRevenue * 100) / 100,
        ytdExpenses: Math.round(ytdExpenses * 100) / 100,
        ytdNetIncome: Math.round(ytdNetIncome * 100) / 100,
        estimatedAnnualTax: Math.round(estimatedTax * 100) / 100,
        quarterlyPayment: Math.round((estimatedTax / 4) * 100) / 100,
        taxRate: 0.21,
        note: "Delaware C-Corp federal estimate only. Consult CPA for state/local obligations.",
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to estimate quarterly tax" });
    }
  });
}
