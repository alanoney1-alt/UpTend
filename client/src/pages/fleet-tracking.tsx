import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/landing/header";
import { MapPin, Truck, RefreshCw, Loader2 } from "lucide-react";

interface ProLocation {
  userId: string;
  companyName: string;
  lat: number;
  lng: number;
  lastCheckedIn: string;
  isAvailable: boolean;
  vehicleType: string;
}

export default function FleetTracking() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["fleet-locations"],
    queryFn: async () => {
      const res = await fetch("/api/fleet/locations", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load fleet locations");
      return res.json() as Promise<{ count: number; locations: ProLocation[] }>;
    },
    refetchInterval: 15000, // auto-refresh every 15s
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Truck className="w-8 h-8" /> Fleet Tracking
            </h1>
            <p className="text-muted-foreground">
              {data ? `${data.count} active pro(s) in the last 30 minutes` : "Loading..."}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        )}

        {data && data.locations.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No active pros reporting locations right now.</p>
              <p className="text-sm mt-2">Pros will appear here when they post their location via the mobile app.</p>
            </CardContent>
          </Card>
        )}

        {/* Map placeholder — structure for easy Google Maps / Mapbox integration */}
        {data && data.locations.length > 0 && (
          <>
            <Card className="mb-6">
              <CardContent className="py-8 text-center text-muted-foreground bg-muted/30">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Map view available when Google Maps API is enabled</p>
                <p className="text-xs mt-1">
                  Bounding box: {Math.min(...data.locations.map(l => l.lat)).toFixed(4)}–{Math.max(...data.locations.map(l => l.lat)).toFixed(4)} lat,{" "}
                  {Math.min(...data.locations.map(l => l.lng)).toFixed(4)}–{Math.max(...data.locations.map(l => l.lng)).toFixed(4)} lng
                </p>
              </CardContent>
            </Card>

            {/* Table view of active pros */}
            <Card>
              <CardHeader>
                <CardTitle>Active Pros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 font-medium">Pro</th>
                        <th className="pb-2 font-medium">Vehicle</th>
                        <th className="pb-2 font-medium">Location</th>
                        <th className="pb-2 font-medium">Status</th>
                        <th className="pb-2 font-medium">Last Update</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.locations.map((pro) => (
                        <tr key={pro.userId} className="border-b last:border-0">
                          <td className="py-3 font-medium">{pro.companyName || pro.userId.slice(0, 8)}</td>
                          <td className="py-3">
                            <Badge variant="outline">{pro.vehicleType?.replace("_", " ") || "—"}</Badge>
                          </td>
                          <td className="py-3 font-mono text-xs">
                            {pro.lat.toFixed(5)}, {pro.lng.toFixed(5)}
                          </td>
                          <td className="py-3">
                            <Badge variant={pro.isAvailable ? "default" : "secondary"}>
                              {pro.isAvailable ? "Available" : "Busy"}
                            </Badge>
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {pro.lastCheckedIn ? new Date(pro.lastCheckedIn).toLocaleTimeString() : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
