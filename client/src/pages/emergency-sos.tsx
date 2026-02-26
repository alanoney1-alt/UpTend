/**
 * Emergency SOS Page. /emergency-sos
 * 
 * Quick-select emergency service with guaranteed 2-hour response.
 * Clean, reassuring design with red accents. "We've got this."
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { usePageTitle } from "@/hooks/use-page-title";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import {
  Droplets, Wind, Zap, TreePine, Wrench, HelpCircle,
  Loader2, Clock, ShieldCheck, Star, Phone, ArrowLeft,
  Snowflake,
} from "lucide-react";

const EMERGENCY_CATEGORIES = [
  { id: "burst_pipe", label: "Burst Pipe", icon: Droplets, basePrice: 185 },
  { id: "ac_failed", label: "AC Failed", icon: Snowflake, basePrice: 150 },
  { id: "tree_down", label: "Tree Down", icon: TreePine, basePrice: 275 },
  { id: "electrical_issue", label: "Electrical Issue", icon: Zap, basePrice: 165 },
  { id: "roof_leak", label: "Roof Leak", icon: Wind, basePrice: 225 },
  { id: "other", label: "Other", icon: HelpCircle, basePrice: 125 },
];

const EMERGENCY_FEE = 25;

type Step = "select" | "details" | "searching" | "result";

interface MatchedPro {
  name: string;
  companyName: string;
  rating: number;
  completedJobs: number;
  responseTime: string;
  phone?: string;
}

export default function EmergencySosPage() {
  usePageTitle("Emergency SOS | UpTend");
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [step, setStep] = useState<Step>("select");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [matchResult, setMatchResult] = useState<{
    pro: MatchedPro;
    basePrice: number;
    emergencyFee: number;
    totalPrice: number;
    estimatedResponse: string;
  } | null>(null);

  const selected = EMERGENCY_CATEGORIES.find(c => c.id === selectedCategory);

  const requestMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/emergency/request", {
        serviceCategory: selectedCategory,
        description,
        address,
        customerId: user?.id,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setMatchResult(data);
      setStep("result");
    },
    onError: () => {
      toast({
        title: "Something went wrong",
        description: "Please try again or call us at (407) 338-3342.",
        variant: "destructive",
      });
      setStep("details");
    },
  });

  const handleCategorySelect = (id: string) => {
    setSelectedCategory(id);
    setStep("details");
  };

  const handleSubmit = () => {
    if (!address.trim()) {
      toast({ title: "Address required", description: "Please enter your address so we can find the nearest pro.", variant: "destructive" });
      return;
    }
    setStep("searching");
    requestMutation.mutate();
  };

  const handleBook = () => {
    toast({ title: "Emergency service booked!", description: "Your pro is on the way. You'll receive a confirmation text shortly." });
    navigate("/my-jobs");
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header />
      <main className="relative pt-24 pb-32 px-4 max-w-2xl mx-auto">
        <div className="absolute inset-0 h-[400px] -mx-[50vw] left-1/2 right-1/2 w-screen overflow-hidden -z-10">
          <img src="/images/site/hero-emergency.webp" alt="" className="w-full h-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-background/85" />
        </div>

        {/* Step: Select Emergency Type */}
        {step === "select" && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <ShieldCheck className="w-8 h-8 text-[#DC2626]" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                What's the emergency?
              </h1>
              <p className="text-slate-500 dark:text-slate-400">
                We'll match you with the nearest available pro. guaranteed response within 2 hours.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {EMERGENCY_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-[#DC2626] hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200 active:scale-[0.97]"
                  >
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-[#DC2626]" />
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white text-sm">{cat.label}</span>
                  </button>
                );
              })}
            </div>

            <p className="text-center text-sm text-slate-400">
              Not an emergency?{" "}
              <button onClick={() => navigate("/book")} className="text-primary underline hover:no-underline">
                Regular booking has no rush fee.
              </button>
            </p>
          </div>
        )}

        {/* Step: Enter Details */}
        {step === "details" && selected && (
          <div className="space-y-6">
            <button onClick={() => setStep("select")} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <selected.icon className="w-6 h-6 text-[#DC2626]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selected.label}</h2>
                <p className="text-sm text-slate-500">Tell us where and what's happening</p>
              </div>
            </div>

            <Card className="border-slate-200 dark:border-slate-700">
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Your address</label>
                  <Input
                    placeholder="123 Main St, Orlando, FL 32801"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">What's happening? <span className="text-slate-400 font-normal">(optional)</span></label>
                  <Textarea
                    placeholder="Describe the situation briefly..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600 dark:text-slate-400">Service estimate</span>
                <span className="text-slate-900 dark:text-white font-medium">${selected.basePrice}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600 dark:text-slate-400">Emergency rush fee</span>
                <span className="text-[#DC2626] font-medium">+${EMERGENCY_FEE}</span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between font-bold">
                <span className="text-slate-900 dark:text-white">Estimated total</span>
                <span className="text-slate-900 dark:text-white">${selected.basePrice + EMERGENCY_FEE}</span>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              className="w-full h-14 text-lg font-bold bg-[#DC2626] hover:bg-red-700 text-white rounded-xl"
            >
              Find Nearest Pro
            </Button>
          </div>
        )}

        {/* Step: Searching */}
        {step === "searching" && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-[#DC2626] animate-spin" />
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Finding nearest available pro...</h2>
              <p className="text-slate-500 dark:text-slate-400">Checking availability in your area. This usually takes a few seconds.</p>
            </div>
          </div>
        )}

        {/* Step: Result */}
        {step === "result" && matchResult && (
          <div className="space-y-6">
            <div className="text-center mb-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <ShieldCheck className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">We've got this.</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Here's your matched pro</p>
            </div>

            {/* Pro Card */}
            <Card className="border-2 border-green-200 dark:border-green-800/50 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xl font-bold text-slate-600 dark:text-slate-300">
                    {matchResult.pro.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{matchResult.pro.name}</h3>
                    <p className="text-sm text-slate-500">{matchResult.pro.companyName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{matchResult.pro.rating}</span>
                      <span className="text-sm text-slate-400">· {matchResult.pro.completedJobs} jobs</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 flex items-center gap-3 mb-4">
                  <Clock className="w-5 h-5 text-green-600 shrink-0" />
                  <div>
                    <p className="font-bold text-green-700 dark:text-green-400">Guaranteed response within 2 hours</p>
                    <p className="text-sm text-green-600 dark:text-green-500">Estimated: {matchResult.estimatedResponse}</p>
                  </div>
                </div>

                {/* Pricing breakdown */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Service price</span>
                    <span className="text-slate-900 dark:text-white">${matchResult.basePrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Emergency rush fee</span>
                    <span className="text-[#DC2626]">+${matchResult.emergencyFee}</span>
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between font-bold text-base">
                    <span className="text-slate-900 dark:text-white">Total</span>
                    <span className="text-slate-900 dark:text-white">${matchResult.totalPrice}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleBook}
              className="w-full h-14 text-lg font-bold bg-[#DC2626] hover:bg-red-700 text-white rounded-xl"
            >
              Book Emergency Service
            </Button>

            {matchResult.pro.phone && (
              <div className="text-center">
                <a href={`tel:${matchResult.pro.phone}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700">
                  <Phone className="w-4 h-4" /> Call pro directly
                </a>
              </div>
            )}

            <p className="text-center text-sm text-slate-400 pt-2">
              Not an emergency?{" "}
              <button onClick={() => navigate("/book")} className="text-primary underline hover:no-underline">
                Regular booking has no rush fee.
              </button>
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
