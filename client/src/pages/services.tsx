import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Recycle, Droplets, Home, Users, Hammer, ClipboardCheck,
  Sofa, Truck, CheckCircle, ArrowRight, ShieldCheck, Star,
  GraduationCap, Video, Globe, DollarSign, ChevronRight,
  Leaf, Sparkles, Waves,
} from "lucide-react";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

const services = [
  {
    id: "junk_removal",
    name: <>BulkSnap<sup>™</sup> (Material Recovery)</>,
    icon: Recycle,
    tagline: "Space Rejuvenation. Verified Material Recovery.",
    description: "Your unwanted items are resources. We recover your space, protect your property with a 360\u00B0 Video Manifest, and verify the environmental impact of every item through our circular economy system.",
    price: "From $99",
    includes: ["360\u00B0 Video Manifest", "Verified Impact Report", "Circular economy sorting", "ESG compliance documentation"],
    popular: true,
    link: "/services/material-recovery",
  },
  {
    id: "furniture_moving",
    name: <>LiftCrew<sup>™</sup> (Furniture Moving)</>,
    icon: Sofa,
    tagline: "Your furniture, moved with care.",
    description: "Professional furniture moving service with experienced Pros. Safe transport to your new location with proper equipment, blankets, and straps. Perfect for in-state moves.",
    price: "From $99",
    includes: ["Professional moving blankets", "Furniture dollies & straps", "Safe loading/unloading", "$1/mile transport rate"],
  },
  {
    id: "pressure_washing",
    name: <>FreshWash<sup>™</sup> (Pressure Washing)</>,
    icon: Droplets,
    tagline: "Curb appeal, restored in hours.",
    description: "Industrial-grade surface cleaning for driveways, patios, walkways, pool decks, and home exteriors. Chemical pre-treatment included on every job.",
    price: "From $120",
    includes: ["Chemical pre-treatment", "Surface sealing available", "Gum removal", "Before/After photos"],
  },
  {
    id: "gutter_cleaning",
    name: <>GutterFlush<sup>™</sup> (Gutter Cleaning)</>,
    icon: Home,
    tagline: "Prevent water damage before it starts.",
    description: "Complete debris removal from all gutters and downspouts. We flush every downspout and air-blow the roof line to prevent clogs from returning.",
    price: "From $149",
    includes: ["Full debris removal", "Downspout flushing", "Roof line air-blow", "Debris bagged & hauled"],
  },
  {
    id: "moving_labor",
    name: <>LiftCrew<sup>™</sup> (Moving Labor)</>,
    icon: Users,
    tagline: "Your muscle on demand.",
    description: "Hourly labor for loading, unloading, and rearranging. You rent the truck or pod, we supply the manpower, dollies, and shrink wrap. Perfect for DIY moves.",
    price: "$80/hr per Pro",
    includes: ["Experienced Pros", "Dollies & hand trucks included", "Shrink wrap service", "Furniture assembly/disassembly"],
  },
  {
    id: "light_demolition",
    name: <>TearDown<sup>™</sup> (Demolition)</>,
    icon: Hammer,
    tagline: "Tear it out. Haul it off.",
    description: "Cabinets, sheds, fencing, decks, and non-load-bearing walls. We demo it, clean it up, and haul the debris away in one visit.",
    price: "From $199",
    includes: ["Cabinet & countertop removal", "Fence & deck tear-down", "Shed demolition", "Full debris haul-away"],
  },
  {
    id: "garage_cleanout",
    name: <>GarageReset<sup>™</sup> (Garage Cleanout)</>,
    icon: Sofa,
    tagline: "Reclaim your space.",
    description: "Complete garage cleanout from cluttered to clean. We sort, donate, recycle, and haul everything so you can actually park in your garage again.",
    price: "From $299",
    includes: ["Full sort & organize", "Donation coordination", "Sweep & clean after", "Digital inventory of kept items"],
  },
  {
    id: "truck_unloading",
    name: <>UnloadPro<sup>™</sup> (Truck/U-Haul Unloading)</>,
    icon: Truck,
    tagline: "You drove it. We'll unload it.",
    description: "Professional unloading of your rental truck, pod, or trailer. Our Pros place everything exactly where you want it inside your new home. 1-hour minimum.",
    price: "$80/hr per Pro",
    includes: ["Experienced Pros", "Furniture placement", "Shrink wrap removal", "Box stacking by room"],
  },
  {
    id: "home_consultation",
    name: <>DwellScan<sup>™</sup> (Home Audit)</>,
    icon: ClipboardCheck,
    tagline: "Your Insurance Shield. Your Resale Proof. Your Sustainability Baseline.",
    description: "A 30-minute on-site intelligence scan by a verified Level 3 Consultant. Smart inventory, 360\u00B0 video documentation, and a treatment plan with transparent pricing. The $49 fee is credited toward any booked service.",
    price: "$49 flat",
    includes: ["Smart room-by-room inventory", "360\u00B0 video walkthrough", "Sustainability baseline assessment", "Treatment plan with transparent pricing"],
    featured: true,
    link: "/services/home-audit",
  },
  {
    id: "home_cleaning",
    name: <>PolishUp<sup>™</sup> (Home Cleaning)</>,
    icon: Sparkles,
    tagline: "Spotless homes. Verified clean.",
    description: "Professional home cleaning with room-by-room checklists and before/after photo verification. Standard, deep, or move-in/move-out clean options. Recurring plans available with your dedicated Pro.",
    price: "From $99",
    includes: ["Room-by-room checklist", "Before/After photos", "Supplies included", "Recurring options available"],
    popular: true,
    link: "/services/home-cleaning",
  },
  {
    id: "pool_cleaning",
    name: <>PoolSpark<sup>™</sup> (Pool Cleaning)</>,
    icon: Waves,
    tagline: "Crystal clear pools, maintained weekly.",
    description: "Professional pool maintenance and cleaning service. Weekly service includes skimming, vacuuming, brushing, chemical testing, and balancing. Keep your pool sparkling clean year-round.",
    price: "From $69",
    includes: ["Weekly skimming & vacuuming", "Chemical testing & balancing", "Filter cleaning", "Equipment inspection"],
  },
  {
    id: "landscaping",
    name: <>FreshCut<sup>™</sup> (Landscaping)</>,
    icon: Leaf,
    tagline: "Professional lawn care. Your curb appeal, maintained.",
    description: "Complete lawn maintenance from basic mowing to premium care packages. One-time services or recurring plans with weekly/bi-weekly scheduling. Includes mowing, edging, blowing, and optional add-ons.",
    price: "From $35",
    includes: ["Professional mowing & edging", "Lawn debris removal", "Recurring discounts available", "Same-day service options"],
    link: "/book/freshcut",
  },
  {
    id: "carpet_cleaning",
    name: <>DeepFiber<sup>™</sup> (Carpet Cleaning)</>,
    icon: Home,
    tagline: "Deep clean carpets. Certified methods.",
    description: "Professional carpet and upholstery cleaning using industry-certified methods. Hot Water Extraction, Encapsulation, Bonnet, or Dry Compound. Pet odor treatment and Scotchgard protection available.",
    price: "From $49",
    includes: ["IICRC-certified methods", "Pet odor treatment options", "Scotchgard protection available", "Fast dry times"],
    link: "/book/deepfiber",
  },
];

const proStandards = [
  {
    icon: ShieldCheck,
    title: "Fully Insured",
    desc: "Every Pro carries $1M liability insurance. Your property is fully protected on every job.",
  },
  {
    icon: ShieldCheck,
    title: "Background Checked",
    desc: "Every Pro passes a national criminal background screening before their first job.",
  },
  {
    icon: GraduationCap,
    title: "Academy Trained",
    desc: "Certified through the UpTend Academy covering safety, customer service, and disposal best practices.",
  },
  {
    icon: Video,
    title: "Video Verified",
    desc: "Every job is documented with 360-degree video. Protects you and the Pro from disputes.",
  },
  {
    icon: Globe,
    title: "Bilingual Ready",
    desc: "Many Pros speak English and Spanish. Our matching system pairs you with the right fit.",
  },
  {
    icon: DollarSign,
    title: "Instant Payouts",
    desc: "Pros are paid same-day. Happy Pros deliver better work. That's the UpTend difference.",
  },
];

export default function Services() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background" data-testid="page-services">
      <Header />

      <section className="bg-slate-900 dark:bg-slate-950 pt-28 pb-20 px-6" data-testid="section-services-hero">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6" data-testid="badge-services-label">
            The Essential Services
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-6" data-testid="text-services-headline">
            Everything Your Home Needs.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">
              One Platform.
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto" data-testid="text-services-subhead">
            From junk removal to full home audits, every service is performed by fully insured,
            background-checked, academy-trained Pros with $1M liability coverage and full video documentation.
          </p>
        </div>
      </section>

      <section className="py-20 max-w-7xl mx-auto px-6" data-testid="section-services-grid">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((svc) => (
            <Card
              key={svc.id}
              className={`relative overflow-visible flex flex-col ${svc.featured ? "ring-2 ring-primary/30" : ""}`}
              data-testid={`card-service-${svc.id}`}
            >
              {svc.popular && (
                <div className="absolute -top-3 left-6" data-testid={`badge-popular-${svc.id}`}>
                  <Badge variant="default" data-testid={`text-popular-${svc.id}`}>
                    Most Popular
                  </Badge>
                </div>
              )}
              {svc.featured && (
                <div className="absolute -top-3 left-6" data-testid={`badge-featured-${svc.id}`}>
                  <Badge variant="default" data-testid={`text-featured-${svc.id}`}>
                    $49 Credited to Any Service
                  </Badge>
                </div>
              )}
              <CardContent className="p-8 flex flex-col flex-1">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0" data-testid={`icon-service-${svc.id}`}>
                    <svc.icon className="w-6 h-6 text-primary dark:text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold mb-1" data-testid={`text-service-name-${svc.id}`}>{svc.name}</h3>
                    <p className="text-sm font-medium text-muted-foreground" data-testid={`text-service-tagline-${svc.id}`}>{svc.tagline}</p>
                    <div className="mt-2">
                      <span className="text-2xl font-black text-primary dark:text-orange-400" data-testid={`text-service-price-${svc.id}`}>{svc.price}</span>
                    </div>
                  </div>
                </div>

                <p className="text-muted-foreground text-sm leading-relaxed mb-6" data-testid={`text-service-desc-${svc.id}`}>
                  {svc.description}
                </p>

                <ul className="space-y-2 mb-6 flex-1" data-testid={`list-service-includes-${svc.id}`}>
                  {svc.includes.map((item, idx) => (
                    <li key={item} className="flex items-start gap-2 text-sm" data-testid={`text-include-${svc.id}-${idx}`}>
                      <CheckCircle className="w-4 h-4 text-primary dark:text-orange-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full mt-auto"
                  onClick={() => setLocation("link" in svc && svc.link ? svc.link : `/book?service=${svc.id}`)}
                  data-testid={`button-book-service-${svc.id}`}
                >
                  {"link" in svc && svc.link ? "Learn More" : "Get a Quote"} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-20 bg-slate-900 dark:bg-slate-950" data-testid="section-pro-standards">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4" data-testid="text-pro-standards-headline">
              How We Recruit &amp; Train Our Pros
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto" data-testid="text-pro-standards-subhead">
              Not just anyone can be an UpTend Pro. Every technician is vetted, trained, and continuously rated.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {proStandards.map((std) => (
              <div key={std.title} className="flex gap-4" data-testid={`standard-${std.title.toLowerCase().replace(/\s/g, "-")}`}>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <std.icon className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold mb-1" data-testid={`text-standard-title-${std.title.toLowerCase().replace(/\s/g, "-")}`}>{std.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed" data-testid={`text-standard-desc-${std.title.toLowerCase().replace(/\s/g, "-")}`}>{std.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Link href="/become-pro">
              <Button variant="outline" size="lg" data-testid="button-become-pro-services">
                Want to become a Pro? <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-background" data-testid="section-services-cta">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4" data-testid="text-services-cta-headline">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground text-lg mb-8" data-testid="text-services-cta-subhead">
            Pick a service, get an AI-powered instant quote, and book a Pro in minutes.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/book">
              <Button size="lg" data-testid="button-services-book">
                Book a Service <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" data-testid="button-services-pricing">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
