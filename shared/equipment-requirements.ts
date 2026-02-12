/**
 * Detailed Equipment Requirements by Service Vertical
 * Each service has specific equipment, certifications, and insurance needs
 */

export interface EquipmentItem {
  id: string;
  label: string;
  required: boolean;
  description?: string;
  alternatives?: string[];
}

export interface ServiceEquipmentRequirements {
  serviceId: string;
  serviceName: string;
  minimumEquipment: EquipmentItem[];
  recommendedEquipment?: EquipmentItem[];
  certifications?: string[];
  insuranceRequired?: string;
  vehicleRequirements?: string[];
}

export const EQUIPMENT_REQUIREMENTS: ServiceEquipmentRequirements[] = [
  {
    serviceId: "junk_removal",
    serviceName: "Junk Removal",
    minimumEquipment: [
      { id: "vehicle", label: "Pickup truck, cargo van, or box truck", required: true },
      { id: "dolly", label: "Hand truck / dolly", required: true },
      { id: "straps", label: "Tie-down straps", required: true },
      { id: "gloves", label: "Work gloves", required: true },
    ],
    recommendedEquipment: [
      { id: "blankets", label: "Moving blankets (floor protection)", required: false },
      { id: "tarp", label: "Tarp for truck bed", required: false },
    ],
    vehicleRequirements: ["Minimum 3 cubic yard capacity"],
  },
  {
    serviceId: "furniture_moving",
    serviceName: "Furniture Moving",
    minimumEquipment: [
      { id: "vehicle", label: "Pickup truck or enclosed trailer", required: true },
      { id: "dolly", label: "Furniture dolly", required: true },
      { id: "straps", label: "Ratchet straps", required: true },
      { id: "blankets", label: "Moving blankets (minimum 6)", required: true },
      { id: "gloves", label: "Work gloves", required: true },
    ],
    recommendedEquipment: [
      { id: "appliance_dolly", label: "Appliance dolly", required: false },
      { id: "shrink_wrap", label: "Stretch wrap / shrink wrap", required: false },
      { id: "tools", label: "Basic tools (screwdriver, wrench)", required: false },
    ],
    vehicleRequirements: ["Enclosed recommended for long-distance moves"],
  },
  {
    serviceId: "pressure_washing",
    serviceName: "Pressure Washing",
    minimumEquipment: [
      {
        id: "pressure_washer",
        label: "Gas pressure washer (3000+ PSI, 2.5+ GPM)",
        required: true,
        description: "Commercial-grade required",
      },
      { id: "surface_cleaner", label: "Surface cleaner attachment (15-20 inch)", required: true },
      { id: "extension_wand", label: "Extension wand (6-24 ft)", required: true },
      { id: "nozzles", label: "Multiple nozzles (0°, 15°, 25°, 40°, soap)", required: true },
      { id: "hoses", label: "50-100 ft high-pressure hose", required: true },
      { id: "water_tank", label: "Water tank or reliable water source access", required: true },
    ],
    recommendedEquipment: [
      { id: "chemicals", label: "Cleaning chemicals (house wash, degreaser)", required: false },
      { id: "ladder", label: "Extension ladder for 2-story work", required: false },
      { id: "safety", label: "Safety glasses and boots", required: false },
    ],
    certifications: ["EPA lead-safe certification (for pre-1978 homes)"],
    insuranceRequired: "$1M general liability (property damage coverage)",
  },
  {
    serviceId: "gutter_cleaning",
    serviceName: "Gutter Cleaning",
    minimumEquipment: [
      { id: "ladder", label: "Extension ladder (24-32 ft, commercial grade)", required: true },
      { id: "scoop", label: "Gutter scoop", required: true },
      { id: "buckets", label: "5-gallon buckets (2-3)", required: true },
      { id: "hose", label: "Garden hose with spray nozzle", required: true },
      { id: "blower", label: "Leaf blower (for roof line cleanup)", required: true },
    ],
    recommendedEquipment: [
      { id: "stabilizer", label: "Ladder stabilizer / standoff", required: false },
      { id: "harness", label: "Safety harness (for steep roofs)", required: false },
      { id: "pressure_washer", label: "Pressure washer (for caked debris)", required: false },
    ],
    insuranceRequired: "$1M general liability (fall protection coverage)",
  },
  {
    serviceId: "light_demolition",
    serviceName: "Light Demolition",
    minimumEquipment: [
      { id: "reciprocating_saw", label: "Reciprocating saw (Sawzall)", required: true },
      { id: "sledgehammer", label: "Sledgehammer", required: true },
      { id: "pry_bar", label: "Pry bar / crowbar", required: true },
      { id: "hammer", label: "Claw hammer", required: true },
      { id: "utility_knife", label: "Utility knife", required: true },
      { id: "gloves", label: "Heavy-duty work gloves", required: true },
      { id: "safety_glasses", label: "Safety glasses", required: true },
    ],
    recommendedEquipment: [
      { id: "circular_saw", label: "Circular saw", required: false },
      { id: "drill", label: "Power drill", required: false },
      { id: "wheelbarrow", label: "Wheelbarrow or debris cart", required: false },
    ],
    vehicleRequirements: ["Truck or trailer for debris haul-away"],
    insuranceRequired: "$1M general liability",
  },
  {
    serviceId: "landscaping",
    serviceName: "Landscaping",
    minimumEquipment: [
      {
        id: "mower",
        label: "Commercial-grade mower",
        required: true,
        description: "Zero-turn OR walk-behind (21 inch minimum)",
        alternatives: ["Commercial zero-turn mower", "Commercial walk-behind mower"],
      },
      { id: "trimmer", label: "String trimmer (gas or battery, commercial grade)", required: true },
      { id: "edger", label: "Edger (blade or string)", required: true },
      { id: "blower", label: "Backpack blower (150+ MPH)", required: true },
      { id: "gas_cans", label: "Gas cans (if gas-powered equipment)", required: true },
      { id: "safety", label: "Ear protection and safety glasses", required: true },
    ],
    recommendedEquipment: [
      { id: "hedge_trimmer", label: "Hedge trimmer", required: false },
      { id: "rake", label: "Rake and hand tools", required: false },
      { id: "bags", label: "Lawn debris bags", required: false },
      { id: "trailer", label: "Enclosed trailer (for equipment transport)", required: false },
    ],
    certifications: ["Pesticide applicator license (if offering chemical treatments)"],
    vehicleRequirements: ["Truck or trailer to transport equipment"],
  },
  {
    serviceId: "carpet_cleaning",
    serviceName: "Carpet Cleaning",
    minimumEquipment: [
      {
        id: "extractor",
        label: "Truck-mount OR portable extractor (200+ PSI)",
        required: true,
        description: "Truck-mount preferred for HWE method",
        alternatives: ["Truck-mount system", "Portable extractor (200+ PSI, heated)"],
      },
      { id: "wands", label: "Carpet cleaning wands and tools", required: true },
      { id: "hoses", label: "Vacuum and solution hoses (100+ ft)", required: true },
      { id: "spot_kit", label: "Spot cleaning kit", required: true },
      { id: "solutions", label: "pH-neutral cleaning solutions", required: true },
      { id: "deodorizer", label: "Deodorizer", required: true },
    ],
    recommendedEquipment: [
      { id: "scotchgard", label: "Scotchgard protector", required: false },
      { id: "uv_light", label: "UV light (for pet stains)", required: false },
      { id: "air_movers", label: "Air movers / fans (for faster drying)", required: false },
      { id: "upholstery_tool", label: "Upholstery cleaning attachment", required: false },
    ],
    certifications: ["IICRC certification (recommended)", "Carpet & Upholstery Cleaning Technician"],
    insuranceRequired: "$1M general liability (water damage coverage)",
    vehicleRequirements: ["Van or truck (for truck-mount system)"],
  },
  {
    serviceId: "pool_cleaning",
    serviceName: "Pool Cleaning",
    minimumEquipment: [
      { id: "skimmer", label: "Pool skimmer net (leaf and fine mesh)", required: true },
      { id: "brush", label: "Pool brush (wall and floor)", required: true },
      { id: "vacuum", label: "Manual vacuum OR robotic cleaner", required: true },
      { id: "test_kit", label: "Water testing kit (pH, chlorine, alkalinity)", required: true },
      { id: "chemicals", label: "Pool chemicals (chlorine, pH adjuster, algaecide)", required: true },
    ],
    recommendedEquipment: [
      { id: "telescopic_pole", label: "Telescopic pole (8-16 ft)", required: false },
      { id: "filter_cleaner", label: "Filter cleaning tools", required: false },
      { id: "algae_brush", label: "Algae brush (for stubborn stains)", required: false },
    ],
    certifications: ["CPO (Certified Pool Operator) certification recommended"],
    insuranceRequired: "$1M general liability",
  },
  {
    serviceId: "home_cleaning",
    serviceName: "Home Cleaning",
    minimumEquipment: [
      { id: "vacuum", label: "Commercial vacuum (HEPA filter preferred)", required: true },
      { id: "mop", label: "Mop and bucket OR steam mop", required: true },
      { id: "supplies", label: "All-purpose cleaner, glass cleaner, disinfectant", required: true },
      { id: "microfiber", label: "Microfiber cloths (12+ cloths)", required: true },
      { id: "gloves", label: "Cleaning gloves", required: true },
    ],
    recommendedEquipment: [
      { id: "caddy", label: "Cleaning caddy / supply organizer", required: false },
      { id: "duster", label: "Extendable duster", required: false },
      { id: "scrub_brush", label: "Scrub brushes (various sizes)", required: false },
    ],
    insuranceRequired: "$1M general liability (theft and damage coverage)",
  },
  {
    serviceId: "home_consultation",
    serviceName: "AI Home Scan",
    minimumEquipment: [
      { id: "camera", label: "4K camera OR smartphone with 4K video", required: true },
      { id: "tablet", label: "Tablet or laptop (for digital forms)", required: true },
      { id: "measuring_tape", label: "Laser measuring tool or tape measure", required: true },
      { id: "flashlight", label: "High-powered flashlight", required: true },
    ],
    recommendedEquipment: [
      { id: "drone", label: "DJI drone (for aerial scans)", required: false, description: "Requires FAA Part 107" },
      { id: "thermal_camera", label: "Thermal imaging camera (for inspections)", required: false },
      { id: "moisture_meter", label: "Moisture meter", required: false },
    ],
    certifications: [
      "Level 3 Consultant certification (UpTend Academy)",
      "FAA Part 107 (for aerial drone scans)",
    ],
    insuranceRequired: "$1M general liability + E&O (errors & omissions)",
  },
  {
    serviceId: "moving_labor",
    serviceName: "Moving Labor",
    minimumEquipment: [
      { id: "dolly", label: "Hand truck / appliance dolly", required: true },
      { id: "straps", label: "Moving straps", required: true },
      { id: "gloves", label: "Work gloves", required: true },
    ],
    recommendedEquipment: [
      { id: "tools", label: "Basic tools (for disassembly/assembly)", required: false },
      { id: "blankets", label: "Moving blankets", required: false },
    ],
    insuranceRequired: "$1M general liability",
  },
  {
    serviceId: "handyman",
    serviceName: "Handyman Services",
    minimumEquipment: [
      { id: "drill", label: "Cordless drill/driver set", required: true },
      { id: "hammer", label: "Hammer", required: true },
      { id: "screwdrivers", label: "Screwdriver set (Phillips and flathead)", required: true },
      { id: "level", label: "Level (2-ft and/or torpedo)", required: true },
      { id: "tape_measure", label: "Tape measure (25 ft)", required: true },
      { id: "pliers", label: "Pliers set (needle-nose, channel locks)", required: true },
      { id: "utility_knife", label: "Utility knife", required: true },
    ],
    recommendedEquipment: [
      { id: "stud_finder", label: "Stud finder", required: false },
      { id: "saw", label: "Hand saw or circular saw", required: false },
      { id: "paint_supplies", label: "Paint brushes, rollers, trays", required: false },
      { id: "ladder", label: "6-ft step ladder", required: false },
      { id: "allen_keys", label: "Allen key/hex wrench set", required: false },
      { id: "adjustable_wrench", label: "Adjustable wrench", required: false },
    ],
    insuranceRequired: "$1M general liability",
  },
  {
    serviceId: "garage_cleanout",
    serviceName: "Garage Cleanout",
    minimumEquipment: [
      { id: "vehicle", label: "Truck or trailer", required: true },
      { id: "broom", label: "Broom and dustpan", required: true },
      { id: "bins", label: "Sorting bins (donate, keep, trash)", required: true },
      { id: "gloves", label: "Work gloves", required: true },
    ],
    recommendedEquipment: [
      { id: "shop_vac", label: "Shop vacuum", required: false },
      { id: "shelving", label: "Organizing shelving (upsell)", required: false },
    ],
    vehicleRequirements: ["Minimum 6 cubic yard capacity for full cleanouts"],
  },
  {
    serviceId: "truck_unloading",
    serviceName: "Truck Unloading",
    minimumEquipment: [
      { id: "dolly", label: "Hand truck / appliance dolly", required: true },
      { id: "straps", label: "Moving straps or lifting straps", required: true },
      { id: "gloves", label: "Work gloves", required: true },
    ],
    recommendedEquipment: [
      { id: "tools", label: "Basic tools (for furniture reassembly)", required: false },
    ],
    insuranceRequired: "$1M general liability",
  },
];

/**
 * Get equipment requirements for a specific service
 */
export function getEquipmentForService(serviceId: string): ServiceEquipmentRequirements | undefined {
  return EQUIPMENT_REQUIREMENTS.find((req) => req.serviceId === serviceId);
}

/**
 * Check if pro has required equipment for a service
 */
export function hasRequiredEquipment(
  serviceId: string,
  proEquipment: {
    hasPressureWasher?: boolean;
    hasTallLadder?: boolean;
    hasDemoTools?: boolean;
    hasTruckMount?: boolean;
    lawnEquipment?: {
      mower?: string;
      edger?: boolean;
      blower?: boolean;
      trimmer?: boolean;
    };
  }
): { hasEquipment: boolean; missingItems: string[] } {
  const requirements = getEquipmentForService(serviceId);
  if (!requirements) {
    return { hasEquipment: true, missingItems: [] };
  }

  const missingItems: string[] = [];

  // Check service-specific equipment
  switch (serviceId) {
    case "pressure_washing":
      if (!proEquipment.hasPressureWasher) {
        missingItems.push("Pressure washer (3000+ PSI)");
      }
      break;

    case "gutter_cleaning":
      if (!proEquipment.hasTallLadder) {
        missingItems.push("Extension ladder (24-32 ft)");
      }
      break;

    case "light_demolition":
      if (!proEquipment.hasDemoTools) {
        missingItems.push("Demolition tools");
      }
      break;

    case "landscaping":
      if (!proEquipment.lawnEquipment?.mower) {
        missingItems.push("Commercial mower");
      }
      if (!proEquipment.lawnEquipment?.trimmer) {
        missingItems.push("String trimmer");
      }
      if (!proEquipment.lawnEquipment?.edger) {
        missingItems.push("Edger");
      }
      if (!proEquipment.lawnEquipment?.blower) {
        missingItems.push("Backpack blower");
      }
      break;

    case "carpet_cleaning":
      if (!proEquipment.hasTruckMount) {
        missingItems.push("Truck-mount OR portable extractor (200+ PSI)");
      }
      break;

    default:
      // For services without specific equipment checks, assume they have it
      break;
  }

  return {
    hasEquipment: missingItems.length === 0,
    missingItems,
  };
}
