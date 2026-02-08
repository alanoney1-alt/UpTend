import type { Express } from "express";
import { storage } from "../../storage";

export function registerMarketplaceRoutes(app: Express) {
  // ==========================================
  // PRO MARKETPLACE - Item Listings
  // ==========================================

  // Create new marketplace listing
  app.post("/api/marketplace/items", async (req, res) => {
    try {
      if (!req.user || req.user.role !== "hauler") {
        return res.status(403).json({ error: "Unauthorized - Pro access only" });
      }

      const { serviceRequestId, title, description, price, photos, category, condition, location } = req.body;

      if (!title || !price) {
        return res.status(400).json({ error: "Title and price are required" });
      }

      // TODO: Implement createMarketplaceItem in storage
      const item = {
        id: crypto.randomUUID(),
        proId: req.user.id,
        serviceRequestId,
        title,
        description,
        price,
        photos: photos || [],
        category,
        condition,
        location,
        status: "available",
        postedAt: new Date().toISOString(),
        views: 0,
      };

      res.json(item);
    } catch (error) {
      console.error("Create marketplace item error:", error);
      res.status(500).json({ error: "Failed to create listing" });
    }
  });

  // Browse marketplace items (customer view)
  app.get("/api/marketplace/items", async (req, res) => {
    try {
      const { category, condition, minPrice, maxPrice, location } = req.query;

      // TODO: Implement getMarketplaceItems with filters in storage
      // For now, return mock data
      const items = [
        {
          id: "1",
          title: "Vintage Leather Couch - Great Condition",
          description: "3-seater leather couch, minor wear on armrests",
          price: 150,
          photos: [],
          category: "furniture",
          condition: "good",
          location: "Orlando, FL",
          proName: "Mike's Hauling",
          proRating: 4.8,
          postedAt: "2024-01-10",
          views: 45,
        },
      ];

      res.json(items);
    } catch (error) {
      console.error("Get marketplace items error:", error);
      res.status(500).json({ error: "Failed to fetch items" });
    }
  });

  // Get Pro's marketplace listings
  app.get("/api/marketplace/items/pro/:proId", async (req, res) => {
    try {
      if (!req.user || req.user.role !== "hauler") {
        return res.status(403).json({ error: "Unauthorized" });
      }

      if (req.user.id !== req.params.proId) {
        return res.status(403).json({ error: "Unauthorized - not your listings" });
      }

      // TODO: Implement getMarketplaceItemsByPro in storage
      res.json({
        totalListings: 3,
        activeListings: 2,
        soldListings: 1,
        totalEarnings: 250,
        items: [],
      });
    } catch (error) {
      console.error("Get Pro marketplace items error:", error);
      res.status(500).json({ error: "Failed to fetch listings" });
    }
  });

  // Mark item as sold
  app.patch("/api/marketplace/items/:id/sold", async (req, res) => {
    try {
      if (!req.user || req.user.role !== "hauler") {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const { buyerId } = req.body;

      // TODO: Implement updateMarketplaceItem in storage
      res.json({
        success: true,
        message: "Item marked as sold. Earnings will appear in your dashboard.",
      });
    } catch (error) {
      console.error("Mark item sold error:", error);
      res.status(500).json({ error: "Failed to update item" });
    }
  });

  // Delete listing
  app.delete("/api/marketplace/items/:id", async (req, res) => {
    try {
      if (!req.user || req.user.role !== "hauler") {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // TODO: Implement deleteMarketplaceItem in storage
      res.json({ success: true, message: "Listing deleted" });
    } catch (error) {
      console.error("Delete marketplace item error:", error);
      res.status(500).json({ error: "Failed to delete listing" });
    }
  });

  // Track view (for analytics)
  app.post("/api/marketplace/items/:id/view", async (req, res) => {
    try {
      // TODO: Implement incrementViews in storage
      res.json({ success: true });
    } catch (error) {
      console.error("Track view error:", error);
      res.status(500).json({ error: "Failed to track view" });
    }
  });
}
