/**
 * Digital Signatures Service
 *
 * E-signature capture and verification for estimates, invoices,
 * agreements, and work orders.
 */

import { db } from "../db";
import { sql } from "drizzle-orm";
import crypto from "crypto";

// ============================================================
// Database Setup
// ============================================================

async function ensureSignatureTables(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS partner_signatures (
        id SERIAL PRIMARY KEY,
        partner_slug TEXT NOT NULL,
        document_type TEXT NOT NULL CHECK (document_type IN ('estimate', 'invoice', 'agreement', 'work_order')),
        document_id TEXT NOT NULL,
        signer_name TEXT NOT NULL,
        signer_email TEXT DEFAULT '',
        signature_data TEXT DEFAULT '',
        signing_token TEXT UNIQUE,
        ip_address TEXT DEFAULT '',
        user_agent TEXT DEFAULT '',
        signed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  } catch (err) {
    console.error("[Signatures] Table creation error:", err);
  }
}

// ============================================================
// Functions
// ============================================================

/**
 * Create a signature request and return a unique signing URL token.
 * @param partnerSlug - Partner identifier
 * @param documentType - Type of document (estimate, invoice, agreement, work_order)
 * @param documentId - Document identifier
 * @param signerName - Name of the person who will sign
 * @param signerEmail - Email of the signer
 * @returns Object with signature request id and signing token
 */
export async function createSignatureRequest(
  partnerSlug: string,
  documentType: string,
  documentId: string,
  signerName: string,
  signerEmail: string
): Promise<{ id: number; signingToken: string }> {
  try {
    await ensureSignatureTables();
    const signingToken = crypto.randomBytes(32).toString("hex");
    const result = await db.execute(sql`
      INSERT INTO partner_signatures
        (partner_slug, document_type, document_id, signer_name, signer_email, signing_token)
      VALUES (${partnerSlug}, ${documentType}, ${documentId}, ${signerName}, ${signerEmail}, ${signingToken})
      RETURNING id
    `);
    const id = (result.rows[0] as any)?.id || 0;
    return { id, signingToken };
  } catch (err) {
    console.error("[Signatures] createSignatureRequest error:", err);
    throw err;
  }
}

/**
 * Record a signature using a signing token.
 * @param token - The unique signing token
 * @param signatureData - Base64-encoded signature image or SVG path data
 * @param ipAddress - IP address of the signer
 * @param userAgent - User agent string of the signer's browser
 * @returns The signature record id
 */
export async function recordSignature(
  token: string,
  signatureData: string,
  ipAddress: string,
  userAgent: string
): Promise<{ id: number; success: boolean }> {
  try {
    await ensureSignatureTables();
    const result = await db.execute(sql`
      UPDATE partner_signatures
      SET signature_data = ${signatureData},
          ip_address = ${ipAddress},
          user_agent = ${userAgent},
          signed_at = NOW()
      WHERE signing_token = ${token} AND signed_at IS NULL
      RETURNING id
    `);
    const row = result.rows[0] as any;
    if (!row) {
      return { id: 0, success: false };
    }
    return { id: row.id, success: true };
  } catch (err) {
    console.error("[Signatures] recordSignature error:", err);
    throw err;
  }
}

/**
 * Verify a signature by its id — returns full details for audit trail.
 * @param signatureId - The signature record id
 */
export async function verifySignature(signatureId: number): Promise<any | null> {
  try {
    await ensureSignatureTables();
    const result = await db.execute(sql`
      SELECT id, partner_slug, document_type, document_id, signer_name, signer_email,
             ip_address, user_agent, signed_at, created_at
      FROM partner_signatures
      WHERE id = ${signatureId}
    `);
    return (result.rows[0] as any) || null;
  } catch (err) {
    console.error("[Signatures] verifySignature error:", err);
    return null;
  }
}

/**
 * Get all signatures for a specific document.
 * @param documentType - Type of document
 * @param documentId - Document identifier
 */
export async function getSignaturesForDocument(
  documentType: string,
  documentId: string
): Promise<any[]> {
  try {
    await ensureSignatureTables();
    const result = await db.execute(sql`
      SELECT id, partner_slug, document_type, document_id, signer_name, signer_email,
             ip_address, user_agent, signed_at, created_at
      FROM partner_signatures
      WHERE document_type = ${documentType} AND document_id = ${documentId}
      ORDER BY created_at DESC
    `);
    return result.rows as any[];
  } catch (err) {
    console.error("[Signatures] getSignaturesForDocument error:", err);
    return [];
  }
}

/**
 * Get signature statistics for a partner.
 * @param partnerSlug - Partner identifier
 * @returns Total requested, total signed, and average time to sign in minutes
 */
export async function getSignatureStats(
  partnerSlug: string
): Promise<{ totalRequested: number; totalSigned: number; avgTimeToSignMinutes: number }> {
  try {
    await ensureSignatureTables();
    const result = await db.execute(sql`
      SELECT
        COUNT(*)::int AS total_requested,
        COUNT(signed_at)::int AS total_signed,
        COALESCE(AVG(EXTRACT(EPOCH FROM (signed_at - created_at)) / 60), 0)::numeric AS avg_time_minutes
      FROM partner_signatures
      WHERE partner_slug = ${partnerSlug}
    `);
    const row = result.rows[0] as any;
    return {
      totalRequested: row?.total_requested || 0,
      totalSigned: row?.total_signed || 0,
      avgTimeToSignMinutes: parseFloat(row?.avg_time_minutes || "0"),
    };
  } catch (err) {
    console.error("[Signatures] getSignatureStats error:", err);
    return { totalRequested: 0, totalSigned: 0, avgTimeToSignMinutes: 0 };
  }
}

/**
 * Check if a document has been signed.
 * @param documentType - Type of document
 * @param documentId - Document identifier
 * @returns true if at least one signature exists with a signed_at timestamp
 */
export async function isDocumentSigned(
  documentType: string,
  documentId: string
): Promise<boolean> {
  try {
    await ensureSignatureTables();
    const result = await db.execute(sql`
      SELECT EXISTS(
        SELECT 1 FROM partner_signatures
        WHERE document_type = ${documentType} AND document_id = ${documentId} AND signed_at IS NOT NULL
      ) AS is_signed
    `);
    return (result.rows[0] as any)?.is_signed || false;
  } catch (err) {
    console.error("[Signatures] isDocumentSigned error:", err);
    return false;
  }
}
