/**
 * Appliance Profile Services
 *
 * Garage door profiles, water heater profiles, maintenance log, DIY suggestions.
 */

import { pool } from "../db.js";

// ─── Garage Door ─────────────────────────────────────────────────────────────

export async function getGarageDoorProfile(customerId: string): Promise<any | null> {
  const { rows } = await pool.query(
    `SELECT * FROM garage_door_profiles WHERE customer_id = $1`,
    [customerId]
  );
  return rows[0] || null;
}

export async function updateGarageDoorProfile(customerId: string, data: Record<string, any>): Promise<any> {
  const existing = await getGarageDoorProfile(customerId);

  if (existing) {
    const fields = Object.keys(data).filter(k => k !== "customerId");
    if (fields.length === 0) return existing;

    const setClauses = fields.map((f, i) => `${toSnake(f)} = $${i + 2}`);
    const values = fields.map(f => data[f]);

    const { rows } = await pool.query(
      `UPDATE garage_door_profiles SET ${setClauses.join(", ")} WHERE customer_id = $1 RETURNING *`,
      [customerId, ...values]
    );
    return rows[0];
  } else {
    const fields = { customer_id: customerId, ...Object.fromEntries(Object.entries(data).map(([k, v]) => [toSnake(k), v])) };
    const keys = Object.keys(fields);
    const placeholders = keys.map((_, i) => `$${i + 1}`);
    const { rows } = await pool.query(
      `INSERT INTO garage_door_profiles (${keys.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`,
      Object.values(fields)
    );
    return rows[0];
  }
}

// ─── Water Heater ────────────────────────────────────────────────────────────

export async function getWaterHeaterProfile(customerId: string): Promise<any | null> {
  const { rows } = await pool.query(
    `SELECT * FROM water_heater_profiles WHERE customer_id = $1`,
    [customerId]
  );
  return rows[0] || null;
}

export async function updateWaterHeaterProfile(customerId: string, data: Record<string, any>): Promise<any> {
  const existing = await getWaterHeaterProfile(customerId);

  if (existing) {
    const fields = Object.keys(data).filter(k => k !== "customerId");
    if (fields.length === 0) return existing;

    const setClauses = fields.map((f, i) => `${toSnake(f)} = $${i + 2}`);
    const values = fields.map(f => data[f]);

    const { rows } = await pool.query(
      `UPDATE water_heater_profiles SET ${setClauses.join(", ")} WHERE customer_id = $1 RETURNING *`,
      [customerId, ...values]
    );
    return rows[0];
  } else {
    const fields = { customer_id: customerId, ...Object.fromEntries(Object.entries(data).map(([k, v]) => [toSnake(k), v])) };
    const keys = Object.keys(fields);
    const placeholders = keys.map((_, i) => `$${i + 1}`);
    const { rows } = await pool.query(
      `INSERT INTO water_heater_profiles (${keys.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`,
      Object.values(fields)
    );
    return rows[0];
  }
}

// ─── Maintenance Log ─────────────────────────────────────────────────────────

export async function getMaintenanceLog(customerId: string, applianceType?: string): Promise<any[]> {
  if (applianceType) {
    const { rows } = await pool.query(
      `SELECT * FROM home_maintenance_log WHERE customer_id = $1 AND appliance_or_system ILIKE $2 ORDER BY performed_at DESC`,
      [customerId, `%${applianceType}%`]
    );
    return rows;
  }
  const { rows } = await pool.query(
    `SELECT * FROM home_maintenance_log WHERE customer_id = $1 ORDER BY performed_at DESC`,
    [customerId]
  );
  return rows;
}

export async function addMaintenanceEntry(customerId: string, entry: {
  maintenanceType: string;
  applianceOrSystem: string;
  description?: string;
  performedBy?: string;
  cost?: number;
  receiptId?: string;
  photos?: any[];
  nextDueDate?: string;
  frequency?: string;
  notes?: string;
  performedAt: string;
}): Promise<any> {
  const { rows } = await pool.query(
    `INSERT INTO home_maintenance_log
     (customer_id, maintenance_type, appliance_or_system, description, performed_by, cost, receipt_id, photos, next_due_date, frequency, notes, performed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      customerId,
      entry.maintenanceType,
      entry.applianceOrSystem,
      entry.description || null,
      entry.performedBy || "self",
      entry.cost || null,
      entry.receiptId || null,
      JSON.stringify(entry.photos || []),
      entry.nextDueDate || null,
      entry.frequency || null,
      entry.notes || null,
      entry.performedAt,
    ]
  );
  return rows[0];
}

/**
 * Get maintenance items that are overdue or coming due within 30 days
 */
export async function getMaintenanceDue(customerId: string): Promise<{ overdue: any[]; upcoming: any[] }> {
  const now = new Date().toISOString();
  const thirtyDaysOut = new Date();
  thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);

  const { rows: overdue } = await pool.query(
    `SELECT * FROM home_maintenance_log
     WHERE customer_id = $1 AND next_due_date IS NOT NULL AND next_due_date < $2
     ORDER BY next_due_date ASC`,
    [customerId, now]
  );

  const { rows: upcoming } = await pool.query(
    `SELECT * FROM home_maintenance_log
     WHERE customer_id = $1 AND next_due_date IS NOT NULL AND next_due_date >= $2 AND next_due_date <= $3
     ORDER BY next_due_date ASC`,
    [customerId, now, thirtyDaysOut.toISOString()]
  );

  // Also check water heater flush schedule
  const wh = await getWaterHeaterProfile(customerId);
  if (wh && wh.last_flushed) {
    const lastFlushed = new Date(wh.last_flushed);
    const nextFlush = new Date(lastFlushed);
    nextFlush.setMonth(nextFlush.getMonth() + (wh.flush_frequency || 12));
    if (nextFlush < new Date()) {
      overdue.push({
        appliance_or_system: "Water Heater",
        maintenance_type: "cleaning",
        description: "Water heater flush overdue",
        next_due_date: nextFlush.toISOString(),
        frequency: `${wh.flush_frequency || 12} months`,
      });
    } else if (nextFlush <= thirtyDaysOut) {
      upcoming.push({
        appliance_or_system: "Water Heater",
        maintenance_type: "cleaning",
        description: "Water heater flush due soon",
        next_due_date: nextFlush.toISOString(),
        frequency: `${wh.flush_frequency || 12} months`,
      });
    }
  }

  return { overdue, upcoming };
}

/**
 * Based on home profile, suggest what the customer should buy
 */
export async function getDIYPurchaseSuggestions(customerId: string): Promise<any[]> {
  const suggestions: any[] = [];

  // Check water heater
  const wh = await getWaterHeaterProfile(customerId);
  if (wh) {
    if (wh.last_flushed) {
      const lastFlushed = new Date(wh.last_flushed);
      const monthsSince = Math.floor((Date.now() - lastFlushed.getTime()) / (1000 * 60 * 60 * 24 * 30));
      if (monthsSince >= (wh.flush_frequency || 12)) {
        suggestions.push({
          category: "Water Heater Maintenance",
          item: "Garden hose + flush kit",
          reason: `Your water heater hasn't been flushed in ${monthsSince} months. Recommended every ${wh.flush_frequency || 12} months.`,
          estimatedCost: "$15-25",
          store: "lowes",
        });
      }
    }
    if (wh.year_installed && new Date().getFullYear() - wh.year_installed >= 5 && !wh.anode_rod_replaced) {
      suggestions.push({
        category: "Water Heater Maintenance",
        item: `Anode rod for ${wh.brand || "your"} ${wh.model || "water heater"}`,
        reason: "Anode rods should be checked/replaced every 3-5 years to prevent tank corrosion.",
        estimatedCost: "$20-40",
        store: "lowes",
      });
    }
  }

  // Check garage door
  const gd = await getGarageDoorProfile(customerId);
  if (gd) {
    if (gd.last_serviced) {
      const monthsSince = Math.floor((Date.now() - new Date(gd.last_serviced).getTime()) / (1000 * 60 * 60 * 24 * 30));
      if (monthsSince >= 12) {
        suggestions.push({
          category: "Garage Door Maintenance",
          item: "Garage door lubricant (white lithium grease)",
          reason: `Garage door hasn't been serviced in ${monthsSince} months. Lubricate tracks, rollers, and springs annually.`,
          estimatedCost: "$5-10",
          store: "home_depot",
        });
      }
    }
  }

  // Check maintenance log for HVAC filter patterns
  const { rows: hvacLogs } = await pool.query(
    `SELECT * FROM home_maintenance_log
     WHERE customer_id = $1 AND appliance_or_system ILIKE '%hvac%' AND maintenance_type = 'filter_change'
     ORDER BY performed_at DESC LIMIT 1`,
    [customerId]
  );
  if (hvacLogs.length > 0) {
    const lastChange = new Date(hvacLogs[0].performed_at);
    const monthsSince = Math.floor((Date.now() - lastChange.getTime()) / (1000 * 60 * 60 * 24 * 30));
    if (monthsSince >= 3) {
      suggestions.push({
        category: "HVAC Maintenance",
        item: "HVAC air filter (check your current size - common sizes: 20x25x1, 16x25x1, 20x20x1 MERV 13)",
        reason: `Last filter change was ${monthsSince} months ago. Replace every 1-3 months.`,
        estimatedCost: "$15-30",
        store: "home_depot",
      });
    }
  }

  return suggestions;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}
