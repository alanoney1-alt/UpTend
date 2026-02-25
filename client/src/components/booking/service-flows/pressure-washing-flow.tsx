import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Droplets } from "lucide-react";
import { RunningTotal } from "./running-total";
import { AiScanToggle } from "./ai-scan-toggle";
import type { ServiceFlowProps, ServiceFlowResult } from "./types";

interface Surface {
  id: string;
  label: string;
  sizes: Array<{ id: string; label: string; price: number }>;
}

const SURFACES: Surface[] = [
  {
    id: "driveway",
    label: "Driveway",
    sizes: [
      { id: "sm", label: "Small (≤400 sqft)", price: 120 },
      { id: "md", label: "Medium (400-700 sqft)", price: 160 },
      { id: "lg", label: "Large (700+ sqft)", price: 220 },
    ],
  },
  {
    id: "walkway",
    label: "Walkway / Sidewalk",
    sizes: [
      { id: "sm", label: "Short", price: 60 },
      { id: "md", label: "Standard", price: 80 },
      { id: "lg", label: "Long/Multiple", price: 120 },
    ],
  },
  {
    id: "house_1",
    label: "House Exterior (1-Story)",
    sizes: [
      { id: "sm", label: "Small home", price: 250 },
      { id: "md", label: "Medium home", price: 325 },
      { id: "lg", label: "Large home", price: 400 },
    ],
  },
  {
    id: "house_2",
    label: "House Exterior (2-Story)",
    sizes: [
      { id: "sm", label: "Small home", price: 300 },
      { id: "md", label: "Medium home", price: 375 },
      { id: "lg", label: "Large home", price: 450 },
    ],
  },
  {
    id: "patio",
    label: "Patio / Deck",
    sizes: [
      { id: "sm", label: "Small (≤200 sqft)", price: 89 },
      { id: "md", label: "Medium (200-400 sqft)", price: 139 },
      { id: "lg", label: "Large (400+ sqft)", price: 189 },
    ],
  },
  {
    id: "fence",
    label: "Fence",
    sizes: [
      { id: "sm", label: "Small (≤50 linear ft)", price: 100 },
      { id: "md", label: "Medium (50-100 ft)", price: 150 },
      { id: "lg", label: "Large (100+ ft)", price: 200 },
    ],
  },
];

export function PressureWashingFlow({ onComplete, onBack }: ServiceFlowProps) {
  const [quoteMode, setQuoteMode] = useState<"ai" | "manual">("manual");
  const [selections, setSelections] = useState<Record<string, string>>({});

  if (quoteMode === "ai") {
    window.location.href = `/ai/photo-quote?service=pressure_washing`;
    return null;
  }

  const toggleSurface = (surfaceId: string) => {
    setSelections((prev) => {
      if (prev[surfaceId]) {
        const { [surfaceId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [surfaceId]: "md" };
    });
  };

  const setSize = (surfaceId: string, sizeId: string) => {
    setSelections((prev) => ({ ...prev, [surfaceId]: sizeId }));
  };

  const lineItems = Object.entries(selections).map(([surfaceId, sizeId]) => {
    const surface = SURFACES.find((s) => s.id === surfaceId)!;
    const size = surface.sizes.find((s) => s.id === sizeId)!;
    return { label: `${surface.label} (${size.label})`, price: size.price };
  });

  const total = lineItems.reduce((sum, item) => sum + item.price, 0);

  const handleContinue = () => {
    const result: ServiceFlowResult = {
      quoteMethod: "manual",
      serviceType: "pressure_washing",
      estimatedPrice: total,
      userInputs: { selections },
      requiresHitlValidation: false,
      lineItems,
    };
    onComplete(result);
  };

  return (
    <div className="space-y-4">
      <AiScanToggle serviceId="pressure_washing" quoteMode={quoteMode} onModeChange={setQuoteMode} />

      <p className="text-sm text-muted-foreground text-center">
        Select surfaces to clean. Pick size for each.
      </p>

      <div className="space-y-3">
        {SURFACES.map((surface) => {
          const isSelected = !!selections[surface.id];
          const selectedSize = selections[surface.id];
          return (
            <Card
              key={surface.id}
              className={`transition-all ${isSelected ? "border-primary" : ""}`}
            >
              <CardContent className="p-4 space-y-3">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleSurface(surface.id)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isSelected} />
                    <span className="font-medium text-sm">{surface.label}</span>
                  </div>
                  {isSelected && (
                    <span className="text-sm font-bold text-primary">
                      ${surface.sizes.find((s) => s.id === selectedSize)?.price}
                    </span>
                  )}
                </div>

                {isSelected && (
                  <div className="flex gap-2 pl-8">
                    {surface.sizes.map((size) => (
                      <Button
                        key={size.id}
                        variant={selectedSize === size.id ? "default" : "outline"}
                        size="sm"
                        className="text-xs min-h-[44px]"
                        onClick={() => setSize(surface.id, size.id)}
                      >
                        {size.label}: ${size.price}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <RunningTotal
        total={total}
        lineItems={lineItems}
        minimumCharge={120}
        onContinue={handleContinue}
        onBack={onBack}
        note="Eco-friendly cleaning. $120 minimum charge."
      />
    </div>
  );
}
