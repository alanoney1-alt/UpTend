/**
 * Smart Scheduling Routes
 * Availability, neighborhood batching, weather, recurring services, smart suggestions
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
    CREATE TABLE IF NOT EXISTS scheduled_batches (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      batch_date TEXT NOT NULL,
      services JSONB NOT NULL DEFAULT '[]',
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS recurring_services (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      service_type TEXT NOT NULL,
      frequency TEXT NOT NULL CHECK (frequency IN ('weekly','biweekly','monthly','quarterly')),
      preferred_day TEXT,
      preferred_time_slot TEXT,
      preferred_pro_id TEXT,
      next_scheduled DATE,
      last_completed TIMESTAMPTZ,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','cancelled')),
      discount_percent NUMERIC DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS scheduling_preferences (
      id TEXT PRIMARY KEY,
      customer_id TEXT UNIQUE NOT NULL,
      preferred_pros JSONB DEFAULT '[]',
      blackout_dates JSONB DEFAULT '[]',
      weather_reschedule BOOLEAN DEFAULT true,
      auto_book_recurring BOOLEAN DEFAULT true,
      notification_prefs JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

export function registerSchedulingRoutes(app: Express) {
  initTables().catch(err => console.error("[Scheduling] Table init error:", err));

  // GET /api/scheduling/availability
  app.get("/api/scheduling/availability", async (req: Request, res: Response) => {
    try {
      const { service, date, zip } = req.query;
      if (!service || !date || !zip) return res.status(400).json({ error: "service, date, and zip required" });

      const slots = [
        { time: "08:00-10:00", label: "Early Morning", proCount: Math.floor(Math.random() * 5) + 1, availability: "high" },
        { time: "10:00-12:00", label: "Late Morning", proCount: Math.floor(Math.random() * 4) + 2, availability: "high" },
        { time: "12:00-14:00", label: "Midday", proCount: Math.floor(Math.random() * 3) + 1, availability: "medium" },
        { time: "14:00-16:00", label: "Afternoon", proCount: Math.floor(Math.random() * 3) + 1, availability: "medium" },
        { time: "16:00-18:00", label: "Late Afternoon", proCount: Math.floor(Math.random() * 2) + 1, availability: "low" },
      ];

      // Check existing bookings for the date to adjust
      const { rows } = await pool.query(
        `SELECT preferred_time AS time_slot, COUNT(*) AS cnt FROM service_requests 
         WHERE scheduled_date::date = $1 AND zip_code = $2 AND status NOT IN ('cancelled','completed')
         GROUP BY preferred_time`,
        [date, zip]
      );

      const bookedSlots = new Map(rows.map((r: any) => [r.time_slot, parseInt(r.cnt)]));
      const adjusted = slots.map(s => ({
        ...s,
        booked: bookedSlots.get(s.time) || 0,
        availability: (s.proCount - (bookedSlots.get(s.time) || 0)) > 2 ? "high" : (s.proCount - (bookedSlots.get(s.time) || 0)) > 0 ? "medium" : "low"
      }));

      res.json({ date, service, zip, slots: adjusted });
    } catch (err: any) {
      console.error("[Scheduling] availability error:", err);
      res.json({ date: req.query.date, service: req.query.service, zip: req.query.zip, slots: [
        { time: "08:00-10:00", label: "Early Morning", proCount: 3, availability: "high", booked: 0 },
        { time: "10:00-12:00", label: "Late Morning", proCount: 4, availability: "high", booked: 0 },
        { time: "12:00-14:00", label: "Midday", proCount: 2, availability: "medium", booked: 0 },
        { time: "14:00-16:00", label: "Afternoon", proCount: 2, availability: "medium", booked: 0 },
        { time: "16:00-18:00", label: "Late Afternoon", proCount: 1, availability: "low", booked: 0 },
      ]});
    }
  });

  // GET /api/scheduling/neighborhood-batch
  app.get("/api/scheduling/neighborhood-batch", async (req: Request, res: Response) => {
    try {
      const { zip } = req.query;
      if (!zip) return res.status(400).json({ error: "zip required" });

      const { rows } = await pool.query(
        `SELECT service_type, scheduled_date, COUNT(*) as job_count
         FROM service_requests 
         WHERE zip_code = $1 AND status IN ('requested','accepted','assigned')
         AND scheduled_date >= CURRENT_DATE AND scheduled_date <= CURRENT_DATE + INTERVAL '7 days'
         GROUP BY service_type, scheduled_date
         ORDER BY scheduled_date`,
        [zip]
      );

      res.json({
        zip,
        neighborhoodJobs: rows,
        batchDiscount: rows.length > 0 ? 10 : 0,
        message: rows.length > 0 ? `${rows.length} service(s) already scheduled in your area this week. Save $10 with neighborhood batching!` : null
      });
    } catch (err: any) {
      console.error("[Scheduling] neighborhood-batch error:", err);
      res.json({ zip: req.query.zip, neighborhoodJobs: [], batchDiscount: 0, message: null });
    }
  });

  // GET /api/scheduling/weather-check
  app.get("/api/scheduling/weather-check", async (req: Request, res: Response) => {
    const { date, zip } = req.query;
    if (!date || !zip) return res.status(400).json({ error: "date and zip required" });

    // Simulated weather (would integrate real API in production)
    const month = new Date(date as string).getMonth();
    const isRainySeason = month >= 5 && month <= 9; // June-Oct in Orlando
    const rainChance = isRainySeason ? Math.floor(Math.random() * 40) + 30 : Math.floor(Math.random() * 20) + 5;
    const temp = isRainySeason ? Math.floor(Math.random() * 10) + 85 : Math.floor(Math.random() * 15) + 65;

    const advisory = rainChance > 50 ? "High rain probability. Consider rescheduling outdoor services." :
                     rainChance > 30 ? "Moderate rain chance. Outdoor services may be affected." :
                     temp > 95 ? "Extreme heat advisory. Hydration breaks recommended." : null;

    res.json({
      date, zip,
      forecast: { rainChance, tempHigh: temp, tempLow: temp - 15, conditions: rainChance > 50 ? "Thunderstorms" : rainChance > 30 ? "Partly Cloudy" : "Sunny" },
      advisory,
      outdoorSafe: rainChance <= 50
    });
  });

  // POST /api/scheduling/recurring
  app.post("/api/scheduling/recurring", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    const { serviceType, frequency, preferredDay, preferredTimeSlot, preferredProId } = req.body;
    if (!serviceType || !frequency) return res.status(400).json({ error: "serviceType and frequency required" });

    const discounts: Record<string, number> = { weekly: 15, biweekly: 10, monthly: 5, quarterly: 3 };
    const id = nanoid(12);
    const nextScheduled = computeNextDate(frequency, preferredDay);

    await pool.query(
      `INSERT INTO recurring_services (id, customer_id, service_type, frequency, preferred_day, preferred_time_slot, preferred_pro_id, next_scheduled, discount_percent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, userId, serviceType, frequency, preferredDay || null, preferredTimeSlot || null, preferredProId || null, nextScheduled, discounts[frequency] || 0]
    );

    res.json({ id, serviceType, frequency, nextScheduled, discountPercent: discounts[frequency] || 0, status: "active" });
  });

  // GET /api/scheduling/recurring
  app.get("/api/scheduling/recurring", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    const { rows } = await pool.query(
      `SELECT * FROM recurring_services WHERE customer_id = $1 ORDER BY created_at DESC`, [userId]
    );
    res.json(rows);
  });

  // PUT /api/scheduling/recurring/:id
  app.put("/api/scheduling/recurring/:id", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    const { action, ...updates } = req.body;
    const { id } = req.params;

    if (action === "pause") {
      await pool.query(`UPDATE recurring_services SET status = 'paused', updated_at = NOW() WHERE id = $1 AND customer_id = $2`, [id, userId]);
    } else if (action === "resume") {
      const next = computeNextDate(updates.frequency || "monthly");
      await pool.query(`UPDATE recurring_services SET status = 'active', next_scheduled = $3, updated_at = NOW() WHERE id = $1 AND customer_id = $2`, [id, userId, next]);
    } else if (action === "cancel") {
      await pool.query(`UPDATE recurring_services SET status = 'cancelled', updated_at = NOW() WHERE id = $1 AND customer_id = $2`, [id, userId]);
    } else if (action === "skip") {
      // Skip next occurrence
      const { rows } = await pool.query(`SELECT frequency FROM recurring_services WHERE id = $1 AND customer_id = $2`, [id, userId]);
      if (rows[0]) {
        const next = computeNextDate(rows[0].frequency);
        await pool.query(`UPDATE recurring_services SET next_scheduled = $3, updated_at = NOW() WHERE id = $1 AND customer_id = $2`, [id, userId, next]);
      }
    } else {
      // Generic update
      const sets: string[] = [];
      const vals: any[] = [id, userId];
      let i = 3;
      for (const [k, v] of Object.entries(updates)) {
        const col = k.replace(/([A-Z])/g, '_$1').toLowerCase();
        sets.push(`${col} = $${i}`);
        vals.push(v);
        i++;
      }
      if (sets.length) {
        sets.push(`updated_at = NOW()`);
        await pool.query(`UPDATE recurring_services SET ${sets.join(', ')} WHERE id = $1 AND customer_id = $2`, vals);
      }
    }

    const { rows } = await pool.query(`SELECT * FROM recurring_services WHERE id = $1`, [id]);
    res.json(rows[0] || { error: "Not found" });
  });

  // POST /api/scheduling/smart-suggest
  app.post("/api/scheduling/smart-suggest", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    const month = new Date().getMonth();
    const isWarm = month >= 3 && month <= 10;
    const suggestions = [
      { service: "landscaping", frequency: isWarm ? "biweekly" : "monthly", reason: isWarm ? "Warm season: grass grows fast" : "Cool season: monthly is sufficient", priority: "high" },
      { service: "pool_cleaning", frequency: "monthly", reason: "Florida pools need consistent care year round", priority: "high" },
      { service: "gutter_cleaning", frequency: "quarterly", reason: "Prevent water damage and pest nesting", priority: "medium" },
      { service: "pressure_washing", frequency: "quarterly", reason: "Florida humidity causes quick buildup", priority: "medium" },
      { service: "hvac_filter", frequency: "monthly", reason: "Year round AC use in Orlando demands fresh filters", priority: "high" },
      { service: "carpet_cleaning", frequency: "quarterly", reason: "Deep clean every quarter maintains indoor air quality", priority: "low" },
    ];

    // Check what they already have
    const { rows: existing } = await pool.query(
      `SELECT service_type FROM recurring_services WHERE customer_id = $1 AND status = 'active'`, [userId]
    );
    const activeServices = new Set(existing.map((r: any) => r.service_type));

    const filtered = suggestions.map(s => ({
      ...s,
      alreadyScheduled: activeServices.has(s.service),
      estimatedMonthlyCost: getEstimatedCost(s.service, s.frequency)
    }));

    res.json({ suggestions: filtered, season: isWarm ? "warm" : "cool", month: month + 1 });
  });

  // ── Appointment Batching (merged from schedule-batch.routes.ts) ──

  // POST /api/schedule/batch - create batch of services for same date
  app.post("/api/schedule/batch", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const { batchDate, services } = req.body;
    if (!batchDate || !services || !Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ error: "batchDate and services array are required" });
    }

    try {
      const { rows } = await pool.query(
        `INSERT INTO scheduled_batches (user_id, batch_date, services)
         VALUES ($1, $2, $3) RETURNING *`,
        [userId, batchDate, JSON.stringify(services)]
      );
      res.json({ success: true, batch: rows[0] });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to create batch" });
    }
  });

  // GET /api/schedule/upcoming - upcoming scheduled services with batching suggestions
  app.get("/api/schedule/upcoming", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    try {
      const { rows: batches } = await pool.query(
        `SELECT * FROM scheduled_batches WHERE user_id = $1 AND batch_date >= CURRENT_DATE::text ORDER BY batch_date ASC`,
        [userId]
      );

      const { rows: dueRows } = await pool.query(
        `SELECT service_type, preferred_date FROM service_requests
         WHERE customer_id = $1 AND status IN ('pending', 'scheduled')
           AND preferred_date >= CURRENT_DATE::text
         ORDER BY preferred_date ASC LIMIT 20`,
        [userId]
      ).catch(() => ({ rows: [] as any[] }));

      const suggestions: string[] = [];
      if (dueRows.length >= 2) {
        const unique = [...new Set(dueRows.map((r: any) => r.service_type).filter(Boolean))];
        if (unique.length >= 2) {
          suggestions.push(`Your ${unique.slice(0, 3).join(" and ")} services are both coming up. Want to schedule them on the same day to save time?`);
        }
      }

      res.json({ batches, suggestions, upcomingServices: dueRows });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch upcoming schedule" });
    }
  });
}

function computeNextDate(frequency: string, preferredDay?: string): string {
  const now = new Date();
  const intervals: Record<string, number> = { weekly: 7, biweekly: 14, monthly: 30, quarterly: 90 };
  const days = intervals[frequency] || 30;
  now.setDate(now.getDate() + days);
  return now.toISOString().split('T')[0];
}

function getEstimatedCost(service: string, frequency: string): number {
  const baseCosts: Record<string, number> = {
    landscaping: 85, pool_cleaning: 120, gutter_cleaning: 150,
    pressure_washing: 200, hvac_filter: 45, carpet_cleaning: 180
  };
  const freqMultiplier: Record<string, number> = { weekly: 4, biweekly: 2, monthly: 1, quarterly: 0.33 };
  return Math.round((baseCosts[service] || 100) * (freqMultiplier[frequency] || 1));
}
