import { usePageTitle } from "@/hooks/use-page-title";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  ClipboardCheck,
  ScanFace, TrendingUp, ChevronRight, Truck,
  Waves, ArrowUpFromLine, Package, Search, BrainCircuit,
  ArrowRight, Activity, Globe, Heart, Leaf,
  Sparkles, Trees, Home, Wrench,
} from "lucide-react";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { HowItWorks } from "@/components/landing/how-it-works";
import { BookingChatbot } from "@/components/booking-chatbot";
import { ProsNearYou } from "@/components/landing/pros-near-you";
import { FloridaEstimator } from "@/components/booking/florida-estimator";
import { StormCountdown } from "@/components/booking/storm-countdown";
import { useTranslation } from "react-i18next";

export default function Landing() {
  usePageTitle("UpTend | Smart Home Services in Orlando — Book Instantly");
  return (
    <div className="min-h-screen bg-background" data-testid="page-landing">
      <Header />
      <StormCountdown />
      <main>
        <NewHeroSection />
        <WhatDoesUpTendMeanSection />
        <HowItWorks />
        <InteractiveFeatures />
        <ProsNearYou />
        <SafetyShieldSection />
        <WhySection />
        <FortyNineWalkthrough />
        <WorkerCTA />
      </main>
      <Footer />
      {/* BookingChatbot removed — AI Chat Widget (global) handles this */}
    </div>
  );
}

function NewHeroSection() {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "es" : "en";
    i18n.changeLanguage(newLang);
  };

  return (
    <section
      className="relative pt-20 pb-24 overflow-hidden bg-slate-900 dark:bg-slate-950"
      data-testid="section-hero"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#3B1D5A]/60 to-slate-900" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#3B1D5A]/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#F47C20]/10 rounded-full blur-[120px]" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <span className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-full text-xs font-black uppercase tracking-widest border border-blue-500/20" data-testid="pill-protect">
              <ShieldCheck className="w-3 h-3" /> {t("hero.pill_protect")}
            </span>
            <span className="flex items-center gap-2 px-4 py-2 bg-[#F47C20]/10 text-[#F47C20] rounded-full text-xs font-black uppercase tracking-widest border border-[#F47C20]/20" data-testid="pill-connect">
              <Activity className="w-3 h-3" /> {t("hero.pill_connect")}
            </span>
            <span className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 rounded-full text-xs font-black uppercase tracking-widest border border-green-500/20" data-testid="pill-sustain">
              <Leaf className="w-3 h-3" /> {t("hero.pill_sustain")}
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 tracking-tight leading-[1.1]" data-testid="text-hero-tagline">
            {t("hero.hero_headline_1")}<br />
            {t("hero.hero_headline_2")}<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
              {t("hero.hero_headline_3")}
            </span>
          </h1>

          <p className="text-slate-400 text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed font-medium" data-testid="text-hero-sub">
            {t("hero.hero_subhead")}
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <div
              onClick={toggleLanguage}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition-all ring-1 ring-white/10 hover:ring-white/20 hover:bg-white/5"
              data-testid="pill-language-toggle"
            >
              <Globe className="w-4 h-4 text-[#F47C20]" />
              {i18n.language === "en" ? (
                <span className="text-sm text-slate-400">
                  ¿Español? <span className="font-semibold text-[#F47C20]">Cambiar &rarr;</span>
                </span>
              ) : (
                <span className="text-sm text-slate-400">
                  English? <span className="font-semibold text-[#F47C20]">Switch &rarr;</span>
                </span>
              )}
            </div>
          </div>

          <FloridaEstimator />

          <p className="mt-6 text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]" data-testid="text-hero-footnote">
            {t("hero.hero_footnote")}
          </p>
        </div>
      </div>
    </section>
  );
}

function WhatDoesUpTendMeanSection() {
  const { t } = useTranslation();
  return (
    <section className="py-16 md:py-20 bg-slate-50 dark:bg-slate-900/50" data-testid="section-uptend-meaning">
      <div className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-slate-900 dark:text-white">
          {t("landing.uptend_meaning_title")}
        </h2>
        <p className="text-lg md:text-xl leading-relaxed text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: t("landing.uptend_meaning_body") }} />
      </div>
    </section>
  );
}

function BridgeSection() {
  return (
    <section className="py-24 bg-background" data-testid="section-bridge">
      <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center justify-center gap-3 p-3 bg-primary/5 dark:bg-primary/10 rounded-2xl mb-8">
          <BrainCircuit className="w-8 h-8 text-primary dark:text-orange-400" />
          <h2 className="text-2xl font-bold" data-testid="text-bridge-headline">
            Powered by Pros. Verified by AI.
          </h2>
        </div>

        <p className="text-xl text-muted-foreground leading-relaxed" data-testid="text-bridge-body">
          <strong>Pros</strong> are our elite, background-checked specialists. They bring the muscle.
          <br className="hidden md:block" />
          Our <strong>AI</strong> brings the memory&mdash;logging every job to prove your home is well-maintained.
        </p>
      </div>
    </section>
  );
}

function InteractiveFeatures() {
  const { t } = useTranslation();

  return (
    <section className="pb-24 bg-background" data-testid="section-features">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">

          <Dialog>
            <DialogTrigger asChild>
              <Card
                className="hover-elevate cursor-pointer group text-left h-full"
                data-testid="card-feature-score"
              >
                <CardContent className="p-8 flex flex-col h-full">
                  <div className="w-14 h-14 bg-primary/10 dark:bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                    <TrendingUp className="w-7 h-7 text-primary dark:text-orange-400" />
                  </div>
                  <h3 className="font-bold text-xl mb-3">{t("features.feature_score_title")}</h3>
                  <p className="text-muted-foreground leading-relaxed flex-grow">
                    {t("features.feature_score_desc")}
                  </p>
                  <span className="text-sm font-bold text-primary dark:text-orange-400 mt-6 flex items-center uppercase tracking-wide">
                    {t("features.feature_score_cta")} <ChevronRight className="w-4 h-4 ml-1" />
                  </span>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-xl" data-testid="dialog-score">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">{t("features.feature_score_dialog_title")}</DialogTitle>
                <DialogDescription className="sr-only">Learn about the Home Score</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4 text-muted-foreground">
                <p className="text-lg">{t("features.feature_score_dialog_intro")}</p>
                <p>{t("features.feature_score_dialog_body")}</p>
                <ul className="list-disc pl-5 space-y-2 mt-4 bg-muted p-4 rounded-lg">
                  <li>{t("features.feature_score_insurance")}</li>
                  <li>{t("features.feature_score_resale")}</li>
                  <li>{t("features.feature_score_hoa")}</li>
                </ul>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Card
                className="hover-elevate cursor-pointer group text-left h-full"
                data-testid="card-feature-inventory"
              >
                <CardContent className="p-8 flex flex-col h-full">
                  <div className="w-14 h-14 bg-secondary/10 dark:bg-secondary/10 rounded-2xl flex items-center justify-center mb-6">
                    <ScanFace className="w-7 h-7 text-secondary dark:text-secondary" />
                  </div>
                  <h3 className="font-bold text-xl mb-3">{t("features.feature_inventory_title")}</h3>
                  <p className="text-muted-foreground leading-relaxed flex-grow">
                    {t("features.feature_inventory_desc")}
                  </p>
                  <span className="text-sm font-bold text-secondary dark:text-secondary mt-6 flex items-center uppercase tracking-wide">
                    {t("features.feature_inventory_cta")} <ChevronRight className="w-4 h-4 ml-1" />
                  </span>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-xl" data-testid="dialog-inventory">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">{t("features.feature_inventory_dialog_title")}</DialogTitle>
                <DialogDescription className="sr-only">Learn about Digital Inventory</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4 text-muted-foreground">
                <p className="text-lg">{t("features.feature_inventory_dialog_intro")}</p>
                <p>{t("features.feature_inventory_dialog_body")}</p>
                <div className="bg-secondary/5 dark:bg-secondary/10 p-4 rounded-lg border border-secondary/20 dark:border-secondary text-secondary dark:text-purple-300 font-medium">
                  {t("features.feature_inventory_essential")}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Card
                className="hover-elevate cursor-pointer group text-left h-full"
                data-testid="card-feature-green"
              >
                <CardContent className="p-8 flex flex-col h-full">
                  <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-6">
                    <Leaf className="w-7 h-7 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-bold text-xl mb-3">{t("features.feature_green_title")}</h3>
                  <p className="text-muted-foreground leading-relaxed flex-grow">
                    {t("features.feature_green_desc")}
                  </p>
                  <span className="text-sm font-bold text-green-600 dark:text-green-400 mt-6 flex items-center uppercase tracking-wide">
                    {t("features.feature_green_cta")} <ChevronRight className="w-4 h-4 ml-1" />
                  </span>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-xl" data-testid="dialog-green">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">{t("features.feature_green_dialog_title")}</DialogTitle>
                <DialogDescription className="sr-only">Learn about the Green Promise</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4 text-muted-foreground">
                <p className="text-lg">{t("features.feature_green_dialog_intro")}</p>
                <p>{t("features.feature_green_dialog_body")}</p>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800">
                  <p className="font-bold text-green-800 dark:text-green-300">{t("features.feature_green_win_title")}</p>
                  <p className="text-green-700 dark:text-green-400 text-sm">{t("features.feature_green_win_body")}</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>

        </div>
      </div>
    </section>
  );
}

function SafetyShieldSection() {
  const { t } = useTranslation();

  return (
    <section className="py-24 bg-slate-900 dark:bg-slate-950" data-testid="section-safety-shield">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-4" data-testid="text-safety-headline">
          {t("safety.safety_headline")}
        </h2>
        <p className="text-slate-400 mb-12 max-w-2xl mx-auto text-lg">
          {t("safety.safety_subhead")}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 border border-slate-700 rounded-2xl bg-slate-800/50" data-testid="card-shield-background">
            <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 text-orange-400 font-bold text-lg">
              1
            </div>
            <h3 className="text-white font-bold mb-2">{t("safety.safety_background_title")}</h3>
            <p className="text-slate-400 text-sm">
              {t("safety.safety_background_desc")}
            </p>
          </div>

          <div className="p-6 border border-slate-700 rounded-2xl bg-slate-800/50" data-testid="card-shield-insurance">
            <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 text-orange-400 font-bold text-lg">
              2
            </div>
            <h3 className="text-white font-bold mb-2">{t("safety.safety_insurance_title")}</h3>
            <p className="text-slate-400 text-sm">
              {t("safety.safety_insurance_desc")}
            </p>
          </div>

          <div className="p-6 border border-slate-700 rounded-2xl bg-slate-800/50" data-testid="card-shield-tracking">
            <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 text-orange-400 font-bold text-lg">
              3
            </div>
            <h3 className="text-white font-bold mb-2">{t("safety.safety_tracking_title")}</h3>
            <p className="text-slate-400 text-sm">
              {t("safety.safety_tracking_desc")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function WhySection() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  const featuredService = {
    key: "home_consultation",
    label: "AI Home Scan",
    price: "$99 / $249",
    icon: ClipboardCheck,
    color: "text-primary dark:text-primary",
    description: "Complete home documentation: Standard ($99) interior walkthrough or Aerial ($249) with drone footage. Both include $49 credit toward your first or next booking."
  };

  const services = [
    { key: "handyman", label: "Handyman Services", price: "From $75/hr", icon: Wrench, color: "text-blue-500 dark:text-blue-400" },
    { key: "junk_removal", label: "Junk Removal", price: "From $99", icon: Truck, color: "text-primary dark:text-orange-400" },
    { key: "garage_cleanout", label: "Garage Cleanout", price: "From $150", icon: Home, color: "text-primary dark:text-orange-400" },
    { key: "moving_labor", label: "Moving Labor", price: "$65/hr per mover", icon: Package, color: "text-secondary dark:text-secondary" },
    { key: "home_cleaning", label: "Home Cleaning", price: "From $99", icon: Sparkles, color: "text-primary dark:text-orange-400" },
    { key: "carpet_cleaning", label: "Carpet Cleaning", price: "From $50/room", icon: Home, color: "text-primary dark:text-orange-400" },
    { key: "landscaping", label: "Landscaping", price: "From $49", icon: Trees, color: "text-green-500 dark:text-green-400" },
    { key: "gutter_cleaning", label: "Gutter Cleaning", price: "From $150", icon: ArrowUpFromLine, color: "text-orange-500 dark:text-orange-400" },
    { key: "pressure_washing", label: "Pressure Washing", price: "From $120", icon: Waves, color: "text-primary dark:text-orange-400" },
    { key: "pool_cleaning", label: "Pool Cleaning", price: "From $120/mo", icon: Waves, color: "text-primary dark:text-orange-400" },
    { key: "light_demolition", label: "Light Demolition", price: "From $199", icon: Truck, color: "text-primary dark:text-orange-400" },
  ];

  return (
    <section className="py-24 bg-muted/50 border-t border-border" data-testid="section-why">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1">
            <h2 className="text-3xl md:text-4xl font-bold mb-6" data-testid="text-why-headline">
              {t("why.why_headline")}
            </h2>
            <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
              <p>
                {t("why.why_intro")}
              </p>

              <div className="bg-primary/5 dark:bg-primary/10 p-6 rounded-lg border border-primary/20 dark:border-secondary" data-testid="card-health-monitor">
                <p className="mb-4" data-testid="text-health-monitor-desc">
                  {t("why.why_health_monitor_desc")}
                </p>
                <div className="pt-2 border-t border-primary/20 dark:border-secondary mt-4">
                  <p className="text-sm font-bold mb-2" data-testid="text-refresh-hook">
                    {t("why.why_refresh_hook")}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                    </span>
                    <p className="text-sm text-muted-foreground" data-testid="text-active-pro">
                      {t("why.why_active_pro")}
                    </p>
                  </div>
                </div>
              </div>

              <p data-testid="text-investing-asset">
                {t("why.why_investing")}
              </p>

              <div className="bg-slate-900 dark:bg-slate-800 p-6 rounded-lg text-white">
                <div className="flex items-center gap-3 mb-4">
                  <Heart className="w-6 h-6 text-orange-400" />
                  <h3 className="font-bold text-lg">{t("why.why_promise_title")}</h3>
                </div>
                <p className="text-slate-300 text-base leading-relaxed mb-4">
                  {t("why.why_promise_intro")}
                </p>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {t("why.why_promise_body")}
                </p>
                <p className="text-slate-300 text-sm mt-4 font-medium">
                  {t("why.why_promise_closing")}
                </p>
              </div>
            </div>

          </div>

          <div className="flex-1 w-full space-y-6">
            {/* Featured: AI Home Scan */}
            <Card className="shadow-xl border-2 border-primary">
              <CardContent className="p-6 bg-gradient-to-br from-primary/10 to-primary/5">
                <Badge className="mb-3 bg-primary">Featured</Badge>
                <div
                  className="flex items-start gap-4 cursor-pointer"
                  onClick={() => setLocation(`/book?service=${featuredService.key}`)}
                  data-testid={`service-${featuredService.key}`}
                >
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center shrink-0">
                    <featuredService.icon className={`w-6 h-6 ${featuredService.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-lg mb-1">{featuredService.label}</p>
                    <p className="text-sm text-muted-foreground mb-2">{featuredService.description}</p>
                    <p className="text-primary font-bold">{featuredService.price}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg" data-testid="card-services-grid">
              <CardContent className="p-8">
                <h3 className="font-bold text-muted-foreground uppercase text-xs tracking-wider mb-6">
                  All Services
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {services.map((svc) => (
                    <div
                      key={svc.key}
                      className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover-elevate cursor-pointer"
                      onClick={() => setLocation(`/book?service=${svc.key}`)}
                      data-testid={`service-${svc.key}`}
                    >
                      <div className="w-10 h-10 bg-background rounded-full shadow-sm flex items-center justify-center shrink-0">
                        <svc.icon className={`w-5 h-5 ${svc.color}`} />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{svc.label}</p>
                        <p className="text-xs text-muted-foreground">{svc.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

function FortyNineWalkthrough() {
  const { t } = useTranslation();

  const steps = [
    { title: t("walk.walk_step1_title"), desc: t("walk.walk_step1_desc") },
    { title: t("walk.walk_step2_title"), desc: t("walk.walk_step2_desc") },
    { title: t("walk.walk_step3_title"), desc: t("walk.walk_step3_desc") },
    { title: t("walk.walk_step4_title"), desc: t("walk.walk_step4_desc") },
  ];

  return (
    <section className="py-20 bg-background" data-testid="section-49-walkthrough">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-6" data-testid="text-49-headline">
              {t("walk.walk_headline")}
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              {t("walk.walk_intro")}
            </p>

            <div className="space-y-6">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-4" data-testid={`step-49-${i}`}>
                  <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/10 text-primary dark:text-orange-300 font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="font-bold">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 w-full">
            <Card className="shadow-lg" data-testid="card-report-preview">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <Activity className="w-12 h-12 text-primary mx-auto mb-2" />
                  <h3 className="font-bold text-xl">{t("walk.walk_report_title")}</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between gap-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-100 dark:border-red-800">
                    <span className="font-medium text-red-800 dark:text-red-300">{t("walk.walk_roof")}</span>
                    <Badge variant="destructive" data-testid="badge-critical">{t("walk.walk_critical")}</Badge>
                  </div>
                  <div className="flex justify-between gap-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-100 dark:border-yellow-800">
                    <span className="font-medium text-yellow-800 dark:text-yellow-300">{t("walk.walk_driveway")}</span>
                    <Badge variant="secondary" data-testid="badge-dirty">{t("walk.walk_dirty")}</Badge>
                  </div>
                  <div className="flex justify-between gap-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-100 dark:border-green-800">
                    <span className="font-medium text-green-800 dark:text-green-300">{t("walk.walk_garage")}</span>
                    <Badge variant="secondary" data-testid="badge-good">{t("walk.walk_good")}</Badge>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <p className="text-xs text-muted-foreground mb-3">{t("walk.walk_total_value")}</p>
                  <Link href="/book?service=home_consultation">
                    <Button className="w-full" data-testid="button-book-audit">
                      {t("walk.walk_book_audit")}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

function WorkerCTA() {
  const { t } = useTranslation();

  return (
    <section
      className="py-20 bg-slate-900 dark:bg-slate-950 text-white text-center"
      data-testid="section-worker-cta"
    >
      <div className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8">
        <h2 className="text-3xl font-bold mb-4" data-testid="text-worker-cta-headline">
          {t("worker.worker_headline")}
        </h2>
        <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
          {t("worker.worker_body")}
        </p>
        <Link href="/become-pro">
          <Button
            variant="outline"
            size="lg"
            className="border-orange-500 text-orange-400"
            data-testid="button-worker-cta-apply"
          >
            {t("worker.worker_apply")}
          </Button>
        </Link>
      </div>
    </section>
  );
}
