import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "@/lib/leaflet-fix";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Navigation, MapPin, Phone, Clock, User, CheckCircle,
  Play, AlertCircle, Flag, RefreshCw
} from "lucide-react";

interface Job {
  id: string;
  customer_name: string;
  customer_address: string;
  customer_phone?: string;
  customer_phone_direct?: string;
  customer_lat?: number;
  customer_lng?: number;
  service_type: string;
  description?: string;
  status: 'scheduled' | 'dispatched' | 'en_route' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_date: string;
  scheduled_time_start?: string;
  scheduled_time_end?: string;
  notes?: string;
}

const statusColors = {
  scheduled: "bg-slate-500 text-white",
  dispatched: "bg-amber-500 text-white",
  en_route: "bg-blue-500 text-white",
  arrived: "bg-emerald-500 text-white",
  in_progress: "bg-orange-500 text-white",
  completed: "bg-green-500 text-white",
  cancelled: "bg-red-500 text-white"
};

const statusActions = {
  dispatched: { next: 'en_route', label: 'Start Route', icon: Play, color: 'bg-blue-600' },
  en_route: { next: 'arrived', label: "I've Arrived", icon: Flag, color: 'bg-emerald-600' },
  arrived: { next: 'in_progress', label: 'Start Work', icon: Play, color: 'bg-orange-600' },
  in_progress: { next: 'completed', label: 'Complete Job', icon: CheckCircle, color: 'bg-green-600' },
};

function JobCard({ job, onUpdateStatus, onViewDetails }: { 
  job: Job; 
  onUpdateStatus: (jobId: string, status: string) => void;
  onViewDetails: (job: Job) => void;
}) {
  const action = statusActions[job.status as keyof typeof statusActions];
  
  const handleCall = () => {
    const phone = job.customer_phone_direct || job.customer_phone;
    if (phone) {
      window.open(`tel:${phone}`);
    }
  };

  const handleDirections = () => {
    if (job.customer_address) {
      const address = encodeURIComponent(job.customer_address);
      window.open(`https://maps.google.com/?q=${address}`);
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">{job.customer_name}</h3>
            <Badge className={statusColors[job.status]} variant="default">
              {job.status.replace(/_/g, " ").toUpperCase()}
            </Badge>
          </div>
          {job.scheduled_time_start && (
            <div className="text-right text-sm text-muted-foreground">
              <Clock className="w-4 h-4 inline mr-1" />
              {job.scheduled_time_start}
            </div>
          )}
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
            <span>{job.customer_address}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span>{job.service_type}</span>
          </div>

          {job.description && (
            <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
              {job.description}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {job.customer_phone && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCall}
              className="flex-1"
            >
              <Phone className="w-4 h-4 mr-2" />
              Call
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDirections}
            className="flex-1"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Directions
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(job)}
            className="px-3"
          >
            Details
          </Button>
        </div>

        {action && (
          <Button
            onClick={() => onUpdateStatus(job.id, action.next)}
            className={`w-full mt-3 text-lg py-6 ${action.color} hover:opacity-90`}
            size="lg"
          >
            <action.icon className="w-5 h-5 mr-2" />
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function JobDetailsDialog({ job, open, onClose }: { 
  job: Job | null; 
  open: boolean; 
  onClose: () => void; 
}) {
  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Job Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">{job.customer_name}</h3>
            <Badge className={statusColors[job.status]} variant="default">
              {job.status.replace(/_/g, " ").toUpperCase()}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <span className="text-sm">{job.customer_address}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{job.service_type}</span>
            </div>

            {job.scheduled_time_start && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{job.scheduled_time_start}</span>
              </div>
            )}

            {job.customer_phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{job.customer_phone}</span>
              </div>
            )}
          </div>

          {job.description && (
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                {job.description}
              </p>
            </div>
          )}

          {job.notes && (
            <div>
              <h4 className="font-medium mb-2">Notes</h4>
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                {job.notes}
              </p>
            </div>
          )}

          {job.customer_lat && job.customer_lng && (
            <div>
              <h4 className="font-medium mb-2">Location</h4>
              <div className="h-48 rounded-lg overflow-hidden border">
                <MapContainer
                  center={[job.customer_lat, job.customer_lng]}
                  zoom={15}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap'
                  />
                  <Marker position={[job.customer_lat, job.customer_lng]}>
                    <Popup>{job.customer_address}</Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CompletionDialog({ job, open, onClose, onComplete }: {
  job: Job | null;
  open: boolean;
  onClose: () => void;
  onComplete: (jobId: string, summary: string) => void;
}) {
  const [summary, setSummary] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (job && summary.trim()) {
      onComplete(job.id, summary);
      setSummary("");
      onClose();
    }
  };

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Complete Job</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <h3 className="font-semibold">{job.customer_name}</h3>
            <p className="text-sm text-muted-foreground">{job.service_type}</p>
          </div>

          <div>
            <label htmlFor="summary" className="block text-sm font-medium mb-2">
              Work Summary *
            </label>
            <Textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Describe the work completed, any parts used, and recommendations..."
              rows={4}
              required
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark Complete
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ProDashboard() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [completingJob, setCompletingJob] = useState<Job | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch today's jobs
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["pro-jobs"],
    queryFn: async () => {
      const res = await fetch("/api/dispatch/pro/my-jobs");
      if (!res.ok) throw new Error("Failed to load jobs");
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Update job status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ jobId, status, note }: { jobId: string; status: string; note?: string }) => {
      const res = await fetch(`/api/dispatch/pro/jobs/${jobId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note })
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pro-jobs"] });
      toast({ title: "Status updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  });

  // Location ping mutation
  const locationMutation = useMutation({
    mutationFn: async (location: { lat: number; lng: number; heading?: number; speed?: number }) => {
      const res = await fetch("/api/dispatch/pro/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(location)
      });
      if (!res.ok) throw new Error("Failed to send location");
      return res.json();
    }
  });

  // Start GPS tracking when pro goes en route
  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation) {
      toast({ title: "Location services not available", variant: "destructive" });
      return;
    }

    setLocationEnabled(true);
    
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        locationMutation.mutate({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed ? position.coords.speed * 2.237 : undefined // Convert m/s to mph
        });
      },
      (error) => {
        console.error("Location error:", error);
        toast({ title: "Location tracking error", variant: "destructive" });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );

    // Store watch ID to clear later
    (window as any).locationWatchId = watchId;
  }, [locationMutation, toast]);

  const handleUpdateStatus = (jobId: string, status: string) => {
    // Start location tracking when going en route
    if (status === 'en_route' && !locationEnabled) {
      startLocationTracking();
    }

    // If completing, show completion dialog
    if (status === 'completed') {
      const job = data?.jobs?.find((j: Job) => j.id === jobId);
      if (job) {
        setCompletingJob(job);
        return;
      }
    }

    updateStatusMutation.mutate({ jobId, status });
  };

  const handleCompleteJob = (jobId: string, summary: string) => {
    updateStatusMutation.mutate({ 
      jobId, 
      status: 'completed',
      note: `Work completed: ${summary}`
    });
  };

  // Clean up location tracking on unmount
  useEffect(() => {
    return () => {
      if ((window as any).locationWatchId) {
        navigator.geolocation.clearWatch((window as any).locationWatchId);
      }
    };
  }, []);

  const jobs = data?.jobs || [];
  const activeJobs = jobs.filter((job: Job) => !['completed', 'cancelled'].includes(job.status));
  const completedJobs = jobs.filter((job: Job) => job.status === 'completed');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 safe-area-top">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Today's Jobs</h1>
            <p className="text-sm opacity-90">
              {activeJobs.length} active • {completedJobs.length} completed
            </p>
          </div>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        {locationEnabled && (
          <div className="mt-2 flex items-center gap-2 text-sm opacity-90">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            GPS tracking active
          </div>
        )}
      </div>

      {/* Jobs List */}
      <div className="p-4 pb-20">
        {activeJobs.length === 0 && completedJobs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h2 className="text-lg font-semibold mb-2">No jobs scheduled</h2>
              <p className="text-muted-foreground">
                Check back later or contact dispatch if you're expecting assignments.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Active Jobs */}
            {activeJobs.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  Active Jobs ({activeJobs.length})
                </h2>
                {activeJobs.map((job: Job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onUpdateStatus={handleUpdateStatus}
                    onViewDetails={setSelectedJob}
                  />
                ))}
              </div>
            )}

            {/* Completed Jobs */}
            {completedJobs.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Completed Today ({completedJobs.length})
                </h2>
                {completedJobs.map((job: Job) => (
                  <Card key={job.id} className="mb-3 opacity-75">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{job.customer_name}</h3>
                          <p className="text-sm text-muted-foreground">{job.service_type}</p>
                        </div>
                        <Badge className={statusColors[job.status]} variant="default">
                          COMPLETED
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialogs */}
      <JobDetailsDialog
        job={selectedJob}
        open={!!selectedJob}
        onClose={() => setSelectedJob(null)}
      />
      
      <CompletionDialog
        job={completingJob}
        open={!!completingJob}
        onClose={() => setCompletingJob(null)}
        onComplete={handleCompleteJob}
      />

      {/* Safe area bottom spacing */}
      <div className="safe-area-bottom" />
    </div>
  );
}