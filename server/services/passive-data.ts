/**
 * Passive Data Collection Pipeline
 *
 * Collects home data from conversations, pro reports, and scans.
 * Builds a rich home profile over time without surveys.
 * Every question George asks is tied to a bookable service.
 */

import { pool } from "../db";

export interface DataPoint {
  id: string;
  customerId: string;
  dataType: string;
  source: string;
  key: string;
  value: string | null;
  confidence: string;
  collectedAt: string;
  verifiedBy: string | null;
}

// ─── Collect from Chat ─────────────────────────────────────

export async function collectFromChat(
  customerId: string,
  georgeConversation: string
): Promise<DataPoint[]> {
  // AI-powered extraction of data points from natural conversation
  // In production, this calls Claude to parse the conversation
  const extracted = extractDataPoints(georgeConversation);
  const saved: DataPoint[] = [];

  for (const dp of extracted) {
    const { rows } = await pool.query(
      `INSERT INTO passive_data_points (customer_id, data_type, source, key, value, confidence, verified_by)
       VALUES ($1, $2, 'george_chat', $3, $4, $5, 'ai')
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [customerId, dp.dataType, dp.key, dp.value, dp.confidence]
    );
    if (rows.length > 0) saved.push(mapDataPoint(rows[0]));
  }

  return saved;
}

// ─── Collect from Pro Report ───────────────────────────────

export async function collectFromProReport(
  proId: string,
  jobId: string,
  report: {
    customerId: string;
    reportType: string;
    details: Record<string, any>;
    photos?: string[];
  }
): Promise<string> {
  const { rows } = await pool.query(
    `INSERT INTO pro_site_reports (pro_id, job_id, customer_id, report_type, details, photos)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [proId, jobId, report.customerId, report.reportType, JSON.stringify(report.details), JSON.stringify(report.photos ?? [])]
  );

  const reportId = rows[0].id;

  // Extract data points from the report details
  for (const [key, value] of Object.entries(report.details)) {
    await pool.query(
      `INSERT INTO passive_data_points (customer_id, data_type, source, key, value, confidence, verified_by)
       VALUES ($1, $2, 'pro_report', $3, $4, 'high', 'pro')
       ON CONFLICT DO NOTHING`,
      [report.customerId, categorizeKey(key), key, String(value)]
    );
  }

  // Mark as processed
  await pool.query(
    `UPDATE pro_site_reports SET george_processed = true WHERE id = $1`,
    [reportId]
  );

  return reportId;
}

// ─── Collect from Scan ─────────────────────────────────────

export async function collectFromScan(
  customerId: string,
  scanResults: Record<string, any>
): Promise<number> {
  let count = 0;
  for (const [key, value] of Object.entries(scanResults)) {
    await pool.query(
      `INSERT INTO passive_data_points (customer_id, data_type, source, key, value, confidence, verified_by)
       VALUES ($1, $2, 'scan', $3, $4, 'high', 'ai')
       ON CONFLICT DO NOTHING`,
      [customerId, categorizeKey(key), key, String(value)]
    );
    count++;
  }
  return count;
}

// ─── Get Next Question ─────────────────────────────────────

export async function getNextQuestion(
  customerId: string
): Promise<{ question: string; dataKey: string; relatedService: string } | null> {
  // Questions tied to bookable services - NEVER a survey
  const questionBank = [
    { key: "ac_age", dataType: "appliance", question: "By the way, do you know roughly how old your AC unit is? Older ones can spike your energy bill.", relatedService: "hvac_maintenance" },
    { key: "roof_age", dataType: "condition", question: "How long has your roof been up there? After 15 years, a quick inspection can catch problems before they get expensive.", relatedService: "roof_inspection" },
    { key: "gutter_last_cleaned", dataType: "condition", question: "When's the last time your gutters got some love? With Orlando's rain, clogged gutters can cause real damage.", relatedService: "gutter_cleaning" },
    { key: "pool_type", dataType: "appliance", question: "Do you have a pool? If so, is it chlorine or saltwater?", relatedService: "pool_maintenance" },
    { key: "lawn_size", dataType: "room", question: "Roughly how big is your yard - small, medium, or large?", relatedService: "landscaping" },
    { key: "water_heater_type", dataType: "appliance", question: "Is your water heater tank or tankless? Tankless ones need flushing every year or so.", relatedService: "plumbing" },
    { key: "pest_concerns", dataType: "condition", question: "Have you noticed any pest issues lately? Florida's pretty generous with bugs 🐜", relatedService: "pest_control" },
    { key: "exterior_paint_age", dataType: "condition", question: "How's your exterior paint holding up? Florida sun is brutal on paint.", relatedService: "pressure_washing" },
    { key: "garage_organization", dataType: "preference", question: "Is your garage more 'organized workshop' or 'can't park in there'? No judgment 😄", relatedService: "garage_cleanout" },
    { key: "smart_home_devices", dataType: "appliance", question: "Got any smart home devices - thermostat, cameras, leak sensors? They can actually help me watch out for your home.", relatedService: "smart_home_setup" },
  ];

  // Check which data points we already have
  const { rows: existing } = await pool.query(
    `SELECT key FROM passive_data_points WHERE customer_id = $1`,
    [customerId]
  );
  const existingKeys = new Set(existing.map((r: any) => r.key));

  // Return the first question we don't have data for
  for (const q of questionBank) {
    if (!existingKeys.has(q.key)) {
      return { question: q.question, dataKey: q.key, relatedService: q.relatedService };
    }
  }

  return null; // Profile is complete enough
}

// ─── Get Data Completeness ─────────────────────────────────

export async function getDataCompleteness(
  customerId: string
): Promise<{ percentage: number; collected: number; total: number; missing: string[] }> {
  const totalKeys = [
    "ac_age", "roof_age", "gutter_last_cleaned", "pool_type", "lawn_size",
    "water_heater_type", "pest_concerns", "exterior_paint_age",
    "garage_organization", "smart_home_devices",
  ];

  const { rows } = await pool.query(
    `SELECT DISTINCT key FROM passive_data_points WHERE customer_id = $1`,
    [customerId]
  );
  const existingKeys = new Set(rows.map((r: any) => r.key));
  const missing = totalKeys.filter(k => !existingKeys.has(k));

  return {
    percentage: Math.round(((totalKeys.length - missing.length) / totalKeys.length) * 100),
    collected: totalKeys.length - missing.length,
    total: totalKeys.length,
    missing,
  };
}

// ─── Merge to Home Profile ─────────────────────────────────

export async function mergeToHomeProfile(customerId: string): Promise<number> {
  // Pull all passive data and consolidate into home_profiles
  const { rows: dataPoints } = await pool.query(
    `SELECT key, value, confidence FROM passive_data_points
     WHERE customer_id = $1
     ORDER BY confidence DESC, collected_at DESC`,
    [customerId]
  );

  if (dataPoints.length === 0) return 0;

  // Build profile JSON from data points (dedup by key, prefer high confidence)
  const profile: Record<string, string> = {};
  for (const dp of dataPoints) {
    if (!profile[dp.key]) {
      profile[dp.key] = dp.value;
    }
  }

  // Upsert into home_profiles (assumes a passive_data jsonb column or similar)
  await pool.query(
    `UPDATE home_profiles SET passive_data = $2, updated_at = now()
     WHERE customer_id = $1`,
    [customerId, JSON.stringify(profile)]
  );

  return Object.keys(profile).length;
}

// ─── Helpers ───────────────────────────────────────────────

function extractDataPoints(conversation: string): Array<{
  dataType: string;
  key: string;
  value: string;
  confidence: string;
}> {
  // Simple pattern matching - in production, use Claude for extraction
  const points: Array<{ dataType: string; key: string; value: string; confidence: string }> = [];

  const patterns: Array<{ regex: RegExp; key: string; dataType: string }> = [
    { regex: /(?:ac|air conditioner|hvac).{0,20}(\d+)\s*years?\s*old/i, key: "ac_age", dataType: "appliance" },
    { regex: /roof.{0,20}(\d+)\s*years?\s*old/i, key: "roof_age", dataType: "condition" },
    { regex: /(?:pool).{0,20}(chlorine|saltwater|salt water)/i, key: "pool_type", dataType: "appliance" },
    { regex: /(?:water heater).{0,20}(tank|tankless)/i, key: "water_heater_type", dataType: "appliance" },
    { regex: /(?:yard|lawn).{0,20}(small|medium|large|big|tiny)/i, key: "lawn_size", dataType: "room" },
    { regex: /(\d+)\s*(?:bed(?:room)?s?)/i, key: "bedrooms", dataType: "room" },
    { regex: /(\d+)\s*(?:bath(?:room)?s?)/i, key: "bathrooms", dataType: "room" },
    { regex: /(?:built|house).{0,20}(?:in\s+)?(\d{4})/i, key: "year_built", dataType: "condition" },
    { regex: /(\d+)\s*(?:sq(?:uare)?\s*f(?:ee)?t|sqft)/i, key: "square_footage", dataType: "room" },
  ];

  for (const p of patterns) {
    const match = conversation.match(p.regex);
    if (match) {
      points.push({
        dataType: p.dataType,
        key: p.key,
        value: match[1],
        confidence: "medium",
      });
    }
  }

  return points;
}

function categorizeKey(key: string): string {
  const lower = key.toLowerCase();
  if (lower.includes("appliance") || lower.includes("ac") || lower.includes("heater") || lower.includes("pool")) return "appliance";
  if (lower.includes("room") || lower.includes("bed") || lower.includes("bath") || lower.includes("yard")) return "room";
  if (lower.includes("hoa")) return "hoa_rule";
  if (lower.includes("condition") || lower.includes("roof") || lower.includes("paint")) return "condition";
  return "preference";
}

function mapDataPoint(row: any): DataPoint {
  return {
    id: row.id,
    customerId: row.customer_id,
    dataType: row.data_type,
    source: row.source,
    key: row.key,
    value: row.value,
    confidence: row.confidence,
    collectedAt: row.collected_at,
    verifiedBy: row.verified_by,
  };
}
