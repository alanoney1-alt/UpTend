import { usePageTitle } from "@/hooks/use-page-title";
import { useLocation } from "wouter";
import { CheckCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";

const SERVICES = [
  {
    id: "home_consultation",
    name: <>Home DNA Scan</>,
    price: "$99",
    unit: "Standard",
    description: "Complete home documentation that protects your investment. Our Pro walks every room capturing video, photos, and condition notes — then AI analyzes it all into an actionable report. Use it for insurance claims, maintenance planning, or pre-sale prep.",
    features: [
      "Standard ($99) — Interior walkthrough: room-by-room video, appliance inventory, condition scoring, maintenance priority list, insurance-ready documentation",
      "Aerial ($249) — Everything in Standard + licensed drone footage of roof, gutters, siding, landscaping, and foundation perimeter. Full exterior condition report",
      "$49 credit back on your next UpTend booking",
      "Protects property value • Catches issues before they're expensive • Peace of mind",
    ],
  },
  {
    id: "handyman",
    name: <>Handyman Services</>,
    price: "$75",
    unit: "per hour (1hr minimum)",
    description: "General repairs, installations, and fixes around the home. 1-hour minimum per visit.",
    features: ["Drywall & painting", "Furniture assembly", "Minor plumbing & electrical"],
  },
  {
    id: "junk_removal",
    name: <>Junk Removal</>,
    price: "$99",
    unit: "starting (minimum load)",
    description: "Volume-based pricing by truck load. We load, haul, and dispose. Includes landfill fees. 1/8 truck: $179 | 1/4 truck: $279 | 1/2 truck: $379 | 3/4 truck: $449 | Full truck: $549",
    features: ["Heavy lifting included", "Eco-friendly disposal", "Before/After photos"],
    bnplAvailable: true,
    bnplStartingPrice: 199,
  },
  {
    id: "garage_cleanout",
    name: <>Garage Cleanout</>,
    price: "$129",
    unit: "starting (mini)",
    description: "Full sort, donate, recycle, and haul so you can actually park in your garage again. Mini: $129 | Small: $299 | Medium: $499 | Large: $749 | XL: $999",
    features: ["Full sort & organize", "Donation coordination", "Sweep & clean after"],
    bnplAvailable: true,
    bnplPrice: 299,
  },
  {
    id: "moving_labor",
    name: <>Moving Labor</>,
    price: "$65",
    unit: "per hour per mover",
    description: "Furniture moving, truck/pod unloading, or general labor. You pick the task, we supply the muscle. 2-mover minimum. 2 Pros = $130/hr, 3 Pros = $195/hr, 4 Pros = $260/hr.",
    features: ["Furniture Moving — $65/hr per mover", "Truck/Pod Unloading — $65/hr per mover", "General Labor — $65/hr per mover", "Dollies & shrink wrap included"],
  },
  {
    id: "home_cleaning",
    name: <>Home Cleaning</>,
    price: "$99",
    unit: "starting (1-2 bed/1 bath)",
    description: "Professional home cleaning by trained Pros. Standard: $99/$149/$199/$249 by size | Deep: 1.5x | Move-In/Out: 2x | Recurring: save 10-15%",
    features: ["Room-by-room checklist", "Before/After photos", "Supplies included"],
    bnplAvailable: true,
    bnplStartingPrice: 199,
  },
  {
    id: "carpet_cleaning",
    name: <>Carpet Cleaning</>,
    price: "$50",
    unit: "per room",
    description: "Professional carpet cleaning. $100 minimum (covers up to 2 rooms standard).",
    features: [
      "Standard Steam Clean: $50/room — extraction, pre-treatment, vacuum",
      "Deep Clean: $75/room — + enzyme treatment, heavy soil agitation, slow dry pass",
      "Pet Treatment: $89/room — + pet odor enzyme + sanitizer",
      "Hallway: $25 each | Stairs: $25/flight",
      "Scotchgard/Protectant: $20/room add-on",
      "3BR/2BA Package: $129 | 4-5BR Package: $215 (all rooms + hallways)",
    ],
  },
  {
    id: "landscaping",
    name: <>Landscaping</>,
    price: "$49",
    unit: "one-time mow",
    description: "Professional lawn care — one-time or recurring monthly service.",
    features: [
      "One-Time Mow: $49 (≤¼ acre) | $79 (≤½ acre)",
      "Yard Cleanup: $149–$299 (overgrown lot, debris, trimming)",
      "— Recurring Monthly (weekly service) —",
      "Mow & Go: $99/mo (≤¼ acre) | $149/mo (≤½ acre) — mow + blow + edging",
      "Full Service: $159/mo (≤¼ acre) | $219/mo (≤½ acre) — + trim, weed beds, hedge trim",
      "Premium: $249/mo (≤¼ acre) | $329/mo (≤½ acre) — + seasonal flowers, mulch, irrigation",
    ],
  },
  {
    id: "gutter_cleaning",
    name: <>Gutter Cleaning</>,
    price: "$129",
    unit: "starting (1-story, up to 150 linear ft)",
    description: "Debris removal and downspout flushing. Tiers: 1-Story $129 | 2-Story $199 | 2-Story Large $285 | 3-Story $350+. Add-ons: gutter guards ($4-6/ft), downspout flush ($15/ea), minor repair ($75).",
    features: ["Roof air-blown", "Downspouts tested", "Debris bagged", "5 tiers by size"],
  },
  {
    id: "pressure_washing",
    name: <>Pressure Washing</>,
    price: "$120",
    unit: "starting (600 sqft min)",
    description: "Industrial grade surface cleaning for driveways & walkways.",
    features: ["Chemical pre-treatment", "Surface sealing available", "Gum removal"],
  },
  {
    id: "pool_cleaning",
    name: <>Pool Cleaning</>,
    price: "$99",
    unit: "per month",
    description: "Regular pool maintenance to keep your water crystal clear.",
    features: [
      "Basic: $99/mo — Weekly chemicals, skim surface, empty baskets",
      "Standard: $165/mo — + brush walls, vacuum, filter check",
      "Full Service: $210/mo — + tile cleaning, equipment monitoring, filter cleaning",
      "One-Time Deep Clean: $249 — Deep clean for neglected/green pools",
    ],
  },
  {
    id: "light_demolition",
    name: <>Light Demolition</>,
    price: "$199",
    unit: "starting",
    description: "Cabinets, sheds, fencing, decks, and non-load-bearing walls. Demo, cleanup, and haul-away in one visit. Hourly rates available.",
    features: ["Cabinet & countertop removal", "Fence & deck tear-down", "Full debris haul-away"],
  },
];

export default function PublicPricing() {
  usePageTitle("Pricing | UpTend Home Services Orlando");
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const handleBook = (serviceId: string) => {
    setLocation(`/book?service=${serviceId}`);
  };

  return (
    <div className="min-h-screen bg-background" data-testid="page-pricing">
      <Header />
      {/* Free Home Scan Banner */}
      <div className="mt-20 bg-gradient-to-r from-[#F47C20] to-orange-500 text-white py-4 px-4 text-center">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3">
          <span className="font-bold text-sm md:text-base">Did you know? You can scan your home for FREE and earn $25+ in credits!</span>
          <a href="/ai/home-scan" className="inline-flex items-center gap-1 bg-white text-[#F47C20] font-bold text-sm px-4 py-1.5 rounded-full hover:bg-orange-50 transition-colors">
            Learn More <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      <div className="pt-8 pb-16">
        <div className="text-center max-w-3xl mx-auto px-6 mb-16">
          <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-pricing-headline">
            {t("pricing.headline")}
          </h1>
          <p className="text-lg text-muted-foreground" data-testid="text-pricing-subhead">
            {isAuthenticated ? (
              t("pricing.subhead_auth")
            ) : (
              <>
                {t("pricing.subhead_guest_prefix")}{" "}
                <span className="text-foreground font-bold">
                  {t("pricing.subhead_guest_bold")}
                </span>{" "}
                {t("pricing.subhead_guest_suffix")}
              </>
            )}
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {SERVICES.map((service) => (
            <div
              key={service.id}
              className="relative bg-card rounded-2xl shadow-sm border border-border p-5 md:p-8 flex flex-col hover-elevate"
              data-testid={`card-pricing-${service.id}`}
            >

              <h3 className="text-xl font-bold" data-testid={`text-pricing-name-${service.id}`}>
                {service.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-2 min-h-[2.5rem]">
                {service.description}
              </p>

              <div className="my-6">
                <span className="text-3xl md:text-4xl font-bold" data-testid={`text-pricing-price-${service.id}`}>
                  {service.price}
                </span>
                <span className="text-muted-foreground text-sm ml-2">/ {service.unit}</span>
                {(service as any).bnplAvailable && ((service as any).bnplPrice || (service as any).bnplStartingPrice) >= 199 && (
                  <p className="text-xs text-primary mt-2">
                    {t("pricing.or_payments")} ${Math.ceil(((service as any).bnplPrice || (service as any).bnplStartingPrice) / 4)}
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {service.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleBook(service.id)}
                className="w-full text-lg font-bold"
                size="lg"
                data-testid={`button-book-${service.id}`}
              >
                {t("common.book_now")} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

            </div>
          ))}
        </div>

        {/* Liability Protection Section */}
        <div className="max-w-4xl mx-auto mt-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 md:p-8 border border-blue-200">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-4">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">
              Comprehensive Liability Protection
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Every service is backed by our multi-tier protection system, giving you peace of mind.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-blue-100">
              <div className="text-blue-600 font-semibold mb-2">LLC Pros with Insurance</div>
              <div className="text-2xl font-bold text-gray-900 mb-2">Up to $25,000</div>
              <p className="text-sm text-gray-600">
                Platform covers damages up to $25K per incident. Beyond that, the pro's own $1M+ liability policy takes over.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-blue-100">
              <div className="text-blue-600 font-semibold mb-2">Standard Pros</div>
              <div className="text-2xl font-bold text-gray-900 mb-2">Up to $10,000</div>
              <p className="text-sm text-gray-600">
                Platform provides blanket coverage up to $10K per incident for property damage and issues.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-blue-100">
              <div className="text-blue-600 font-semibold mb-2">Bodily Injury</div>
              <div className="text-2xl font-bold text-gray-900 mb-2">$5,000 + Escalation</div>
              <p className="text-sm text-gray-600">
                Platform covers medical expenses up to $5K, then immediately escalates to the pro's insurance.
              </p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-100 rounded-lg">
            <p className="text-sm text-blue-800 text-center">
              <strong>Structural damage</strong> is immediately escalated to the pro's insurer while platform caps still apply.
              All claims are reviewed within 48 hours.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mt-24 bg-slate-900 rounded-2xl p-6 md:p-12 text-center text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-4" data-testid="text-pricing-why-login">
              {t("pricing.why_different")}
            </h2>
            <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
              {t("pricing.why_different_desc")}
            </p>
            <Button
              size="lg"
              className="font-bold px-8"
              onClick={() => setLocation("/book")}
              data-testid="button-pricing-get-exact"
            >
              {t("pricing.get_exact")}
            </Button>
          </div>
          <div className="absolute top-0 left-0 w-64 h-64 bg-primary/40 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary rounded-full blur-3xl translate-x-1/2 translate-y-1/2 opacity-30" />
        </div>
      </div>
      <Footer />
    </div>
  );
}
