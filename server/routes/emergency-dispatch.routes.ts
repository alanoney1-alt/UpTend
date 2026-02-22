/**
 * Emergency Dispatch Routes
 */

import type { Express } from "express";
import { requireAuth, requireAdmin } from "../auth-middleware";
import {
  createEmergencyDispatch,
  updateDispatchStatus,
  getActiveEmergencies,
  activateDisasterMode,
} from "../services/emergency-dispatch";

export function registerEmergencyDispatchRoutes(app: Express) {
  // Create emergency dispatch
  app.post("/api/emergency/dispatch", requireAuth, async (req, res) => {
    try {
      const customerId = (req as any).user?.userId || (req as any).user?.id || req.body.customerId;
      if (!customerId) return res.status(400).json({ error: "customerId required" });
      const { emergencyType, severity, description } = req.body;
      if (!emergencyType) return res.status(400).json({ error: "emergencyType required" });
      const result = await createEmergencyDispatch(
        customerId, emergencyType, severity || "standard", description || ""
      );
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get active emergencies
  app.get("/api/emergency/active", requireAuth, async (req, res) => {
    try {
      const customerId = (req as any).user?.userId || (req as any).user?.id || (req.query.customerId as string);
      if (!customerId) return res.status(400).json({ error: "customerId required" });
      const emergencies = await getActiveEmergencies(customerId);
      res.json(emergencies);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update dispatch status
  app.put("/api/emergency/:id/status", requireAuth, async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) return res.status(400).json({ error: "status required" });
      const dispatch = await updateDispatchStatus(req.params.id, status);
      res.json(dispatch);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Activate disaster mode (admin only)
  app.post("/api/emergency/disaster-mode", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { region, stormName } = req.body;
      if (!region || !stormName) return res.status(400).json({ error: "region and stormName required" });
      const result = await activateDisasterMode(region, stormName);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
