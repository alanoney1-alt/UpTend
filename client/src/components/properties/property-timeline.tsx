import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Home,
  Wrench,
  Zap,
  Droplet,
  Wind,
  PaintBucket,
  Trees,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PropertyHealthEvent } from "@db/schema";

interface PropertyTimelineProps {
  propertyId: string;
  limit?: number;
}

const eventIcons: Record<string, any> = {
  // Roof
  roof_inspection: Home,
  roof_repair: Wrench,
  roof_replacement: Home,
  // HVAC
  hvac_service: Wind,
  hvac_repair: Wrench,
  hvac_replacement: Wind,
  // Electrical
  electrical_inspection: Zap,
  electrical_repair: Wrench,
  electrical_upgrade: Zap,
  // Plumbing
  plumbing_inspection: Droplet,
  plumbing_repair: Wrench,
  plumbing_upgrade: Droplet,
  // Exterior
  exterior_painting: PaintBucket,
  siding_repair: Wrench,
  pressure_washing: Droplet,
  // Landscape
  lawn_service: Trees,
  tree_removal: Trees,
  irrigation_service: Droplet,
  // Default
  default: Calendar,
};

const eventCategories = {
  roof: "Roof",
  hvac: "HVAC",
  electrical: "Electrical",
  plumbing: "Plumbing",
  exterior: "Exterior",
  interior: "Interior",
  landscape: "Landscape",
  pool: "Pool",
  appliance: "Appliance",
  structural: "Structural",
  maintenance: "Maintenance",
  inspection: "Inspection",
  other: "Other",
};

export function PropertyTimeline({ propertyId, limit }: PropertyTimelineProps) {
  const [events, setEvents] = useState<PropertyHealthEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");

  useEffect(() => {
    fetchEvents();
  }, [propertyId]);

  async function fetchEvents() {
    try {
      const response = await fetch(`/api/properties/${propertyId}/health-events`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  }

  function getEventIcon(eventType: string) {
    const Icon = eventIcons[eventType] || eventIcons.default;
    return <Icon className="h-5 w-5" />;
  }

  function getEventColor(category?: string, severity?: string) {
    if (severity === "critical") return "text-red-600 bg-red-50 border-red-200";
    if (severity === "warning") return "text-orange-600 bg-orange-50 border-orange-200";
    if (severity === "info") return "text-blue-600 bg-blue-50 border-blue-200";

    switch (category) {
      case "roof":
        return "text-gray-700 bg-gray-50 border-gray-200";
      case "hvac":
        return "text-blue-700 bg-blue-50 border-blue-200";
      case "electrical":
        return "text-yellow-700 bg-yellow-50 border-yellow-200";
      case "plumbing":
        return "text-cyan-700 bg-cyan-50 border-cyan-200";
      case "exterior":
        return "text-purple-700 bg-purple-50 border-purple-200";
      case "landscape":
        return "text-green-700 bg-green-50 border-green-200";
      default:
        return "text-gray-700 bg-gray-50 border-gray-200";
    }
  }

  function getSeverityIcon(severity?: string) {
    if (severity === "critical") return <AlertTriangle className="h-4 w-4 text-red-600" />;
    if (severity === "warning") return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  }

  const filteredEvents = events.filter((event) => {
    const matchesCategory = filterCategory === "all" || event.category === filterCategory;
    const matchesSeverity = filterSeverity === "all" || event.severity === filterSeverity;
    return matchesCategory && matchesSeverity;
  });

  const displayEvents = limit ? filteredEvents.slice(0, limit) : filteredEvents;

  const sortedEvents = [...displayEvents].sort(
    (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!limit && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Property Timeline</CardTitle>
              <div className="flex gap-2">
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Object.entries(eventCategories).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Complete history of all property events, maintenance, and improvements
            </p>
          </CardContent>
        </Card>
      )}

      {sortedEvents.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {filterCategory !== "all" || filterSeverity !== "all"
                  ? "No events match your filters"
                  : "No timeline events yet"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />

          {/* Events */}
          <div className="space-y-4">
            {sortedEvents.map((event, index) => (
              <div key={event.id} className="relative pl-16">
                {/* Timeline Dot */}
                <div
                  className={cn(
                    "absolute left-6 top-6 w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center",
                    getEventColor(event.category, event.severity)
                  )}
                >
                  <div className="w-2 h-2 rounded-full bg-current" />
                </div>

                {/* Event Card */}
                <Card className={cn("border-l-4", getEventColor(event.category, event.severity))}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", getEventColor(event.category))}>
                          {getEventIcon(event.eventType)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{event.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(event.eventDate).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {event.severity && (
                          <div className="flex items-center gap-1">
                            {getSeverityIcon(event.severity)}
                          </div>
                        )}
                        {event.category && (
                          <Badge variant="secondary" className="capitalize">
                            {event.category}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {event.description && (
                      <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                    )}

                    {event.cost !== null && event.cost > 0 && (
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Cost:</span>{" "}
                          <span className="font-semibold">${event.cost.toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    {event.performedBy && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Performed by: {event.performedBy}
                      </div>
                    )}

                    {event.documentUrls && event.documentUrls.length > 0 && (
                      <div className="mt-3 flex gap-2">
                        {event.documentUrls.map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            View Document →
                          </a>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {limit && filteredEvents.length > limit && (
            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground">
                Showing {limit} of {filteredEvents.length} events
              </p>
            </div>
          )}
        </div>
      )}

      {!limit && sortedEvents.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-green-900 mb-3">📊 Timeline Value</h3>
            <p className="text-sm text-green-800">
              Your complete property history increases resale value and helps buyers understand the
              care and maintenance invested in this home. This "Carfax for Homes" can transfer to
              new owners!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
