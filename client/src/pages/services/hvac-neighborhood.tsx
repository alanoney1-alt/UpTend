import { useSEO } from "@/hooks/use-seo";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { openGeorge } from "@/components/george-inline-tip";
import { ServiceRequestForm } from "@/components/service-request-form";
import { useParams, useLocation } from "wouter";
import { useEffect } from "react";
import {
  Phone, ShieldCheck, Clock, Star, CheckCircle,
  ArrowRight, Wrench, Wind, Snowflake, Flame, AlertTriangle,
  MessageSquare, Thermometer, DollarSign, Award,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Neighborhood config — add a new entry here to create a new page   */
/* ------------------------------------------------------------------ */

interface NeighborhoodConfig {
  name: string;
  slug: string;
  zip: string;
  intro: string;
  whyChoose: string;
  faqs: { q: string; a: string }[];
}

const NEIGHBORHOODS: NeighborhoodConfig[] = [
  {
    name: "Lake Nona",
    slug: "lake-nona",
    zip: "32827",
    intro:
      "Lake Nona is one of Orlando's fastest-growing master-planned communities, known for its innovative Medical City campus and resort-style homes. With Florida's intense heat and humidity, Lake Nona homeowners rely on dependable HVAC systems year-round to keep families comfortable.",
    whyChoose:
      "Lake Nona families trust UpTend because we pair you with vetted, local HVAC pros who know the newer construction systems in the area. Same-day availability, transparent pricing, and a satisfaction guarantee every time.",
    faqs: [
      { q: "How much does AC repair cost in Lake Nona?", a: "Most AC repairs in Lake Nona range from $150–$650 depending on the issue. Capacitor or contactor replacements are on the lower end, while compressor or refrigerant leak repairs run higher. We provide an upfront quote before any work begins." },
      { q: "How fast can an HVAC tech get to Lake Nona?", a: "We typically have a vetted technician at your Lake Nona home within 2–4 hours for standard calls and under 60 minutes for emergency service." },
      { q: "What HVAC brands do you service in Lake Nona?", a: "Our Lake Nona pros service all major brands including Trane, Carrier, Lennox, Rheem, Goodman, Daikin, and York. We also handle mini-split and ductless systems common in newer Lake Nona builds." },
      { q: "Do you offer emergency HVAC service in Lake Nona?", a: "Yes — we have 24/7 emergency HVAC service available for Lake Nona residents. Nights, weekends, and holidays included with no hidden after-hours surcharges." },
    ],
  },
  {
    name: "Windermere",
    slug: "windermere",
    zip: "34786",
    intro:
      "Windermere is an upscale lakeside town west of Orlando, home to sprawling estate properties and luxury communities like Isleworth and Keene's Pointe. Larger homes mean larger HVAC systems — and higher stakes when something goes wrong in the Florida heat.",
    whyChoose:
      "Windermere homeowners choose UpTend for our white-glove approach to HVAC service. Our pros are experienced with multi-zone systems, high-end equipment, and the specific demands of large luxury homes.",
    faqs: [
      { q: "How much does AC repair cost in Windermere?", a: "AC repair in Windermere typically ranges from $175–$750. Larger multi-zone systems common in Windermere estates may be on the higher end. You'll always get a transparent quote before we start." },
      { q: "How quickly can you reach a Windermere home?", a: "Standard service calls in Windermere are usually attended within 2–4 hours. Emergency calls are prioritized for under-60-minute response times." },
      { q: "What HVAC brands do you service in Windermere?", a: "We service all major brands — Trane, Carrier, Lennox, Rheem, Goodman, American Standard, and more. Our Windermere techs are also experienced with Mitsubishi and Daikin ductless systems." },
      { q: "Is 24/7 emergency HVAC available in Windermere?", a: "Absolutely. We provide round-the-clock emergency HVAC service for Windermere residents, including weekends and holidays. No hidden fees." },
    ],
  },
  {
    name: "Avalon Park",
    slug: "avalon-park",
    zip: "32828",
    intro:
      "Avalon Park is a vibrant, family-friendly community in East Orlando known for its walkable town center and strong neighborhood identity. The mix of townhomes, single-family homes, and newer builds means a variety of HVAC setups that all need expert care in Central Florida's climate.",
    whyChoose:
      "Avalon Park families choose UpTend because we make HVAC service simple — one call, one vetted pro, upfront pricing, and fast turnaround. We know the common systems installed across Avalon Park's different phases of construction.",
    faqs: [
      { q: "What does AC repair cost in Avalon Park?", a: "Most Avalon Park AC repairs fall between $150–$600. Common issues like thermostat replacement or fan motor repairs tend to be on the lower end. We quote every job upfront with no surprises." },
      { q: "How fast can a tech get to Avalon Park?", a: "Our average response time for Avalon Park is 2–3 hours for standard service. Emergency calls get prioritized with a target arrival under 60 minutes." },
      { q: "What brands do your Avalon Park technicians service?", a: "We handle all major HVAC brands: Carrier, Trane, Lennox, Rheem, Goodman, Payne, and more. Our techs are familiar with the systems commonly installed in Avalon Park homes." },
      { q: "Can I get emergency AC repair in Avalon Park at night?", a: "Yes. We offer 24/7 emergency HVAC service for Avalon Park residents — nights, weekends, and holidays. No after-hours surcharge." },
    ],
  },
  {
    name: "Dr. Phillips",
    slug: "dr-phillips",
    zip: "32819",
    intro:
      "Dr. Phillips is one of Orlando's most desirable neighborhoods, known for its proximity to Restaurant Row, top-rated schools, and well-established residential communities. Homeowners here expect reliable comfort systems and premium service when their AC needs attention.",
    whyChoose:
      "Dr. Phillips residents choose UpTend for dependable HVAC service without the runaround. We connect you with experienced local pros who understand the older and mid-age systems common in Dr. Phillips homes.",
    faqs: [
      { q: "How much does HVAC repair cost in Dr. Phillips?", a: "HVAC repairs in Dr. Phillips typically range from $150–$700. Older systems may need more extensive work, but we always quote upfront so there are no surprises." },
      { q: "How soon can a technician arrive in Dr. Phillips?", a: "We usually have a technician at your Dr. Phillips home within 2–4 hours. Emergency service is available with arrival times under 60 minutes." },
      { q: "What HVAC brands are serviced in Dr. Phillips?", a: "Our techs handle Trane, Carrier, Lennox, Rheem, Goodman, York, Amana, and all other major brands commonly found in Dr. Phillips homes." },
      { q: "Do you have 24/7 emergency HVAC service in Dr. Phillips?", a: "Yes — emergency HVAC service is available 24/7 for Dr. Phillips residents. Weekends and holidays included, no hidden fees." },
    ],
  },
  {
    name: "Winter Park",
    slug: "winter-park",
    zip: "32789",
    intro:
      "Winter Park is a charming, tree-lined city just north of Orlando known for its historic homes, Park Avenue shops, and world-class cultural attractions. With a mix of vintage bungalows and modern renovations, Winter Park homes present unique HVAC challenges that require experienced technicians.",
    whyChoose:
      "Winter Park homeowners trust UpTend because our pros know how to work with both classic older homes and modern retrofits. We provide upfront pricing, fast scheduling, and satisfaction-guaranteed service.",
    faqs: [
      { q: "What's the typical cost of AC repair in Winter Park?", a: "AC repair in Winter Park generally ranges from $150–$700. Older homes may have systems that need specialized parts, which can affect cost. We always provide an upfront estimate." },
      { q: "How fast is HVAC response time in Winter Park?", a: "Standard service appointments in Winter Park are typically within 2–4 hours. Emergency calls target arrival within 60 minutes." },
      { q: "What HVAC brands do Winter Park technicians service?", a: "We service all brands — Trane, Carrier, Lennox, Rheem, Goodman, York, and more. Our Winter Park techs are experienced with older Ruud and Payne systems too." },
      { q: "Is emergency HVAC available in Winter Park 24/7?", a: "Yes. Our 24/7 emergency service covers all of Winter Park. No after-hours upcharges — just fast, reliable help when you need it most." },
    ],
  },
  {
    name: "College Park",
    slug: "college-park",
    zip: "32804",
    intro:
      "College Park is one of Orlando's most beloved urban neighborhoods, known for its brick-lined Edgewater Drive, mature oak canopies, and eclectic mix of mid-century and craftsman-style homes. The area's older housing stock means HVAC systems that need knowledgeable technicians who understand retrofitting and efficiency upgrades.",
    whyChoose:
      "College Park homeowners pick UpTend because we match you with pros who know how to handle older ductwork, window units, and system upgrades without cutting corners. Transparent pricing and local expertise.",
    faqs: [
      { q: "How much does AC repair cost in College Park?", a: "Most AC repairs in College Park range from $150–$650. Older systems may require specialty parts that add cost, but we always quote before starting work." },
      { q: "How quickly can you send a tech to College Park?", a: "College Park service calls are typically attended within 1–3 hours given the central location. Emergency calls are prioritized for under-60-minute response." },
      { q: "What brands do you work on in College Park?", a: "All major HVAC brands — Trane, Carrier, Lennox, Rheem, Goodman, Ruud, American Standard, and specialty brands found in older College Park homes." },
      { q: "Do you offer 24/7 emergency HVAC in College Park?", a: "Yes. Emergency HVAC service is available around the clock for College Park residents. No hidden fees or after-hours surcharges." },
    ],
  },
  {
    name: "Baldwin Park",
    slug: "baldwin-park",
    zip: "32814",
    intro:
      "Baldwin Park is a meticulously planned community built on the former Orlando Naval Training Center, featuring parks, lakes, and a vibrant village center. With homes ranging from townhomes to custom estates, Baldwin Park residents expect quality and reliability in every home service.",
    whyChoose:
      "Baldwin Park homeowners choose UpTend for our reliability and professionalism. Our vetted HVAC pros are familiar with the 2000s-era systems common in Baldwin Park and provide fast, honest service every time.",
    faqs: [
      { q: "What does AC repair cost in Baldwin Park?", a: "AC repair in Baldwin Park typically ranges from $150–$625. Systems here are generally 10–20 years old, so common repairs include capacitor replacement and refrigerant recharges. Upfront pricing always." },
      { q: "How fast can a technician get to Baldwin Park?", a: "We typically arrive at Baldwin Park homes within 1–3 hours for standard calls. Emergency service targets under 60 minutes." },
      { q: "Which HVAC brands do you service in Baldwin Park?", a: "We handle Trane, Carrier, Lennox, Rheem, Goodman, and all other major brands. Our Baldwin Park techs are also experienced with Honeywell and Nest smart thermostat integration." },
      { q: "Is 24/7 emergency AC repair available in Baldwin Park?", a: "Yes — 24/7 emergency HVAC service for all Baldwin Park residents. No extra charges for nights, weekends, or holidays." },
    ],
  },
  {
    name: "Celebration",
    slug: "celebration",
    zip: "34747",
    intro:
      "Celebration is a distinctive master-planned community originally developed by The Walt Disney Company, featuring charming architecture, walkable streets, and resort-style amenities. Homes in Celebration have specific HVAC needs due to the community's unique building standards and Florida's year-round cooling demands.",
    whyChoose:
      "Celebration homeowners trust UpTend because we understand the community's high standards. Our pros are experienced with the HVAC systems and building codes specific to Celebration's construction.",
    faqs: [
      { q: "How much does HVAC repair cost in Celebration?", a: "HVAC repairs in Celebration typically range from $150–$700. Disney-era original systems may need more extensive work, while newer replacements tend to be more straightforward. Always quoted upfront." },
      { q: "How quickly can you reach Celebration?", a: "Standard service to Celebration homes is typically within 2–4 hours. Emergency calls are prioritized with arrival under 60 minutes." },
      { q: "What HVAC brands do you service in Celebration?", a: "We service Trane, Carrier, Lennox, Rheem, Goodman, York, and all other major brands. Many Celebration homes have Carrier or Trane systems from original construction." },
      { q: "Do you offer emergency HVAC service in Celebration?", a: "Yes — 24/7 emergency service for Celebration residents. We understand that being without AC in this community is not an option. No hidden after-hours fees." },
    ],
  },
  {
    name: "Hunter's Creek",
    slug: "hunters-creek",
    zip: "32837",
    intro:
      "Hunter's Creek is a large, established community in southwest Orange County known for its diverse neighborhoods, excellent schools, and family-oriented atmosphere. With thousands of homes built across several decades, Hunter's Creek has a wide variety of HVAC systems that need regular expert attention.",
    whyChoose:
      "Hunter's Creek families choose UpTend for our fast response times and honest pricing. Our techs know the range of systems across Hunter's Creek — from original 90s builds to recent renovations.",
    faqs: [
      { q: "What's the cost of AC repair in Hunter's Creek?", a: "AC repair in Hunter's Creek ranges from $150–$650. Older systems from the 1990s may require more specialized repairs. We always provide a clear upfront quote." },
      { q: "How fast can an HVAC tech reach Hunter's Creek?", a: "Standard response time for Hunter's Creek is 2–4 hours. Emergency service is available with a target arrival of under 60 minutes." },
      { q: "What HVAC brands are serviced in Hunter's Creek?", a: "We service all major brands — Carrier, Trane, Lennox, Rheem, Goodman, Ruud, and more. Our techs have extensive experience with the systems commonly found across Hunter's Creek subdivisions." },
      { q: "Is 24/7 emergency HVAC service available in Hunter's Creek?", a: "Absolutely. We provide 24/7 emergency HVAC service for all Hunter's Creek residents. No hidden surcharges for nights, weekends, or holidays." },
    ],
  },
  {
    name: "Horizon West",
    slug: "horizon-west",
    zip: "34787",
    intro:
      "Horizon West is one of the fastest-growing areas in Central Florida, featuring new master-planned communities like Hamlin, Lakeside, and Waterleigh. With modern construction and energy-efficient systems, Horizon West homeowners need HVAC professionals who understand the latest technology.",
    whyChoose:
      "Horizon West homeowners choose UpTend because our pros stay current with the latest HVAC technology found in newer builds — from variable-speed compressors to smart thermostat integration.",
    faqs: [
      { q: "How much does AC repair cost in Horizon West?", a: "AC repair in Horizon West typically costs $150–$600. Newer systems often have simpler repairs, but smart components and variable-speed units may be higher. Upfront pricing guaranteed." },
      { q: "How soon can a tech get to Horizon West?", a: "We typically reach Horizon West homes within 2–4 hours for standard calls. Emergency service prioritizes arrival under 60 minutes." },
      { q: "What HVAC brands are common in Horizon West?", a: "Horizon West homes typically have newer Carrier, Trane, Lennox, or Rheem systems. We service all major brands plus ductless mini-splits from Mitsubishi and Daikin." },
      { q: "Do you have emergency HVAC service in Horizon West?", a: "Yes — 24/7 emergency HVAC service for all Horizon West residents. No extra charges for evenings, weekends, or holidays." },
    ],
  },
  {
    name: "MetroWest",
    slug: "metrowest",
    zip: "32835",
    intro:
      "MetroWest is a well-established residential community in west Orlando, popular with families and professionals for its convenient location near major employers, Universal Studios, and I-4. The area's mix of condos, townhomes, and single-family homes means diverse HVAC needs.",
    whyChoose:
      "MetroWest residents trust UpTend for fast, no-nonsense HVAC service. We handle everything from condo unit systems to full residential setups — all with transparent pricing and vetted pros.",
    faqs: [
      { q: "What does AC repair cost in MetroWest?", a: "AC repairs in MetroWest typically range from $135–$600. Condo and townhome systems are often simpler, while larger single-family units may cost more. Always quoted upfront." },
      { q: "How fast can a technician arrive in MetroWest?", a: "MetroWest's central location means we often arrive within 1–3 hours for standard calls. Emergency service targets under 60 minutes." },
      { q: "What HVAC brands do you work on in MetroWest?", a: "All major brands — Carrier, Trane, Lennox, Rheem, Goodman, and more. We also service the packaged units and PTACs common in MetroWest condos." },
      { q: "Is 24/7 emergency HVAC available in MetroWest?", a: "Yes. Emergency HVAC service is available 24/7 for MetroWest residents. No hidden fees, no after-hours upcharges." },
    ],
  },
  {
    name: "Laureate Park",
    slug: "laureate-park",
    zip: "32827",
    intro:
      "Laureate Park is a newer, walkable village within the Lake Nona community, designed around parks, trails, and an active outdoor lifestyle. With modern, energy-efficient homes and smart-home features, Laureate Park residents need HVAC techs who are comfortable with current technology.",
    whyChoose:
      "Laureate Park homeowners choose UpTend because our pros are experienced with the newer, energy-efficient systems installed in the community. We provide fast scheduling, clear pricing, and guaranteed satisfaction.",
    faqs: [
      { q: "How much does AC repair cost in Laureate Park?", a: "AC repairs in Laureate Park typically cost $150–$575. Most homes have newer systems with straightforward repairs. Smart thermostat or zoning issues may vary. Upfront pricing always." },
      { q: "How quickly can you send a tech to Laureate Park?", a: "We typically reach Laureate Park homes within 2–3 hours for standard calls. Emergency service prioritizes arrival under 60 minutes." },
      { q: "What HVAC brands do Laureate Park technicians service?", a: "We service all brands found in Laureate Park: Carrier, Trane, Lennox, Rheem, Daikin, and more. Our techs are comfortable with Ecobee, Nest, and Honeywell smart integrations." },
      { q: "Do you offer 24/7 emergency AC repair in Laureate Park?", a: "Yes — 24/7 emergency HVAC service for Laureate Park residents. No surcharges for nights, weekends, or holidays." },
    ],
  },
];

// Lookup map for O(1) access by slug
const NEIGHBORHOOD_MAP = new Map<string, NeighborhoodConfig>(
  NEIGHBORHOODS.map((n) => [n.slug, n])
);

/** For external use — get valid slugs for route registration */
export function getHvacNeighborhoodSlugs(): string[] {
  return NEIGHBORHOODS.map((n) => n.slug);
}

/* ------------------------------------------------------------------ */
/*  Services list                                                     */
/* ------------------------------------------------------------------ */

const SERVICES = [
  { icon: Snowflake, title: "AC Repair", desc: "Fast diagnosis and repair of cooling issues, refrigerant leaks, and compressor failures." },
  { icon: Flame, title: "Heating Repair", desc: "Heat pump, furnace, and electric heating system diagnosis and repair." },
  { icon: Wind, title: "Duct Cleaning", desc: "Professional duct cleaning to improve air quality and system efficiency." },
  { icon: Wrench, title: "Preventive Maintenance", desc: "Seasonal tune-ups to extend system life and prevent costly breakdowns." },
  { icon: AlertTriangle, title: "Emergency Service", desc: "24/7 emergency HVAC repair — nights, weekends, and holidays." },
  { icon: Thermometer, title: "System Installation", desc: "Full HVAC system installation with properly sized equipment and warranty." },
];

/* ------------------------------------------------------------------ */
/*  Pricing reference                                                 */
/* ------------------------------------------------------------------ */

const PRICING = [
  { label: "Diagnostic Fee", range: "$49–$89", note: "Waived with repair" },
  { label: "AC Repair", range: "$150–$650", note: "Parts + labor" },
  { label: "Duct Cleaning", range: "$299–$499", note: "Per system" },
  { label: "Seasonal Tune-Up", range: "$79–$149", note: "Preventive" },
  { label: "Full System Install", range: "$4,500–$12,000", note: "Size dependent" },
  { label: "Emergency Call", range: "No surcharge", note: "24/7" },
];

/* ------------------------------------------------------------------ */
/*  JSON-LD helpers                                                   */
/* ------------------------------------------------------------------ */

function buildJsonLd(n: NeighborhoodConfig) {
  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "HVACBusiness",
    name: "UpTend HVAC Services",
    description: `Professional HVAC repair, maintenance, and installation in ${n.name}, Orlando FL ${n.zip}. 24/7 emergency service available.`,
    url: `https://uptendapp.com/services/hvac-${n.slug}`,
    telephone: "+18559012072",
    address: {
      "@type": "PostalAddress",
      addressLocality: n.name,
      addressRegion: "FL",
      postalCode: n.zip,
      addressCountry: "US",
    },
    areaServed: {
      "@type": "Place",
      name: `${n.name}, Orlando, FL`,
    },
    priceRange: "$49–$12,000",
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "00:00",
      closes: "23:59",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "127",
    },
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: n.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };

  return [localBusiness, faqPage];
}

/* ------------------------------------------------------------------ */
/*  Page component                                                    */
/* ------------------------------------------------------------------ */

export default function HVACNeighborhoodPage() {
  const params = useParams();
  const [location] = useLocation();

  // Support both /services/hvac/:neighborhood (dynamic) and /services/hvac-{slug} (static SEO routes)
  const paramSlug = (params as any).neighborhood as string | undefined;
  const pathSlug = location.startsWith("/services/hvac-")
    ? location.replace(/^\/services\/hvac-/, "").replace(/\/$/, "")
    : undefined;
  const slug = paramSlug ?? pathSlug;

  const config = slug ? NEIGHBORHOOD_MAP.get(slug) : undefined;

  // Inject JSON-LD
  useEffect(() => {
    if (!config) return;
    const schemas = buildJsonLd(config);
    const ids = schemas.map((schema, i) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = `hvac-neighborhood-jsonld-${i}`;
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
      return script.id;
    });
    return () => {
      ids.forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.remove();
      });
    };
  }, [config]);

  // SEO — must always call hooks unconditionally
  useSEO({
    title: config
      ? `HVAC Repair in ${config.name} | AC Service ${config.zip} | UpTend`
      : "HVAC Services | UpTend",
    description: config
      ? `Professional HVAC repair, AC service, and installation in ${config.name}, Orlando FL ${config.zip}. 24/7 emergency service, upfront pricing, vetted local technicians. Call (855) 901-2072.`
      : "Professional HVAC services in Orlando. Call UpTend today.",
    path: config ? `/services/hvac-${config.slug}` : "/services/hvac",
  });

  if (!config) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Neighborhood Not Found</h1>
            <p className="text-muted-foreground mb-6">We couldn't find HVAC services for that neighborhood.</p>
            <a href="/services/hvac">
              <Button>View All HVAC Services</Button>
            </a>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative py-20 px-6 bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 text-white overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <Badge className="bg-white/20 text-white border-0 text-sm mb-4">
            SERVING {config.name.toUpperCase()} • {config.zip}
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            HVAC Services in {config.name}, Orlando
          </h1>
          <p className="text-xl md:text-2xl opacity-90 mb-8 max-w-3xl mx-auto">
            {config.intro}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#request-service">
              <Button
                size="lg"
                className="bg-white text-orange-600 hover:bg-gray-100 text-lg px-8 py-6 rounded-full font-semibold"
              >
                Request Service <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
            <a href="tel:+18559012072">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 text-lg px-8 py-6 rounded-full font-semibold"
              >
                <Phone className="mr-2 h-5 w-5" /> (855) 901-2072
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 px-6 bg-background">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            HVAC Services We Offer in {config.name}
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            From emergency AC repair to full system installation — our vetted {config.name} technicians handle it all.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((s) => (
              <Card key={s.title} className="border hover:border-orange-500/50 transition-colors">
                <CardContent className="p-6">
                  <s.icon className="h-8 w-8 text-orange-500 mb-3" />
                  <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                  <p className="text-muted-foreground text-sm">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Reference */}
      <section className="py-16 px-6 bg-muted/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            <DollarSign className="inline h-8 w-8 text-orange-500 mr-2" />
            {config.name} HVAC Pricing Guide
          </h2>
          <p className="text-center text-muted-foreground mb-10">
            Transparent pricing — no surprises. Here's what {config.name} homeowners typically pay.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PRICING.map((p) => (
              <Card key={p.label}>
                <CardContent className="p-5">
                  <div className="text-sm font-medium text-muted-foreground mb-1">{p.label}</div>
                  <div className="text-2xl font-bold text-orange-500">{p.range}</div>
                  <div className="text-xs text-muted-foreground mt-1">{p.note}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose UpTend */}
      <section className="py-16 px-6 bg-background">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Why {config.name} Homeowners Choose UpTend
          </h2>
          <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
            {config.whyChoose}
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: ShieldCheck, title: "Vetted & Licensed Pros", desc: "Every technician is background-checked, licensed, and insured." },
              { icon: Clock, title: "Same-Day Service", desc: "Most calls answered within 2–4 hours. Emergency within 60 minutes." },
              { icon: Star, title: "Satisfaction Guaranteed", desc: "Not happy? We'll make it right or your money back." },
              { icon: CheckCircle, title: "Upfront Pricing", desc: "You approve the quote before any work begins. No hidden fees." },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <item.icon className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Request Service Form + George */}
      <section className="py-16 px-6 bg-muted/50" id="request-service">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Get HVAC Help in {config.name}</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Fill out the form and a technician will call you back. Or chat with George, our AI home expert, for instant guidance.
          </p>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
              <Card className="border-2 border-orange-500/30">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">1</div>
                    <div>
                      <h3 className="text-xl font-bold">Fill Out the Form</h3>
                      <p className="text-sm text-muted-foreground">Quickest way. A tech calls you back within the hour.</p>
                    </div>
                  </div>
                  <ServiceRequestForm partnerSlug="comfort-solutions-tech" serviceType="hvac" />
                </CardContent>
              </Card>
            </div>

            {/* George + Phone */}
            <div className="space-y-6">
              <Card className="border hover:border-orange-500/50 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-6 w-6 text-orange-500" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Chat with George</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Our AI home expert can answer questions and help schedule service instantly.
                  </p>
                  <Button
                    onClick={openGeorge}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" /> Talk to George
                  </Button>
                </CardContent>
              </Card>

              <Card className="border hover:border-orange-500/50 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                    <Phone className="h-6 w-6 text-orange-500" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Call Us Directly</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Speak to a real person right now. Available 24/7.
                  </p>
                  <a href="tel:+18559012072">
                    <Button variant="outline" className="w-full rounded-full">
                      <Phone className="mr-2 h-4 w-4" /> (855) 901-2072
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 px-6 bg-background">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">
            {config.name} HVAC — Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {config.faqs.map((faq, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-2">{faq.q}</h3>
                  <p className="text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-6 bg-gradient-to-r from-orange-600 to-amber-500 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <Award className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-3xl font-bold mb-4">
            Ready for Reliable HVAC Service in {config.name}?
          </h2>
          <p className="text-lg opacity-90 mb-8">
            One Price. One Pro. Done. Get matched with a vetted local technician today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#request-service">
              <Button
                size="lg"
                className="bg-white text-orange-600 hover:bg-gray-100 text-lg px-8 py-6 rounded-full font-semibold"
              >
                Request Service Now
              </Button>
            </a>
            <a href="tel:+18559012072">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 text-lg px-8 py-6 rounded-full font-semibold"
              >
                <Phone className="mr-2 h-5 w-5" /> (855) 901-2072
              </Button>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
