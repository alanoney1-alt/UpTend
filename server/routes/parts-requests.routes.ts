import type { Express } from "express";
import { pool } from "../db";
import { requireAuth } from "../middleware/auth";

export function registerPartsRequestRoutes(app: Express) {
  // POST /api/jobs/:jobId/parts-request — Pro flags "needs parts"
  app.post("/api/jobs/:jobId/parts-request", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user) return res.status(401).json({ error: "Not authenticated" });
      const proId = (user.userId || user.id);

      const { jobId } = req.params;
      const { description, photoUrl, estimatedCost } = req.body;

      if (!description) {
        return res.status(400).json({ error: "Description is required" });
      }

      // Verify pro is assigned to this job and it's active
      const jobResult = await pool.query(
        "SELECT id, assigned_hauler_id, customer_id, status FROM service_requests WHERE id = $1",
        [jobId]
      );
      if (!jobResult.rows.length) return res.status(404).json({ error: "Job not found" });
      const job = jobResult.rows[0];

      if (job.assigned_hauler_id !== proId) {
        return res.status(403).json({ error: "You are not assigned to this job" });
      }
      if (!["accepted", "in_progress", "en_route"].includes(job.status)) {
        return res.status(400).json({ error: "Job must be active to request parts" });
      }

      // Check for business account on the job's customer
      const bizResult = await pool.query(
        "SELECT business_account_id FROM business_properties WHERE id IN (SELECT property_id FROM service_requests WHERE id = $1) LIMIT 1",
        [jobId]
      );
      const businessAccountId = bizResult.rows[0]?.business_account_id || null;

      const now = new Date().toISOString();
      const result = await pool.query(
        `INSERT INTO parts_requests
         (service_request_id, requested_by_pro_id, business_account_id, status, description, photo_url, estimated_cost, created_at, updated_at)
         VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7, $7)
         RETURNING *`,
        [jobId, proId, businessAccountId, description, photoUrl || null, estimatedCost || null, now]
      );

      // Pause the job
      await pool.query(
        "UPDATE service_requests SET status = 'paused_parts' WHERE id = $1",
        [jobId]
      );

      // Notify PM/customer
      try {
        const custResult = await pool.query(
          "SELECT email, phone, full_name FROM customers WHERE id = $1",
          [job.customer_id]
        );
        const cust = custResult.rows[0];
        if (cust?.email) {
          const { sendEmail } = await import("../services/notifications");
          sendEmail({
            to: cust.email,
            subject: "UpTend: Parts/Materials Needed for Your Job",
            html: `<p>Hi ${cust.full_name || "there"},</p><p>Your Pro has identified parts/materials needed to continue your job.</p><p><strong>Description:</strong> ${description}</p><p><strong>Estimated Cost:</strong> $${estimatedCost || "TBD"}</p><p>Please approve or deny this request in the app.</p>`,
          }).catch((err: any) => console.error("[EMAIL] Parts request notification failed:", err.message));
        }
        if (cust?.phone) {
          const { sendSms } = await import("../services/notifications");
          sendSms({
            to: cust.phone,
            message: `UpTend: Your Pro needs parts/materials ($${estimatedCost || "TBD"}) - "${description}". Please approve in the app.`,
          }).catch((err: any) => console.error("[SMS] Parts request notification failed:", err.message));
        }
      } catch (notifErr) {
        console.warn("Failed to send parts request notification:", notifErr);
      }

      res.json({ partsRequest: result.rows[0] });
    } catch (error: any) {
      console.error("Error creating parts request:", error);
      res.status(500).json({ error: "Failed to create parts request" });
    }
  });

  // GET /api/jobs/:jobId/parts-requests — List parts requests for a job
  app.get("/api/jobs/:jobId/parts-requests", requireAuth, async (req, res) => {
    try {
      const { jobId } = req.params;
      const result = await pool.query(
        "SELECT * FROM parts_requests WHERE service_request_id = $1 ORDER BY created_at DESC",
        [jobId]
      );
      res.json({ partsRequests: result.rows });
    } catch (error: any) {
      console.error("Error fetching parts requests:", error);
      res.status(500).json({ error: "Failed to fetch parts requests" });
    }
  });

  // PUT /api/parts-requests/:id/approve — PM/customer approves
  app.put("/api/parts-requests/:id/approve", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user) return res.status(401).json({ error: "Not authenticated" });
      const userId = (user.userId || user.id);

      const { id } = req.params;
      const { supplierSource } = req.body; // pro | pm | uptend_partner

      const now = new Date().toISOString();
      const result = await pool.query(
        `UPDATE parts_requests SET status = 'approved', supplier_source = $1, approved_by_id = $2, approved_at = $3, updated_at = $3
         WHERE id = $4 AND status = 'pending' RETURNING *`,
        [supplierSource || "pro", userId, now, id]
      );

      if (!result.rows.length) {
        return res.status(404).json({ error: "Parts request not found or not pending" });
      }

      const pr = result.rows[0];

      // Notify pro
      try {
        const proResult = await pool.query(
          "SELECT u.email, hp.phone FROM users u LEFT JOIN hauler_profiles hp ON hp.user_id = u.id WHERE u.id = $1",
          [pr.requested_by_pro_id]
        );
        const pro = proResult.rows[0];
        if (pro?.email) {
          const { sendEmail } = await import("../services/notifications");
          sendEmail({
            to: pro.email,
            subject: "UpTend: Parts Request Approved",
            html: `<p>Your parts request has been approved.</p><p><strong>Supply method:</strong> ${supplierSource || "pro"}</p><p>Please source the materials and mark as obtained when ready.</p>`,
          }).catch((err: any) => console.error("[EMAIL] Parts approval notification failed:", err.message));
        }
        if (pro?.phone) {
          const { sendSms } = await import("../services/notifications");
          sendSms({
            to: pro.phone,
            message: `UpTend: Parts request approved! Supply method: ${supplierSource || "pro"}. Source materials and update status when ready.`,
          }).catch((err: any) => console.error("[SMS] Parts approval notification failed:", err.message));
        }
      } catch (notifErr) {
        console.warn("Failed to send parts approval notification:", notifErr);
      }

      res.json({ partsRequest: result.rows[0] });
    } catch (error: any) {
      console.error("Error approving parts request:", error);
      res.status(500).json({ error: "Failed to approve parts request" });
    }
  });

  // PUT /api/parts-requests/:id/deny — PM/customer denies
  app.put("/api/parts-requests/:id/deny", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user) return res.status(401).json({ error: "Not authenticated" });

      const { id } = req.params;
      const now = new Date().toISOString();

      const result = await pool.query(
        `UPDATE parts_requests SET status = 'denied', updated_at = $1
         WHERE id = $2 AND status = 'pending' RETURNING *`,
        [now, id]
      );

      if (!result.rows.length) {
        return res.status(404).json({ error: "Parts request not found or not pending" });
      }

      const pr = result.rows[0];

      // Resume the job back to in_progress
      await pool.query(
        "UPDATE service_requests SET status = 'in_progress' WHERE id = $1 AND status = 'paused_parts'",
        [pr.service_request_id]
      );

      res.json({ partsRequest: result.rows[0] });
    } catch (error: any) {
      console.error("Error denying parts request:", error);
      res.status(500).json({ error: "Failed to deny parts request" });
    }
  });

  // PUT /api/parts-requests/:id/sourced — Pro marks parts obtained
  app.put("/api/parts-requests/:id/sourced", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { actualCost, receiptUrl } = req.body;
      const now = new Date().toISOString();

      const result = await pool.query(
        `UPDATE parts_requests SET status = 'sourced', actual_cost = $1, receipt_url = $2, updated_at = $3
         WHERE id = $4 AND status = 'approved' RETURNING *`,
        [actualCost || null, receiptUrl || null, now, id]
      );

      if (!result.rows.length) {
        return res.status(404).json({ error: "Parts request not found or not approved" });
      }

      const pr = result.rows[0];

      // Notify PM/customer that parts are sourced
      try {
        const jobResult = await pool.query("SELECT customer_id FROM service_requests WHERE id = $1", [pr.service_request_id]);
        const custId = jobResult.rows[0]?.customer_id;
        if (custId) {
          const custResult = await pool.query("SELECT email, phone FROM customers WHERE id = $1", [custId]);
          const cust = custResult.rows[0];
          if (cust?.email) {
            const { sendEmail } = await import("../services/notifications");
            sendEmail({
              to: cust.email,
              subject: "UpTend: Parts Sourced for Your Job",
              html: `<p>Your Pro has obtained the needed parts/materials${actualCost ? ` (cost: $${actualCost})` : ""}. Installation will begin shortly.</p>`,
            }).catch((err: any) => console.error("[EMAIL] Parts sourced notification failed:", err.message));
          }
          if (cust?.phone) {
            const { sendSms } = await import("../services/notifications");
            sendSms({
              to: cust.phone,
              message: `UpTend: Parts sourced${actualCost ? ` ($${actualCost})` : ""}. Your Pro will resume work shortly.`,
            }).catch((err: any) => console.error("[SMS] Parts sourced notification failed:", err.message));
          }
        }
      } catch (notifErr) {
        console.warn("Failed to send parts sourced notification:", notifErr);
      }

      res.json({ partsRequest: result.rows[0] });
    } catch (error: any) {
      console.error("Error marking parts sourced:", error);
      res.status(500).json({ error: "Failed to mark parts as sourced" });
    }
  });

  // PUT /api/parts-requests/:id/installed — Pro marks installed, job resumes
  app.put("/api/parts-requests/:id/installed", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const now = new Date().toISOString();

      const result = await pool.query(
        `UPDATE parts_requests SET status = 'installed', updated_at = $1
         WHERE id = $2 AND status = 'sourced' RETURNING *`,
        [now, id]
      );

      if (!result.rows.length) {
        return res.status(404).json({ error: "Parts request not found or not sourced" });
      }

      const pr = result.rows[0];

      // Resume job to in_progress
      await pool.query(
        "UPDATE service_requests SET status = 'in_progress' WHERE id = $1 AND status = 'paused_parts'",
        [pr.service_request_id]
      );

      // Log parts expense for accounting
      try {
        const cost = pr.actual_cost || pr.estimated_cost;
        if (cost) {
          const { logManualExpense } = await import("../services/accounting-service");
          await logManualExpense({
            description: `Parts/Materials: ${pr.description}`,
            amount: cost,
            serviceRequestId: pr.service_request_id,
            notes: pr.supplier_source === "pro" ? "Pro-sourced, reimbursement required" : "PM/customer supplied",
          } as any).catch((err: any) => console.error("[ACCOUNTING] Parts expense log failed:", err.message));
        }
      } catch (accErr) {
        console.warn("Failed to log parts expense:", accErr);
      }

      // Notify PM/customer
      try {
        const jobResult = await pool.query("SELECT customer_id FROM service_requests WHERE id = $1", [pr.service_request_id]);
        const custId = jobResult.rows[0]?.customer_id;
        if (custId) {
          const custResult = await pool.query("SELECT email, phone FROM customers WHERE id = $1", [custId]);
          const cust = custResult.rows[0];
          if (cust?.email) {
            const { sendEmail } = await import("../services/notifications");
            sendEmail({
              to: cust.email,
              subject: "UpTend: Parts Installed — Job Resumed",
              html: `<p>Parts have been installed and your job has resumed.</p>`,
            }).catch((err: any) => console.error("[EMAIL] Parts installed notification failed:", err.message));
          }
          if (cust?.phone) {
            const { sendSms } = await import("../services/notifications");
            sendSms({
              to: cust.phone,
              message: "UpTend: Parts installed! Your job has resumed.",
            }).catch((err: any) => console.error("[SMS] Parts installed notification failed:", err.message));
          }
        }
      } catch (notifErr) {
        console.warn("Failed to send parts installed notification:", notifErr);
      }

      res.json({ partsRequest: result.rows[0] });
    } catch (error: any) {
      console.error("Error marking parts installed:", error);
      res.status(500).json({ error: "Failed to mark parts as installed" });
    }
  });

  // GET /api/business/parts-requests — All parts requests for a business
  app.get("/api/business/parts-requests", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user) return res.status(401).json({ error: "Not authenticated" });
      const userId = (user.userId || user.id);

      // Get user's business account
      const bizResult = await pool.query(
        "SELECT id FROM business_accounts WHERE owner_id = $1 LIMIT 1",
        [userId]
      );
      if (!bizResult.rows.length) {
        return res.status(404).json({ error: "No business account found" });
      }

      const result = await pool.query(
        "SELECT pr.*, sr.pickup_address, sr.service_type FROM parts_requests pr JOIN service_requests sr ON sr.id = pr.service_request_id WHERE pr.business_account_id = $1 ORDER BY pr.created_at DESC",
        [bizResult.rows[0].id]
      );
      res.json({ partsRequests: result.rows });
    } catch (error: any) {
      console.error("Error fetching business parts requests:", error);
      res.status(500).json({ error: "Failed to fetch parts requests" });
    }
  });

  // POST /api/business/preferred-suppliers — Add preferred supplier
  app.post("/api/business/preferred-suppliers", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user) return res.status(401).json({ error: "Not authenticated" });
      const userId = (user.userId || user.id);

      const bizResult = await pool.query(
        "SELECT id FROM business_accounts WHERE owner_id = $1 LIMIT 1",
        [userId]
      );
      if (!bizResult.rows.length) {
        return res.status(404).json({ error: "No business account found" });
      }

      const { supplierName, supplierType, accountNumber, contactInfo, notes } = req.body;
      if (!supplierName || !supplierType) {
        return res.status(400).json({ error: "Supplier name and type are required" });
      }

      const now = new Date().toISOString();
      const result = await pool.query(
        `INSERT INTO preferred_suppliers (business_account_id, supplier_name, supplier_type, account_number, contact_info, notes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [bizResult.rows[0].id, supplierName, supplierType, accountNumber || null, contactInfo || null, notes || null, now]
      );

      res.json({ supplier: result.rows[0] });
    } catch (error: any) {
      console.error("Error adding preferred supplier:", error);
      res.status(500).json({ error: "Failed to add preferred supplier" });
    }
  });

  // GET /api/business/preferred-suppliers — List preferred suppliers
  app.get("/api/business/preferred-suppliers", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user) return res.status(401).json({ error: "Not authenticated" });
      const userId = (user.userId || user.id);

      const bizResult = await pool.query(
        "SELECT id FROM business_accounts WHERE owner_id = $1 LIMIT 1",
        [userId]
      );
      if (!bizResult.rows.length) {
        return res.status(404).json({ error: "No business account found" });
      }

      const result = await pool.query(
        "SELECT * FROM preferred_suppliers WHERE business_account_id = $1 ORDER BY created_at DESC",
        [bizResult.rows[0].id]
      );
      res.json({ suppliers: result.rows });
    } catch (error: any) {
      console.error("Error fetching preferred suppliers:", error);
      res.status(500).json({ error: "Failed to fetch preferred suppliers" });
    }
  });
}
