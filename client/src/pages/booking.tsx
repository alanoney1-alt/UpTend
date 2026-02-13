import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/landing/header";
import { useAuth } from "@/hooks/use-auth";
import { PaymentForm } from "@/components/payment-form";
import { apiRequest } from "@/lib/queryClient";
import {
  Trash2, Home, Droplets, Wrench, Users, Hammer,
  Sparkles, Leaf, ClipboardCheck, ArrowLeft, Shield, Lock,
  Loader2, CheckCircle, LogIn, MapPin, Calendar, Clock,
  FileText,
} from "lucide-react";

// ─── Service Definitions ─────────────────────────────────────────────────────

const services = [
  { id: "junk_removal", label: "Junk Removal", icon: Trash2, price: "$99", priceNum: 99, description: "Clear unwanted items and debris" },
  { id: "home_cleaning", label: "Home Cleaning", icon: Sparkles, price: "$99", priceNum: 99, description: "Professional room-by-room cleaning" },
  { id: "pressure_washing", label: "Pressure Washing", icon: Droplets, price: "$120", priceNum: 120, description: "Driveways, patios, siding" },
  { id: "gutter_cleaning", label: "Gutter Cleaning", icon: Home, price: "$129", priceNum: 129, description: "Clean and flush gutters" },
  { id: "moving_labor", label: "Moving Labor", icon: Users, price: "$80/hr", priceNum: 80, description: "Loading, unloading, rearranging" },
  { id: "handyman", label: "Handyman", icon: Wrench, price: "$65/hr", priceNum: 65, description: "Repairs, assembly, installations" },
  { id: "light_demolition", label: "Light Demolition", icon: Hammer, price: "$199", priceNum: 199, description: "Cabinets, sheds, fencing, decks" },
  { id: "garage_cleanout", label: "Garage Cleanout", icon: Home, price: "$299", priceNum: 299, description: "Complete garage cleanout" },
  { id: "home_consultation", label: "AI Home Scan", icon: ClipboardCheck, price: "$99", priceNum: 99, description: "Full walkthrough + optional drone scan" },
  { id: "pool_cleaning", label: "Pool Cleaning", icon: Droplets, price: "From $99/mo", priceNum: 99, description: "Weekly maintenance & chemicals" },
  { id: "landscaping", label: "Landscaping", icon: Leaf, price: "Competitive", priceNum: 99, description: "Professional lawn and garden care" },
  { id: "carpet_cleaning", label: "Carpet Cleaning", icon: Sparkles, price: "Call", priceNum: 149, description: "Deep carpet & upholstery cleaning" },
];

// ─── Step 1: Service Grid ────────────────────────────────────────────────────

function ServiceGrid({ onSelect }: { onSelect: (serviceId: string) => void }) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">What do you need help with?</h1>
        <p className="text-muted-foreground">Pick a service to get started</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {services.map(service => (
          <Card
            key={service.id}
            className="p-5 cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group"
            onClick={() => onSelect(service.id)}
          >
            <service.icon className="w-8 h-8 text-amber-500 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-sm mb-1">{service.label}</h3>
            <p className="text-xs text-muted-foreground mb-2">{service.description}</p>
            <Badge variant="outline" className="text-xs">{service.price}</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Step 2: Booking Details Form ────────────────────────────────────────────

function BookingDetailsStep({
  service,
  onBack,
  onContinue,
}: {
  service: typeof services[0];
  onBack: () => void;
  onContinue: (details: BookingDetails) => void;
}) {
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  // Default date to 3 days from now
  useEffect(() => {
    const d = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    setDate(d.toISOString().split("T")[0]);
  }, []);

  const canContinue = address.trim() && city.trim() && zip.trim() && date;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canContinue) return;
    onContinue({ address, city, zip, date, time, notes });
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Service header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <service.icon className="w-6 h-6 text-amber-500" />
        <div>
          <h2 className="font-semibold text-lg">{service.label}</h2>
          <p className="text-xs text-muted-foreground">Starting from {service.price}</p>
        </div>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Booking Details</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Address */}
          <div>
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
              <MapPin className="w-3.5 h-3.5" /> Street Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St"
              className="w-full h-10 px-3 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm focus:outline-none focus:border-amber-400/50 transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Orlando"
                className="w-full h-10 px-3 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm focus:outline-none focus:border-amber-400/50 transition-colors"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">ZIP Code</label>
              <input
                type="text"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder="32801"
                className="w-full h-10 px-3 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm focus:outline-none focus:border-amber-400/50 transition-colors"
                maxLength={5}
                required
              />
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
                <Calendar className="w-3.5 h-3.5" /> Preferred Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full h-10 px-3 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm focus:outline-none focus:border-amber-400/50 transition-colors"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
                <Clock className="w-3.5 h-3.5" /> Preferred Time
              </label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm focus:outline-none focus:border-amber-400/50 transition-colors"
              >
                <option value="">Flexible</option>
                <option value="morning">Morning (8am–12pm)</option>
                <option value="afternoon">Afternoon (12pm–4pm)</option>
                <option value="evening">Evening (4pm–7pm)</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
              <FileText className="w-3.5 h-3.5" /> Additional Details <span className="text-xs font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe what you need — size of job, access info, special requests…"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm focus:outline-none focus:border-amber-400/50 transition-colors resize-none"
            />
          </div>

          {/* Price & Continue */}
          <div className="pt-2">
            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/20 rounded-lg px-3 py-2 border border-green-200/40 mb-4">
              <Shield className="w-4 h-4 text-green-600 shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-green-700 dark:text-green-400">Guaranteed Price Ceiling</span>
                <span className="text-green-600 dark:text-green-300"> — You'll never pay more than quoted. If it costs less, you pay less.</span>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full bg-amber-500 hover:bg-amber-600 text-white text-lg py-6"
              disabled={!canContinue}
            >
              Continue to Confirmation
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface BookingDetails {
  address: string;
  city: string;
  zip: string;
  date: string;
  time: string;
  notes: string;
}

// ─── Step 3: Confirmation & Payment ──────────────────────────────────────────

function BookingConfirmation({
  service,
  details,
  onBack,
}: {
  service: typeof services[0];
  details: BookingDetails;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);

  const price = service.priceNum;
  const ceiling = Math.ceil(price * 1.15);

  const timeLabels: Record<string, string> = {
    morning: "Morning (8am–12pm)",
    afternoon: "Afternoon (12pm–4pm)",
    evening: "Evening (4pm–7pm)",
  };

  // If not logged in, redirect to login
  if (!user) {
    return (
      <div className="max-w-lg mx-auto text-center">
        <Card className="p-8">
          <LogIn className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Sign in to complete your booking</h2>
          <p className="text-muted-foreground mb-6 text-sm">
            Your {service.label} booking details are saved. Sign in or create an account to finish booking.
          </p>
          <Button
            className="w-full bg-amber-500 hover:bg-amber-600 text-white"
            onClick={() => navigate(`/customer-login?returnUrl=/book?service=${service.id}`)}
          >
            Sign In / Create Account
          </Button>
        </Card>
      </div>
    );
  }

  // Create the service request
  const handleCreateJob = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const scheduledFor = details.date
        ? new Date(details.date + "T10:00:00").toISOString()
        : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

      const res = await apiRequest("POST", "/api/service-requests", {
        serviceType: service.id,
        description: details.notes || `${service.label} service`,
        pickupAddress: details.address,
        pickupCity: details.city,
        pickupState: "FL",
        pickupZip: details.zip,
        loadEstimate: "standard",
        scheduledFor,
        scheduledDate: details.date,
        scheduledTime: details.time || "flexible",
        createdAt: new Date().toISOString(),
        priceEstimate: price,
        estimatedPrice: price,
        guaranteedCeiling: ceiling,
        status: "pending_payment",
      });
      const data = await res.json();
      setJobId(data.id?.toString());
    } catch (e: any) {
      setError(e.message || "Failed to create booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create job on mount
  useEffect(() => {
    if (!jobId && !isSubmitting && !error) {
      handleCreateJob();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (booked) {
    return (
      <div className="max-w-lg mx-auto text-center">
        <Card className="p-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">You're all set! 🎉</h2>
          <p className="text-muted-foreground mb-6">
            Your {service.label} booking is confirmed. We're matching you with the best pro in your area.
          </p>
          <Button onClick={() => navigate("/dashboard")} className="bg-amber-500 hover:bg-amber-600 text-white">
            Go to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to details
      </button>

      <Card className="p-6 space-y-5">
        <h2 className="text-xl font-bold">Confirm Your Booking</h2>

        {/* Summary */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Service</span>
            <span className="font-medium">{service.label}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Address</span>
            <span className="font-medium text-right">{details.address}, {details.city} FL {details.zip}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Date</span>
            <span className="font-medium">{new Date(details.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
          </div>
          {details.time && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Time</span>
              <span className="font-medium">{timeLabels[details.time] || "Flexible"}</span>
            </div>
          )}
          {details.notes && (
            <div className="text-sm">
              <span className="text-muted-foreground">Notes:</span>
              <p className="mt-1 text-xs bg-black/[0.03] dark:bg-white/[0.03] rounded-lg px-3 py-2">{details.notes}</p>
            </div>
          )}
          <div className="flex justify-between text-sm pt-2 border-t">
            <span className="text-muted-foreground">Price</span>
            <span className="font-bold text-lg">${price}</span>
          </div>

          {/* Guaranteed Price Ceiling */}
          <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/20 rounded-lg px-3 py-2 border border-green-200/40">
            <Shield className="w-4 h-4 text-green-600 shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-green-700 dark:text-green-400">Guaranteed Price Ceiling</span>
              <span className="text-green-600 dark:text-green-300"> — You'll never pay more than ${ceiling}. If it costs less, you pay less.</span>
            </div>
          </div>
        </div>

        {/* Payment */}
        {error && (
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {isSubmitting && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          </div>
        )}

        {jobId && (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="w-3.5 h-3.5" />
              <span>Secure payment powered by Stripe</span>
            </div>
            <PaymentForm
              amount={price}
              jobId={jobId}
              customerId={user.id.toString()}
              onSuccess={() => setBooked(true)}
              onError={(err) => setError(err)}
            />
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

type Step = "select" | "details" | "confirm";

export default function BookingPage() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const preselectedService = params.get("service");

  const [step, setStep] = useState<Step>(preselectedService ? "details" : "select");
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(preselectedService);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);

  const selectedService = services.find(s => s.id === selectedServiceId) || null;

  const handleSelectService = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setStep("details");
  };

  const handleContinue = (details: BookingDetails) => {
    setBookingDetails(details);
    setStep("confirm");
  };

  const handleBackToGrid = () => {
    setStep("select");
    setSelectedServiceId(null);
    setBookingDetails(null);
  };

  const handleBackToDetails = () => {
    setStep("details");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 to-white dark:from-zinc-950 dark:to-zinc-900">
      <Header />
      <main className="container mx-auto px-4 py-8 md:py-12">
        {step === "select" && (
          <ServiceGrid onSelect={handleSelectService} />
        )}

        {step === "details" && selectedService && (
          <BookingDetailsStep
            service={selectedService}
            onBack={handleBackToGrid}
            onContinue={handleContinue}
          />
        )}

        {step === "confirm" && selectedService && bookingDetails && (
          <BookingConfirmation
            service={selectedService}
            details={bookingDetails}
            onBack={handleBackToDetails}
          />
        )}
      </main>
    </div>
  );
}
