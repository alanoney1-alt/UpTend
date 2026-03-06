/**
 * Unified Pro Dashboard
 * Route: /pro/:slug
 *
 * One page. Everything a trade partner needs.
 * Leads, quotes, SEO, jobs — clean and simple.
 */

import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Phone,
  DollarSign,
  Clock,
  MapPin,
  Camera,
  Send,
  Loader2,
  Star,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  CircleDot,
} from "lucide-react";
import { getPartnerConfig } from "@/config/partner-configs";
import { useToast } from "@/hooks/use-toast";

/* ── Types ─────────────────────────────────────────────── */

interface PhotoQuote {
  id: string;
  partner_slug: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  photo_urls: string[];
  ai_analysis: {
    unit_type?: string;
    manufacturer?: string;
    condition?: string;
    visible_issues?: string[];
    recommended_services?: string[];
    urgency?: string;
    technician_notes?: string;
  };
  status: string;
  notes?: string;
  created_at: string;
  service_request_id?: string;
}

interface GeneralLead {
  id: string;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  service_type: string;
  description?: string;
  source: string;
  status: string;
  created_at: string;
}

interface PartnerJob {
  id: string;
  customer_name: string;
  service_type: string;
  status: string;
  amount?: number;
  scheduled_at?: string;
  completed_at?: string;
  created_at: string;
}

interface SEOPage {
  id: string;
  page_title: string;
  page_url: string;
  neighborhood: string;
  city: string;
  is_indexed: boolean;
}

type Tab = "leads" | "seo" | "jobs";

/* ── Helpers ───────────────────────────────────────────── */

const firstName = (name: string) => name?.split(" ")[0] || "Customer";

const cityOnly = (addr: string) => {
  if (!addr) return "Orlando area";
  const parts = addr.split(",");
  return parts.length >= 2 ? parts[parts.length - 2].trim() : "Orlando area";
};

const timeAgo = (iso: string) => {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return mins <= 1 ? "Just now" : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const urgencyColor: Record<string, string> = {
  emergency: "text-red-600 dark:text-red-400",
  urgent: "text-orange-600 dark:text-orange-400",
  soon: "text-yellow-600 dark:text-yellow-400",
  routine: "text-muted-foreground",
};

const conditionColor: Record<string, string> = {
  critical: "text-red-600 dark:text-red-400",
  poor: "text-orange-600 dark:text-orange-400",
  fair: "text-yellow-600 dark:text-yellow-400",
  good: "text-blue-600 dark:text-blue-400",
  excellent: "text-green-600 dark:text-green-400",
};

const statusStyle: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  new: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  quoted: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  contacted: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  confirmed: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  closed: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  in_progress: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

const sourceLabel: Record<string, string> = {
  photo_quote: "Photo Quote",
  george: "George",
  george_lead: "George",
  phone: "Phone Call",
  web: "Website",
  referral: "Referral",
};

/* ── Component ─────────────────────────────────────────── */

export default function ProDashboard() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "comfort-solutions-tech";
  const config = getPartnerConfig(slug);
  const { toast } = useToast();

  const [tab, setTab] = useState<Tab>("leads");
  const [loading, setLoading] = useState(true);

  // Data
  const [photoQuotes, setPhotoQuotes] = useState<PhotoQuote[]>([]);
  const [leads, setLeads] = useState<GeneralLead[]>([]);
  const [jobs, setJobs] = useState<PartnerJob[]>([]);
  const [seoPages, setSeoPages] = useState<SEOPage[]>([]);
  const [stats, setStats] = useState({ totalLeads: 0, activeJobs: 0, revenue: 0, rating: 0 });

  // Quote modal
  const [quoteTarget, setQuoteTarget] = useState<PhotoQuote | null>(null);
  const [quotePrice, setQuotePrice] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [quoteDuration, setQuoteDuration] = useState("");
  const [quoteDate, setQuoteDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Photo expand
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pqRes, statsRes, leadsRes, seoRes, jobsRes] = await Promise.all([
        fetch(`/api/partners/${slug}/photo-quote/list`).then((r) => r.json()).catch(() => ({ quotes: [] })),
        fetch(`/api/partners/${slug}/stats`).then((r) => r.json()).catch(() => ({ stats: {} })),
        fetch(`/api/partners/${slug}/leads`).then((r) => r.json()).catch(() => ({ leads: [] })),
        fetch(`/api/partners/${slug}/seo-pages`).then((r) => r.json()).catch(() => ({ pages: [] })),
        fetch(`/api/partners/${slug}/jobs`).then((r) => r.json()).catch(() => ({ jobs: [] })),
      ]);

      setPhotoQuotes(pqRes.quotes || []);
      setLeads(leadsRes.leads || []);
      setSeoPages(seoRes.pages || []);
      setJobs(jobsRes.jobs || []);

      const s = statsRes.stats || {};
      const totalPQ = (pqRes.quotes || []).length;
      const totalGL = (leadsRes.leads || []).length;
      setStats({
        totalLeads: totalPQ + totalGL,
        activeJobs: s.activeJobs || s.active_jobs || 0,
        revenue: s.revenueThisMonth || s.revenue_this_month || 0,
        rating: s.averageRating || s.avg_rating || 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [slug]);

  // Combined + sorted leads
  const allLeads = [
    ...photoQuotes.map((pq) => ({ ...pq, _type: "photo_quote" as const, _sort: pq.created_at })),
    ...leads.map((l) => ({ ...l, _type: "general" as const, _sort: l.created_at })),
  ].sort((a, b) => new Date(b._sort).getTime() - new Date(a._sort).getTime());

  const pendingCount = photoQuotes.filter((pq) => pq.status === "pending").length;

  const submitQuote = async () => {
    if (!quoteTarget || !quotePrice || !quoteNotes) {
      toast({ title: "Enter price and notes", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/partners/${slug}/photo-quote/${quoteTarget.id}/quote`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quotedPrice: parseFloat(quotePrice),
          quoteNotes,
          estimatedDuration: quoteDuration || null,
          scheduledDate: quoteDate || null,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed");
      toast({ title: "Quote sent", description: "Customer will get an email with your quote." });
      setQuoteTarget(null);
      setQuotePrice("");
      setQuoteNotes("");
      setQuoteDuration("");
      setQuoteDate("");
      fetchAll();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Render ────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Header ──────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-semibold">{config.companyName}</span>
            <span className="hidden sm:inline text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              Pro Dashboard
            </span>
          </div>
          <a
            href={`tel:${config.phone.replace(/\D/g, "")}`}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{config.phone}</span>
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        {/* ── Stats ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Leads", value: String(stats.totalLeads), accent: "" },
            { label: "Pending", value: String(pendingCount), accent: pendingCount > 0 ? "text-amber-500" : "" },
            { label: "Active Jobs", value: String(stats.activeJobs), accent: "text-blue-500" },
            { label: "Revenue", value: `$${stats.revenue.toLocaleString()}`, accent: "text-green-500" },
          ].map((s) => (
            <Card key={s.label} className="border-border/60">
              <CardContent className="p-4">
                <p className={`text-2xl font-bold tabular-nums ${s.accent}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Tabs ───────────────────────────────────────── */}
        <div className="flex gap-1 border-b border-border">
          {(
            [
              ["leads", "Leads & Quotes"],
              ["seo", "SEO & Visibility"],
              ["jobs", "Jobs"],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                tab === key
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
              {key === "leads" && pendingCount > 0 && (
                <span className="ml-1.5 bg-amber-500 text-white text-[10px] font-bold rounded-full w-4 h-4 inline-flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
              {tab === key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* ── Tab: Leads & Quotes ─────────────────────────── */}
        {tab === "leads" && (
          <div className="space-y-3">
            {allLeads.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-lg">No leads yet</p>
                <p className="text-sm mt-1">Share your quote page to start receiving leads</p>
              </div>
            ) : (
              allLeads.map((lead) => {
                const isPQ = lead._type === "photo_quote";
                const pq = isPQ ? (lead as PhotoQuote & { _type: string; _sort: string }) : null;
                const gl = !isPQ ? (lead as GeneralLead & { _type: string; _sort: string }) : null;
                const name = firstName(lead.customer_name);
                const area = cityOnly(
                  isPQ ? (lead as any).customer_address : gl?.customer_address || ""
                );
                const status = lead.status;
                const src = isPQ ? "photo_quote" : gl?.source || "web";

                return (
                  <Card key={`${lead._type}-${lead.id}`} className="border-border/60 overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row">
                        {/* Left: Info */}
                        <div className="flex-1 p-4 sm:p-5 space-y-3">
                          {/* Top row */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-semibold truncate">{name}</span>
                              <span className="text-xs text-muted-foreground shrink-0">{timeAgo(lead._sort)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                {sourceLabel[src] || src}
                              </span>
                              <span className={`text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded ${statusStyle[status] || "bg-muted text-muted-foreground"}`}>
                                {status.replace("_", " ")}
                              </span>
                            </div>
                          </div>

                          {/* Location + service */}
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {area}
                            </span>
                            <span className="flex items-center gap-1">
                              <CircleDot className="w-3.5 h-3.5" />
                              {isPQ ? config.serviceType : gl?.service_type || "Service"}
                            </span>
                          </div>

                          {/* AI Analysis (photo quotes only) */}
                          {pq?.ai_analysis && (
                            <div className="text-sm space-y-1">
                              <div className="flex flex-wrap gap-x-4 gap-y-1">
                                {pq.ai_analysis.condition && (
                                  <span>
                                    Condition:{" "}
                                    <span className={`font-medium ${conditionColor[pq.ai_analysis.condition] || ""}`}>
                                      {pq.ai_analysis.condition}
                                    </span>
                                  </span>
                                )}
                                {pq.ai_analysis.urgency && (
                                  <span>
                                    Urgency:{" "}
                                    <span className={`font-medium ${urgencyColor[pq.ai_analysis.urgency] || ""}`}>
                                      {pq.ai_analysis.urgency}
                                    </span>
                                  </span>
                                )}
                              </div>
                              {pq.ai_analysis.recommended_services && pq.ai_analysis.recommended_services.length > 0 && (
                                <p className="text-muted-foreground text-xs">
                                  {pq.ai_analysis.recommended_services.join(" · ")}
                                </p>
                              )}
                              {pq.ai_analysis.technician_notes && (
                                <p className="text-xs text-muted-foreground/80 italic mt-1">
                                  {pq.ai_analysis.technician_notes}
                                </p>
                              )}
                            </div>
                          )}

                          {/* General lead description */}
                          {gl?.description && (
                            <p className="text-sm text-muted-foreground">{gl.description}</p>
                          )}

                          {/* Notes */}
                          {'notes' in lead && lead.notes && (
                            <p className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1.5">
                              {lead.notes}
                            </p>
                          )}

                          {/* Action */}
                          {isPQ && status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => setQuoteTarget(pq!)}
                              className="mt-1"
                            >
                              <Send className="w-3.5 h-3.5 mr-1.5" />
                              Submit Quote
                            </Button>
                          )}
                        </div>

                        {/* Right: Photos (photo quotes only) */}
                        {pq && pq.photo_urls.length > 0 && (
                          <div className="sm:w-48 sm:border-l border-t sm:border-t-0 border-border/60 p-3 flex sm:flex-col gap-2 bg-muted/20">
                            {pq.photo_urls.slice(0, 3).map((url, i) => (
                              <button
                                key={i}
                                onClick={() => setExpandedPhoto(url)}
                                className="relative aspect-square flex-1 sm:flex-none overflow-hidden rounded-md border border-border/60 hover:border-primary/50 transition-colors"
                              >
                                <img
                                  src={url}
                                  alt={`Photo ${i + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ))}
                            {pq.photo_urls.length > 0 && (
                              <div className="flex items-center justify-center text-xs text-muted-foreground gap-1">
                                <Camera className="w-3 h-3" />
                                {pq.photo_urls.length}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* ── Tab: SEO & Visibility ───────────────────────── */}
        {tab === "seo" && (
          <div className="space-y-4">
            {/* Quick links */}
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Your Pages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: "Partner Profile", url: `https://uptendapp.com/partners/${slug}` },
                  { label: "Photo Quote Page", url: `https://uptendapp.com/partners/${slug}/quote` },
                  { label: "Pro Dashboard", url: `https://uptendapp.com/pro/${slug}` },
                ].map((link) => (
                  <div key={link.label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{link.label}</span>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      {link.url.replace("https://", "")}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Directory Status */}
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Directory Listings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2.5">
                  {[
                    { name: "Google Business Profile", status: "live" },
                    { name: "Yelp", status: "pending" },
                    { name: "BBB", status: "pending" },
                    { name: "Nextdoor", status: "live" },
                    { name: "Bing Places", status: "pending" },
                  ].map((d) => (
                    <div key={d.name} className="flex items-center justify-between text-sm">
                      <span>{d.name}</span>
                      {d.status === "live" ? (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Live
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs">
                          <Clock className="w-3.5 h-3.5" /> Pending
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* SEO Pages */}
            {seoPages.length > 0 && (
              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Neighborhood SEO Pages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {seoPages.map((page) => (
                      <div key={page.id} className="flex items-center justify-between text-sm py-1">
                        <span>{page.neighborhood}, {page.city}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={page.is_indexed ? "default" : "secondary"} className="text-[10px]">
                            {page.is_indexed ? "Indexed" : "Pending"}
                          </Badge>
                          <a
                            href={page.page_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── Tab: Jobs ───────────────────────────────────── */}
        {tab === "jobs" && (
          <div className="space-y-3">
            {jobs.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-lg">No jobs yet</p>
                <p className="text-sm mt-1">Jobs appear here when customers confirm and pay</p>
              </div>
            ) : (
              jobs.map((job) => (
                <Card key={job.id} className="border-border/60">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{firstName(job.customer_name)}</span>
                          <span className={`text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded ${statusStyle[job.status] || "bg-muted"}`}>
                            {job.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{job.service_type}</p>
                      </div>
                      {job.amount != null && (
                        <span className="text-lg font-bold tabular-nums text-green-600 dark:text-green-400">
                          ${job.amount.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {(job.scheduled_at || job.completed_at) && (
                      <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                        {job.scheduled_at && (
                          <span>Scheduled: {new Date(job.scheduled_at).toLocaleDateString()}</span>
                        )}
                        {job.completed_at && (
                          <span>Completed: {new Date(job.completed_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </main>

      {/* ── Quote Modal ──────────────────────────────────── */}
      <Dialog open={!!quoteTarget} onOpenChange={(open) => !open && setQuoteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Quote for {quoteTarget ? firstName(quoteTarget.customer_name) : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Price</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="450"
                  value={quotePrice}
                  onChange={(e) => setQuotePrice(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">What needs to be done</Label>
              <Textarea
                placeholder="Compressor replacement, 2-man crew"
                value={quoteNotes}
                onChange={(e) => setQuoteNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Duration</Label>
                <Select value={quoteDuration} onValueChange={setQuoteDuration}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-2 hours">1–2 hours</SelectItem>
                    <SelectItem value="2-3 hours">2–3 hours</SelectItem>
                    <SelectItem value="3-4 hours">3–4 hours</SelectItem>
                    <SelectItem value="half day">Half day</SelectItem>
                    <SelectItem value="full day">Full day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Date</Label>
                <Input
                  type="date"
                  value={quoteDate}
                  onChange={(e) => setQuoteDate(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={submitQuote} disabled={submitting} className="w-full">
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {submitting ? "Sending..." : "Send Quote"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Photo Expand ─────────────────────────────────── */}
      <Dialog open={!!expandedPhoto} onOpenChange={() => setExpandedPhoto(null)}>
        <DialogContent className="max-w-2xl p-2">
          {expandedPhoto && (
            <img src={expandedPhoto} alt="Full size" className="w-full h-auto rounded" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
