import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Package, Users } from "lucide-react";
import { NAMED_BUNDLES, type BundleId } from "@shared/bundles";

interface BundleSelectorProps {
  selectedBundle: BundleId | null;
  onSelectBundle: (bundleId: BundleId) => void;
  onSkip: () => void;
}

const SERVICE_ICONS: Record<string, string> = {
  junk_removal: "🗑️",
  home_cleaning: "✨",
  pressure_washing: "💧",
  gutter_cleaning: "🏠",
  home_consultation: "📋",
  handyman: "🔧",
  moving_labor: "💪",
  landscaping: "🌳",
  pool_cleaning: "🏊",
  carpet_cleaning: "🧹",
};

const SERVICE_NAMES: Record<string, string> = {
  junk_removal: "Junk Removal",
  home_cleaning: "Home Cleaning",
  pressure_washing: "Pressure Washing",
  gutter_cleaning: "Gutter Cleaning",
  home_consultation: "AI Home Audit",
  handyman: "Handyman Services",
  moving_labor: "Moving Labor",
  landscaping: "Landscaping",
  pool_cleaning: "Pool Cleaning",
  carpet_cleaning: "Carpet Cleaning",
};

export function BundleSelector({ selectedBundle, onSelectBundle, onSkip }: BundleSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Package className="h-12 w-12 text-primary mx-auto mb-3" />
        <h2 className="text-2xl font-bold mb-2">Save with Bundle Packages</h2>
        <p className="text-muted-foreground">
          Combine services and save! Or skip to book individual services.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {(Object.keys(NAMED_BUNDLES) as BundleId[]).map((bundleId) => {
          const bundle = NAMED_BUNDLES[bundleId];
          const isSelected = selectedBundle === bundleId;

          return (
            <Card
              key={bundleId}
              className={`p-6 cursor-pointer transition-all hover:shadow-lg relative ${
                isSelected
                  ? "ring-2 ring-primary border-primary"
                  : "border-2 hover:border-primary/50"
              }`}
              onClick={() => onSelectBundle(bundleId)}
            >
              {bundle.badge && (
                <Badge className="absolute top-3 right-3 bg-orange-500 text-white">
                  {bundle.badge}
                </Badge>
              )}

              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{bundle.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {bundle.description}
                    </p>
                  </div>
                  {isSelected && (
                    <Badge variant="default" className="bg-green-600 ml-2">
                      <Check className="h-3 w-3 mr-1" />
                      Selected
                    </Badge>
                  )}
                </div>

                {/* Services included */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase">
                    Includes:
                  </p>
                  {bundle.services.map((serviceId) => (
                    <div key={serviceId} className="flex items-center gap-2">
                      <span className="text-lg">{SERVICE_ICONS[serviceId] || "✓"}</span>
                      <span className="text-sm">{SERVICE_NAMES[serviceId] || serviceId}</span>
                    </div>
                  ))}
                </div>

                {/* Pricing */}
                <div className="flex items-baseline gap-3 pt-3 border-t">
                  <div className="text-3xl font-bold text-primary">
                    ${bundle.bundlePrice}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="line-through">${bundle.alacartePrice}</span>
                    <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                      Save ${bundle.savings}
                    </Badge>
                  </div>
                </div>

                {/* Notes */}
                {bundle.notes && bundle.notes.length > 0 && (
                  <div className="space-y-1 pt-2 border-t">
                    {bundle.notes.map((note, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        {bundle.requiresMultiplePros && note.includes("Multiple Pros") ? (
                          <Users className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <Check className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                        )}
                        <span className="text-xs text-muted-foreground">{note}</span>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  className="w-full"
                  variant={isSelected ? "default" : "outline"}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectBundle(bundleId);
                  }}
                >
                  {isSelected ? "Selected" : "Select Bundle"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="text-center pt-4 border-t">
        <Button variant="ghost" onClick={onSkip}>
          Skip bundles - Book individual services
        </Button>
      </div>
    </div>
  );
}
