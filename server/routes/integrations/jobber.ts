/**
 * Jobber CRM Integration
 * OAuth2 flow, client/property/job sync, job push
 */
import type { Express } from "express";
import { requireConnection, storeConnection, logSync } from "./crm-helpers";
import { upsertContactMapping, mapCrmContact } from "../../services/crm-sync";

const PLATFORM = "jobber" as const;
const JOBBER_AUTH_URL = "https://api.getjobber.com/api/oauth/authorize";
const JOBBER_TOKEN_URL = "https://api.getjobber.com/api/oauth/token";
const JOBBER_GQL = "https://api.getjobber.com/api/graphql";

async function jobberQuery(accessToken: string, query: string, variables?: Record<string, any>) {
  const resp = await fetch(JOBBER_GQL, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", "X-JOBBER-GRAPHQL-VERSION": "2024-06-13" },
    body: JSON.stringify({ query, variables }),
  });
  if (!resp.ok) throw new Error(`Jobber API error ${resp.status}: ${await resp.text()}`);
  const json = await resp.json() as any;
  if (json.errors?.length) throw new Error(`Jobber GraphQL error: ${JSON.stringify(json.errors)}`);
  return json.data;
}

export function registerJobberRoutes(app: Express) {
  app.post("/api/integrations/jobber/connect", async (req, res) => {
    try {
      const { businessAccountId, clientId, clientSecret, redirectUri } = req.body;
      if (!businessAccountId || !clientId) return res.status(400).json({ error: "businessAccountId and clientId required" });

      await storeConnection(businessAccountId, PLATFORM, { clientId, clientSecret, redirectUri, status: "pending_oauth" });
      const authUrl = `${JOBBER_AUTH_URL}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri || "")}&response_type=code`;
      res.json({ success: true, authUrl });
    } catch (error: any) {
      console.error("[Jobber] Connect error:", error);
      res.status(500).json({ error: "Failed to initiate Jobber connection" });
    }
  });

  app.post("/api/integrations/jobber/callback", async (req, res) => {
    try {
      const { businessAccountId, code, clientId, clientSecret, redirectUri } = req.body;
      if (!businessAccountId || !code) return res.status(400).json({ error: "businessAccountId and code required" });

      const tokenResp = await fetch(JOBBER_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "authorization_code", code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri }),
      });
      const tokens = await tokenResp.json() as any;
      if (!tokenResp.ok) return res.status(400).json({ error: "Token exchange failed", details: tokens });

      const connId = await storeConnection(businessAccountId, PLATFORM, {
        clientId, clientSecret, redirectUri,
        accessToken: tokens.access_token, refreshToken: tokens.refresh_token, expiresIn: tokens.expires_in,
      });
      res.json({ success: true, connectionId: connId });
    } catch (error: any) {
      console.error("[Jobber] Callback error:", error);
      res.status(500).json({ error: "Failed to complete Jobber OAuth" });
    }
  });

  app.post("/api/integrations/jobber/sync", async (req, res) => {
    try {
      const ctx = await requireConnection(req, res, PLATFORM);
      if (!ctx) return;
      const { credentials, connection } = ctx;

      const clientsData = await jobberQuery(credentials.accessToken, `{ clients(first: 100) { nodes { id firstName lastName email phones { number } properties { nodes { id address { street city } } } } totalCount } }`);
      const jobsData = await jobberQuery(credentials.accessToken, `{ jobs(first: 100) { nodes { id title jobNumber startAt client { id } } totalCount } }`);

      let synced = 0;
      for (const client of clientsData.clients?.nodes || []) {
        const mapped = mapCrmContact(PLATFORM, { id: client.id, first_name: client.firstName, last_name: client.lastName, email: client.email, phone: client.phones?.[0]?.number });
        await upsertContactMapping(req.body.businessAccountId, PLATFORM, mapped.externalId, client);
        synced++;
      }

      await logSync(connection.id, PLATFORM, "sync", "success", synced, { clients: clientsData.clients?.totalCount, jobs: jobsData.jobs?.totalCount });
      res.json({ success: true, synced, counts: { clients: clientsData.clients?.totalCount, jobs: jobsData.jobs?.totalCount } });
    } catch (error: any) {
      console.error("[Jobber] Sync error:", error);
      res.status(500).json({ error: "Failed to sync Jobber data", message: error.message });
    }
  });

  app.post("/api/integrations/jobber/push-job", async (req, res) => {
    try {
      const ctx = await requireConnection(req, res, PLATFORM);
      if (!ctx) return;
      const { credentials, connection } = ctx;
      const { clientId, title, description, startAt } = req.body;

      const data = await jobberQuery(credentials.accessToken, `mutation($input: JobCreateInput!) { jobCreate(input: $input) { job { id title } userErrors { message } } }`, {
        input: { clientId, title: title || "UpTend Job", instructions: description || "", startAt: startAt || new Date().toISOString() },
      });

      await logSync(connection.id, PLATFORM, "push-job", "success", 1);
      res.json({ success: true, job: data.jobCreate?.job });
    } catch (error: any) {
      console.error("[Jobber] Push job error:", error);
      res.status(500).json({ error: "Failed to push job", message: error.message });
    }
  });
}
