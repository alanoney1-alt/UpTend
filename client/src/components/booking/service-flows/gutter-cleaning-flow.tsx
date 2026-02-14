import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { RunningTotal } from "./running-total";
import type { ServiceFlowProps, ServiceFlowResult } from "./types";

const SIZE_TIERS = [
  { id: "1s_sm", stories: 1, size: "Standard", linearFt: "Up to 150 linear ft", price: 129 },
  { id: "1s_lg", stories: 1, size: "Large", linearFt: "150-250 linear ft", price: 169 },
  { id: "2s_sm", stories: 2, size: "Standard", linearFt: "Up to 150 linear ft", price: 199 },
  { id: "2s_lg", stories: 2, size: "Large", linearFt: "150-250 linear ft", price: 249 },
  { id: "3s", stories: 3, size: "Any", linearFt: "All sizes", price: 299 },
];

const ADDONS = [
  { id: "guard_sm", label: "Gutter guard install (up to 100 ft)", price: 500, note: "$4-6/linear ft" },
  { id: "guard_lg", label: "Gutter guard install (100-250 ft)", price: 1000, note: "$4-6/linear ft" },
  { id: "downspout", label: "Downspout flush (each)", price: 15, qty: true },
  { id: "repair", label: "Minor gutter repair", price: 75 },
];

export function GutterCleaningFlow({ onComplete, onBack, propertyData }: ServiceFlowProps) {
  const defaultStories = propertyData?.stories === "2" ? 2 : propertyData?.stories === "3+" ? 3 : 1;
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [addons, setAddons] = useState<Record<string, number>>({});

  // Auto-filter by stories from property data
  const storiesFilter = defaultStories;

  const tier = SIZE_TIERS.find((t) => t.id === selectedTier);
  const addonTotal = Object.entries(addons).reduce((sum, [id, qty]) => {
    const a = ADDONS.find((a) => a.id === id);
    return sum + (a?.price || 0) * qty;
  }, 0);
  const total = (tier?.price || 0) + addonTotal;

  const lineItems = [
    ...(tier ? [{ label: `${tier.stories}-Story ${tier.size} Gutter Cleaning`, price: tier.price }] : []),
    ...Object.entries(addons)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const a = ADDONS.find((a) => a.id === id)!;
        return { label: a.label, price: a.price, quantity: qty };
      }),
  ];

  const handleContinue = () => {
    if (!tier) return;
    const result: ServiceFlowResult = {
      quoteMethod: "manual",
      serviceType: "gutter_cleaning",
      estimatedPrice: total,
      userInputs: { tier: selectedTier, addons },
      requiresHitlValidation: false,
      lineItems,
    };
    onComplete(result);
  };

  return (
    <div className="space-y-4">
      {propertyData?.stories && (
        <div className="p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            Auto-detected: {propertyData.stories}-story home
          </p>
        </div>
      )}

      <Card>
        <CardContent className="p-4 space-y-3">
          <h4 className="font-bold text-sm">Select Your Home Size</h4>
          <p className="text-xs text-muted-foreground">
            Not sure about linear footage? Small/medium homes = standard, large/custom = large.
          </p>
          <div className="space-y-2">
            {SIZE_TIERS.map((t) => (
              <div
                key={t.id}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedTier === t.id ? "border-primary bg-primary/5" : "hover:border-primary/50"
                }`}
                onClick={() => setSelectedTier(t.id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium text-sm">{t.stories}-Story {t.size}</span>
                    <p className="text-xs text-muted-foreground">{t.linearFt}</p>
                  </div>
                  <span className="text-lg font-black text-primary">${t.price}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedTier && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h4 className="font-bold text-sm">Add-ons</h4>
            {ADDONS.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={!!addons[a.id]}
                    onCheckedChange={() => {
                      setAddons((prev) => {
                        if (prev[a.id]) {
                          const { [a.id]: _, ...rest } = prev;
                          return rest;
                        }
                        return { ...prev, [a.id]: 1 };
                      });
                    }}
                  />
                  <div>
                    <span className="text-sm">{a.label}</span>
                    {a.note && <p className="text-xs text-muted-foreground">{a.note}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {a.qty && addons[a.id] ? (
                    <>
                      <Button variant="outline" size="sm" className="min-h-[44px] min-w-[44px]" onClick={() => setAddons((p) => ({ ...p, [a.id]: Math.max(0, (p[a.id] || 1) - 1) }))}>-</Button>
                      <span className="w-6 text-center text-sm">{addons[a.id]}</span>
                      <Button variant="outline" size="sm" className="min-h-[44px] min-w-[44px]" onClick={() => setAddons((p) => ({ ...p, [a.id]: (p[a.id] || 1) + 1 }))}>+</Button>
                    </>
                  ) : (
                    <span className="text-sm font-medium">${a.price}</span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <RunningTotal
        total={total}
        lineItems={lineItems}
        onContinue={handleContinue}
        onBack={onBack}
        note="Includes full debris removal and downspout check."
      />
    </div>
  );
}
