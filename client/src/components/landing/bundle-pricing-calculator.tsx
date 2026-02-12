import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowRight, 
  Minus, 
  Plus, 
  Package, 
  Percent, 
  Sparkles, 
  CheckCircle,
  TrendingUp,
  Truck,
  Camera,
  Upload,
  Loader2,
  Trash2,
  Gift,
  Clock,
  Zap,
  Star,
  Home,
  Calendar,
  CalendarDays
} from "lucide-react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  loadSizePackages,
  calculateBundlePrice,
  type PricingItem,
  type ServiceType,
  SERVICE_TYPES,
  getCategoriesForService,
  getItemsForService,
  TRUCK_UNLOADING_SIZES,
    CREW_SIZE_OPTIONS,
  HOURLY_RATE_PER_PRO,
  DEFAULT_HOURS,
  MAX_HOURS,
  calculateTruckUnloadingPrice,
  GARAGE_CLEANOUT_PACKAGES,
} from "@/lib/bundle-pricing";
import { Users, MapPin, Shield, Leaf } from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  calculateDistanceBetweenZips, 
  calculateMileageCharge, 
  isZipCodeSupported,
  MILEAGE_RATE 
} from "@/lib/distance-utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import heroImage from "@assets/generated_images/small_pickup_hauling_truck.png";

interface DebrisAnalysis {
  estimatedVolumeCubicFt: number;
  suggestedPrice: number;
  itemBreakdown: { item: string; estimatedWeight: string; estimatedVolume: string }[];
  reasoning: string;
}

export function BundlePricingCalculator() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedService, setSelectedService] = useState<ServiceType>("junk_removal");
  const [pricingMode, setPricingMode] = useState<"items" | "loads">("items");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedLoad, setSelectedLoad] = useState<string | null>(null);
  const [debrisPhotos, setDebrisPhotos] = useState<string[]>([]);
  const [debrisAnalysis, setDebrisAnalysis] = useState<DebrisAnalysis | null>(null);
  const [selectedTruckSize, setSelectedTruckSize] = useState<string | null>(null);
    const [crewSize, setCrewSize] = useState<number>(1);
  const [hours, setHours] = useState<number>(DEFAULT_HOURS);
  const [pickupAddress, setPickupAddress] = useState({ street: "", city: "", state: "", zip: "" });
  const [destinationAddress, setDestinationAddress] = useState({ street: "", city: "", state: "", zip: "" });
  const [selectedGaragePackage, setSelectedGaragePackage] = useState<string | null>(null);
  const [scheduleType, setScheduleType] = useState<"immediate" | "today" | "tomorrow" | "custom">("immediate");
  const [customDate, setCustomDate] = useState<string>("");
  
  const getScheduleLabel = () => {
    if (scheduleType === "immediate") return "ASAP";
    if (scheduleType === "today") return "Today (Any Time)";
    if (scheduleType === "tomorrow") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return `Tomorrow, ${tomorrow.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    if (scheduleType === "custom" && customDate) {
      const date = new Date(customDate + "T12:00:00");
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
    return "Select Time";
  };
  
  const getScheduleValue = () => {
    if (scheduleType === "immediate") return "immediate";
    if (scheduleType === "today") return "today";
    if (scheduleType === "tomorrow") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
    if (scheduleType === "custom" && customDate) return customDate;
    return "immediate";
  };
  
  const distanceMiles = pickupAddress.zip && destinationAddress.zip 
    ? calculateDistanceBetweenZips(pickupAddress.zip, destinationAddress.zip) 
    : null;
  const mileageCharge = distanceMiles !== null ? calculateMileageCharge(distanceMiles) : 0;

  const analyzePhotosMutation = useMutation({
    mutationFn: async (photoUrls: string[]) => {
      const response = await apiRequest("POST", "/api/photos/analyze", { photoUrls });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to analyze photos");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setDebrisAnalysis(data);
      toast({
        title: "Analysis Complete",
        description: `Estimated volume: ${data.estimatedVolumeCubicFt} cu ft`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error?.message || "Failed to analyze photos. Please try again.",
        variant: "destructive",
      });
    },
  });

  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPhotos: string[] = [];
    for (let i = 0; i < Math.min(files.length, 5 - debrisPhotos.length); i++) {
      const file = files[i];
      
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload JPEG, PNG, GIF, or WebP images only.",
          variant: "destructive",
        });
        continue;
      }
      
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds 10MB limit.`,
          variant: "destructive",
        });
        continue;
      }
      
      const reader = new FileReader();
      await new Promise<void>((resolve) => {
        reader.onload = () => {
          if (typeof reader.result === "string") {
            newPhotos.push(reader.result);
          }
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }

    if (newPhotos.length === 0) return;

    const updatedPhotos = [...debrisPhotos, ...newPhotos].slice(0, 5);
    setDebrisPhotos(updatedPhotos);
    
    if (updatedPhotos.length > 0) {
      analyzePhotosMutation.mutate(updatedPhotos);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = debrisPhotos.filter((_, i) => i !== index);
    setDebrisPhotos(newPhotos);
    if (newPhotos.length > 0) {
      analyzePhotosMutation.mutate(newPhotos);
    } else {
      setDebrisAnalysis(null);
    }
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setQuantities(prev => {
      const newQty = Math.max(0, (prev[itemId] || 0) + delta);
      if (newQty === 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: newQty };
    });
  };

  const handleServiceChange = (service: ServiceType) => {
    setSelectedService(service);
    setQuantities({});
    setDebrisPhotos([]);
    setDebrisAnalysis(null);
    setSelectedTruckSize(null);
    setCrewSize(1);
    setHours(DEFAULT_HOURS);
    setPickupAddress({ street: "", city: "", state: "", zip: "" });
    setDestinationAddress({ street: "", city: "", state: "", zip: "" });
    
    setTimeout(() => {
      const quoteSection = document.getElementById("instant-quote-section");
      if (quoteSection) {
        quoteSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
    setPricingMode(service === "junk_removal" ? "loads" : "items");
  };

  const currentServiceConfig = SERVICE_TYPES.find(s => s.id === selectedService)!;
  const currentCategories = getCategoriesForService(selectedService);
  const currentItems = getItemsForService(selectedService);

  const priceCalculation = calculateBundlePrice(currentItems, quantities);
  const debrisPrice = debrisAnalysis?.suggestedPrice || 0;
  
  const truckTotal = selectedTruckSize 
    ? calculateTruckUnloadingPrice(crewSize, hours, {})
    : 0;
  const movingMileageCharge = selectedService === "furniture_moving" ? mileageCharge : 0;
  const totalPrice = selectedService === "truck_unloading" 
    ? truckTotal 
    : Math.round(priceCalculation.total) + debrisPrice + movingMileageCharge;
  
  const hasItems = selectedService === "truck_unloading"
    ? selectedTruckSize !== null
    : priceCalculation.itemCount > 0 || debrisAnalysis !== null;

  const renderItemSelector = (items: PricingItem[]) => (
    <div className="space-y-2">
      {items.map(item => {
        const qty = quantities[item.id] || 0;
        const discountedPrice = priceCalculation.itemCount >= 3 
          ? Math.round(item.basePrice * (1 - priceCalculation.tier.discount))
          : item.basePrice;
        
        return (
          <div 
            key={item.id}
            className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
              qty > 0 ? "border-primary bg-primary/5" : "border-border"
            }`}
            data-testid={`item-row-${item.id}`}
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right mr-2">
                {priceCalculation.tier.discount > 0 && qty > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground line-through">${item.basePrice}</span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">${discountedPrice}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">${item.basePrice}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  onClick={() => updateQuantity(item.id, -1)}
                  disabled={qty === 0}
                  data-testid={`button-decrease-${item.id}`}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="w-6 text-center text-sm font-medium" data-testid={`quantity-${item.id}`}>{qty}</span>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  onClick={() => updateQuantity(item.id, 1)}
                  data-testid={`button-increase-${item.id}`}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderTruckUnloadingUI = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3">1. Select Truck Size</h3>
        <div className="grid grid-cols-2 gap-3">
          {TRUCK_UNLOADING_SIZES.map(truck => (
            <Card
              key={truck.id}
              className={`p-4 cursor-pointer transition-all hover-elevate ${
                selectedTruckSize === truck.id ? "border-primary ring-2 ring-primary/20" : ""
              }`}
              onClick={() => setSelectedTruckSize(truck.id)}
              data-testid={`truck-size-${truck.id}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-5 h-5 text-primary" />
                <span className="font-semibold">{truck.truckSize}</span>
              </div>
              <p className="text-sm text-muted-foreground">{truck.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {selectedTruckSize && (
        <>
          <div>
            <h3 className="font-semibold mb-3">2. How Many People Do You Need?</h3>
            <div className="grid grid-cols-3 gap-3">
              {CREW_SIZE_OPTIONS.map(option => (
                <Card
                  key={option.id}
                  className={`p-4 cursor-pointer transition-all hover-elevate text-center ${
                    crewSize === option.id ? "border-primary ring-2 ring-primary/20" : ""
                  }`}
                  onClick={() => setCrewSize(option.id)}
                  data-testid={`crew-size-${option.id}`}
                >
                  <Users className={`w-6 h-6 mx-auto mb-2 ${crewSize === option.id ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="font-semibold block">{option.label}</span>
                  <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                  <p className="text-sm font-medium text-primary mt-2">${HOURLY_RATE_PER_PRO * option.id}/hr</p>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">3. How Many Hours?</h3>
            <div className="flex items-center gap-4 bg-muted/50 rounded-lg p-4">
              <Button
                size="icon"
                variant="outline"
                onClick={() => setHours(prev => Math.max(1, prev - 1))}
                disabled={hours <= 1}
                data-testid="button-decrease-hours"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <div className="flex-1 text-center">
                <span className="text-3xl font-bold" data-testid="text-hours">{hours}</span>
                <span className="text-lg ml-2 text-muted-foreground">hour{hours > 1 ? "s" : ""}</span>
              </div>
              <Button
                size="icon"
                variant="outline"
                onClick={() => setHours(prev => Math.min(MAX_HOURS, prev + 1))}
                disabled={hours >= MAX_HOURS}
                data-testid="button-increase-hours"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              All jobs start with 1 hour minimum. Add more time as needed.
            </p>
            <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                <strong>Note:</strong> If your job goes over the selected hours, your Pro will add the extra time at the end and you'll be charged the difference automatically.
              </p>
            </div>
          </div>

          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-700 dark:text-green-400">One Flat Fee - No Surprises!</h3>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1.5 ml-8">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Stairs included - no extra charge</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Long carries included - no extra charge</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Heavy items included - no extra charge</span>
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );

  const renderQuoteSidebar = () => (
    <Card className="p-6 sticky top-4">
      <h3 className="font-semibold mb-4">Your Quote</h3>
      
      {hasItems ? (
        <>
          <div className="space-y-3 mb-4">
            {selectedService === "truck_unloading" ? (
              <>
                {selectedTruckSize && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {TRUCK_UNLOADING_SIZES.find(t => t.id === selectedTruckSize)?.truckSize}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {crewSize} {crewSize === 1 ? "person" : "people"} x {hours} hr{hours > 1 ? "s" : ""}
                      </span>
                      <span>${HOURLY_RATE_PER_PRO * crewSize * hours}</span>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                {priceCalculation.itemCount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Items ({priceCalculation.itemCount})</span>
                    <span>${priceCalculation.subtotal}</span>
                  </div>
                )}
                
                {priceCalculation.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <span className="flex items-center gap-1">
                      <Percent className="w-3 h-3" />
                      Volume Discount ({priceCalculation.tier.label})
                    </span>
                    <span>-${Math.round(priceCalculation.discount)}</span>
                  </div>
                )}

                {debrisAnalysis && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      Debris/Trash (AI estimate)
                    </span>
                    <span>${debrisPrice}</span>
                  </div>
                )}

                {selectedService === "furniture_moving" && distanceMiles !== null && distanceMiles > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Distance ({distanceMiles.toFixed(1)} mi × ${MILEAGE_RATE}/mi)
                    </span>
                    <span>${movingMileageCharge.toFixed(2)}</span>
                  </div>
                )}
              </>
            )}
            
            <div className="border-t pt-3">
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span data-testid="text-price-range-estimate">${Math.round(totalPrice * 0.85)} - ${Math.round(totalPrice * 1.15)}</span>
              </div>
              <p className="text-xs text-muted-foreground text-right mt-1">AI estimate - final price confirmed by your Pro</p>
            </div>
          </div>

          {selectedService !== "truck_unloading" && priceCalculation.discount > 0 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                You're saving ${Math.round(priceCalculation.discount)}!
              </div>
            </div>
          )}

          {selectedService !== "truck_unloading" && priceCalculation.nextTier && priceCalculation.itemsToNextTier > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-primary mt-0.5" />
                <div className="text-sm">
                  <span className="font-medium text-primary">Add {priceCalculation.itemsToNextTier} more item{priceCalculation.itemsToNextTier > 1 ? 's' : ''}</span>
                  <span className="text-muted-foreground"> for {priceCalculation.nextTier.label}!</span>
                  <div className="text-xs text-muted-foreground mt-1">
                    Save an extra ${Math.round(priceCalculation.potentialExtraSavings)}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Labor included</span>
            </div>
            {selectedService !== "truck_unloading" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>No disposal fees</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Same-day available</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4 text-primary" />
              <span>Payment held until job complete</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Leaf className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-700 dark:text-green-400">Green Verified disposal</span>
            </div>
          </div>
          
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg mb-4">
            <div className="flex items-start gap-2">
              <Leaf className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-400">Green Verified Guarantee</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Every job includes verified eco-friendly disposal. We recycle, donate, and responsibly dispose of your items. Get an environmental certificate after each job.
                </p>
              </div>
            </div>
          </div>

          <div className="p-2 bg-muted/50 rounded-lg mb-4">
            <p className="text-xs text-muted-foreground text-center">
              <strong>All payments processed by UpTend.</strong> Never pay Pros cash (tips only).
            </p>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">When do you need service?</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Button
                variant={scheduleType === "immediate" ? "default" : "outline"}
                size="sm"
                onClick={() => setScheduleType("immediate")}
                className="w-full"
                data-testid="button-schedule-immediate"
              >
                <Zap className="w-3 h-3 mr-1" />
                ASAP
              </Button>
              <Button
                variant={scheduleType === "today" ? "default" : "outline"}
                size="sm"
                onClick={() => setScheduleType("today")}
                className="w-full"
                data-testid="button-schedule-today"
              >
                <Clock className="w-3 h-3 mr-1" />
                Today
              </Button>
              <Button
                variant={scheduleType === "tomorrow" ? "default" : "outline"}
                size="sm"
                onClick={() => setScheduleType("tomorrow")}
                className="w-full"
                data-testid="button-schedule-tomorrow"
              >
                <Calendar className="w-3 h-3 mr-1" />
                Tomorrow
              </Button>
              <Button
                variant={scheduleType === "custom" ? "default" : "outline"}
                size="sm"
                onClick={() => setScheduleType("custom")}
                className="w-full"
                data-testid="button-schedule-custom"
              >
                <CalendarDays className="w-3 h-3 mr-1" />
                Pick Date
              </Button>
            </div>
            {scheduleType === "custom" && (
              <Input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full"
                data-testid="input-custom-date"
              />
            )}
            <div className="mt-2 p-2 bg-primary/5 rounded-lg">
              <p className="text-xs text-center">
                <span className="font-medium text-primary">{getScheduleLabel()}</span>
                {scheduleType !== "immediate" && (
                  <span className="text-muted-foreground block mt-0.5">
                    Pro will receive reminders before your job
                  </span>
                )}
              </p>
            </div>
          </div>

          <Link href={`/book?service=${selectedService}&schedule=${getScheduleValue()}`}>
            <Button className="w-full" size="lg" data-testid="button-book-now-items">
              Book Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">
            {selectedService === "truck_unloading" 
              ? "Select a truck size to see your quote"
              : "Select items to see your quote"
            }
          </p>
          {selectedService !== "truck_unloading" && (
            <p className="text-xs mt-2">Add 3+ items for automatic discounts!</p>
          )}
        </div>
      )}
    </Card>
  );

  return (
    <section id="pricing" className="relative" data-testid="section-bundle-pricing">
      <div className="relative min-h-[60vh] flex items-center py-16 md:py-24">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="Professional moving truck" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-background" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 lg:px-8 w-full">
          <div className="text-center text-white mb-8">
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <Badge className="bg-amber-500/90 text-white border-amber-400/50 backdrop-blur-sm text-sm px-3 py-1" data-testid="badge-available-now">
                <Zap className="w-3 h-3 mr-1" />
                Launching in Orlando Metro
              </Badge>
              <Badge className="bg-primary/90 text-white border-primary/50 backdrop-blur-sm text-sm px-3 py-1" data-testid="badge-priority-booking">
                <Clock className="w-3 h-3 mr-1" />
                7 AM - 10 PM, 7 Days
              </Badge>
              <Badge className="bg-green-600/90 text-white border-green-400/50 backdrop-blur-sm text-sm px-3 py-1" data-testid="badge-green-verified">
                <Leaf className="w-3 h-3 mr-1" />
                Green Verified
              </Badge>
            </div>
            
            <p className="text-xl md:text-2xl lg:text-3xl font-semibold text-white/90 mb-2">
              Junk Removal & Moving
            </p>
            
            <h1 className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black leading-none mb-6 tracking-tight">
              <span className="text-primary">60</span> Seconds
            </h1>
            
            <p className="text-base md:text-lg text-white/80 mb-6 max-w-lg mx-auto">
              Instant quotes. Live tracking. Green disposal.
              <br />
              Orlando's first AI-powered home services.
            </p>
            
            <p className="text-sm text-white/60 mb-8">
              Service Area: Orlando & Central Florida
            </p>
          </div>

          <Card className="max-w-4xl mx-auto p-6 md:p-8 bg-card/95 backdrop-blur-lg shadow-2xl">
            <h2 className="text-xl font-bold mb-2 text-center">What do you need help with?</h2>
            <p className="text-muted-foreground text-center mb-6">Select a service to build your custom quote</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {SERVICE_TYPES.map(service => (
                <button
                  key={service.id}
                  onClick={() => handleServiceChange(service.id)}
                  className={`p-4 rounded-lg border-2 transition-all hover-elevate text-left ${
                    selectedService === service.id 
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:border-primary/50"
                  }`}
                  data-testid={`service-type-${service.id}`}
                >
                  <service.icon className={`w-8 h-8 mb-2 ${selectedService === service.id ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="font-semibold text-sm">{service.label}</div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{service.description}</p>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div id="instant-quote-section" className="py-12 md:py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Badge variant="secondary">
                <currentServiceConfig.icon className="w-3 h-3 mr-1" />
                {currentServiceConfig.label}
              </Badge>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">
              Get an Instant Quote
            </h2>
            <h3 className="text-xl md:text-2xl font-semibold mb-4">
              {selectedService === "truck_unloading" ? "Select Your Truck Size" : 
               selectedService === "garage_cleanout" ? "Choose Your Package" : "Select Your Items"}
            </h3>
            {selectedService === "truck_unloading" && (
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Labor-only pricing: $160/hr for 2 Pros. We unload, you direct!
              </p>
            )}
            {selectedService === "garage_cleanout" && (
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Complete garage cleanout with disposal included. Pick your size below.
              </p>
            )}
            {selectedService !== "truck_unloading" && selectedService !== "garage_cleanout" && (
              <div className="flex flex-wrap justify-center gap-3 mt-4">
                <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30 text-sm px-3 py-1.5" data-testid="badge-no-disposal">
                  No Disposal Fees
                </Badge>
                <Badge className="bg-primary/10 text-primary border-primary/30 text-sm px-3 py-1.5" data-testid="badge-volume-savings">
                  Save 10-15% on 3+ Items
                </Badge>
                <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 text-sm px-3 py-1.5" data-testid="badge-competitor">
                  25-35% Cheaper than Competitors
                </Badge>
              </div>
            )}
          </div>

          {selectedService === "garage_cleanout" ? (
            <div className="max-w-4xl mx-auto">
              <Card className="p-6 md:p-8">
                <h4 className="text-lg font-bold mb-6 text-center">Package Pricing:</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {GARAGE_CLEANOUT_PACKAGES.map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => setSelectedGaragePackage(pkg.id)}
                      className={`p-5 rounded-xl border-2 transition-all text-left hover-elevate relative ${
                        selectedGaragePackage === pkg.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                      data-testid={`garage-package-${pkg.id}`}
                    >
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-xl font-bold">{pkg.name}</span>
                        <span className="text-2xl font-bold text-primary">${pkg.price}</span>
                      </div>
                      <p className="text-muted-foreground mb-2">{pkg.description}</p>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {pkg.itemsEstimate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {pkg.duration}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                
                {selectedGaragePackage && (
                  <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Selected Package</p>
                        <p className="text-lg font-bold">
                          {GARAGE_CLEANOUT_PACKAGES.find(p => p.id === selectedGaragePackage)?.name} - ${GARAGE_CLEANOUT_PACKAGES.find(p => p.id === selectedGaragePackage)?.price}
                        </p>
                      </div>
                      <Link href={`/book?service=garage_cleanout&package=${selectedGaragePackage}&price=${GARAGE_CLEANOUT_PACKAGES.find(p => p.id === selectedGaragePackage)?.price}`}>
                        <Button size="lg" data-testid="button-book-garage">
                          Book Now
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
                
                <div className="mt-6 pt-4 border-t border-border">
                  <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>All disposal fees included</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Same-day service available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Leaf className="w-4 h-4 text-green-500" />
                      <span>Eco-friendly disposal</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ) : selectedService === "truck_unloading" ? (
            <div className="grid lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="lg:col-span-2">
                <Card className="p-6">
                  {renderTruckUnloadingUI()}
                </Card>
              </div>
              <div className="lg:col-span-1">
                {renderQuoteSidebar()}
              </div>
            </div>
          ) : (
            <Tabs value={pricingMode} onValueChange={(v) => setPricingMode(v as typeof pricingMode)} className="max-w-5xl mx-auto">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="items" data-testid="tab-items">
                  <Package className="w-4 h-4 mr-2" />
                  Pick Items
                </TabsTrigger>
                <TabsTrigger value="loads" data-testid="tab-loads">
                  <Truck className="w-4 h-4 mr-2" />
                  Load Size
                </TabsTrigger>
              </TabsList>

              <TabsContent value="items">
                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    {selectedService === "furniture_moving" && (
                      <Card className="p-4">
                        <div className="flex items-center gap-2 mb-4">
                          <MapPin className="w-5 h-5 text-primary" />
                          <h3 className="font-semibold">Enter Your Locations</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Enter full addresses for pickup and delivery (${MILEAGE_RATE}/mile)
                        </p>
                        
                        {/* Pickup Address */}
                        <div className="mb-6">
                          <h4 className="text-sm font-semibold text-primary mb-3">Pickup Address</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium mb-1.5 block">Street Address</label>
                              <Input
                                type="text"
                                placeholder="123 Main St, Apt 4B"
                                value={pickupAddress.street}
                                onChange={(e) => setPickupAddress(prev => ({ ...prev, street: e.target.value }))}
                                data-testid="input-pickup-street"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="text-sm font-medium mb-1.5 block">City</label>
                                <Input
                                  type="text"
                                  placeholder="Orlando"
                                  value={pickupAddress.city}
                                  onChange={(e) => setPickupAddress(prev => ({ ...prev, city: e.target.value }))}
                                  data-testid="input-pickup-city"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium mb-1.5 block">State</label>
                                <Input
                                  type="text"
                                  placeholder="FL"
                                  value={pickupAddress.state}
                                  onChange={(e) => setPickupAddress(prev => ({ ...prev, state: e.target.value.toUpperCase().slice(0, 2) }))}
                                  maxLength={2}
                                  data-testid="input-pickup-state"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium mb-1.5 block">Zip Code</label>
                                <Input
                                  type="text"
                                  placeholder="32801"
                                  value={pickupAddress.zip}
                                  onChange={(e) => setPickupAddress(prev => ({ ...prev, zip: e.target.value.replace(/\D/g, '').slice(0, 5) }))}
                                  maxLength={5}
                                  className={pickupAddress.zip.length === 5 && !isZipCodeSupported(pickupAddress.zip) ? "border-red-500" : ""}
                                  data-testid="input-pickup-zip"
                                />
                              </div>
                            </div>
                            {pickupAddress.zip.length === 5 && !isZipCodeSupported(pickupAddress.zip) && (
                              <p className="text-xs text-red-500">Zip code not in service area</p>
                            )}
                          </div>
                        </div>
                        
                        {/* Destination Address */}
                        <div>
                          <h4 className="text-sm font-semibold text-primary mb-3">Destination Address</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium mb-1.5 block">Street Address</label>
                              <Input
                                type="text"
                                placeholder="456 Oak Ave, Unit 2"
                                value={destinationAddress.street}
                                onChange={(e) => setDestinationAddress(prev => ({ ...prev, street: e.target.value }))}
                                data-testid="input-destination-street"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="text-sm font-medium mb-1.5 block">City</label>
                                <Input
                                  type="text"
                                  placeholder="Orlando"
                                  value={destinationAddress.city}
                                  onChange={(e) => setDestinationAddress(prev => ({ ...prev, city: e.target.value }))}
                                  data-testid="input-destination-city"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium mb-1.5 block">State</label>
                                <Input
                                  type="text"
                                  placeholder="FL"
                                  value={destinationAddress.state}
                                  onChange={(e) => setDestinationAddress(prev => ({ ...prev, state: e.target.value.toUpperCase().slice(0, 2) }))}
                                  maxLength={2}
                                  data-testid="input-destination-state"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium mb-1.5 block">Zip Code</label>
                                <Input
                                  type="text"
                                  placeholder="32803"
                                  value={destinationAddress.zip}
                                  onChange={(e) => setDestinationAddress(prev => ({ ...prev, zip: e.target.value.replace(/\D/g, '').slice(0, 5) }))}
                                  maxLength={5}
                                  className={destinationAddress.zip.length === 5 && !isZipCodeSupported(destinationAddress.zip) ? "border-red-500" : ""}
                                  data-testid="input-destination-zip"
                                />
                              </div>
                            </div>
                            {destinationAddress.zip.length === 5 && !isZipCodeSupported(destinationAddress.zip) && (
                              <p className="text-xs text-red-500">Zip code not in service area</p>
                            )}
                          </div>
                        </div>
                        
                        {distanceMiles !== null && distanceMiles > 0 && (
                          <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Estimated Distance</span>
                              <span className="font-semibold">{distanceMiles.toFixed(1)} miles</span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-sm text-muted-foreground">Mileage Charge</span>
                              <span className="text-sm font-medium text-primary">+${movingMileageCharge.toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                      </Card>
                    )}
                    <Card className="p-4">
                      <Accordion type="single" collapsible className="w-full">
                        {currentCategories.map(category => (
                          <AccordionItem key={category.id} value={category.id}>
                            <AccordionTrigger className="text-sm font-semibold" data-testid={`accordion-${category.id}`}>
                              <div className="flex items-center gap-2">
                                {category.id === "debris" && <Camera className="w-4 h-4 text-primary" />}
                                {category.label}
                                {category.id === "debris" && debrisPhotos.length > 0 && (
                                  <Badge variant="secondary" className="ml-2">
                                    {debrisPhotos.length} photo{debrisPhotos.length > 1 ? "s" : ""}
                                  </Badge>
                                )}
                                {category.id !== "debris" && Object.keys(quantities).some(id => category.items.some(item => item.id === id)) && (
                                  <Badge variant="secondary" className="ml-2">
                                    {category.items.reduce((sum, item) => sum + (quantities[item.id] || 0), 0)}
                                  </Badge>
                                )}
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              {category.id === "debris" ? (
                                <div className="space-y-4">
                                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                      <Camera className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                                      <div>
                                        <p className="font-medium text-amber-800 dark:text-amber-300">Photo Required for Debris & Trash</p>
                                        <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                                          Upload photos of your debris/trash so our AI can estimate the weight and size for accurate pricing.
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={handlePhotoUpload}
                                    data-testid="input-debris-photos"
                                  />

                                  {debrisPhotos.length < 5 && (
                                    <Button
                                      variant="outline"
                                      className="w-full"
                                      onClick={() => fileInputRef.current?.click()}
                                      disabled={analyzePhotosMutation.isPending}
                                      data-testid="button-upload-debris-photos"
                                    >
                                      {analyzePhotosMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      ) : (
                                        <Upload className="w-4 h-4 mr-2" />
                                      )}
                                      {debrisPhotos.length === 0 ? "Upload Photos" : `Add More Photos (${debrisPhotos.length}/5)`}
                                    </Button>
                                  )}

                                  {debrisPhotos.length > 0 && (
                                    <div className="grid grid-cols-3 gap-2">
                                      {debrisPhotos.map((photo, index) => (
                                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                                          <img src={photo} alt={`Debris ${index + 1}`} className="w-full h-full object-cover" />
                                          <Button
                                            size="icon"
                                            variant="destructive"
                                            className="absolute top-1 right-1 h-6 w-6"
                                            onClick={() => removePhoto(index)}
                                            data-testid={`button-remove-photo-${index}`}
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {analyzePhotosMutation.isPending && (
                                    <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      <span className="text-sm">AI analyzing your photos...</span>
                                    </div>
                                  )}

                                  {debrisAnalysis && !analyzePhotosMutation.isPending && (
                                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                                      <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium mb-2">
                                        <CheckCircle className="w-4 h-4" />
                                        AI Estimate Ready
                                      </div>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Estimated Volume</span>
                                          <span className="font-medium">{debrisAnalysis.estimatedVolumeCubicFt} cu ft</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Estimated Price</span>
                                          <span className="font-medium text-green-600 dark:text-green-400">${Math.round(debrisAnalysis.suggestedPrice * 0.85)} - ${Math.round(debrisAnalysis.suggestedPrice * 1.15)}</span>
                                        </div>
                                        {debrisAnalysis.itemBreakdown.length > 0 && (
                                          <div className="pt-2 border-t mt-2">
                                            <p className="text-xs font-medium text-muted-foreground mb-1">Items Detected:</p>
                                            <ul className="text-xs space-y-1">
                                              {debrisAnalysis.itemBreakdown.slice(0, 5).map((item, i) => (
                                                <li key={i} className="flex justify-between">
                                                  <span>{item.item}</span>
                                                  <span className="text-muted-foreground">{item.estimatedWeight}</span>
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                renderItemSelector(category.items)
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </Card>
                  </div>

                  <div className="lg:col-span-1">
                    {renderQuoteSidebar()}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="loads">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {loadSizePackages.map(load => {
                    const savings = load.competitorPrice - load.price;
                    const savingsPercent = Math.round((savings / load.competitorPrice) * 100);
                    
                    return (
                      <Card 
                        key={load.id}
                        className={`p-6 cursor-pointer transition-all hover-elevate ${
                          selectedLoad === load.id ? "border-primary ring-2 ring-primary/20" : ""
                        }`}
                        onClick={() => setSelectedLoad(load.id)}
                        data-testid={`load-card-${load.id}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">{load.name}</h3>
                            <p className="text-sm text-muted-foreground">{load.description}</p>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold">${load.price}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{load.fits}</p>
                        </div>

                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
                          <p className="text-sm">
                            <span className="font-medium text-green-600 dark:text-green-400">vs 1-800-GOT-JUNK: ${load.competitorPrice}</span>
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400">You save ${savings} ({savingsPercent}%)</p>
                        </div>

                        <div className="border-t pt-4">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Example:</p>
                          <p className="text-sm">{load.example}</p>
                        </div>

                        {selectedLoad === load.id && (
                          <Link href={`/book?service=${selectedService}`}>
                            <Button className="w-full mt-4" data-testid={`button-book-load-${load.id}`}>
                              Book Now
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </Link>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </section>
  );
}
