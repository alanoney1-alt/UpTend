/**
 * Appointment Batching Routes
 * Schedule multiple services on the same day
 */
import type { Express, Request, Response } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";

function getUserId(req: Request): string | null {
  if (!req.user) return null;
  return (req.user as any).userId || (req.user as any).id || null;
}

export function registerScheduleBatchRoutes(app: Express) {
  db.execute(sql`
    CREATE TABLE IF NOT EXISTS scheduled_batches (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      batch_date TEXT NOT NULL,
      services JSONB NOT NULL DEFAULT '[]',
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS recurring_job_schedules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id TEXT NOT NULL,
      contract_id TEXT,
      property_id TEXT,
      service_type TEXT NOT NULL,
      frequency TEXT NOT NULL DEFAULT 'monthly',
      day_of_week INT,
      week_of_month INT,
      next_run_date TEXT,
      last_run_date TEXT,
      auto_dispatch BOOLEAN DEFAULT false,
      assigned_crew_id TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `).catch(() => {});

  // POST /api/schedule/batch - create batch of services for same date
  app.post("/api/schedule/batch", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const { batchDate, services } = req.body;
    if (!batchDate || !services || !Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ error: "batchDate and services array are required" });
    }

    try {
      const result = await db.execute(sql`
        INSERT INTO scheduled_batches (user_id, batch_date, services)
        VALUES (${userId}, ${batchDate}, ${JSON.stringify(services)})
        RETURNING *
      `);
      res.json({ success: true, batch: (result as any).rows?.[0] || result });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to create batch" });
    }
  });

  // GET /api/schedule/upcoming - upcoming scheduled services with batching suggestions
  app.get("/api/schedule/upcoming", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    try {
      // Get existing batches
      const batches = await db.execute(sql`
        SELECT * FROM scheduled_batches WHERE user_id = ${userId} AND batch_date >= CURRENT_DATE::text ORDER BY batch_date ASC
      `);

      // Get overdue/upcoming service requests for batching suggestions
      const servicesDue = await db.execute(sql`
        SELECT service_type, preferred_date FROM service_requests
        WHERE customer_id = ${parseInt(userId)}
          AND status IN ('pending', 'scheduled')
          AND preferred_date >= CURRENT_DATE::text
        ORDER BY preferred_date ASC
        LIMIT 20
      `).catch(() => ({ rows: [] }));

      const dueRows = (servicesDue as any).rows || [];
      const suggestions: string[] = [];
      if (dueRows.length >= 2) {
        const serviceNames = dueRows.map((r: any) => r.service_type).filter(Boolean);
        const unique = [...new Set(serviceNames)];
        if (unique.length >= 2) {
          suggestions.push(`Your ${unique.slice(0, 3).join(" and ")} services are both coming up. Want to schedule them on the same day to save time?`);
        }
      }

      res.json({
        batches: (batches as any).rows || [],
        suggestions,
        upcomingServices: dueRows,
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch upcoming schedule" });
    }
  });

  // ─── [Feature 6] Recurring Job Schedules ─────────────────────────────────

  // POST /api/schedule/recurring - create recurring schedule
  app.post("/api/schedule/recurring", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const { businessId, contractId, propertyId, serviceType, frequency, dayOfWeek, weekOfMonth, autoDispatch, assignedCrewId } = req.body;
    if (!businessId || !serviceType) return res.status(400).json({ error: "businessId and serviceType required" });

    // Calculate next run date
    const now = new Date();
    const freqDays: Record<string, number> = { weekly: 7, biweekly: 14, monthly: 30, quarterly: 90 };
    const nextDate = new Date(now.getTime() + (freqDays[frequency] || 30) * 86400000);
    const nextRunDate = nextDate.toISOString().split("T")[0];

    try {
      const result = await db.execute(sql`
        INSERT INTO recurring_job_schedules (business_id, contract_id, property_id, service_type, frequency, day_of_week, week_of_month, next_run_date, auto_dispatch, assigned_crew_id)
        VALUES (${businessId}, ${contractId || null}, ${propertyId || null}, ${serviceType}, ${frequency || 'monthly'}, ${dayOfWeek ?? null}, ${weekOfMonth ?? null}, ${nextRunDate}, ${autoDispatch || false}, ${assignedCrewId || null})
        RETURNING *
      `);
      res.status(201).json((result as any).rows?.[0] || result);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to create recurring schedule" });
    }
  });

  // GET /api/schedule/recurring/:businessId - list schedules
  app.get("/api/schedule/recurring/:businessId", async (req: Request, res: Response) => {
    try {
      const result = await db.execute(sql`
        SELECT * FROM recurring_job_schedules WHERE business_id = ${req.params.businessId} ORDER BY created_at DESC
      `);
      res.json((result as any).rows || []);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch schedules" });
    }
  });

  // POST /api/schedule/recurring/:id/generate - generate next job from schedule
  app.post("/api/schedule/recurring/:id/generate", async (req: Request, res: Response) => {
    try {
      const schedule = await db.execute(sql`SELECT * FROM recurring_job_schedules WHERE id = ${req.params.id}`);
      const sched = (schedule as any).rows?.[0];
      if (!sched) return res.status(404).json({ error: "Schedule not found" });

      // Update last_run_date and compute next_run_date
      const freqDays: Record<string, number> = { weekly: 7, biweekly: 14, monthly: 30, quarterly: 90 };
      const days = freqDays[sched.frequency] || 30;
      const nextDate = new Date(Date.now() + days * 86400000).toISOString().split("T")[0];

      await db.execute(sql`
        UPDATE recurring_job_schedules SET last_run_date = CURRENT_DATE::text, next_run_date = ${nextDate} WHERE id = ${req.params.id}
      `);

      res.json({
        generated: true,
        scheduleId: sched.id,
        serviceType: sched.service_type,
        propertyId: sched.property_id,
        nextRunDate: nextDate,
        message: `Job generated for ${sched.service_type}. Next run: ${nextDate}`,
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to generate job" });
    }
  });

  // GET /api/schedule/recurring/due - all schedules due today (cron-friendly)
  app.get("/api/schedule/recurring/due", async (_req: Request, res: Response) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const result = await db.execute(sql`
        SELECT * FROM recurring_job_schedules WHERE is_active = true AND next_run_date <= ${today}
      `);
      res.json((result as any).rows || []);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch due schedules" });
    }
  });
}
