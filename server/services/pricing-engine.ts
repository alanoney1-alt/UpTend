/**
 * Centralized Pricing Engine
 *
 * ALL prices come from the price_matrix table in Supabase.
 * George and all APIs call this - no hardcoded prices anywhere.
 */

import { pool } from "../db.js";

// ─── Types ───────────────────────────────────────

export interface QuoteOptions {
  size?: string;       // small/medium/large/xl
  scope?: string;      // basic/standard/deep/premium
  zip?: string;
  isRush?: boolean;
  isSeasonal?: boolean; // auto-detect if not provided
  bundledWith?: string[];
  rooms?: number;      // for per_room pricing
  hours?: number;      // for hourly pricing
  sqft?: number;       // for per_sqft pricing
}

export interface QuoteResult {
  lowEstimate: number;
  highEstimate: number;
  guaranteedCeiling: number;
  baseRate: number;
  unit: string;
  appliedMultipliers: Record<string, number>;
  breakdown: Record<string, number>;
}

export interface ServiceTier {
  sizeCategory: string;
  scopeLevel: string;
  baseRate: number;
  unit: string;
  minPrice: number;
  maxPrice: number;
  estimatedDuration: number | null;
}

// ─── Core Functions ──────────────────────────────

/**
 * Get a full quote with all multipliers applied.
 */
export async function getQuote(serviceType: string, options: QuoteOptions = {}): Promise<QuoteResult> {
  const size = options.size || "medium";
  const scope = options.scope || "standard";

  // 1. Get base rate from price_matrix
  const { rows } = await pool.query(
    `SELECT * FROM price_matrix
     WHERE service_type = $1 AND size_category = $2 AND scope_level = $3
     LIMIT 1`,
    [serviceType, size, scope]
  );

  // Fallback: try just service + size, any scope
  let row = rows[0];
  if (!row) {
    const fallback = await pool.query(
      `SELECT * FROM price_matrix WHERE service_type = $1 AND size_category = $2 LIMIT 1`,
      [serviceType, size]
    );
    row = fallback.rows[0];
  }
  // Fallback: try just service, any tier
  if (!row) {
    const fallback2 = await pool.query(
      `SELECT * FROM price_matrix WHERE service_type = $1 LIMIT 1`,
      [serviceType]
    );
    row = fallback2.rows[0];
  }

  if (!row) {
    throw new Error(`No pricing found for service: ${serviceType}`);
  }

  const baseRate = parseFloat(row.base_rate);
  const unit = row.unit as string;
  const multipliers: Record<string, number> = {};
  const breakdown: Record<string, number> = {};
  let price = baseRate;

  // Quantity multiplier (rooms, hours, sqft)
  if (unit === "per_room" && options.rooms) {
    price = baseRate * options.rooms;
    breakdown["rooms"] = options.rooms;
  } else if (unit === "hourly" && options.hours) {
    price = baseRate * options.hours;
    breakdown["hours"] = options.hours;
  } else if (unit === "per_sqft" && options.sqft) {
    price = baseRate * options.sqft;
    breakdown["sqft"] = options.sqft;
  }

  breakdown["basePrice"] = price;

  // 2. Zone multiplier
  if (options.zip) {
    const zoneResult = await pool.query(
      `SELECT multiplier FROM pricing_zones WHERE zip_code = $1`,
      [options.zip]
    );
    if (zoneResult.rows[0]) {
      const zm = parseFloat(zoneResult.rows[0].multiplier);
      if (zm !== 1.0) {
        multipliers["zone"] = zm;
        price *= zm;
        breakdown["zoneAdjustment"] = price - breakdown["basePrice"];
      }
    }
  }

  // 3. Seasonal multiplier
  const currentMonth = new Date().getMonth() + 1;
  if (options.isSeasonal !== false) {
    const seasonResult = await pool.query(
      `SELECT multiplier, reason FROM seasonal_rates WHERE service_type = $1 AND month = $2`,
      [serviceType, currentMonth]
    );
    if (seasonResult.rows[0]) {
      const sm = parseFloat(seasonResult.rows[0].multiplier);
      if (sm !== 1.0) {
        multipliers["seasonal"] = sm;
        multipliers["seasonalReason"] = seasonResult.rows[0].reason;
        price *= sm;
        breakdown["seasonalAdjustment"] = price - (breakdown["basePrice"] + (breakdown["zoneAdjustment"] || 0));
      }
    }
  }

  // 4. Rush multiplier (same-day)
  if (options.isRush) {
    const rushMult = parseFloat(row.rush_multiplier) || 1.5;
    multipliers["rush"] = rushMult;
    price *= rushMult;
    breakdown["rushSurcharge"] = price - Object.values(breakdown).reduce((s, v) => s + v, 0);
  }

  // 5. Bundle discount
  if (options.bundledWith && options.bundledWith.length > 0) {
    const totalServices = options.bundledWith.length + 1;
    const bundleResult = await pool.query(
      `SELECT discount_percent FROM bundle_discounts
       WHERE min_services <= $1
       ORDER BY min_services DESC LIMIT 1`,
      [totalServices]
    );
    if (bundleResult.rows[0]) {
      const discountPct = parseFloat(bundleResult.rows[0].discount_percent) / 100;
      multipliers["bundleDiscount"] = discountPct;
      const discount = price * discountPct;
      price -= discount;
      breakdown["bundleDiscount"] = -discount;
    }
  }

  // Min/max enforcement
  const minPrice = row.min_price ? parseFloat(row.min_price) : 0;
  const maxPrice = row.max_price ? parseFloat(row.max_price) : Infinity;

  const lowEstimate = Math.max(Math.round(price * 100) / 100, minPrice);
  const highEstimate = Math.min(Math.round(price * 1.15 * 100) / 100, maxPrice * 1.15);
  const guaranteedCeiling = Math.round(highEstimate * 1.15 * 100) / 100;

  return {
    lowEstimate,
    highEstimate,
    guaranteedCeiling,
    baseRate,
    unit,
    appliedMultipliers: multipliers,
    breakdown,
  };
}

/**
 * Get all pricing tiers for a specific service.
 */
export async function getServicePricing(serviceType: string): Promise<ServiceTier[]> {
  const { rows } = await pool.query(
    `SELECT size_category, scope_level, base_rate, unit, min_price, max_price, estimated_duration
     FROM price_matrix WHERE service_type = $1
     ORDER BY base_rate ASC`,
    [serviceType]
  );

  return rows.map((r: any) => ({
    sizeCategory: r.size_category,
    scopeLevel: r.scope_level,
    baseRate: parseFloat(r.base_rate),
    unit: r.unit,
    minPrice: r.min_price ? parseFloat(r.min_price) : 0,
    maxPrice: r.max_price ? parseFloat(r.max_price) : 0,
    estimatedDuration: r.estimated_duration,
  }));
}

/**
 * Get full price menu across all services.
 */
export async function getAllPricing(): Promise<Record<string, ServiceTier[]>> {
  const { rows } = await pool.query(
    `SELECT service_type, size_category, scope_level, base_rate, unit, min_price, max_price, estimated_duration
     FROM price_matrix ORDER BY service_type, base_rate ASC`
  );

  const menu: Record<string, ServiceTier[]> = {};
  for (const r of rows) {
    const svc = r.service_type as string;
    if (!menu[svc]) menu[svc] = [];
    menu[svc].push({
      sizeCategory: r.size_category,
      scopeLevel: r.scope_level,
      baseRate: parseFloat(r.base_rate),
      unit: r.unit,
      minPrice: r.min_price ? parseFloat(r.min_price) : 0,
      maxPrice: r.max_price ? parseFloat(r.max_price) : 0,
      estimatedDuration: r.estimated_duration,
    });
  }

  return menu;
}

/**
 * Calculate bundle discount for a set of services.
 */
export async function getBundleDiscount(serviceTypes: string[]): Promise<{
  totalServices: number;
  discountPercent: number;
  bundleName: string | null;
  estimatedSavings: number;
  individualTotals: Record<string, number>;
}> {
  const totalServices = serviceTypes.length;

  // Get bundle discount tier
  const { rows: bundleRows } = await pool.query(
    `SELECT bundle_name, discount_percent FROM bundle_discounts
     WHERE min_services <= $1
     ORDER BY min_services DESC LIMIT 1`,
    [totalServices]
  );

  const discountPct = bundleRows[0] ? parseFloat(bundleRows[0].discount_percent) : 0;
  const bundleName = bundleRows[0]?.bundle_name || null;

  // Get base prices for each service (cheapest tier)
  const individualTotals: Record<string, number> = {};
  let totalPrice = 0;

  for (const svc of serviceTypes) {
    const { rows } = await pool.query(
      `SELECT base_rate FROM price_matrix WHERE service_type = $1 ORDER BY base_rate ASC LIMIT 1`,
      [svc]
    );
    const price = rows[0] ? parseFloat(rows[0].base_rate) : 0;
    individualTotals[svc] = price;
    totalPrice += price;
  }

  const estimatedSavings = Math.round(totalPrice * (discountPct / 100) * 100) / 100;

  return {
    totalServices,
    discountPercent: discountPct,
    bundleName,
    estimatedSavings,
    individualTotals,
  };
}

/**
 * Get guaranteed ceiling for a specific quote (locks it for booking).
 */
export async function getGuaranteedCeiling(serviceType: string, options: QuoteOptions = {}): Promise<{
  quoteId: string;
  ceiling: number;
  validUntil: string;
}> {
  const quote = await getQuote(serviceType, options);
  const quoteId = `ceil_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const validUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h

  return {
    quoteId,
    ceiling: quote.guaranteedCeiling,
    validUntil,
  };
}
