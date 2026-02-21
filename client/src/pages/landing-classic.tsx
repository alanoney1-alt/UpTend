import { usePageTitle } from "@/hooks/use-page-title";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck, ArrowRight, Globe, Leaf, Heart, Zap,
  DollarSign, Clock, Ban, TrendingUp, Users, Star,
  CheckCircle, ChevronRight, Wrench, Waves, Truck,
  Package, Home, Trees, ArrowUpFromLine, Sparkles,
  MessageCircle,
} from "lucide-react";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { useTranslation } from "react-i18next";
import { useSiteMode } from "@/contexts/site-mode-context";

export default function LandingClassic() {
  usePageTitle("UpTend | Home Services, Finally Done Right");
  const { toggle } = useSiteMode();

  return (
    <div className="min-h-screen bg-background" data-testid="page-landing-classic">
      <Header />
      {/* George AI toggle banner */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white py-2 px-4 text-center cursor-pointer hover:from-amber-500 hover:to-orange-500 transition-colors" onClick={toggle}>
        <span className="text-sm font-medium">Try <strong>George AI</strong> — our intelligent home assistant. <span className="underline">Switch to AI Mode</span></span>
      </div>
      <main>
        <HeroSection />
        <ServicesStrip />
        <TwoSides />
        <GeorgeBanner />
        <TrustBar />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

/* ─── GEORGE BANNER ─── */
function GeorgeBanner() {
  return (
    <div className="mt-20 bg-gradient-to-r from-[#F47C20] to-orange-500 text-white py-2.5 md:py-3 px-3 md:px-4 text-center">
      <div className="max-w-4xl mx-auto flex items-center justify-center gap-1.5 md:gap-2">
        <MessageCircle className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
        <span className="text-xs md:text-base font-medium">
          <strong>Meet Mr. George</strong> — your AI assistant. Questions?{" "}
          <Link href="/meet-george" className="underline font-bold hover:text-white/90 transition-colors">Ask Mr. George</Link>
        </span>
      </div>
    </div>
  );
}

/* ─── HERO ─── */
function HeroSection() {
  const { t, i18n } = useTranslation();
  const toggleLanguage = () => i18n.changeLanguage(i18n.language === "en" ? "es" : "en");

  return (
    <section className="relative pt-12 pb-20 overflow-hidden bg-slate-900 dark:bg-slate-950">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#3B1D5A]/60 to-slate-900" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#3B1D5A]/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#F47C20]/10 rounded-full blur-[120px]" />

      <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 tracking-tight leading-[1.1]">
          Home services,<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F47C20] to-orange-300">
            finally done right.
          </span>
        </h1>

        <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Verified pros, upfront pricing, real accountability. Book in 60 seconds.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-6">
          <Link href="/book" asChild>
            <Button size="lg" className="bg-[#F47C20] hover:bg-[#e06910] text-white font-bold text-lg px-10 py-6 rounded-xl shadow-lg shadow-[#F47C20]/25">
              Get Your Free Quote <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <div onClick={toggleLanguage} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleLanguage(); } }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer ring-1 ring-white/10 hover:ring-white/20 hover:bg-white/5 transition-all">
            <Globe className="w-4 h-4 text-[#F47C20]" />
            {i18n.language === "en" ? (
              <span className="text-sm text-slate-400">Espanol? <span className="font-semibold text-[#F47C20]">Cambiar</span></span>
            ) : (
              <span className="text-sm text-slate-400">English? <span className="font-semibold text-[#F47C20]">Switch</span></span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── TWO SIDES: WHY CUSTOMERS + PROS NEED US ─── */
function TwoSides() {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <Badge className="bg-green-500/20 text-green-500 dark:text-green-400 border-green-500/30 mb-4 text-sm font-bold">
            The Fix
          </Badge>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4">
            Fair for customers.<br className="md:hidden" />{" "}Fair for Pros.<br />
            <span className="text-[#C05600]">That's the whole point.</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            When Pros are treated right, customers get better service. When customers pay fair prices, Pros get steady work. UpTend makes both sides win.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* For Customers */}
          <div>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
              <Heart className="w-5 h-5 text-[#F47C20]" /> For Homeowners
            </h3>
            <div className="space-y-4">
              {[
                { icon: Zap, title: "Instant, honest pricing", desc: "Get your price upfront. No haggling. No \"I'll get back to you.\"" },
                { icon: ShieldCheck, title: "Every Pro is verified", desc: "Background checked, insured, and rated by real customers. No randos." },
                { icon: Clock, title: "Real-time tracking", desc: "Know exactly when your Pro is arriving, working, and done. Like Uber for your home." },
                { icon: DollarSign, title: "Price ceiling guarantee", desc: "The price you're quoted is the most you'll ever pay. Period." },
              ].map((item) => (
                <Card key={item.title} className="border-border hover:border-[#F47C20]/30 transition-colors">
                  <CardContent className="p-5 flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#F47C20]/10 flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-[#F47C20]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Link href="/book" asChild>
              <Button className="mt-6 bg-[#F47C20] hover:bg-[#e06910] text-white font-bold">
                Get Your Free Quote <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* For Pros */}
          <div>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
              <Wrench className="w-5 h-5 text-[#F47C20]" /> For Pros
            </h3>
            <div className="space-y-4">
              {[
                { icon: Ban, title: "Zero lead fees", desc: "We don't charge you to find work. You get matched to jobs — free. No pay-per-lead scam." },
                { icon: DollarSign, title: "Get paid in 48 hours", desc: "Finish the job, get paid. Instant payout available. No chasing invoices." },
                { icon: TrendingUp, title: "A real career path", desc: "Set your income goal. We build your job track. Certifications unlock higher-paying B2B work." },
                { icon: ShieldCheck, title: "You're protected too", desc: "Liability coverage, no-show protection for customers, and dispute resolution that's actually fair." },
              ].map((item) => (
                <Card key={item.title} className="border-border hover:border-[#F47C20]/30 transition-colors">
                  <CardContent className="p-5 flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#F47C20]/10 flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-[#F47C20]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Link href="/become-pro" asChild>
              <Button className="mt-6 bg-[#F47C20] hover:bg-[#e06910] text-white font-bold">
                Join as a Pro <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* The connection */}
        <div className="mt-14 max-w-2xl mx-auto text-center p-8 rounded-2xl bg-slate-900 dark:bg-slate-800">
          <Users className="w-10 h-10 text-[#F47C20] mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-3">Better together.</h3>
          <p className="text-slate-300 leading-relaxed">
            When a Pro does great work, they earn higher ratings, unlock better jobs, and build a reputation that follows them. 
            When a customer books through UpTend, they fund fair wages, verified quality, and a platform that holds everyone accountable. 
            <strong className="text-white"> You're not just booking a service — you're supporting a better industry.</strong>
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─── SERVICES STRIP ─── */
function ServicesStrip() {
  const [, setLocation] = useLocation();
  const services = [
    { key: "handyman", label: "Handyman", price: "$75/hr", icon: Wrench },
    { key: "junk_removal", label: "Junk Removal", price: "From $99", icon: Truck },
    { key: "pressure_washing", label: "Pressure Washing", price: "From $120", icon: Waves },
    { key: "gutter_cleaning", label: "Gutter Cleaning", price: "From $150", icon: ArrowUpFromLine },
    { key: "home_cleaning", label: "Home Cleaning", price: "From $99", icon: Sparkles },
    { key: "landscaping", label: "Landscaping", price: "From $49", icon: Trees },
    { key: "pool_cleaning", label: "Pool Cleaning", price: "$120/mo", icon: Waves },
    { key: "moving_labor", label: "Moving Labor", price: "$65/hr", icon: Package },
    { key: "carpet_cleaning", label: "Carpet Cleaning", price: "$50/room", icon: Home },
    { key: "garage_cleanout", label: "Garage Cleanout", price: "From $150", icon: Home },
    { key: "light_demolition", label: "Light Demo", price: "From $199", icon: Truck },
  ];

  return (
    <section className="py-16 bg-slate-50 dark:bg-slate-900/50 border-t border-border">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-2">
          12 Services. One App. Transparent Pricing.
        </h2>
        <p className="text-center text-muted-foreground mb-10">Tap any service to get an instant quote.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {services.map((svc) => (
            <div
              key={svc.key}
              onClick={() => setLocation(`/book?service=${svc.key}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLocation(`/book?service=${svc.key}`); } }}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-slate-800 border border-border hover:border-[#F47C20]/50 cursor-pointer transition-all hover:shadow-md text-center"
            >
              <svc.icon className="w-6 h-6 text-[#F47C20]" />
              <span className="font-bold text-xs">{svc.label}</span>
              <span className="text-[11px] text-muted-foreground">{svc.price}</span>
            </div>
          ))}
        </div>
        <p className="text-center mt-6">
          <span
            onClick={() => setLocation("/find-pro")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLocation("/find-pro"); } }}
            className="text-sm text-[#C05600] hover:underline cursor-pointer font-medium"
          >
            Or browse Pros
          </span>
        </p>
      </div>
    </section>
  );
}

/* ─── TRUST BAR ─── */
function TrustBar() {
  return (
    <section className="py-16 bg-slate-900 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-white text-center mb-10">Why people trust UpTend</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: ShieldCheck, label: "Background Checked", desc: "Every Pro, every time" },
            { icon: DollarSign, label: "Price Guarantee", desc: "Quoted price = max price" },
            { icon: Leaf, label: "Impact Tracked", desc: "Every job measured" },
            { icon: Star, label: "Real Reviews", desc: "From verified customers" },
          ].map((item) => (
            <div key={item.label}>
              <item.icon className="w-8 h-8 text-[#F47C20] mx-auto mb-3" />
              <h3 className="font-bold text-white text-sm mb-1">{item.label}</h3>
              <p className="text-xs text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FINAL CTA ─── */
function FinalCTA() {
  return (
    <section className="py-20 bg-background text-center">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-black mb-4">
          Ready to <span className="text-[#C05600]">UpTend</span> your home?
        </h2>
        <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
          Whether you need a hand or you are one — there's a place for you here.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/book" asChild>
            <Button size="lg" className="bg-[#F47C20] hover:bg-[#e06910] text-white font-bold text-lg px-8 py-6 rounded-xl">
              Book a Service <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link href="/become-pro" asChild>
            <Button size="lg" variant="outline" className="font-bold text-lg px-8 py-6 rounded-xl border-[#C05600] text-[#C05600] hover:bg-[#C05600]/10">
              Become a Pro <ChevronRight className="ml-1 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
