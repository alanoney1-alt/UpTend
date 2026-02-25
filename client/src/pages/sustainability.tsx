import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import {
  Leaf, Recycle, Globe, BarChart3, TreePine,
  CheckCircle, ArrowRight, ShieldCheck, Droplets,
} from "lucide-react";

const impactStats = [
  { label: "Avg CO2 Saved Per Job", value: "600 lbs", icon: Leaf },
  { label: "Material Diversion Rate", value: "78%", icon: Recycle },
  { label: "Water Saved Per Pressure Wash", value: "200+ gal", icon: Droplets },
  { label: "Verified Impact Reports Issued", value: "Every Job", icon: ShieldCheck },
];

const pillars = [
  {
    title: "Responsible Junk Removal",
    icon: Recycle,
    description:
      "Every item removed from your property is tracked through our circular economy system. We sort for donation, recycling, and responsible disposal. then prove it with a verified Impact Report.",
    points: [
      "Full chain-of-custody tracking for every item",
      "Donation coordination with local charities",
      "Recycling partnerships for metals, electronics, and textiles",
      "Audit-ready ESG documentation for property managers",
    ],
  },
  {
    title: "Carbon Tracking & Reporting",
    icon: BarChart3,
    description:
      "Every service generates measurable environmental data. We track CO2 avoided through recycling, water saved through efficient equipment, and materials diverted from landfills.",
    points: [
      "Per-job carbon offset calculations",
      "Cumulative impact dashboard for repeat customers",
      "Property manager ESG compliance reports",
      "Quarterly sustainability summaries",
    ],
  },
  {
    title: "Eco-Friendly Operations",
    icon: Globe,
    description:
      "From low-flow pressure washing equipment to eco-friendly cleaning solutions, sustainability is built into how we operate. not bolted on as an afterthought.",
    points: [
      "Low-flow equipment reduces water consumption",
      "Eco-friendly chemical treatments and cleaning products",
      "Route optimization reduces fuel consumption",
      "Digital-first operations minimize paper waste",
    ],
  },
  {
    title: "Community & Recycling Partnerships",
    icon: TreePine,
    description:
      "We partner with local Orlando organizations to maximize the second life of recovered materials. Furniture goes to families in need. Electronics get properly recycled. Nothing goes to landfill unnecessarily.",
    points: [
      "Local charity partnerships for furniture and household goods",
      "Certified e-waste recycling for electronics",
      "Construction material recycling for demolition debris",
      "Donation receipts provided for customer tax purposes",
    ],
  },
];

export default function Sustainability() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-28 pb-16 px-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
             Sustainability at UpTend
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black mb-6">
            Every Job Has an{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">
              Environmental Impact.
            </span>
            <br />
            We Track It.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            UpTend builds sustainability into every service. from verified recycling and donation tracking
            to eco-friendly operations and community partnerships.
          </p>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-12 px-6 border-b border-border">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {impactStats.map((stat) => (
            <div key={stat.label} className="text-center">
              <stat.icon className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-black text-primary">{stat.value}</div>
              <div className="text-xs text-muted-foreground font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pillars */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          {pillars.map((pillar) => (
            <Card key={pillar.title}>
              <CardContent className="p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0">
                    <pillar.icon className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold mb-2">{pillar.title}</h2>
                    <p className="text-muted-foreground">{pillar.description}</p>
                  </div>
                </div>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pl-16">
                  {pillar.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-muted/50 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">See Sustainability in Action</h2>
          <p className="text-muted-foreground mb-8">
            Book any service and receive a verified Impact Report showing the environmental
            footprint of your job. materials diverted, CO2 saved, and more.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/services">
              <Button size="lg">
                Browse Services <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/book">
              <Button size="lg" variant="outline">
                Book Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
