import { usePageTitle } from "@/hooks/use-page-title";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { HomeDnaScoreWidget } from "@/components/home-dna-score-widget";
import { ImpactWidget } from "@/components/dashboard/impact-widget";
import { ImpactTracker } from "@/components/dashboard/impact-tracker";
import { ReferralWidget } from "@/components/dashboard/referral-widget";
import { WorkerIdCard } from "@/components/safety/worker-id-card";
import { Header } from "@/components/landing/header";
import { CustomerConfirmation } from "@/components/verification/customer-confirmation";
import { ReviewForm } from "@/components/reviews/review-form";
import { CustomerClaimsSection } from "@/components/customer/claims-section";
import type { ServiceRequest, HomeInventory } from "@shared/schema";
import { useMemo } from "react";
import {
  RefreshCw,
  Star,
  User,
  ArrowLeft,
  Home,
  Package,
  Clock,
  Download,
  FileText,
  Loader2,
  Truck,
  Boxes,
  Camera,
  Activity,
  Plus,
  ChevronRight,
  MapPin,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Timer,
  Sparkles,
  Shield,
  Wrench,
  PlayCircle,
  ShoppingCart,
  FileBarChart,
  Share2,
  History,
  Users,
} from "lucide-react";

const SERVICE_TYPE_LABELS: Record<string, string> = {
  junk_removal: "Junk Removal",
  furniture_moving: "Furniture Moving",
  garage_cleanout: "Garage Cleanout",
  estate_cleanout: "Estate Cleanout",
  truck_unloading: "Truck Unloading",
  moving_labor: "Moving Labor",
  pressure_washing: "Pressure Washing",
  gutter_cleaning: "Gutter Cleaning",
  light_demolition: "Light Demolition",
  home_consultation: "Home Consultation",
  hvac: "HVAC",
  cleaning: "Cleaning",
  home_cleaning: "Home Cleaning",
  pool_cleaning: "Pool Cleaning",
  carpet_cleaning: "Carpet Cleaning",
  landscaping: "Landscaping",
  handyman: "Handyman Services",
  demolition: "Light Demolition",
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2 }> = {
  completed: { label: "Completed", variant: "default", icon: CheckCircle2 },
  in_progress: { label: "In Progress", variant: "secondary", icon: Activity },
  working: { label: "In Progress", variant: "secondary", icon: Activity },
  en_route: { label: "En Route", variant: "secondary", icon: Truck },
  arrived: { label: "On Site", variant: "secondary", icon: MapPin },
  accepted: { label: "Accepted", variant: "secondary", icon: Timer },
  assigned: { label: "Assigned", variant: "secondary", icon: Timer },
  pending: { label: "Pending", variant: "outline", icon: Clock },
  draft: { label: "Draft", variant: "outline", icon: FileText },
  cancelled: { label: "Cancelled", variant: "destructive", icon: AlertCircle },
};

interface InventoryResponse {
  items: HomeInventory[];
  totalValue: number;
  itemCount: number;
}

interface HaulerProfileData {
  companyName: string;
  rating: number | null;
  jobsCompleted: number | null;
  bio: string | null;
  funFact: string | null;
  videoIntroUrl: string | null;
  safetyCode: string | null;
  phone: string | null;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr || dateStr === "asap" || dateStr === "ASAP") return "";
  try {
    const d = new Date(dateStr);
    if (!d || isNaN(d.getTime()) || d.toString() === "Invalid Date") return "";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

function InventoryItemCard({ item }: { item: HomeInventory }) {
  const verifiedDate = item.verifiedAt
    ? new Date(item.verifiedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : null;

  return (
    <div className="rounded-md border border-border bg-muted/30" data-testid={`card-inventory-item-${item.id}`}>
      {item.photoUrl ? (
        <div className="aspect-square bg-muted relative overflow-hidden">
          <img src={item.photoUrl} alt={item.itemName} className="w-full h-full object-cover" />
          {item.condition && (
            <Badge variant="secondary" className="absolute top-2 right-2 text-[10px] capitalize">
              {item.condition.replace("_", " ")}
            </Badge>
          )}
        </div>
      ) : (
        <div className="aspect-square bg-muted flex items-center justify-center">
          <Package className="w-8 h-8 text-muted-foreground" />
        </div>
      )}
      <div className="p-3">
        <p className="font-medium text-sm truncate" data-testid={`text-item-name-${item.id}`}>{item.itemName}</p>
        <div className="flex items-center justify-between gap-2 mt-1 flex-wrap">
          {item.brandDetected && (
            <p className="text-xs text-muted-foreground truncate">{item.brandDetected}</p>
          )}
          {item.estimatedValue && (
            <p className="text-xs font-bold text-primary" data-testid={`text-item-value-${item.id}`}>
              ${item.estimatedValue.toLocaleString()}
            </p>
          )}
        </div>
        {verifiedDate && (
          <p className="text-[10px] text-muted-foreground mt-1" data-testid={`text-item-verified-${item.id}`}>
            Verified {verifiedDate}
          </p>
        )}
      </div>
    </div>
  );
}

function JobHistoryRow({ job }: { job: ServiceRequest }) {
  const config = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
  const StatusIcon = config.icon;
  const isActive = ["en_route", "arrived", "working", "in_progress", "accepted", "assigned"].includes(job.status);
  const price = job.finalPrice || job.priceEstimate;

  return (
    <Card className={`p-4 ${isActive ? "border-primary/30" : ""}`} data-testid={`card-job-${job.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center shrink-0">
            <StatusIcon className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm" data-testid={`text-job-type-${job.id}`}>
                {SERVICE_TYPE_LABELS[job.serviceType] || job.serviceType}
              </p>
              <Badge variant={config.variant} className="text-[10px]" data-testid={`badge-job-status-${job.id}`}>
                {config.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5" data-testid={`text-job-address-${job.id}`}>
              {job.pickupAddress}
            </p>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
              {job.scheduledFor && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(job.scheduledFor)}
                </span>
              )}
              {price && (
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <DollarSign className="w-3 h-3" />
                  ${price.toFixed(0)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {job.status === "completed" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                const receiptData = {
                  jobId: job.id,
                  service: SERVICE_TYPE_LABELS[job.serviceType] || job.serviceType,
                  address: job.pickupAddress,
                  date: job.completedAt || job.scheduledFor,
                  amount: price,
                };
                const blob = new Blob(
                  [
                    `UpTend TAX RECEIPT\n${"=".repeat(40)}\n\nReceipt #: ${receiptData.jobId}\nService: ${receiptData.service}\nAddress: ${receiptData.address}\nDate: ${formatDate(receiptData.date)}\nAmount Paid: $${(receiptData.amount || 0).toFixed(2)}\n\n${"=".repeat(40)}\nUpTend Inc.\nwww.uptendapp.com\n\nThis receipt may be used for tax purposes.\nRetain for your records.\n`,
                  ],
                  { type: "text/plain" }
                );
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `upyck-receipt-${job.id.slice(0, 8)}.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              data-testid={`button-download-receipt-${job.id}`}
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
          {isActive && (
            <Link href={`/track/${job.id}`}>
              <Button variant="outline" size="sm" data-testid={`button-track-job-${job.id}`}>
                Track
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}

const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string; Icon: typeof CheckCircle2 }> = {
  service: { label: "Service", color: "text-green-400", Icon: CheckCircle2 },
  appliance: { label: "Appliance", color: "text-blue-400", Icon: Boxes },
  warranty: { label: "Warranty", color: "text-yellow-400", Icon: Shield },
  scan: { label: "Home DNA Scan", color: "text-purple-400", Icon: Activity },
  diy: { label: "DIY Repair", color: "text-orange-400", Icon: Wrench },
  maintenance: { label: "Maintenance", color: "text-cyan-400", Icon: Clock },
  reminder: { label: "Reminder", color: "text-pink-400", Icon: AlertCircle },
  inventory: { label: "Inventory", color: "text-emerald-400", Icon: Package },
};

function HomeReportSection({ userId }: { userId: string }) {
  const [filter, setFilter] = useState<string>("all");
  const { data: reportData, isLoading } = useQuery<{ events: any[]; summary: any }>({
    queryKey: ["/api/home-report"],
    enabled: !!userId,
  });

  const events = reportData?.events || [];
  const summary = reportData?.summary || {};
  const filteredEvents = filter === "all" ? events : events.filter(e => e.type === filter);

  const filterOptions = [
    { key: "all", label: "All" },
    { key: "service", label: "Services" },
    { key: "appliance", label: "Appliances" },
    { key: "warranty", label: "Warranties" },
    { key: "scan", label: "Scans" },
    { key: "diy", label: "DIY" },
    { key: "maintenance", label: "Maintenance" },
    { key: "inventory", label: "Inventory" },
    { key: "reminder", label: "Reminders" },
  ];

  return (
    <Card className="mb-6" data-testid="card-home-report">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Home Report</CardTitle>
            {events.length > 0 && (
              <Badge variant="secondary" className="text-[10px]">{events.length} events</Badge>
            )}
          </div>
          <p className="text-xs text-white/60 mt-1">Complete history of your home — like Carfax, but for houses.</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => console.log("Download full home report")} data-testid="button-download-home-report">
            <Download className="w-4 h-4 mr-1" /> Download
          </Button>
          <Button variant="ghost" size="sm" onClick={() => console.log("Share home report")} data-testid="button-share-home-report">
            <Share2 className="w-4 h-4 mr-1" /> Share
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary stats row */}
        {events.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-4" data-testid="home-report-summary">
            {summary.totalServices > 0 && (
              <div className="text-center p-2 rounded-md bg-green-500/10 border border-green-500/20">
                <p className="text-lg font-bold text-green-400">{summary.totalServices}</p>
                <p className="text-[10px] text-white/50">Services</p>
              </div>
            )}
            {summary.totalAppliances > 0 && (
              <div className="text-center p-2 rounded-md bg-blue-500/10 border border-blue-500/20">
                <p className="text-lg font-bold text-blue-400">{summary.totalAppliances}</p>
                <p className="text-[10px] text-white/50">Appliances</p>
              </div>
            )}
            {summary.totalWarranties > 0 && (
              <div className="text-center p-2 rounded-md bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-lg font-bold text-yellow-400">{summary.totalWarranties}</p>
                <p className="text-[10px] text-white/50">Warranties</p>
              </div>
            )}
            {summary.totalDIY > 0 && (
              <div className="text-center p-2 rounded-md bg-orange-500/10 border border-orange-500/20">
                <p className="text-lg font-bold text-orange-400">{summary.totalDIY}</p>
                <p className="text-[10px] text-white/50">DIY Repairs</p>
              </div>
            )}
            {summary.totalInventory > 0 && (
              <div className="text-center p-2 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-lg font-bold text-emerald-400">{summary.totalInventory}</p>
                <p className="text-[10px] text-white/50">Items</p>
              </div>
            )}
            {summary.totalScans > 0 && (
              <div className="text-center p-2 rounded-md bg-purple-500/10 border border-purple-500/20">
                <p className="text-lg font-bold text-purple-400">{summary.totalScans}</p>
                <p className="text-[10px] text-white/50">Scans</p>
              </div>
            )}
            {summary.totalMaintenance > 0 && (
              <div className="text-center p-2 rounded-md bg-cyan-500/10 border border-cyan-500/20">
                <p className="text-lg font-bold text-cyan-400">{summary.totalMaintenance}</p>
                <p className="text-[10px] text-white/50">Maintenance</p>
              </div>
            )}
            {summary.upcomingReminders > 0 && (
              <div className="text-center p-2 rounded-md bg-pink-500/10 border border-pink-500/20">
                <p className="text-lg font-bold text-pink-400">{summary.upcomingReminders}</p>
                <p className="text-[10px] text-white/50">Reminders</p>
              </div>
            )}
          </div>
        )}

        {/* Filter tabs */}
        {events.length > 0 && (
          <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1 scrollbar-hide">
            {filterOptions.map((f) => (
              <Button
                key={f.key}
                variant={filter === f.key ? "secondary" : "ghost"}
                size="sm"
                className={`text-[11px] shrink-0 ${filter !== f.key ? "text-white/50" : ""}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="relative pl-6 space-y-4" data-testid="timeline-home-report">
            <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-primary/30" />
            {filteredEvents.slice(0, 50).map((event: any) => {
              const config = EVENT_TYPE_CONFIG[event.type] || EVENT_TYPE_CONFIG.service;
              const EventIcon = config.Icon;
              return (
                <div key={`${event.type}-${event.id}`} className="relative flex items-start gap-3" data-testid={`timeline-entry-${event.type}-${event.id}`}>
                  <div className={`absolute -left-6 top-1 w-[18px] h-[18px] rounded-full bg-muted border-2 border-primary/50 flex items-center justify-center`}>
                    <EventIcon className={`w-3 h-3 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {event.type === "service" ? (SERVICE_TYPE_LABELS[event.title] || event.title) : event.title}
                        </p>
                        <Badge variant="outline" className={`text-[9px] shrink-0 ${config.color} border-current/30`}>
                          {config.label}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-white/50 shrink-0">
                        {event.date ? formatDate(event.date) : ""}
                      </span>
                    </div>
                    <p className="text-xs text-white/60 truncate">{event.description}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-white/50">
                      {event.cost != null && <span className="font-medium text-white/70">${Number(event.cost).toFixed(0)}</span>}
                      {event.value != null && <span className="font-medium text-white/70">Value: ${Number(event.value).toLocaleString()}</span>}
                      {event.status && event.status !== "completed" && (
                        <Badge variant="outline" className="text-[9px]">{event.status}</Badge>
                      )}
                      {event.isUpcoming && (
                        <Badge variant="secondary" className="text-[9px]">Upcoming</Badge>
                      )}
                      {event.warrantyExpiry && (
                        <span className="text-[10px]">Warranty: {formatDate(event.warrantyExpiry)}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6" data-testid="empty-home-report">
            <History className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-1">Your home report is empty</p>
            <p className="text-xs text-muted-foreground mb-4">Book a service, register an appliance, or run an Home DNA Scan to start building your home&apos;s history.</p>
            <Link href="/book">
              <Button size="sm" data-testid="button-book-first-service">
                <Plus className="w-3 h-3 mr-1" /> Book a Service
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Florida Seasonal Calendar (client-side mirror) ───
const FL_MONTHLY_RECS: Record<number, { service: string; serviceType: string; reason: string }[]> = {
  0: [{ service: "HVAC Inspection", serviceType: "hvac", reason: "Annual heating check before cold snaps" }],
  1: [{ service: "Pressure Washing", serviceType: "pressure_washing", reason: "Remove winter mildew before spring" }],
  2: [{ service: "AC Maintenance", serviceType: "hvac", reason: "Service AC before Florida heat kicks in" }],
  3: [{ service: "Pool Cleaning", serviceType: "pool_cleaning", reason: "Pool season starting — get it swim-ready" }],
  4: [{ service: "Gutter Cleaning", serviceType: "gutter_cleaning", reason: "Clear gutters before summer rainy season" }],
  5: [{ service: "Hurricane Prep", serviceType: "handyman", reason: "Hurricane season — check shutters, trim trees" }],
  6: [{ service: "Pest Control", serviceType: "pest_control", reason: "Summer pests at peak — quarterly treatment" }],
  7: [{ service: "Hurricane Prep Check", serviceType: "handyman", reason: "Peak hurricane season — verify storm readiness" }],
  8: [{ service: "Hurricane Prep", serviceType: "handyman", reason: "Peak hurricane month — final storm prep" }],
  9: [{ service: "Gutter Cleaning", serviceType: "gutter_cleaning", reason: "Clear fall debris before winter rains" }],
  10: [{ service: "Gutter Cleaning", serviceType: "gutter_cleaning", reason: "Final leaf cleanup before holidays" }],
  11: [{ service: "Home Cleaning", serviceType: "home_cleaning", reason: "Holiday deep clean" }],
};

function getNextRecommendation(completedJobs: ServiceRequest[]): { service: string; reason: string } | null {
  const now = new Date();
  const recentTypes = new Set(
    completedJobs
      .filter((j) => {
        const d = j.completedAt ? new Date(j.completedAt) : null;
        return d && (now.getTime() - d.getTime()) < 60 * 24 * 60 * 60 * 1000;
      })
      .map((j) => j.serviceType)
  );
  for (let offset = 0; offset <= 2; offset++) {
    const month = (now.getMonth() + offset) % 12;
    const recs = FL_MONTHLY_RECS[month] || [];
    for (const rec of recs) {
      if (!recentTypes.has(rec.serviceType)) return rec;
    }
  }
  return null;
}

function computeHealthScore(completedJobs: ServiceRequest[]): number {
  if (completedJobs.length === 0) return 0;
  const now = Date.now();
  // Recency (0-40)
  const sorted = [...completedJobs].sort(
    (a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime()
  );
  const lastDate = new Date(sorted[0].completedAt || sorted[0].createdAt).getTime();
  const daysSince = (now - lastDate) / (1000 * 60 * 60 * 24);
  let recency = daysSince <= 30 ? 40 : daysSince <= 60 ? 32 : daysSince <= 90 ? 24 : daysSince <= 120 ? 16 : daysSince <= 180 ? 8 : 0;
  // Diversity (0-30)
  const uniqueTypes = new Set(completedJobs.map((j) => j.serviceType)).size;
  const diversity = Math.min(uniqueTypes * 5, 30);
  // Seasonal (0-30) — how many upcoming months' recs are covered recently
  const recentTypes = new Set(
    completedJobs
      .filter((j) => {
        const d = j.completedAt ? new Date(j.completedAt) : null;
        return d && (now - d.getTime()) < 90 * 24 * 60 * 60 * 1000;
      })
      .map((j) => j.serviceType)
  );
  const currentMonth = new Date().getMonth();
  let totalRecs = 0;
  let covered = 0;
  for (let offset = 0; offset <= 2; offset++) {
    const recs = FL_MONTHLY_RECS[(currentMonth + offset) % 12] || [];
    for (const rec of recs) {
      totalRecs++;
      if (recentTypes.has(rec.serviceType)) covered++;
    }
  }
  const seasonal = totalRecs > 0 ? Math.round((covered / totalRecs) * 30) : 0;
  return Math.min(recency + diversity + seasonal, 100);
}

function HealthScoreRing({ score }: { score: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score > 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative w-24 h-24">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" className="text-muted/30" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}

function MyHomeSection({ jobs, user }: { jobs: ServiceRequest[]; user: { firstName?: string | null; createdAt?: string } }) {
  const completedJobs = useMemo(() => jobs.filter((j) => j.status === "completed"), [jobs]);
  const score = useMemo(() => computeHealthScore(completedJobs), [completedJobs]);
  const lastCompleted = useMemo(
    () => [...completedJobs].sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime())[0],
    [completedJobs]
  );
  const nextRec = useMemo(() => getNextRecommendation(completedJobs), [completedJobs]);
  const totalSpent = useMemo(() => completedJobs.reduce((s, j) => s + (j.finalPrice || j.priceEstimate || 0), 0), [completedJobs]);
  const address = lastCompleted?.pickupAddress || "No address on file";
  const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—";

  return (
    <Card className="mb-6 overflow-hidden" data-testid="card-my-home">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">My Home</CardTitle>
          </div>
          <Link href="/my-properties">
            <span className="text-xs text-primary hover:underline cursor-pointer flex items-center gap-1">
              <Users className="w-3 h-3" /> My Properties
            </span>
          </Link>
        </div>
        <p className="text-xs text-white/50 flex items-center gap-1 mt-1">
          <MapPin className="w-3 h-3" /> {address}
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6 mb-4">
          <HealthScoreRing score={score} />
          <div className="flex-1 space-y-1.5">
            <p className="text-xs text-white/50 uppercase tracking-wide">Home Health Score</p>
            {lastCompleted && (
              <p className="text-sm text-white/80">
                Last: <span className="font-medium text-white">{SERVICE_TYPE_LABELS[lastCompleted.serviceType] || lastCompleted.serviceType}</span>
                {" · "}{formatDate(lastCompleted.completedAt || lastCompleted.createdAt)}
              </p>
            )}
            {nextRec && (
              <p className="text-xs text-amber-400">
                ⚡ {nextRec.service} — {nextRec.reason}
              </p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 rounded-md bg-muted/30">
            <p className="text-lg font-bold text-white">${totalSpent.toFixed(0)}</p>
            <p className="text-[10px] text-white/50">Total Spent</p>
          </div>
          <div className="text-center p-2 rounded-md bg-muted/30">
            <p className="text-lg font-bold text-white">{completedJobs.length}</p>
            <p className="text-[10px] text-white/50">Jobs Done</p>
          </div>
          <div className="text-center p-2 rounded-md bg-muted/30">
            <p className="text-lg font-bold text-white">{memberSince}</p>
            <p className="text-[10px] text-white/50">Member Since</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RebookCard({ job }: { job: ServiceRequest }) {
  const { data: haulerProfile } = useQuery<HaulerProfileData>({
    queryKey: [`/api/haulers/${job.assignedHaulerId}/profile`],
    enabled: !!job.assignedHaulerId,
  });
  const serviceLabel = SERVICE_TYPE_LABELS[job.serviceType] || job.serviceType;
  const price = job.finalPrice || job.priceEstimate;
  const proName = haulerProfile?.companyName?.split(" ")[0] || "Your Pro";
  const rating = haulerProfile?.rating || 5.0;

  return (
    <Card className="p-4 border-primary/20" data-testid={`card-rebook-${job.id}`}>
      <p className="text-sm font-semibold mb-1">Rebook {serviceLabel}?</p>
      <p className="text-xs text-white/60 mb-3">Same pro, same quality.</p>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">{proName}</p>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-xs text-white/70">{rating.toFixed(1)}</span>
            </div>
          </div>
        </div>
        {price && <p className="text-sm font-bold">${price.toFixed(0)}</p>}
      </div>
      <Link
        href={`/book?service=${encodeURIComponent(job.serviceType)}&address=${encodeURIComponent(job.pickupAddress)}&rebook=1`}
      >
        <Button size="sm" className="w-full" data-testid={`button-rebook-${job.id}`}>
          <RefreshCw className="w-3 h-3 mr-1" /> Rebook Now
        </Button>
      </Link>
    </Card>
  );
}

function RebookSection({ completedJobs }: { completedJobs: ServiceRequest[] }) {
  // Show top 3 most recent completed jobs
  const recentJobs = useMemo(
    () =>
      [...completedJobs]
        .sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime())
        .slice(0, 3),
    [completedJobs]
  );

  if (recentJobs.length === 0) return null;

  return (
    <div className="mb-6" data-testid="section-rebook">
      <div className="flex items-center gap-2 mb-3">
        <RefreshCw className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-white">Quick Rebook</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {recentJobs.map((job) => (
          <RebookCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}

function ActiveJobWithWorker({ job }: { job: ServiceRequest }) {
  const { data: haulerProfile } = useQuery<HaulerProfileData>({
    queryKey: [`/api/haulers/${job.assignedHaulerId}/profile`],
    enabled: !!job.assignedHaulerId,
  });

  return (
    <div className="space-y-3" data-testid="section-active-job">
      <JobHistoryRow job={job} />
      {haulerProfile && (
        <WorkerIdCard
          worker={{
            name: haulerProfile.companyName || "Your Pro",
            rating: haulerProfile.rating || 5.0,
            jobs: haulerProfile.jobsCompleted || 0,
            bio: haulerProfile.bio,
            funFact: haulerProfile.funFact,
            videoIntroUrl: haulerProfile.videoIntroUrl,
            safetyCode: haulerProfile.safetyCode || undefined,
          }}
        />
      )}

      {/* Show verification confirmation for applicable service types */}
      {job.serviceType && ["junk_removal", "garage_cleanout", "light_demolition"].includes(job.serviceType) && (
        <CustomerConfirmation jobId={job.id} />
      )}
    </div>
  );
}

export default function CustomerDashboard() {
  const { t } = useTranslation();
  usePageTitle("Dashboard | UpTend");
  const { user, isLoading: authLoading } = useAuth();
  const [historyFilter, setHistoryFilter] = useState<"all" | "active" | "completed">("all");

  const { data: jobs, isLoading: jobsLoading } = useQuery<ServiceRequest[]>({
    queryKey: ["/api/my-jobs"],
    enabled: !!user,
  });

  const { data: inventoryData, isLoading: inventoryLoading } = useQuery<InventoryResponse>({
    queryKey: ["/api/inventory"],
    enabled: !!user,
  });

  const activeStatuses = ["en_route", "arrived", "working", "in_progress", "accepted", "assigned"];
  const activeJobs = jobs?.filter((j) => activeStatuses.includes(j.status)) || [];
  const completedJobs = jobs?.filter((j) => j.status === "completed") || [];
  const allJobs = jobs || [];

  const filteredJobs =
    historyFilter === "active"
      ? activeJobs
      : historyFilter === "completed"
        ? completedJobs
        : allJobs;

  const inventoryItems = inventoryData?.items || [];
  const totalAssetValue = inventoryData?.totalValue || 0;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#3B1D5A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#3B1D5A] flex flex-col items-center justify-center px-4">
        <Card className="w-full max-w-md p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">{t("dashboard.sign_in_required")}</h1>
          <p className="text-muted-foreground mb-6">{t("dashboard.sign_in_desc")}</p>
          <Link href="/login">
            <Button className="w-full" data-testid="button-go-to-login">{t("common.sign_in")}</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="page-customer-dashboard">
      <Header />

      <main className="max-w-4xl mx-auto px-4 pb-24 pt-6">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Home className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold text-white" data-testid="text-dashboard-title">{t("dashboard.home_os")}</h1>
          </div>
          <p className="text-white/60 text-sm" data-testid="text-dashboard-subtitle">
            {t("dashboard.welcome_back", { name: user.firstName || t("dashboard.there") })}
          </p>
        </div>

        {/* My Home Dashboard */}
        <MyHomeSection jobs={allJobs} user={user} />

        {/* One-Tap Rebooking */}
        <RebookSection completedJobs={completedJobs} />

        <div className="mb-6" data-testid="card-home-score-section">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-white">{t("dashboard.home_score")}</h2>
            </div>
            <Badge variant="secondary" className="text-[10px]">BETA</Badge>
          </div>
          <HomeDnaScoreWidget />
        </div>

        {/* Home Report — Carfax for Homes */}
        <HomeReportSection userId={user.id} />

        <div className="mb-6">
          <ImpactTracker />
        </div>

        <div className="mb-6">
          <ReferralWidget />
        </div>

        {/* Mr. George Can Help */}
        <div className="mb-6" data-testid="section-mr-george">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-white">{t("dashboard.george_help")}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {([
              { href: "/ai", icon: Wrench, label: "DIY Repair Help", desc: "Step-by-step repair guides" },
              { href: "/ai", icon: PlayCircle, label: "Video Tutorials", desc: "Watch how-to videos in the app" },
              { href: "/ai", icon: ShoppingCart, label: "Smart Shopping", desc: "Find parts at the best prices" },
              { href: "/ai/photo-quote", icon: Camera, label: "Photo Quote", desc: "Snap a photo, get an instant quote" },
              { href: "/ai", icon: Activity, label: "Home DNA Scan", desc: "Free AI health check for your home" },
              { href: "/ai/documents", icon: FileText, label: "Doc Scanner", desc: "Scan receipts, warranties, manuals" },
            ] as const).map((item) => (
              <Link key={item.label} href={item.href}>
                <Card className="p-3 text-center hover:border-primary/50 transition-colors cursor-pointer h-full" data-testid={`card-mr-george-${item.label.toLowerCase().replace(/\s+/g, "-")}`}>
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-xs font-medium">{item.label}</p>
                  <p className="text-[10px] text-white/50 mt-0.5">{item.desc}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        <Card className="mb-6" data-testid="card-subscriptions">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">{t("dashboard.my_subscriptions")}</CardTitle>
            </div>
            <Link href="/subscriptions">
              <Button variant="ghost" size="icon" data-testid="button-view-subscriptions">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-3">
                {t("dashboard.manage_plans")}
              </p>
              <Link href="/subscriptions">
                <Button variant="outline" size="sm">
                  {t("dashboard.view_subscriptions")}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6" data-testid="card-digital-inventory">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Boxes className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">{t("dashboard.digital_inventory")}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {totalAssetValue > 0 && (
                <Badge variant="outline" className="text-xs" data-testid="badge-total-asset-value">
                  ${totalAssetValue.toLocaleString()} total value
                </Badge>
              )}
              <Link href="/my-home">
                <Button variant="ghost" size="icon" data-testid="button-view-full-inventory">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {inventoryLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : inventoryItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" data-testid="grid-inventory-items">
                {inventoryItems.slice(0, 8).map((item) => (
                  <InventoryItemCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8" data-testid="empty-inventory">
                <Camera className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-1">{t("dashboard.no_items")}</p>
                <p className="text-xs text-muted-foreground mb-4">
                  {t("dashboard.items_auto")}
                </p>
                <Link href="/my-home">
                  <Button variant="outline" size="sm" data-testid="button-scan-items">
                    <Plus className="w-3 h-3 mr-1" />
                    Scan Items
                  </Button>
                </Link>
              </div>
            )}
            {inventoryItems.length > 8 && (
              <div className="mt-4 text-center">
                <Link href="/my-home">
                  <Button variant="outline" size="sm" data-testid="button-view-all-items">
                    View All {inventoryItems.length} Items
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {activeJobs.length > 0 && (
          <div className="mb-6" data-testid="section-active-jobs">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-white">{t("dashboard.active_jobs")}</h2>
              <Badge variant="secondary" className="text-xs" data-testid="badge-active-count">
                {activeJobs.length}
              </Badge>
            </div>
            <div className="space-y-3">
              {activeJobs.map((job) => (
                <ActiveJobWithWorker key={job.id} job={job} />
              ))}
            </div>
          </div>
        )}

        <div data-testid="section-job-history">
          <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-white">{t("dashboard.job_history")}</h2>
            </div>
            <div className="flex items-center gap-1">
              {(["all", "active", "completed"] as const).map((f) => (
                <Button
                  key={f}
                  variant={historyFilter === f ? "secondary" : "ghost"}
                  size="sm"
                  className={historyFilter !== f ? "text-white/60" : ""}
                  onClick={() => setHistoryFilter(f)}
                  data-testid={`button-filter-${f}`}
                >
                  {f === "all" ? "All" : f === "active" ? "Active" : "Completed"}
                </Button>
              ))}
            </div>
          </div>

          {jobsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredJobs.length > 0 ? (
            <div className="space-y-3">
              {filteredJobs
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((job) => (
                  <div key={job.id} className="space-y-2">
                    <JobHistoryRow job={job} />
                    {job.status === "completed" && (
                      <ReviewForm serviceRequestId={job.id} />
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <Card className="p-8 text-center" data-testid="empty-job-history">
              <Truck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-1">
                {historyFilter === "all"
                  ? t("dashboard.no_jobs")
                  : historyFilter === "active"
                    ? t("dashboard.no_active")
                    : t("dashboard.no_completed")}
              </p>
              <p className="text-xs text-muted-foreground mb-4">{t("dashboard.book_first")}</p>
              <Link href="/book">
                <Button size="sm" data-testid="button-book-service">
                  <Plus className="w-3 h-3 mr-1" />
                  Book a Service
                </Button>
              </Link>
            </Card>
          )}
        </div>

        {/* Claims Section */}
        <div className="mb-6" data-testid="section-claims">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-white">{t("dashboard.liability_claims")}</h2>
          </div>
          <Card>
            <CardContent className="p-0">
              <CustomerClaimsSection customerId={user.id} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
