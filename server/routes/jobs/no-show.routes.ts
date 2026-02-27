import type { Express } from "express";
import { requireAuth, requireHauler } from "../../auth-middleware";
import { storage } from "../../storage";
import {
  startNoShowTimer,
  proCheckedIn,
  proSentDelayMessage,
  getNoShowStatus,
} from "../../services/no-show-protection";

export function registerNoShowRoutes(app: Express) {
  // POST /api/jobs/:id/check-in - Pro confirms arrival (manual "I'm Here" button)
  app.post("/api/jobs/:id/check-in", requireAuth, requireHauler, async (req: any, res) => {
    try {
      const jobId = req.params.id;
      const proId = (req.user as any).userId || (req.user as any).id;

      const job = await storage.getServiceRequest(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      if (job.assignedHaulerId !== proId) {
        return res.status(403).json({ error: "You are not assigned to this job" });
      }

      // Optional GPS validation
      const { lat, lng } = req.body || {};
      if (lat && lng && job.pickupLat && job.pickupLng) {
        const distance = haversineDistance(lat, lng, job.pickupLat, job.pickupLng);
        // Allow up to 0.5 miles (~800m) for GPS check-in
        if (distance > 0.5) {
          return res.status(400).json({
            error: "You appear to be too far from the job location. Use the manual check-in or get closer.",
            distance: Math.round(distance * 100) / 100,
            maxDistance: 0.5,
          });
        }
      }

      const success = proCheckedIn(jobId, proId);
      if (!success) {
        // Timer may not be active - that's OK, the check-in still counts
        console.log(`[NoShow] Check-in for job ${jobId} - no active timer (may have already expired or not started)`);
      }

      res.json({ success: true, message: "Checked in successfully" });
    } catch (error) {
      console.error("[NoShow] Check-in error:", error);
      res.status(500).json({ error: "Failed to process check-in" });
    }
  });

  // POST /api/jobs/:id/delay-reason - Pro sends delay explanation
  app.post("/api/jobs/:id/delay-reason", requireAuth, requireHauler, async (req: any, res) => {
    try {
      const jobId = req.params.id;
      const proId = (req.user as any).userId || (req.user as any).id;
      const { reason } = req.body;

      if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
        return res.status(400).json({ error: "A delay reason is required" });
      }

      const job = await storage.getServiceRequest(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      if (job.assignedHaulerId !== proId) {
        return res.status(403).json({ error: "You are not assigned to this job" });
      }

      const success = proSentDelayMessage(jobId, proId, reason.trim());
      if (!success) {
        return res.status(400).json({ error: "No active no-show timer for this job" });
      }

      res.json({ success: true, message: "Delay reason recorded. Job stays assigned but flagged for review." });
    } catch (error) {
      console.error("[NoShow] Delay reason error:", error);
      res.status(500).json({ error: "Failed to record delay reason" });
    }
  });

  // GET /api/jobs/:id/no-show-status - Check timer status
  app.get("/api/jobs/:id/no-show-status", requireAuth, async (req: any, res) => {
    try {
      const jobId = req.params.id;
      const status = getNoShowStatus(jobId);
      res.json(status);
    } catch (error) {
      console.error("[NoShow] Status check error:", error);
      res.status(500).json({ error: "Failed to get no-show status" });
    }
  });

  // POST /api/jobs/:id/start-no-show-timer - Admin/system endpoint to manually trigger timer
  app.post("/api/jobs/:id/start-no-show-timer", requireAuth, async (req: any, res) => {
    try {
      const jobId = req.params.id;
      const job = await storage.getServiceRequest(jobId);

      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      if (!job.assignedHaulerId) {
        return res.status(400).json({ error: "No pro assigned to this job" });
      }

      startNoShowTimer(jobId, job.assignedHaulerId, job.scheduledFor);
      res.json({ success: true, message: "No-show timer started (30 min window)" });
    } catch (error) {
      console.error("[NoShow] Start timer error:", error);
      res.status(500).json({ error: "Failed to start no-show timer" });
    }
  });
}

// ─── Haversine distance in miles ─────────────────────────────────────────────

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
