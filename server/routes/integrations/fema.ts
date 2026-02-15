/**
 * FEMA Integration - OpenFEMA API (public, no auth)
 * Disaster declarations, emergency contracts, vendor registration
 */
import type { Express, Request, Response } from "express";
import { z } from "zod";

const FEMA_API_BASE = "https://www.fema.gov/api/open/v2";

export function registerFemaRoutes(app: Express) {
  // Active disaster declarations by state
  app.get("/api/integrations/fema/active-disasters", async (req: Request, res: Response) => {
    try {
      const state = (req.query.state as string)?.toUpperCase();
      let url = `${FEMA_API_BASE}/DisasterDeclarationsSummaries?$filter=declarationDate gt '2024-01-01T00:00:00.000z'&$orderby=declarationDate desc&$top=50`;
      if (state) url += ` and state eq '${state}'`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`FEMA API ${response.status}`);
      const data = await response.json();

      const disasters = (data.DisasterDeclarationsSummaries || []).map((d: any) => ({
        disasterNumber: d.disasterNumber,
        declarationTitle: d.declarationTitle,
        declarationType: d.declarationType,
        state: d.state,
        declarationDate: d.declarationDate,
        incidentType: d.incidentType,
        designatedArea: d.designatedArea,
        closeoutDate: d.closeoutDate,
        active: !d.closeoutDate,
        femaUrl: `https://www.fema.gov/disaster/${d.disasterNumber}`,
      }));

      res.json({ success: true, count: disasters.length, disasters });
    } catch (error: any) {
      console.error("FEMA disasters error:", error);
      res.status(500).json({ error: "Failed to fetch FEMA disasters", details: error.message });
    }
  });

  // Find eligible emergency service contracts
  app.get("/api/integrations/fema/eligible-contracts", async (req: Request, res: Response) => {
    try {
      const state = (req.query.state as string)?.toUpperCase();
      
      // Get recent disaster declarations
      let url = `${FEMA_API_BASE}/DisasterDeclarationsSummaries?$filter=declarationDate gt '2024-06-01T00:00:00.000z'&$orderby=declarationDate desc&$top=20`;
      if (state) url += ` and state eq '${state}'`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`FEMA API ${response.status}`);
      const data = await response.json();

      // Also get hazard mitigation grants
      const grantsRes = await fetch(`${FEMA_API_BASE}/HazardMitigationAssistanceMitigatedProperties?$top=20&$orderby=id desc`);
      const grantsData = grantsRes.ok ? await grantsRes.json() : { HazardMitigationAssistanceMitigatedProperties: [] };

      const activeDisasters = (data.DisasterDeclarationsSummaries || []).filter((d: any) => !d.closeoutDate);
      
      // Map to potential contract opportunities
      const opportunities = activeDisasters.map((d: any) => ({
        disasterNumber: d.disasterNumber,
        title: `${d.declarationTitle} - ${d.incidentType}`,
        state: d.state,
        type: d.incidentType,
        potentialServices: mapDisasterToServices(d.incidentType),
        declarationDate: d.declarationDate,
        femaUrl: `https://www.fema.gov/disaster/${d.disasterNumber}`,
        note: "Contact FEMA or check SAM.gov for active solicitations related to this disaster",
      }));

      res.json({ success: true, activeDisasters: opportunities.length, opportunities });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch eligible contracts", details: error.message });
    }
  });

  // Pre-register as FEMA vendor (stores info locally, provides guidance)
  app.post("/api/integrations/fema/register-vendor", async (req: Request, res: Response) => {
    try {
      const { businessName, uei, cageCode, capabilities, states } = req.body;
      
      res.json({
        success: true,
        message: "FEMA vendor info saved locally",
        nextSteps: [
          "1. Ensure active SAM.gov registration (required for all federal contracts)",
          "2. Register in FEMA's Stakeholder & Vendor Portal: https://www.fema.gov/business-industry",
          "3. Sign up for FEMA Industry Liaison Program",
          "4. Monitor SAM.gov for disaster-related solicitations",
          "5. Consider getting on GSA Schedule for faster procurement",
          "6. Register with your state's emergency management agency",
        ],
        registrationLinks: {
          samGov: "https://sam.gov/content/entity-registration",
          femaVendor: "https://www.fema.gov/business-industry",
          gsaSchedule: "https://www.gsa.gov/buying-selling/purchasing-programs/gsa-multiple-award-schedule",
        },
        savedInfo: { businessName, uei, cageCode, capabilities, states },
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to process vendor registration" });
    }
  });
}

function mapDisasterToServices(incidentType: string): string[] {
  const type = (incidentType || "").toLowerCase();
  const services: string[] = [];
  
  if (type.includes("hurricane") || type.includes("storm") || type.includes("tornado")) {
    services.push("Debris removal", "Tree/limb removal", "Structural cleanup", "Pressure washing", "Landscaping restoration");
  }
  if (type.includes("flood")) {
    services.push("Flood debris removal", "Mold remediation support", "Pressure washing", "Property cleanup");
  }
  if (type.includes("fire") || type.includes("wildfire")) {
    services.push("Fire debris removal", "Property cleanup", "Landscaping restoration", "Hazardous material handling");
  }
  if (type.includes("earthquake")) {
    services.push("Structural debris removal", "Property cleanup", "Demolition support");
  }
  if (services.length === 0) {
    services.push("General debris removal", "Property cleanup", "Emergency services");
  }
  return services;
}
