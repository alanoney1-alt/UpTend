import type { Express } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";

function requireAuth(req: any, res: any, next: any) {
  const userId = (req.user as any)?.userId || (req.user as any)?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  next();
}

export function registerHomeReportRoutes(app: Express) {
  // Unified home report - aggregates all home events into one Carfax-style timeline
  app.get("/api/home-report", requireAuth, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.userId || (req.user as any)?.id;
      const events: any[] = [];

      // 1. Service jobs
      const jobs = await db.execute(sql`
        SELECT id, service_type, pickup_address, status, final_price, price_estimate,
               scheduled_for, completed_at, created_at
        FROM service_requests WHERE customer_id = ${userId}
        ORDER BY created_at DESC LIMIT 100
      `);
      for (const j of jobs.rows) {
        events.push({
          type: "service",
          id: j.id,
          date: j.completed_at || j.scheduled_for || j.created_at,
          title: j.service_type,
          description: j.pickup_address,
          cost: j.final_price || j.price_estimate,
          status: j.status,
          icon: "wrench",
        });
      }

      // 2. Home appliances
      try {
        const appliances = await db.execute(sql`
          SELECT ha.id, ha.name, ha.brand, ha.model, ha.purchase_date, ha.warranty_expiry, ha.created_at
          FROM home_appliances ha
          JOIN home_profiles hp ON ha.home_profile_id = hp.id
          WHERE hp.user_id = ${userId}
          ORDER BY ha.created_at DESC LIMIT 50
        `);
        for (const a of appliances.rows) {
          events.push({
            type: "appliance",
            id: a.id,
            date: a.created_at,
            title: `${a.brand || ""} ${a.name}`.trim(),
            description: a.model ? `Model: ${a.model}` : "Appliance registered",
            warrantyExpiry: a.warranty_expiry,
            icon: "box",
          });
        }
      } catch (e) { /* table may not exist yet */ }

      // 3. Warranty registrations
      try {
        const warranties = await db.execute(sql`
          SELECT id, product_name, brand, model, warranty_type, warranty_expires, created_at
          FROM warranty_registrations WHERE customer_id = ${userId}
          ORDER BY created_at DESC LIMIT 50
        `);
        for (const w of warranties.rows) {
          events.push({
            type: "warranty",
            id: w.id,
            date: w.created_at,
            title: `${w.brand || ""} ${w.product_name}`.trim(),
            description: `${w.warranty_type || "Standard"} warranty - expires ${w.warranty_expires ? new Date(w.warranty_expires as string).toLocaleDateString() : "N/A"}`,
            warrantyExpiry: w.warranty_expires,
            icon: "shield",
          });
        }
      } catch (e) { /* table may not exist yet */ }

      // 4. Home scan sessions
      try {
        const scans = await db.execute(sql`
          SELECT id, status, started_at, completed_at, total_credits_earned
          FROM home_scan_sessions WHERE customer_id = ${userId}
          ORDER BY started_at DESC LIMIT 20
        `);
        for (const s of scans.rows) {
          events.push({
            type: "scan",
            id: s.id,
            date: s.completed_at || s.started_at,
            title: "Home DNA Scan",
            description: s.status === "completed"
              ? `Completed - earned ${s.total_credits_earned || 0} credits`
              : `Status: ${s.status}`,
            status: s.status,
            icon: "scan",
          });
        }
      } catch (e) {}

      // 5. DIY coaching sessions
      try {
        const diy = await db.execute(sql`
          SELECT id, issue_description, appliance_type, diagnosis, status, difficulty_rating, created_at, completed_at
          FROM diy_coaching_sessions WHERE customer_id = ${userId}
          ORDER BY created_at DESC LIMIT 50
        `);
        for (const d of diy.rows) {
          events.push({
            type: "diy",
            id: d.id,
            date: d.completed_at || d.created_at,
            title: `DIY: ${d.appliance_type || "Repair"}`,
            description: (d.issue_description as string)?.slice(0, 100) || d.diagnosis || "DIY repair session",
            status: d.status,
            difficulty: d.difficulty_rating,
            icon: "hammer",
          });
        }
      } catch (e) {}

      // 6. Maintenance log
      try {
        const maintenance = await db.execute(sql`
          SELECT id, maintenance_type, appliance_or_system, description, performed_by, cost, performed_at, created_at
          FROM home_maintenance_log WHERE customer_id = ${userId}
          ORDER BY performed_at DESC LIMIT 50
        `);
        for (const m of maintenance.rows) {
          events.push({
            type: "maintenance",
            id: m.id,
            date: m.performed_at || m.created_at,
            title: `${m.maintenance_type || "Maintenance"}: ${m.appliance_or_system || ""}`.trim(),
            description: m.description || `Performed by ${m.performed_by || "unknown"}`,
            cost: m.cost,
            icon: "settings",
          });
        }
      } catch (e) {}

      // 7. Maintenance reminders (upcoming)
      try {
        const reminders = await db.execute(sql`
          SELECT id, reminder_type, description, next_due, last_completed, created_at
          FROM maintenance_reminders WHERE user_id = ${userId}
          ORDER BY next_due ASC LIMIT 20
        `);
        for (const r of reminders.rows) {
          events.push({
            type: "reminder",
            id: r.id,
            date: r.next_due || r.created_at,
            title: r.reminder_type || "Maintenance Reminder",
            description: r.description || "Scheduled maintenance",
            isUpcoming: true,
            icon: "bell",
          });
        }
      } catch (e) {}

      // 8. Inventory items
      try {
        const inventory = await db.execute(sql`
          SELECT id, item_name, brand_detected, estimated_value, condition, verified_at, created_at
          FROM home_inventory WHERE customer_id = ${userId}
          ORDER BY created_at DESC LIMIT 50
        `);
        for (const i of inventory.rows) {
          events.push({
            type: "inventory",
            id: i.id,
            date: i.verified_at || i.created_at,
            title: i.item_name,
            description: i.brand_detected ? `${i.brand_detected} - ${i.condition || "unverified"}` : (i.condition || "Item cataloged"),
            value: i.estimated_value,
            icon: "package",
          });
        }
      } catch (e) {}

      // Sort all events by date descending
      events.sort((a, b) => {
        const da = a.date ? new Date(a.date).getTime() : 0;
        const db2 = b.date ? new Date(b.date).getTime() : 0;
        return db2 - da;
      });

      const summary = {
        totalServices: jobs.rows.length,
        totalAppliances: events.filter(e => e.type === "appliance").length,
        totalWarranties: events.filter(e => e.type === "warranty").length,
        totalScans: events.filter(e => e.type === "scan").length,
        totalDIY: events.filter(e => e.type === "diy").length,
        totalMaintenance: events.filter(e => e.type === "maintenance").length,
        totalInventory: events.filter(e => e.type === "inventory").length,
        upcomingReminders: events.filter(e => e.type === "reminder").length,
        totalEvents: events.length,
      };

      res.json({ events, summary });
    } catch (err: any) {
      console.error("Home report error:", err);
      res.json({ events: [], summary: {} });
    }
  });
}
