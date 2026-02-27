/**
 * Integration Routes - Central registration for all third-party integrations
 * 
 * CRM: Salesforce, HubSpot, Zoho, Monday.com, ServiceTitan, Jobber, Housecall Pro, GovWin
 * Property Management: AppFolio, Buildium, Yardi, Rent Manager, RealPage
 * HOA Management: CINC Systems, TownSq, Vantaca
 * Government: SAM.gov, USASpending.gov, FEMA
 */
import type { Express } from "express";
import { db } from "../../db";
import { integrationConnections, integrationSyncLogs } from "@shared/schema";
import { eq } from "drizzle-orm";
import { syncAll } from "../../services/integration-sync";

// CRM Integrations
import { registerSalesforceRoutes } from "./salesforce";
import { registerHubspotRoutes } from "./hubspot";
import { registerZohoRoutes } from "./zoho";
import { registerMondayRoutes } from "./monday";
import { registerServiceTitanRoutes } from "./servicetitan";
import { registerJobberRoutes } from "./jobber";
import { registerHousecallProRoutes } from "./housecallpro";
import { registerGovwinRoutes } from "./govwin";

// Property Management
import { registerAppfolioRoutes } from "./appfolio";
import { registerBuildiumRoutes } from "./buildium";
import { registerYardiRoutes } from "./yardi";
import { registerRentManagerRoutes } from "./rentmanager";
import { registerRealPageRoutes } from "./realpage";

// HOA Management
import { registerCincRoutes } from "./cinc";
import { registerTownSqRoutes } from "./townsq";
import { registerVantacaRoutes } from "./vantaca";

// Government
import { registerSamGovRoutes } from "./sam-gov";
import { registerUsaSpendingRoutes } from "./usaspending";
import { registerFemaRoutes } from "./fema";

// Business Partner Accounting/Payroll Integrations
import { registerQuickBooksRoutes } from "./quickbooks.routes";
import { registerGustoRoutes } from "./gusto.routes";
import { registerJobberBpRoutes } from "./jobber-bp.routes";

export function registerIntegrationRoutes(app: Express) {
  // Register CRM routes
  registerSalesforceRoutes(app);
  registerHubspotRoutes(app);
  registerZohoRoutes(app);
  registerMondayRoutes(app);
  registerServiceTitanRoutes(app);
  registerJobberRoutes(app);
  registerHousecallProRoutes(app);
  registerGovwinRoutes(app);

  // Register PM/HOA/Gov routes
  registerAppfolioRoutes(app);
  registerBuildiumRoutes(app);
  registerYardiRoutes(app);
  registerRentManagerRoutes(app);
  registerRealPageRoutes(app);
  registerCincRoutes(app);
  registerTownSqRoutes(app);
  registerVantacaRoutes(app);
  registerSamGovRoutes(app);
  registerUsaSpendingRoutes(app);
  registerFemaRoutes(app);

  // Business Partner Accounting/Payroll
  registerQuickBooksRoutes(app);
  registerGustoRoutes(app);
  registerJobberBpRoutes(app);

  // ===== Unified endpoints =====

  // GET /api/integrations/status - All integrations status for a business account
  app.get("/api/integrations/status", async (req, res) => {
    try {
      const businessAccountId = req.query.businessAccountId as string;
      if (!businessAccountId) {
        // Return general integration info
        return res.json({
          available: [
            { platform: "salesforce", name: "Salesforce", category: "crm", auth: "oauth2" },
            { platform: "hubspot", name: "HubSpot", category: "crm", auth: "oauth2" },
            { platform: "zoho", name: "Zoho CRM", category: "crm", auth: "oauth2" },
            { platform: "monday", name: "Monday.com", category: "crm", auth: "api_key" },
            { platform: "servicetitan", name: "ServiceTitan", category: "crm", auth: "oauth2" },
            { platform: "jobber", name: "Jobber", category: "crm", auth: "oauth2" },
            { platform: "housecallpro", name: "Housecall Pro", category: "crm", auth: "api_key" },
            { platform: "govwin", name: "GovWin", category: "crm", auth: "api_key" },
            { platform: "appfolio", name: "AppFolio", category: "property_management", auth: "oauth2" },
            { platform: "buildium", name: "Buildium", category: "property_management", auth: "api_key" },
            { platform: "yardi", name: "Yardi Voyager/Breeze", category: "property_management", auth: "credentials" },
            { platform: "rentmanager", name: "Rent Manager", category: "property_management", auth: "api_key" },
            { platform: "realpage", name: "RealPage", category: "property_management", auth: "api_key" },
            { platform: "cinc", name: "CINC Systems", category: "hoa_management", auth: "api_key" },
            { platform: "townsq", name: "TownSq", category: "hoa_management", auth: "api_key" },
            { platform: "vantaca", name: "Vantaca", category: "hoa_management", auth: "api_key" },
            { platform: "sam_gov", name: "SAM.gov", category: "government", auth: "api_key" },
            { platform: "usaspending", name: "USASpending.gov", category: "government", auth: "none" },
            { platform: "fema", name: "FEMA", category: "government", auth: "none" },
          ],
        });
      }

      const connections = await db.select().from(integrationConnections)
        .where(eq(integrationConnections.businessAccountId, businessAccountId));

      const integrations = connections.map(c => ({
        platform: c.platform,
        status: c.status,
        lastSyncAt: c.lastSyncAt,
        lastSyncResult: c.lastSyncResult,
        syncFrequency: c.syncFrequency,
        autoSync: c.autoSync,
      }));

      res.json({ businessAccountId, connections: integrations });
    } catch (error) {
      res.status(500).json({ error: "Failed to get integration status" });
    }
  });

  // POST /api/integrations/sync-all - Trigger sync for all connected integrations
  app.post("/api/integrations/sync-all", async (req, res) => {
    try {
      const { businessAccountId } = req.body;
      if (!businessAccountId) return res.status(400).json({ error: "Missing businessAccountId" });
      const results = await syncAll(businessAccountId);
      res.json({ success: true, results });
    } catch (error: any) {
      res.status(500).json({ error: "Sync-all failed", details: error.message });
    }
  });

  // GET /api/integrations/sync-logs - Recent sync logs
  app.get("/api/integrations/sync-logs", async (req, res) => {
    try {
      const businessAccountId = req.query.businessAccountId as string;
      if (!businessAccountId) return res.status(400).json({ error: "Missing businessAccountId" });

      const connections = await db.select().from(integrationConnections)
        .where(eq(integrationConnections.businessAccountId, businessAccountId));
      const connectionIds = connections.map(c => c.id);

      if (connectionIds.length === 0) return res.json({ logs: [] });

      const logs = await db.select().from(integrationSyncLogs)
        .where(eq(integrationSyncLogs.connectionId, connectionIds[0])) // TODO: IN clause
        .orderBy(integrationSyncLogs.createdAt)
        .limit(50);

      res.json({ logs });
    } catch (error) {
      res.status(500).json({ error: "Failed to get sync logs" });
    }
  });

  // POST /api/integrations/disconnect - Disconnect an integration
  app.post("/api/integrations/disconnect", async (req, res) => {
    try {
      const { businessAccountId, platform } = req.body;
      if (!businessAccountId || !platform) return res.status(400).json({ error: "Missing required fields" });

      await db.update(integrationConnections)
        .set({ status: "disconnected", credentials: null })
        .where(eq(integrationConnections.businessAccountId, businessAccountId));

      res.json({ success: true, message: `${platform} disconnected` });
    } catch (error) {
      res.status(500).json({ error: "Failed to disconnect integration" });
    }
  });

  // POST /api/integrations/settings - Update sync frequency/auto-sync
  app.post("/api/integrations/settings", async (req, res) => {
    try {
      const { businessAccountId, platform, syncFrequency, autoSync } = req.body;
      if (!businessAccountId || !platform) return res.status(400).json({ error: "Missing required fields" });

      const updates: Record<string, any> = {};
      if (syncFrequency) updates.syncFrequency = syncFrequency;
      if (autoSync !== undefined) updates.autoSync = autoSync;

      const connections = await db.select().from(integrationConnections)
        .where(eq(integrationConnections.businessAccountId, businessAccountId));
      const conn = connections.find(c => c.platform === platform);
      if (!conn) return res.status(404).json({ error: "Integration not found" });

      await db.update(integrationConnections).set(updates).where(eq(integrationConnections.id, conn.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update settings" });
    }
  });
}
