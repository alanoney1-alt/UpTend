export type ItemCategory = {
  name: string;
  description: string;
  items: Array<{ id: string; label: string; basePrice: number }>;
};

export const junkRemovalCategories: ItemCategory[] = [
  {
    name: "Living Room Furniture",
    description: "Sofas, chairs, and living room pieces",
    items: [
      { id: "sofa_3_seater", label: "Sofa/Couch (3-seater)", basePrice: 75 },
      { id: "loveseat", label: "Loveseat (2-seater)", basePrice: 55 },
      { id: "sectional_sofa", label: "Sectional Sofa", basePrice: 125 },
      { id: "sleeper_sofa", label: "Sleeper Sofa", basePrice: 95 },
      { id: "recliner", label: "Recliner", basePrice: 55 },
      { id: "armchair", label: "Armchair", basePrice: 40 },
      { id: "ottoman", label: "Ottoman", basePrice: 25 },
      { id: "coffee_table", label: "Coffee Table", basePrice: 35 },
      { id: "end_table", label: "End Table", basePrice: 25 },
      { id: "tv_stand", label: "TV Stand", basePrice: 45 },
      { id: "entertainment_center", label: "Entertainment Center", basePrice: 85 },
      { id: "bookshelf_small", label: "Bookshelf (small)", basePrice: 30 },
      { id: "bookshelf_large", label: "Bookshelf (large)", basePrice: 55 },
    ],
  },
  {
    name: "Bedroom Furniture",
    description: "Beds, mattresses, and bedroom pieces",
    items: [
      { id: "twin_mattress", label: "Twin Mattress", basePrice: 40 },
      { id: "full_mattress", label: "Full Mattress", basePrice: 50 },
      { id: "queen_mattress", label: "Queen Mattress", basePrice: 60 },
      { id: "king_mattress", label: "King Mattress", basePrice: 75 },
      { id: "box_spring", label: "Box Spring (any size)", basePrice: 40 },
      { id: "twin_bed_frame", label: "Twin Bed Frame", basePrice: 45 },
      { id: "full_bed_frame", label: "Full Bed Frame", basePrice: 55 },
      { id: "queen_bed_frame", label: "Queen Bed Frame", basePrice: 65 },
      { id: "king_bed_frame", label: "King Bed Frame", basePrice: 85 },
      { id: "dresser_4_drawer", label: "Dresser (4-drawer)", basePrice: 55 },
      { id: "dresser_6_drawer", label: "Dresser (6+ drawer)", basePrice: 75 },
      { id: "nightstand", label: "Nightstand", basePrice: 30 },
      { id: "armoire", label: "Armoire/Wardrobe", basePrice: 85 },
      { id: "chest_of_drawers", label: "Chest of Drawers", basePrice: 65 },
    ],
  },
  {
    name: "Dining Room Furniture",
    description: "Tables, chairs, and dining pieces",
    items: [
      { id: "dining_table_4", label: "Dining Table (4-person)", basePrice: 55 },
      { id: "dining_table_6", label: "Dining Table (6-person)", basePrice: 75 },
      { id: "dining_table_8", label: "Dining Table (8+ person)", basePrice: 95 },
      { id: "dining_chair", label: "Dining Chair", basePrice: 20 },
      { id: "dining_chairs_4", label: "Dining Chairs (set of 4)", basePrice: 65 },
      { id: "dining_chairs_6", label: "Dining Chairs (set of 6)", basePrice: 90 },
      { id: "china_cabinet", label: "China Cabinet", basePrice: 85 },
      { id: "buffet_sideboard", label: "Buffet/Sideboard", basePrice: 65 },
      { id: "bar_cart", label: "Bar Cart", basePrice: 35 },
    ],
  },
  {
    name: "Office Furniture",
    description: "Desks, chairs, and office equipment",
    items: [
      { id: "desk_small", label: "Desk (small)", basePrice: 45 },
      { id: "desk_large", label: "Desk (large/executive)", basePrice: 75 },
      { id: "office_chair", label: "Office Chair", basePrice: 35 },
      { id: "filing_cabinet_2", label: "Filing Cabinet (2-drawer)", basePrice: 40 },
      { id: "filing_cabinet_4", label: "Filing Cabinet (4-drawer)", basePrice: 55 },
      { id: "bookcase", label: "Bookcase", basePrice: 45 },
      { id: "conference_table", label: "Conference Table", basePrice: 95 },
    ],
  },
  {
    name: "Outdoor Furniture",
    description: "Patio, garden, and outdoor pieces",
    items: [
      { id: "patio_chair", label: "Patio Chair", basePrice: 25 },
      { id: "patio_table", label: "Patio Table", basePrice: 45 },
      { id: "patio_set_4", label: "Patio Set (4 pieces)", basePrice: 85 },
      { id: "outdoor_sofa", label: "Outdoor Sofa", basePrice: 75 },
      { id: "umbrella_canopy", label: "Umbrella/Canopy", basePrice: 30 },
      { id: "grill_small", label: "Grill (small)", basePrice: 40 },
      { id: "grill_large", label: "Grill (large)", basePrice: 65 },
    ],
  },
  {
    name: "Kitchen Appliances",
    description: "Refrigerators, stoves, and kitchen equipment",
    items: [
      { id: "refrigerator", label: "Refrigerator", basePrice: 85 },
      { id: "refrigerator_french_door", label: "Refrigerator (French door)", basePrice: 105 },
      { id: "freezer_upright", label: "Freezer (upright)", basePrice: 75 },
      { id: "freezer_chest", label: "Freezer (chest)", basePrice: 65 },
      { id: "stove_electric", label: "Stove/Range (electric)", basePrice: 75 },
      { id: "stove_gas", label: "Stove/Range (gas)", basePrice: 85 },
      { id: "dishwasher", label: "Dishwasher", basePrice: 65 },
      { id: "microwave_countertop", label: "Microwave (countertop)", basePrice: 25 },
      { id: "microwave_over_range", label: "Microwave (over-range)", basePrice: 40 },
      { id: "wall_oven", label: "Oven (wall)", basePrice: 85 },
      { id: "cooktop", label: "Cooktop", basePrice: 55 },
      { id: "range_hood", label: "Range Hood", basePrice: 45 },
    ],
  },
  {
    name: "Laundry Appliances",
    description: "Washers, dryers, and laundry equipment",
    items: [
      { id: "washer_top_load", label: "Washer (top load)", basePrice: 75 },
      { id: "washer_front_load", label: "Washer (front load)", basePrice: 85 },
      { id: "dryer_electric", label: "Dryer (electric)", basePrice: 75 },
      { id: "dryer_gas", label: "Dryer (gas)", basePrice: 85 },
      { id: "washer_dryer_combo", label: "Washer/Dryer Combo", basePrice: 145 },
      { id: "washer_dryer_pair", label: "Washer & Dryer (pair)", basePrice: 140 },
    ],
  },
  {
    name: "Electronics & Entertainment",
    description: "TVs, computers, and electronics disposal",
    items: [
      { id: "tv_under_40", label: "TV (under 40\")", basePrice: 30 },
      { id: "tv_40_55", label: "TV (40\"-55\")", basePrice: 45 },
      { id: "tv_55_70", label: "TV (55\"-70\")", basePrice: 65 },
      { id: "tv_70_plus", label: "TV (70\"+)", basePrice: 85 },
      { id: "computer_monitor", label: "Computer Monitor", basePrice: 20 },
      { id: "desktop_computer", label: "Desktop Computer", basePrice: 30 },
      { id: "printer", label: "Printer", basePrice: 20 },
      { id: "stereo_system", label: "Stereo System", basePrice: 35 },
      { id: "speakers_pair", label: "Speakers (pair)", basePrice: 25 },
      { id: "crt_tv_monitor", label: "CRT TV/Monitor", basePrice: 40 },
    ],
  },
  {
    name: "Exercise Equipment",
    description: "Treadmills, gym equipment, and fitness gear",
    items: [
      { id: "treadmill", label: "Treadmill", basePrice: 75 },
      { id: "elliptical", label: "Elliptical", basePrice: 85 },
      { id: "exercise_bike", label: "Exercise Bike", basePrice: 55 },
      { id: "weight_bench", label: "Weight Bench", basePrice: 45 },
    ],
  },
  {
    name: "Other Appliances",
    description: "HVAC, water heaters, and misc appliances",
    items: [
      { id: "water_heater", label: "Water Heater", basePrice: 95 },
      { id: "ac_window", label: "Air Conditioner (window)", basePrice: 40 },
      { id: "ac_portable", label: "Air Conditioner (portable)", basePrice: 35 },
      { id: "dehumidifier", label: "Dehumidifier", basePrice: 30 },
      { id: "space_heater", label: "Space Heater", basePrice: 20 },
      { id: "ceiling_fan", label: "Ceiling Fan", basePrice: 30 },
      { id: "vacuum_cleaner", label: "Vacuum Cleaner", basePrice: 20 },
    ],
  },
  {
    name: "Home Items",
    description: "Rugs, mirrors, lamps, and household decor",
    items: [
      { id: "carpet_small", label: "Carpet/Rug (small)", basePrice: 25 },
      { id: "carpet_large", label: "Carpet/Rug (large)", basePrice: 45 },
      { id: "mirror_small", label: "Mirror (small)", basePrice: 20 },
      { id: "mirror_large", label: "Mirror (large)", basePrice: 35 },
      { id: "picture_small", label: "Picture/Artwork (small)", basePrice: 15 },
      { id: "picture_large", label: "Picture/Artwork (large)", basePrice: 30 },
      { id: "lamp_table", label: "Lamp (table)", basePrice: 15 },
      { id: "lamp_floor", label: "Lamp (floor)", basePrice: 25 },
      { id: "chandelier", label: "Chandelier", basePrice: 40 },
      { id: "curtains_blinds", label: "Curtains/Blinds", basePrice: 15 },
      { id: "fan_standing", label: "Fan (box/standing)", basePrice: 15 },
    ],
  },
  {
    name: "Storage & Organization",
    description: "Shelving, cabinets, and storage items",
    items: [
      { id: "storage_bin", label: "Storage Bin/Tote", basePrice: 10 },
      { id: "trunk_chest", label: "Trunk/Chest", basePrice: 35 },
      { id: "shelving_metal", label: "Shelving Unit (metal)", basePrice: 35 },
      { id: "garage_shelving", label: "Garage Shelving", basePrice: 45 },
      { id: "tool_chest", label: "Tool Chest", basePrice: 40 },
      { id: "storage_cabinet", label: "Storage Cabinet", basePrice: 55 },
    ],
  },
  {
    name: "Baby & Kids Items",
    description: "Cribs, strollers, and children's furniture",
    items: [
      { id: "crib", label: "Crib", basePrice: 45 },
      { id: "changing_table", label: "Changing Table", basePrice: 35 },
      { id: "high_chair", label: "High Chair", basePrice: 25 },
      { id: "stroller", label: "Stroller", basePrice: 20 },
      { id: "toy_box", label: "Toy Box", basePrice: 25 },
      { id: "kids_bed_toddler", label: "Kids Bed (toddler)", basePrice: 40 },
      { id: "bunk_bed", label: "Bunk Bed", basePrice: 85 },
      { id: "loft_bed", label: "Loft Bed", basePrice: 75 },
      { id: "play_structure", label: "Play Structure", basePrice: 65 },
    ],
  },
  {
    name: "Building Materials",
    description: "Doors, windows, fixtures, and construction items",
    items: [
      { id: "door_interior", label: "Door (interior)", basePrice: 25 },
      { id: "door_exterior", label: "Door (exterior)", basePrice: 40 },
      { id: "window", label: "Window", basePrice: 30 },
      { id: "cabinet_kitchen", label: "Cabinet (kitchen)", basePrice: 35 },
      { id: "countertop", label: "Countertop (section)", basePrice: 45 },
      { id: "toilet", label: "Toilet", basePrice: 55 },
      { id: "sink", label: "Sink", basePrice: 35 },
      { id: "bathtub", label: "Bathtub", basePrice: 95 },
      { id: "flooring", label: "Flooring (per room)", basePrice: 75 },
    ],
  },
  {
    name: "Yard & Garden",
    description: "Lawn equipment and outdoor items",
    items: [
      { id: "lawn_mower_push", label: "Lawn Mower (push)", basePrice: 40 },
      { id: "lawn_mower_riding", label: "Lawn Mower (riding)", basePrice: 125 },
      { id: "wheelbarrow", label: "Wheelbarrow", basePrice: 25 },
      { id: "ladder", label: "Ladder", basePrice: 30 },
      { id: "garden_hose", label: "Garden Hose", basePrice: 10 },
      { id: "planters_pots", label: "Planters/Pots", basePrice: 15 },
      { id: "swing_set", label: "Swing Set", basePrice: 85 },
      { id: "trampoline", label: "Trampoline", basePrice: 75 },
      { id: "hot_tub", label: "Hot Tub", basePrice: 200 },
      { id: "pool_above_ground", label: "Pool (above ground)", basePrice: 150 },
    ],
  },
  {
    name: "Miscellaneous",
    description: "Bags, boxes, and other items",
    items: [
      { id: "bags_trash", label: "Bags of Trash (each)", basePrice: 15 },
      { id: "boxes_misc", label: "Boxes (each)", basePrice: 10 },
      { id: "construction_debris", label: "Construction Debris (per load)", basePrice: 85 },
      { id: "yard_waste", label: "Yard Waste (per load)", basePrice: 60 },
      { id: "tires", label: "Tires (each)", basePrice: 20 },
      { id: "piano_upright", label: "Piano (upright)", basePrice: 150 },
      { id: "piano_grand", label: "Piano (grand)", basePrice: 250 },
      { id: "safe", label: "Safe", basePrice: 85 },
      { id: "pool_table", label: "Pool Table", basePrice: 175 },
    ],
  },
];

export const truckUnloadingOptions = [
  { id: "10ft", label: "10ft Truck", description: "Studio or 1BR", basePrice: 149 },
  { id: "15ft", label: "15ft Truck", description: "1-2 Bedroom", basePrice: 199 },
  { id: "20ft", label: "20ft Truck", description: "2-3 Bedroom", basePrice: 279 },
  { id: "26ft", label: "26ft Truck", description: "3-4+ Bedroom", basePrice: 379 },
];

export function getAllItemsFlat() {
  return junkRemovalCategories.flatMap(cat => cat.items);
}

export function getItemById(id: string) {
  return getAllItemsFlat().find(item => item.id === id);
}

export function getItemPrice(id: string): number {
  const item = getItemById(id);
  return item?.basePrice ?? 0;
}
