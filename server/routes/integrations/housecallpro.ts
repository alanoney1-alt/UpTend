/**
 * Housecall Pro Integration
 * API key auth, customer/job sync, job push
 */
import type { Express } from "express";
import { requireConnection, storeConnection, logSync } from "./crm-helpers";
import { upsertContactMapping, mapCrmContact } from "../../services/crm-sync";

const PLATFORM = "housecallpro" as const;
const HCP_API = "https://api.housecallpro.com";

async function hcpApiFetch(apiKey: string, path: string, options: RequestInit = {}) {
  const resp = await fetch(`${HCP_API}${path}`, {
    ...options,
    headers: { Authorization: `Token ${apiKey}`, "Content-Type": "application/json", ...((options.headers as Record<string, string>) || {}) },
  });
  if (!resp.ok) throw new Error(`HousecallPro API error ${resp.status}: ${await resp.text()}`);
  return resp.json();
}

export function registerHousecallProRoutes(app: Express) {
  app.post("/api/integrations/housecallpro/connect", async (req, res) => {
    try {
      const { businessAccountId, apiKey } = req.body;
      if (!businessAccountId || !apiKey) return res.status(400).json({ error: "businessAccountId and apiKey required" });

      // Verify key
      await hcpApiFetch(apiKey, "/pro/v1/company");
      const connId = await storeConnection(businessAccountId, PLATFORM, { apiKey });
      res.json({ success: true, connectionId: connId });
    } catch (error: any) {
      console.error("[HousecallPro] Connect error:", error);
      res.status(500).json({ error: "Failed to connect Housecall Pro", message: error.message });
    }
  });

  app.post("/api/integrations/housecallpro/sync", async (req, res) => {
    try {
      const ctx = await requireConnection(req, res, PLATFORM);
      if (!ctx) return;
      const { credentials, connection } = ctx;

      const customers = await hcpApiFetch(credentials.apiKey, "/pro/v1/customers?page_size=200");
      const jobs = await hcpApiFetch(credentials.apiKey, "/pro/v1/jobs?page_size=200");
      const estimates = await hcpApiFetch(credentials.apiKey, "/pro/v1/estimates?page_size=200");
      const invoices = await hcpApiFetch(credentials.apiKey, "/pro/v1/invoices?page_size=200");

      let synced = 0;
      for (const customer of customers.customers || []) {
        const mapped = mapCrmContact(PLATFORM, customer);
        await upsertContactMapping(req.body.businessAccountId, PLATFORM, mapped.externalId, customer);
        synced++;
      }

      await logSync(connection.id, PLATFORM, "sync", "success", synced, {
        customers: customers.total_items, jobs: jobs.total_items, estimates: estimates.total_items, invoices: invoices.total_items,
      });
      res.json({ success: true, synced, counts: { customers: customers.total_items, jobs: jobs.total_items, estimates: estimates.total_items, invoices: invoices.total_items } });
    } catch (error: any) {
      console.error("[HousecallPro] Sync error:", error);
      res.status(500).json({ error: "Failed to sync Housecall Pro data", message: error.message });
    }
  });

  app.post("/api/integrations/housecallpro/push-job", async (req, res) => {
    try {
      const ctx = await requireConnection(req, res, PLATFORM);
      if (!ctx) return;
      const { credentials, connection } = ctx;
      const { customerId, description, scheduledDate } = req.body;

      const job = await hcpApiFetch(credentials.apiKey, "/pro/v1/jobs", {
        method: "POST",
        body: JSON.stringify({ customer_id: customerId, description: description || "Job from UpTend", schedule: { scheduled_start: scheduledDate || new Date().toISOString() } }),
      });

      await logSync(connection.id, PLATFORM, "push-job", "success", 1);
      res.json({ success: true, jobId: job.id });
    } catch (error: any) {
      console.error("[HousecallPro] Push job error:", error);
      res.status(500).json({ error: "Failed to push job", message: error.message });
    }
  });
}
