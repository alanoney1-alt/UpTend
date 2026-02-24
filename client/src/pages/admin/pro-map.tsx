import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Phone, RefreshCw, Star, Truck, MapPin } from "lucide-react";

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapPro {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  companyName: string;
  rating: number;
  jobsCompleted: number;
  serviceTypes: string[];
  location: { latitude: number; longitude: number };
  isAvailable: boolean;
  activeJobs: number;
  status: "online" | "offline" | "on_job";
}

// Green marker for online pros
const onlineIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Orange marker for on-job pros
const onJobIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Gray marker for offline pros
const offlineIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function getIcon(status: string) {
  if (status === "on_job") return onJobIcon;
  if (status === "online") return onlineIcon;
  return offlineIcon;
}

function getStatusColor(status: string) {
  if (status === "on_job") return "bg-orange-500";
  if (status === "online") return "bg-green-500";
  return "bg-gray-400";
}

function getStatusLabel(status: string) {
  if (status === "on_job") return "On Job";
  if (status === "online") return "Online";
  return "Offline";
}

export default function AdminProMap() {
  const [pros, setPros] = useState<MapPro[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchPros = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/pro-map", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPros(data.pros || []);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Failed to fetch pro map data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPros();
    const interval = setInterval(fetchPros, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, [fetchPros]);

  // Collect all unique service types for filter
  const allServiceTypes = Array.from(
    new Set(pros.flatMap(p => p.serviceTypes || []))
  ).sort();

  const filtered = pros.filter(p => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (serviceFilter !== "all" && !(p.serviceTypes || []).includes(serviceFilter)) return false;
    return true;
  });

  const onlineCount = pros.filter(p => p.status === "online").length;
  const onJobCount = pros.filter(p => p.status === "on_job").length;
  const offlineCount = pros.filter(p => p.status === "offline").length;

  const center: [number, number] = [28.5383, -81.3792];

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between bg-background shrink-0">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <MapPin className="w-5 h-5" /> Live Pro Map
          </h1>
          <p className="text-xs text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm mr-4">
            <span className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" /> {onlineCount} Online
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500" /> {onJobCount} On Job
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-400" /> {offlineCount} Offline
            </span>
          </div>

          {/* Filters */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="on_job">On Job</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>

          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Service Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {allServiceTypes.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={fetchPros} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-80 border-r overflow-y-auto bg-muted/30 shrink-0">
          <div className="p-3 border-b">
            <p className="text-sm font-medium">{filtered.length} Pros shown</p>
          </div>
          {filtered.map(pro => (
            <div key={pro.id} className="p-3 border-b hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">
                  {pro.firstName} {pro.lastName}
                </span>
                <div className={`w-2 h-2 rounded-full ${getStatusColor(pro.status)}`} />
              </div>
              {pro.companyName && (
                <p className="text-xs text-muted-foreground">{pro.companyName}</p>
              )}
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 text-amber-500" /> {pro.rating.toFixed(1)}
                </span>
                <span>{pro.jobsCompleted} jobs</span>
                <Badge variant="outline" className="text-[10px] px-1 py-0">
                  {getStatusLabel(pro.status)}
                </Badge>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No pros match the current filters.
            </div>
          )}
        </div>

        {/* Map */}
        <div className="flex-1">
          <MapContainer
            center={center}
            zoom={10}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filtered.map(pro => (
              <Marker
                key={pro.id}
                position={[pro.location.latitude, pro.location.longitude]}
                icon={getIcon(pro.status)}
              >
                <Popup>
                  <div className="text-sm min-w-[200px]">
                    <p className="font-bold text-base">{pro.firstName} {pro.lastName}</p>
                    {pro.companyName && <p className="text-gray-500">{pro.companyName}</p>}
                    <div className="mt-2 space-y-1">
                      <p> {pro.rating.toFixed(1)} · {pro.jobsCompleted} jobs completed</p>
                      <p>
                        Status:{" "}
                        <span className={
                          pro.status === "online" ? "text-green-600 font-medium" :
                          pro.status === "on_job" ? "text-orange-600 font-medium" :
                          "text-gray-500"
                        }>
                          {getStatusLabel(pro.status)}
                        </span>
                        {pro.activeJobs > 0 && ` (${pro.activeJobs} active)`}
                      </p>
                      {pro.phone && (
                        <p className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <a href={`tel:${pro.phone}`} className="text-blue-600 underline">{pro.phone}</a>
                        </p>
                      )}
                      {pro.serviceTypes.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">{pro.serviceTypes.join(", ")}</p>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
