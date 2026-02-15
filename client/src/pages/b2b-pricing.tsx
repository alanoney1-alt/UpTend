import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Check, Building2, Home, HardHat, Landmark, Star, ArrowRight, HelpCircle } from "lucide-react";

type Plan = {
  id: string;
  name: string;
  segment: string;
  tier: string;
  pricePerUnit: number;
  unitType: string;
  maxUnits: number | null;
  features: string[];
  transactionFeePct: number;
};

const segmentConfig = {
  hoa: { label: "HOA", icon: Home, unit: "unit", color: "bg-orange-500" },
  pm: { label: "Property Management", icon: Building2, unit: "door", color: "bg-amber-500" },
  construction: { label: "Construction", icon: HardHat, unit: "project", color: "bg-orange-600" },
  government: { label: "Government", icon: Landmark, unit: "", color: "bg-amber-600" },
};

function formatPrice(plan: Plan) {
  if (plan.unitType === "flat_yearly") return `$${plan.pricePerUnit.toLocaleString()}/yr`;
  if (plan.unitType === "flat_monthly") return `$${plan.pricePerUnit}/mo`;
  return `$${plan.pricePerUnit}`;
}

function formatUnit(plan: Plan) {
  if (plan.unitType === "flat_yearly" || plan.unitType === "flat_monthly") return "";
  return `/${plan.unitType}/mo`;
}

function PlanCard({ plan, featured }: { plan: Plan; featured?: boolean }) {
  return (
    <Card className={`relative flex flex-col ${featured ? "border-orange-500 border-2 shadow-xl scale-105" : "border-gray-200"}`}>
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-orange-500 text-white"><Star className="w-3 h-3 mr-1" />Most Popular</Badge>
        </div>
      )}
      <CardHeader className="text-center pb-2">
        <CardDescription className="uppercase tracking-wide text-xs font-semibold text-orange-600">{plan.tier}</CardDescription>
        <CardTitle className="text-3xl font-bold mt-2">
          {formatPrice(plan)}
          <span className="text-base font-normal text-gray-500">{formatUnit(plan)}</span>
        </CardTitle>
        <p className="text-sm text-gray-500 mt-1">
          {plan.maxUnits ? `Up to ${plan.maxUnits.toLocaleString()} ${plan.unitType === "flat_monthly" ? "projects" : plan.unitType + "s"}` : "Unlimited"}
        </p>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-2">
          {(plan.features as string[]).map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-gray-400 mt-4">{plan.transactionFeePct}% transaction fee on booked services</p>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button className={`w-full ${featured ? "bg-orange-500 hover:bg-orange-600" : "bg-gray-900 hover:bg-gray-800"}`}>
          Start Free Trial <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
        {plan.tier === "enterprise" && (
          <Button variant="outline" className="w-full border-orange-500 text-orange-600 hover:bg-orange-50">
            Contact Sales
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

const faqs = [
  {
    q: "Is this a SaaS product?",
    a: "No — UpTend is Workforce-as-a-Service (WaaS). Unlike traditional SaaS that just gives you software, UpTend provides the actual workforce, tools, compliance, and management layer. You get both the platform and the people to execute.",
  },
  {
    q: "What's included in the transaction fee?",
    a: "The 5-8% transaction fee applies to services booked through the UpTend platform. It covers payment processing, insurance verification, quality assurance, and our service guarantee.",
  },
  {
    q: "Can I upgrade or downgrade my plan?",
    a: "Absolutely. You can change plans at any time. Upgrades take effect immediately, and downgrades apply at the next billing cycle. Your data and history are always preserved.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes! All plans come with a 14-day free trial. No credit card required to start. You'll have full access to all features in your selected tier.",
  },
  {
    q: "Do you offer custom enterprise agreements?",
    a: "Yes. For large organizations with unique requirements, we offer custom pricing, SLAs, and dedicated support. Contact our sales team to discuss your needs.",
  },
];

export default function B2BPricing() {
  const [activeTab, setActiveTab] = useState("hoa");

  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ["/api/b2b-pricing/plans"],
  });

  const getSegmentPlans = (segment: string) =>
    plans.filter((p) => p.segment === segment).sort((a, b) => a.pricePerUnit - b.pricePerUnit);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Hero */}
      <div className="text-center py-16 px-4">
        <Badge className="bg-orange-100 text-orange-700 mb-4">B2B Plans</Badge>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Workforce-as-a-Service<br />
          <span className="text-orange-500">for Every Segment</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Not just software — a complete workforce management platform with real people, real compliance, and real results. Choose the plan that fits your portfolio.
        </p>
      </div>

      {/* Pricing Tabs */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full max-w-2xl mx-auto mb-10 bg-orange-100">
            {Object.entries(segmentConfig).map(([key, cfg]) => (
              <TabsTrigger key={key} value={key} className="data-[state=active]:bg-orange-500 data-[state=active]:text-white gap-1">
                <cfg.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{cfg.label}</span>
                <span className="sm:hidden">{key.toUpperCase()}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.keys(segmentConfig).map((segment) => (
            <TabsContent key={segment} value={segment}>
              {isLoading ? (
                <div className="text-center py-12 text-gray-500">Loading plans...</div>
              ) : (
                <div className="grid md:grid-cols-3 gap-6 items-start">
                  {getSegmentPlans(segment).map((plan, i) => (
                    <PlanCard key={plan.id} plan={plan} featured={i === 1} />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Transaction Fee Disclosure */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <h3 className="font-semibold text-amber-800 mb-2">Transaction Fee Disclosure</h3>
          <p className="text-sm text-amber-700">
            All plans include a 5-8% transaction fee on services booked through the UpTend platform. This covers payment processing, insurance verification, quality assurance, and our service guarantee. Enterprise plans enjoy the lowest rates at 5%.
          </p>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto px-4 pb-20">
        <h2 className="text-3xl font-bold text-center mb-10 text-gray-900">
          <HelpCircle className="inline w-8 h-8 text-orange-500 mr-2" />
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
              <p className="text-gray-600 text-sm">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-orange-500 text-white py-16 px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Operations?</h2>
        <p className="text-orange-100 mb-8 max-w-xl mx-auto">
          Join hundreds of businesses using UpTend's Workforce-as-a-Service platform. Start your free trial today.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50">
            Start Free Trial
          </Button>
          <Button size="lg" variant="outline" className="border-white text-white hover:bg-orange-600">
            Contact Sales
          </Button>
        </div>
      </div>
    </div>
  );
}
