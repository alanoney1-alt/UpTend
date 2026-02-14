import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Truck, ChevronDown, ChevronRight } from "lucide-react";
import { RunningTotal } from "./running-total";
import { AiScanToggle } from "./ai-scan-toggle";
import type { ServiceFlowProps, ServiceFlowResult } from "./types";

const ITEM_CATEGORIES = [
  {
    id: "living_room",
    label: "🛋️ Living Room & Bedroom Furniture",
    items: [
      { id: "sofa", label: "Sofa/Couch", price: 75 },
      { id: "loveseat", label: "Loveseat", price: 55 },
      { id: "recliner", label: "Recliner", price: 55 },
      { id: "sectional", label: "Sectional Sofa", price: 120 },
      { id: "futon", label: "Futon", price: 55 },
      { id: "ottoman", label: "Ottoman", price: 25 },
      { id: "coffee_table", label: "Coffee Table", price: 35 },
      { id: "end_table", label: "End Table", price: 25 },
      { id: "entertainment_center", label: "Entertainment Center", price: 65 },
      { id: "tv_stand", label: "TV Stand", price: 35 },
      { id: "bookshelf", label: "Bookshelf", price: 45 },
      { id: "china_cabinet", label: "China Cabinet", price: 75 },
      { id: "curio_cabinet", label: "Curio Cabinet", price: 55 },
    ],
  },
  {
    id: "bedroom",
    label: "🛏️ Bedroom Furniture",
    items: [
      { id: "bed_frame_twin", label: "Bed Frame (Twin/Full)", price: 45 },
      { id: "bed_frame_queen", label: "Bed Frame (Queen)", price: 55 },
      { id: "bed_frame_king", label: "Bed Frame (King)", price: 65 },
      { id: "bunk_bed", label: "Bunk Bed", price: 85 },
      { id: "dresser", label: "Dresser", price: 65 },
      { id: "nightstand", label: "Nightstand", price: 25 },
      { id: "chest_drawers", label: "Chest of Drawers", price: 55 },
      { id: "armoire", label: "Armoire/Wardrobe", price: 75 },
      { id: "vanity", label: "Vanity", price: 45 },
    ],
  },
  {
    id: "mattresses",
    label: "🛏️ Mattresses & Box Springs",
    items: [
      { id: "mattress_twin", label: "Twin Mattress", price: 45 },
      { id: "mattress_full", label: "Full Mattress", price: 50 },
      { id: "mattress_queen", label: "Queen Mattress", price: 60 },
      { id: "mattress_king", label: "King Mattress", price: 75 },
      { id: "mattress_cal_king", label: "California King Mattress", price: 80 },
      { id: "box_spring", label: "Box Spring (any size)", price: 40 },
      { id: "crib_mattress", label: "Crib Mattress", price: 25 },
    ],
  },
  {
    id: "dining",
    label: "🍽️ Dining & Kitchen",
    items: [
      { id: "dining_table", label: "Dining Table", price: 75 },
      { id: "dining_chair", label: "Dining Chair (each)", price: 20 },
      { id: "bar_stool", label: "Bar Stool (each)", price: 20 },
      { id: "buffet", label: "Buffet/Sideboard", price: 65 },
      { id: "kitchen_cart", label: "Kitchen Cart/Island", price: 45 },
      { id: "high_chair", label: "High Chair", price: 20 },
    ],
  },
  {
    id: "office",
    label: "💻 Office Furniture",
    items: [
      { id: "office_desk", label: "Office Desk", price: 60 },
      { id: "office_chair", label: "Office Chair", price: 30 },
      { id: "filing_cabinet", label: "Filing Cabinet", price: 35 },
      { id: "cubicle_panel", label: "Cubicle Panel (each)", price: 25 },
      { id: "conference_table", label: "Conference Table", price: 95 },
      { id: "credenza", label: "Credenza", price: 55 },
    ],
  },
  {
    id: "exercise",
    label: "🏋️ Exercise Equipment",
    items: [
      { id: "treadmill", label: "Treadmill", price: 85 },
      { id: "elliptical", label: "Elliptical", price: 85 },
      { id: "stationary_bike", label: "Stationary Bike", price: 55 },
      { id: "weight_bench", label: "Weight Bench", price: 45 },
      { id: "home_gym", label: "Home Gym System", price: 120 },
      { id: "rowing_machine", label: "Rowing Machine", price: 65 },
      { id: "exercise_misc", label: "Exercise Equipment (misc)", price: 55 },
    ],
  },
  {
    id: "electronics",
    label: "📺 Electronics",
    items: [
      { id: "tv_small", label: "TV (under 40\")", price: 35 },
      { id: "tv_medium", label: "TV (40-65\")", price: 45 },
      { id: "tv_large", label: "TV (over 65\")", price: 55 },
      { id: "computer", label: "Computer/Monitor", price: 25 },
      { id: "printer", label: "Printer", price: 20 },
      { id: "stereo", label: "Stereo System", price: 30 },
      { id: "game_console", label: "Game Console", price: 20 },
      { id: "ewaste_box", label: "E-waste Box", price: 30 },
    ],
  },
  {
    id: "appliances_large",
    label: "🧊 Large Appliances",
    items: [
      { id: "refrigerator", label: "Refrigerator", price: 85 },
      { id: "washer", label: "Washer", price: 75 },
      { id: "dryer", label: "Dryer", price: 75 },
      { id: "dishwasher", label: "Dishwasher", price: 65 },
      { id: "stove", label: "Stove/Oven/Range", price: 75 },
      { id: "chest_freezer", label: "Chest Freezer", price: 75 },
      { id: "window_ac", label: "Window AC Unit", price: 35 },
      { id: "water_heater", label: "Water Heater", price: 85 },
      { id: "dehumidifier", label: "Dehumidifier", price: 25 },
    ],
  },
  {
    id: "appliances_small",
    label: "🔧 Small Appliances",
    items: [
      { id: "microwave", label: "Microwave", price: 25 },
      { id: "toaster_oven", label: "Toaster Oven", price: 15 },
      { id: "vacuum", label: "Vacuum Cleaner", price: 20 },
      { id: "small_appliance", label: "Small Appliance (misc)", price: 15 },
    ],
  },
  {
    id: "outdoor",
    label: "🌳 Outdoor & Yard",
    items: [
      { id: "patio_set", label: "Patio Furniture Set", price: 85 },
      { id: "patio_table", label: "Patio Table", price: 45 },
      { id: "patio_chair", label: "Patio Chair (each)", price: 20 },
      { id: "grill", label: "Grill/BBQ", price: 55 },
      { id: "lawnmower_push", label: "Lawnmower (push)", price: 45 },
      { id: "lawnmower_riding", label: "Lawnmower (riding)", price: 120 },
      { id: "trampoline", label: "Trampoline", price: 95 },
      { id: "swing_set", label: "Swing Set", price: 120 },
      { id: "hot_tub", label: "Hot Tub (empty)", price: 250 },
      { id: "shed_debris", label: "Shed Debris (small)", price: 150 },
      { id: "fence_panels", label: "Fence Panels (per section)", price: 35 },
      { id: "yard_waste", label: "Yard Waste (per load)", price: 65 },
      { id: "tree_debris", label: "Tree Debris (per load)", price: 75 },
    ],
  },
  {
    id: "misc",
    label: "📦 Miscellaneous",
    items: [
      { id: "boxes", label: "Boxes/Bags (per 5)", price: 25 },
      { id: "tires", label: "Tires (per 4)", price: 40 },
      { id: "carpet", label: "Carpet/Rug (rolled)", price: 35 },
      { id: "piano_upright", label: "Piano (upright)", price: 150 },
      { id: "piano_grand", label: "Piano (grand/baby grand)", price: 250 },
      { id: "pool_table", label: "Pool Table", price: 150 },
      { id: "jacuzzi", label: "Jacuzzi/Spa", price: 200 },
      { id: "construction_debris", label: "Construction Debris (per load)", price: 95 },
      { id: "misc_large", label: "Misc Large Item", price: 55 },
      { id: "misc_small", label: "Misc Small Item", price: 25 },
    ],
  },
];

const ITEMS = ITEM_CATEGORIES.flatMap((cat) => cat.items);

const LOAD_SIZES = [
  { id: "min", label: "Minimum Load (1-2 items)", price: 99, description: "A few small items" },
  { id: "eighth", label: "1/8 Truck Load", price: 179, description: "Small pickup load" },
  { id: "quarter", label: "Quarter Truck Load", price: 279, description: "Small room cleanout" },
  { id: "half", label: "Half Truck Load", price: 379, description: "Bedroom or office cleanout" },
  { id: "three_quarter", label: "3/4 Truck Load", price: 449, description: "Large room or garage" },
  { id: "full", label: "Full Truck Load", price: 549, description: "Whole-home cleanout" },
];

type PricingMode = "itemized" | "load";

export function JunkRemovalFlow({ onComplete, onBack }: ServiceFlowProps) {
  const [pricingMode, setPricingMode] = useState<PricingMode>("itemized");
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [selectedLoad, setSelectedLoad] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    Object.fromEntries(ITEM_CATEGORIES.map((cat) => [cat.id, true]))
  );

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const toggleItem = (id: string) => {
    setSelectedItems((prev) => {
      if (prev[id]) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: 1 };
    });
  };

  const setQty = (id: string, qty: number) => {
    if (qty <= 0) {
      const { [id]: _, ...rest } = selectedItems;
      setSelectedItems(rest);
    } else {
      setSelectedItems((prev) => ({ ...prev, [id]: qty }));
    }
  };

  // Itemized calculation
  const itemCount = Object.values(selectedItems).reduce((a, b) => a + b, 0);
  const subtotal = Object.entries(selectedItems).reduce((sum, [id, qty]) => {
    const item = ITEMS.find((i) => i.id === id);
    return sum + (item?.price || 0) * qty;
  }, 0);
  const discountPct = itemCount >= 6 ? 0.15 : itemCount >= 3 ? 0.1 : 0;
  const discountLabel = itemCount >= 6 ? "Volume discount (15% off 6+ items)" : itemCount >= 3 ? "Volume discount (10% off 3-5 items)" : "";
  const discountAmt = Math.round(subtotal * discountPct);
  const itemTotal = Math.max(subtotal - discountAmt, subtotal > 0 ? 99 : 0);

  // Load-size calculation
  const load = LOAD_SIZES.find((l) => l.id === selectedLoad);
  const loadTotal = load?.price || 0;

  const total = pricingMode === "itemized" ? itemTotal : loadTotal;

  const lineItems =
    pricingMode === "itemized"
      ? Object.entries(selectedItems).map(([id, qty]) => {
          const item = ITEMS.find((i) => i.id === id)!;
          return { label: item.label, price: item.price, quantity: qty };
        })
      : load
      ? [{ label: load.label, price: load.price }]
      : [];

  const discounts = discountAmt > 0 ? [{ label: discountLabel, amount: discountAmt }] : [];

  const handleContinue = () => {
    const result: ServiceFlowResult = {
      quoteMethod: "manual",
      serviceType: "junk_removal",
      estimatedPrice: total,
      userInputs: pricingMode === "itemized" ? { mode: pricingMode, selectedItems } : { mode: pricingMode, loadSize: selectedLoad },
      requiresHitlValidation: false,
      lineItems,
      discounts,
    };
    onComplete(result);
  };

  return (
    <div className="space-y-4">
      {/* Pricing mode toggle */}
      <div className="flex gap-2">
        <Button
          className={`flex-1 ${
            pricingMode === "itemized"
              ? "bg-orange-500 text-white border-orange-500 hover:bg-orange-600"
              : "bg-transparent text-orange-500 border-2 border-orange-500 hover:bg-orange-50"
          }`}
          onClick={() => setPricingMode("itemized")}
        >
          📋 Pick Items
        </Button>
        <Button
          className={`flex-1 ${
            pricingMode === "load"
              ? "bg-orange-500 text-white border-orange-500 hover:bg-orange-600"
              : "bg-transparent text-orange-500 border-2 border-orange-500 hover:bg-orange-50"
          }`}
          onClick={() => setPricingMode("load")}
        >
          <Truck className="w-4 h-4 mr-2" /> Load Size
        </Button>
      </div>

      {pricingMode === "itemized" && (
        <Card>
          <CardContent className="p-4 space-y-1">
            {itemCount >= 3 && (
              <Badge className="bg-green-600 mb-2">
                🎉 {discountPct * 100}% volume discount applied!
              </Badge>
            )}
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {ITEM_CATEGORIES.map((category) => (
                <div key={category.id} className="space-y-1">
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="flex items-center gap-2 w-full p-2 font-semibold text-sm bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    {expandedCategories[category.id] ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span>{category.label}</span>
                  </button>
                  {expandedCategories[category.id] && (
                    <div className="space-y-1 ml-2">
                      {category.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2.5 border rounded-lg hover:bg-muted/30"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <Checkbox
                              checked={!!selectedItems[item.id]}
                              onCheckedChange={() => toggleItem(item.id)}
                            />
                            <div>
                              <Label className="font-medium text-sm">{item.label}</Label>
                              <p className="text-xs text-muted-foreground">${item.price}</p>
                            </div>
                          </div>
                          {selectedItems[item.id] && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="min-h-[44px] min-w-[44px]"
                                onClick={() => setQty(item.id, selectedItems[item.id] - 1)}
                              >
                                -
                              </Button>
                              <span className="w-6 text-center text-sm">{selectedItems[item.id]}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="min-h-[44px] min-w-[44px]"
                                onClick={() => setQty(item.id, selectedItems[item.id] + 1)}
                              >
                                +
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {pricingMode === "load" && (
        <div className="space-y-3">
          {LOAD_SIZES.map((l) => (
            <Card
              key={l.id}
              className={`cursor-pointer transition-all p-4 ${
                selectedLoad === l.id ? "border-2 border-primary ring-2 ring-primary/20" : "hover:border-primary/50"
              }`}
              onClick={() => setSelectedLoad(l.id)}
            >
              <CardContent className="p-0 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-sm">{l.label}</h4>
                  <p className="text-xs text-muted-foreground">{l.description}</p>
                </div>
                <span className="text-xl font-black text-primary">${l.price}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RunningTotal
        total={total}
        lineItems={lineItems}
        discounts={discounts}
        minimumCharge={pricingMode === "itemized" && subtotal > 0 ? 99 : undefined}
        onContinue={handleContinue}
        onBack={onBack}
        note="$99 minimum charge. Eco-friendly disposal with verified ESG tracking."
      />
    </div>
  );
}
