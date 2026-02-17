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
import { ProsNearYou } from "@/components/landing/pros-near-you";
import { FloridaEstimator } from "@/components/booking/florida-estimator";
import { useTranslation } from "react-i18next";

export default function Landing() {
  usePageTitle("UpTend | Smart Home Services in Orlando — Book Instantly");
  return (
    <div className="min-h-screen bg-background" data-testid="page-landing">
      <Header />
      <main>
        <GeorgeBanner />
        <HeroSection />
        <IndustryIsBroken />
        <UpTendVerb />
        <ProsNearYou />
        <TwoSides />
        <ServicesStrip />
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
    <div className="bg-gradient-to-r from-[#F47C20] to-orange-500 text-white py-2.5 px-4 text-center">
      <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 flex-wrap">
        <MessageCircle className="w-4 h-4 shrink-0" />
        <span className="text-sm font-medium">
          <strong>Meet George</strong> — your AI home services assistant. Need a quote, have a question, or don't know where to start? <strong>Just ask George.</strong> He's the orange chat in the corner 👉
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
    <section className="relative pt-20 pb-20 overflow-hidden bg-slate-900 dark:bg-slate-950">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#3B1D5A]/60 to-slate-900" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#3B1D5A]/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#F47C20]/10 rounded-full blur-[120px]" />

      <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 tracking-tight leading-[1.1]">
          {t("hero.hero_headline_1")}<br />
          {t("hero.hero_headline_2")}<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F47C20] to-orange-300">
            {t("hero.hero_headline_3")}
          </span>
        </h1>

        <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
          {t("hero.hero_subhead")}
        </p>

        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <div onClick={toggleLanguage} className="inline-flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer ring-1 ring-white/10 hover:ring-white/20 hover:bg-white/5 transition-all">
            <Globe className="w-4 h-4 text-[#F47C20]" />
            {i18n.language === "en" ? (
              <span className="text-sm text-slate-400">¿Español? <span className="font-semibold text-[#F47C20]">Cambiar →</span></span>
            ) : (
              <span className="text-sm text-slate-400">English? <span className="font-semibold text-[#F47C20]">Switch →</span></span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <Link href="/book">
            <Button size="lg" className="bg-[#F47C20] hover:bg-[#e06910] text-white font-bold text-lg px-8 py-6 rounded-xl shadow-lg shadow-[#F47C20]/25">
              Get Your Free Quote <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link href="/become-pro">
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 font-bold text-lg px-8 py-6 rounded-xl">
              Join as a Pro
            </Button>
          </Link>
        </div>

        <FloridaEstimator />

        <p className="mt-6 text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
          {t("hero.hero_footnote")}
        </p>
      </div>
    </section>
  );
}

/* ─── THE INDUSTRY IS BROKEN ─── */
function IndustryIsBroken() {
  return (
    <section className="py-20 bg-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-14">
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 mb-4 text-sm font-bold">
            The Problem
          </Badge>
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Home services is broken.<br />
            <span className="text-slate-400">For everyone.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Customer pain */}
          <Card className="bg-slate-800/60 border-slate-700">
            <CardContent className="p-8">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Home className="w-5 h-5 text-orange-400" /> If you're a homeowner:
              </h3>
              <ul className="space-y-4">
                {[
                  { icon: Clock, text: "You call 5 contractors, maybe 2 call back" },
                  { icon: DollarSign, text: "The quote is whatever they feel like charging" },
                  { icon: Ban, text: "No insurance, no background check, no accountability" },
                  { icon: Clock, text: "They no-show. You take another day off work." },
                ].map((item) => (
                  <li key={item.text} className="flex items-start gap-3">
                    <item.icon className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                    <span className="text-slate-300">{item.text}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Pro pain */}
          <Card className="bg-slate-800/60 border-slate-700">
            <CardContent className="p-8">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-orange-400" /> If you're a Pro:
              </h3>
              <ul className="space-y-4">
                {[
                  { icon: DollarSign, text: "Platforms charge you $30-50 per lead — most don't convert" },
                  { icon: Ban, text: "You compete on price against uninsured guys on Craigslist" },
                  { icon: Clock, text: "Customers ghost, cancel, or dispute payments" },
                  { icon: TrendingUp, text: "No path to grow. Just hustle harder." },
                ].map((item) => (
                  <li key={item.text} className="flex items-start gap-3">
                    <item.icon className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                    <span className="text-slate-300">{item.text}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-slate-500 mt-10 text-sm font-semibold uppercase tracking-wider">
          Other platforms profit from this chaos. We're ending it.
        </p>
      </div>
    </section>
  );
}

/* ─── UPTEND VERB ─── */
function UpTendVerb() {
  const { t } = useTranslation();
  return (
    <section className="py-16 bg-slate-50 dark:bg-slate-900/50">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-slate-900 dark:text-white">
          {t("landing.uptend_meaning_title")}
        </h2>
        <p className="text-lg md:text-xl leading-relaxed text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: t("landing.uptend_meaning_body") }} />
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
            Fair for customers. Fair for Pros.<br />
            <span className="text-[#F47C20]">That's the whole point.</span>
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
                { icon: Zap, title: "Instant, honest pricing", desc: "See your price in 30 seconds. No haggling. No \"I'll get back to you.\"" },
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
            <Link href="/book">
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
            <Link href="/become-pro">
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
    { key: "home_consultation", label: "AI Home Scan", price: "From $99", icon: Star },
  ];

  return (
    <section className="py-16 bg-slate-50 dark:bg-slate-900/50 border-t border-border">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-2">12 Services. One App. Transparent Pricing.</h2>
        <p className="text-center text-muted-foreground mb-10">Tap any service to get an instant quote.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {services.map((svc) => (
            <div
              key={svc.key}
              onClick={() => setLocation(`/book?service=${svc.key}`)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-slate-800 border border-border hover:border-[#F47C20]/50 cursor-pointer transition-all hover:shadow-md text-center"
            >
              <svc.icon className="w-6 h-6 text-[#F47C20]" />
              <span className="font-bold text-xs">{svc.label}</span>
              <span className="text-[11px] text-muted-foreground">{svc.price}</span>
            </div>
          ))}
        </div>
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
          Ready to <span className="text-[#F47C20]">UpTend</span> your home?
        </h2>
        <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
          Whether you need a hand or you are one — there's a place for you here.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/book">
            <Button size="lg" className="bg-[#F47C20] hover:bg-[#e06910] text-white font-bold text-lg px-8 py-6 rounded-xl">
              Book a Service <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link href="/become-pro">
            <Button size="lg" variant="outline" className="font-bold text-lg px-8 py-6 rounded-xl border-[#F47C20] text-[#F47C20] hover:bg-[#F47C20]/10">
              Become a Pro <ChevronRight className="ml-1 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
