import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "@/lib/leaflet-fix";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/landing/header";
import { 
  MapPin, Navigation, Clock, User, Phone, 
  Filter, RefreshCw, ArrowLeft, ChevronRight
} from "lucide-react";
import { Link } from "wouter";

interface Job {
  id: string;
  customer_name: string;
  customer_address: string;
  customer_phone?: string;
  customer_lat?: number;
  customer_lng?: number;
  service_type: string;
  description?: string;
  assigned_pro_id?: string;
  pro_first_name?: string;
  pro_last_name?: string;
  status: 'scheduled' | 'dispatched' | 'en_route' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_date: string;
  scheduled_time_start?: string;
  scheduled_time_end?: string;
  notes?: string;
}

interface ProLocation {
  pro_id: string;
  first_name: string;
  last_name: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  recorded_at: string;
}

// Map icons
function makeProIcon(name: string, isMoving: boolean = false) {
  const color = isMoving ? "#3b82f6" : "#6366f1";
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
      <circle cx="20" cy="20" r="18" fill="${color}" stroke="#fff" stroke-width="3"/>
      <text x="20" y="26" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${name.substring(0, 2).toUpperCase()}</text>
    </svg>`
  );
  return new L.Icon({
    iconUrl: `data:image/svg+xml,${svg}`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
}

function makeJobIcon(status: string) {
  const colors = {
    scheduled: "#94a3b8",
    dispatched: "#f59e0b",
    en_route: "#3b82f6", 
    arrived: "#10b981",
    in_progress: "#f97316",
    completed: "#22c55e",
    cancelled: "#ef4444"
  };
  
  const color = colors[status as keyof typeof colors] || "#94a3b8";
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 42" width="30" height="42">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 2.9.8 5.5 2.3 7.8L15 42l12.7-19.2C29.2 20.5 30 17.9 30 15 30 6.7 23.3 0 15 0z" fill="${color}"/>
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

const statusColors = {
  scheduled: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
  dispatched: "bg-amber-500/10 text-amber-700 dark:text-amber-400", 
  en_route: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  arrived: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  in_progress: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  completed: "bg-green-500/10 text-green-700 dark:text-green-400",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-400"
};

function MapController({ jobs, proLocations }: { jobs: Job[]; proLocations: ProLocation[] }) {
  const map = useMap();

  useEffect(() => {
    if (jobs.length === 0 && proLocations.length === 0) return;

    const bounds = L.latLngBounds([]);
    
    // Add job locations to bounds
    jobs.forEach(job => {
      if (job.customer_lat && job.customer_lng) {
        bounds.extend([job.customer_lat, job.customer_lng]);
      }
    });

    // Add pro locations to bounds  
    proLocations.forEach(location => {
      bounds.extend([location.lat, location.lng]);
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [jobs, proLocations, map]);

  return null;
}

export default function DispatchBoard() {
  const { slug } = useParams<{ slug: string }>();
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch dispatch board data
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["dispatch-board", slug],
    queryFn: async () => {
      const res = await fetch(`/api/dispatch/${slug}/board`);
      if (!res.ok) throw new Error("Failed to load dispatch board");
      return res.json();
    },
    refetchInterval: autoRefresh ? 10000 : false, // Auto-refresh every 10 seconds
  });

  // Filter jobs
  const filteredJobs = (data?.jobs || []).filter((job: Job) => {
    if (statusFilter !== "all" && job.status !== statusFilter) return false;
    if (searchQuery && !job.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !job.customer_address.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Map center calculation
  const mapCenter = useCallback(() => {
    const allJobs = data?.jobs || [];
    const validJobs = allJobs.filter((job: Job) => job.customer_lat && job.customer_lng);
    
    if (validJobs.length === 0) return [28.5383, -81.3792]; // Orlando default
    
    const avgLat = validJobs.reduce((sum: number, job: Job) => sum + job.customer_lat!, 0) / validJobs.length;
    const avgLng = validJobs.reduce((sum: number, job: Job) => sum + job.customer_lng!, 0) / validJobs.length;
    
    return [avgLat, avgLng];
  }, [data?.jobs]);

  if (isLoading) {
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href={`/partners/${slug}/dashboard`} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold">Live Dispatch Board</h1>
            <Badge variant="outline">{slug}</Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              Auto-refresh {autoRefresh ? "ON" : "OFF"}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search customers or addresses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="dispatched">Dispatched</SelectItem>
              <SelectItem value="en_route">En Route</SelectItem>
              <SelectItem value="arrived">Arrived</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-240px)]">
          {/* Jobs List */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Today's Jobs ({filteredJobs.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <div className="space-y-3">
                {filteredJobs.map((job: Job) => (
                  <div
                    key={job.id}
                    className={`p-4 rounded-lg border transition-all cursor-pointer ${
                      selectedJob === job.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedJob(selectedJob === job.id ? null : job.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm truncate">{job.customer_name}</h3>
                          <Badge className={statusColors[job.status]} variant="outline">
                            {job.status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{job.customer_address}</span>
                        </div>
                        
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{job.service_type}</span>
                          {job.scheduled_time_start && (
                            <span>{job.scheduled_time_start}</span>
                          )}
                          {job.pro_first_name && (
                            <span>→ {job.pro_first_name} {job.pro_last_name}</span>
                          )}
                        </div>
                      </div>
                      
                      <ChevronRight 
                        className={`w-4 h-4 text-muted-foreground transition-transform ${
                          selectedJob === job.id ? 'rotate-90' : ''
                        }`} 
                      />
                    </div>
                    
                    {/* Expanded details */}
                    {selectedJob === job.id && (
                      <div className="mt-3 pt-3 border-t border-border space-y-2">
                        {job.description && (
                          <p className="text-xs text-muted-foreground">{job.description}</p>
                        )}
                        
                        <div className="flex gap-2">
                          {job.customer_phone && (
                            <Button size="sm" variant="outline" className="h-8 px-2 text-xs">
                              <Phone className="w-3 h-3 mr-1" />
                              Call
                            </Button>
                          )}
                          
                          <Button size="sm" variant="outline" className="h-8 px-2 text-xs">
                            <Navigation className="w-3 h-3 mr-1" />
                            Directions
                          </Button>
                          
                          {job.status === 'scheduled' && (
                            <Button size="sm" className="h-8 px-2 text-xs">
                              <User className="w-3 h-3 mr-1" />
                              Assign Pro
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {filteredJobs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No jobs found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Map */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Live Map ({(data?.proLocations || []).length} pros online)
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <div className="h-full rounded-lg overflow-hidden">
                <MapContainer
                  center={mapCenter() as [number, number]}
                  zoom={11}
                  style={{ height: "100%", width: "100%" }}
                  className="rounded-lg"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  
                  <MapController jobs={data?.jobs || []} proLocations={data?.proLocations || []} />
                  
                  {/* Job markers */}
                  {(data?.jobs || []).map((job: Job) => {
                    if (!job.customer_lat || !job.customer_lng) return null;
                    return (
                      <Marker
                        key={job.id}
                        position={[job.customer_lat, job.customer_lng]}
                        icon={makeJobIcon(job.status)}
                      >
                        <Popup>
                          <div className="text-sm">
                            <div className="font-semibold">{job.customer_name}</div>
                            <div className="text-muted-foreground">{job.service_type}</div>
                            <div className="text-xs">{job.customer_address}</div>
                            <Badge className={`${statusColors[job.status]} mt-1`} variant="outline">
                              {job.status.replace(/_/g, " ")}
                            </Badge>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                  
                  {/* Pro location markers */}
                  {(data?.proLocations || []).map((location: ProLocation) => {
                    const isMoving = Boolean(location.speed && location.speed > 5); // 5+ mph = moving
                    return (
                      <Marker
                        key={location.pro_id}
                        position={[location.lat, location.lng]}
                        icon={makeProIcon(location.first_name, isMoving)}
                      >
                        <Popup>
                          <div className="text-sm">
                            <div className="font-semibold">
                              {location.first_name} {location.last_name}
                            </div>
                            {location.speed && (
                              <div className="text-muted-foreground">
                                {Math.round(location.speed)} mph
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              {new Date(location.recorded_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}