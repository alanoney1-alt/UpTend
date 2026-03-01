import { useState } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/landing/header";
import {
  Loader2, Package, ArrowRight, Clock, MapPin, Star, Eye,
  CalendarDays, RefreshCw, Pause, SkipForward, X, MessageSquare,
  CheckCircle2, AlertCircle, Timer, Repeat, ChevronRight
} from "lucide-react";
import { formatServiceType, safeFormatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

type Tab = "active" | "past" | "recurring";

const statusConfig: Record<string, { color: string; label: string; icon: typeof Clock }> = {
  matching: { color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40", label: "Finding Pro", icon: Timer },
  requested: { color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40", label: "Requested", icon: Timer },
  assigned: { color: "bg-blue-500/20 text-blue-300 border-blue-500/40", label: "Pro Assigned", icon: CheckCircle2 },
  accepted: { color: "bg-blue-500/20 text-blue-300 border-blue-500/40", label: "Pro Accepted", icon: CheckCircle2 },
  en_route: { color: "bg-purple-500/20 text-purple-300 border-purple-500/40", label: "Pro En Route", icon: MapPin },
  in_progress: { color: "bg-purple-500/20 text-purple-300 border-purple-500/40", label: "In Progress", icon: Package },
  completed: { color: "bg-green-500/20 text-green-300 border-green-500/40", label: "Completed", icon: CheckCircle2 },
  cancelled: { color: "bg-red-500/20 text-red-300 border-red-500/40", label: "Cancelled", icon: X },
};

const PROGRESS_STEPS = ["requested", "assigned", "en_route", "in_progress", "completed"];

export default function MyJobs() {
  usePageTitle("My Jobs | UpTend");
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("active");
  const queryClient = useQueryClient();

  const { data: jobs, isLoading } = useQuery<any[]>({
    queryKey: ["/api/my-jobs"],
    queryFn: () => fetch("/api/my-jobs").then(r => r.json()),
  });

  const { data: recurring } = useQuery<any[]>({
    queryKey: ["/api/scheduling/recurring"],
    queryFn: () => fetch("/api/scheduling/recurring").then(r => r.json()),
  });

  const recurringMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      apiRequest("PUT", `/api/scheduling/recurring/${id}`, { action }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/scheduling/recurring"] }),
  });

  const activeJobs = (jobs || []).filter((j: any) => !["completed", "cancelled"].includes(j.status));
  const pastJobs = (jobs || []).filter((j: any) => ["completed", "cancelled"].includes(j.status));

  const getProgressIndex = (status: string) => {
    const idx = PROGRESS_STEPS.indexOf(status);
    return idx >= 0 ? idx : 0;
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-32">
        <h1 className="text-2xl font-bold text-white mb-6">My Jobs</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-zinc-900 rounded-xl p-1">
          {([
            { key: "active" as Tab, label: "Active", count: activeJobs.length },
            { key: "past" as Tab, label: "Past", count: pastJobs.length },
            { key: "recurring" as Tab, label: "Recurring", count: (recurring || []).length },
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                tab === t.key ? "bg-[#F47C20] text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              {t.label} {t.count > 0 && <span className="ml-1 opacity-70">({t.count})</span>}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#F47C20]" />
          </div>
        )}

        {/* Active Jobs */}
        {tab === "active" && !isLoading && (
          <div className="space-y-4">
            {activeJobs.length === 0 ? (
              <Card className="bg-zinc-900 border-zinc-800 p-8 text-center">
                <Package className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400">No active jobs</p>
                <Button onClick={() => navigate("/book")} className="mt-4 bg-[#F47C20] hover:bg-[#F47C20]/90">
                  Book a Service
                </Button>
              </Card>
            ) : (
              activeJobs.map((job: any) => {
                const cfg = statusConfig[job.status] || statusConfig.matching;
                const progressIdx = getProgressIndex(job.status);
                return (
                  <Card key={job.id} className="bg-zinc-900 border-zinc-800 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-white font-semibold">{formatServiceType(job.serviceType || job.service_type)}</h3>
                        <p className="text-zinc-400 text-xs mt-1">
                          {safeFormatDate(job.scheduledDate || job.scheduled_date)} • {job.zipCode || job.zip_code}
                        </p>
                      </div>
                      <Badge className={`${cfg.color} border text-xs`}>{cfg.label}</Badge>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-1 mb-4">
                      {PROGRESS_STEPS.map((step, i) => (
                        <div key={step} className="flex-1 flex items-center">
                          <div className={`h-1.5 w-full rounded-full ${i <= progressIdx ? "bg-[#F47C20]" : "bg-zinc-800"}`} />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-500 mb-4">
                      <span>Requested</span><span>Assigned</span><span>En Route</span><span>Working</span><span>Done</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {["en_route", "in_progress"].includes(job.status) && (
                        <Button size="sm" onClick={() => navigate(`/jobs/${job.id}/track`)}
                          className="bg-[#F47C20] hover:bg-[#F47C20]/90 text-xs">
                          <Eye className="w-3 h-3 mr-1" /> View Live
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => navigate(`/jobs/${job.id}`)}
                        className="border-zinc-700 text-zinc-300 text-xs hover:bg-zinc-800">
                        Details <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* Past Jobs */}
        {tab === "past" && !isLoading && (
          <div className="space-y-3">
            {pastJobs.length === 0 ? (
              <Card className="bg-zinc-900 border-zinc-800 p-8 text-center">
                <p className="text-zinc-400">No past jobs yet</p>
              </Card>
            ) : (
              pastJobs.map((job: any) => (
                <Card key={job.id} className="bg-zinc-900 border-zinc-800 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium text-sm">{formatServiceType(job.serviceType || job.service_type)}</h3>
                      <p className="text-zinc-500 text-xs mt-1">{safeFormatDate(job.completedAt || job.completed_at || job.scheduledDate || job.scheduled_date)}</p>
                    </div>
                    <div className="text-right">
                      {job.totalAmount && <p className="text-white font-semibold">${(job.totalAmount / 100).toFixed(2)}</p>}
                      <div className="flex items-center gap-1 mt-1">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-3 h-3 ${s <= (job.rating || 0) ? "text-[#F47C20] fill-[#F47C20]" : "text-zinc-700"}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={() => navigate("/book")}
                      className="border-zinc-700 text-zinc-300 text-xs hover:bg-zinc-800">
                      <RefreshCw className="w-3 h-3 mr-1" /> Rebook
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/jobs/${job.id}`)}
                      className="border-zinc-700 text-zinc-300 text-xs hover:bg-zinc-800">
                      View <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Recurring Services */}
        {tab === "recurring" && (
          <div className="space-y-4">
            {(!recurring || recurring.length === 0) ? (
              <Card className="bg-zinc-900 border-zinc-800 p-8 text-center">
                <Repeat className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400">No recurring services</p>
                <p className="text-zinc-500 text-xs mt-1">Set it and forget it — schedule recurring maintenance and save</p>
                <Button onClick={() => navigate("/book")} className="mt-4 bg-[#F47C20] hover:bg-[#F47C20]/90">
                  Set Up Recurring
                </Button>
              </Card>
            ) : (
              recurring.map((svc: any) => (
                <Card key={svc.id} className="bg-zinc-900 border-zinc-800 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-white font-semibold text-sm">
                        {(svc.service_type || "").replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700 text-xs">{svc.frequency}</Badge>
                        {svc.discount_percent > 0 && (
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/40 text-xs">
                            {svc.discount_percent}% off
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge className={svc.status === "active" ? "bg-green-500/20 text-green-300 border-green-500/40" :
                      svc.status === "paused" ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/40" :
                      "bg-red-500/20 text-red-300 border-red-500/40"}>
                      {svc.status}
                    </Badge>
                  </div>

                  <div className="text-xs text-zinc-400 mb-3">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      Next: {svc.next_scheduled ? new Date(svc.next_scheduled).toLocaleDateString() : "TBD"}
                      {svc.preferred_day && ` • ${svc.preferred_day}`}
                      {svc.preferred_time_slot && ` • ${svc.preferred_time_slot}`}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {svc.status === "active" && (
                      <>
                        <Button size="sm" variant="outline"
                          onClick={() => recurringMutation.mutate({ id: svc.id, action: "skip" })}
                          className="border-zinc-700 text-zinc-300 text-xs hover:bg-zinc-800">
                          <SkipForward className="w-3 h-3 mr-1" /> Skip Next
                        </Button>
                        <Button size="sm" variant="outline"
                          onClick={() => recurringMutation.mutate({ id: svc.id, action: "pause" })}
                          className="border-zinc-700 text-zinc-300 text-xs hover:bg-zinc-800">
                          <Pause className="w-3 h-3 mr-1" /> Pause
                        </Button>
                      </>
                    )}
                    {svc.status === "paused" && (
                      <Button size="sm"
                        onClick={() => recurringMutation.mutate({ id: svc.id, action: "resume" })}
                        className="bg-[#F47C20] hover:bg-[#F47C20]/90 text-xs">
                        Resume
                      </Button>
                    )}
                    <Button size="sm" variant="outline"
                      onClick={() => recurringMutation.mutate({ id: svc.id, action: "cancel" })}
                      className="border-red-500/30 text-red-400 text-xs hover:bg-red-500/10">
                      <X className="w-3 h-3 mr-1" /> Cancel
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
