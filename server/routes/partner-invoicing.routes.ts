/**
 * Partner Invoicing API Routes
 *
 * Wires the invoicing-system.ts service functions to Express routes
 * at /api/partners/:slug/invoices/*
 */

import type { Express, Request, Response } from "express";
import {
  createInvoice,
  sendInvoice,
  getInvoice,
  getInvoiceByToken,
  listInvoices,
  recordPayment,
  voidInvoice,
  sendPaymentReminder,
  getInvoiceStats,
  ensureInvoicingTables,
} from "../services/invoicing-system";

let tablesReady = false;
async function ensureTables() {
  if (!tablesReady) {
    await ensureInvoicingTables();
    tablesReady = true;
  }
}

export function registerPartnerInvoicingRoutes(app: Express): void {

  // GET /api/partners/:slug/invoices/stats
  app.get("/api/partners/:slug/invoices/stats", async (req: Request, res: Response) => {
    try {
      await ensureTables();
      const stats = await getInvoiceStats(req.params.slug);
      res.json(stats);
    } catch (error: any) {
      console.error("[Partner Invoicing] Stats error:", error.message);
      res.status(500).json({ error: "Failed to fetch invoice stats" });
    }
  });

  // GET /api/partners/:slug/invoices
  app.get("/api/partners/:slug/invoices", async (req: Request, res: Response) => {
    try {
      await ensureTables();
      const status = req.query.status as string | undefined;
      const invoices = await listInvoices(req.params.slug, status);
      res.json(invoices);
    } catch (error: any) {
      console.error("[Partner Invoicing] List error:", error.message);
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  // GET /api/partners/:slug/invoices/:id
  app.get("/api/partners/:slug/invoices/:id", async (req: Request, res: Response) => {
    try {
      await ensureTables();
      const invoice = await getInvoice(parseInt(req.params.id));
      if (!invoice) return res.status(404).json({ error: "Invoice not found" });
      if (invoice.partnerSlug !== req.params.slug) return res.status(404).json({ error: "Invoice not found" });
      res.json(invoice);
    } catch (error: any) {
      console.error("[Partner Invoicing] Get error:", error.message);
      res.status(500).json({ error: "Failed to fetch invoice" });
    }
  });

  // POST /api/partners/:slug/invoices
  app.post("/api/partners/:slug/invoices", async (req: Request, res: Response) => {
    try {
      await ensureTables();
      const { customerName, customerEmail, customerPhone, items, notes, dueDate, taxRate } = req.body;

      if (!customerName || !customerEmail || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "customerName, customerEmail, and items are required" });
      }

      const invoice = await createInvoice(req.params.slug, {
        customer: { name: customerName, email: customerEmail, phone: customerPhone || "" },
        items,
        notes: notes || "",
        dueDate: dueDate || null,
        taxRate: taxRate ?? 0,
      });

      res.json(invoice);
    } catch (error: any) {
      console.error("[Partner Invoicing] Create error:", error.message);
      res.status(500).json({ error: "Failed to create invoice" });
    }
  });

  // POST /api/partners/:slug/invoices/:id/send
  app.post("/api/partners/:slug/invoices/:id/send", async (req: Request, res: Response) => {
    try {
      await ensureTables();
      const result = await sendInvoice(parseInt(req.params.id));
      res.json({ success: true, paymentLink: result.paymentLink });
    } catch (error: any) {
      console.error("[Partner Invoicing] Send error:", error.message);
      res.status(500).json({ error: "Failed to send invoice" });
    }
  });

  // POST /api/partners/:slug/invoices/:id/void
  app.post("/api/partners/:slug/invoices/:id/void", async (req: Request, res: Response) => {
    try {
      await ensureTables();
      await voidInvoice(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      console.error("[Partner Invoicing] Void error:", error.message);
      res.status(500).json({ error: "Failed to void invoice" });
    }
  });

  // POST /api/partners/:slug/invoices/:id/reminder
  app.post("/api/partners/:slug/invoices/:id/reminder", async (req: Request, res: Response) => {
    try {
      await ensureTables();
      const result = await sendPaymentReminder(parseInt(req.params.id));
      res.json({ success: true, reminderText: result.reminderText });
    } catch (error: any) {
      console.error("[Partner Invoicing] Reminder error:", error.message);
      res.status(500).json({ error: "Failed to send reminder" });
    }
  });

  // POST /api/partners/:slug/invoices/:id/payment
  app.post("/api/partners/:slug/invoices/:id/payment", async (req: Request, res: Response) => {
    try {
      await ensureTables();
      const { amount, method, stripePaymentId } = req.body;
      if (!amount || !method) {
        return res.status(400).json({ error: "amount and method are required" });
      }
      await recordPayment(parseInt(req.params.id), amount, method, stripePaymentId || "");
      res.json({ success: true });
    } catch (error: any) {
      console.error("[Partner Invoicing] Payment error:", error.message);
      res.status(500).json({ error: "Failed to record payment" });
    }
  });

  // GET /api/partners/:slug/invoices/:id/pdf — redirect to accounting PDF or generate inline
  app.get("/api/partners/:slug/invoices/:id/pdf", async (req: Request, res: Response) => {
    try {
      await ensureTables();
      const invoice = await getInvoice(parseInt(req.params.id));
      if (!invoice) return res.status(404).json({ error: "Invoice not found" });
      if (invoice.partnerSlug !== req.params.slug) return res.status(404).json({ error: "Invoice not found" });

      // Simple text-based PDF (PDFKit not imported here — return JSON for now)
      // TODO: Generate proper PDF
      res.setHeader("Content-Type", "application/json");
      res.json({ error: "PDF generation coming soon. Use the invoice detail view instead.", invoice });
    } catch (error: any) {
      console.error("[Partner Invoicing] PDF error:", error.message);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  // PUBLIC: GET /api/invoices/pay/:token — get invoice by public token (no auth required)
  app.get("/api/invoices/pay/:token", async (req: Request, res: Response) => {
    try {
      await ensureTables();
      const invoice = await getInvoiceByToken(req.params.token);
      if (!invoice) return res.status(404).json({ error: "Invoice not found" });
      // Return limited info for public payment page (no partner internals)
      res.json({
        id: invoice.id,
        publicToken: invoice.publicToken,
        customerName: invoice.customerName,
        items: invoice.items,
        subtotal: invoice.subtotal,
        taxRate: invoice.taxRate,
        taxAmount: invoice.taxAmount,
        total: invoice.total,
        status: invoice.status,
        paymentLink: invoice.paymentLink,
        notes: invoice.notes,
        dueDate: invoice.dueDate,
      });
    } catch (error: any) {
      console.error("[Partner Invoicing] Public get error:", error.message);
      res.status(500).json({ error: "Failed to fetch invoice" });
    }
  });
}
