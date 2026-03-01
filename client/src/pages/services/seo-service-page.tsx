import { useEffect } from "react";
import { Link } from "wouter";
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

export function SeoServicePage({ data }: { data: SeoServicePageData }) {
  useEffect(() => {
    document.title = data.metaTitle;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", data.metaDescription);
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = data.metaDescription;
      document.head.appendChild(meta);
    }
  }, [data.metaTitle, data.metaDescription]);

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

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
