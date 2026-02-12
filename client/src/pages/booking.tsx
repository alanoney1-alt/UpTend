import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/landing/header";
import { useAuth } from "@/hooks/use-auth";
import { BookingChat } from "@/components/booking/booking-chat";
import { PaymentForm } from "@/components/payment-form";
import { apiRequest } from "@/lib/queryClient";
import {
  Trash2, Home, Droplets, Wrench, Users, Hammer,
  Sparkles, Leaf, ClipboardCheck, ArrowLeft, Shield, Lock,
  Loader2, CheckCircle, LogIn,
} from "lucide-react";

// ─── Service Definitions ─────────────────────────────────────────────────────

const services = [
  { id: "junk_removal", label: "Junk Removal", icon: Trash2, price: "$99", description: "Clear unwanted items and debris" },
  { id: "home_cleaning", label: "Home Cleaning", icon: Sparkles, price: "$99", description: "Professional room-by-room cleaning" },
  { id: "pressure_washing", label: "Pressure Washing", icon: Droplets, price: "$120", description: "Driveways, patios, siding" },
  { id: "gutter_cleaning", label: "Gutter Cleaning", icon: Home, price: "$149", description: "Clean and flush gutters" },
  { id: "moving_labor", label: "Moving Labor", icon: Users, price: "$80/hr", description: "Loading, unloading, rearranging" },
  { id: "handyman", label: "Handyman", icon: Wrench, price: "$49/hr", description: "Repairs, assembly, installations" },
  { id: "light_demolition", label: "Light Demolition", icon: Hammer, price: "$199", description: "Cabinets, sheds, fencing, decks" },
  { id: "garage_cleanout", label: "Garage Cleanout", icon: Home, price: "$299", description: "Complete garage cleanout" },
  { id: "home_consultation", label: "AI Home Scan", icon: ClipboardCheck, price: "$99", description: "Full walkthrough + optional drone scan" },
  { id: "pool_cleaning", label: "Pool Cleaning", icon: Droplets, price: "$150/mo", description: "Weekly maintenance & chemicals" },
  { id: "landscaping", label: "Landscaping", icon: Leaf, price: "Competitive", description: "Professional lawn and garden care" },
  { id: "carpet_cleaning", label: "Carpet Cleaning", icon: Sparkles, price: "Call", description: "Deep carpet & upholstery cleaning" },
];

// ─── Step 1: Service Grid ────────────────────────────────────────────────────

function ServiceGrid({ onSelect }: { onSelect: (serviceId: string) => void }) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">What do you need help with?</h1>
        <p className="text-muted-foreground">Pick a service and Bud will walk you through the rest</p>
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

// ─── Step 2: Bud Chat ────────────────────────────────────────────────────────

function BookingChatStep({
  service,
  onBack,
  onConfirm,
}: {
  service: typeof services[0];
  onBack: () => void;
  onConfirm: (quoteData: any) => void;
}) {
  const [lockedQuote, setLockedQuote] = useState<any>(null);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Service header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <service.icon className="w-6 h-6 text-amber-500" />
        <div>
          <h2 className="font-semibold text-lg">{service.label}</h2>
          <p className="text-xs text-muted-foreground">Chat with Bud to get your quote</p>
        </div>
      </div>

      {/* Chat */}
      <BookingChat
        serviceType={service.id}
        serviceLabel={service.label}
        onQuoteLocked={(data) => setLockedQuote(data)}
        onBookAction={(data) => onConfirm(data)}
      />

      {/* Confirm button appears when quote is locked */}
      {lockedQuote && (
        <div className="mt-4">
          <Button
            size="lg"
            className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6"
            onClick={() => onConfirm(lockedQuote)}
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Confirm & Book — ${lockedQuote.price}
          </Button>
          <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5" />
            <span>Guaranteed Price Ceiling — you'll never pay more</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 3: Confirmation & Payment ──────────────────────────────────────────

function BookingConfirmation({
  service,
  quote,
  onBack,
}: {
  service: typeof services[0];
  quote: any;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);

  // If not logged in, redirect to login
  if (!user) {
    return (
      <div className="max-w-lg mx-auto text-center">
        <Card className="p-8">
          <LogIn className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Sign in to complete your booking</h2>
          <p className="text-muted-foreground mb-6 text-sm">
            Your quote for {service.label} at ${quote.price} is saved. Sign in or create an account to finish booking.
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
      // Parse address into components for the schema
      const addrParts = (quote.address || "").split(",").map((s: string) => s.trim());
      const street = addrParts[0] || "Address pending";
      const city = addrParts[1] || "Orlando";
      const stateZip = addrParts[2] || "FL 32801";
      const zipMatch = stateZip.match(/(\d{5})/);
      const zip = zipMatch ? zipMatch[1] : "32801";

      const res = await apiRequest("POST", "/api/service-requests", {
        serviceType: service.id,
        description: quote.description || `${service.label} service`,
        pickupAddress: street,
        pickupCity: city,
        pickupZip: zip,
        loadEstimate: "standard",
        scheduledFor: quote.date || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        priceEstimate: quote.price,
        estimatedPrice: quote.price,
        guaranteedCeiling: Math.ceil(quote.price * 1.15), // 15% ceiling
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
        <ArrowLeft className="w-4 h-4" /> Back to chat
      </button>

      <Card className="p-6 space-y-5">
        <h2 className="text-xl font-bold">Confirm Your Booking</h2>

        {/* Summary */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Service</span>
            <span className="font-medium">{service.label}</span>
          </div>
          {quote.address && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Address</span>
              <span className="font-medium">{quote.address}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Price</span>
            <span className="font-bold text-lg">${quote.price}</span>
          </div>

          {/* Guaranteed Price Ceiling */}
          <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/20 rounded-lg px-3 py-2 border border-green-200/40">
            <Shield className="w-4 h-4 text-green-600 shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-green-700 dark:text-green-400">Guaranteed Price Ceiling</span>
              <span className="text-green-600 dark:text-green-300"> — You'll never pay more than ${Math.ceil(quote.price * 1.15)}. If it costs less, you pay less.</span>
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
              amount={quote.price}
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

type Step = "select" | "chat" | "confirm";

export default function BookingPage() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const preselectedService = params.get("service");

  const [step, setStep] = useState<Step>(preselectedService ? "chat" : "select");
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(preselectedService);
  const [quoteData, setQuoteData] = useState<any>(null);

  const selectedService = services.find(s => s.id === selectedServiceId) || null;

  const handleSelectService = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setStep("chat");
  };

  const handleConfirm = (quote: any) => {
    setQuoteData(quote);
    setStep("confirm");
  };

  const handleBackToGrid = () => {
    setStep("select");
    setSelectedServiceId(null);
    setQuoteData(null);
  };

  const handleBackToChat = () => {
    setStep("chat");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 to-white dark:from-zinc-950 dark:to-zinc-900">
      <Header />
      <main className="container mx-auto px-4 py-8 md:py-12">
        {step === "select" && (
          <ServiceGrid onSelect={handleSelectService} />
        )}

        {step === "chat" && selectedService && (
          <BookingChatStep
            service={selectedService}
            onBack={handleBackToGrid}
            onConfirm={handleConfirm}
          />
        )}

        {step === "confirm" && selectedService && quoteData && (
          <BookingConfirmation
            service={selectedService}
            quote={quoteData}
            onBack={handleBackToChat}
          />
        )}
      </main>
    </div>
  );
}
