import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock, DollarSign, Phone, Zap } from "lucide-react";

const features = [
  { feature: "Junk Hauling Minimum", upyck: "$99", upyckHighlight: true, competitors: "$129-$199+" },
  { feature: "Response Time", upyck: "5 min avg", upyckHighlight: true, competitors: "2-48 hours" },
  { feature: "Same-Day Service", upyck: true, upyckHighlight: true, competitors: "Sometimes" },
  { feature: "Real-Time GPS", upyck: true, upyckHighlight: true, competitors: false },
  { feature: "Upfront Pricing", upyck: true, upyckHighlight: true, competitors: "Quote on arrival" },
  { feature: "Direct Pro Chat", upyck: true, upyckHighlight: true, competitors: "Call center" },
  { feature: "No Lead Fees", upyck: true, upyckHighlight: true, competitors: false },
  { feature: "Moving Price Per Mile", upyck: "$1/mile", upyckHighlight: true, competitors: "Varies/$2-3/mile" },
];

export function CompetitorComparison() {
  return (
    <section className="py-16 md:py-24 bg-muted/30" data-testid="section-comparison">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">Why UpTend?</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Lower Cost. Faster Service. Better Experience.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            No middlemen. No call centers. No waiting days for callbacks. 
            Connect directly with verified Pros and save.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <Card className="p-6 border-primary/30 bg-primary/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-bold">UpTend</h3>
                <p className="text-sm text-muted-foreground">The smart choice</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-green-500" />
                <span><strong>$99 minimum</strong> for junk hauling</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-green-500" />
                <span><strong>5 minute</strong> average response time</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500" />
                <span><strong>$1/mile</strong> for moving services</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500" />
                <span><strong>Direct connection</strong> to your Pro</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500" />
                <span><strong>Real-time GPS</strong> tracking</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Phone className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-muted-foreground">Traditional Services</h3>
                <p className="text-sm text-muted-foreground">The old way</p>
              </div>
            </div>
            <div className="space-y-4 text-muted-foreground">
              <div className="flex items-center gap-3">
                <X className="w-5 h-5 text-red-400" />
                <span>$129-$199+ minimum charges</span>
              </div>
              <div className="flex items-center gap-3">
                <X className="w-5 h-5 text-red-400" />
                <span>24-48 hour wait for appointments</span>
              </div>
              <div className="flex items-center gap-3">
                <X className="w-5 h-5 text-red-400" />
                <span>"We'll give you a quote when we arrive"</span>
              </div>
              <div className="flex items-center gap-3">
                <X className="w-5 h-5 text-red-400" />
                <span>Call centers and callbacks</span>
              </div>
              <div className="flex items-center gap-3">
                <X className="w-5 h-5 text-red-400" />
                <span>No visibility until arrival</span>
              </div>
            </div>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium">Feature</th>
                  <th className="text-center p-4 font-bold text-primary">UpTend</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">Others</th>
                </tr>
              </thead>
              <tbody>
                {features.map((row, idx) => (
                  <tr key={row.feature} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                    <td className="p-4 font-medium">{row.feature}</td>
                    <td className="p-4 text-center">
                      {typeof row.upyck === "boolean" ? (
                        row.upyck ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-red-400 mx-auto" />
                        )
                      ) : (
                        <span className={row.upyckHighlight ? "font-bold text-primary" : ""}>
                          {row.upyck}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center text-muted-foreground">
                      {typeof row.competitors === "boolean" ? (
                        row.competitors ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-red-400 mx-auto" />
                        )
                      ) : (
                        row.competitors
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Comparison based on publicly available pricing and service information. Actual competitor pricing may vary.
          </p>
        </div>

      </div>
    </section>
  );
}
