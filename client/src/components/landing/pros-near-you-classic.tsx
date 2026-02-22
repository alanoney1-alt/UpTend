import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Shield, Star, Users, MapPin } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

interface ActivePro {
  id: string;
  firstName: string;
  lastName: string;
  rating: number;
  jobsCompleted: number;
  serviceTypes: string[];
  location: { latitude: number; longitude: number };
  isAvailable: boolean;
}

// Orange circle marker for pros (matches brand)
const proMarkerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export function ProsNearYou() {
  const [pros, setPros] = useState<ActivePro[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalOnline, setTotalOnline] = useState(0);

  useEffect(() => {
    fetch("/api/pros/active-nearby?lat=28.5383&lng=-81.3792&radius=30")
      .then(r => r.json())
      .then(data => {
        const realPros = data.pros || [];
        setPros(realPros);
        setTotalOnline(data.totalOnline || realPros.length);
        setLoading(false);
      })
      .catch(() => {
        setPros([]);
        setTotalOnline(0);
        setLoading(false);
      });
  }, []);

  const center: [number, number] = [28.5383, -81.3792];
  const hasRealPros = pros.length > 0;

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-3">Pros Active in Orlando Metro</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Verified professionals across Orange, Seminole, and Osceola counties.
            Every pro is background-checked with $1M liability insurance.
          </p>
        </div>

        {/* Stats bar */}
        <div className="flex justify-center gap-6 mb-8 flex-wrap">
          {hasRealPros && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium">{totalOnline} Pros Online</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">All Verified & Insured</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium">Background-Checked Pros</span>
          </div>
        </div>

        {/* Map */}
        <Card className="overflow-hidden rounded-2xl shadow-lg h-[300px] md:h-[450px]">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3 animate-pulse" />
                <p className="text-muted-foreground">Loading active Pros...</p>
              </div>
            </div>
          ) : (
            <div className="relative h-full">
              <MapContainer
                center={center}
                zoom={10}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={false}
                dragging={true}
                zoomControl={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {pros.map((pro) => (
                  <Marker
                    key={pro.id}
                    position={[pro.location.latitude, pro.location.longitude]}
                    icon={proMarkerIcon}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-semibold">{pro.firstName} {pro.lastName.charAt(0)}.</p>
                        <p className="text-amber-600">★ {pro.rating} · {pro.jobsCompleted} jobs</p>
                        <p className="text-xs text-gray-500 mt-1">{pro.serviceTypes.join(", ")}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
              {/* Overlay message when no real pros are tracking */}
              {!hasRealPros && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] z-[1000]">
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-xl text-center max-w-sm mx-4">
                    <MapPin className="w-10 h-10 text-primary mx-auto mb-3" />
                    <h3 className="font-bold text-lg mb-2">Pros Available in Your Area</h3>
                    <p className="text-sm text-muted-foreground">
                      Background-checked, insured professionals across the Orlando metro area are ready to help. Book now to get matched with a verified pro.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Pro locations are approximate for privacy. Exact location shared only after booking.
        </p>
      </div>
    </section>
  );
}
