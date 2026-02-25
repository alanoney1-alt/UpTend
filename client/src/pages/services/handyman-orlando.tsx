import { SeoServicePage } from "./seo-service-page";
import { Wrench } from "lucide-react";

const data = {
  slug: "handyman-orlando",
  h1: "Handyman Services in Orlando",
  metaTitle: "Handyman Orlando | Repairs, Assembly & More | UpTend",
  metaDescription: "Reliable handyman services in Orlando, FL. TV mounting, furniture assembly, drywall repair, and more. Background-checked pros, same-day available. Book with UpTend.",
  heroTagline: "From small repairs to big improvements. Orlando's most trusted handyman service. Background-checked Pros, transparent pricing, same-day availability.",
  heroGradient: "from-orange-600 to-red-500",
  icon: Wrench,
  serviceDescription: [
    "UpTend's handyman service covers all the repairs, installations, and odd jobs that keep your Orlando home in top shape. TV mounting, furniture assembly, drywall patching, light fixture installation, door adjustments, shelving, and more. no job is too small.",
    "Every UpTend handyman Pro is background-checked, skills-verified, and trained through our Pro Academy. We bring professional tools, work efficiently, and clean up when we're done. With transparent hourly billing and before/after documentation, you always know what you're paying for.",
  ],
  features: [
    "TV mounting & picture hanging",
    "Furniture assembly (IKEA, Wayfair, etc.)",
    "Drywall patching & touch-up painting",
    "Light fixture & ceiling fan installation",
    "Door adjustments & lock changes",
    "Shelving & storage installation",
    "Minor plumbing & electrical repairs",
    "Same-day availability in Orlando Metro",
  ],
  pricing: {
    label: "Handyman Services",
    startingAt: "From $89/hr",
    details: "1-hour minimum, billed by the minute after. All tools and basic materials included. Specialty materials quoted separately.",
  },
  neighborhoods: [
    "Downtown Orlando", "College Park", "Winter Park", "Baldwin Park",
    "Thornton Park", "Dr. Phillips", "MetroWest", "Windermere",
    "Lake Nona", "Waterford Lakes", "Avalon Park", "Mills 50",
    "Audubon Park", "Horizon West", "UCF Area", "Hunters Creek",
  ],
  localContent: {
    areaName: "Orlando",
    areaDescription: "Orlando homeowners know that small repairs and improvements add up to big value. Whether you just moved into a new home and need everything assembled and mounted, or you're maintaining a property in College Park or Dr. Phillips, UpTend connects you with skilled handyman Pros who show up on time and get the job done right.",
    whyLocalsChoose: [
      "Same-day availability across the Orlando Metro",
      "Background-checked and skills-verified Pros",
      "Transparent hourly billing. no estimate games",
      "All tools and basic materials included",
      "$1M liability insurance on every job",
      "Highly rated by Orlando homeowners on the UpTend platform",
    ],
  },
  faqs: [
    { q: "What handyman tasks do you handle?", a: "Almost everything! TV mounting, furniture assembly, drywall repair, painting touch-ups, fixture installation, door/lock work, shelving, and general repairs. If you're not sure, describe your task when booking and we'll confirm." },
    { q: "Do I need to provide tools or materials?", a: "No. our Pros bring all necessary tools and basic materials (screws, anchors, drywall compound, etc.). For specialty items like specific light fixtures or hardware, we'll let you know in advance." },
    { q: "How is billing handled?", a: "We charge by the hour with a 1-hour minimum. After the first hour, billing is by the minute. You'll get an upfront estimate before work begins and a detailed receipt after." },
    { q: "Are your handymen licensed?", a: "All UpTend Pros are background-checked and skills-verified through our Pro Academy. For work requiring a specialty license (electrical, plumbing), we match you with appropriately licensed Pros." },
  ],
  schemaService: {
    serviceType: "Handyman Service",
    description: "Professional handyman services in Orlando, FL. Repairs, installations, assembly, and maintenance by background-checked, vetted professionals.",
    areaServed: "Orlando, FL",
  },
};

export default function HandymanOrlando() {
  return <SeoServicePage data={data} />;
}
