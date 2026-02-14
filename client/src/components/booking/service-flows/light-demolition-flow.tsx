import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { RunningTotal } from "./running-total";
import { AiScanToggle } from "./ai-scan-toggle";
import type { ServiceFlowProps, ServiceFlowResult } from "./types";

const SCOPES = [
  { id: "bathroom", label: "Bathroom Demo", prices: { small: 200, medium: 350, large: 500 }, description: "Tile, vanity, fixtures removal" },
  { id: "kitchen_cabinets", label: "Kitchen Cabinet Removal", prices: { small: 300, medium: 550, large: 800 }, description: "Cabinet tear-out, countertop removal" },
  { id: "shed", label: "Shed Demolition", prices: { small: 500, medium: 1000, large: 1500 }, description: "Complete tear-down and haul-away" },
  { id: "deck", label: "Deck Removal", prices: { small: 300, medium: 650, large: 1000 }, description: "Deck boards, railing, framing" },
  { id: "wall", label: "Interior Wall (non-load-bearing)", prices: { small: 300, medium: 550, large: 800 }, description: "Drywall, framing, cleanup" },
  { id: "fence", label: "Fencing Removal", prices: { small: 200, medium: 400, large: 600 }, description: "Panels, posts, and disposal" },
  { id: "custom", label: "Custom / Other", prices: { small: 0, medium: 0, large: 0 }, description: "Request a custom quote", isCustom: true },
];

type Size = "small" | "medium" | "large";

export function LightDemolitionFlow({ onComplete, onBack }: ServiceFlowProps) {
  const [quoteMode, setQuoteMode] = useState<"ai" | "manual">("manual");
  const [selectedScopes, setSelectedScopes] = useState<Record<string, Size>>({});
  const [haulAway, setHaulAway] = useState(true);

  if (quoteMode === "ai") {
    window.location.href = `/ai/photo-quote?service=light_demolition`;
    return null;
  }

  const toggleScope = (id: string) => {
    setSelectedScopes((prev) => {
      if (prev[id]) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: "medium" };
    });
  };

  const setSize = (id: string, size: Size) => {
    setSelectedScopes((prev) => ({ ...prev, [id]: size }));
  };

  const hasCustom = selectedScopes["custom"] !== undefined;
  const lineItems = Object.entries(selectedScopes)
    .filter(([id]) => id !== "custom")
    .map(([id, size]) => {
      const scope = SCOPES.find((s) => s.id === id)!;
      return {
        label: `${scope.label} (${size})`,
        price: scope.prices[size],
      };
    });

  const total = lineItems.reduce((sum, item) => sum + item.price, 0);

  const handleContinue = () => {
    if (hasCustom && lineItems.length === 0) {
      // Custom-only — send with $0 and flag for manual quote
      const result: ServiceFlowResult = {
        quoteMethod: "manual",
        serviceType: "light_demolition",
        estimatedPrice: 0,
        userInputs: { selectedScopes, haulAway, needsCustomQuote: true },
        requiresHitlValidation: true,
        lineItems: [{ label: "Custom scope — quote required", price: 0 }],
      };
      onComplete(result);
      return;
    }

    const result: ServiceFlowResult = {
      quoteMethod: "manual",
      serviceType: "light_demolition",
      estimatedPrice: total,
      userInputs: { selectedScopes, haulAway },
      requiresHitlValidation: false,
      lineItems: [
        ...lineItems,
        ...(haulAway ? [{ label: "Haul-away included", price: 0 }] : []),
      ],
    };
    onComplete(result);
  };

  return (
    <div className="space-y-4">
      <AiScanToggle serviceId="light_demolition" quoteMode={quoteMode} onModeChange={setQuoteMode} />

      <p className="text-sm text-muted-foreground text-center">
        Select demo scope and size. Combine multiple areas.
      </p>

      <div className="space-y-3">
        {SCOPES.map((scope) => {
          const isSelected = !!selectedScopes[scope.id];
          const size = selectedScopes[scope.id];
          return (
            <Card key={scope.id} className={`transition-all ${isSelected ? "border-primary" : ""}`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleScope(scope.id)}>
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isSelected} />
                    <div>
                      <span className="font-medium text-sm">{scope.label}</span>
                      <p className="text-xs text-muted-foreground">{scope.description}</p>
                    </div>
                  </div>
                  {isSelected && !scope.isCustom && (
                    <span className="text-sm font-bold text-primary">${scope.prices[size!]}</span>
                  )}
                  {scope.isCustom && isSelected && (
                    <Badge variant="outline">Quote Required</Badge>
                  )}
                </div>

                {isSelected && !scope.isCustom && (
                  <div className="flex gap-2 pl-8">
                    {(["small", "medium", "large"] as Size[]).map((s) => (
                      <Button
                        key={s}
                        variant={size === s ? "default" : "outline"}
                        size="sm"
                        className="text-xs capitalize"
                        onClick={() => setSize(scope.id, s)}
                      >
                        {s} — ${scope.prices[s]}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Haul-away */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Checkbox checked={haulAway} onCheckedChange={(v) => setHaulAway(!!v)} />
            <div>
              <span className="text-sm font-medium">Include debris haul-away</span>
              <p className="text-xs text-muted-foreground">Included in price — uncheck only if you'll handle disposal</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <RunningTotal
        total={total}
        lineItems={lineItems}
        onContinue={handleContinue}
        onBack={onBack}
        continueLabel={hasCustom && total === 0 ? "Request Custom Quote" : "Continue with This Quote"}
        note="Haul-away included. Permits handled if needed. Pro confirms scope on-site."
      />
    </div>
  );
}
