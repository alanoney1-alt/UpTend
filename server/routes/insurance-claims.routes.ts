/**
 * Insurance Claims Routes
 */

import type { Express } from "express";
import { requireAuth, optionalAuth } from "../auth-middleware";
import {
  startClaim,
  addClaimPhoto,
  generateClaimPackage,
  getClaimStatus,
  getStormPrepChecklist,
} from "../services/insurance-claims";

export function registerInsuranceClaimsRoutes(app: Express) {
  // Start a new claim
  app.post("/api/insurance/claim", requireAuth, async (req, res) => {
    try {
      const { claimType, description } = req.body;
      const customerId = (req as any).user?.id;
      if (!customerId || !claimType) {
        return res.status(400).json({ error: "customerId and claimType required" });
      }
      const result = await startClaim(customerId, claimType, description || "");
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Add photo to claim
  app.post("/api/insurance/claim/:id/photo", requireAuth, async (req, res) => {
    try {
      const { photoUrl, description } = req.body;
      if (!photoUrl) return res.status(400).json({ error: "photoUrl required" });
      const result = await addClaimPhoto(req.params.id, photoUrl, description || "");
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get claim status
  app.get("/api/insurance/claim/:id", requireAuth, async (req, res) => {
    try {
      const claim = await getClaimStatus(req.params.id);
      res.json(claim);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  });

  // Generate claim package
  app.get("/api/insurance/claim/:id/package", requireAuth, async (req, res) => {
    try {
      const pkg = await generateClaimPackage(req.params.id);
      res.json(pkg);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  });

  // Storm prep checklist
  app.get("/api/insurance/storm-prep", optionalAuth, async (req, res) => {
    try {
      const customerId = (req as any).user?.id;
      const stormType = req.query.stormType as string;
      if (!stormType) return res.status(400).json({ error: "stormType query param required" });
      const checklist = await getStormPrepChecklist(customerId, stormType);
      res.json(checklist);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
