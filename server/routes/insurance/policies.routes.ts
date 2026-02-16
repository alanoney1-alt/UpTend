import type { Express } from "express";
import { db } from "../../db";
import { requireAuth } from "../../auth-middleware";
import { z } from "zod";

const uploadPolicySchema = z.object({
  policy_type: z.string().default("gl"),
  carrier_name: z.string().min(1),
  policy_number: z.string().min(1),
  coverage_amount: z.number().min(1000000),
  expiry_date: z.string().min(1),
  document_url: z.string().url(),
});

const verifyPolicySchema = z.object({
  verified: z.boolean(),
  notes: z.string().optional(),
});

export function registerInsurancePolicyRoutes(app: Express) {
  // POST /api/insurance/upload-policy - pro uploads insurance proof
  app.post("/api/insurance/upload-policy", requireAuth, async (req: any, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      // Only haulers can upload policies
      if ((req.user as any).role !== "hauler") {
        return res.status(403).json({ error: "Only pros can upload insurance policies" });
      }

      const parsed = uploadPolicySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
      }

      // Check if policy already exists for this pro and type
      const existing = await db.query(`
        SELECT id FROM insurance_policies 
        WHERE pro_id = $1 AND policy_type = $2
      `, [userId, parsed.data.policy_type]);

      if (existing.rows.length > 0) {
        // Update existing policy
        const updated = await db.query(`
          UPDATE insurance_policies 
          SET carrier_name = $1, policy_number = $2, coverage_amount = $3, 
              expiry_date = $4, document_url = $5, verified = false, 
              verified_at = null, updated_at = NOW()
          WHERE pro_id = $6 AND policy_type = $7
          RETURNING *
        `, [
          parsed.data.carrier_name,
          parsed.data.policy_number,
          parsed.data.coverage_amount,
          parsed.data.expiry_date,
          parsed.data.document_url,
          userId,
          parsed.data.policy_type
        ]);

        return res.json({ 
          success: true, 
          policy: updated.rows[0],
          message: "Insurance policy updated successfully" 
        });
      } else {
        // Create new policy
        const created = await db.query(`
          INSERT INTO insurance_policies 
          (pro_id, policy_type, carrier_name, policy_number, coverage_amount, expiry_date, document_url)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `, [
          userId,
          parsed.data.policy_type,
          parsed.data.carrier_name,
          parsed.data.policy_number,
          parsed.data.coverage_amount,
          parsed.data.expiry_date,
          parsed.data.document_url
        ]);

        return res.status(201).json({ 
          success: true, 
          policy: created.rows[0],
          message: "Insurance policy uploaded successfully" 
        });
      }
    } catch (error) {
      console.error("Error uploading insurance policy:", error);
      res.status(500).json({ error: "Failed to upload insurance policy" });
    }
  });

  // GET /api/insurance/my-policies - pro views their policies
  app.get("/api/insurance/my-policies", requireAuth, async (req: any, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const policies = await db.query(`
        SELECT * FROM insurance_policies 
        WHERE pro_id = $1 
        ORDER BY created_at DESC
      `, [userId]);

      const enrichedPolicies = policies.rows.map((policy: any) => ({
        ...policy,
        is_expired: new Date(policy.expiry_date) < new Date(),
        expires_soon: new Date(policy.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        coverage_amount_formatted: `$${(policy.coverage_amount || 0).toLocaleString()}`,
      }));

      res.json({ policies: enrichedPolicies });
    } catch (error) {
      console.error("Error fetching policies:", error);
      res.status(500).json({ error: "Failed to fetch policies" });
    }
  });

  // GET /api/insurance/verify/:policyId - admin verifies policy
  app.patch("/api/insurance/verify/:policyId", requireAuth, async (req: any, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      // Only admins can verify policies
      if ((req.user as any).role !== "admin") {
        return res.status(403).json({ error: "Only admins can verify insurance policies" });
      }

      const parsed = verifyPolicySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
      }

      const updated = await db.query(`
        UPDATE insurance_policies 
        SET verified = $1, verified_at = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `, [
        parsed.data.verified,
        parsed.data.verified ? new Date().toISOString() : null,
        req.params.policyId
      ]);

      if (updated.rows.length === 0) {
        return res.status(404).json({ error: "Policy not found" });
      }

      res.json({ 
        success: true, 
        policy: updated.rows[0],
        message: `Policy ${parsed.data.verified ? 'verified' : 'unverified'} successfully` 
      });
    } catch (error) {
      console.error("Error verifying policy:", error);
      res.status(500).json({ error: "Failed to verify policy" });
    }
  });

  // GET /api/admin/insurance/expiring - admin sees expiring policies
  app.get("/api/admin/insurance/expiring", requireAuth, async (req: any, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      if ((req.user as any).role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const expiring = await db.query(`
        SELECT 
          ip.*,
          u.name as pro_name,
          u.email as pro_email,
          hp.company_name
        FROM insurance_policies ip
        JOIN users u ON ip.pro_id = u.id
        LEFT JOIN hauler_profiles hp ON u.id = hp.user_id
        WHERE ip.expiry_date <= $1 AND ip.verified = true
        ORDER BY ip.expiry_date ASC
      `, [thirtyDaysFromNow]);

      res.json({ expiring_policies: expiring.rows });
    } catch (error) {
      console.error("Error fetching expiring policies:", error);
      res.status(500).json({ error: "Failed to fetch expiring policies" });
    }
  });
}