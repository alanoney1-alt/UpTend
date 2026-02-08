import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, Shield, Clock, DollarSign, ArrowRight } from "lucide-react";

const benefits = [
  {
    icon: Shield,
    title: "Verified Professionals",
    description: "Every Pro undergoes background checks and verification before joining our platform.",
  },
  {
    icon: Clock,
    title: "Same-Day Service",
    description: "Get matched with available Pros in your area for fast, reliable service.",
  },
  {
    icon: DollarSign,
    title: "Transparent Pricing",
    description: "Know exactly what you'll pay upfront. No hidden fees, no surprises.",
  },
];

export function ProviderShowcase() {
  return (
    <section id="providers" className="py-16 md:py-24" data-testid="section-providers">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="outline">
            Coming Soon
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Pros Network</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We&rsquo;re building a network of verified Pros in the Orlando area with proven accountability.
            Want to be among the first?
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {benefits.map((benefit, index) => (
            <Card 
              key={index} 
              className="p-6 text-center"
              data-testid={`card-benefit-${index}`}
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <benefit.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground">{benefit.description}</p>
            </Card>
          ))}
        </div>

        <Card className="p-8 bg-primary/5 border-primary/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Truck className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Become a Pro</h3>
                <p className="text-muted-foreground">
                  Own a truck? Join our verified network and start building your impact record.
                </p>
              </div>
            </div>
            <Link href="/drive">
              <Button size="lg" data-testid="button-become-pycker">
                Learn More
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </section>
  );
}
