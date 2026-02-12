/**
 * Property Scan Service
 * Uses Realty in US (Realtor.com) data via RapidAPI for real market values
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
  rentEstimate?: number;
  taxAssessedValue?: number;
  dataSource: "zillow" | "estimated";
  zillowUrl?: string;
  imgSrc?: string;
}

// ─── Realty in US API via RapidAPI ────────────────────────────────────────────

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "d8b4031b0cmsh0fff73bec93f734p1d1ef8jsnc985291799d6";
const RAPIDAPI_HOST = "realty-in-us.p.rapidapi.com";

interface RealtyResult {
  property_id: string;
  status: string;
  location: {
    address: {
      line: string;
      city: string;
      state_code: string;
      state: string;
      postal_code: string;
      street_name: string;
      street_number: string;
      coordinate: { lat: number; lon: number } | null;
    };
    street_view_url?: string;
  };
  description: {
    type: string;
    sub_type: string | null;
    beds: number;
    baths: number;
    sqft: number;
    lot_sqft: number;
    baths_full: number | null;
    baths_half: number | null;
  };
  list_price?: number;
  estimate?: { estimate: number };
  tax_record?: { public_record_doctype?: string; list?: Array<{ amount?: number; year?: number }> };
  photos?: Array<{ href: string }>;
  flags?: {
    is_new_construction: boolean | null;
    is_foreclosure: boolean | null;
  };
}

// Normalized internal result to keep downstream code consistent
interface ZillowResult {
  id: string;
  price: string;
  unformattedPrice: number;
  beds: number;
  baths: number;
  area: number;
  livingArea: number;
  homeType: string;
  rentZestimate: number;
  taxAssessedValue: number;
  lotAreaValue: number;
  lotAreaUnit: string;
  address: { street: string; city: string; state: string; zipcode: string };
  latLong: { latitude: number; longitude: number };
  detailUrl: string;
  imgSrc: string;
  zestimate: number;
  daysOnZillow: number;
}

function realtyToZillow(r: RealtyResult): ZillowResult {
  const addr = r.location?.address || {} as any;
  const desc = r.description || {} as any;
  const price = r.list_price || 0;
  const estimate = r.estimate?.estimate || price;
  const taxAmount = r.tax_record?.list?.[0]?.amount || 0;
  const photo = (r as any).primary_photo?.href || r.photos?.[0]?.href || "";

  return {
    id: r.property_id,
    price: `$${price.toLocaleString()}`,
    unformattedPrice: price,
    beds: desc.beds || 0,
    baths: desc.baths || 0,
    area: desc.sqft || 0,
    livingArea: desc.sqft || 0,
    homeType: desc.type?.toUpperCase()?.replace(/\s+/g, "_") || "RESIDENTIAL",
    rentZestimate: 0, // Not in this API
    taxAssessedValue: taxAmount,
    lotAreaValue: desc.lot_sqft || 0,
    lotAreaUnit: "sqft",
    address: {
      street: addr.line || `${addr.street_number || ""} ${addr.street_name || ""}`.trim(),
      city: addr.city || "",
      state: addr.state_code || addr.state || "",
      zipcode: addr.postal_code || "",
    },
    latLong: {
      latitude: addr.coordinate?.lat || 0,
      longitude: addr.coordinate?.lon || 0,
    },
    detailUrl: `https://www.realtor.com/realestateandhomes-detail/${r.property_id}`,
    imgSrc: photo,
    zestimate: estimate,
    daysOnZillow: 0,
  };
}

// Simple in-memory cache (5 min TTL)
const cache = new Map<string, { data: ZillowResult[]; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

async function searchZillow(location: string): Promise<ZillowResult[]> {
  const cacheKey = location.toLowerCase().trim();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  try {
    // Extract postal code if present
    const zipMatch = location.match(/\b(\d{5})\b/);
    const body: any = {
      limit: 200,
      offset: 0,
      status: ["for_sale", "sold", "ready_to_build"],
      sort: { direction: "desc", field: "list_date" },
    };

    if (zipMatch) {
      body.postal_code = zipMatch[1];
    } else {
      // Parse "City, ST" format
      const parts = location.split(",").map(s => s.trim());
      const city = parts[0];
      const stateMatch = (parts[1] || "").match(/([A-Z]{2})/i);
      body.city = city;
      if (stateMatch) body.state_code = stateMatch[1].toUpperCase();
    }

    const res = await fetch(`https://${RAPIDAPI_HOST}/properties/v3/list`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": RAPIDAPI_HOST,
        "x-rapidapi-key": RAPIDAPI_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error(`Realty API error: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const results: RealtyResult[] = data?.data?.home_search?.results || [];
    if (results.length === 0) return [];

    const normalized = results.map(realtyToZillow);
    cache.set(cacheKey, { data: normalized, ts: Date.now() });
    return normalized;
  } catch (err) {
    console.error("Realty API fetch error:", err);
    return [];
  }
}

function normalizeStreet(street: string): string {
  return street.toLowerCase()
    .replace(/\b(st|street|ave|avenue|blvd|boulevard|dr|drive|ln|lane|ct|court|rd|road|pl|place|way|cir|circle)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Try to find a specific property by address from Zillow search results
 */
async function findPropertyByAddress(address: string): Promise<ZillowResult | null> {
  // Parse city/state/zip from address
  const parts = address.split(",").map(s => s.trim());
  let location: string;

  if (parts.length >= 2) {
    // "123 Main St, Orlando, FL 32801" or "123 Main St, Orlando FL"
    location = parts.slice(1).join(", ").trim();
  } else {
    // Try to extract city/state from the single string
    const match = address.match(/([A-Za-z\s]+),?\s*(FL|Florida)\s*(\d{5})?/i);
    location = match ? `${match[1].trim()}, FL` : "Orlando, FL";
  }

  const results = await searchZillow(location);
  if (results.length === 0) return null;

  // Try exact street match
  const inputStreet = normalizeStreet(address.split(",")[0]);
  const exactMatch = results.find(r => normalizeStreet(r.address.street) === inputStreet);
  if (exactMatch) return exactMatch;

  // Try partial match (street number + first word)
  const inputWords = address.split(",")[0].toLowerCase().split(/\s+/);
  const streetNum = inputWords[0];
  if (streetNum && /^\d+$/.test(streetNum)) {
    const partial = results.find(r => {
      const rStreet = r.address.street.toLowerCase();
      return rStreet.startsWith(streetNum + " ");
    });
    if (partial) return partial;
  }

  return null;
}

/**
 * Get nearby comps to estimate value for an address not found in listings
 */
async function getAreaComps(address: string): Promise<{ medianValue: number; medianSqft: number; medianBeds: number; medianBaths: number; count: number } | null> {
  const parts = address.split(",").map(s => s.trim());
  let location: string;

  if (parts.length >= 2) {
    location = parts.slice(1).join(", ").trim();
  } else {
    const match = address.match(/([A-Za-z\s]+),?\s*(FL|Florida)/i);
    location = match ? `${match[1].trim()}, FL` : "Orlando, FL";
  }

  const results = await searchZillow(location);
  if (results.length === 0) return null;

  // Use zestimates from results as comps
  const withZestimate = results.filter(r => r.zestimate && r.zestimate > 0);
  if (withZestimate.length === 0) return null;

  const values = withZestimate.map(r => r.zestimate).sort((a, b) => a - b);
  const sqfts = withZestimate.map(r => r.area || r.livingArea).filter(Boolean).sort((a, b) => a - b);
  const beds = withZestimate.map(r => r.beds).filter(Boolean).sort((a, b) => a - b);
  const baths = withZestimate.map(r => r.baths).filter(Boolean).sort((a, b) => a - b);

  const median = (arr: number[]) => arr.length ? arr[Math.floor(arr.length / 2)] : 0;

  return {
    medianValue: median(values),
    medianSqft: median(sqfts),
    medianBeds: median(beds),
    medianBaths: median(baths),
    count: withZestimate.length,
  };
}

// ─── Main Export ─────────────────────────────────────────────────────────────

/**
 * Get property data — tries Zillow first, falls back to estimation
 */
export async function getPropertyDataAsync(address: string): Promise<PropertyData> {
  // Try exact match from Zillow
  const match = await findPropertyByAddress(address);
  if (match) {
    const lotAcres = match.lotAreaUnit === "acres"
      ? match.lotAreaValue
      : (match.lotAreaValue || 0) / 43560;

    return {
      address: `${match.address.street}, ${match.address.city}, ${match.address.state} ${match.address.zipcode}`,
      homeValueEstimate: match.zestimate || match.unformattedPrice,
      sqFootage: match.area || match.livingArea,
      lotSizeAcres: +lotAcres.toFixed(2),
      hasPool: "uncertain", // Zillow doesn't reliably report pools in search results
      yearBuilt: 0, // Not in search results
      bedrooms: match.beds,
      bathrooms: match.baths,
      roofType: "Unknown",
      hasGarage: true,
      garageSize: "Unknown",
      stories: match.area > 2500 ? 2 : 1,
      exteriorType: "Unknown",
      propertyType: match.homeType === "SINGLE_FAMILY" ? "Single Family" : match.homeType?.replace(/_/g, " ") || "Residential",
      rentEstimate: match.rentZestimate,
      taxAssessedValue: match.taxAssessedValue,
      dataSource: "zillow",
      zillowUrl: match.detailUrl,
      imgSrc: match.imgSrc,
    };
  }

  // No exact match found — return address-only result and let Bud ask for details
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
      `⚠️ No property details found in public records — ASK the customer for: bedrooms, bathrooms, approximate square footage, whether they have a pool, and home type. Be natural about it: "I found your address but I don't have the details on file — can you tell me a bit about your place?"`,
    ].join("\n");
  }

  const source = data.dataSource === "zillow" ? "📊 Zillow data" : "📐 Estimated";

  return [
    `Address: ${data.address}`,
    data.homeValueEstimate ? `Market Value: $${data.homeValueEstimate.toLocaleString()} (${source})` : null,
    data.sqFootage ? `Size: ${data.sqFootage.toLocaleString()} sqft, ${data.bedrooms} bed / ${data.bathrooms} bath` : null,
    data.lotSizeAcres ? `Lot: ${data.lotSizeAcres} acres` : null,
    data.yearBuilt ? `Built: ${data.yearBuilt}` : null,
    data.propertyType && data.propertyType !== "Unknown" ? `Type: ${data.propertyType}` : null,
    poolText,
    data.taxAssessedValue ? `Tax Assessed: $${data.taxAssessedValue.toLocaleString()}` : null,
  ].filter(Boolean).join("\n");
}
