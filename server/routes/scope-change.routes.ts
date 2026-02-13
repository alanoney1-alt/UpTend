import type { Express } from "express";
import { pool } from "../db";
import { requireAuth, requireAdmin } from "../middleware/auth";

export function registerScopeChangeRoutes(app: Express) {
  // POST /api/scope-change/request — Pro submits a scope change
  app.post("/api/scope-change/request", async (req, res) => {
    try {
      const user = req.user as any;
      if (!user) return res.status(401).json({ error: "Not authenticated" });

      const proId = user.userId || user.id;
      const { serviceRequestId, proposedCeiling, reason, changeType, evidencePhotos, evidenceDescription } = req.body;

      if (!serviceRequestId || !proposedCeiling || !reason || !changeType || !evidencePhotos?.length) {
        return res.status(400).json({ error: "Missing required fields. Photos are required." });
      }

      // Verify pro is assigned to this job
      const jobResult = await pool.query(
        "SELECT id, assigned_hauler_id, customer_id, guaranteed_ceiling, status FROM service_requests WHERE id = $1",
        [serviceRequestId]
      );

      if (!jobResult.rows.length) return res.status(404).json({ error: "Job not found" });
      const job = jobResult.rows[0];

      if (job.assigned_hauler_id !== proId) return res.status(403).json({ error: "You are not assigned to this job" });
      if (!["accepted", "in_progress", "en_route"].includes(job.status)) {
        return res.status(400).json({ error: "Job must be active for scope changes" });
      }

      const originalCeiling = job.guaranteed_ceiling || 0;
      const additionalAmount = proposedCeiling - originalCeiling;
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min
      const flagForReview = originalCeiling > 0 ? additionalAmount / originalCeiling > 0.3 : false;

      const result = await pool.query(
        `INSERT INTO scope_change_requests
         (service_request_id, pro_id, customer_id, original_ceiling, proposed_ceiling, additional_amount,
          reason, change_type, evidence_photos, evidence_description, expires_at, flagged_for_review,
          customer_notified_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING id, status, expires_at`,
        [serviceRequestId, proId, job.customer_id, originalCeiling, proposedCeiling, additionalAmount,
         reason, changeType, evidencePhotos, evidenceDescription, expiresAt, flagForReview,
         new Date().toISOString(), new Date().toISOString()]
      );

      // TODO: Send push notification to customer
      // TODO: Queue AI validation of evidence photos

      return res.json({
        scopeChangeId: result.rows[0].id,
        status: "pending",
        expiresAt,
        additionalAmount,
        flaggedForReview: flagForReview,
      });
    } catch (error: any) {
      console.error("Scope change request error:", error);
      return res.status(500).json({ error: "Failed to create scope change request" });
    }
  });

  // POST /api/scope-change/:id/respond — Customer approves/declines
  app.post("/api/scope-change/:id/respond", async (req, res) => {
    try {
      const user = req.user as any;
      if (!user) return res.status(401).json({ error: "Not authenticated" });

      const customerId = user.userId || user.id;
      const { id } = req.params;
      const { action, customerNotes } = req.body;

      if (!["approve", "decline"].includes(action)) {
        return res.status(400).json({ error: "Action must be 'approve' or 'decline'" });
      }

      const scResult = await pool.query(
        "SELECT * FROM scope_change_requests WHERE id = $1",
        [id]
      );

      if (!scResult.rows.length) return res.status(404).json({ error: "Scope change not found" });
      const sc = scResult.rows[0];

      if (sc.customer_id !== customerId) return res.status(403).json({ error: "Not your booking" });
      if (sc.status !== "pending") return res.status(400).json({ error: `Already ${sc.status}` });

      // Check expiration
      if (new Date(sc.expires_at) < new Date()) {
        await pool.query("UPDATE scope_change_requests SET status = 'expired' WHERE id = $1", [id]);
        return res.status(400).json({ error: "This scope change request has expired" });
      }

      const newStatus = action === "approve" ? "approved" : "declined";

      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        await client.query(
          `UPDATE scope_change_requests
           SET status = $1, customer_responded_at = $2, customer_notes = $3
           WHERE id = $4`,
          [newStatus, new Date().toISOString(), customerNotes || null, id]
        );

        // If approved, update the service request's guaranteed ceiling
        if (action === "approve") {
          await client.query(
            "UPDATE service_requests SET guaranteed_ceiling = $1 WHERE id = $2",
            [sc.proposed_ceiling, sc.service_request_id]
          );
        }

        await client.query("COMMIT");
      } catch (txErr) {
        await client.query("ROLLBACK");
        throw txErr;
      } finally {
        client.release();
      }

      return res.json({
        status: newStatus,
        newCeiling: action === "approve" ? sc.proposed_ceiling : sc.original_ceiling,
      });
    } catch (error: any) {
      console.error("Scope change respond error:", error);
      return res.status(500).json({ error: "Failed to process response" });
    }
  });

  // GET /api/scope-change/:serviceRequestId — Get all scope changes for a job
  app.get("/api/scope-change/:serviceRequestId", async (req, res) => {
    try {
      const user = req.user as any;
      if (!user) return res.status(401).json({ error: "Not authenticated" });

      const { serviceRequestId } = req.params;
      const result = await pool.query(
        "SELECT * FROM scope_change_requests WHERE service_request_id = $1 ORDER BY created_at DESC",
        [serviceRequestId]
      );

      return res.json({ scopeChanges: result.rows });
    } catch (error: any) {
      console.error("Get scope changes error:", error);
      return res.status(500).json({ error: "Failed to fetch scope changes" });
    }
  });

  // GET /api/admin/ceiling-analytics — Admin KPIs
  app.get("/api/admin/ceiling-analytics", requireAuth, requireAdmin, async (req, res) => {
    try {

      const { periodType, startDate, endDate } = req.query;

      let query = "SELECT * FROM ceiling_analytics WHERE 1=1";
      const params: any[] = [];
      let paramIdx = 1;

      if (periodType) { query += ` AND period_type = $${paramIdx++}`; params.push(periodType); }
      if (startDate) { query += ` AND period_start >= $${paramIdx++}`; params.push(startDate); }
      if (endDate) { query += ` AND period_end <= $${paramIdx++}`; params.push(endDate); }

      query += " ORDER BY period_start DESC LIMIT 90";

      const result = await pool.query(query, params);
      return res.json({ analytics: result.rows });
    } catch (error: any) {
      console.error("Ceiling analytics error:", error);
      return res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });
}
