/**
 * DIY-to-Pro Recruitment Pipeline Routes
 *
 * Customers who complete DIY repairs through George are natural pro candidates.
 * After milestones (3/5/10 completions), George recruits them to become UpTend pros.
 *
 * IMPORTANT: Pros are 1099 independent contractors — uses "earnings/payout/per job" language only.
 */

import type { Express, Request, Response } from "express";
import { db, pool } from "../db.js";

// ─── Category → Service Type mapping ─────────────────────
const CATEGORY_TO_SERVICE: Record<string, { serviceType: string; label: string }> = {
  plumbing: { serviceType: "plumbing", label: "Plumbing" },
  electrical: { serviceType: "handyman", label: "Electrical / Handyman" },
  hvac: { serviceType: "hvac", label: "HVAC" },
  appliance: { serviceType: "appliance_repair", label: "Appliance Repair" },
  carpentry: { serviceType: "handyman", label: "Carpentry / Handyman" },
  painting: { serviceType: "painting", label: "Painting" },
  drywall: { serviceType: "handyman", label: "Drywall / Handyman" },
  flooring: { serviceType: "flooring", label: "Flooring" },
  landscaping: { serviceType: "lawn_care", label: "Lawn & Landscaping" },
  cleaning: { serviceType: "cleaning", label: "Cleaning" },
  roofing: { serviceType: "roofing", label: "Roofing" },
  garage: { serviceType: "handyman", label: "Garage / Handyman" },
  general: { serviceType: "handyman", label: "General Handyman" },
};

// Average monthly earnings by service type in Orlando (based on UpTend data)
const ORLANDO_MONTHLY_EARNINGS: Record<string, { low: number; high: number; perJob: string }> = {
  plumbing: { low: 4200, high: 7500, perJob: "$150-$450" },
  handyman: { low: 3200, high: 5800, perJob: "$75-$250" },
  hvac: { low: 4800, high: 8200, perJob: "$200-$600" },
  appliance_repair: { low: 3500, high: 6000, perJob: "$100-$350" },
  painting: { low: 3000, high: 5500, perJob: "$200-$800" },
  flooring: { low: 3800, high: 6500, perJob: "$300-$1,200" },
  lawn_care: { low: 2800, high: 5000, perJob: "$50-$200" },
  cleaning: { low: 2500, high: 4500, perJob: "$80-$250" },
  roofing: { low: 5000, high: 9000, perJob: "$500-$2,000" },
};

export function registerDiyToProRoutes(app: Express) {

  // POST /api/diy/complete — log a DIY completion
  app.post("/api/diy/complete", async (req: Request, res: Response) => {
    try {
      const { customer_id, repair_category, repair_title, difficulty, time_taken_minutes, self_rating } = req.body;
      if (!customer_id || !repair_category || !repair_title) {
        return res.status(400).json({ error: "customer_id, repair_category, and repair_title are required" });
      }

      const result = await pool.query(
        `INSERT INTO diy_completions (customer_id, repair_category, repair_title, difficulty, time_taken_minutes, self_rating)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [customer_id, repair_category.toLowerCase(), repair_title, difficulty || "medium", time_taken_minutes || null, self_rating || null]
      );

      res.json({ success: true, completion: result.rows[0] });
    } catch (err: any) {
      console.error("Error logging DIY completion:", err);
      res.status(500).json({ error: "Failed to log DIY completion" });
    }
  });

  // GET /api/diy/completions/:customerId — get all completions + count + skill summary
  app.get("/api/diy/completions/:customerId", async (req: Request, res: Response) => {
    try {
      const { customerId } = req.params;

      const completions = await pool.query(
        `SELECT * FROM diy_completions WHERE customer_id = $1 ORDER BY completed_at DESC`,
        [customerId]
      );

      // Build skill summary
      const skillMap: Record<string, { count: number; avgRating: number; totalTime: number }> = {};
      for (const c of completions.rows) {
        if (!skillMap[c.repair_category]) {
          skillMap[c.repair_category] = { count: 0, avgRating: 0, totalTime: 0 };
        }
        skillMap[c.repair_category].count++;
        if (c.self_rating) skillMap[c.repair_category].avgRating += c.self_rating;
        if (c.time_taken_minutes) skillMap[c.repair_category].totalTime += c.time_taken_minutes;
      }

      const skillSummary = Object.entries(skillMap).map(([category, data]) => ({
        category,
        completions: data.count,
        avgSelfRating: data.count > 0 ? Math.round((data.avgRating / data.count) * 10) / 10 : null,
        totalTimeMinutes: data.totalTime,
        serviceType: CATEGORY_TO_SERVICE[category]?.serviceType || "handyman",
      }));

      res.json({
        customerId,
        totalCompletions: completions.rows.length,
        completions: completions.rows,
        skillSummary,
      });
    } catch (err: any) {
      console.error("Error fetching DIY completions:", err);
      res.status(500).json({ error: "Failed to fetch completions" });
    }
  });

  // GET /api/diy/pro-ready/:customerId — check if customer qualifies for pro pitch
  app.get("/api/diy/pro-ready/:customerId", async (req: Request, res: Response) => {
    try {
      const { customerId } = req.params;

      const countResult = await pool.query(
        `SELECT COUNT(*) as total FROM diy_completions WHERE customer_id = $1`,
        [customerId]
      );
      const total = parseInt(countResult.rows[0].total);

      // Check if already pitched/declined recently
      const conversionResult = await pool.query(
        `SELECT * FROM diy_to_pro_conversions WHERE customer_id = $1`,
        [customerId]
      );
      const existing = conversionResult.rows[0];

      // Respect 30-day cooldown after decline
      if (existing?.status === "declined" && existing.pitch_shown_at) {
        const daysSincePitch = (Date.now() - new Date(existing.pitch_shown_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSincePitch < 30) {
          return res.json({ ready: false, reason: "declined_recently", totalCompletions: total, daysUntilNextPitch: Math.ceil(30 - daysSincePitch) });
        }
      }

      // Already applied/approved
      if (existing?.status === "applied" || existing?.status === "approved") {
        return res.json({ ready: false, reason: "already_in_pipeline", status: existing.status, totalCompletions: total });
      }

      // Determine milestone
      let milestone: number | null = null;
      let pitchLevel: string = "none";
      if (total >= 10) { milestone = 10; pitchLevel = "full_application"; }
      else if (total >= 5) { milestone = 5; pitchLevel = "earnings_pitch"; }
      else if (total >= 3) { milestone = 3; pitchLevel = "casual_mention"; }

      res.json({
        ready: milestone !== null,
        totalCompletions: total,
        milestone,
        pitchLevel,
        alreadyPitched: !!existing,
      });
    } catch (err: any) {
      console.error("Error checking pro readiness:", err);
      res.status(500).json({ error: "Failed to check pro readiness" });
    }
  });

  // POST /api/diy/pro-interest — customer expresses interest (or declines)
  app.post("/api/diy/pro-interest", async (req: Request, res: Response) => {
    try {
      const { customer_id, interested } = req.body;
      if (!customer_id || interested === undefined) {
        return res.status(400).json({ error: "customer_id and interested (boolean) are required" });
      }

      const countResult = await pool.query(
        `SELECT COUNT(*) as total FROM diy_completions WHERE customer_id = $1`,
        [customer_id]
      );
      const total = parseInt(countResult.rows[0].total);
      const milestone = total >= 10 ? 10 : total >= 5 ? 5 : 3;

      const status = interested ? "interested" : "declined";

      await pool.query(
        `INSERT INTO diy_to_pro_conversions (customer_id, total_diy_completed, trigger_milestone, pitch_shown_at, interested, status)
         VALUES ($1, $2, $3, NOW(), $4, $5)
         ON CONFLICT (customer_id) DO UPDATE SET
           total_diy_completed = $2, trigger_milestone = $3, pitch_shown_at = NOW(),
           interested = $4, status = $5`,
        [customer_id, total, milestone, interested, status]
      );

      res.json({ success: true, status, totalCompletions: total, milestone });
    } catch (err: any) {
      console.error("Error recording pro interest:", err);
      res.status(500).json({ error: "Failed to record interest" });
    }
  });

  // GET /api/diy/earnings-preview/:customerId — earnings potential based on DIY skills
  app.get("/api/diy/earnings-preview/:customerId", async (req: Request, res: Response) => {
    try {
      const { customerId } = req.params;

      const completions = await pool.query(
        `SELECT repair_category, COUNT(*) as count FROM diy_completions
         WHERE customer_id = $1 GROUP BY repair_category ORDER BY count DESC`,
        [customerId]
      );

      if (completions.rows.length === 0) {
        return res.json({ customerId, earningsPreview: null, message: "No DIY completions yet" });
      }

      const skills: string[] = [];
      let totalLow = 0;
      let totalHigh = 0;
      const serviceBreakdown: any[] = [];

      // Deduplicate service types
      const seenServiceTypes = new Set<string>();

      for (const row of completions.rows) {
        const mapping = CATEGORY_TO_SERVICE[row.repair_category] || CATEGORY_TO_SERVICE.general;
        if (seenServiceTypes.has(mapping.serviceType)) continue;
        seenServiceTypes.add(mapping.serviceType);

        const earnings = ORLANDO_MONTHLY_EARNINGS[mapping.serviceType] || ORLANDO_MONTHLY_EARNINGS.handyman;
        skills.push(mapping.label);
        totalLow += earnings.low;
        totalHigh += earnings.high;

        serviceBreakdown.push({
          category: row.repair_category,
          serviceType: mapping.serviceType,
          label: mapping.label,
          completions: parseInt(row.count),
          monthlyEarningsRange: `$${earnings.low.toLocaleString()}-$${earnings.high.toLocaleString()}`,
          perJobRange: earnings.perJob,
        });
      }

      // Cap at realistic multi-service earnings
      const cappedLow = Math.min(totalLow, 8000);
      const cappedHigh = Math.min(totalHigh, 15000);

      res.json({
        customerId,
        earningsPreview: {
          skills,
          totalMonthlyRange: `$${cappedLow.toLocaleString()}-$${cappedHigh.toLocaleString()}`,
          serviceBreakdown,
          message: `You've already proven you can do ${skills.join(", ")} — that's $${cappedLow.toLocaleString()}-$${cappedHigh.toLocaleString()}/month potential as an UpTend pro in Orlando.`,
          note: "Your DIY history counts toward certification — you're already ahead of most applicants.",
        },
      });
    } catch (err: any) {
      console.error("Error generating earnings preview:", err);
      res.status(500).json({ error: "Failed to generate earnings preview" });
    }
  });
}
