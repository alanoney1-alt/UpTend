/**
 * Certification Gating Routes
 * - Pro job feed filtered by certifications
 * - Pro certification status endpoints
 * - Business account certified pro browsing
 */

import type { Express } from "express";
import { requireAuth, requireHauler } from "../../auth-middleware";
import { db } from "../../db";
import { sql } from "drizzle-orm";
import {
  getProCerts,
  getRequiredCerts,
  getRequiredCertsForJob,
  filterCertifiedPros,
  countHiddenJobs,
} from "../../services/certification-guard";

export function registerCertificationGatingRoutes(app: Express) {

  // =============================================
  // PRO: Available jobs filtered by certifications
  // =============================================
  app.get("/api/jobs/available", requireAuth, requireHauler, async (req: any, res) => {
    try {
      const proId = (req.user as any).userId || (req.user as any).id;

      // Get pro's hauler profile for location
      const profileResult = await db.execute(sql`
        SELECT * FROM hauler_profiles WHERE user_id = ${proId} LIMIT 1
      `);
      const profile = profileResult.rows?.[0] as any;
      if (!profile) return res.status(404).json({ error: "Pro profile not found" });

      const proCerts = await getProCerts(proId);

      // Get pending/available jobs
      const jobsResult = await db.execute(sql`
        SELECT sr.*, ba.account_type, ba.business_name, ba.id as business_account_id
        FROM service_requests sr
        LEFT JOIN business_accounts ba ON ba.user_id = sr.customer_id
        WHERE sr.status IN ('pending', 'pending_payment')
          AND sr.assigned_hauler_id IS NULL
        ORDER BY sr.created_at DESC
        LIMIT 100
      `);

      const allJobs = (jobsResult.rows || []) as any[];
      const visibleJobs: any[] = [];
      let hiddenCount = 0;
      const missingCertsSet = new Set<string>();

      for (const job of allJobs) {
        const required = getRequiredCerts(job.service_type, job.business_account_id, job.account_type);
        if (required.length === 0) {
          // Consumer job — no cert needed
          visibleJobs.push(job);
        } else {
          const missing = required.filter((r: string) => !proCerts.includes(r));
          if (missing.length === 0) {
            // Pro has all certs
            visibleJobs.push({ ...job, certificationRequired: required });
          } else {
            hiddenCount++;
            missing.forEach((m: string) => missingCertsSet.add(m));
          }
        }
      }

      res.json({
        jobs: visibleJobs,
        hiddenJobCount: hiddenCount,
        missingCerts: [...missingCertsSet],
        proCerts,
      });
    } catch (error: any) {
      console.error("Error fetching available jobs:", error);
      res.status(500).json({ error: "Failed to fetch available jobs" });
    }
  });

  // =============================================
  // PRO: Get my certifications
  // =============================================
  app.get("/api/pro/certifications", requireAuth, requireHauler, async (req: any, res) => {
    try {
      const proId = (req.user as any).userId || (req.user as any).id;

      const result = await db.execute(sql`
        SELECT pc.*, cp.name, cp.slug, cp.badge_icon, cp.badge_color, cp.category, cp.description
        FROM pro_certifications pc
        JOIN certification_programs cp ON cp.id = pc.certification_id
        WHERE pc.pro_id = ${proId}
        ORDER BY pc.completed_at DESC
      `);

      const activeCerts = (result.rows || []).filter((r: any) =>
        r.status === "completed" && (!r.expires_at || r.expires_at > new Date().toISOString())
      );
      const expiredCerts = (result.rows || []).filter((r: any) =>
        r.status === "completed" && r.expires_at && r.expires_at <= new Date().toISOString()
      );
      const inProgress = (result.rows || []).filter((r: any) => r.status === "in_progress");

      // Get available certs not yet earned
      const allCerts = await db.execute(sql`
        SELECT * FROM certification_programs WHERE is_active = true ORDER BY name
      `);
      const earnedIds = new Set((result.rows || []).map((r: any) => r.certification_id));
      const availableCerts = (allCerts.rows || []).filter((r: any) => !earnedIds.has(r.id));

      // Count hidden jobs
      const { hiddenCount, missingCerts } = await countHiddenJobs(proId);

      res.json({
        active: activeCerts,
        expired: expiredCerts,
        inProgress,
        available: availableCerts,
        hiddenJobCount: hiddenCount,
        missingCerts,
      });
    } catch (error: any) {
      console.error("Error fetching pro certifications:", error);
      res.status(500).json({ error: "Failed to fetch certifications" });
    }
  });

  // =============================================
  // PRO: Get certifications for a specific pro (public, for pro cards)
  // =============================================
  app.get("/api/pros/:proId/certifications", async (req, res) => {
    try {
      const certs = await getProCerts(req.params.proId);
      res.json({ certifications: certs });
    } catch (error: any) {
      console.error("Error fetching pro certs:", error);
      res.status(500).json({ error: "Failed to fetch certifications" });
    }
  });

  // =============================================
  // BUSINESS: Browse certified pros for a job type
  // =============================================
  app.get("/api/business/certified-pros", requireAuth, async (req: any, res) => {
    try {
      const { jobType, businessAccountId } = req.query;
      if (!jobType) return res.status(400).json({ error: "jobType query param required" });

      const requiredCerts = await getRequiredCertsForJob(
        jobType as string,
        businessAccountId as string | undefined
      );

      // Get available pros
      const prosResult = await db.execute(sql`
        SELECT hp.*, u.first_name, u.last_name
        FROM hauler_profiles hp
        LEFT JOIN users u ON u.id = hp.user_id
        WHERE hp.is_available = true AND hp.can_accept_jobs = true
        ORDER BY hp.rating DESC, hp.jobs_completed DESC
        LIMIT 50
      `);

      let pros = (prosResult.rows || []) as any[];

      if (requiredCerts.length > 0) {
        const proIds = pros.map((p: any) => p.id);
        const certifiedIds = await filterCertifiedPros(proIds, jobType as string, businessAccountId as string | undefined);
        const certSet = new Set(certifiedIds);
        pros = pros.filter((p: any) => certSet.has(p.id));
      }

      // Attach cert badges to each pro
      const prosWithCerts = await Promise.all(
        pros.map(async (pro: any) => {
          const certs = await getProCerts(pro.user_id);
          return { ...pro, certifications: certs };
        })
      );

      res.json({
        pros: prosWithCerts,
        requiredCerts,
        totalFound: prosWithCerts.length,
      });
    } catch (error: any) {
      console.error("Error browsing certified pros:", error);
      res.status(500).json({ error: "Failed to browse certified pros" });
    }
  });
}
