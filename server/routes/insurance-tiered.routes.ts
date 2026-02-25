/**
 * Insurance Tiered Requirement Routes
 *
 * Endpoints for the tiered insurance system:
 * - Status, requirement, alerts for pros
 * - Update/verify insurance
 * - Thimble referral link generation
 */

import type { Express, Request, Response } from "express";
import {
  getInsuranceRequirement,
  checkInsuranceStatus,
  updateInsurance,
  verifyInsurance,
  getInsuranceAlerts,
} from "../services/insurance-service";
import { generateThimbleLink } from "../services/thimble-integration";

export function registerInsuranceTieredRoutes(app: Express) {
  // GET /api/insurance/status -- pro's current insurance status + tier + requirement
  app.get("/api/insurance/tiered/status", async (req: Request, res: Response) => {
    if (!req.isAuthenticated?.() || !req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const userId = (req.user as any).userId || (req.user as any).id;

    try {
      const [requirement, status] = await Promise.all([
        getInsuranceRequirement(userId),
        checkInsuranceStatus(userId),
      ]);
      res.json({ requirement, status });
    } catch (error: any) {
      console.error("Error fetching insurance status:", error);
      res.status(500).json({ error: "Failed to fetch insurance status" });
    }
  });

  // GET /api/insurance/tiered/requirement -- what's required at current earnings level
  app.get("/api/insurance/tiered/requirement", async (req: Request, res: Response) => {
    if (!req.isAuthenticated?.() || !req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const userId = (req.user as any).userId || (req.user as any).id;

    try {
      const requirement = await getInsuranceRequirement(userId);
      res.json(requirement);
    } catch (error: any) {
      console.error("Error fetching insurance requirement:", error);
      res.status(500).json({ error: "Failed to fetch requirement" });
    }
  });

  // POST /api/insurance/tiered/update -- upload/update insurance info
  app.post("/api/insurance/tiered/update", async (req: Request, res: Response) => {
    if (!req.isAuthenticated?.() || !req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const userId = (req.user as any).userId || (req.user as any).id;
    const { provider, policyNumber, expirationDate, coverageAmount } = req.body;

    if (!provider || !policyNumber) {
      return res.status(400).json({ error: "Provider and policy number are required" });
    }

    try {
      const record = await updateInsurance(userId, {
        provider,
        policyNumber,
        expirationDate: expirationDate || "",
        coverageAmount: coverageAmount || 0,
      });
      res.json({ message: "Insurance updated successfully", record });
    } catch (error: any) {
      console.error("Error updating insurance:", error);
      res.status(500).json({ error: "Failed to update insurance" });
    }
  });

  // GET /api/insurance/tiered/alerts -- upcoming expirations, tier transitions
  app.get("/api/insurance/tiered/alerts", async (req: Request, res: Response) => {
    if (!req.isAuthenticated?.() || !req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const userId = (req.user as any).userId || (req.user as any).id;

    try {
      const alerts = await getInsuranceAlerts(userId);
      res.json({ alerts });
    } catch (error: any) {
      console.error("Error fetching insurance alerts:", error);
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  // GET /api/insurance/tiered/thimble-link -- generate Thimble referral link
  app.get("/api/insurance/tiered/thimble-link", async (req: Request, res: Response) => {
    if (!req.isAuthenticated?.() || !req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const userId = (req.user as any).userId || (req.user as any).id;
    const email = (req.user as any).email || "";
    const name = `${(req.user as any).firstName || ""} ${(req.user as any).lastName || ""}`.trim();

    try {
      const link = generateThimbleLink(userId, email, name, []);
      res.json({ link });
    } catch (error: any) {
      console.error("Error generating Thimble link:", error);
      res.status(500).json({ error: "Failed to generate link" });
    }
  });

  // POST /api/insurance/tiered/verify -- admin endpoint to verify insurance
  app.post("/api/insurance/tiered/verify", async (req: Request, res: Response) => {
    if (!req.isAuthenticated?.() || !req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    // Simple admin check
    const role = (req.user as any).role;
    if (role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { proId } = req.body;
    if (!proId) {
      return res.status(400).json({ error: "proId is required" });
    }

    try {
      const success = await verifyInsurance(proId);
      if (!success) {
        return res.status(404).json({ error: "No insurance record found for this pro" });
      }
      res.json({ message: "Insurance verified successfully" });
    } catch (error: any) {
      console.error("Error verifying insurance:", error);
      res.status(500).json({ error: "Failed to verify insurance" });
    }
  });
}
