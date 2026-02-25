/**
 * Research-Verified Price Ranges for Orlando Metro Area
 *
 * These ranges define the floor, recommended, and ceiling rates
 * that pros can set for each service vertical. Based on 2025
 * market research from multiple sources.
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
  researchSource: string;
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
    notes: "Volume-based pricing by truck load. Floor is minimum pickup (1-2 items), ceiling is full truck load.",
    researchSource: "Homeyou Orlando avg $233-$244 (2025), GS Junk Orlando $95-$550+ (Apr 2025), Manta Orlando $89-$723 (2025)",
    variants: [
      { name: "Minimum (1-2 items)", floor: 89, recommended: 99, ceiling: 149, notes: "Small pickup, 1-2 bulky items" },
      { name: "Quarter Truck", floor: 179, recommended: 279, ceiling: 349, notes: "Approx 3-4 cubic yards" },
      { name: "Half Truck", floor: 299, recommended: 379, ceiling: 449, notes: "Approx 6-8 cubic yards" },
      { name: "Full Truck", floor: 399, recommended: 549, ceiling: 699, notes: "Full 10-15 cubic yard load" },
    ],
  },

  pressure_washing: {
    serviceType: "pressure_washing",
    displayName: "Pressure Washing",
    unit: "per job",
    floor: 120,
    recommended: 199,
    ceiling: 450,
    notes: "Standard driveway (400-600 sqft). Larger surfaces and house exteriors cost more. Rate approx $0.49-$0.85/sqft in Orlando.",
    researchSource: "Homeblue Orlando $70-$1700 range (2025), Handoff.ai Orlando $0.49-$0.85/sqft (2025), Homeyou driveway $80-$200 (2025)",
    variants: [
      { name: "Driveway (standard)", floor: 100, recommended: 175, ceiling: 275, notes: "Standard 2-car driveway, 400-600 sqft" },
      { name: "Driveway (large)", floor: 175, recommended: 250, ceiling: 400, notes: "Large or circular driveway, 600-1200 sqft" },
      { name: "House Exterior", floor: 200, recommended: 350, ceiling: 600, notes: "Single-story home exterior siding wash" },
    ],
  },

  gutter_cleaning: {
    serviceType: "gutter_cleaning",
    displayName: "Gutter Cleaning",
    unit: "per job",
    floor: 119,
    recommended: 179,
    ceiling: 399,
    notes: "Standard 1-story home up to 150 linear ft. 2-story adds 30-50%. Rate approx $0.98-$1.23/linear ft in Orlando.",
    researchSource: "Angi Orlando $0.98-$1.23/linear ft (Sep 2025), Homeyou Orlando gutter cleaning costs (Feb 2025)",
    variants: [
      { name: "1-Story (up to 150 LF)", floor: 99, recommended: 149, ceiling: 225, notes: "Single-story home, standard linear footage" },
      { name: "1-Story Large (150-250 LF)", floor: 149, recommended: 199, ceiling: 299, notes: "Larger single-story home" },
      { name: "2-Story (up to 150 LF)", floor: 169, recommended: 229, ceiling: 349, notes: "Two-story home, requires taller ladders" },
      { name: "2-Story Large (150-250 LF)", floor: 219, recommended: 289, ceiling: 425, notes: "Larger two-story home" },
    ],
  },

  moving_labor: {
    serviceType: "moving_labor",
    displayName: "Moving Labor",
    unit: "per mover/hr",
    floor: 35,
    recommended: 55,
    ceiling: 85,
    notes: "Per mover per hour. Minimum 2 hours. Most jobs use 2-3 movers. Orlando labor-only rate is approx $40/mover/hr.",
    researchSource: "MoveBuddha Orlando $40/mover/hr (Oct 2025), LoadUp Orlando starting $175/hr crew (2025), ZipRecruiter Orlando mover wage $17/hr (Jan 2025)",
  },

  handyman: {
    serviceType: "handyman",
    displayName: "Handyman Services",
    unit: "per hour",
    floor: 50,
    recommended: 75,
    ceiling: 125,
    notes: "General repairs, assembly, mounting, installations. 1-hour minimum. Orlando average $40-$80/hr for independent handymen.",
    researchSource: "Homeblue Orlando $40-$80/hr (2025), PayScale Orlando handyman avg $23/hr wage (2025), Homeyou Orlando $180-$650/project (2025)",
  },

  light_demolition: {
    serviceType: "light_demolition",
    displayName: "Light Demolition",
    unit: "per job",
    floor: 199,
    recommended: 350,
    ceiling: 799,
    notes: "Sheds, decks, interior tear-outs. Price varies widely by scope. Interior demo averages $2-$8/sqft in Orlando.",
    researchSource: "HomeGuide Orlando interior demo $2-$8/sqft or $1000-$5000 avg project (2025), ProMatcher Orlando demolition costs (2025)",
  },

  garage_cleanout: {
    serviceType: "garage_cleanout",
    displayName: "Garage Cleanout",
    unit: "per job",
    floor: 199,
    recommended: 349,
    ceiling: 799,
    notes: "Full sort, organize, donate coordination, and haul-away. Price depends on garage size and volume of items.",
    researchSource: "LoadUp Orlando garage cleanout (2025), GS Junk Orlando garage cleanout (May 2025) -- priced similarly to half-to-full truck junk removal",
    variants: [
      { name: "Small (1-car garage, light)", floor: 149, recommended: 299, ceiling: 449, notes: "1-car garage, moderate clutter" },
      { name: "Medium (2-car garage)", floor: 299, recommended: 449, ceiling: 649, notes: "Standard 2-car garage cleanout" },
      { name: "Large (2-car, heavily packed)", floor: 449, recommended: 599, ceiling: 899, notes: "Heavily packed, floor to ceiling" },
    ],
  },

  home_cleaning: {
    serviceType: "home_cleaning",
    displayName: "Home Cleaning",
    unit: "per job",
    floor: 99,
    recommended: 165,
    ceiling: 349,
    notes: "Standard cleaning for a 3BR/2BA home. Deep clean and move-out cost more. Orlando flat rates avg $118-$218.",
    researchSource: "Angi Orlando avg $161/visit flat rate, range $118-$218 (Oct 2025), Care.com Orlando avg $19.95/hr (Dec 2025)",
    variants: [
      { name: "Standard Clean (3BR/2BA)", floor: 99, recommended: 149, ceiling: 225, notes: "Regular maintenance clean" },
      { name: "Deep Clean (3BR/2BA)", floor: 149, recommended: 225, ceiling: 349, notes: "Thorough deep clean, baseboards, inside appliances" },
      { name: "Move-Out Clean (3BR/2BA)", floor: 175, recommended: 275, ceiling: 425, notes: "Move-out ready, all surfaces" },
    ],
  },

  pool_cleaning: {
    serviceType: "pool_cleaning",
    displayName: "Pool Cleaning",
    unit: "per month",
    floor: 85,
    recommended: 165,
    ceiling: 275,
    notes: "Weekly pool maintenance billed monthly. Orlando per-visit rate is approx $29-$40. Monthly = 4 visits.",
    researchSource: "ProMatcher Orlando $30-$40/visit (2025), Homeblue Orlando $29-$33/visit (2025), Manta Orlando pool service (2025)",
    variants: [
      { name: "Basic (chemicals + skim)", floor: 85, recommended: 115, ceiling: 159, notes: "Weekly chemicals, skim surface, empty baskets" },
      { name: "Standard (+ brush + vacuum)", floor: 125, recommended: 165, ceiling: 225, notes: "Basic + brush walls, vacuum, filter check" },
      { name: "Full Service", floor: 175, recommended: 225, ceiling: 299, notes: "Standard + tile cleaning, equipment monitoring" },
    ],
  },

  landscaping: {
    serviceType: "landscaping",
    displayName: "Landscaping",
    unit: "per visit",
    floor: 45,
    recommended: 99,
    ceiling: 249,
    notes: "One-time mow for quarter-acre lot. Monthly plans range $100-$300/mo in Orlando. Per-visit pricing shown.",
    researchSource: "YourGreenPal Orlando $60/application quarter-acre (Oct 2025), Homeyou Orlando $100-$300/mo (Jun 2025)",
    variants: [
      { name: "One-Time Mow (quarter acre)", floor: 45, recommended: 65, ceiling: 99, notes: "Single mow, edge, blow" },
      { name: "Monthly Mow & Go (quarter acre)", floor: 79, recommended: 99, ceiling: 149, notes: "Weekly mow billed monthly" },
      { name: "Full Service Monthly (quarter acre)", floor: 129, recommended: 169, ceiling: 249, notes: "Mow + edge + trim + weed beds + hedge trim" },
    ],
  },

  carpet_cleaning: {
    serviceType: "carpet_cleaning",
    displayName: "Carpet Cleaning",
    unit: "per room",
    floor: 35,
    recommended: 55,
    ceiling: 99,
    notes: "Standard steam/hot water extraction per room (up to 200 sqft). Florida average $0.25-$0.50/sqft or $50-$100/room.",
    researchSource: "HomeGuide national $40-$90+/room (Jan 2025), Patch.com Florida $0.25-$0.50/sqft, $50-$100/room (Jun 2024), Homeblue Orlando 3000sqft $570-$860 (2025)",
    variants: [
      { name: "Standard Steam Clean", floor: 35, recommended: 50, ceiling: 75, notes: "Hot water extraction, pre-treatment" },
      { name: "Deep Clean", floor: 55, recommended: 75, ceiling: 99, notes: "Enzyme treatment, heavy soil agitation" },
      { name: "Pet Treatment", floor: 65, recommended: 89, ceiling: 115, notes: "Deep clean + pet odor enzyme + sanitizer" },
    ],
  },

  home_scan: {
    serviceType: "home_scan",
    displayName: "Home DNA Scan",
    unit: "flat",
    floor: 0,
    recommended: 0,
    ceiling: 0,
    notes: "Fixed pricing -- not pro-set. Standard: $99, Premium/Aerial: $249. Pro payout is $50 flat per scan paid by UpTend.",
    researchSource: "UpTend internal pricing -- fixed rate product, not market-determined",
  },
};
