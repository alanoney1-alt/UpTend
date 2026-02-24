import { SeoServicePage } from "./seo-service-page";
import { CloudRain } from "lucide-react";

const data = {
  slug: "gutter-cleaning-orlando",
  h1: "Gutter Cleaning in Orlando",
  metaTitle: "Gutter Cleaning Orlando | Professional & Affordable | UpTend",
  metaDescription: "Professional gutter cleaning in Orlando, FL. Prevent water damage with regular gutter maintenance. Same-day available. Book with UpTend today.",
  heroTagline: "Protect your Orlando home from water damage with professional gutter cleaning. Debris removal, downspout flushing, and full inspection included.",
  heroGradient: "from-slate-600 to-zinc-500",
  icon: CloudRain,
  serviceDescription: [
    "Orlando's heavy rainstorms and tree canopy mean clogged gutters are a constant threat to your home. UpTend's gutter cleaning service includes complete debris removal from all gutters and downspouts, full system flushing, and a visual inspection for damage, leaks, or sagging sections.",
    "Our Pros work safely with proper equipment and leave your property spotless. We bag and remove all debris, check that water flows properly through every downspout, and alert you to any issues that need repair — before they become costly problems.",
  ],
  features: [
    "Complete gutter debris removal",
    "Downspout flushing & unclogging",
    "Visual gutter system inspection",
    "Leak & damage identification",
    "Roof edge debris clearance",
    "All debris bagged and removed",
    "Before/after photo documentation",
    "Gutter guard recommendations if needed",
  ],
  pricing: {
    label: "Gutter Cleaning",
    startingAt: "From $129",
    details: "Single-story homes from $129, two-story from $199. Pricing based on linear footage. Gutter guard installation quoted separately.",
  },
  neighborhoods: [
    "College Park", "Winter Park", "Baldwin Park", "Downtown Orlando",
    "Thornton Park", "Dr. Phillips", "Windermere", "Audubon Park",
    "MetroWest", "Lake Nona", "Waterford Lakes", "Avalon Park",
    "Horizon West", "Hunters Creek", "Conway", "Delaney Park",
  ],
  localContent: {
    areaName: "Orlando",
    areaDescription: "Orlando averages over 50 inches of rain per year, and the city's mature oak canopy drops leaves, acorns, and Spanish moss into gutters year-round. Clogged gutters lead to fascia rot, foundation damage, and even interior water intrusion. Orlando homeowners trust UpTend for regular gutter maintenance that prevents expensive repairs.",
    whyLocalsChoose: [
      "Essential protection in Orlando's heavy rain season",
      "Full inspection catches problems before they're costly",
      "Affordable flat-rate pricing by home size",
      "Same-day and weekend availability",
      "Safe, insured Pros with proper equipment",
      "Recurring plans for year-round protection",
    ],
  },
  faqs: [
    { q: "How often should I clean gutters in Orlando?", a: "We recommend at least twice per year — once in late spring before hurricane season and once in late fall after oak leaves drop. Homes under heavy tree canopy may need quarterly cleaning." },
    { q: "Do you repair gutters too?", a: "Our gutter cleaning service includes a visual inspection, and we'll flag any issues like leaks, sagging, or damage. For repairs, we can schedule a follow-up visit with a qualified Pro." },
    { q: "Is it safe for my roof?", a: "Yes — our Pros use proper equipment and techniques that won't damage your roof or shingles. We stay off fragile roof areas and use gutter-safe tools." },
    { q: "What happens if it rains on my scheduled day?", a: "We'll reschedule at no charge. Gutter cleaning requires dry conditions for safety and best results." },
  ],
  schemaService: {
    serviceType: "Gutter Cleaning",
    description: "Professional gutter cleaning and maintenance in Orlando, FL. Debris removal, downspout flushing, and system inspection to prevent water damage.",
    areaServed: "Orlando, FL",
  },
};

export default function GutterCleaningOrlando() {
  return <SeoServicePage data={data} />;
}
