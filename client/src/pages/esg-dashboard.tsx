import { usePageTitle } from "@/hooks/use-page-title";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/landing/header";
import {
  Leaf, Users, Shield, Download, TrendingUp, Award, CheckCircle2, AlertCircle
} from "lucide-react";

function ScoreRing({ score, size = 120, label, color }: { score: number; size?: number; label: string; color: string }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#27272a" strokeWidth="8" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000" />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-2xl font-bold text-white">{score}</span>
      </div>
      <span className="text-zinc-400 text-xs mt-2">{label}</span>
    </div>
  );
}

export default function EsgDashboard() {
  usePageTitle("ESG Dashboard | UpTend");

  const { data: dashboard } = useQuery<any>({
    queryKey: ["/api/esg/dashboard"],
    queryFn: () => fetch("/api/esg/dashboard").then(r => r.json()),
  });

  const { data: portfolio } = useQuery<any>({
    queryKey: ["/api/esg/portfolio"],
    queryFn: () => fetch("/api/esg/portfolio").then(r => r.json()),
  });

  const d = dashboard || { overallScore: 0, environmental: { score: 0 }, social: { score: 0 }, governance: { score: 0 }, grade: "-" };

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-32">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">ESG Compliance</h1>
            <p className="text-zinc-400 text-sm mt-1">Environmental, Social, and Governance metrics</p>
          </div>
          <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
            <Download className="w-4 h-4 mr-2" /> Export Report
          </Button>
        </div>

        {/* Overall Score */}
        <Card className="bg-zinc-900 border-zinc-800 p-6 mb-6">
          <div className="flex items-center justify-around flex-wrap gap-6">
            <div className="relative">
              <ScoreRing score={d.overallScore} size={140} label="Overall ESG Score" color="#F47C20" />
            </div>
            <ScoreRing score={d.environmental.score} size={100} label="Environmental" color="#22c55e" />
            <ScoreRing score={d.social.score} size={100} label="Social" color="#3b82f6" />
            <ScoreRing score={d.governance.score} size={100} label="Governance" color="#a855f7" />
          </div>
          <div className="text-center mt-4">
            <Badge className={`text-lg px-4 py-1 ${
              d.grade === "A" ? "bg-green-500/20 text-green-300 border-green-500/40" :
              d.grade === "B" ? "bg-blue-500/20 text-blue-300 border-blue-500/40" :
              "bg-yellow-500/20 text-yellow-300 border-yellow-500/40"
            }`}>
              Grade: {d.grade}
            </Badge>
          </div>
        </Card>

        {/* Three Pillars */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {/* Environmental */}
          <Card className="bg-zinc-900 border-zinc-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Leaf className="w-4 h-4 text-green-400" />
              </div>
              <h3 className="text-white font-semibold">Environmental</h3>
            </div>
            <div className="space-y-3">
              <MetricRow label="Local Pro Rate" value={`${d.environmental.localProRate || 0}%`} target="90%" met />
              <MetricRow label="Recycling Rate" value={`${d.environmental.recyclingRate || 0}%`} target="75%" met />
              <MetricRow label="Carbon Offset" value={`${d.environmental.carbonOffset || 0}t`} target="1.0t" met />
              <MetricRow label="Eco Products" value={`${d.environmental.ecoProducts || 0}%`} target="60%" met />
            </div>
          </Card>

          {/* Social */}
          <Card className="bg-zinc-900 border-zinc-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <h3 className="text-white font-semibold">Social</h3>
            </div>
            <div className="space-y-3">
              <MetricRow label="Veteran Pros" value={`${d.social.veteranRate || 0}%`} target="15%" met />
              <MetricRow label="Fair Pay Rate" value={`${d.social.fairPayRate || 0}%`} target="85%" met />
              <MetricRow label="Satisfaction" value={`${d.social.satisfactionRate || 0}%`} target="90%" met />
              <MetricRow label="Diversity Index" value={`${d.social.diversityIndex || 0}`} target="0.70" met />
            </div>
          </Card>

          {/* Governance */}
          <Card className="bg-zinc-900 border-zinc-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-purple-400" />
              </div>
              <h3 className="text-white font-semibold">Governance</h3>
            </div>
            <div className="space-y-3">
              <MetricRow label="Insurance" value={`${d.governance.insuranceRate || 0}%`} target="100%" met={d.governance.insuranceRate >= 100} />
              <MetricRow label="Background Checks" value={`${d.governance.backgroundCheckRate || 0}%`} target="100%" met />
              <MetricRow label="Complaint Res." value={`${d.governance.complaintResolution || 0}%`} target="95%" met />
              <MetricRow label="Contract Comp." value={`${d.governance.contractCompliance || 0}%`} target="98%" met />
            </div>
          </Card>
        </div>

        {/* Portfolio Overview */}
        {portfolio && (
          <Card className="bg-zinc-900 border-zinc-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-[#F47C20]" />
              <h3 className="text-white font-semibold">Portfolio Overview</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatBox label="Properties" value={portfolio.totalProperties} />
              <StatBox label="Avg Score" value={portfolio.averageScore} />
              <StatBox label="Top Performer" value={portfolio.topPerformer?.score} sub={portfolio.topPerformer?.name} />
              <StatBox label="Needs Attention" value={portfolio.needsAttention?.score} sub={portfolio.needsAttention?.name} alert />
            </div>
            {portfolio.trend && (
              <div className="flex items-end gap-2 mt-4 h-20">
                {portfolio.trend.map((t: any, i: number) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div className="bg-[#F47C20]/60 rounded-t w-full" style={{ height: `${t.score * 0.8}%` }} />
                    <span className="text-[9px] text-zinc-500 mt-1">{t.month.split(" ")[0]}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

function MetricRow({ label, value, target, met = true }: { label: string; value: string; target: string; met?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-400 text-xs">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-white text-xs font-medium">{value}</span>
        <span className="text-zinc-600 text-[10px]">/ {target}</span>
        {met ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <AlertCircle className="w-3 h-3 text-yellow-400" />}
      </div>
    </div>
  );
}

function StatBox({ label, value, sub, alert }: { label: string; value: any; sub?: string; alert?: boolean }) {
  return (
    <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
      <p className={`text-xl font-bold ${alert ? "text-yellow-400" : "text-white"}`}>{value}</p>
      <p className="text-zinc-400 text-xs">{label}</p>
      {sub && <p className="text-zinc-500 text-[10px] mt-1">{sub}</p>}
    </div>
  );
}
