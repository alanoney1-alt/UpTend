import { usePageTitle } from "@/hooks/use-page-title";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/landing/header";
import {
  Home, Calendar, AlertTriangle, CheckCircle2, Clock, ArrowRight,
  Leaf, DollarSign, XCircle, Loader2, TrendingUp, ShieldCheck
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

function HealthRing({ score }: { score: number }) {
  const size = 160;
  const r = (size - 14) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "#22c55e" : score >= 50 ? "#eab308" : "#ef4444";

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#27272a" strokeWidth="10" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold text-white">{score}</span>
        <span className="text-zinc-400 text-xs">out of 100</span>
      </div>
    </div>
  );
}

const serviceIcons: Record<string, string> = {
  gutter_cleaning: "🏠", pressure_washing: "💦", pool_cleaning: "🏊",
  landscaping: "🌿", hvac_filter: "❄️", carpet_cleaning: "🧹"
};

export default function HomeHealth() {
  usePageTitle("Home Health | UpTend");
  const [, navigate] = useLocation();

  const { data: health, isLoading } = useQuery<any>({
    queryKey: ["/api/home-health/score"],
    queryFn: () => fetch("/api/home-health/score").then(r => r.json()),
  });

  const { data: calendar } = useQuery<any>({
    queryKey: ["/api/home-health/calendar"],
    queryFn: () => fetch("/api/home-health/calendar").then(r => r.json()),
  });

  const { data: overdue } = useQuery<any>({
    queryKey: ["/api/home-health/overdue"],
    queryFn: () => fetch("/api/home-health/overdue").then(r => r.json()),
  });

  const dismissMutation = useMutation({
    mutationFn: (item: string) => apiRequest("POST", `/api/home-health/dismiss/${item}`),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#F47C20]" />
      </div>
    );
  }

  const score = health?.score ?? 75;
  const grade = health?.grade ?? "Needs Attention";

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-32">
        <div className="flex items-center gap-3 mb-8">
          <Home className="w-6 h-6 text-[#F47C20]" />
          <h1 className="text-2xl font-bold text-white">Home Health</h1>
        </div>

        {/* Score Card */}
        <Card className="bg-zinc-900 border-zinc-800 p-6 mb-6 text-center">
          <HealthRing score={score} />
          <p className={`text-lg font-semibold mt-4 ${
            score >= 80 ? "text-green-400" : score >= 50 ? "text-yellow-400" : "text-red-400"
          }`}>
            {grade}
          </p>
          <p className="text-zinc-400 text-sm mt-1">
            {health?.overdueCount > 0
              ? `${health.overdueCount} overdue item${health.overdueCount > 1 ? "s" : ""} need attention`
              : "Your home is in great shape!"}
          </p>
          {health?.bonusApplied && (
            <Badge className="mt-3 bg-green-500/20 text-green-300 border-green-500/40">
              +5 Bonus: 3+ consecutive on time services
            </Badge>
          )}
        </Card>

        {/* Overdue Items */}
        {overdue?.overdue?.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" /> Overdue
            </h2>
            <div className="space-y-3">
              {overdue.overdue.map((item: any) => (
                <Card key={item.id} className="bg-zinc-900 border-red-500/20 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{serviceIcons[item.service] || "🔧"}</span>
                      <div>
                        <h3 className="text-white font-semibold text-sm">{item.label}</h3>
                        <p className="text-red-400 text-xs mt-0.5">{item.daysOverdue} days overdue</p>
                        <p className="text-zinc-500 text-xs mt-0.5">Impact: {item.healthImpact}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">${item.estimatedCost}</p>
                      <p className="text-zinc-500 text-xs">estimated</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" onClick={() => navigate("/book")}
                      className="bg-[#F47C20] hover:bg-[#F47C20]/90 text-xs flex-1">
                      Book Now <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                    <Button size="sm" variant="outline"
                      onClick={() => dismissMutation.mutate(item.service)}
                      className="border-zinc-700 text-zinc-400 text-xs hover:bg-zinc-800">
                      <XCircle className="w-3 h-3 mr-1" /> Dismiss
                    </Button>
                  </div>
                </Card>
              ))}
              {overdue.totalCostToFix > 0 && (
                <div className="text-center">
                  <Button onClick={() => navigate("/book")} className="bg-[#F47C20] hover:bg-[#F47C20]/90">
                    Fix Everything — ~${overdue.totalCostToFix} estimated
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Maintenance Items */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#F47C20]" /> Maintenance Status
          </h2>
          <div className="space-y-2">
            {(health?.items || []).map((item: any) => (
              <Card key={item.id} className={`bg-zinc-900 p-3 flex items-center gap-3 ${
                item.status === "overdue" ? "border-red-500/30" :
                item.status === "due_soon" ? "border-yellow-500/30" :
                "border-zinc-800"
              }`}>
                <span className="text-xl">{serviceIcons[item.service] || "🔧"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium">{item.label}</span>
                    <Badge className={`text-[10px] ${
                      item.status === "on_time" ? "bg-green-500/20 text-green-300 border-green-500/40" :
                      item.status === "due_soon" ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/40" :
                      "bg-red-500/20 text-red-300 border-red-500/40"
                    }`}>
                      {item.status === "on_time" ? "On Track" : item.status === "due_soon" ? "Due Soon" : "Overdue"}
                    </Badge>
                  </div>
                  <p className="text-zinc-500 text-xs">{item.frequency} • Next: {new Date(item.nextDue).toLocaleDateString()}</p>
                </div>
                {item.status !== "on_time" && (
                  <Button size="sm" variant="ghost" onClick={() => navigate("/book")}
                    className="text-[#F47C20] hover:bg-[#F47C20]/10 text-xs shrink-0">
                    Book
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Annual Calendar Preview */}
        {calendar?.calendar && (
          <Card className="bg-zinc-900 border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#F47C20]" /> Upcoming Maintenance
              </h3>
              <span className="text-zinc-500 text-xs">
                Est. Annual: ${calendar.totalEstimatedAnnual?.toLocaleString()}
              </span>
            </div>
            <div className="space-y-2">
              {calendar.calendar.filter((c: any) => c.status === "scheduled").slice(0, 8).map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                  <div className="flex items-center gap-2">
                    <span>{serviceIcons[c.service] || "🔧"}</span>
                    <div>
                      <span className="text-white text-sm">{c.label}</span>
                      <p className="text-zinc-500 text-xs">{new Date(c.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                  </div>
                  <span className="text-zinc-400 text-sm">${c.estimatedCost}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
