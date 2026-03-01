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
    )
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
}
