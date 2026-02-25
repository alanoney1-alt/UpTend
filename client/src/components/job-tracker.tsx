/**
 * Job Tracker Component
 * Real-time job status stepper (like Uber's ride tracker).
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, Loader2, X, ShieldCheck } from "lucide-react";

interface TimelineEvent {
  event: string;
  timestamp: string;
}

interface ScopeChange {
  pending: boolean;
  newPrice: number;
  description: string;
  photos: string[];
  requestedAt: string;
  approved: boolean | null;
}

interface JobTrackerProps {
  jobId: string;
  status: string;
  timeline: TimelineEvent[];
  scopeChange?: ScopeChange | null;
  priceProtected: boolean;
  guaranteedCeiling?: number;
  isCustomer: boolean;
}

const STEPS = [
  { key: "booked", label: "Booked", event: "booked" },
  { key: "accepted", label: "Pro Accepted", event: "accepted" },
  { key: "started", label: "In Progress", event: "started" },
  { key: "completed", label: "Complete", event: "completed" },
];

const STATUS_TO_STEP: Record<string, number> = {
  requested: 0,
  pending_acceptance: 0,
  accepted: 1,
  in_progress: 2,
  completed: 3,
  cancelled: -1,
};

function formatTimestamp(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function JobTracker({
  jobId,
  status,
  timeline,
  scopeChange,
  priceProtected,
  guaranteedCeiling,
  isCustomer,
}: JobTrackerProps) {
  const queryClient = useQueryClient();
  const currentStep = STATUS_TO_STEP[status] ?? 0;

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}/cancel`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      if (!res.ok) throw new Error("Failed to cancel");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}/status`] }),
  });

  const approveScopeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}/approve-scope-change`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      if (!res.ok) throw new Error("Failed to approve");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}/status`] }),
  });

  const rejectScopeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}/reject-scope-change`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      if (!res.ok) throw new Error("Failed to reject");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}/status`] }),
  });

  if (status === "cancelled") {
    return (
      <Card className="p-6 border-red-200 bg-red-50/30">
        <div className="flex items-center gap-3">
          <X className="w-6 h-6 text-red-500" />
          <div>
            <p className="font-bold text-red-700">Job Cancelled</p>
            <p className="text-sm text-muted-foreground">This booking has been cancelled and refunded.</p>
          </div>
        </div>
      </Card>
    );
  }

  const timelineMap: Record<string, string> = {};
  for (const t of timeline) {
    timelineMap[t.event] = t.timestamp;
  }

  return (
    <div className="space-y-4">
      {/* Stepper */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          {STEPS.map((step, i) => {
            const done = currentStep > i;
            const active = currentStep === i;
            const ts = timelineMap[step.event];
            return (
              <div key={step.key} className="flex flex-col items-center flex-1 relative">
                {i > 0 && (
                  <div
                    className={`absolute top-4 right-1/2 left-[-50%] h-0.5 ${
                      done ? "bg-[#ea580c]" : "bg-slate-200"
                    }`}
                    style={{ width: "100%", left: "-50%" }}
                  />
                )}
                <div
                  className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    done
                      ? "bg-[#ea580c] text-white"
                      : active
                        ? "bg-amber-100 text-[#ea580c] border-2 border-[#ea580c]"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {done ? <Check className="w-4 h-4" /> : active ? <Loader2 className="w-4 h-4 animate-spin" /> : i + 1}
                </div>
                <p className={`text-xs mt-2 text-center ${active ? "font-bold text-[#ea580c]" : done ? "text-slate-700" : "text-slate-400"}`}>
                  {step.label}
                </p>
                {ts && <p className="text-[10px] text-muted-foreground">{formatTimestamp(ts)}</p>}
              </div>
            );
          })}
        </div>

        {priceProtected && guaranteedCeiling && (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">Price Protection Guarantee</p>
              <p className="text-xs text-green-600">Maximum price: ${guaranteedCeiling.toFixed(2)}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Scope Change UI */}
      {scopeChange?.pending && isCustomer && (
        <Card className="p-5 border-amber-300 bg-amber-50/50">
          <h3 className="font-bold mb-2">Scope Change Requested</h3>
          <p className="text-sm text-muted-foreground mb-3">{scopeChange.description}</p>
          {scopeChange.photos.length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto">
              {scopeChange.photos.map((url, i) => (
                <img key={i} src={url} alt="Scope evidence" className="w-32 h-24 object-cover rounded-lg border" />
              ))}
            </div>
          )}
          <p className="font-bold mb-3">New proposed price: ${scopeChange.newPrice?.toFixed(2)}</p>
          <div className="flex gap-3">
            <Button
              onClick={() => approveScopeMutation.mutate()}
              disabled={approveScopeMutation.isPending}
              className="bg-[#ea580c] hover:bg-[#c2410c] text-white"
            >
              {approveScopeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Approve
            </Button>
            <Button
              variant="outline"
              onClick={() => rejectScopeMutation.mutate()}
              disabled={rejectScopeMutation.isPending}
            >
              Decline
            </Button>
          </div>
        </Card>
      )}

      {/* Cancel Button (customer, before job starts) */}
      {isCustomer && ["requested", "pending_acceptance", "accepted"].includes(status) && (
        <Button
          variant="outline"
          className="w-full text-red-600 border-red-200 hover:bg-red-50"
          onClick={() => cancelMutation.mutate()}
          disabled={cancelMutation.isPending}
        >
          {cancelMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Cancel Booking
        </Button>
      )}
    </div>
  );
}
