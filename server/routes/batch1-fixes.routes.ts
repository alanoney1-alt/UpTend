/**
 * Batch 1 API Fixes
 * Endpoints that were returning 404 on production
 */

import type { Express } from "express";
import { requireAuth, requireHauler, optionalAuth } from "../auth-middleware";
import { pool } from "../db";
import { db } from "../db";
import {
  haulerProfiles,
  users,
  serviceRequests,
  haulerCertifications,
  proCertifications,
  certificationPrograms,
  notificationQueue,
  reviews,
} from "@shared/schema";
import { eq, and, or, sql, desc, ilike, inArray } from "drizzle-orm";

export function registerBatch1FixRoutes(app: Express) {

  // ─── 1. GET /api/haulers/available ─────────────────────────────────────────
  app.get("/api/haulers/available", optionalAuth, async (req: any, res) => {
    try {
      const { service, zip } = req.query;

      // Dynamic column detection — hauler_profiles schema varies
      let rows: any[] = [];
      try {
        let query = `
          SELECT 
            hp.id,
            COALESCE(hp.company_name, u.name, u.username) as name,
            hp.rating,
            hp.review_count as "reviewCount",
            hp.service_types as services,
            hp.service_radius as "serviceArea",
            hp.verified,
            hp.profile_photo_url as "profilePhotoUrl",
            hp.bio,
            hp.hourly_rate as "hourlyRate",
            hp.vehicle_type as "vehicleType",
            hp.jobs_completed as "jobsCompleted",
            EXTRACT(MONTH FROM AGE(now(), u.created_at::timestamp)) as "tenureMonths"
          FROM hauler_profiles hp
          JOIN users u ON hp.user_id = u.id
        `;
        const params: any[] = [];

        if (service && typeof service === "string") {
          params.push(service);
          query += ` WHERE $${params.length} = ANY(hp.service_types)`;
        }

        query += ` ORDER BY hp.rating DESC NULLS LAST, hp.review_count DESC NULLS LAST LIMIT 50`;

        const result = await pool.query(query, params);
        rows = result.rows;
      } catch (queryErr: any) {
        // If column doesn't exist, try minimal query
        console.error("Haulers available query failed, trying minimal:", queryErr.message);
        try {
          const { rows: minRows } = await pool.query(
            `SELECT hp.id, COALESCE(hp.company_name, u.name, u.username) as name,
                    hp.rating, hp.service_types as services, hp.verified
             FROM hauler_profiles hp
             JOIN users u ON hp.user_id = u.id
             ORDER BY hp.rating DESC NULLS LAST LIMIT 50`
          );
          rows = minRows;
        } catch (minErr: any) {
          console.error("Haulers minimal query also failed:", minErr.message);
          rows = [];
        }
      }

      res.json(rows.map((r: any) => ({
        ...r,
        services: r.services || [],
        tenureMonths: Math.max(0, Math.round(r.tenureMonths || 0)),
      })));
    } catch (error) {
      console.error("Error fetching available haulers:", error);
      res.status(500).json({ error: "Failed to fetch available pros" });
    }
  });

  // ─── 2. GET /api/certifications ────────────────────────────────────────────
  app.get("/api/certifications", async (_req, res) => {
    try {
      // First try to get from DB (certification_programs table)
      const { rows } = await pool.query(
        `SELECT id, name, slug, description, category, required_score as "requiredScore",
                modules_count as "modulesCount", estimated_minutes as "estimatedMinutes",
                expiration_days as "expirationDays", is_active as "isActive",
                badge_icon as "badgeIcon", badge_color as "badgeColor"
         FROM certification_programs WHERE is_active = true ORDER BY name`
      );

      if (rows.length > 0) {
        return res.json(rows);
      }

      // Fallback: static certification program definitions
      const programs = [
        {
          id: "b2b-pm",
          name: "B2B Property Management",
          slug: "b2b-pm",
          description: "Certified to handle property management company contracts. Includes multi-unit scheduling, vendor coordination, and tenant communication protocols.",
          category: "b2b",
          requirements: ["Complete 5 PM training modules", "Pass certification exam (80%+)", "Background check verified"],
          benefits: ["Priority PM job matching", "Higher payout rates", "Dedicated PM dashboard"],
        },
        {
          id: "b2b-hoa",
          name: "B2B HOA Services",
          slug: "b2b-hoa",
          description: "Certified for HOA community maintenance contracts. Covers compliance documentation, community standards, and bulk scheduling.",
          category: "b2b",
          requirements: ["Complete HOA compliance training", "Pass certification exam (80%+)", "Insurance verification"],
          benefits: ["HOA contract eligibility", "Community bulk pricing", "Compliance reporting tools"],
        },
        {
          id: "ai-home-scan",
          name: "AI Home Scan Specialist",
          slug: "ai-home-scan",
          description: "Trained to perform comprehensive AI-assisted home health scans using UpTend's proprietary scanning technology.",
          category: "specialty",
          requirements: ["Complete Home Scan training", "Demonstrate scan proficiency", "Device calibration test"],
          benefits: ["Home scan job access", "Premium scan pricing", "AI analysis tools"],
        },
        {
          id: "parts-materials",
          name: "Parts & Materials Specialist",
          slug: "parts-materials",
          description: "Certified in proper parts identification, sourcing, and materials handling for home maintenance and repair jobs.",
          category: "specialty",
          requirements: ["Parts identification training", "Vendor network enrollment", "Safety compliance"],
          benefits: ["Parts markup revenue", "Vendor discounts", "Priority supply access"],
        },
        {
          id: "emergency-response",
          name: "Emergency Response",
          slug: "emergency-response",
          description: "Certified for urgent and emergency service calls. Includes rapid response protocols, safety procedures, and crisis management.",
          category: "specialty",
          requirements: ["Emergency protocols training", "First aid certification", "Rapid response commitment"],
          benefits: ["Emergency job priority", "Premium emergency rates", "24/7 dispatch access"],
        },
        {
          id: "government-contract",
          name: "Government Contract",
          slug: "government-contract",
          description: "Qualified for government and municipal contracts. Covers compliance requirements, reporting standards, and public sector protocols.",
          category: "government",
          requirements: ["Government compliance training", "Security clearance", "Bonding requirements"],
          benefits: ["Government RFP eligibility", "Stable contract revenue", "Municipal partnerships"],
        },
      ];

      res.json(programs);
    } catch (error) {
      console.error("Error fetching certifications:", error);
      res.status(500).json({ error: "Failed to fetch certifications" });
    }
  });

  // ─── 3. GET /api/subscriptions (auth'd user's subscriptions) ────────────────
  app.get("/api/subscriptions", requireAuth, async (req: any, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;

      // Get from both subscription systems
      const { rows: polishUp } = await pool.query(
        `SELECT * FROM subscriptions WHERE customer_id = $1 ORDER BY created_at DESC`,
        [userId]
      );

      const { rows: plans } = await pool.query(
        `SELECT * FROM service_subscriptions WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
      );

      res.json({
        subscriptions: polishUp,
        plans,
        total: polishUp.length + plans.length,
      });
    } catch (error: any) {
      console.error("Error fetching subscriptions:", error);
      // Return empty if tables don't exist yet
      if (error?.code === "42P01") {
        return res.json({ subscriptions: [], plans: [], total: 0 });
      }
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  // ─── 4. GET /api/wallet ────────────────────────────────────────────────────
  // Authenticated wallet endpoint (in addition to the /api/wallet/:customerId in home-scan)
  app.get("/api/wallet", requireAuth, async (req: any, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;

      // Ensure wallet exists
      await pool.query(
        `INSERT INTO customer_wallet (customer_id, balance, total_earned, total_spent)
         VALUES ($1, 0, 0, 0) ON CONFLICT (customer_id) DO NOTHING`,
        [userId]
      );

      const { rows: walletRows } = await pool.query(
        `SELECT * FROM customer_wallet WHERE customer_id = $1`,
        [userId]
      );

      const { rows: transactions } = await pool.query(
        `SELECT * FROM scan_rewards WHERE customer_id = $1 ORDER BY awarded_at DESC LIMIT 50`,
        [userId]
      );

      res.json({
        success: true,
        wallet: walletRows[0] || { balance: 0, total_earned: 0, total_spent: 0 },
        transactions,
      });
    } catch (error) {
      console.error("Error fetching wallet:", error);
      res.status(500).json({ error: "Failed to fetch wallet" });
    }
  });

  // ─── 5. GET /api/notifications ─────────────────────────────────────────────
  app.get("/api/notifications", requireAuth, async (req: any, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = parseInt(req.query.offset as string) || 0;

      // Try notification_queue, then service_requests, then return empty
      let notifications: any[] = [];
      let total = 0;
      let unread = 0;
      
      // Attempt 1: notification_queue table
      try {
        const { rows } = await pool.query(
          `SELECT id, notification_type as "notificationType", title, message,
                  action_text as "actionText", action_url as "actionUrl",
                  priority, status, is_read as "isRead",
                  created_at as "createdAt", sent_at as "sentAt"
           FROM notification_queue
           WHERE user_id = $1
           ORDER BY created_at DESC
           LIMIT $2 OFFSET $3`,
          [userId, limit, offset]
        );
        const { rows: countRows } = await pool.query(
          `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_read = false) as unread
           FROM notification_queue WHERE user_id = $1`,
          [userId]
        );
        notifications = rows;
        total = parseInt(countRows[0]?.total || "0");
        unread = parseInt(countRows[0]?.unread || "0");
      } catch (_e1) {
        // Attempt 2: derive from service_requests
        try {
          const { rows } = await pool.query(
            `SELECT id, service_type as "notificationType", 
                    CONCAT('Job Update: ', service_type) as title,
                    CONCAT('Your ', service_type, ' job status: ', status) as message,
                    status, created_at as "createdAt"
             FROM service_requests
             WHERE customer_id = $1
             ORDER BY created_at DESC
             LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
          );
          notifications = rows.map((r: any) => ({ ...r, isRead: true, actionUrl: `/profile` }));
          total = notifications.length;
        } catch (_e2) {
          // Both failed — return empty
          console.error("Notifications: both queries failed");
        }
      }

      res.json({ notifications, total, unread });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // ─── 7. GET /api/haulers/certifications ────────────────────────────────────
  app.get("/api/haulers/certifications", requireAuth, requireHauler, async (req: any, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;

      // Get hauler profile ID
      const { rows: profileRows } = await pool.query(
        `SELECT id FROM hauler_profiles WHERE user_id = $1 LIMIT 1`,
        [userId]
      );

      if (profileRows.length === 0) {
        return res.json({ certifications: [] });
      }

      const proId = profileRows[0].id;

      // Get pro certifications with program details
      const { rows } = await pool.query(
        `SELECT pc.id, pc.status, pc.score, pc.started_at as "startedAt",
                pc.completed_at as "completedAt", pc.expires_at as "expiresAt",
                pc.certificate_number as "certificateNumber",
                pc.modules_completed as "modulesCompleted",
                pc.quiz_attempts as "quizAttempts",
                cp.name, cp.slug, cp.description, cp.category,
                cp.modules_count as "modulesCount", cp.badge_icon as "badgeIcon",
                cp.badge_color as "badgeColor"
         FROM pro_certifications pc
         JOIN certification_programs cp ON pc.certification_id = cp.id
         WHERE pc.pro_id = $1
         ORDER BY pc.created_at DESC`,
        [proId]
      );

      // Also get legacy hauler_certifications
      const { rows: legacyCerts } = await pool.query(
        `SELECT id, type, skill_type as "skillType", status, is_active as "isActive",
                earned_at as "earnedAt", expires_at as "expiresAt",
                quiz_score as "quizScore", accuracy_rating as "accuracyRating"
         FROM hauler_certifications WHERE hauler_id = $1`,
        [proId]
      );

      res.json({
        certifications: rows,
        legacyCertifications: legacyCerts,
      });
    } catch (error) {
      console.error("Error fetching pro certifications:", error);
      res.status(500).json({ error: "Failed to fetch certifications" });
    }
  });

  // ─── 8. GET /api/haulers/quality-score ─────────────────────────────────────
  app.get("/api/haulers/quality-score", requireAuth, requireHauler, async (req: any, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;

      const { rows: profileRows } = await pool.query(
        `SELECT id, rating, review_count, jobs_completed, five_star_rating_count
         FROM hauler_profiles WHERE user_id = $1 LIMIT 1`,
        [userId]
      );

      if (profileRows.length === 0) {
        return res.status(404).json({ error: "Pro profile not found" });
      }

      const profile = profileRows[0];
      const proId = profile.id;

      // Get job stats
      const { rows: jobStats } = await pool.query(
        `SELECT 
           COUNT(*) FILTER (WHERE status = 'completed') as completed,
           COUNT(*) FILTER (WHERE status IN ('cancelled') AND cancelled_by = 'pycker') as cancelled_by_pro,
           COUNT(*) FILTER (WHERE photo_urls IS NOT NULL AND array_length(photo_urls, 1) > 0) as with_photos,
           COUNT(*) as total
         FROM service_requests WHERE assigned_hauler_id = $1`,
        [proId]
      );

      const stats = jobStats[0] || {};
      const completed = parseInt(stats.completed || "0");
      const total = parseInt(stats.total || "0");
      const withPhotos = parseInt(stats.with_photos || "0");
      const cancelledByPro = parseInt(stats.cancelled_by_pro || "0");

      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 100;
      const photoDocRate = completed > 0 ? Math.round((withPhotos / completed) * 100) : 0;
      const avgRating = profile.rating || 5.0;

      // Composite quality score (weighted)
      const qualityScore = Math.round(
        (avgRating / 5) * 40 + // 40% weight on rating
        (completionRate / 100) * 30 + // 30% weight on completion
        (photoDocRate / 100) * 15 + // 15% weight on photo documentation
        (cancelledByPro === 0 ? 15 : Math.max(0, 15 - cancelledByPro * 3)) // 15% reliability
      );

      res.json({
        qualityScore: Math.min(100, qualityScore),
        breakdown: {
          averageRating: avgRating,
          reviewCount: profile.review_count || 0,
          completionRate,
          photoDocumentationRate: photoDocRate,
          jobsCompleted: completed,
          totalJobs: total,
          fiveStarCount: profile.five_star_rating_count || 0,
          proCancellations: cancelledByPro,
        },
      });
    } catch (error) {
      console.error("Error fetching quality score:", error);
      res.status(500).json({ error: "Failed to fetch quality score" });
    }
  });

  // ─── 9. GET /api/haulers/jobs ──────────────────────────────────────────────
  app.get("/api/haulers/jobs", requireAuth, requireHauler, async (req: any, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;

      // Get hauler profile
      const { rows: profileRows } = await pool.query(
        `SELECT id FROM hauler_profiles WHERE user_id = $1 LIMIT 1`,
        [userId]
      );

      if (profileRows.length === 0) {
        return res.json({ upcoming: [], active: [], completed: [] });
      }

      const proId = profileRows[0].id;
      const statusFilter = req.query.status as string;

      const { rows } = await pool.query(
        `SELECT id, service_type as "serviceType", status,
                pickup_address as "pickupAddress", pickup_city as "pickupCity", pickup_zip as "pickupZip",
                destination_address as "destinationAddress",
                load_estimate as "loadEstimate", description,
                scheduled_for as "scheduledFor",
                price_estimate as "priceEstimate", final_price as "finalPrice",
                hauler_payout as "haulerPayout",
                started_at as "startedAt", completed_at as "completedAt",
                created_at as "createdAt", photo_urls as "photoUrls",
                tip_amount as "tipAmount",
                customer_id as "customerId"
         FROM service_requests
         WHERE assigned_hauler_id = $1
         ORDER BY scheduled_for DESC
         LIMIT 100`,
        [proId]
      );

      const upcoming = rows.filter((j: any) => ["assigned", "matching"].includes(j.status));
      const active = rows.filter((j: any) => j.status === "in_progress");
      const completed = rows.filter((j: any) => j.status === "completed");
      const cancelled = rows.filter((j: any) => j.status === "cancelled");

      if (statusFilter) {
        const filtered = rows.filter((j: any) => j.status === statusFilter);
        return res.json({ jobs: filtered, total: filtered.length });
      }

      res.json({ upcoming, active, completed, cancelled, total: rows.length });
    } catch (error) {
      console.error("Error fetching hauler jobs:", error);
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });
}
