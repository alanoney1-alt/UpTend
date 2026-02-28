import { usePageTitle } from "@/hooks/use-page-title";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck, ArrowRight, Globe, Heart, Zap, Camera,
  DollarSign, Clock, Ban, TrendingUp, Users, Star,
  CheckCircle, ChevronRight, Wrench, Waves, Truck,
  Package, Home, Trees, ArrowUpFromLine, Sparkles,
  MapPin,
} from "lucide-react";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { FloridaEstimator } from "@/components/booking/florida-estimator";
import { SocialProofTicker } from "@/components/landing/social-proof-ticker";
import { Founding100 } from "@/components/landing/founding-100";
import { AnnouncementTicker } from "@/components/landing/announcement-ticker";
import { useTranslation } from "react-i18next";

export default function Landing() {
  usePageTitle("UpTend | Home Services, Finally Done Right");
  return (
    <div className="min-h-screen bg-background" data-testid="page-landing">
      <Header />
      <main id="main-content">
        <div className="pt-[72px]">
          <AnnouncementTicker />
        </div>
        <HeroSection />
        <SocialProofTicker />
        <TrustBar />
        <SocialProofStats />
        <Founding100 />
        <HowItWorks />
        <TheDifference />
        <ServicesStrip />
        <RecurringServices />
        <TwoSides />
        <Testimonials />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

/* ─── TIME-AWARE HELPERS ─── */
function getTimeAwareSubtitle(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour <= 11) return "Start your day right. Book a pro before your coffee gets cold.";
  if (hour >= 12 && hour <= 17) return "Get it done today. Same-day pros available.";
  if (hour >= 18 && hour <= 22) return "Plan ahead. Book now, schedule anytime.";
  return "Can't sleep? Neither can we. Book for tomorrow.";
}

function isHurricaneSeason(): boolean {
  const month = new Date().getMonth(); // 0-indexed
  return month >= 5 && month <= 10; // Jun(5) - Nov(10)
}

/* ─── HERO ─── */
function HeroSection() {
  const { t, i18n } = useTranslation();
  const toggleLanguage = () => i18n.changeLanguage(i18n.language === "en" ? "es" : "en");

  return (
    <section className="relative pt-12 pb-20 overflow-hidden bg-slate-900">
      <div className="absolute inset-0">
        <img src="/images/site/hero-home-service.webp" alt="" className="w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-slate-900/80" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-[#0f172a]/30 to-slate-900/60" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#0f172a]/15 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#F47C20]/8 rounded-full blur-[120px]" />

      <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 tracking-tight leading-[1.05]">
          {t("hero.hero_headline_1")}<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F47C20] to-orange-300">
            {t("hero.hero_headline_2")}
          </span>
        </h1>

        <Link href="/join">
          <Button size="lg" className="bg-[#F47C20] hover:bg-[#E06910] text-white font-bold text-sm sm:text-lg px-6 sm:px-10 py-4 rounded-xl shadow-lg shadow-[#F47C20]/25 hover:shadow-xl hover:scale-[1.02] transition-all mb-8 whitespace-normal max-w-[90vw]">
            Join the Founding 100 <ArrowRight className="ml-2 w-5 h-5 shrink-0" />
          </Button>
        </Link>

        <p className="text-white/50 text-xs md:text-sm font-semibold uppercase tracking-[0.2em] mb-4">Home Intelligence</p>
        <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto mb-3 leading-relaxed">
          Tell us what's wrong. Get a fair price in 60 seconds. One pro, matched and booked. That's it.
        </p>
        <p className="text-white/50 text-base md:text-lg max-w-xl mx-auto mb-8 leading-relaxed font-light">
          Every pro is background-checked and insured. Every price is locked before they arrive.
        </p>

        {isHurricaneSeason() && (
          <div className="max-w-xl mx-auto mb-6 px-4 py-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-sm font-medium">
            🌀 Hurricane season is here. Get your home storm-ready.
          </div>
        )}

        {/* Service category selector */}
        <p className="text-white/50 text-sm font-semibold uppercase tracking-widest mb-4">What do you need?</p>
        <div className="flex flex-wrap justify-center gap-2.5 max-w-3xl mx-auto mb-10">
          {[
            { key: "junk_removal", label: "Junk Removal", icon: Truck },
            { key: "pressure_washing", label: "Pressure Washing", icon: Waves },
            { key: "gutter_cleaning", label: "Gutter Cleaning", icon: ArrowUpFromLine },
            { key: "home_cleaning", label: "Home Cleaning", icon: Sparkles },
            { key: "handyman", label: "Handyman", icon: Wrench },
            { key: "landscaping", label: "Landscaping", icon: Trees },
            { key: "moving_labor", label: "Moving Labor", icon: Package },
            { key: "light_demolition", label: "Demolition", icon: Zap },
            { key: "garage_cleanout", label: "Garage Cleanout", icon: Home },
            { key: "pool_cleaning", label: "Pool Cleaning", icon: Waves },
            { key: "carpet_cleaning", label: "Carpet Cleaning", icon: Sparkles },
          ].map((svc) => (
            <Link
              key={svc.key}
              href={`/book?service=${svc.key}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/90 text-sm font-medium hover:bg-[#F47C20] hover:border-[#F47C20] hover:text-white transition-all duration-200 hover:shadow-lg hover:shadow-[#F47C20]/20 hover:scale-[1.03]"
            >
              <svc.icon className="w-3.5 h-3.5" />
              {svc.label}
            </Link>
          ))}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("george:open"))}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F47C20]/20 border border-[#F47C20]/30 text-[#F47C20] text-sm font-medium hover:bg-[#F47C20] hover:text-white transition-all duration-200"
          >
            Something else? Ask George
          </button>
        </div>

        <div className="flex justify-center mb-10">
          <Link href="/book" asChild>
            <Button size="lg" className="bg-[#F47C20] hover:bg-[#e06910] text-white font-bold text-lg px-10 py-6 rounded-xl shadow-lg shadow-[#F47C20]/25 transition-all hover:shadow-xl hover:shadow-[#F47C20]/30 hover:scale-[1.02]">
              {t("landing.get_free_quote", "Get Your Free Quote")} <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>

        {/* Snap a photo shortcut */}
        <Link href="/snap-quote" className="inline-flex items-center gap-2 mt-6 text-sm text-white/50 hover:text-white/80 transition-colors group">
          <Camera className="w-4 h-4" />
          <span>Have a photo? <span className="text-[#F47C20] group-hover:underline">Get an instant photo quote</span></span>
        </Link>

        <div className="flex justify-center mt-6">
          <button onClick={toggleLanguage} aria-label={i18n.language === "en" ? "Switch to Spanish" : "Switch to English"} className="inline-flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer ring-1 ring-white/10 hover:ring-white/20 hover:bg-white/5 transition-all">
            <Globe className="w-4 h-4 text-[#F47C20]" />
            {i18n.language === "en" ? (
              <span className="text-sm text-slate-400">¿Español? <span className="font-semibold text-[#F47C20]">Cambiar →</span></span>
            ) : (
              <span className="text-sm text-slate-400">English? <span className="font-semibold text-[#F47C20]">Switch →</span></span>
            )}
          </button>
        </div>

        <p className="mt-6 text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
          {t("hero.hero_footnote")}
        </p>
      </div>
    </section>
  );
}

/* ─── TRUST BAR ─── */
function TrustBar() {
  const { t } = useTranslation();

  return (
    <section className="py-10 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
      <div className="max-w-4xl mx-auto px-4">
        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-10 mb-8">
          {[
            { icon: ShieldCheck, label: t("landing.badge_bg_check", "Background-Checked") },
            { icon: DollarSign, label: t("landing.badge_price_protect", "Price-Protected") },
            { icon: Zap, label: "60-Second Quotes" },
            { icon: MapPin, label: t("landing.badge_live_track", "Live Tracking") },
            { icon: CheckCircle, label: t("landing.badge_guaranteed", "Guaranteed") },
          ].map((b) => (
            <div key={b.label} className="flex items-center gap-2">
              <b.icon className="w-5 h-5 text-[#F47C20]" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{b.label}</span>
            </div>
          ))}
        </div>

        {/* Price Protection Guarantee */}
        <div className="max-w-2xl mx-auto p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-[#F47C20]" />
            <span className="font-bold text-sm text-slate-900 dark:text-white">{t("landing.ppg_title", "Price Protection Guarantee")}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed text-center">
            {t("landing.ppg_desc", "Your price is locked at booking. If the Pro arrives and discovers the job is bigger than described, any scope changes require your approval with photo documentation. No surprises, ever.")}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─── SOCIAL PROOF STATS ─── */
function SocialProofStats() {
  const stats = [
    { value: "11", label: "Service Categories" },
    { value: "100%", label: "Background Checked" },
    { value: "1", label: "Lake Nona Service Zone" },
    { value: "$0", label: "Lead Fees for Pros" },
  ];

  return (
    <section className="py-14 bg-slate-800">
      <div className="max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-4xl md:text-5xl font-black text-white">{stat.value}</span>
                {stat.hasStar && <Star className="w-6 h-6 text-amber-400 fill-amber-400" />}
              </div>
              <p className="mt-2 text-sm text-slate-400 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── HOW IT WORKS ─── */
function HowItWorks() {
  const { t } = useTranslation();
  const steps = [
    { icon: MapPin, title: t("landing.hiw_step1_title", "Tell us what you need"), desc: t("landing.hiw_step1_desc", "Describe the job or snap a photo. Get a verified fair price in under 60 seconds.") },
    { icon: Wrench, title: t("landing.hiw_step2_title", "Get matched"), desc: t("landing.hiw_step2_desc", "We find the best Pro for your job. One price. No bidding, no haggling.") },
    { icon: ShieldCheck, title: t("landing.hiw_step3_title", "Track, pay, done."), desc: t("landing.hiw_step3_desc", "Follow your Pro in real-time. Payment happens automatically. Rate your experience.") },
  ];

  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-black text-center mb-12 text-slate-900 dark:text-white">
          {t("landing.hiw_headline", "How It Works")}
        </h2>
        <div className="grid md:grid-cols-3 gap-10">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#F47C20] flex items-center justify-center shadow-lg shadow-[#F47C20]/20">
                <step.icon className="w-7 h-7 text-white" />
              </div>
              <span className="text-xs font-bold text-[#F47C20] uppercase tracking-wider">{t("landing.hiw_step_label", "Step")} {i + 1}</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{step.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── THE DIFFERENCE ─── */
function TheDifference() {
  return (
    <section className="py-16 bg-white dark:bg-slate-950">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-black text-center mb-10 text-slate-900 dark:text-white">
          Stop wasting time on other platforms.
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-400 text-sm uppercase tracking-wider">Thumbtack, Angi, TaskRabbit</h3>
            <div className="space-y-3 text-sm text-slate-500">
              <p className="flex items-start gap-3"><span className="text-red-400 font-bold text-lg leading-none mt-0.5">x</span> You post a job and wait for 5 strangers to bid</p>
              <p className="flex items-start gap-3"><span className="text-red-400 font-bold text-lg leading-none mt-0.5">x</span> You compare quotes, read reviews, hope for the best</p>
              <p className="flex items-start gap-3"><span className="text-red-400 font-bold text-lg leading-none mt-0.5">x</span> Price changes when the pro shows up and "sees the job"</p>
              <p className="flex items-start gap-3"><span className="text-red-400 font-bold text-lg leading-none mt-0.5">x</span> Pro pays $15-50 per lead just to talk to you</p>
              <p className="flex items-start gap-3"><span className="text-red-400 font-bold text-lg leading-none mt-0.5">x</span> No one manages the job. You're on your own.</p>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-bold text-[#F47C20] text-sm uppercase tracking-wider">UpTend</h3>
            <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
              <p className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> We find you one pro. The right one.</p>
              <p className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> One price, locked before they arrive. Guaranteed.</p>
              <p className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Scope changes require your approval with photo proof</p>
              <p className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Pros keep 85%. No lead fees. Better work.</p>
              <p className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> We manage everything. Booking to completion.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── SERVICES STRIP ─── */
function ServicesStrip() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  /* Top 6 most-booked services */
  const services = [
    { key: "junk_removal", label: "Junk Removal", price: "From $99", icon: Truck, badge: "Most Popular", badgeColor: "bg-[#F47C20] text-white", image: "/images/site/service-junk-removal.webp" },
    { key: "pressure_washing", label: "Pressure Washing", price: "From $120", icon: Waves, badge: null, badgeColor: "", image: "/images/site/service-pressure-washing.webp" },
    { key: "handyman", label: "Handyman", price: "From $75/hr", icon: Wrench, badge: null, badgeColor: "", image: "/images/site/service-handyman.webp" },
    { key: "home_cleaning", label: "Home Cleaning", price: "From $99", icon: Sparkles, badge: "Best Value", badgeColor: "bg-emerald-500 text-white", image: "/images/site/service-home-cleaning.webp" },
    { key: "gutter_cleaning", label: "Gutter Cleaning", price: "From $150", icon: ArrowUpFromLine, badge: "Seasonal", badgeColor: "bg-amber-500 text-white", image: "/images/site/service-gutter-cleaning.webp" },
    { key: "landscaping", label: "Landscaping", price: "From $59", icon: Trees, badge: null, badgeColor: "", image: "/images/site/service-landscaping.webp" },
  ];

  return (
    <section className="py-20 bg-white dark:bg-slate-950">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-black text-center mb-3 text-slate-900 dark:text-white">
          {t("landing.strip_h2_1", "Our Services")}
        </h2>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-10">{t("landing.strip_sub", "Transparent pricing. Verified pros. Tap to get started.")}</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {services.map((svc) => (
            <div
              key={svc.key}
              role="button"
              tabIndex={0}
              onClick={() => setLocation(`/book?service=${svc.key}`)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setLocation(`/book?service=${svc.key}`); } }}
              aria-label={`Book ${svc.label} - ${svc.price}`}
              className="relative flex flex-col items-center gap-3 p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-[#F47C20]/50 cursor-pointer transition-all duration-200 ease-out hover:shadow-xl hover:-translate-y-1 text-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20]"
            >
              {svc.badge && (
                <span className={`absolute -top-2.5 right-3 z-10 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${svc.badgeColor} shadow-sm`}>
                  {svc.badge}
                </span>
              )}
              <div className="w-full aspect-[4/3] rounded-xl overflow-hidden mb-1">
                <img src={svc.image} alt={svc.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <span className="font-bold text-sm text-slate-900 dark:text-white">{svc.label}</span>
              <span className="text-xs font-semibold text-[#F47C20]">{svc.price}</span>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/services" className="text-sm text-[#F47C20] hover:underline font-semibold inline-flex items-center gap-1">
            {t("landing.view_all_services", "View all 11 services")} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* --- RECURRING SERVICES --- */
function RecurringServices() {
  return (
    <section className="py-16 bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
          Set It and Forget It
        </h2>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10">
          Book once, schedule it to repeat. Same pro, same price, same quality. Your home stays maintained without you lifting a finger.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Lawn Care", freq: "Every 2 weeks", price: "From $55/visit" },
            { label: "Pool Cleaning", freq: "Monthly", price: "From $120/mo" },
            { label: "Home Cleaning", freq: "Weekly", price: "From $99/visit" },
            { label: "Gutter Check", freq: "Quarterly", price: "From $75" },
          ].map((svc) => (
            <div key={svc.label} className="p-5 rounded-xl bg-white/5 border border-white/10 text-left">
              <h3 className="font-bold text-white text-sm mb-1">{svc.label}</h3>
              <p className="text-[#F47C20] text-xs font-semibold mb-2">{svc.freq}</p>
              <p className="text-slate-400 text-xs">{svc.price}</p>
            </div>
          ))}
        </div>
        <Link href="/book">
          <Button size="lg" className="mt-8 bg-[#F47C20] hover:bg-[#e06910] text-white font-bold text-lg px-8 rounded-xl">
            Start a Recurring Plan <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </Link>
      </div>
    </section>
  );
}

/* ─── TWO SIDES: WHY CUSTOMERS + PROS NEED US ─── */
function TwoSides() {
  const { t } = useTranslation();
  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4">
            {t("landing.twosides_h2_1", "Fair for customers.")}{" "}{t("landing.twosides_h2_2", "Fair for Pros.")}<br />
            <span className="text-[#F47C20]">{t("landing.twosides_h2_3", "That's the whole point.")}</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
            {t("landing.twosides_sub", "When Pros keep 85% of every job, they do better work. When customers get one locked price, they stop worrying. UpTend makes both sides win.")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* For Customers */}
          <div>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
              <Heart className="w-5 h-5 text-[#F47C20]" /> {t("landing.for_homeowners", "For Homeowners")}
            </h3>
            <div className="space-y-3">
              {[
                { icon: Zap, title: t("landing.cust_1_title", "One price, locked at booking"), desc: t("landing.cust_1_desc", "No haggling. No \"I'll get back to you.\" Your price is confirmed before they arrive.") },
                { icon: ShieldCheck, title: t("landing.cust_2_title", "Background-checked and insured"), desc: t("landing.cust_2_desc", "Every pro is verified, insured, and rated by real customers. None who's crawling your driveway.") },
                { icon: Clock, title: t("landing.cust_3_title", "Live tracking and photo docs"), desc: t("landing.cust_3_desc", "Follow your pro in real time. Every job documented with photos. Transparent from start to finish.") },
                { icon: DollarSign, title: t("landing.cust_4_title", "Price Protection Guarantee"), desc: t("landing.cust_4_desc", "The price you're quoted is the most you'll ever pay. Scope changes require your approval with photo evidence.") },
              ].map((item) => (
                <div key={item.title} className="p-4 flex gap-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#F47C20]/30 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-[#F47C20]/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-[#F47C20]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm mb-1 text-slate-900 dark:text-white">{item.title}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/book" asChild>
              <Button className="mt-6 bg-[#F47C20] hover:bg-[#e06910] text-white font-bold">
                {t("landing.get_free_quote", "Get Your Free Quote")} <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Why Our Pros Are Better */}
          <div>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
              <Wrench className="w-5 h-5 text-[#F47C20]" /> {t("landing.why_pros_better", "Why Our Pros Are Better")}
            </h3>
            <div className="space-y-3">
              {[
                { icon: Ban, title: t("landing.pro_1_title", "They keep 85% of what you pay"), desc: t("landing.pro_1_desc", "No lead fees draining their income. That means they show up motivated, do great work, and come back.") },
                { icon: DollarSign, title: t("landing.pro_2_title", "Guaranteed to get paid"), desc: t("landing.pro_2_desc", "Our pros don't chase invoices. They focus on doing excellent work because the platform handles the rest.") },
                { icon: TrendingUp, title: t("landing.pro_3_title", "They choose to be here"), desc: t("landing.pro_3_desc", "Our pros set their own rates and pick their jobs. Happy pros who want to be there do better work for you.") },
                { icon: ShieldCheck, title: t("landing.pro_4_title", "Vetted and verified"), desc: t("landing.pro_4_desc", "Background-checked, insured, and rated by real customers. Every pro on the platform earned their spot.") },
              ].map((item) => (
                <div key={item.title} className="p-4 flex gap-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#F47C20]/30 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-[#F47C20]/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-[#F47C20]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm mb-1 text-slate-900 dark:text-white">{item.title}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/become-pro" asChild>
              <Button className="mt-6 bg-[#F47C20] hover:bg-[#e06910] text-white font-bold">
                {t("landing.join_as_pro", "Are you a Pro? Join our network")} <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── TESTIMONIALS ─── */
function Testimonials() {
  return (
    <section className="py-16 bg-white dark:bg-slate-950">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-slate-900 dark:text-white">
          Customer Reviews
        </h2>
        <p className="text-slate-400 text-lg">Coming Soon</p>
      </div>
    </section>
  );
}

/* ─── FINAL CTA ─── */
function FinalCTA() {
  const { t } = useTranslation();
  return (
    <section className="py-20 bg-slate-900 text-center">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-black mb-4 text-white">
          {t("landing.cta_title_1", "Ready to")} <span className="text-[#F47C20]">UpTend</span> {t("landing.cta_title_2", "your home?")}
        </h2>
        <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
          {t("landing.cta_sub", "Whether you need a hand or you are one, there's a place for you here.")}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/book" asChild>
            <Button size="lg" className="bg-[#F47C20] hover:bg-[#e06910] text-white font-bold text-lg px-8 py-6 rounded-xl shadow-lg shadow-[#F47C20]/25">
              {t("landing.book_a_service", "Book a Service")} <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link href="/become-pro" asChild>
            <Button size="lg" variant="outline" className="font-bold text-lg px-8 py-6 rounded-xl border-white/20 text-white hover:bg-white/10">
              {t("landing.become_a_pro", "Become a Pro")} <ChevronRight className="ml-1 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
