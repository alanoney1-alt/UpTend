import type { Express, Request, Response } from "express";
import { requireAuth, requireHauler } from "../../auth-middleware";

export function registerEarningsPotentialRoutes(app: Express) {
  /**
   * GET /api/academy/earnings-potential
   * Returns estimated earnings by tier for the authenticated pro
   */
  app.get("/api/academy/earnings-potential", requireAuth, requireHauler, async (req: Request, res: Response) => {
    try {
      // Hardcoded estimates for now — can be refined with real area/service data later
      const earningsPotential = {
        tiers: {
          starter: {
            label: "Starter",
            monthlyEarnings: 2800,
            description: "Consumer jobs, standard rates",
            certificationsNeeded: [],
          },
          b2bCertified: {
            label: "B2B Certified",
            monthlyEarnings: 4500,
            description: "Property management + HOA contracts, recurring jobs",
            certificationsNeeded: ["b2b-property-management", "b2b-hoa"],
          },
          eliteCertified: {
            label: "Elite Certified",
            monthlyEarnings: 6200,
            description: "Government contracts, emergency dispatch, top-tier rates",
            certificationsNeeded: [
              "b2b-property-management",
              "b2b-hoa",
              "emergency-response",
              "government-contract",
            ],
          },
        },
        premiumJobsAvailable: 12, // Placeholder estimate
      };

      res.json(earningsPotential);
    } catch (error: any) {
      console.error("Error fetching earnings potential:", error);
      res.status(500).json({ error: "Failed to fetch earnings potential" });
    }
  });
}
