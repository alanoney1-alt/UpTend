import { useLocation } from "wouter";
import { CheckCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

const SERVICES = [
  {
    id: "junk_removal",
    name: "ClearOut (Material Recovery)",
    price: "$99",
    unit: "starting (minimum load)",
    description: "Volume-based pricing by truck load. We load, haul, and dispose. Includes landfill fees. 1/8 truck: $179 | 1/4 truck: $279 | 1/2 truck: $379 | 3/4 truck: $449 | Full truck: $449",
    features: ["Heavy lifting included", "Eco-friendly disposal", "Before/After photos"],
    popular: true,
    bnplAvailable: true,
    bnplStartingPrice: 199,
  },
  {
    id: "pressure_washing",
    name: "FreshWash (Pressure Washing)",
    price: "$120",
    unit: "starting (600 sqft min)",
    description: "Industrial grade surface cleaning for driveways & walkways.",
    features: ["Chemical pre-treatment", "Surface sealing available", "Gum removal"],
  },
  {
    id: "gutter_cleaning",
    name: "GutterShield (Gutter Cleaning)",
    price: "$149",
    unit: "single story home",
    description: "Debris removal and downspout flushing.",
    features: ["Roof air-blown", "Downspouts tested", "Debris bagged"],
  },
  {
    id: "moving_labor",
    name: "LiftCrew (Moving Labor)",
    price: "$80",
    unit: "per hour per Pro",
    description: "Muscle only. You rent the truck, we load it. Choose how many Pros you need: 1 Pro = $80/hr, 2 Pros = $160/hr, 3 Pros = $240/hr.",
    features: ["Strong Pros", "Dollies included", "Shrink wrap service"],
  },
  {
    id: "light_demolition",
    name: "TearDown (Demolition)",
    price: "$199",
    unit: "starting",
    description: "Cabinets, sheds, fencing, decks, and non-load-bearing walls. Demo, cleanup, and haul-away in one visit. Hourly rates available.",
    features: ["Cabinet & countertop removal", "Fence & deck tear-down", "Full debris haul-away"],
  },
  {
    id: "garage_cleanout",
    name: "GarageReset (Garage Cleanout)",
    price: "$299",
    unit: "small garage",
    description: "Full sort, donate, recycle, and haul so you can actually park in your garage again. Medium: $499 | Large: $749 | XL: $999",
    features: ["Full sort & organize", "Donation coordination", "Sweep & clean after"],
    bnplAvailable: true,
    bnplPrice: 299,
  },
  {
    id: "truck_unloading",
    name: "UnloadPro (Truck/U-Haul Unloading)",
    price: "$80",
    unit: "per hour per Pro",
    description: "Professional unloading of your rental truck, pod, or trailer. Placed exactly where you want it. 1-hour minimum. Choose how many Pros you need: 1 Pro = $80/hr, 2 Pros = $160/hr, 3 Pros = $240/hr.",
    features: ["Furniture placement", "Shrink wrap removal", "Box stacking by room"],
  },
  {
    id: "home_consultation",
    name: "HomeScore (Home Audit)",
    price: "$49",
    unit: "flat rate",
    description: "Full digital inventory and maintenance check.",
    features: ["Video catalog of assets", "Safety hazard check", "Insurance report"],
  },
  {
    id: "home_cleaning",
    name: "FreshSpace (Home Cleaning)",
    price: "$99",
    unit: "starting (1-2 bed/1 bath)",
    description: "Professional home cleaning by trained Pros. Standard: $99/$149/$199/$249 by size | Deep: 1.5x | Move-In/Out: 2x | Recurring: save 10-15%",
    features: ["Room-by-room checklist", "Before/After photos", "Supplies included"],
    bnplAvailable: true,
    bnplStartingPrice: 199,
  },
];

export default function PublicPricing() {
  const [, setLocation] = useLocation();

  const handleBook = (serviceId: string) => {
    setLocation(`/auth?returnUrl=/book?service=${serviceId}`);
  };

  return (
    <div className="min-h-screen bg-background" data-testid="page-pricing">
      <Header />
      <div className="pt-24 pb-16">
        <div className="text-center max-w-3xl mx-auto px-6 mb-16">
          <h1 className="text-4xl font-bold mb-4" data-testid="text-pricing-headline">
            Transparent Pricing. No Surprises.
          </h1>
          <p className="text-lg text-muted-foreground" data-testid="text-pricing-subhead">
            See our national base rates below.{" "}
            <span className="text-foreground font-bold">
              Log in to see exact pricing
            </span>{" "}
            for your zip code.
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SERVICES.map((service) => (
            <div
              key={service.id}
              className={`relative bg-card rounded-2xl shadow-sm border p-8 flex flex-col hover-elevate ${
                service.popular
                  ? "border-primary ring-4 ring-primary/10"
                  : "border-border"
              }`}
              data-testid={`card-pricing-${service.id}`}
            >
              {service.popular && (
                <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl">
                  MOST POPULAR
                </div>
              )}

              <h3 className="text-xl font-bold" data-testid={`text-pricing-name-${service.id}`}>
                {service.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-2 min-h-[2.5rem]">
                {service.description}
              </p>

              <div className="my-6">
                <span className="text-4xl font-bold" data-testid={`text-pricing-price-${service.id}`}>
                  {service.price}
                </span>
                <span className="text-muted-foreground text-sm ml-2">/ {service.unit}</span>
                {(service as any).bnplAvailable && (
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

        <div className="max-w-4xl mx-auto mt-24 bg-slate-900 rounded-2xl p-12 text-center text-white relative overflow-hidden mx-6">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-4" data-testid="text-pricing-why-login">
              Why is the final price different?
            </h2>
            <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
              Our algorithm adjusts for local disposal fees, travel time, and demand in your
              specific neighborhood.
            </p>
            <Button
              size="lg"
              className="font-bold px-8"
              onClick={() => setLocation("/auth")}
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
