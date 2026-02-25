/**
 * Gusto Payroll Integration Routes (Business Partner)
 */
import type { Express, Request, Response } from "express";
import * as gusto from "../../services/gusto-integration";

function getBusinessId(req: Request): string | null {
  if (!req.isAuthenticated?.() || !req.user) return null;
  return (req.user as any).userId || (req.user as any).id || null;
}

export function registerGustoRoutes(app: Express) {
  app.get("/api/integrations/gusto/auth", (req: Request, res: Response) => {
    const businessId = getBusinessId(req) || (req.query.businessId as string);
    if (!businessId) return res.status(401).json({ error: "Authentication required" });
    res.json({ authUrl: gusto.getAuthUrl(businessId) });
  });

  app.get("/api/integrations/gusto/callback", async (req: Request, res: Response) => {
    try {
      const { code, state } = req.query;
      const businessId = (state as string) || getBusinessId(req);
      if (!businessId || !code) return res.status(400).json({ error: "Missing code or business ID" });

      await gusto.handleCallback(code as string, businessId);
      res.redirect("/business/partner-dashboard?tab=integrations&gusto=connected");
    } catch (error: any) {
      console.error("Gusto callback error:", error);
      res.redirect("/business/partner-dashboard?tab=integrations&gusto=error");
    }
  });

  app.get("/api/integrations/gusto/status", (req: Request, res: Response) => {
    const businessId = getBusinessId(req) || (req.query.businessId as string);
    if (!businessId) return res.status(401).json({ error: "Authentication required" });
    res.json(gusto.getStatus(businessId));
  });

  app.post("/api/integrations/gusto/sync-hours", async (req: Request, res: Response) => {
    try {
      const businessId = getBusinessId(req);
      if (!businessId) return res.status(401).json({ error: "Authentication required" });

      const status = gusto.getStatus(businessId);
      if (!status.connected) return res.status(400).json({ error: "Not connected to Gusto" });

      const { proId, proEmail, periodStart, periodEnd, totalHours } = req.body;
      if (!proEmail || !periodStart || !periodEnd) {
        return res.status(400).json({ error: "proEmail, periodStart, and periodEnd are required" });
      }

      const result = await gusto.syncEmployeeHours(
        businessId, proId || "unknown", proEmail, periodStart, periodEnd, totalHours || 0
      );
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/integrations/gusto/disconnect", async (req: Request, res: Response) => {
    try {
      const businessId = getBusinessId(req);
      if (!businessId) return res.status(401).json({ error: "Authentication required" });

      await gusto.disconnect(businessId);
      res.json({ success: true, message: "Gusto disconnected" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
