import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Droplets, Shield as LadderIcon, Package, Hammer, Stethoscope } from "lucide-react";

const services = [
  {
    icon: Truck,
    title: "Eco-Friendly Disposal & Decluttering",
    shortTitle: "Junk Removal",
    tagline: "We haul it all. Garages, furniture, appliances.",
    spin: "We don't just dump it. We sort, donate, and recycle to keep Orlando green.",
    price: "$99+",
    color: "text-primary",
    bgColor: "bg-primary/10",
    bookParam: "junk_removal",
  },
  {
    icon: Droplets,
    title: "Exterior Surface Restoration",
    shortTitle: "Pressure Washing",
    tagline: "Delete HOA violations instantly.",
    spin: "Commercial-grade cleaning for driveways, patios, and walkways to meet HOA standards.",
    price: "From $120",
    color: "text-primary",
    bgColor: "bg-primary/10",
    bookParam: "pressure_washing",
  },
  {
    icon: LadderIcon,
    title: "Drainage & Roof Protection",
    shortTitle: "Gutter Cleaning",
    tagline: "Protect your roof before the storm.",
    spin: "Prevent water damage and pest nesting with our debris-free guarantee.",
    price: "From $129",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10",
    bookParam: "gutter_cleaning",
  },
  {
    icon: Package,
    title: "On-Demand Logistics & Heavy Lifting",
    shortTitle: "Moving Helpers",
    tagline: "Strong backs for heavy lifting.",
    spin: "Certified movers to safely load, unload, or rearrange your heavy furniture.",
    price: "$80/hr",
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-500/10",
    bookParam: "moving_labor",
  },
  {
    icon: Hammer,
    title: "Structure Removal & Site Prep",
    shortTitle: "Light Demo",
    tagline: "Shed & carpet removal made easy.",
    spin: "Safe dismantling of sheds, carpets, and non-structural fixtures.",
    price: "From $199",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500/10",
    bookParam: "light_demolition",
  },
  {
    icon: Stethoscope,
    title: "AI Home Scan",
    shortTitle: "AI Home Scan",
    tagline: "Know your home inside out.",
    spin: "Full interior walkthrough and personalized maintenance report. Upgrade to AI Home Scan Aerial for $199 and add a drone-powered roof and gutter scan.",
    price: "Starting at $99",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-500/10",
    bookParam: "home_consultation",
  },
];

export function EssentialServices() {
  return (
    <section id="services" className="py-16 md:py-24" data-testid="section-essential-services">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
            UpTend Property Care Suite
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-services-headline">
            Maintain Your Home. Protect Your Asset.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From storm prep to spring cleaning, our Essential Property Maintenance services
            keep your home in top shape year-round.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {services.map((service) => (
            <Link
              key={service.bookParam}
              href={`/book?service=${service.bookParam}`}
              data-testid={`link-book-${service.bookParam}`}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
            >
              <Card
                className="p-4 md:p-6 hover-elevate flex flex-col items-center text-center h-full"
                data-testid={`card-service-${service.bookParam}`}
              >
                <div className={`flex items-center justify-center w-14 h-14 rounded-lg ${service.bgColor} ${service.color} shrink-0 mb-3`}>
                  <service.icon className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-sm md:text-base" data-testid={`text-service-title-${service.bookParam}`}>
                  {service.shortTitle}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 mb-3">
                  {service.tagline}
                </p>
                <Badge variant="secondary" className="mt-auto" data-testid={`badge-price-${service.bookParam}`}>
                  {service.price}
                </Badge>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
