import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Header } from "@/components/landing/header";
import { useToast } from "@/hooks/use-toast";
import { useGeoLocation } from "@/hooks/use-geolocation";
import { apiRequest } from "@/lib/queryClient";
import { LiveTrackingMap } from "@/components/pycker-map";
import { 
  MapPin, Clock, Phone, MessageCircle, Navigation, 
  Truck, CheckCircle, Star, ArrowLeft, RefreshCw,
  Package, AlertCircle, Loader2, Send, Locate, Bell
} from "lucide-react";
import type { ServiceRequestWithDetails, HaulerReview } from "@shared/schema";
import { PyckerTierBadge, PyckerTierInfo } from "@/components/pycker-tier-badge";
import { EnvironmentalCertificate } from "@/components/environmental-certificate";
import { EsgImpactDashboard } from "@/components/esg-impact-dashboard";
import { CircularEconomyAgent } from "@/components/circular-economy-agent";
import { DisputeForm } from "@/components/dispute-resolution";
import { GreenVerifiedReceipt } from "@/components/green-verified-receipt";

import hauler1 from "@assets/stock_images/professional_male_wo_ae620e83.jpg";

interface TrackingData {
  job: ServiceRequestWithDetails;
  haulerLocation: { lat: number; lng: number; recordedAt: string } | null;
  customerLocation: { lat: number; lng: number; recordedAt: string } | null;
  pickup: { lat: number | null; lng: number | null; address: string };
  destination: { lat: number | null; lng: number | null; address: string } | null;
}

const statusSteps = [
  { id: "matching", label: "Finding Pro" },
  { id: "assigned", label: "Pro Assigned" },
  { id: "in_progress", label: "On The Way" },
  { id: "completed", label: "Completed" },
];

function getStatusIndex(status: string): number {
  return statusSteps.findIndex(s => s.id === status);
}

// Countdown component for Real-Time Matching
function MatchingCountdown({ 
  matchingExpiresAt,
  needsManualMatch
}: { 
  matchingExpiresAt: string | null;
  needsManualMatch: boolean;
}) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  
  useEffect(() => {
    if (!matchingExpiresAt) return;
    
    const deadline = new Date(matchingExpiresAt).getTime();
    
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, deadline - now);
      setTimeLeft(remaining);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [matchingExpiresAt]);
  
  const seconds = Math.floor(timeLeft / 1000);
  const isExpired = timeLeft === 0 || needsManualMatch;
  
  if (needsManualMatch || isExpired) {
    return (
      <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-4" data-testid="card-manual-match">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
            <Phone className="w-5 h-5 text-primary animate-pulse" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">
              We're Connecting You Personally
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Our team is matching you with the best available Pro. 
              You'll receive a call within <span className="font-bold text-primary">5 minutes</span>.
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3 ml-13 pl-13">
          Thank you for your patience!
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/30 rounded-lg p-4 mb-4" data-testid="card-matching-countdown">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
            <Truck className="w-6 h-6 text-primary" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            Finding Your Pro
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            We're matching you with the best available Pros nearby
          </p>
        </div>
        <div className="text-center bg-background/80 rounded-lg px-3 py-2" data-testid="text-matching-countdown">
          <span className="text-2xl font-bold text-primary font-mono">
            {seconds}
          </span>
          <span className="text-xs text-muted-foreground block">seconds</span>
        </div>
      </div>
    </div>
  );
}

// Countdown component for 5-minute call deadline
function CallDeadlineCountdown({ 
  acceptedAt, 
  contactRequiredBy 
}: { 
  acceptedAt: string;
  contactRequiredBy?: string | null;
}) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  
  useEffect(() => {
    const deadline = contactRequiredBy 
      ? new Date(contactRequiredBy).getTime()
      : new Date(acceptedAt).getTime() + 5 * 60 * 1000; // 5 minutes from accepted
    
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, deadline - now);
      setTimeLeft(remaining);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [acceptedAt, contactRequiredBy]);
  
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const isExpired = timeLeft === 0;
  
  if (isExpired) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-amber-600" />
        <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
          Your Pro should have called you by now
        </span>
      </div>
    );
  }
  
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
      <div className="flex items-center gap-2">
        <Phone className="w-5 h-5 text-primary animate-pulse" />
        <div className="flex-1">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Your Pro will call you within
          </span>
          <span className="ml-2 text-lg font-bold text-blue-600 dark:text-blue-400 font-mono" data-testid="text-call-countdown">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>
      </div>
      <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1 ml-7">
        They are required to contact you to confirm pickup details
      </p>
    </div>
  );
}

function MapPlaceholder({ 
  haulerLocation, 
  pickupAddress 
}: { 
  haulerLocation: { lat: number; lng: number } | null;
  pickupAddress: string;
}) {
  return (
    <div className="relative h-64 md:h-80 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center flex-col gap-4">
        <div className="relative">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
            <Navigation className="w-8 h-8 text-primary" />
          </div>
          {haulerLocation && (
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
          )}
        </div>
        
        <div className="text-center px-4">
          <p className="text-sm font-medium text-muted-foreground">Live Tracking</p>
          {haulerLocation ? (
            <p className="text-xs text-muted-foreground mt-1">
              Pro at {haulerLocation.lat.toFixed(4)}, {haulerLocation.lng.toFixed(4)}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">
              Waiting for Pro location...
            </p>
          )}
        </div>
        
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-background/90 backdrop-blur-sm rounded-lg p-3 flex items-center gap-3">
            <MapPin className="w-5 h-5 text-primary shrink-0" />
            <div className="truncate">
              <p className="text-xs text-muted-foreground">Pickup Location</p>
              <p className="text-sm font-medium truncate">{pickupAddress}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
    </div>
  );
}

export default function Tracking() {
  const params = useParams<{ jobId: string }>();
  const [, navigate] = useLocation();
  const wsRef = useRef<WebSocket | null>(null);
  const lastLocationBroadcast = useRef<number>(0);
  const [liveLocation, setLiveLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [shareMyLocation, setShareMyLocation] = useState(false);

  const geoLocation = useGeoLocation(shareMyLocation, {
    enableHighAccuracy: true,
  });

  const { data: trackingData, isLoading, refetch } = useQuery<TrackingData>({
    queryKey: ["/api/jobs", params.jobId, "track"],
    queryFn: async () => {
      const res = await fetch(`/api/jobs/${params.jobId}/track`);
      if (!res.ok) throw new Error("Failed to load tracking data");
      return res.json();
    },
    refetchInterval: 10000,
    enabled: !!params.jobId,
  });

  useEffect(() => {
    if (!params.jobId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?jobId=${params.jobId}&role=customer`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus("connected");
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "location_updated") {
          setLiveLocation({ lat: message.lat, lng: message.lng });
        }
      } catch (error) {
        console.error("WebSocket message parse error:", error);
      }
    };

    ws.onclose = () => {
      setConnectionStatus("disconnected");
    };

    ws.onerror = () => {
      setConnectionStatus("disconnected");
    };

    return () => {
      ws.close();
    };
  }, [params.jobId]);

  useEffect(() => {
    if (!wsRef.current || !geoLocation.lat || !geoLocation.lng || !shareMyLocation) return;

    const now = Date.now();
    if (now - lastLocationBroadcast.current < 10000) return;
    lastLocationBroadcast.current = now;

    if (wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "customer_location_update",
        data: {
          lat: geoLocation.lat,
          lng: geoLocation.lng,
          accuracy: geoLocation.accuracy,
        },
      }));
    }
  }, [geoLocation.lat, geoLocation.lng, geoLocation.timestamp, shareMyLocation]);

  const [notifiedNearby, setNotifiedNearby] = useState(false);
  const { toast } = useToast();

  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 3959;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  useEffect(() => {
    if (notifiedNearby) return;
    if (!liveLocation) return;
    if (!trackingData?.pickup?.lat || !trackingData?.pickup?.lng) return;

    const distance = calculateDistance(
      liveLocation.lat, 
      liveLocation.lng, 
      trackingData.pickup.lat, 
      trackingData.pickup.lng
    );
    const etaMinutes = Math.round(distance / 0.5);

    if (etaMinutes <= 5 && distance < 3) {
      setNotifiedNearby(true);
      
      toast({
        title: "Your Pro is almost there!",
        description: `Arriving in approximately ${etaMinutes} minute${etaMinutes !== 1 ? 's' : ''}`,
      });

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('UpTend - Pro Nearby!', {
          body: `Your Pro will arrive in about ${etaMinutes} minute${etaMinutes !== 1 ? 's' : ''}`,
          icon: '/favicon.ico',
        });
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission()
          .then(permission => {
            if (permission === 'granted') {
              new Notification('UpTend - Pro Nearby!', {
                body: `Your Pro will arrive in about ${etaMinutes} minute${etaMinutes !== 1 ? 's' : ''}`,
                icon: '/favicon.ico',
              });
            }
          })
          .catch(error => {
            console.warn('Failed to request notification permission:', error);
            // Silently fail - not critical to user experience
          });
      }
    }
  }, [liveLocation, trackingData?.pickup, notifiedNearby, calculateDistance, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-12">
          <div className="max-w-4xl mx-auto px-4 flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  if (!trackingData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-12">
          <div className="max-w-4xl mx-auto px-4 text-center py-20">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Job Not Found</h2>
            <p className="text-muted-foreground mb-6">
              We couldn't find this job. It may have been completed or cancelled.
            </p>
            <Button onClick={() => navigate("/")} data-testid="button-go-home">
              Return Home
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const { job, haulerLocation, pickup, destination } = trackingData;
  const currentLocation = liveLocation || (haulerLocation ? { lat: haulerLocation.lat, lng: haulerLocation.lng } : null);
  const statusIndex = getStatusIndex(job.status);
  const progressPercent = ((statusIndex + 1) / statusSteps.length) * 100;

  return (
    <div className="min-h-screen bg-background" data-testid="page-tracking">
      <Header />
      
      <main className="pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-bold">Track Your Pro</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Job #{params.jobId?.slice(0, 8)}</span>
                <Badge 
                  variant={connectionStatus === "connected" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {connectionStatus === "connected" ? "Live" : connectionStatus === "connecting" ? "Connecting..." : "Offline"}
                </Badge>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => refetch()}
              data-testid="button-refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          <Card className="overflow-hidden mb-6" data-testid="map-container">
            {currentLocation || (pickup.lat && pickup.lng) ? (
              <LiveTrackingMap
                customerLocation={pickup.lat && pickup.lng ? { lat: pickup.lat, lng: pickup.lng } : null}
                proLocation={currentLocation}
                destinationLocation={destination?.lat && destination?.lng ? { lat: destination.lat, lng: destination.lng } : null}
                proName={job.hauler?.profile?.companyName || job.hauler?.firstName || "Pro"}
                eta={currentLocation && pickup.lat && pickup.lng ? Math.round(calculateDistance(currentLocation.lat, currentLocation.lng, pickup.lat, pickup.lng) / 0.5) : undefined}
                distance={currentLocation && pickup.lat && pickup.lng ? calculateDistance(currentLocation.lat, currentLocation.lng, pickup.lat, pickup.lng) : undefined}
                height="300px"
              />
            ) : (
              <MapPlaceholder 
                haulerLocation={currentLocation}
                pickupAddress={pickup.address}
              />
            )}
          </Card>

          {/* Real-Time Matching countdown */}
          {job.status === "matching" && (
            <MatchingCountdown 
              matchingExpiresAt={job.matchingExpiresAt || null}
              needsManualMatch={job.needsManualMatch || false}
            />
          )}

          <Card className="p-4 mb-6" data-testid="status-progress">
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                {statusSteps.map((step, i) => (
                  <span 
                    key={step.id}
                    className={`text-center flex-1 ${
                      i <= statusIndex ? "text-primary font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                ))}
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                <span className="font-medium">
                  {job.status === "assigned" ? "Pro is on the way" :
                   job.status === "in_progress" ? "Job in progress" :
                   job.status === "completed" ? "Job completed" : "Finding Pro..."}
                </span>
              </div>
              {currentLocation && (
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>ETA: 15-25 min</span>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-4 mb-6" data-testid="share-location">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${shareMyLocation && geoLocation.isTracking ? "bg-green-500/20" : "bg-muted"}`}>
                  <Locate className={`w-5 h-5 ${shareMyLocation && geoLocation.isTracking ? "text-green-600" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className="font-medium">Share My Location</p>
                  <p className="text-xs text-muted-foreground">
                    {shareMyLocation && geoLocation.isTracking 
                      ? "Your Pro can see where you are" 
                      : geoLocation.error 
                        ? "Location access denied"
                        : "Help your Pro find you faster"}
                  </p>
                </div>
              </div>
              <Switch
                checked={shareMyLocation}
                onCheckedChange={setShareMyLocation}
                data-testid="switch-share-location"
              />
            </div>
            {shareMyLocation && geoLocation.lat && geoLocation.lng && (
              <div className="mt-3 pt-3 border-t text-xs text-muted-foreground flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>Location sharing active ({geoLocation.accuracy?.toFixed(0) || "~"}m accuracy)</span>
              </div>
            )}
          </Card>

          {job.hauler && (
            <Card className="p-4 mb-6" data-testid="hauler-info">
              {/* Call deadline notice */}
              {job.acceptedAt && !job.contactConfirmedAt && (
                <CallDeadlineCountdown 
                  acceptedAt={job.acceptedAt} 
                  contactRequiredBy={job.contactRequiredBy} 
                />
              )}
              {job.contactConfirmedAt && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    Your Pro has confirmed they called you
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-4">
                <Avatar className="w-14 h-14 border-2 border-background">
                  <AvatarImage src={hauler1} alt={job.hauler.profile.companyName} />
                  <AvatarFallback>{job.hauler.firstName?.charAt(0) || job.hauler.profile.companyName?.charAt(0) || 'H'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{job.hauler.firstName} {job.hauler.lastName}</h3>
                    <PyckerTierBadge tier={job.hauler.profile.pyckerTier || 'independent'} size="sm" />
                  </div>
                  <p className="text-sm text-muted-foreground">{job.hauler.profile.companyName}</p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span>{job.hauler.profile.rating}</span>
                    <span>({job.hauler.profile.reviewCount} reviews)</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="icon" 
                    variant="outline" 
                    asChild
                    data-testid="button-call-hauler"
                  >
                    <a href={`tel:${job.hauler.profile.phone || job.hauler.phone}`}>
                      <Phone className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button 
                    size="icon" 
                    variant="outline" 
                    asChild
                    data-testid="button-message-hauler"
                  >
                    <a href={`sms:${job.hauler.profile.phone || job.hauler.phone}`}>
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Phone</span>
                  <p className="font-medium" data-testid="text-hauler-phone">
                    {job.hauler.profile.phone || job.hauler.phone || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email</span>
                  <p className="font-medium truncate" data-testid="text-hauler-email">
                    {job.hauler.email || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Vehicle</span>
                  <p className="font-medium">
                    {job.hauler.activeVehicle 
                      ? `${job.hauler.activeVehicle.year || ''} ${job.hauler.activeVehicle.make || ''} ${job.hauler.activeVehicle.model || ''}`.trim() || job.hauler.profile.vehicleType.replace("_", " ")
                      : job.hauler.profile.vehicleType.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">License Plate</span>
                  <p className="font-medium font-mono" data-testid="text-hauler-license">
                    {job.hauler.activeVehicle?.licensePlate || "N/A"}
                  </p>
                </div>
              </div>
              
              {job.hauler.activeVehicle && (
                <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Capacity</span>
                    <p className="font-medium">{job.hauler.activeVehicle.capacity || job.hauler.profile.capacity}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type</span>
                    <p className="font-medium">{job.hauler.activeVehicle.vehicleType?.replace("_", " ") || "N/A"}</p>
                  </div>
                </div>
              )}
              
              {/* Pro Tier Info and Disclaimer */}
              <div className="mt-4 pt-4 border-t">
                <PyckerTierInfo tier={job.hauler.profile.pyckerTier || 'independent'} />
              </div>
            </Card>
          )}

          <Card className="p-4" data-testid="job-details">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Job Details
            </h3>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <div className="w-0.5 h-8 bg-border" />
                  <div className="w-3 h-3 rounded-full border-2 border-primary" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground">PICKUP</p>
                    <p className="font-medium">{pickup.address}</p>
                    <p className="text-sm text-muted-foreground">{job.pickupCity}, {job.pickupZip}</p>
                  </div>
                  {destination && (
                    <div>
                      <p className="text-xs text-muted-foreground">DESTINATION</p>
                      <p className="font-medium">{destination.address}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Service Type</span>
                  <p className="font-medium">{job.serviceType.replace("_", " ")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Load Size</span>
                  <p className="font-medium">{job.loadEstimate.replace("_", " ")}</p>
                </div>
                {job.livePrice && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Estimated Price</span>
                    <p className="font-semibold text-lg">${job.livePrice.toFixed(0)}</p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {job.status === "in_progress" && (
            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">Job In Progress</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Your Pro is working on your job. The final price will be confirmed upon completion.
                </p>
              </div>
            </div>
          )}

          {job.status === "completed" && (
            <div className="mt-6 space-y-6">
              <GreenVerifiedReceipt serviceRequestId={job.id} />
              <EnvironmentalCertificate serviceRequestId={job.id} />
              
              <EsgImpactDashboard
                serviceRequestId={job.id}
                customerId={job.customerId}
              />

              <CircularEconomyAgent
                serviceRequestId={job.id}
                photoUrls={job.photoUrls || []}
                existingItems={(() => {
                  try {
                    const items = job.verifiedItems ? JSON.parse(job.verifiedItems) : (job.customerItems ? JSON.parse(job.customerItems) : []);
                    return items.map((item: any) => typeof item === "string" ? item : item.name || item.label || "Item");
                  } catch {
                    return [];
                  }
                })()}
              />

              {job.hauler && (
                <>
                  <ReviewForm 
                    haulerId={job.hauler.profile.id}
                    customerId={job.customerId}
                    serviceRequestId={job.id}
                    haulerName={job.hauler.profile.companyName}
                  />
                  <DisputeForm
                    serviceRequestId={job.id}
                    customerId={job.customerId}
                    proId={job.hauler.profile.id}
                    photosBefore={job.photoUrls || []}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ReviewForm({
  haulerId,
  customerId,
  serviceRequestId,
  haulerName
}: {
  haulerId: string;
  customerId: string;
  serviceRequestId: string;
  haulerName: string;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: existingReview } = useQuery<HaulerReview | null>({
    queryKey: ["/api/service-requests", serviceRequestId, "review"],
    queryFn: async () => {
      const res = await fetch(`/api/service-requests/${serviceRequestId}/review`, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!serviceRequestId,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/service-requests/${serviceRequestId}/review`, {
        rating,
        comment: comment || undefined,
      });
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/haulers"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (existingReview || submitted) {
    return (
      <Card className="mt-6 p-6 bg-green-50 dark:bg-green-900/20" data-testid="review-submitted">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <div>
            <p className="font-medium text-green-800 dark:text-green-200">Thanks for your review!</p>
            <p className="text-sm text-green-700 dark:text-green-300">
              Your feedback helps other customers find great Pros.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mt-6 p-6" data-testid="review-form">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Star className="w-5 h-5 text-primary" />
        Rate Your Experience with {haulerName}
      </h3>

      <div className="space-y-4">
        <div>
          <Label className="mb-2 block">Your Rating</Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-1 transition-transform hover:scale-110"
                data-testid={`star-${star}`}
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="review-title">Title (optional)</Label>
          <Input
            id="review-title"
            placeholder="Summarize your experience"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            data-testid="input-review-title"
          />
        </div>

        <div>
          <Label htmlFor="review-comment">Your Review (optional)</Label>
          <Textarea
            id="review-comment"
            placeholder="Tell others about your experience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            data-testid="input-review-comment"
          />
        </div>

        <Button
          onClick={() => submitMutation.mutate()}
          disabled={submitMutation.isPending}
          className="w-full"
          data-testid="button-submit-review"
        >
          {submitMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Submit Review
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
