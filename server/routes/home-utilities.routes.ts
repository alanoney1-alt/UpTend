/**
 * Home Utilities Routes - Home Operating System
 *
 * Endpoints for utility profiles, trash schedules, sprinkler settings,
 * home dashboard, and reminders.
 */

import { Router, type Express } from "express";
import { z } from "zod";
import { pool } from "../db";
import { requireAuth } from "../auth-middleware";
import { getHomeDashboard, getWeeklyHomeView, getTonightChecklist } from "../services/home-dashboard";
import { lookupTrashSchedule, lookupUtilityProviders, lookupWaterRestrictions, getSeasonalSprinklerRecommendation } from "../services/municipal-data";

export function registerHomeUtilitiesRoutes(app: Express) {
  const router = Router();

  // GET /api/home/utilities/:customerId - utility profile
  router.get("/utilities/:customerId", requireAuth, async (req, res) => {
    try {
      const { customerId } = req.params;
      const result = await pool.query(
        `SELECT * FROM home_utility_profiles WHERE customer_id = $1 LIMIT 1`,
        [customerId]
      );
      if (result.rows.length === 0) {
        return res.json({ profile: null, message: "No utility profile found. George can set this up for you!" });
      }
      const p = result.rows[0];
      res.json({
        profile: {
          id: p.id,
          customerId: p.customer_id,
          address: p.address,
          city: p.city,
          state: p.state,
          zip: p.zip,
          county: p.county,
          utilityProvider: p.utility_provider,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        },
      });
    } catch (err: any) {
      console.error("[Home Utilities] GET utilities error:", err.message);
      res.status(500).json({ error: "Failed to fetch utility profile" });
    }
  });

  // GET /api/home/trash-schedule/:customerId - trash/recycling schedule
  router.get("/trash-schedule/:customerId", requireAuth, async (req, res) => {
    try {
      const { customerId } = req.params;
      const result = await pool.query(
        `SELECT * FROM trash_recycling_schedules WHERE customer_id = $1 LIMIT 1`,
        [customerId]
      );
      if (result.rows.length === 0) {
        return res.json({ schedule: null, message: "No trash schedule found. Tell George your zip and he'll look it up!" });
      }
      const s = result.rows[0];
      res.json({
        schedule: {
          id: s.id,
          customerId: s.customer_id,
          zip: s.zip,
          trashDay: s.trash_day,
          trashFrequency: s.trash_frequency,
          recyclingDay: s.recycling_day,
          recyclingFrequency: s.recycling_frequency,
          yardWasteDay: s.yard_waste_day,
          bulkPickupDay: s.bulk_pickup_day,
          bulkPickupFrequency: s.bulk_pickup_frequency,
          provider: s.provider,
          source: s.source,
          lastVerified: s.last_verified,
        },
      });
    } catch (err: any) {
      console.error("[Home Utilities] GET trash-schedule error:", err.message);
      res.status(500).json({ error: "Failed to fetch trash schedule" });
    }
  });

  // GET /api/home/sprinklers/:customerId - sprinkler settings
  router.get("/sprinklers/:customerId", requireAuth, async (req, res) => {
    try {
      const { customerId } = req.params;
      const result = await pool.query(
        `SELECT * FROM sprinkler_settings WHERE customer_id = $1 LIMIT 1`,
        [customerId]
      );
      if (result.rows.length === 0) {
        return res.json({ sprinklers: null, message: "No sprinkler settings found." });
      }
      const s = result.rows[0];
      res.json({
        sprinklers: {
          id: s.id,
          customerId: s.customer_id,
          systemType: s.system_type,
          zones: s.zones,
          waterRestrictions: s.water_restrictions,
          rainSensorEnabled: s.rain_sensor_enabled,
          smartControllerBrand: s.smart_controller_brand,
          connectedToGeorge: s.connected_to_george,
          lastUpdated: s.last_updated,
        },
      });
    } catch (err: any) {
      console.error("[Home Utilities] GET sprinklers error:", err.message);
      res.status(500).json({ error: "Failed to fetch sprinkler settings" });
    }
  });

  // POST /api/home/sprinklers/:customerId - update sprinkler settings
  const sprinklerUpdateSchema = z.object({
    systemType: z.enum(["manual", "timer", "smart"]).optional(),
    zones: z.array(z.object({
      zoneName: z.string(),
      area: z.string().optional(),
      plantType: z.string().optional(),
      waterDays: z.array(z.string()).optional(),
      startTime: z.string().optional(),
      duration: z.number().optional(),
      seasonalAdjust: z.boolean().optional(),
    })).optional(),
    rainSensorEnabled: z.boolean().optional(),
    smartControllerBrand: z.string().optional(),
    connectedToGeorge: z.boolean().optional(),
  });

  router.post("/sprinklers/:customerId", requireAuth, async (req, res) => {
    try {
      const { customerId } = req.params;
      const data = sprinklerUpdateSchema.parse(req.body);

      const sets: string[] = [];
      const vals: any[] = [customerId];
      let idx = 2;

      if (data.systemType) { sets.push(`system_type = $${idx++}`); vals.push(data.systemType); }
      if (data.zones) { sets.push(`zones = $${idx++}`); vals.push(JSON.stringify(data.zones)); }
      if (data.rainSensorEnabled !== undefined) { sets.push(`rain_sensor_enabled = $${idx++}`); vals.push(data.rainSensorEnabled); }
      if (data.smartControllerBrand) { sets.push(`smart_controller_brand = $${idx++}`); vals.push(data.smartControllerBrand); }
      if (data.connectedToGeorge !== undefined) { sets.push(`connected_to_george = $${idx++}`); vals.push(data.connectedToGeorge); }
      sets.push(`last_updated = NOW()`);

      if (sets.length === 1) {
        return res.status(400).json({ error: "No fields to update" });
      }

      // Upsert
      const existing = await pool.query(`SELECT id FROM sprinkler_settings WHERE customer_id = $1`, [customerId]);
      if (existing.rows.length > 0) {
        await pool.query(`UPDATE sprinkler_settings SET ${sets.join(", ")} WHERE customer_id = $1`, vals);
      } else {
        await pool.query(
          `INSERT INTO sprinkler_settings (customer_id, system_type, zones, rain_sensor_enabled, smart_controller_brand, connected_to_george)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [customerId, data.systemType || "manual", JSON.stringify(data.zones || []), data.rainSensorEnabled || false, data.smartControllerBrand || null, data.connectedToGeorge || false]
        );
      }

      res.json({ success: true, message: "Sprinkler settings updated" });
    } catch (err: any) {
      console.error("[Home Utilities] POST sprinklers error:", err.message);
      res.status(500).json({ error: "Failed to update sprinkler settings" });
    }
  });

  // GET /api/home/dashboard/:customerId - full home dashboard
  router.get("/dashboard/:customerId", requireAuth, async (req, res) => {
    try {
      const dashboard = await getHomeDashboard(req.params.customerId);
      res.json(dashboard);
    } catch (err: any) {
      console.error("[Home Utilities] GET dashboard error:", err.message);
      res.status(500).json({ error: "Failed to load home dashboard" });
    }
  });

  // GET /api/home/reminders/:customerId - all reminders
  router.get("/reminders/:customerId", requireAuth, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM home_reminders WHERE customer_id = $1 ORDER BY next_due_date ASC`,
        [req.params.customerId]
      );
      res.json({
        reminders: result.rows.map((r: any) => ({
          id: r.id,
          customerId: r.customer_id,
          reminderType: r.reminder_type,
          title: r.title,
          description: r.description,
          frequency: r.frequency,
          nextDueDate: r.next_due_date,
          time: r.time,
          enabled: r.enabled,
          createdAt: r.created_at,
        })),
      });
    } catch (err: any) {
      console.error("[Home Utilities] GET reminders error:", err.message);
      res.status(500).json({ error: "Failed to fetch reminders" });
    }
  });

  // POST /api/home/reminders - create custom reminder
  const reminderSchema = z.object({
    customerId: z.string(),
    reminderType: z.enum(["trash", "recycling", "yard_waste", "sprinkler_adjust", "filter_change", "bill_due", "bulk_pickup", "pest_control", "lawn_treatment"]),
    title: z.string().min(1),
    description: z.string().optional(),
    frequency: z.enum(["daily", "weekly", "biweekly", "monthly", "seasonal", "custom"]).default("monthly"),
    nextDueDate: z.string(),
    time: z.string().default("7:00 PM"),
  });

  router.post("/reminders", requireAuth, async (req, res) => {
    try {
      const data = reminderSchema.parse(req.body);
      const result = await pool.query(
        `INSERT INTO home_reminders (customer_id, reminder_type, title, description, frequency, next_due_date, time)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [data.customerId, data.reminderType, data.title, data.description || null, data.frequency, data.nextDueDate, data.time]
      );
      res.json({ success: true, id: result.rows[0].id, message: "Reminder created! George will remind you." });
    } catch (err: any) {
      console.error("[Home Utilities] POST reminders error:", err.message);
      res.status(500).json({ error: "Failed to create reminder" });
    }
  });

  // PUT /api/home/reminders/:id - update reminder
  router.put("/reminders/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, frequency, nextDueDate, time, enabled } = req.body;

      const sets: string[] = [];
      const vals: any[] = [id];
      let idx = 2;

      if (title) { sets.push(`title = $${idx++}`); vals.push(title); }
      if (description !== undefined) { sets.push(`description = $${idx++}`); vals.push(description); }
      if (frequency) { sets.push(`frequency = $${idx++}`); vals.push(frequency); }
      if (nextDueDate) { sets.push(`next_due_date = $${idx++}`); vals.push(nextDueDate); }
      if (time) { sets.push(`time = $${idx++}`); vals.push(time); }
      if (enabled !== undefined) { sets.push(`enabled = $${idx++}`); vals.push(enabled); }

      if (sets.length === 0) return res.status(400).json({ error: "No fields to update" });

      await pool.query(`UPDATE home_reminders SET ${sets.join(", ")} WHERE id = $1`, vals);
      res.json({ success: true, message: "Reminder updated" });
    } catch (err: any) {
      console.error("[Home Utilities] PUT reminders error:", err.message);
      res.status(500).json({ error: "Failed to update reminder" });
    }
  });

  // GET /api/home/tonight/:customerId - tonight's checklist
  router.get("/tonight/:customerId", requireAuth, async (req, res) => {
    try {
      const checklist = await getTonightChecklist(req.params.customerId);
      res.json(checklist);
    } catch (err: any) {
      console.error("[Home Utilities] GET tonight error:", err.message);
      res.status(500).json({ error: "Failed to load tonight's checklist" });
    }
  });

  app.use("/api/home", router);
}
