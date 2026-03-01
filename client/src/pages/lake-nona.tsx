import { useState } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Footer } from "@/components/landing/footer";
import { Founding100 } from "@/components/landing/founding-100";
import {
  ArrowRight, Loader2, CheckCircle, MapPin,
  Wrench, Waves, Truck, Package, Home, Trees,
  ArrowUpFromLine, Sparkles, Zap, Shield, Sun, Paintbrush,
} from "lucide-react";

const SERVICES = [
  { label: "Junk Removal", icon: Truck },
  { label: "Pressure Washing", icon: Waves },
  { label: "Gutter Cleaning", icon: ArrowUpFromLine },
  { label: "Home Cleaning", icon: Sparkles },
  { label: "Handyman", icon: Wrench },
  { label: "Landscaping", icon: Trees },
  { label: "Moving Labor", icon: Package },
  { label: "Light Demolition", icon: Zap },
  { label: "Garage Cleanout", icon: Home },
  { label: "Pool Cleaning", icon: Waves },
  { label: "Carpet Cleaning", icon: Sparkles },
  { label: "Home DNA Scan", icon: Shield },
];

export default function LakeNonaPage() {
  usePageTitle("Lake Nona Home Services | George is Coming | UpTend");

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      await fetch("/api/founding-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: "", memberType: "customer", zipCode: "32827" }),
      });
      setSubmitted(true);
    } catch {
      // still show success for UX
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* SEO Meta */}
      <MetaTags />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0f172a]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <img src="/logo-icon.png" alt="UpTend" className="w-8 h-8 rounded-lg" />
            <span className="text-xl font-black text-white">
              <span className="text-[#F47C20]">Up</span>Tend
            </span>
          </a>
          <div className="px-3 py-1 rounded-full bg-[#F47C20]/10 border border-[#F47C20]/20">
            <span className="text-[#F47C20] text-xs font-bold uppercase tracking-wider">Lake Nona</span>
          </div>
        </div>
      </header>

      <main className="pt-16">
        {/* ==================== HERO ==================== */}
        <section className="relative py-24 md:py-36 overflow-hidden">
          <div className="absolute inset-0">
            <img src="/images/site/hero-home-service.webp" alt="" className="w-full h-full object-cover" loading="eager" />
            <div className="absolute inset-0 bg-[#0f172a]/85" />
          </div>
          <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
            <div className="inline-block px-5 py-2 rounded-full bg-[#F47C20]/15 border border-[#F47C20]/30 mb-8">
              <p className="text-[#F47C20] text-sm font-bold uppercase tracking-wider">Coming Soon to Lake Nona</p>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
              Lake Nona,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F47C20] to-orange-300">
                George is on his way.
              </span>
            </h1>
            <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto mb-10">
              The smartest way to take care of your home is almost here.
            </p>
            <a href="#early-access">
              <Button size="lg" className="bg-[#F47C20] hover:bg-[#E06910] text-white text-lg px-10 h-14 rounded-xl shadow-lg shadow-[#F47C20]/25">
                Get Early Access <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </a>
          </div>
        </section>

        {/* ==================== WHAT'S COMING ==================== */}
        <section className="py-20 bg-[#0f172a]">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <Badge className="bg-[#F47C20]/20 text-[#F47C20] border-[#F47C20]/30 mb-6">
              Meet George
            </Badge>
            <img src="/george-avatar.png" alt="George" className="w-24 h-24 rounded-full mx-auto mb-6 ring-4 ring-[#F47C20]/30" />
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Your home already knows what it needs.
            </h2>
            <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-4">
              George listens.
            </p>
            <p className="text-white/40 text-base max-w-xl mx-auto">
              George is your personal home intelligence expert. He learns your home, tracks what matters, and connects you with the right pro at the right time. No guessing. No searching. No stress.
            </p>
          </div>
        </section>

        {/* ==================== SERVICES PREVIEW ==================== */}
        <section className="py-20 bg-slate-900/50">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything your home needs. One place.</h2>
              <p className="text-white/50 text-lg">All of this is coming to Lake Nona.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {SERVICES.map((service) => (
                <Card key={service.label} className="bg-white/5 border-white/10 hover:border-[#F47C20]/30 transition-all group">
                  <CardContent className="p-5 text-center">
                    <service.icon className="w-8 h-8 text-[#F47C20]/70 mx-auto mb-3 group-hover:text-[#F47C20] transition-colors" />
                    <p className="text-white/80 text-sm font-semibold">{service.label}</p>
                    <p className="text-[#F47C20]/50 text-xs mt-1 uppercase tracking-wider font-bold">Coming Soon</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== HOME DNA SCAN CTA ==================== */}
        <section className="py-20 bg-[#0f172a]" id="early-access">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Get your free Home DNA Scan before anyone else.
            </h2>
            <p className="text-white/50 text-base mb-8 max-w-lg mx-auto">
              We'll build a complete profile of your home and tell you exactly what it needs. No cost. No commitment. Just a head start.
            </p>
            {submitted ? (
              <div className="flex items-center justify-center gap-3 text-green-400">
                <CheckCircle className="w-6 h-6" />
                <p className="text-lg font-semibold">You're on the list. We'll be in touch soon.</p>
              </div>
            ) : (
              <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 h-12 flex-1"
                />
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#F47C20] hover:bg-[#E06910] text-white h-12 px-6 rounded-lg whitespace-nowrap"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Get Early Access"}
                </Button>
              </form>
            )}
          </div>
        </section>

        {/* ==================== NEIGHBORHOOD SPECIFIC ==================== */}
        <section className="py-20 bg-slate-900/50">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="bg-[#F47C20]/20 text-[#F47C20] border-[#F47C20]/30 mb-4">
                <MapPin className="w-3 h-3 mr-1" /> Hyperlocal
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">We know Lake Nona.</h2>
              <p className="text-white/50 text-base max-w-xl mx-auto">
                This isn't a generic service dropping into your zip code. George was built for neighborhoods like yours.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  title: "Laureate Park",
                  text: "New construction, tight HOA standards, and homes that deserve proactive care from day one. George gets it.",
                },
                {
                  title: "Town Center & Boxi Park",
                  text: "The heart of Lake Nona keeps growing. Whether you're near the restaurants or the residences, your home needs attention too.",
                },
                {
                  title: "Medical City & Surrounding Communities",
                  text: "You moved here for world class innovation. Your home maintenance should match. Smart, efficient, handled.",
                },
                {
                  title: "New Construction Everywhere",
                  text: "Lake Nona is still building. New homes develop needs fast. George catches them before they become problems.",
                },
              ].map((item) => (
                <Card key={item.title} className="bg-white/5 border-white/10">
                  <CardContent className="p-6">
                    <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                    <p className="text-white/50 text-sm leading-relaxed">{item.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== BUILT FOR LAKE NONA ==================== */}
        <section className="py-20 bg-[#0f172a]">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for Lake Nona. Not bolted on.</h2>
              <p className="text-white/50 text-base max-w-xl mx-auto">
                There's a reason we're starting here.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Home,
                  title: "New homes need smart maintenance",
                  text: "Your builder warranty won't cover neglect. Proactive care protects your investment from year one.",
                },
                {
                  icon: Shield,
                  title: "HOA compliance matters",
                  text: "Pressure washing, landscaping, exterior upkeep. George keeps you ahead of violations, not chasing them.",
                },
                {
                  icon: Sun,
                  title: "Florida weather is brutal on homes",
                  text: "Humidity, storms, sun damage, mold. Lake Nona homes face all of it. Regular maintenance isn't optional here.",
                },
              ].map((item) => (
                <Card key={item.title} className="bg-white/5 border-white/10">
                  <CardContent className="p-6 text-center">
                    <item.icon className="w-10 h-10 text-[#F47C20] mx-auto mb-4" />
                    <h3 className="text-white font-bold text-base mb-2">{item.title}</h3>
                    <p className="text-white/50 text-sm leading-relaxed">{item.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== FOUNDING 100 ==================== */}
        <section className="py-4">
          <div className="text-center mb-6 px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              The first 100 Lake Nona homeowners get founder perks.
            </h2>
            <p className="text-white/50 text-base max-w-lg mx-auto">
              10% off your first 10 jobs. Priority booking. A direct line to George. This won't last.
            </p>
          </div>
          <Founding100 />
        </section>
      </main>

      <Footer />
    </div>
  );
}

function MetaTags() {
  // Using useEffect to set document meta tags for SEO
  const title = "Lake Nona Home Services | George is Coming | UpTend";
  const description = "Lake Nona's smartest home maintenance is almost here. Get your free Home DNA Scan, join the Founding 100, and be the first to experience George. Home services, handyman, pressure washing, and more.";

  // Set meta tags via DOM since this is a SPA
  if (typeof document !== "undefined") {
    // OG tags
    setMeta("og:title", title);
    setMeta("og:description", description);
    setMeta("og:type", "website");
    setMeta("og:url", "https://uptendapp.com/lake-nona");

    // Standard meta
    setMeta("description", description, "name");

    // Additional SEO keywords via description
    setMeta("keywords", "home services lake nona, lake nona home maintenance, lake nona handyman, lake nona pressure washing, lake nona landscaping, uptend lake nona", "name");
  }

  return null;
}

function setMeta(key: string, value: string, attr: string = "property") {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}
