import { usePageTitle } from "@/hooks/use-page-title";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import {
  AlertTriangle, Droplets, Flame, KeyRound, Wrench,
  Zap, Wind, Clock, CheckCircle2, Phone, ShieldCheck,
} from "lucide-react";

const EMERGENCY_TYPES = [
  {
    id: "water_damage",
    label: "Water Damage / Flooding",
    icon: Droplets,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10 border-blue-500/30",
    firstSteps: [
      "Locate your main water shutoff valve (usually near the water meter or where the main line enters your home)",
      "Turn the valve clockwise to shut off water supply",
      "Turn off electricity to affected areas at the breaker box if water is near outlets",
      "Move valuables to higher ground if possible",
    ],
  },
  {
    id: "broken_pipe",
    label: "Broken / Burst Pipe",
    icon: Wrench,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10 border-cyan-500/30",
    firstSteps: [
      "Shut off the main water valve immediately",
      "Open faucets to drain remaining water from pipes",
      "Turn off the water heater to prevent damage",
      "Place buckets under active leaks and mop standing water",
    ],
  },
  {
    id: "gas_leak",
    label: "Gas Leak",
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-500/10 border-red-500/30",
    firstSteps: [
      "DO NOT turn on/off any lights, appliances, or electronics",
      "Open all windows and doors immediately",
      "Leave the house and move at least 100 feet away",
      "Call 911 first, then call us from a safe distance",
    ],
  },
  {
    id: "fire_damage",
    label: "Fire Damage",
    icon: Flame,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10 border-orange-500/30",
    firstSteps: [
      "Ensure everyone is out of the home and call 911 if the fire is active",
      "Do not re-enter the structure until cleared by fire department",
      "Document damage with photos from a safe distance",
      "Do not turn on HVAC — it spreads soot and smoke damage",
    ],
  },
  {
    id: "electrical_emergency",
    label: "Electrical Emergency",
    icon: Zap,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10 border-amber-500/30",
    firstSteps: [
      "Turn off the main breaker at your electrical panel",
      "Do not touch any exposed wires or sparking outlets",
      "If someone is being shocked, do NOT touch them — cut power first",
      "Stay away from any standing water near electrical sources",
    ],
  },
  {
    id: "lockout",
    label: "Home Lockout",
    icon: KeyRound,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10 border-yellow-500/30",
    firstSteps: [
      "Check all other doors and windows (safely) for an unlocked entry",
      "Do not attempt to force or break locks — it causes expensive damage",
      "If you have a smart lock, check your phone app for remote unlock",
      "Stay in a safe, well-lit area while waiting for help",
    ],
  },
  {
    id: "storm_damage",
    label: "Storm / Hurricane Damage",
    icon: Wind,
    color: "text-gray-400",
    bgColor: "bg-gray-500/10 border-gray-500/30",
    firstSteps: [
      "Stay inside and away from windows until the storm passes",
      "Turn off main breaker if you see water intrusion near electrical",
      "Document all damage with photos and video for insurance",
      "Cover broken windows or roof openings with tarps if safely accessible",
    ],
  },
];

export default function EmergencyPage() {
  const { t } = useTranslation();
  usePageTitle("Emergency Services | UpTend");
  const { toast } = useToast();
  const [step, setStep] = useState<"select" | "details" | "searching" | "found">("select");
  const [selectedType, setSelectedType] = useState<string>("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState({ addressLine1: "", city: "", state: "", zipCode: "" });
  const [emergencyId, setEmergencyId] = useState<string | null>(null);
  const [proInfo, setProInfo] = useState<any>(null);
  const [eta, setEta] = useState<number | null>(null);

  useEffect(() => {
    if (!emergencyId) return;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws?jobId=emergency-${emergencyId}&role=customer`);
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "emergency_status" && data.status === "accepted") {
        setStep("found");
        setEta(data.etaMinutes);
      }
    };
    return () => socket.close();
  }, [emergencyId]);

  const { data: statusData } = useQuery({
    queryKey: ["/api/emergency/status", emergencyId],
    queryFn: async () => {
      const res = await fetch(`/api/emergency/status/${emergencyId}`);
      return res.json();
    },
    enabled: !!emergencyId && step === "searching",
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (statusData?.status === "accepted") {
      setStep("found");
      setEta(statusData.etaMinutes);
      setProInfo(statusData.proInfo);
    }
  }, [statusData]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/emergency/request", {
        emergencyType: selectedType,
        description,
        ...address,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setEmergencyId(data.id);
      setStep("searching");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit emergency request. Please call (407) 338-3342 directly.", variant: "destructive" });
    },
  });

  const selectedEmergency = EMERGENCY_TYPES.find((t) => t.id === selectedType);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />
      <main className="pt-24 pb-16 px-4 max-w-3xl mx-auto">

        {/* CALL NOW banner */}
        <div className="mb-8">
          <a
            href="tel:407-338-3342"
            className="block w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white text-center py-6 rounded-2xl shadow-2xl shadow-red-600/30 transition-all"
          >
            <Phone className="w-8 h-8 mx-auto mb-2" />
            <span className="text-3xl font-black block">{t("emergency.call_now")}</span>
            <span className="text-xl font-bold block">(407) 338-3342</span>
            <span className="text-sm opacity-80 block mt-1">{t("emergency.available_247")}</span>
          </a>
        </div>

        {/* Response time */}
        <div className="flex items-center justify-center gap-3 mb-8 bg-slate-800/60 rounded-xl py-4 px-6 border border-slate-700">
          <Clock className="w-6 h-6 text-green-400" />
          <div>
            <p className="font-bold text-green-400 text-lg">{t("emergency.avg_response")}</p>
            <p className="text-slate-400 text-sm">{t("emergency.closest_pro")}</p>
          </div>
        </div>

        {/* 911 Warning */}
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-8 text-center">
          <p className="text-red-300 font-semibold">
            {t("emergency.call_911")}
          </p>
          <p className="text-red-400 text-sm mt-1">{t("emergency.not_medical")}</p>
        </div>

        {step === "select" && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-black mb-2">{t("emergency.what_type")}</h1>
              <p className="text-slate-400">{t("emergency.select_below")}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {EMERGENCY_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => { setSelectedType(type.id); setStep("details"); }}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] text-left ${type.bgColor} hover:border-orange-500/50`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className={`w-8 h-8 ${type.color}`} />
                      <span className="text-lg font-bold">{type.label}</span>
                    </div>
                    <p className="text-xs text-slate-400">{t("emergency.tap_safety")}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === "details" && selectedEmergency && (
          <div className="space-y-6">
            <Button variant="ghost" onClick={() => setStep("select")} className="text-slate-400">
              &larr; {t("emergency.back_types")}
            </Button>

            <div className="flex items-center gap-3">
              <selectedEmergency.icon className={`w-10 h-10 ${selectedEmergency.color}`} />
              <h2 className="text-2xl font-black">{selectedEmergency.label}</h2>
            </div>

            {/* FIRST: Safety steps */}
            <Card className="bg-amber-950/40 border-amber-700/50">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" /> {t("emergency.do_first")}
                </h3>
                <ol className="space-y-3">
                  {selectedEmergency.firstSteps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-slate-200 leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            {/* THEN: Request help */}
            <Card className="bg-slate-800/60 border-slate-700">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-bold text-white mb-2">{t("emergency.send_help")}</h3>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">{t("emergency.your_address")}</label>
                  <Input
                    placeholder="Street address"
                    value={address.addressLine1}
                    onChange={(e) => setAddress(a => ({ ...a, addressLine1: e.target.value }))}
                    className="bg-slate-900 border-slate-600"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Input placeholder="City" value={address.city} onChange={(e) => setAddress(a => ({ ...a, city: e.target.value }))} className="bg-slate-900 border-slate-600" />
                  <Input placeholder="State" value={address.state} onChange={(e) => setAddress(a => ({ ...a, state: e.target.value }))} className="bg-slate-900 border-slate-600" />
                  <Input placeholder="ZIP" value={address.zipCode} onChange={(e) => setAddress(a => ({ ...a, zipCode: e.target.value }))} className="bg-slate-900 border-slate-600" />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">{t("emergency.whats_happening")}</label>
                  <Textarea placeholder="Describe the situation..." value={description} onChange={(e) => setDescription(e.target.value)} className="bg-slate-900 border-slate-600" />
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={() => submitMutation.mutate()}
              disabled={!address.addressLine1 || !address.city || !address.state || !address.zipCode || submitMutation.isPending}
              className="w-full h-16 text-xl font-black bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-600/30"
            >
              {submitMutation.isPending ? t("emergency.dispatching") : t("emergency.send_help_now")}
            </Button>

            <p className="text-center text-slate-500 text-sm">
              Or call directly: <a href="tel:407-338-3342" className="text-red-400 font-bold hover:underline">(407) 338-3342</a>
            </p>
          </div>
        )}

        {step === "searching" && (
          <div className="text-center space-y-8 py-12">
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-full bg-red-600/20 animate-ping absolute inset-0" />
              <div className="w-32 h-32 rounded-full bg-red-600/30 flex items-center justify-center relative">
                <AlertTriangle className="w-16 h-16 text-red-500" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">{t("emergency.dispatching_pro")}</h2>
              <p className="text-slate-400">{t("emergency.notifying_pros")}</p>
              <p className="text-slate-500 text-sm mt-2">Emergency ID: {emergencyId}</p>
            </div>
            <div className="flex items-center justify-center gap-2 text-green-400 font-bold text-lg">
              <Clock className="w-5 h-5" />
              <span>{t("emergency.avg_response")}</span>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-6 border border-slate-700 max-w-md mx-auto text-left">
              <h3 className="font-bold text-white mb-3">{t("emergency.while_wait")}:</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" /> {t("emergency.wait_step1")}</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" /> {t("emergency.wait_step2")}</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" /> {t("emergency.wait_step3")}</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" /> {t("emergency.wait_step4")}</li>
              </ul>
            </div>
          </div>
        )}

        {step === "found" && (
          <div className="text-center space-y-8 py-12">
            <div className="w-32 h-32 rounded-full bg-green-600/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2 text-green-400">{t("emergency.help_on_way")}</h2>
              <p className="text-slate-300">{t("emergency.in_good_hands")}</p>
              {proInfo && (
                <p className="text-slate-300 text-lg mt-2">{proInfo.companyName} -- {proInfo.rating?.toFixed(1)} stars</p>
              )}
            </div>
            {eta && (
              <Card className="bg-slate-800/50 border-slate-700 max-w-sm mx-auto">
                <CardContent className="p-6 text-center">
                  <p className="text-slate-400 text-sm">{t("emergency.estimated_arrival")}</p>
                  <p className="text-5xl font-black text-white mt-1">{eta} min</p>
                </CardContent>
              </Card>
            )}
            {proInfo?.phone && (
              <Button variant="outline" className="border-slate-600" asChild>
                <a href={`tel:${proInfo.phone}`}>
                  <Phone className="w-4 h-4 mr-2" /> {t("emergency.call_pro")}
                </a>
              </Button>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
