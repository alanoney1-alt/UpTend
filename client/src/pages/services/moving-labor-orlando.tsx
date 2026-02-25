import { SeoServicePage } from "./seo-service-page";
import { Users } from "lucide-react";

const data = {
  slug: "moving-labor-orlando",
  h1: "Moving Labor in Orlando",
  metaTitle: "Moving Labor Orlando | Loading, Unloading & Heavy Lifting | UpTend",
  metaDescription: "Professional moving labor in Orlando, FL. Loading, unloading, furniture moving, and heavy lifting. Hourly rates, no truck needed. Book with UpTend.",
  heroTagline: "Strong, reliable moving help for your Orlando move. Loading, unloading, furniture rearrangement, and heavy lifting. by the hour, on your schedule.",
  heroGradient: "from-amber-600 to-orange-500",
  icon: Users,
  serviceDescription: [
    "UpTend's moving labor service provides the muscle you need without the full-service moving company price tag. Whether you're loading a rental truck, unloading a pod, rearranging furniture, or need help carrying heavy items up stairs, our Pros handle the physical work while you direct the process.",
    "This is labor-only service. perfect if you already have a truck, trailer, or moving container. Our Pros arrive with moving blankets, straps, and dollies, work carefully with your belongings, and hustle to get the job done efficiently. Available same-day for last-minute moves.",
  ],
  features: [
    "Truck & container loading/unloading",
    "Furniture moving & rearrangement",
    "Heavy item handling (appliances, safes, pianos)",
    "Apartment & condo moves (stairs included)",
    "Storage unit loading/unloading",
    "Moving blankets, straps & dollies provided",
    "Same-day availability for urgent moves",
    "Hourly billing with no hidden fees",
  ],
  pricing: {
    label: "Moving Labor",
    startingAt: "$65/hr per mover",
    details: "2-hour minimum. $65/hr per mover, 2-mover minimum. All equipment (blankets, dollies, straps) included. No truck. labor only.",
  },
  neighborhoods: [
    "Downtown Orlando", "Winter Park", "College Park", "Baldwin Park",
    "Dr. Phillips", "MetroWest", "Windermere", "Lake Nona",
    "UCF Area", "Waterford Lakes", "Avalon Park", "Horizon West",
    "Hunters Creek", "Thornton Park", "Conway", "Kissimmee",
  ],
  localContent: {
    areaName: "Orlando",
    areaDescription: "Orlando is one of the fastest-growing metros in the country, with thousands of people moving in, out, and across the city every month. Whether you're relocating from UCF to Downtown, downsizing in Winter Park, or moving into a new Lake Nona home, UpTend's moving labor Pros make the heavy lifting easy and affordable.",
    whyLocalsChoose: [
      "Affordable hourly rates. pay only for the help you need",
      "Same-day availability for last-minute moves",
      "All equipment (blankets, dollies, straps) included",
      "Background-checked Pros who handle belongings with care",
      "No truck markup. pure labor, pure value",
      "Experienced with Orlando apartments, condos, and homes",
    ],
  },
  faqs: [
    { q: "Do you provide a moving truck?", a: "No. this is a labor-only service. You provide the truck, trailer, pod, or container, and we provide the muscle. This saves you money vs. full-service movers." },
    { q: "How many movers do I need?", a: "For a studio or 1BR, 1-2 movers is usually sufficient. For 2-3BR homes, we recommend 2-3 movers. For large homes, 3-4 movers. We'll help you estimate when you book." },
    { q: "Can you move heavy items like pianos or safes?", a: "Yes! Our Pros are equipped to handle heavy and awkward items including pianos, gun safes, large appliances, and gym equipment. Just note these when booking so we assign the right crew." },
    { q: "What if my move takes longer than expected?", a: "No worries. we bill by the hour with no penalties for going over your estimate. You'll be charged only for actual time worked." },
  ],
  schemaService: {
    serviceType: "Moving Labor",
    description: "Professional moving labor services in Orlando, FL. Loading, unloading, furniture moving, and heavy lifting. Hourly rates with no hidden fees.",
    areaServed: "Orlando, FL",
  },
};

export default function MovingLaborOrlando() {
  return <SeoServicePage data={data} />;
}
