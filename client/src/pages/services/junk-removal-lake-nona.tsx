import { SeoServicePage } from "./seo-service-page";
import { Warehouse } from "lucide-react";

const data = {
  slug: "junk-removal-lake-nona",
  h1: "Junk Removal in Lake Nona",
  metaTitle: "Junk Removal Lake Nona | Same-Day Pickup | UpTend",
  metaDescription: "Professional junk removal in Lake Nona, FL. Same-day service, eco-friendly disposal, and transparent pricing. Book online with UpTend today.",
  heroTagline: "Fast, eco-friendly junk removal for Lake Nona homes and businesses. We haul it all. furniture, appliances, yard debris, and more.",
  heroGradient: "from-emerald-600 to-teal-500",
  icon: Warehouse,
  serviceDescription: [
    "UpTend provides full-service junk removal throughout Lake Nona and surrounding communities. Whether you're decluttering your home, clearing out a garage, or handling post-renovation debris, our background-checked Pros arrive on time and handle everything from loading to responsible disposal.",
    "We prioritize recycling and donation over landfill. Every load is sorted and diverted to local recycling centers and donation partners whenever possible. so your junk gets a second life and you get peace of mind.",
  ],
  features: [
    "Same-day & next-day pickup available",
    "Furniture, appliance & electronics removal",
    "Yard waste & construction debris",
    "Garage, attic & storage cleanouts",
    "Eco-friendly disposal with recycling",
    "Before/after photo documentation",
    "$1M liability insurance on every job",
    "Transparent upfront pricing. no surprises",
  ],
  pricing: {
    label: "Junk Removal",
    startingAt: "From $99",
    details: "Priced by volume. Single items from $99, half truck from $249, full truck from $399. Free on-site estimates available.",
  },
  neighborhoods: [
    "Lake Nona Town Center", "Laureate Park", "North Lake Nona", "Moss Park",
    "Narcoossee", "Boggy Creek", "Medical City", "Lake Nona Golf & Country Club",
    "Randal Park", "Storey Park", "Eagle Creek", "Vista Lakes",
  ],
  localContent: {
    areaName: "Lake Nona",
    areaDescription: "Lake Nona is one of Central Florida's fastest-growing planned communities, known for its innovative Medical City, top-rated schools, and active lifestyle. Homeowners here take pride in their properties. and when it's time for a cleanout, they choose UpTend for fast, reliable, and environmentally responsible junk removal.",
    whyLocalsChoose: [
      "Same-day service for Lake Nona's busy families",
      "Eco-friendly disposal. 70%+ of items recycled or donated",
      "Background-checked, academy-trained Pros",
      "Transparent pricing with no hidden fees",
      "HOA-compliant cleanup and debris removal",
      "Trusted by Lake Nona homeowners and property managers",
    ],
  },
  faqs: [
    { q: "How fast can you pick up junk in Lake Nona?", a: "We offer same-day junk removal in Lake Nona for most requests booked before 2 PM. Next-day service is always available." },
    { q: "What items do you accept?", a: "We take almost everything. furniture, appliances, electronics, yard waste, construction debris, and more. Hazardous materials (paint, chemicals) require special handling." },
    { q: "Do you recycle?", a: "Yes! We sort every load and divert 70%+ to recycling centers and local donation partners. We'll provide an impact receipt showing exactly where your items went." },
    { q: "How is pricing determined?", a: "Pricing is based on volume (how much space your items take in our truck). We provide upfront quotes before any work begins. no surprises." },
  ],
  schemaService: {
    serviceType: "Junk Removal",
    description: "Professional junk removal and hauling services in Lake Nona, FL. Same-day pickup, eco-friendly disposal, and transparent pricing.",
    areaServed: "Lake Nona, Orlando, FL",
  },
};

export default function JunkRemovalLakeNona() {
  return <SeoServicePage data={data} />;
}
