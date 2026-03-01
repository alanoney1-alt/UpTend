import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, Sofa, Tv, Bed, Package, Trash2, Home, Truck, CheckCircle, CreditCard } from "lucide-react";
import { Link } from "wouter";
import { loadSizePackages, STAIRS_FLAT_FEE, SERVICE_STARTING_PRICES } from "@/lib/bundle-pricing";

// Map shared load size packages to calculator format
const loadSizePricing = loadSizePackages.map(pkg => ({
  id: pkg.id,
  label: pkg.name,
  price: pkg.price,
  monthly: Math.round(pkg.price / 4),
  description: pkg.fits.split(",")[0],
}));

// Min/max prices from shared pricing constants
const MIN_JUNK_PRICE = SERVICE_STARTING_PRICES.junk_removal;
const MIN_MOVING_PRICE = SERVICE_STARTING_PRICES.furniture_moving;
const MAX_JUNK_PRICE = loadSizePackages[loadSizePackages.length - 1].price;

// Estimator item prices - these are rough estimates for the calculator only
// Actual pricing uses the itemCatalog in booking flow
const junkRemovalItems = [
  { id: "furniture", label: "Furniture", icon: Sofa, basePrice: 50 },
  { id: "garage", label: "Garage Cleanout", icon: Home, basePrice: SERVICE_STARTING_PRICES.garage_cleanout },
  { id: "mattress", label: "Mattress/Bed", icon: Bed, basePrice: 60 },
  { id: "electronics", label: "Electronics", icon: Tv, basePrice: 30 },
  { id: "debris", label: "Debris/Trash", icon: Trash2, basePrice: 40 },
  { id: "yard", label: "Yard Waste", icon: Package, basePrice: 35 },
];

const movingItems = [
  { id: "bedroom_furniture", label: "Bedroom Set", icon: Bed, basePrice: 100 },
  { id: "living_room", label: "Living Room", icon: Sofa, basePrice: 120 },
  { id: "dining_room", label: "Dining Room", icon: Home, basePrice: 80 },
  { id: "office", label: "Office/Desk", icon: Package, basePrice: 50 },
  { id: "large_appliances", label: "Large Items", icon: Package, basePrice: 75 },
  { id: "boxes", label: "Boxes/Misc", icon: Package, basePrice: 25 },
];

const extraOptions = [
  // stairs fee removed — no extra charge for stairs
  { id: "heavy_item", label: "Heavy item (>100 lbs)", price: 35, description: "Piano, safe, pool table, etc." },
  { id: "refrigerant", label: "Refrigerant disposal", price: 25, description: "AC units, refrigerators with freon" },
  { id: "mattress_disposal", label: "Mattress disposal fee", price: 15, description: "Required for mattress disposal" },
  { id: "tv_disposal", label: "TV/Electronics disposal", price: 25, description: "CRT TVs, monitors" },
  { id: "tire_disposal", label: "Tire disposal (each)", price: 10, description: "Per tire" },
];

export function PricingCalculator() {
  const [step, setStep] = useState<1 | 2>(1);
  const [serviceType, setServiceType] = useState<"junk_removal" | "moving" | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [volume, setVolume] = useState([25]);

  const currentItems = serviceType === "junk_removal" ? junkRemovalItems : movingItems;

  const toggleItem = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const toggleExtra = (extraId: string) => {
    setSelectedExtras((prev) =>
      prev.includes(extraId) ? prev.filter((id) => id !== extraId) : [...prev, extraId]
    );
  };

  const calculatePrice = () => {
    const itemsBase = selectedItems.reduce((sum, itemId) => {
      const item = currentItems.find((i) => i.id === itemId);
      return sum + (item?.basePrice || 0);
    }, 0);
    const volumeMultiplier = 1 + (volume[0] / 100);
    const minPrice = Math.round(itemsBase * volumeMultiplier * 0.8);
    const maxPrice = Math.round(itemsBase * volumeMultiplier * 1.2);
    // Use shared pricing constants for min/max bounds
    const minBound = serviceType === "junk_removal" ? MIN_JUNK_PRICE : MIN_MOVING_PRICE;
    const maxBound = serviceType === "junk_removal" ? MAX_JUNK_PRICE : MAX_JUNK_PRICE;
    return { min: Math.max(minPrice, minBound), max: Math.min(Math.max(maxPrice, minBound + 20), maxBound) };
  };

  const calculateExtrasTotal = () => {
    return selectedExtras.reduce((sum, extraId) => {
      const extra = extraOptions.find((e) => e.id === extraId);
      return sum + (extra?.price || 0);
    }, 0);
  };

  const price = calculatePrice();
  const extrasTotal = calculateExtrasTotal();
  const finalMin = price.min + extrasTotal;
  const finalMax = price.max + extrasTotal;

  const handleGetExactQuote = () => {
    setStep(2);
  };

  const handleBackToStep1 = () => {
    setStep(1);
    setSelectedExtras([]);
  };

  const handleServiceTypeChange = (type: "junk_removal" | "moving") => {
    setServiceType(type);
    setSelectedItems([]);
  };

  return (
    <section id="pricing" className="py-16 md:py-24" data-testid="section-pricing">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">Transparent Pricing</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {step === 1 ? "Estimate Your Cost" : "Customize Your Quote"}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {step === 1 
              ? "Get an instant price estimate based on what you need. No surprises, no hidden fees."
              : "Select any additional options that apply to your job."
            }
          </p>
          {step === 1 && (
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              <Badge className="bg-primary/10 text-primary border-primary/30 text-sm px-3 py-1.5" data-testid="badge-minimum-price">
                $99 Minimum
              </Badge>
              <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30 text-sm px-3 py-1.5" data-testid="badge-mileage-rate">
                $1/mile for Moving
              </Badge>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-4xl mx-auto mb-8">
          {loadSizePricing.map((load) => (
            <Card
              key={load.id}
              className="p-4 text-center relative"
              data-testid={`card-load-${load.id}`}
            >
              <p className="text-sm font-medium text-muted-foreground mb-1">{load.label}</p>
              <p className="text-2xl md:text-3xl font-bold">${load.price}</p>
              <div className="mt-2 pt-2 border-t">
                <p className="text-sm text-muted-foreground">Or pay</p>
                <p className="text-lg font-semibold text-primary">${load.monthly}/month</p>
                <p className="text-xs text-muted-foreground">for 4 months*</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{load.description}</p>
            </Card>
          ))}
        </div>

        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="w-4 h-4 text-green-500" />
            <span>*0% APR with Affirm</span>
          </div>
        </div>

        <Card className="max-w-3xl mx-auto p-6 md:p-8">
          {step === 1 ? (
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">What service do you need?</h3>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button
                    onClick={() => handleServiceTypeChange("junk_removal")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border cursor-pointer transition-colors hover-elevate ${
                      serviceType === "junk_removal"
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                    data-testid="button-service-junk-removal"
                  >
                    <Trash2 className={`w-8 h-8 ${serviceType === "junk_removal" ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-sm font-medium">Junk Removal</span>
                  </button>
                  <button
                    onClick={() => handleServiceTypeChange("moving")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border cursor-pointer transition-colors hover-elevate ${
                      serviceType === "moving"
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                    data-testid="button-service-moving"
                  >
                    <Truck className={`w-8 h-8 ${serviceType === "moving" ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-sm font-medium">Moving</span>
                  </button>
                </div>

                {serviceType && (
                  <>
                    <h3 className="text-lg font-semibold mb-4">
                      {serviceType === "junk_removal" ? "What needs to go?" : "What are you moving?"}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {currentItems.map((item) => (
                        <label
                          key={item.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover-elevate ${
                            selectedItems.includes(item.id)
                              ? "border-primary bg-primary/5"
                              : "border-border"
                          }`}
                          data-testid={`checkbox-item-${item.id}`}
                        >
                          <Checkbox
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={() => toggleItem(item.id)}
                          />
                          <item.icon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{item.label}</span>
                        </label>
                      ))}
                    </div>

                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold">Load Size</h3>
                        <span className="text-sm text-muted-foreground">
                          {volume[0] < 33 ? "Small" : volume[0] < 66 ? "Medium" : "Large"}
                        </span>
                      </div>
                      <Slider
                        value={volume}
                        onValueChange={setVolume}
                        max={100}
                        step={1}
                        className="w-full"
                        data-testid="slider-volume"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>Few items</span>
                        <span>Full truck</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col">
                <div className="flex-1 flex flex-col items-center justify-center p-6 bg-muted/50 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-2">Estimated Price Range</p>
                  <div className="text-4xl md:text-5xl font-bold mb-2" data-testid="text-price-range">
                    ${price.min} - ${price.max}
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Final price confirmed after matching with a Pro
                  </p>
                </div>

                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Labor included</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Same-day service available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Verified, background-checked Pros</span>
                  </div>
                </div>

                <Button 
                  className="w-full mt-4" 
                  size="lg" 
                  onClick={handleGetExactQuote}
                  disabled={!serviceType}
                  data-testid="button-get-exact-quote"
                >
                  Get Exact Quote
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <button
                onClick={handleBackToStep1}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
                data-testid="button-back-to-step1"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to estimate
              </button>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Do any of these apply?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select any that apply to get an accurate quote.
                  </p>
                  <div className="space-y-3">
                    {extraOptions.map((extra) => (
                      <label
                        key={extra.id}
                        className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors hover-elevate ${
                          selectedExtras.includes(extra.id)
                            ? "border-primary bg-primary/5"
                            : "border-border"
                        }`}
                        data-testid={`checkbox-extra-${extra.id}`}
                      >
                        <Checkbox
                          checked={selectedExtras.includes(extra.id)}
                          onCheckedChange={() => toggleExtra(extra.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{extra.label}</span>
                            <span className="text-sm text-muted-foreground">+${extra.price}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{extra.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex-1 flex flex-col items-center justify-center p-6 bg-muted/50 rounded-xl">
                    <p className="text-sm text-muted-foreground mb-2">Your Estimated Quote</p>
                    <div className="text-4xl md:text-5xl font-bold mb-2" data-testid="text-final-price-range">
                      ${finalMin} - ${finalMax}
                    </div>
                    {extrasTotal > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Includes ${extrasTotal} in extras
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground text-center mt-2">
                      Final price confirmed after matching with a Pro
                    </p>
                  </div>

                  <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Quote Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Base estimate</span>
                        <span>${price.min} - ${price.max}</span>
                      </div>
                      {selectedExtras.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Extras ({selectedExtras.length})</span>
                          <span>+${extrasTotal}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t font-medium">
                        <span>Estimated total</span>
                        <span>${finalMin} - ${finalMax}</span>
                      </div>
                    </div>
                  </div>

                  <Link href={`/book?service=${serviceType === "moving" ? "furniture_moving" : "junk_removal"}`} className="mt-4">
                    <Button className="w-full" size="lg" data-testid="button-book-now">
                      Book Now
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
