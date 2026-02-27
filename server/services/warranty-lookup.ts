/**
 * Manufacturer Warranty Lookup Service
 *
 * Static warranty database for major home appliance brands,
 * serial-number date decoding, and warranty status calculation.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WarrantyPeriod {
  component: string;        // e.g. "compressor", "parts", "labor", "tank", "structural"
  years: number;
  description?: string;
}

export interface BrandWarranty {
  brand: string;
  category: string;
  warranties: WarrantyPeriod[];
  registrationRequired?: boolean;
  transferable?: boolean;
  notes?: string;
}

export interface WarrantyResult {
  brand: string;
  model: string | null;
  serialNumber: string | null;
  category: string;
  estimatedManufactureDate: Date | null;
  warranties: Array<WarrantyPeriod & { status: "active" | "expiring_soon" | "expired" | "unknown"; expiresDate: string | null }>;
  overallStatus: "active" | "expiring_soon" | "expired" | "unknown";
  overallExpires: string | null;
  registrationRequired: boolean;
  transferable: boolean;
  notes: string | null;
  needsPurchaseDate: boolean;
}

// ─── Warranty Database ───────────────────────────────────────────────────────

const WARRANTY_DB: BrandWarranty[] = [
  // HVAC
  { brand: "Carrier",  category: "hvac", warranties: [{ component: "compressor", years: 10 }, { component: "parts", years: 5 }, { component: "labor", years: 1 }], registrationRequired: true, transferable: false },
  { brand: "Trane",    category: "hvac", warranties: [{ component: "compressor", years: 10 }, { component: "parts", years: 5 }, { component: "labor", years: 1 }], registrationRequired: true, transferable: false, notes: "Must register within 60 days of installation" },
  { brand: "Lennox",   category: "hvac", warranties: [{ component: "compressor", years: 10 }, { component: "parts", years: 5 }, { component: "labor", years: 1 }], registrationRequired: true, transferable: true },
  { brand: "Rheem",    category: "hvac", warranties: [{ component: "compressor", years: 10 }, { component: "parts", years: 5 }, { component: "labor", years: 1 }], registrationRequired: true, transferable: false },
  { brand: "Goodman",  category: "hvac", warranties: [{ component: "compressor", years: 10 }, { component: "parts", years: 5 }, { component: "labor", years: 1 }], registrationRequired: true, transferable: false, notes: "Unregistered units get 5yr compressor, 5yr parts" },

  // Water Heaters
  { brand: "Rheem",          category: "water_heater", warranties: [{ component: "tank", years: 6 }, { component: "parts", years: 1 }, { component: "labor", years: 1 }], registrationRequired: false, notes: "Tank warranty varies by model: 6, 8, 10, or 12 years" },
  { brand: "AO Smith",       category: "water_heater", warranties: [{ component: "tank", years: 6 }, { component: "parts", years: 1 }, { component: "labor", years: 1 }], registrationRequired: false, notes: "Premium models have 10-12yr tank warranty" },
  { brand: "Bradford White",  category: "water_heater", warranties: [{ component: "tank", years: 6 }, { component: "parts", years: 1 }, { component: "labor", years: 1 }], registrationRequired: false, notes: "Pro-installed only; 6-10yr tank depending on model" },

  // Appliances
  { brand: "GE",          category: "appliance", warranties: [{ component: "parts", years: 1 }, { component: "labor", years: 1 }], registrationRequired: false, transferable: true, notes: "GE Profile/Monogram may have extended coverage" },
  { brand: "Whirlpool",   category: "appliance", warranties: [{ component: "parts", years: 1 }, { component: "labor", years: 1 }], registrationRequired: false, transferable: true },
  { brand: "Samsung",     category: "appliance", warranties: [{ component: "parts", years: 1 }, { component: "labor", years: 1 }], registrationRequired: false, transferable: true, notes: "Some refrigerators have 5yr sealed system warranty" },
  { brand: "LG",          category: "appliance", warranties: [{ component: "parts", years: 1 }, { component: "labor", years: 1 }, { component: "compressor", years: 10, description: "Linear compressor (refrigerators)" }], registrationRequired: false, transferable: true },
  { brand: "Frigidaire",  category: "appliance", warranties: [{ component: "parts", years: 1 }, { component: "labor", years: 1 }], registrationRequired: false, transferable: true },
  { brand: "Maytag",      category: "appliance", warranties: [{ component: "parts", years: 1 }, { component: "labor", years: 1 }], registrationRequired: false, transferable: true, notes: "Some models have 10yr limited parts warranty" },
  { brand: "KitchenAid",  category: "appliance", warranties: [{ component: "parts", years: 1 }, { component: "labor", years: 1 }], registrationRequired: false, transferable: true },
  { brand: "Bosch",       category: "appliance", warranties: [{ component: "parts", years: 1 }, { component: "labor", years: 1 }], registrationRequired: false, transferable: true, notes: "Dishwashers may have 2yr full warranty in some regions" },

  // Roofing
  { brand: "GAF",            category: "roofing", warranties: [{ component: "structural", years: 50, description: "Lifetime shingle warranty" }, { component: "labor", years: 10, description: "Workmanship (with certified installer)" }], registrationRequired: true, transferable: true, notes: "Warranty depends on installer certification level" },
  { brand: "Owens Corning",  category: "roofing", warranties: [{ component: "structural", years: 50, description: "Lifetime limited shingle" }, { component: "labor", years: 10 }], registrationRequired: true, transferable: true },
  { brand: "CertainTeed",    category: "roofing", warranties: [{ component: "structural", years: 50 }, { component: "labor", years: 10 }], registrationRequired: true, transferable: true },

  // Plumbing
  { brand: "Moen",   category: "plumbing", warranties: [{ component: "parts", years: 99, description: "Limited lifetime warranty on faucets and showerheads" }], registrationRequired: false, transferable: false, notes: "Covers finish and function for original purchaser" },
  { brand: "Delta",  category: "plumbing", warranties: [{ component: "parts", years: 99, description: "Limited lifetime warranty on faucets" }], registrationRequired: false, transferable: false },
  { brand: "Kohler", category: "plumbing", warranties: [{ component: "parts", years: 99, description: "Limited lifetime warranty on faucets" }, { component: "labor", years: 1 }], registrationRequired: false, transferable: false },
];

// ─── Category defaults (when brand not found) ───────────────────────────────

const CATEGORY_DEFAULTS: Record<string, WarrantyPeriod[]> = {
  hvac:          [{ component: "compressor", years: 5 }, { component: "parts", years: 1 }],
  water_heater:  [{ component: "tank", years: 6 }, { component: "parts", years: 1 }],
  appliance:     [{ component: "parts", years: 1 }, { component: "labor", years: 1 }],
  roofing:       [{ component: "structural", years: 25 }],
  plumbing:      [{ component: "parts", years: 1 }],
};

// ─── Serial Number Date Decoding ─────────────────────────────────────────────

/**
 * Attempts to estimate manufacture date from serial number patterns.
 * Major brands encode dates in predictable positions.
 */
export function estimateManufactureDate(brand: string, serialNumber: string): Date | null {
  if (!serialNumber || serialNumber.length < 4) return null;

  const upper = serialNumber.toUpperCase().trim();
  const brandLower = (brand || "").toLowerCase();

  // Carrier / Bryant: first 2 digits = week, 3rd-4th = year (post-2000 format)
  // e.g., "0199..." → week 01, 1999; "3214..." → week 32, 2014
  if (["carrier", "bryant"].includes(brandLower)) {
    const week = parseInt(upper.slice(0, 2), 10);
    let year = parseInt(upper.slice(2, 4), 10);
    if (week >= 1 && week <= 52) {
      year = year < 50 ? 2000 + year : 1900 + year;
      const d = new Date(year, 0, 1);
      d.setDate(d.getDate() + (week - 1) * 7);
      return d;
    }
  }

  // Trane / American Standard: year letter + week digits
  // e.g., "B1234..." → 2002 week 12
  if (["trane", "american standard"].includes(brandLower)) {
    const yearLetters: Record<string, number> = {
      Y: 1999, A: 2000, B: 2001, C: 2002, D: 2003, E: 2004, F: 2005,
      G: 2006, H: 2007, J: 2008, K: 2009, L: 2010, M: 2011, N: 2012,
      P: 2013, R: 2014, S: 2015, T: 2016, U: 2017, V: 2018, W: 2019,
      X: 2020, Z: 2021,
    };
    const letterYear = yearLetters[upper[0]];
    if (letterYear) {
      const week = parseInt(upper.slice(1, 3), 10);
      if (week >= 1 && week <= 52) {
        const d = new Date(letterYear, 0, 1);
        d.setDate(d.getDate() + (week - 1) * 7);
        return d;
      }
      return new Date(letterYear, 0, 1);
    }
  }

  // Rheem / Ruud: first 4 digits MMYY or first letter = month, next 2 = year
  if (["rheem", "ruud"].includes(brandLower)) {
    // Try MMYY
    const mm = parseInt(upper.slice(0, 2), 10);
    let yy = parseInt(upper.slice(2, 4), 10);
    if (mm >= 1 && mm <= 12) {
      yy = yy < 50 ? 2000 + yy : 1900 + yy;
      return new Date(yy, mm - 1, 1);
    }
  }

  // Goodman / Amana: first 2 digits = year, next 2 = month
  if (["goodman", "amana"].includes(brandLower)) {
    let yy = parseInt(upper.slice(0, 2), 10);
    const mm = parseInt(upper.slice(2, 4), 10);
    if (mm >= 1 && mm <= 12) {
      yy = yy < 50 ? 2000 + yy : 1900 + yy;
      return new Date(yy, mm - 1, 1);
    }
  }

  // Lennox: first 2 chars = year code (58xx = 2005, 59xx = 2006, etc. OR 2-digit year)
  if (brandLower === "lennox") {
    let yy = parseInt(upper.slice(0, 2), 10);
    if (yy >= 50 && yy <= 99) return new Date(1900 + yy, 0, 1);
    if (yy >= 0 && yy <= 40) return new Date(2000 + yy, 0, 1);
  }

  // GE: first 2 letters encode month+year
  // Samsung, LG, Whirlpool, etc.: varying complex patterns
  // For these, try a generic "find a 4-digit year" approach
  const yearMatch = upper.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    return new Date(parseInt(yearMatch[0], 10), 0, 1);
  }

  return null;
}

// ─── Warranty Status Calculation ─────────────────────────────────────────────

export function getWarrantyStatus(
  manufactureDate: Date,
  purchaseDate: Date | null,
  category: string,
  brand: string
): { status: "active" | "expiring_soon" | "expired" | "unknown"; expiresDate: string | null; warranties: Array<WarrantyPeriod & { status: string; expiresDate: string | null }> } {
  const entry = findBrandWarranty(brand, category);
  const periods = entry?.warranties || CATEGORY_DEFAULTS[category] || [{ component: "parts", years: 1 }];

  const startDate = purchaseDate || manufactureDate;
  const now = new Date();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  const results = periods.map((w) => {
    const expires = new Date(startDate);
    expires.setFullYear(expires.getFullYear() + w.years);
    const expiresStr = expires.toISOString().split("T")[0];

    let status: "active" | "expiring_soon" | "expired" | "unknown";
    if (expires.getTime() < now.getTime()) {
      status = "expired";
    } else if (expires.getTime() - now.getTime() < thirtyDaysMs) {
      status = "expiring_soon";
    } else {
      status = "active";
    }

    return { ...w, status, expiresDate: expiresStr };
  });

  // Overall status: worst non-lifetime warranty
  const nonLifetime = results.filter((r) => r.years < 99);
  let overallStatus: "active" | "expiring_soon" | "expired" | "unknown" = "active";
  let overallExpires: string | null = null;

  if (nonLifetime.length > 0) {
    // Find the primary warranty (longest non-lifetime)
    const primary = nonLifetime.sort((a, b) => b.years - a.years)[0];
    overallStatus = primary.status as any;
    overallExpires = primary.expiresDate;
  }

  return { status: overallStatus, expiresDate: overallExpires, warranties: results };
}

// ─── Main Lookup ─────────────────────────────────────────────────────────────

function findBrandWarranty(brand: string, category: string): BrandWarranty | null {
  const brandLower = (brand || "").toLowerCase();
  const catLower = (category || "").toLowerCase();

  // Try exact brand + category match
  let match = WARRANTY_DB.find(
    (w) => w.brand.toLowerCase() === brandLower && w.category === catLower
  );
  if (match) return match;

  // Try brand only (Rheem appears in both hvac and water_heater)
  match = WARRANTY_DB.find((w) => w.brand.toLowerCase() === brandLower);
  return match || null;
}

function normalizeCategory(category: string): string {
  const cat = (category || "").toLowerCase();
  if (cat.includes("hvac") || cat.includes("air conditioner") || cat.includes("furnace") || cat.includes("heat pump")) return "hvac";
  if (cat.includes("water heater")) return "water_heater";
  if (cat.includes("roof")) return "roofing";
  if (cat.includes("plumb") || cat.includes("faucet") || cat.includes("shower")) return "plumbing";
  if (cat.includes("appliance") || cat.includes("refrigerator") || cat.includes("washer") || cat.includes("dryer") || cat.includes("dishwasher") || cat.includes("oven") || cat.includes("range") || cat.includes("microwave")) return "appliance";
  return "appliance"; // default
}

export function lookupWarranty(
  brand: string,
  model: string | null,
  serialNumber: string | null,
  category: string
): WarrantyResult {
  const normalizedCat = normalizeCategory(category);
  const entry = findBrandWarranty(brand, normalizedCat);
  const mfgDate = serialNumber ? estimateManufactureDate(brand, serialNumber) : null;

  // If we have a manufacture date, calculate statuses
  if (mfgDate) {
    const result = getWarrantyStatus(mfgDate, null, normalizedCat, brand);
    return {
      brand,
      model: model || null,
      serialNumber: serialNumber || null,
      category: normalizedCat,
      estimatedManufactureDate: mfgDate,
      warranties: result.warranties as any,
      overallStatus: result.status,
      overallExpires: result.expiresDate,
      registrationRequired: entry?.registrationRequired ?? false,
      transferable: entry?.transferable ?? true,
      notes: entry?.notes || null,
      needsPurchaseDate: false,
    };
  }

  // No mfg date - return warranty info but flag as unknown
  const periods = entry?.warranties || CATEGORY_DEFAULTS[normalizedCat] || [{ component: "parts", years: 1 }];

  return {
    brand,
    model: model || null,
    serialNumber: serialNumber || null,
    category: normalizedCat,
    estimatedManufactureDate: null,
    warranties: periods.map((w) => ({ ...w, status: "unknown" as const, expiresDate: null })),
    overallStatus: "unknown",
    overallExpires: null,
    registrationRequired: entry?.registrationRequired ?? false,
    transferable: entry?.transferable ?? true,
    notes: entry?.notes || null,
    needsPurchaseDate: true,
  };
}
