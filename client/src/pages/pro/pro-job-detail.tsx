import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "@/lib/leaflet-fix";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, MapPin, Phone, Clock, User, 
  MessageSquare, Camera, CheckSquare, Navigation
} from "lucide-react";

interface JobDetail {
  id: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address: string;
  customer_lat?: number;
  customer_lng?: number;
  service_type: string;
  description?: string;
  status: string;
  scheduled_date: string;
  scheduled_time_start?: string;
  scheduled_time_end?: string;
  notes?: string;
  
  // Customer history would be here in growth+ tier
  customerHistory?: Array<{
    id: string;
    date: string;
    service_type: string;
    status: string;
    pro_name: string;
  }>;
  
  // Checklist items (scale tier)
  checklist?: Array<{
    id: number;
    item_text: string;
    completed: boolean;
    notes?: string;
  }>;
  
  // Job photos (scale tier)
  photos?: Array<{
    id: number;
    photo_url: string;
    photo_type: string;
    caption?: string;
    uploaded_at: string;
  }>;
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

export default function ProJobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const [, setLocation] = useLocation();

  // Fetch job details
  const { data, isLoading } = useQuery({
    queryKey: ["pro-job-detail", jobId],
    queryFn: async () => {
      const res = await fetch(`/api/dispatch/pro/jobs/${jobId}/details`);
      if (!res.ok) throw new Error("Failed to load job details");
      return res.json();
    },
    enabled: !!jobId
  });

  const job: JobDetail | undefined = data?.job;

  const handleCall = () => {
    if (job?.customer_phone) {
      window.open(`tel:${job.customer_phone}`);
    }
  };

  const handleDirections = () => {
    if (job?.customer_address) {
      const address = encodeURIComponent(job.customer_address);
      window.open(`https://maps.google.com/?q=${address}`);
    }
  };

  const handleMessage = () => {
    // This would open the chat/messaging system
    console.log("Open messaging system");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Job not found</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setLocation("/pro/dashboard")}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 safe-area-top">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/pro/dashboard")}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">{job.customer_name}</h1>
            <p className="text-sm opacity-90">{job.service_type}</p>
          </div>
          <Badge className={statusColors[job.status as keyof typeof statusColors]} variant="secondary">
            {job.status.replace(/_/g, " ").toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{job.customer_address}</p>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-blue-600"
                    onClick={handleDirections}
                  >
                    <Navigation className="w-3 h-3 mr-1" />
                    Get Directions
                  </Button>
                </div>
              </div>

              {job.customer_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{job.customer_phone}</span>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-blue-600 ml-auto"
                    onClick={handleCall}
                  >
                    Call
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>
                  {new Date(job.scheduled_date).toLocaleDateString()}
                  {job.scheduled_time_start && ` at ${job.scheduled_time_start}`}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCall} className="flex-1">
                <Phone className="w-4 h-4 mr-2" />
                Call Customer
              </Button>
              <Button variant="outline" onClick={handleMessage} className="flex-1">
                <MessageSquare className="w-4 h-4 mr-2" />
                Message
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Job Details */}
        {job.description && (
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{job.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Map */}
        {job.customer_lat && job.customer_lng && (
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-48 rounded-lg overflow-hidden">
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
            </CardContent>
          </Card>
        )}

        {/* Customer History (Growth+ feature) */}
        {job.customerHistory && job.customerHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Customer History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {job.customerHistory.map((historyJob, index) => (
                  <div key={historyJob.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{historyJob.service_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(historyJob.date).toLocaleDateString()} • {historyJob.pro_name}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {historyJob.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Checklist (Scale feature) */}
        {job.checklist && job.checklist.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5" />
                Service Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {job.checklist.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => {}} // Would trigger checklist update
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {item.item_text}
                      </p>
                      {item.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Job Photos (Scale feature) */}
        {job.photos && job.photos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Job Photos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {job.photos.map((photo) => (
                  <div key={photo.id} className="space-y-2">
                    <img
                      src={photo.photo_url}
                      alt={photo.caption || `${photo.photo_type} photo`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <div className="text-xs">
                      <Badge variant="outline" className="text-xs">
                        {photo.photo_type}
                      </Badge>
                      {photo.caption && (
                        <p className="text-muted-foreground mt-1">{photo.caption}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <Separator className="my-4" />
              
              <Button variant="outline" className="w-full">
                <Camera className="w-4 h-4 mr-2" />
                Add Photos
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {job.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{job.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Safe area spacing */}
      <div className="safe-area-bottom pb-4" />
    </div>
  );
}