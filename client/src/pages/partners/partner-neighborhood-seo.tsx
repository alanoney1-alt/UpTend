/**
 * Partner Neighborhood SEO Page
 * /partners/:slug/:neighborhood
 *
 * Localized HVAC SEO page for Comfort Solutions Tech service areas:
 * Lake Nona, Windermere, Winter Park, Dr. Phillips
 *
 * Features:
 * - AI-generated localized content from partner-seo-generator.ts
 * - Dark theme compatible
 * - George chat embedded
 * - Photo quote CTA to /partners/:slug/quote
 * - Partner branding from PARTNER_CONFIGS
 */

import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UpTendGuide } from "@/components/ai/uptend-guide";
import {
  Phone, MapPin, Star, CheckCircle, Camera, Thermometer,
  Wrench, Shield, Clock, ArrowRight, ChevronDown, ChevronUp,
} from "lucide-react";
import { useState } from "react";

// ─── Partner Configs ──────────────────────────────────────────────────────────
const PARTNER_CONFIGS: Record<string, {
  companyName: string;
  phone: string;
  serviceType: string;
  tagline: string;
  services: string[];
  accentColor: string;
}> = {
  "comfort-solutions-tech": {
    companyName: "Comfort Solutions Tech LLC",
    phone: "(855) 901-2072",
    serviceType: "HVAC",
    tagline: "Your Comfort, Our Mission",
    accentColor: "#2563EB",
    services: [
      "AC Repair & Diagnostics",
      "HVAC Installation",
      "Duct Cleaning & Sealing",
      "Thermostat Installation",
      "Preventive Maintenance",
      "Emergency AC Service",
      "Air Quality Assessment",
      "Heat Pump Service",
    ],
  },
  "demo-hvac": {
    companyName: "Orlando Air Pro",
    phone: "(407) 555-0199",
    serviceType: "HVAC",
    tagline: "Orlando's Trusted HVAC Experts",
    accentColor: "#2563EB",
    services: ["AC Repair", "HVAC Installation", "Maintenance", "Emergency Service"],
  },
};

const DEFAULT_CONFIG = PARTNER_CONFIGS["comfort-solutions-tech"];

// ─── Neighborhood neighborhood fallback content ─────────────────────────────
const NEIGHBORHOOD_DEFAULTS: Record<string, {
  hero_headline: string;
  body_content: string;
  faqs: Array<{ question: string; answer: string }>;
}> = {
  "lake-nona": {
    hero_headline: "Lake Nona's Trusted HVAC Service",
    body_content: `Lake Nona's rapid growth and Florida's brutal summers make reliable HVAC service essential. Comfort Solutions Tech LLC serves Lake Nona homeowners with fast, honest AC repair, installation, and maintenance — no runaround, no surprise charges.\n\nWhether you're in a brand-new Medical City construction or an established Lake Nona Golf & Country Club home, our licensed technicians know the equipment that runs in this area. Central Florida heat is no joke — we respond fast and fix it right the first time.\n\nFrom routine tune-ups to emergency same-day repairs, Lake Nona residents trust Comfort Solutions Tech because we show up when we say we will, explain what we find, and price it fairly.`,
    faqs: [
      { question: "Do you service all of Lake Nona?", answer: "Yes — we cover all Lake Nona neighborhoods including Medical City, Eagle Creek, Laureate Park, and surrounding areas." },
      { question: "How fast can you respond to an emergency?", answer: "We offer same-day emergency service. Call (855) 901-2072 and we'll dispatch a tech ASAP." },
      { question: "Do you work on new construction HVAC?", answer: "Absolutely. Lake Nona is growing fast — we work with new Carrier, Trane, and Lennox systems common in new builds." },
      { question: "What's included in a maintenance tune-up?", answer: "Filter inspection, coil cleaning, refrigerant check, electrical connections, thermostat calibration, and a written report of findings." },
    ],
  },
  "windermere": {
    hero_headline: "Windermere's Premier HVAC Experts",
    body_content: `Windermere's larger homes and estate properties demand HVAC systems that perform reliably through Florida's long summers. Comfort Solutions Tech LLC provides Windermere homeowners with expert HVAC service — from multi-zone system installs to emergency repairs.\n\nWindermere homes often run dual-zone or multi-zone systems. Our technicians are certified on Carrier, Trane, Lennox, and all major brands. We treat your home with the respect it deserves — clean up after ourselves, and only recommend what you actually need.\n\nFull diagnostic, honest pricing, and a written estimate before any work starts. That's how we operate in Windermere.`,
    faqs: [
      { question: "Do you service large Windermere estate homes?", answer: "Yes — we specialize in multi-zone and high-capacity systems common in Windermere's larger properties." },
      { question: "Can you handle Carrier and Trane systems?", answer: "Yes, we're certified on all major HVAC brands including Carrier, Trane, Lennox, Rheem, and Goodman." },
      { question: "Do you offer maintenance contracts?", answer: "Yes — annual maintenance plans starting at $199/year cover two tune-ups and priority service." },
      { question: "How soon can I get an estimate?", answer: "Same-day photo estimates via our online tool, or schedule an in-home visit within 24 hours." },
    ],
  },
  "winter-park": {
    hero_headline: "Winter Park HVAC Service Done Right",
    body_content: `Winter Park's mix of historic homes and modern builds means HVAC needs vary widely. Comfort Solutions Tech LLC handles everything from updating old ductwork in a 1950s bungalow to servicing a new high-efficiency heat pump in a Park Avenue condo.\n\nOur Winter Park technicians understand that residents here value quality, transparency, and professionalism. We arrive on time, explain the issue in plain English, and don't start work until you've approved the price.\n\nFrom Hannibal Square to College Quarter, we're the HVAC company Winter Park homeowners call first — and call back.`,
    faqs: [
      { question: "Do you work on older homes with older ductwork?", answer: "Yes — we regularly service older Winter Park homes with original duct systems and can upgrade or repair as needed." },
      { question: "What's the best AC brand for the Orlando area?", answer: "Trane and Carrier are popular for their durability in Florida heat. We install and service both, plus Lennox, Rheem, and others." },
      { question: "Do you offer financing on new installs?", answer: "Yes — we offer flexible financing options on qualifying new system installs. Ask about our 0% APR plans." },
      { question: "Are your technicians licensed in Florida?", answer: "Yes — all technicians are Florida-licensed HVAC contractors and carry full liability insurance." },
    ],
  },
  "dr-phillips": {
    hero_headline: "Dr. Phillips HVAC — Fast, Honest Service",
    body_content: `Dr. Phillips is one of Central Florida's most desirable communities — and keeping that home comfortable year-round requires an HVAC company you can rely on. Comfort Solutions Tech LLC has been servicing Dr. Phillips homes with quality AC repair, installation, and maintenance.\n\nThe Restaurant Row and Bay Hill neighborhoods have a mix of high-end newer construction and established homes running a variety of HVAC systems. We service them all — from a simple capacitor swap to a full system replacement.\n\nNeed it done right and done fast? That's exactly what Dr. Phillips residents get with Comfort Solutions Tech.`,
    faqs: [
      { question: "Do you cover all of Dr. Phillips, including Bay Hill?", answer: "Yes — we serve all of Dr. Phillips including Bay Hill, Sand Lake, and neighboring communities." },
      { question: "What causes AC to stop cooling in summer?", answer: "Common causes in Florida include low refrigerant, dirty coils, failed capacitors, and clogged drain lines. We diagnose on-site." },
      { question: "How long does a typical AC repair take?", answer: "Most standard repairs are completed in 1–2 hours. Same-day service is usually available." },
      { question: "Do you offer a warranty on repairs?", answer: "Yes — all parts and labor come with a 90-day warranty. New system installations carry manufacturer warranties of 5–10 years." },
    ],
  },
};

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="font-medium text-sm pr-4">{question}</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-muted-foreground border-t border-border pt-3">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function PartnerNeighborhoodSEO() {
  const { slug, neighborhood } = useParams<{ slug: string; neighborhood: string }>();
  const config = PARTNER_CONFIGS[slug ?? ""] ?? DEFAULT_CONFIG;

  // Try to fetch AI-generated content from the DB
  const { data, isLoading } = useQuery({
    queryKey: ["partner-seo-page", slug, neighborhood],
    queryFn: async () => {
      const res = await fetch(`/api/partners/${slug}/seo-pages/${neighborhood}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.success ? json.page : null;
    },
    enabled: !!slug && !!neighborhood,
    retry: false,
  });

  // Derive neighborhood display name
  const neighborhoodName = data?.neighborhood_name
    || neighborhood?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    || "";

  // Prefer DB content, fall back to local defaults
  const defaultContent = NEIGHBORHOOD_DEFAULTS[neighborhood ?? ""] ?? {
    hero_headline: `${config.serviceType} Service in ${neighborhoodName}`,
    body_content: `${config.companyName} provides professional ${config.serviceType} service in ${neighborhoodName}. Our licensed technicians deliver fast, honest repairs and installations. Call us today.`,
    faqs: [
      { question: `Do you service ${neighborhoodName}?`, answer: `Yes — we serve ${neighborhoodName} and surrounding areas.` },
      { question: "Are you licensed and insured?", answer: "Yes — fully licensed Florida HVAC contractors with liability insurance." },
    ],
  };

  const pageTitle = data?.title || `${config.serviceType} Service in ${neighborhoodName} | ${config.companyName}`;
  const heroHeadline = data?.hero_headline || defaultContent.hero_headline;
  const bodyContent = data?.body_content || defaultContent.body_content;
  const faqs: Array<{ question: string; answer: string }> =
    data?.faqs
      ? (typeof data.faqs === "string" ? JSON.parse(data.faqs) : data.faqs)
      : defaultContent.faqs;
  const servicesHighlighted: string[] = data?.services_highlighted || config.services.slice(0, 4);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <>
      {/* SEO meta */}
      <title>{pageTitle}</title>
      {data?.meta_description && <meta name="description" content={data.meta_description} />}

      <div className="min-h-screen bg-background">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 h-14 flex items-center justify-between max-w-6xl">
            <Link href={`/partners/${slug}`} className="font-bold text-sm hover:text-primary transition-colors">
              {config.companyName}
            </Link>
            <a
              href={`tel:${config.phone.replace(/\D/g, "")}`}
              className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <Phone className="w-4 h-4" />
              {config.phone}
            </a>
          </div>
        </header>

        {/* ── Hero ────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-primary/90 to-primary text-primary-foreground">
          <div className="container mx-auto px-4 py-16 max-w-6xl">
            <div className="max-w-3xl">
              <Badge className="mb-4 bg-white/20 text-white border-white/30 hover:bg-white/30">
                <MapPin className="w-3 h-3 mr-1" />
                {neighborhoodName}, FL
              </Badge>
              <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
                {heroHeadline}
              </h1>
              <p className="text-lg text-primary-foreground/80 mb-8">
                Licensed · Insured · Same-Day Available
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 font-semibold"
                  asChild
                >
                  <a href={`tel:${config.phone.replace(/\D/g, "")}`}>
                    <Phone className="w-4 h-4 mr-2" />
                    Call {config.phone}
                  </a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                  asChild
                >
                  <Link href={`/partners/${slug}/quote`}>
                    <Camera className="w-4 h-4 mr-2" />
                    Free Photo Quote
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Trust Bar ────────────────────────────────────────────────── */}
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4 max-w-6xl">
            <div className="flex flex-wrap items-center justify-center sm:justify-between gap-4">
              <div className="flex items-center gap-1.5 text-sm">
                <Shield className="w-4 h-4 text-primary" />
                <span className="font-medium">Licensed &amp; Insured</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Clock className="w-4 h-4 text-primary" />
                <span className="font-medium">Same-Day Service</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <div className="flex">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
                </div>
                <span className="font-medium">5-Star Rated</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span className="font-medium">Upfront Pricing</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main Content ─────────────────────────────────────────────── */}
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left — Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Body */}
              <Card>
                <CardHeader>
                  <CardTitle>Professional {config.serviceType} in {neighborhoodName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {bodyContent.split("\n").filter(Boolean).map((p: string, i: number) => (
                    <p key={i} className="text-muted-foreground leading-relaxed">{p}</p>
                  ))}
                </CardContent>
              </Card>

              {/* Services */}
              <Card>
                <CardHeader>
                  <CardTitle>Services in {neighborhoodName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(servicesHighlighted.length > 0 ? servicesHighlighted : config.services).map((service, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                        <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <Wrench className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="text-sm font-medium">{service}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Photo Quote CTA */}
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Camera className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold mb-1">Skip the Wait — Get a Quote via Photo</h3>
                      <p className="text-sm text-muted-foreground">
                        Send 1–3 photos of your HVAC unit. Our AI analyzes them and {config.companyName} calls you back with a real quote.
                      </p>
                    </div>
                    <Button asChild className="flex-shrink-0">
                      <Link href={`/partners/${slug}/quote`}>
                        Try Photo Quote <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* FAQs */}
              {faqs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>FAQ — {neighborhoodName} HVAC Service</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {faqs.map((faq, i) => (
                      <FaqItem key={i} question={faq.question} answer={faq.answer} />
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right — Sidebar */}
            <div className="space-y-5">
              {/* Contact Card */}
              <Card className="sticky top-20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-center">Get Service Today</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" size="lg" asChild>
                    <a href={`tel:${config.phone.replace(/\D/g, "")}`}>
                      <Phone className="w-4 h-4 mr-2" />
                      {config.phone}
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/partners/${slug}/quote`}>
                      <Camera className="w-4 h-4 mr-2" />
                      Free Photo Quote
                    </Link>
                  </Button>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>Serving {neighborhoodName} &amp; surrounding areas</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>Mon–Sat 7am–8pm · Emergency 24/7</span>
                    </div>
                  </div>
                  <Separator />
                  <Badge variant="secondary" className="w-full justify-center bg-green-500/10 text-green-600 border-green-200/30 py-1.5">
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Licensed &amp; Insured
                  </Badge>
                </CardContent>
              </Card>

              {/* Why Choose Us */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Why {config.companyName}?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { icon: CheckCircle, text: `Local ${neighborhoodName} experts` },
                    { icon: Thermometer, text: "Fast same-day response" },
                    { icon: Shield, text: "100% satisfaction guarantee" },
                    { icon: CheckCircle, text: "Upfront, honest pricing" },
                    { icon: Wrench, text: "All major brands serviced" },
                  ].map(({ icon: Icon, text }, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm">
                      <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{text}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Other Service Areas */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Other Service Areas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {["lake-nona", "windermere", "winter-park", "dr-phillips"]
                    .filter((n) => n !== neighborhood)
                    .map((n) => (
                      <Link
                        key={n}
                        href={`/partners/${slug}/${n}`}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                      >
                        <ArrowRight className="w-3.5 h-3.5 text-primary group-hover:translate-x-0.5 transition-transform" />
                        {n.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </Link>
                    ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* ── George Chat ──────────────────────────────────────────────── */}
        <UpTendGuide />
      </div>
    </>
  );
}
