/**
 * Property Intelligence Routes - PUBLIC (no auth required)
 * Instant AI-generated home maintenance reports from an address
 */
import type { Express, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { getPropertyDataAsync, formatPropertySummary } from "../services/ai/property-scan-service";
import { generateHomeIntelligenceReport } from "../services/home-intelligence";

const scanLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many requests. Please try again in a minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

export function registerPropertyIntelligenceRoutes(app: Express) {
  app.post("/api/property-intelligence/scan", scanLimiter, async (req: Request, res: Response) => {
    try {
      const { address } = req.body;
      if (!address || typeof address !== "string" || address.trim().length < 5) {
        return res.status(400).json({ error: "Please provide a valid address." });
      }

      const property = await getPropertyDataAsync(address.trim());
      const report = await generateHomeIntelligenceReport(property);

      res.json({ property, report });
    } catch (err: any) {
      console.error("[PropertyIntelligence] scan error:", err.message);
      res.status(500).json({ error: "Failed to generate report. Please try again." });
    }
  });
}
