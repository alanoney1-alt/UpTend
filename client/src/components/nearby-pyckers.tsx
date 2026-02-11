import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Clock, Truck, Star, Loader2 } from "lucide-react";
import { ProTierBadge } from "./pycker-tier-badge";

interface NearbyPro {
  pro_id: string;
  latitude: number;
  longitude: number;
  status: string;
  distance: number;
  etaMinutes: number;
  company_name?: string;
  first_name?: string;
  last_name?: string;
  profile_photo?: string;
  rating?: number;
  total_jobs?: number;
  pro_tier?: string;
  vehicle_type?: string;
}

// Legacy type alias for backward compatibility
type NearbyPycker = NearbyPro;

interface NearbyProsResponse {
  pros: NearbyPro[];
  customerLocation: { lat: number; lng: number };
  searchRadiusMiles: number;
}

// Legacy type alias for backward compatibility
type NearbyPyckersResponse = NearbyProsResponse;

interface NearbyProsProps {
  customerLat?: number | null;
  customerLng?: number | null;
  radiusMiles?: number;
  maxDisplay?: number;
  showIfEmpty?: boolean;
}

export function NearbyPros({
  customerLat,
  customerLng,
  radiusMiles = 25,
  maxDisplay = 5,
  showIfEmpty = false,
}: NearbyProsProps) {
  const hasLocation = customerLat != null && customerLng != null;

  const queryUrl = `/api/pros/nearby?lat=${customerLat}&lng=${customerLng}&radius=${radiusMiles}`;

  const { data, isLoading, error } = useQuery<NearbyProsResponse>({
    queryKey: [queryUrl],
    enabled: hasLocation,
    refetchInterval: 30000,
    staleTime: 15000,
  });

  if (!hasLocation) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="p-4" data-testid="card-nearby-pyckers-loading">
        <div className="flex items-center gap-2 mb-3">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Finding nearby Pros...</span>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (error) {
    return null;
  }

  const pros = data?.pros || [];
  const displayPros = pros.slice(0, maxDisplay);

  if (displayPros.length === 0) {
    if (!showIfEmpty) return null;
    return (
      <Card className="p-4" data-testid="card-nearby-pyckers-empty">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Truck className="w-4 h-4" />
          <span className="text-sm">No Pros available nearby right now</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4" data-testid="card-nearby-pyckers">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Truck className="w-4 h-4 text-primary" />
          Pros Nearby
        </h3>
        <Badge variant="secondary" className="text-xs">
          {pros.length} available
        </Badge>
      </div>

      <div className="space-y-3">
        {displayPros.map((pro, index) => (
          <div
            key={pro.pro_id}
            className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
            data-testid={`card-nearby-pycker-${index}`}
          >
            <Avatar className="w-10 h-10 border-2 border-background">
              <AvatarImage src={pro.profile_photo || undefined} />
              <AvatarFallback className="text-xs">
                {pro.first_name?.[0] || pro.company_name?.[0] || "P"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">
                  {pro.company_name || `${pro.first_name || "Pro"}`}
                </span>
                {pro.pro_tier && (
                  <ProTierBadge tier={pro.pro_tier as "verified_pro" | "independent"} size="sm" />
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {pro.rating && (
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {pro.rating.toFixed(1)}
                  </span>
                )}
                {pro.total_jobs && (
                  <span>{pro.total_jobs} jobs</span>
                )}
                {pro.vehicle_type && (
                  <span className="capitalize">{pro.vehicle_type}</span>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span>{pro.distance.toFixed(1)} mi</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400 font-medium">
                <Clock className="w-3 h-3" />
                <span>~{pro.etaMinutes} min</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {pros.length > maxDisplay && (
        <p className="text-xs text-center text-muted-foreground mt-3">
          +{pros.length - maxDisplay} more Pros available
        </p>
      )}
    </Card>
  );
}

// Legacy export alias for backward compatibility
export const NearbyPyckers = NearbyPros;
