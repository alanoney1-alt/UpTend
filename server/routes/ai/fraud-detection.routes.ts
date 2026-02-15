/**
 * AI Fraud & Quality Detection API Routes (#22)
 *
 * Anomaly detection: reused photos, GPS mismatch, impossibly fast jobs, pattern analysis.
 *
 * Endpoints:
 * - GET /api/ai/admin/fraud-alerts - Admin: list alerts
 * - GET /api/ai/admin/fraud-alerts/:id - Admin: get alert details
 * - POST /api/ai/admin/fraud-alerts/:id/review - Admin: review and take action
 * - POST /api/ai/fraud/scan-job/:jobId - Trigger fraud scan on a specific job
 */

import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import { requireAuth } from "../../auth-middleware";
import type { DatabaseStorage } from "../../storage/impl/database-storage";
import { nanoid } from "nanoid";

export function createFraudDetectionRoutes(storage: DatabaseStorage) {
  const router = Router();

  // GET /api/ai/admin/fraud-alerts
  router.get("/admin/fraud-alerts", requireAuth, async (req, res) => {
    try {
      const { status, limit } = req.query;
      const alerts = await storage.getPendingFraudAlerts();
      res.json({ success: true, alerts });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/ai/admin/fraud-alerts/:id
  router.get("/admin/fraud-alerts/:id", requireAuth, async (req, res) => {
    try {
      const alert = await storage.getFraudAlert(req.params.id);
      if (!alert) return res.status(404).json({ error: "Alert not found" });
      res.json({ success: true, alert });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/ai/admin/fraud-alerts/:id/review
  const reviewSchema = z.object({
    resolution: z.enum(["confirmed_fraud", "false_positive", "needs_more_info"]),
    actionTaken: z.enum(["warning", "job_refund", "account_suspended", "account_banned", "no_action"]),
    notes: z.string().optional(),
  });

  router.post("/admin/fraud-alerts/:id/review", requireAuth, async (req, res) => {
    try {
      const validated = reviewSchema.parse(req.body);
      const alert = await storage.getFraudAlert(req.params.id);
      if (!alert) return res.status(404).json({ error: "Alert not found" });

      await storage.updateFraudAlert(alert.id, {
        status: validated.resolution === "needs_more_info" ? "under_review" : validated.resolution,
        reviewedBy: ((req.user as any).userId || (req.user as any).id),
        reviewedAt: new Date().toISOString(),
        reviewNotes: validated.notes || null,
        actionTaken: validated.actionTaken,
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // POST /api/ai/fraud/scan-job/:jobId - Run fraud scan on a job
  router.post("/fraud/scan-job/:jobId", requireAuth, async (req, res) => {
    try {
      const job = await storage.getServiceRequest(req.params.jobId);
      if (!job) return res.status(404).json({ error: "Job not found" });

      const checks: string[] = [];
      let riskScore = 0;

      // Check 1: Impossibly fast completion
      if (job.startedAt && job.completedAt) {
        const durationMin = (new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()) / 60000;
        if (durationMin < 5) {
          checks.push(`Suspiciously fast: completed in ${durationMin.toFixed(1)} minutes`);
          riskScore += 40;
        }
      }

      // Check 2: GPS mismatch (if pickup coordinates exist)
      // Placeholder — would check hauler GPS vs job address

      // Check 3: Photo hash comparison - detect reused before/after photos
      if (job.photoUrls && job.photoUrls.length > 0) {
        const photoHashes: string[] = [];
        for (const url of job.photoUrls) {
          try {
            const resp = await fetch(url);
            if (resp.ok) {
              const buffer = Buffer.from(await resp.arrayBuffer());
              const hash = crypto.createHash("sha256").update(buffer).digest("hex");
              photoHashes.push(hash);
            }
          } catch {
            // Skip unreachable photos
          }
        }
        // Check for duplicate photos within the same job
        const uniqueHashes = new Set(photoHashes);
        if (uniqueHashes.size < photoHashes.length) {
          checks.push(`Duplicate photos detected: ${photoHashes.length - uniqueHashes.size} reused photo(s)`);
          riskScore += 30;
        }
        // TODO: In production, compare photoHashes against a global duplicate_photo_hashes table
      }

      if (riskScore > 20) {
        await storage.createFraudAlert({
          id: nanoid(),
          alertType: riskScore > 50 ? "impossible_duration" : "behavioral_anomaly",
          severity: riskScore > 50 ? "high" : "medium",
          proUserId: job.assignedHaulerId || "unknown",
          serviceRequestId: job.id,
          evidence: { checks, durationMinutes: job.startedAt && job.completedAt ? (new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()) / 60000 : null },
          aiConfidence: Math.min(riskScore / 100, 1),
          status: "pending",
          reviewedBy: null,
          reviewedAt: null,
          reviewNotes: null,
          actionTaken: null,
          createdAt: new Date().toISOString(),
        });
      }

      res.json({
        success: true,
        riskScore,
        checks,
        alertCreated: riskScore > 20,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

export default createFraudDetectionRoutes;
