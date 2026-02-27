import type { Express } from "express";
import { db, pool } from "../../db";
import { requireAuth } from "../../auth-middleware";
import { z } from "zod";

const fileClaimSchema = z.object({
  service_request_id: z.string().optional(),
  pro_id: z.string().min(1),
  claim_type: z.enum(["property_damage", "structural", "bodily_injury", "theft"]),
  description: z.string().min(10),
  estimated_damage: z.number().min(0).optional(),
  photo_urls: z.array(z.string().url()).optional(),
});

const reviewClaimSchema = z.object({
  status: z.enum(["approved", "denied", "escalated", "resolved"]),
  platform_payout: z.number().min(0).optional(),
  escalated_to_insurer: z.boolean().optional(),
  insurer_claim_reference: z.string().optional(),
  resolution_notes: z.string().optional(),
});

async function getConfig(key: string) {
  const result = await pool.query(`
    SELECT config_value FROM platform_liability_config WHERE config_key = $1
  `, [key]);
  return result.rows[0]?.config_value ? Number(result.rows[0].config_value) : 0;
}

async function getProLiabilityCap(proId: string) {
  // Check if pro has valid insurance (LLC pro with verified insurance = $25K cap)
  const insurance = await pool.query(`
    SELECT * FROM insurance_policies 
    WHERE pro_id = $1 AND policy_type = 'gl' AND verified = true AND expiry_date > NOW()
  `, [proId]);

  if (insurance.rows.length > 0) {
    return await getConfig("llc_pro_cap");
  } else {
    return await getConfig("non_llc_pro_cap");
  }
}

export function registerClaimsRoutes(app: Express) {
  // POST /api/claims/file - customer files a claim
  app.post("/api/claims/file", requireAuth, async (req: any, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      // Only customers can file claims
      if ((req.user as any).role !== "customer") {
        return res.status(403).json({ error: "Only customers can file claims" });
      }

      const parsed = fileClaimSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
      }

      // Verify the pro exists
      const proCheck = await pool.query(`SELECT id FROM users WHERE id = $1`, [parsed.data.pro_id]);
      if (proCheck.rows.length === 0) {
        return res.status(404).json({ error: "Pro not found" });
      }

      // Calculate liability cap
      let liabilityCap = 0;
      if (parsed.data.claim_type === "bodily_injury") {
        liabilityCap = await getConfig("bodily_injury_cap");
      } else {
        liabilityCap = await getProLiabilityCap(parsed.data.pro_id);
      }

      const claim = await pool.query(`
        INSERT INTO liability_claims 
        (service_request_id, customer_id, pro_id, claim_type, description, 
         estimated_damage, photo_urls, platform_liability_cap)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        parsed.data.service_request_id || null,
        userId,
        parsed.data.pro_id,
        parsed.data.claim_type,
        parsed.data.description,
        parsed.data.estimated_damage || 0,
        parsed.data.photo_urls || [],
        liabilityCap
      ]);

      res.status(201).json({
        success: true,
        claim: claim.rows[0],
        message: "Claim filed successfully"
      });
    } catch (error) {
      console.error("Error filing claim:", error);
      res.status(500).json({ error: "Failed to file claim" });
    }
  });

  // GET /api/claims/my-claims - customer views their claims
  app.get("/api/claims/my-claims", requireAuth, async (req: any, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      let claims;
      if ((req.user as any).role === "customer") {
        claims = await pool.query(`
          SELECT 
            lc.*,
            u.name as pro_name,
            hp.company_name
          FROM liability_claims lc
          JOIN users u ON lc.pro_id = u.id
          LEFT JOIN hauler_profiles hp ON u.id = hp.user_id
          WHERE lc.customer_id = $1
          ORDER BY lc.created_at DESC
        `, [userId]);
      } else if ((req.user as any).role === "hauler") {
        claims = await pool.query(`
          SELECT 
            lc.*,
            cu.name as customer_name,
            cu.email as customer_email
          FROM liability_claims lc
          JOIN users cu ON lc.customer_id = cu.id
          WHERE lc.pro_id = $1
          ORDER BY lc.created_at DESC
        `, [userId]);
      } else {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json({ claims: claims?.rows || [] });
    } catch (error: any) {
      console.error("Error fetching claims:", error?.message);
      // Graceful fallback - table might not exist yet
      res.json({ claims: [] });
    }
  });

  // GET /api/claims/:id - get claim details
  app.get("/api/claims/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const claim = await pool.query(`
        SELECT 
          lc.*,
          cu.name as customer_name,
          cu.email as customer_email,
          pu.name as pro_name,
          pu.email as pro_email,
          hp.company_name,
          sr.service_type,
          sr.service_address
        FROM liability_claims lc
        JOIN users cu ON lc.customer_id = cu.id
        JOIN users pu ON lc.pro_id = pu.id
        LEFT JOIN hauler_profiles hp ON pu.id = hp.user_id
        LEFT JOIN service_requests sr ON lc.service_request_id = sr.id
        WHERE lc.id = $1
      `, [req.params.id]);

      if (claim.rows.length === 0) {
        return res.status(404).json({ error: "Claim not found" });
      }

      const claimData = claim.rows[0];

      // Check access permissions
      const isCustomer = (req.user as any).role === "customer" && claimData.customer_id === userId;
      const isPro = (req.user as any).role === "hauler" && claimData.pro_id === userId;
      const isAdmin = (req.user as any).role === "admin";

      if (!isCustomer && !isPro && !isAdmin) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json({ claim: claimData });
    } catch (error) {
      console.error("Error fetching claim:", error);
      res.status(500).json({ error: "Failed to fetch claim" });
    }
  });

  // PATCH /api/claims/:id/review - admin reviews/resolves claim
  app.patch("/api/claims/:id/review", requireAuth, async (req: any, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      // Only admins can review claims
      if ((req.user as any).role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const parsed = reviewClaimSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
      }

      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      updateFields.push(`status = $${paramCount++}`);
      updateValues.push(parsed.data.status);

      if (parsed.data.platform_payout !== undefined) {
        updateFields.push(`platform_payout = $${paramCount++}`);
        updateValues.push(parsed.data.platform_payout);
      }

      if (parsed.data.escalated_to_insurer !== undefined) {
        updateFields.push(`escalated_to_insurer = $${paramCount++}`);
        updateValues.push(parsed.data.escalated_to_insurer);
      }

      if (parsed.data.insurer_claim_reference) {
        updateFields.push(`insurer_claim_reference = $${paramCount++}`);
        updateValues.push(parsed.data.insurer_claim_reference);
      }

      if (parsed.data.resolution_notes) {
        updateFields.push(`resolution_notes = $${paramCount++}`);
        updateValues.push(parsed.data.resolution_notes);
      }

      if (["approved", "denied", "resolved"].includes(parsed.data.status)) {
        updateFields.push(`resolved_at = NOW()`);
      }

      updateFields.push(`updated_at = NOW()`);
      updateValues.push(req.params.id);

      const updated = await pool.query(`
        UPDATE liability_claims 
        SET ${updateFields.join(", ")}
        WHERE id = $${paramCount}
        RETURNING *
      `, updateValues);

      if (updated.rows.length === 0) {
        return res.status(404).json({ error: "Claim not found" });
      }

      res.json({
        success: true,
        claim: updated.rows[0],
        message: "Claim updated successfully"
      });
    } catch (error) {
      console.error("Error reviewing claim:", error);
      res.status(500).json({ error: "Failed to review claim" });
    }
  });

  // GET /api/admin/claims - admin views all claims
  app.get("/api/admin/claims", requireAuth, async (req: any, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      if ((req.user as any).role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { status, claim_type, limit = 50, offset = 0 } = req.query;
      
      let whereClause = "WHERE 1=1";
      const queryParams = [];
      let paramCount = 1;

      if (status) {
        whereClause += ` AND lc.status = $${paramCount++}`;
        queryParams.push(status);
      }

      if (claim_type) {
        whereClause += ` AND lc.claim_type = $${paramCount++}`;
        queryParams.push(claim_type);
      }

      queryParams.push(Number(limit), Number(offset));

      const claims = await pool.query(`
        SELECT 
          lc.*,
          cu.name as customer_name,
          cu.email as customer_email,
          pu.name as pro_name,
          pu.email as pro_email,
          hp.company_name
        FROM liability_claims lc
        JOIN users cu ON lc.customer_id = cu.id
        JOIN users pu ON lc.pro_id = pu.id
        LEFT JOIN hauler_profiles hp ON pu.id = hp.user_id
        ${whereClause}
        ORDER BY lc.created_at DESC
        LIMIT $${paramCount++} OFFSET $${paramCount}
      `, queryParams);

      // Get total count for pagination
      const countResult = await pool.query(`
        SELECT COUNT(*) as total
        FROM liability_claims lc
        ${whereClause.replace(/LIMIT.*$/, '')}
      `, queryParams.slice(0, -2));

      res.json({
        claims: claims.rows,
        total: Number(countResult.rows[0]?.total || 0),
        limit: Number(limit),
        offset: Number(offset)
      });
    } catch (error) {
      console.error("Error fetching admin claims:", error);
      res.status(500).json({ error: "Failed to fetch claims" });
    }
  });
}