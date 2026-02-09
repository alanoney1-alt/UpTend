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
  Scissors,
  TreePine,
  Droplets,
  Sprout,
  Leaf,
  Calendar as CalendarIcon,
  MapPin,
  CheckCircle,
  Info,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { FRESHCUT_ONE_TIME, FRESHCUT_RECURRING, FRESHCUT_ADDONS } from "@shared/pricing/constants";

export default function BookFreshCut() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"service" | "details" | "schedule" | "review">("service");
  const [serviceTab, setServiceTab] = useState<"onetime" | "recurring">("onetime");

  // One-time service state
  const [selectedOneTime, setSelectedOneTime] = useState<string | null>(null);
  const [lotSize, setLotSize] = useState<"quarter" | "half" | "full">("quarter");
  const [quantity, setQuantity] = useState(1);

  // Recurring service state
  const [recurringLotSize, setRecurringLotSize] = useState<"quarter" | "half" | "full">("quarter");
  const [frequency, setFrequency] = useState<"weekly" | "biweekly">("biweekly");
  const [tier, setTier] = useState<"standard" | "enhanced" | "premium">("standard");

  // Add-ons state
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  // Details state
  const [address, setAddress] = useState("");
  const [gateCode, setGateCode] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");

  // Schedule state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  const calculateTotal = () => {
    let total = 0;

    if (serviceTab === "onetime" && selectedOneTime) {
      const service = FRESHCUT_ONE_TIME.find((s) => s.id === selectedOneTime);
      if (service) {
        total += service.basePrice * quantity;
      }
    } else if (serviceTab === "recurring") {
      const planId = `fc_${tier}_${recurringLotSize}_${frequency}`;
      const plan = FRESHCUT_RECURRING.find((p) => p.id === planId);
      if (plan) {
        total += plan.basePrice;
      }
    }

    // Add-ons
    selectedAddons.forEach((addonId) => {
      const addon = FRESHCUT_ADDONS.find((a) => a.id === addonId);
      if (addon) {
        total += addon.basePrice;
      }
    });

    return total;
  };

  const handleAddonToggle = (addonId: string) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId)
        ? prev.filter((id) => id !== addonId)
        : [...prev, addonId]
    );
  };

  const createBookingMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("Must be logged in to book");
      }

      const requestBody: Record<string, unknown> = {
        customerId: user.id,
        serviceType: "landscaping",
        status: "matching",
        pickupAddress: address,
        pickupCity: "", // Could parse from address
        pickupZip: "", // Could parse from address
        description: `FreshCut™ Landscaping - ${serviceTab === "onetime" ? "One-time" : "Recurring"} service`,
        accessNotes: gateCode ? `Gate Code: ${gateCode}${specialInstructions ? ` | ${specialInstructions}` : ""}` : (specialInstructions || null),
        scheduledFor: selectedDate?.toISOString(),
        createdAt: new Date().toISOString(),
        metadata: {
          serviceTab,
          selectedOneTime,
          lotSize: serviceTab === "onetime" ? lotSize : recurringLotSize,
          quantity: serviceTab === "onetime" ? quantity : undefined,
          frequency: serviceTab === "recurring" ? frequency : undefined,
          tier: serviceTab === "recurring" ? tier : undefined,
          addons: selectedAddons,
        },
      };

      const response = await apiRequest("POST", "/api/service-requests", requestBody);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
      toast({
        title: "Booking created!",
        description: "Your FreshCut service has been scheduled",
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
      if (serviceTab === "onetime" && !selectedOneTime) {
        toast({
          title: "Selection required",
          description: "Please select a service to continue",
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
        setLocation(`/auth?redirect=/book/freshcut`);
        return;
      }
      createBookingMutation.mutate();
    }
  };

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
              <Leaf className="w-8 h-8 text-green-600" />
              FreshCut™ Landscaping
            </h1>
            <p className="text-muted-foreground">
              Professional lawn care and landscaping services
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
                  <TabsTrigger value="onetime">One-Time Service</TabsTrigger>
                  <TabsTrigger value="recurring">
                    Recurring Plan
                    <Badge className="ml-2" variant="secondary">
                      Save up to 25%
                    </Badge>
                  </TabsTrigger>
                </TabsList>

                {/* One-Time Services */}
                <TabsContent value="onetime" className="space-y-6 mt-6">
                  <div>
                    <h3 className="font-semibold mb-3">Select Service</h3>
                    <div className="grid gap-3">
                      {FRESHCUT_ONE_TIME.slice(0, 3).map((service) => (
                        <Card
                          key={service.id}
                          className={`cursor-pointer transition-all ${
                            selectedOneTime === service.id
                              ? "border-primary ring-2 ring-primary"
                              : "hover:border-primary/50"
                          }`}
                          onClick={() => setSelectedOneTime(service.id)}
                        >
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-semibold">{service.label}</p>
                              <p className="text-sm text-muted-foreground">
                                {service.description || "Professional service"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-primary">
                                {formatPrice(service.basePrice)}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {selectedOneTime?.includes("mow") && (
                    <div>
                      <Label>Lot Size</Label>
                      <RadioGroup value={lotSize} onValueChange={(v) => setLotSize(v as typeof lotSize)}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="quarter" id="quarter" />
                          <Label htmlFor="quarter">Up to 1/4 acre</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="half" id="half" />
                          <Label htmlFor="half">1/4 - 1/2 acre</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="full" id="full" />
                          <Label htmlFor="full">1/2 - 1 acre</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold mb-3">Add-Ons (Optional)</h3>
                    <div className="space-y-2">
                      {FRESHCUT_ADDONS.slice(0, 5).map((addon) => (
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
                          <p className="font-semibold">{formatPrice(addon.basePrice)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Recurring Plans */}
                <TabsContent value="recurring" className="space-y-6 mt-6">
                  <div>
                    <Label>Lot Size</Label>
                    <RadioGroup
                      value={recurringLotSize}
                      onValueChange={(v) => setRecurringLotSize(v as typeof recurringLotSize)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="quarter" id="r-quarter" />
                        <Label htmlFor="r-quarter">Up to 1/4 acre</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="half" id="r-half" />
                        <Label htmlFor="r-half">1/4 - 1/2 acre</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="full" id="r-full" />
                        <Label htmlFor="r-full">1/2 - 1 acre</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label>Frequency</Label>
                    <RadioGroup value={frequency} onValueChange={(v) => setFrequency(v as typeof frequency)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="weekly" id="weekly" />
                        <Label htmlFor="weekly">Weekly</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="biweekly" id="biweekly" />
                        <Label htmlFor="biweekly">Bi-weekly (Every 2 weeks)</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label>Service Tier</Label>
                    <div className="grid gap-3 mt-2">
                      {["standard", "enhanced", "premium"].map((t) => {
                        const planId = `fc_${t}_${recurringLotSize}_${frequency}`;
                        const plan = FRESHCUT_RECURRING.find((p) => p.id === planId);
                        return (
                          <Card
                            key={t}
                            className={`cursor-pointer transition-all ${
                              tier === t
                                ? "border-primary ring-2 ring-primary"
                                : "hover:border-primary/50"
                            }`}
                            onClick={() => setTier(t as typeof tier)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold capitalize">{t}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {plan?.description || `${t} service level`}
                                  </p>
                                </div>
                                {plan && (
                                  <p className="text-xl font-bold text-primary">
                                    {formatPrice(plan.basePrice)}/mo
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Total and Continue */}
              <div className="flex items-center justify-between pt-6 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {serviceTab === "recurring" ? "Monthly Total" : "Total"}
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {formatPrice(calculateTotal())}
                    {serviceTab === "recurring" && "/mo"}
                  </p>
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
                <h3 className="font-semibold mb-4">Service Address</h3>
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
                  <div>
                    <Label htmlFor="gate">Gate Code (Optional)</Label>
                    <Input
                      id="gate"
                      placeholder="Enter gate code if applicable"
                      value={gateCode}
                      onChange={(e) => setGateCode(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="instructions">Special Instructions</Label>
                    <Input
                      id="instructions"
                      placeholder="e.g., Dogs in backyard, unlock side gate"
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
                    <p className="text-sm font-semibold mb-2">Service</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatPrice(calculateTotal())}
                      {serviceTab === "recurring" && "/mo"}
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
