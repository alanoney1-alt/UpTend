import { SeoServicePage } from "./seo-service-page";
import { Droplets } from "lucide-react";

const data = {
  slug: "pressure-washing-orlando",
  h1: "Pressure Washing in Orlando",
  metaTitle: "Pressure Washing Orlando | Driveways, Homes & More | UpTend",
  metaDescription: "Professional pressure washing in Orlando, FL. Driveways, sidewalks, homes, and patios restored to like-new condition. Book online with UpTend.",
  heroTagline: "Restore your home's curb appeal with professional pressure washing. Driveways, walkways, patios, siding, and more. sparkling clean, guaranteed.",
  heroGradient: "from-blue-600 to-cyan-500",
  icon: Droplets,
  serviceDescription: [
    "Orlando's heat and humidity mean mold, mildew, algae, and dirt build up fast on your home's exterior surfaces. UpTend's professional pressure washing service removes years of buildup from driveways, sidewalks, pool decks, patios, home siding, fences, and more.",
    "Our Pros use commercial-grade equipment with adjustable pressure settings to safely clean every surface type. from delicate stucco and painted siding to tough concrete and pavers. We use eco-friendly cleaning solutions that are safe for your landscaping and pets.",
  ],
  features: [
    "Driveway & sidewalk cleaning",
    "Home exterior & siding washing",
    "Pool deck & patio restoration",
    "Fence & deck cleaning",
    "Roof soft washing available",
    "Eco-friendly cleaning solutions",
    "Commercial-grade equipment",
    "Before/after photo documentation",
  ],
  pricing: {
    label: "Pressure Washing",
    startingAt: "From $149",
    details: "Driveway from $149, full home exterior from $299, pool deck from $129. Bundle discounts available for multiple surfaces.",
  },
  neighborhoods: [
    "Downtown Orlando", "College Park", "Thornton Park", "Winter Park",
    "Baldwin Park", "Mills 50", "Audubon Park", "Ivanhoe Village",
    "Dr. Phillips", "Windermere", "Horizon West", "Lake Nona",
    "Waterford Lakes", "Avalon Park", "UCF Area", "MetroWest",
  ],
  localContent: {
    areaName: "Orlando",
    areaDescription: "Orlando's subtropical climate creates the perfect conditions for mold, algae, and mildew growth on exterior surfaces. Regular pressure washing not only keeps your home looking great but protects surfaces from long-term damage. Orlando homeowners trust UpTend for reliable, professional pressure washing that delivers visible results every time.",
    whyLocalsChoose: [
      "Orlando's #1-rated pressure washing on the UpTend platform",
      "Commercial-grade equipment safe for Florida stucco homes",
      "Eco-friendly solutions safe for lawns and pets",
      "Flexible scheduling including weekends",
      "HOA-compliant service with before/after photos",
      "Satisfaction guaranteed or we re-clean free",
    ],
  },
  faqs: [
    { q: "How often should I pressure wash my Orlando home?", a: "In Orlando's climate, we recommend pressure washing your home exterior 1-2 times per year and driveways every 6-12 months to prevent permanent staining from mold and algae." },
    { q: "Is pressure washing safe for my stucco home?", a: "Yes! Our Pros use adjustable pressure settings and soft washing techniques specifically designed for Florida stucco, painted surfaces, and delicate materials." },
    { q: "Do you use chemicals?", a: "We use eco-friendly, biodegradable cleaning solutions that are safe for your landscaping, pets, and the environment. For tough stains, we use targeted treatments that break down mold and algae safely." },
    { q: "How long does it take?", a: "A standard driveway takes 30-60 minutes. A full home exterior typically takes 2-4 hours depending on size. We'll provide a time estimate when you book." },
  ],
  schemaService: {
    serviceType: "Pressure Washing",
    description: "Professional pressure washing services in Orlando, FL. Driveways, home exteriors, patios, and more. Eco-friendly solutions and commercial equipment.",
    areaServed: "Orlando, FL",
  },
};

export default function PressureWashingOrlando() {
  return <SeoServicePage data={data} />;
}
