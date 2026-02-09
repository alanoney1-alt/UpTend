import { Sofa, Tv, Refrigerator, Bed, Package, Home, Armchair, Table2, Lamp, Monitor, Dumbbell, Trees, Trash2, Box, Camera, Truck, Clock, Users, LucideIcon } from "lucide-react";

export type ServiceType = "furniture_moving" | "garage_cleanout" | "truck_unloading" | "junk_removal";

export interface ServiceTypeConfig {
  id: ServiceType;
  label: string;
  description: string;
  icon: LucideIcon;
  pricingModel: "per_item" | "hourly";
  startingPrice: number;
}

// Starting prices: BulkSnap $99 (min load), GarageReset $299 (small), UnloadPro $80/hr per Pro, LiftCrew $80/hr per Pro
export const SERVICE_STARTING_PRICES: Record<string, number> = {
  junk_removal: 99,
  garage_cleanout: 299,
  truck_unloading: 80,
  furniture_moving: 99,
  pressure_washing: 120,
  gutter_cleaning: 149,
  moving_labor: 80,
  light_demolition: 199,
  home_consultation: 49, // DwellScan Standard base price
  home_consultation_aerial: 149, // DwellScan Aerial with drone
  home_cleaning: 99,
};

// DwellScan service configuration with two tiers
export interface DwellScanTier {
  id: string;
  name: string;
  brandedName: string;
  price: number;
  description: string;
  features: string[];
  requiresDrone?: boolean;
  popular?: boolean;
}

export const DWELLSCAN_TIERS: DwellScanTier[] = [
  {
    id: "standard",
    name: "Standard",
    brandedName: "DwellScan™ Standard",
    price: 49,
    description: "Full interior and exterior walkthrough with personalized maintenance report.",
    features: [
      "Full interior walkthrough (room-by-room photos and notes)",
      "Exterior ground-level assessment (foundation, driveway, walkways, landscaping)",
      "Major systems check (AC age, water heater, electrical, plumbing)",
      "Cleanliness rating per room (1-10)",
      "Personalized maintenance report with one-tap booking for recommended services",
    ],
    requiresDrone: false,
  },
  {
    id: "aerial",
    name: "Aerial",
    brandedName: "DwellScan™ Aerial",
    price: 149,
    description: "Everything in Standard plus drone-powered roof, gutter, and exterior aerial scan.",
    features: [
      "Everything in Standard PLUS:",
      "FAA Part 107 certified drone pilot flyover",
      "Aerial roof condition scan (missing shingles, sagging, moss, flashing damage)",
      "Gutter blockage assessment from above (percentage estimate)",
      "Chimney and vent inspection",
      "Tree overhang proximity to roof and power lines",
      "Siding and paint condition from aerial angle",
      "Pool enclosure / screen assessment (Florida-specific)",
      "Property drainage overview from aerial perspective",
      "Full before/after aerial photo set, timestamped and GPS-tagged",
    ],
    requiresDrone: true,
    popular: true, // Most Popular badge
  },
];

export const DWELLSCAN_SERVICE = {
  branded: "DwellScan",
  generic: "Home Audit",
  display: "DwellScan™ (Home Audit)",
  slug: "/dwellscan",
  startingPrice: 49,
  priceUnit: "flat",
  tagline: "Know your home inside out.",
  description: "A complete walkthrough of what your home needs. Your personalized maintenance roadmap. Add drone aerial scan for $149.",
  tiers: DWELLSCAN_TIERS,
};

export const SERVICE_TYPES: ServiceTypeConfig[] = [
  {
    id: "furniture_moving",
    label: "LiftCrew (Furniture Moving)",
    description: "Move furniture within or between locations",
    icon: Sofa,
    pricingModel: "per_item",
    startingPrice: SERVICE_STARTING_PRICES.furniture_moving,
  },
  {
    id: "garage_cleanout",
    label: "GarageReset™ (Garage Cleanout)",
    description: "Complete garage cleanout service",
    icon: Home,
    pricingModel: "per_item",
    startingPrice: SERVICE_STARTING_PRICES.garage_cleanout,
  },
  {
    id: "truck_unloading",
    label: "UnloadPro (Truck/U-Haul Unloading)",
    description: "Labor to unload your rental truck",
    icon: Truck,
    pricingModel: "hourly",
    startingPrice: SERVICE_STARTING_PRICES.truck_unloading,
  },
  {
    id: "junk_removal",
    label: "BulkSnap (Material Recovery)",
    description: "Remove unwanted items and debris",
    icon: Trash2,
    pricingModel: "per_item",
    startingPrice: SERVICE_STARTING_PRICES.junk_removal,
  },
];

export interface PricingItem {
  id: string;
  label: string;
  basePrice: number;
  category: string;
  icon: LucideIcon;
}

export interface BundlePackage {
  id: string;
  name: string;
  description: string;
  regularPrice: number;
  bundlePrice: number;
  savings: number;
  savingsPercent: number;
  items: string[];
  bestFor: string;
}

export interface LoadSizePackage {
  id: string;
  name: string;
  description: string;
  price: number;
  fits: string;
  example: string;
  competitorPrice: number;
  cubicFeet: number;
}

export interface GarageCleanoutPackage {
  id: string;
  name: string;
  price: number;
  description: string;
  itemsEstimate: string;
  duration: string;
  popular?: boolean;
}

export const GARAGE_CLEANOUT_PACKAGES: GarageCleanoutPackage[] = [
  {
    id: "small",
    name: "SMALL",
    price: 299,
    description: "Single-car garage, lightly filled",
    itemsEstimate: "~15-20 items",
    duration: "1-2 hours",
  },
  {
    id: "medium",
    name: "MEDIUM",
    price: 499,
    description: "Typical single-car",
    itemsEstimate: "~25-35 items",
    duration: "2-3 hours",
    popular: true,
  },
  {
    id: "large",
    name: "LARGE",
    price: 749,
    description: "Full single-car or half two-car",
    itemsEstimate: "~40-50 items",
    duration: "3-4 hours",
  },
  {
    id: "xl",
    name: "XL",
    price: 999,
    description: "Full two-car garage",
    itemsEstimate: "60+ items",
    duration: "4-5 hours",
  },
];

export const BUNDLE_DISCOUNT_TIERS = [
  { minItems: 1, maxItems: 2, discount: 0, label: "No discount" },
  { minItems: 3, maxItems: 5, discount: 0.10, label: "10% off" },
  { minItems: 6, maxItems: 10, discount: 0.15, label: "15% off" },
  { minItems: 11, maxItems: Infinity, discount: 0.20, label: "20% off" },
];

export const livingRoomItems: PricingItem[] = [
  { id: "sofa_3seat", label: "Sofa/Couch (3-seat)", basePrice: 75, category: "living_room", icon: Sofa },
  { id: "loveseat", label: "Loveseat (2-seat)", basePrice: 55, category: "living_room", icon: Sofa },
  { id: "sectional", label: "Sectional Sofa", basePrice: 125, category: "living_room", icon: Sofa },
  { id: "sleeper_sofa", label: "Sleeper Sofa", basePrice: 95, category: "living_room", icon: Sofa },
  { id: "recliner", label: "Recliner", basePrice: 55, category: "living_room", icon: Armchair },
  { id: "armchair", label: "Armchair", basePrice: 40, category: "living_room", icon: Armchair },
  { id: "ottoman", label: "Ottoman", basePrice: 25, category: "living_room", icon: Package },
  { id: "coffee_table", label: "Coffee Table", basePrice: 35, category: "living_room", icon: Table2 },
  { id: "end_table", label: "End Table", basePrice: 25, category: "living_room", icon: Table2 },
  { id: "tv_stand", label: "TV Stand", basePrice: 45, category: "living_room", icon: Tv },
  { id: "entertainment_center", label: "Entertainment Center", basePrice: 85, category: "living_room", icon: Tv },
  { id: "bookshelf_small", label: "Bookshelf (small)", basePrice: 30, category: "living_room", icon: Package },
  { id: "bookshelf_large", label: "Bookshelf (large)", basePrice: 55, category: "living_room", icon: Package },
];

export const bedroomItems: PricingItem[] = [
  { id: "twin_mattress", label: "Twin Mattress", basePrice: 40, category: "bedroom", icon: Bed },
  { id: "full_mattress", label: "Full Mattress", basePrice: 50, category: "bedroom", icon: Bed },
  { id: "queen_mattress", label: "Queen Mattress", basePrice: 60, category: "bedroom", icon: Bed },
  { id: "king_mattress", label: "King Mattress", basePrice: 75, category: "bedroom", icon: Bed },
  { id: "box_spring", label: "Box Spring (any)", basePrice: 40, category: "bedroom", icon: Bed },
  { id: "twin_bed_frame", label: "Twin Bed Frame", basePrice: 45, category: "bedroom", icon: Bed },
  { id: "full_bed_frame", label: "Full Bed Frame", basePrice: 55, category: "bedroom", icon: Bed },
  { id: "queen_bed_frame", label: "Queen Bed Frame", basePrice: 65, category: "bedroom", icon: Bed },
  { id: "king_bed_frame", label: "King Bed Frame", basePrice: 85, category: "bedroom", icon: Bed },
  { id: "dresser_4drawer", label: "Dresser (4-drawer)", basePrice: 55, category: "bedroom", icon: Package },
  { id: "dresser_6drawer", label: "Dresser (6+ drawer)", basePrice: 75, category: "bedroom", icon: Package },
  { id: "nightstand", label: "Nightstand", basePrice: 30, category: "bedroom", icon: Lamp },
  { id: "armoire", label: "Armoire/Wardrobe", basePrice: 85, category: "bedroom", icon: Package },
  { id: "chest_of_drawers", label: "Chest of Drawers", basePrice: 65, category: "bedroom", icon: Package },
];

export const diningRoomItems: PricingItem[] = [
  { id: "dining_table_4", label: "Dining Table (4-person)", basePrice: 55, category: "dining_room", icon: Table2 },
  { id: "dining_table_6", label: "Dining Table (6-person)", basePrice: 75, category: "dining_room", icon: Table2 },
  { id: "dining_table_8", label: "Dining Table (8+ person)", basePrice: 95, category: "dining_room", icon: Table2 },
  { id: "dining_chair", label: "Dining Chair", basePrice: 20, category: "dining_room", icon: Armchair },
  { id: "china_cabinet", label: "China Cabinet", basePrice: 85, category: "dining_room", icon: Package },
  { id: "buffet", label: "Buffet/Sideboard", basePrice: 65, category: "dining_room", icon: Package },
];

export const officeItems: PricingItem[] = [
  { id: "desk_small", label: "Desk (small)", basePrice: 45, category: "office", icon: Table2 },
  { id: "desk_large", label: "Desk (large)", basePrice: 75, category: "office", icon: Table2 },
  { id: "office_chair", label: "Office Chair", basePrice: 35, category: "office", icon: Armchair },
  { id: "filing_cabinet_2", label: "Filing Cabinet (2-drawer)", basePrice: 40, category: "office", icon: Package },
  { id: "filing_cabinet_4", label: "Filing Cabinet (4-drawer)", basePrice: 55, category: "office", icon: Package },
  { id: "bookcase", label: "Bookcase", basePrice: 45, category: "office", icon: Package },
];

export const kitchenApplianceItems: PricingItem[] = [
  { id: "refrigerator", label: "Refrigerator", basePrice: 85, category: "appliances", icon: Refrigerator },
  { id: "refrigerator_french", label: "Refrigerator (French door)", basePrice: 105, category: "appliances", icon: Refrigerator },
  { id: "freezer_upright", label: "Freezer (upright)", basePrice: 75, category: "appliances", icon: Refrigerator },
  { id: "stove_electric", label: "Stove/Range (electric)", basePrice: 75, category: "appliances", icon: Home },
  { id: "stove_gas", label: "Stove/Range (gas)", basePrice: 85, category: "appliances", icon: Home },
  { id: "dishwasher", label: "Dishwasher", basePrice: 65, category: "appliances", icon: Home },
  { id: "microwave_countertop", label: "Microwave (countertop)", basePrice: 25, category: "appliances", icon: Home },
  { id: "microwave_overrange", label: "Microwave (over-range)", basePrice: 40, category: "appliances", icon: Home },
];

export const laundryApplianceItems: PricingItem[] = [
  { id: "washer_top", label: "Washer (top load)", basePrice: 75, category: "appliances", icon: Home },
  { id: "washer_front", label: "Washer (front load)", basePrice: 85, category: "appliances", icon: Home },
  { id: "dryer_electric", label: "Dryer (electric)", basePrice: 75, category: "appliances", icon: Home },
  { id: "dryer_gas", label: "Dryer (gas)", basePrice: 85, category: "appliances", icon: Home },
];

export const electronicsItems: PricingItem[] = [
  { id: "tv_under40", label: "TV (under 40\")", basePrice: 30, category: "electronics", icon: Tv },
  { id: "tv_40_55", label: "TV (40\"-55\")", basePrice: 45, category: "electronics", icon: Tv },
  { id: "tv_55_70", label: "TV (55\"-70\")", basePrice: 65, category: "electronics", icon: Tv },
  { id: "tv_over70", label: "TV (70\"+)", basePrice: 85, category: "electronics", icon: Tv },
  { id: "computer_monitor", label: "Computer/Monitor", basePrice: 20, category: "electronics", icon: Monitor },
  { id: "printer", label: "Printer", basePrice: 20, category: "electronics", icon: Monitor },
  { id: "treadmill", label: "Treadmill", basePrice: 75, category: "electronics", icon: Dumbbell },
  { id: "elliptical", label: "Elliptical", basePrice: 85, category: "electronics", icon: Dumbbell },
  { id: "exercise_bike", label: "Exercise Bike", basePrice: 55, category: "electronics", icon: Dumbbell },
];

export const outdoorItems: PricingItem[] = [
  { id: "patio_chair", label: "Patio Chair", basePrice: 25, category: "outdoor", icon: Armchair },
  { id: "patio_table", label: "Patio Table", basePrice: 45, category: "outdoor", icon: Table2 },
  { id: "grill_small", label: "Grill (small)", basePrice: 40, category: "outdoor", icon: Home },
  { id: "grill_large", label: "Grill (large)", basePrice: 65, category: "outdoor", icon: Home },
  { id: "lawnmower", label: "Lawnmower (push)", basePrice: 35, category: "outdoor", icon: Trees },
];

export const boxesItems: PricingItem[] = [
  { id: "box_small", label: "Small Box (1.5 cu ft)", basePrice: 5, category: "boxes", icon: Box },
  { id: "box_medium", label: "Medium Box (3 cu ft)", basePrice: 8, category: "boxes", icon: Box },
  { id: "box_large", label: "Large Box (4.5 cu ft)", basePrice: 12, category: "boxes", icon: Box },
  { id: "box_wardrobe", label: "Wardrobe Box", basePrice: 15, category: "boxes", icon: Box },
  { id: "box_misc", label: "Misc/Bags", basePrice: 5, category: "boxes", icon: Package },
];

export const debrisTrashItems: PricingItem[] = [
  { id: "debris_photo_required", label: "Debris/Trash (Photo Required)", basePrice: 0, category: "debris", icon: Camera },
];

export const BOX_PRICING = {
  small: { price: 5, label: "Small Box (1.5 cu ft)", description: "Books, small items" },
  medium: { price: 8, label: "Medium Box (3 cu ft)", description: "Kitchen items, clothes" },
  large: { price: 12, label: "Large Box (4.5 cu ft)", description: "Bedding, bulky items" },
  wardrobe: { price: 15, label: "Wardrobe Box", description: "Hanging clothes" },
  misc: { price: 5, label: "Misc/Bags", description: "Trash bags, loose items" },
};

export const allJunkRemovalItems: PricingItem[] = [
  ...livingRoomItems,
  ...bedroomItems,
  ...diningRoomItems,
  ...officeItems,
  ...kitchenApplianceItems,
  ...laundryApplianceItems,
  ...electronicsItems,
  ...outdoorItems,
  ...boxesItems,
];

export const itemCategories = [
  { id: "living_room", label: "Living Room", items: livingRoomItems, requiresPhoto: false },
  { id: "bedroom", label: "Bedroom", items: bedroomItems, requiresPhoto: false },
  { id: "dining_room", label: "Dining Room", items: diningRoomItems, requiresPhoto: false },
  { id: "office", label: "Office", items: officeItems, requiresPhoto: false },
  { id: "appliances", label: "Kitchen Appliances", items: kitchenApplianceItems, requiresPhoto: false },
  { id: "laundry", label: "Laundry", items: laundryApplianceItems, requiresPhoto: false },
  { id: "electronics", label: "Electronics", items: electronicsItems, requiresPhoto: false },
  { id: "outdoor", label: "Outdoor", items: outdoorItems, requiresPhoto: false },
  { id: "boxes", label: "Boxes & Misc", items: boxesItems, requiresPhoto: false },
  { id: "debris", label: "Debris & Trash", items: debrisTrashItems, requiresPhoto: true },
];

export const furnitureMovingCategories = [
  { id: "living_room", label: "Living Room", items: livingRoomItems, requiresPhoto: false },
  { id: "bedroom", label: "Bedroom", items: bedroomItems, requiresPhoto: false },
  { id: "dining_room", label: "Dining Room", items: diningRoomItems, requiresPhoto: false },
  { id: "office", label: "Office", items: officeItems, requiresPhoto: false },
  { id: "boxes", label: "Boxes & Misc", items: boxesItems, requiresPhoto: false },
];

export const garageCleanoutCategories = [
  { id: "appliances", label: "Kitchen Appliances", items: kitchenApplianceItems, requiresPhoto: false },
  { id: "laundry", label: "Laundry Appliances", items: laundryApplianceItems, requiresPhoto: false },
  { id: "outdoor", label: "Outdoor/Lawn", items: outdoorItems, requiresPhoto: false },
  { id: "boxes", label: "Boxes & Storage", items: boxesItems, requiresPhoto: false },
];

export const junkRemovalCategories = [
  { id: "living_room", label: "Living Room", items: livingRoomItems, requiresPhoto: false },
  { id: "bedroom", label: "Bedroom", items: bedroomItems, requiresPhoto: false },
  { id: "dining_room", label: "Dining Room", items: diningRoomItems, requiresPhoto: false },
  { id: "office", label: "Office", items: officeItems, requiresPhoto: false },
  { id: "appliances", label: "Kitchen Appliances", items: kitchenApplianceItems, requiresPhoto: false },
  { id: "laundry", label: "Laundry", items: laundryApplianceItems, requiresPhoto: false },
  { id: "electronics", label: "Electronics", items: electronicsItems, requiresPhoto: false },
  { id: "outdoor", label: "Outdoor", items: outdoorItems, requiresPhoto: false },
  { id: "boxes", label: "Boxes & Misc", items: boxesItems, requiresPhoto: false },
  { id: "debris", label: "Debris & Trash", items: debrisTrashItems, requiresPhoto: true },
];

export function getCategoriesForService(serviceType: ServiceType) {
  switch (serviceType) {
    case "furniture_moving":
      return furnitureMovingCategories;
    case "garage_cleanout":
      return garageCleanoutCategories;
    case "junk_removal":
      return junkRemovalCategories;
    default:
      return itemCategories;
  }
}

export function getItemsForService(serviceType: ServiceType): PricingItem[] {
  const categories = getCategoriesForService(serviceType);
  return categories.flatMap(cat => cat.items);
}

export interface TruckUnloadingConfig {
  id: string;
  truckSize: string;
  description: string;
}

export const TRUCK_UNLOADING_SIZES: TruckUnloadingConfig[] = [
  { id: "10ft", truckSize: "10ft Truck", description: "Small apartment, 1 bedroom" },
  { id: "15ft", truckSize: "15ft Truck", description: "1-2 bedroom apartment" },
  { id: "20ft", truckSize: "20ft Truck", description: "2-3 bedroom home" },
  { id: "26ft", truckSize: "26ft Truck", description: "3-4 bedroom home" },
];

export interface CrewSizeOption {
  id: number;
  label: string;
  description: string;
}

export const CREW_SIZE_OPTIONS: CrewSizeOption[] = [
  { id: 1, label: "1 Person", description: "Solo Pro" },
  { id: 2, label: "2 People", description: "Pro + 1 helper" },
  { id: 3, label: "3 People", description: "Pro + 2 helpers" },
];

export const HOURLY_RATE_PER_PRO = 80; // $80/hr per Pro for LiftCrew and UnloadPro
export const DEFAULT_HOURS = 1;
export const MAX_HOURS = 8;

export const STAIRS_FLAT_FEE = 25;

export const TRUCK_UNLOADING_EXTRAS: PricingItem[] = [
  { id: "stairs", label: "Stairs (flat fee)", basePrice: STAIRS_FLAT_FEE, category: "surcharge", icon: Home },
  { id: "long_carry", label: "Long Carry (50+ ft)", basePrice: 30, category: "surcharge", icon: Truck },
  { id: "heavy_item", label: "Heavy Item (100+ lbs)", basePrice: 25, category: "surcharge", icon: Package },
];

export function calculateTruckUnloadingPrice(crewSize: number, hours: number, extras: Record<string, number>): number {
  const laborCost = HOURLY_RATE_PER_PRO * crewSize * hours;
  let extrasCost = 0;
  TRUCK_UNLOADING_EXTRAS.forEach(extra => {
    const qty = extras[extra.id] || 0;
    extrasCost += extra.basePrice * qty;
  });
  return laborCost + extrasCost;
}

export const bundlePackages: BundlePackage[] = [
  {
    id: "college_moveout",
    name: "College Move-Out",
    description: "Perfect for dorm or apartment move-out",
    regularPrice: 180,
    bundlePrice: 129,
    savings: 51,
    savingsPercent: 28,
    items: ["Twin mattress", "Twin bed frame", "Small desk", "Bookshelf", "3 boxes misc"],
    bestFor: "Single room",
  },
  {
    id: "bedroom_refresh",
    name: "Bedroom Refresh",
    description: "Complete bedroom furniture removal",
    regularPrice: 270,
    bundlePrice: 179,
    savings: 91,
    savingsPercent: 28,
    items: ["Queen mattress", "Queen bed frame", "Dresser", "2 Nightstands", "TV"],
    bestFor: "Bedroom upgrade",
  },
  {
    id: "kitchen_upgrade",
    name: "Kitchen Upgrade",
    description: "Remove old kitchen appliances",
    regularPrice: 305,
    bundlePrice: 219,
    savings: 86,
    savingsPercent: 28,
    items: ["Refrigerator", "Stove", "Dishwasher", "Microwave", "3 misc items"],
    bestFor: "Kitchen renovation",
  },
  {
    id: "apartment_cleanout",
    name: "Apartment Cleanout",
    description: "Full apartment move-out",
    regularPrice: 505,
    bundlePrice: 329,
    savings: 176,
    savingsPercent: 28,
    items: ["Couch", "Queen mattress", "Bed frame", "Dresser", "Dining table", "4 chairs", "TV", "Misc items"],
    bestFor: "Move-out, renovation",
  },
  {
    id: "house_cleanout",
    name: "Full House Cleanout",
    description: "Complete house cleanout",
    regularPrice: 770,
    bundlePrice: 549,
    savings: 221,
    savingsPercent: 29,
    items: ["Living room set", "Bedroom set", "Kitchen appliances", "Dining set"],
    bestFor: "Estate sale, full renovation",
  },
];

export const loadSizePackages: LoadSizePackage[] = [
  {
    id: "minimum",
    name: "Minimum Load",
    description: "Under 1/8 truck",
    price: 99,
    fits: "1-2 small items",
    example: "Coffee table + chair OR Microwave + boxes",
    competitorPrice: 139,
    cubicFeet: 25, // Under 1/8 of standard truck bed (8 cu yd = 216 cu ft)
  },
  {
    id: "eighth",
    name: "1/8 Truck",
    description: "Small pickup load",
    price: 179,
    fits: "2-4 items, ~27 cu ft",
    example: "Mattress + small table OR 2 chairs + boxes",
    competitorPrice: 199,
    cubicFeet: 27, // 1/8 of 216 cu ft
  },
  {
    id: "quarter",
    name: "1/4 Truck",
    description: "Quarter truck load",
    price: 279,
    fits: "4-6 items, ~54 cu ft",
    example: "Couch + small desk OR Dresser + chairs",
    competitorPrice: 349,
    cubicFeet: 54, // 1/4 of 216 cu ft
  },
  {
    id: "half",
    name: "1/2 Truck",
    description: "Half truck load",
    price: 379,
    fits: "6-10 items, ~108 cu ft",
    example: "Bedroom set OR Living room furniture",
    competitorPrice: 499,
    cubicFeet: 108, // 1/2 of 216 cu ft
  },
  {
    id: "three_quarter",
    name: "3/4 Truck",
    description: "Three-quarter truck load",
    price: 449,
    fits: "11-15 items, ~162 cu ft",
    example: "Full apartment OR Large garage cleanout",
    competitorPrice: 599,
    cubicFeet: 162, // 3/4 of 216 cu ft
  },
  {
    id: "full",
    name: "Full Truck",
    description: "Full truck load",
    price: 549,
    fits: "Entire truckload, ~216 cu ft",
    example: "Multiple rooms, estate cleanout",
    competitorPrice: 749,
    cubicFeet: 216, // Standard pickup truck bed = 8 cu yd
  },
];

export function getDiscountTier(itemCount: number): typeof BUNDLE_DISCOUNT_TIERS[0] {
  return BUNDLE_DISCOUNT_TIERS.find(
    tier => itemCount >= tier.minItems && itemCount <= tier.maxItems
  ) || BUNDLE_DISCOUNT_TIERS[0];
}

export function getNextDiscountTier(itemCount: number): typeof BUNDLE_DISCOUNT_TIERS[0] | null {
  const currentIndex = BUNDLE_DISCOUNT_TIERS.findIndex(
    tier => itemCount >= tier.minItems && itemCount <= tier.maxItems
  );
  if (currentIndex < BUNDLE_DISCOUNT_TIERS.length - 1) {
    return BUNDLE_DISCOUNT_TIERS[currentIndex + 1];
  }
  return null;
}

export function calculateBundlePrice(
  items: PricingItem[],
  quantities: Record<string, number>
): {
  subtotal: number;
  discount: number;
  discountPercent: number;
  total: number;
  itemCount: number;
  tier: typeof BUNDLE_DISCOUNT_TIERS[0];
  nextTier: typeof BUNDLE_DISCOUNT_TIERS[0] | null;
  itemsToNextTier: number;
  potentialExtraSavings: number;
} {
  let subtotal = 0;
  let itemCount = 0;

  items.forEach(item => {
    const qty = quantities[item.id] || 0;
    subtotal += item.basePrice * qty;
    itemCount += qty;
  });

  const tier = getDiscountTier(itemCount);
  const nextTier = getNextDiscountTier(itemCount);
  
  const discount = subtotal * tier.discount;
  const total = subtotal - discount;
  
  const itemsToNextTier = nextTier ? nextTier.minItems - itemCount : 0;
  
  let potentialExtraSavings = 0;
  if (nextTier) {
    const potentialNewDiscount = subtotal * nextTier.discount;
    potentialExtraSavings = potentialNewDiscount - discount;
  }

  return {
    subtotal,
    discount,
    discountPercent: tier.discount * 100,
    total,
    itemCount,
    tier,
    nextTier,
    itemsToNextTier,
    potentialExtraSavings,
  };
}

export function getItemPrice(basePrice: number, itemCount: number): number {
  const tier = getDiscountTier(itemCount);
  return Math.round(basePrice * (1 - tier.discount));
}
