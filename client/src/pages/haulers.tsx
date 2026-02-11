import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import {
  Star, MapPin, Phone, Globe, Truck, Shield, Clock, ChevronLeft,
  CheckCircle, ExternalLink, Navigation, MessageSquare, Package, Sofa, Zap, Home,
  Users, Lightbulb, Wrench
} from "lucide-react";
import { SiFacebook, SiInstagram, SiX, SiYelp } from "react-icons/si";
import type { HaulerWithProfile, HaulerReviewWithCustomer } from "@shared/schema";

const SERVICE_TYPES = [
  { value: "all", label: "All Services", icon: Truck },
  { value: "junk_removal", label: "Junk Removal", icon: Package },
  { value: "furniture_moving", label: "Furniture Moving", icon: Sofa },
  { value: "garage_cleanout", label: "Garage Cleanout", icon: Home },
  { value: "estate_cleanout", label: "Estate Cleanout", icon: Home },
];

const CAPABILITY_TYPES = [
  { value: "all", label: "Any Vehicle", icon: Truck },
  { value: "pickup_truck", label: "Pickup Truck", icon: Truck },
  { value: "cargo_van", label: "Cargo Van", icon: Truck },
  { value: "box_truck", label: "Box Truck", icon: Truck },
  { value: "flatbed", label: "Flatbed", icon: Truck },
  { value: "trailer", label: "Trailer", icon: Truck },
];

type SearchResult = {
  matches: HaulerWithProfile[];
  suggestions: HaulerWithProfile[];
};

function calculateETA(
  haulerLat: number | null | undefined, 
  haulerLng: number | null | undefined, 
  customerLat: number | null, 
  customerLng: number | null
): string | null {
  if (!haulerLat || !haulerLng || !customerLat || !customerLng) return null;
  
  const R = 3959;
  const dLat = (customerLat - haulerLat) * Math.PI / 180;
  const dLon = (customerLng - haulerLng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(haulerLat * Math.PI / 180) * Math.cos(customerLat * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distanceMiles = R * c;
  
  const avgSpeedMph = 25;
  const etaMinutes = Math.round((distanceMiles / avgSpeedMph) * 60);
  
  if (etaMinutes < 5) return "< 5 min";
  if (etaMinutes < 60) return `${etaMinutes} min`;
  const hours = Math.floor(etaMinutes / 60);
  const mins = etaMinutes % 60;
  return `${hours}h ${mins}m`;
}

function ReviewsDialog({ 
  haulerId, 
  companyName, 
  open, 
  onOpenChange 
}: { 
  haulerId: string; 
  companyName: string; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const { data: reviews, isLoading } = useQuery<HaulerReviewWithCustomer[]>({
    queryKey: ["/api/pros", haulerId, "reviews"],
    queryFn: async () => {
      const res = await fetch(`/api/pros/${haulerId}/reviews`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: open && !!haulerId,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Reviews for {companyName}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-96">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : reviews && reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>
                          {review.customer?.firstName?.charAt(0) || "C"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">
                        {review.customer ? `${review.customer.firstName || ''} ${review.customer.lastName || ''}`.trim() || "Customer" : "Customer"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.title && (
                    <p className="font-medium text-sm mb-1">{review.title}</p>
                  )}
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No reviews yet</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function HaulerCard({ 
  hauler, 
  customerLat, 
  customerLng 
}: { 
  hauler: HaulerWithProfile; 
  customerLat: number | null; 
  customerLng: number | null;
}) {
  const profile = hauler.profile;
  const [showReviews, setShowReviews] = useState(false);
  
  const vehicleLabels: Record<string, string> = {
    pickup_truck: "Pickup Truck",
    cargo_van: "Cargo Van",
    box_truck: "Box Truck",
    flatbed: "Flatbed",
    trailer: "Trailer",
    none: "No Vehicle",
  };

  const capabilityLabels: Record<string, string> = {
    pickup_truck: "Pickup",
    cargo_van: "Cargo Van",
    box_truck: "Box Truck",
    flatbed: "Flatbed",
    trailer: "Trailer",
    labor_only: "Labor Only",
    uhaul_unload: "U-Haul Help",
    furniture_assembly: "Furniture Assembly",
  };

  const eta = calculateETA(profile?.currentLat, profile?.currentLng, customerLat, customerLng);

  const serviceTypeLabels: Record<string, string> = {
    junk_removal: "Junk Removal",
    furniture_moving: "Furniture",
    garage_cleanout: "Garage Cleanout",
    estate_cleanout: "Estate Cleanout",
  };

  return (
    <>
      <Card className="p-5 hover-elevate" data-testid={`card-pro-${hauler.id}`}>
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={hauler.profileImageUrl || undefined} />
            <AvatarFallback className="text-lg">
              {profile?.companyName?.charAt(0) || hauler.firstName?.charAt(0) || "P"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-lg">{profile?.companyName || `${hauler.firstName || ''} ${hauler.lastName || ''}`.trim() || 'Pro'}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {profile?.verified && (
                    <Badge variant="secondary">
                      <Shield className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  {eta && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <Navigation className="w-3 h-3 mr-1" />
                      {eta} away
                    </Badge>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setShowReviews(true)}
                className="flex items-center gap-1 shrink-0 hover:opacity-80 transition-opacity"
                data-testid={`button-reviews-${hauler.id}`}
              >
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{profile?.rating || 5.0}</span>
                <span className="text-muted-foreground text-sm">
                  ({profile?.reviewCount || 0})
                </span>
              </button>
            </div>
          </div>
        </div>

        {profile?.serviceTypes && profile.serviceTypes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {profile.serviceTypes.map((type) => (
              <Badge key={type} variant="outline" className="text-xs">
                {serviceTypeLabels[type] || type}
              </Badge>
            ))}
          </div>
        )}

        {profile?.capabilities && profile.capabilities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {profile.capabilities.map((cap) => (
              <Badge key={cap} variant="secondary" className="text-xs">
                {capabilityLabels[cap] || cap}
              </Badge>
            ))}
            {profile.offersLaborOnly && (
              <Badge variant="default" className="text-xs bg-primary">
                <Users className="w-3 h-3 mr-1" />
                Movers Available
              </Badge>
            )}
          </div>
        )}

        {profile?.bio && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {profile.bio}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-muted-foreground" />
            <span>{vehicleLabels[profile?.vehicleType || ""] || profile?.vehicleType}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span>{profile?.serviceRadius || 25} mi radius</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-muted-foreground" />
            <span>{profile?.jobsCompleted || 0} jobs done</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>{profile?.yearsInBusiness || 1}+ years</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          {profile?.phone && (
            <Button variant="outline" size="sm" asChild data-testid={`button-call-${hauler.id}`}>
              <a href={`tel:${profile.phone}`}>
                <Phone className="w-4 h-4 mr-1" />
                Call
              </a>
            </Button>
          )}
          {profile?.website && (
            <Button variant="outline" size="sm" asChild data-testid={`button-website-${hauler.id}`}>
              <a href={profile.website} target="_blank" rel="noopener noreferrer">
                <Globe className="w-4 h-4 mr-1" />
                Website
              </a>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3 pt-3 border-t">
          <span className="text-xs text-muted-foreground">Follow:</span>
          {profile?.facebookUrl && (
            <a href={profile.facebookUrl} target="_blank" rel="noopener noreferrer" 
               className="text-muted-foreground hover:text-foreground transition-colors"
               data-testid={`link-facebook-${hauler.id}`}>
              <SiFacebook className="w-4 h-4" />
            </a>
          )}
          {profile?.instagramUrl && (
            <a href={profile.instagramUrl} target="_blank" rel="noopener noreferrer"
               className="text-muted-foreground hover:text-foreground transition-colors"
               data-testid={`link-instagram-${hauler.id}`}>
              <SiInstagram className="w-4 h-4" />
            </a>
          )}
          {profile?.twitterUrl && (
            <a href={profile.twitterUrl} target="_blank" rel="noopener noreferrer"
               className="text-muted-foreground hover:text-foreground transition-colors"
               data-testid={`link-twitter-${hauler.id}`}>
              <SiX className="w-4 h-4" />
            </a>
          )}
          {profile?.yelpUrl && (
            <a href={profile.yelpUrl} target="_blank" rel="noopener noreferrer"
               className="text-muted-foreground hover:text-foreground transition-colors"
               data-testid={`link-yelp-${hauler.id}`}>
              <SiYelp className="w-4 h-4" />
            </a>
          )}
          <div className="flex-1" />
          <Button size="sm" asChild data-testid={`button-book-${hauler.id}`}>
            <Link href="/book">
              Book Now
              <ExternalLink className="w-3 h-3 ml-1" />
            </Link>
          </Button>
        </div>
      </Card>

      <ReviewsDialog
        haulerId={profile?.id || ""}
        companyName={profile?.companyName || `${hauler.firstName || ''} ${hauler.lastName || ''}`.trim() || "Pro"}
        open={showReviews}
        onOpenChange={setShowReviews}
      />
    </>
  );
}

export default function Haulers() {
  const [selectedServiceType, setSelectedServiceType] = useState("all");
  const [selectedCapability, setSelectedCapability] = useState("all");
  const [laborOnly, setLaborOnly] = useState(false);
  const [customerLocation, setCustomerLocation] = useState<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCustomerLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          setCustomerLocation({ lat: 37.7749, lng: -122.4194 });
        }
      );
    } else {
      setCustomerLocation({ lat: 37.7749, lng: -122.4194 });
    }
  }, []);

  const { data: searchResult, isLoading } = useQuery<SearchResult>({
    queryKey: ["/api/pros/search", selectedServiceType, selectedCapability, laborOnly],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedServiceType !== "all") params.set("serviceType", selectedServiceType);
      if (selectedCapability !== "all") params.set("capability", selectedCapability);
      if (laborOnly) params.set("laborOnly", "true");
      params.set("availableOnly", "true");

      const res = await fetch(`/api/pros/search?${params.toString()}`);
      if (!res.ok) return { matches: [], suggestions: [] };
      return res.json();
    },
  });

  const filteredHaulers = searchResult?.matches || [];
  const suggestions = searchResult?.suggestions || [];

  const hasActiveFilters = selectedServiceType !== "all" || selectedCapability !== "all" || laborOnly;

  const clearFilters = () => {
    setSelectedServiceType("all");
    setSelectedCapability("all");
    setLaborOnly(false);
  };

  return (
    <div className="min-h-screen bg-background" data-testid="page-pros">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Truck className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold">UpTend</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Available Pros</h1>
          <p className="text-muted-foreground">
            Browse verified Pros ready to work now. View ratings, contact info, and book instantly.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <p className="text-sm text-muted-foreground mb-3">Filter by service type:</p>
            <div className="flex flex-wrap gap-2">
              {SERVICE_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <Button
                    key={type.value}
                    variant={selectedServiceType === type.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedServiceType(type.value)}
                    data-testid={`filter-${type.value}`}
                  >
                    <Icon className="w-4 h-4 mr-1" />
                    {type.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-3">Filter by vehicle/equipment:</p>
            <div className="flex flex-wrap gap-2">
              {CAPABILITY_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <Button
                    key={type.value}
                    variant={selectedCapability === type.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCapability(type.value)}
                    data-testid={`filter-capability-${type.value}`}
                  >
                    <Icon className="w-4 h-4 mr-1" />
                    {type.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="labor-only"
                checked={laborOnly}
                onCheckedChange={setLaborOnly}
                data-testid="switch-labor-only"
              />
              <Label htmlFor="labor-only" className="flex items-center gap-2 cursor-pointer">
                <Users className="w-4 h-4" />
                Movers Only (no vehicle needed)
              </Label>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="button-clear-filters">
                Clear all filters
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-5">
                <div className="flex items-start gap-4 mb-4">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-16 w-full mb-4" />
                <Skeleton className="h-10 w-full" />
              </Card>
            ))}
          </div>
        ) : filteredHaulers && filteredHaulers.length > 0 ? (
          <>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-muted-foreground">
                {filteredHaulers.length} Pro{filteredHaulers.length !== 1 ? "s" : ""} online now
                {selectedServiceType !== "all" && ` for ${SERVICE_TYPES.find(t => t.value === selectedServiceType)?.label}`}
              </span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHaulers.map((hauler) => (
                <HaulerCard 
                  key={hauler.id} 
                  hauler={hauler} 
                  customerLat={customerLocation.lat}
                  customerLng={customerLocation.lng}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-8">
            <Card className="p-8 text-center">
              <Truck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">
                {hasActiveFilters
                  ? "No Pros Match Your Filters"
                  : "No Pros Available Right Now"}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {hasActiveFilters
                  ? "Try adjusting your filters or check out our suggestions below."
                  : "All our Pros are currently busy or offline. Check back soon or book a job and we'll match you when someone becomes available."}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear All Filters
                  </Button>
                )}
                <Button asChild>
                  <Link href="/book">Book a Job Anyway</Link>
                </Button>
              </div>
            </Card>

            {suggestions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  <h2 className="text-lg font-semibold">Suggested Available Pros</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  These Pros are available now and may be able to help with your job:
                </p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {suggestions.map((hauler) => (
                    <HaulerCard 
                      key={hauler.id} 
                      hauler={hauler} 
                      customerLat={customerLocation.lat}
                      customerLng={customerLocation.lng}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
