/**
 * Property Scan Service - Mock property data based on address
 * Returns realistic property data for personalization
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
}

/**
 * Generate realistic mock property data based on address string.
 * Uses simple hash of address for deterministic but varied results.
 */
export function getPropertyData(address: string): PropertyData {
  // Simple hash for deterministic variation
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = ((hash << 5) - hash + address.charCodeAt(i)) | 0;
  }
  const h = Math.abs(hash);

  const isOrlando = /orlando|fl|florida|kissimmee|sanford|winter park|altamonte|oviedo|lake mary|apopka|clermont|seminole|osceola|orange/i.test(address);

  // Generate values based on hash for variation
  const sqFootage = 1200 + (h % 2800); // 1200-4000
  const yearBuilt = 1970 + (h % 54); // 1970-2024
  const bedrooms = 2 + (h % 4); // 2-5
  const bathrooms = Math.max(1, bedrooms - (h % 2)); // 1-5
  const lotSizeAcres = +(0.15 + (h % 100) / 100).toFixed(2); // 0.15-1.15
  const homeValue = Math.round((sqFootage * (isOrlando ? 220 : 250)) / 1000) * 1000;

  // Pool: ~40% have pool in Orlando area, uncertain 15%
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
    lotSizeAcres,
    hasPool,
    yearBuilt,
    bedrooms,
    bathrooms,
    roofType: roofTypes[h % roofTypes.length],
    hasGarage: garage.has,
    garageSize: garage.size,
    stories: sqFootage > 2500 ? 2 : 1,
    exteriorType: exteriorTypes[h % exteriorTypes.length],
    propertyType: "Single Family",
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
      : "No pool detected";

  return `Property: ${data.address}
- Est. Value: $${data.homeValueEstimate.toLocaleString()}
- ${data.sqFootage.toLocaleString()} sq ft, ${data.stories}-story ${data.propertyType}
- ${data.bedrooms} bed / ${data.bathrooms} bath
- Lot: ${data.lotSizeAcres} acres
- Built: ${data.yearBuilt}
- Roof: ${data.roofType}
- Exterior: ${data.exteriorType}
- Garage: ${data.hasGarage ? data.garageSize : "None"}
- ${poolText}`;
}
