import { Link } from "wouter";
import { useSEO } from "@/hooks/use-seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import {
  CheckCircle, ArrowRight, ShieldCheck, MapPin, Star,
  Clock, Phone, DollarSign,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface SeoServicePageData {
  slug: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  heroTagline: string;
  heroGradient: string;
  icon: LucideIcon;
  serviceDescription: string[];
  features: string[];
  pricing: {
    label: string;
    startingAt: string;
    details: string;
  };
  neighborhoods: string[];
  localContent: {
    areaName: string;
    whyLocalsChoose: string[];
    areaDescription: string;
  };
  faqs: { q: string; a: string }[];
  schemaService: {
    serviceType: string;
    description: string;
    areaServed: string;
  };
  isLive?: boolean;
}


// Internal linking: map SEO page slugs to related blog posts & parent services
function getRelatedLinks(slug: string): { href: string; label: string; description: string }[] {
  const links: { href: string; label: string; description: string }[] = [];

  // Extract service and city from slug (e.g., "junk-removal-lake-nona" → service="junk-removal", city="lake-nona")
  const cities = ["lake-nona","winter-park","dr-phillips","windermere","celebration","kissimmee","winter-garden","altamonte-springs","ocoee","sanford","apopka","clermont"];
  const city = cities.find(c => slug.endsWith(c));
  const service = city ? slug.replace(`-${city}`, '') : slug;

  // Link to parent service page
  if (city) {
    links.push({ href: `/services/${service}`, label: `${service.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} Orlando`, description: "See our main service page with pricing and details." });
  }

  // City-specific blog posts
  const cityBlogMap: Record<string, { href: string; label: string; description: string }[]> = {
    "lake-nona": [
      { href: "/blog/lake-nona-home-maintenance-schedule", label: "Lake Nona Home Maintenance Schedule", description: "Month-by-month guide for Lake Nona homeowners." },
      { href: "/blog/new-to-lake-nona-home-checklist", label: "New to Lake Nona? 90-Day Checklist", description: "Everything new Lake Nona residents need to know." },
      { href: "/blog/home-services-lake-nona", label: "Home Services in Lake Nona", description: "Complete guide to home services in Lake Nona." },
    ],
    "winter-park": [
      { href: "/blog/winter-park-home-maintenance-schedule", label: "Winter Park Home Maintenance Guide", description: "Maintenance tips for Winter Park homeowners." },
      { href: "/blog/new-to-winter-park-home-checklist", label: "New to Winter Park? Home Checklist", description: "Your first 90 days in Winter Park." },
      { href: "/blog/landscaping-cost-winter-park", label: "Landscaping Cost Winter Park", description: "Real pricing for landscaping in Winter Park." },
    ],
    "dr-phillips": [
      { href: "/blog/dr-phillips-home-maintenance-schedule", label: "Dr. Phillips Home Maintenance Guide", description: "Maintenance tips for Dr. Phillips homeowners." },
      { href: "/blog/new-to-dr-phillips-home-checklist", label: "New to Dr. Phillips? Home Checklist", description: "Your first 90 days in Dr. Phillips." },
      { href: "/blog/pool-cleaning-cost-dr-phillips", label: "Pool Cleaning Cost Dr. Phillips", description: "Real pricing for pool cleaning in Dr. Phillips." },
    ],
    "windermere": [
      { href: "/blog/windermere-home-maintenance-schedule", label: "Windermere Home Maintenance Guide", description: "Maintenance tips for Windermere homeowners." },
      { href: "/blog/new-to-windermere-home-checklist", label: "New to Windermere? Home Checklist", description: "Your first 90 days in Windermere." },
      { href: "/blog/landscaping-cost-windermere", label: "Landscaping Cost Windermere", description: "Real pricing for landscaping in Windermere." },
    ],
    "celebration": [
      { href: "/blog/celebration-home-maintenance-schedule", label: "Celebration Home Maintenance Guide", description: "Maintenance tips for Celebration homeowners." },
      { href: "/blog/new-to-celebration-home-checklist", label: "New to Celebration? Home Checklist", description: "Your first 90 days in Celebration." },
    ],
    "kissimmee": [
      { href: "/blog/kissimmee-home-maintenance-schedule", label: "Kissimmee Home Maintenance Guide", description: "Maintenance tips for Kissimmee homeowners." },
      { href: "/blog/new-to-kissimmee-home-checklist", label: "New to Kissimmee? Home Checklist", description: "Your first 90 days in Kissimmee." },
      { href: "/blog/pool-cleaning-cost-kissimmee", label: "Pool Cleaning Cost Kissimmee", description: "Real pricing for pool cleaning in Kissimmee." },
    ],
    "winter-garden": [
      { href: "/blog/winter-garden-home-maintenance-schedule", label: "Winter Garden Home Maintenance Guide", description: "Maintenance tips for Winter Garden homeowners." },
      { href: "/blog/new-to-winter-garden-home-checklist", label: "New to Winter Garden? Home Checklist", description: "Your first 90 days in Winter Garden." },
    ],
    "altamonte-springs": [
      { href: "/blog/altamonte-springs-home-maintenance-schedule", label: "Altamonte Springs Maintenance Guide", description: "Maintenance tips for Altamonte Springs homeowners." },
      { href: "/blog/new-to-altamonte-springs-home-checklist", label: "New to Altamonte Springs? Checklist", description: "Your first 90 days in Altamonte Springs." },
    ],
    "ocoee": [
      { href: "/blog/ocoee-home-maintenance-schedule", label: "Ocoee Home Maintenance Guide", description: "Maintenance tips for Ocoee homeowners." },
      { href: "/blog/new-to-ocoee-home-checklist", label: "New to Ocoee? Home Checklist", description: "Your first 90 days in Ocoee." },
    ],
    "sanford": [
      { href: "/blog/sanford-home-maintenance-schedule", label: "Sanford Home Maintenance Guide", description: "Maintenance tips for Sanford homeowners." },
      { href: "/blog/new-to-sanford-home-checklist", label: "New to Sanford? Home Checklist", description: "Your first 90 days in Sanford." },
    ],
    "apopka": [
      { href: "/blog/apopka-home-maintenance-schedule", label: "Apopka Home Maintenance Guide", description: "Maintenance tips for Apopka homeowners." },
      { href: "/blog/new-to-apopka-home-checklist", label: "New to Apopka? Home Checklist", description: "Your first 90 days in Apopka." },
    ],
    "clermont": [
      { href: "/blog/clermont-home-maintenance-schedule", label: "Clermont Home Maintenance Guide", description: "Maintenance tips for Clermont homeowners." },
      { href: "/blog/new-to-clermont-home-checklist", label: "New to Clermont? Home Checklist", description: "Your first 90 days in Clermont." },
      { href: "/blog/pressure-washing-cost-clermont", label: "Pressure Washing Cost Clermont", description: "Real pricing for pressure washing in Clermont." },
    ],
  };

  // Service-specific blog links
  const serviceBlogMap: Record<string, { href: string; label: string; description: string }[]> = {
    "pressure-washing": [
      { href: "/blog/pressure-washing-cost-orlando-2026", label: "Pressure Washing Cost Orlando (2026)", description: "Real pricing guide for Orlando pressure washing." },
      { href: "/blog/pressure-washing-cost-clermont", label: "Pressure Washing Cost Clermont", description: "What Clermont homeowners pay for pressure washing." },
    ],
    "pool-cleaning": [
      { href: "/blog/pool-cleaning-cost-dr-phillips", label: "Pool Cleaning Cost Dr. Phillips", description: "Real pricing for pool cleaning in Dr. Phillips." },
      { href: "/blog/pool-cleaning-cost-kissimmee", label: "Pool Cleaning Cost Kissimmee", description: "What Kissimmee homeowners pay for pool cleaning." },
    ],
    "landscaping": [
      { href: "/blog/landscaping-cost-winter-park", label: "Landscaping Cost Winter Park", description: "Real pricing for landscaping in Winter Park." },
      { href: "/blog/landscaping-cost-windermere", label: "Landscaping Cost Windermere", description: "What Windermere homeowners pay for landscaping." },
    ],
  };

  if (city && cityBlogMap[city]) {
    links.push(...cityBlogMap[city].slice(0, 2));
  }

  if (serviceBlogMap[service]) {
    // Add service-specific blogs not already included
    for (const link of serviceBlogMap[service]) {
      if (!links.find(l => l.href === link.href)) {
        links.push(link);
        if (links.length >= 4) break;
      }
    }
  }

  // Also link to other city variants of same service
  if (city) {
    const otherCities = cities.filter(c => c !== city).slice(0, 2);
    for (const oc of otherCities) {
      const cityName = oc.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const serviceName = service.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      links.push({ href: `/services/${service}-${oc}`, label: `${serviceName} ${cityName}`, description: `${serviceName} services in ${cityName}.` });
    }
  }

  return links.slice(0, 5);
}


export function SeoServicePage({ data }: { data: SeoServicePageData }) {
  useSEO({
    title: data.metaTitle,
    description: data.metaDescription,
    path: `/services/${data.slug}`,
  });

  const Icon = data.icon;

  const isLive = data.isLive ?? false;

  const schemaData = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "HomeAndConstructionBusiness"],
    name: "UpTend",
    url: "https://uptendapp.com",
    telephone: "+1-407-338-3342",
    address: {
      "@type": "PostalAddress",
      addressLocality: data.schemaService.areaServed.includes("Lake Nona") ? "Lake Nona" : "Orlando",
      addressRegion: "FL",
      addressCountry: "US",
    },
    areaServed: {
      "@type": "City",
      name: data.schemaService.areaServed,
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: data.h1,
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: data.h1,
            serviceType: data.schemaService.serviceType,
            description: data.schemaService.description,
            areaServed: {
              "@type": "City",
              name: data.schemaService.areaServed,
            },
            provider: {
              "@type": "LocalBusiness",
              name: "UpTend",
            },
          },
        },
      ],
    },
    priceRange: data.pricing.startingAt,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://uptendapp.com" },
      { "@type": "ListItem", position: 2, name: "Services", item: "https://uptendapp.com/services" },
      { "@type": "ListItem", position: 3, name: data.h1, item: `https://uptendapp.com/services/${data.slug}` },
    ],
  };

  const faqSchema = data.faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  } : null;

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: data.schemaService.serviceType,
    description: data.schemaService.description,
    provider: {
      "@type": "LocalBusiness",
      name: "UpTend",
      address: { "@type": "PostalAddress", addressLocality: "Orlando", addressRegion: "FL" },
      telephone: "(407) 338-3342",
      url: "https://uptendapp.com",
    },
    areaServed: { "@type": "City", name: data.schemaService.areaServed },
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      {/* Coming Soon Banner */}
      {!isLive && (
        <div className="bg-[#F47C20] text-white text-center py-3 px-4 font-bold text-sm md:text-base">
          Coming Soon to {data.localContent.areaName}! We're currently in beta in Lake Nona. Join the waitlist to be first in line.
        </div>
      )}

      {/* Hero */}
      <section className={`${isLive ? 'pt-28' : 'pt-20'} pb-16 px-4 md:px-6 bg-gradient-to-br ${data.heroGradient} text-white`}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="h-5 w-5" />
            <span className="text-white/90 font-medium">{data.localContent.areaName}</span>
            {!isLive && <Badge className="bg-white/20 text-white border-white/30 text-xs">Beta</Badge>}
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            {data.h1}
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl">
            {data.heroTagline}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            {isLive ? (
              <>
                <Link href="/book">
                  <Button size="lg" variant="secondary" className="text-lg px-8 py-6 font-bold">
                    Book Now <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/book">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 font-bold border-white text-white hover:bg-white/10">
                    Get Free Quote
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/join">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6 font-bold">
                  Join the Waitlist <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            )}
          </div>
          <div className="flex flex-wrap gap-6 mt-8 text-sm text-white/80">
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Licensed & Insured</span>
            {isLive && <span className="flex items-center gap-2"><Star className="h-4 w-4" /> Serving {data.localContent.areaName}</span>}
            <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> {isLive ? 'Same-Day Available' : 'Launching Soon'}</span>
          </div>
        </div>
      </section>

      {/* Service Description */}
      <section className="py-16 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="md:col-span-2 space-y-6">
              <h2 className="text-3xl font-bold">What We Do</h2>
              {data.serviceDescription.map((p, i) => (
                <p key={i} className="text-lg text-muted-foreground leading-relaxed">{p}</p>
              ))}
              <div className="grid sm:grid-cols-2 gap-3 mt-8">
                {data.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Card */}
            <div>
              <Card className="sticky top-24 border-primary/20">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">{data.pricing.label}</p>
                      <p className="text-2xl font-black text-primary">{data.pricing.startingAt}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{data.pricing.details}</p>
                  <Link href={isLive ? "/book" : "/join"}>
                    <Button className="w-full py-6 text-lg font-bold">
                      {isLive ? "Book Now" : "Join the Waitlist"} <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <p className="text-xs text-center text-muted-foreground">{isLive ? "No hidden fees · Free cancellation" : "Be first in line when we launch"}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Local Content */}
      <section className="py-16 px-4 md:px-6 bg-muted/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">
            Why {data.localContent.areaName} Residents Choose UpTend
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-3xl">
            {data.localContent.areaDescription}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {data.localContent.whyLocalsChoose.map((reason, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <CheckCircle className="h-6 w-6 text-primary mb-3" />
                  <p className="font-medium">{reason}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <h3 className="text-2xl font-bold mb-4">Neighborhoods We Serve</h3>
          <div className="flex flex-wrap gap-2">
            {data.neighborhoods.map((n, i) => (
              <Badge key={i} variant="secondary" className="text-sm px-3 py-1">
                {n}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 px-4 md:px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {data.faqs.map((faq, i) => (
              <div key={i}>
                <h3 className="text-lg font-bold mb-2">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Related Resources */}
      <section className="py-16 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Related Resources</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {getRelatedLinks(data.slug).map((link, i) => (
              <Link key={i} href={link.href} className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors group">
                <p className="font-medium text-primary group-hover:underline">{link.label}</p>
                <p className="text-sm text-muted-foreground mt-1">{link.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className={`py-16 px-4 md:px-6 bg-gradient-to-br ${data.heroGradient} text-white`}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            {isLive ? "Ready to Get Started?" : `Coming Soon to ${data.localContent.areaName}`}
          </h2>
          <p className="text-xl text-white/90 mb-8">
            {isLive
              ? `Book your ${data.schemaService.serviceType.toLowerCase().replace(/\s*services?\s*$/i, '')} today. Same-day availability in ${data.localContent.areaName}.`
              : `We're expanding across Orlando. Join the waitlist and be the first to book when we launch in ${data.localContent.areaName}.`
            }
          </p>
          <Link href={isLive ? "/book" : "/join"}>
            <Button size="lg" variant="secondary" className="text-lg px-10 py-6 font-bold">
              {isLive ? "Book Now" : "Join the Waitlist"} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
