/**
 * Job Detail Page
 * Full job view with tracker, details, pricing, and review.
 */

import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, ShieldCheck, Star, MapPin, Calendar, DollarSign } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { JobTracker } from "@/components/job-tracker";
import { useAuth } from "@/hooks/use-auth";

interface JobStatus {
  jobId: string;
  status: string;
  serviceType: string;
  description: string;
  scheduledFor: string;
  priceEstimate: number;
  guaranteedCeiling: number;
  finalPrice: number;
  priceProtected: boolean;
  timeline: { event: string; timestamp: string }[];
  proInfo: { firstName: string; rating: number; verified: boolean } | null;
  customerInfo: { firstName: string; address: string | null; proWillReceive: number } | null;
  scopeChange: any;
  address: string;
  bookingSource: string;
}

const SERVICE_LABELS: Record<string, string> = {
  junk_removal: "Junk Removal",
  home_cleaning: "Home Cleaning",
  carpet_cleaning: "Carpet Cleaning",
  pressure_washing: "Pressure Washing",
  landscaping: "Landscaping",
  pool_cleaning: "Pool Cleaning",
  handyman: "Handyman",
  gutter_cleaning: "Gutter Cleaning",
  moving_labor: "Moving Labor",
  garage_cleanout: "Garage Cleanout",
  light_demolition: "Light Demolition",
  home_consultation: "Home Consultation",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const { user } = useAuth();

  const { data: job, isLoading, error } = useQuery<JobStatus>({
    queryKey: [`/api/jobs/${jobId}/status`],
    enabled: !!jobId,
    refetchInterval: 15000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#ea580c]" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-6 max-w-md text-center">
          <p className="font-bold text-lg mb-2">Job Not Found</p>
          <p className="text-muted-foreground mb-4">This job does not exist or you do not have access.</p>
          <Link href="/my-jobs">
            <Button>Back to My Jobs</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const userId = (user as any)?.userId || (user as any)?.id;
  const isCustomer = !job.customerInfo;

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="w-10 h-10" textClassName="text-xl" />
          </Link>
          <Link href="/my-jobs">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              My Jobs
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">
            {SERVICE_LABELS[job.serviceType] || job.serviceType.replace(/_/g, " ")}
          </h1>
          <Badge
            className={
              job.status === "completed" ? "bg-green-100 text-green-800" :
              job.status === "cancelled" ? "bg-red-100 text-red-800" :
              job.status === "in_progress" ? "bg-blue-100 text-blue-800" :
              "bg-amber-100 text-amber-800"
            }
          >
            {job.status.replace(/_/g, " ")}
          </Badge>
        </div>

        {/* Job Tracker */}
        <JobTracker
          jobId={job.jobId}
          status={job.status}
          timeline={job.timeline}
          scopeChange={job.scopeChange}
          priceProtected={job.priceProtected}
          guaranteedCeiling={job.guaranteedCeiling}
          isCustomer={isCustomer}
        />

        {/* Job Details */}
        <Card className="p-5">
          <h3 className="font-bold text-slate-800 mb-3">Job Details</h3>
          <div className="space-y-3 text-sm">
            {job.description && (
              <p className="text-muted-foreground">{job.description}</p>
            )}
            {job.address && (
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-4 h-4 text-[#ea580c] shrink-0" />
                <span>{job.address}</span>
              </div>
            )}
            {job.scheduledFor && (
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="w-4 h-4 text-[#ea580c] shrink-0" />
                <span>{formatDate(job.scheduledFor)}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Pro Info (customer view) */}
        {isCustomer && job.proInfo && (
          <Card className="p-5">
            <h3 className="font-bold text-slate-800 mb-3">Your Pro</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-[#ea580c] font-bold text-lg">
                {job.proInfo.firstName.charAt(0)}
              </div>
              <div>
                <p className="font-bold">{job.proInfo.firstName}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>{job.proInfo.rating.toFixed(1)}</span>
                  {job.proInfo.verified && (
                    <Badge variant="outline" className="text-xs py-0">
                      <ShieldCheck className="w-3 h-3 mr-1 text-green-500" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Pricing */}
        <Card className="p-5">
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#ea580c]" />
            Pricing
          </h3>
          <div className="space-y-2 text-sm">
            {job.priceEstimate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quoted Price</span>
                <span className="font-medium">${job.priceEstimate.toFixed(2)}</span>
              </div>
            )}
            {job.finalPrice && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Final Price</span>
                <span className="font-bold">${job.finalPrice.toFixed(2)}</span>
              </div>
            )}
            {job.priceProtected && job.guaranteedCeiling && (
              <div className="flex items-center gap-2 mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">Price Protection</p>
                  <p className="text-xs text-green-600">Maximum: ${job.guaranteedCeiling.toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Review section for completed jobs */}
        {job.status === "completed" && isCustomer && (
          <Card className="p-5 border-amber-200 bg-amber-50/30">
            <h3 className="font-bold text-slate-800 mb-2">How was your experience?</h3>
            <p className="text-sm text-muted-foreground mb-3">Leave a review for {job.proInfo?.firstName || "your pro"}.</p>
            <Link href={`/track/${job.jobId}`}>
              <Button className="bg-[#ea580c] hover:bg-[#c2410c] text-white">
                Leave a Review
              </Button>
            </Link>
          </Card>
        )}
      </main>
    </div>
  );
}
