import { safeFetchJson } from "@/lib/queryClient";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { UniversalJobWizard } from "@/components/job-wizard/universal-job-wizard";
import { JobPhotos } from "@/components/pro/job-photos";
import { NoShowCheckin } from "@/components/pro/no-show-checkin";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import type { ServiceRequest, HaulerProfile } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function ActiveJob() {
  const { toast } = useToast();
  const [, params] = useRoute("/job/:jobId/work");
  const jobId = params?.jobId;
  const { user } = useAuth();

  const { data: job, isLoading } = useQuery<ServiceRequest>({
    queryKey: ["/api/service-requests", jobId],
    queryFn: () => safeFetchJson(`/api/service-requests/${jobId}`),
    enabled: !!jobId,
    refetchInterval: 5000,
  });

  const { data: haulerProfile } = useQuery<HaulerProfile>({
    queryKey: ["/api/haulers", user?.id, "profile"],
    queryFn: () => fetch(`/api/haulers/${user?.id}/profile`, { credentials: "include" }).then(r => {
      if (!r.ok) return null;
      return r.json();
    }),
    enabled: !!user?.id,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ status, data }: { status: string; data?: Record<string, unknown> }) => {
      return apiRequest("PATCH", `/api/service-requests/${jobId}/status`, { status, ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests", jobId] });
      queryClient.invalidateQueries({ queryKey: ["/api/haulers", "active-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests/pending"] });
    },
    onError: (err: Error) => { toast({ title: "Error", description: err.message, variant: "destructive" }); },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" data-testid="page-active-job-loading">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" data-testid="page-active-job-error">
        <p className="text-muted-foreground">Job not found.</p>
      </div>
    );
  }

  const wizardJob = {
    id: job.id,
    serviceType: job.serviceType,
    customerName: (job as any).customerName || "Customer",
    address: job.pickupAddress,
    city: job.pickupCity,
    zip: job.pickupZip,
    priceEstimate: job.priceEstimate ? Math.round(job.priceEstimate * 100) : undefined,
    status: job.status,
    safetyCode: haulerProfile?.safetyCode || undefined,
    accessType: job.accessType || undefined,
  };

  const showBeforePhotos = ["en_route", "arrived"].includes(job.status);
  const showAfterPhotos = ["working", "in_progress"].includes(job.status);

  return (
    <div className="min-h-screen flex flex-col bg-background" data-testid="page-active-job">
      {/* No-Show Check-in Banner */}
      <div className="px-4 pt-2">
        <NoShowCheckin jobId={job.id} jobStatus={job.status} />
      </div>

      {(showBeforePhotos || showAfterPhotos) && (
        <div className="p-4 space-y-3">
          {showBeforePhotos && <JobPhotos jobId={job.id} type="before" />}
          {showAfterPhotos && <JobPhotos jobId={job.id} type="after" />}
        </div>
      )}
      <UniversalJobWizard
        job={wizardJob}
        onUpdateStatus={(status, data) => {
          updateStatus.mutate({ status, data });
        }}
        isUpdating={updateStatus.isPending}
      />
    </div>
  );
}
