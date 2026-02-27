import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "@/lib/leaflet-fix";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Truck, Star, Clock, MapPin, Navigation, Loader2 } from "lucide-react";

import hauler1 from "@assets/stock_images/professional_male_wo_ae620e83.jpg";

interface NearbyPro {
  id: string | number;
  firstName: string;
  lastName: string;
  vehicleType: string;
  rating: number | null;
  jobsCompleted: number;
  distance: number;
  eta: number;
  location: {
    latitude: number;
    longitude: number;
  };
  profilePhotoUrl?: string;
  isVerifiedPro?: boolean;
}

// Legacy type alias for backward compatibility
type NearbyPycker = NearbyPro;

interface ProMapProps {
  customerLocation: { lat: number; lng: number } | null;
  pros?: NearbyPro[];
  selectedProId?: string | number | null;
  onProSelect?: (pro: NearbyPro) => void;
  showRadius?: boolean;
  radiusMiles?: number;
  height?: string;
  isLoading?: boolean;
  trackingMode?: boolean;
  proLocation?: { lat: number; lng: number } | null;
  destinationLocation?: { lat: number; lng: number } | null;
}

// Legacy interface alias for backward compatibility
type PyckerMapProps = ProMapProps;

const customerIcon = new L.Icon({
  iconUrl: "data:image/svg+xml;base64," + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0f172a" width="32" height="32">
      <circle cx="12" cy="12" r="10" fill="#0f172a" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

const proIcon = new L.Icon({
  iconUrl: "data:image/svg+xml;base64," + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="40" height="40">
      <circle cx="16" cy="16" r="14" fill="#F47C20" stroke="white" stroke-width="2"/>
      <path d="M8 18h4v-2h8v2h4l-2 4H10l-2-4z" fill="white"/>
      <rect x="10" y="12" width="12" height="4" rx="1" fill="white"/>
    </svg>
  `),
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

// Legacy alias for backward compatibility
const pyckerIcon = proIcon;

const selectedProIcon = new L.Icon({
  iconUrl: "data:image/svg+xml;base64," + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="48" height="48">
      <circle cx="16" cy="16" r="14" fill="#22c55e" stroke="white" stroke-width="3"/>
      <path d="M8 18h4v-2h8v2h4l-2 4H10l-2-4z" fill="white"/>
      <rect x="10" y="12" width="12" height="4" rx="1" fill="white"/>
    </svg>
  `),
  iconSize: [48, 48],
  iconAnchor: [24, 24],
  popupAnchor: [0, -24],
});

// Legacy alias for backward compatibility
const selectedPyckerIcon = selectedProIcon;

const destinationIcon = new L.Icon({
  iconUrl: "data:image/svg+xml;base64," + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#22c55e" stroke="white" stroke-width="1"/>
      <circle cx="12" cy="9" r="3" fill="white"/>
    </svg>
  `),
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -40],
});

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

function FitBounds({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
}

export function ProMap({
  customerLocation,
  pros = [],
  selectedProId,
  onProSelect,
  showRadius = true,
  radiusMiles = 25,
  height = "400px",
  isLoading = false,
  trackingMode = false,
  proLocation,
  destinationLocation,
}: ProMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([25.7617, -80.1918]);
  const [mapZoom, setMapZoom] = useState(12);

  useEffect(() => {
    if (customerLocation) {
      setMapCenter([customerLocation.lat, customerLocation.lng]);
    }
  }, [customerLocation]);

  const radiusMeters = radiusMiles * 1609.34;

  if (!customerLocation && !trackingMode) {
    return (
      <Card className="flex items-center justify-center" style={{ height }} data-testid="map-no-location">
        <div className="text-center p-6">
          <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Enable location to see nearby Pros</p>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="flex items-center justify-center" style={{ height }} data-testid="map-loading">
        <div className="text-center p-6">
          <Loader2 className="w-8 h-8 mx-auto text-primary animate-spin mb-3" />
          <p className="text-muted-foreground">Finding nearby Pros...</p>
        </div>
      </Card>
    );
  }

  const computeBounds = () => {
    if (!trackingMode || !proLocation || !customerLocation) return null;
    const bounds = L.latLngBounds([
      [customerLocation.lat, customerLocation.lng],
      [proLocation.lat, proLocation.lng],
    ]);
    if (destinationLocation) {
      bounds.extend([destinationLocation.lat, destinationLocation.lng]);
    }
    return bounds;
  };
  const bounds = computeBounds();

  return (
    <Card className="overflow-hidden" style={{ height }} data-testid="pycker-map">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {bounds && <FitBounds bounds={bounds} />}

        {customerLocation && (
          <>
            <Marker position={[customerLocation.lat, customerLocation.lng]} icon={customerIcon}>
              <Popup>
                <div className="text-center">
                  <p className="font-semibold">Your Location</p>
                </div>
              </Popup>
            </Marker>

            {showRadius && !trackingMode && (
              <Circle
                center={[customerLocation.lat, customerLocation.lng]}
                radius={radiusMeters}
                pathOptions={{
                  color: "#0f172a",
                  fillColor: "#0f172a",
                  fillOpacity: 0.1,
                  weight: 2,
                  dashArray: "5, 5",
                }}
              />
            )}
          </>
        )}

        {trackingMode && proLocation && (
          <Marker position={[proLocation.lat, proLocation.lng]} icon={selectedProIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold text-green-600">Your Pro</p>
                <p className="text-sm text-muted-foreground">En route to you</p>
              </div>
            </Popup>
          </Marker>
        )}

        {trackingMode && destinationLocation && (
          <Marker position={[destinationLocation.lat, destinationLocation.lng]} icon={destinationIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold">Destination</p>
              </div>
            </Popup>
          </Marker>
        )}

        {!trackingMode && pros.map((pro) => (
          <Marker
            key={pro.id}
            position={[pro.location.latitude, pro.location.longitude]}
            icon={selectedProId === pro.id ? selectedProIcon : proIcon}
            eventHandlers={{
              click: () => onProSelect?.(pro),
            }}
          >
            <Popup>
              <div className="min-w-[200px]" data-testid={`map-popup-pycker-${pro.id}`}>
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={pro.profilePhotoUrl || hauler1} alt={pro.firstName} />
                    <AvatarFallback>{pro.firstName[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{pro.firstName} {pro.lastName?.[0]}.</p>
                    {pro.isVerifiedPro && (
                      <Badge variant="secondary" className="text-xs">Verified Pro</Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>{pro.rating?.toFixed(1) || "New"} ({pro.jobsCompleted} jobs)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-primary" />
                    <span>{pro.distance.toFixed(1)} miles away</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>~{pro.eta} min ETA</span>
                  </div>
                </div>
                {onProSelect && (
                  <Button
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => onProSelect(pro)}
                    data-testid={`button-select-pycker-${pro.id}`}
                  >
                    Select Pro
                  </Button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {!trackingMode && pros.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 pointer-events-none">
          <div className="text-center p-6">
            <Truck className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium">No Pros Available Nearby</p>
            <p className="text-sm text-muted-foreground mt-1">
              Pros will appear here when they're online
            </p>
          </div>
        </div>
      )}

      {!trackingMode && pros.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000]">
          <Card className="p-3 bg-background/95 backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-medium">
                  {pros.length} Pro{pros.length !== 1 ? "s" : ""} nearby
                </span>
              </div>
              <Badge variant="outline" className="text-xs">
                Within {radiusMiles} miles
              </Badge>
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
}

export function LiveTrackingMap({
  customerLocation,
  proLocation,
  destinationLocation,
  proName,
  eta,
  distance,
  height = "300px",
}: {
  customerLocation: { lat: number; lng: number } | null;
  proLocation: { lat: number; lng: number } | null;
  destinationLocation?: { lat: number; lng: number } | null;
  proName?: string;
  eta?: number;
  distance?: number;
  height?: string;
}) {
  return (
    <div className="relative" data-testid="live-tracking-map">
      <ProMap
        customerLocation={customerLocation}
        trackingMode={true}
        proLocation={proLocation}
        destinationLocation={destinationLocation}
        height={height}
        showRadius={false}
      />

      {proLocation && (
        <div className="absolute top-4 left-4 right-4 z-[1000]">
          <Card className="p-3 bg-background/95 backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium">
                  {proName || "Pro"} is on the way
                </span>
              </div>
              {eta && distance && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{distance.toFixed(1)} mi</span>
                  <span>~{eta} min</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// Legacy export aliases for backward compatibility
export const PyckerMap = ProMap;
