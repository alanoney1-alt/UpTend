/**
 * Pro Pricing Dashboard — Backend Routes
 * 
 * Allows pros to set custom rates per service type within platform min/max ranges.
 * If no custom rate is set, platform default pricing applies.
 */

import type { Express, Request, Response } from "express";
import { db } from "../db";
import { haulerProfiles } from "../../shared/schema";
import { eq, and, sql } from "drizzle-orm";

// ── Platform Rate Ranges per Service ──
// These are the recommended defaults and allowed ranges (in dollars)
// Research-verified Orlando metro price ranges (2025)
// Sources: Angi, Homeyou, HomeGuide, Homeblue, ProMatcher, MoveBuddha, YourGreenPal
export const PLATFORM_SERVICE_RATES: Record<string, {
  displayName: string;
  recommendedRate: number;
  minRate: number;
  maxRate: number;
  unit: string;
  description: string;
}> = {
  junk_removal: { displayName: "Junk Removal", recommendedRate: 279, minRate: 99, maxRate: 599, unit: "per job", description: "Volume-based pricing by truck load" },
  pressure_washing: { displayName: "Pressure Washing", recommendedRate: 199, minRate: 120, maxRate: 450, unit: "per job", description: "Surface cleaning for driveways and walkways" },
  gutter_cleaning: { displayName: "Gutter Cleaning", recommendedRate: 179, minRate: 119, maxRate: 399, unit: "per job", description: "Complete debris removal from gutters and downspouts" },
  moving_labor: { displayName: "Moving Labor", recommendedRate: 55, minRate: 35, maxRate: 85, unit: "per mover/hr", description: "Loading, unloading, rearranging" },
  light_demolition: { displayName: "Light Demolition", recommendedRate: 350, minRate: 199, maxRate: 799, unit: "per job", description: "Sheds, decks, interior tear-outs" },
  home_cleaning: { displayName: "Home Cleaning", recommendedRate: 165, minRate: 99, maxRate: 349, unit: "per job", description: "Professional home cleaning" },
  carpet_cleaning: { displayName: "Carpet Cleaning", recommendedRate: 55, minRate: 35, maxRate: 99, unit: "per room", description: "Professional carpet deep cleaning" },
  landscaping: { displayName: "Landscaping", recommendedRate: 99, minRate: 45, maxRate: 249, unit: "per visit", description: "Lawn care and maintenance" },
  pool_cleaning: { displayName: "Pool Cleaning", recommendedRate: 165, minRate: 85, maxRate: 275, unit: "per month", description: "Weekly pool maintenance" },
  handyman: { displayName: "Handyman Services", recommendedRate: 75, minRate: 50, maxRate: 125, unit: "per hour", description: "General repairs and installations" },
  garage_cleanout: { displayName: "Garage Cleanout", recommendedRate: 349, minRate: 199, maxRate: 799, unit: "per job", description: "Full sort, organize, and haul-away" },
  home_scan: { displayName: "Home DNA Scan", recommendedRate: 0, minRate: 0, maxRate: 0, unit: "flat", description: "Fixed pricing -- not pro-set" },
};

// In-memory store for pro rates (would be a DB table in production)
// Key: `${proId}:${serviceType}`
const proRatesStore: Map<string, { baseRate: number; updatedAt: string }> = new Map();

export function getProRate(proId: string, serviceType: string): number | null {
  const key = `${proId}:${serviceType}`;
  const stored = proRatesStore.get(key);
  return stored ? stored.baseRate : null;
}

export function getEffectiveRate(proId: string, serviceType: string): number {
  const customRate = getProRate(proId, serviceType);
  if (customRate !== null) return customRate;
  const platformRate = PLATFORM_SERVICE_RATES[serviceType];
  return platformRate ? platformRate.recommendedRate : 150;
}

export function registerProPricingRoutes(app: Express) {
  // GET /api/haulers/my-rates — get pro's current rates
  app.get("/api/haulers/my-rates", async (req: Request, res: Response) => {
    if (!req.isAuthenticated?.() || !req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userId = (req.user as any).userId || (req.user as any).id;

    try {
      // Get pro's supported services
      const [profile] = await db
        .select({
          id: haulerProfiles.id,
          serviceTypes: haulerProfiles.serviceTypes,
          supportedServices: haulerProfiles.supportedServices,
        })
        .from(haulerProfiles)
        .where(eq(haulerProfiles.userId, userId))
        .limit(1);

      if (!profile) {
        return res.status(404).json({ error: "Pro profile not found" });
      }

      const services = (profile.supportedServices as string[]) || (profile.serviceTypes as string[]) || ["junk_removal"];

      const rates = services.map((serviceType: string) => {
        const platform = PLATFORM_SERVICE_RATES[serviceType];
        if (!platform) return null;

        const customRate = getProRate(userId, serviceType);
        const effectiveRate = customRate !== null ? customRate : platform.recommendedRate;
        const proPayout = Math.max(50, Math.round(effectiveRate * 0.85 * 100) / 100);

        return {
          serviceType,
          displayName: platform.displayName,
          description: platform.description,
          unit: platform.unit,
          recommendedRate: platform.recommendedRate,
          minRate: platform.minRate,
          maxRate: platform.maxRate,
          currentRate: effectiveRate,
          isCustom: customRate !== null,
          proPayout,
          proPayoutPercent: 85,
        };
      }).filter(Boolean);

      res.json({ rates });
    } catch (error: any) {
      console.error("Error fetching pro rates:", error);
      res.status(500).json({ error: "Failed to fetch rates" });
    }
  });

  // POST /api/haulers/my-rates — set/update rates
  app.post("/api/haulers/my-rates", async (req: Request, res: Response) => {
    if (!req.isAuthenticated?.() || !req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userId = (req.user as any).userId || (req.user as any).id;
    const { rates } = req.body;

    if (!Array.isArray(rates)) {
      return res.status(400).json({ error: "rates must be an array of { serviceType, baseRate }" });
    }

    try {
      const updated: any[] = [];
      const errors: string[] = [];

      for (const { serviceType, baseRate } of rates) {
        const platform = PLATFORM_SERVICE_RATES[serviceType];
        if (!platform) {
          errors.push(`Unknown service type: ${serviceType}`);
          continue;
        }

        if (typeof baseRate !== "number" || baseRate < platform.minRate || baseRate > platform.maxRate) {
          errors.push(`Rate for ${serviceType} must be between $${platform.minRate} and $${platform.maxRate}`);
          continue;
        }

        const key = `${userId}:${serviceType}`;
        proRatesStore.set(key, { baseRate, updatedAt: new Date().toISOString() });

        const proPayout = Math.max(50, Math.round(baseRate * 0.85 * 100) / 100);
        updated.push({
          serviceType,
          baseRate,
          proPayout,
        });
      }

      res.json({ updated, errors: errors.length > 0 ? errors : undefined });
    } catch (error: any) {
      console.error("Error updating pro rates:", error);
      res.status(500).json({ error: "Failed to update rates" });
    }
  });
}
