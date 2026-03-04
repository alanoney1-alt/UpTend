import type { Express, Request, Response } from "express";
import { db } from "../../db";
import { invoices } from "@shared/schema";
import { eq, desc, and, sql, count } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../../middleware/auth";
import PDFDocument from "pdfkit";

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

  // GET /api/accounting/invoices/:id/pdf — professional PDF generation
  app.get("/api/accounting/invoices/:id/pdf", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const [invoice] = await db.select().from(invoices).where(eq(invoices.id, req.params.id)).limit(1);
      if (!invoice) return res.status(404).json({ error: "Invoice not found" });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="invoice-${invoice.invoiceNumber || invoice.id}.pdf"`);

      generateInvoicePdf({
        id: String(invoice.id),
        invoiceNumber: invoice.invoiceNumber || invoice.id,
        customerName: (invoice as any).customerName || (invoice.businessAccountId ?? "Customer"),
        customerEmail: (invoice as any).customerEmail || "",
        lineItems: Array.isArray(invoice.lineItems) ? (invoice.lineItems as any[]) : [],
        subtotal: parseFloat(invoice.subtotal as any) || 0,
        taxAmount: parseFloat(invoice.taxAmount as any) || 0,
        total: parseFloat(invoice.total as any) || 0,
        status: invoice.status || "draft",
        dueDate: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("en-US") : null,
        createdAt: invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString("en-US") : new Date().toLocaleDateString("en-US"),
        notes: invoice.notes || "",
      }, res);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to generate invoice PDF" });
    }
  });
}

// ─── PDF Generator ─────────────────────────────────────────────────────────────

interface PdfInvoiceData {
  id: string;
  invoiceNumber: number | string;
  customerName: string;
  customerEmail: string;
  lineItems: Array<{ description?: string; name?: string; quantity?: number; qty?: number; unitPrice?: number; amount?: number }>;
  subtotal: number;
  taxAmount: number;
  total: number;
  status: string;
  dueDate: string | null;
  createdAt: string;
  notes: string;
}

export function generateInvoicePdf(data: PdfInvoiceData, output: NodeJS.WritableStream): void {
  const doc = new PDFDocument({ margin: 50, size: "LETTER" });
  doc.pipe(output);

  const blue = "#1d4ed8";
  const darkGray = "#111827";
  const gray = "#6b7280";
  const lightGray = "#f3f4f6";
  const border = "#e5e7eb";

  // ── Header ──────────────────────────────────────────────────
  doc.rect(0, 0, doc.page.width, 90).fill(darkGray);

  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(22).text("UpTend", 50, 28);
  doc.fillColor("#9ca3af").font("Helvetica").fontSize(10)
    .text("UPYCK, Inc. d/b/a UpTend", 50, 54)
    .text("10125 Peebles St, Orlando, FL 32827", 50, 68);

  // Invoice label top-right
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(18)
    .text("INVOICE", 0, 34, { align: "right", width: doc.page.width - 50 });
  doc.fillColor("#9ca3af").font("Helvetica").fontSize(10)
    .text(`#${data.invoiceNumber}`, 0, 58, { align: "right", width: doc.page.width - 50 });

  // ── Invoice Meta ────────────────────────────────────────────
  doc.y = 110;
  doc.fillColor(darkGray).font("Helvetica-Bold").fontSize(11).text("Bill To:", 50, doc.y);
  doc.fillColor(darkGray).font("Helvetica").fontSize(10)
    .text(data.customerName, 50, doc.y + 14);
  if (data.customerEmail) doc.text(data.customerEmail, 50, doc.y + 14);

  // Right column: dates + status
  const metaX = 380;
  let metaY = 110;
  const addMeta = (label: string, value: string) => {
    doc.fillColor(gray).font("Helvetica").fontSize(9).text(label, metaX, metaY, { width: 80 });
    doc.fillColor(darkGray).font("Helvetica-Bold").fontSize(9).text(value, metaX + 82, metaY, { width: 130 });
    metaY += 16;
  };
  addMeta("Invoice Date:", data.createdAt);
  if (data.dueDate) addMeta("Due Date:", data.dueDate);
  addMeta("Status:", data.status.toUpperCase());

  // ── Line Items Table ────────────────────────────────────────
  doc.y = 200;
  const tableTop = doc.y;
  const colDesc = 50, colQty = 340, colUnit = 400, colAmt = 490;
  const tableWidth = 510;

  // Header row
  doc.rect(50, tableTop, tableWidth, 22).fill(darkGray);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);
  doc.text("Description", colDesc + 4, tableTop + 7);
  doc.text("Qty", colQty, tableTop + 7, { width: 55, align: "center" });
  doc.text("Unit Price", colUnit, tableTop + 7, { width: 85, align: "right" });
  doc.text("Amount", colAmt, tableTop + 7, { width: 60, align: "right" });

  let rowY = tableTop + 22;
  let isAlt = false;

  for (const item of data.lineItems) {
    const desc = item.description || item.name || "Service";
    const qty = item.quantity ?? item.qty ?? 1;
    const unitPrice = item.unitPrice ?? item.amount ?? 0;
    const lineAmt = qty * unitPrice;

    if (isAlt) doc.rect(50, rowY, tableWidth, 20).fill(lightGray);
    doc.fillColor(darkGray).font("Helvetica").fontSize(9);
    doc.text(desc, colDesc + 4, rowY + 6, { width: 285 });
    doc.text(String(qty), colQty, rowY + 6, { width: 55, align: "center" });
    doc.text(`$${unitPrice.toFixed(2)}`, colUnit, rowY + 6, { width: 85, align: "right" });
    doc.text(`$${lineAmt.toFixed(2)}`, colAmt, rowY + 6, { width: 60, align: "right" });

    rowY += 20;
    isAlt = !isAlt;
  }

  // Bottom border of table
  doc.moveTo(50, rowY).lineTo(560, rowY).lineWidth(0.5).strokeColor(border).stroke();

  // ── Totals ──────────────────────────────────────────────────
  const totalsX = 390;
  let totalsY = rowY + 12;

  const addTotalRow = (label: string, value: string, bold = false) => {
    doc.fillColor(gray).font("Helvetica").fontSize(9).text(label, totalsX, totalsY, { width: 90 });
    doc.fillColor(darkGray).font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 10 : 9)
      .text(value, totalsX + 92, totalsY, { width: 78, align: "right" });
    totalsY += 16;
  };

  addTotalRow("Subtotal", `$${data.subtotal.toFixed(2)}`);
  addTotalRow("Tax", `$${data.taxAmount.toFixed(2)}`);
  doc.moveTo(totalsX, totalsY - 2).lineTo(560, totalsY - 2).lineWidth(0.5).strokeColor(border).stroke();
  totalsY += 4;
  addTotalRow("Total Due", `$${data.total.toFixed(2)}`, true);

  // ── Notes ───────────────────────────────────────────────────
  if (data.notes) {
    doc.y = totalsY + 20;
    doc.fillColor(gray).font("Helvetica-Bold").fontSize(9).text("Notes:", 50, doc.y);
    doc.fillColor(darkGray).font("Helvetica").fontSize(9).text(data.notes, 50, doc.y + 12, { width: 300 });
  }

  // ── Footer ──────────────────────────────────────────────────
  const footerY = doc.page.height - 60;
  doc.moveTo(50, footerY).lineTo(560, footerY).lineWidth(0.5).strokeColor(border).stroke();
  doc.fillColor(gray).font("Helvetica").fontSize(8)
    .text("UPYCK, Inc. d/b/a UpTend · 10125 Peebles St, Orlando, FL 32827 · alan@uptendapp.com", 50, footerY + 10, {
      align: "center", width: 510,
    });

  doc.end();
}
