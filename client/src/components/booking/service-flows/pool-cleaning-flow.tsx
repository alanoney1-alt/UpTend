import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Droplets, RefreshCw } from "lucide-react";
import { RunningTotal } from "./running-total";
import type { ServiceFlowProps, ServiceFlowResult } from "./types";

const RECURRING_TIERS = [
  {
    id: "basic",
    name: "Basic",
    price: 89,
    includes: [
      "Weekly chemical balancing",
      "Surface skimming",
      "Empty skimmer baskets",
    ],
  },
  {
    id: "standard",
    name: "Standard",
    price: 129,
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
    price: 169,
    includes: [
      "Everything in Standard",
      "Tile & waterline cleaning",
      "Equipment monitoring",
      "Filter cleaning (monthly)",
      "DE/cartridge maintenance",
    ],
  },
];

type Mode = "one_time" | "recurring";

export function PoolCleaningFlow({ onComplete, onBack }: ServiceFlowProps) {
  const [mode, setMode] = useState<Mode>("recurring");
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const tier = RECURRING_TIERS.find((t) => t.id === selectedTier);
  const total = mode === "one_time" ? 199 : (tier?.price || 0);

  const lineItems =
    mode === "one_time"
      ? [{ label: "One-Time Deep Clean", price: 199 }]
      : tier
      ? [{ label: `${tier.name} Pool Service`, price: tier.price }]
      : [];

  const handleContinue = () => {
    const result: ServiceFlowResult = {
      quoteMethod: "manual",
      serviceType: "pool_cleaning",
      estimatedPrice: total,
      isRecurring: mode === "recurring",
      monthlyPrice: mode === "recurring" ? total : undefined,
      userInputs: { mode, tier: selectedTier },
      requiresHitlValidation: false,
      lineItems,
    };
    onComplete(result);
  };

  return (
    <div className="space-y-4">
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
            <p className="text-2xl font-black text-primary">$199</p>
            <p className="text-sm text-muted-foreground">
              Complete pool restoration — ideal for neglected or green pools.
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
          {RECURRING_TIERS.map((t) => (
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
                    ${t.price}<span className="text-sm font-normal">/mo</span>
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
          ))}
        </div>
      )}

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
