import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, BadgeCheck, CreditCard, UserCheck, Building2, Camera, FileCheck, CheckCircle2 } from "lucide-react";

const trustFeatures = [
  {
    icon: BadgeCheck,
    title: "Background Checked",
    stat: "100%",
    description: "Every Pro undergoes comprehensive background verification before joining our platform.",
  },
  {
    icon: ShieldCheck,
    title: "Verified Pros",
    stat: "Insured",
    description: "Verified Pros carry their own liability insurance for your peace of mind. Look for the Verified Pro badge.",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    stat: "256-bit",
    description: "Your payment information is protected with bank-level encryption and secure processing.",
  },
];

const haulerRequirements = [
  { icon: UserCheck, text: "ID Verification" },
  { icon: Building2, text: "Business or Sole Proprietor Info" },
  { icon: Camera, text: "Vehicle Photos" },
  { icon: FileCheck, text: "Insurance Upload" },
];

export function TrustSafety() {
  return (
    <section className="py-16 md:py-24 bg-muted/30" data-testid="section-trust">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Trust & Safety</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your safety and satisfaction are our top priorities. Here's how we protect you.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-12">
          {trustFeatures.map((feature) => (
            <Card 
              key={feature.title} 
              className="p-6 lg:p-8 text-center hover-elevate"
              data-testid={`card-trust-${feature.title.toLowerCase().replace(/\s/g, "-")}`}
            >
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10">
                <feature.icon className="w-8 h-8 text-primary" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{feature.stat}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>

        <Card className="p-6 lg:p-8 bg-card border-2 border-primary/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Verified Pros Only
              </Badge>
              <h3 className="text-xl font-bold mb-2">Every Pro Must Complete</h3>
              <p className="text-muted-foreground">
                Before accepting any jobs, all Pros are required to verify their identity and credentials.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {haulerRequirements.map((req) => (
                <div 
                  key={req.text}
                  className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <req.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-medium">{req.text}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
