import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "@/lib/leaflet-fix";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/landing/header";
import { 
  MapPin, Clock, Phone, MessageCircle, Navigation, 
  CheckCircle, Star, RefreshCw, AlertCircle, User
} from "lucide-react";

interface Job {
  id: string;
  customer_name: string;
  customer_address: string;
  customer_phone?: string;
  customer_lat?: number;
  customer_lng?: number;
  service_type: string;
  description?: string;
  status: 'scheduled' | 'dispatched' | 'en_route' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_date: string;
  scheduled_time_start?: string;
  pro_first_name?: string;
  pro_last_name?: string;
  pro_avatar?: string;
}

interface StatusUpdate {
  id: number;
  status: string;
  created_at: string;
  note?: string;
  first_name?: string;
  last_name?: string;
}

interface ProLocation {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  recorded_at: string;
}

interface TrackingData {
  job: Job;
  timeline: StatusUpdate[];
  proLocation?: ProLocation;
  hasLiveTracking: boolean;
}

const statusSteps = [
  { key: "scheduled", label: "Scheduled", color: "bg-slate-500" },
  { key: "dispatched", label: "Pro Assigned", color: "bg-amber-500" },
  { key: "en_route", label: "On the Way", color: "bg-blue-500" },
  { key: "arrived", label: "Arrived", color: "bg-emerald-500" },
  { key: "in_progress", label: "In Progress", color: "bg-orange-500" },
  { key: "completed", label: "Complete", color: "bg-green-500" },
];

function getStatusIndex(status: string): number {
  return statusSteps.findIndex(s => s.key === status);
}

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  return date.toLocaleDateString();
}

function calculateETA(fromLat: number, fromLng: number, toLat: number, toLng: number): number {
  // Simple straight-line distance calculation for ETA
  const R = 3959; // Earth's radius in miles
  const dLat = (toLat - fromLat) * Math.PI / 180;
  const dLng = (toLng - fromLng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(fromLat * Math.PI / 180) * Math.cos(toLat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  // Assume 30 mph average speed
  const etaMinutes = (distance / 30) * 60;
  return Math.round(etaMinutes);
}

// Custom map icons
function makeProIcon() {
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
      <circle cx="20" cy="20" r="18" fill="#3b82f6" stroke="#fff" stroke-width="3"/>
      <circle cx="20" cy="20" r="6" fill="#fff"/>
    </svg>`
  );
  return new L.Icon({
    iconUrl: `data:image/svg+xml,${svg}`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
}

function makeDestIcon() {
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 42" width="30" height="42">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 2.9.8 5.5 2.3 7.8L15 42l12.7-19.2C29.2 20.5 30 17.9 30 15 30 6.7 23.3 0 15 0z" fill="#10b981"/>
      <circle cx="15" cy="15" r="6" fill="#fff"/>
    </svg>`
  );
  return new L.Icon({
    iconUrl: `data:image/svg+xml,${svg}`,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -42],
  });
}

function ReviewDialog({ job, open, onClose }: { job: Job; open: boolean; onClose: () => void }) {
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [customerName, setCustomerName] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch("/api/dispatch/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          rating,
          reviewText: reviewText.trim() || undefined,
          customerName: customerName.trim() || undefined
        })
      });

      if (res.ok) {
        toast({ title: "Thank you for your review!" });
        onClose();
        setRating(5);
        setReviewText("");
        setCustomerName("");
      } else {
        toast({ title: "Failed to submit review", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to submit review", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Rate Your Experience</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>How would you rate the service?</Label>
            <div className="flex gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-2xl ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="customerName">Your Name (optional)</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>

          <div>
            <Label htmlFor="reviewText">Comments (optional)</Label>
            <Textarea
              id="reviewText"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Tell us about your experience..."
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Skip
            </Button>
            <Button type="submit" className="flex-1">
              Submit Review
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function CustomerJobTrack() {
  const { jobId } = useParams<{ jobId: string }>();
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  // Fetch tracking data
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["job-tracking", jobId],
    queryFn: async (): Promise<TrackingData> => {
      const res = await fetch(`/api/dispatch/track/${jobId}`);
      if (!res.ok) throw new Error("Failed to load tracking data");
      return res.json();
    },
    refetchInterval: (query) => {
      // Refresh more frequently when pro is en route
      return query.state.data?.job?.status === 'en_route' ? 15000 : 30000;
    },
    enabled: !!jobId
  });

  const job = data?.job;
  const timeline = data?.timeline || [];
  const proLocation = data?.proLocation;
  const hasLiveTracking = data?.hasLiveTracking || false;

  // Auto-show review dialog when job is completed
  useEffect(() => {
    if (job?.status === 'completed' && !showReviewDialog) {
      // Show review dialog after 2 seconds
      const timer = setTimeout(() => {
        setShowReviewDialog(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [job?.status, showReviewDialog]);

  if (isLoading || !job) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </div>
      </div>
    );
  }

  const currentStatusIndex = getStatusIndex(job.status);
  const mapCenter = job.customer_lat && job.customer_lng 
    ? [job.customer_lat, job.customer_lng] as [number, number]
    : [28.5383, -81.3792] as [number, number]; // Orlando default

  const eta = proLocation && job.customer_lat && job.customer_lng
    ? calculateETA(proLocation.lat, proLocation.lng, job.customer_lat, job.customer_lng)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Track Your Service</h1>
            <p className="text-muted-foreground">{job.service_type}</p>
          </div>
          <Button variant="outline" onClick={() => refetch()} size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Status Progress */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Service Status</h2>
              <Badge className={`${statusSteps[currentStatusIndex]?.color || 'bg-slate-500'} text-white`}>
                {statusSteps[currentStatusIndex]?.label || job.status}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              {statusSteps.map((step, index) => (
                <div key={step.key} className="flex flex-col items-center flex-1">
                  <div className={`w-4 h-4 rounded-full ${
                    index <= currentStatusIndex ? step.color : 'bg-gray-200'
                  }`} />
                  <span className="text-xs mt-1 text-center">{step.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ETA Banner */}
        {job.status === 'en_route' && eta && (
          <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <Navigation className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                    Your pro is on the way!
                  </h3>
                  <p className="text-blue-700 dark:text-blue-200">
                    Estimated arrival: {eta} minutes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pro Info & Map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Pro Info */}
          {job.pro_first_name && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Your Pro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback>
                      {job.pro_first_name[0]}{job.pro_last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {job.pro_first_name} {job.pro_last_name}
                    </h3>
                    <p className="text-muted-foreground">{job.service_type} Specialist</p>
                    {proLocation && (
                      <p className="text-sm text-muted-foreground">
                        Last seen {formatTimeAgo(proLocation.recorded_at)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {job.customer_phone && (
                    <Button variant="outline" className="w-full">
                      <Phone className="w-4 h-4 mr-2" />
                      Call Pro
                    </Button>
                  )}
                  <Button variant="outline" className="w-full">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message Pro
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Map */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Location {hasLiveTracking && <Badge variant="secondary">Live</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-64 rounded-lg overflow-hidden">
                <MapContainer
                  center={mapCenter}
                  zoom={14}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap'
                  />
                  
                  {/* Customer location */}
                  {job.customer_lat && job.customer_lng && (
                    <Marker position={[job.customer_lat, job.customer_lng]} icon={makeDestIcon()}>
                      <Popup>{job.customer_address}</Popup>
                    </Marker>
                  )}
                  
                  {/* Pro location */}
                  {proLocation && (
                    <Marker position={[proLocation.lat, proLocation.lng]} icon={makeProIcon()}>
                      <Popup>
                        {job.pro_first_name} {job.pro_last_name}
                        {proLocation.speed && <br />}
                        {proLocation.speed && `Speed: ${Math.round(proLocation.speed)} mph`}
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Job Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Address</Label>
                <p>{job.customer_address}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Scheduled</Label>
                <p>
                  {new Date(job.scheduled_date).toLocaleDateString()}
                  {job.scheduled_time_start && ` at ${job.scheduled_time_start}`}
                </p>
              </div>
            </div>
            
            {job.description && (
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p>{job.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Activity Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeline.map((update, index) => (
                <div key={update.id} className="flex items-start gap-3">
                  <div className={`w-3 h-3 rounded-full mt-2 ${
                    statusSteps.find(s => s.key === update.status)?.color || 'bg-gray-400'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">
                        {statusSteps.find(s => s.key === update.status)?.label || update.status}
                      </h4>
                      <span className="text-sm text-muted-foreground">
                        {formatTimeAgo(update.created_at)}
                      </span>
                    </div>
                    {update.note && (
                      <p className="text-sm text-muted-foreground mt-1">{update.note}</p>
                    )}
                    {update.first_name && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Updated by {update.first_name} {update.last_name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Completed Job Actions */}
        {job.status === 'completed' && (
          <Card className="mt-6">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <h2 className="text-xl font-semibold mb-2">Service Complete!</h2>
              <p className="text-muted-foreground mb-4">
                Thank you for choosing UpTend. How was your experience?
              </p>
              <Button onClick={() => setShowReviewDialog(true)}>
                <Star className="w-4 h-4 mr-2" />
                Leave a Review
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Review Dialog */}
      <ReviewDialog
        job={job}
        open={showReviewDialog}
        onClose={() => setShowReviewDialog(false)}
      />
    </div>
  );
}