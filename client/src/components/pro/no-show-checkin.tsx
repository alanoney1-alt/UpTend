import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Clock, MessageSquare, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

interface NoShowCheckinProps {
  jobId: string;
  jobStatus: string;
}

export function NoShowCheckin({ jobId, jobStatus }: NoShowCheckinProps) {
  const { toast } = useToast();
  const [showDelayInput, setShowDelayInput] = useState(false);
  const [delayReason, setDelayReason] = useState("");

  // Check no-show timer status
  const { data: noShowStatus } = useQuery<{
    active: boolean;
    checkedIn: boolean;
    delayReasonSent: boolean;
    delayReason?: string;
  }>({
    queryKey: ["/api/jobs", jobId, "no-show-status"],
    queryFn: () =>
      fetch(`/api/jobs/${jobId}/no-show-status`, { credentials: "include" }).then((r) =>
        r.json()
      ),
    enabled: !!jobId && ["accepted", "assigned", "en_route"].includes(jobStatus),
    refetchInterval: 15000, // Check every 15s
  });

  // Check-in mutation
  const checkIn = useMutation({
    mutationFn: async () => {
      // Try GPS first
      let body: Record<string, number> = {};
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
          });
        });
        body = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch {
        // GPS unavailable — proceed without coordinates (manual check-in)
      }
      return apiRequest("POST", `/api/jobs/${jobId}/check-in`, body);
    },
    onSuccess: () => {
      toast({ title: " Checked In", description: "You're confirmed on-site!" });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", jobId, "no-show-status"] });
    },
    onError: (err: Error) => {
      toast({ title: "Check-in Failed", description: err.message, variant: "destructive" });
    },
  });

  // Delay reason mutation
  const submitDelay = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/jobs/${jobId}/delay-reason`, { reason: delayReason });
    },
    onSuccess: () => {
      toast({
        title: "Delay Noted",
        description: "Your reason has been recorded. Job stays assigned.",
      });
      setShowDelayInput(false);
      setDelayReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", jobId, "no-show-status"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // Don't show if no active timer or already checked in
  if (!noShowStatus?.active || noShowStatus?.checkedIn) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
        <AlertTriangle className="w-5 h-5" />
        <span className="font-semibold text-sm">Check-in Required</span>
      </div>
      <p className="text-sm text-amber-600 dark:text-amber-300">
        Please confirm your arrival or let us know if you're running late.
      </p>

      {noShowStatus.delayReasonSent ? (
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm">Delay reason sent — job under review</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* I'm Here button */}
          <button
            onClick={() => checkIn.mutate()}
            disabled={checkIn.isPending}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {checkIn.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MapPin className="w-4 h-4" />
            )}
            I'm Here
          </button>

          {/* Running Late toggle */}
          {!showDelayInput ? (
            <button
              onClick={() => setShowDelayInput(true)}
              className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/50 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-200 font-medium rounded-lg transition-colors"
            >
              <Clock className="w-4 h-4" />
              Running Late
            </button>
          ) : (
            <div className="space-y-2">
              <textarea
                value={delayReason}
                onChange={(e) => setDelayReason(e.target.value)}
                placeholder="What's causing the delay? (e.g., traffic, flat tire, previous job ran over)"
                className="w-full p-3 border border-amber-200 dark:border-amber-700 rounded-lg text-sm resize-none bg-white dark:bg-gray-900"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => submitDelay.mutate()}
                  disabled={!delayReason.trim() || submitDelay.isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitDelay.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MessageSquare className="w-4 h-4" />
                  )}
                  Send
                </button>
                <button
                  onClick={() => {
                    setShowDelayInput(false);
                    setDelayReason("");
                  }}
                  className="py-2 px-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
