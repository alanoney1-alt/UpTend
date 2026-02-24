import { usePageTitle } from "@/hooks/use-page-title";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck, ArrowRight, Globe, Heart, Zap,
  DollarSign, Clock, Ban, TrendingUp, Users, Star,
  CheckCircle, ChevronRight, Wrench, Waves, Truck,
  Package, Home, Trees, ArrowUpFromLine, Sparkles,
  MessageCircle,
} from "lucide-react";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { FloridaEstimator } from "@/components/booking/florida-estimator";
import { useTranslation } from "react-i18next";

export default function Landing() {
  usePageTitle("UpTend | Home Services, Finally Done Right");
  return (
    <div className="min-h-screen bg-background" data-testid="page-landing">
      <Header />
      <main>
        <GeorgeBanner />
        <HeroSection />
        <ServicesStrip />
        <TwoSides />
        <Testimonials />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

/* ─── GEORGE BANNER ─── */
function GeorgeBanner() {
  const { t } = useTranslation();
  return (
    <div className="mt-20 bg-gradient-to-r from-[#F47C20] to-orange-500 text-white py-2.5 md:py-3 px-3 md:px-4 text-center">
      <div className="max-w-4xl mx-auto flex items-center justify-center gap-1.5 md:gap-2">
        <MessageCircle className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
        <span className="text-xs md:text-base font-medium">
          <strong>{t("landing.george_banner_title", "Meet Mr. George")}</strong> — {t("landing.george_banner_sub", "your AI assistant. Questions?")}{" "}
          <Link href="/meet-george" className="underline font-bold hover:text-white/90 transition-colors">{t("landing.george_banner_cta", "Ask Mr. George")}</Link>
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
          {t("hero.hero_headline_1")}<br />
          {t("hero.hero_headline_3", "Without the headache.")}<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F47C20] to-orange-300">
            {t("hero.hero_headline_2")}
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
          <Link href="/book" asChild>
            <Button size="lg" className="bg-[#F47C20] hover:bg-[#e06910] text-white font-bold text-lg px-8 py-6 rounded-xl shadow-lg shadow-[#F47C20]/25">
              {t("landing.get_free_quote", "Get Your Free Quote")} <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link href="/become-pro" asChild>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 font-bold text-lg px-8 py-6 rounded-xl">
              {t("landing.join_as_pro", "Join as a Pro")}
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

/* ─── TWO SIDES: WHY CUSTOMERS + PROS NEED US ─── */
function TwoSides() {
  const { t } = useTranslation();
  return (
    <section className="py-20 bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <Badge className="bg-green-500/20 text-green-500 dark:text-green-400 border-green-500/30 mb-4 text-sm font-bold">
            {t("landing.twosides_badge", "The Fix")}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4">
            {t("landing.twosides_h2_1", "Fair for customers.")}<br className="md:hidden" />{" "}{t("landing.twosides_h2_2", "Fair for Pros.")}<br />
            <span className="text-[#F47C20]">{t("landing.twosides_h2_3", "That's the whole point.")}</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("landing.twosides_sub", "When Pros are treated right, customers get better service. When customers pay fair prices, Pros get steady work. UpTend makes both sides win.")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* For Customers */}
          <div>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
              <Heart className="w-5 h-5 text-[#F47C20]" /> {t("landing.for_homeowners", "For Homeowners")}
            </h3>
            <div className="space-y-4">
              {[
                { icon: Zap, title: t("landing.cust_1_title", "Instant, honest pricing"), desc: t("landing.cust_1_desc", "Get your price upfront. No haggling. No \"I'll get back to you.\"") },
                { icon: ShieldCheck, title: t("landing.cust_2_title", "Every Pro is verified"), desc: t("landing.cust_2_desc", "Background checked, insured, and rated by real customers. No randos.") },
                { icon: Clock, title: t("landing.cust_3_title", "Real-time tracking"), desc: t("landing.cust_3_desc", "Know exactly when your Pro is arriving, working, and done. Like Uber for your home.") },
                { icon: DollarSign, title: t("landing.cust_4_title", "Price ceiling guarantee"), desc: t("landing.cust_4_desc", "The price you're quoted is the most you'll ever pay. Period.") },
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
                {t("landing.get_free_quote", "Get Your Free Quote")} <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* For Pros */}
          <div>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
              <Wrench className="w-5 h-5 text-[#F47C20]" /> {t("landing.for_pros", "For Pros")}
            </h3>
            <div className="space-y-4">
              {[
                { icon: Ban, title: t("landing.pro_1_title", "Zero lead fees"), desc: t("landing.pro_1_desc", "We don't charge you to find work. You get matched to jobs — free. No pay-per-lead scam.") },
                { icon: DollarSign, title: t("landing.pro_2_title", "Get paid in 48 hours"), desc: t("landing.pro_2_desc", "Finish the job, get paid. Instant payout available. No chasing invoices.") },
                { icon: TrendingUp, title: t("landing.pro_3_title", "A real career path"), desc: t("landing.pro_3_desc", "Set your income goal. We build your job track. Certifications unlock higher-paying B2B work.") },
                { icon: ShieldCheck, title: t("landing.pro_4_title", "You're protected too"), desc: t("landing.pro_4_desc", "Liability coverage, no-show protection for customers, and dispute resolution that's actually fair.") },
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
                {t("landing.join_as_pro", "Join as a Pro")} <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* The connection */}
        <div className="mt-14 max-w-2xl mx-auto text-center p-8 rounded-2xl bg-slate-900 dark:bg-slate-800">
          <Users className="w-10 h-10 text-[#F47C20] mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-3">{t("landing.better_together", "Better together.")}</h3>
          <p className="text-slate-300 leading-relaxed">
            {t("landing.better_together_desc", "When a Pro does great work, they earn higher ratings, unlock better jobs, and build a reputation that follows them. When a customer books through UpTend, they fund fair wages, verified quality, and a platform that holds everyone accountable.")}
            <strong className="text-white"> {t("landing.better_together_bold", "You're not just booking a service — you're supporting a better industry.")}</strong>
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─── SERVICES STRIP ─── */
function ServicesStrip() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const services = [
    { key: "handyman", label: "Handyman", price: "$75/hr", icon: Wrench },
    { key: "junk_removal", label: "Junk Removal", price: "From $99", icon: Truck },
    { key: "pressure_washing", label: "Pressure Washing", price: "From $120", icon: Waves },
    { key: "gutter_cleaning", label: "Gutter Cleaning", price: "From $129", icon: ArrowUpFromLine },
    { key: "home_cleaning", label: "Home Cleaning", price: "From $99", icon: Sparkles },
    { key: "landscaping", label: "Landscaping", price: "From $49", icon: Trees },
    { key: "pool_cleaning", label: "Pool Cleaning", price: "From $99/mo", icon: Waves },
    { key: "moving_labor", label: "Moving Labor", price: "$65/hr", icon: Package },
    { key: "carpet_cleaning", label: "Carpet Cleaning", price: "$50/room", icon: Home },
    { key: "garage_cleanout", label: "Garage Cleanout", price: "From $129", icon: Home },
    { key: "light_demolition", label: "Light Demo", price: "From $199", icon: Truck },
  ];

  return (
    <section className="py-16 bg-slate-50 dark:bg-slate-900/50 border-t border-border">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-2">
          {t("landing.strip_h2_1", "11 Services.")}<br />
          {t("landing.strip_h2_2", "One App.")}<br />
          {t("landing.strip_h2_3", "Transparent Pricing.")}
        </h2>
        <p className="text-center text-muted-foreground mb-10">{t("landing.strip_sub", "Tap any service to get an instant quote.")}</p>
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
        <p className="text-center mt-6">
          <span
            onClick={() => setLocation("/find-pro")}
            className="text-sm text-[#F47C20] hover:underline cursor-pointer font-medium"
          >
            {t("landing.browse_pros", "Or browse Pros →")}
          </span>
        </p>
      </div>
    </section>
  );
}

/* ─── TESTIMONIALS ─── */
function Testimonials() {
  const { t } = useTranslation();
  const testimonials = [
    {
      name: "Maria S.",
      location: "Lake Nona, FL",
      service: "Junk Removal",
      text: "I had a garage full of old furniture and appliances after my parents downsized. The crew showed up on time, loaded everything in under two hours, and the price was exactly what I was quoted. No surprises, no haggling. I have used other services before and always felt like I was being overcharged. Not here.",
    },
    {
      name: "James T.",
      location: "Winter Park, FL",
      service: "Pressure Washing",
      text: "My driveway had not been cleaned in five years and honestly looked like it belonged to an abandoned house. The difference after pressure washing was night and day. My neighbors actually asked me if I had the driveway repaved. The Pro was thorough and even hit the sidewalk edges I did not ask about.",
    },
    {
      name: "Patricia W.",
      location: "Dr. Phillips, FL",
      service: "Gutter Cleaning",
      text: "I put off gutter cleaning for two years because I could not find someone I trusted to show up and do the job right. The Pro who came was professional from start to finish. He showed me photos of the buildup before cleaning and the clear gutters after. Downspouts were tested and everything was bagged up. Very impressed.",
    },
    {
      name: "David R.",
      location: "Kissimmee, FL",
      service: "Handyman",
      text: "I needed a ceiling fan installed, a leaky faucet fixed, and some drywall patched. I described everything to the George AI assistant and got a quote that turned out to be almost exactly what I paid. No one has ever given me an accurate estimate on handyman work before. The Pro knocked out all three tasks in one visit.",
    },
    {
      name: "Linda M.",
      location: "Altamonte Springs, FL",
      service: "Home Cleaning",
      text: "What sold me was the communication. I got updates when the Pro was on the way, knew exactly what was being cleaned, and received before and after photos when it was done. I have tried three other cleaning services in Orlando and none of them were this reliable or this transparent. I am on the recurring plan now.",
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            {t("landing.testimonials_title", "What Our Customers Are Saying")}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("landing.testimonials_sub", "Real reviews from real homeowners across the Orlando metro area.")}
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <Card key={t.name} className="p-6 flex flex-col">
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-4">"{t.text}"</p>
              <div className="border-t border-border pt-3">
                <p className="font-bold text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.service} -- {t.location}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FINAL CTA ─── */
function FinalCTA() {
  const { t } = useTranslation();
  return (
    <section className="py-20 bg-background text-center">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-black mb-4">
          {t("landing.cta_title_1", "Ready to")} <span className="text-[#F47C20]">UpTend</span> {t("landing.cta_title_2", "your home?")}
        </h2>
        <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
          {t("landing.cta_sub", "Whether you need a hand or you are one — there's a place for you here.")}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/book" asChild>
            <Button size="lg" className="bg-[#F47C20] hover:bg-[#e06910] text-white font-bold text-lg px-8 py-6 rounded-xl">
              {t("landing.book_a_service", "Book a Service")} <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link href="/become-pro" asChild>
            <Button size="lg" variant="outline" className="font-bold text-lg px-8 py-6 rounded-xl border-[#F47C20] text-[#F47C20] hover:bg-[#F47C20]/10">
              {t("landing.become_a_pro", "Become a Pro")} <ChevronRight className="ml-1 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
