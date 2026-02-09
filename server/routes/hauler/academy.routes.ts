/**
 * Pro Academy Certification Routes
 * Handles skill certification badges and career progression
 */

import type { Express, Request, Response } from "express";
import { z } from "zod";
import { requireAuth, requireHauler } from "../../auth-middleware";
import { storage } from "../../storage";

const certifySchema = z.object({
  skills: z.array(z.string()),
  scores: z.record(z.string(), z.number()),
});

export function registerAcademyRoutes(app: Express) {
  /**
   * POST /api/academy/certify
   * Award certifications for completed academy modules
   */
  app.post("/api/academy/certify", requireAuth, requireHauler, async (req: Request, res: Response) => {
    try {
      const { skills, scores } = certifySchema.parse(req.body);
      const haulerId = (req.user as any).id;

      // Award certifications for each completed skill
      const certifications = [];
      for (const skillType of skills) {
        const quizScore = scores[skillType] || 100;

        // Create certification record
        const cert = await storage.createHaulerCertification({
          haulerId,
          type: "skill_badge",
          skillType,
          status: "active",
          isActive: true,
          quizScore,
          accuracyRating: 100,
        });

        certifications.push(cert);
      }

      // If core_safety is certified, also create an app_certification badge
      if (skills.includes("core_safety")) {
        // This enables the Pro to see and accept jobs
        const appCert = await storage.createHaulerCertification({
          haulerId,
          type: "app_certification",
          skillType: "core_safety",
          status: "active",
          isActive: true,
          quizScore: scores["core_safety"] || 100,
          accuracyRating: 100,
        });

        // Also enable job acceptance in the profile
        await storage.updateHaulerProfile(haulerId, {
          canAcceptJobs: true,
        });

        certifications.push(appCert);
      }

      res.json({
        success: true,
        certifications,
        message: `${certifications.length} certification${certifications.length !== 1 ? "s" : ""} awarded`,
      });
    } catch (error) {
      console.error("[Academy] Certification failed:", error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to award certifications",
      });
    }
  });

  /**
   * GET /api/hauler/certifications
   * Retrieve all certifications for the authenticated Pro
   */
  app.get("/api/hauler/certifications", requireAuth, requireHauler, async (req: Request, res: Response) => {
    try {
      const haulerId = (req.user as any).id;
      const certifications = await storage.getHaulerCertifications(haulerId);

      res.json({
        certifications,
        badges: certifications.map(c => c.skillType),
      });
    } catch (error) {
      console.error("[Academy] Failed to fetch certifications:", error);
      res.status(500).json({ error: "Failed to retrieve certifications" });
    }
  });

  /**
   * GET /api/hauler/career
   * Retrieve Pro career stats including certifications, level, XP
   */
  app.get("/api/hauler/career", requireAuth, requireHauler, async (req: Request, res: Response) => {
    try {
      const haulerId = (req.user as any).id;
      const stats = await storage.getHaulerCareerStats(haulerId);

      res.json(stats);
    } catch (error) {
      console.error("[Academy] Failed to fetch career stats:", error);
      res.status(500).json({ error: "Failed to retrieve career stats" });
    }
  });

  /**
   * GET /api/verify-badge/:badgeId
   * Public endpoint for customers to verify Pro badges
   * Badge ID format: PYCK-XXX (first 4 of hauler ID)
   */
  app.get("/api/verify-badge/:badgeId", async (req: Request, res: Response) => {
    try {
      const { badgeId } = req.params;

      // Badge format: PYCK-{first4OfHaulerId}
      // Example: PYCK-492a would match hauler ID starting with 492a
      const idPrefix = badgeId.replace(/^PYCK-/i, "").toLowerCase();

      if (idPrefix.length < 3) {
        return res.status(400).json({ error: "Invalid badge ID format" });
      }

      // Find hauler by ID prefix (simplified - in production, store badge IDs explicitly)
      // For now, we'll return a mock response since we need proper badge ID storage
      // TODO: Add proper badge ID generation and storage

      res.json({
        name: "John Doe",
        status: "Active",
        specialty: "BulkSnap™ (Junk Removal), FreshWash™ (Pressure Washing)",
        verified: true,
      });
    } catch (error) {
      console.error("[Academy] Badge verification failed:", error);
      res.status(404).json({ error: "Badge not found" });
    }
  });
}
