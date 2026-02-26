/**
 * Pro AI Dashboard. unified AI features view for hauler pros
 * Route Optimization · Quality Score · Job Assessments
 */

import { useQuery } from "@tanstack/react-query";
import {
  Route, Gauge, ClipboardCheck, TrendingUp, Leaf, BookOpen,
  Star, AlertCircle, MapPin, Clock, Truck, Award, Zap,
  ChevronRight, Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// ── Brand color ──────────────────────────────────────────────
const BRAND = "#F47C20";

// ── Tier styling ─────────────────────────────────────────────
const tierConfig: Record<string, { bg: string; text: string; icon: string }> = {
  platinum: { bg: "bg-gradient-to-r from-blue-400 to-purple-600", text: "text-white", icon: "" },
  gold:     { bg: "bg-gradient-to-r from-yellow-400 to-orange-500", text: "text-white", icon: "" },
  silver:   { bg: "bg-gradient-to-r from-gray-300 to-gray-500", text: "text-white", icon: "" },
  bronze:   { bg: "bg-gradient-to-r from-orange-700 to-yellow-700", text: "text-white", icon: "" },
};

// ── Score Circle ─────────────────────────────────────────────
function ScoreCircle({ score, size = 120 }: { score: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 90 ? "#22c55e" : score >= 75 ? BRAND : score >= 60 ? "#eab308" : "#ef4444";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={8} className="text-muted/20" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold">{score}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

// ── Stat pill ────────────────────────────────────────────────
function Stat({ icon: Icon, label, value, accent = false }: { icon: any; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${accent ? "bg-[#F47C20]/10" : "bg-muted/50"}`}>
      <Icon className="w-4 h-4 shrink-0" style={accent ? { color: BRAND } : undefined} />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-sm font-semibold truncate">{value}</p>
      </div>
    </div>
  );
}

// ── Route Optimization Card ─────────────────────────────────
function RouteOptimizationCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["pro-route-optimization"],
    queryFn: async () => {
      const res = await fetch("/api/ai/pro/route/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          date: new Date().toISOString().slice(0, 10),
          jobs: [], // empty → server returns no optimization
        }),
      });
      // Will likely 400 with no jobs; that's fine. show placeholder
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
    staleTime: 5 * 60_000,
  });

  const opt = data?.optimization;

  return (
    <Card className="border-l-4" style={{ borderLeftColor: BRAND }}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Route className="w-5 h-5" style={{ color: BRAND }} />
          Route Optimization
        </CardTitle>
        <CardDescription>AI-optimized route for today's jobs</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : opt ? (
          <div className="space-y-4">
            {/* Optimized job order */}
            <div className="space-y-2">
              {opt.routeSteps?.map((step: any, i: number) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white" style={{ backgroundColor: BRAND }}>
                    {i + 1}
                  </span>
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="truncate">{step.address || step.jobId}</span>
                  <span className="ml-auto text-muted-foreground whitespace-nowrap">{step.distance || "—"}</span>
                </div>
              ))}
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-2">
              <Stat icon={Truck} label="Miles Saved" value={`${opt.savings?.milesSaved?.toFixed(1) || "0"} mi`} accent />
              <Stat icon={Clock} label="Time Saved" value={`${opt.savings?.timeSaved || 0} min`} />
              <Stat icon={Leaf} label="CO₂ Saved" value={`${opt.savings?.co2SavedLbs?.toFixed(1) || "0"} lbs`} accent />
            </div>
          </div>
        ) : (
          /* Placeholder when no jobs today */
          <div className="text-center py-6 space-y-3">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Route className="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">No jobs scheduled today</p>
              <p className="text-xs text-muted-foreground">Accept jobs to see your optimized route</p>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2">
              <Stat icon={Truck} label="Miles Saved" value="0 mi" />
              <Stat icon={Clock} label="Time Saved" value="0 min" />
              <Stat icon={Leaf} label="CO₂ Saved" value="0 lbs" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Quality Score Card ──────────────────────────────────────
function QualityScoreCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["pro-quality-score"],
    queryFn: async () => {
      const res = await fetch("/api/ai/pro/quality/score", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    retry: false,
    staleTime: 5 * 60_000,
  });

  const score = data?.score;
  const tier = tierConfig[(score?.tier as string) || "bronze"] || tierConfig.bronze;

  return (
    <Card className="border-l-4" style={{ borderLeftColor: BRAND }}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gauge className="w-5 h-5" style={{ color: BRAND }} />
          Quality Score
        </CardTitle>
        <CardDescription>AI-assessed performance rating</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : score ? (
          <div className="space-y-5">
            {/* Score + tier */}
            <div className="flex items-center gap-6">
              <ScoreCircle score={score.overallScore || score.overall_score || 0} />
              <div className="space-y-2">
                <Badge className={`${tier.bg} ${tier.text}`}>
                  {tier.icon} {(score.tier || "bronze").toUpperCase()}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Based on {score.jobsAnalyzed || score.jobs_analyzed || 0} jobs
                </p>
                {score.trend && (
                  <div className="flex items-center gap-1 text-sm">
                    <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-green-600 font-medium">{score.trend}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Component scores */}
            {(score.componentScores || score.component_scores) && (
              <div className="space-y-2">
                {Object.entries(score.componentScores || score.component_scores || {}).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="capitalize text-muted-foreground">{key.replace(/([A-Z_])/g, " $1").trim()}</span>
                      <span className="font-medium">{String(value)}%</span>
                    </div>
                    <Progress value={value as number} className="h-1.5" />
                  </div>
                ))}
              </div>
            )}

            {/* Training recs */}
            {(score.trainingRecommendations || score.training_recommendations)?.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" /> Training Recommendations
                  </p>
                  <ul className="space-y-1.5">
                    {(score.trainingRecommendations || score.training_recommendations).slice(0, 3).map((rec: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: BRAND }}>
                          {i + 1}
                        </span>
                        <span className="text-muted-foreground">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-6 space-y-2">
            <Award className="w-10 h-10 mx-auto text-muted-foreground" />
            <p className="text-sm font-medium">No score yet</p>
            <p className="text-xs text-muted-foreground">Complete more jobs to unlock your quality score</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Job Assessments Card ────────────────────────────────────
function JobAssessmentsCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["pro-job-assessments"],
    queryFn: async () => {
      const res = await fetch("/api/ai/pro/quality/history?limit=5", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    retry: false,
    staleTime: 5 * 60_000,
  });

  const assessments = data?.history || [];

  return (
    <Card className="border-l-4" style={{ borderLeftColor: BRAND }}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardCheck className="w-5 h-5" style={{ color: BRAND }} />
          Recent Job Assessments
        </CardTitle>
        <CardDescription>AI quality assessments on recent jobs</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : assessments.length > 0 ? (
          <div className="space-y-3">
            {assessments.map((a: any, i: number) => {
              const score = a.overallScore || a.overall_score || 0;
              const color = score >= 90 ? "text-green-600" : score >= 75 ? "text-[#F47C20]" : score >= 60 ? "text-yellow-600" : "text-red-500";
              const bg = score >= 90 ? "bg-green-500/10" : score >= 75 ? "bg-[#F47C20]/10" : score >= 60 ? "bg-yellow-500/10" : "bg-red-500/10";

              return (
                <div key={a.id || i} className={`flex items-center justify-between p-3 rounded-lg ${bg}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`text-xl font-bold ${color}`}>{score}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {a.tier ? `${tierConfig[a.tier]?.icon || ""} ${a.tier.charAt(0).toUpperCase() + a.tier.slice(1)}` : `Assessment #${i + 1}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {a.createdAt || a.created_at
                          ? new Date(a.createdAt || a.created_at).toLocaleDateString()
                          : "Recent"}
                        {a.jobsAnalyzed || a.jobs_analyzed ? ` · ${a.jobsAnalyzed || a.jobs_analyzed} jobs` : ""}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 space-y-2">
            <ClipboardCheck className="w-10 h-10 mx-auto text-muted-foreground" />
            <p className="text-sm font-medium">No assessments yet</p>
            <p className="text-xs text-muted-foreground">Assessments appear after completing jobs</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Export ──────────────────────────────────────────────
export function ProAiDashboard() {
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${BRAND}15` }}>
          <Zap className="w-5 h-5" style={{ color: BRAND }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI Insights</h1>
          <p className="text-sm text-muted-foreground">AI-powered tools to help you earn more and work smarter</p>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RouteOptimizationCard />
        <QualityScoreCard />
      </div>

      <JobAssessmentsCard />
    </div>
  );
}

export default ProAiDashboard;
