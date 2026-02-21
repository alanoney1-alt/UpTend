import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import {
  Star, MapPin, Clock, ChevronLeft, Send,
  Sparkles, CalendarCheck, ThumbsUp, Wrench, Droplets, Trash2, Zap, Truck,
  Package, Sofa, Home, Users, Shield, Navigation
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import type { HaulerWithProfile } from "@shared/schema";

type SearchResult = {
  matches: HaulerWithProfile[];
  suggestions: HaulerWithProfile[];
};

// Generate a George "introduction" for a pro
function georgeIntro(hauler: HaulerWithProfile): string {
  const profile = hauler.profile;
  const name = hauler.firstName || profile?.companyName || "This pro";
  const years = profile?.yearsInBusiness || 1;
  const reviews = profile?.reviewCount || 0;
  const rating = profile?.rating || 5.0;
  const services = profile?.serviceTypes?.map(s => serviceLabel(s)).join(", ") || "home services";

  const intros = [
    `${name} has been doing ${services} for ${years}+ years. ${reviews > 0 ? `${reviews} reviews, ${rating} stars.` : "New on UpTend but verified and ready."} Available soon.`,
    `I'd recommend ${name} — ${years}+ years in ${services}. ${reviews > 0 ? `${reviews} happy customers.` : "Just getting started but looks great."}`,
    `${name} specializes in ${services}. ${years}+ years experience${reviews > 0 ? `, ${reviews} five-star reviews` : ""}. Solid pick.`,
  ];
  return intros[Math.abs(hashCode(hauler.id)) % intros.length];
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

function serviceLabel(s: string): string {
  const map: Record<string, string> = {
    junk_removal: "junk removal",
    furniture_moving: "furniture moving",
    garage_cleanout: "garage cleanouts",
    estate_cleanout: "estate cleanouts",
    pressure_washing: "pressure washing",
    gutter_cleaning: "gutter cleaning",
  };
  return map[s] || s.replace(/_/g, " ");
}

const SERVICE_CHIPS = [
  { value: "all", label: "All", icon: Sparkles },
  { value: "junk_removal", label: "Junk Removal", icon: Trash2 },
  { value: "furniture_moving", label: "Moving", icon: Sofa },
  { value: "garage_cleanout", label: "Garage", icon: Home },
  { value: "estate_cleanout", label: "Estate", icon: Package },
];

const AVAILABILITY_CHIPS = [
  { value: "all", label: "Any Time", icon: Clock },
  { value: "today", label: "Today", icon: CalendarCheck },
];

const RATING_CHIPS = [
  { value: "all", label: "Any Rating", icon: Star },
  { value: "4.5", label: "4.5+ ★", icon: ThumbsUp },
];

function ProCard({ hauler }: { hauler: HaulerWithProfile }) {
  const profile = hauler.profile;
  const name = hauler.firstName || profile?.companyName || "Pro";
  const fullName = profile?.companyName || `${hauler.firstName || ""} ${hauler.lastName || ""}`.trim() || "Pro";

  return (
    <Card className="p-5 border-0 shadow-sm hover:shadow-md transition-shadow" style={{ backgroundColor: "#FFFBF5" }}>
      {/* George intro bubble */}
      <div className="flex items-start gap-2.5 mb-4">
        <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-white text-xs font-bold">G</span>
        </div>
        <p className="text-sm text-stone-600 italic leading-relaxed">
          "{georgeIntro(hauler)}"
        </p>
      </div>

      {/* Pro info */}
      <div className="flex items-center gap-3 mb-3">
        <Avatar className="w-14 h-14 border-2 border-amber-200">
          <AvatarImage src={hauler.profileImageUrl || undefined} />
          <AvatarFallback className="bg-amber-100 text-amber-700 text-lg font-semibold">
            {fullName.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-stone-800">{fullName}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(profile?.rating || 5) ? "fill-amber-400 text-amber-400" : "text-stone-300"}`} />
              ))}
            </div>
            <span className="text-xs text-stone-500">({profile?.reviewCount || 0})</span>
          </div>
        </div>
        {profile?.verified && (
          <Badge className="bg-green-100 text-green-700 border-0 text-xs">
            <Shield className="w-3 h-3 mr-1" /> Verified
          </Badge>
        )}
      </div>

      {/* Specialties */}
      {profile?.serviceTypes && profile.serviceTypes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {profile.serviceTypes.map((type) => (
            <Badge key={type} variant="outline" className="text-xs bg-white border-amber-200 text-stone-600">
              {serviceLabel(type)}
            </Badge>
          ))}
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-stone-500 mb-4">
        {profile?.yearsInBusiness && (
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{profile.yearsInBusiness}+ yrs</span>
        )}
        {profile?.jobsCompleted ? (
          <span className="flex items-center gap-1"><Wrench className="w-3 h-3" />{profile.jobsCompleted} jobs</span>
        ) : null}
        {profile?.serviceRadius && (
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{profile.serviceRadius} mi</span>
        )}
      </div>

      {/* CTA */}
      <Button asChild className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl">
        <Link href="/book">
          Book with {name}
        </Link>
      </Button>
    </Card>
  );
}

export default function Haulers() {
  const [serviceFilter, setServiceFilter] = useState("all");
  const [availFilter, setAvailFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "george"; text: string }[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: searchResult, isLoading } = useQuery<SearchResult>({
    queryKey: ["/api/pros/search", serviceFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (serviceFilter !== "all") params.set("serviceType", serviceFilter);
      params.set("availableOnly", "true");
      const res = await fetch(`/api/pros/search?${params.toString()}`);
      if (!res.ok) return { matches: [], suggestions: [] };
      return res.json();
    },
  });

  let haulers = [...(searchResult?.matches || []), ...(searchResult?.suggestions || [])];

  // Client-side rating filter
  if (ratingFilter !== "all") {
    const min = parseFloat(ratingFilter);
    haulers = haulers.filter(h => (h.profile?.rating || 5) >= min);
  }

  const handleChat = () => {
    if (!chatInput.trim()) return;
    const q = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", text: q }]);
    // Simple local response — in production this would call the AI
    setTimeout(() => {
      const count = haulers.length;
      setChatMessages(prev => [...prev, {
        role: "george",
        text: count > 0
          ? `Great question! I found ${count} pro${count !== 1 ? "s" : ""} that might be perfect. Take a look at the recommendations above — I've picked them based on ratings and availability. Want me to narrow it down?`
          : "I don't have anyone available right now for that, but book a job and I'll match you as soon as someone's free!"
      }]);
    }, 600);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFBF5" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-amber-100 bg-[#FFFBF5]/95 backdrop-blur">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-stone-500">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            </Link>
            <Logo className="w-8 h-8" textClassName="text-lg" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* George hero */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-amber-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-200">
            <span className="text-white text-3xl font-bold">G</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-stone-800 mb-2">
            Let me find the perfect pro for you
          </h1>
          <p className="text-stone-500 text-sm max-w-md mx-auto">
            I've reviewed every pro on UpTend. Here are my top picks based on ratings, experience, and availability.
          </p>
        </div>

        {/* Quick filter chips */}
        <div className="space-y-3 mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {SERVICE_CHIPS.map((chip) => {
              const Icon = chip.icon;
              const active = serviceFilter === chip.value;
              return (
                <button
                  key={chip.value}
                  onClick={() => setServiceFilter(chip.value)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    active ? "bg-amber-500 text-white shadow-sm" : "bg-white text-stone-600 border border-stone-200 hover:border-amber-300"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {chip.label}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {AVAILABILITY_CHIPS.map((chip) => {
              const Icon = chip.icon;
              const active = availFilter === chip.value;
              return (
                <button
                  key={chip.value}
                  onClick={() => setAvailFilter(chip.value)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    active ? "bg-amber-500 text-white shadow-sm" : "bg-white text-stone-600 border border-stone-200 hover:border-amber-300"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {chip.label}
                </button>
              );
            })}
            {RATING_CHIPS.map((chip) => {
              const Icon = chip.icon;
              const active = ratingFilter === chip.value;
              return (
                <button
                  key={chip.value}
                  onClick={() => setRatingFilter(chip.value)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    active ? "bg-amber-500 text-white shadow-sm" : "bg-white text-stone-600 border border-stone-200 hover:border-amber-300"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pro cards */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-5 border-0" style={{ backgroundColor: "#FFFBF5" }}>
                <Skeleton className="h-4 w-3/4 mb-4" />
                <div className="flex items-center gap-3 mb-3">
                  <Skeleton className="w-14 h-14 rounded-full" />
                  <div className="space-y-2 flex-1"><Skeleton className="h-5 w-32" /><Skeleton className="h-3 w-20" /></div>
                </div>
                <Skeleton className="h-10 w-full" />
              </Card>
            ))}
          </div>
        ) : haulers.length > 0 ? (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-stone-500">
                {haulers.length} pro{haulers.length !== 1 ? "s" : ""} recommended
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {haulers.map((hauler) => (
                <ProCard key={hauler.id} hauler={hauler} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Truck className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="font-semibold text-stone-700 mb-2">No pros available right now</h3>
            <p className="text-stone-500 text-sm mb-4">Book a job and I'll match you as soon as someone's free.</p>
            <Button asChild className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl">
              <Link href="/book">Book a Job</Link>
            </Button>
          </div>
        )}

        {/* Chat section */}
        <div className="mt-10 border border-amber-200 rounded-2xl bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">G</span>
            </div>
            <span className="text-sm font-medium text-stone-700">Ask George about any pro</span>
          </div>

          {chatMessages.length > 0 && (
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-sm ${
                    msg.role === "user"
                      ? "bg-amber-500 text-white rounded-br-md"
                      : "bg-amber-50 text-stone-700 rounded-bl-md"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )}

          <div className="flex gap-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleChat()}
              placeholder="Who's the best for gutter cleaning?"
              className="border-amber-200 focus-visible:ring-amber-300 rounded-xl"
            />
            <Button onClick={handleChat} size="icon" className="bg-amber-500 hover:bg-amber-600 rounded-xl shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
