export const PRICING_CONSTANTS = {
  PRESSURE_WASH_SQFT: 25,
  PRESSURE_WASH_MIN: 12000, // $120 minimum (small job)

  GUTTER_1_STORY: 12900, // $129 - 1-Story (up to 150 linear ft)
  GUTTER_1_STORY_LARGE: 17900, // $179 - 1-Story Large (150-250 linear ft)
  GUTTER_2_STORY: 19900, // $199 - 2-Story (up to 150 linear ft)
  GUTTER_2_STORY_LARGE: 25900, // $259 - 2-Story Large (150-250 linear ft)
  GUTTER_3_STORY: 35000, // $350+ - 3-Story

  MOVER_HOURLY: 6500, // $65/hr per Pro (Moving Labor)
  MOVER_MIN_HOURS: 1,

  DEMO_BASE_RATE: 19900, // $199 starting (Light Demolition)

  CONSULTATION_FEE: 0, // Free (Home DNA Scan Standard - lead gen)

  // Pool Cleaning (PoolSpark) tiers
  POOL_BASIC: 9900,        // $99/mo - Weekly chemicals + skim surface + empty baskets
  POOL_STANDARD: 16500,   // $165/mo - Basic + brush walls + vacuum + filter check
  POOL_FULL_SERVICE: 21000, // $210/mo - Standard + tile cleaning + equipment monitoring + filter cleaning
  POOL_DEEP_CLEAN: 24900, // $249 one-time - Deep clean for neglected/green pools

  // Carpet Cleaning tiers (per room)
  CARPET_STANDARD: 5000,    // $50/room - Steam/hot water extraction, pre-treatment, vacuum
  CARPET_DEEP: 7500,        // $75/room - Standard + enzyme treatment, heavy soil agitation, slow dry pass
  CARPET_PET: 8900,         // $89/room - Deep clean + pet odor enzyme + sanitizer
  CARPET_HALLWAY: 2500,     // $25 each
  CARPET_STAIRS: 2500,      // $25 per flight
  CARPET_SCOTCHGARD: 2000,  // $20/room add-on
  CARPET_PKG_3BR: 12900,    // $129 - 3BR/2BA standard package (all rooms + hallway)
  CARPET_PKG_4_5BR: 21500,  // $215 - 4-5BR standard package (all rooms + hallways)
  CARPET_MINIMUM: 10000,    // $100 minimum charge

  // Landscaping tiers
  LANDSCAPE_MOW_QUARTER: 5900,   // $59 one-time mow ≤1/4 acre
  LANDSCAPE_MOW_HALF: 8900,      // $89 one-time mow ≤1/2 acre
  LANDSCAPE_CLEANUP_MIN: 14900,  // $149 yard cleanup minimum
  LANDSCAPE_CLEANUP_MAX: 29900,  // $299 yard cleanup maximum
  LANDSCAPE_MOW_GO_QUARTER: 9900,    // $99/mo Mow & Go ≤1/4 acre
  LANDSCAPE_MOW_GO_HALF: 14900,      // $149/mo Mow & Go ≤1/2 acre
  LANDSCAPE_FULL_QUARTER: 15900,     // $159/mo Full Service ≤1/4 acre
  LANDSCAPE_FULL_HALF: 21900,        // $219/mo Full Service ≤1/2 acre
  LANDSCAPE_PREMIUM_QUARTER: 24900,  // $249/mo Premium ≤1/4 acre
  LANDSCAPE_PREMIUM_HALF: 32900,     // $329/mo Premium ≤1/2 acre
};

export function calculateServicePrice(type: string, data: any): number | null {
  let price = 0;

  switch (type) {
    case "pressure_washing":
      price = (data.squareFootage || 0) * PRICING_CONSTANTS.PRESSURE_WASH_SQFT;
      if (price < PRICING_CONSTANTS.PRESSURE_WASH_MIN) price = PRICING_CONSTANTS.PRESSURE_WASH_MIN;
      break;

    case "gutter_cleaning": {
      const stories = data.storyCount || 1;
      const linearFt = data.linearFeet || 150;
      if (stories >= 3) {
        price = PRICING_CONSTANTS.GUTTER_3_STORY;
      } else if (stories === 2) {
        price = linearFt > 150 ? PRICING_CONSTANTS.GUTTER_2_STORY_LARGE : PRICING_CONSTANTS.GUTTER_2_STORY;
      } else {
        price = linearFt > 150 ? PRICING_CONSTANTS.GUTTER_1_STORY_LARGE : PRICING_CONSTANTS.GUTTER_1_STORY;
      }
      break;
    }

    case "moving_labor":
      const hours = Math.max(data.laborHours || 0, PRICING_CONSTANTS.MOVER_MIN_HOURS);
      const crew = data.laborCrewSize || 1;
      price = hours * crew * PRICING_CONSTANTS.MOVER_HOURLY;
      break;

    case "light_demolition":
      price = PRICING_CONSTANTS.DEMO_BASE_RATE;
      break;

    case "home_consultation":
      price = PRICING_CONSTANTS.CONSULTATION_FEE;
      break;

    case "pool_cleaning": {
      const tier = data.tier || "basic";
      if (tier === "deep_clean") price = PRICING_CONSTANTS.POOL_DEEP_CLEAN;
      else if (tier === "full_service") price = PRICING_CONSTANTS.POOL_FULL_SERVICE;
      else if (tier === "standard") price = PRICING_CONSTANTS.POOL_STANDARD;
      else price = PRICING_CONSTANTS.POOL_BASIC; // default to basic
      break;
    }

    case "carpet_cleaning": {
      const carpetTier = data.tier || "standard";
      const rooms = data.rooms || 0;
      const hallways = data.hallways || 0;
      const stairFlights = data.stairFlights || 0;
      const scotchgardRooms = data.scotchgardRooms || 0;

      // Check for whole-house packages first
      if (data.package === "3br") {
        price = PRICING_CONSTANTS.CARPET_PKG_3BR;
      } else if (data.package === "4_5br") {
        price = PRICING_CONSTANTS.CARPET_PKG_4_5BR;
      } else {
        const perRoom = carpetTier === "pet" ? PRICING_CONSTANTS.CARPET_PET
          : carpetTier === "deep" ? PRICING_CONSTANTS.CARPET_DEEP
          : PRICING_CONSTANTS.CARPET_STANDARD;
        price = rooms * perRoom;
        price += hallways * PRICING_CONSTANTS.CARPET_HALLWAY;
        price += stairFlights * PRICING_CONSTANTS.CARPET_STAIRS;
      }
      price += scotchgardRooms * PRICING_CONSTANTS.CARPET_SCOTCHGARD;

      // Enforce minimum
      if (price < PRICING_CONSTANTS.CARPET_MINIMUM) price = PRICING_CONSTANTS.CARPET_MINIMUM;
      break;
    }

    case "landscaping": {
      const lotSize = data.lotSize || "quarter"; // "quarter" or "half"
      const planType = data.planType || "one_time_mow"; // one_time_mow, cleanup, mow_go, full_service, premium

      if (planType === "cleanup") {
        price = PRICING_CONSTANTS.LANDSCAPE_CLEANUP_MIN; // $149-$299, start at min
      } else if (planType === "mow_go") {
        price = lotSize === "half" ? PRICING_CONSTANTS.LANDSCAPE_MOW_GO_HALF : PRICING_CONSTANTS.LANDSCAPE_MOW_GO_QUARTER;
      } else if (planType === "full_service") {
        price = lotSize === "half" ? PRICING_CONSTANTS.LANDSCAPE_FULL_HALF : PRICING_CONSTANTS.LANDSCAPE_FULL_QUARTER;
      } else if (planType === "premium") {
        price = lotSize === "half" ? PRICING_CONSTANTS.LANDSCAPE_PREMIUM_HALF : PRICING_CONSTANTS.LANDSCAPE_PREMIUM_QUARTER;
      } else {
        // one_time_mow default
        price = lotSize === "half" ? PRICING_CONSTANTS.LANDSCAPE_MOW_HALF : PRICING_CONSTANTS.LANDSCAPE_MOW_QUARTER;
      }
      break;
    }

    case "junk_removal":
    default:
      return null;
  }

  return price;
}

export function getServiceLabel(type: string): string {
  const labels: Record<string, string> = {
    junk_removal: "Junk Removal",
    furniture_moving: "Furniture Moving",
    garage_cleanout: "Garage Cleanout",
    estate_cleanout: "Estate Cleanout",
    truck_unloading: "Truck Unloading",
    hvac: "HVAC",
    cleaning: "Cleaning",
    moving_labor: "Moving Labor",
    pressure_washing: "Pressure Washing",
    gutter_cleaning: "Gutter Cleaning",
    light_demolition: "Light Demolition",
    home_consultation: "Home DNA Scan",
    pool_cleaning: "Pool Cleaning",
    landscaping: "Landscaping",
    carpet_cleaning: "Carpet Cleaning",
  };
  return labels[type] || type.replace(/_/g, " ");
}

export function getUpsellOpportunities(
  finishedServiceType: string,
  haulerSkills: {
    hasPressureWasher?: boolean;
    hasTallLadder?: boolean;
    hasDemoTools?: boolean;
    supportedServices?: string[];
  }
): Array<{ type: string; pitch: string; quickPrice: number }> {
  const opportunities: Array<{ type: string; pitch: string; quickPrice: number }> = [];
  const supported = haulerSkills.supportedServices || ["junk_removal"];

  if (
    finishedServiceType === "junk_removal" &&
    haulerSkills.hasPressureWasher &&
    supported.includes("pressure_washing")
  ) {
    opportunities.push({
      type: "pressure_washing",
      pitch: "Driveway looking dirty? Since we're here, we can wash it for $99 (Save $50).",
      quickPrice: 9900,
    });
  }

  if (
    finishedServiceType === "gutter_cleaning" &&
    supported.includes("junk_removal")
  ) {
    opportunities.push({
      type: "junk_removal",
      pitch: "Have any bags of leaves or debris to haul away? We can take them for $49.",
      quickPrice: 4900,
    });
  }

  if (
    finishedServiceType === "junk_removal" &&
    haulerSkills.hasTallLadder &&
    supported.includes("gutter_cleaning")
  ) {
    opportunities.push({
      type: "gutter_cleaning",
      pitch: "While we're here, want us to check and clean your gutters? Starting at $150.",
      quickPrice: 12900,
    });
  }

  if (
    finishedServiceType === "light_demolition" &&
    supported.includes("junk_removal")
  ) {
    opportunities.push({
      type: "junk_removal",
      pitch: "Need us to haul all that demo debris away? We'll load it up for $99.",
      quickPrice: 9900,
    });
  }

  return opportunities;
}
