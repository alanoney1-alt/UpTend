/**
 * Route Optimization Service
 * Haversine-based nearest neighbor + 2-opt improvement
 * No external API needed
 */

import { pool } from "../db.js";

interface JobStop {
  jobId: string;
  address: string;
  lat: number;
  lng: number;
  scheduledTime: string;
  estimatedDuration: number; // minutes
}

interface OptimizedRoute {
  proId: string;
  date: string;
  jobs: JobStop[];
  optimizedOrder: string[];
  totalDistance: number; // miles
  totalDriveTime: number; // minutes
  fuelEstimate: number; // dollars
  legs: Array<{ from: string; to: string; distance: number; driveTime: number }>;
}

const AVG_SPEED_MPH = 30; // urban average
const FUEL_COST_PER_MILE = 0.22; // IRS-ish estimate for fuel only

// ─── Haversine Distance (miles) ──────────────────────────────────

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// ─── Nearest Neighbor ────────────────────────────────────────────

function nearestNeighbor(jobs: JobStop[]): JobStop[] {
  if (jobs.length <= 1) return [...jobs];
  const remaining = [...jobs];
  const route: JobStop[] = [remaining.shift()!];

  while (remaining.length > 0) {
    const last = route[route.length - 1];
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversine(last.lat, last.lng, remaining[i].lat, remaining[i].lng);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    route.push(remaining.splice(bestIdx, 1)[0]);
  }
  return route;
}

// ─── 2-Opt Improvement ──────────────────────────────────────────

function twoOpt(jobs: JobStop[]): JobStop[] {
  if (jobs.length <= 3) return jobs;
  const route = [...jobs];
  let improved = true;

  while (improved) {
    improved = false;
    for (let i = 0; i < route.length - 1; i++) {
      for (let j = i + 2; j < route.length; j++) {
        const currentDist =
          haversine(route[i].lat, route[i].lng, route[i + 1].lat, route[i + 1].lng) +
          (j + 1 < route.length ? haversine(route[j].lat, route[j].lng, route[j + 1].lat, route[j + 1].lng) : 0);
        const newDist =
          haversine(route[i].lat, route[i].lng, route[j].lat, route[j].lng) +
          (j + 1 < route.length ? haversine(route[i + 1].lat, route[i + 1].lng, route[j + 1].lat, route[j + 1].lng) : 0);

        if (newDist < currentDist - 0.01) {
          // Reverse segment between i+1 and j
          const segment = route.splice(i + 1, j - i);
          segment.reverse();
          route.splice(i + 1, 0, ...segment);
          improved = true;
        }
      }
    }
  }
  return route;
}

// ─── Calculate Route Metrics ─────────────────────────────────────

function calculateMetrics(jobs: JobStop[]): { totalDistance: number; totalDriveTime: number; fuelEstimate: number; legs: OptimizedRoute["legs"] } {
  let totalDistance = 0;
  const legs: OptimizedRoute["legs"] = [];

  for (let i = 0; i < jobs.length - 1; i++) {
    const dist = haversine(jobs[i].lat, jobs[i].lng, jobs[i + 1].lat, jobs[i + 1].lng);
    const driveTime = Math.round((dist / AVG_SPEED_MPH) * 60);
    totalDistance += dist;
    legs.push({
      from: jobs[i].jobId,
      to: jobs[i + 1].jobId,
      distance: parseFloat(dist.toFixed(1)),
      driveTime,
    });
  }

  return {
    totalDistance: parseFloat(totalDistance.toFixed(1)),
    totalDriveTime: Math.round((totalDistance / AVG_SPEED_MPH) * 60),
    fuelEstimate: parseFloat((totalDistance * FUEL_COST_PER_MILE).toFixed(2)),
    legs,
  };
}

// ─── Optimize Route ──────────────────────────────────────────────

export async function optimizeRoute(proId: string, date: string): Promise<OptimizedRoute> {
  // Get jobs for the day
  const { rows: dayJobs } = await pool.query(
    `SELECT id, pickup_address, pickup_lat, pickup_lng, scheduled_for
     FROM service_requests
     WHERE assigned_hauler_id = $1 AND scheduled_for::date = $2::date
     AND status IN ('pending', 'confirmed', 'in_progress')
     ORDER BY scheduled_for`,
    [proId, date]
  );

  const jobs: JobStop[] = dayJobs.map(j => ({
    jobId: j.id.toString(),
    address: j.pickup_address || "Unknown",
    lat: parseFloat(j.pickup_lat) || 28.5383, // Orlando fallback
    lng: parseFloat(j.pickup_lng) || -81.3792,
    scheduledTime: j.scheduled_for || "",
    estimatedDuration: 60, // default 1 hour - no duration column in service_requests
  }));

  // Also check existing route plan for manually added jobs
  const { rows: existingPlan } = await pool.query(
    `SELECT jobs FROM pro_route_plans WHERE pro_id = $1 AND plan_date = $2 ORDER BY created_at DESC LIMIT 1`,
    [proId, date]
  );

  if (existingPlan[0]?.jobs?.length && jobs.length === 0) {
    // Use stored jobs if no live jobs found
    const storedJobs = existingPlan[0].jobs as JobStop[];
    jobs.push(...storedJobs);
  }

  if (jobs.length === 0) {
    return {
      proId, date, jobs: [], optimizedOrder: [],
      totalDistance: 0, totalDriveTime: 0, fuelEstimate: 0, legs: [],
    };
  }

  // Optimize
  const nnRoute = nearestNeighbor(jobs);
  const optimized = twoOpt(nnRoute);
  const metrics = calculateMetrics(optimized);

  // Store route plan
  await pool.query(
    `INSERT INTO pro_route_plans (pro_id, plan_date, jobs, optimized_order, total_distance, total_drive_time, fuel_estimate)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT DO NOTHING`,
    [proId, date, JSON.stringify(optimized), JSON.stringify(optimized.map(j => j.jobId)), metrics.totalDistance, metrics.totalDriveTime, metrics.fuelEstimate]
  );

  return {
    proId,
    date,
    jobs: optimized,
    optimizedOrder: optimized.map(j => j.jobId),
    ...metrics,
  };
}

// ─── Get Route For Day ───────────────────────────────────────────

export async function getRouteForDay(proId: string, date: string): Promise<OptimizedRoute> {
  const { rows } = await pool.query(
    `SELECT * FROM pro_route_plans WHERE pro_id = $1 AND plan_date = $2 ORDER BY created_at DESC LIMIT 1`,
    [proId, date]
  );

  if (rows[0]) {
    const plan = rows[0];
    const jobs = plan.jobs as JobStop[];
    const metrics = calculateMetrics(jobs);
    return {
      proId, date, jobs,
      optimizedOrder: plan.optimized_order as string[],
      ...metrics,
    };
  }

  // No existing plan - generate one
  return optimizeRoute(proId, date);
}

// ─── Add Job To Route ────────────────────────────────────────────

export async function addJobToRoute(proId: string, date: string, jobId: string): Promise<OptimizedRoute> {
  // Get the new job
  const { rows: newJob } = await pool.query(
    `SELECT id, address, latitude, longitude, scheduled_date
     FROM service_requests WHERE id = $1`,
    [jobId]
  );

  if (!newJob[0]) throw new Error(`Job ${jobId} not found`);

  const j = newJob[0];
  const jobStop: JobStop = {
    jobId: j.id.toString(),
    address: j.address || "Unknown",
    lat: parseFloat(j.latitude) || 28.5383,
    lng: parseFloat(j.longitude) || -81.3792,
    scheduledTime: j.scheduled_date || "",
    estimatedDuration: 60,
  };

  // Get existing route
  const { rows: existing } = await pool.query(
    `SELECT jobs FROM pro_route_plans WHERE pro_id = $1 AND plan_date = $2 ORDER BY created_at DESC LIMIT 1`,
    [proId, date]
  );

  const existingJobs: JobStop[] = existing[0]?.jobs || [];
  existingJobs.push(jobStop);

  // Re-optimize with new job
  const nnRoute = nearestNeighbor(existingJobs);
  const optimized = twoOpt(nnRoute);
  const metrics = calculateMetrics(optimized);

  // Update stored plan
  await pool.query(
    `INSERT INTO pro_route_plans (pro_id, plan_date, jobs, optimized_order, total_distance, total_drive_time, fuel_estimate)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [proId, date, JSON.stringify(optimized), JSON.stringify(optimized.map(j => j.jobId)), metrics.totalDistance, metrics.totalDriveTime, metrics.fuelEstimate]
  );

  return {
    proId, date, jobs: optimized,
    optimizedOrder: optimized.map(j => j.jobId),
    ...metrics,
  };
}

// ─── Weekly Route Summary ────────────────────────────────────────

export async function getWeeklyRouteSummary(proId: string): Promise<object> {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday

  const { rows: plans } = await pool.query(
    `SELECT * FROM pro_route_plans WHERE pro_id = $1 AND plan_date >= $2 ORDER BY plan_date`,
    [proId, weekStart.toISOString().split("T")[0]]
  );

  const totalDistance = plans.reduce((s, p) => s + parseFloat(p.total_distance || 0), 0);
  const totalDriveTime = plans.reduce((s, p) => s + (p.total_drive_time || 0), 0);
  const totalFuel = plans.reduce((s, p) => s + parseFloat(p.fuel_estimate || 0), 0);
  const totalJobs = plans.reduce((s, p) => s + ((p.jobs as any[])?.length || 0), 0);

  return {
    weekStart: weekStart.toISOString().split("T")[0],
    daysWithRoutes: plans.length,
    totalJobs,
    totalDistance: parseFloat(totalDistance.toFixed(1)),
    totalDriveTime,
    totalFuel: parseFloat(totalFuel.toFixed(2)),
    avgDistancePerDay: plans.length > 0 ? parseFloat((totalDistance / plans.length).toFixed(1)) : 0,
    summary: plans.length > 0
      ? `This week: ${totalJobs} jobs across ${plans.length} days. ${totalDistance.toFixed(1)} miles, ~${Math.round(totalDriveTime / 60)}h driving, ~$${totalFuel.toFixed(2)} fuel.`
      : "No routes planned this week yet.",
  };
}
