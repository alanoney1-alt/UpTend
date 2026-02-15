/**
 * HubSpot CRM Integration
 * OAuth2 / API key auth, contact/company/deal sync, activity push, webhook
 */
import type { Express } from "express";
import { requireConnection, storeConnection, logSync } from "./crm-helpers";
import { upsertContactMapping, mapCrmContact } from "../../services/crm-sync";

const PLATFORM = "hubspot" as const;
const HS_AUTH_URL = "https://app.hubspot.com/oauth/authorize";
const HS_TOKEN_URL = "https://api.hubapi.com/oauth/v1/token";
const HS_API_BASE = "https://api.hubapi.com";

async function hsApiFetch(accessToken: string, path: string, options: RequestInit = {}) {
  const resp = await fetch(`${HS_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`HubSpot API error ${resp.status}: ${text}`);
  }
  return resp.json();
}

export function registerHubspotRoutes(app: Express) {
  // POST /api/integrations/hubspot/connect
  app.post("/api/integrations/hubspot/connect", async (req, res) => {
    try {
      const { businessAccountId, clientId, clientSecret, redirectUri, apiKey } = req.body;
      if (!businessAccountId) return res.status(400).json({ error: "businessAccountId is required" });

      // API key mode
      if (apiKey) {
        const connId = await storeConnection(businessAccountId, PLATFORM, { apiKey, authMode: "apikey" });
        return res.json({ success: true, connectionId: connId, message: "Connected via API key" });
      }

      // OAuth mode
      if (!clientId) return res.status(400).json({ error: "clientId or apiKey required" });
      await storeConnection(businessAccountId, PLATFORM, { clientId, clientSecret, redirectUri, status: "pending_oauth" });

      const scopes = "crm.objects.contacts.read crm.objects.contacts.write crm.objects.companies.read crm.objects.deals.read crm.objects.deals.write";
      const authUrl = `${HS_AUTH_URL}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri || "")}&scope=${encodeURIComponent(scopes)}`;
      res.json({ success: true, authUrl });
    } catch (error: any) {
      console.error("[HubSpot] Connect error:", error);
      res.status(500).json({ error: "Failed to initiate HubSpot connection" });
    }
  });

  // POST /api/integrations/hubspot/callback
  app.post("/api/integrations/hubspot/callback", async (req, res) => {
    try {
      const { businessAccountId, code, clientId, clientSecret, redirectUri } = req.body;
      if (!businessAccountId || !code) return res.status(400).json({ error: "businessAccountId and code required" });

      const tokenResp = await fetch(HS_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "authorization_code", code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri }),
      });
      const tokens = await tokenResp.json() as any;
      if (!tokenResp.ok) return res.status(400).json({ error: "OAuth token exchange failed", details: tokens });

      const connId = await storeConnection(businessAccountId, PLATFORM, {
        clientId, clientSecret, redirectUri,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in,
        authMode: "oauth2",
      });
      res.json({ success: true, connectionId: connId });
    } catch (error: any) {
      console.error("[HubSpot] Callback error:", error);
      res.status(500).json({ error: "Failed to complete HubSpot OAuth" });
    }
  });

  // POST /api/integrations/hubspot/sync-contacts
  app.post("/api/integrations/hubspot/sync-contacts", async (req, res) => {
    try {
      const ctx = await requireConnection(req, res, PLATFORM);
      if (!ctx) return;
      const { credentials, connection } = ctx;
      const token = credentials.accessToken || credentials.apiKey;

      const contacts = await hsApiFetch(token, "/crm/v3/objects/contacts?limit=100&properties=firstname,lastname,email,phone,company");
      const companies = await hsApiFetch(token, "/crm/v3/objects/companies?limit=100&properties=name,industry,phone,domain");
      const deals = await hsApiFetch(token, "/crm/v3/objects/deals?limit=100&properties=dealname,amount,dealstage");

      let synced = 0;
      for (const contact of contacts.results || []) {
        const mapped = mapCrmContact(PLATFORM, contact);
        await upsertContactMapping(req.body.businessAccountId, PLATFORM, mapped.externalId, contact);
        synced++;
      }

      await logSync(connection.id, PLATFORM, "sync-contacts", "success", synced, {
        contacts: contacts.total, companies: companies.total, deals: deals.total,
      });
      res.json({ success: true, synced, counts: { contacts: contacts.total, companies: companies.total, deals: deals.total } });
    } catch (error: any) {
      console.error("[HubSpot] Sync error:", error);
      res.status(500).json({ error: "Failed to sync HubSpot contacts", message: error.message });
    }
  });

  // POST /api/integrations/hubspot/push-activity
  app.post("/api/integrations/hubspot/push-activity", async (req, res) => {
    try {
      const ctx = await requireConnection(req, res, PLATFORM);
      if (!ctx) return;
      const { credentials, connection } = ctx;
      const token = credentials.accessToken || credentials.apiKey;
      const { contactId, body: noteBody, subject } = req.body;

      const note = await hsApiFetch(token, "/crm/v3/objects/notes", {
        method: "POST",
        body: JSON.stringify({
          properties: {
            hs_note_body: noteBody || "Job completed via UpTend",
            hs_timestamp: new Date().toISOString(),
          },
          associations: contactId ? [{ to: { id: contactId }, types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 202 }] }] : [],
        }),
      });

      await logSync(connection.id, PLATFORM, "push-activity", "success", 1);
      res.json({ success: true, noteId: note.id });
    } catch (error: any) {
      console.error("[HubSpot] Push activity error:", error);
      res.status(500).json({ error: "Failed to push activity", message: error.message });
    }
  });

  // POST /api/integrations/hubspot/push-deal
  app.post("/api/integrations/hubspot/push-deal", async (req, res) => {
    try {
      const ctx = await requireConnection(req, res, PLATFORM);
      if (!ctx) return;
      const { credentials, connection } = ctx;
      const token = credentials.accessToken || credentials.apiKey;
      const { dealName, amount, stage, contactId } = req.body;

      const deal = await hsApiFetch(token, "/crm/v3/objects/deals", {
        method: "POST",
        body: JSON.stringify({
          properties: { dealname: dealName || "UpTend B2B Signup", amount: String(amount || 0), dealstage: stage || "appointmentscheduled" },
          associations: contactId ? [{ to: { id: contactId }, types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 3 }] }] : [],
        }),
      });

      await logSync(connection.id, PLATFORM, "push-deal", "success", 1);
      res.json({ success: true, dealId: deal.id });
    } catch (error: any) {
      console.error("[HubSpot] Push deal error:", error);
      res.status(500).json({ error: "Failed to create deal", message: error.message });
    }
  });

  // POST /api/integrations/hubspot/webhook
  app.post("/api/integrations/hubspot/webhook", async (req, res) => {
    try {
      console.log("[HubSpot] Webhook received:", JSON.stringify(req.body).slice(0, 500));
      // HubSpot sends arrays of events
      const events = Array.isArray(req.body) ? req.body : [req.body];
      for (const event of events) {
        console.log(`[HubSpot] Event: ${event.subscriptionType} objectId=${event.objectId}`);
      }
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error("[HubSpot] Webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });
}
