/**
 * Research-Verified Price Ranges for Orlando Metro Area (Client-Side Copy)
 *
 * Duplicated from server/data/service-price-ranges.ts for client bundle.
 * Keep in sync with server version.
 *
 * Last updated: 2025-02-24
 */

export const SERVICE_PRICE_RANGES: Record<string, {
  serviceType: string;
  displayName: string;
  unit: string;
  floor: number;
  recommended: number;
  ceiling: number;
  notes: string;
  variants?: Array<{
    name: string;
    floor: number;
    recommended: number;
    ceiling: number;
    notes: string;
  }>;
}> = {
  junk_removal: {
    serviceType: "junk_removal",
    displayName: "Junk Removal",
    unit: "per job",
    floor: 99,
    recommended: 279,
    ceiling: 599,
    notes: "Volume-based pricing by truck load",
    variants: [
      { name: "Minimum (1-2 items)", floor: 89, recommended: 99, ceiling: 149, notes: "Small pickup" },
      { name: "Quarter Truck", floor: 179, recommended: 279, ceiling: 349, notes: "3-4 cubic yards" },
      { name: "Half Truck", floor: 299, recommended: 379, ceiling: 449, notes: "6-8 cubic yards" },
      { name: "Full Truck", floor: 399, recommended: 549, ceiling: 699, notes: "Full load" },
    ],
  },
  pressure_washing: {
    serviceType: "pressure_washing",
    displayName: "Pressure Washing",
    unit: "per job",
    floor: 120,
    recommended: 199,
    ceiling: 450,
    notes: "Standard driveway 400-600 sqft",
  },
  gutter_cleaning: {
    serviceType: "gutter_cleaning",
    displayName: "Gutter Cleaning",
    unit: "per job",
    floor: 119,
    recommended: 179,
    ceiling: 399,
    notes: "Standard 1-story home up to 150 linear ft",
    variants: [
      { name: "1-Story (up to 150 LF)", floor: 99, recommended: 149, ceiling: 225, notes: "Single-story" },
      { name: "2-Story (up to 150 LF)", floor: 169, recommended: 229, ceiling: 349, notes: "Two-story" },
    ],
  },
  moving_labor: {
    serviceType: "moving_labor",
    displayName: "Moving Labor",
    unit: "per mover/hr",
    floor: 35,
    recommended: 55,
    ceiling: 85,
    notes: "Per mover per hour, minimum 2 hours",
  },
  handyman: {
    serviceType: "handyman",
    displayName: "Handyman Services",
    unit: "per hour",
    floor: 50,
    recommended: 75,
    ceiling: 125,
    notes: "General repairs, assembly, mounting",
  },
  light_demolition: {
    serviceType: "light_demolition",
    displayName: "Light Demolition",
    unit: "per job",
    floor: 199,
    recommended: 350,
    ceiling: 799,
    notes: "Sheds, decks, interior tear-outs",
  },
  garage_cleanout: {
    serviceType: "garage_cleanout",
    displayName: "Garage Cleanout",
    unit: "per job",
    floor: 199,
    recommended: 349,
    ceiling: 799,
    notes: "Full sort, organize, and haul-away",
  },
  home_cleaning: {
    serviceType: "home_cleaning",
    displayName: "Home Cleaning",
    unit: "per job",
    floor: 99,
    recommended: 165,
    ceiling: 349,
    notes: "Standard cleaning for 3BR/2BA home",
  },
  pool_cleaning: {
    serviceType: "pool_cleaning",
    displayName: "Pool Cleaning",
    unit: "per month",
    floor: 85,
    recommended: 165,
    ceiling: 275,
    notes: "Weekly maintenance billed monthly",
  },
  landscaping: {
    serviceType: "landscaping",
    displayName: "Landscaping",
    unit: "per visit",
    floor: 45,
    recommended: 99,
    ceiling: 249,
    notes: "One-time mow for quarter-acre lot",
  },
  carpet_cleaning: {
    serviceType: "carpet_cleaning",
    displayName: "Carpet Cleaning",
    unit: "per room",
    floor: 35,
    recommended: 55,
    ceiling: 99,
    notes: "Standard steam clean per room",
  },
  home_scan: {
    serviceType: "home_scan",
    displayName: "Home DNA Scan",
    unit: "flat",
    floor: 0,
    recommended: 0,
    ceiling: 0,
    notes: "Fixed pricing -- $99 standard, $249 premium. Not pro-set.",
  },
};
