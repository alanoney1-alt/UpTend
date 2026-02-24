/**
 * Property Scan Service
 * Uses RentCast API for real property data (beds, baths, sqft, lot, year built)
 * Falls back to estimated data when API unavailable
 */

export interface PropertyData {
  address: string;
  homeValueEstimate: number;
  sqFootage: number;
  lotSizeAcres: number;
  hasPool: boolean | "uncertain";
  yearBuilt: number;
  bedrooms: number;
  bathrooms: number;
  roofType: string;
  hasGarage: boolean;
  garageSize: string;
  stories: number;
  exteriorType: string;
  propertyType: string;
  taxAssessedValue?: number;
  dataSource: "rentcast" | "estimated" | "address_only";
  lastSalePrice?: number;
  lastSaleDate?: string;
}

// ─── RentCast API ────────────────────────────────────────────────────────────

const RENTCAST_API_KEY = process.env.RENTCAST_API_KEY || "";
const RENTCAST_BASE = "https://api.rentcast.io/v1";

// Simple in-memory cache (30 min TTL — RentCast has limited free calls)
const cache = new Map<string, { data: PropertyData; ts: number }>();
const CACHE_TTL = 30 * 60 * 1000;

interface RentCastProperty {
  id: string;
  formattedAddress: string;
  addressLine1: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  latitude: number;
  longitude: number;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  lotSize: number;
  yearBuilt: number;
  lastSaleDate?: string;
  lastSalePrice?: number;
  features?: {
    cooling?: boolean;
    coolingType?: string;
    exteriorType?: string;
    floorCount?: number;
    garage?: boolean;
    garageType?: string;
    heating?: boolean;
    heatingType?: string;
    roofType?: string;
    pool?: boolean;
  };
  taxAssessments?: Record<string, { year: number; value: number; land?: number; improvements?: number }>;
}

function parseAddress(address: string): { street: string; city: string; state: string; zip: string } {
  const parts = address.split(",").map(s => s.trim());
  const street = parts[0] || "";
  const city = parts[1] || "";
  const stateZip = parts[2] || parts[1] || "";
  const stateMatch = stateZip.match(/([A-Z]{2})\s*(\d{5})?/i);
  return {
    street,
    city: parts.length >= 3 ? city : "",
    state: stateMatch?.[1]?.toUpperCase() || "FL",
    zip: stateMatch?.[2] || "",
  };
}

async function fetchFromRentCast(address: string): Promise<RentCastProperty | null> {
  if (!RENTCAST_API_KEY) {
    console.error("RENTCAST_API_KEY not set");
    return null;
  }

  try {
    const parsed = parseAddress(address);
    const params = new URLSearchParams({ address: parsed.street });
    if (parsed.city) params.set("city", parsed.city);
    if (parsed.state) params.set("state", parsed.state);
    if (parsed.zip) params.set("zipCode", parsed.zip);

    const res = await fetch(`${RENTCAST_BASE}/properties?${params.toString()}`, {
      headers: { "X-Api-Key": RENTCAST_API_KEY, Accept: "application/json" },
    });

    if (!res.ok) {
      console.error(`RentCast API error: ${res.status} ${res.statusText}`);
      return null;
    }

    const data: RentCastProperty[] = await res.json();
    return data?.[0] || null;
  } catch (err) {
    console.error("RentCast fetch error:", err);
    return null;
  }
}

// ─── Main Export ─────────────────────────────────────────────────────────────

/**
 * Get property data — tries RentCast first, falls back to estimation
 */
export async function getPropertyDataAsync(address: string): Promise<PropertyData> {
  const cacheKey = address.toLowerCase().trim();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  const prop = await fetchFromRentCast(address);
  if (prop && (prop.squareFootage || prop.bedrooms)) {
    const lotAcres = prop.lotSize ? +(prop.lotSize / 43560).toFixed(2) : 0;
    const features = prop.features || {};
    const latestTax = prop.taxAssessments
      ? Object.values(prop.taxAssessments).sort((a, b) => b.year - a.year)[0]
      : null;

    const result: PropertyData = {
      address: prop.formattedAddress || address,
      homeValueEstimate: prop.lastSalePrice || latestTax?.value || 0,
      sqFootage: prop.squareFootage || 0,
      lotSizeAcres: lotAcres,
      hasPool: features.pool === true ? true : features.pool === false ? false : "uncertain",
      yearBuilt: prop.yearBuilt || 0,
      bedrooms: prop.bedrooms || 0,
      bathrooms: prop.bathrooms || 0,
      roofType: features.roofType || "Unknown",
      hasGarage: features.garage || false,
      garageSize: features.garageType || "Unknown",
      stories: features.floorCount || (prop.squareFootage > 2500 ? 2 : 1),
      exteriorType: features.exteriorType || "Unknown",
      propertyType: prop.propertyType || "Residential",
      taxAssessedValue: latestTax?.value,
      dataSource: "rentcast",
      lastSalePrice: prop.lastSalePrice,
      lastSaleDate: prop.lastSaleDate,
    };

    cache.set(cacheKey, { data: result, ts: Date.now() });
    return result;
  }

  // No match — return address-only and let George ask for details
  return {
    address,
    homeValueEstimate: 0,
    sqFootage: 0,
    lotSizeAcres: 0,
    hasPool: "uncertain",
    yearBuilt: 0,
    bedrooms: 0,
    bathrooms: 0,
    roofType: "Unknown",
    hasGarage: false,
    garageSize: "Unknown",
    stories: 0,
    exteriorType: "Unknown",
    propertyType: "Unknown",
    dataSource: "address_only",
  };
}

/**
 * Synchronous fallback — deterministic estimation based on address hash
 */
export function getPropertyData(address: string): PropertyData {
  return getPropertyDataFallback(address);
}

function getPropertyDataFallback(address: string): PropertyData {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = ((hash << 5) - hash + address.charCodeAt(i)) | 0;
  }
  const h = Math.abs(hash);

  const isOrlando = /orlando|fl|florida|kissimmee|sanford|winter park|altamonte|oviedo|lake mary|apopka|clermont|seminole|osceola|orange/i.test(address);
  const sqFootage = 1200 + (h % 2800);
  const bedrooms = 2 + (h % 4);
  const bathrooms = Math.max(1, bedrooms - (h % 2));
  const homeValue = Math.round((sqFootage * (isOrlando ? 220 : 250)) / 1000) * 1000;
  const poolRoll = h % 100;
  const hasPool: boolean | "uncertain" = poolRoll < 40 ? true : poolRoll < 55 ? "uncertain" : false;
  const roofTypes = ["Shingle", "Tile", "Metal", "Flat"];
  const exteriorTypes = ["Stucco", "Vinyl Siding", "Brick", "Concrete Block"];
  const garageOptions = [{ has: true, size: "1-car" }, { has: true, size: "2-car" }, { has: true, size: "3-car" }, { has: false, size: "none" }];
  const garage = garageOptions[h % garageOptions.length];

  return {
    address,
    homeValueEstimate: homeValue,
    sqFootage,
    lotSizeAcres: +(0.15 + (h % 100) / 100).toFixed(2),
    hasPool,
    yearBuilt: 1970 + (h % 54),
    bedrooms,
    bathrooms,
    roofType: roofTypes[h % roofTypes.length],
    hasGarage: garage.has,
    garageSize: garage.size,
    stories: sqFootage > 2500 ? 2 : 1,
    exteriorType: exteriorTypes[h % exteriorTypes.length],
    propertyType: "Single Family",
    dataSource: "estimated",
  };
}

/**
 * Format property data into a natural language summary for the AI
 */
export function formatPropertySummary(data: PropertyData): string {
  const poolText = data.hasPool === true
    ? "Has a pool ✓"
    : data.hasPool === "uncertain"
      ? "Pool status: uncertain (ask customer)"
      : "No pool";

  if (data.dataSource === "address_only") {
    return [
      `Address: ${data.address}`,
      `No property details found in public records -- ASK the customer for: bedrooms, bathrooms, approximate square footage, whether they have a pool, and home type. Be natural about it: "I found your address but I don't have the details on file -- can you tell me a bit about your place?"`,
    ].join("\n");
  }

  const source = data.dataSource === "rentcast" ? "Public records" : "Estimated";

  return [
    `Address: ${data.address}`,
    // Home value intentionally excluded from property summary
    data.sqFootage ? `Size: ${data.sqFootage.toLocaleString()} sqft, ${data.bedrooms} bed / ${data.bathrooms} bath` : null,
    data.lotSizeAcres ? `Lot: ${data.lotSizeAcres} acres` : null,
    data.yearBuilt ? `Built: ${data.yearBuilt}` : null,
    data.propertyType && data.propertyType !== "Unknown" ? `Type: ${data.propertyType}` : null,
    poolText,
    // Tax/value data intentionally excluded from summary
  ].filter(Boolean).join("\n");
}
