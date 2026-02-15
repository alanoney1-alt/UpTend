import type { Express, Request, Response } from "express";
import { db } from "../../db";
import { manualExpenses, ledgerAccounts } from "@shared/schema";
import { eq, and, gte, lte, isNull, desc, sql, count } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../../middleware/auth";
import { logManualExpense } from "../../services/accounting-service";

export function registerExpensesRoutes(app: Express): void {
  // GET /api/accounting/expenses
  app.get("/api/accounting/expenses", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const offset = (page - 1) * limit;
      const category = req.query.category as string;

      const conditions = [isNull(manualExpenses.deletedAt)];
      if (category) conditions.push(eq(manualExpenses.category, category));

      const where = and(...conditions);

      const [rows, [countResult]] = await Promise.all([
        db.select().from(manualExpenses).where(where).orderBy(desc(manualExpenses.expenseDate)).limit(limit).offset(offset),
        db.select({ total: count() }).from(manualExpenses).where(where),
      ]);

      res.json({ expenses: rows, total: countResult?.total || 0, page, limit });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch expenses" });
    }
  });

  // POST /api/accounting/expenses
  app.post("/api/accounting/expenses", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { accountId, amount, vendor, description, category, receiptUrl, expenseDate } = req.body;

      if (!accountId || !amount || !category || !expenseDate) {
        return res.status(400).json({ error: "accountId, amount, category, and expenseDate required" });
      }

      const userId = (req as any).user?.id || "admin";

      const [expense] = await db
        .insert(manualExpenses)
        .values({
          accountId,
          amount: Math.round(amount * 100) / 100,
          vendor: vendor || null,
          description: description || null,
          category,
          receiptUrl: receiptUrl || null,
          expenseDate: new Date(expenseDate),
          createdBy: userId,
        })
        .returning();

      // Fire-and-forget: create ledger entries
      logManualExpense({
        id: expense.id,
        accountId: expense.accountId,
        amount: expense.amount,
        description: expense.description || undefined,
      }).catch((err) => console.error("[ACCOUNTING] Failed to log expense:", err.message));

      res.json(expense);
    } catch (error: any) {
      console.error("[ACCOUNTING] Expense create error:", error.message);
      res.status(500).json({ error: "Failed to create expense" });
    }
  });

  // PATCH /api/accounting/expenses/:id
  app.patch("/api/accounting/expenses/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const updates: Record<string, any> = {};
      const { amount, vendor, description, category, receiptUrl, expenseDate } = req.body;

      if (amount !== undefined) updates.amount = Math.round(amount * 100) / 100;
      if (vendor !== undefined) updates.vendor = vendor;
      if (description !== undefined) updates.description = description;
      if (category !== undefined) updates.category = category;
      if (receiptUrl !== undefined) updates.receiptUrl = receiptUrl;
      if (expenseDate !== undefined) updates.expenseDate = new Date(expenseDate);

      const [updated] = await db
        .update(manualExpenses)
        .set(updates)
        .where(and(eq(manualExpenses.id, req.params.id), isNull(manualExpenses.deletedAt)))
        .returning();

      if (!updated) return res.status(404).json({ error: "Expense not found" });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update expense" });
    }
  });

  // DELETE /api/accounting/expenses/:id - soft delete
  app.delete("/api/accounting/expenses/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const [deleted] = await db
        .update(manualExpenses)
        .set({ deletedAt: new Date() })
        .where(and(eq(manualExpenses.id, req.params.id), isNull(manualExpenses.deletedAt)))
        .returning();

      if (!deleted) return res.status(404).json({ error: "Expense not found" });
      res.json({ message: "Expense deleted" });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete expense" });
    }
  });

  // GET /api/accounting/expenses/summary?start=&end=
  app.get("/api/accounting/expenses/summary", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const start = req.query.start as string;
      const end = req.query.end as string;

      const conditions = [isNull(manualExpenses.deletedAt)];
      if (start) conditions.push(gte(manualExpenses.expenseDate, new Date(start)));
      if (end) conditions.push(lte(manualExpenses.expenseDate, new Date(end)));

      const summary = await db
        .select({
          category: manualExpenses.category,
          total: sql<number>`COALESCE(SUM(${manualExpenses.amount}), 0)`,
          count: count(),
        })
        .from(manualExpenses)
        .where(and(...conditions))
        .groupBy(manualExpenses.category);

      const grandTotal = summary.reduce((s, r) => s + (r.total || 0), 0);

      res.json({
        period: { start: start || "all", end: end || "all" },
        categories: summary,
        grandTotal: Math.round(grandTotal * 100) / 100,
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to get expense summary" });
    }
  });
}
