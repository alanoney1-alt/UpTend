/**
 * Salesforce CRM Integration
 * OAuth2 flow, contact/opportunity sync, job/invoice push, webhook receiver
 */
import type { Express } from "express";
import { requireConnection, storeConnection, logSync } from "./crm-helpers";
import { upsertContactMapping, mapCrmContact, mapCrmCompany } from "../../services/crm-sync";

const PLATFORM = "salesforce" as const;
const SF_AUTH_URL = "https://login.salesforce.com/services/oauth2/authorize";
const SF_TOKEN_URL = "https://login.salesforce.com/services/oauth2/token";

async function sfApiFetch(instanceUrl: string, accessToken: string, path: string, options: RequestInit = {}) {
  const resp = await fetch(`${instanceUrl}/services/data/v59.0${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Salesforce API error ${resp.status}: ${text}`);
  }
  return resp.json();
}

export function registerSalesforceRoutes(app: Express) {
  // POST /api/integrations/salesforce/connect — Start OAuth2 flow
  app.post("/api/integrations/salesforce/connect", async (req, res) => {
    try {
      const { businessAccountId, clientId, clientSecret, redirectUri } = req.body;
      if (!businessAccountId || !clientId) {
        return res.status(400).json({ error: "businessAccountId and clientId are required" });
      }

      // Store partial credentials, return OAuth URL for the frontend to redirect
      await storeConnection(businessAccountId, PLATFORM, {
        clientId,
        clientSecret,
        redirectUri: redirectUri || `${req.protocol}://${req.get("host")}/api/integrations/salesforce/callback`,
        status: "pending_oauth",
      });

      const authUrl = `${SF_AUTH_URL}?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri || "")}&scope=api+refresh_token`;
      res.json({ success: true, authUrl, message: "Redirect user to authUrl to complete OAuth" });
    } catch (error: any) {
      console.error("[Salesforce] Connect error:", error);
      res.status(500).json({ error: "Failed to initiate Salesforce connection" });
    }
  });

  // POST /api/integrations/salesforce/callback — Exchange code for tokens
  app.post("/api/integrations/salesforce/callback", async (req, res) => {
    try {
      const { businessAccountId, code, clientId, clientSecret, redirectUri } = req.body;
      if (!businessAccountId || !code) {
        return res.status(400).json({ error: "businessAccountId and code are required" });
      }

      const tokenResp = await fetch(SF_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
        }),
      });

      const tokens = await tokenResp.json() as any;
      if (!tokenResp.ok) {
        return res.status(400).json({ error: "OAuth token exchange failed", details: tokens });
      }

      const connId = await storeConnection(businessAccountId, PLATFORM, {
        clientId,
        clientSecret,
        redirectUri,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        instanceUrl: tokens.instance_url,
        tokenType: tokens.token_type,
      });

      res.json({ success: true, connectionId: connId, instanceUrl: tokens.instance_url });
    } catch (error: any) {
      console.error("[Salesforce] Callback error:", error);
      res.status(500).json({ error: "Failed to complete Salesforce OAuth" });
    }
  });

  // POST /api/integrations/salesforce/sync-contacts
  app.post("/api/integrations/salesforce/sync-contacts", async (req, res) => {
    try {
      const ctx = await requireConnection(req, res, PLATFORM);
      if (!ctx) return;

      const { credentials, connection } = ctx;
      const { instanceUrl, accessToken } = credentials;

      // Pull Contacts
      const contactResult = await sfApiFetch(instanceUrl, accessToken, "/query?q=" + encodeURIComponent(
        "SELECT Id, FirstName, LastName, Email, Phone, Title, Account.Name, MailingAddress FROM Contact ORDER BY LastModifiedDate DESC LIMIT 200"
      ));

      // Pull Accounts
      const accountResult = await sfApiFetch(instanceUrl, accessToken, "/query?q=" + encodeURIComponent(
        "SELECT Id, Name, Industry, Phone, Website FROM Account ORDER BY LastModifiedDate DESC LIMIT 200"
      ));

      // Pull Leads
      const leadResult = await sfApiFetch(instanceUrl, accessToken, "/query?q=" + encodeURIComponent(
        "SELECT Id, FirstName, LastName, Email, Phone, Company FROM Lead WHERE IsConverted = false ORDER BY LastModifiedDate DESC LIMIT 200"
      ));

      let synced = 0;
      for (const record of [...(contactResult.records || []), ...(leadResult.records || [])]) {
        const mapped = mapCrmContact(PLATFORM, record);
        await upsertContactMapping(req.body.businessAccountId, PLATFORM, mapped.externalId, record);
        synced++;
      }

      await logSync(connection.id, PLATFORM, "sync-contacts", "success", synced, {
        contacts: contactResult.totalSize,
        accounts: accountResult.totalSize,
        leads: leadResult.totalSize,
      });

      res.json({
        success: true,
        synced,
        counts: { contacts: contactResult.totalSize, accounts: accountResult.totalSize, leads: leadResult.totalSize },
      });
    } catch (error: any) {
      console.error("[Salesforce] Sync contacts error:", error);
      res.status(500).json({ error: "Failed to sync Salesforce contacts", message: error.message });
    }
  });

  // POST /api/integrations/salesforce/sync-opportunities
  app.post("/api/integrations/salesforce/sync-opportunities", async (req, res) => {
    try {
      const ctx = await requireConnection(req, res, PLATFORM);
      if (!ctx) return;

      const { credentials, connection } = ctx;
      const result = await sfApiFetch(credentials.instanceUrl, credentials.accessToken, "/query?q=" + encodeURIComponent(
        "SELECT Id, Name, Amount, StageName, CloseDate, Account.Name FROM Opportunity ORDER BY LastModifiedDate DESC LIMIT 200"
      ));

      await logSync(connection.id, PLATFORM, "sync-opportunities", "success", result.totalSize || 0);
      res.json({ success: true, opportunities: result.records || [], total: result.totalSize });
    } catch (error: any) {
      console.error("[Salesforce] Sync opportunities error:", error);
      res.status(500).json({ error: "Failed to sync opportunities", message: error.message });
    }
  });

  // POST /api/integrations/salesforce/push-job
  app.post("/api/integrations/salesforce/push-job", async (req, res) => {
    try {
      const ctx = await requireConnection(req, res, PLATFORM);
      if (!ctx) return;

      const { credentials, connection } = ctx;
      const { contactId, subject, description, status } = req.body;

      const task = await sfApiFetch(credentials.instanceUrl, credentials.accessToken, "/sobjects/Task", {
        method: "POST",
        body: JSON.stringify({
          WhoId: contactId,
          Subject: subject || "UpTend Job Completed",
          Description: description || "Job completed via UpTend platform",
          Status: status || "Completed",
          Type: "Other",
        }),
      });

      await logSync(connection.id, PLATFORM, "push-job", "success", 1, { taskId: task.id });
      res.json({ success: true, taskId: task.id });
    } catch (error: any) {
      console.error("[Salesforce] Push job error:", error);
      res.status(500).json({ error: "Failed to push job to Salesforce", message: error.message });
    }
  });

  // POST /api/integrations/salesforce/push-invoice
  app.post("/api/integrations/salesforce/push-invoice", async (req, res) => {
    try {
      const ctx = await requireConnection(req, res, PLATFORM);
      if (!ctx) return;

      const { credentials, connection } = ctx;
      const { accountId, amount, description, invoiceNumber } = req.body;

      // Create as a custom object or Task with invoice details
      const task = await sfApiFetch(credentials.instanceUrl, credentials.accessToken, "/sobjects/Task", {
        method: "POST",
        body: JSON.stringify({
          WhatId: accountId,
          Subject: `UpTend Invoice #${invoiceNumber || "N/A"}`,
          Description: `Amount: $${amount}\n${description || ""}`,
          Status: "Completed",
          Type: "Other",
        }),
      });

      await logSync(connection.id, PLATFORM, "push-invoice", "success", 1, { taskId: task.id });
      res.json({ success: true, taskId: task.id });
    } catch (error: any) {
      console.error("[Salesforce] Push invoice error:", error);
      res.status(500).json({ error: "Failed to push invoice to Salesforce", message: error.message });
    }
  });

  // POST /api/integrations/salesforce/webhook — Receive SF outbound messages
  app.post("/api/integrations/salesforce/webhook", async (req, res) => {
    try {
      console.log("[Salesforce] Webhook received:", JSON.stringify(req.body).slice(0, 500));
      // Process incoming outbound message (new contact, updated opportunity, etc.)
      const { event, data, businessAccountId } = req.body;

      if (businessAccountId && data?.Id) {
        await upsertContactMapping(businessAccountId, PLATFORM, data.Id, data);
      }

      res.json({ success: true, received: true });
    } catch (error: any) {
      console.error("[Salesforce] Webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });
}
