/**
 * Jobber Integration Routes (Business Partner - job sync)
 * Separate from the CRM Jobber integration.
 */
import type { Express, Request, Response } from "express";
import * as jobber from "../../services/jobber-bp-integration";

function getBusinessId(req: Request): string | null {
  if (!req.isAuthenticated?.() || !req.user) return null;
  return (req.user as any).userId || (req.user as any).id || null;
}

export function registerJobberBpRoutes(app: Express) {
  app.get("/api/integrations/jobber-bp/auth", (req: Request, res: Response) => {
    const businessId = getBusinessId(req) || (req.query.businessId as string);
    if (!businessId) return res.status(401).json({ error: "Authentication required" });
    res.json({ authUrl: jobber.getAuthUrl(businessId) });
  });

  app.get("/api/integrations/jobber-bp/callback", async (req: Request, res: Response) => {
    try {
      const { code, state } = req.query;
      const businessId = (state as string) || getBusinessId(req);
      if (!businessId || !code) return res.status(400).json({ error: "Missing code or business ID" });

      await jobber.handleCallback(code as string, businessId);
      res.redirect("/business/partner-dashboard?tab=integrations&jobber=connected");
    } catch (error: any) {
      console.error("Jobber callback error:", error);
      res.redirect("/business/partner-dashboard?tab=integrations&jobber=error");
    }
  });

  app.get("/api/integrations/jobber-bp/status", (req: Request, res: Response) => {
    const businessId = getBusinessId(req) || (req.query.businessId as string);
    if (!businessId) return res.status(401).json({ error: "Authentication required" });
    res.json(jobber.getStatus(businessId));
  });

  app.post("/api/integrations/jobber-bp/sync", async (req: Request, res: Response) => {
    try {
      const businessId = getBusinessId(req);
      if (!businessId) return res.status(401).json({ error: "Authentication required" });

      const status = jobber.getStatus(businessId);
      if (!status.connected) return res.status(400).json({ error: "Not connected to Jobber" });

      const result = await jobber.syncCompletedJob(businessId, {
        jobId: `manual-sync-${Date.now()}`,
        serviceType: "Manual Sync",
        customerFirstName: "Demo",
        finalPrice: 0,
        completedAt: new Date().toISOString(),
      });
      res.json({ success: true, result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/integrations/jobber-bp/disconnect", async (req: Request, res: Response) => {
    try {
      const businessId = getBusinessId(req);
      if (!businessId) return res.status(401).json({ error: "Authentication required" });

      await jobber.disconnect(businessId);
      res.json({ success: true, message: "Jobber disconnected" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
