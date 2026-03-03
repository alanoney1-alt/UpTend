/**
 * Call Tracking Service
 * Track calls by marketing source for attribution and ROI analysis
 */

import { pool } from "../db";

async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS partner_tracking_numbers (
      id SERIAL PRIMARY KEY,
      partner_slug TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      source TEXT NOT NULL,
      campaign TEXT,
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS partner_call_logs (
      id SERIAL PRIMARY KEY,
      partner_slug TEXT NOT NULL,
      tracking_number_id INT REFERENCES partner_tracking_numbers(id),
      caller_phone TEXT,
      caller_name TEXT,
      duration_seconds INT DEFAULT 0,
      recording_url TEXT,
      source TEXT,
      campaign TEXT,
      converted BOOLEAN DEFAULT FALSE,
      notes TEXT,
      called_at TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

ensureTables().catch(console.error);

/** Add a tracking phone number for a marketing source */
export async function addTrackingNumber(partnerSlug: string, phoneNumber: string, source: string, campaign?: string) {
  try {
    const result = await pool.query(
      `INSERT INTO partner_tracking_numbers (partner_slug, phone_number, source, campaign) VALUES ($1, $2, $3, $4) RETURNING *`,
      [partnerSlug, phoneNumber, source, campaign || null]
    );
    return result.rows[0];
  } catch (err) {
    console.error("addTrackingNumber error:", err);
    throw err;
  }
}

/** List all tracking numbers for a partner */
export async function listTrackingNumbers(partnerSlug: string) {
  try {
    const result = await pool.query(
      `SELECT tn.*, COUNT(cl.id) as total_calls, 
       COUNT(CASE WHEN cl.converted THEN 1 END) as converted_calls
       FROM partner_tracking_numbers tn
       LEFT JOIN partner_call_logs cl ON cl.tracking_number_id = tn.id
       WHERE tn.partner_slug = $1
       GROUP BY tn.id ORDER BY tn.created_at DESC`,
      [partnerSlug]
    );
    return result.rows;
  } catch (err) {
    console.error("listTrackingNumbers error:", err);
    throw err;
  }
}

/** Log an incoming call */
export async function logCall(
  partnerSlug: string,
  trackingNumberId: number,
  callerPhone: string,
  callerName?: string,
  durationSeconds?: number,
  recordingUrl?: string
) {
  try {
    // Get source from tracking number
    const tn = await pool.query(`SELECT source, campaign FROM partner_tracking_numbers WHERE id = $1`, [trackingNumberId]);
    const source = tn.rows[0]?.source || "unknown";
    const campaign = tn.rows[0]?.campaign || null;

    const result = await pool.query(
      `INSERT INTO partner_call_logs (partner_slug, tracking_number_id, caller_phone, caller_name, duration_seconds, recording_url, source, campaign)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [partnerSlug, trackingNumberId, callerPhone, callerName || null, durationSeconds || 0, recordingUrl || null, source, campaign]
    );
    return result.rows[0];
  } catch (err) {
    console.error("logCall error:", err);
    throw err;
  }
}

/** Mark a call as converted to a job */
export async function markCallConverted(callId: number, notes?: string) {
  try {
    const result = await pool.query(
      `UPDATE partner_call_logs SET converted = TRUE, notes = COALESCE($2, notes) WHERE id = $1 RETURNING *`,
      [callId, notes || null]
    );
    return result.rows[0];
  } catch (err) {
    console.error("markCallConverted error:", err);
    throw err;
  }
}

/** Get call report by source */
export async function getCallReport(partnerSlug: string, startDate?: string, endDate?: string) {
  try {
    let query = `SELECT source, campaign,
      COUNT(*) as total_calls,
      COUNT(CASE WHEN converted THEN 1 END) as converted_calls,
      ROUND(COUNT(CASE WHEN converted THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 1) as conversion_rate,
      ROUND(AVG(duration_seconds)::numeric, 0) as avg_duration_seconds
      FROM partner_call_logs WHERE partner_slug = $1`;
    const params: any[] = [partnerSlug];

    if (startDate) {
      params.push(startDate);
      query += ` AND called_at >= $${params.length}::timestamp`;
    }
    if (endDate) {
      params.push(endDate);
      query += ` AND called_at <= $${params.length}::timestamp`;
    }

    query += ` GROUP BY source, campaign ORDER BY total_calls DESC`;
    const result = await pool.query(query, params);
    return result.rows;
  } catch (err) {
    console.error("getCallReport error:", err);
    throw err;
  }
}

/** Get marketing ROI summary */
export async function getMarketingROI(partnerSlug: string) {
  try {
    const result = await pool.query(
      `SELECT source,
        COUNT(*) as total_calls,
        COUNT(CASE WHEN converted THEN 1 END) as conversions,
        ROUND(COUNT(CASE WHEN converted THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 1) as conversion_rate,
        ROUND(AVG(duration_seconds)::numeric, 0) as avg_call_duration
       FROM partner_call_logs WHERE partner_slug = $1
       GROUP BY source ORDER BY conversions DESC`,
      [partnerSlug]
    );
    return {
      sources: result.rows,
      summary: {
        totalCalls: result.rows.reduce((s: number, r: any) => s + parseInt(r.total_calls), 0),
        totalConversions: result.rows.reduce((s: number, r: any) => s + parseInt(r.conversions), 0),
        topSource: result.rows[0]?.source || "none"
      }
    };
  } catch (err) {
    console.error("getMarketingROI error:", err);
    throw err;
  }
}
