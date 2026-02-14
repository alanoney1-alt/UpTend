import { usePageTitle } from "@/hooks/use-page-title";
import { useLocation } from "wouter";
import { CheckCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { useAuth } from "@/hooks/use-auth";

const SERVICES = [
  {
    id: "home_consultation",
    name: <>AI Home Scan</>,
    price: "$99",
    unit: "flat rate",
    description: "Full digital inventory and maintenance check.",
    features: ["Video catalog of assets", "Safety hazard check", "Insurance report"],
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
    price: "$299",
    unit: "small garage",
    description: "Full sort, donate, recycle, and haul so you can actually park in your garage again. Medium: $499 | Large: $749 | XL: $999",
    features: ["Full sort & organize", "Donation coordination", "Sweep & clean after"],
    bnplAvailable: true,
    bnplPrice: 299,
  },
  {
    id: "moving_labor",
    name: <>Moving Labor</>,
    price: "$80",
    unit: "per hour per Pro",
    description: "Furniture moving, truck/pod unloading, or general labor. You pick the task, we supply the muscle. 1 Pro = $80/hr, 2 Pros = $160/hr, 3 Pros = $240/hr.",
    features: ["Furniture Moving — $80/hr per Pro", "Truck/Pod Unloading — $80/hr per Pro", "General Labor — $80/hr per Pro", "Dollies & shrink wrap included"],
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
    price: "$39",
    unit: "per room",
    description: "Professional carpet cleaning. $99 minimum (covers up to 2 rooms standard).",
    features: [
      "Standard Steam Clean: $39/room — extraction, pre-treatment, vacuum",
      "Deep Clean: $59/room — + enzyme treatment, heavy soil agitation, slow dry pass",
      "Pet Treatment: $69/room — + pet odor enzyme + sanitizer",
      "Hallway: $25 each | Stairs: $25/flight",
      "Scotchgard/Protectant: $20/room add-on",
      "3BR/2BA Package: $149 | 4-5BR Package: $199 (all rooms + hallways)",
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
    description: "Debris removal and downspout flushing. Tiers: 1-Story $129 | 1-Story Large $169 | 2-Story $199 | 2-Story Large $249 | 3-Story $299+. Add-ons: gutter guards ($4-6/ft), downspout flush ($15/ea), minor repair ($75).",
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
    price: "$89",
    unit: "per month",
    description: "Regular pool maintenance to keep your water crystal clear.",
    features: [
      "Basic: $89/mo — Weekly chemicals, skim surface, empty baskets",
      "Standard: $129/mo — + brush walls, vacuum, filter check",
      "Full Service: $169/mo — + tile cleaning, equipment monitoring, filter cleaning",
      "One-Time Deep Clean: $199 — Deep clean for neglected/green pools",
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

  const handleBook = (serviceId: string) => {
    setLocation(`/book?service=${serviceId}`);
  };

  return (
    <div className="min-h-screen bg-background" data-testid="page-pricing">
      <Header />
      <div className="pt-24 pb-16">
        <div className="text-center max-w-3xl mx-auto px-6 mb-16">
          <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-pricing-headline">
            Transparent Pricing. No Surprises.
          </h1>
          <p className="text-lg text-muted-foreground" data-testid="text-pricing-subhead">
            {isAuthenticated ? (
              "Flat rates, no hidden fees. What you see is what you pay."
            ) : (
              <>
                See our national base rates below.{" "}
                <span className="text-foreground font-bold">
                  Log in to see exact pricing
                </span>{" "}
                for your zip code.
              </>
            )}
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                    or 4 payments of ${Math.ceil(((service as any).bnplPrice || (service as any).bnplStartingPrice) / 4)}
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
                Check Availability <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-3">
                <ShieldCheck className="w-3 h-3 inline mr-1" /> Liability Insured
              </p>
            </div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto mt-24 bg-slate-900 rounded-2xl p-6 md:p-12 text-center text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-4" data-testid="text-pricing-why-login">
              Why is the final price different?
            </h2>
            <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
              Our algorithm adjusts for local disposal fees, travel time, and demand in your
              specific neighborhood.
            </p>
            <Button
              size="lg"
              className="font-bold px-8"
              onClick={() => setLocation("/book")}
              data-testid="button-pricing-get-exact"
            >
              Get My Exact Price
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
