import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle } from "lucide-react";

interface ManualQuoteFormProps {
  serviceType: string;
  onComplete: (estimate: any) => void;
  className?: string;
  propertyData?: {
    bedrooms?: number | null;
    bathrooms?: number | null;
    livingArea?: number | null;
  };
}

// Simple item checklist for junk removal (simplified from quote.tsx)
const commonItems = [
  { id: "sofa", label: "Sofa/Couch", basePrice: 75 },
  { id: "mattress_queen", label: "Queen Mattress", basePrice: 60 },
  { id: "mattress_king", label: "King Mattress", basePrice: 75 },
  { id: "dresser", label: "Dresser", basePrice: 65 },
  { id: "dining_table", label: "Dining Table", basePrice: 75 },
  { id: "chairs", label: "Chairs (each)", basePrice: 20 },
  { id: "desk", label: "Desk", basePrice: 60 },
  { id: "refrigerator", label: "Refrigerator", basePrice: 85 },
  { id: "washer", label: "Washer", basePrice: 75 },
  { id: "dryer", label: "Dryer", basePrice: 75 },
  { id: "tv", label: "TV (large)", basePrice: 45 },
  { id: "boxes", label: "Boxes/Bags (5 items)", basePrice: 25 },
];

export function ManualQuoteForm({
  serviceType,
  onComplete,
  className,
  propertyData,
}: ManualQuoteFormProps) {
  const [selectedItems, setSelectedItems] = useState<
    Record<string, number>
  >({});
  const [sqft, setSqft] = useState<string>(propertyData?.livingArea?.toString() || "");
  const [stories, setStories] = useState<string>("1");
  const [hours, setHours] = useState<string>("2");
  const [crewSize, setCrewSize] = useState<string>("2");
  const [estimatedPrice, setEstimatedPrice] = useState<number>(0);
  const [bedrooms, setBedrooms] = useState<string>(propertyData?.bedrooms?.toString() || "2");
  const [bathrooms, setBathrooms] = useState<string>(propertyData?.bathrooms?.toString() || "2");

  const isJunkRemoval =
    serviceType === "material-recovery" || serviceType === "junk_removal";
  const isPressureWashing =
    serviceType === "surface-wash" || serviceType === "pressure_washing";
  const isGutterCleaning = serviceType === "gutter-flush";
  const isMovingLabor = serviceType === "staging-labor";
  const isHomeCleaning = serviceType === "home_cleaning" || serviceType === "polishup";

  useEffect(() => {
    calculatePrice();
  }, [selectedItems, sqft, stories, hours, crewSize, serviceType, bedrooms, bathrooms]);

  const calculatePrice = () => {
    let price = 0;

    if (isJunkRemoval) {
      // Sum up selected items
      Object.entries(selectedItems).forEach(([itemId, quantity]) => {
        const item = commonItems.find((i) => i.id === itemId);
        if (item && quantity > 0) {
          price += item.basePrice * quantity;
        }
      });
      // Apply minimum ($99)
      price = Math.max(price, 99);
    } else if (isPressureWashing) {
      const sqftNum = parseInt(sqft) || 0;
      price = Math.max(sqftNum * 0.25, 120); // FreshWash minimum $120
    } else if (isGutterCleaning) {
      price = stories === "1" ? 150 : 225; // GutterFlush: single story $150, two story $225
    } else if (isMovingLabor) {
      const hoursNum = parseInt(hours) || 2;
      const crewNum = parseInt(crewSize) || 2;
      price = hoursNum * crewNum * 65; // LiftCrew: $65/hr per Pro
    } else if (isHomeCleaning) {
      // PolishUp pricing based on bedrooms/bathrooms (simplified matrix)
      const bed = parseInt(bedrooms) || 2;
      const bath = parseInt(bathrooms) || 2;
      const key = `${bed}-${Math.floor(bath)}`;
      const priceMatrix: Record<string, number> = {
        '1-1': 99, '2-1': 129, '2-2': 149, '3-2': 179,
        '3-3': 209, '4-2': 229, '4-3': 259, '5-3': 299, '5-4': 299,
      };
      price = priceMatrix[key] || 149; // Default to 2BR/2BA
    }

    setEstimatedPrice(Math.round(price));
  };

  const handleItemToggle = (itemId: string) => {
    setSelectedItems((prev) => {
      const current = prev[itemId] || 0;
      if (current === 0) {
        return { ...prev, [itemId]: 1 };
      } else {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
    });
  };

  const handleItemQuantityChange = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      const { [itemId]: _, ...rest } = selectedItems;
      setSelectedItems(rest);
    } else {
      setSelectedItems((prev) => ({ ...prev, [itemId]: quantity }));
    }
  };

  const handleSubmit = () => {
    const estimate = {
      quoteMethod: "manual",
      serviceType,
      estimatedPrice,
      userInputs: {
        selectedItems: isJunkRemoval ? selectedItems : undefined,
        sqft: isPressureWashing ? parseInt(sqft) : undefined,
        stories: isGutterCleaning ? parseInt(stories) : undefined,
        hours: isMovingLabor ? parseInt(hours) : undefined,
        crewSize: isMovingLabor ? parseInt(crewSize) : undefined,
        bedrooms: isHomeCleaning ? parseInt(bedrooms) : undefined,
        bathrooms: isHomeCleaning ? parseInt(bathrooms) : undefined,
        livingArea: isHomeCleaning ? propertyData?.livingArea : undefined,
      },
      requiresHitlValidation: true,
    };
    onComplete(estimate);
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className={className}>
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Junk Removal - Item Checklist */}
          {isJunkRemoval && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-bold">
                  Select items to be removed
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose items and adjust quantities as needed
                </p>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {commonItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Checkbox
                        checked={!!selectedItems[item.id]}
                        onCheckedChange={() => handleItemToggle(item.id)}
                      />
                      <div className="flex-1">
                        <Label className="font-medium cursor-pointer">
                          {item.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(item.basePrice)} each
                        </p>
                      </div>
                    </div>

                    {selectedItems[item.id] > 0 && (
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleItemQuantityChange(
                              item.id,
                              selectedItems[item.id] - 1
                            )
                          }
                        >
                          -
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {selectedItems[item.id]}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleItemQuantityChange(
                              item.id,
                              selectedItems[item.id] + 1
                            )
                          }
                        >
                          +
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pressure Washing - Square Footage */}
          {isPressureWashing && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="sqft" className="text-base font-bold">
                  Approximate square footage
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the total area to be cleaned
                </p>
              </div>

              <Input
                id="sqft"
                type="number"
                placeholder="e.g., 850"
                value={sqft}
                onChange={(e) => setSqft(e.target.value)}
                min="0"
                step="50"
                className="text-lg"
              />

              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-900 dark:text-blue-100">
                  <strong>Tip:</strong> For driveways, multiply length × width.
                  For siding, measure perimeter × height. Don't worry about
                  exact measurements - our Pro will verify on-site.
                </p>
              </div>
            </div>
          )}

          {/* Gutter Cleaning - Stories */}
          {isGutterCleaning && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="stories" className="text-base font-bold">
                  How many stories?
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Select your home's height
                </p>
              </div>

              <Select value={stories} onValueChange={setStories}>
                <SelectTrigger className="text-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Story - $150</SelectItem>
                  <SelectItem value="2">2 Story - $225</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Moving Labor - Hours & Crew */}
          {isMovingLabor && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="hours" className="text-base font-bold">
                  Estimated hours needed
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  How long do you think the job will take?
                </p>
              </div>

              <Input
                id="hours"
                type="number"
                placeholder="2"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                min="1"
                max="8"
                step="0.5"
                className="text-lg"
              />

              <div>
                <Label htmlFor="crew-size" className="text-base font-bold">
                  Crew size
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  How many workers do you need?
                </p>
              </div>

              <Select value={crewSize} onValueChange={setCrewSize}>
                <SelectTrigger className="text-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 person - $40/hr</SelectItem>
                  <SelectItem value="2">2 people - $80/hr</SelectItem>
                  <SelectItem value="3">3 people - $120/hr</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Home Cleaning - Bedrooms & Bathrooms */}
          {isHomeCleaning && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="bedrooms" className="text-base font-bold">
                  How many bedrooms?
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Used to calculate cleaning time and price
                </p>
              </div>

              <Select value={bedrooms} onValueChange={setBedrooms}>
                <SelectTrigger className="text-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Bedroom</SelectItem>
                  <SelectItem value="2">2 Bedrooms</SelectItem>
                  <SelectItem value="3">3 Bedrooms</SelectItem>
                  <SelectItem value="4">4 Bedrooms</SelectItem>
                  <SelectItem value="5">5 Bedrooms</SelectItem>
                </SelectContent>
              </Select>

              <div>
                <Label htmlFor="bathrooms" className="text-base font-bold">
                  How many bathrooms?
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Full and half baths combined
                </p>
              </div>

              <Select value={bathrooms} onValueChange={setBathrooms}>
                <SelectTrigger className="text-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Bathroom</SelectItem>
                  <SelectItem value="2">2 Bathrooms</SelectItem>
                  <SelectItem value="3">3 Bathrooms</SelectItem>
                  <SelectItem value="4">4 Bathrooms</SelectItem>
                  <SelectItem value="5">5+ Bathrooms</SelectItem>
                </SelectContent>
              </Select>

              {propertyData?.livingArea && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-xs text-blue-900 dark:text-blue-100">
                    <strong>Note:</strong> We detected your home is approximately {propertyData.livingArea.toLocaleString()} sqft.
                    This will be used for a more accurate quote.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Price Display */}
          <div className="pt-6 border-t">
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                Preliminary Estimate
              </p>
              <p className="text-4xl font-black text-primary">
                {formatCurrency(estimatedPrice)}
              </p>
            </div>

            <div className="flex items-start gap-2 mt-4 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
              <p className="text-xs text-orange-900 dark:text-orange-100">
                <strong>Note:</strong> This is an estimate based on your inputs.
                Your verified Pro will confirm the final price during the
                on-site assessment.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={estimatedPrice === 0}
            className="w-full"
            size="lg"
          >
            Continue with This Estimate →
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
