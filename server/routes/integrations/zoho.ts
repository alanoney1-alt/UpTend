/**
 * Zoho CRM Integration
 * OAuth2 flow, contact/account/deal sync, job push, webhook
 */
import type { Express } from "express";
import { requireConnection, storeConnection, logSync } from "./crm-helpers";
import { upsertContactMapping, mapCrmContact } from "../../services/crm-sync";

const PLATFORM = "zoho" as const;
const ZOHO_AUTH_URL = "https://accounts.zoho.com/oauth/v2/auth";
const ZOHO_TOKEN_URL = "https://accounts.zoho.com/oauth/v2/token";

async function zohoApiFetch(domain: string, accessToken: string, path: string, options: RequestInit = {}) {
  const resp = await fetch(`https://www.zohoapis.${domain || "com"}/crm/v5${path}`, {
    ...options,
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Zoho API error ${resp.status}: ${text}`);
  }
  return resp.json();
}

export function registerZohoRoutes(app: Express) {
  app.post("/api/integrations/zoho/connect", async (req, res) => {
    try {
      const { businessAccountId, clientId, clientSecret, redirectUri, domain } = req.body;
      if (!businessAccountId || !clientId) return res.status(400).json({ error: "businessAccountId and clientId required" });

      await storeConnection(businessAccountId, PLATFORM, { clientId, clientSecret, redirectUri, domain: domain || "com", status: "pending_oauth" });
      const scopes = "ZohoCRM.modules.ALL,ZohoCRM.settings.ALL";
      const authUrl = `${ZOHO_AUTH_URL}?scope=${scopes}&client_id=${clientId}&response_type=code&access_type=offline&redirect_uri=${encodeURIComponent(redirectUri || "")}`;
      res.json({ success: true, authUrl });
    } catch (error: any) {
      console.error("[Zoho] Connect error:", error);
      res.status(500).json({ error: "Failed to initiate Zoho connection" });
    }
  });

  app.post("/api/integrations/zoho/callback", async (req, res) => {
    try {
      const { businessAccountId, code, clientId, clientSecret, redirectUri, domain } = req.body;
      if (!businessAccountId || !code) return res.status(400).json({ error: "businessAccountId and code required" });

      const tokenResp = await fetch(ZOHO_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "authorization_code", code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri }),
      });
      const tokens = await tokenResp.json() as any;
      if (!tokenResp.ok) return res.status(400).json({ error: "Token exchange failed", details: tokens });

      const connId = await storeConnection(businessAccountId, PLATFORM, {
        clientId, clientSecret, redirectUri, domain: domain || "com",
        accessToken: tokens.access_token, refreshToken: tokens.refresh_token, expiresIn: tokens.expires_in,
      });
      res.json({ success: true, connectionId: connId });
    } catch (error: any) {
      console.error("[Zoho] Callback error:", error);
      res.status(500).json({ error: "Failed to complete Zoho OAuth" });
    }
  });

  app.post("/api/integrations/zoho/sync", async (req, res) => {
    try {
      const ctx = await requireConnection(req, res, PLATFORM);
      if (!ctx) return;
      const { credentials, connection } = ctx;

      const contacts = await zohoApiFetch(credentials.domain, credentials.accessToken, "/Contacts?per_page=200");
      const accounts = await zohoApiFetch(credentials.domain, credentials.accessToken, "/Accounts?per_page=200");
      const deals = await zohoApiFetch(credentials.domain, credentials.accessToken, "/Deals?per_page=200");

      let synced = 0;
      for (const record of contacts.data || []) {
        const mapped = mapCrmContact(PLATFORM, record);
        await upsertContactMapping(req.body.businessAccountId, PLATFORM, mapped.externalId, record);
        synced++;
      }

      await logSync(connection.id, PLATFORM, "sync", "success", synced, {
        contacts: (contacts.info?.count || 0), accounts: (accounts.info?.count || 0), deals: (deals.info?.count || 0),
      });
      res.json({ success: true, synced, counts: { contacts: contacts.info?.count, accounts: accounts.info?.count, deals: deals.info?.count } });
    } catch (error: any) {
      console.error("[Zoho] Sync error:", error);
      res.status(500).json({ error: "Failed to sync Zoho data", message: error.message });
    }
  });

  app.post("/api/integrations/zoho/push-job", async (req, res) => {
    try {
      const ctx = await requireConnection(req, res, PLATFORM);
      if (!ctx) return;
      const { credentials, connection } = ctx;
      const { contactId, subject, description } = req.body;

      const task = await zohoApiFetch(credentials.domain, credentials.accessToken, "/Tasks", {
        method: "POST",
        body: JSON.stringify({ data: [{ Subject: subject || "UpTend Job Completed", Description: description || "", Who_Id: contactId, Status: "Completed" }] }),
      });

      await logSync(connection.id, PLATFORM, "push-job", "success", 1);
      res.json({ success: true, taskId: task.data?.[0]?.details?.id });
    } catch (error: any) {
      console.error("[Zoho] Push job error:", error);
      res.status(500).json({ error: "Failed to push job", message: error.message });
    }
  });

  app.post("/api/integrations/zoho/webhook", async (req, res) => {
    try {
      console.log("[Zoho] Webhook received:", JSON.stringify(req.body).slice(0, 500));
      res.json({ success: true, received: true });
    } catch (error: any) {
      console.error("[Zoho] Webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });
}
