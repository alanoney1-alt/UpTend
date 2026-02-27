import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Shield, Star, ArrowRight, Phone } from "lucide-react";
import { Link } from "wouter";
import heroImage from "@assets/generated_images/small_pickup_hauling_truck.png";

export function HeroSection() {
  return (
    <section
      className="relative min-h-[85vh] flex items-center pt-16"
      data-testid="section-hero"
    >
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Professional home services"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 to-black/50" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-28">
        <div className="max-w-3xl">
          <Badge className="mb-6 bg-primary/90 text-white border-primary/50 backdrop-blur-sm" data-testid="badge-tagline">
            Clear the Clutter. Boost the Value.
          </Badge>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 tracking-tight" data-testid="text-hero-headline">
            The All-in-One App for{" "}
            <span className="text-primary">Junk, Cleaning & Moves.</span>
          </h1>

          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl" data-testid="text-hero-subheadline">
            Don't just hire a random guy with a truck. Hire a verified Pro who
            documents the work, boosts your Home Maintenance Score, and recycles
            responsibly.
          </p>

          <p className="text-sm font-medium text-white/60 mb-8" data-testid="text-hero-hook">
            Real-Time Matching. No app download required.
          </p>

          <div className="flex flex-wrap gap-4 mb-10">
            <Link href="/book">
              <Button size="lg" className="gap-2 text-lg" data-testid="button-hero-book">
                Book Now
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/quote">
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white bg-white/5 backdrop-blur-sm"
                data-testid="button-hero-quote"
              >
                Get a Free Quote
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-2 mb-6 text-sm text-white/70">
            <Phone className="w-4 h-4 text-primary" />
            <span>Prefer to talk?{" "}
              <a href="tel:+14073383342" className="text-primary hover:text-primary/80 underline underline-offset-2 font-medium">
                Call George at (407) 338-3342
              </a>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Clock className="w-4 h-4 text-primary" />
              <span>Same-day service</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Shield className="w-4 h-4 text-primary" />
              <span>Verified & insured</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Star className="w-4 h-4 text-primary" />
              <span>Background-checked pros</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
