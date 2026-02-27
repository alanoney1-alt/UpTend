import { usePageTitle } from "@/hooks/use-page-title";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck, ArrowRight, MapPin, Star, CheckCircle,
  Wrench, Waves, Truck, Package, Home, Trees,
  ArrowUpFromLine, Sparkles, Zap, Phone,
} from "lucide-react";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";

interface NeighborhoodConfig {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  areas: string[];
  highlights: string[];
  heroImage: string;
}

const SERVICES = [
  { key: "junk_removal", label: "Junk Removal", icon: Truck, price: "From $99" },
  { key: "pressure_washing", label: "Pressure Washing", icon: Waves, price: "From $149" },
  { key: "gutter_cleaning", label: "Gutter Cleaning", icon: ArrowUpFromLine, price: "From $150" },
  { key: "home_cleaning", label: "Home Cleaning", icon: Sparkles, price: "From $99" },
  { key: "handyman", label: "Handyman", icon: Wrench, price: "$75/hr" },
  { key: "landscaping", label: "Landscaping", icon: Trees, price: "From $99" },
  { key: "moving_labor", label: "Moving Labor", icon: Package, price: "From $149" },
  { key: "demolition", label: "Light Demolition", icon: Zap, price: "From $199" },
  { key: "garage_cleanout", label: "Garage Cleanout", icon: Home, price: "From $149" },
  { key: "pool_cleaning", label: "Pool Cleaning", icon: Waves, price: "From $120/mo" },
  { key: "carpet_cleaning", label: "Carpet Cleaning", icon: Sparkles, price: "From $50/room" },
];

export function NeighborhoodLanding({ config }: { config: NeighborhoodConfig }) {
  usePageTitle(`${config.name} Home Services | UpTend`);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative pt-28 pb-20 overflow-hidden bg-slate-900">
        <div className="absolute inset-0">
          <img src={config.heroImage} alt="" className="w-full h-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-slate-900/80" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-[#3B1D5A]/30 to-slate-900/60" />

        <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
          <p className="text-white/50 text-xs md:text-sm font-semibold uppercase tracking-[0.2em] mb-4">Home Intelligence</p>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight leading-[1.05]">
            {config.name}<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F47C20] to-orange-300">
              Home Services
            </span>
          </h1>
          <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto mb-3 leading-relaxed">
            {config.tagline}
          </p>
          <p className="text-white/50 text-base max-w-xl mx-auto mb-8">
            Serving {config.areas.join(", ")} and surrounding areas.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/book">
              <Button size="lg" className="bg-[#F47C20] hover:bg-[#E06910] text-white text-lg px-8 h-14 rounded-xl">
                Book a Pro <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/services">
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 text-lg px-8 h-14 rounded-xl">
                View All Services
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why UpTend */}
      <section className="py-16 bg-background">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Why {config.name} Homeowners Choose UpTend
          </h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            {config.description}
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center p-6">
              <CardContent className="pt-4">
                <ShieldCheck className="w-10 h-10 text-[#F47C20] mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">Background-Checked Pros</h3>
                <p className="text-muted-foreground text-sm">
                  Every pro serving {config.name} is verified, insured, and background-checked. No exceptions.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center p-6">
              <CardContent className="pt-4">
                <CheckCircle className="w-10 h-10 text-[#F47C20] mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">Guaranteed Price Ceiling</h3>
                <p className="text-muted-foreground text-sm">
                  Your quoted price is the maximum you pay. Period. No surprise charges, no scope creep without your approval.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center p-6">
              <CardContent className="pt-4">
                <Star className="w-10 h-10 text-[#F47C20] mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">George, Your Home Expert</h3>
                <p className="text-muted-foreground text-sm">
                  Get instant answers, photo-based quotes, and personalized home maintenance advice from our AI home expert.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Services Available in {config.name}
          </h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            All 11 service categories, all available in your neighborhood. One platform, one booking, done.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SERVICES.map((svc) => (
              <Link key={svc.key} href="/book">
                <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#F47C20]/10 flex items-center justify-center shrink-0 group-hover:bg-[#F47C20]/20 transition-colors">
                      <svc.icon className="w-6 h-6 text-[#F47C20]" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{svc.label}</h3>
                      <p className="text-sm text-muted-foreground">{svc.price}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Local Highlights */}
      <section className="py-16 bg-background">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Local {config.name} Tips
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {config.highlights.map((tip, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-[#F47C20]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-[#F47C20]" />
                </div>
                <p className="text-muted-foreground">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-900 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-slate-300 text-lg mb-8">
            Join {config.name} homeowners who trust UpTend for all their home services.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/book">
              <Button size="lg" className="bg-[#F47C20] hover:bg-[#E06910] text-white text-lg px-8 h-14 rounded-xl">
                Book Now <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// ---- NEIGHBORHOOD CONFIGS ----

const LAKE_NONA: NeighborhoodConfig = {
  slug: "lake-nona",
  name: "Lake Nona",
  tagline: "Background-checked pros, upfront pricing, and George, your personal home expert. Serving Lake Nona and surrounding communities.",
  description: "Lake Nona is one of Orlando's fastest-growing communities, with new construction, young families, and homeowners who expect quality. UpTend brings Home Intelligence to your neighborhood with transparent pricing and verified pros.",
  areas: ["Laureate Park", "Lake Nona Town Center", "Narcoossee", "Moss Park", "Boggy Creek"],
  highlights: [
    "New construction homes in Laureate Park often need landscaping setup, pressure washing after build dust, and garage organization within the first year.",
    "Florida's humidity means gutters in Lake Nona need cleaning at least twice a year to prevent mold and water damage.",
    "Pool homes near Lake Nona Town Center benefit from monthly pool service plans. Our plans start at $120/month.",
    "Hurricane season prep is critical. Gutter cleaning, tree trimming, and debris removal should be scheduled before June.",
    "HOA communities in Lake Nona often require regular exterior maintenance. Ask George about bundling services for savings.",
    "Moving into a new build? Our Moving Labor service handles the heavy lifting while our Home Cleaning team makes it move-in ready.",
  ],
  heroImage: "/images/site/hero-home-service.webp",
};

const WINTER_PARK: NeighborhoodConfig = {
  slug: "winter-park",
  name: "Winter Park",
  tagline: "Trusted home services for Winter Park's historic homes and modern neighborhoods. Background-checked pros, transparent pricing.",
  description: "Winter Park's mix of historic estates, mid-century homes, and new builds means every property has unique needs. UpTend's pros handle it all, from delicate gutter work on older homes to full landscaping overhauls.",
  areas: ["Baldwin Park", "Hannibal Square", "Park Avenue", "Mead Botanical Garden area", "Winter Park Village"],
  highlights: [
    "Historic homes in Winter Park often need specialized handyman work. Our pros are experienced with older construction methods and materials.",
    "Mature tree canopies mean more gutter debris. Schedule quarterly gutter cleaning to stay ahead of it.",
    "Brick paver driveways common in Baldwin Park look best with annual pressure washing. Starting at $149.",
    "Winter Park's HOA standards are strict. Regular landscaping and exterior maintenance keeps you compliant and your property value up.",
    "Older pool systems in established neighborhoods may need more frequent attention. Our pool plans include equipment health checks.",
    "Downsizing or estate cleanouts are common in Winter Park. Our junk removal team handles it respectfully and efficiently.",
  ],
  heroImage: "/images/site/hero-home-service.webp",
};

const DR_PHILLIPS: NeighborhoodConfig = {
  slug: "dr-phillips",
  name: "Dr. Phillips",
  tagline: "Premium home services for Dr. Phillips homeowners. Verified pros, guaranteed pricing, powered by George.",
  description: "Dr. Phillips is home to some of Orlando's most beautiful properties. From Bay Hill estates to Restaurant Row condos, UpTend provides the quality service your home deserves with complete price transparency.",
  areas: ["Bay Hill", "Sand Lake", "Restaurant Row", "Turkey Lake", "Windermere border"],
  highlights: [
    "Large lots in Bay Hill mean bigger landscaping jobs. Our pros provide free estimates and upfront pricing for any property size.",
    "Restaurant Row condos and townhomes benefit from regular carpet cleaning and home cleaning services to maintain resale value.",
    "Florida summers hit hard in Dr. Phillips. Schedule pressure washing for driveways and pool decks before the rainy season.",
    "Luxury pool homes need premium care. Our pool cleaning plans include chemical balancing, filter maintenance, and equipment inspections.",
    "Garage cleanouts are popular in Dr. Phillips, especially before hurricane season. Free up space for vehicles and emergency supplies.",
    "If you manage rental properties in the Sand Lake area, ask about our property manager pricing for volume services.",
  ],
  heroImage: "/images/site/hero-home-service.webp",
};

const WINDERMERE: NeighborhoodConfig = {
  slug: "windermere",
  name: "Windermere",
  tagline: "Home services built for Windermere's finest properties. Background-checked pros, upfront pricing, zero surprises.",
  description: "Windermere's lakefront estates, gated communities, and luxury homes demand top-tier service. UpTend matches you with verified, insured pros who understand high-end properties and deliver consistently.",
  areas: ["Keenes Pointe", "Isleworth", "Lake Butler", "Lake Down", "Windermere Trails"],
  highlights: [
    "Lakefront properties in Windermere need special attention. Erosion control, dock maintenance, and waterfront landscaping are all in scope.",
    "Gated community standards in Keenes Pointe and Isleworth require impeccable exterior maintenance. We help you stay compliant year-round.",
    "Large estates often need multiple services at once. Bundle junk removal, pressure washing, and landscaping for one-visit convenience.",
    "Windermere's mature oak trees drop serious debris. Quarterly gutter cleaning and seasonal yard cleanup keep your property pristine.",
    "Pool maintenance for oversized pools and spa combos is a specialty. Our pros handle everything from weekly care to equipment repair.",
    "Moving into a new Windermere estate? Our team handles move-in cleaning, furniture assembly, and garage organization.",
  ],
  heroImage: "/images/site/hero-home-service.webp",
};

const CELEBRATION: NeighborhoodConfig = {
  slug: "celebration",
  name: "Celebration",
  tagline: "Reliable home services for Celebration, FL. Verified pros who know your community's standards.",
  description: "Celebration's unique town design and strict community standards mean you need pros who get it. UpTend's verified service providers understand Celebration's HOA requirements and deliver work that meets every standard.",
  areas: ["Celebration Village", "North Village", "South Village", "Artisan Park", "Reunion"],
  highlights: [
    "Celebration's HOA is one of the strictest in Central Florida. Regular exterior maintenance, pressure washing, and landscaping are essential.",
    "The Celebration community's unique architecture requires careful handyman work. Our pros respect the town's aesthetic standards.",
    "Seasonal home maintenance is critical here. Schedule gutter cleaning before Florida's rainy season to prevent water damage.",
    "Townhome owners in North and South Village benefit from bundled cleaning and maintenance packages.",
    "Celebration's tree-lined streets mean constant yard debris. Regular landscaping keeps your curb appeal sharp.",
    "Hosting an event at home? Book a deep clean and pressure washing combo to get your property guest-ready.",
  ],
  heroImage: "/images/site/hero-home-service.webp",
};

// Page components
export function LakeNonaPage() { return <NeighborhoodLanding config={LAKE_NONA} />; }
export function WinterParkPage() { return <NeighborhoodLanding config={WINTER_PARK} />; }
export function DrPhillipsPage() { return <NeighborhoodLanding config={DR_PHILLIPS} />; }
export function WindermerePage() { return <NeighborhoodLanding config={WINDERMERE} />; }
export function CelebrationPage() { return <NeighborhoodLanding config={CELEBRATION} />; }
