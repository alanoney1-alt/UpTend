/**
 * USASpending.gov Integration - Public REST API (no auth)
 * Search awarded federal contracts and analyze competitors
 */
import type { Express, Request, Response } from "express";
import { z } from "zod";

const USA_SPENDING_BASE = "https://api.usaspending.gov/api/v2";

const UPTEND_NAICS = ["561720", "561730", "561790", "561210", "561740"];

export function registerUsaSpendingRoutes(app: Express) {
  // Search awarded contracts
  app.get("/api/integrations/usaspending/search", async (req: Request, res: Response) => {
    try {
      const { agency, vendor, naicsCode, minAmount, maxAmount, limit } = req.query;
      
      const filters: any = { time_period: [{ start_date: "2023-01-01", end_date: "2026-12-31" }] };
      if (agency) filters.agencies = [{ type: "awarding", tier: "toptier", name: agency }];
      if (vendor) filters.recipient_search_text = [vendor as string];
      if (naicsCode) filters.naics_codes = { require: [naicsCode as string] };
      if (minAmount || maxAmount) {
        filters.award_amounts = [{ lower_bound: Number(minAmount) || 0, upper_bound: Number(maxAmount) || 999999999 }];
      }

      const response = await fetch(`${USA_SPENDING_BASE}/search/spending_by_award/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filters,
          fields: ["Award ID", "Recipient Name", "Award Amount", "Awarding Agency", "Start Date", "End Date", "Description", "NAICS Code"],
          limit: Number(limit) || 25,
          page: 1,
          sort: "Award Amount",
          order: "desc",
          subawards: false,
        }),
      });

      if (!response.ok) throw new Error(`USASpending API ${response.status}`);
      const data = await response.json();

      res.json({
        success: true,
        count: data.results?.length || 0,
        total: data.page_metadata?.total || 0,
        contracts: (data.results || []).map((r: any) => ({
          awardId: r["Award ID"],
          recipient: r["Recipient Name"],
          amount: r["Award Amount"],
          agency: r["Awarding Agency"],
          startDate: r["Start Date"],
          endDate: r["End Date"],
          description: r["Description"],
          naicsCode: r["NAICS Code"],
        })),
      });
    } catch (error: any) {
      console.error("USASpending search error:", error);
      res.status(500).json({ error: "Failed to search USASpending", details: error.message });
    }
  });

  // Competitor analysis
  app.get("/api/integrations/usaspending/competitor-analysis", async (req: Request, res: Response) => {
    try {
      const naicsCodes = (req.query.naicsCodes as string)?.split(",") || UPTEND_NAICS;
      const competitors: Record<string, { totalAwards: number; totalAmount: number; contracts: number }> = {};

      for (const naics of naicsCodes.slice(0, 3)) { // Limit to 3 to avoid rate limits
        try {
          const response = await fetch(`${USA_SPENDING_BASE}/search/spending_by_award/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filters: {
                time_period: [{ start_date: "2024-01-01", end_date: "2026-12-31" }],
                naics_codes: { require: [naics] },
              },
              fields: ["Recipient Name", "Award Amount"],
              limit: 100,
              page: 1,
              sort: "Award Amount",
              order: "desc",
              subawards: false,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            for (const r of data.results || []) {
              const name = r["Recipient Name"] || "Unknown";
              if (!competitors[name]) competitors[name] = { totalAwards: 0, totalAmount: 0, contracts: 0 };
              competitors[name].totalAmount += r["Award Amount"] || 0;
              competitors[name].contracts++;
            }
          }
        } catch {
          // Skip failed NAICS queries
        }
      }

      // Sort by total amount
      const sorted = Object.entries(competitors)
        .sort(([, a], [, b]) => b.totalAmount - a.totalAmount)
        .slice(0, 50)
        .map(([name, data]) => ({ name, ...data }));

      res.json({ success: true, naicsCodes, topCompetitors: sorted });
    } catch (error: any) {
      res.status(500).json({ error: "Competitor analysis failed", details: error.message });
    }
  });
}
