import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Share2, Star, Filter } from "lucide-react";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { Link } from "wouter";
import { Logo } from "@/components/ui/logo";

interface GalleryEntry {
  id: string;
  serviceType: string;
  serviceLabel: string;
  proName: string;
  rating: number;
  date: string;
}

const DEMO_ENTRIES: GalleryEntry[] = [
  { id: "1", serviceType: "junk_removal", serviceLabel: "Junk Removal", proName: "Marcus", rating: 4.9, date: "Feb 2026" },
  { id: "2", serviceType: "pressure_washing", serviceLabel: "Pressure Washing", proName: "Carlos", rating: 5.0, date: "Feb 2026" },
  { id: "3", serviceType: "landscaping", serviceLabel: "Landscaping", proName: "Jaylen", rating: 4.8, date: "Jan 2026" },
  { id: "4", serviceType: "garage_cleanout", serviceLabel: "Garage Cleanout", proName: "DeShawn", rating: 4.9, date: "Jan 2026" },
  { id: "5", serviceType: "home_cleaning", serviceLabel: "Home Cleaning", proName: "Maria", rating: 5.0, date: "Dec 2025" },
  { id: "6", serviceType: "gutter_cleaning", serviceLabel: "Gutter Cleaning", proName: "Travis", rating: 4.7, date: "Dec 2025" },
];

const SERVICE_FILTERS = [
  { value: "all", label: "All Services" },
  { value: "junk_removal", label: "Junk Removal" },
  { value: "pressure_washing", label: "Pressure Washing" },
  { value: "landscaping", label: "Landscaping" },
  { value: "garage_cleanout", label: "Garage Cleanout" },
  { value: "home_cleaning", label: "Home Cleaning" },
  { value: "gutter_cleaning", label: "Gutter Cleaning" },
];

function PlaceholderImage({ label }: { label: string }) {
  return (
    <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-700 flex items-center justify-center rounded-lg">
      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</span>
    </div>
  );
}

function GalleryCard({ entry }: { entry: GalleryEntry }) {
  const handleShare = async () => {
    const url = `${window.location.origin}/gallery?highlight=${entry.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${entry.serviceLabel}. Before & After`, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copied!");
    }
  };

  return (
    <Card className="overflow-hidden border border-slate-200 dark:border-slate-700">
      <CardContent className="p-0">
        <div className="p-3 pb-2">
          <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wide">
            {entry.serviceLabel}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-1 px-3">
          <PlaceholderImage label="Before" />
          <PlaceholderImage label="After" />
        </div>
        <div className="p-3 pt-2 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{entry.proName}</p>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>{entry.rating}</span>
              <span className="mx-1">·</span>
              <span>{entry.date}</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleShare} className="h-8 w-8 p-0">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Gallery() {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? DEMO_ENTRIES : DEMO_ENTRIES.filter(e => e.serviceType === filter);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="relative max-w-5xl mx-auto px-4 py-8">
        <div className="absolute inset-0 h-[350px] -mx-[50vw] left-1/2 right-1/2 w-screen overflow-hidden -z-10">
          <img src="/images/site/hero-gallery.webp" alt="" className="w-full h-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-background/90" />
        </div>
        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {SERVICE_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                filter === f.value
                  ? "bg-primary text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <p className="text-center text-slate-500 py-12">No results for this service type yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(entry => (
              <GalleryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
