export const PRICING_CONSTANTS = {
  PRESSURE_WASH_SQFT: 25,
  PRESSURE_WASH_MIN: 12000, // $120 minimum (small job)

  GUTTER_1_STORY: 14900, // $149 single story
  GUTTER_2_STORY: 19900, // $199 two story

  MOVER_HOURLY: 8000, // $80/hr per Pro (Moving Labor)
  MOVER_MIN_HOURS: 1,

  DEMO_BASE_RATE: 19900, // $199 starting (Light Demolition)

  CONSULTATION_FEE: 4900, // $49 (AI Home Audit Standard)
};

export function calculateServicePrice(type: string, data: any): number | null {
  let price = 0;

  switch (type) {
    case "pressure_washing":
      price = (data.squareFootage || 0) * PRICING_CONSTANTS.PRESSURE_WASH_SQFT;
      if (price < PRICING_CONSTANTS.PRESSURE_WASH_MIN) price = PRICING_CONSTANTS.PRESSURE_WASH_MIN;
      break;

    case "gutter_cleaning":
      price =
        data.storyCount === 2
          ? PRICING_CONSTANTS.GUTTER_2_STORY
          : PRICING_CONSTANTS.GUTTER_1_STORY;
      break;

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
    home_consultation: "AI Home Audit",
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
      pitch: "While we're here, want us to check and clean your gutters? Starting at $120.",
      quickPrice: 12000,
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
