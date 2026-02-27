/**
 * Warranty Management Routes
 * CRUD for homeowner warranty tracking + claims + expiring alerts
 */
import { Router, Request, Response } from "express";
import type { Express } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";

function getUserId(req: Request): string | null {
  if (!req.user) return null;
  return (req.user as any).userId || (req.user as any).id || null;
}

export function registerWarrantyRoutes(app: Express) {
  // Ensure warranty tables exist
  db.execute(sql`
    CREATE TABLE IF NOT EXISTS warranties (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      appliance_name TEXT NOT NULL,
      brand TEXT,
      model TEXT,
      purchase_date TEXT,
      expiration_date TEXT,
      warranty_provider TEXT,
      policy_number TEXT,
      coverage_details TEXT,
      receipt_url TEXT,
      deleted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});

  db.execute(sql`
    CREATE TABLE IF NOT EXISTS warranty_claims (
      id SERIAL PRIMARY KEY,
      warranty_id INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      description TEXT NOT NULL,
      photos TEXT[],
      status TEXT DEFAULT 'submitted',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});

  // POST /api/warranty - add a warranty
  app.post("/api/warranty", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const { applianceName, brand, model, purchaseDate, expirationDate, warrantyProvider, policyNumber, coverageDetails, receiptUrl } = req.body;
    if (!applianceName) return res.status(400).json({ error: "applianceName is required" });

    try {
      const result = await db.execute(sql`
        INSERT INTO warranties (user_id, appliance_name, brand, model, purchase_date, expiration_date, warranty_provider, policy_number, coverage_details, receipt_url)
        VALUES (${userId}, ${applianceName}, ${brand || null}, ${model || null}, ${purchaseDate || null}, ${expirationDate || null}, ${warrantyProvider || null}, ${policyNumber || null}, ${coverageDetails || null}, ${receiptUrl || null})
        RETURNING *
      `);
      res.json({ success: true, warranty: (result as any).rows?.[0] || result });
    } catch (err: any) {
      console.error("[Warranty] Create error:", err);
      res.status(500).json({ error: "Failed to create warranty" });
    }
  });

  // GET /api/warranty - list all for user
  app.get("/api/warranty", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    try {
      const result = await db.execute(sql`
        SELECT * FROM warranties WHERE user_id = ${userId} AND deleted = FALSE ORDER BY expiration_date ASC
      `);
      res.json({ warranties: (result as any).rows || [] });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch warranties" });
    }
  });

  // GET /api/warranty/expiring - warranties expiring within 90 days
  app.get("/api/warranty/expiring", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    try {
      const result = await db.execute(sql`
        SELECT * FROM warranties
        WHERE user_id = ${userId}
          AND deleted = FALSE
          AND expiration_date IS NOT NULL
          AND expiration_date::date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'
        ORDER BY expiration_date ASC
      `);
      res.json({ warranties: (result as any).rows || [] });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch expiring warranties" });
    }
  });

  // GET /api/warranty/:id - single warranty
  app.get("/api/warranty/:id", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    try {
      const result = await db.execute(sql`
        SELECT * FROM warranties WHERE id = ${parseInt(req.params.id)} AND user_id = ${userId} AND deleted = FALSE
      `);
      const rows = (result as any).rows || [];
      if (rows.length === 0) return res.status(404).json({ error: "Warranty not found" });
      res.json({ warranty: rows[0] });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch warranty" });
    }
  });

  // PUT /api/warranty/:id - update
  app.put("/api/warranty/:id", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const { applianceName, brand, model, purchaseDate, expirationDate, warrantyProvider, policyNumber, coverageDetails, receiptUrl } = req.body;

    try {
      const result = await db.execute(sql`
        UPDATE warranties SET
          appliance_name = COALESCE(${applianceName || null}, appliance_name),
          brand = COALESCE(${brand || null}, brand),
          model = COALESCE(${model || null}, model),
          purchase_date = COALESCE(${purchaseDate || null}, purchase_date),
          expiration_date = COALESCE(${expirationDate || null}, expiration_date),
          warranty_provider = COALESCE(${warrantyProvider || null}, warranty_provider),
          policy_number = COALESCE(${policyNumber || null}, policy_number),
          coverage_details = COALESCE(${coverageDetails || null}, coverage_details),
          receipt_url = COALESCE(${receiptUrl || null}, receipt_url),
          updated_at = NOW()
        WHERE id = ${parseInt(req.params.id)} AND user_id = ${userId} AND deleted = FALSE
        RETURNING *
      `);
      const rows = (result as any).rows || [];
      if (rows.length === 0) return res.status(404).json({ error: "Warranty not found" });
      res.json({ success: true, warranty: rows[0] });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update warranty" });
    }
  });

  // DELETE /api/warranty/:id - soft delete
  app.delete("/api/warranty/:id", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    try {
      await db.execute(sql`
        UPDATE warranties SET deleted = TRUE, updated_at = NOW()
        WHERE id = ${parseInt(req.params.id)} AND user_id = ${userId}
      `);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to delete warranty" });
    }
  });

  // POST /api/warranty/:id/claim - file a claim
  app.post("/api/warranty/:id/claim", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const { description, photos } = req.body;
    if (!description) return res.status(400).json({ error: "description is required" });

    try {
      const result = await db.execute(sql`
        INSERT INTO warranty_claims (warranty_id, user_id, description, photos)
        VALUES (${parseInt(req.params.id)}, ${userId}, ${description}, ${photos || []})
        RETURNING *
      `);
      res.json({ success: true, claim: (result as any).rows?.[0] || result });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to file claim" });
    }
  });
}
