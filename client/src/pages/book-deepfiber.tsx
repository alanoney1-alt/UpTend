import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Header } from "@/components/landing/header";
import {
  ArrowLeft,
  Home,
  Sofa,
  Droplets,
  Clock,
  CheckCircle,
  Info,
  Sparkles,
  Minus,
  Plus,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import {
  DEEPFIBER_PER_ROOM,
  DEEPFIBER_METHODS,
  DEEPFIBER_ADDONS,
  DEEPFIBER_RECURRING_DISCOUNTS,
} from "@shared/pricing/constants";

export default function BookDeepFiber() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"service" | "details" | "schedule" | "review">("service");
  const [serviceTab, setServiceTab] = useState<"rooms" | "upholstery">("rooms");

  // Room cleaning state
  const [roomCount, setRoomCount] = useState(3);
  const [hallways, setHallways] = useState(0);
  const [closets, setClosets] = useState(0);
  const [cleaningMethod, setCleaningMethod] = useState("df_hwe");

  // Upholstery state
  const [upholsteryItems, setUpholsteryItems] = useState<Record<string, number>>({});

  // Add-ons state
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [recurringPlan, setRecurringPlan] = useState<string | null>(null);

  // Details state
  const [address, setAddress] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [hasPets, setHasPets] = useState(false);
  const [hasStains, setHasStains] = useState(false);

  // Schedule state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  const getRoomPrice = () => {
    if (roomCount === 0) return 0;
    const roomTier = DEEPFIBER_PER_ROOM.find((t) => {
      if (roomCount === 1) return t.id === "df_1room";
      if (roomCount === 2) return t.id === "df_2room";
      if (roomCount === 3) return t.id === "df_3room";
      if (roomCount === 4) return t.id === "df_4room";
      if (roomCount === 5) return t.id === "df_5room";
      return t.id === "df_whole";
    });
    return roomTier?.basePrice || 0;
  };

  const calculateTotal = () => {
    let total = 0;

    // Rooms
    total += getRoomPrice();

    // Hallways
    const hallwayPrice = DEEPFIBER_PER_ROOM.find((t) => t.id === "df_hallway");
    if (hallwayPrice) {
      total += hallwayPrice.basePrice * hallways;
    }

    // Closets
    const closetPrice = DEEPFIBER_PER_ROOM.find((t) => t.id === "df_closet");
    if (closetPrice) {
      total += closetPrice.basePrice * closets;
    }

    // Upholstery
    Object.entries(upholsteryItems).forEach(([itemId, quantity]) => {
      const item = DEEPFIBER_ADDONS.find((a) => a.id === itemId);
      if (item && quantity > 0) {
        total += item.basePrice * quantity;
      }
    });

    // Add-ons
    selectedAddons.forEach((addonId) => {
      const addon = DEEPFIBER_ADDONS.find((a) => a.id === addonId);
      if (addon) {
        const isPerRoom = addon.unit === "per_room";
        total += addon.basePrice * (isPerRoom ? roomCount : 1);
      }
    });

    // Apply recurring discount
    if (recurringPlan) {
      const discount = DEEPFIBER_RECURRING_DISCOUNTS.find((d) => d.id === recurringPlan);
      if (discount) {
        total = Math.round(total * (1 - discount.discountPct));
      }
    }

    return total;
  };

  const handleAddonToggle = (addonId: string) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  const handleUpholsteryChange = (itemId: string, delta: number) => {
    setUpholsteryItems((prev) => {
      const current = prev[itemId] || 0;
      const newValue = Math.max(0, current + delta);
      if (newValue === 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: newValue };
    });
  };

  const createBookingMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("Must be logged in to book");
      }

      const method = DEEPFIBER_METHODS.find((m) => m.id === cleaningMethod);

      const requestBody: Record<string, unknown> = {
        customerId: user.id,
        serviceType: "carpet_cleaning",
        status: "matching",
        pickupAddress: address,
        pickupCity: "", // Could parse from address
        pickupZip: "", // Could parse from address
        description: `DeepFiber™ Carpet Cleaning - ${serviceTab === "rooms" ? `${roomCount} rooms` : "Upholstery"} - ${method?.label}`,
        accessNotes: specialInstructions || null,
        scheduledFor: selectedDate?.toISOString(),
        createdAt: new Date().toISOString(),
        metadata: {
          serviceTab,
          roomCount: serviceTab === "rooms" ? roomCount : undefined,
          hallways,
          closets,
          cleaningMethod,
          upholsteryItems: serviceTab === "upholstery" ? upholsteryItems : undefined,
          addons: selectedAddons,
          recurringPlan,
          hasPets,
          hasStains,
        },
      };

      const response = await apiRequest("POST", "/api/service-requests", requestBody);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
      toast({
        title: "Booking created!",
        description: "Your DeepFiber service has been scheduled",
      });
      setLocation(`/track/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Booking failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleContinue = () => {
    if (step === "service") {
      if (serviceTab === "rooms" && roomCount === 0) {
        toast({
          title: "Selection required",
          description: "Please select at least 1 room",
          variant: "destructive",
        });
        return;
      }
      setStep("details");
    } else if (step === "details") {
      if (!address) {
        toast({
          title: "Address required",
          description: "Please enter your service address",
          variant: "destructive",
        });
        return;
      }
      setStep("schedule");
    } else if (step === "schedule") {
      if (!selectedDate) {
        toast({
          title: "Date required",
          description: "Please select a service date",
          variant: "destructive",
        });
        return;
      }
      setStep("review");
    } else if (step === "review") {
      if (!user) {
        // Redirect to auth with return URL
        setLocation(`/auth?redirect=/book/deepfiber`);
        return;
      }
      createBookingMutation.mutate();
    }
  };

  const upholsteryAddons = DEEPFIBER_ADDONS.filter((a) =>
    ["df_sofa", "df_loveseat", "df_chair", "df_sectional", "df_mattress"].includes(a.id)
  );

  const treatmentAddons = DEEPFIBER_ADDONS.filter((a) =>
    ["df_scotchgard", "df_pet_odor", "df_spot", "df_deodorize"].includes(a.id)
  );

  const selectedMethod = DEEPFIBER_METHODS.find((m) => m.id === cleaningMethod);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (step === "service" ? setLocation("/book") : setStep("service"))}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-primary" />
              DeepFiber™ Carpet Cleaning
            </h1>
            <p className="text-muted-foreground">
              Professional carpet and upholstery cleaning
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8">
          {["service", "details", "schedule", "review"].map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              {i < 3 && <div className="h-0.5 flex-1 bg-muted mx-2" />}
            </div>
          ))}
        </div>

        {/* Step 1: Service Selection */}
        {step === "service" && (
          <Card>
            <CardContent className="p-6 space-y-6">
              <Tabs value={serviceTab} onValueChange={(v) => setServiceTab(v as typeof serviceTab)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="rooms">
                    <Home className="w-4 h-4 mr-2" />
                    Room Cleaning
                  </TabsTrigger>
                  <TabsTrigger value="upholstery">
                    <Sofa className="w-4 h-4 mr-2" />
                    Upholstery
                  </TabsTrigger>
                </TabsList>

                {/* Room Cleaning Tab */}
                <TabsContent value="rooms" className="space-y-6 mt-6">
                  {/* Room Count */}
                  <div>
                    <Label className="text-base font-semibold mb-3 block">
                      How many rooms? (up to 250 sq ft each)
                    </Label>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setRoomCount(Math.max(0, roomCount - 1))}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <div className="flex-1 text-center">
                        <p className="text-4xl font-bold">{roomCount}</p>
                        <p className="text-sm text-muted-foreground">rooms</p>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setRoomCount(roomCount + 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Additional Areas */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-sm font-semibold mb-2 block">
                        Hallways / Stairs ($29 each)
                      </Label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setHallways(Math.max(0, hallways - 1))}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-12 text-center font-semibold">{hallways}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setHallways(hallways + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold mb-2 block">
                        Walk-in Closets ($25 each)
                      </Label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setClosets(Math.max(0, closets - 1))}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-12 text-center font-semibold">{closets}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setClosets(closets + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Cleaning Method */}
                  <div>
                    <Label className="text-base font-semibold mb-3 block">
                      Cleaning Method
                    </Label>
                    <RadioGroup value={cleaningMethod} onValueChange={setCleaningMethod}>
                      {DEEPFIBER_METHODS.map((method) => (
                        <Card
                          key={method.id}
                          className={`cursor-pointer transition-all ${
                            cleaningMethod === method.id
                              ? "border-primary ring-2 ring-primary"
                              : "hover:border-primary/50"
                          }`}
                          onClick={() => setCleaningMethod(method.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <RadioGroupItem value={method.id} id={method.id} className="mt-1" />
                              <div className="flex-1">
                                <Label htmlFor={method.id} className="font-semibold cursor-pointer">
                                  {method.label}
                                  {method.isDefault && (
                                    <Badge className="ml-2" variant="secondary">
                                      Default
                                    </Badge>
                                  )}
                                </Label>
                                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Dry: {method.dryTimeHrs} hrs
                                  </span>
                                  <span>
                                    {formatPrice(method.centsPerRoom)}-
                                    {formatPrice(method.maxCentsPerRoom)}/room
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Treatment Add-ons */}
                  <div>
                    <Label className="text-base font-semibold mb-3 block">
                      Treatment Add-Ons (Optional)
                    </Label>
                    <div className="space-y-2">
                      {treatmentAddons.map((addon) => (
                        <div
                          key={addon.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedAddons.includes(addon.id)}
                              onCheckedChange={() => handleAddonToggle(addon.id)}
                            />
                            <div>
                              <p className="font-medium">{addon.label}</p>
                              <p className="text-sm text-muted-foreground">
                                {addon.description}
                              </p>
                            </div>
                          </div>
                          <p className="font-semibold">
                            {formatPrice(addon.basePrice)}
                            {addon.unit === "per_room" && "/room"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recurring Plan */}
                  <div>
                    <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                      Save with Recurring Plan
                      <Badge variant="secondary">Optional</Badge>
                    </Label>
                    <RadioGroup value={recurringPlan || "none"} onValueChange={(v) => setRecurringPlan(v === "none" ? null : v)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="none" id="none" />
                        <Label htmlFor="none">One-time service</Label>
                      </div>
                      {DEEPFIBER_RECURRING_DISCOUNTS.map((plan) => (
                        <div key={plan.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value={plan.id} id={plan.id} />
                            <Label htmlFor={plan.id}>{plan.label}</Label>
                          </div>
                          <Badge>Save {Math.round(plan.discountPct * 100)}%</Badge>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </TabsContent>

                {/* Upholstery Tab */}
                <TabsContent value="upholstery" className="space-y-4 mt-6">
                  <p className="text-sm text-muted-foreground">
                    Add furniture cleaning to your service
                  </p>
                  {upholsteryAddons.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-semibold">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        <p className="text-lg font-bold text-primary mt-1">
                          {formatPrice(item.basePrice)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpholsteryChange(item.id, -1)}
                          disabled={!upholsteryItems[item.id]}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-12 text-center font-semibold">
                          {upholsteryItems[item.id] || 0}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpholsteryChange(item.id, 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>

              {/* Total and Continue */}
              <div className="flex items-center justify-between pt-6 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatPrice(calculateTotal())}
                    {recurringPlan && (
                      <span className="text-sm text-muted-foreground ml-2">
                        ({DEEPFIBER_RECURRING_DISCOUNTS.find((d) => d.id === recurringPlan)?.label})
                      </span>
                    )}
                  </p>
                  {selectedMethod && (
                    <p className="text-xs text-muted-foreground mt-1">
                      <Clock className="w-3 h-3 inline mr-1" />
                      Dry time: {selectedMethod.dryTimeHrs} hours
                    </p>
                  )}
                </div>
                <Button size="lg" onClick={handleContinue}>
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Details */}
        {step === "details" && (
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Service Details</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address">Property Address</Label>
                    <Input
                      id="address"
                      placeholder="123 Main St, Orlando, FL 32801"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox checked={hasPets} onCheckedChange={(c) => setHasPets(c === true)} />
                    <Label>I have pets</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={hasStains}
                      onCheckedChange={(c) => setHasStains(c === true)}
                    />
                    <Label>I have specific stains that need attention</Label>
                  </div>
                  <div>
                    <Label htmlFor="instructions">
                      Special Instructions or Stain Locations
                    </Label>
                    <Input
                      id="instructions"
                      placeholder="e.g., Red wine stain in living room, pet accident in bedroom"
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-6 border-t">
                <Button variant="outline" onClick={() => setStep("service")}>
                  Back
                </Button>
                <Button onClick={handleContinue}>Continue to Schedule</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Schedule */}
        {step === "schedule" && (
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Choose Date & Time</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select your preferred service date. We'll match you with an available Pro.
                </p>
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date() || date < new Date(new Date().setHours(0, 0, 0, 0))}
                    className="rounded-md border"
                  />
                </div>
                {selectedDate && (
                  <p className="text-center mt-4 text-sm">
                    Selected: <span className="font-semibold">{selectedDate.toLocaleDateString()}</span>
                  </p>
                )}
              </div>

              <div className="flex justify-between pt-6 border-t">
                <Button variant="outline" onClick={() => setStep("details")}>
                  Back
                </Button>
                <Button onClick={handleContinue}>Review Booking</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Review */}
        {step === "review" && (
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Review Your Booking</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-semibold mb-2">Service Total</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatPrice(calculateTotal())}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {roomCount} room{roomCount !== 1 && "s"}
                      {selectedMethod && ` • ${selectedMethod.label}`}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm font-semibold mb-1">Address</p>
                    <p className="text-muted-foreground">{address}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-6 border-t">
                <Button variant="outline" onClick={() => setStep("schedule")} disabled={createBookingMutation.isPending}>
                  Back
                </Button>
                <Button onClick={handleContinue} disabled={createBookingMutation.isPending}>
                  {createBookingMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Booking...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm Booking
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
