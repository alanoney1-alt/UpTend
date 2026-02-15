/**
 * GovWin / Deltek Integration
 * API credentials auth, opportunity sync, bid push
 */
import type { Express } from "express";
import { requireConnection, storeConnection, logSync } from "./crm-helpers";
import { upsertContactMapping } from "../../services/crm-sync";

const PLATFORM = "govwin" as const;
const GOVWIN_API = "https://api.govwin.com/v1";

async function govwinApiFetch(apiKey: string, path: string, options: RequestInit = {}) {
  const resp = await fetch(`${GOVWIN_API}${path}`, {
    ...options,
    headers: { "X-Api-Key": apiKey, "Content-Type": "application/json", ...((options.headers as Record<string, string>) || {}) },
  });
  if (!resp.ok) throw new Error(`GovWin API error ${resp.status}: ${await resp.text()}`);
  return resp.json();
}

export function registerGovwinRoutes(app: Express) {
  app.post("/api/integrations/govwin/connect", async (req, res) => {
    try {
      const { businessAccountId, apiKey, username, password } = req.body;
      if (!businessAccountId || !(apiKey || (username && password))) {
        return res.status(400).json({ error: "businessAccountId and apiKey (or username+password) required" });
      }

      const connId = await storeConnection(businessAccountId, PLATFORM, { apiKey, username, password });
      res.json({ success: true, connectionId: connId });
    } catch (error: any) {
      console.error("[GovWin] Connect error:", error);
      res.status(500).json({ error: "Failed to connect GovWin" });
    }
  });

  app.post("/api/integrations/govwin/sync-opportunities", async (req, res) => {
    try {
      const ctx = await requireConnection(req, res, PLATFORM);
      if (!ctx) return;
      const { credentials, connection } = ctx;

      const opportunities = await govwinApiFetch(credentials.apiKey, "/opportunities?pageSize=200");
      const tracked = await govwinApiFetch(credentials.apiKey, "/tracked-opportunities?pageSize=200");

      let synced = 0;
      for (const opp of [...(opportunities.data || []), ...(tracked.data || [])]) {
        await upsertContactMapping(req.body.businessAccountId, PLATFORM, String(opp.id), opp);
        synced++;
      }

      await logSync(connection.id, PLATFORM, "sync-opportunities", "success", synced, {
        opportunities: opportunities.totalCount, tracked: tracked.totalCount,
      });
      res.json({ success: true, synced, counts: { opportunities: opportunities.totalCount, tracked: tracked.totalCount } });
    } catch (error: any) {
      console.error("[GovWin] Sync error:", error);
      res.status(500).json({ error: "Failed to sync GovWin opportunities", message: error.message });
    }
  });

  app.post("/api/integrations/govwin/push-bid", async (req, res) => {
    try {
      const ctx = await requireConnection(req, res, PLATFORM);
      if (!ctx) return;
      const { credentials, connection } = ctx;
      const { opportunityId, bidStatus, amount, notes } = req.body;
      if (!opportunityId) return res.status(400).json({ error: "opportunityId required" });

      const result = await govwinApiFetch(credentials.apiKey, `/opportunities/${opportunityId}/bids`, {
        method: "POST",
        body: JSON.stringify({ status: bidStatus || "submitted", amount, notes: notes || "Bid submitted via UpTend" }),
      });

      await logSync(connection.id, PLATFORM, "push-bid", "success", 1);
      res.json({ success: true, bidId: result.id });
    } catch (error: any) {
      console.error("[GovWin] Push bid error:", error);
      res.status(500).json({ error: "Failed to push bid", message: error.message });
    }
  });
}
