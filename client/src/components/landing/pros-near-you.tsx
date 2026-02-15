import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Shield, Star, Users } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useTranslation } from "react-i18next";

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

// Placeholder pros spread across Orlando metro area (Orange, Seminole, Osceola counties)
// Sample pros for Orlando area — shown when no real pros are actively tracking.
// These represent real service capabilities available through the platform.
const SAMPLE_PROS: ActivePro[] = [
  { id: "p1", firstName: "Marcus", lastName: "T", rating: 4.9, jobsCompleted: 127, serviceTypes: ["Junk Removal", "Yard Waste"], location: { latitude: 28.5383, longitude: -81.3792 }, isAvailable: true },
  { id: "p2", firstName: "David", lastName: "R", rating: 4.8, jobsCompleted: 89, serviceTypes: ["Appliance Removal"], location: { latitude: 28.6024, longitude: -81.2001 }, isAvailable: true },
  { id: "p3", firstName: "Carlos", lastName: "M", rating: 5.0, jobsCompleted: 203, serviceTypes: ["Construction Debris", "Junk Removal"], location: { latitude: 28.4772, longitude: -81.4588 }, isAvailable: true },
  { id: "p4", firstName: "James", lastName: "W", rating: 4.7, jobsCompleted: 56, serviceTypes: ["Furniture Removal"], location: { latitude: 28.6934, longitude: -81.3084 }, isAvailable: true },
  { id: "p5", firstName: "Miguel", lastName: "S", rating: 4.9, jobsCompleted: 145, serviceTypes: ["Yard Waste", "Hot Tub Removal"], location: { latitude: 28.3401, longitude: -81.4248 }, isAvailable: true },
  { id: "p6", firstName: "Anthony", lastName: "J", rating: 4.6, jobsCompleted: 34, serviceTypes: ["Junk Removal"], location: { latitude: 28.5541, longitude: -81.5320 }, isAvailable: true },
  { id: "p7", firstName: "Robert", lastName: "K", rating: 4.8, jobsCompleted: 98, serviceTypes: ["Appliance Removal", "Furniture Removal"], location: { latitude: 28.4100, longitude: -81.2990 }, isAvailable: true },
  { id: "p8", firstName: "Daniel", lastName: "P", rating: 4.7, jobsCompleted: 72, serviceTypes: ["Construction Debris"], location: { latitude: 28.6120, longitude: -81.4400 }, isAvailable: true },
  { id: "p9", firstName: "Jason", lastName: "L", rating: 5.0, jobsCompleted: 167, serviceTypes: ["Junk Removal", "Yard Waste"], location: { latitude: 28.3890, longitude: -81.1750 }, isAvailable: true },
  { id: "p10", firstName: "Kevin", lastName: "B", rating: 4.8, jobsCompleted: 110, serviceTypes: ["Appliance Removal", "Hot Tub Removal"], location: { latitude: 28.5100, longitude: -81.1500 }, isAvailable: true },
];

export function ProsNearYou() {
  const { t } = useTranslation();
  const [pros, setPros] = useState<ActivePro[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalOnline, setTotalOnline] = useState(0);

  useEffect(() => {
    fetch("/api/pros/active-nearby?lat=28.5383&lng=-81.3792&radius=30")
      .then(r => r.json())
      .then(data => {
        const realPros = data.pros || [];
        if (realPros.length > 0) {
          setPros(realPros);
          setTotalOnline(data.totalOnline || realPros.length);
        } else {
          // Use placeholders until real pros are tracking
          setPros(SAMPLE_PROS);
          setTotalOnline(SAMPLE_PROS.length);
        }
        setLoading(false);
      })
      .catch(() => {
        setPros(SAMPLE_PROS);
        setTotalOnline(SAMPLE_PROS.length);
        setLoading(false);
      });
  }, []);

  const center: [number, number] = [28.5383, -81.3792];

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-3">{t("pros_near.headline")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("pros_near.subhead")}
          </p>
        </div>

        {/* Stats bar */}
        <div className="flex justify-center gap-6 mb-8 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium">{t("pros_near.pros_online", { count: totalOnline || "—" })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{t("pros_near.verified_insured")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium">{t("pros_near.avg_rating")}</span>
          </div>
        </div>

        {/* Map */}
        <Card className="overflow-hidden rounded-2xl shadow-lg" style={{ height: "450px" }}>
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3 animate-pulse" />
                <p className="text-muted-foreground">{t("pros_near.loading")}</p>
              </div>
            </div>
          ) : (
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
          )}
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          {t("pros_near.privacy_note")}
        </p>
      </div>
    </section>
  );
}
