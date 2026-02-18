import { SeoServicePage } from "./seo-service-page";
import { Waves } from "lucide-react";

const data = {
  slug: "pool-cleaning-lake-nona",
  h1: "Pool Cleaning in Lake Nona",
  metaTitle: "Pool Cleaning Lake Nona | Weekly Service & Maintenance | UpTend",
  metaDescription: "Professional pool cleaning in Lake Nona, FL. Weekly maintenance, chemical balancing, and equipment checks. Crystal clear pools guaranteed. Book with UpTend.",
  heroTagline: "Crystal clear pools for Lake Nona families. Weekly cleaning, chemical balancing, and equipment monitoring — all from trusted, vetted Pros.",
  heroGradient: "from-sky-600 to-blue-500",
  icon: Waves,
  serviceDescription: [
    "Lake Nona's warm climate means your pool needs consistent, professional maintenance year-round. UpTend's pool cleaning service includes skimming, vacuuming, brushing walls and tile, chemical testing and balancing, filter cleaning, and a full equipment check — every single visit.",
    "Our pool Pros are trained in Florida pool chemistry and equipment. They'll keep your water balanced, your surfaces clean, and your pump and filter running efficiently. You get a detailed service report after each visit, so you always know exactly what was done.",
  ],
  features: [
    "Surface skimming & debris removal",
    "Pool vacuuming & wall brushing",
    "Chemical testing & balancing",
    "Filter cleaning & basket emptying",
    "Pump & equipment inspection",
    "Tile line cleaning",
    "Detailed service reports each visit",
    "Weekly & bi-weekly plans available",
  ],
  pricing: {
    label: "Pool Cleaning",
    startingAt: "From $99/month",
    details: "Weekly service from $99/month. Bi-weekly from $69/month. One-time deep cleans from $149. Chemical costs included in recurring plans.",
  },
  neighborhoods: [
    "Laureate Park", "Lake Nona Town Center", "North Lake Nona", "Randal Park",
    "Storey Park", "Eagle Creek", "Moss Park", "Narcoossee",
    "Lake Nona Golf & Country Club", "Medical City", "Vista Lakes", "Boggy Creek",
  ],
  localContent: {
    areaName: "Lake Nona",
    areaDescription: "Most Lake Nona homes feature pools as a centerpiece of outdoor living. With Florida's year-round swim season, consistent pool maintenance isn't optional — it's essential. Lake Nona homeowners choose UpTend for reliable weekly service that keeps their pools swim-ready without the hassle of DIY chemical management.",
    whyLocalsChoose: [
      "Consistent weekly crews who know your pool",
      "Florida-specific pool chemistry expertise",
      "All chemicals included in recurring plans",
      "Equipment monitoring catches problems early",
      "Flexible scheduling around your family's routine",
      "Detailed service reports after every visit",
    ],
  },
  faqs: [
    { q: "How often should I have my pool cleaned in Lake Nona?", a: "We recommend weekly service for Lake Nona pools. Florida's heat, humidity, and rain create rapid algae and bacteria growth. Weekly maintenance keeps water safe and surfaces clean." },
    { q: "Are chemicals included?", a: "Yes — all necessary chemicals (chlorine, acid, stabilizer, etc.) are included in our recurring maintenance plans at no extra cost." },
    { q: "Can you handle pool equipment repairs?", a: "Our service includes equipment inspection and monitoring. If we identify an issue with your pump, filter, or heater, we'll provide a repair quote and can schedule the work separately." },
    { q: "What if I have a salt water pool?", a: "Absolutely! Our Pros are trained on both chlorine and salt water systems. We'll calibrate our service to your specific pool type and equipment." },
  ],
  schemaService: {
    serviceType: "Pool Cleaning",
    description: "Professional pool cleaning and maintenance in Lake Nona, FL. Weekly service, chemical balancing, equipment checks, and detailed reporting.",
    areaServed: "Lake Nona, Orlando, FL",
  },
};

export default function PoolCleaningLakeNona() {
  return <SeoServicePage data={data} />;
}
