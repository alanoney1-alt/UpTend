import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, Smartphone, Truck } from "lucide-react";

const features = [
  "Verified smart matching finds your ideal Pro",
  "Transparent pricing - know costs before you book",
  "Optimized routing - faster arrivals, lower carbon impact",
  "Verified sustainability - every disposal tracked and accountable",
  "Same-day service - real impact, not next week",
];

export function CTASection() {
  return (
    <section className="py-16 md:py-24 bg-primary text-primary-foreground" data-testid="section-cta">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge className="mb-6 bg-white/20 text-white border-white/30">
              Get Started Today
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Home Protection. Pro Empowerment. Proven Impact.
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-lg">
              Verified Pros, transparent pricing, and measurable sustainability on every job.
              Book now, match instantly, done by dinner.
            </p>

            <ul className="space-y-3 mb-8">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-white/80" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-4">
              <Link href="/book">
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="bg-white text-primary hover:bg-white/90"
                  data-testid="button-cta-book"
                >
                  Book a Pickup
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/pro/dashboard">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 bg-white/5 backdrop-blur-sm"
                  data-testid="button-cta-become-hauler"
                >
                  Become a Pro
                  <Truck className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div className="relative">
              <div className="w-64 h-[500px] bg-white/10 backdrop-blur-sm rounded-[40px] border border-white/20 p-3 shadow-2xl">
                <div className="w-full h-full bg-background rounded-[32px] overflow-hidden">
                  <div className="h-full flex flex-col">
                    <div className="bg-primary p-4">
                      <div className="flex items-center gap-2 text-white">
                        <Truck className="w-6 h-6" />
                        <span className="font-bold">UpTend</span>
                      </div>
                    </div>
                    <div className="flex-1 p-4 space-y-4">
                      <div className="bg-muted rounded-lg p-3">
                        <div className="text-xs text-muted-foreground mb-1">Service</div>
                        <div className="font-medium text-foreground text-sm">Furniture Moving</div>
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <div className="text-xs text-muted-foreground mb-1">Location</div>
                        <div className="font-medium text-foreground text-sm">123 Main St</div>
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <div className="text-xs text-muted-foreground mb-1">Estimated Cost</div>
                        <div className="font-bold text-primary text-lg">$129 - $159</div>
                      </div>
                      <div className="mt-auto">
                        <div className="bg-primary text-primary-foreground text-center py-3 rounded-lg font-medium text-sm">
                          Book a Verified Pro
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Smartphone className="w-12 h-12 text-white/80" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
