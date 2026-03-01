import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, Droplets, RefreshCw } from "lucide-react";
import { RunningTotal } from "./running-total";
import type { ServiceFlowProps, ServiceFlowResult } from "./types";

const POOL_SIZES = [
  { id: "small", label: "Small (up to 10,000 gal)", multiplier: 1 },
  { id: "medium", label: "Medium (10,000-20,000 gal)", multiplier: 1.15 },
  { id: "large", label: "Large (20,000+ gal)", multiplier: 1.3 },
];

const POOL_TYPES = [
  { id: "chlorine", label: "Chlorine" },
  { id: "saltwater", label: "Saltwater" },
  { id: "not_sure", label: "Not sure" },
];

const RECURRING_TIERS = [
  {
    id: "basic",
    name: "Basic",
    basePrice: 99,
    includes: [
      "Weekly chemical balancing",
      "Surface skimming",
      "Empty skimmer baskets",
    ],
  },
  {
    id: "standard",
    name: "Standard",
    basePrice: 165,
    includes: [
      "Everything in Basic",
      "Brush walls & tile line",
      "Vacuum pool floor",
      "Filter pressure check",
    ],
    popular: true,
  },
  {
    id: "full",
    name: "Full Service",
    basePrice: 210,
    includes: [
      "Everything in Standard",
      "Tile & waterline cleaning",
      "Equipment monitoring",
      "Filter cleaning (monthly)",
      "DE/cartridge maintenance",
    ],
  },
];

const ADDONS = [
  { id: "screen_enclosure", label: "Screen enclosure cleaning", price: 75, note: "Inside pool cage" },
  { id: "deck_pressure", label: "Pool deck pressure wash", price: 99 },
  { id: "filter_replacement", label: "Filter cartridge replacement", price: 45, note: "Parts extra if needed" },
  { id: "salt_cell", label: "Salt cell cleaning", price: 35 },
  { id: "light_repair", label: "Pool light repair/replacement", price: 65 },
  { id: "heater_check", label: "Heater inspection", price: 49 },
  { id: "phosphate", label: "Phosphate removal treatment", price: 35 },
  { id: "acid_wash", label: "Acid wash (resurface prep)", price: 199 },
];

const DEEP_CLEAN_BASE = 249;

type Mode = "one_time" | "recurring";

export function PoolCleaningFlow({ onComplete, onBack }: ServiceFlowProps) {
  const [mode, setMode] = useState<Mode>("recurring");
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [poolSize, setPoolSize] = useState("medium");
  const [poolType, setPoolType] = useState("chlorine");
  const [hasEnclosure, setHasEnclosure] = useState<boolean | null>(null);
  const [addons, setAddons] = useState<Set<string>>(new Set());

  const sizeMultiplier = POOL_SIZES.find(s => s.id === poolSize)?.multiplier || 1;
  const tier = RECURRING_TIERS.find((t) => t.id === selectedTier);

  // Calculate add-on total
  let addonTotal = 0;
  const addonLineItems: Array<{ label: string; price: number }> = [];
  for (const id of addons) {
    const a = ADDONS.find((a) => a.id === id)!;
    addonTotal += a.price;
    addonLineItems.push({ label: a.label, price: a.price });
  }

  const baseTotal = mode === "one_time"
    ? Math.round(DEEP_CLEAN_BASE * sizeMultiplier)
    : Math.round((tier?.basePrice || 0) * sizeMultiplier);

  const total = baseTotal + addonTotal;

  const lineItems = mode === "one_time"
    ? [{ label: `One-Time Deep Clean (${POOL_SIZES.find(s => s.id === poolSize)?.label})`, price: Math.round(DEEP_CLEAN_BASE * sizeMultiplier) }, ...addonLineItems]
    : tier
    ? [{ label: `${tier.name} Pool Service (${POOL_SIZES.find(s => s.id === poolSize)?.label})`, price: Math.round(tier.basePrice * sizeMultiplier) }, ...addonLineItems]
    : [...addonLineItems];

  const handleContinue = () => {
    const result: ServiceFlowResult = {
      quoteMethod: "manual",
      serviceType: "pool_cleaning",
      estimatedPrice: total,
      isRecurring: mode === "recurring",
      monthlyPrice: mode === "recurring" ? total : undefined,
      userInputs: { mode, tier: selectedTier, poolSize, poolType, hasEnclosure, addons: [...addons] },
      requiresHitlValidation: false,
      lineItems,
    };
    onComplete(result);
  };

  return (
    <div className="space-y-4">
      {/* Pool details */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h4 className="font-bold text-sm flex items-center gap-2"><Droplets className="w-4 h-4" /> Pool Details</h4>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Pool Size</label>
            <div className="flex gap-2">
              {POOL_SIZES.map(s => (
                <Button key={s.id} variant={poolSize === s.id ? "default" : "outline"} size="sm" className="flex-1 text-xs" onClick={() => setPoolSize(s.id)}>
                  {s.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Pool Type</label>
            <div className="flex gap-2">
              {POOL_TYPES.map(t => (
                <Button key={t.id} variant={poolType === t.id ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setPoolType(t.id)}>
                  {t.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Screen Enclosure?</label>
            <div className="flex gap-2">
              <Button variant={hasEnclosure === true ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setHasEnclosure(true)}>Yes</Button>
              <Button variant={hasEnclosure === false ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setHasEnclosure(false)}>No</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <Button variant={mode === "one_time" ? "default" : "outline"} className="flex-1" onClick={() => setMode("one_time")}>
          <Droplets className="w-4 h-4 mr-2" /> One-Time Deep Clean
        </Button>
        <Button variant={mode === "recurring" ? "default" : "outline"} className="flex-1 gap-2" onClick={() => setMode("recurring")}>
          <RefreshCw className="w-4 h-4" /> Monthly Service
        </Button>
      </div>

      {mode === "one_time" && (
        <Card className="border-primary">
          <CardContent className="p-5 space-y-3">
            <h3 className="font-bold text-lg">One-Time Deep Clean</h3>
            <p className="text-2xl font-black text-primary">${Math.round(DEEP_CLEAN_BASE * sizeMultiplier)}</p>
            <p className="text-sm text-muted-foreground">
              Complete pool restoration. Ideal for neglected or green pools.
            </p>
            <ul className="space-y-1.5">
              {["Full chemical treatment & rebalancing", "Brush all surfaces", "Vacuum entire pool", "Clean filter system", "Tile & waterline scrub", "Equipment inspection"].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle className="w-3 h-3 text-green-500 shrink-0" /> {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {mode === "recurring" && (
        <div className="space-y-3">
          {RECURRING_TIERS.map((t) => {
            const tierPrice = Math.round(t.basePrice * sizeMultiplier);
            return (
              <Card
                key={t.id}
                className={`cursor-pointer transition-all ${
                  selectedTier === t.id ? "border-2 border-primary ring-2 ring-primary/20" : "hover:border-primary/50"
                }`}
                onClick={() => setSelectedTier(t.id)}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">{t.name}</h3>
                      {t.popular && <Badge className="bg-primary">Popular</Badge>}
                    </div>
                    <span className="text-xl font-black text-primary">
                      ${tierPrice}<span className="text-sm font-normal">/mo</span>
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {t.includes.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle className="w-3 h-3 text-green-500 shrink-0" /> {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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
                <div>
                  <span className="text-sm">{a.label}</span>
                  {a.note && <span className="text-xs text-muted-foreground ml-1">({a.note})</span>}
                </div>
              </div>
              <span className="text-sm font-medium text-muted-foreground">+${a.price}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <RunningTotal
        total={total}
        monthlyTotal={mode === "recurring" ? total : undefined}
        lineItems={lineItems}
        onContinue={handleContinue}
        onBack={onBack}
        note={mode === "recurring" ? "Cancel anytime. Weekly visits included." : "Includes all chemicals and labor."}
      />
    </div>
  );
}
