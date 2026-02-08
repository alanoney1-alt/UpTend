import { Card } from "@/components/ui/card";
import { Shield, UserCheck, Home, Building2 } from "lucide-react";

const promises = [
  {
    icon: Shield,
    title: "Fully Insured",
    description: "Every job is backed by our $1,000,000 Liability Policy.",
  },
  {
    icon: UserCheck,
    title: "Background Verified",
    description: "Every Specialist passes a strict multi-state criminal background check.",
  },
  {
    icon: Home,
    title: "Property Protection",
    description: "We use equipment that is safe for your surfaces and landscape.",
  },
  {
    icon: Building2,
    title: "HOA Compliant",
    description: "Our work meets the strict standards of Central Florida community associations.",
  },
];

export function SafetyPromise() {
  return (
    <section className="py-16 md:py-24" data-testid="section-safety-promise">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-safety-headline">
            The UpTend Safety Promise
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your home is your biggest asset. We treat it that way.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {promises.map((promise) => (
            <Card key={promise.title} className="p-6 text-center" data-testid={`card-promise-${promise.title.toLowerCase().replace(/\s/g, "-")}`}>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                <promise.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold mb-2">{promise.title}</h3>
              <p className="text-sm text-muted-foreground">{promise.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
