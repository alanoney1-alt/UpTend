/**
 * Stripe Webhook Handler for Invoice Payments
 *
 * POST /api/webhooks/stripe
 * Verifies Stripe signature, handles checkout.session.completed.
 */

import type { Express, Request, Response } from "express";
import Stripe from "stripe";
import { recordPayment, getInvoice } from "../services/invoicing-system";
import { db } from "../db";
import { sql } from "drizzle-orm";

export function registerStripeInvoiceWebhook(app: Express): void {

  // ── Public invoice view (marks as "viewed") ──────────────────
  app.post("/api/invoices/public/:id/view", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await db.execute(sql`
        UPDATE partner_invoices
        SET status = 'viewed', updated_at = NOW()
        WHERE id = ${id} AND status = 'sent'
      `);
      res.json({ ok: true });
    } catch (_) {
      res.json({ ok: true }); // best-effort
    }
  });

  // ── Public invoice fetch (no auth — anyone with the link can view) ──
  app.get("/api/invoices/public/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const invoice = await getInvoice(id);
      if (!invoice) return res.status(404).json({ error: "Invoice not found" });
      // Don't expose draft invoices publicly
      if (invoice.status === "draft") return res.status(404).json({ error: "Invoice not found" });
      res.json(invoice);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Stripe Webhook ─────────────────────────────────────────────
  // IMPORTANT: must use express.raw() for signature verification
  app.post(
    "/api/webhooks/stripe",
    (req, res, next) => {
      // If already parsed as raw buffer, skip; otherwise collect
      if (Buffer.isBuffer(req.body)) return next();
      let data = "";
      req.on("data", (chunk) => (data += chunk));
      req.on("end", () => {
        (req as any).rawBody = data;
        next();
      });
    },
    async (req: Request, res: Response) => {
      const secretKey = process.env.STRIPE_SECRET_KEY;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!secretKey) {
        return res.status(200).json({ received: true, note: "Stripe not configured" });
      }

      const stripe = new Stripe(secretKey, { apiVersion: "2026-01-28.clover" });

      let event: Stripe.Event;

      try {
        const sig = req.headers["stripe-signature"] as string;
        const rawBody = Buffer.isBuffer(req.body)
          ? req.body
          : Buffer.from((req as any).rawBody || JSON.stringify(req.body));

        if (webhookSecret && sig) {
          event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
        } else {
          // No webhook secret configured — parse body directly (dev mode)
          const payload = Buffer.isBuffer(req.body)
            ? JSON.parse(req.body.toString())
            : typeof req.body === "string"
            ? JSON.parse(req.body)
            : req.body;
          event = payload as Stripe.Event;
        }
      } catch (err: any) {
        console.error("[Stripe Webhook] Signature verification failed:", err.message);
        return res.status(400).json({ error: "Webhook signature verification failed" });
      }

      try {
        if (event.type === "checkout.session.completed") {
          const session = event.data.object as Stripe.Checkout.Session;
          const invoiceId = session.metadata?.invoiceId
            ? parseInt(session.metadata.invoiceId)
            : null;

          if (invoiceId && session.payment_status === "paid") {
            const amountTotal = (session.amount_total || 0) / 100;
            await recordPayment(invoiceId, amountTotal, "card", session.payment_intent as string || "");
            console.log(`[Stripe Webhook] Invoice #${invoiceId} marked as paid via Stripe checkout`);
          }
        }
      } catch (err: any) {
        console.error("[Stripe Webhook] Handler error:", err.message);
        // Still return 200 to prevent Stripe retries on our own errors
      }

      res.json({ received: true });
    }
  );
}
