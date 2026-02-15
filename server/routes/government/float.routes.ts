import type { Express } from "express";
import { requireAuth } from "../../auth-middleware";
import * as govPayments from "../../services/government-payments";

export function registerGovernmentFloatRoutes(app: Express) {
  // Current float exposure snapshot
  app.get("/api/government/float/exposure", requireAuth, async (req, res) => {
    try {
      const exposure = await govPayments.getFloatExposure();
      res.json(exposure);
    } catch (error) {
      console.error("Error fetching float exposure:", error);
      res.status(500).json({ error: "Failed to fetch float exposure" });
    }
  });

  // Float ledger with pagination
  app.get("/api/government/float/ledger", requireAuth, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const result = await govPayments.getFloatLedger(page, limit);
      res.json(result);
    } catch (error) {
      console.error("Error fetching float ledger:", error);
      res.status(500).json({ error: "Failed to fetch float ledger" });
    }
  });

  // Cash flow forecast
  app.get("/api/government/float/forecast", requireAuth, async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const forecast = await govPayments.getFloatForecast(days);
      res.json(forecast);
    } catch (error) {
      console.error("Error fetching float forecast:", error);
      res.status(500).json({ error: "Failed to fetch float forecast" });
    }
  });

  // Record incoming government payment
  app.post("/api/government/float/payment-received", requireAuth, async (req, res) => {
    try {
      const { contractId, invoiceId, amount, checkOrEftNumber } = req.body;
      if (!contractId || !invoiceId || !amount || !checkOrEftNumber) {
        return res.status(400).json({ error: "Missing required fields: contractId, invoiceId, amount, checkOrEftNumber" });
      }
      await govPayments.recordGovernmentPayment(contractId, invoiceId, amount, checkOrEftNumber);
      res.json({ success: true });
    } catch (error) {
      console.error("Error recording government payment:", error);
      res.status(500).json({ error: "Failed to record government payment" });
    }
  });

  // Float settings
  app.get("/api/government/float/settings", requireAuth, async (req, res) => {
    try {
      const settings = await govPayments.getFloatSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching float settings:", error);
      res.status(500).json({ error: "Failed to fetch float settings" });
    }
  });

  app.put("/api/government/float/settings", requireAuth, async (req, res) => {
    try {
      const updated = await govPayments.updateFloatSettings(req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating float settings:", error);
      res.status(500).json({ error: "Failed to update float settings" });
    }
  });

  // Active alerts
  app.get("/api/government/float/alerts", requireAuth, async (req, res) => {
    try {
      const alerts = await govPayments.getFloatAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching float alerts:", error);
      res.status(500).json({ error: "Failed to fetch float alerts" });
    }
  });
}
