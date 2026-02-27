/**
 * Insurance Claims Documentation Service
 * 
 * Manages insurance claims lifecycle - from initial documentation through
 * settlement. Pulls before-photos from home scan history for comparison.
 */

import { pool } from "../db";

// ─── Start a new insurance claim ────────────────────────

export async function startClaim(
  customerId: string,
  claimType: string,
  description: string
) {
  // Pull before-photos from home scan history
  const { rows: scanPhotos } = await pool.query(
    `SELECT photo_url, room_label, ai_analysis, scanned_at
     FROM home_scan_items WHERE customer_id = $1 AND photo_url IS NOT NULL
     ORDER BY scanned_at DESC LIMIT 50`,
    [customerId]
  ).catch(() => ({ rows: [] }));

  const beforePhotos = scanPhotos.map((p: any) => ({
    url: p.photo_url,
    description: `${p.room_label || "Home"} - ${p.ai_analysis || "pre-incident photo"}`,
    timestamp: p.scanned_at,
  }));

  const timeline = [
    { event: "Claim started", date: new Date().toISOString(), notes: description },
  ];

  const { rows } = await pool.query(
    `INSERT INTO insurance_claims (customer_id, claim_type, description, before_photos, timeline)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [customerId, claimType, description, JSON.stringify(beforePhotos), JSON.stringify(timeline)]
  );

  return {
    claim: rows[0],
    beforePhotosCount: beforePhotos.length,
    message: `Insurance claim started for ${claimType}. ${beforePhotos.length} pre-incident photos pulled from your home scan history. Add damage photos next to build your claim package.`,
  };
}

// ─── Add a damage photo to an existing claim ────────────

export async function addClaimPhoto(
  claimId: string,
  photoUrl: string,
  description: string
) {
  const photo = { url: photoUrl, description, timestamp: new Date().toISOString() };

  const { rows } = await pool.query(
    `UPDATE insurance_claims
     SET photos = photos || $1::jsonb,
         timeline = timeline || $2::jsonb,
         updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [
      JSON.stringify([photo]),
      JSON.stringify([{ event: "Photo added", date: new Date().toISOString(), notes: description }]),
      claimId,
    ]
  );

  if (!rows.length) throw new Error("Claim not found");

  return {
    claim: rows[0],
    message: `Photo added to claim. You now have ${(rows[0].photos as any[]).length} damage photo(s).`,
  };
}

// ─── Generate a claim package (PDF-ready data) ─────────

export async function generateClaimPackage(claimId: string) {
  const { rows } = await pool.query(
    `SELECT ic.*, 
            hp.address, hp.home_type, hp.year_built, hp.square_footage
     FROM insurance_claims ic
     LEFT JOIN home_profiles hp ON hp.customer_id = ic.customer_id
     WHERE ic.id = $1`,
    [claimId]
  );

  if (!rows.length) throw new Error("Claim not found");

  const claim = rows[0];

  return {
    claimId: claim.id,
    claimType: claim.claim_type,
    status: claim.status,
    incidentDate: claim.incident_date,
    description: claim.description,
    damageEstimate: claim.damage_estimate,
    property: {
      address: claim.address,
      homeType: claim.home_type,
      yearBuilt: claim.year_built,
      sqft: claim.square_footage,
    },
    insuranceInfo: {
      company: claim.insurance_company,
      policyNumber: claim.policy_number,
      claimNumber: claim.claim_number,
      adjusterName: claim.adjuster_name,
      adjusterPhone: claim.adjuster_phone,
    },
    beforePhotos: claim.before_photos || [],
    damagePhotos: claim.photos || [],
    timeline: claim.timeline || [],
    generatedAt: new Date().toISOString(),
    message: `Claim package generated with ${(claim.before_photos || []).length} before photos, ${(claim.photos || []).length} damage photos, and full timeline.`,
  };
}

// ─── Get claim status with timeline ─────────────────────

export async function getClaimStatus(claimId: string) {
  const { rows } = await pool.query(
    `SELECT * FROM insurance_claims WHERE id = $1`,
    [claimId]
  );

  if (!rows.length) throw new Error("Claim not found");

  return rows[0];
}

// ─── Storm prep checklist generator ─────────────────────

export async function getStormPrepChecklist(
  customerId: string | null | undefined,
  stormType: string
) {
  // Base checklists by storm type
  const baseChecklists: Record<string, string[]> = {
    hurricane: [
      "Board up windows or install hurricane shutters",
      "Secure outdoor furniture, grills, and decorations",
      "Stock 3+ days of water (1 gallon per person per day)",
      "Fill vehicles with gas",
      "Charge all devices and portable batteries",
      "Review insurance policy and document valuables",
      "Clear gutters and drains",
      "Trim dead tree branches near the house",
      "Prepare an evacuation bag with essentials",
      "Know your evacuation zone and route",
    ],
    tornado: [
      "Identify safe room (interior room, lowest floor, no windows)",
      "Secure outdoor items that could become projectiles",
      "Stock emergency kit in safe room",
      "Review insurance documentation",
      "Charge all devices",
      "Have weather radio or alerts enabled",
      "Know the difference between watch and warning",
    ],
    severe_storm: [
      "Secure outdoor furniture and loose items",
      "Clear gutters and storm drains",
      "Trim overhanging branches",
      "Check sump pump operation",
      "Stock flashlights and batteries",
      "Have emergency contacts ready",
    ],
    freeze: [
      "Insulate exposed pipes",
      "Let faucets drip during extreme cold",
      "Keep thermostat at 55°F+ even when away",
      "Service heating system",
      "Stock de-icing salt",
      "Protect outdoor plants and hose bibs",
      "Check weather stripping on doors/windows",
    ],
  };

  // If no customerId, return a generic checklist without saving to DB
  if (!customerId) {
    const checklist = (baseChecklists[stormType] || baseChecklists.severe_storm).map(
      (task) => ({ task, completed: false, completedAt: null })
    );
    return { storm_type: stormType, checklist, generic: true };
  }

  // Check for existing checklist
  const { rows: existing } = await pool.query(
    `SELECT * FROM storm_prep_checklists
     WHERE customer_id = $1 AND storm_type = $2
     ORDER BY created_at DESC LIMIT 1`,
    [customerId, stormType]
  );

  if (existing.length) return existing[0];

  // Get home profile for personalization
  const { rows: profiles } = await pool.query(
    `SELECT * FROM home_profiles WHERE customer_id = $1 LIMIT 1`,
    [customerId]
  ).catch(() => ({ rows: [] }));

  const profile = profiles[0] || {};

  const checklist = (baseChecklists[stormType] || baseChecklists.severe_storm).map(
    (task) => ({ task, completed: false, completedAt: null })
  );

  // Personalize based on home profile
  const extras: string[] = [];
  const homeFeatures = (profile.features || profile.home_type || "").toLowerCase();

  if (homeFeatures.includes("pool")) extras.push("Secure pool furniture and lower water level");
  if (homeFeatures.includes("garage")) extras.push("Reinforce garage door");
  if (homeFeatures.includes("solar")) extras.push("Check solar panel mounting and disconnect if advised");
  if (homeFeatures.includes("generator")) extras.push("Test generator and stock fuel");

  for (const task of extras) {
    checklist.push({ task, completed: false, completedAt: null });
  }

  const { rows } = await pool.query(
    `INSERT INTO storm_prep_checklists (customer_id, storm_type, checklist)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [customerId, stormType, JSON.stringify(checklist)]
  );

  return rows[0];
}
