import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import {
  AlertTriangle, Droplets, Flame, KeyRound, Wrench,
  Zap, Wind, Clock, CheckCircle2, Phone,
} from "lucide-react";

const EMERGENCY_ICONS: Record<string, any> = {
  water_damage: Droplets,
  fire_damage: Flame,
  lockout: KeyRound,
  broken_pipe: Wrench,
  electrical_emergency: Zap,
  gas_leak: AlertTriangle,
  storm_damage: Wind,
};

const EMERGENCY_COLORS: Record<string, string> = {
  water_damage: "text-blue-500",
  fire_damage: "text-orange-500",
  lockout: "text-yellow-500",
  broken_pipe: "text-cyan-500",
  electrical_emergency: "text-amber-500",
  gas_leak: "text-red-600",
  storm_damage: "text-gray-500",
};

export default function EmergencyPage() {
  const { toast } = useToast();
  const [step, setStep] = useState<"select" | "details" | "searching" | "found">("select");
  const [selectedType, setSelectedType] = useState<string>("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState({ addressLine1: "", city: "", state: "", zipCode: "" });
  const [emergencyId, setEmergencyId] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [proInfo, setProInfo] = useState<any>(null);
  const [eta, setEta] = useState<number | null>(null);

  const { data: types } = useQuery({
    queryKey: ["/api/emergency/types"],
    queryFn: async () => {
      const res = await fetch("/api/emergency/types");
      return res.json();
    },
  });

  // WebSocket for real-time status
  useEffect(() => {
    if (!emergencyId) return;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws?jobId=emergency-${emergencyId}&role=customer`);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "emergency_status") {
        if (data.status === "accepted") {
          setStep("found");
          setEta(data.etaMinutes);
        }
      }
    };

    setWs(socket);
    return () => socket.close();
  }, [emergencyId]);

  // Poll status as fallback
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
      toast({ title: "Error", description: "Failed to submit emergency request. Please call 911 for life-threatening emergencies.", variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />
      <main className="pt-24 pb-16 px-4 max-w-3xl mx-auto">
        {/* Warning Banner */}
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-8 text-center">
          <p className="text-red-300 font-semibold">
            ⚠️ For life-threatening emergencies, call <strong>911</strong> first.
          </p>
          <p className="text-red-400 text-sm mt-1">This service is for urgent home repairs, not medical emergencies.</p>
        </div>

        {step === "select" && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-2">Emergency Home Services</h1>
              <p className="text-slate-400">Get a pro to your door ASAP. 24/7 emergency dispatch.</p>
              <p className="text-amber-400 text-sm mt-2 font-medium">Emergency pricing: 2× standard rate</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {(types || []).map((type: any) => {
                const Icon = EMERGENCY_ICONS[type.id] || AlertTriangle;
                const color = EMERGENCY_COLORS[type.id] || "text-red-500";
                return (
                  <button
                    key={type.id}
                    onClick={() => { setSelectedType(type.id); setStep("details"); }}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                      selectedType === type.id
                        ? "border-red-500 bg-red-500/10"
                        : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                    }`}
                  >
                    <Icon className={`w-10 h-10 mx-auto mb-3 ${color}`} />
                    <p className="text-sm font-medium text-center">{type.label}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === "details" && (
          <div className="space-y-6">
            <Button variant="ghost" onClick={() => setStep("select")} className="text-slate-400">
              ← Back
            </Button>
            <h2 className="text-2xl font-bold">
              {selectedType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Address</label>
                <Input
                  placeholder="Street address"
                  value={address.addressLine1}
                  onChange={(e) => setAddress(a => ({ ...a, addressLine1: e.target.value }))}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  placeholder="City"
                  value={address.city}
                  onChange={(e) => setAddress(a => ({ ...a, city: e.target.value }))}
                  className="bg-slate-800 border-slate-700"
                />
                <Input
                  placeholder="State"
                  value={address.state}
                  onChange={(e) => setAddress(a => ({ ...a, state: e.target.value }))}
                  className="bg-slate-800 border-slate-700"
                />
                <Input
                  placeholder="ZIP"
                  value={address.zipCode}
                  onChange={(e) => setAddress(a => ({ ...a, zipCode: e.target.value }))}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">What's happening? (optional)</label>
                <Textarea
                  placeholder="Describe the situation..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
            </div>

            <Button
              onClick={() => submitMutation.mutate()}
              disabled={!address.addressLine1 || !address.city || !address.state || !address.zipCode || submitMutation.isPending}
              className="w-full h-16 text-xl font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-600/30 animate-pulse hover:animate-none"
            >
              {submitMutation.isPending ? "Submitting..." : "🚨 I Need Help NOW"}
            </Button>
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
              <h2 className="text-3xl font-bold mb-2">Finding a pro near you...</h2>
              <p className="text-slate-400">We're notifying all available pros in your area.</p>
              <p className="text-slate-500 text-sm mt-2">Emergency ID: {emergencyId}</p>
            </div>
            <div className="flex items-center justify-center gap-2 text-amber-400">
              <Clock className="w-5 h-5 animate-spin" />
              <span>Average response time: 15-30 minutes</span>
            </div>
          </div>
        )}

        {step === "found" && (
          <div className="text-center space-y-8 py-12">
            <div className="w-32 h-32 rounded-full bg-green-600/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2 text-green-400">Pro Found!</h2>
              {proInfo && (
                <p className="text-slate-300 text-lg">{proInfo.companyName} • ⭐ {proInfo.rating?.toFixed(1)}</p>
              )}
            </div>
            {eta && (
              <Card className="bg-slate-800/50 border-slate-700 max-w-sm mx-auto">
                <CardContent className="p-6 text-center">
                  <p className="text-slate-400 text-sm">Estimated arrival</p>
                  <p className="text-4xl font-bold text-white mt-1">{eta} min</p>
                </CardContent>
              </Card>
            )}
            {proInfo?.phone && (
              <Button variant="outline" className="border-slate-600" asChild>
                <a href={`tel:${proInfo.phone}`}>
                  <Phone className="w-4 h-4 mr-2" /> Call Pro
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
