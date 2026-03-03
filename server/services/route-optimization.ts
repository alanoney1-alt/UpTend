/**
 * Route Optimization Service
 *
 * Nearest-neighbor route optimization for partner tech dispatching.
 * Calculates estimated distances and drive times, optimizes job order.
 */

import { db } from "../db";
import { sql } from "drizzle-orm";

// ============================================================
// Database Setup
// ============================================================

async function ensureTables(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS partner_route_plans (
        id SERIAL PRIMARY KEY,
        partner_slug TEXT NOT NULL,
        date DATE NOT NULL,
        tech_name TEXT NOT NULL,
        jobs JSONB NOT NULL DEFAULT '[]',
        optimized_order JSONB NOT NULL DEFAULT '[]',
        total_distance_miles NUMERIC(10,2) DEFAULT 0,
        total_drive_minutes INTEGER DEFAULT 0,
        estimated_savings_minutes INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  } catch (err) {
    console.error("[RouteOptimization] Table creation error:", err);
  }
}

// ============================================================
// Interfaces
// ============================================================

export interface RouteJob {
  jobId: string;
  address: string;
  lat?: number;
  lng?: number;
  estimatedDuration: number; // minutes
  timeWindow?: { start: string; end: string };
}

interface OptimizedJob extends RouteJob {
  order: number;
  estimatedArrival?: string;
  driveMinutesFromPrev: number;
  distanceMilesFromPrev: number;
}

// ============================================================
// Helpers
// ============================================================

/** Haversine distance in miles between two lat/lng points */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Estimate drive minutes from miles (avg 30mph in service areas) */
function estimateDriveMinutes(miles: number): number {
  return Math.round(miles * 2); // ~30mph avg
}

/** Simple lat/lng from address hash (deterministic fallback when no coords) */
function pseudoCoords(address: string): { lat: number; lng: number } {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = ((hash << 5) - hash) + address.charCodeAt(i);
    hash |= 0;
  }
  // Orlando area fallback
  return {
    lat: 28.5 + (Math.abs(hash % 1000) / 10000),
    lng: -81.3 - (Math.abs((hash >> 10) % 1000) / 10000),
  };
}

/** Nearest-neighbor with time-window priority */
function nearestNeighborSort(jobs: RouteJob[]): RouteJob[] {
  if (jobs.length <= 1) return [...jobs];

  // Jobs with early time windows go first
  const withCoords = jobs.map(j => ({
    ...j,
    lat: j.lat ?? pseudoCoords(j.address).lat,
    lng: j.lng ?? pseudoCoords(j.address).lng,
  }));

  const sorted: typeof withCoords = [];
  const remaining = [...withCoords];

  // Start with earliest time-window job, or first job
  const firstIdx = remaining.reduce((best, job, idx) => {
    if (job.timeWindow && (!remaining[best].timeWindow ||
      job.timeWindow.start < remaining[best].timeWindow!.start)) return idx;
    return best;
  }, 0);

  sorted.push(remaining.splice(firstIdx, 1)[0]);

  while (remaining.length > 0) {
    const last = sorted[sorted.length - 1];
    let bestIdx = 0;
    let bestScore = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const dist = haversineDistance(last.lat, last.lng, remaining[i].lat, remaining[i].lng);
      // Penalize if time window would be missed
      let score = dist;
      if (remaining[i].timeWindow) {
        score *= 0.8; // Prioritize time-windowed jobs
      }
      if (score < bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
    sorted.push(remaining.splice(bestIdx, 1)[0]);
  }

  return sorted;
}

// ============================================================
// Main Functions
// ============================================================

export async function optimizeRoute(
  partnerSlug: string,
  techName: string,
  date: string,
  jobs: RouteJob[]
): Promise<{
  optimizedOrder: OptimizedJob[];
  totalDistanceMiles: number;
  totalDriveMinutes: number;
  estimatedSavingsMinutes: number;
}> {
  await ensureTables();

  const optimized = nearestNeighborSort(jobs);

  let totalDistance = 0;
  let totalDrive = 0;
  const optimizedOrder: OptimizedJob[] = optimized.map((job, idx) => {
    let distFromPrev = 0;
    let driveFromPrev = 0;
    if (idx > 0) {
      const prev = optimized[idx - 1];
      const prevLat = prev.lat ?? pseudoCoords(prev.address).lat;
      const prevLng = prev.lng ?? pseudoCoords(prev.address).lng;
      const curLat = job.lat ?? pseudoCoords(job.address).lat;
      const curLng = job.lng ?? pseudoCoords(job.address).lng;
      distFromPrev = Math.round(haversineDistance(prevLat, prevLng, curLat, curLng) * 100) / 100;
      driveFromPrev = estimateDriveMinutes(distFromPrev);
    }
    totalDistance += distFromPrev;
    totalDrive += driveFromPrev;
    return {
      ...job,
      order: idx + 1,
      driveMinutesFromPrev: driveFromPrev,
      distanceMilesFromPrev: distFromPrev,
    };
  });

  // Estimate savings vs original order
  let originalDrive = 0;
  for (let i = 1; i < jobs.length; i++) {
    const prev = jobs[i - 1];
    const cur = jobs[i];
    const d = haversineDistance(
      prev.lat ?? pseudoCoords(prev.address).lat,
      prev.lng ?? pseudoCoords(prev.address).lng,
      cur.lat ?? pseudoCoords(cur.address).lat,
      cur.lng ?? pseudoCoords(cur.address).lng
    );
    originalDrive += estimateDriveMinutes(d);
  }
  const savings = Math.max(0, originalDrive - totalDrive);

  // Save to DB
  await db.execute(sql`
    INSERT INTO partner_route_plans (partner_slug, date, tech_name, jobs, optimized_order, total_distance_miles, total_drive_minutes, estimated_savings_minutes)
    VALUES (${partnerSlug}, ${date}, ${techName}, ${JSON.stringify(jobs)}::jsonb, ${JSON.stringify(optimizedOrder)}::jsonb, ${Math.round(totalDistance * 100) / 100}, ${totalDrive}, ${savings})
  `);

  return {
    optimizedOrder,
    totalDistanceMiles: Math.round(totalDistance * 100) / 100,
    totalDriveMinutes: totalDrive,
    estimatedSavingsMinutes: savings,
  };
}

export async function getRoutePlan(partnerSlug: string, techName: string, date: string) {
  await ensureTables();
  const result = await db.execute(sql`
    SELECT * FROM partner_route_plans
    WHERE partner_slug = ${partnerSlug} AND tech_name = ${techName} AND date = ${date}
    ORDER BY created_at DESC LIMIT 1
  `);
  return (result as any).rows?.[0] || null;
}

export async function getDailyRoutes(partnerSlug: string, date: string) {
  await ensureTables();
  const result = await db.execute(sql`
    SELECT DISTINCT ON (tech_name) *
    FROM partner_route_plans
    WHERE partner_slug = ${partnerSlug} AND date = ${date}
    ORDER BY tech_name, created_at DESC
  `);
  return (result as any).rows || [];
}

export async function getRouteSavingsReport(
  partnerSlug: string,
  dateRange?: { start: string; end: string }
) {
  await ensureTables();
  const start = dateRange?.start || new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
  const end = dateRange?.end || new Date().toISOString().split("T")[0];

  const result = await db.execute(sql`
    SELECT
      COUNT(*) as total_routes,
      COALESCE(SUM(total_distance_miles), 0) as total_miles,
      COALESCE(SUM(total_drive_minutes), 0) as total_drive_minutes,
      COALESCE(SUM(estimated_savings_minutes), 0) as total_savings_minutes,
      COALESCE(AVG(estimated_savings_minutes), 0) as avg_savings_per_route
    FROM partner_route_plans
    WHERE partner_slug = ${partnerSlug} AND date BETWEEN ${start} AND ${end}
  `);

  const row = (result as any).rows?.[0] || {};
  return {
    period: { start, end },
    totalRoutes: parseInt(row.total_routes) || 0,
    totalMiles: parseFloat(row.total_miles) || 0,
    totalDriveMinutes: parseInt(row.total_drive_minutes) || 0,
    totalSavingsMinutes: parseInt(row.total_savings_minutes) || 0,
    avgSavingsPerRoute: Math.round(parseFloat(row.avg_savings_per_route) || 0),
    estimatedFuelSaved: Math.round((parseFloat(row.total_miles) || 0) / 25 * 100) / 100, // ~25mpg
  };
}
