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

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

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

export function isZipCodeSupported(zip: string): boolean {
  return zip in SUPPORTED_ZIP_CODES;
}

export function geocodeZip(zip: string): { lat: number; lng: number } | null {
  return SUPPORTED_ZIP_CODES[zip] || null;
}

export function calculateDistanceBetweenZips(pickupZip: string, destinationZip: string): number | null {
  const pickup = geocodeZip(pickupZip);
  const destination = geocodeZip(destinationZip);
  
  if (!pickup || !destination) return null;
  
  return calculateDistance(pickup.lat, pickup.lng, destination.lat, destination.lng);
}

export const MILEAGE_RATE = 1.00;
export const STAIRS_FLAT_FEE = 25;

export function calculateMileageCharge(distanceMiles: number): number {
  return Math.round(distanceMiles * MILEAGE_RATE * 100) / 100;
}
