import type { Express } from "express";
import { requireAuth } from "../../middleware/auth";
import { scrapeHOAForAddress, getHOAForCustomer, enrichHOAFromProReport, linkCustomerToHOA } from "../../services/hoa-scraper";

export function registerHoaScraperRoutes(app: Express) {
  // Manual HOA lookup
  app.get("/api/hoa/lookup", requireAuth, async (req, res) => {
    try {
      const { address, city, state, zip } = req.query;

      if (!address || !city || !state || !zip) {
        return res.status(400).json({ error: "address, city, state, and zip are required" });
      }

      const data = await scrapeHOAForAddress(
        address as string,
        city as string,
        state as string,
        zip as string
      );

      if (!data) {
        return res.json({ found: false, message: "No HOA data found for this address" });
      }

      res.json({ found: true, data });
    } catch (error) {
      console.error("HOA lookup error:", error);
      res.status(500).json({ error: "Failed to lookup HOA data" });
    }
  });

  // Get HOA for customer
  app.get("/api/hoa/customer/:customerId", requireAuth, async (req, res) => {
    try {
      const { customerId } = req.params;
      const data = await getHOAForCustomer(customerId);

      if (!data) {
        return res.json({ found: false, message: "No HOA data linked to this customer" });
      }

      res.json({ found: true, data });
    } catch (error) {
      console.error("Get customer HOA error:", error);
      res.status(500).json({ error: "Failed to get customer HOA data" });
    }
  });

  // Report / correct HOA rules
  app.post("/api/hoa/report", requireAuth, async (req, res) => {
    try {
      const { hoaDataId, rules, amenities, hoaName, managementCompany, contactPhone, contactEmail, monthlyFee } = req.body;

      if (!hoaDataId) {
        return res.status(400).json({ error: "hoaDataId is required" });
      }

      const updated = await enrichHOAFromProReport(hoaDataId, {
        rules,
        amenities,
        hoaName,
        managementCompany,
        contactPhone,
        contactEmail,
        monthlyFee,
      });

      if (!updated) {
        return res.status(404).json({ error: "HOA data not found" });
      }

      res.json({ success: true, data: updated });
    } catch (error) {
      console.error("HOA report error:", error);
      res.status(500).json({ error: "Failed to update HOA data" });
    }
  });
}
