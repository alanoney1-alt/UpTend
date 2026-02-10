/**
 * AI Seasonal Home Advisor API Routes
 *
 * Endpoints:
 * - GET /api/ai/seasonal/advisories - Get seasonal advisories for user's location
 * - GET /api/ai/seasonal/advisories/:zipCode - Get advisories by zip code
 * - POST /api/ai/seasonal/advisories/:id/dismiss - Dismiss an advisory
 * - POST /api/ai/seasonal/advisories/:id/book - Book service from advisory
 */

import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../auth-middleware";
import type { DatabaseStorage } from "../../storage/impl/database-storage";
import { nanoid } from "nanoid";

export function createSeasonalAdvisorRoutes(storage: DatabaseStorage) {
  const router = Router();

  // ==========================================
  // GET /api/ai/seasonal/advisories
  // Get seasonal advisories for user
  // ==========================================
  router.get("/seasonal/advisories", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;

      // Get user to find their zip code
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get active advisories for user's zip code
      const zipCode = user.zipCode || "00000"; // Default if no zip
      const advisories = await storage.getActiveAdvisoriesByZip(zipCode);

      // Also get user-specific advisories
      const userAdvisories = await storage.getSeasonalAdvisoriesByUser(userId);

      res.json({
        success: true,
        advisories: [...advisories, ...userAdvisories].map((advisory) => ({
          ...advisory,
          recommendedServices: advisory.recommendedServices
            ? JSON.parse(advisory.recommendedServices)
            : null,
          weatherData: advisory.weatherData ? JSON.parse(advisory.weatherData) : null,
        })),
      });
    } catch (error: any) {
      console.error("Error fetching seasonal advisories:", error);
      res.status(500).json({
        error: error.message || "Failed to fetch seasonal advisories",
      });
    }
  });

  // ==========================================
  // GET /api/ai/seasonal/advisories/:zipCode
  // Get advisories by zip code (public endpoint for marketing)
  // ==========================================
  router.get("/seasonal/advisories/:zipCode", async (req, res) => {
    try {
      const { zipCode } = req.params;

      if (!/^\d{5}$/.test(zipCode)) {
        return res.status(400).json({ error: "Invalid zip code format" });
      }

      const advisories = await storage.getActiveAdvisoriesByZip(zipCode);

      res.json({
        success: true,
        zipCode,
        advisories: advisories.map((advisory) => ({
          ...advisory,
          recommendedServices: advisory.recommendedServices
            ? JSON.parse(advisory.recommendedServices)
            : null,
          weatherData: advisory.weatherData ? JSON.parse(advisory.weatherData) : null,
        })),
      });
    } catch (error: any) {
      console.error("Error fetching seasonal advisories:", error);
      res.status(500).json({
        error: error.message || "Failed to fetch seasonal advisories",
      });
    }
  });

  // ==========================================
  // POST /api/ai/seasonal/generate
  // Admin: Generate seasonal advisories for a zip code
  // ==========================================
  const generateSchema = z.object({
    zipCode: z.string().regex(/^\d{5}$/),
    season: z.enum(["spring", "summer", "fall", "winter"]),
    force: z.boolean().default(false),
  });

  router.post("/seasonal/generate", requireAuth, async (req, res) => {
    try {
      // Admin only
      if (req.user!.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const validated = generateSchema.parse(req.body);

      // TODO: Call AI service to generate seasonal advisories based on:
      // - Weather data for the zip code
      // - Season-specific home maintenance needs
      // - Local climate patterns

      // Mock advisories for now
      const mockAdvisories = [
        {
          id: nanoid(),
          userId: null,
          zipCode: validated.zipCode,
          season: validated.season,
          advisoryType: "preventive_maintenance",
          title: "Gutter Cleaning Recommended",
          description: "Fall leaves can clog gutters and cause water damage. Book now before winter.",
          recommendedServices: JSON.stringify(["gutter_cleaning", "pressure_washing"]),
          priority: "high",
          weatherData: JSON.stringify({ avgTemp: 55, rainfall: "high" }),
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
        },
        {
          id: nanoid(),
          userId: null,
          zipCode: validated.zipCode,
          season: validated.season,
          advisoryType: "seasonal_tip",
          title: "Prepare Your Pool for Winter",
          description: "Winterize your pool to prevent freeze damage and equipment issues.",
          recommendedServices: JSON.stringify(["pool_cleaning", "pool_maintenance"]),
          priority: "medium",
          weatherData: JSON.stringify({ avgTemp: 55, firstFrost: "Nov 15" }),
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      const created = await Promise.all(
        mockAdvisories.map((advisory) => storage.createSeasonalAdvisory(advisory))
      );

      res.json({
        success: true,
        message: `Generated ${created.length} seasonal advisories for ${validated.zipCode}`,
        advisories: created,
      });
    } catch (error: any) {
      console.error("Error generating seasonal advisories:", error);
      res.status(400).json({
        error: error.message || "Failed to generate seasonal advisories",
      });
    }
  });

  return router;
}

export default createSeasonalAdvisorRoutes;
