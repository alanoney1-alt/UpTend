/**
 * QuickBooks Online Integration Routes (Business Partner)
 * 
 * OAuth flow, sync, disconnect for business partner accounting.
 */
import type { Express, Request, Response } from "express";
import * as qb from "../../services/quickbooks-integration";

function getBusinessId(req: Request): string | null {
  if (!req.isAuthenticated?.() || !req.user) return null;
  return (req.user as any).userId || (req.user as any).id || null;
}

export function registerQuickBooksRoutes(app: Express) {
  // Start OAuth flow
  app.get("/api/integrations/quickbooks/auth", (req: Request, res: Response) => {
    const businessId = getBusinessId(req) || (req.query.businessId as string);
    if (!businessId) return res.status(401).json({ error: "Authentication required" });

    const authUrl = qb.getAuthUrl(businessId);
    res.json({ authUrl });
  });

  // OAuth callback
  app.get("/api/integrations/quickbooks/callback", async (req: Request, res: Response) => {
    try {
      const { code, realmId, state } = req.query;
      const businessId = (state as string) || getBusinessId(req);
      if (!businessId || !code) {
        return res.status(400).json({ error: "Missing code or business ID" });
      }

      await qb.handleCallback(code as string, (realmId as string) || "", businessId);
      // Redirect to integrations page on success
      res.redirect("/business/partner-dashboard?tab=integrations&qb=connected");
    } catch (error: any) {
      console.error("QuickBooks callback error:", error);
      res.redirect("/business/partner-dashboard?tab=integrations&qb=error");
    }
  });

  // Connection status
  app.get("/api/integrations/quickbooks/status", (req: Request, res: Response) => {
    const businessId = getBusinessId(req) || (req.query.businessId as string);
    if (!businessId) return res.status(401).json({ error: "Authentication required" });

    res.json(qb.getStatus(businessId));
  });

  // Manual sync trigger
  app.post("/api/integrations/quickbooks/sync", async (req: Request, res: Response) => {
    try {
      const businessId = getBusinessId(req);
      if (!businessId) return res.status(401).json({ error: "Authentication required" });

      const status = qb.getStatus(businessId);
      if (!status.connected) {
        return res.status(400).json({ error: "Not connected to QuickBooks" });
      }

      // Sync a sample completed job (in production, this would pull from DB)
      const result = await qb.syncCompletedJob(businessId, {
        jobId: `manual-sync-${Date.now()}`,
        serviceType: "Manual Sync",
        customerFirstName: "Demo",
        finalPrice: 0,
        platformFee: 0,
        completedAt: new Date().toISOString(),
      });

      res.json({ success: true, message: "Sync triggered", result });
    } catch (error: any) {
      console.error("QuickBooks sync error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Disconnect
  app.post("/api/integrations/quickbooks/disconnect", async (req: Request, res: Response) => {
    try {
      const businessId = getBusinessId(req);
      if (!businessId) return res.status(401).json({ error: "Authentication required" });

      await qb.disconnect(businessId);
      res.json({ success: true, message: "QuickBooks disconnected" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Sync history
  app.get("/api/integrations/quickbooks/sync-history", (req: Request, res: Response) => {
    const businessId = getBusinessId(req) || (req.query.businessId as string);
    if (!businessId) return res.status(401).json({ error: "Authentication required" });

    const limit = parseInt(req.query.limit as string) || 50;
    res.json({ history: qb.getSyncHistory(businessId, limit) });
  });
}
