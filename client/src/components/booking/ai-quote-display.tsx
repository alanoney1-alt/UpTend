import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Truck,
  Leaf,
  Droplets,
  TreePine,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AIQuoteDisplayProps {
  quote: {
    identifiedItems: string[];
    estimatedVolumeCubicFt: number;
    recommendedLoadSize: "small" | "medium" | "large" | "extra_large" | "full";
    confidence: number;
    suggestedPrice: number;
    suggestedPriceMin: number;
    suggestedPriceMax: number;
    reasoning: string;
    itemBreakdown?: {
      item: string;
      estimatedWeight: number | string;
      estimatedVolume: number | string;
      specialHandling?: string;
    }[];
    sustainability?: {
      recycledLbs: number;
      donatedLbs: number;
      landfilledLbs: number;
      diversionRate: number;
      co2AvoidedLbs: number;
      treesEquivalent: number;
      waterSavedGallons?: number;
    };
    // For pressure washing
    totalSqft?: number;
    surfaces?: {
      type: string;
      dimensions?: string;
      sqft: number;
      condition?: string;
      estimatedTime?: string;
    }[];
  };
  serviceType: string;
  onBook: () => void;
  className?: string;
}

const LOAD_SIZE_DESCRIPTIONS = {
  small: "Minimum Load (~50 cubic ft)",
  medium: "Quarter Load (~100 cubic ft)",
  large: "Half Load (~200 cubic ft)",
  extra_large: "3/4 Load (~300 cubic ft)",
  full: "Full Load (~400 cubic ft)",
};

export function AIQuoteDisplay({
  quote,
  serviceType,
  onBook,
  className,
}: AIQuoteDisplayProps) {
  const [showAllItems, setShowAllItems] = useState(false);
  const [showReasoningDialog, setShowReasoningDialog] = useState(false);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) {
      return { color: "bg-green-500", text: "High Confidence", icon: "⭐⭐⭐⭐" };
    } else if (confidence >= 0.7) {
      return { color: "bg-yellow-500", text: "Good Confidence", icon: "⭐⭐⭐" };
    } else {
      return { color: "bg-orange-500", text: "Fair Confidence", icon: "⭐⭐" };
    }
  };

  const confidenceBadge = getConfidenceBadge(quote.confidence);

  const isPressureWashing = serviceType === "surface-wash" || serviceType === "pressure_washing";

  return (
    <div className={cn("space-y-4", className)}>
      {/* Hero Card - Price Estimate */}
      <Card className="border-2 border-primary">
        <CardContent className="p-6">
          <div className="text-center space-y-3">
            <Badge className={cn("text-white", confidenceBadge.color)}>
              {Math.round(quote.confidence * 100)}% Confidence {confidenceBadge.icon}
            </Badge>

            {isPressureWashing && quote.totalSqft ? (
              <>
                <p className="text-sm text-muted-foreground">Total Area</p>
                <p className="text-4xl md:text-5xl font-black text-primary">
                  {quote.totalSqft} sqft
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {LOAD_SIZE_DESCRIPTIONS[quote.recommendedLoadSize]}
                </p>
              </>
            )}

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Estimated Price</p>
              <p className="text-4xl md:text-5xl font-black text-primary">
                {formatCurrency(quote.suggestedPriceMin)} - {formatCurrency(quote.suggestedPriceMax)}
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              Based on AI analysis of your {isPressureWashing ? "photos" : "items"}
            </p>

            <Button onClick={onBook} size="lg" className="w-full mt-4">
              Book This Quote →
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* For Pressure Washing: Surface Breakdown */}
      {isPressureWashing && quote.surfaces && quote.surfaces.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-primary" />
              Surfaces Identified
            </h3>
            <div className="space-y-3">
              {quote.surfaces.map((surface, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium capitalize">
                      {surface.type.replace(/_/g, " ")}
                    </p>
                    {surface.dimensions && (
                      <p className="text-xs text-muted-foreground">
                        {surface.dimensions}
                      </p>
                    )}
                    {surface.condition && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Condition: {surface.condition}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{surface.sqft} sqft</p>
                    {surface.estimatedTime && (
                      <p className="text-xs text-muted-foreground">
                        ~{surface.estimatedTime}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Itemized Breakdown (for non-pressure washing services) */}
      {!isPressureWashing && quote.itemBreakdown && quote.itemBreakdown.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                Identified Items ({quote.itemBreakdown.length})
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllItems(!showAllItems)}
                className="text-xs"
              >
                {showAllItems ? (
                  <>
                    Show Less <ChevronUp className="w-3 h-3 ml-1" />
                  </>
                ) : (
                  <>
                    Show All <ChevronDown className="w-3 h-3 ml-1" />
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-2">
              {(showAllItems
                ? quote.itemBreakdown
                : quote.itemBreakdown.slice(0, 5)
              ).map((item, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-start gap-2 flex-1">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">{item.item}</p>
                      {item.specialHandling && (
                        <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {item.specialHandling}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>Est. {item.estimatedWeight}</p>
                    <p>{item.estimatedVolume}</p>
                  </div>
                </div>
              ))}
            </div>

            {!showAllItems && quote.itemBreakdown.length > 5 && (
              <p className="text-xs text-center text-muted-foreground mt-3">
                + {quote.itemBreakdown.length - 5} more items
              </p>
            )}

            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Volume:</span>
                <span className="font-medium">
                  {quote.estimatedVolumeCubicFt} cubic feet
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sustainability Impact */}
      {quote.sustainability && (
        <Card className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Leaf className="w-5 h-5 text-green-600" />
              Sustainability Impact
            </h3>

            <div className="space-y-4">
              {/* Diversion Rate */}
              <div className="text-center p-4 bg-white dark:bg-slate-900 rounded-lg">
                <p className="text-3xl font-black text-green-600">
                  {Math.round(quote.sustainability.diversionRate * 100)}%
                </p>
                <p className="text-sm text-muted-foreground">
                  Landfill Diversion Rate
                </p>
                <div className="flex justify-center gap-4 mt-3 text-xs">
                  <span className="text-green-600">
                    ♻️ {quote.sustainability.recycledLbs}lbs recycled
                  </span>
                  <span className="text-blue-600">
                    🎁 {quote.sustainability.donatedLbs}lbs donated
                  </span>
                  <span className="text-gray-600">
                    🗑️ {quote.sustainability.landfilledLbs}lbs landfilled
                  </span>
                </div>
              </div>

              {/* Environmental Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="text-center p-3 bg-white dark:bg-slate-900 rounded-lg">
                  <TreePine className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-lg font-bold">
                    {quote.sustainability.treesEquivalent.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    trees of CO₂ saved
                  </p>
                </div>

                <div className="text-center p-3 bg-white dark:bg-slate-900 rounded-lg">
                  <Leaf className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-lg font-bold">
                    {quote.sustainability.co2AvoidedLbs.toFixed(0)} lbs
                  </p>
                  <p className="text-xs text-muted-foreground">CO₂ avoided</p>
                </div>

                {quote.sustainability.waterSavedGallons !== undefined && (
                  <div className="text-center p-3 bg-white dark:bg-slate-900 rounded-lg">
                    <Droplets className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-lg font-bold">
                      {quote.sustainability.waterSavedGallons.toFixed(0)} gal
                    </p>
                    <p className="text-xs text-muted-foreground">
                      water conserved
                    </p>
                  </div>
                )}
              </div>

              <p className="text-xs text-center text-green-700 dark:text-green-400 font-medium">
                ♻️ This job supports circular economy practices
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* What's Included */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-bold text-lg mb-4">What's Included</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              <span>Professional pickup and removal</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              <span>Eco-friendly disposal with verified tracking</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              <span>Same-day or next-day service available</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              <span>Post-job cleanup</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              <span>Digital receipt with ESG impact certificate</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Fine Print */}
      <div className="text-center space-y-2">
        <p className="text-xs text-muted-foreground">
          Price based on AI estimate. Final price confirmed by Pro on-site.
        </p>
        {!isPressureWashing && (
          <p className="text-xs text-muted-foreground">
            Estimated service time: 1-2 hours
          </p>
        )}
        <Button
          variant="link"
          size="sm"
          onClick={() => setShowReasoningDialog(!showReasoningDialog)}
          className="text-xs"
        >
          How is this calculated?
        </Button>

        {showReasoningDialog && (
          <Card className="mt-2">
            <CardContent className="p-4 text-left">
              <h4 className="font-medium mb-2 text-sm">AI Analysis Reasoning:</h4>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                {quote.reasoning}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Mobile Sticky CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t shadow-lg z-50">
        <Button onClick={onBook} size="lg" className="w-full">
          Book This Quote →
        </Button>
      </div>
    </div>
  );
}
