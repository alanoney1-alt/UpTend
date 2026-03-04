/**
 * Partner Invoicing System
 *
 * Full invoicing for partners: create, send, track payments, stats.
 * Integrates Stripe Checkout for online payments and SendGrid for email delivery.
 */

import { db } from "../db";
import { sql } from "drizzle-orm";
import Stripe from "stripe";
import sgMail from "@sendgrid/mail";

// ============================================================
// Types
// ============================================================

export interface InvoiceCustomerData {
  name: string;
  email: string;
  phone: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: number;
  partnerSlug: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: "draft" | "sent" | "viewed" | "paid" | "overdue" | "void";
  paymentLink: string | null;
  notes: string;
  dueDate: string | null;
  sentAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: number;
  invoiceId: number;
  amount: number;
  method: "card" | "cash" | "check" | "ach";
  stripePaymentId: string | null;
  recordedAt: string;
}

// ============================================================
// Stripe + SendGrid init (lazy — only when keys are present)
// ============================================================

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2025-01-27.acacia" });
}

function initSendGrid() {
  const key = process.env.SENDGRID_API_KEY;
  if (key) sgMail.setApiKey(key);
}
initSendGrid();

const APP_BASE_URL = process.env.APP_URL || "https://uptendapp.com";
const FROM_EMAIL = process.env.FROM_EMAIL || "alan@uptendapp.com";

// ============================================================
// Database Setup
// ============================================================

export async function ensureInvoicingTables(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS partner_invoices (
        id SERIAL PRIMARY KEY,
        partner_slug TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        customer_email TEXT DEFAULT '',
        customer_phone TEXT DEFAULT '',
        items JSONB DEFAULT '[]',
        subtotal NUMERIC(12,2) DEFAULT 0,
        tax_rate NUMERIC(5,4) DEFAULT 0.07,
        tax_amount NUMERIC(12,2) DEFAULT 0,
        total NUMERIC(12,2) DEFAULT 0,
        status TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','viewed','paid','overdue','void')),
        payment_link TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        due_date TIMESTAMPTZ,
        sent_at TIMESTAMPTZ,
        paid_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS partner_invoice_items (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER REFERENCES partner_invoices(id),
        description TEXT NOT NULL,
        quantity NUMERIC(10,2) DEFAULT 1,
        unit_price NUMERIC(12,2) DEFAULT 0,
        total NUMERIC(12,2) DEFAULT 0
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS partner_payment_records (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER REFERENCES partner_invoices(id),
        amount NUMERIC(12,2) NOT NULL,
        method TEXT DEFAULT 'card' CHECK (method IN ('card','cash','check','ach')),
        stripe_payment_id TEXT DEFAULT '',
        recorded_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  } catch (err) {
    console.error("[Invoicing] Table creation error:", err);
  }
}

// ============================================================
// Helper
// ============================================================

function mapInvoiceRow(r: any): Invoice {
  return {
    id: r.id,
    partnerSlug: r.partner_slug,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    customerPhone: r.customer_phone,
    items: r.items || [],
    subtotal: parseFloat(r.subtotal) || 0,
    taxRate: parseFloat(r.tax_rate) || 0,
    taxAmount: parseFloat(r.tax_amount) || 0,
    total: parseFloat(r.total) || 0,
    status: r.status,
    paymentLink: r.payment_link || null,
    notes: r.notes || "",
    dueDate: r.due_date || null,
    sentAt: r.sent_at || null,
    paidAt: r.paid_at || null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function buildInvoiceEmailHtml(invoice: Invoice, paymentLink: string): string {
  const dueDateStr = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  const lineItemsHtml = invoice.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${item.description}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">$${item.unitPrice.toFixed(2)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">$${(item.quantity * item.unitPrice).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const absoluteLink = paymentLink.startsWith("http")
    ? paymentLink
    : `${APP_BASE_URL}${paymentLink}`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background:#0a0a0f;padding:32px 40px;">
      <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">UpTend</p>
      <p style="margin:4px 0 0;font-size:13px;color:#9ca3af;">UPYCK, Inc. d/b/a UpTend · Orlando, FL</p>
    </div>

    <!-- Body -->
    <div style="padding:32px 40px;">
      <h2 style="margin:0 0 4px;font-size:24px;color:#111827;">Invoice #${invoice.id}</h2>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">
        For: <strong>${invoice.customerName}</strong>
        ${dueDateStr ? `&nbsp;·&nbsp; Due: <strong>${dueDateStr}</strong>` : ""}
      </p>

      <!-- Line Items Table -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="padding:10px 12px;text-align:left;color:#374151;font-weight:600;">Description</th>
            <th style="padding:10px 12px;text-align:center;color:#374151;font-weight:600;">Qty</th>
            <th style="padding:10px 12px;text-align:right;color:#374151;font-weight:600;">Unit Price</th>
            <th style="padding:10px 12px;text-align:right;color:#374151;font-weight:600;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${lineItemsHtml}
        </tbody>
      </table>

      <!-- Totals -->
      <table style="width:240px;margin-left:auto;font-size:14px;border-collapse:collapse;">
        <tr>
          <td style="padding:4px 12px;color:#6b7280;">Subtotal</td>
          <td style="padding:4px 12px;text-align:right;color:#374151;">$${invoice.subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding:4px 12px;color:#6b7280;">Tax (${(invoice.taxRate * 100).toFixed(1)}%)</td>
          <td style="padding:4px 12px;text-align:right;color:#374151;">$${invoice.taxAmount.toFixed(2)}</td>
        </tr>
        <tr style="border-top:2px solid #e5e7eb;">
          <td style="padding:10px 12px;font-weight:700;font-size:16px;color:#111827;">Total</td>
          <td style="padding:10px 12px;font-weight:700;font-size:16px;color:#111827;text-align:right;">$${invoice.total.toFixed(2)}</td>
        </tr>
      </table>

      ${invoice.notes ? `<p style="margin:24px 0 0;padding:16px;background:#f9fafb;border-radius:8px;font-size:13px;color:#6b7280;">${invoice.notes}</p>` : ""}

      <!-- CTA Button -->
      <div style="text-align:center;margin:32px 0 0;">
        <a href="${absoluteLink}"
           style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
          Pay Now — $${invoice.total.toFixed(2)}
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:20px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">
        UPYCK, Inc. d/b/a UpTend · 10125 Peebles St, Orlando, FL 32827<br>
        Questions? Reply to this email or contact your service provider.
      </p>
    </div>
  </div>
</body>
</html>`;
}

function buildReminderEmailHtml(invoice: Invoice, paymentLink: string): string {
  const dueDateStr = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  const absoluteLink = paymentLink.startsWith("http")
    ? paymentLink
    : `${APP_BASE_URL}${paymentLink}`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:#dc2626;padding:24px 40px;">
      <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;">Payment Reminder</p>
    </div>
    <div style="padding:32px 40px;">
      <p style="margin:0 0 16px;color:#374151;">Hi ${invoice.customerName},</p>
      <p style="margin:0 0 16px;color:#374151;">
        This is a friendly reminder that Invoice #${invoice.id} for
        <strong>$${invoice.total.toFixed(2)}</strong>${dueDateStr ? ` is due on <strong>${dueDateStr}</strong>` : " is outstanding"}.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${absoluteLink}"
           style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
          Pay Now — $${invoice.total.toFixed(2)}
        </a>
      </div>
      <p style="margin:0;color:#6b7280;font-size:13px;">
        If you have already paid or have questions, please contact your service provider.
      </p>
    </div>
    <div style="padding:20px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">UPYCK, Inc. d/b/a UpTend · 10125 Peebles St, Orlando, FL 32827</p>
    </div>
  </div>
</body>
</html>`;
}

// ============================================================
// Functions
// ============================================================

/**
 * Create a new invoice with line items, auto-calculating totals.
 * Default tax rate is 7% (Florida).
 */
export async function createInvoice(
  partnerSlug: string,
  customerData: InvoiceCustomerData,
  items: InvoiceItem[],
  notes: string = "",
  dueDate: string | null = null,
  taxRate: number = 0.07
): Promise<Invoice> {
  await ensureInvoicingTables();
  try {
    const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
    const total = Math.round((subtotal + taxAmount) * 100) / 100;

    const result = await db.execute(sql`
      INSERT INTO partner_invoices (partner_slug, customer_name, customer_email, customer_phone, items, subtotal, tax_rate, tax_amount, total, notes, due_date)
      VALUES (${partnerSlug}, ${customerData.name}, ${customerData.email}, ${customerData.phone}, ${JSON.stringify(items)}::jsonb, ${subtotal}, ${taxRate}, ${taxAmount}, ${total}, ${notes}, ${dueDate ? dueDate : null})
      RETURNING *
    `);

    const invoice = mapInvoiceRow((result.rows as any[])[0]);

    // Insert line items
    for (const item of items) {
      const lineTotal = Math.round(item.quantity * item.unitPrice * 100) / 100;
      await db.execute(sql`
        INSERT INTO partner_invoice_items (invoice_id, description, quantity, unit_price, total)
        VALUES (${invoice.id}, ${item.description}, ${item.quantity}, ${item.unitPrice}, ${lineTotal})
      `);
    }

    return invoice;
  } catch (err: any) {
    console.error("[Invoicing] createInvoice error:", err);
    throw new Error("Failed to create invoice: " + err.message);
  }
}

/**
 * Mark invoice as sent, create Stripe Checkout Session, email customer.
 */
export async function sendInvoice(invoiceId: number): Promise<{ paymentLink: string }> {
  await ensureInvoicingTables();
  try {
    const invoice = await getInvoice(invoiceId);
    if (!invoice) throw new Error("Invoice not found");

    // Build Stripe Checkout or fallback to simple link
    let paymentLink = `${APP_BASE_URL}/pay/invoice/${invoiceId}`;
    let stripeCheckoutUrl: string | null = null;

    const stripe = getStripe();
    if (stripe && invoice.total > 0) {
      try {
        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = invoice.items.map((item) => ({
          price_data: {
            currency: "usd",
            product_data: {
              name: item.description || "Service",
            },
            unit_amount: Math.round(item.unitPrice * 100),
          },
          quantity: item.quantity,
        }));

        // Add tax as a separate line if present
        if (invoice.taxAmount > 0) {
          lineItems.push({
            price_data: {
              currency: "usd",
              product_data: { name: `Tax (${(invoice.taxRate * 100).toFixed(1)}%)` },
              unit_amount: Math.round(invoice.taxAmount * 100),
            },
            quantity: 1,
          });
        }

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: lineItems,
          mode: "payment",
          customer_email: invoice.customerEmail || undefined,
          success_url: `${APP_BASE_URL}/pay/invoice/${invoiceId}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${APP_BASE_URL}/pay/invoice/${invoiceId}`,
          metadata: {
            invoiceId: String(invoiceId),
            partnerSlug: invoice.partnerSlug,
          },
        });

        stripeCheckoutUrl = session.url;
        if (stripeCheckoutUrl) paymentLink = stripeCheckoutUrl;
      } catch (stripeErr: any) {
        console.warn("[Invoicing] Stripe session creation failed, using fallback link:", stripeErr.message);
      }
    }

    await db.execute(sql`
      UPDATE partner_invoices
      SET status = 'sent', sent_at = NOW(), payment_link = ${paymentLink}, updated_at = NOW()
      WHERE id = ${invoiceId} AND status = 'draft'
    `);

    // Send email via SendGrid
    if (invoice.customerEmail && process.env.SENDGRID_API_KEY) {
      try {
        await sgMail.send({
          to: invoice.customerEmail,
          from: FROM_EMAIL,
          subject: `Invoice #${invoiceId} from UpTend — $${invoice.total.toFixed(2)}`,
          html: buildInvoiceEmailHtml(invoice, paymentLink),
        });
        console.log(`[Invoicing] Email sent to ${invoice.customerEmail} for invoice #${invoiceId}`);
      } catch (emailErr: any) {
        console.warn("[Invoicing] Email send failed:", emailErr.message);
      }
    }

    return { paymentLink };
  } catch (err: any) {
    console.error("[Invoicing] sendInvoice error:", err);
    throw new Error("Failed to send invoice: " + err.message);
  }
}

/**
 * Get a full invoice with its line items.
 */
export async function getInvoice(invoiceId: number): Promise<Invoice | null> {
  await ensureInvoicingTables();
  try {
    const result = await db.execute(sql`
      SELECT * FROM partner_invoices WHERE id = ${invoiceId}
    `);
    if (!result.rows.length) return null;
    const invoice = mapInvoiceRow((result.rows as any[])[0]);

    const itemsResult = await db.execute(sql`
      SELECT * FROM partner_invoice_items WHERE invoice_id = ${invoiceId} ORDER BY id
    `);
    invoice.items = (itemsResult.rows as any[]).map(r => ({
      description: r.description,
      quantity: parseFloat(r.quantity),
      unitPrice: parseFloat(r.unit_price),
    }));

    return invoice;
  } catch (err: any) {
    console.error("[Invoicing] getInvoice error:", err);
    throw new Error("Failed to get invoice: " + err.message);
  }
}

/**
 * List invoices for a partner with optional status and date range filters.
 */
export async function listInvoices(
  partnerSlug: string,
  filters: { status?: string; startDate?: string; endDate?: string; limit?: number; offset?: number } = {}
): Promise<Invoice[]> {
  await ensureInvoicingTables();
  try {
    const r = await db.execute(sql`
      SELECT * FROM partner_invoices
      WHERE partner_slug = ${partnerSlug}
        AND (${filters.status || null}::text IS NULL OR status = ${filters.status || ''})
        AND (${filters.startDate || null}::timestamptz IS NULL OR created_at >= ${filters.startDate || '1970-01-01'})
        AND (${filters.endDate || null}::timestamptz IS NULL OR created_at <= ${filters.endDate || '2099-12-31'})
      ORDER BY created_at DESC
      LIMIT ${filters.limit || 50} OFFSET ${filters.offset || 0}
    `);

    return (r.rows as any[]).map(mapInvoiceRow);
  } catch (err: any) {
    console.error("[Invoicing] listInvoices error:", err);
    throw new Error("Failed to list invoices: " + err.message);
  }
}

/**
 * Record a payment against an invoice. Marks as paid if fully paid.
 */
export async function recordPayment(
  invoiceId: number,
  amount: number,
  method: "card" | "cash" | "check" | "ach",
  stripePaymentId: string = ""
): Promise<PaymentRecord> {
  await ensureInvoicingTables();
  try {
    const result = await db.execute(sql`
      INSERT INTO partner_payment_records (invoice_id, amount, method, stripe_payment_id)
      VALUES (${invoiceId}, ${amount}, ${method}, ${stripePaymentId})
      RETURNING *
    `);

    // Check total payments
    const paymentsResult = await db.execute(sql`
      SELECT COALESCE(SUM(amount), 0) as total_paid FROM partner_payment_records WHERE invoice_id = ${invoiceId}
    `);
    const totalPaid = parseFloat((paymentsResult.rows[0] as any).total_paid) || 0;

    const invoiceResult = await db.execute(sql`
      SELECT total FROM partner_invoices WHERE id = ${invoiceId}
    `);
    const invoiceTotal = parseFloat((invoiceResult.rows[0] as any)?.total) || 0;

    if (totalPaid >= invoiceTotal) {
      await db.execute(sql`
        UPDATE partner_invoices SET status = 'paid', paid_at = NOW(), updated_at = NOW() WHERE id = ${invoiceId}
      `);
    }

    const row = (result.rows as any[])[0];
    return {
      id: row.id,
      invoiceId: row.invoice_id,
      amount: parseFloat(row.amount),
      method: row.method,
      stripePaymentId: row.stripe_payment_id || null,
      recordedAt: row.recorded_at,
    };
  } catch (err: any) {
    console.error("[Invoicing] recordPayment error:", err);
    throw new Error("Failed to record payment: " + err.message);
  }
}

/**
 * Void an invoice.
 */
export async function voidInvoice(invoiceId: number): Promise<void> {
  await ensureInvoicingTables();
  try {
    await db.execute(sql`
      UPDATE partner_invoices SET status = 'void', updated_at = NOW() WHERE id = ${invoiceId}
    `);
  } catch (err: any) {
    console.error("[Invoicing] voidInvoice error:", err);
    throw new Error("Failed to void invoice: " + err.message);
  }
}

/**
 * Get overdue invoices for a partner (past due date, not paid/void).
 */
export async function getOverdueInvoices(partnerSlug: string): Promise<Invoice[]> {
  await ensureInvoicingTables();
  try {
    const result = await db.execute(sql`
      SELECT * FROM partner_invoices
      WHERE partner_slug = ${partnerSlug}
        AND due_date < NOW()
        AND status NOT IN ('paid', 'void', 'draft')
      ORDER BY due_date ASC
    `);
    return (result.rows as any[]).map(mapInvoiceRow);
  } catch (err: any) {
    console.error("[Invoicing] getOverdueInvoices error:", err);
    throw new Error("Failed to get overdue invoices: " + err.message);
  }
}

/**
 * Send a payment reminder email to the customer.
 */
export async function sendPaymentReminder(invoiceId: number): Promise<{ reminderText: string }> {
  await ensureInvoicingTables();
  try {
    const invoice = await getInvoice(invoiceId);
    if (!invoice) throw new Error("Invoice not found");

    const paymentLink = invoice.paymentLink || `/pay/invoice/${invoiceId}`;
    const reminderText = `Payment Reminder: Invoice #${invoice.id} for $${invoice.total.toFixed(2)} is due${invoice.dueDate ? ` on ${new Date(invoice.dueDate).toLocaleDateString()}` : ""}. Please submit payment at your earliest convenience.${paymentLink ? ` Pay here: ${paymentLink}` : ""}`;

    // Send reminder email via SendGrid
    if (invoice.customerEmail && process.env.SENDGRID_API_KEY) {
      try {
        await sgMail.send({
          to: invoice.customerEmail,
          from: FROM_EMAIL,
          subject: `Payment Reminder: Invoice #${invoiceId} — $${invoice.total.toFixed(2)} Due`,
          html: buildReminderEmailHtml(invoice, paymentLink),
        });
        console.log(`[Invoicing] Reminder email sent to ${invoice.customerEmail} for invoice #${invoiceId}`);
      } catch (emailErr: any) {
        console.warn("[Invoicing] Reminder email failed:", emailErr.message);
      }
    }

    return { reminderText };
  } catch (err: any) {
    console.error("[Invoicing] sendPaymentReminder error:", err);
    throw new Error("Failed to generate reminder: " + err.message);
  }
}

/**
 * Get invoicing statistics for a partner.
 */
export async function getInvoiceStats(partnerSlug: string): Promise<{
  totalOutstanding: number;
  totalCollected: number;
  avgDaysToPay: number;
  overdueCount: number;
}> {
  await ensureInvoicingTables();
  try {
    const outstandingResult = await db.execute(sql`
      SELECT COALESCE(SUM(total), 0) as amount FROM partner_invoices
      WHERE partner_slug = ${partnerSlug} AND status IN ('sent', 'viewed', 'overdue')
    `);

    const collectedResult = await db.execute(sql`
      SELECT COALESCE(SUM(total), 0) as amount FROM partner_invoices
      WHERE partner_slug = ${partnerSlug} AND status = 'paid'
    `);

    const avgDaysResult = await db.execute(sql`
      SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (paid_at - sent_at)) / 86400), 0) as avg_days
      FROM partner_invoices
      WHERE partner_slug = ${partnerSlug} AND status = 'paid' AND sent_at IS NOT NULL AND paid_at IS NOT NULL
    `);

    const overdueResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM partner_invoices
      WHERE partner_slug = ${partnerSlug} AND due_date < NOW() AND status NOT IN ('paid', 'void', 'draft')
    `);

    return {
      totalOutstanding: parseFloat((outstandingResult.rows[0] as any).amount) || 0,
      totalCollected: parseFloat((collectedResult.rows[0] as any).amount) || 0,
      avgDaysToPay: Math.round(parseFloat((avgDaysResult.rows[0] as any).avg_days) || 0),
      overdueCount: parseInt((overdueResult.rows[0] as any).count) || 0,
    };
  } catch (err: any) {
    console.error("[Invoicing] getInvoiceStats error:", err);
    throw new Error("Failed to get invoice stats: " + err.message);
  }
}
