import { useState, useEffect } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin, Phone, MessageSquare, Star, Clock, Camera, CheckCircle2,
  Navigation, Loader2, Package, User, Receipt, ArrowLeft
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const STATUS_STEPS = [
  { key: "requested", label: "Requested", icon: Clock },
  { key: "assigned", label: "Assigned", icon: User },
  { key: "en_route", label: "En Route", icon: Navigation },
  { key: "in_progress", label: "In Progress", icon: Package },
  { key: "completed", label: "Complete", icon: CheckCircle2 },
];

export default function JobLiveTracker() {
  usePageTitle("Live Tracker | UpTend");
  const { jobId } = useParams<{ jobId: string }>();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Job details
  const { data: job, isLoading } = useQuery<any>({
    queryKey: ["/api/jobs", jobId],
    queryFn: () => fetch(`/api/jobs/${jobId}`).then(r => r.json()),
    refetchInterval: 10000,
  });

  // Timeline
  const { data: timeline } = useQuery<any>({
    queryKey: ["/api/jobs", jobId, "timeline"],
    queryFn: () => fetch(`/api/jobs/${jobId}/timeline`).then(r => r.json()),
    refetchInterval: 15000,
  });

  // Location polling (5s when en_route)
  const { data: location } = useQuery<any>({
    queryKey: ["/api/jobs", jobId, "location"],
    queryFn: () => fetch(`/api/jobs/${jobId}/location`).then(r => r.json()),
    refetchInterval: job?.status === "en_route" ? 5000 : 30000,
    enabled: !!job && ["en_route", "in_progress"].includes(job.status),
  });

  // Rate mutation
  const rateMutation = useMutation({
    mutationFn: (data: { rating: number; comment: string }) =>
      apiRequest("POST", `/api/jobs/${jobId}/rate`, data),
    onSuccess: () => setRatingSubmitted(true),
  });

  const currentStepIdx = STATUS_STEPS.findIndex(s => s.key === (job?.status || "requested"));
  const photos = (timeline?.timeline || []).filter((e: any) => e.eventType === "photo_update");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#F47C20]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-lg mx-auto px-4 pt-8 pb-32">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => window.history.back()} className="p-2 hover:bg-zinc-800 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Live Tracker</h1>
            <p className="text-zinc-400 text-xs">Job #{jobId?.slice(0, 8)}</p>
          </div>
        </div>

        {/* Status Steps */}
        <Card className="bg-zinc-900 border-zinc-800 p-5 mb-4">
          <div className="flex items-center justify-between mb-6">
            {STATUS_STEPS.map((step, i) => {
              const isActive = i <= currentStepIdx;
              const isCurrent = i === currentStepIdx;
              const StepIcon = step.icon;
              return (
                <div key={step.key} className="flex flex-col items-center relative flex-1">
                  {i > 0 && (
                    <div className={`absolute top-4 right-1/2 w-full h-0.5 -translate-y-1/2 ${
                      i <= currentStepIdx ? "bg-[#F47C20]" : "bg-zinc-800"
                    }`} style={{ zIndex: 0 }} />
                  )}
                  <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isCurrent ? "bg-[#F47C20] ring-4 ring-[#F47C20]/20" :
                    isActive ? "bg-[#F47C20]" : "bg-zinc-800"
                  }`}>
                    <StepIcon className={`w-4 h-4 ${isActive ? "text-white" : "text-zinc-500"}`} />
                  </div>
                  <span className={`text-[10px] mt-2 ${isCurrent ? "text-[#F47C20] font-semibold" : isActive ? "text-zinc-300" : "text-zinc-600"}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Current Status Message */}
          <div className="text-center">
            <p className="text-white font-semibold">
              {job?.status === "en_route" ? "Your pro is on the way!" :
               job?.status === "in_progress" ? "Work is in progress" :
               job?.status === "completed" ? "Service complete!" :
               job?.status === "assigned" ? "Pro has been assigned" :
               "Finding the best pro for you"}
            </p>
            {job?.status === "en_route" && location?.lat && (
              <p className="text-zinc-400 text-sm mt-1">
                📍 Last update: {location.lastUpdate ? new Date(location.lastUpdate).toLocaleTimeString() : "Just now"}
              </p>
            )}
          </div>
        </Card>

        {/* Pro Info */}
        {job?.assignedHaulerId && (
          <Card className="bg-zinc-900 border-zinc-800 p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#F47C20]/20 flex items-center justify-center">
                <User className="w-6 h-6 text-[#F47C20]" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">{job.proName || "Your Pro"}</p>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-[#F47C20] fill-[#F47C20]" />
                  <span className="text-zinc-400 text-xs">{job.proRating || "4.8"} • {job.proJobCount || "50"}+ jobs</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700">
                  <Phone className="w-4 h-4 text-zinc-300" />
                </button>
                <button className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700">
                  <MessageSquare className="w-4 h-4 text-zinc-300" />
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Location Map Placeholder */}
        {location?.lat && ["en_route", "in_progress"].includes(job?.status) && (
          <Card className="bg-zinc-900 border-zinc-800 p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-[#F47C20]" />
              <span className="text-white text-sm font-medium">Pro Location</span>
            </div>
            <div className="bg-zinc-800 rounded-lg h-40 flex items-center justify-center">
              <div className="text-center">
                <Navigation className="w-8 h-8 text-[#F47C20] mx-auto mb-2" />
                <p className="text-zinc-400 text-xs">
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </p>
                {location.speed && (
                  <p className="text-zinc-500 text-xs mt-1">{Math.round(location.speed)} mph</p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Photo Feed */}
        {photos.length > 0 && (
          <Card className="bg-zinc-900 border-zinc-800 p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Camera className="w-4 h-4 text-[#F47C20]" />
              <span className="text-white text-sm font-medium">Progress Photos</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {photos.map((p: any) => (
                <div key={p.id} className="relative">
                  <img src={p.photoUrl} alt={p.description} className="w-full h-32 object-cover rounded-lg" />
                  <p className="text-zinc-400 text-xs mt-1">{p.description}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Timeline */}
        {timeline?.timeline && timeline.timeline.length > 0 && (
          <Card className="bg-zinc-900 border-zinc-800 p-4 mb-4">
            <h3 className="text-white text-sm font-semibold mb-3">Timeline</h3>
            <div className="space-y-3">
              {timeline.timeline.map((event: any, i: number) => (
                <div key={event.id || i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-[#F47C20]" />
                    {i < timeline.timeline.length - 1 && <div className="w-0.5 flex-1 bg-zinc-800 mt-1" />}
                  </div>
                  <div className="pb-3">
                    <p className="text-white text-sm">{event.title}</p>
                    <p className="text-zinc-500 text-xs">{event.description}</p>
                    <p className="text-zinc-600 text-[10px] mt-0.5">
                      {new Date(event.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Post-Completion Rating */}
        {job?.status === "completed" && !ratingSubmitted && (
          <Card className="bg-zinc-900 border-zinc-800 p-5 mb-4">
            <h3 className="text-white font-semibold mb-3 text-center">How was your service?</h3>
            <div className="flex justify-center gap-2 mb-4">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRating(s)} className="p-1">
                  <Star className={`w-8 h-8 transition-all ${s <= rating ? "text-[#F47C20] fill-[#F47C20]" : "text-zinc-700"}`} />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Tell us about your experience..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white text-sm resize-none h-20 mb-3"
                />
                <Button
                  onClick={() => rateMutation.mutate({ rating, comment })}
                  disabled={rateMutation.isPending}
                  className="w-full bg-[#F47C20] hover:bg-[#F47C20]/90"
                >
                  {rateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Rating"}
                </Button>
              </>
            )}
          </Card>
        )}

        {ratingSubmitted && (
          <Card className="bg-green-500/10 border-green-500/30 p-5 text-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-2" />
            <p className="text-green-300 font-semibold">Thank you for your feedback!</p>
          </Card>
        )}

        {/* Receipt */}
        {job?.status === "completed" && job?.totalAmount && (
          <Card className="bg-zinc-900 border-zinc-800 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Receipt className="w-4 h-4 text-[#F47C20]" />
              <span className="text-white text-sm font-medium">Receipt</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-zinc-300">
                <span>Service</span>
                <span>${((job.baseAmount || job.totalAmount * 0.85) / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>Platform Fee</span>
                <span>${((job.platformFee || job.totalAmount * 0.15) / 100).toFixed(2)}</span>
              </div>
              <div className="border-t border-zinc-800 pt-2 flex justify-between text-white font-semibold">
                <span>Total</span>
                <span>${(job.totalAmount / 100).toFixed(2)}</span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
