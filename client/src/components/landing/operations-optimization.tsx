import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Route, DollarSign, MessageSquareText, BrainCircuit, Zap, TrendingUp, Fuel, Clock } from "lucide-react";

const advantages = [
  {
    icon: Route,
    title: "AI Route Optimization",
    description: "Our AI maps the fastest routes in real-time, cutting drive time and fuel costs so your Pro arrives faster and wastes less.",
    stat: "Save 30%",
    statLabel: "on fuel & time",
    statIcon: Fuel,
  },
  {
    icon: DollarSign,
    title: "Dynamic Pricing",
    description: "Prices adjust automatically based on demand, time of day, and availability. You always get a fair price, Pros always earn what the market supports.",
    stat: "Peak Smart",
    statLabel: "pricing engine",
    statIcon: TrendingUp,
  },
  {
    icon: MessageSquareText,
    title: "Booking Automation",
    description: "No phone trees. No hold music. Our AI handles scheduling, quotes, and customer questions instantly so you get answers in seconds, not hours.",
    stat: "24/7",
    statLabel: "instant booking",
    statIcon: Clock,
  },
];

export function OperationsOptimization() {
  return (
    <section className="py-16 md:py-24" data-testid="section-operations-optimization">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20" data-testid="badge-ai-advantage">
            <BrainCircuit className="w-3 h-3 mr-1" />
            Smart Operations
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="heading-operations">
            We Run on AI. They Run on Guesswork.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-operations-description">
            Every route, every price, every booking is optimized by AI in real-time.
            Traditional providers can't compete with that.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-12">
          {advantages.map((item) => (
            <Card
              key={item.title}
              className="relative p-6 lg:p-8 hover-elevate"
              data-testid={`card-advantage-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground">
                  <item.icon className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                  <item.statIcon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">{item.stat}</span>
                  <span className="text-xs text-muted-foreground">{item.statLabel}</span>
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-muted-foreground">{item.description}</p>
            </Card>
          ))}
        </div>

        <Card className="p-6 md:p-8 border-primary/30 bg-primary/5" data-testid="card-ai-advantage-summary">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground shrink-0">
              <Zap className="w-8 h-8" />
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-xl md:text-2xl font-bold mb-2" data-testid="heading-ai-advantage">
                UpTend is the smarter service. Competitors stay manual.
              </h3>
              <p className="text-muted-foreground max-w-2xl" data-testid="text-ai-advantage">
                While other services rely on phone calls, paper routes, and fixed pricing,
                UpTend uses artificial intelligence to deliver faster service, smarter pricing,
                and a better experience for everyone.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
