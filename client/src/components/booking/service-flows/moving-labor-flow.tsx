import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, Clock } from "lucide-react";
import { RunningTotal } from "./running-total";
import type { ServiceFlowProps, ServiceFlowResult } from "./types";

const PRO_OPTIONS = [
  { count: 2, rate: 130, label: "2 Pros", description: "Standard moves, apartments" },
  { count: 3, rate: 195, label: "3 Pros", description: "Large moves, heavy items" },
  { count: 4, rate: 260, label: "4 Pros", description: "Full home moves, heavy furniture" },
];

const EXTRAS = [
  { id: "stairs", label: "Stairs (flights to navigate)", price: 25 },
  { id: "long_carry", label: "Long carry (50+ ft to truck)", price: 30 },
  { id: "heavy_item", label: "Heavy item (300+ lbs: piano, safe, etc.)", price: 35 },
];

const MOVE_ITEMS = [
  { id: "sofa", label: "Sofa/Couch" },
  { id: "loveseat", label: "Loveseat" },
  { id: "bed_frame", label: "Bed Frame" },
  { id: "mattress", label: "Mattress" },
  { id: "dresser", label: "Dresser" },
  { id: "desk", label: "Desk" },
  { id: "dining_table", label: "Dining Table" },
  { id: "chairs", label: "Chairs (set)" },
  { id: "bookshelf", label: "Bookshelf" },
  { id: "tv_stand", label: "TV Stand/Entertainment Center" },
  { id: "refrigerator", label: "Refrigerator" },
  { id: "washer", label: "Washer" },
  { id: "dryer", label: "Dryer" },
  { id: "boxes_small", label: "Boxes, Small (per 10)" },
  { id: "boxes_large", label: "Boxes, Large (per 5)" },
];

export function MovingLaborFlow({ onComplete, onBack }: ServiceFlowProps) {
  const [pros, setPros] = useState(2);
  const PER_MOVER_RATE = 65;
  const [hours, setHours] = useState(3);
  const [extras, setExtras] = useState<Record<string, number>>({});
  const [items, setItems] = useState<Set<string>>(new Set());

  const proOption = PRO_OPTIONS.find((p) => p.count === pros)!;
  const laborCost = proOption.rate * hours;
  const extrasCost = Object.entries(extras).reduce((sum, [id, qty]) => {
    const e = EXTRAS.find((e) => e.id === id);
    return sum + (e?.price || 0) * qty;
  }, 0);
  const total = laborCost + extrasCost;

  const lineItems = [
    { label: `${proOption.label} × ${hours} hours @ $${PER_MOVER_RATE}/hr each`, price: laborCost },
    ...Object.entries(extras)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const e = EXTRAS.find((e) => e.id === id)!;
        return { label: e.label, price: e.price, quantity: qty };
      }),
  ];

  const handleContinue = () => {
    const result: ServiceFlowResult = {
      quoteMethod: "manual",
      serviceType: "moving_labor",
      estimatedPrice: total,
      userInputs: { pros, hours, extras, items: [...items] },
      requiresHitlValidation: false,
      lineItems,
    };
    onComplete(result);
  };

  return (
    <div className="space-y-4">
      {/* Pro count */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h4 className="font-bold text-sm flex items-center gap-2">
            <Users className="w-4 h-4" /> Number of Pros
          </h4>
          <p className="text-xs text-muted-foreground">$65/hr per mover. 2-mover minimum</p>
          <div className="grid grid-cols-3 gap-3">
            {PRO_OPTIONS.map((p) => (
              <Button
                key={p.count}
                variant={pros === p.count ? "default" : "outline"}
                className="h-auto flex-col py-3"
                onClick={() => setPros(p.count)}
              >
                <span className="text-lg font-bold">{p.label}</span>
                <span className="text-xs">${p.rate}/hr</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hours */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h4 className="font-bold text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" /> Estimated Hours
          </h4>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
              <Button
                key={h}
                variant={hours === h ? "default" : "outline"}
                size="sm"
                onClick={() => setHours(h)}
              >
                {h}hr
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Extras */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h4 className="font-bold text-sm">Extras & Surcharges</h4>
          {EXTRAS.map((e) => (
            <div key={e.id} className="flex items-center justify-between p-2 border rounded-lg">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={!!extras[e.id]}
                  onCheckedChange={() => {
                    setExtras((prev) => {
                      if (prev[e.id]) {
                        const { [e.id]: _, ...rest } = prev;
                        return rest;
                      }
                      return { ...prev, [e.id]: 1 };
                    });
                  }}
                />
                <div>
                  <Label className="text-sm">{e.label}</Label>
                  <p className="text-xs text-muted-foreground">+${e.price} flat</p>
                </div>
              </div>
              {extras[e.id] && e.id !== "long_carry" && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="min-h-[44px] min-w-[44px]" onClick={() => setExtras((p) => ({ ...p, [e.id]: Math.max(0, (p[e.id] || 1) - 1) }))}>-</Button>
                  <span className="w-6 text-center text-sm">{extras[e.id]}</span>
                  <Button variant="outline" size="sm" className="min-h-[44px] min-w-[44px]" onClick={() => setExtras((p) => ({ ...p, [e.id]: (p[e.id] || 1) + 1 }))}>+</Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* What's being moved (informational) */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h4 className="font-bold text-sm">What's Being Moved? <Badge variant="outline" className="ml-2">Optional</Badge></h4>
          <p className="text-xs text-muted-foreground">Helps us send the right crew and equipment</p>
          <div className="grid grid-cols-2 gap-2 max-h-[250px] overflow-y-auto">
            {MOVE_ITEMS.map((item) => (
              <div key={item.id} className="flex items-center gap-2 p-1.5">
                <Checkbox
                  checked={items.has(item.id)}
                  onCheckedChange={() => {
                    setItems((prev) => {
                      const next = new Set(prev);
                      next.has(item.id) ? next.delete(item.id) : next.add(item.id);
                      return next;
                    });
                  }}
                />
                <Label className="text-xs">{item.label}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <RunningTotal
        total={total}
        lineItems={lineItems}
        onContinue={handleContinue}
        onBack={onBack}
        note="Billed by the minute after first hour. Pro will confirm on-site."
      />
    </div>
  );
}
