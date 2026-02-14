import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Truck } from "lucide-react";
import { RunningTotal } from "./running-total";
import { AiScanToggle } from "./ai-scan-toggle";
import type { ServiceFlowProps, ServiceFlowResult } from "./types";

const ITEMS = [
  { id: "sofa", label: "Sofa/Couch", price: 75 },
  { id: "loveseat", label: "Loveseat", price: 55 },
  { id: "recliner", label: "Recliner", price: 55 },
  { id: "mattress_queen", label: "Queen Mattress", price: 60 },
  { id: "mattress_king", label: "King Mattress", price: 75 },
  { id: "mattress_twin", label: "Twin Mattress", price: 45 },
  { id: "box_spring", label: "Box Spring", price: 40 },
  { id: "dresser", label: "Dresser", price: 65 },
  { id: "dining_table", label: "Dining Table", price: 75 },
  { id: "chairs", label: "Chair (each)", price: 20 },
  { id: "desk", label: "Desk", price: 60 },
  { id: "bookshelf", label: "Bookshelf", price: 45 },
  { id: "refrigerator", label: "Refrigerator", price: 85 },
  { id: "washer", label: "Washer", price: 75 },
  { id: "dryer", label: "Dryer", price: 75 },
  { id: "dishwasher", label: "Dishwasher", price: 65 },
  { id: "microwave", label: "Microwave/Small Appliance", price: 25 },
  { id: "tv", label: "TV (large)", price: 45 },
  { id: "exercise_equip", label: "Exercise Equipment", price: 75 },
  { id: "boxes", label: "Boxes/Bags (per 5)", price: 25 },
  { id: "tires", label: "Tires (per 4)", price: 40 },
  { id: "yard_waste", label: "Yard Waste (per load)", price: 65 },
];

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
          variant={pricingMode === "itemized" ? "default" : "outline"}
          className="flex-1"
          onClick={() => setPricingMode("itemized")}
        >
          📋 Pick Items
        </Button>
        <Button
          variant={pricingMode === "load" ? "default" : "outline"}
          className="flex-1"
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
            <div className="space-y-1 max-h-[450px] overflow-y-auto pr-1">
              {ITEMS.map((item) => (
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
                      <Button variant="outline" size="sm" className="min-h-[44px] min-w-[44px]" onClick={() => setQty(item.id, selectedItems[item.id] - 1)}>-</Button>
                      <span className="w-6 text-center text-sm">{selectedItems[item.id]}</span>
                      <Button variant="outline" size="sm" className="min-h-[44px] min-w-[44px]" onClick={() => setQty(item.id, selectedItems[item.id] + 1)}>+</Button>
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
