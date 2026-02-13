/**
 * Admin Management Routes
 * 
 * Handles: Pro application review (pyckers), user search/ban/refund,
 * surge modifiers CRUD, active jobs listing
 */
import type { Express } from "express";
import { storage } from "../../storage";
import { requireAuth, requireAdmin } from "../../middleware/auth";
import { pool } from "../../db";

export function registerAdminManagementRoutes(app: Express) {
  // ==========================================
  // PRO APPLICATION MANAGEMENT (Pyckers)
  // ==========================================

  // GET /api/admin/pyckers/all — List all pro applications
  app.get("/api/admin/pyckers/all", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const haulers = await storage.getAllHaulers();
      const pyckers = haulers.map((h: any) => ({
        profileId: h.haulerInfo?.id || h.id,
        userId: h.id,
        name: h.name || `${h.firstName || ""} ${h.lastName || ""}`.trim() || "Unknown",
        email: h.email || "",
        phone: h.phone || h.haulerInfo?.phone || "",
        companyName: h.haulerInfo?.companyName || "",
        vehicleType: h.haulerInfo?.vehicleType || "unknown",
        backgroundCheckStatus: h.haulerInfo?.backgroundCheckStatus || "pending",
        canAcceptJobs: h.haulerInfo?.canAcceptJobs ?? false,
        registrationData: {
          streetAddress: h.haulerInfo?.streetAddress,
          city: h.haulerInfo?.city,
          state: h.haulerInfo?.state,
          zipCode: h.haulerInfo?.zipCode,
          vehicleYear: h.haulerInfo?.vehicleYear,
          vehicleMake: h.haulerInfo?.vehicleMake,
          vehicleModel: h.haulerInfo?.vehicleModel,
          licensePlate: h.haulerInfo?.licensePlate,
          driversLicense: h.haulerInfo?.driversLicense,
          insuranceProvider: h.haulerInfo?.insuranceProvider,
          insurancePolicyNumber: h.haulerInfo?.insurancePolicyNumber,
          aboutYou: h.haulerInfo?.aboutYou,
          submittedAt: h.haulerInfo?.createdAt,
        },
        createdAt: h.haulerInfo?.createdAt || h.createdAt,
      }));
      res.json(pyckers);
    } catch (error) {
      console.error("Error fetching pyckers:", error);
      res.status(500).json({ error: "Failed to fetch pro applications" });
    }
  });

  // POST /api/admin/pyckers/:profileId/approve
  app.post("/api/admin/pyckers/:profileId/approve", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { profileId } = req.params;
      const updated = await storage.updateHaulerProfile(profileId, {
        backgroundCheckStatus: "approved",
        canAcceptJobs: true,
      });
      if (!updated) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json({ success: true, profile: updated });
    } catch (error) {
      console.error("Error approving pycker:", error);
      res.status(500).json({ error: "Failed to approve pro" });
    }
  });

  // POST /api/admin/pyckers/:profileId/reject
  app.post("/api/admin/pyckers/:profileId/reject", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { profileId } = req.params;
      const { reason } = req.body || {};
      const updated = await storage.updateHaulerProfile(profileId, {
        backgroundCheckStatus: "rejected",
        canAcceptJobs: false,
      });
      if (!updated) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json({ success: true, profile: updated, reason });
    } catch (error) {
      console.error("Error rejecting pycker:", error);
      res.status(500).json({ error: "Failed to reject pro" });
    }
  });

  // ==========================================
  // ACTIVE JOBS (Admin Supervision)
  // ==========================================

  // GET /api/admin/jobs/active — Active jobs for admin dashboard
  app.get("/api/admin/jobs/active", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const jobs = await storage.getAllJobsWithDetails();
      // Filter to active-ish statuses
      const activeStatuses = ["accepted", "assigned", "in_progress", "en_route", "disputed", "problem", "flagged"];
      const activeJobs = (jobs || []).filter((j: any) => activeStatuses.includes(j.status));
      res.json(activeJobs);
    } catch (error) {
      console.error("Error fetching active jobs:", error);
      res.status(500).json({ error: "Failed to fetch active jobs" });
    }
  });

  // ==========================================
  // USER MANAGEMENT
  // ==========================================

  // GET /api/admin/users/search?q=...
  app.get("/api/admin/users/search", requireAuth, requireAdmin, async (req, res) => {
    try {
      const q = (req.query.q as string || "").toLowerCase().trim();
      if (q.length < 2) {
        return res.json([]);
      }
      const allUsers = await storage.getUsers();
      const results = allUsers.filter((u: any) => {
        const name = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
        const email = (u.email || "").toLowerCase();
        const phone = (u.phone || "").replace(/\D/g, "");
        return name.includes(q) || email.includes(q) || phone.includes(q);
      }).slice(0, 50);
      res.json(results);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ error: "Failed to search users" });
    }
  });

  // POST /api/admin/users/:userId/ban
  app.post("/api/admin/users/:userId/ban", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const updated = await storage.updateUser(userId, { isBanned: true } as any);
      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ success: true, user: updated });
    } catch (error) {
      console.error("Error banning user:", error);
      res.status(500).json({ error: "Failed to ban user" });
    }
  });

  // POST /api/admin/users/:userId/refund
  app.post("/api/admin/users/:userId/refund", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      // Placeholder — actual Stripe refund logic would go here
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ success: true, message: "Refund initiated", userId });
    } catch (error) {
      console.error("Error processing refund:", error);
      res.status(500).json({ error: "Failed to process refund" });
    }
  });

  // ==========================================
  // SURGE MODIFIERS CRUD
  // ==========================================

  // GET /api/admin/surge-modifiers
  app.get("/api/admin/surge-modifiers", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const modifiers = await storage.getSurgeModifiers();
      // Calculate current multiplier
      const now = new Date();
      const dayOfWeek = now.getDay();
      const hour = now.getHours();
      const activeModifiers = (modifiers || []).filter((m: any) => {
        if (!m.active) return false;
        if (m.dayOfWeek !== null && m.dayOfWeek !== dayOfWeek) return false;
        if (hour < m.startHour || hour > m.endHour) return false;
        return true;
      });
      const currentMultiplier = activeModifiers.reduce(
        (max: number, m: any) => Math.max(max, m.multiplier || 1),
        1
      );
      res.json({ modifiers: modifiers || [], currentMultiplier });
    } catch (error) {
      console.error("Error fetching surge modifiers:", error);
      res.status(500).json({ error: "Failed to fetch surge modifiers" });
    }
  });

  // POST /api/admin/surge-modifiers
  app.post("/api/admin/surge-modifiers", requireAuth, requireAdmin, async (req, res) => {
    try {
      const modifier = await storage.createSurgeModifier(req.body);
      res.json(modifier);
    } catch (error) {
      console.error("Error creating surge modifier:", error);
      res.status(500).json({ error: "Failed to create surge modifier" });
    }
  });

  // PATCH /api/admin/surge-modifiers/:id
  app.patch("/api/admin/surge-modifiers/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const modifier = await storage.updateSurgeModifier(id, req.body);
      if (!modifier) {
        return res.status(404).json({ error: "Surge modifier not found" });
      }
      res.json(modifier);
    } catch (error) {
      console.error("Error updating surge modifier:", error);
      res.status(500).json({ error: "Failed to update surge modifier" });
    }
  });

  // DELETE /api/admin/surge-modifiers/:id
  app.delete("/api/admin/surge-modifiers/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSurgeModifier(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting surge modifier:", error);
      res.status(500).json({ error: "Failed to delete surge modifier" });
    }
  });
}
