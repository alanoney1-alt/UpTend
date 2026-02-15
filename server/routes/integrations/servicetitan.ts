/**
 * ServiceTitan Integration
 * OAuth2 auth, customer/job/technician sync, job push
 */
import type { Express } from "express";
import { requireConnection, storeConnection, logSync } from "./crm-helpers";
import { upsertContactMapping, mapCrmContact } from "../../services/crm-sync";

const PLATFORM = "servicetitan" as const;
const ST_AUTH_URL = "https://auth.servicetitan.io/connect/token";

async function stApiFetch(tenantId: string, accessToken: string, path: string, options: RequestInit = {}) {
  const resp = await fetch(`https://api.servicetitan.io/v2/tenant/${tenantId}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", ...((options.headers as Record<string, string>) || {}) },
  });
  if (!resp.ok) throw new Error(`ServiceTitan API error ${resp.status}: ${await resp.text()}`);
  return resp.json();
}

export function registerServiceTitanRoutes(app: Express) {
  app.post("/api/integrations/servicetitan/connect", async (req, res) => {
    try {
      const { businessAccountId, appId, appKey, tenantId, clientId, clientSecret } = req.body;
      if (!businessAccountId || !clientId || !clientSecret || !tenantId) {
        return res.status(400).json({ error: "businessAccountId, clientId, clientSecret, and tenantId required" });
      }

      const tokenResp = await fetch(ST_AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret }),
      });
      const tokens = await tokenResp.json() as any;
      if (!tokenResp.ok) return res.status(400).json({ error: "Auth failed", details: tokens });

      const connId = await storeConnection(businessAccountId, PLATFORM, {
        appId, appKey, tenantId, clientId, clientSecret,
        accessToken: tokens.access_token, expiresIn: tokens.expires_in,
      });
      res.json({ success: true, connectionId: connId });
    } catch (error: any) {
      console.error("[ServiceTitan] Connect error:", error);
      res.status(500).json({ error: "Failed to connect ServiceTitan" });
    }
  });

  app.post("/api/integrations/servicetitan/sync", async (req, res) => {
    try {
      const ctx = await requireConnection(req, res, PLATFORM);
      if (!ctx) return;
      const { credentials, connection } = ctx;

      const customers = await stApiFetch(credentials.tenantId, credentials.accessToken, "/customers?pageSize=200");
      const jobs = await stApiFetch(credentials.tenantId, credentials.accessToken, "/jpm/jobs?pageSize=200");
      const invoices = await stApiFetch(credentials.tenantId, credentials.accessToken, "/accounting/invoices?pageSize=200");

      let synced = 0;
      for (const customer of customers.data || []) {
        const mapped = mapCrmContact(PLATFORM, customer);
        await upsertContactMapping(req.body.businessAccountId, PLATFORM, mapped.externalId, customer);
        synced++;
      }

      await logSync(connection.id, PLATFORM, "sync", "success", synced, {
        customers: customers.totalCount, jobs: jobs.totalCount, invoices: invoices.totalCount,
      });
      res.json({ success: true, synced, counts: { customers: customers.totalCount, jobs: jobs.totalCount, invoices: invoices.totalCount } });
    } catch (error: any) {
      console.error("[ServiceTitan] Sync error:", error);
      res.status(500).json({ error: "Failed to sync ServiceTitan data", message: error.message });
    }
  });

  app.post("/api/integrations/servicetitan/push-job", async (req, res) => {
    try {
      const ctx = await requireConnection(req, res, PLATFORM);
      if (!ctx) return;
      const { credentials, connection } = ctx;
      const { customerId, locationId, summary, jobTypeId } = req.body;

      const job = await stApiFetch(credentials.tenantId, credentials.accessToken, "/jpm/jobs", {
        method: "POST",
        body: JSON.stringify({ customerId, locationId, summary: summary || "Job from UpTend", jobTypeId }),
      });

      await logSync(connection.id, PLATFORM, "push-job", "success", 1);
      res.json({ success: true, jobId: job.id });
    } catch (error: any) {
      console.error("[ServiceTitan] Push job error:", error);
      res.status(500).json({ error: "Failed to push job", message: error.message });
    }
  });

  app.post("/api/integrations/servicetitan/sync-technicians", async (req, res) => {
    try {
      const ctx = await requireConnection(req, res, PLATFORM);
      if (!ctx) return;
      const { credentials, connection } = ctx;

      const technicians = await stApiFetch(credentials.tenantId, credentials.accessToken, "/settings/technicians?pageSize=200");
      await logSync(connection.id, PLATFORM, "sync-technicians", "success", technicians.data?.length || 0);
      res.json({ success: true, technicians: technicians.data || [], total: technicians.totalCount });
    } catch (error: any) {
      console.error("[ServiceTitan] Sync technicians error:", error);
      res.status(500).json({ error: "Failed to sync technicians", message: error.message });
    }
  });
}
