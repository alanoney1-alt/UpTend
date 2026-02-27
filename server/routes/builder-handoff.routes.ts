/**
 * Builder Handoff Routes
 * Builder registers a new home closing, loads warranties for homeowner
 */
import type { Express, Request, Response } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";

function getUserId(req: Request): string | null {
  if (!req.user) return null;
  return (req.user as any).userId || (req.user as any).id || null;
}

export function registerBuilderHandoffRoutes(app: Express) {
  // Ensure table
  db.execute(sql`
    CREATE TABLE IF NOT EXISTS builder_handoffs (
      id SERIAL PRIMARY KEY,
      builder_user_id TEXT NOT NULL,
      builder_company TEXT,
      homeowner_email TEXT NOT NULL,
      homeowner_name TEXT,
      address TEXT NOT NULL,
      closing_date TEXT,
      warranties JSONB DEFAULT '[]',
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});

  // POST /api/builder/handoff - register a closing
  app.post("/api/builder/handoff", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const { address, homeownerEmail, homeownerName, closingDate, warranties, builderCompany } = req.body;
    if (!address || !homeownerEmail) return res.status(400).json({ error: "address and homeownerEmail are required" });

    try {
      // Create the handoff record
      const result = await db.execute(sql`
        INSERT INTO builder_handoffs (builder_user_id, builder_company, homeowner_email, homeowner_name, address, closing_date, warranties)
        VALUES (${userId}, ${builderCompany || null}, ${homeownerEmail}, ${homeownerName || null}, ${address}, ${closingDate || null}, ${JSON.stringify(warranties || [])})
        RETURNING *
      `);

      // Auto-create warranties for the homeowner if they exist in the system
      if (warranties && Array.isArray(warranties) && warranties.length > 0) {
        for (const w of warranties) {
          await db.execute(sql`
            INSERT INTO warranties (user_id, appliance_name, brand, model, purchase_date, expiration_date, warranty_provider, policy_number, coverage_details)
            SELECT u.id::text, ${w.applianceName || 'Unknown'}, ${w.brand || null}, ${w.model || null}, ${w.purchaseDate || null}, ${w.expirationDate || null}, ${w.warrantyProvider || null}, ${w.policyNumber || null}, ${w.coverageDetails || null}
            FROM users u WHERE u.email = ${homeownerEmail}
            LIMIT 1
          `).catch(() => {});
        }
      }

      res.json({ success: true, handoff: (result as any).rows?.[0] || result, message: "George will take it from here." });
    } catch (err: any) {
      console.error("[BuilderHandoff] Error:", err);
      res.status(500).json({ error: "Failed to register handoff" });
    }
  });

  // GET /api/builder/handoffs - list all handoffs for this builder
  app.get("/api/builder/handoffs", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    try {
      const result = await db.execute(sql`
        SELECT * FROM builder_handoffs WHERE builder_user_id = ${userId} ORDER BY created_at DESC
      `);
      res.json({ handoffs: (result as any).rows || [] });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch handoffs" });
    }
  });
}
