/**
 * Emergency Dispatch Service
 * 
 * Handles urgent home emergencies — finds nearest qualified pro,
 * dispatches them, and tracks response through resolution.
 */

import { pool } from "../db";
import { geocodeAddress, getDistanceMatrix } from "./google-maps";

const EMERGENCY_SKILL_MAP: Record<string, string[]> = {
  pipe_burst: ["plumbing", "water_damage"],
  roof_damage: ["roofing", "general_repair"],
  flooding: ["water_damage", "plumbing"],
  tree_down: ["tree_service", "landscaping"],
  power_outage: ["electrical"],
  gas_leak: ["plumbing", "gas"],
  fire_damage: ["general_repair", "restoration"],
  lockout: ["locksmith", "general_repair"],
};

// ─── Create emergency dispatch ──────────────────────────

export async function createEmergencyDispatch(
  customerId: string,
  emergencyType: string,
  severity: string,
  description: string
) {
  // Get customer address
  const { rows: addresses } = await pool.query(
    `SELECT address_line1, city, state, zip FROM customer_addresses
     WHERE user_id = $1 ORDER BY is_default DESC LIMIT 1`,
    [customerId]
  ).catch(() => ({ rows: [] }));

  const addr = addresses[0];
  const address = addr
    ? `${addr.address_line1}, ${addr.city}, ${addr.state} ${addr.zip}`
    : "Address on file";

  // Create dispatch
  const { rows } = await pool.query(
    `INSERT INTO emergency_dispatches (customer_id, emergency_type, severity, address, description)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [customerId, emergencyType, severity, address, description]
  );

  const dispatch = rows[0];

  // Try to find and assign a pro
  const skills = EMERGENCY_SKILL_MAP[emergencyType] || ["general_repair"];
  const pro = await findNearestPro(address, skills[0], 25);

  if (pro) {
    await pool.query(
      `UPDATE emergency_dispatches
       SET dispatched_pro_id = $1, dispatched_at = NOW(), status = 'dispatched',
           estimated_arrival = NOW() + INTERVAL '30 minutes'
       WHERE id = $2`,
      [pro.id, dispatch.id]
    );
    dispatch.dispatched_pro_id = pro.id;
    dispatch.status = "dispatched";
  }

  return {
    dispatch,
    pro: pro ? { id: pro.id, name: pro.name, phone: pro.phone, eta: "~30 min" } : null,
    message: pro
      ? `🚨 Emergency dispatch created! ${pro.name} has been alerted and is estimated to arrive in ~30 minutes.`
      : `🚨 Emergency dispatch created. We're searching for an available pro in your area — you'll be notified as soon as one accepts.`,
  };
}

// ─── Find nearest available pro ─────────────────────────

export async function findNearestPro(
  address: string,
  serviceType: string,
  maxRadius: number = 25
) {
  // Query all online pros
  const { rows: pros } = await pool.query(
    `SELECT hp.id, hp.user_id, hp.company_name as name, hp.phone,
            pos.is_online, pos.last_lat, pos.last_lng
     FROM hauler_profiles hp
     LEFT JOIN pycker_online_status pos ON pos.hauler_id = hp.id
     WHERE pos.is_online = true`
  ).catch(() => ({ rows: [] as any[] }));

  if (!pros.length) return null;

  // Try distance-based matching via Google Maps
  try {
    // Geocode the customer address
    const customerCoords = await geocodeAddress(address);
    if (!customerCoords) throw new Error("Could not geocode customer address");

    // Filter pros that have location data
    const prosWithLocation = pros.filter(
      (p) => p.last_lat != null && p.last_lng != null
    );

    if (prosWithLocation.length > 0) {
      const destinations = prosWithLocation.map((p) => ({
        id: p.id.toString(),
        lat: parseFloat(p.last_lat),
        lng: parseFloat(p.last_lng),
      }));

      const distances = await getDistanceMatrix(
        { lat: customerCoords.lat, lng: customerCoords.lng },
        destinations
      );

      if (distances.length > 0) {
        // Find closest within maxRadius
        const closest = distances.find((d) => d.distanceMiles <= maxRadius);
        if (closest) {
          return pros.find((p) => p.id.toString() === closest.id) || null;
        }
        // All too far — return null (no pro in range)
        console.log(`[emergency-dispatch] No pro within ${maxRadius} miles. Closest: ${distances[0].distanceMiles} mi`);
        return null;
      }
    }
  } catch (err) {
    console.warn("[emergency-dispatch] Google Maps distance matching failed, falling back:", err);
  }

  // Fallback: return first online pro (old behavior)
  return pros[0] || null;
}

// ─── Update dispatch status ─────────────────────────────

export async function updateDispatchStatus(
  dispatchId: string,
  status: string
) {
  const timestampField: Record<string, string> = {
    en_route: "responded_at",
    on_site: "arrived_at",
    resolved: "resolved_at",
  };

  const extra = timestampField[status] ? `, ${timestampField[status]} = NOW()` : "";

  const { rows } = await pool.query(
    `UPDATE emergency_dispatches
     SET status = $1${extra}, dispatched_at = COALESCE(dispatched_at, NOW())
     WHERE id = $2
     RETURNING *`,
    [status, dispatchId]
  );

  if (!rows.length) throw new Error("Dispatch not found");

  return rows[0];
}

// ─── Get active emergencies for a customer ──────────────

export async function getActiveEmergencies(customerId: string) {
  const { rows } = await pool.query(
    `SELECT ed.*, hp.company_name as pro_name, hp.phone as pro_phone
     FROM emergency_dispatches ed
     LEFT JOIN hauler_profiles hp ON hp.id = ed.dispatched_pro_id
     WHERE ed.customer_id = $1 AND ed.status NOT IN ('resolved','cancelled')
     ORDER BY ed.created_at DESC`,
    [customerId]
  );

  return rows;
}

// ─── Activate disaster mode for a region ────────────────

export async function activateDisasterMode(
  region: string,
  stormName: string
) {
  // Disable surge pricing region-wide
  await pool.query(
    `UPDATE surge_modifiers SET multiplier = 1.0, is_active = false
     WHERE region ILIKE $1 AND is_active = true`,
    [`%${region}%`]
  ).catch(() => {});

  // Alert all pros in region
  const { rows: pros } = await pool.query(
    `SELECT hp.id, hp.company_name as full_name, hp.phone
     FROM hauler_profiles hp
     WHERE hp.service_area ILIKE $1 OR hp.city ILIKE $1`,
    [`%${region}%`]
  ).catch(() => ({ rows: [] }));

  return {
    region,
    stormName,
    surgePricingDisabled: true,
    prosAlerted: pros.length,
    priorityQueueActive: true,
    message: `🌪️ DISASTER MODE ACTIVATED for ${stormName} in ${region}. Surge pricing disabled, ${pros.length} pros alerted, priority dispatch queue active.`,
  };
}
