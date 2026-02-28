/**
 * Smart Booking Page. /smart-book
 * 
 * The NEW primary booking flow:
 * 1. Select service
 * 2. Enter address + describe job
 * 3. George finds best match (loading animation)
 * 4. Show SmartMatchResult
 * 5. Book Now -> payment -> confirmation
 */

import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { usePageTitle } from "@/hooks/use-page-title";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { SmartMatchResult, AlternativeProCard } from "@/components/booking/smart-match-result";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck, ArrowRight, ArrowLeft, MapPin, FileText,
  Loader2, Wrench, Truck, Waves, Package, Home, Trees,
  Sparkles, Camera,
} from "lucide-react";

const SERVICE_OPTIONS = [
  { id: "junk_removal", label: "Junk Removal", icon: Truck },
  { id: "pressure_washing", label: "Pressure Washing", icon: Waves },
  { id: "gutter_cleaning", label: "Gutter Cleaning", icon: Home },
  { id: "home_cleaning", label: "Home Cleaning", icon: Sparkles },
  { id: "moving_labor", label: "Moving Labor", icon: Package },
  { id: "landscaping", label: "Landscaping", icon: Trees },
  { id: "carpet_cleaning", label: "Carpet Cleaning", icon: Home },
  { id: "handyman", label: "Handyman", icon: Wrench },
  { id: "pool_cleaning", label: "Pool Cleaning", icon: Waves },
  { id: "light_demolition", label: "Light Demolition", icon: Truck },
  { id: "garage_cleanout", label: "Garage Cleanout", icon: Home },
];

type Step = "service" | "details" | "matching" | "result" | "alternatives";

export default function SmartBookingPage() {
  usePageTitle("Smart Booking | UpTend");
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const preService = params.get("service");

  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>(preService ? "details" : "service");
  const [serviceType, setServiceType] = useState(preService || "");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [matchResult, setMatchResult] = useState<any>(null);
  const [alternatives, setAlternatives] = useState<any[]>([]);
  const [isBooking, setIsBooking] = useState(false);

  const handleSelectService = (id: string) => {
    setServiceType(id);
    setStep("details");
  };

  const handleFindMatch = async () => {
    if (!address.trim()) {
      toast({ title: "Address required", description: "Please enter your address.", variant: "destructive" });
      return;
    }
    setStep("matching");

    try {
      const res = await fetch("/api/smart-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceType, address, description, scope: {} }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Match failed");
      setMatchResult(data);
      setStep("result");
    } catch (err: any) {
      toast({ title: "Match failed", description: err.message, variant: "destructive" });
      setStep("details");
    }
  };

  const handleBook = async (matchId: string, proId?: string) => {
    if (!user) {
      navigate("/login?redirect=/smart-book");
      return;
    }
    setIsBooking(true);
    try {
      const res = await fetch(`/api/smart-match/${matchId}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proId, address, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");
      toast({ title: "Booking confirmed", description: `Your pro ${data.pro.firstName} has been notified.` });
      navigate("/booking-success");
    } catch (err: any) {
      toast({ title: "Booking failed", description: err.message, variant: "destructive" });
    } finally {
      setIsBooking(false);
    }
  };

  const handleViewAlternatives = async (matchId: string) => {
    try {
      const res = await fetch(`/api/smart-match/${matchId}/alternatives`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAlternatives(data.alternatives || []);
      setStep("alternatives");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 to-white dark:from-zinc-950 dark:to-zinc-900">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-16 md:pt-28">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            {step === "service" && "What do you need done?"}
            {step === "details" && "Tell us about the job"}
            {step === "matching" && "Finding your best match..."}
            {step === "result" && "Your best match"}
            {step === "alternatives" && "All available matches"}
          </h1>
          {step !== "matching" && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <ShieldCheck className="w-4 h-4 text-[#ea580c]" />
              <span className="text-sm text-slate-500">Every price is protected. Every pro is verified.</span>
            </div>
          )}
        </div>

        {/* Step: Service Selection */}
        {step === "service" && (
          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SERVICE_OPTIONS.map((svc) => (
                <button
                  key={svc.id}
                  onClick={() => handleSelectService(svc.id)}
                  className="flex flex-col items-center gap-2 p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#ea580c]/50 hover:shadow-md transition-all text-center"
                >
                  <svc.icon className="w-6 h-6 text-[#ea580c]" />
                  <span className="font-semibold text-sm text-slate-900 dark:text-white">{svc.label}</span>
                </button>
              ))}
            </div>
            <div className="text-center mt-6">
              <p className="text-sm text-slate-500">
                Or <a href="/book" className="text-[#ea580c] font-semibold hover:underline">snap a photo</a> and we'll scope the job for you.
              </p>
            </div>
          </div>
        )}

        {/* Step: Details */}
        {step === "details" && (
          <div className="max-w-lg mx-auto space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <MapPin className="w-4 h-4 inline mr-1" />
                Your address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, Orlando, FL 32832"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#ea580c]/40 focus:border-[#ea580c] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <FileText className="w-4 h-4 inline mr-1" />
                Describe the job (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What needs to be done? Any details help us find the right pro."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#ea580c]/40 focus:border-[#ea580c] outline-none resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep("service")}
                className="px-6"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button
                onClick={handleFindMatch}
                className="flex-1 bg-[#ea580c] hover:bg-[#dc4c08] text-white font-bold py-6 rounded-xl"
              >
                Find My Best Pro
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Matching Animation */}
        {step === "matching" && (
          <div className="max-w-md mx-auto text-center py-16">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full bg-[#ea580c]/10 animate-ping" />
              <div className="relative w-20 h-20 rounded-full bg-[#ea580c]/20 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#ea580c] animate-spin" />
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              Checking pro availability, verifying scope, and locking your price...
            </p>
          </div>
        )}

        {/* Step: Result */}
        {step === "result" && matchResult && (
          <SmartMatchResult
            pro={matchResult.recommendedPro}
            price={matchResult.price}
            serviceFee={matchResult.serviceFee}
            totalPrice={matchResult.totalPrice}
            matchId={matchResult.matchId}
            onBook={handleBook}
            onViewAlternatives={handleViewAlternatives}
            isBooking={isBooking}
          />
        )}

        {/* Step: Alternatives */}
        {step === "alternatives" && (
          <div className="max-w-md mx-auto space-y-3">
            <button
              onClick={() => setStep("result")}
              className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 flex items-center gap-1 mb-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to recommended
            </button>
            {alternatives.map((alt: any, i: number) => (
              <AlternativeProCard
                key={alt.proId || i}
                pro={alt}
                isTopMatch={i === 0}
                onSelect={(proId) => handleBook(matchResult.matchId, proId)}
              />
            ))}
            <p className="text-center text-xs text-slate-400 mt-4">
              All prices include 5% service fee and are Price Protected.
            </p>
          </div>
        )}

        {/* 5% fee transparency */}
        {(step === "result" || step === "alternatives") && (
          <div className="max-w-md mx-auto mt-8 text-center">
            <p className="text-xs text-slate-400">
              5% service fee covers Price Protection, background checks, insurance verification, and our satisfaction guarantee.
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
