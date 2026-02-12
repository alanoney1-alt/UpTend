/**
 * Subscription Plans Page — Browse available recurring service plans with pricing
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import {
  Sparkles,
  Droplets,
  Leaf,
  Home,
  Scissors,
  Waves,
  Check,
  Calendar,
  Clock,
  ArrowRight,
  Loader2,
  Repeat,
  Star,
} from "lucide-react";

const SERVICE_ICONS: Record<string, any> = {
  home_cleaning: Sparkles,
  pool_cleaning: Waves,
  landscaping: Leaf,
  carpet_cleaning: Home,
  gutter_cleaning: Droplets,
  pressure_washing: Droplets,
};

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 Weeks",
  monthly: "Monthly",
};

interface PlanCatalogItem {
  serviceType: string;
  label: string;
  description: string;
  pricing: { weekly: number; biweekly: number; monthly: number };
}

export default function SubscriptionPlans() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<PlanCatalogItem | null>(null);
  const [frequency, setFrequency] = useState<"weekly" | "biweekly" | "monthly">("biweekly");
  const [preferredDay, setPreferredDay] = useState("monday");
  const [preferredTime, setPreferredTime] = useState<"morning" | "afternoon" | "evening">("morning");
  const [address, setAddress] = useState({ line1: "", city: "", state: "", zip: "" });
  const [notes, setNotes] = useState("");

  const { data: catalogData, isLoading } = useQuery<{ success: boolean; plans: PlanCatalogItem[] }>({
    queryKey: ["/api/subscriptions/plans/catalog"],
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiRequest("POST", "/api/subscriptions/plans", payload);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Subscription created!", description: "Your recurring service plan is now active." });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/plans"] });
      setSelectedPlan(null);
      navigate("/subscriptions");
    },
    onError: (err: any) => {
      toast({ title: "Failed to create subscription", description: err.message, variant: "destructive" });
    },
  });

  const handleSubscribe = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!selectedPlan) return;
    createMutation.mutate({
      serviceType: selectedPlan.serviceType,
      frequency,
      preferredDay,
      preferredTime,
      addressLine1: address.line1,
      city: address.city,
      state: address.state,
      zip: address.zip,
      notes: notes || undefined,
    });
  };

  const plans = catalogData?.plans || [];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-[#F47C20]/10 text-[#F47C20] rounded-full px-3 py-1 text-sm font-medium mb-3">
            <Repeat className="w-4 h-4" /> Recurring Plans
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Service Plans & Subscriptions
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Save time and money with recurring service plans. Set it and forget it — we'll handle the scheduling.
          </p>
        </div>

        {!selectedPlan ? (
          <>
            {/* Frequency selector */}
            <div className="flex justify-center gap-2 mb-8">
              {(["weekly", "biweekly", "monthly"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFrequency(f)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    frequency === f
                      ? "bg-[#F47C20] text-white"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {FREQUENCY_LABELS[f]}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-[#F47C20]" />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => {
                  const Icon = SERVICE_ICONS[plan.serviceType] || Home;
                  const price = plan.pricing[frequency];
                  return (
                    <Card
                      key={plan.serviceType}
                      className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-[#F47C20]/50"
                      onClick={() => setSelectedPlan(plan)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-[#F47C20]/10 flex items-center justify-center">
                            <Icon className="w-6 h-6 text-[#F47C20]" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{plan.label}</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          {plan.description}
                        </p>
                        <div className="flex items-baseline gap-1 mb-4">
                          <span className="text-3xl font-bold text-gray-900 dark:text-white">
                            ${price}
                          </span>
                          <span className="text-sm text-gray-500">
                            /{frequency === "weekly" ? "wk" : frequency === "biweekly" ? "2wk" : "mo"}
                          </span>
                        </div>
                        <ul className="space-y-2 mb-4">
                          <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Check className="w-4 h-4 text-green-500" /> Vetted & insured pros
                          </li>
                          <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Check className="w-4 h-4 text-green-500" /> Flexible scheduling
                          </li>
                          <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Check className="w-4 h-4 text-green-500" /> Cancel or pause anytime
                          </li>
                        </ul>
                        <Button className="w-full bg-[#F47C20] hover:bg-[#e06b10] text-white">
                          Subscribe <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* Subscription form */
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => setSelectedPlan(null)}
              className="text-sm text-gray-500 hover:text-[#F47C20] mb-4 inline-flex items-center gap-1"
            >
              ← Back to plans
            </button>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                {(() => {
                  const Icon = SERVICE_ICONS[selectedPlan.serviceType] || Home;
                  return (
                    <div className="w-10 h-10 rounded-xl bg-[#F47C20]/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#F47C20]" />
                    </div>
                  );
                })()}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedPlan.label}</h2>
                  <p className="text-sm text-gray-500">
                    ${selectedPlan.pricing[frequency]}/{frequency === "weekly" ? "wk" : frequency === "biweekly" ? "2wk" : "mo"}
                  </p>
                </div>
              </div>

              {/* Frequency */}
              <div className="mb-4">
                <Label className="text-sm font-medium mb-2 block">Frequency</Label>
                <div className="flex gap-2">
                  {(["weekly", "biweekly", "monthly"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFrequency(f)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        frequency === f
                          ? "bg-[#F47C20] text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {FREQUENCY_LABELS[f]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferred day */}
              <div className="mb-4">
                <Label className="text-sm font-medium mb-2 block">Preferred Day</Label>
                <select
                  value={preferredDay}
                  onChange={(e) => setPreferredDay(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                >
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d) => (
                    <option key={d} value={d.toLowerCase()}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Preferred time */}
              <div className="mb-4">
                <Label className="text-sm font-medium mb-2 block">Preferred Time</Label>
                <div className="flex gap-2">
                  {(["morning", "afternoon", "evening"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setPreferredTime(t)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                        preferredTime === t
                          ? "bg-[#F47C20] text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Address */}
              <div className="mb-4 space-y-3">
                <Label className="text-sm font-medium block">Service Address</Label>
                <Input
                  placeholder="Street address"
                  value={address.line1}
                  onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                />
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="City"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  />
                  <Input
                    placeholder="State"
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  />
                  <Input
                    placeholder="ZIP"
                    value={address.zip}
                    onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <Label className="text-sm font-medium mb-2 block">Notes (optional)</Label>
                <Textarea
                  placeholder="Gate code, pet info, special instructions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Price summary */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedPlan.label} — {FREQUENCY_LABELS[frequency]}
                  </span>
                  <span className="text-lg font-bold text-[#F47C20]">
                    ${selectedPlan.pricing[frequency]}
                  </span>
                </div>
              </div>

              <Button
                className="w-full bg-[#F47C20] hover:bg-[#e06b10] text-white h-12 text-base"
                onClick={handleSubscribe}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating...</>
                ) : (
                  <><Star className="w-5 h-5 mr-2" /> Start Subscription</>
                )}
              </Button>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
