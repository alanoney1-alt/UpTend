// Pricing constants (must match client/src/lib/bundle-pricing.ts and client/src/lib/distance-utils.ts)
export const MILEAGE_RATE = 1.00;
export const STAIRS_FLAT_FEE = 25;

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export const SUPPORTED_ZIP_CODES: Record<string, { lat: number; lng: number }> = {
  "32801": { lat: 28.5383, lng: -81.3792 },
  "32802": { lat: 28.5540, lng: -81.3780 },
  "32803": { lat: 28.5506, lng: -81.3641 },
  "32804": { lat: 28.5728, lng: -81.3941 },
  "32805": { lat: 28.5380, lng: -81.4055 },
  "32806": { lat: 28.5225, lng: -81.3700 },
  "32807": { lat: 28.5480, lng: -81.3144 },
  "32808": { lat: 28.5833, lng: -81.4450 },
  "32809": { lat: 28.4700, lng: -81.3800 },
  "32810": { lat: 28.6000, lng: -81.4000 },
  "32811": { lat: 28.5200, lng: -81.4400 },
  "32812": { lat: 28.4800, lng: -81.3400 },
  "32814": { lat: 28.5700, lng: -81.3400 },
  "32816": { lat: 28.6019, lng: -81.1981 },
  "32817": { lat: 28.5900, lng: -81.2500 },
  "32818": { lat: 28.5700, lng: -81.4800 },
  "32819": { lat: 28.4550, lng: -81.4700 },
  "32820": { lat: 28.5900, lng: -81.1600 },
  "32821": { lat: 28.4100, lng: -81.4600 },
  "32822": { lat: 28.4800, lng: -81.2900 },
  "32824": { lat: 28.3800, lng: -81.4100 },
  "32825": { lat: 28.5200, lng: -81.2300 },
  "32826": { lat: 28.5800, lng: -81.2000 },
  "32827": { lat: 28.4200, lng: -81.3200 },
  "32828": { lat: 28.5500, lng: -81.2000 },
  "32829": { lat: 28.5100, lng: -81.2100 },
  "32830": { lat: 28.3800, lng: -81.5100 },
  "32831": { lat: 28.4400, lng: -81.1700 },
  "32832": { lat: 28.4100, lng: -81.2500 },
  "32833": { lat: 28.5500, lng: -81.0800 },
  "32835": { lat: 28.5300, lng: -81.4900 },
  "32836": { lat: 28.4300, lng: -81.5000 },
  "32837": { lat: 28.3900, lng: -81.4000 },
  "32839": { lat: 28.4700, lng: -81.4200 },
  "34734": { lat: 28.5300, lng: -81.5300 },
  "34786": { lat: 28.4700, lng: -81.5500 },
  "34787": { lat: 28.5400, lng: -81.5900 },
  "32703": { lat: 28.6600, lng: -81.5100 },
  "32750": { lat: 28.7100, lng: -81.3100 },
  "32751": { lat: 28.6300, lng: -81.3600 },
  "32789": { lat: 28.5997, lng: -81.3483 },
  "32792": { lat: 28.6200, lng: -81.3000 },
};

export function isZipCodeSupported(zip: string): boolean {
  return zip in SUPPORTED_ZIP_CODES;
}

// Orlando area dump/transfer stations
export const DUMP_LOCATIONS: { name: string; lat: number; lng: number }[] = [
  { name: "Orange County Landfill", lat: 28.4033, lng: -81.2633 },
  { name: "McLeod Road Transfer Station", lat: 28.5389, lng: -81.4561 },
  { name: "Seminole County Transfer Station", lat: 28.7050, lng: -81.2833 },
  { name: "Osceola County Landfill", lat: 28.2750, lng: -81.2917 },
];

export function findNearestDump(lat: number, lng: number): { 
  name: string; 
  distanceMiles: number; 
  estimatedDriveMinutes: number;
  distanceFee: number;
} {
  let nearest = DUMP_LOCATIONS[0];
  let minDistance = Infinity;
  
  for (const dump of DUMP_LOCATIONS) {
    const dist = calculateDistance(lat, lng, dump.lat, dump.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = dump;
    }
  }
  
  // Round to nearest 0.5 mile
  const distanceMiles = Math.round(minDistance * 2) / 2;
  // Estimate 2 minutes per mile for local driving
  const estimatedDriveMinutes = Math.round(distanceMiles * 2);
  // $1 per mile (round trip), minimum $5
  const distanceFee = Math.max(5, Math.round(distanceMiles * 2));
  
  return {
    name: nearest.name,
    distanceMiles,
    estimatedDriveMinutes,
    distanceFee,
  };
}

export function geocodeZip(zip: string): { lat: number; lng: number } | null {
  return SUPPORTED_ZIP_CODES[zip] || null;
}

export function calculateMovePricing(
  distanceMiles: number,
  pickupStairs: number,
  destinationStairs: number,
  moveServiceMode: 'truck_and_mover' | 'labor_only',
  basePrice: number
): {
  mileageCharge: number;
  stairsCharge: number;
  serviceModeDiscount: number;
  totalPrice: number;
  breakdown: { label: string; amount: number }[];
} {
  const mileageCharge = distanceMiles * MILEAGE_RATE;
  
  // Flat $25 fee for any extra stairs (not per flight)
  const totalStairs = pickupStairs + destinationStairs;
  const stairsCharge = totalStairs > 0 ? STAIRS_FLAT_FEE : 0;
  
  let serviceModeDiscount = 0;
  if (moveServiceMode === 'labor_only') {
    serviceModeDiscount = basePrice * 0.40;
  }
  
  const totalPrice = Math.max(99, basePrice + mileageCharge + stairsCharge - serviceModeDiscount);
  
  const breakdown: { label: string; amount: number }[] = [
    { label: 'Base Price', amount: basePrice },
  ];
  
  if (mileageCharge > 0) {
    breakdown.push({ label: `Mileage (${distanceMiles} mi × $${MILEAGE_RATE}/mi)`, amount: mileageCharge });
  }
  
  if (stairsCharge > 0) {
    breakdown.push({ label: 'Stairs surcharge (flat fee)', amount: stairsCharge });
  }
  
  if (serviceModeDiscount > 0) {
    breakdown.push({ label: 'Labor Only Discount (40% off)', amount: -serviceModeDiscount });
  }
  
  return {
    mileageCharge,
    stairsCharge,
    serviceModeDiscount,
    totalPrice: Math.round(totalPrice * 100) / 100,
    breakdown,
  };
}
