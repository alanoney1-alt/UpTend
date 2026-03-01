/**
 * Job Timeline + Location Routes
 * Real-time tracking, photo updates, ratings
 */
import type { Express, Request, Response } from "express";
import { pool } from "../db";
import { nanoid } from "nanoid";

function getUserId(req: Request): string | null {
  if (!req.isAuthenticated?.() || !req.user) return null;
  return (req.user as any).userId || (req.user as any).id;
}

async function initTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS job_timeline_events (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      photo_url TEXT,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_timeline_job ON job_timeline_events(job_id);

    CREATE TABLE IF NOT EXISTS job_location_updates (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      pro_id TEXT NOT NULL,
      lat DOUBLE PRECISION NOT NULL,
      lng DOUBLE PRECISION NOT NULL,
      heading DOUBLE PRECISION,
      speed DOUBLE PRECISION,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_location_job ON job_location_updates(job_id);

    CREATE TABLE IF NOT EXISTS job_reviews (
      id TEXT PRIMARY KEY,
      job_id TEXT UNIQUE NOT NULL,
      customer_id TEXT NOT NULL,
      pro_id TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

export function registerJobTimelineRoutes(app: Express) {
  initTables().catch(err => console.error("[JobTimeline] Table init error:", err));

  // GET /api/jobs/:jobId/timeline
  app.get("/api/jobs/:jobId/timeline", async (req: Request, res: Response) => {
    const { jobId } = req.params;
    const { rows } = await pool.query(
      `SELECT * FROM job_timeline_events WHERE job_id = $1 ORDER BY created_at ASC`, [jobId]
    );

    // Also get job status to add implicit events
    const { rows: jobs } = await pool.query(
      `SELECT status, created_at, scheduled_date, assigned_hauler_id FROM service_requests WHERE id = $1`, [jobId]
    );
    const job = jobs[0];
    if (!job) return res.status(404).json({ error: "Job not found" });

    // Build full timeline with implicit events
    const timeline = [
      { id: "sys-created", eventType: "created", title: "Service Requested", description: "Your booking was submitted", createdAt: job.created_at },
      ...rows.map((r: any) => ({ id: r.id, eventType: r.event_type, title: r.title, description: r.description, photoUrl: r.photo_url, metadata: r.metadata, createdAt: r.created_at }))
    ];

    res.json({ jobId, status: job.status, timeline });
  });

  // POST /api/jobs/:jobId/photo-update
  app.post("/api/jobs/:jobId/photo-update", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    const { jobId } = req.params;
    const { photoUrl, caption } = req.body;
    if (!photoUrl) return res.status(400).json({ error: "photoUrl required" });

    const id = nanoid(12);
    await pool.query(
      `INSERT INTO job_timeline_events (id, job_id, event_type, title, description, photo_url, metadata)
       VALUES ($1, $2, 'photo_update', 'Progress Photo', $3, $4, $5)`,
      [id, jobId, caption || "Pro shared a progress photo", photoUrl, JSON.stringify({ proId: userId })]
    );

    res.json({ id, eventType: "photo_update", photoUrl, caption });
  });

  // POST /api/jobs/:jobId/location
  app.post("/api/jobs/:jobId/location", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    const { jobId } = req.params;
    const { lat, lng, heading, speed } = req.body;
    if (lat == null || lng == null) return res.status(400).json({ error: "lat and lng required" });

    const id = nanoid(12);
    await pool.query(
      `INSERT INTO job_location_updates (id, job_id, pro_id, lat, lng, heading, speed)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, jobId, userId, lat, lng, heading || null, speed || null]
    );

    res.json({ id, lat, lng });
  });

  // GET /api/jobs/:jobId/location
  app.get("/api/jobs/:jobId/location", async (req: Request, res: Response) => {
    const { jobId } = req.params;
    const { rows } = await pool.query(
      `SELECT lat, lng, heading, speed, created_at FROM job_location_updates 
       WHERE job_id = $1 ORDER BY created_at DESC LIMIT 1`, [jobId]
    );

    if (!rows[0]) return res.json({ lat: null, lng: null, lastUpdate: null });
    res.json({ lat: rows[0].lat, lng: rows[0].lng, heading: rows[0].heading, speed: rows[0].speed, lastUpdate: rows[0].created_at });
  });

  // POST /api/jobs/:jobId/rate
  app.post("/api/jobs/:jobId/rate", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    const { jobId } = req.params;
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: "Rating 1-5 required" });

    // Get pro from job
    const { rows: jobs } = await pool.query(
      `SELECT assigned_hauler_id FROM service_requests WHERE id = $1`, [jobId]
    );
    if (!jobs[0]) return res.status(404).json({ error: "Job not found" });

    const id = nanoid(12);
    await pool.query(
      `INSERT INTO job_reviews (id, job_id, customer_id, pro_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (job_id) DO UPDATE SET rating = $5, comment = $6`,
      [id, jobId, userId, jobs[0].assigned_hauler_id || "unknown", rating, comment || null]
    );

    // Add timeline event
    await pool.query(
      `INSERT INTO job_timeline_events (id, job_id, event_type, title, description, metadata)
       VALUES ($1, $2, 'rated', 'Service Rated', $3, $4)`,
      [nanoid(12), jobId, `Customer gave ${rating} star${rating > 1 ? 's' : ''}`, JSON.stringify({ rating, comment })]
    );

    res.json({ success: true, rating, comment });
  });
}
