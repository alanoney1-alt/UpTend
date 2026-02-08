import { Card } from "@/components/ui/card";
import { TrendingUp, ScanSearch, Leaf } from "lucide-react";

const valueProps = [
  {
    icon: TrendingUp,
    title: "Every Job Increases Your Home's Value",
    label: "The Home Score",
    description: "When you book UpTend, we create a Certified Maintenance Record. Prove to buyers and insurers that your home is cared for.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: ScanSearch,
    title: "Free Asset Protection",
    label: "The Digital Inventory",
    description: "Our Pros scan your items while they work. You get a free digital inventory of your home's assets for insurance claims.",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    icon: Leaf,
    title: "Tax Write-Offs, Not Landfills",
    label: "The Green Promise",
    description: "We prioritize donation. You get the IRS tax receipt right in the app.",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
];

export function WhyBetter() {
  return (
    <section className="py-16 md:py-24 bg-muted/30" data-testid="section-why-better">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
            The Hidden Value
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-why-better-headline">
            Why We Are Better
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every UpTend job does more than clean your space. It builds lasting value for your home.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {valueProps.map((prop) => (
            <Card key={prop.label} className="p-8 text-center" data-testid={`card-value-${prop.label.toLowerCase().replace(/\s/g, "-")}`}>
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${prop.bgColor} ${prop.color} mb-6`}>
                <prop.icon className="w-8 h-8" />
              </div>
              <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
                {prop.label}
              </p>
              <h3 className="text-xl font-bold mb-3">{prop.title}</h3>
              <p className="text-muted-foreground">{prop.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
