import type { Express, Request, Response, NextFunction } from "express";
import { db } from "../../db";
import { whiteLabelConfigs } from "@shared/schema";
import { eq } from "drizzle-orm";

export function whiteLabelMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hostname = req.hostname;
      // Skip for localhost / default domains
      if (hostname === "localhost" || hostname.endsWith(".replit.dev") || hostname.endsWith(".uptend.com")) {
        return next();
      }

      const [config] = await db.select().from(whiteLabelConfigs)
        .where(eq(whiteLabelConfigs.customDomain, hostname));

      if (config && config.isActive) {
        (req as any).whiteLabel = {
          companyName: config.companyName,
          logoUrl: config.logoUrl,
          primaryColor: config.primaryColor,
          secondaryColor: config.secondaryColor,
          faviconUrl: config.faviconUrl,
          supportEmail: config.supportEmail,
          supportPhone: config.supportPhone,
          customCss: config.customCss,
        };
      }
    } catch (err) {
      // Non-fatal - proceed without branding
      console.error("White-label middleware error:", err);
    }
    next();
  };
}

export function registerWhiteLabelRoutes(app: Express) {
  // GET /api/white-label/config/:clientId - returns white label config
  app.get("/api/white-label/config/:clientId", async (req: Request, res: Response) => {
    try {
      const { clientId } = req.params;
      const [config] = await db.select().from(whiteLabelConfigs)
        .where(eq(whiteLabelConfigs.clientId, clientId));

      if (!config) {
        return res.status(404).json({ error: "White-label config not found" });
      }

      res.json(config);
    } catch (error) {
      console.error("Error fetching white-label config:", error);
      res.status(500).json({ error: "Failed to fetch white-label config" });
    }
  });

  // GET /api/white-label/branding - returns current request's branding (from middleware)
  app.get("/api/white-label/branding", (req: Request, res: Response) => {
    const branding = (req as any).whiteLabel || null;
    res.json({ branding });
  });
}
