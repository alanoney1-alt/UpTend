import { Link } from "wouter";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, DollarSign } from "lucide-react";
import { costGuides } from "./data";
import { useEffect } from "react";

export default function CostGuidesHub() {
  useEffect(() => {
    document.title = "Cost Guides | Orlando Home Service Pricing 2026 | UpTend";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", "How much do home services cost in Orlando? Browse UpTend's pricing guides for junk removal, pressure washing, cleaning, landscaping, and more.");
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="relative max-w-5xl mx-auto px-4 py-16">
        <div className="absolute inset-0 h-[350px] -mx-[50vw] left-1/2 right-1/2 w-screen overflow-hidden -z-10">
          <img src="/images/site/hero-cost-guides.webp" alt="" className="w-full h-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-background/90" />
        </div>
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <DollarSign className="w-4 h-4" />
            Orlando Pricing Guides
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            How Much Do Home Services Cost in Orlando?
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Transparent pricing for every service we offer. No hidden fees, no surprises. just honest costs from verified Orlando pros.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {costGuides.map((guide) => (
            <Link key={guide.slug} href={`/cost-guides/${guide.slug}`}>
              <Card className="h-full hover:shadow-lg transition-all cursor-pointer border-slate-200 hover:border-primary/30 group">
                <CardContent className="p-6">
                  <h2 className="font-semibold text-slate-900 text-lg mb-2 group-hover:text-primary transition-colors">
                    {guide.title}
                  </h2>
                  <div className="text-2xl font-bold text-primary mb-3">
                    ${guide.avgCostLow}–${guide.avgCostHigh}
                    <span className="text-sm font-normal text-slate-500 ml-1">{guide.costUnit}</span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2 mb-4">{guide.description}</p>
                  <div className="flex items-center text-sm text-primary font-medium group-hover:gap-2 transition-all">
                    View Full Guide <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
