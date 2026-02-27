/**
 * Centralized Pricing API Routes
 *
 * GET  /api/pricing              - full price menu
 * GET  /api/pricing/quote        - get a quote (simple GET lookup)
 * GET  /api/pricing/:serviceType - specific service pricing
 * POST /api/pricing/quote        - get a quote with options
 * POST /api/pricing/bundle       - calculate bundle discount
 */

import type { Express, Request, Response } from "express";
import {
  getAllPricing,
  getServicePricing,
  getQuote,
  getBundleDiscount,
  getGuaranteedCeiling,
} from "../services/pricing-engine.js";

export function registerCentralizedPricingRoutes(app: Express) {
  // Service catalog alias - /api/pricing/services returns same as /api/pricing
  app.get("/api/pricing/services", async (_req: Request, res: Response) => {
    try {
      const menu = await getAllPricing();
      res.json({ success: true, pricing: menu });
    } catch (err: any) {
      console.error("GET /api/pricing/services error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Full price menu
  app.get("/api/pricing", async (_req: Request, res: Response) => {
    try {
      const menu = await getAllPricing();
      res.json({ success: true, pricing: menu });
    } catch (err: any) {
      console.error("GET /api/pricing error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get a quote with options (GET for simple lookups - must be before /:serviceType)
  app.get("/api/pricing/quote", async (req: Request, res: Response) => {
    try {
      const serviceType = (req.query.service || req.query.serviceType) as string;
      if (!serviceType) {
        return res.status(400).json({ success: false, error: "service or serviceType query param required" });
      }
      const options: any = {};
      if (req.query.size) options.size = req.query.size;
      if (req.query.scope) options.scope = req.query.scope;
      const quote = await getQuote(serviceType, options);
      res.json({ success: true, serviceType, quote });
    } catch (err: any) {
      // If exact match fails, try fuzzy match against all pricing
      try {
        const serviceType = (req.query.service || req.query.serviceType) as string;
        const allPricing = await getAllPricing();
        const keys = Object.keys(allPricing);
        // Normalize: lowercase, replace spaces/hyphens with underscores for comparison
        const normalize = (s: string) => s.toLowerCase().replace(/[\s\-]+/g, '_');
        const sn = normalize(serviceType);
        const match = keys.find(k => {
          const kn = normalize(k);
          return kn === sn || kn.includes(sn) || sn.includes(kn);
        });
        if (match) {
          const quote = await getQuote(match, {});
          return res.json({ success: true, serviceType: match, quote });
        }
      } catch {}
      res.status(404).json({ success: false, error: "Service not found" });
    }
  });

  // Specific service pricing (after /quote to avoid matching "quote" as :serviceType)
  app.get("/api/pricing/:serviceType", async (req: Request, res: Response) => {
    try {
      const tiers = await getServicePricing(req.params.serviceType);
      if (tiers.length === 0) {
        return res.status(404).json({ success: false, error: "Service not found" });
      }
      res.json({ success: true, serviceType: req.params.serviceType, tiers });
    } catch (err: any) {
      console.error("GET /api/pricing/:serviceType error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST quote with full options
  app.post("/api/pricing/quote", async (req: Request, res: Response) => {
    try {
      const { serviceType, ...options } = req.body;
      if (!serviceType) {
        return res.status(400).json({ success: false, error: "serviceType required" });
      }
      const quote = await getQuote(serviceType, options);
      res.json({ success: true, serviceType, quote });
    } catch (err: any) {
      console.error("POST /api/pricing/quote error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Calculate bundle discount
  app.post("/api/pricing/bundle", async (req: Request, res: Response) => {
    try {
      const { serviceTypes } = req.body;
      if (!serviceTypes || !Array.isArray(serviceTypes) || serviceTypes.length < 2) {
        return res.status(400).json({ success: false, error: "serviceTypes array with 2+ services required" });
      }
      const bundle = await getBundleDiscount(serviceTypes);
      res.json({ success: true, bundle });
    } catch (err: any) {
      console.error("POST /api/pricing/bundle error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get guaranteed ceiling
  app.post("/api/pricing/ceiling", async (req: Request, res: Response) => {
    try {
      const { serviceType, ...options } = req.body;
      if (!serviceType) {
        return res.status(400).json({ success: false, error: "serviceType required" });
      }
      const ceiling = await getGuaranteedCeiling(serviceType, options);
      res.json({ success: true, ...ceiling });
    } catch (err: any) {
      console.error("POST /api/pricing/ceiling error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
}
