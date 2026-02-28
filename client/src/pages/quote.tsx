import { useState, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { 
  ArrowRight, 
  ArrowLeft,
  Camera, 
  Upload, 
  Package, 
  Truck,
  Loader2,
  Sparkles,
  CheckCircle,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GeorgeIntervention, getGeorgeIntervention } from "@/components/ai/george-intervention";

const serviceLabels: Record<string, string> = {
  furniture_moving: "Furniture Moving",
  truck_unloading: "Truck Unloading",
  garage_cleanout: "Garage Cleanout",
  junk_removal: "Junk Removal",
};

type ItemCategory = {
  name: string;
  description: string;
  items: Array<{ id: string; label: string; basePrice: number }>;
};

const junkRemovalCategories: ItemCategory[] = [
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
      { id: "sink_bathroom", label: "Sink (bathroom)", basePrice: 25 },
      { id: "sink_kitchen", label: "Sink (kitchen)", basePrice: 35 },
      { id: "toilet", label: "Toilet", basePrice: 35 },
      { id: "bathtub", label: "Bathtub", basePrice: 85 },
      { id: "shower_stall", label: "Shower Stall", basePrice: 75 },
      { id: "vanity", label: "Vanity", basePrice: 55 },
    ],
  },
  {
    name: "Yard & Garden",
    description: "Lawn equipment, outdoor structures, and tools",
    items: [
      { id: "lawnmower_push", label: "Lawnmower (push)", basePrice: 35 },
      { id: "lawnmower_riding", label: "Lawnmower (riding)", basePrice: 95 },
      { id: "weed_eater", label: "Weed Eater/Trimmer", basePrice: 20 },
      { id: "leaf_blower", label: "Leaf Blower", basePrice: 20 },
      { id: "chainsaw", label: "Chainsaw", basePrice: 25 },
      { id: "garden_hose", label: "Garden Hose", basePrice: 10 },
      { id: "wheelbarrow", label: "Wheelbarrow", basePrice: 25 },
      { id: "ladder_6ft", label: "Ladder (6ft)", basePrice: 25 },
      { id: "ladder_extension", label: "Ladder (extension)", basePrice: 40 },
      { id: "picnic_table", label: "Picnic Table", basePrice: 45 },
      { id: "trampoline", label: "Trampoline", basePrice: 75 },
      { id: "swing_set", label: "Swing Set", basePrice: 95 },
    ],
  },
  {
    name: "Heavy/Special Items",
    description: "Hot tubs, sheds, and oversized items",
    items: [
      { id: "hot_tub", label: "Hot Tub", basePrice: 300 },
      { id: "above_ground_pool", label: "Above-Ground Pool", basePrice: 200 },
      { id: "shed_small", label: "Shed (small)", basePrice: 150 },
      { id: "shed_large", label: "Shed (large)", basePrice: 250 },
      { id: "gazebo_pergola", label: "Gazebo/Pergola", basePrice: 150 },
    ],
  },
  {
    name: "Bulk Items",
    description: "Bags, boxes, and bagged items",
    items: [
      { id: "trash_bag_33gal", label: "Trash Bag (33-gallon)", basePrice: 5 },
      { id: "trash_bag_50gal", label: "Trash Bag (50+ gallon)", basePrice: 8 },
      { id: "cardboard_box_small", label: "Cardboard Box (small)", basePrice: 3 },
      { id: "cardboard_box_large", label: "Cardboard Box (large)", basePrice: 5 },
      { id: "clothes_textiles_bag", label: "Clothes/Textiles (bag)", basePrice: 10 },
    ],
  },
  {
    name: "Tires & Auto",
    description: "Tires, wheels, and automotive items",
    items: [
      { id: "tire_car", label: "Tire (car)", basePrice: 15 },
      { id: "tire_truck", label: "Tire (truck/SUV)", basePrice: 20 },
      { id: "tire_motorcycle", label: "Tire (motorcycle)", basePrice: 12 },
      { id: "wheel_rim", label: "Wheel/Rim", basePrice: 10 },
      { id: "car_battery", label: "Car Battery", basePrice: 15 },
      { id: "car_seat_baby", label: "Car Seat (baby)", basePrice: 20 },
      { id: "bike_adult", label: "Bike (adult)", basePrice: 25 },
      { id: "bike_kids", label: "Bike (kids)", basePrice: 15 },
    ],
  },
];

const movingCategories: ItemCategory[] = [
  {
    name: "Bedroom Furniture",
    description: "Beds, dressers, and bedroom furniture",
    items: [
      { id: "twin_bed_frame", label: "Twin Bed Frame", basePrice: 45 },
      { id: "full_bed_frame", label: "Full Bed Frame", basePrice: 55 },
      { id: "queen_bed_frame", label: "Queen Bed Frame", basePrice: 65 },
      { id: "king_bed_frame", label: "King Bed Frame", basePrice: 85 },
      { id: "twin_mattress", label: "Twin Mattress", basePrice: 40 },
      { id: "full_mattress", label: "Full Mattress", basePrice: 50 },
      { id: "queen_mattress", label: "Queen Mattress", basePrice: 60 },
      { id: "king_mattress", label: "King Mattress", basePrice: 75 },
      { id: "box_spring", label: "Box Spring (any size)", basePrice: 40 },
      { id: "dresser_4_drawer", label: "Dresser (4-drawer)", basePrice: 55 },
      { id: "dresser_6_drawer", label: "Dresser (6+ drawer)", basePrice: 75 },
      { id: "nightstand", label: "Nightstand", basePrice: 30 },
      { id: "armoire", label: "Armoire/Wardrobe", basePrice: 85 },
    ],
  },
  {
    name: "Living Room Furniture",
    description: "Sofas, tables, and entertainment furniture",
    items: [
      { id: "sofa_3_seater", label: "Sofa/Couch (3-seater)", basePrice: 75 },
      { id: "loveseat", label: "Loveseat (2-seater)", basePrice: 55 },
      { id: "sectional_sofa", label: "Sectional Sofa", basePrice: 125 },
      { id: "sleeper_sofa", label: "Sleeper Sofa", basePrice: 95 },
      { id: "recliner", label: "Recliner", basePrice: 55 },
      { id: "armchair", label: "Armchair", basePrice: 40 },
      { id: "coffee_table", label: "Coffee Table", basePrice: 35 },
      { id: "end_table", label: "End Table", basePrice: 25 },
      { id: "tv_stand", label: "TV Stand", basePrice: 45 },
      { id: "entertainment_center", label: "Entertainment Center", basePrice: 85 },
      { id: "bookshelf_small", label: "Bookshelf (small)", basePrice: 30 },
      { id: "bookshelf_large", label: "Bookshelf (large)", basePrice: 55 },
    ],
  },
  {
    name: "Dining Room Furniture",
    description: "Tables, chairs, and dining furniture",
    items: [
      { id: "dining_table_4", label: "Dining Table (4-person)", basePrice: 55 },
      { id: "dining_table_6", label: "Dining Table (6-person)", basePrice: 75 },
      { id: "dining_table_8", label: "Dining Table (8+ person)", basePrice: 95 },
      { id: "dining_chairs_4", label: "Dining Chairs (set of 4)", basePrice: 65 },
      { id: "dining_chairs_6", label: "Dining Chairs (set of 6)", basePrice: 90 },
      { id: "china_cabinet", label: "China Cabinet", basePrice: 85 },
      { id: "buffet_sideboard", label: "Buffet/Sideboard", basePrice: 65 },
    ],
  },
  {
    name: "Office Furniture",
    description: "Desks, chairs, and office furniture",
    items: [
      { id: "desk_small", label: "Desk (small)", basePrice: 45 },
      { id: "desk_large", label: "Desk (large/executive)", basePrice: 75 },
      { id: "office_chair", label: "Office Chair", basePrice: 35 },
      { id: "filing_cabinet_2", label: "Filing Cabinet (2-drawer)", basePrice: 40 },
      { id: "filing_cabinet_4", label: "Filing Cabinet (4-drawer)", basePrice: 55 },
      { id: "bookcase", label: "Bookcase", basePrice: 45 },
    ],
  },
  {
    name: "Large Appliances",
    description: "Refrigerators, washers, and large appliances",
    items: [
      { id: "refrigerator", label: "Refrigerator", basePrice: 85 },
      { id: "refrigerator_french_door", label: "Refrigerator (French door)", basePrice: 105 },
      { id: "washer_top_load", label: "Washer (top load)", basePrice: 75 },
      { id: "washer_front_load", label: "Washer (front load)", basePrice: 85 },
      { id: "dryer_electric", label: "Dryer (electric)", basePrice: 75 },
      { id: "dryer_gas", label: "Dryer (gas)", basePrice: 85 },
      { id: "dishwasher", label: "Dishwasher", basePrice: 65 },
      { id: "stove_electric", label: "Stove/Range (electric)", basePrice: 75 },
      { id: "stove_gas", label: "Stove/Range (gas)", basePrice: 85 },
    ],
  },
  {
    name: "Boxes & Misc",
    description: "Packed boxes and miscellaneous items",
    items: [
      { id: "cardboard_box_small", label: "Small Box", basePrice: 3 },
      { id: "cardboard_box_large", label: "Large Box", basePrice: 5 },
      { id: "large_boxes", label: "Large Boxes (5)", basePrice: 25 },
      { id: "wardrobe_boxes", label: "Wardrobe Boxes (2)", basePrice: 30 },
    ],
  },
];

const applianceCategories: ItemCategory[] = [
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
    name: "Climate Control",
    description: "AC units, heaters, and climate equipment",
    items: [
      { id: "ac_window", label: "Air Conditioner (window)", basePrice: 40 },
      { id: "ac_portable", label: "Air Conditioner (portable)", basePrice: 35 },
      { id: "water_heater", label: "Water Heater", basePrice: 95 },
      { id: "dehumidifier", label: "Dehumidifier", basePrice: 30 },
      { id: "space_heater", label: "Space Heater", basePrice: 20 },
      { id: "ceiling_fan", label: "Ceiling Fan", basePrice: 30 },
    ],
  },
];

const truckUnloadingOptions = [
  { id: "10ft", label: "10ft Truck", basePrice: 150 },
  { id: "15ft", label: "15ft Truck", basePrice: 200 },
  { id: "20ft", label: "20ft Truck", basePrice: 275 },
  { id: "26ft", label: "26ft Truck", basePrice: 350 },
];

export default function Quote() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const serviceType = params.get("service") || "";
  const zipCode = params.get("zip") || "";
  
  const [quoteMethod, setQuoteMethod] = useState<"items" | "ai" | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [truckSize, setTruckSize] = useState<string>("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiEstimate, setAiEstimate] = useState<{ price: number; items: string[] } | null>(null);
  const [georgeIntervention, setGeorgeIntervention] = useState<{ show: boolean; message: string; suggestion: string }>({ show: false, message: "", suggestion: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getCategoriesForService = (): ItemCategory[] => {
    switch (serviceType) {
      case "junk_removal":
        return junkRemovalCategories;
      case "furniture_moving":
        return movingCategories;
      case "garage_cleanout":
        return junkRemovalCategories;
      default:
        return junkRemovalCategories;
    }
  };

  const getAllItemsFlat = () => {
    const categories = getCategoriesForService();
    return categories.flatMap(cat => cat.items);
  };

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const calculateEstimate = () => {
    const allItems = getAllItemsFlat();
    let total = 0;
    selectedItems.forEach(itemId => {
      const item = allItems.find(i => i.id === itemId);
      if (item) total += item.basePrice;
    });
    if (serviceType === "truck_unloading" && truckSize) {
      const truck = truckUnloadingOptions.find(t => t.id === truckSize);
      if (truck) total += truck.basePrice;
    }
    // Return specific price with minimum of $99
    const price = Math.max(99, total);
    return { price };
  };

  // Extract frames from a video file (start, middle, end)
  const extractVideoFrames = async (videoFile: File): Promise<File[]> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.src = URL.createObjectURL(videoFile);

      video.onloadedmetadata = async () => {
        const duration = video.duration;
        // Grab 3 frames: 10%, 50%, 90% through the video
        const times = [duration * 0.1, duration * 0.5, duration * 0.9].filter(t => t >= 0);
        const frames: File[] = [];

        for (const time of times) {
          try {
            video.currentTime = time;
            await new Promise<void>((res) => { video.onseeked = () => res(); });
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext("2d")?.drawImage(video, 0, 0);
            const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.85));
            frames.push(new File([blob], `video-frame-${Math.round(time)}s.jpg`, { type: "image/jpeg" }));
          } catch { /* skip frame */ }
        }

        URL.revokeObjectURL(video.src);
        resolve(frames.length > 0 ? frames : []);
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve([]);
      };

      video.load();
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(e.target.files || []);
    
    // Separate images and videos
    const imageFiles = rawFiles.filter(f => f.type.startsWith("image/"));
    const videoFiles = rawFiles.filter(f => f.type.startsWith("video/"));

    // Extract frames from any videos
    let videoFrames: File[] = [];
    if (videoFiles.length > 0) {
      toast({ title: "Processing video...", description: "Extracting frames for analysis" });
      for (const vf of videoFiles) {
        const frames = await extractVideoFrames(vf);
        videoFrames.push(...frames);
      }
      if (videoFrames.length === 0) {
        const intervention = getGeorgeIntervention("upload_failed");
        setGeorgeIntervention({ show: true, ...intervention });
        return;
      }
    }

    const allFiles = [...imageFiles, ...videoFrames];

    if (allFiles.length + uploadedImages.length > 5) {
      toast({
        title: "Too many images",
        description: "You can upload up to 5 images (video frames count too)",
        variant: "destructive",
      });
      return;
    }
    
    const newFiles = [...uploadedImages, ...allFiles].slice(0, 5);
    setUploadedImages(newFiles);
    
    const newUrls = newFiles.map(file => URL.createObjectURL(file));
    imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    setImagePreviewUrls(newUrls);
  };

  const removeImage = (index: number) => {
    const newFiles = uploadedImages.filter((_, i) => i !== index);
    const newUrls = imagePreviewUrls.filter((_, i) => i !== index);
    URL.revokeObjectURL(imagePreviewUrls[index]);
    setUploadedImages(newFiles);
    setImagePreviewUrls(newUrls);
    setAiEstimate(null);
  };

  const analyzeWithAI = async () => {
    if (uploadedImages.length === 0) {
      toast({
        title: "No images",
        description: "Please upload at least one photo of items to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      uploadedImages.forEach((file, index) => {
        formData.append(`image${index}`, file);
      });
      formData.append("serviceType", serviceType);

      const response = await fetch("/api/ai/analyze-load", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        // Check if AI identified something non-home-related
        if (result.error === "not_home_related") {
          const msg = result.message || "I need photos of items you want hauled or the area that needs work.";
          setGeorgeIntervention({
            show: true,
            message: msg,
            suggestion: "Try snapping a picture of the actual items, the room, or the area that needs attention.",
          });
          setIsAnalyzing(false);
          return;
        }
        throw new Error(result.error || "Failed to analyze images");
      }
      // Use the suggested price from AI, or calculate average if range provided
      const aiPrice = result.suggestedPrice || Math.round((result.lowPrice + result.highPrice) / 2) || 149;
      setAiEstimate({
        price: Math.max(79, aiPrice),
        items: result.identifiedItems || ["Various items detected"],
      });
      
      toast({
        title: "Analysis Complete",
        description: "AI has estimated your load size and pricing",
      });
    } catch (error) {
      // George steps in instead of a cold error toast
      const intervention = getGeorgeIntervention("photo_analysis_failed");
      setGeorgeIntervention({ show: true, ...intervention });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const proceedToBooking = () => {
    const estimate = quoteMethod === "ai" ? aiEstimate : calculateEstimate();
    if (!estimate) return;

    const itemsList = quoteMethod === "ai" 
      ? aiEstimate?.items.join(",") 
      : selectedItems.join(",");

    // Pass complete quote data including specific price and selected items
    const quoteData = {
      service: serviceType,
      zip: zipCode,
      price: estimate.price,
      items: itemsList || "",
      notes: additionalNotes,
      method: quoteMethod,
      truckSize: truckSize || "",
    };
    
    navigate(`/book?quoteData=${encodeURIComponent(JSON.stringify(quoteData))}`);
  };

  const canProceed = () => {
    if (quoteMethod === "items") {
      if (serviceType === "truck_unloading") {
        return !!truckSize;
      }
      return selectedItems.length > 0;
    }
    if (quoteMethod === "ai") {
      return aiEstimate !== null;
    }
    return false;
  };

  const estimate = quoteMethod === "items" ? calculateEstimate() : aiEstimate;

  return (
    <div className="min-h-screen bg-background" data-testid="page-quote">
      <Header />
      <main className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => navigate("/")}
            data-testid="button-back-home"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>

          <div className="text-center mb-8">
            <Badge className="mb-4" variant="secondary">
              {serviceLabels[serviceType] || "Get Quote"}
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Get Your Instant Quote</h1>
            <p className="text-lg text-muted-foreground">
              Choose how you'd like to get your price estimate
            </p>
            {zipCode && (
              <p className="text-sm text-muted-foreground mt-1">
                Service area: {zipCode}
              </p>
            )}
          </div>

          {!quoteMethod ? (
            <div className="grid md:grid-cols-2 gap-6">
              <Card 
                className="p-6 cursor-pointer hover-elevate transition-all border-2 hover:border-primary"
                onClick={() => setQuoteMethod("items")}
                data-testid="card-select-items"
              >
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Package className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Select Your Items</h3>
                  <p className="text-muted-foreground mb-4">
                    Choose from our list of common items to get an instant price
                  </p>
                  <Button className="w-full" data-testid="button-choose-items">
                    Select Items
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Card>

              <Card 
                className="p-6 cursor-pointer hover-elevate transition-all border-2 hover:border-primary"
                onClick={() => setQuoteMethod("ai")}
                data-testid="card-ai-photo"
              >
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-amber-500" />
                  </div>
                  <Badge className="mb-2 bg-amber-500/10 text-amber-600 border-amber-500/30">
                    Recommended
                  </Badge>
                  <h3 className="text-xl font-bold mb-2">Upload Photos</h3>
                  <p className="text-muted-foreground mb-4">
                    Take photos of your items and let AI estimate the load
                  </p>
                  <Button className="w-full bg-amber-500 hover:bg-amber-600" data-testid="button-choose-ai">
                    <Camera className="w-4 h-4 mr-2" />
                    Use AI Photo Analysis
                  </Button>
                </div>
              </Card>
            </div>
          ) : quoteMethod === "items" ? (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    {serviceType === "truck_unloading" 
                      ? "Select Your Truck Size" 
                      : "What items do you have?"}
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setQuoteMethod(null);
                      setSelectedItems([]);
                      setTruckSize("");
                    }}
                    data-testid="button-change-method"
                  >
                    Change Method
                  </Button>
                </div>

                {serviceType === "truck_unloading" ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {truckUnloadingOptions.map((truck) => (
                      <label
                        key={truck.id}
                        className={`flex flex-col items-center p-4 rounded-lg border cursor-pointer transition-colors hover-elevate ${
                          truckSize === truck.id
                            ? "border-primary bg-primary/5"
                            : "border-border"
                        }`}
                        data-testid={`option-truck-${truck.id}`}
                      >
                        <input
                          type="radio"
                          name="truckSize"
                          value={truck.id}
                          checked={truckSize === truck.id}
                          onChange={() => setTruckSize(truck.id)}
                          className="sr-only"
                        />
                        <Truck className="w-8 h-8 mb-2 text-muted-foreground" />
                        <span className="font-medium">{truck.label}</span>
                        <span className="text-sm text-muted-foreground">
                          ${truck.basePrice}+
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {getCategoriesForService().map((category) => (
                      <div key={category.name} className="border rounded-lg p-4">
                        <div className="mb-3">
                          <h4 className="font-semibold text-base">{category.name}</h4>
                          <p className="text-xs text-muted-foreground">{category.description}</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {category.items.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => toggleItem(item.id)}
                              className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors hover-elevate text-sm ${
                                selectedItems.includes(item.id)
                                  ? "border-primary bg-primary/5"
                                  : "border-border"
                              }`}
                              data-testid={`checkbox-item-${item.id}`}
                            >
                              <Checkbox
                                checked={selectedItems.includes(item.id)}
                                onCheckedChange={() => toggleItem(item.id)}
                              />
                              <div className="flex-1 min-w-0">
                                <span className="font-medium block truncate">{item.label}</span>
                                <span className="text-xs text-muted-foreground">${item.basePrice}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6">
                  <label className="text-sm font-medium mb-2 block">
                    Additional Notes (optional)
                  </label>
                  <Textarea
                    placeholder="Any special instructions or additional items..."
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    className="resize-none"
                    data-testid="textarea-notes"
                  />
                </div>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <h3 className="text-lg font-semibold">AI Photo Analysis</h3>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setQuoteMethod(null);
                      setUploadedImages([]);
                      setImagePreviewUrls([]);
                      setAiEstimate(null);
                    }}
                    data-testid="button-change-method-ai"
                  >
                    Change Method
                  </Button>
                </div>

                <p className="text-muted-foreground mb-4">
                  Upload up to 5 photos of the items you need hauled or moved. 
                  Our AI will analyze the images and provide an instant estimate.
                </p>

                <div 
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="upload-area"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    data-testid="input-file-upload"
                  />
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="font-medium mb-1">Upload photos or video</p>
                  <p className="text-sm text-muted-foreground">
                    Photos, or scan the room with your camera. We'll grab the key frames.
                  </p>
                </div>

                {imagePreviewUrls.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
                    {imagePreviewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={url} 
                          alt={`Upload ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          data-testid={`button-remove-image-${index}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {uploadedImages.length > 0 && !aiEstimate && (
                  <Button 
                    className="w-full mt-4 bg-amber-500 hover:bg-amber-600"
                    onClick={analyzeWithAI}
                    disabled={isAnalyzing}
                    data-testid="button-analyze-ai"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Analyze with AI
                      </>
                    )}
                  </Button>
                )}

                {/* George steps in when something goes wrong */}
                <GeorgeIntervention
                  show={georgeIntervention.show}
                  message={georgeIntervention.message}
                  suggestion={georgeIntervention.suggestion}
                  onDismiss={() => setGeorgeIntervention({ show: false, message: "", suggestion: "" })}
                  onRetry={() => {
                    setGeorgeIntervention({ show: false, message: "", suggestion: "" });
                    setUploadedImages([]);
                    setImagePreviewUrls([]);
                    fileInputRef.current?.click();
                  }}
                  retryLabel="Upload new photo"
                  onTalkToGeorge={() => {
                    setGeorgeIntervention({ show: false, message: "", suggestion: "" });
                    window.dispatchEvent(new CustomEvent("george:open", { detail: { message: "I'm trying to get a photo quote but having trouble with my photos" } }));
                  }}
                />

                <div className="mt-6">
                  <label className="text-sm font-medium mb-2 block">
                    Additional Notes (optional)
                  </label>
                  <Textarea
                    placeholder="Describe your items or any special instructions..."
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    className="resize-none"
                    data-testid="textarea-notes-ai"
                  />
                </div>
              </Card>

              {aiEstimate && (
                <Card className="p-6 bg-amber-500/5 border-amber-500/20">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <h3 className="text-lg font-semibold">AI Analysis Complete</h3>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Detected items:</p>
                    <div className="flex flex-wrap gap-2">
                      {aiEstimate.items.map((item, index) => (
                        <Badge key={index} variant="secondary">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="text-center mb-4">
                    <p className="text-4xl font-bold text-amber-600">
                      ${aiEstimate.price}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Instant estimate
                    </p>
                  </div>

                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={proceedToBooking}
                    data-testid="button-proceed-booking-ai"
                  >
                    Continue to Book
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>

      {quoteMethod === "items" && selectedItems.length > 0 && estimate && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50 p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {selectedItems.length} item{selectedItems.length !== 1 ? "s" : ""} selected
                </p>
                <p className="text-2xl font-bold text-primary" data-testid="text-estimate-price">
                  ${estimate.price}
                </p>
              </div>
            </div>
            <Button 
              size="lg"
              onClick={proceedToBooking}
              disabled={!canProceed()}
              data-testid="button-proceed-booking"
            >
              Continue to Book
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      <div className={quoteMethod === "items" && selectedItems.length > 0 ? "pb-24" : ""}>
        <Footer />
      </div>
    </div>
  );
}
