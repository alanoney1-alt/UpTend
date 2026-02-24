import { usePageTitle } from "@/hooks/use-page-title";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import {
  CheckCircle, ArrowRight, ShieldCheck, MapPin, Recycle,
  Droplets, Users, Hammer, Warehouse, Wrench, Waves,
  Sparkles, Leaf, Clock, Calendar, CalendarCheck, Repeat,
  CloudRain, SprayCan,
} from "lucide-react";
import NotFound from "@/pages/not-found";
import { GuaranteeBadge } from "@/components/guarantee-badge";
import { useTranslation } from "react-i18next";

interface ServiceData {
  name: string;
  serviceType: string;
  tagline: string;
  whatWeDo: string[];
  howItImproves: string[];
  availability: {
    sameDay?: boolean;
    nextDay?: boolean;
    scheduled?: boolean;
    recurring?: boolean;
  };
  whatsIncluded: string[];
  whyUpTend: string[];
  icon: React.ElementType;
  heroGradient: string;
  esgImpact?: string;
}

const serviceData: Record<string, ServiceData> = {
  "handyman": {
    name: "Handyman Services",
    serviceType: "handyman",
    tagline: "No Task Too Small",
    icon: Wrench,
    heroGradient: "from-orange-600 to-red-500",
    whatWeDo: [
      "Our handyman services cover all the small repairs and installations that keep your home functioning smoothly. From TV mounting and furniture assembly to drywall patching, light fixture installation, and door adjustments, we handle the tasks that most contractors consider too small—but that make a big difference in your daily life.",
      "Every job includes a thorough assessment before we start, professional-grade tools and materials, and before/after photo documentation. We work efficiently, respect your home, and clean up completely when we're done. Same-day availability means those nagging repairs get handled fast."
    ],
    howItImproves: [
      "Extends the life of fixtures and appliances by keeping them properly maintained",
      "Increases home value through proper repairs and professional installations",
      "Saves money by repairing items instead of replacing them—better for your wallet and the environment",
      "Eliminates safety hazards like loose fixtures, faulty electrical, or damaged doors"
    ],
    availability: {
      sameDay: true,
      nextDay: true,
      scheduled: true,
    },
    whatsIncluded: [
      "Professional assessment before starting work",
      "TV mounting and picture hanging with proper anchoring",
      "Furniture assembly for all brands (IKEA, Wayfair, etc.)",
      "Minor repairs including drywall patching and touch-up painting",
      "Light fixture and ceiling fan installation",
      "Door adjustments, lock changes, and hardware installation",
      "Shelving and storage system installation",
      "1-hour minimum, billed by the minute after—no estimate games",
      "All tools and basic materials included",
      "Before/after photo documentation",
      "$1M liability coverage on every job"
    ],
    whyUpTend: [
      "Same-day availability in the Orlando Metro area",
      "Background-checked, academy-trained Pros with verified skills",
      "Transparent hourly billing—you know exactly what you're paying",
      "Repairing instead of replacing saves an average of 100+ lbs CO2 per job"
    ],
    esgImpact: "Repair vs replace saves 100+ lbs CO2 per job"
  },
  "junk-removal": {
    name: "Junk Removal",
    serviceType: "junk_removal",
    tagline: "Space Rejuvenation. Verified Material Recovery.",
    icon: Recycle,
    heroGradient: "from-green-600 to-emerald-500",
    whatWeDo: [
      "Your unwanted items are resources, not trash. UpTend's junk removal service recovers your space while protecting your property and the environment through our verified circular economy system. Before we touch anything, we conduct a 360° Home DNA Scan to document your property's condition—protecting you from any disputes.",
      "We don't just haul—we sort. Every item is evaluated for donation, recycling, or responsible disposal. You receive a verified Impact Report showing exactly where your items went and the environmental impact of diverting them from landfills. For property managers and commercial clients, we provide ESG compliance documentation that proves your commitment to sustainability."
    ],
    howItImproves: [
      "Reclaims usable square footage—every load removed adds functional space back to your home",
      "Reduces fire hazards and pest attraction from accumulated clutter",
      "Improves indoor air quality by removing dust-collecting items and mold-prone materials",
      "Increases property value by presenting clean, organized spaces for resale or rental"
    ],
    availability: {
      sameDay: true,
      nextDay: true,
      scheduled: true,
    },
    whatsIncluded: [
      "360° Home DNA Scan before work begins to protect your property",
      "Full sort and evaluation—donate, recycle, or dispose",
      "Coordination with local charities for tax-deductible donations",
      "Heavy lifting and careful maneuvering to avoid property damage",
      "Complete haul-away in one visit",
      "Verified Impact Report showing where every item went",
      "ESG compliance documentation for property managers",
      "Before/after photos and video documentation",
      "$1M liability coverage protects your home"
    ],
    whyUpTend: [
      "Average 600 lbs CO2 saved per job through recycling and donation",
      "Every item tracked with full chain-of-custody accountability",
      "Transparent volume-based pricing—no hidden fees",
      "Background-checked, academy-trained Pros who respect your property"
    ],
    esgImpact: "Avg 600 lbs CO2 saved per job through recycling & donation"
  },
  "garage-cleanout": {
    name: "Garage Cleanout",
    serviceType: "garage_cleanout",
    tagline: "Reclaim Your Space",
    icon: Warehouse,
    heroGradient: "from-teal-600 to-cyan-500",
    whatWeDo: [
      "A full garage cleanout is more than just hauling—it's a complete transformation from cluttered to clean. Our Pros work with you to sort everything in your garage into keep, donate, recycle, or haul categories. We handle the heavy lifting, coordinate donations with local charities, and ensure recyclable materials are properly processed.",
      "After removal, we sweep the garage clean and provide a digital inventory of items you're keeping, making it easy to find what you need later. Whether you're preparing for a move, reclaiming space to actually park your car, or just tired of the clutter, we handle the entire process in a single visit."
    ],
    howItImproves: [
      "Adds functional space—finally park your car in the garage again",
      "Eliminates pest habitats and reduces fire hazards from accumulated items",
      "Increases home value by presenting organized, clean spaces to buyers",
      "Reduces stress by creating an organized, accessible storage system"
    ],
    availability: {
      sameDay: true,
      nextDay: true,
      scheduled: true,
    },
    whatsIncluded: [
      "Full sort and organize service with your input",
      "Heavy item removal including appliances, furniture, and storage units",
      "Donation coordination with local charities—receipts provided for taxes",
      "Recycling of all eligible materials",
      "Sweep and clean after removal",
      "Digital inventory of kept items for easy reference",
      "Shelving rearrangement if needed",
      "Before/after photo documentation",
      "Verified Impact Report showing diversion from landfills",
      "$1M liability coverage"
    ],
    whyUpTend: [
      "Single-visit complete cleanout saves you time",
      "Verified Impact Report proves environmental responsibility",
      "Donation receipts maximize your tax benefits",
      "Eco-friendly disposal—nothing goes to landfill unnecessarily"
    ],
    esgImpact: "Avg 400 lbs diverted from landfills per cleanout"
  },
  "moving-labor": {
    name: "Moving Labor",
    serviceType: "moving_labor",
    tagline: "Your Muscle on Demand",
    icon: Users,
    heroGradient: "from-violet-600 to-purple-500",
    whatWeDo: [
      "Moving labor when you need it, how you need it. You rent the truck or pod—we supply the experienced manpower, dollies, hand trucks, and shrink wrap. Our Pros are trained in proper lifting techniques, furniture handling, and damage prevention, so your belongings stay safe and your back stays healthy.",
      "Whether you're loading a truck for a DIY move, unloading a storage pod, rearranging heavy furniture within your home, or need help with furniture assembly and disassembly, our hourly labor service gives you the muscle and expertise without the commitment of a full moving company. Perfect for students, downsizers, and anyone who wants to save money on the truck rental while getting professional help with the heavy lifting."
    ],
    howItImproves: [
      "Prevents injury from improper lifting and handling of heavy items",
      "Reduces damage to furniture and property through professional techniques",
      "Saves money compared to full-service movers while still getting expert help",
      "Adds flexibility—use labor only where you need it, DIY the rest"
    ],
    availability: {
      sameDay: true,
      nextDay: true,
      scheduled: true,
    },
    whatsIncluded: [
      "Experienced, background-checked moving Pros",
      "Dollies, hand trucks, and moving straps included",
      "Shrink wrap service for furniture protection",
      "Furniture assembly and disassembly",
      "Loading and unloading any vehicle type",
      "Heavy item moving within your home",
      "Storage unit organization and rearrangement",
      "1-hour minimum, billed by the minute after",
      "Real-time GPS tracking of your Pro",
      "$1M liability coverage protects your belongings"
    ],
    whyUpTend: [
      "Pros trained in proper lifting and handling techniques",
      "Transparent hourly billing—no hidden fees or estimates",
      "Same-day payouts for Pros mean motivated, professional service",
      "Flexible scheduling—book labor only when you need it"
    ],
    esgImpact: "Reusable equipment & no-truck-rental option cuts moving emissions"
  },
  "home-cleaning": {
    name: "Home Cleaning",
    serviceType: "home_cleaning",
    tagline: "Spotless Homes. Verified Clean.",
    icon: Sparkles,
    heroGradient: "from-cyan-600 to-blue-500",
    whatWeDo: [
      "Professional home cleaning with room-by-room checklists and before/after photo verification. Our Pros tackle kitchens, bathrooms, bedrooms, and living areas with systematic attention to detail—dusting, vacuuming, mopping, sanitizing surfaces, and leaving your home spotless.",
      "Choose from standard cleaning for regular maintenance, deep cleaning for seasonal or move-in/move-out situations, or recurring plans where you get a dedicated Pro who learns your home and preferences. All cleaning supplies are included, and eco-friendly options are available for clients with sensitivities or environmental concerns."
    ],
    howItImproves: [
      "Improves indoor air quality by removing dust, allergens, and contaminants",
      "Reduces illness transmission through proper sanitization of high-touch surfaces",
      "Increases home value by maintaining pristine condition of floors and fixtures",
      "Reduces stress and saves time—reclaim your weekends for what matters"
    ],
    availability: {
      sameDay: true,
      nextDay: true,
      scheduled: true,
      recurring: true,
    },
    whatsIncluded: [
      "Room-by-room cleaning checklist tailored to your home",
      "Kitchen: counters, sinks, appliances, floors",
      "Bathrooms: tubs, showers, toilets, sinks, mirrors, floors",
      "Living areas: dusting, vacuuming, mopping",
      "Bedrooms: dusting, vacuuming, bed making (optional)",
      "All cleaning supplies and equipment included",
      "Eco-friendly products available upon request",
      "Before/after photo documentation",
      "Recurring plans with your dedicated Pro",
      "Background-checked, insured Pros"
    ],
    whyUpTend: [
      "Verified cleaning through photo documentation—you see the results",
      "Recurring plans save money and give you a dedicated Pro",
      "Eco-friendly products reduce chemical exposure in your home",
      "Flexible scheduling including same-day availability"
    ],
    esgImpact: "Eco-friendly products reduce chemical waste by 80%"
  },
  "carpet-cleaning": {
    name: "Carpet Cleaning",
    serviceType: "carpet_cleaning",
    tagline: "Deep Clean Carpets. Certified Methods.",
    icon: SprayCan,
    heroGradient: "from-pink-600 to-fuchsia-500",
    whatWeDo: [
      "Professional carpet and upholstery cleaning using IICRC-certified methods. We use hot water extraction (steam cleaning) as our primary method, which deep-cleans fibers, removes embedded dirt and allergens, and sanitizes your carpets without harsh chemicals. For commercial spaces or low-moisture needs, we also offer encapsulation cleaning.",
      "Pet owners get specialized treatment options that eliminate odors at the source—not just masking smells, but breaking down the organic compounds that cause them. Scotchgard protection is available as an add-on to extend the life of your cleaning and make future spills easier to clean. We offer whole-house packages for 3-5 bedroom homes, making it affordable to refresh your entire space."
    ],
    howItImproves: [
      "Extends carpet life by removing abrasive dirt particles that wear down fibers",
      "Improves indoor air quality by extracting allergens, dust mites, and pollutants",
      "Eliminates odors from pets, cooking, and everyday living",
      "Restores appearance—makes old carpets look new again, delaying costly replacement"
    ],
    availability: {
      sameDay: true,
      nextDay: true,
      scheduled: true,
      recurring: true,
    },
    whatsIncluded: [
      "IICRC-certified cleaning methods and technicians",
      "Hot water extraction (steam cleaning) for deep cleaning",
      "Encapsulation and low-moisture options for commercial spaces",
      "Pet odor and stain treatment with enzyme-based solutions",
      "Pre-treatment of high-traffic areas and spots",
      "Scotchgard protection available as add-on",
      "Fast dry times—walk on carpets the same day",
      "Upholstery cleaning available",
      "Before/after photo documentation",
      "Whole-house packages for 3-5 bedroom homes"
    ],
    whyUpTend: [
      "Eco-friendly cleaning solutions safe for kids and pets",
      "Certified technicians with professional equipment",
      "Transparent per-room pricing—no surprises",
      "Extends carpet life, reducing landfill waste and saving money"
    ],
    esgImpact: "Extends carpet life 5+ years, keeping 500+ lbs out of landfills"
  },
  "landscaping": {
    name: "Landscaping",
    serviceType: "landscaping",
    tagline: "Professional Lawn Care. Your Curb Appeal, Maintained.",
    icon: Leaf,
    heroGradient: "from-lime-600 to-green-500",
    whatWeDo: [
      "Professional lawn care and landscaping services for Orlando-area properties up to ½ acre. We offer one-time mowing for quick curb appeal before a showing or event, as well as recurring monthly plans that keep your property looking sharp year-round. Our Mow & Go service includes mowing, edging, trimming, and blowing—the essentials that keep your lawn tidy.",
      "For clients who want more comprehensive care, our Full Service plan adds weed control, hedge trimming, and seasonal adjustments. The Premium plan includes everything plus flowers, mulch, and basic irrigation maintenance, transforming your landscape into a neighborhood showpiece. All plans include debris removal—we haul the clippings, you enjoy the results."
    ],
    howItImproves: [
      "Increases property value—landscaping improvements deliver up to 200% ROI",
      "Enhances curb appeal for resale, rental, or pride of ownership",
      "Reduces allergens and pests by keeping grass and weeds under control",
      "Sequesters carbon and improves air quality through healthy lawn maintenance"
    ],
    availability: {
      sameDay: true,
      nextDay: true,
      scheduled: true,
      recurring: true,
    },
    whatsIncluded: [
      "Mow & Go: mowing, edging, trimming, blowing, debris removal",
      "Full Service: everything above plus weed control, hedge trimming, seasonal adjustments",
      "Premium: everything above plus flowers, mulch, and irrigation maintenance",
      "One-time service for quick curb appeal",
      "Recurring weekly or biweekly plans with your dedicated Pro",
      "Equipment and debris haul-away included",
      "Before/after photo documentation",
      "Orlando-area expertise for Central Florida climate and grasses"
    ],
    whyUpTend: [
      "Flexible plans—one-time or recurring to fit your needs",
      "Lawn care sequesters carbon and improves air quality",
      "Transparent pricing with no hidden fees",
      "Background-checked Pros who respect your property"
    ],
    esgImpact: "Lawn care sequesters carbon and improves air quality"
  },
  "gutter-cleaning": {
    name: "Gutter Cleaning",
    serviceType: "gutter_cleaning",
    tagline: "Prevent Water Damage Before It Starts",
    icon: CloudRain,
    heroGradient: "from-amber-600 to-yellow-500",
    whatWeDo: [
      "Complete gutter and downspout cleaning that prevents water damage before it starts. In Central Florida, debris from oak trees, pine needles, and seasonal storms can clog gutters fast, leading to overflow, foundation erosion, and costly water intrusion. Our Pros remove all debris from your gutters, flush every downspout to ensure proper flow, and air-blow your roof line to prevent immediate re-clogging.",
      "After cleaning, we bag and haul all debris, leaving your property spotless. We also inspect gutter guards (if installed) and provide recommendations for any repairs or improvements needed. Regular gutter maintenance is one of the most cost-effective ways to protect your home's foundation, siding, and landscaping from water damage."
    ],
    howItImproves: [
      "Prevents foundation damage from water pooling around your home's base",
      "Protects siding and exterior paint from water staining and rot",
      "Eliminates mosquito breeding grounds in stagnant gutter water",
      "Extends roof life by preventing water backup and ice dam damage (in cooler months)"
    ],
    availability: {
      sameDay: true,
      nextDay: true,
      scheduled: true,
    },
    whatsIncluded: [
      "Full debris removal from all gutters",
      "Downspout flushing and flow testing",
      "Roof line air-blow to clear loose debris",
      "All debris bagged and hauled away",
      "Gutter guard inspection (if applicable)",
      "Recommendations for repairs or improvements",
      "Before/after photo documentation",
      "Seasonal maintenance plans available",
      "Safety-certified Pros with proper equipment"
    ],
    whyUpTend: [
      "Prevents water damage that costs thousands to repair",
      "Saves an estimated 50+ lbs CO2 from avoided repair-related emissions",
      "Academy-trained Pros with safety certification and insurance",
      "Same-day availability in the Orlando Metro area"
    ],
    esgImpact: "Prevents 50+ lbs CO2 from water damage repairs"
  },
  "pressure-washing": {
    name: "Pressure Washing",
    serviceType: "pressure_washing",
    tagline: "Curb Appeal, Restored in Hours",
    icon: Droplets,
    heroGradient: "from-blue-600 to-cyan-500",
    whatWeDo: [
      "Industrial-grade pressure washing for driveways, patios, walkways, pool decks, and home exteriors. Central Florida's humidity and heat create the perfect environment for mold, mildew, algae, and dirt buildup that can make your property look neglected—even if it's well-maintained. Our Pros use professional equipment with adjustable pressure settings to safely clean each surface without damage.",
      "Every job includes chemical pre-treatment to break down organic growth before pressure washing, ensuring deep cleaning and longer-lasting results. We also offer surface sealing as an add-on to protect your investment and keep surfaces cleaner longer. Before/after photos document the transformation—you'll be amazed at how much brighter and cleaner your property looks."
    ],
    howItImproves: [
      "Increases property value by restoring curb appeal—clean exteriors signal well-maintained homes",
      "Prevents surface degradation from mold, mildew, and algae that eat away at concrete and paint",
      "Improves safety by removing slippery algae and mold from walkways and pool decks",
      "Extends the life of exterior surfaces by removing corrosive contaminants"
    ],
    availability: {
      sameDay: true,
      nextDay: true,
      scheduled: true,
    },
    whatsIncluded: [
      "Chemical pre-treatment to break down mold, mildew, and stains",
      "Adjustable pressure settings to safely clean each surface type",
      "Driveways, patios, walkways, and pool decks",
      "Home exterior and siding cleaning",
      "Gum and stubborn stain removal",
      "Surface sealing available as add-on for long-lasting protection",
      "Before/after photo documentation",
      "Low-flow equipment that conserves water",
      "Orlando-area expertise for Florida's climate challenges"
    ],
    whyUpTend: [
      "Saves 200+ gallons of water per job with low-flow professional equipment",
      "Eco-friendly chemical treatments safe for landscaping and pets",
      "Fully insured Pros with $1M coverage protect your property",
      "Same-day availability in the Orlando Metro area"
    ],
    esgImpact: "Saves 200+ gallons of water per job with low-flow equipment"
  },
  "pool-cleaning": {
    name: "Pool Cleaning",
    serviceType: "pool_cleaning",
    tagline: "Crystal Clear Pools, Maintained Weekly",
    icon: Waves,
    heroGradient: "from-sky-600 to-blue-500",
    whatWeDo: [
      "Professional pool maintenance and cleaning service that keeps your pool sparkling clean and safe to swim in year-round. Our weekly service includes skimming the surface, vacuuming the floor, brushing walls and tile, chemical testing and balancing, filter cleaning, and pump basket cleaning. Your dedicated Pro learns your pool's specific needs—circulation patterns, problem areas, and seasonal adjustments—delivering consistent results.",
      "We provide monthly detailed service reports so you can track chemical levels, equipment health, and any issues that need attention. For new pool owners or those who've struggled with green pools in the past, our Pros bring the expertise to keep your water chemistry balanced and your equipment running efficiently."
    ],
    howItImproves: [
      "Prevents costly equipment failure through regular inspection and maintenance",
      "Protects swimmer health by maintaining proper sanitation and chemical balance",
      "Extends pool surface life by preventing algae and scale buildup",
      "Saves water by catching leaks early and optimizing chemical balance (reducing refills)"
    ],
    availability: {
      sameDay: true,
      nextDay: true,
      scheduled: true,
      recurring: true,
    },
    whatsIncluded: [
      "Weekly skimming and vacuuming",
      "Wall and tile brushing to prevent algae buildup",
      "Chemical testing and balancing (chlorine, pH, alkalinity)",
      "Filter cleaning and maintenance",
      "Pump basket cleaning",
      "Pool equipment inspection for early problem detection",
      "Monthly detailed service report",
      "Recurring plans with your dedicated Pro",
      "Service verification with photos"
    ],
    whyUpTend: [
      "Chemical optimization saves water and reduces chemical waste",
      "Dedicated Pro learns your pool's needs for consistent results",
      "Transparent recurring pricing—cancel anytime",
      "Orlando-area expertise for Florida pools and climate challenges"
    ],
    esgImpact: "Chemical optimization saves water and reduces emissions"
  },
  "demolition": {
    name: "Light Demolition",
    serviceType: "light_demolition",
    tagline: "Tear It Out. Haul It Off.",
    icon: Hammer,
    heroGradient: "from-red-600 to-rose-500",
    whatWeDo: [
      "Light demolition services for residential renovation prep and structure removal. We handle cabinets, countertops, sheds, fencing, decks, and non-load-bearing walls—tearing out the old so you can build the new. Our Pros work carefully to protect surrounding structures while efficiently demolishing the targeted areas.",
      "All debris is hauled away in the same visit, and we sort materials for recycling wherever possible—metal, wood, and concrete are diverted from landfills when feasible. Whether you're preparing for a kitchen remodel, clearing space for a new deck, or removing an old shed, we handle the demo, cleanup, and haul-away in one efficient visit."
    ],
    howItImproves: [
      "Prepares your home for renovation by safely removing outdated structures",
      "Eliminates safety hazards from deteriorating fences, decks, or sheds",
      "Increases property value by removing eyesores and creating space for improvements",
      "Saves money on renovation costs by handling demo separately from contractor work"
    ],
    availability: {
      sameDay: true,
      nextDay: true,
      scheduled: true,
    },
    whatsIncluded: [
      "Cabinet and countertop removal for kitchen and bathroom remodels",
      "Fence and deck tear-down with post removal",
      "Shed and outbuilding demolition",
      "Non-load-bearing wall removal (interior walls only)",
      "Full debris haul-away in the same visit",
      "Materials sorted for recycling where possible",
      "Site cleanup and sweep after demo",
      "Before/after photo documentation",
      "Same-day estimates available"
    ],
    whyUpTend: [
      "Materials recycled wherever possible to reduce landfill waste",
      "One-visit service—demo and haul in the same trip",
      "Fully insured with $1M coverage protects your property",
      "Clean site guaranteed—we leave your property ready for the next step"
    ],
    esgImpact: "Materials sorted for recycling—avg 60% diverted from landfills"
  },
};

export default function ServiceDetail() {
  const { t } = useTranslation();
  const params = useParams();
  const slug = (params as any).slug ?? (params as any)["0"];
  const service = slug ? serviceData[slug] : undefined;

  usePageTitle(service ? `${service.name} | UpTend Orlando` : "Service Not Found | UpTend");

  if (!service) {
    return <NotFound />;
  }

  const bookUrl = `/book?service=${service.serviceType}`;

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
          <p className="text-xl font-semibold text-muted-foreground mb-6">{service.tagline}</p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-8">
            <MapPin className="w-4 h-4" />
            <span>{t("service_detail.serving")}</span>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-16 px-6 bg-background">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">{t("service_detail.what_we_do")}</h2>
          <div className="space-y-4">
            {service.whatWeDo.map((paragraph, idx) => (
              <p key={idx} className="text-lg text-muted-foreground leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* How It Improves Your Home */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">{t("service_detail.how_improves")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {service.howItImproves.map((benefit, idx) => (
              <Card key={idx}>
                <CardContent className="p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">{benefit}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Availability */}
      <section className="py-16 px-6 bg-background">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">{t("service_detail.availability")}</h2>
          <div className="flex flex-wrap gap-3">
            {service.availability.sameDay && (
              <Link href={`${bookUrl}&timing=same-day`}>
                <Badge variant="secondary" className="text-base py-2 px-4 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100 cursor-pointer hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors">
                  <Clock className="w-4 h-4 mr-2" /> {t("service_detail.same_day")}
                </Badge>
              </Link>
            )}
            {service.availability.nextDay && (
              <Link href={`${bookUrl}&timing=next-day`}>
                <Badge variant="secondary" className="text-base py-2 px-4 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
                  <Calendar className="w-4 h-4 mr-2" /> {t("service_detail.next_day")}
                </Badge>
              </Link>
            )}
            {service.availability.scheduled && (
              <Link href={`${bookUrl}&timing=scheduled`}>
                <Badge variant="secondary" className="text-base py-2 px-4 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  <CalendarCheck className="w-4 h-4 mr-2" /> {t("service_detail.scheduled")}
                </Badge>
              </Link>
            )}
            {service.availability.recurring && (
              <Link href={`${bookUrl}&timing=recurring`}>
                <Badge variant="secondary" className="text-base py-2 px-4 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 cursor-pointer hover:bg-green-200 dark:hover:bg-green-800 transition-colors">
                  <Repeat className="w-4 h-4 mr-2" /> {t("service_detail.recurring")}
                </Badge>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">{t("service_detail.whats_included")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {service.whatsIncluded.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why UpTend */}
      <section className="py-16 px-6 bg-background">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">{t("service_detail.why_uptend")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {service.whyUpTend.map((reason, idx) => (
              <Card key={idx}>
                <CardContent className="p-4 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">{reason}</span>
                </CardContent>
              </Card>
            ))}
          </div>
          {service.esgImpact && (
            <div className="mt-6">
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-sm py-2 px-4">
                🌱 {service.esgImpact}
              </Badge>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-slate-900 dark:bg-slate-950">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t("service_detail.ready")}</h2>
          <p className="text-slate-400 text-lg mb-8">
            {t("service_detail.book_desc", { service: service.name.toLowerCase() })}
          </p>
          <Link href={bookUrl}>
            <Button size="lg" className="text-lg px-8">
              {t("service_detail.get_quote")} <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <div className="flex justify-center mt-6">
            <GuaranteeBadge compact />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
