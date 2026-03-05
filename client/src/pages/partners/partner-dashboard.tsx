import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/landing/header";
import {
  Users, Briefcase, DollarSign, Star, ArrowLeft,
  Phone, Clock, CheckCircle, AlertCircle, Calendar,
  TrendingUp, TrendingDown, ArrowRight, Sparkles,
  Camera, Search, MessageCircle,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// ─── ROI Dashboard Section ────────────────────────────────────────────────────
function ROIDashboard({ slug }: { slug: string }) {
  const { data } = useQuery({
    queryKey: ["partner-roi", slug],
    queryFn: async () => {
      const res = await fetch(`/api/partners/${slug}/roi`);
      if (!res.ok) throw new Error("Failed to load ROI data");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!data) return null;

  const { funnel, roi, seoPages } = data;

  const funnelSteps = [
    { label: "Impressions", value: funnel.impressions.toLocaleString(), icon: Search, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Clicks", value: funnel.clicks.toLocaleString(), icon: TrendingUp, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { label: "Leads", value: funnel.leads.toLocaleString(), icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Closed Jobs", value: funnel.closedJobs.toLocaleString(), icon: CheckCircle, color: "text-orange-500", bg: "bg-orange-500/10" },
    { label: "Revenue", value: `$${funnel.revenue.toLocaleString()}`, icon: DollarSign, color: "text-green-500", bg: "bg-green-500/10" },
  ];

  const traditionalItems = [
    { label: "Answering Service", cost: roi.traditionalCosts.answeringService, example: "PATLive / VoiceNation" },
    { label: "Basic Website", cost: roi.traditionalCosts.basicWebsite, example: "Squarespace + hosting" },
    { label: "Local SEO", cost: roi.traditionalCosts.localSeo, example: "Agency retainer" },
    { label: "Review Software", cost: roi.traditionalCosts.reviewSoftware, example: "Podium / NiceJob" },
    { label: "Lead Generation", cost: roi.traditionalCosts.leadGen, example: "Angi / HomeAdvisor" },
  ];

  return (
    <div className="mb-8 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-bold text-lg">Your ROI This Month</h2>
          <p className="text-xs text-muted-foreground">What UpTend is delivering vs. what you'd pay elsewhere</p>
        </div>
        <Badge variant="outline" className="ml-auto capitalize">{data.tier} plan</Badge>
      </div>

      {/* ── Savings Hero Card ────────────────────────────────────────── */}
      <Card className="border-green-500/30 bg-green-500/5 overflow-hidden">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* UpTend cost */}
            <div className="text-center p-4 rounded-xl bg-background border border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">
                What You Spend with UpTend
              </p>
              <p className="text-3xl font-bold text-primary">
                ${roi.uptendCost.toLocaleString()}
                <span className="text-base font-normal text-muted-foreground">/mo</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                AI front desk · SEO pages · Dispatch · Leads
              </p>
            </div>

            {/* Traditional cost */}
            <div className="text-center p-4 rounded-xl bg-background border border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">
                Traditional Vendors Would Cost
              </p>
              <p className="text-3xl font-bold text-destructive/80">
                ${roi.traditionalTotal.toLocaleString()}
                <span className="text-base font-normal text-muted-foreground">/mo</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                5 separate vendors, 5 invoices, no integration
              </p>
            </div>

            {/* Savings */}
            <div className="text-center p-4 rounded-xl bg-green-500/10 border border-green-500/30">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">
                You Save
              </p>
              <p className="text-3xl font-bold text-green-500">
                ${roi.monthlySavings.toLocaleString()}
                <span className="text-base font-normal text-green-600/70">/mo</span>
              </p>
              <p className="text-xs text-green-600/80 mt-1 font-medium">
                ${roi.annualSavings.toLocaleString()}/yr · {roi.savingsPercent}% cheaper
              </p>
            </div>
          </div>

          {/* Traditional breakdown */}
          <div className="mt-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-3">
              Traditional vendor breakdown
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {traditionalItems.map((item) => (
                <div key={item.label} className="text-center p-2 rounded-lg bg-background border border-border/50">
                  <p className="text-sm font-bold">${item.cost}</p>
                  <p className="text-xs text-muted-foreground leading-tight">{item.label}</p>
                  <p className="text-xs text-muted-foreground/60 leading-tight hidden sm:block">{item.example}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Funnel ────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            This Month's Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {funnelSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="flex flex-col items-center text-center">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${step.bg} mb-2`}>
                    <Icon className={`w-4 h-4 ${step.color}`} />
                  </div>
                  <p className={`text-lg font-bold ${step.color}`}>{step.value}</p>
                  <p className="text-xs text-muted-foreground leading-tight">{step.label}</p>
                  {i < funnelSteps.length - 1 && (
                    <ArrowRight className="absolute hidden" />
                  )}
                </div>
              );
            })}
          </div>
          {/* Conversion rate */}
          {funnel.leads > 0 && (
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Lead → Closed conversion</span>
              <Badge variant="outline" className="text-green-500 border-green-500/30">
                {funnel.conversionRate}%
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Quick Actions ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href={`/partners/${slug}/quote`}>
          <Card className="cursor-pointer hover:border-primary/40 transition-colors h-full">
            <CardContent className="pt-5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Camera className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm">Photo Quote Link</p>
                <p className="text-xs text-muted-foreground truncate">Text to customers →</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/partners/${slug}/seo-demo`}>
          <Card className="cursor-pointer hover:border-primary/40 transition-colors h-full">
            <CardContent className="pt-5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Search className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm">SEO Pages</p>
                <p className="text-xs text-muted-foreground">{seoPages} published</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/partners/${slug}/george`}>
          <Card className="cursor-pointer hover:border-primary/40 transition-colors h-full">
            <CardContent className="pt-5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm">George AI</p>
                <p className="text-xs text-muted-foreground">Your front desk</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Separator />
    </div>
  );
}

export default function PartnerDashboardPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: stats } = useQuery({
    queryKey: ["partner-stats", slug],
    queryFn: async () => {
      const res = await fetch(`/api/partners/${slug}/stats`);
      if (!res.ok) throw new Error("Failed to load stats");
      return res.json();
    },
  });

  const { data: leads } = useQuery({
    queryKey: ["partner-leads", slug],
    queryFn: async () => {
      const res = await fetch(`/api/partners/${slug}/leads`);
      if (!res.ok) throw new Error("Failed to load leads");
      return res.json();
    },
  });

  const { data: jobs } = useQuery({
    queryKey: ["partner-jobs", slug],
    queryFn: async () => {
      const res = await fetch(`/api/partners/${slug}/jobs`);
      if (!res.ok) throw new Error("Failed to load jobs");
      return res.json();
    },
  });

  const s = stats?.stats;

  const statusColors: Record<string, string> = {
    new: "bg-blue-500/10 text-blue-500",
    contacted: "bg-yellow-500/10 text-yellow-500",
    quoted: "bg-purple-500/10 text-purple-500",
    booked: "bg-green-500/10 text-green-500",
    in_progress: "bg-orange-500/10 text-orange-500",
    completed: "bg-green-500/10 text-green-500",
    scheduled: "bg-blue-500/10 text-blue-500",
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/partners" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">Partner Dashboard</h1>
          <Badge variant="outline">{slug}</Badge>
        </div>

        {/* ROI Section — first thing Alex sees */}
        <ROIDashboard slug={slug || ""} />

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s?.totalLeads ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">Leads This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Briefcase className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s?.activeJobs ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">Active Jobs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    ${(s?.revenueThisMonth ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Revenue This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Star className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s?.averageRating ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">Average Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Leads */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Phone className="w-4 h-4" /> Recent Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(leads?.leads || []).map((lead: any) => (
                  <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">{lead.issue}</p>
                      <p className="text-xs text-muted-foreground">{lead.phone}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <Badge className={statusColors[lead.status] || ""} variant="outline">
                        {lead.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(lead.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {(!leads?.leads || leads.leads.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">No leads yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Jobs Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(jobs?.jobs || []).map((job: any) => (
                  <div key={job.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{job.customer}</p>
                      <p className="text-xs text-muted-foreground">{job.service}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3 space-y-1">
                      <Badge className={statusColors[job.status] || ""} variant="outline">
                        {job.status.replace(/_/g, " ")}
                      </Badge>
                      <p className="text-sm font-medium">{job.amount}</p>
                      <p className="text-xs text-muted-foreground">{job.date}</p>
                    </div>
                  </div>
                ))}
                {(!jobs?.jobs || jobs.jobs.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">No jobs yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reviews Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="w-4 h-4" /> Reviews & Ratings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold text-yellow-500">{s?.averageRating ?? "—"}</p>
                <p className="text-sm text-muted-foreground">Average Rating</p>
                <div className="flex justify-center mt-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i <= Math.round(s?.averageRating ?? 0) ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`}
                    />
                  ))}
                </div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold">{s?.reviewRequestsSent ?? 0}</p>
                <p className="text-sm text-muted-foreground">Review Requests Sent</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold text-green-500">{s?.reviewsReceived ?? 0}</p>
                <p className="text-sm text-muted-foreground">Reviews Received</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
