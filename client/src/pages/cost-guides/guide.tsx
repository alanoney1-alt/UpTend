import { useParams, Link } from "wouter";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GuaranteeBadge } from "@/components/guarantee-badge";
import {
  DollarSign, CheckCircle, Lightbulb, ArrowLeft, ArrowRight,
  TrendingUp, List, ShieldCheck,
} from "lucide-react";
import { getCostGuideBySlug, costGuides } from "./data";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";

export default function CostGuide() {
  const { slug } = useParams<{ slug: string }>();
  const guide = getCostGuideBySlug(slug || "");

  useEffect(() => {
    if (guide) {
      document.title = guide.metaTitle;
      let meta = document.querySelector('meta[name="description"]');
      if (meta) {
        meta.setAttribute("content", guide.metaDescription);
      } else {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        meta.setAttribute("content", guide.metaDescription);
        document.head.appendChild(meta);
      }
    }
  }, [guide]);

  if (!guide) return <NotFound />;

  const currentIndex = costGuides.findIndex((g) => g.slug === slug);
  const prevGuide = currentIndex > 0 ? costGuides[currentIndex - 1] : null;
  const nextGuide = currentIndex < costGuides.length - 1 ? costGuides[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-8">
          <Link href="/cost-guides" className="hover:text-primary transition-colors">Cost Guides</Link>
          <span>/</span>
          <span className="text-slate-900">{guide.title}</span>
        </div>

        {/* Hero */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{guide.title}</h1>
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-lg font-bold">
              <DollarSign className="w-5 h-5" />
              ${guide.avgCostLow}–${guide.avgCostHigh}
              <span className="text-sm font-normal">{guide.costUnit}</span>
            </div>
            <GuaranteeBadge compact />
          </div>
          <p className="text-lg text-slate-600 leading-relaxed">{guide.description}</p>
        </div>

        {/* Factors */}
        <Card className="mb-8 border-slate-200">
          <CardContent className="p-6">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              Factors That Affect Cost
            </h2>
            <ul className="space-y-3">
              {guide.factors.map((factor, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-700">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold mt-0.5">{i + 1}</span>
                  {factor}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* What's Included */}
        <Card className="mb-8 border-slate-200">
          <CardContent className="p-6">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900 mb-4">
              <List className="w-5 h-5 text-emerald-600" />
              What's Included
            </h2>
            <ul className="space-y-3">
              {guide.whatsIncluded.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-700">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="mb-8 border-amber-200 bg-amber-50/50">
          <CardContent className="p-6">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900 mb-4">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              Money-Saving Tips
            </h2>
            <ul className="space-y-3">
              {guide.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-700">
                  <span className="text-amber-500 font-bold flex-shrink-0">💡</span>
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="mb-10 border-primary/20 bg-gradient-to-r from-primary/5 to-emerald-50">
          <CardContent className="p-8 text-center">
            <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Ready to Book?</h2>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              Get an instant quote from verified Orlando pros. Every job backed by our $500 Satisfaction Guarantee.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/book">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Instant Quote <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href={`/services/${guide.slug}`}>
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Learn More About This Service
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Prev/Next navigation */}
        <div className="flex justify-between items-center border-t border-slate-200 pt-6">
          {prevGuide ? (
            <Link href={`/cost-guides/${prevGuide.slug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary transition-colors">
              <ArrowLeft className="w-4 h-4" /> {prevGuide.title}
            </Link>
          ) : <div />}
          {nextGuide ? (
            <Link href={`/cost-guides/${nextGuide.slug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary transition-colors">
              {nextGuide.title} <ArrowRight className="w-4 h-4" />
            </Link>
          ) : <div />}
        </div>
      </main>
      <Footer />
    </div>
  );
}
