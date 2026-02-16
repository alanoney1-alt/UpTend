import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, MapPin, DollarSign, Loader2, Zap } from "lucide-react";

interface UrgentJob {
  jobId: string;
  serviceType: string;
  pickupAddress: string;
  priceEstimate: number | null;
  isUrgentReassign: boolean;
}

interface UrgentJobCardProps {
  job: UrgentJob;
  onAccepted?: () => void;
  onDismissed?: () => void;
}

const SERVICE_NAMES: Record<string, string> = {
  junk_removal: "Junk Removal",
  moving: "Moving",
  truck_unloading: "Truck Unloading",
  garage_cleanout: "Garage Cleanout",
  pressure_washing: "Pressure Washing",
  gutter_cleaning: "Gutter Cleaning",
  moving_labor: "Moving Labor",
  light_demolition: "Light Demolition",
  home_consultation: "AI Home Scan",
  home_cleaning: "Home Cleaning",
};

export function UrgentJobCard({ job, onAccepted, onDismissed }: UrgentJobCardProps) {
  const { toast } = useToast();
  const [secondsLeft, setSecondsLeft] = useState(120); // 2-minute acceptance window

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onDismissed?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onDismissed]);

  const acceptJob = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/service-requests/${job.jobId}/accept`);
    },
    onSuccess: () => {
      toast({ title: "🎉 Job Accepted!", description: "Head to the location ASAP." });
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/haulers", "active-jobs"] });
      onAccepted?.();
    },
    onError: (err: Error) => {
      toast({
        title: "Couldn't Accept",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  if (secondsLeft <= 0) return null;

  return (
    <div className="animate-in slide-in-from-top-4 bg-red-50 dark:bg-red-950/40 border-2 border-red-400 dark:border-red-700 rounded-xl p-4 shadow-lg space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500 animate-pulse">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-red-700 dark:text-red-400 text-sm uppercase tracking-wide">
            Urgent Pickup
          </h3>
          <p className="text-xs text-red-500 dark:text-red-300">
            Previous pro no-showed — customer waiting
          </p>
        </div>
        <div className="ml-auto text-right">
          <span className="text-lg font-bold text-red-600 dark:text-red-400">
            {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="font-medium">
            {SERVICE_NAMES[job.serviceType] || job.serviceType}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <MapPin className="w-4 h-4" />
          <span>{job.pickupAddress}</span>
        </div>
        {job.priceEstimate && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <DollarSign className="w-4 h-4" />
            <span className="font-semibold">${job.priceEstimate.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => acceptJob.mutate()}
          disabled={acceptJob.isPending}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
        >
          {acceptJob.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          Accept Urgent Job
        </button>
        <button
          onClick={() => onDismissed?.()}
          className="py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-lg"
        >
          Skip
        </button>
      </div>
    </div>
  );
}

// ─── Hook to listen for urgent jobs via WebSocket ────────────────────────────

export function useUrgentJobListener(): UrgentJob | null {
  const [urgentJob, setUrgentJob] = useState<UrgentJob | null>(null);

  useEffect(() => {
    // Listen for WebSocket messages on the global channel
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "urgent_job_available" && data.isUrgentReassign) {
          setUrgentJob({
            jobId: data.jobId,
            serviceType: data.serviceType,
            pickupAddress: data.pickupAddress,
            priceEstimate: data.priceEstimate,
            isUrgentReassign: true,
          });
        }
      } catch {
        // ignore parse errors
      }
    };

    // This assumes a global WebSocket is available on window
    const ws = (window as any).__uptend_ws;
    if (ws) {
      ws.addEventListener("message", handleMessage);
      return () => ws.removeEventListener("message", handleMessage);
    }
  }, []);

  const dismiss = () => setUrgentJob(null);

  return urgentJob;
}
