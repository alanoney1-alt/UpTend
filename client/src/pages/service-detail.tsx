import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import {
  CheckCircle, ArrowRight, ShieldCheck, MapPin, Recycle,
  Droplets, Home, Users, Hammer, Sofa, Wrench, Waves,
  Sparkles, Truck,
} from "lucide-react";
import NotFound from "@/pages/not-found";
import { GuaranteeBadge } from "@/components/guarantee-badge";

interface ServiceData {
  name: string;
  serviceType: string;
  tagline: string;
  description: string;
  price: string;
  icon: React.ElementType;
  heroGradient: string;
  features: string[];
  whyUpTend: string[];
  esgImpact?: string;
  bookLink?: string;
}

const serviceData: Record<string, ServiceData> = {
  "junk-removal": {
    name: "Junk Removal",
    serviceType: "junk_removal",
    tagline: "Space Rejuvenation. Verified Material Recovery.",
    description:
      "Your unwanted items are resources. We recover your space, protect your property with 360° Home Scan, and verify the environmental impact of every item through our circular economy system. Every pickup includes a verified Impact Report showing exactly where your items went — donated, recycled, or responsibly disposed.",
    price: "From $99",
    icon: Recycle,
    heroGradient: "from-green-600 to-emerald-500",
    features: [
      "360° Home Scan before work begins",
      "Verified Impact Report for every job",
      "Circular economy sorting — donate, recycle, dispose",
      "ESG compliance documentation for property managers",
      "Same-day and next-day availability",
      "Transparent volume-based pricing, no hidden fees",
      "$1M liability coverage on every job",
      "Full debris haul-away included",
    ],
    whyUpTend: [
      "Average 600 lbs CO2 saved per job through recycling & donation",
      "Every item tracked with full chain-of-custody accountability",
      "Background-checked, academy-trained Pros",
      "Before/after photo and video proof",
    ],
    esgImpact: "Avg 600 lbs CO2 saved per job through recycling & donation",
    bookLink: "/services/material-recovery",
  },
  "pressure-washing": {
    name: "Pressure Washing",
    serviceType: "pressure_washing",
    tagline: "Curb Appeal, Restored in Hours.",
    description:
      "Industrial-grade surface cleaning for driveways, patios, walkways, pool decks, and home exteriors. Every job includes chemical pre-treatment to break down stains, mold, and mildew before high-pressure cleaning. Surface sealing available to protect your investment.",
    price: "From $120",
    icon: Droplets,
    heroGradient: "from-blue-600 to-cyan-500",
    features: [
      "Chemical pre-treatment on every job",
      "Driveways, patios, walkways, and pool decks",
      "Home exterior and siding cleaning",
      "Surface sealing available as add-on",
      "Gum and stain removal",
      "Before/after photo documentation",
      "Low-flow equipment saves water",
      "Same-day availability in Orlando Metro",
    ],
    whyUpTend: [
      "Saves 200+ gallons of water per job with low-flow equipment",
      "Eco-friendly chemical treatments",
      "Fully insured Pros with $1M coverage",
      "Transparent pricing — no surprises",
    ],
    esgImpact: "Saves 200+ gallons of water per job with low-flow equipment",
  },
  "gutter-cleaning": {
    name: "Gutter Cleaning",
    serviceType: "gutter_cleaning",
    tagline: "Prevent Water Damage Before It Starts.",
    description:
      "Complete debris removal from all gutters and downspouts. We flush every downspout and air-blow the roof line to prevent clogs from returning. All debris is bagged and hauled away — your property is left spotless.",
    price: "From $129",
    icon: Home,
    heroGradient: "from-amber-600 to-orange-500",
    features: [
      "Full debris removal from all gutters",
      "Downspout flushing and testing",
      "Roof line air-blow to clear loose debris",
      "All debris bagged and hauled away",
      "Before/after photo documentation",
      "Gutter guard inspection included",
      "Seasonal maintenance plans available",
      "Same-day availability in Orlando Metro",
    ],
    whyUpTend: [
      "Prevents water damage that costs thousands to repair",
      "Saves 50+ lbs CO2 from avoided water damage repairs",
      "Academy-trained Pros with safety certification",
      "Full photo documentation of completed work",
    ],
    esgImpact: "Prevents 50+ lbs CO2 from water damage repairs",
  },
  "moving-labor": {
    name: "Moving Labor",
    serviceType: "moving_labor",
    tagline: "Your Muscle on Demand.",
    description:
      "Hourly labor for loading, unloading, and rearranging. You rent the truck or pod — we supply the experienced manpower, dollies, hand trucks, and shrink wrap. Perfect for DIY moves, storage unit reorganization, or rearranging heavy furniture.",
    price: "$80/hr per Pro",
    icon: Users,
    heroGradient: "from-violet-600 to-purple-500",
    features: [
      "Experienced, background-checked Pros",
      "Dollies and hand trucks included",
      "Shrink wrap service for furniture protection",
      "Furniture assembly and disassembly",
      "Loading and unloading any vehicle type",
      "Storage unit organization",
      "Heavy item rearranging within your home",
      "1-hour minimum, billed by the minute after",
    ],
    whyUpTend: [
      "Pros trained in proper lifting and handling techniques",
      "$1M liability coverage protects your belongings",
      "Real-time GPS tracking of your Pro",
      "No hidden fees — transparent hourly billing",
    ],
  },
  "handyman": {
    name: "Handyman Services",
    serviceType: "handyman",
    tagline: "No Task Too Small.",
    description:
      "Professional handyman services for all your home repairs and odd jobs. From TV mounting and furniture assembly to minor repairs, painting touch-ups, and light fixture installation. 1-hour minimum, billed by the minute after. Same-day availability.",
    price: "From $75/hr",
    icon: Wrench,
    heroGradient: "from-orange-600 to-red-500",
    features: [
      "TV mounting and picture hanging",
      "Furniture assembly (IKEA and all brands)",
      "Minor repairs and touch-ups",
      "Light fixture and ceiling fan installation",
      "Drywall patching and painting",
      "Door adjustments and lock changes",
      "Shelving and storage installation",
      "Same-day availability in Orlando Metro",
    ],
    whyUpTend: [
      "Repair vs replace saves 100+ lbs CO2 per job",
      "Vetted Pros with verified skills and reviews",
      "Before/after photo documentation",
      "Transparent hourly billing — no estimate games",
    ],
    esgImpact: "Repair vs replace saves 100+ lbs CO2 per job",
  },
  "demolition": {
    name: "Light Demolition",
    serviceType: "light_demolition",
    tagline: "Tear It Out. Haul It Off.",
    description:
      "Cabinets, sheds, fencing, decks, and non-load-bearing walls — we demo it, clean it up, and haul the debris away in one visit. Perfect for renovation prep or clearing out outdated structures. All materials sorted for recycling where possible.",
    price: "From $249",
    icon: Hammer,
    heroGradient: "from-red-600 to-rose-500",
    features: [
      "Cabinet and countertop removal",
      "Fence and deck tear-down",
      "Shed and outbuilding demolition",
      "Non-load-bearing wall removal",
      "Full debris haul-away included",
      "Materials sorted for recycling",
      "Before/after photo documentation",
      "Same-day estimates available",
    ],
    whyUpTend: [
      "Materials recycled wherever possible",
      "One-visit service — demo and haul in the same trip",
      "Fully insured with $1M coverage",
      "Clean site guaranteed",
    ],
  },
  "garage-cleanout": {
    name: "Garage Cleanout",
    serviceType: "garage_cleanout",
    tagline: "Reclaim Your Space.",
    description:
      "Complete garage cleanout from cluttered to clean. We sort everything — keep, donate, recycle, or haul away. Your garage gets swept clean so you can actually park in it again. Digital inventory of kept items included.",
    price: "From $299",
    icon: Sofa,
    heroGradient: "from-teal-600 to-emerald-500",
    features: [
      "Full sort and organize service",
      "Donation coordination with local charities",
      "Recycling of all eligible materials",
      "Sweep and clean after removal",
      "Digital inventory of kept items",
      "Shelving rearrangement available",
      "Before/after photo documentation",
      "Single-visit complete cleanout",
    ],
    whyUpTend: [
      "Verified Impact Report shows where items went",
      "Donation receipts provided for tax purposes",
      "Eco-friendly disposal — nothing goes to landfill unnecessarily",
      "Background-checked, insured Pros",
    ],
  },
  "pool-cleaning": {
    name: "Pool Cleaning",
    serviceType: "pool_cleaning",
    tagline: "Crystal Clear Pools, Maintained Weekly.",
    description:
      "Professional pool maintenance and cleaning service. Weekly service includes skimming, vacuuming, brushing walls, chemical testing, and balancing. Keep your pool sparkling clean and safe year-round with a dedicated Pro who knows your pool.",
    price: "From $99/mo",
    icon: Waves,
    heroGradient: "from-sky-600 to-blue-500",
    features: [
      "Weekly skimming and vacuuming",
      "Chemical testing and balancing",
      "Filter cleaning and maintenance",
      "Pool equipment inspection",
      "Wall and tile brushing",
      "Pump basket cleaning",
      "Monthly detailed service report",
      "Recurring plans with dedicated Pro",
    ],
    whyUpTend: [
      "Chemical optimization saves water and reduces waste",
      "Dedicated Pro learns your pool's needs",
      "Transparent recurring pricing — cancel anytime",
      "Service verification with photos",
    ],
    esgImpact: "Chemical optimization saves water and reduces emissions",
  },
  "carpet-cleaning": {
    name: "Carpet Cleaning",
    serviceType: "carpet_cleaning",
    tagline: "Deep Clean Carpets. Certified Methods.",
    description:
      "Professional carpet and upholstery cleaning using IICRC-certified methods. Standard Steam Clean $39/room, Deep Clean $59/room, Pet Treatment $69/room. Scotchgard protection and whole house packages available. $99 minimum.",
    price: "From $39/room",
    icon: Sparkles,
    heroGradient: "from-pink-600 to-fuchsia-500",
    features: [
      "IICRC-certified cleaning methods",
      "Hot Water Extraction (steam cleaning)",
      "Encapsulation and low-moisture options",
      "Pet odor and stain treatment",
      "Scotchgard protection available",
      "Fast dry times — walk on carpets same day",
      "Upholstery cleaning available",
      "Before/after photo documentation",
    ],
    whyUpTend: [
      "Eco-friendly cleaning solutions",
      "Certified technicians with proper equipment",
      "Extends carpet life — saving landfill waste",
      "Transparent per-room pricing",
    ],
    bookLink: "/book/deepfiber",
  },
  "home-cleaning": {
    name: "Home Cleaning",
    serviceType: "home_cleaning",
    tagline: "Professional Cleaning. Trusted Pros.",
    description:
      "Book professional home cleaning services with verified, background-checked pros. From standard cleanings to deep cleans, we handle every room with care and documented results.",
    price: "From $99",
    icon: Sparkles,
    heroGradient: "from-cyan-600 to-blue-500",
    features: [
      "Background-checked, verified cleaning pros",
      "Standard, deep, and move-in/move-out cleaning",
      "Kitchen, bathroom, and living area focus",
      "Eco-friendly cleaning products available",
      "Same-day and recurring scheduling",
      "Before/after photo documentation",
      "Satisfaction guaranteed",
      "Transparent flat-rate pricing",
    ],
    whyUpTend: [
      "All pros are verified and insured",
      "Eco-friendly products reduce chemical exposure",
      "Recurring plans save you time and money",
      "Real customer reviews on every pro",
    ],
  },
};

export default function ServiceDetail() {
  const params = useParams();
  const slug = (params as any).slug ?? (params as any)["0"];
  const service = slug ? serviceData[slug] : undefined;

  if (!service) {
    return <NotFound />;
  }

  const bookUrl = service.bookLink || `/book?service=${service.serviceType}`;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-28 pb-16 px-6 bg-muted/50 border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${service.heroGradient} flex items-center justify-center`}>
              <service.icon className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">{service.name}</h1>
          <p className="text-xl font-semibold text-muted-foreground mb-4">{service.tagline}</p>
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-3xl font-black text-primary">{service.price}</span>
            {service.esgImpact && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                🌱 {service.esgImpact}
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-8">
            <MapPin className="w-4 h-4" />
            <span>Serving Orlando Metro Area</span>
          </div>
          <Link href={bookUrl}>
            <Button size="lg" className="text-lg px-8 py-6">
              Book Now <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <div className="flex justify-center mt-4">
            <GuaranteeBadge compact />
          </div>
        </div>
      </section>

      {/* Description + Features */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-lg text-muted-foreground leading-relaxed mb-12">
            {service.description}
          </p>

          <h2 className="text-2xl font-bold mb-6">What's Included</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {service.features.map((feature) => (
              <div key={feature} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-bold mb-6">Why UpTend</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {service.whyUpTend.map((reason) => (
              <Card key={reason}>
                <CardContent className="p-4 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm">{reason}</span>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <Card className="border-primary">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-2">Ready to Get Started?</h3>
              <p className="text-muted-foreground mb-6">
                {service.name.toLowerCase().includes('service')
                  ? `Book ${service.name.toLowerCase()} today. Transparent pricing, no hidden fees.`
                  : `Book your ${service.name.toLowerCase()} service today. Transparent pricing, no hidden fees.`}
              </p>
              <Link href={bookUrl}>
                <Button size="lg" className="text-lg px-8">
                  Book {service.name} <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
