/**
 * Partner Inventory/Parts Procurement Routes
 * 
 * Endpoints:
 * - GET /api/partners/:slug/inventory — current inventory
 * - POST /api/partners/:slug/inventory — add item
 * - PUT /api/partners/:slug/inventory/:id — update quantity
 * - GET /api/partners/:slug/inventory/low-stock — items below reorder threshold
 * - POST /api/partners/:slug/purchase-orders — create PO
 * - GET /api/partners/:slug/purchase-orders — list POs
 */

import { Router, type Express } from "express";
import { z } from "zod";
import { pool } from "../db";

export function registerPartnerInventoryRoutes(app: Express) {
  const router = Router();

  // ==========================================
  // GET /api/partners/:slug/inventory
  // ==========================================
  router.get("/:slug/inventory", async (req, res) => {
    const { slug } = req.params;
    const { 
      low_stock_only = "false", 
      supplier, 
      search,
      limit = "50", 
      offset = "0" 
    } = req.query;
    
    try {
      let whereClause = `WHERE partner_slug = $1`;
      const params = [slug];
      
      if (low_stock_only === "true") {
        whereClause += ` AND quantity_on_hand <= reorder_threshold`;
      }
      
      if (supplier && typeof supplier === 'string') {
        whereClause += ` AND supplier ILIKE $${params.length + 1}`;
        params.push(`%${supplier}%`);
      }
      
      if (search && typeof search === 'string') {
        whereClause += ` AND (part_name ILIKE $${params.length + 1} OR part_number ILIKE $${params.length + 1})`;
        params.push(`%${search}%`);
      }
      
      const result = await pool.query(
        `SELECT 
           *,
           CASE 
             WHEN quantity_on_hand <= 0 THEN 'out_of_stock'
             WHEN quantity_on_hand <= reorder_threshold THEN 'low_stock'
             ELSE 'in_stock'
           END as stock_status,
           quantity_on_hand * unit_cost as total_value
         FROM partner_inventory
         ${whereClause}
         ORDER BY part_name
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      );
      
      // Get inventory summary
      const summaryResult = await pool.query(
        `SELECT 
           COUNT(*) as total_items,
           COUNT(CASE WHEN quantity_on_hand <= 0 THEN 1 END) as out_of_stock,
           COUNT(CASE WHEN quantity_on_hand > 0 AND quantity_on_hand <= reorder_threshold THEN 1 END) as low_stock,
           COALESCE(SUM(quantity_on_hand * unit_cost), 0) as total_inventory_value
         FROM partner_inventory
         WHERE partner_slug = $1`,
        [slug]
      );
      
      res.json({
        success: true,
        inventory: result.rows,
        count: result.rows.length,
        summary: summaryResult.rows[0]
      });
    } catch (err: any) {
      console.error("Error fetching inventory:", err);
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });

  // ==========================================
  // POST /api/partners/:slug/inventory
  // ==========================================
  const addInventoryItemSchema = z.object({
    part_name: z.string().min(1),
    part_number: z.string().optional(),
    supplier: z.string().optional(),
    quantity_on_hand: z.number().min(0).default(0),
    reorder_threshold: z.number().min(1).default(5),
    unit_cost: z.number().min(0).default(0)
  });

  router.post("/:slug/inventory", async (req, res) => {
    const { slug } = req.params;
    
    try {
      const validated = addInventoryItemSchema.parse(req.body);
      
      const result = await pool.query(
        `INSERT INTO partner_inventory 
         (partner_slug, part_name, part_number, supplier, quantity_on_hand, reorder_threshold, unit_cost)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          slug,
          validated.part_name,
          validated.part_number,
          validated.supplier,
          validated.quantity_on_hand,
          validated.reorder_threshold,
          validated.unit_cost
        ]
      );
      
      const item = result.rows[0];
      
      res.json({
        success: true,
        item: {
          ...item,
          stock_status: item.quantity_on_hand <= 0 ? 'out_of_stock' : 
                      item.quantity_on_hand <= item.reorder_threshold ? 'low_stock' : 'in_stock',
          total_value: item.quantity_on_hand * item.unit_cost
        }
      });
    } catch (err: any) {
      if (err.name === "ZodError") {
        return res.status(400).json({ error: "Invalid request", details: err.errors });
      }
      console.error("Error adding inventory item:", err);
      res.status(500).json({ error: "Failed to add inventory item" });
    }
  });

  // ==========================================
  // PUT /api/partners/:slug/inventory/:id
  // ==========================================
  const updateInventorySchema = z.object({
    part_name: z.string().min(1).optional(),
    part_number: z.string().optional(),
    supplier: z.string().optional(),
    quantity_on_hand: z.number().min(0).optional(),
    reorder_threshold: z.number().min(1).optional(),
    unit_cost: z.number().min(0).optional(),
    adjustment_reason: z.string().optional() // For quantity adjustments
  });

  router.put("/:slug/inventory/:id", async (req, res) => {
    const { slug, id } = req.params;
    
    try {
      const validated = updateInventorySchema.parse(req.body);
      const updateFields = Object.keys(validated).filter(key => 
        key !== 'adjustment_reason' && validated[key as keyof typeof validated] !== undefined
      );
      
      if (updateFields.length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }
      
      const setClause = updateFields.map((field, index) => `${field} = $${index + 3}`).join(", ");
      const values = updateFields.map(field => validated[field as keyof typeof validated]);
      
      const result = await pool.query(
        `UPDATE partner_inventory 
         SET ${setClause}, updated_at = NOW()
         WHERE id = $1 AND partner_slug = $2
         RETURNING *`,
        [id, slug, ...values]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Inventory item not found" });
      }
      
      const item = result.rows[0];
      
      res.json({
        success: true,
        item: {
          ...item,
          stock_status: item.quantity_on_hand <= 0 ? 'out_of_stock' : 
                      item.quantity_on_hand <= item.reorder_threshold ? 'low_stock' : 'in_stock',
          total_value: item.quantity_on_hand * item.unit_cost
        }
      });
    } catch (err: any) {
      if (err.name === "ZodError") {
        return res.status(400).json({ error: "Invalid request", details: err.errors });
      }
      console.error("Error updating inventory item:", err);
      res.status(500).json({ error: "Failed to update inventory item" });
    }
  });

  // ==========================================
  // GET /api/partners/:slug/inventory/low-stock
  // ==========================================
  router.get("/:slug/inventory/low-stock", async (req, res) => {
    const { slug } = req.params;
    
    try {
      const result = await pool.query(
        `SELECT 
           *,
           CASE 
             WHEN quantity_on_hand <= 0 THEN 'out_of_stock'
             WHEN quantity_on_hand <= reorder_threshold THEN 'low_stock'
           END as stock_status,
           reorder_threshold - quantity_on_hand as reorder_quantity
         FROM partner_inventory
         WHERE partner_slug = $1 
         AND quantity_on_hand <= reorder_threshold
         ORDER BY 
           CASE WHEN quantity_on_hand <= 0 THEN 0 ELSE 1 END,
           quantity_on_hand ASC`,
        [slug]
      );
      
      const outOfStock = result.rows.filter(item => item.quantity_on_hand <= 0);
      const lowStock = result.rows.filter(item => item.quantity_on_hand > 0);
      
      res.json({
        success: true,
        lowStockItems: result.rows,
        count: result.rows.length,
        breakdown: {
          outOfStock: outOfStock.length,
          lowStock: lowStock.length
        }
      });
    } catch (err: any) {
      console.error("Error fetching low stock items:", err);
      res.status(500).json({ error: "Failed to fetch low stock items" });
    }
  });

  // ==========================================
  // POST /api/partners/:slug/purchase-orders
  // ==========================================
  const createPurchaseOrderSchema = z.object({
    supplier: z.string().min(1),
    items: z.array(z.object({
      inventory_id: z.number(),
      part_name: z.string(),
      part_number: z.string().optional(),
      quantity: z.number().min(1),
      unit_cost: z.number().min(0)
    })).min(1),
    notes: z.string().optional()
  });

  router.post("/:slug/purchase-orders", async (req, res) => {
    const { slug } = req.params;
    
    try {
      const validated = createPurchaseOrderSchema.parse(req.body);
      
      // Calculate total cost
      const totalCost = validated.items.reduce((sum, item) => 
        sum + (item.quantity * item.unit_cost), 0
      );
      
      // Create purchase order
      const result = await pool.query(
        `INSERT INTO partner_purchase_orders 
         (partner_slug, supplier, items, total_cost)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [slug, validated.supplier, JSON.stringify(validated.items), totalCost]
      );
      
      res.json({
        success: true,
        purchaseOrder: result.rows[0]
      });
    } catch (err: any) {
      if (err.name === "ZodError") {
        return res.status(400).json({ error: "Invalid request", details: err.errors });
      }
      console.error("Error creating purchase order:", err);
      res.status(500).json({ error: "Failed to create purchase order" });
    }
  });

  // ==========================================
  // GET /api/partners/:slug/purchase-orders
  // ==========================================
  router.get("/:slug/purchase-orders", async (req, res) => {
    const { slug } = req.params;
    const { 
      status, 
      supplier,
      limit = "20", 
      offset = "0" 
    } = req.query;
    
    try {
      let whereClause = `WHERE partner_slug = $1`;
      const params = [slug];
      
      if (status && typeof status === 'string') {
        whereClause += ` AND status = $${params.length + 1}`;
        params.push(status);
      }
      
      if (supplier && typeof supplier === 'string') {
        whereClause += ` AND supplier ILIKE $${params.length + 1}`;
        params.push(`%${supplier}%`);
      }
      
      const result = await pool.query(
        `SELECT * FROM partner_purchase_orders
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      );
      
      // Get summary stats
      const statsResult = await pool.query(
        `SELECT 
           status,
           COUNT(*) as count,
           COALESCE(SUM(total_cost), 0) as total_cost
         FROM partner_purchase_orders
         WHERE partner_slug = $1
         GROUP BY status`,
        [slug]
      );
      
      res.json({
        success: true,
        purchaseOrders: result.rows,
        count: result.rows.length,
        stats: statsResult.rows
      });
    } catch (err: any) {
      console.error("Error fetching purchase orders:", err);
      res.status(500).json({ error: "Failed to fetch purchase orders" });
    }
  });

  // ==========================================
  // PUT /api/partners/:slug/purchase-orders/:id/status
  // ==========================================
  const updatePOStatusSchema = z.object({
    status: z.enum(['draft', 'ordered', 'received']),
    received_items: z.array(z.object({
      inventory_id: z.number(),
      quantity_received: z.number().min(0)
    })).optional()
  });

  router.put("/:slug/purchase-orders/:id/status", async (req, res) => {
    const { slug, id } = req.params;
    
    try {
      const validated = updatePOStatusSchema.parse(req.body);
      
      // Update purchase order status
      const updateFields = ['status = $3'];
      const values = [id, slug, validated.status];
      
      if (validated.status === 'ordered') {
        updateFields.push('ordered_at = NOW()');
      } else if (validated.status === 'received') {
        updateFields.push('received_at = NOW()');
      }
      
      const result = await pool.query(
        `UPDATE partner_purchase_orders 
         SET ${updateFields.join(', ')}, updated_at = NOW()
         WHERE id = $1 AND partner_slug = $2
         RETURNING *`,
        values
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Purchase order not found" });
      }
      
      // If marking as received, update inventory quantities
      if (validated.status === 'received' && validated.received_items) {
        for (const item of validated.received_items) {
          await pool.query(
            `UPDATE partner_inventory 
             SET quantity_on_hand = quantity_on_hand + $3, last_ordered = NOW(), updated_at = NOW()
             WHERE id = $1 AND partner_slug = $2`,
            [item.inventory_id, slug, item.quantity_received]
          );
        }
      }
      
      res.json({
        success: true,
        purchaseOrder: result.rows[0]
      });
    } catch (err: any) {
      if (err.name === "ZodError") {
        return res.status(400).json({ error: "Invalid request", details: err.errors });
      }
      console.error("Error updating purchase order:", err);
      res.status(500).json({ error: "Failed to update purchase order" });
    }
  });

  // ==========================================
  // GET /api/partners/:slug/inventory/suppliers
  // ==========================================
  router.get("/:slug/inventory/suppliers", async (req, res) => {
    const { slug } = req.params;
    
    try {
      const result = await pool.query(
        `SELECT 
           supplier,
           COUNT(*) as items_count,
           COALESCE(SUM(quantity_on_hand * unit_cost), 0) as total_value,
           AVG(unit_cost) as avg_unit_cost
         FROM partner_inventory
         WHERE partner_slug = $1 AND supplier IS NOT NULL
         GROUP BY supplier
         ORDER BY items_count DESC`,
        [slug]
      );
      
      res.json({
        success: true,
        suppliers: result.rows,
        count: result.rows.length
      });
    } catch (err: any) {
      console.error("Error fetching suppliers:", err);
      res.status(500).json({ error: "Failed to fetch suppliers" });
    }
  });

  // ==========================================
  // DELETE /api/partners/:slug/inventory/:id
  // ==========================================
  router.delete("/:slug/inventory/:id", async (req, res) => {
    const { slug, id } = req.params;
    
    try {
      const result = await pool.query(
        `DELETE FROM partner_inventory 
         WHERE id = $1 AND partner_slug = $2
         RETURNING *`,
        [id, slug]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Inventory item not found" });
      }
      
      res.json({
        success: true,
        deleted: result.rows[0]
      });
    } catch (err: any) {
      console.error("Error deleting inventory item:", err);
      res.status(500).json({ error: "Failed to delete inventory item" });
    }
  });

  // ==========================================
  // POST /api/partners/:slug/inventory/bulk-update
  // ==========================================
  const bulkUpdateSchema = z.object({
    updates: z.array(z.object({
      id: z.number(),
      quantity_on_hand: z.number().min(0).optional(),
      unit_cost: z.number().min(0).optional(),
      reorder_threshold: z.number().min(1).optional()
    })).min(1)
  });

  router.post("/:slug/inventory/bulk-update", async (req, res) => {
    const { slug } = req.params;
    
    try {
      const validated = bulkUpdateSchema.parse(req.body);
      const updated = [];
      
      // Process each update in a transaction
      await pool.query('BEGIN');
      
      try {
        for (const update of validated.updates) {
          const updateFields = Object.keys(update).filter(key => 
            key !== 'id' && update[key as keyof typeof update] !== undefined
          );
          
          if (updateFields.length > 0) {
            const setClause = updateFields.map((field, index) => `${field} = $${index + 3}`).join(", ");
            const values = updateFields.map(field => update[field as keyof typeof update]);
            
            const result = await pool.query(
              `UPDATE partner_inventory 
               SET ${setClause}, updated_at = NOW()
               WHERE id = $1 AND partner_slug = $2
               RETURNING *`,
              [update.id, slug, ...values]
            );
            
            if (result.rows.length > 0) {
              updated.push(result.rows[0]);
            }
          }
        }
        
        await pool.query('COMMIT');
        
        res.json({
          success: true,
          updated: updated.length,
          items: updated
        });
      } catch (updateErr) {
        await pool.query('ROLLBACK');
        throw updateErr;
      }
    } catch (err: any) {
      if (err.name === "ZodError") {
        return res.status(400).json({ error: "Invalid request", details: err.errors });
      }
      console.error("Error bulk updating inventory:", err);
      res.status(500).json({ error: "Failed to bulk update inventory" });
    }
  });

  app.use("/api/partners", router);
}