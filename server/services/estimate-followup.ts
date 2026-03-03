/**
 * Partner Estimate Follow-Up System
 * 
 * Automated follow-up tracking on unsold estimates.
 * Converts accepted estimates to invoices via the invoicing system.
 */

import { db } from "../db";
import { sql } from "drizzle-orm";
import { createInvoice } from "./invoicing-system";

// ============================================================
// Types
// ============================================================

export interface Estimate {
  id: number;
  partnerSlug: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceType: string;
  description: string;
  amount: number;
  status: "sent" | "viewed" | "accepted" | "declined" | "expired";
  followUpCount: number;
  lastFollowUpAt: string | null;
  createdAt: string;
  expiresAt: string;
}

// ============================================================
// Database Setup
// ============================================================

export async function ensureEstimateTables(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS partner_estimates (
        id SERIAL PRIMARY KEY,
        partner_slug TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        customer_email TEXT DEFAULT '',
        customer_phone TEXT DEFAULT '',
        service_type TEXT DEFAULT '',
        description TEXT DEFAULT '',
        amount NUMERIC(12,2) DEFAULT 0,
        status TEXT DEFAULT 'sent' CHECK (status IN ('sent','viewed','accepted','declined','expired')),
        follow_up_count INTEGER DEFAULT 0,
        last_follow_up_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ
      )
    `);
  } catch (err) {
    console.error("[EstimateFollowUp] Table creation error:", err);
  }
}

function mapEstimateRow(r: any): Estimate {
  return {
    id: r.id,
    partnerSlug: r.partner_slug,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    customerPhone: r.customer_phone,
    serviceType: r.service_type,
    description: r.description,
    amount: parseFloat(r.amount) || 0,
    status: r.status,
    followUpCount: r.follow_up_count || 0,
    lastFollowUpAt: r.last_follow_up_at || null,
    createdAt: r.created_at,
    expiresAt: r.expires_at,
  };
}

// ============================================================
// Functions
// ============================================================

/**
 * Create a new estimate for a customer.
 */
export async function createEstimate(
  partnerSlug: string,
  customer: { name: string; email: string; phone: string },
  serviceType: string,
  description: string,
  amount: number,
  expiresInDays: number = 30
): Promise<Estimate> {
  await ensureEstimateTables();
  try {
    const result = await db.execute(sql`
      INSERT INTO partner_estimates (partner_slug, customer_name, customer_email, customer_phone, service_type, description, amount, expires_at)
      VALUES (${partnerSlug}, ${customer.name}, ${customer.email}, ${customer.phone}, ${serviceType}, ${description}, ${amount}, NOW() + ${expiresInDays + ' days'})
      RETURNING *
    `);
    return mapEstimateRow((result.rows as any[])[0]);
  } catch (err: any) {
    console.error("[EstimateFollowUp] createEstimate error:", err);
    throw new Error("Failed to create estimate: " + err.message);
  }
}

/**
 * Get estimates due for follow-up: 24h, 72h, or 7d after creation with no recent follow-up.
 */
export async function getEstimatesDueForFollowUp(partnerSlug: string): Promise<Estimate[]> {
  await ensureEstimateTables();
  try {
    const result = await db.execute(sql`
      SELECT * FROM partner_estimates
      WHERE partner_slug = ${partnerSlug}
        AND status IN ('sent', 'viewed')
        AND expires_at > NOW()
        AND (
          (follow_up_count = 0 AND created_at <= NOW() - INTERVAL '24 hours')
          OR (follow_up_count = 1 AND created_at <= NOW() - INTERVAL '72 hours')
          OR (follow_up_count = 2 AND created_at <= NOW() - INTERVAL '7 days')
        )
        AND (last_follow_up_at IS NULL OR last_follow_up_at <= NOW() - INTERVAL '24 hours')
      ORDER BY created_at ASC
    `);
    return (result.rows as any[]).map(mapEstimateRow);
  } catch (err: any) {
    console.error("[EstimateFollowUp] getEstimatesDueForFollowUp error:", err);
    throw new Error("Failed to get follow-up estimates: " + err.message);
  }
}

/**
 * Mark a follow-up as sent for an estimate.
 */
export async function markFollowUpSent(estimateId: number): Promise<void> {
  await ensureEstimateTables();
  try {
    await db.execute(sql`
      UPDATE partner_estimates
      SET follow_up_count = follow_up_count + 1, last_follow_up_at = NOW()
      WHERE id = ${estimateId}
    `);
  } catch (err: any) {
    console.error("[EstimateFollowUp] markFollowUpSent error:", err);
    throw new Error("Failed to mark follow-up: " + err.message);
  }
}

/**
 * Accept an estimate and convert it to an invoice via the invoicing system.
 */
export async function acceptEstimate(estimateId: number): Promise<{ invoiceId: number }> {
  await ensureEstimateTables();
  try {
    const result = await db.execute(sql`
      UPDATE partner_estimates SET status = 'accepted' WHERE id = ${estimateId} RETURNING *
    `);
    const estimate = mapEstimateRow((result.rows as any[])[0]);

    const invoice = await createInvoice(
      estimate.partnerSlug,
      { name: estimate.customerName, email: estimate.customerEmail, phone: estimate.customerPhone },
      [{ description: `${estimate.serviceType} - ${estimate.description}`, quantity: 1, unitPrice: estimate.amount }],
      `Converted from estimate #${estimateId}`
    );

    return { invoiceId: invoice.id };
  } catch (err: any) {
    console.error("[EstimateFollowUp] acceptEstimate error:", err);
    throw new Error("Failed to accept estimate: " + err.message);
  }
}

/**
 * Decline an estimate with an optional reason.
 */
export async function declineEstimate(estimateId: number, reason?: string): Promise<void> {
  await ensureEstimateTables();
  try {
    await db.execute(sql`
      UPDATE partner_estimates SET status = 'declined' WHERE id = ${estimateId}
    `);
  } catch (err: any) {
    console.error("[EstimateFollowUp] declineEstimate error:", err);
    throw new Error("Failed to decline estimate: " + err.message);
  }
}

/**
 * Get estimate conversion rate: accepted / total sent.
 */
export async function getEstimateConversionRate(partnerSlug: string): Promise<{ total: number; accepted: number; rate: number }> {
  await ensureEstimateTables();
  try {
    const result = await db.execute(sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'accepted') as accepted
      FROM partner_estimates
      WHERE partner_slug = ${partnerSlug}
    `);
    const row = result.rows[0] as any;
    const total = parseInt(row.total) || 0;
    const accepted = parseInt(row.accepted) || 0;
    return { total, accepted, rate: total > 0 ? Math.round((accepted / total) * 10000) / 100 : 0 };
  } catch (err: any) {
    console.error("[EstimateFollowUp] getEstimateConversionRate error:", err);
    throw new Error("Failed to get conversion rate: " + err.message);
  }
}

/**
 * List estimates for a partner with optional filters.
 */
export async function listEstimates(
  partnerSlug: string,
  filters: { status?: string; limit?: number; offset?: number } = {}
): Promise<Estimate[]> {
  await ensureEstimateTables();
  try {
    const result = await db.execute(sql`
      SELECT * FROM partner_estimates
      WHERE partner_slug = ${partnerSlug}
        AND (${filters.status || null}::text IS NULL OR status = ${filters.status || ''})
      ORDER BY created_at DESC
      LIMIT ${filters.limit || 50} OFFSET ${filters.offset || 0}
    `);
    return (result.rows as any[]).map(mapEstimateRow);
  } catch (err: any) {
    console.error("[EstimateFollowUp] listEstimates error:", err);
    throw new Error("Failed to list estimates: " + err.message);
  }
}
