import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Shield, Users } from "lucide-react";
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
          {totalOnline > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium">{t("pros_near.pros_online", { count: totalOnline })}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{t("pros_near.verified_insured")}</span>
          </div>
        </div>

        {/* Map or empty state */}
        <Card className="overflow-hidden rounded-2xl shadow-lg" style={{ height: "450px" }}>
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3 animate-pulse" />
                <p className="text-muted-foreground">{t("pros_near.loading")}</p>
              </div>
            </div>
          ) : pros.length === 0 ? (
            <div className="h-full flex items-center justify-center bg-muted/30">
              <div className="text-center px-6">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-bold text-lg mb-2">Pros joining your area soon</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                  We're onboarding verified Pros across the Orlando metro area. Book a service and we'll match you with the best available Pro.
                </p>
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
