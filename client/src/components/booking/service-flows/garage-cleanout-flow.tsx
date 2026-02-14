import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, Clock, Package } from "lucide-react";
import { RunningTotal } from "./running-total";
import type { ServiceFlowProps, ServiceFlowResult } from "./types";

const TIERS = [
  {
    id: "small",
    name: "Small",
    price: 299,
    description: "Single-car garage, light clutter",
    items: "~10-20 items",
    duration: "2-3 hours",
    details: "Light sorting + removal. Ideal for a quick declutter.",
  },
  {
    id: "medium",
    name: "Medium",
    price: 499,
    description: "Single-car garage, fully packed",
    items: "~20-40 items",
    duration: "3-4 hours",
    details: "Full sorting, hauling, and basic sweep. Most popular.",
    popular: true,
  },
  {
    id: "large",
    name: "Large",
    price: 749,
    description: "Half of a 2-car garage, packed",
    items: "~40-60 items",
    duration: "4-5 hours",
    details: "Heavy-duty cleanout with sorting and eco-friendly disposal.",
  },
  {
    id: "xl",
    name: "XL",
    price: 999,
    description: "Full 2-car garage, packed",
    items: "~60+ items",
    duration: "5-7 hours",
    details: "Complete garage transformation. Multiple trips if needed.",
  },
];

const ADDONS = [
  { id: "shelving", label: "Install garage shelving", price: 149 },
  { id: "sweep", label: "Garage floor sweep & hose", price: 49 },
  { id: "donation_run", label: "Separate donation run", price: 39 },
  { id: "epoxy_consult", label: "Epoxy floor consultation", price: 0, note: "Free with any tier" },
];

export function GarageCleanoutFlow({ onComplete, onBack }: ServiceFlowProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [addons, setAddons] = useState<Set<string>>(new Set());

  const tier = TIERS.find((t) => t.id === selected);
  const addonTotal = [...addons].reduce((sum, id) => {
    const a = ADDONS.find((a) => a.id === id);
    return sum + (a?.price || 0);
  }, 0);
  const total = (tier?.price || 0) + addonTotal;

  const lineItems = [
    ...(tier ? [{ label: `${tier.name} Garage Cleanout`, price: tier.price }] : []),
    ...[...addons].map((id) => {
      const a = ADDONS.find((a) => a.id === id)!;
      return { label: a.label, price: a.price };
    }).filter(i => i.price > 0),
  ];

  const handleContinue = () => {
    if (!tier) return;
    const result: ServiceFlowResult = {
      quoteMethod: "manual",
      serviceType: "garage_cleanout",
      estimatedPrice: total,
      userInputs: { tier: tier.id, addons: [...addons] },
      requiresHitlValidation: false,
      lineItems,
    };
    onComplete(result);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">Select your garage size</p>

      <div className="grid gap-3 md:grid-cols-2">
        {TIERS.map((t) => (
          <Card
            key={t.id}
            className={`cursor-pointer transition-all p-4 ${
              selected === t.id ? "border-2 border-primary ring-2 ring-primary/20" : "hover:border-primary/50"
            }`}
            onClick={() => setSelected(t.id)}
          >
            <CardContent className="p-0 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">{t.name}</h3>
                {t.popular && <Badge className="bg-primary">Most Popular</Badge>}
              </div>
              <p className="text-2xl font-black text-primary">${t.price}</p>
              <p className="text-xs text-muted-foreground">{t.description}</p>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Package className="w-3 h-3" />{t.items}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{t.duration}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t.details}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {selected && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h4 className="font-bold text-sm">Optional Add-ons</h4>
            {ADDONS.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-2 hover:bg-muted/30 rounded">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={addons.has(a.id)}
                    onCheckedChange={() => {
                      setAddons((prev) => {
                        const next = new Set(prev);
                        next.has(a.id) ? next.delete(a.id) : next.add(a.id);
                        return next;
                      });
                    }}
                  />
                  <span className="text-sm">{a.label}</span>
                </div>
                <span className="text-sm font-medium">
                  {a.price > 0 ? `+$${a.price}` : <Badge variant="outline">Free</Badge>}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {tier && (
        <RunningTotal
          total={total}
          lineItems={lineItems}
          onContinue={handleContinue}
          onBack={onBack}
          note="Includes sorting, hauling, and eco-friendly disposal."
        />
      )}
    </div>
  );
}
