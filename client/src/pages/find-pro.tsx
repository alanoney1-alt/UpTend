import { useState, useMemo, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/landing/header";
import {
  Star, Shield, CheckCircle, MapPin, ArrowRight, X,
  Search, SlidersHorizontal, Users,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// ── Types ──

interface ProReview {
  id: string;
  customerName: string;
  rating: number;
  text: string;
  date: string;
  service: string;
}

interface ProProfile {
  id: string;
  firstName: string;
  lastInitial: string;
  rating: number;
  reviewCount: number;
  jobsCompleted: number;
  services: string[];
  certifications: string[];
  bio: string;
  isVerified: boolean;
  isInsured: boolean;
  memberSince: string;
  approximateLocation: { lat: number; lng: number };
  reviews?: ProReview[];
  serviceRatings?: Record<string, number>;
}

// ── Constants ──

const SERVICE_OPTIONS = [
  { value: "", label: "All Services" },
  { value: "handyman", label: "Handyman" },
  { value: "junk_removal", label: "Junk Removal" },
  { value: "pressure_washing", label: "Pressure Washing" },
  { value: "gutter_cleaning", label: "Gutter Cleaning" },
  { value: "home_cleaning", label: "Home Cleaning" },
  { value: "landscaping", label: "Landscaping" },
  { value: "pool_cleaning", label: "Pool Cleaning" },
  { value: "moving_labor", label: "Moving Labor" },
  { value: "carpet_cleaning", label: "Carpet Cleaning" },
  { value: "garage_cleanout", label: "Garage Cleanout" },
  { value: "light_demolition", label: "Light Demo" },
  { value: "home_consultation", label: "AI Home Scan" },
];

const SERVICE_LABELS: Record<string, string> = Object.fromEntries(
  SERVICE_OPTIONS.filter((s) => s.value).map((s) => [s.value, s.label])
);

const CERT_LABELS: Record<string, string> = {
  b2b_pm: "B2B Project Mgmt",
  sustainability: "Sustainability",
  senior_pro: "Senior Pro",
  lead_safe: "Lead-Safe Certified",
  osha_10: "OSHA-10",
};

const proMarkerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});


// ── Component ──

function FindProPage() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(search);

  const [serviceFilter, setServiceFilter] = useState(params.get("service") || "");
  const [availabilityFilter, setAvailabilityFilter] = useState("anytime");
  const [sortBy, setSortBy] = useState("rating");
  const [selectedPro, setSelectedPro] = useState<ProProfile | null>(null);
  const [pros, setPros] = useState<ProProfile[]>([]);

  // Fetch from API (falls back to mock)
  useEffect(() => {
    const qs = new URLSearchParams();
    if (serviceFilter) qs.set("service", serviceFilter);
    qs.set("sort", sortBy);
    qs.set("available", availabilityFilter);

    fetch(`/api/pros/browse?${qs}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setPros(data);
      })
      .catch(() => {
        // API unavailable — empty state shown
      });
  }, [serviceFilter, sortBy, availabilityFilter]);

  const filtered = useMemo(() => {
    let list = [...pros];
    if (serviceFilter) {
      list = list.filter((p) => p.services.includes(serviceFilter));
    }
    switch (sortBy) {
      case "rating":
        list.sort((a, b) => b.rating - a.rating);
        break;
      case "jobs":
        list.sort((a, b) => b.jobsCompleted - a.jobsCompleted);
        break;
      case "reviews":
        list.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
    }
    return list;
  }, [pros, serviceFilter, sortBy]);

  const center: [number, number] = [28.5383, -81.3792];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Find Your Pro</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Browse verified, insured Pros in the Orlando area. Read reviews, compare ratings, and book your favorite.
          </p>
        </div>

        {/* Map */}
        <Card className="overflow-hidden rounded-2xl shadow-lg mb-8" style={{ height: "350px" }}>
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
            {filtered.map((pro) => (
              <Marker
                key={pro.id}
                position={[pro.approximateLocation.lat, pro.approximateLocation.lng]}
                icon={proMarkerIcon}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">{pro.firstName} {pro.lastInitial}.</p>
                    <p className="text-amber-600">★ {pro.rating} · {pro.jobsCompleted} jobs</p>
                    <p className="text-xs text-gray-500 mt-1">{pro.services.map((s) => SERVICE_LABELS[s] || s).join(", ")}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </Card>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8 items-center">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filters:</span>
          </div>
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {SERVICE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="anytime">Anytime</option>
            <option value="today">Available Today</option>
            <option value="this_week">This Week</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="rating">Sort: Rating</option>
            <option value="jobs">Sort: Jobs Completed</option>
            <option value="reviews">Sort: Most Reviews</option>
          </select>
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">No Pros available for this service right now.</h3>
            <p className="text-muted-foreground mb-4">Try Quick Book for the fastest match.</p>
            <Button onClick={() => setLocation("/book")} className="bg-[#F47C20] hover:bg-[#e06a10]">
              ⚡ Quick Book
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((pro) => (
              <ProCard
                key={pro.id}
                pro={pro}
                onViewProfile={() => setSelectedPro(pro)}
                onBook={() => setLocation(`/book?service=${pro.services[0]}&proId=${pro.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {selectedPro && (
        <ProProfileModal
          pro={selectedPro}
          onClose={() => setSelectedPro(null)}
          onBook={() => {
            setSelectedPro(null);
            setLocation(`/book?service=${selectedPro.services[0]}&proId=${selectedPro.id}`);
          }}
        />
      )}
    </div>
  );
}

// ── Pro Card ──

function ProCard({ pro, onViewProfile, onBook }: { pro: ProProfile; onViewProfile: () => void; onBook: () => void }) {
  return (
    <Card className="overflow-hidden hover:border-[#F47C20]/50 transition-all">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold">{pro.firstName} {pro.lastInitial}.</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="font-bold text-sm">{pro.rating}</span>
              <span className="text-xs text-muted-foreground">({pro.reviewCount} reviews)</span>
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            {pro.jobsCompleted} jobs
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {pro.isVerified && (
            <Badge variant="outline" className="text-[10px] border-green-500/50 text-green-500 gap-1">
              <CheckCircle className="w-3 h-3" /> Verified
            </Badge>
          )}
          {pro.isInsured && (
            <Badge variant="outline" className="text-[10px] border-blue-500/50 text-blue-500 gap-1">
              <Shield className="w-3 h-3" /> Insured
            </Badge>
          )}
          {pro.certifications.map((cert) => (
            <Badge key={cert} variant="outline" className="text-[10px] border-[#F47C20]/50 text-[#F47C20]">
              {CERT_LABELS[cert] || cert}
            </Badge>
          ))}
        </div>

        {/* Services */}
        <div className="flex flex-wrap gap-1 mb-3">
          {pro.services.map((svc) => (
            <Badge key={svc} variant="secondary" className="text-[10px]">
              {SERVICE_LABELS[svc] || svc}
            </Badge>
          ))}
        </div>

        {/* Bio */}
        <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{pro.bio}</p>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={onBook} className="flex-1 bg-[#F47C20] hover:bg-[#e06a10] text-white font-bold" size="sm">
            Book This Pro <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
          <Button onClick={onViewProfile} variant="outline" size="sm">
            View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Profile Modal ──

function ProProfileModal({ pro, onClose, onBook }: { pro: ProProfile; onClose: () => void; onBook: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-background border border-border rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">{pro.firstName} {pro.lastInitial}.</h2>
            <div className="flex items-center gap-2 mt-1">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="font-bold">{pro.rating}</span>
              <span className="text-sm text-muted-foreground">({pro.reviewCount} reviews)</span>
              <span className="text-sm text-muted-foreground">· {pro.jobsCompleted} jobs</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Member since {pro.memberSince}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {pro.isVerified && (
            <Badge variant="outline" className="border-green-500/50 text-green-500 gap-1">
              <CheckCircle className="w-3 h-3" /> Verified
            </Badge>
          )}
          {pro.isInsured && (
            <Badge variant="outline" className="border-blue-500/50 text-blue-500 gap-1">
              <Shield className="w-3 h-3" /> Insured
            </Badge>
          )}
          {pro.certifications.map((cert) => (
            <Badge key={cert} variant="outline" className="border-[#F47C20]/50 text-[#F47C20]">
              {CERT_LABELS[cert] || cert}
            </Badge>
          ))}
        </div>

        {/* Bio */}
        <p className="text-sm text-muted-foreground mb-6">{pro.bio}</p>

        {/* Services with ratings */}
        <div className="mb-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">Services & Ratings</h3>
          <div className="space-y-2">
            {pro.services.map((svc) => (
              <div key={svc} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-sm font-medium">{SERVICE_LABELS[svc] || svc}</span>
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-bold">{pro.serviceRatings?.[svc] ?? pro.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews */}
        {pro.reviews && pro.reviews.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">Recent Reviews</h3>
            <div className="space-y-3">
              {pro.reviews.map((review) => (
                <div key={review.id} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{review.customerName}</span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: review.rating }, (_, i) => (
                        <Star key={i} className="w-3 h-3 text-amber-500 fill-amber-500" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{review.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{review.date} · {SERVICE_LABELS[review.service] || review.service}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <Button onClick={onBook} className="w-full bg-[#F47C20] hover:bg-[#e06a10] text-white font-bold" size="lg">
          Book {pro.firstName} <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

export default FindProPage;
