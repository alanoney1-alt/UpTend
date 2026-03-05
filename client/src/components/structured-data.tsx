/**
 * Structured Data Components (JSON-LD)
 * 
 * Injects machine-readable schema.org data into pages
 * for Google, Bing, ChatGPT Search, Perplexity, and AI crawlers.
 */

import { useEffect } from "react";

interface LocalBusinessData {
  name: string;
  description: string;
  phone?: string;
  url: string;
  serviceType: string;
  areaServed: string[];
  priceRange?: string;
  rating?: number;
  reviewCount?: number;
  image?: string;
  address?: {
    street?: string;
    city: string;
    state: string;
    zip: string;
  };
}

interface FAQItem {
  question: string;
  answer: string;
}

interface ServiceData {
  name: string;
  description: string;
  provider: string;
  areaServed: string[];
  priceRange: { low: number; high: number; currency: string };
  url: string;
}

// Inject a JSON-LD script tag
function injectJsonLd(id: string, data: object) {
  // Remove existing if present
  const existing = document.getElementById(id);
  if (existing) existing.remove();

  const script = document.createElement("script");
  script.id = id;
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

/**
 * LocalBusiness schema for partner pages
 */
export function useLocalBusinessSchema(data: LocalBusinessData) {
  useEffect(() => {
    const schema: any = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: data.name,
      description: data.description,
      url: data.url,
      telephone: data.phone,
      priceRange: data.priceRange || "$$",
      image: data.image || "https://uptendapp.com/og-image.png",
      areaServed: data.areaServed.map(area => ({
        "@type": "City",
        name: area,
      })),
      makesOffer: {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: data.serviceType,
          description: data.description,
        },
      },
      isPartOf: {
        "@type": "Organization",
        name: "UpTend",
        url: "https://uptendapp.com",
        description: "Home Intelligence platform — AI-powered home service matching",
      },
    };

    if (data.address) {
      schema.address = {
        "@type": "PostalAddress",
        addressLocality: data.address.city,
        addressRegion: data.address.state,
        postalCode: data.address.zip,
        addressCountry: "US",
      };
    }

    if (data.rating) {
      schema.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: data.rating,
        bestRating: 5,
        worstRating: 1,
        ratingCount: data.reviewCount || 1,
      };
    }

    injectJsonLd("ld-local-business", schema);
    return () => {
      const el = document.getElementById("ld-local-business");
      if (el) el.remove();
    };
  }, [data.name, data.url]);
}

/**
 * FAQ schema for SEO and AI overview extraction
 */
export function useFAQSchema(faqs: FAQItem[]) {
  useEffect(() => {
    if (!faqs.length) return;

    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map(faq => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    };

    injectJsonLd("ld-faq", schema);
    return () => {
      const el = document.getElementById("ld-faq");
      if (el) el.remove();
    };
  }, [faqs]);
}

/**
 * Service schema for service/neighborhood pages
 */
export function useServiceSchema(data: ServiceData) {
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Service",
      name: data.name,
      description: data.description,
      provider: {
        "@type": "Organization",
        name: data.provider,
        url: "https://uptendapp.com",
      },
      areaServed: data.areaServed.map(area => ({
        "@type": "City",
        name: area,
      })),
      offers: {
        "@type": "AggregateOffer",
        lowPrice: data.priceRange.low,
        highPrice: data.priceRange.high,
        priceCurrency: data.priceRange.currency,
      },
      url: data.url,
    };

    injectJsonLd("ld-service", schema);
    return () => {
      const el = document.getElementById("ld-service");
      if (el) el.remove();
    };
  }, [data.name, data.url]);
}

/**
 * Organization schema for the main site
 */
export function useOrganizationSchema() {
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "UpTend",
      url: "https://uptendapp.com",
      logo: "https://uptendapp.com/og-image.png",
      description: "Home Intelligence platform. AI-powered matching between homeowners and vetted local service professionals. One Price. One Pro. Done.",
      foundingDate: "2025",
      founder: {
        "@type": "Person",
        name: "Alan Oney",
      },
      address: {
        "@type": "PostalAddress",
        addressLocality: "Orlando",
        addressRegion: "FL",
        addressCountry: "US",
      },
      areaServed: {
        "@type": "MetropolitanArea",
        name: "Orlando Metro Area",
      },
      sameAs: [
        "https://twitter.com/uptendgeorge",
        "https://www.facebook.com/UptendGeorge",
        "https://www.instagram.com/uptendgeorge",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+1-855-901-2072",
        contactType: "customer service",
        availableLanguage: ["English", "Spanish"],
        areaServed: "US",
      },
    };

    injectJsonLd("ld-organization", schema);
    return () => {
      const el = document.getElementById("ld-organization");
      if (el) el.remove();
    };
  }, []);
}

/**
 * Pre-built FAQ sets for common service pages
 */
export const HVAC_FAQS: FAQItem[] = [
  {
    question: "How much does AC repair cost in Orlando?",
    answer: "AC repair in Orlando typically costs $89-$350 for common repairs. Complex issues like compressor replacement can run $1,500-$3,500. UpTend provides transparent pricing before any work begins.",
  },
  {
    question: "How fast can I get an HVAC technician?",
    answer: "Through UpTend, same-day service is available for most HVAC needs. Emergency AC repair can be dispatched within 1-2 hours. Chat with George AI for instant availability.",
  },
  {
    question: "Are UpTend HVAC technicians licensed and insured?",
    answer: "Yes. Every professional on the UpTend platform is background-checked, licensed, and fully insured. We verify credentials before any pro can join the network.",
  },
  {
    question: "How does UpTend match me with an HVAC pro?",
    answer: "George, our AI home expert, analyzes your specific issue (including photos if you share them), identifies the right type of technician, and matches you with the closest available vetted pro in your neighborhood.",
  },
  {
    question: "What is UpTend's pricing model?",
    answer: "UpTend charges a small 5% platform fee on top of the pro's price. You see the total upfront before booking. No hidden fees, no surprise charges.",
  },
];

export const HOME_SERVICES_FAQS: FAQItem[] = [
  {
    question: "What home services does UpTend offer in Orlando?",
    answer: "UpTend covers 13 home service categories in the Orlando Metro area: HVAC, plumbing, electrical, junk removal, pressure washing, gutter cleaning, home cleaning, handyman, landscaping, moving labor, painting, pool cleaning, and carpet cleaning.",
  },
  {
    question: "How is UpTend different from Angi or Thumbtack?",
    answer: "Unlike lead-generation sites that give you 5 random quotes, UpTend matches you with ONE vetted pro who's right for your specific job. Our AI, George, scopes the work upfront so you get transparent pricing before anyone shows up. One Price. One Pro. Done.",
  },
  {
    question: "Is UpTend available outside Orlando?",
    answer: "UpTend currently serves the Orlando Metro area including Lake Nona, Windermere, Avalon Park, Dr. Phillips, Winter Park, Baldwin Park, Horizon West, Celebration, and surrounding neighborhoods. We're expanding to Tampa and Jacksonville in 2026.",
  },
  {
    question: "Can I get an instant quote for home services?",
    answer: "Yes. Chat with George at uptendapp.com or call 1-855-901-2072. George can scope most jobs in under 5 minutes, including photo-based quotes for HVAC, plumbing, and more.",
  },
  {
    question: "What does the Home DNA Scan do?",
    answer: "The free Home DNA Scan analyzes your property using public records to identify your home's age, systems, and upcoming maintenance needs. Enter your address at uptendapp.com/home-report to get a personalized maintenance plan.",
  },
];

export const PARTNER_FAQS: FAQItem[] = [
  {
    question: "How much does UpTend cost for service companies?",
    answer: "UpTend's partner platform starts at $499/month with a $1,000 setup fee. This includes AI-powered phone answering, lead capture, SEO neighborhood pages, social media management, and a full business dashboard. Custom packages available.",
  },
  {
    question: "How does UpTend generate leads for my business?",
    answer: "UpTend generates leads through three channels: SEO neighborhood pages that rank in Google for local searches, George AI who matches homeowners to your business 24/7, and the UpTend marketplace where homeowners browse and book directly.",
  },
  {
    question: "Can UpTend answer my business phone calls?",
    answer: "Yes. George AI answers your business line 24/7 with your company's name and branding. He captures lead information, scopes the job, and routes it to your dashboard. Never miss an after-hours call again.",
  },
  {
    question: "How long until I see results from UpTend?",
    answer: "Day 1: George catches missed calls and after-hours leads. Month 1-2: Social media and review management build visibility. Month 3-4: SEO pages start ranking in Google. Month 6+: Platform marketplace generates organic leads.",
  },
];
