/**
 * Yardi Integration - SOAP/XML API (Yardi Voyager & Breeze)
 */
import type { Express, Request, Response } from "express";
import { db } from "../../db";
import { integrationConnections, integrationSyncLogs, pmProperties, pmUnits, workOrders } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { encryptCredentials, decryptCredentials } from "../../services/encryption";
import { z } from "zod";

const connectSchema = z.object({
  serverUrl: z.string().url(),
  database: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
  platform: z.enum(["voyager", "breeze"]).default("voyager"),
  businessAccountId: z.string().min(1),
});

function buildSoapEnvelope(method: string, params: Record<string, string>, creds: any): string {
  const paramXml = Object.entries(params).map(([k, v]) => `<${k}>${v}</${k}>`).join("");
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:yar="http://tempuri.org/YSI.Interfaces.WebServices">
  <soap:Header>
    <yar:YardiCredentials>
      <yar:UserName>${creds.username}</yar:UserName>
      <yar:Password>${creds.password}</yar:Password>
      <yar:ServerName>${creds.serverUrl}</yar:ServerName>
      <yar:Database>${creds.database}</yar:Database>
    </yar:YardiCredentials>
  </soap:Header>
  <soap:Body>
    <yar:${method}>${paramXml}</yar:${method}>
  </soap:Body>
</soap:Envelope>`;
}

async function yardiSoapCall(conn: any, service: string, method: string, params: Record<string, string> = {}) {
  const creds = decryptCredentials(conn.credentials!);
  const endpoint = creds.platform === "breeze"
    ? `${creds.serverUrl}/api/webservices/${service}.asmx`
    : `${creds.serverUrl}/Webservices/${service}.asmx`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "SOAPAction": `http://tempuri.org/YSI.Interfaces.WebServices/${method}`,
    },
    body: buildSoapEnvelope(method, params, creds),
  });
  if (!res.ok) throw new Error(`Yardi SOAP ${res.status}: ${await res.text()}`);
  return res.text(); // Returns XML
}

// Basic XML value extraction (no dependency needed for simple cases)
function extractXmlValues(xml: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "gi");
  const matches: string[] = [];
  let m;
  while ((m = regex.exec(xml)) !== null) matches.push(m[1]);
  return matches;
}

async function getConnection(businessAccountId: string) {
  const [conn] = await db.select().from(integrationConnections)
    .where(and(eq(integrationConnections.businessAccountId, businessAccountId), eq(integrationConnections.platform, "yardi")))
    .limit(1);
  return conn;
}

export function registerYardiRoutes(app: Express) {
  app.post("/api/integrations/yardi/connect", async (req: Request, res: Response) => {
    try {
      const data = connectSchema.parse(req.body);
      const { businessAccountId, ...creds } = data;
      const existing = await getConnection(businessAccountId);
      const encrypted = encryptCredentials(creds);

      if (existing) {
        await db.update(integrationConnections).set({ credentials: encrypted, status: "active" }).where(eq(integrationConnections.id, existing.id));
      } else {
        await db.insert(integrationConnections).values({ businessAccountId, platform: "yardi", credentials: encrypted, status: "active" });
      }

      res.json({ success: true, message: "Yardi credentials saved. Run sync to pull data." });
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: error.errors });
      res.status(500).json({ error: "Failed to configure Yardi integration" });
    }
  });

  app.post("/api/integrations/yardi/sync", async (req: Request, res: Response) => {
    try {
      const { businessAccountId } = req.body;
      if (!businessAccountId) return res.status(400).json({ error: "Missing businessAccountId" });
      const conn = await getConnection(businessAccountId);
      if (!conn || conn.status === "disconnected") return res.status(400).json({ error: "Yardi not connected" });

      let totalRecords = 0;
      const syncResults: Record<string, any> = {};

      try {
        // Get properties via SOAP
        const propsXml = await yardiSoapCall(conn, "ItfResidentData", "GetPropertyConfigurations", {});
        // Parse basic property data from XML response
        const addresses = extractXmlValues(propsXml, "Address");
        const codes = extractXmlValues(propsXml, "PropertyCode");
        
        for (let i = 0; i < addresses.length; i++) {
          await db.insert(pmProperties).values({
            portfolioId: businessAccountId,
            address: addresses[i] || `Yardi Property ${codes[i] || i}`,
            type: "multi_family",
          }).onConflictDoNothing();
          totalRecords++;
        }
        syncResults.properties = addresses.length;

        // Get work orders
        const woXml = await yardiSoapCall(conn, "ItfServiceManager", "GetServiceRequests", { Status: "Open" });
        const woIds = extractXmlValues(woXml, "ServiceRequestId");
        const woDescs = extractXmlValues(woXml, "Description");
        const woUnits = extractXmlValues(woXml, "UnitCode");

        for (let i = 0; i < woIds.length; i++) {
          await db.insert(workOrders).values({
            unitId: woUnits[i] || "unknown",
            description: `[Yardi #${woIds[i]}] ${woDescs[i] || ""}`,
            priority: "normal",
            status: "open",
            photos: [],
          }).onConflictDoNothing();
          totalRecords++;
        }
        syncResults.workOrders = woIds.length;
      } catch (apiError: any) {
        await db.update(integrationConnections).set({ lastSyncAt: new Date(), lastSyncResult: { status: "error", error: apiError.message }, status: "error" }).where(eq(integrationConnections.id, conn.id));
        return res.status(500).json({ error: "Yardi sync failed", details: apiError.message });
      }

      await db.insert(integrationSyncLogs).values({ connectionId: conn.id, platform: "yardi", action: "sync", status: "success", recordsProcessed: totalRecords, details: syncResults });
      await db.update(integrationConnections).set({ lastSyncAt: new Date(), lastSyncResult: { status: "success", ...syncResults } }).where(eq(integrationConnections.id, conn.id));

      res.json({ success: true, recordsProcessed: totalRecords, details: syncResults });
    } catch (error: any) {
      console.error("Yardi sync error:", error);
      res.status(500).json({ error: "Sync failed" });
    }
  });

  // Push completed work order back to Yardi
  app.post("/api/integrations/yardi/push-completion", async (req: Request, res: Response) => {
    try {
      const { businessAccountId, workOrderId, completionNotes, completedBy } = req.body;
      if (!businessAccountId || !workOrderId) return res.status(400).json({ error: "Missing required fields" });
      
      const conn = await getConnection(businessAccountId);
      if (!conn || conn.status !== "active") return res.status(400).json({ error: "Yardi not connected" });

      // Extract Yardi ID from description
      const [wo] = await db.select().from(workOrders).where(eq(workOrders.id, workOrderId)).limit(1);
      if (!wo) return res.status(404).json({ error: "Work order not found" });

      const yardiIdMatch = wo.description.match(/\[Yardi #(\w+)\]/);
      if (!yardiIdMatch) return res.status(400).json({ error: "Work order not from Yardi" });

      await yardiSoapCall(conn, "ItfServiceManager", "UpdateServiceRequest", {
        ServiceRequestId: yardiIdMatch[1],
        Status: "Completed",
        CompletionNotes: completionNotes || "Completed via UpTend",
        CompletedBy: completedBy || "UpTend",
      });

      await db.insert(integrationSyncLogs).values({ connectionId: conn.id, platform: "yardi", action: "push", status: "success", recordsProcessed: 1, details: { workOrderId, yardiId: yardiIdMatch[1] } });

      res.json({ success: true, message: "Completion pushed to Yardi" });
    } catch (error: any) {
      console.error("Yardi push error:", error);
      res.status(500).json({ error: "Failed to push completion to Yardi" });
    }
  });

  app.get("/api/integrations/yardi/status", async (req: Request, res: Response) => {
    const businessAccountId = req.query.businessAccountId as string;
    if (!businessAccountId) return res.status(400).json({ error: "Missing businessAccountId" });
    const conn = await getConnection(businessAccountId);
    if (!conn) return res.json({ connected: false });
    res.json({ connected: conn.status === "active", status: conn.status, lastSyncAt: conn.lastSyncAt, lastSyncResult: conn.lastSyncResult });
  });
}
