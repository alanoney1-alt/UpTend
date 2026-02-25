import { useState, useEffect } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Header } from "@/components/landing/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, ArrowRight, Check, Building2, MapPin, Calendar,
  Users, ClipboardList, Truck, Waves, Droplets, Sparkles,
  Package, Home, Trees, Wrench, Search, Star, CheckCircle,
  Loader2, Plus, X,
} from "lucide-react";

// Service definitions matching the consumer flow
const SERVICES = [
  { id: "junk_removal", name: "Junk Removal", icon: Truck, price: "From $89", b2bDiscount: "10% bulk discount" },
  { id: "pressure_washing", name: "Pressure Washing", icon: Droplets, price: "From $108", b2bDiscount: "10% bulk discount" },
  { id: "gutter_cleaning", name: "Gutter Cleaning", icon: Waves, price: "From $135", b2bDiscount: "10% bulk discount" },
  { id: "moving_labor", name: "Moving Labor", icon: Package, price: "$58/hr per mover", b2bDiscount: "10% bulk discount" },
  { id: "handyman", name: "Handyman", icon: Wrench, price: "$68/hr", b2bDiscount: "10% bulk discount" },
  { id: "light_demolition", name: "Demolition", icon: Truck, price: "From $199", b2bDiscount: "10% bulk discount" },
  { id: "garage_cleanout", name: "Garage Cleanout", icon: Home, price: "From $135", b2bDiscount: "10% bulk discount" },
  { id: "home_cleaning", name: "Home Cleaning", icon: Sparkles, price: "From $89", b2bDiscount: "10% bulk discount" },
  { id: "pool_cleaning", name: "Pool Cleaning", icon: Waves, price: "From $89", b2bDiscount: "10% bulk discount" },
  { id: "landscaping", name: "Landscaping", icon: Trees, price: "From $44", b2bDiscount: "10% bulk discount" },
  { id: "carpet_cleaning", name: "Carpet Cleaning", icon: Home, price: "From $45/room", b2bDiscount: "10% bulk discount" },
  { id: "home_consultation", name: "Home DNA Scan", icon: Search, price: "Free", b2bDiscount: "10% bulk discount" },
];

const RECURRING_OPTIONS = [
  { value: "", label: "One-time" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 Weeks" },
  { value: "monthly", label: "Monthly" },
];

const TIME_SLOTS = [
  "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
];

type WizardStep = "property" | "service" | "schedule" | "pro" | "bulk" | "notes" | "review";
const STEPS: WizardStep[] = ["property", "service", "schedule", "pro", "bulk", "notes", "review"];
const STEP_LABELS: Record<WizardStep, string> = {
  property: "Property",
  service: "Service",
  schedule: "Schedule",
  pro: "Pro Preference",
  bulk: "Bulk Scheduling",
  notes: "Notes & Access",
  review: "Review & Confirm",
};

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  ownerName?: string;
  notes?: string;
}

interface PreferredPro {
  id: string;
  proId: string;
  proName?: string;
  serviceTypes?: string[];
  rating?: number;
  totalJobsTogether?: number;
}

export default function BusinessBookingPage() {
  usePageTitle("Book a Service | UpTend Business");
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<WizardStep>("property");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [customAddress, setCustomAddress] = useState({ address: "", city: "", state: "", zipCode: "" });
  const [useCustomAddress, setUseCustomAddress] = useState(false);
  const [selectedService, setSelectedService] = useState<string>("");
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [scheduledTime, setScheduledTime] = useState<string>("");
  const [recurringFrequency, setRecurringFrequency] = useState<string>("");
  const [recurringEndDate, setRecurringEndDate] = useState<string>("");
  const [preferredProId, setPreferredProId] = useState<string>("");
  const [isBulk, setIsBulk] = useState(false);
  const [bulkPropertyIds, setBulkPropertyIds] = useState<string[]>([]);
  const [accessNotes, setAccessNotes] = useState("");
  const [gateCode, setGateCode] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [unitNotes, setUnitNotes] = useState("");
  const [propertySearch, setPropertySearch] = useState("");

  // Fetch properties
  const { data: properties = [], isLoading: loadingProperties } = useQuery<Property[]>({
    queryKey: ["/api/business/properties"],
    enabled: !!user,
  });

  // Fetch preferred pros
  const { data: preferredPros = [] } = useQuery<PreferredPro[]>({
    queryKey: ["/api/business/preferred-pros"],
    enabled: !!user,
  });

  // Create booking mutation
  const createBooking = useMutation({
    mutationFn: async () => {
      const property = properties.find(p => p.id === selectedPropertyId);
      const addr = useCustomAddress ? customAddress : property;
      if (!addr) throw new Error("No address selected");

      const body = {
        propertyId: useCustomAddress ? null : selectedPropertyId,
        serviceType: selectedService,
        address: "address" in addr ? addr.address : "",
        city: addr.city,
        state: addr.state,
        zipCode: addr.zipCode,
        scheduledFor: scheduledDate,
        scheduledTime: scheduledTime || null,
        recurringFrequency: recurringFrequency || null,
        recurringEndDate: recurringEndDate || null,
        preferredProId: preferredProId || null,
        accessNotes: accessNotes || null,
        gateCode: gateCode || null,
        specialInstructions: specialInstructions || null,
        unitNotes: unitNotes || null,
      };

      const res = await apiRequest("POST", "/api/business/bookings", body);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Booking created!", description: "Your service has been scheduled." });
      queryClient.invalidateQueries({ queryKey: ["/api/business/bookings"] });
      navigate("/business/dashboard");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // Bulk booking mutation
  const createBulkBooking = useMutation({
    mutationFn: async () => {
      const body = {
        propertyIds: bulkPropertyIds,
        serviceType: selectedService,
        scheduledFor: scheduledDate,
        scheduledTime: scheduledTime || null,
        recurringFrequency: recurringFrequency || null,
        recurringEndDate: recurringEndDate || null,
        preferredProId: preferredProId || null,
        accessNotes: accessNotes || null,
        specialInstructions: specialInstructions || null,
      };

      const res = await apiRequest("POST", "/api/business/bookings/bulk", body);
      return res.json();
    },
    onSuccess: (data: { bookings: unknown[] }) => {
      toast({ title: "Bulk booking created!", description: `${data.bookings.length} bookings scheduled.` });
      queryClient.invalidateQueries({ queryKey: ["/api/business/bookings"] });
      navigate("/business/dashboard");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const currentStepIndex = STEPS.indexOf(step);
  const canGoNext = () => {
    switch (step) {
      case "property": return selectedPropertyId || (useCustomAddress && customAddress.address && customAddress.city && customAddress.state && customAddress.zipCode);
      case "service": return !!selectedService;
      case "schedule": return !!scheduledDate;
      case "pro": return true;
      case "bulk": return true;
      case "notes": return true;
      case "review": return true;
      default: return false;
    }
  };

  const goNext = () => {
    const idx = currentStepIndex;
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };

  const goPrev = () => {
    const idx = currentStepIndex;
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  const handleSubmit = () => {
    if (isBulk && bulkPropertyIds.length > 0) {
      createBulkBooking.mutate();
    } else {
      createBooking.mutate();
    }
  };

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);
  const selectedServiceObj = SERVICES.find(s => s.id === selectedService);
  const selectedPro = preferredPros.find(p => p.proId === preferredProId);
  const filteredProperties = properties.filter(p =>
    !propertySearch || p.address.toLowerCase().includes(propertySearch.toLowerCase()) ||
    p.city.toLowerCase().includes(propertySearch.toLowerCase()) ||
    (p.ownerName || "").toLowerCase().includes(propertySearch.toLowerCase())
  );

  const isSubmitting = createBooking.isPending || createBulkBooking.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 to-white dark:from-zinc-950 dark:to-zinc-900">
      <Header />
      <main className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        {/* Title */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate("/business/dashboard")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
            <Building2 className="w-8 h-8 text-amber-600" />
            Book a Service
          </h1>
          <p className="text-muted-foreground mt-1">Schedule services for your properties with B2B pricing</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <button
                onClick={() => i <= currentStepIndex && setStep(s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  s === step
                    ? "bg-amber-600 text-white"
                    : i < currentStepIndex
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 cursor-pointer"
                    : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600"
                }`}
              >
                {i < currentStepIndex ? <Check className="w-3.5 h-3.5" /> : <span>{i + 1}</span>}
                <span className="hidden sm:inline">{STEP_LABELS[s]}</span>
              </button>
              {i < STEPS.length - 1 && <div className="w-4 h-px bg-zinc-300 dark:bg-zinc-700 mx-1" />}
            </div>
          ))}
        </div>

        {/* Step content */}
        <Card className="border-amber-200/50 dark:border-amber-900/30">
          <CardContent className="p-6">

            {/* Step 1: Select Property */}
            {step === "property" && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-amber-600" /> Select Property
                </h2>

                <div className="mb-4">
                  <label className="flex items-center gap-2 mb-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCustomAddress}
                      onChange={(e) => { setUseCustomAddress(e.target.checked); setSelectedPropertyId(""); }}
                      className="rounded border-zinc-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-sm">Enter a new address instead</span>
                  </label>
                </div>

                {useCustomAddress ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Street Address</label>
                      <input
                        type="text"
                        value={customAddress.address}
                        onChange={e => setCustomAddress(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                        placeholder="123 Main St"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">City</label>
                      <input
                        type="text"
                        value={customAddress.city}
                        onChange={e => setCustomAddress(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                        placeholder="Orlando"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">State</label>
                      <input
                        type="text"
                        value={customAddress.state}
                        onChange={e => setCustomAddress(prev => ({ ...prev, state: e.target.value }))}
                        className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                        placeholder="FL"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">ZIP Code</label>
                      <input
                        type="text"
                        value={customAddress.zipCode}
                        onChange={e => setCustomAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                        className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                        placeholder="32801"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                      <input
                        type="text"
                        value={propertySearch}
                        onChange={e => setPropertySearch(e.target.value)}
                        placeholder="Search properties..."
                        className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-9 pr-3 py-2 text-sm"
                      />
                    </div>

                    {loadingProperties ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                      </div>
                    ) : filteredProperties.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No properties found. Try entering a new address above.</p>
                      </div>
                    ) : (
                      <div className="grid gap-2 max-h-80 overflow-y-auto">
                        {filteredProperties.map(prop => (
                          <button
                            key={prop.id}
                            onClick={() => setSelectedPropertyId(prop.id)}
                            className={`w-full text-left p-3 rounded-lg border transition-colors ${
                              selectedPropertyId === prop.id
                                ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                                : "border-zinc-200 dark:border-zinc-700 hover:border-amber-300"
                            }`}
                          >
                            <div className="font-medium text-sm">{prop.address}</div>
                            <div className="text-xs text-muted-foreground">{prop.city}, {prop.state} {prop.zipCode}</div>
                            {prop.ownerName && <div className="text-xs text-muted-foreground mt-0.5">Owner: {prop.ownerName}</div>}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Step 2: Select Service */}
            {step === "service" && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-amber-600" /> Select Service
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {SERVICES.map(svc => {
                    const Icon = svc.icon;
                    return (
                      <button
                        key={svc.id}
                        onClick={() => setSelectedService(svc.id)}
                        className={`p-4 rounded-lg border text-left transition-all ${
                          selectedService === svc.id
                            ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-500"
                            : "border-zinc-200 dark:border-zinc-700 hover:border-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-900/10"
                        }`}
                      >
                        <Icon className={`w-6 h-6 mb-2 ${selectedService === svc.id ? "text-amber-600" : "text-zinc-500"}`} />
                        <div className="font-medium text-sm">{svc.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{svc.price}</div>
                        <Badge variant="secondary" className="mt-2 text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                          {svc.b2bDiscount}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Scheduling */}
            {step === "schedule" && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-600" /> Schedule Service
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">Date *</label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={e => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Preferred Time</label>
                    <select
                      value={scheduledTime}
                      onChange={e => setScheduledTime(e.target.value)}
                      className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                    >
                      <option value="">Flexible</option>
                      {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Recurring Schedule</label>
                    <select
                      value={recurringFrequency}
                      onChange={e => setRecurringFrequency(e.target.value)}
                      className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                    >
                      {RECURRING_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  {recurringFrequency && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Recurring Until</label>
                      <input
                        type="date"
                        value={recurringEndDate}
                        onChange={e => setRecurringEndDate(e.target.value)}
                        min={scheduledDate || new Date().toISOString().split("T")[0]}
                        className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Pro Preference */}
            {step === "pro" && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-600" /> Pro Preference
                </h2>
                <div className="space-y-3">
                  <button
                    onClick={() => setPreferredProId("")}
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${
                      !preferredProId
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-amber-300"
                    }`}
                  >
                    <div className="font-medium">Any Available Pro</div>
                    <div className="text-sm text-muted-foreground">We'll match you with the best available pro</div>
                  </button>

                  {preferredPros.length > 0 && (
                    <div className="border-t pt-3 mt-3">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Your Preferred Pros</p>
                      {preferredPros.map(pro => (
                        <button
                          key={pro.id}
                          onClick={() => setPreferredProId(pro.proId)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors mb-2 ${
                            preferredProId === pro.proId
                              ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                              : "border-zinc-200 dark:border-zinc-700 hover:border-amber-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm">{pro.proName || "Pro"}</div>
                              {pro.totalJobsTogether ? (
                                <div className="text-xs text-muted-foreground">{pro.totalJobsTogether} jobs completed together</div>
                              ) : null}
                            </div>
                            {pro.rating && (
                              <div className="flex items-center gap-1 text-amber-600">
                                <Star className="w-3.5 h-3.5 fill-current" />
                                <span className="text-sm font-medium">{pro.rating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {preferredPros.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No preferred pros yet. After completing jobs, you can save your favorites here.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Bulk Scheduling */}
            {step === "bulk" && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-600" /> Bulk Scheduling
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Apply the same service across multiple properties at once.
                </p>

                <label className="flex items-center gap-2 mb-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBulk}
                    onChange={e => {
                      setIsBulk(e.target.checked);
                      if (!e.target.checked) setBulkPropertyIds([]);
                    }}
                    className="rounded border-zinc-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm font-medium">Enable bulk scheduling</span>
                </label>

                {isBulk && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {properties.map(prop => (
                      <label
                        key={prop.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          bulkPropertyIds.includes(prop.id)
                            ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                            : "border-zinc-200 dark:border-zinc-700 hover:border-amber-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={bulkPropertyIds.includes(prop.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setBulkPropertyIds(prev => [...prev, prop.id]);
                            } else {
                              setBulkPropertyIds(prev => prev.filter(id => id !== prop.id));
                            }
                          }}
                          className="rounded border-zinc-300 text-amber-600 focus:ring-amber-500"
                        />
                        <div>
                          <div className="text-sm font-medium">{prop.address}</div>
                          <div className="text-xs text-muted-foreground">{prop.city}, {prop.state} {prop.zipCode}</div>
                        </div>
                      </label>
                    ))}
                    {properties.length === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-4">No properties available for bulk scheduling.</p>
                    )}
                  </div>
                )}

                {isBulk && bulkPropertyIds.length > 0 && (
                  <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <span className="text-sm font-medium text-amber-800 dark:text-amber-400">
                      {bulkPropertyIds.length} properties selected
                    </span>
                  </div>
                )}

                {!isBulk && (
                  <div className="text-center py-6 text-muted-foreground">
                    <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Bulk scheduling is disabled. Booking for single property only.</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 6: Notes & Access */}
            {step === "notes" && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-amber-600" /> Notes & Access Info
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Gate Code</label>
                    <input
                      type="text"
                      value={gateCode}
                      onChange={e => setGateCode(e.target.value)}
                      className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                      placeholder="e.g., #1234"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Access Notes</label>
                    <textarea
                      value={accessNotes}
                      onChange={e => setAccessNotes(e.target.value)}
                      rows={2}
                      className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                      placeholder="How to access the property..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Special Instructions</label>
                    <textarea
                      value={specialInstructions}
                      onChange={e => setSpecialInstructions(e.target.value)}
                      rows={2}
                      className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                      placeholder="Any special requirements..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Unit-Specific Notes</label>
                    <textarea
                      value={unitNotes}
                      onChange={e => setUnitNotes(e.target.value)}
                      rows={2}
                      className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                      placeholder="Notes specific to this unit..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 7: Review & Confirm */}
            {step === "review" && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-amber-600" /> Review & Confirm
                </h2>

                <div className="space-y-4">
                  {/* Property */}
                  <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Property</div>
                    {isBulk && bulkPropertyIds.length > 0 ? (
                      <div>
                        <div className="font-medium">{bulkPropertyIds.length} properties (bulk)</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {bulkPropertyIds.map(id => properties.find(p => p.id === id)?.address).filter(Boolean).join(", ")}
                        </div>
                      </div>
                    ) : useCustomAddress ? (
                      <div className="font-medium">{customAddress.address}, {customAddress.city}, {customAddress.state} {customAddress.zipCode}</div>
                    ) : selectedProperty ? (
                      <div>
                        <div className="font-medium">{selectedProperty.address}</div>
                        <div className="text-sm text-muted-foreground">{selectedProperty.city}, {selectedProperty.state} {selectedProperty.zipCode}</div>
                      </div>
                    ) : null}
                  </div>

                  {/* Service */}
                  <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Service</div>
                    {selectedServiceObj && (
                      <div className="flex items-center gap-2">
                        <selectedServiceObj.icon className="w-5 h-5 text-amber-600" />
                        <span className="font-medium">{selectedServiceObj.name}</span>
                        <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                          {selectedServiceObj.b2bDiscount}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Schedule */}
                  <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Schedule</div>
                    <div className="font-medium">
                      {scheduledDate ? new Date(scheduledDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "—"}
                      {scheduledTime && ` at ${scheduledTime}`}
                    </div>
                    {recurringFrequency && (
                      <Badge variant="outline" className="mt-1 text-amber-700 border-amber-300">
                        Recurring: {RECURRING_OPTIONS.find(o => o.value === recurringFrequency)?.label}
                        {recurringEndDate && ` until ${new Date(recurringEndDate + "T12:00:00").toLocaleDateString()}`}
                      </Badge>
                    )}
                  </div>

                  {/* Pro */}
                  {preferredProId && selectedPro && (
                    <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Preferred Pro</div>
                      <div className="font-medium">{selectedPro.proName || "Selected Pro"}</div>
                    </div>
                  )}

                  {/* Notes */}
                  {(gateCode || accessNotes || specialInstructions || unitNotes) && (
                    <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Notes & Access</div>
                      {gateCode && <div className="text-sm"><span className="font-medium">Gate Code:</span> {gateCode}</div>}
                      {accessNotes && <div className="text-sm"><span className="font-medium">Access:</span> {accessNotes}</div>}
                      {specialInstructions && <div className="text-sm"><span className="font-medium">Instructions:</span> {specialInstructions}</div>}
                      {unitNotes && <div className="text-sm"><span className="font-medium">Unit Notes:</span> {unitNotes}</div>}
                    </div>
                  )}

                  {/* Billing */}
                  <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <div className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">Billing</div>
                    <div className="font-medium text-amber-800 dark:text-amber-300">Billed to Business Account</div>
                    <div className="text-sm text-amber-700 dark:text-amber-400">Invoice will be added to your business account</div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={goPrev}
                disabled={currentStepIndex === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>

              {step === "review" ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Confirming...</>
                  ) : (
                    <><Check className="w-4 h-4 mr-1" /> Confirm Booking</>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={goNext}
                  disabled={!canGoNext()}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Next <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
