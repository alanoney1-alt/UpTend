import type { Express, Request, Response } from "express";
import { db } from "../../db";
import { invoices } from "@shared/schema";
import { eq, desc, and, sql, count } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../../middleware/auth";

export function registerInvoicingRoutes(app: Express): void {
  // GET /api/accounting/invoices
  app.get("/api/accounting/invoices", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string;
      const businessAccountId = req.query.businessAccountId as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const offset = (page - 1) * limit;

      const conditions = [];
      if (status) conditions.push(eq(invoices.status, status));
      if (businessAccountId) conditions.push(eq(invoices.businessAccountId, businessAccountId));

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [rows, [countResult]] = await Promise.all([
        db.select().from(invoices).where(where).orderBy(desc(invoices.createdAt)).limit(limit).offset(offset),
        db.select({ total: count() }).from(invoices).where(where),
      ]);

      res.json({ invoices: rows, total: countResult?.total || 0, page, limit });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  // POST /api/accounting/invoices
  app.post("/api/accounting/invoices", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { businessAccountId, lineItems, notes, dueDate, taxAmount } = req.body;

      if (!businessAccountId || !lineItems || !Array.isArray(lineItems)) {
        return res.status(400).json({ error: "businessAccountId and lineItems required" });
      }

      const subtotal = lineItems.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
      const tax = taxAmount || 0;
      const total = Math.round((subtotal + tax) * 100) / 100;

      // Auto-increment invoice number
      const [maxInv] = await db
        .select({ maxNum: sql<number>`COALESCE(MAX(${invoices.invoiceNumber}), 1000)` })
        .from(invoices);

      const [invoice] = await db
        .insert(invoices)
        .values({
          businessAccountId,
          invoiceNumber: (maxInv?.maxNum || 1000) + 1,
          status: "draft",
          subtotal: Math.round(subtotal * 100) / 100,
          taxAmount: Math.round(tax * 100) / 100,
          total,
          dueDate: dueDate ? new Date(dueDate) : null,
          lineItems,
          notes: notes || null,
        })
        .returning();

      res.json(invoice);
    } catch (error: any) {
      console.error("[ACCOUNTING] Invoice create error:", error.message);
      res.status(500).json({ error: "Failed to create invoice" });
    }
  });

  // PATCH /api/accounting/invoices/:id
  app.patch("/api/accounting/invoices/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const updates: Record<string, any> = {};
      const { status, paidVia, notes } = req.body;

      if (status) updates.status = status;
      if (paidVia) updates.paidVia = paidVia;
      if (notes !== undefined) updates.notes = notes;
      if (status === "paid") updates.paidAt = new Date();

      const [updated] = await db
        .update(invoices)
        .set(updates)
        .where(eq(invoices.id, req.params.id))
        .returning();

      if (!updated) return res.status(404).json({ error: "Invoice not found" });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update invoice" });
    }
  });

  // GET /api/accounting/invoices/:id/pdf - generate simple text PDF
  app.get("/api/accounting/invoices/:id/pdf", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const [invoice] = await db.select().from(invoices).where(eq(invoices.id, req.params.id)).limit(1);
      if (!invoice) return res.status(404).json({ error: "Invoice not found" });

      // Return JSON representation (PDF generation requires a library like pdfkit)
      // For now, return structured data that frontend can render/print
      res.json({
        company: "UPYCK, Inc. d/b/a UpTend",
        ein: "XX-XXXXXXX",
        address: "Delaware C-Corp",
        invoice,
        printable: true,
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to generate invoice PDF" });
    }
  });
}
