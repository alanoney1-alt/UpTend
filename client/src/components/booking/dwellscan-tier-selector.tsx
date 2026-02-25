import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Plane } from "lucide-react";
import { DWELLSCAN_TIERS, type DwellScanTier } from "@shared/dwellscan-tiers";

interface DwellScanTierSelectorProps {
  selectedTier: DwellScanTier | null;
  onSelectTier: (tier: DwellScanTier) => void;
}

export function DwellScanTierSelector({ selectedTier, onSelectTier }: DwellScanTierSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Choose Your Home DNA Scan Package</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Select the inspection level that's right for your home
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Standard Tier */}
        <Card
          className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
            selectedTier === "standard"
              ? "ring-2 ring-primary border-primary"
              : "border-2 hover:border-primary/50"
          }`}
          onClick={() => onSelectTier("standard")}
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-lg">
                  {DWELLSCAN_TIERS.standard.name}
                </h4>
                <p className="text-3xl font-bold text-primary mt-2">
                  ${DWELLSCAN_TIERS.standard.price}
                </p>
              </div>
              {selectedTier === "standard" && (
                <Badge variant="default" className="bg-green-600">
                  <Check className="h-3 w-3 mr-1" />
                  Selected
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              {DWELLSCAN_TIERS.standard.description}
            </p>

            <div className="space-y-2">
              {DWELLSCAN_TIERS.standard.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            <Button
              className="w-full"
              variant={selectedTier === "standard" ? "default" : "outline"}
              onClick={(e) => {
                e.stopPropagation();
                onSelectTier("standard");
              }}
            >
              {selectedTier === "standard" ? "Selected" : "Select Standard"}
            </Button>
          </div>
        </Card>

        {/* Aerial Tier */}
        <Card
          className={`p-6 cursor-pointer transition-all hover:shadow-lg relative ${
            selectedTier === "aerial"
              ? "ring-2 ring-primary border-primary"
              : "border-2 border-primary/30 hover:border-primary"
          }`}
          onClick={() => onSelectTier("aerial")}
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-lg">
                    {DWELLSCAN_TIERS.aerial.name}
                  </h4>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                    <Plane className="h-3 w-3 mr-1" />
                    {DWELLSCAN_TIERS.aerial.badge}
                  </Badge>
                </div>
                <p className="text-3xl font-bold text-primary mt-2">
                  ${DWELLSCAN_TIERS.aerial.price}
                </p>
              </div>
              {selectedTier === "aerial" && (
                <Badge variant="default" className="bg-green-600">
                  <Check className="h-3 w-3 mr-1" />
                  Selected
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              {DWELLSCAN_TIERS.aerial.description}
            </p>
            <p className="text-xs text-blue-600 font-medium">
              {DWELLSCAN_TIERS.aerial.subtext}
            </p>

            <div className="space-y-2">
              {DWELLSCAN_TIERS.aerial.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className={`text-sm ${idx === 0 ? "font-semibold" : ""}`}>
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            <Button
              className="w-full"
              variant={selectedTier === "aerial" ? "default" : "default"}
              onClick={(e) => {
                e.stopPropagation();
                onSelectTier("aerial");
              }}
            >
              {selectedTier === "aerial" ? "Selected" : "Select Aerial"}
            </Button>
          </div>
        </Card>
      </div>

      {/* Service Credit Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
        <p className="text-sm text-green-800 font-medium">
           Both packages are completely free and include a $25 credit toward your next booking!
        </p>
      </div>
    </div>
  );
}
