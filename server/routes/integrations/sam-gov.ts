/**
 * SAM.gov Integration - Government Contract Opportunities
 * Uses the SAM.gov Entity/Opportunities API (api.sam.gov)
 */
import type { Express, Request, Response } from "express";
import { db } from "../../db";
import { integrationConnections, governmentOpportunities } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { encryptCredentials, decryptCredentials } from "../../services/encryption";
import { z } from "zod";

const SAM_API_BASE = "https://api.sam.gov";

// UpTend's relevant NAICS codes
const UPTEND_NAICS = ["561720", "561730", "561790", "561210", "561740"];

const searchSchema = z.object({
  naicsCode: z.string().optional(),
  state: z.string().optional(),
  setAsideType: z.string().optional(), // SBA, 8a, HUBZone, SDVOSB, WOSB
  keyword: z.string().optional(),
  limit: z.number().default(25),
});

const registerSchema = z.object({
  uei: z.string().min(1), // Unique Entity Identifier
  cageCode: z.string().optional(),
  businessAccountId: z.string().min(1),
  samApiKey: z.string().optional(), // SAM.gov API key for authenticated endpoints
});

async function samFetch(endpoint: string, apiKey?: string) {
  const url = `${SAM_API_BASE}${endpoint}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["X-Api-Key"] = apiKey;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`SAM.gov API ${res.status}: ${await res.text()}`);
  return res.json();
}

export function registerSamGovRoutes(app: Express) {
  // Search opportunities
  app.post("/api/integrations/sam/search-opportunities", async (req: Request, res: Response) => {
    try {
      const params = searchSchema.parse(req.body);
      const queryParts: string[] = [];
      if (params.naicsCode) queryParts.push(`naicsCode=${params.naicsCode}`);
      if (params.state) queryParts.push(`postate=${params.state}`);
      if (params.setAsideType) queryParts.push(`typeOfSetAside=${params.setAsideType}`);
      if (params.keyword) queryParts.push(`q=${encodeURIComponent(params.keyword)}`);
      queryParts.push(`limit=${params.limit}`);
      queryParts.push("api_key=" + (process.env.SAM_GOV_API_KEY || "DEMO_KEY"));

      const data = await samFetch(`/opportunities/v2/search?${queryParts.join("&")}`);
      
      const opportunities = (data.opportunitiesData || []).map((opp: any) => ({
        title: opp.title,
        solicitationNumber: opp.solicitationNumber,
        agency: opp.department || opp.subtier,
        naicsCode: opp.naicsCode,
        setAsideType: opp.typeOfSetAside,
        responseDeadline: opp.responseDeadLine || opp.archiveDate,
        placeOfPerformance: opp.postate ? `${opp.pocity || ""}, ${opp.postate}` : null,
        url: opp.uiLink || `https://sam.gov/opp/${opp.noticeId}`,
        description: opp.description?.substring(0, 500),
        status: "open",
      }));

      res.json({ success: true, count: opportunities.length, opportunities });
    } catch (error: any) {
      console.error("SAM.gov search error:", error);
      res.status(500).json({ error: "Failed to search SAM.gov", details: error.message });
    }
  });

  // Register entity info
  app.post("/api/integrations/sam/register-entity", async (req: Request, res: Response) => {
    try {
      const data = registerSchema.parse(req.body);
      const { businessAccountId, ...creds } = data;
      const existing = await db.select().from(integrationConnections)
        .where(and(eq(integrationConnections.businessAccountId, businessAccountId), eq(integrationConnections.platform, "sam_gov"))).limit(1);

      const encrypted = encryptCredentials(creds);
      if (existing.length) {
        await db.update(integrationConnections).set({ credentials: encrypted, status: "active" }).where(eq(integrationConnections.id, existing[0].id));
      } else {
        await db.insert(integrationConnections).values({ businessAccountId, platform: "sam_gov", credentials: encrypted, status: "active" });
      }
      res.json({ success: true, message: "SAM.gov entity info saved" });
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: error.errors });
      res.status(500).json({ error: "Failed to register entity" });
    }
  });

  // Check SAM registration status
  app.get("/api/integrations/sam/check-status", async (req: Request, res: Response) => {
    try {
      const businessAccountId = req.query.businessAccountId as string;
      if (!businessAccountId) return res.status(400).json({ error: "Missing businessAccountId" });

      const [conn] = await db.select().from(integrationConnections)
        .where(and(eq(integrationConnections.businessAccountId, businessAccountId), eq(integrationConnections.platform, "sam_gov"))).limit(1);
      
      if (!conn?.credentials) return res.json({ registered: false, message: "No SAM.gov entity registered" });

      const creds = decryptCredentials(conn.credentials);
      if (!creds.uei) return res.json({ registered: false, message: "No UEI on file" });

      // Check entity status via SAM API
      try {
        const apiKey = creds.samApiKey || process.env.SAM_GOV_API_KEY || "DEMO_KEY";
        const entity = await samFetch(`/entity-information/v3/entities?ueiSAM=${creds.uei}&api_key=${apiKey}`);
        const active = entity?.entityData?.[0]?.registration?.registrationStatus === "Active";
        res.json({
          registered: true,
          active,
          uei: creds.uei,
          cageCode: creds.cageCode,
          registrationStatus: entity?.entityData?.[0]?.registration?.registrationStatus || "Unknown",
          expirationDate: entity?.entityData?.[0]?.registration?.registrationExpirationDate,
        });
      } catch {
        res.json({ registered: true, active: null, uei: creds.uei, cageCode: creds.cageCode, message: "Could not verify with SAM.gov API" });
      }
    } catch (error: any) {
      res.status(500).json({ error: "Failed to check status" });
    }
  });

  // Auto-sync relevant opportunities
  app.post("/api/integrations/sam/sync-opportunities", async (req: Request, res: Response) => {
    try {
      const apiKey = process.env.SAM_GOV_API_KEY || "DEMO_KEY";
      let totalSynced = 0;

      for (const naics of UPTEND_NAICS) {
        try {
          const data = await samFetch(`/opportunities/v2/search?naicsCode=${naics}&limit=50&api_key=${apiKey}`);
          const opps = data.opportunitiesData || [];
          
          for (const opp of opps) {
            await db.insert(governmentOpportunities).values({
              title: opp.title || "Untitled",
              description: opp.description?.substring(0, 2000),
              agency: opp.department || opp.subtier,
              solicitationNumber: opp.solicitationNumber,
              naicsCode: naics,
              setAsideType: opp.typeOfSetAside,
              responseDeadline: opp.responseDeadLine ? new Date(opp.responseDeadLine) : null,
              placeOfPerformance: opp.postate ? `${opp.pocity || ""}, ${opp.postate}` : null,
              url: opp.uiLink || `https://sam.gov/opp/${opp.noticeId}`,
              status: "open",
              syncedAt: new Date(),
            }).onConflictDoNothing();
            totalSynced++;
          }
        } catch (e: any) {
          console.error(`SAM.gov sync error for NAICS ${naics}:`, e.message);
        }
      }

      res.json({ success: true, totalSynced, naicsCodes: UPTEND_NAICS });
    } catch (error: any) {
      res.status(500).json({ error: "Opportunity sync failed", details: error.message });
    }
  });
}
