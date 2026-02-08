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

      const item = await storage.createMarketplaceItem({
        proId: req.user.id,
        serviceRequestId,
        title,
        description,
        price,
        photos: photos || [],
        category,
        condition,
        location,
      });

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

      const items = await storage.getMarketplaceItems({
        category: category as string | undefined,
        condition: condition as string | undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        location: location as string | undefined,
        status: "available",
      });

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

      const items = await storage.getMarketplaceItemsByPro(req.params.proId);
      const stats = await storage.getProMarketplaceStats(req.params.proId);

      res.json({
        ...stats,
        items,
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

      const item = await storage.getMarketplaceItem(req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }

      if (item.proId !== req.user.id) {
        return res.status(403).json({ error: "Unauthorized - not your item" });
      }

      await storage.updateMarketplaceItem(req.params.id, {
        status: "sold",
        buyerId,
        soldAt: new Date().toISOString(),
      });

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

      const item = await storage.getMarketplaceItem(req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }

      if (item.proId !== req.user.id) {
        return res.status(403).json({ error: "Unauthorized - not your item" });
      }

      await storage.deleteMarketplaceItem(req.params.id);
      res.json({ success: true, message: "Listing deleted" });
    } catch (error) {
      console.error("Delete marketplace item error:", error);
      res.status(500).json({ error: "Failed to delete listing" });
    }
  });

  // Track view (for analytics)
  app.post("/api/marketplace/items/:id/view", async (req, res) => {
    try {
      await storage.incrementMarketplaceItemViews(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Track view error:", error);
      res.status(500).json({ error: "Failed to track view" });
    }
  });
}
