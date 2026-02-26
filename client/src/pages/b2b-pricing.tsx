import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Check, Building2, Home, HardHat, Landmark, ArrowRight, HelpCircle, Phone, Calendar, Zap } from "lucide-react";

const segmentConfig = {
  hoa: { label: "HOA", icon: Home, color: "bg-orange-500" },
  pm: { label: "Property Management", icon: Building2, color: "bg-amber-500" },
  construction: { label: "Construction", icon: HardHat, color: "bg-orange-600" },
  government: { label: "Government", icon: Landmark, color: "bg-amber-600" },
};

const segmentDetails: Record<string, { headline: string; description: string; features: string[]; cta: string }> = {
  hoa: {
    headline: "Custom Plans for HOA Communities",
    description: "Every community is different. We build a pricing schedule based on your property count, service needs, and frequency. One conversation, one custom plan, complete workforce management.",
    features: [
      "AI-generated pricing schedules based on your exact needs",
      "Violation-to-service pipeline: issue a notice, book a fix in one tap",
      "Board-ready compliance reports and photo documentation",
      "Community batch pricing with group discounts up to 10%",
      "Emergency response protocols for weather events",
      "Dedicated account manager for your community",
      "Resident portal for individual service requests",
      "Budget dashboard with monthly/quarterly breakdowns",
    ],
    cta: "Get Your Custom HOA Plan",
  },
  pm: {
    headline: "Custom Plans for Property Managers",
    description: "Whether you manage 10 doors or 10,000, we tailor pricing to your portfolio size, service mix, and maintenance schedules. No cookie-cutter plans.",
    features: [
      "Portfolio-wide service scheduling and tracking",
      "Tenant request management through George AI",
      "Vendor compliance and insurance verification",
      "Automated maintenance reminders by property",
      "Turnover coordination: cleaning, painting, repairs in one workflow",
      "Integration with AppFolio, Buildium, Yardi, RentManager",
      "Real-time job tracking with photo documentation",
      "Monthly reporting for owners and investors",
    ],
    cta: "Get Your Custom PM Plan",
  },
  construction: {
    headline: "Custom Plans for Construction Companies",
    description: "Every project has different needs. We work with your team to build a workforce plan that scales with your jobs, whether you need 2 subs or 200.",
    features: [
      "Subcontractor sourcing and vetting",
      "Project-based workforce allocation",
      "Safety compliance and certification tracking",
      "Parts and materials procurement workflow",
      "Daily job logs with photo documentation",
      "Integration with Jobber, ServiceTitan, Procore",
      "Multi-site coordination and scheduling",
      "Progress billing support and documentation",
    ],
    cta: "Get Your Custom Construction Plan",
  },
  government: {
    headline: "Custom Plans for Government Agencies",
    description: "We hold minority-owned and disabled veteran-owned certifications (SDVOSB). Pricing is structured per contract requirements. Let us respond to your RFP or build a custom scope.",
    features: [
      "SBA 8(a) and SDVOSB certified",
      "GSA Schedule and SAM.gov registered",
      "Prevailing wage and Davis-Bacon compliance",
      "Security clearance management for sensitive sites",
      "Detailed reporting for grant and contract auditing",
      "Multi-agency coordination capabilities",
      "Emergency response and disaster recovery teams",
      "ADA compliance and accessibility services",
    ],
    cta: "Request a Government Proposal",
  },
};

const faqs = [
  {
    q: "How does pricing work?",
    a: "Every business is different. We build a custom pricing schedule based on your specific needs: property count, service types, frequency, and location. Schedule a call and we will have a proposal ready within 24 hours.",
  },
  {
    q: "Is this a SaaS product?",
    a: "No. UpTend is Workforce-as-a-Service (WaaS). Unlike traditional SaaS that just gives you software, UpTend provides the actual workforce, tools, compliance, and management layer. You get both the platform and the people to execute.",
  },
  {
    q: "Is there a free option?",
    a: "Yes. Our Independent tier is free forever for up to 10 properties with a 5% transaction fee on booked services. No credit card required.",
  },
  {
    q: "What about transaction fees?",
    a: "All plans include a small transaction fee on services booked through the platform. The exact rate depends on your plan and volume. We will walk you through everything on your consultation call.",
  },
  {
    q: "Do you offer a pilot program?",
    a: "Absolutely. We offer a 90-day free pilot so you can test the platform with zero risk. Full access, real results, no commitment until you are ready.",
  },
  {
    q: "Do you offer custom enterprise agreements?",
    a: "Yes. For large organizations with unique requirements, we offer custom pricing, SLAs, and dedicated support. Contact our team to discuss your needs.",
  },
];

export default function B2BPricing() {
  const [activeTab, setActiveTab] = useState("hoa");

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Hero */}
      <div className="text-center py-16 px-4">
        <Badge className="bg-orange-100 text-orange-700 mb-4">B2B Solutions</Badge>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Workforce-as-a-Service<br />
          <span className="text-orange-500">Built for Your Business</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Not just software. A complete workforce management platform with real people, real compliance, and real results. Every plan is custom-built for your needs.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <a href="https://calendly.com" target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-lg px-8">
              <Calendar className="w-5 h-5 mr-2" /> Schedule a Consultation
            </Button>
          </a>
          <a href="tel:4073383342">
            <Button size="lg" variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50 text-lg px-8">
              <Phone className="w-5 h-5 mr-2" /> (407) 338-3342
            </Button>
          </a>
        </div>
      </div>

      {/* Independent Tier: Free Entry Point */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <Card className="border-2 border-orange-400 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 flex items-center gap-2">
            <Zap className="h-5 w-5 text-white" />
            <span className="text-white font-semibold">Perfect for Independent Operators</span>
            <Badge className="bg-white/20 text-white ml-auto">No Credit Card Required</Badge>
          </div>
          <div className="p-8 flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Independent</h3>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-bold text-orange-500">$0</span>
                  <span className="text-gray-500">/month, forever</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Manage up to 10 properties with no subscription fees. Pay only a 5% transaction fee when you book a pro.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {["Book vetted pros", "Track jobs in real-time", "Basic notifications", "Property list and management"].map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-orange-500 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <a href="/business/onboarding?plan=independent">
                <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-lg px-8">
                  Get Started Free <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </a>
              <p className="text-xs text-gray-500">1 to 10 properties, 5% per booking</p>
            </div>
          </div>
        </Card>

        <div className="text-center mt-8 mb-2">
          <p className="text-gray-500 text-sm">Need more? Every plan above Independent is custom-built for your business.</p>
        </div>
      </div>

      {/* Segment Tabs */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
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

          {Object.entries(segmentDetails).map(([segment, info]) => (
            <TabsContent key={segment} value={segment}>
              <Card className="border-gray-200 shadow-lg">
                <CardContent className="p-8 md:p-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">{info.headline}</h2>
                  <p className="text-gray-600 text-lg mb-8 max-w-3xl">{info.description}</p>

                  <div className="grid md:grid-cols-2 gap-4 mb-10">
                    {info.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{f}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-8 text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to see what we can build for you?</h3>
                    <p className="text-gray-600 mb-6">We will review your needs and deliver a custom pricing proposal within 24 hours.</p>
                    <div className="flex gap-4 justify-center flex-wrap">
                      <a href="https://calendly.com" target="_blank" rel="noopener noreferrer">
                        <Button size="lg" className="bg-orange-500 hover:bg-orange-600">
                          <Calendar className="w-5 h-5 mr-2" /> {info.cta}
                        </Button>
                      </a>
                      <a href="tel:4073383342">
                        <Button size="lg" variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50">
                          <Phone className="w-5 h-5 mr-2" /> Call Us
                        </Button>
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* 90-Day Pilot Banner */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
          <h3 className="text-xl font-semibold text-amber-800 mb-2">90-Day Free Pilot Program</h3>
          <p className="text-amber-700 mb-4">
            Not sure yet? Try UpTend for 90 days with zero risk. Full platform access, real results, no commitment until you are ready.
          </p>
          <a href="https://calendly.com" target="_blank" rel="noopener noreferrer">
            <Button className="bg-amber-600 hover:bg-amber-700">
              Learn About the Pilot <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </a>
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

      {/* Bottom CTA */}
      <div className="bg-orange-500 text-white py-16 px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Operations?</h2>
        <p className="text-orange-100 mb-8 max-w-xl mx-auto">
          Join businesses across Central Florida using UpTend's Workforce-as-a-Service platform. Let us build your custom plan.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <a href="https://calendly.com" target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50">
              Schedule a Consultation
            </Button>
          </a>
          <a href="tel:4073383342">
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-orange-600">
              (407) 338-3342
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
