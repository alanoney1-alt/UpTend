import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Home, RefreshCw } from "lucide-react";
import { RunningTotal } from "./running-total";
import type { ServiceFlowProps, ServiceFlowResult } from "./types";

const BASE_PRICES: Record<string, number> = {
  "1-1": 99, "2-1": 129, "2-2": 149, "3-2": 179,
  "3-3": 209, "4-2": 229, "4-3": 259, "5-3": 299, "5-4": 299,
};

const CLEAN_TYPES = [
  { id: "standard", label: "Standard Clean", multiplier: 1, description: "Regular cleaning — dusting, vacuuming, mopping, bathrooms, kitchen" },
  { id: "deep", label: "Deep Clean", multiplier: 1.5, description: "Standard + baseboards, inside cabinets, appliances, detailed scrub", badge: "Popular" },
  { id: "move_out", label: "Move-In/Out Clean", multiplier: 2, description: "Top-to-bottom deep clean, inside every cabinet, oven, fridge, windows" },
];

const ADDONS = [
  { id: "pets", label: "Pets in home (+pet hair treatment)", price: 15 },
  { id: "same_day", label: "Same-day service", price: 30 },
  { id: "not_cleaned", label: "Not cleaned in 6+ months (+20%)", pct: 0.2 },
  { id: "oven", label: "Inside oven deep clean", price: 35 },
  { id: "fridge", label: "Inside refrigerator", price: 35 },
  { id: "laundry", label: "Laundry (wash/dry/fold, per load)", price: 25 },
];

const RECURRING_OPTIONS = [
  { id: "none", label: "One-time", discount: 0 },
  { id: "monthly", label: "Monthly (10% off)", discount: 0.1 },
  { id: "biweekly", label: "Bi-weekly (12% off)", discount: 0.12 },
  { id: "weekly", label: "Weekly (15% off)", discount: 0.15 },
];

export function HomeCleaningFlow({ onComplete, onBack, propertyData }: ServiceFlowProps) {
  const [bedrooms, setBedrooms] = useState(propertyData?.bedrooms || 2);
  const [bathrooms, setBathrooms] = useState(propertyData?.bathrooms || 2);
  const [cleanType, setCleanType] = useState("standard");
  const [storiesVal, setStoriesVal] = useState(propertyData?.stories || "1");
  const [addons, setAddons] = useState<Set<string>>(new Set());
  const [recurring, setRecurring] = useState("none");

  const key = `${bedrooms}-${Math.floor(bathrooms)}`;
  const basePrice = BASE_PRICES[key] || 149;
  const typeMultiplier = CLEAN_TYPES.find((t) => t.id === cleanType)!.multiplier;
  let price = Math.round(basePrice * typeMultiplier);

  // Stories surcharge
  const storiesNum = storiesVal === "3+" ? 3 : parseInt(storiesVal) || 1;
  if (storiesNum === 2) price = Math.round(price * 1.15);
  if (storiesNum >= 3) price = Math.round(price * 1.25);

  // Sqft surcharge
  const isBig = propertyData?.sqftRange === "3000+";
  if (isBig) price = Math.round(price * 1.1);

  // Flat add-ons
  let addonTotal = 0;
  const addonLineItems: Array<{ label: string; price: number }> = [];
  for (const id of addons) {
    const a = ADDONS.find((a) => a.id === id)!;
    if (a.pct) {
      const pctAmt = Math.round(price * a.pct);
      addonTotal += pctAmt;
      addonLineItems.push({ label: a.label, price: pctAmt });
    } else if (a.price) {
      addonTotal += a.price;
      addonLineItems.push({ label: a.label, price: a.price });
    }
  }

  const beforeDiscount = price + addonTotal;
  const recurringOpt = RECURRING_OPTIONS.find((r) => r.id === recurring)!;
  const discountAmt = Math.round(beforeDiscount * recurringOpt.discount);
  const total = beforeDiscount - discountAmt;

  const lineItems = [
    { label: `${CLEAN_TYPES.find((t) => t.id === cleanType)!.label} — ${bedrooms}BR/${bathrooms}BA`, price },
    ...(storiesNum >= 2 ? [{ label: `${storiesNum}-story surcharge`, price: Math.round(basePrice * typeMultiplier * (storiesNum === 2 ? 0.15 : 0.25)) }] : []),
    ...(isBig ? [{ label: "3,000+ sqft surcharge (10%)", price: Math.round(basePrice * typeMultiplier * 0.1) }] : []),
    ...addonLineItems,
  ];

  const discounts = discountAmt > 0 ? [{ label: `Recurring discount (${recurringOpt.label})`, amount: discountAmt }] : [];

  const handleContinue = () => {
    const result: ServiceFlowResult = {
      quoteMethod: "manual",
      serviceType: "home_cleaning",
      estimatedPrice: total,
      isRecurring: recurring !== "none",
      monthlyPrice: recurring !== "none" ? total : undefined,
      userInputs: { bedrooms, bathrooms, cleanType, stories: storiesVal, addons: [...addons], recurring },
      requiresHitlValidation: false,
      lineItems,
      discounts,
    };
    onComplete(result);
  };

  return (
    <div className="space-y-4">
      {/* Bedrooms/Bathrooms */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h4 className="font-bold text-sm flex items-center gap-2"><Home className="w-4 h-4" /> Property Size</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Bedrooms</Label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((b) => (
                  <Button key={b} variant={bedrooms === b ? "default" : "outline"} size="sm" onClick={() => setBedrooms(b)}>
                    {b}{b === 5 ? "+" : ""}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Bathrooms</Label>
              <div className="flex gap-1 mt-1">
                {[1, 1.5, 2, 2.5, 3, 4].map((b) => (
                  <Button key={b} variant={bathrooms === b ? "default" : "outline"} size="sm" onClick={() => setBathrooms(b)}>
                    {b}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Stories</Label>
            <div className="flex gap-1 mt-1">
              {["1", "2", "3+"].map((s) => (
                <Button key={s} variant={storiesVal === s ? "default" : "outline"} size="sm" onClick={() => setStoriesVal(s)}>
                  {s}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clean type */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h4 className="font-bold text-sm flex items-center gap-2"><Sparkles className="w-4 h-4" /> Type of Clean</h4>
          {CLEAN_TYPES.map((t) => (
            <div
              key={t.id}
              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                cleanType === t.id ? "border-primary bg-primary/5" : "hover:border-primary/50"
              }`}
              onClick={() => setCleanType(t.id)}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{t.label}</span>
                {t.badge && <Badge className="bg-primary">{t.badge}</Badge>}
                <span className="text-sm font-bold text-primary">
                  {t.multiplier === 1 ? "Base" : `${t.multiplier}×`}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Add-ons */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h4 className="font-bold text-sm">Add-ons</h4>
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
              <span className="text-sm font-medium text-muted-foreground">
                {a.price ? `+$${a.price}` : ""}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recurring */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h4 className="font-bold text-sm flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Recurring Service?</h4>
          <div className="grid grid-cols-2 gap-2">
            {RECURRING_OPTIONS.map((r) => (
              <Button
                key={r.id}
                variant={recurring === r.id ? "default" : "outline"}
                className="h-auto py-2 text-xs"
                onClick={() => setRecurring(r.id)}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <RunningTotal
        total={total}
        monthlyTotal={recurring !== "none" ? total : undefined}
        lineItems={lineItems}
        discounts={discounts}
        onContinue={handleContinue}
        onBack={onBack}
        note="Eco-friendly products. Pro will confirm details on arrival."
      />
    </div>
  );
}
