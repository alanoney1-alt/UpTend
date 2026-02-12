import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { DwellScanWidget } from "@/components/dwellscan-widget";
import { ImpactWidget } from "@/components/dashboard/impact-widget";
import { ImpactTracker } from "@/components/dashboard/impact-tracker";
import { ReferralWidget } from "@/components/dashboard/referral-widget";
import { WorkerIdCard } from "@/components/safety/worker-id-card";
import { Header } from "@/components/landing/header";
import { CustomerConfirmation } from "@/components/verification/customer-confirmation";
import { ReviewForm } from "@/components/reviews/review-form";
import type { ServiceRequest, HomeInventory } from "@shared/schema";
import {
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
                    `UpTend TAX RECEIPT\n${"=".repeat(40)}\n\nReceipt #: ${receiptData.jobId}\nService: ${receiptData.service}\nAddress: ${receiptData.address}\nDate: ${formatDate(receiptData.date)}\nAmount Paid: $${(receiptData.amount || 0).toFixed(2)}\n\n${"=".repeat(40)}\nUpTend Inc.\nwww.uptend.app\n\nThis receipt may be used for tax purposes.\nRetain for your records.\n`,
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
          <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
          <p className="text-muted-foreground mb-6">Please sign in to access your Home OS dashboard.</p>
          <Link href="/login">
            <Button className="w-full" data-testid="button-go-to-login">Sign In</Button>
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
            <h1 className="text-2xl font-bold text-white" data-testid="text-dashboard-title">Home OS</h1>
          </div>
          <p className="text-white/60 text-sm" data-testid="text-dashboard-subtitle">
            Welcome back, {user.firstName || "there"}. Your home at a glance.
          </p>
        </div>

        <div className="mb-6" data-testid="card-home-score-section">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-white">UpTend Home Score</h2>
            </div>
            <Badge variant="secondary" className="text-[10px]">BETA</Badge>
          </div>
          <DwellScanWidget />
        </div>

        <div className="mb-6">
          <ImpactTracker />
        </div>

        <div className="mb-6">
          <ReferralWidget />
        </div>

        {/* AI Features Quick Access */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-white">AI Tools</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Link href="/ai/photo-quote">
              <Card className="p-3 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs font-medium">Photo Quote</p>
              </Card>
            </Link>
            <Link href="/ai/documents">
              <Card className="p-3 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs font-medium">Doc Scanner</p>
              </Card>
            </Link>
            <Link href="/ai">
              <Card className="p-3 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs font-medium">All AI</p>
              </Card>
            </Link>
          </div>
        </div>

        <Card className="mb-6" data-testid="card-subscriptions">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">My Subscriptions</CardTitle>
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
                Manage your recurring cleaning plans
              </p>
              <Link href="/subscriptions">
                <Button variant="outline" size="sm">
                  View All Subscriptions
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6" data-testid="card-digital-inventory">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Boxes className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">Digital Inventory</CardTitle>
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
                <p className="text-sm text-muted-foreground mb-1">No items scanned yet</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Items are auto-cataloged during service visits
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
              <h2 className="text-lg font-bold text-white">Active Jobs</h2>
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
              <h2 className="text-lg font-bold text-white">Job History</h2>
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
                  ? "No jobs yet"
                  : historyFilter === "active"
                    ? "No active jobs"
                    : "No completed jobs"}
              </p>
              <p className="text-xs text-muted-foreground mb-4">Book your first service to get started</p>
              <Link href="/book">
                <Button size="sm" data-testid="button-book-service">
                  <Plus className="w-3 h-3 mr-1" />
                  Book a Service
                </Button>
              </Link>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
