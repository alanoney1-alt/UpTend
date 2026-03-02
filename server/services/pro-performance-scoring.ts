import { pool, db } from "../db.js";
import { nanoid } from "nanoid";

// Ensure table exists
const ENSURE_TABLE = `
CREATE TABLE IF NOT EXISTS pro_performance_scores (
  id TEXT PRIMARY KEY,
  pro_id TEXT NOT NULL UNIQUE,
  response_time_avg DOUBLE PRECISION DEFAULT 0,
  acceptance_rate DOUBLE PRECISION DEFAULT 0,
  completion_rate DOUBLE PRECISION DEFAULT 0,
  on_time_rate DOUBLE PRECISION DEFAULT 0,
  scope_change_rate DOUBLE PRECISION DEFAULT 0,
  customer_rating_avg DOUBLE PRECISION DEFAULT 0,
  rebook_rate DOUBLE PRECISION DEFAULT 0,
  cancellation_rate DOUBLE PRECISION DEFAULT 0,
  overall_score DOUBLE PRECISION DEFAULT 0,
  total_jobs INTEGER DEFAULT 0,
  calculated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
`;

let tableEnsured = false;
async function ensureTable() {
  if (tableEnsured) return;
  await pool.query(ENSURE_TABLE);
  tableEnsured = true;
}

function clamp(v: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v));
}

export async function calculateProScore(proId: string) {
  await ensureTable();

  // Fetch all service requests assigned to this pro
  const { rows: jobs } = await pool.query(
    `SELECT id, status, created_at, accepted_at, completed_at, scheduled_date, scheduled_time,
            customer_id, rating, scope_changed, cancelled_by
     FROM service_requests WHERE hauler_id = $1`,
    [proId]
  );

  if (jobs.length === 0) return null;

  const totalOffered = jobs.length;
  const accepted = jobs.filter((j: any) => j.status !== "declined" && j.status !== "expired");
  const completed = jobs.filter((j: any) => j.status === "completed");
  const cancelled = jobs.filter((j: any) => j.status === "cancelled" && j.cancelled_by === "pro");
  const rated = completed.filter((j: any) => j.rating != null);
  const scopeChanged = jobs.filter((j: any) => j.scope_changed === true);

  // Response time (seconds between created_at and accepted_at)
  const responseTimes = accepted
    .filter((j: any) => j.accepted_at && j.created_at)
    .map((j: any) => (new Date(j.accepted_at).getTime() - new Date(j.created_at).getTime()) / 1000);
  const response_time_avg = responseTimes.length > 0
    ? responseTimes.reduce((a: number, b: number) => a + b, 0) / responseTimes.length
    : 0;

  // On-time: completed before or on scheduled date
  const onTime = completed.filter((j: any) => {
    if (!j.completed_at || !j.scheduled_date) return false;
    return new Date(j.completed_at) <= new Date(j.scheduled_date + "T23:59:59");
  });

  // Rebook rate: unique customers who booked more than once
  const customerJobs = new Map<string, number>();
  for (const j of completed) {
    if (j.customer_id) customerJobs.set(j.customer_id, (customerJobs.get(j.customer_id) || 0) + 1);
  }
  const uniqueCustomers = customerJobs.size;
  const rebookedCustomers = [...customerJobs.values()].filter(c => c > 1).length;

  const acceptance_rate = totalOffered > 0 ? (accepted.length / totalOffered) * 100 : 0;
  const completion_rate = accepted.length > 0 ? (completed.length / accepted.length) * 100 : 0;
  const on_time_rate = completed.length > 0 ? (onTime.length / completed.length) * 100 : 0;
  const scope_change_rate = totalOffered > 0 ? (scopeChanged.length / totalOffered) * 100 : 0;
  const customer_rating_avg = rated.length > 0
    ? rated.reduce((s: number, j: any) => s + Number(j.rating), 0) / rated.length
    : 0;
  const rebook_rate = uniqueCustomers > 0 ? (rebookedCustomers / uniqueCustomers) * 100 : 0;
  const cancellation_rate = totalOffered > 0 ? (cancelled.length / totalOffered) * 100 : 0;

  // Weighted composite: normalize each to 0-100 scale
  const ratingNorm = clamp((customer_rating_avg / 5) * 100);
  const lowCancelNorm = clamp(100 - cancellation_rate);

  const overall_score = clamp(
    completion_rate * 0.25 +
    ratingNorm * 0.25 +
    on_time_rate * 0.20 +
    acceptance_rate * 0.15 +
    rebook_rate * 0.10 +
    lowCancelNorm * 0.05
  );

  const metrics = {
    pro_id: proId,
    response_time_avg,
    acceptance_rate,
    completion_rate,
    on_time_rate,
    scope_change_rate,
    customer_rating_avg,
    rebook_rate,
    cancellation_rate,
    overall_score,
    total_jobs: totalOffered,
  };

  // Upsert
  await pool.query(
    `INSERT INTO pro_performance_scores (id, pro_id, response_time_avg, acceptance_rate, completion_rate,
      on_time_rate, scope_change_rate, customer_rating_avg, rebook_rate, cancellation_rate, overall_score,
      total_jobs, calculated_at, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW(),NOW())
     ON CONFLICT (pro_id) DO UPDATE SET
       response_time_avg=$3, acceptance_rate=$4, completion_rate=$5, on_time_rate=$6,
       scope_change_rate=$7, customer_rating_avg=$8, rebook_rate=$9, cancellation_rate=$10,
       overall_score=$11, total_jobs=$12, calculated_at=NOW(), updated_at=NOW()`,
    [nanoid(), proId, response_time_avg, acceptance_rate, completion_rate, on_time_rate,
     scope_change_rate, customer_rating_avg, rebook_rate, cancellation_rate, overall_score, totalOffered]
  );

  return metrics;
}

export async function updateAllProScores() {
  await ensureTable();
  const { rows } = await pool.query(
    `SELECT DISTINCT hauler_id FROM service_requests WHERE hauler_id IS NOT NULL`
  );
  const results = [];
  for (const row of rows) {
    const score = await calculateProScore(row.hauler_id);
    if (score) results.push(score);
  }
  return results;
}

export async function getProScore(proId: string) {
  await ensureTable();
  const { rows } = await pool.query(
    `SELECT * FROM pro_performance_scores WHERE pro_id = $1`, [proId]
  );
  return rows[0] || null;
}

export async function getLeaderboard(limit = 50) {
  await ensureTable();
  const { rows } = await pool.query(
    `SELECT * FROM pro_performance_scores ORDER BY overall_score DESC LIMIT $1`, [limit]
  );
  return rows;
}
