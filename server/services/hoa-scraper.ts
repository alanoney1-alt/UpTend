/**
 * HOA Auto-Scrape Service
 * Orchestrates multiple sources to pull HOA data for customer addresses.
 */

import { pool } from "../db";

// ─── Types ───────────────────────────────────────────────

interface HOAData {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  hoaName: string | null;
  managementCompany: string | null;
  monthlyFee: number | null;
  annualFee: number | null;
  contactPhone: string | null;
  contactEmail: string | null;
  website: string | null;
  rules: Record<string, any>;
  amenities: Record<string, any>;
  meetingSchedule: string | null;
  source: string;
  confidence: string;
  lastUpdated: string;
  createdAt: string;
}

// ─── Source 1: Realty-in-US (RapidAPI) ───────────────────

async function fetchRealtyAPI(address: string, city: string, state: string, zip: string): Promise<Partial<HOAData> | null> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    console.warn("[HOA] RAPIDAPI_KEY not set - skipping Realty-in-US");
    return null;
  }

  try {
    const query = encodeURIComponent(`${address}, ${city}, ${state} ${zip}`);
    const res = await fetch(
      `https://realty-in-us.p.rapidapi.com/properties/v3/detail?address=${query}`,
      {
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": "realty-in-us.p.rapidapi.com",
        },
      }
    );

    if (!res.ok) {
      console.warn(`[HOA] Realty API returned ${res.status}`);
      return null;
    }

    const data = await res.json();
    const prop = data?.data?.home || data?.data?.property_detail || {};
    const hoa = prop.hoa || {};

    if (!hoa.fee && !hoa.name) return null;

    return {
      hoaName: hoa.name || null,
      monthlyFee: hoa.fee ? Number(hoa.fee) : null,
      annualFee: hoa.fee ? Number(hoa.fee) * 12 : null,
      managementCompany: hoa.management_company || null,
      contactPhone: hoa.phone || null,
      contactEmail: hoa.email || null,
      website: hoa.website || null,
      source: "api",
      confidence: "high",
    };
  } catch (err) {
    console.error("[HOA] Realty API error:", err);
    return null;
  }
}

// ─── Source 2: Orange County FL Property Appraiser ───────

async function fetchOrangeCountyRecords(address: string, city: string, state: string, zip: string): Promise<Partial<HOAData> | null> {
  if (state.toUpperCase() !== "FL") return null;

  try {
    const query = encodeURIComponent(address);
    const res = await fetch(
      `https://www.ocpafl.org/api/properties/search?address=${query}&city=${encodeURIComponent(city)}`
    );

    if (!res.ok) return null;

    const data = await res.json();
    const record = Array.isArray(data) ? data[0] : data;
    if (!record) return null;

    const hoaName = record.subdivision || record.hoa_name || null;
    if (!hoaName) return null;

    return {
      hoaName,
      source: "scraped",
      confidence: "medium",
    };
  } catch (err) {
    console.error("[HOA] Orange County API error:", err);
    return null;
  }
}

// ─── Merge & Store ──────────────────────────────────────

function mergeResults(...sources: (Partial<HOAData> | null)[]): Partial<HOAData> {
  const merged: Partial<HOAData> = { rules: {}, amenities: {} };
  // Later sources override earlier ones for non-null fields
  for (const src of sources) {
    if (!src) continue;
    for (const [key, val] of Object.entries(src)) {
      if (val !== null && val !== undefined) {
        (merged as any)[key] = val;
      }
    }
  }
  return merged;
}

// ─── Public API ─────────────────────────────────────────

export async function scrapeHOAForAddress(
  address: string,
  city: string,
  state: string,
  zip: string
): Promise<HOAData | null> {
  console.log(`[HOA] Scraping for ${address}, ${city}, ${state} ${zip}`);

  // Check cache first
  const cached = await pool.query(
    `SELECT * FROM neighborhood_hoa_data
     WHERE LOWER(address) = LOWER($1) AND LOWER(city) = LOWER($2) AND LOWER(state) = LOWER($3) AND zip = $4
     LIMIT 1`,
    [address, city, state, zip]
  );

  if (cached.rows.length > 0) {
    const row = cached.rows[0];
    // Refresh if older than 30 days
    const age = Date.now() - new Date(row.last_updated).getTime();
    if (age < 30 * 24 * 60 * 60 * 1000) {
      console.log("[HOA] Returning cached data");
      return rowToHOAData(row);
    }
  }

  // Fetch from all sources concurrently
  const [realtyData, countyData] = await Promise.all([
    fetchRealtyAPI(address, city, state, zip),
    fetchOrangeCountyRecords(address, city, state, zip),
  ]);

  const merged = mergeResults(countyData, realtyData);

  if (!merged.hoaName && !merged.managementCompany && !merged.monthlyFee) {
    console.log("[HOA] No HOA data found from any source");
    return null;
  }

  // Upsert
  const result = await pool.query(
    `INSERT INTO neighborhood_hoa_data
       (address, city, state, zip, hoa_name, management_company, monthly_fee, annual_fee,
        contact_phone, contact_email, website, rules, amenities, meeting_schedule, source, confidence, last_updated)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16, NOW())
     ON CONFLICT ((LOWER(address)), (LOWER(city)), (LOWER(state)), zip)
     DO UPDATE SET
       hoa_name = COALESCE(EXCLUDED.hoa_name, neighborhood_hoa_data.hoa_name),
       management_company = COALESCE(EXCLUDED.management_company, neighborhood_hoa_data.management_company),
       monthly_fee = COALESCE(EXCLUDED.monthly_fee, neighborhood_hoa_data.monthly_fee),
       annual_fee = COALESCE(EXCLUDED.annual_fee, neighborhood_hoa_data.annual_fee),
       contact_phone = COALESCE(EXCLUDED.contact_phone, neighborhood_hoa_data.contact_phone),
       contact_email = COALESCE(EXCLUDED.contact_email, neighborhood_hoa_data.contact_email),
       website = COALESCE(EXCLUDED.website, neighborhood_hoa_data.website),
       rules = COALESCE(EXCLUDED.rules, neighborhood_hoa_data.rules),
       amenities = COALESCE(EXCLUDED.amenities, neighborhood_hoa_data.amenities),
       source = EXCLUDED.source,
       confidence = EXCLUDED.confidence,
       last_updated = NOW()
     RETURNING *`,
    [
      address, city, state, zip,
      merged.hoaName || null,
      merged.managementCompany || null,
      merged.monthlyFee || null,
      merged.annualFee || null,
      merged.contactPhone || null,
      merged.contactEmail || null,
      merged.website || null,
      JSON.stringify(merged.rules || {}),
      JSON.stringify(merged.amenities || {}),
      merged.meetingSchedule || null,
      merged.source || "api",
      merged.confidence || "low",
    ]
  ).catch(async () => {
    // Fallback: simple insert without ON CONFLICT (index may not exist)
    return pool.query(
      `INSERT INTO neighborhood_hoa_data
         (address, city, state, zip, hoa_name, management_company, monthly_fee, annual_fee,
          contact_phone, contact_email, website, rules, amenities, meeting_schedule, source, confidence)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        address, city, state, zip,
        merged.hoaName || null,
        merged.managementCompany || null,
        merged.monthlyFee || null,
        merged.annualFee || null,
        merged.contactPhone || null,
        merged.contactEmail || null,
        merged.website || null,
        JSON.stringify(merged.rules || {}),
        JSON.stringify(merged.amenities || {}),
        merged.meetingSchedule || null,
        merged.source || "api",
        merged.confidence || "low",
      ]
    );
  });

  console.log("[HOA] Stored HOA data");
  return rowToHOAData(result.rows[0]);
}

export async function getHOAForCustomer(customerId: string): Promise<HOAData | null> {
  const result = await pool.query(
    `SELECT h.* FROM neighborhood_hoa_data h
     JOIN customer_hoa_associations a ON a.hoa_data_id = h.id
     WHERE a.customer_id = $1
     ORDER BY a.created_at DESC LIMIT 1`,
    [customerId]
  );

  if (result.rows.length === 0) return null;
  return rowToHOAData(result.rows[0]);
}

export async function linkCustomerToHOA(customerId: string, hoaDataId: string, unitNumber?: string): Promise<void> {
  await pool.query(
    `INSERT INTO customer_hoa_associations (customer_id, hoa_data_id, unit_number)
     VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING`,
    [customerId, hoaDataId, unitNumber || null]
  );
}

export async function enrichHOAFromProReport(
  hoaDataId: string,
  proNotes: { rules?: Record<string, any>; amenities?: Record<string, any>; [key: string]: any }
): Promise<HOAData | null> {
  const existing = await pool.query(`SELECT * FROM neighborhood_hoa_data WHERE id = $1`, [hoaDataId]);
  if (existing.rows.length === 0) return null;

  const row = existing.rows[0];
  const mergedRules = { ...(row.rules || {}), ...(proNotes.rules || {}) };
  const mergedAmenities = { ...(row.amenities || {}), ...(proNotes.amenities || {}) };

  const updates: string[] = [];
  const vals: any[] = [];
  let idx = 1;

  if (proNotes.rules) { updates.push(`rules = $${idx++}`); vals.push(JSON.stringify(mergedRules)); }
  if (proNotes.amenities) { updates.push(`amenities = $${idx++}`); vals.push(JSON.stringify(mergedAmenities)); }
  if (proNotes.hoaName) { updates.push(`hoa_name = $${idx++}`); vals.push(proNotes.hoaName); }
  if (proNotes.managementCompany) { updates.push(`management_company = $${idx++}`); vals.push(proNotes.managementCompany); }
  if (proNotes.contactPhone) { updates.push(`contact_phone = $${idx++}`); vals.push(proNotes.contactPhone); }
  if (proNotes.contactEmail) { updates.push(`contact_email = $${idx++}`); vals.push(proNotes.contactEmail); }
  if (proNotes.monthlyFee) { updates.push(`monthly_fee = $${idx++}`); vals.push(proNotes.monthlyFee); }

  if (updates.length === 0) return rowToHOAData(row);

  updates.push(`last_updated = NOW()`);
  vals.push(hoaDataId);

  const result = await pool.query(
    `UPDATE neighborhood_hoa_data SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`,
    vals
  );

  return rowToHOAData(result.rows[0]);
}

// ─── Row mapper ─────────────────────────────────────────

function rowToHOAData(row: any): HOAData {
  return {
    id: row.id,
    address: row.address,
    city: row.city,
    state: row.state,
    zip: row.zip,
    hoaName: row.hoa_name,
    managementCompany: row.management_company,
    monthlyFee: row.monthly_fee ? Number(row.monthly_fee) : null,
    annualFee: row.annual_fee ? Number(row.annual_fee) : null,
    contactPhone: row.contact_phone,
    contactEmail: row.contact_email,
    website: row.website,
    rules: row.rules || {},
    amenities: row.amenities || {},
    meetingSchedule: row.meeting_schedule,
    source: row.source,
    confidence: row.confidence,
    lastUpdated: row.last_updated,
    createdAt: row.created_at,
  };
}
