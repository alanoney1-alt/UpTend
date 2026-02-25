/**
 * Batch 2 — Path aliases, spending tracker, appliances, warranties, home inventory
 */

import type { Express, Request, Response } from "express";
import { db, pool } from "../db";
import { homeInventory, homeAppliances, serviceRequests } from "../../shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { requireAuth } from "../auth-middleware";
import { getCustomerVehicles } from "../services/auto-services.js";

export function registerBatch2Routes(app: Express) {

  // ============================================================
  // 1. GET /api/home-profile — aggregated home profile for authed user
  // ============================================================
  app.get("/api/home-profile", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      // Redirect to existing dashboard endpoint logic
      // Forward internally
      req.url = "/api/home/dashboard";
      app.handle(req, res);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch home profile" });
    }
  });

  // ============================================================
  // 2. Home DNA scan path aliases
  // ============================================================
  app.post("/api/home-dna/scans", (req, res) => {
    req.url = "/api/home-scan/start";
    app.handle(req, res);
  });

  app.post("/api/home-dna/scan-item", (req, res) => {
    req.url = "/api/home-scan/scan-item";
    app.handle(req, res);
  });

  app.get("/api/home-dna/progress/:customerId", (req, res) => {
    req.url = `/api/home-scan/progress/${req.params.customerId}`;
    app.handle(req, res);
  });

  app.post("/api/home-dna/complete", (req, res) => {
    req.url = "/api/home-scan/complete";
    app.handle(req, res);
  });

  // ============================================================
  // 3. GET /api/vehicles — alias using authed user's ID
  // ============================================================
  app.get("/api/vehicles", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      const vehicles = await getCustomerVehicles(userId);
      res.json({ vehicles });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ============================================================
  // 4. GET /api/spending-tracker — aggregate spending from service_requests
  // ============================================================
  app.get("/api/spending-tracker", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;

      // Total spent
      const totalResult = await pool.query(
        `SELECT COALESCE(SUM(final_price), 0) as total_spent,
                COUNT(*) as total_requests
         FROM service_requests
         WHERE customer_id = $1 AND status = 'completed' AND final_price IS NOT NULL`,
        [userId]
      );

      // By service type
      const byTypeResult = await pool.query(
        `SELECT service_type, COALESCE(SUM(final_price), 0) as amount, COUNT(*) as count
         FROM service_requests
         WHERE customer_id = $1 AND status = 'completed' AND final_price IS NOT NULL
         GROUP BY service_type ORDER BY amount DESC`,
        [userId]
      );

      // By month (last 12 months)
      const byMonthResult = await pool.query(
        `SELECT TO_CHAR(TO_TIMESTAMP(created_at, 'YYYY-MM-DD"T"HH24:MI:SS'), 'YYYY-MM') as month,
                COALESCE(SUM(final_price), 0) as amount, COUNT(*) as count
         FROM service_requests
         WHERE customer_id = $1 AND status = 'completed' AND final_price IS NOT NULL
           AND created_at >= TO_CHAR(NOW() - INTERVAL '12 months', 'YYYY-MM-DD"T"HH24:MI:SS')
         GROUP BY month ORDER BY month DESC`,
        [userId]
      );

      // By year
      const byYearResult = await pool.query(
        `SELECT TO_CHAR(TO_TIMESTAMP(created_at, 'YYYY-MM-DD"T"HH24:MI:SS'), 'YYYY') as year,
                COALESCE(SUM(final_price), 0) as amount, COUNT(*) as count
         FROM service_requests
         WHERE customer_id = $1 AND status = 'completed' AND final_price IS NOT NULL
         GROUP BY year ORDER BY year DESC`,
        [userId]
      );

      res.json({
        success: true,
        totalSpent: parseFloat(totalResult.rows[0].total_spent),
        totalRequests: parseInt(totalResult.rows[0].total_requests),
        byServiceType: byTypeResult.rows,
        byMonth: byMonthResult.rows,
        byYear: byYearResult.rows,
      });
    } catch (error: any) {
      console.error("Spending tracker error:", error);
      res.status(500).json({ error: "Failed to fetch spending data" });
    }
  });

  // ============================================================
  // 5. /api/appliances — uses existing homeAppliances table via home-profile routes
  //    Add a direct alias for convenience
  // ============================================================
  app.get("/api/appliances", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      // Get all home profiles for user, then their appliances
      const result = await pool.query(
        `SELECT ha.* FROM home_appliances ha
         JOIN home_profiles hp ON ha.home_profile_id = hp.id
         WHERE hp.customer_id = $1
         ORDER BY ha.name`,
        [userId]
      );
      res.json({ success: true, appliances: result.rows });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch appliances" });
    }
  });

  app.post("/api/appliances", requireAuth, async (req: Request, res: Response) => {
    try {
      const { homeProfileId, name, brand, model, purchaseDate, warrantyExpiry, lastServiceDate, notes } = req.body;
      if (!homeProfileId || !name) return res.status(400).json({ error: "homeProfileId and name required" });
      const [appliance] = await db.insert(homeAppliances).values({
        homeProfileId, name, brand, model, purchaseDate, warrantyExpiry, lastServiceDate, notes,
        createdAt: new Date().toISOString(),
      }).returning();
      res.status(201).json({ success: true, appliance });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create appliance" });
    }
  });

  // ============================================================
  // 6. GET /api/warranties — derive from homeAppliances warrantyExpiry
  // ============================================================
  app.get("/api/warranties", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      const now = new Date().toISOString().split("T")[0];
      const soonDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const result = await pool.query(
        `SELECT ha.*, hp.address as home_address FROM home_appliances ha
         JOIN home_profiles hp ON ha.home_profile_id = hp.id
         WHERE hp.customer_id = $1 AND ha.warranty_expiry IS NOT NULL
         ORDER BY ha.warranty_expiry`,
        [userId]
      );

      const active: any[] = [];
      const expiringSoon: any[] = [];
      const expired: any[] = [];

      for (const row of result.rows) {
        if (row.warranty_expiry < now) {
          expired.push(row);
        } else if (row.warranty_expiry <= soonDate) {
          expiringSoon.push(row);
        } else {
          active.push(row);
        }
      }

      res.json({
        success: true,
        active,
        expiringSoon,
        expired,
        stats: {
          totalActive: active.length,
          totalExpiringSoon: expiringSoon.length,
          totalExpired: expired.length,
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch warranties" });
    }
  });

  // ============================================================
  // 7. /api/home-inventory — uses existing homeInventory table
  // ============================================================
  app.get("/api/home-inventory", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      const items = await db.select().from(homeInventory)
        .where(eq(homeInventory.customerId, userId))
        .orderBy(desc(homeInventory.generatedAt));
      res.json({ success: true, items });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch home inventory" });
    }
  });

  app.post("/api/home-inventory", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      const { itemName, category, estimatedValue, photoUrl, condition, conditionNotes, brandDetected } = req.body;
      if (!itemName) return res.status(400).json({ error: "itemName required" });
      const [item] = await db.insert(homeInventory).values({
        customerId: userId,
        itemName,
        category,
        estimatedValue,
        photoUrl,
        condition,
        conditionNotes,
        brandDetected,
        generatedAt: new Date().toISOString(),
      }).returning();
      res.status(201).json({ success: true, item });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create inventory item" });
    }
  });

  app.delete("/api/home-inventory/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      const result = await pool.query(
        `DELETE FROM home_inventory WHERE id = $1 AND customer_id = $2 RETURNING *`,
        [req.params.id, userId]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: "Item not found" });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete inventory item" });
    }
  });
}
