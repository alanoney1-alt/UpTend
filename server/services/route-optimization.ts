/**
 * Route Optimization Service
 * Optimizes technician routes using nearest-neighbor algorithm
 */

import { pool } from "../db";

async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS partner_route_plans (
      id SERIAL PRIMARY KEY,
      partner_slug TEXT NOT NULL,
      date DATE NOT NULL,
      tech_name TEXT NOT NULL,
      jobs JSONB NOT NULL DEFAULT '[]',
      optimized_order JSONB NOT NULL DEFAULT '[]',
      total_distance_miles NUMERIC DEFAULT 0,
      total_drive_minutes INT DEFAULT 0,
      estimated_savings_minutes INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

ensureTables().catch(console.error);

interface JobStop {
  jobId: string;
  address: string;
  lat?: number;
  lng?: number;
  estimatedDuration: number;
  timeWindow?: { start: string; end: string };
}

/**
 * Calculate distance between two points (Haversine formula)
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Optimize route using nearest-neighbor algorithm
 */
export async function optimizeRoute(
  partnerSlug: string,
  techName: string,
  date: string,
  jobs: JobStop[]
): Promise<any> {
  try {
    if (jobs.length === 0) return { optimizedOrder: [], totalDistance: 0, totalDrive: 0, savings: 0 };

    // Nearest-neighbor optimization
    const remaining = [...jobs];
    const optimized: JobStop[] = [];
    let totalDistance = 0;
    let current = remaining.shift()!;
    optimized.push(current);

    while (remaining.length > 0) {
      if (current.lat && current.lng) {
        // Find nearest with coordinates
        let nearestIdx = 0;
        let nearestDist = Infinity;
        for (let i = 0; i < remaining.length; i++) {
          if (remaining[i].lat && remaining[i].lng) {
            const dist = haversineDistance(current.lat, current.lng, remaining[i].lat!, remaining[i].lng!);
            if (dist < nearestDist) {
              nearestDist = dist;
              nearestIdx = i;
            }
          }
        }
        totalDistance += nearestDist === Infinity ? 5 : nearestDist; // Default 5 miles if no coords
        current = remaining.splice(nearestIdx, 1)[0];
      } else {
        // No coordinates, just take next
        totalDistance += 5;
        current = remaining.shift()!;
      }
      optimized.push(current);
    }

    // Estimate: original order would be ~30% more distance
    const originalDistance = totalDistance * 1.3;
    const savingsMinutes = Math.round((originalDistance - totalDistance) * 2); // ~2 min per mile
    const totalDriveMinutes = Math.round(totalDistance * 2);

    const result = await pool.query(
      `INSERT INTO partner_route_plans (partner_slug, date, tech_name, jobs, optimized_order, total_distance_miles, total_drive_minutes, estimated_savings_minutes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [partnerSlug, date, techName, JSON.stringify(jobs), JSON.stringify(optimized), totalDistance.toFixed(1), totalDriveMinutes, savingsMinutes]
    );

    return result.rows[0];
  } catch (err) {
    console.error("optimizeRoute error:", err);
    throw err;
  }
}

/** Get route plan for a tech on a specific date */
export async function getRoutePlan(partnerSlug: string, techName: string, date: string) {
  try {
    const result = await pool.query(
      `SELECT * FROM partner_route_plans WHERE partner_slug = $1 AND tech_name = $2 AND date = $3 ORDER BY created_at DESC LIMIT 1`,
      [partnerSlug, techName, date]
    );
    return result.rows[0] || null;
  } catch (err) {
    console.error("getRoutePlan error:", err);
    throw err;
  }
}

/** Get all techs' routes for a day */
export async function getDailyRoutes(partnerSlug: string, date: string) {
  try {
    const result = await pool.query(
      `SELECT * FROM partner_route_plans WHERE partner_slug = $1 AND date = $2 ORDER BY tech_name`,
      [partnerSlug, date]
    );
    return result.rows;
  } catch (err) {
    console.error("getDailyRoutes error:", err);
    throw err;
  }
}

/** Get route savings report */
export async function getRouteSavingsReport(partnerSlug: string, startDate?: string, endDate?: string) {
  try {
    let query = `SELECT COUNT(*) as total_routes, 
      COALESCE(SUM(total_distance_miles), 0) as total_miles,
      COALESCE(SUM(total_drive_minutes), 0) as total_drive_minutes,
      COALESCE(SUM(estimated_savings_minutes), 0) as total_savings_minutes
      FROM partner_route_plans WHERE partner_slug = $1`;
    const params: any[] = [partnerSlug];

    if (startDate) {
      params.push(startDate);
      query += ` AND date >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate);
      query += ` AND date <= $${params.length}`;
    }

    const result = await pool.query(query, params);
    return result.rows[0];
  } catch (err) {
    console.error("getRouteSavingsReport error:", err);
    throw err;
  }
}
