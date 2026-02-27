/**
 * Community Engine - Neighborhood activity, events, tips, stats
 */
import { pool } from "../db.js";

export async function getNeighborhoodActivity(zip: string, limit = 20) {
  const { rows } = await pool.query(
    `SELECT id, neighborhood_name, zip, activity_type, summary, service_type, created_at
     FROM neighborhood_activity WHERE zip = $1 ORDER BY created_at DESC LIMIT $2`,
    [zip, limit]
  );
  return rows.map(r => ({
    id: r.id,
    neighborhood: r.neighborhood_name,
    type: r.activity_type,
    summary: r.summary,
    serviceType: r.service_type,
    createdAt: r.created_at,
  }));
}

export async function getLocalEvents(zip: string, startDate?: string, endDate?: string) {
  const start = startDate || new Date().toISOString();
  const end = endDate || new Date(Date.now() + 30 * 86400000).toISOString();

  const { rows } = await pool.query(
    `SELECT * FROM local_events WHERE zip = $1 AND start_date >= $2 AND start_date <= $3 ORDER BY start_date ASC LIMIT 50`,
    [zip, start, end]
  );
  return rows.map(e => ({
    id: e.id,
    name: e.event_name,
    type: e.event_type,
    location: e.location,
    address: e.address,
    startDate: e.start_date,
    endDate: e.end_date,
    description: e.description,
    url: e.url,
  }));
}

export async function submitTip(customerId: string, zip: string, category: string, title: string, content: string) {
  const { rows } = await pool.query(
    `INSERT INTO neighborhood_tips (customer_id, zip, category, title, content) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [customerId, zip, category, title, content]
  );
  return { tipId: rows[0].id, message: "Tip submitted! Your neighbors will appreciate it." };
}

export async function voteTip(tipId: string, userId: string, direction: "up" | "down") {
  // Upsert vote
  const { rows: existing } = await pool.query(
    `SELECT id, direction FROM neighborhood_tip_votes WHERE tip_id = $1 AND user_id = $2`,
    [tipId, userId]
  );

  if (existing.length) {
    if (existing[0].direction === direction) return { message: "Already voted" };
    // Change vote
    const oldDir = existing[0].direction;
    await pool.query(`UPDATE neighborhood_tip_votes SET direction = $1 WHERE id = $2`, [direction, existing[0].id]);
    const incCol = direction === "up" ? "upvotes" : "downvotes";
    const decCol = oldDir === "up" ? "upvotes" : "downvotes";
    await pool.query(`UPDATE neighborhood_tips SET ${incCol} = ${incCol} + 1, ${decCol} = GREATEST(${decCol} - 1, 0) WHERE id = $1`, [tipId]);
  } else {
    await pool.query(`INSERT INTO neighborhood_tip_votes (tip_id, user_id, direction) VALUES ($1, $2, $3)`, [tipId, userId, direction]);
    const col = direction === "up" ? "upvotes" : "downvotes";
    await pool.query(`UPDATE neighborhood_tips SET ${col} = ${col} + 1 WHERE id = $1`, [tipId]);
  }

  const { rows } = await pool.query(`SELECT upvotes, downvotes FROM neighborhood_tips WHERE id = $1`, [tipId]);
  return { upvotes: rows[0]?.upvotes || 0, downvotes: rows[0]?.downvotes || 0 };
}

export async function getNeighborhoodStats(zip: string) {
  // Aggregate stats from activity + tips
  const { rows: activityCount } = await pool.query(
    `SELECT activity_type, COUNT(*) as cnt FROM neighborhood_activity WHERE zip = $1 GROUP BY activity_type`,
    [zip]
  );

  const { rows: popularServices } = await pool.query(
    `SELECT service_type, COUNT(*) as cnt FROM neighborhood_activity WHERE zip = $1 AND service_type IS NOT NULL GROUP BY service_type ORDER BY cnt DESC LIMIT 5`,
    [zip]
  );

  const { rows: tipCount } = await pool.query(
    `SELECT COUNT(*) as cnt FROM neighborhood_tips WHERE zip = $1`,
    [zip]
  );

  const { rows: recentTips } = await pool.query(
    `SELECT title, category, upvotes, downvotes FROM neighborhood_tips WHERE zip = $1 ORDER BY upvotes DESC LIMIT 5`,
    [zip]
  );

  return {
    zip,
    activityBreakdown: activityCount.reduce((acc: any, r: any) => { acc[r.activity_type] = parseInt(r.cnt); return acc; }, {}),
    popularServices: popularServices.map((s: any) => ({ service: s.service_type, count: parseInt(s.cnt) })),
    totalTips: parseInt(tipCount[0]?.cnt || "0"),
    topTips: recentTips,
  };
}
