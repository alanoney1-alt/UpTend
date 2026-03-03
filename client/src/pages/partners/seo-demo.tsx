/**
 * Partner SEO Demo Page
 * 
 * Shows the HVAC partner (or any partner) what their SEO presence
 * looks like when UpTend handles their marketing.
 * 
 * Route: /partners/:slug/seo-demo
 */

import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/ui/logo";
import {
  TrendingUp, Globe, Search, MapPin, FileText, BarChart3,
  CheckCircle, ArrowRight, Star, Phone, ExternalLink,
} from "lucide-react";

const SEO_DEMO_DATA: Record<string, any> = {
  "demo-hvac": {
    companyName: "Orlando Air Pro",
    serviceType: "HVAC",
    domain: "orlandoairpro.uptendapp.com",
    pages: [
      { title: "AC Repair Lake Nona | Orlando Air Pro", url: "/ac-repair-lake-nona", status: "live", ranking: "#3" },
      { title: "HVAC Installation Orlando | Orlando Air Pro", url: "/hvac-installation-orlando", status: "live", ranking: "#7" },
      { title: "AC Maintenance Winter Park | Orlando Air Pro", url: "/ac-maintenance-winter-park", status: "live", ranking: "#5" },
      { title: "Emergency AC Repair Dr. Phillips | Orlando Air Pro", url: "/emergency-ac-dr-phillips", status: "live", ranking: "#2" },
      { title: "Duct Cleaning Celebration | Orlando Air Pro", url: "/duct-cleaning-celebration", status: "live", ranking: "#4" },
      { title: "Heat Pump Repair Windermere | Orlando Air Pro", url: "/heat-pump-windermere", status: "live", ranking: "#6" },
      { title: "AC Tune-Up Kissimmee | Orlando Air Pro", url: "/ac-tuneup-kissimmee", status: "live", ranking: "#8" },
      { title: "HVAC Service Altamonte Springs | Orlando Air Pro", url: "/hvac-altamonte-springs", status: "live", ranking: "#5" },
      { title: "AC Replacement Sanford | Orlando Air Pro", url: "/ac-replacement-sanford", status: "pending", ranking: "—" },
      { title: "Thermostat Install Apopka | Orlando Air Pro", url: "/thermostat-apopka", status: "pending", ranking: "—" },
      { title: "Air Quality Testing Clermont | Orlando Air Pro", url: "/air-quality-clermont", status: "pending", ranking: "—" },
      { title: "HVAC Repair Ocoee | Orlando Air Pro", url: "/hvac-repair-ocoee", status: "pending", ranking: "—" },
    ],
    blogPosts: [
      { title: "How Often Should You Change Your AC Filter in Florida?", reads: 1240, keywords: ["ac filter florida", "hvac maintenance orlando"] },
      { title: "5 Signs Your AC Is About to Die (And What to Do)", reads: 890, keywords: ["ac repair signs", "when to replace ac"] },
      { title: "HVAC Maintenance Checklist for Orlando Homeowners", reads: 760, keywords: ["hvac maintenance checklist", "orlando hvac"] },
      { title: "Why Your Energy Bill Spikes Every Summer (And How to Fix It)", reads: 650, keywords: ["high energy bill ac", "ac efficiency orlando"] },
    ],
    stats: {
      totalPages: 12,
      livePages: 8,
      avgRanking: 5,
      monthlyImpressions: 4200,
      monthlyClicks: 380,
      monthlyLeads: 28,
      topKeyword: "ac repair lake nona",
      topKeywordRank: 2,
      gbpViews: 1800,
      gbpCalls: 45,
    },
    neighborhoods: [
      "Lake Nona", "Winter Park", "Dr. Phillips", "Windermere", "Celebration",
      "Kissimmee", "Altamonte Springs", "Sanford", "Apopka", "Clermont", "Ocoee", "Winter Garden",
    ],
  },
};

// Alias real partners to demo data with their branding
SEO_DEMO_DATA["comfort-solutions-tech"] = {
  ...SEO_DEMO_DATA["demo-hvac"],
  companyName: "Comfort Solutions Tech LLC",
  domain: "comfortsoltech.uptendapp.com",
  pages: SEO_DEMO_DATA["demo-hvac"].pages.map((p: any) => ({
    ...p,
    title: p.title.replace("Orlando Air Pro", "Comfort Solutions Tech"),
  })),
};

export default function PartnerSEODemo() {
  const params = useParams();
  const slug = (params as any).slug || "demo-hvac";
  const data = SEO_DEMO_DATA[slug];

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">SEO demo not available for this partner.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo variant="default" className="h-8" />
            <span className="text-muted-foreground">×</span>
            <span className="font-bold">{data.companyName}</span>
            <Badge variant="outline">SEO Dashboard</Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Stats */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your SEO Performance</h1>
          <p className="text-muted-foreground">Here's what UpTend builds and manages for {data.companyName}.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "SEO Pages Live", value: `${data.stats.livePages}/${data.stats.totalPages}`, icon: Globe, color: "text-blue-500" },
            { label: "Monthly Impressions", value: data.stats.monthlyImpressions.toLocaleString(), icon: Search, color: "text-green-500" },
            { label: "Monthly Clicks", value: data.stats.monthlyClicks.toLocaleString(), icon: TrendingUp, color: "text-primary" },
            { label: "Leads Generated", value: `${data.stats.monthlyLeads}/mo`, icon: Phone, color: "text-orange-500" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
                <p className="text-2xl font-bold">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Top Keyword */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold">Top Performing Keyword</span>
              </div>
              <p className="text-xl font-bold text-primary">"{data.stats.topKeyword}"</p>
              <p className="text-sm text-muted-foreground mt-1">Ranking #{data.stats.topKeywordRank} on Google</p>
            </CardContent>
          </Card>

          {/* GBP Stats */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-5 h-5 text-red-500" />
                <span className="font-semibold">Google Business Profile</span>
              </div>
              <p className="text-xl font-bold">{data.stats.gbpViews.toLocaleString()} views/mo</p>
              <p className="text-sm text-muted-foreground mt-1">{data.stats.gbpCalls} calls from Google Maps</p>
            </CardContent>
          </Card>
        </div>

        {/* SEO Pages */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Your SEO Landing Pages ({data.stats.totalPages})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Each page targets a specific service + neighborhood combination. UpTend builds, optimizes, and maintains all of these for you.
            </p>
            <div className="space-y-2">
              {data.pages.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    {p.status === "live" ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{p.title}</p>
                      <p className="text-xs text-muted-foreground">{data.domain}{p.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={p.status === "live" ? "default" : "outline"}>
                      {p.status === "live" ? `Rank ${p.ranking}` : "Building"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Blog Posts */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              SEO Blog Posts (Auto-Generated Monthly)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              UpTend generates and publishes 4+ blog posts per month targeting long-tail keywords in your service area.
            </p>
            <div className="space-y-3">
              {data.blogPosts.map((post: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{post.title}</p>
                    <div className="flex gap-2 mt-1">
                      {post.keywords.map((k: string) => (
                        <Badge key={k} variant="outline" className="text-xs">{k}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{post.reads.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">reads</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Neighborhood Coverage */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Neighborhood Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              We build SEO pages for every service you offer × every neighborhood you serve. That's {data.neighborhoods.length} neighborhoods × your services = maximum local visibility.
            </p>
            <div className="flex flex-wrap gap-2">
              {data.neighborhoods.map((n: string) => (
                <Badge key={n} variant="outline" className="py-1">{n}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* What's Included */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>What UpTend Handles for Your SEO</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "Service + neighborhood landing pages (12+ cities)",
                "Monthly blog posts targeting long-tail keywords",
                "Google Business Profile optimization",
                "Google Search Console monitoring",
                "Schema markup (LocalBusiness, Service)",
                "Meta titles, descriptions, OG tags",
                "Sitemap generation and submission",
                "Competitor keyword tracking",
                "Monthly SEO performance report",
                "AI-generated images for content",
              ].map(item => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="bg-primary/5 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-3">This is what we build for you.</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            SEO agencies charge $3,000-5,000/month for this. With UpTend, it's included in your partnership.
            Every page, every blog post, every optimization. Handled.
          </p>
          <div className="text-sm text-muted-foreground">
            Powered by <span className="font-semibold text-foreground">UpTend</span>
          </div>
        </div>
      </main>
    </div>
  );
}
