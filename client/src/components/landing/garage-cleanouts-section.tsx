import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Truck, 
  Package, 
  Sparkles,
  Star,
  Timer
} from "lucide-react";
import { Link } from "wouter";
import { GARAGE_CLEANOUT_PACKAGES } from "@/lib/bundle-pricing";

// Map shared packages to landing page format
const garagePackages = GARAGE_CLEANOUT_PACKAGES.map(pkg => ({
  id: pkg.id,
  name: pkg.name,
  price: pkg.price,
  monthly: Math.round(pkg.price / 4),
  description: pkg.description,
  items: pkg.itemsEstimate,
  time: pkg.duration,
  featured: false,
}));

const howItWorks = [
  {
    step: 1,
    title: "Book Online",
    subtitle: "Quick & easy",
    icon: Timer,
  },
  {
    step: 2,
    title: "Pro Arrives",
    subtitle: "Same-day available",
    icon: Truck,
  },
  {
    step: 3,
    title: "We Load Everything",
    subtitle: "You relax",
    icon: Package,
  },
  {
    step: 4,
    title: "Done!",
    subtitle: "Garage is empty",
    icon: Sparkles,
  },
];

export function GarageCleanoutsSection() {
  const [showAllPackages, setShowAllPackages] = useState(false);
  
  const visiblePackages = showAllPackages ? garagePackages : garagePackages.slice(0, 2);

  return (
    <section className="py-16 md:py-24 bg-muted/30" data-testid="section-garage-cleanouts">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/30">
            <Home className="w-3 h-3 mr-1" />
            Complete Service
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Garage Cleanout Packages
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Fixed-price packages for hassle-free garage cleanouts. No hidden fees, no surprises.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {howItWorks.map((step, index) => (
            <div key={step.step} className="text-center relative">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <step.icon className="w-7 h-7 text-primary" />
              </div>
              <div className="font-semibold text-sm">{step.title}</div>
              <div className="text-xs text-muted-foreground">{step.subtitle}</div>
              {index < howItWorks.length - 1 && (
                <div className="hidden md:block absolute top-7 left-[60%] w-[80%] h-0.5 bg-primary/20" />
              )}
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {visiblePackages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`p-6 relative ${
                pkg.featured ? "ring-2 ring-primary shadow-lg" : ""
              }`}
              data-testid={`card-garage-package-${pkg.id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Home className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-bold">{pkg.name}</h3>
                  </div>
                  <p className="text-muted-foreground mt-1">{pkg.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">${pkg.price}</div>
                  <div className="text-sm text-muted-foreground">
                    or ${pkg.monthly}/mo
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  <span>{pkg.items}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{pkg.time}</span>
                </div>
              </div>

              <Link href={`/booking?service=garage_cleanout&package=${pkg.id}&price=${pkg.price}`}>
                <Button 
                  className="w-full" 
                  variant={pkg.featured ? "default" : "outline"}
                  data-testid={`button-book-garage-${pkg.id}`}
                >
                  Book Now
                </Button>
              </Link>
            </Card>
          ))}
        </div>

        {!showAllPackages && (
          <div className="text-center mb-12">
            <Button
              variant="ghost"
              onClick={() => setShowAllPackages(true)}
              className="gap-2"
              data-testid="button-show-more-packages"
            >
              Show More Packages
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        )}

        {showAllPackages && (
          <div className="text-center mb-12">
            <Button
              variant="ghost"
              onClick={() => setShowAllPackages(false)}
              className="gap-2"
              data-testid="button-show-less-packages"
            >
              Show Less
              <ChevronUp className="w-4 h-4" />
            </Button>
          </div>
        )}

      </div>
    </section>
  );
}
