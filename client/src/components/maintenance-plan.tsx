import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Wrench, ArrowRight, CalendarClock, X, Loader2 } from "lucide-react";

interface DeferredJob {
  id: string;
  title: string;
  estimatedPrice: number | null;
  reasonForDeferral: string | null;
  status: string | null;
  photoUrl: string | null;
  nudgeCount: number | null;
  createdAt: string | null;
}

export function MaintenancePlan() {
  const { toast } = useToast();
  const { data: jobs, isLoading } = useQuery<DeferredJob[]>({
    queryKey: ["/api/deferred-jobs"],
  });

  const convertMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/deferred-jobs/${id}/convert`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deferred-jobs"] });
      toast({ title: "Job Booked", description: "This maintenance task has been converted to a booking." });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/deferred-jobs/${id}`, { status: "dismissed" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deferred-jobs"] });
    },
  });

  const pendingJobs = (jobs || []).filter((j) => j.status === "pending");

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (pendingJobs.length === 0) return null;

  return (
    <div className="space-y-4" data-testid="maintenance-plan">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">Recommended Action Plan</h3>
        </div>
        <Badge variant="secondary">
          <CalendarClock className="w-3 h-3 mr-1" />
          {pendingJobs.length} Pending
        </Badge>
      </div>

      <div className="grid gap-3">
        {pendingJobs.map((job) => (
          <Card key={job.id} data-testid={`card-deferred-job-${job.id}`}>
            <CardContent className="p-4 flex gap-4">
              <div className="w-16 h-16 bg-muted rounded-md shrink-0 overflow-hidden flex items-center justify-center">
                {job.photoUrl ? (
                  <img
                    src={job.photoUrl}
                    className="object-cover w-full h-full"
                    alt={job.title}
                  />
                ) : (
                  <Wrench className="w-6 h-6 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm">{job.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  From your home assessment.
                  {job.reasonForDeferral && ` Deferred: ${job.reasonForDeferral}`}
                </p>

                <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
                  <span className="font-bold text-green-700 dark:text-green-400">
                    ${((job.estimatedPrice || 0) / 100).toFixed(0)}
                  </span>

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => dismissMutation.mutate(job.id)}
                      disabled={dismissMutation.isPending}
                      data-testid={`button-dismiss-${job.id}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => convertMutation.mutate(job.id)}
                      disabled={convertMutation.isPending}
                      data-testid={`button-book-${job.id}`}
                    >
                      Book This
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
