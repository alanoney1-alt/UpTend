import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve uploaded job photos
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  // For business landing page, inject different OG meta tags
  app.use("*", (req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    const isBusiness = req.originalUrl === "/" && (req.hostname === "uptendapp.business" || req.hostname === "www.uptendapp.business");
    const isBusinessPath = req.originalUrl.startsWith("/business");

    if (isBusiness || isBusinessPath) {
      let html = fs.readFileSync(indexPath, "utf-8");
      html = html.replace(
        /<meta property="og:title" content="[^"]*">/,
        '<meta property="og:title" content="UpTend | Business Intelligence">'
      );
      html = html.replace(
        /<meta property="og:description" content="[^"]*">/,
        '<meta property="og:description" content="One platform. Problems solved. Whether you need more customers, fewer headaches, or both — we build the system around your business and have you live in 10 days.">'
      );
      html = html.replace(
        /<meta name="twitter:title" content="[^"]*">/,
        '<meta name="twitter:title" content="UpTend | Business Intelligence">'
      );
      html = html.replace(
        /<meta name="twitter:description" content="[^"]*">/,
        '<meta name="twitter:description" content="One platform. Problems solved. We build the system around your business and have you live in 10 days.">'
      );
      html = html.replace(
        /<title>[^<]*<\/title>/,
        '<title>UpTend | Business Intelligence — One Platform. Problems Solved.</title>'
      );
      html = html.replace(
        /<meta name="description" content="[^"]*">/,
        '<meta name="description" content="UpTend Business Intelligence. One platform. Problems solved. HVAC, HOA, and property management solutions.">'
      );
      // Also inject Organization JSON-LD for business pages
      const bizJsonLd = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "UpTend",
        url: "https://uptendapp.com",
        description: "One platform. Problems solved. Business intelligence for HVAC, HOA, and property management.",
      };
      html = html.replace("</head>", `<script type="application/ld+json">${JSON.stringify(bizJsonLd)}</script>\n</head>`);
      res.setHeader("Content-Type", "text/html");
      return res.send(html);
    }

    // Inject server-side JSON-LD structured data for ALL pages
    // (AI crawlers like ChatGPT, Perplexity, Bing don't execute JS)
    let html = fs.readFileSync(indexPath, "utf-8");
    const reqPath = req.originalUrl.split("?")[0];

    const jsonLdBlocks: object[] = [];

    // Organization schema on every page
    jsonLdBlocks.push({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "UpTend",
      url: "https://uptendapp.com",
      logo: "https://uptendapp.com/og-image.png",
      description: "Home Intelligence platform. AI-powered matching between homeowners and vetted local service professionals. 13 service categories across Orlando Metro. One Price. One Pro. Done.",
      foundingDate: "2025",
      founder: { "@type": "Person", name: "Alan Oney" },
      address: { "@type": "PostalAddress", addressLocality: "Orlando", addressRegion: "FL", addressCountry: "US" },
      areaServed: { "@type": "MetropolitanArea", name: "Orlando Metro Area" },
      sameAs: ["https://twitter.com/uptendgeorge", "https://www.facebook.com/UptendGeorge", "https://www.instagram.com/uptendgeorge"],
      contactPoint: { "@type": "ContactPoint", telephone: "+1-855-901-2072", contactType: "customer service", availableLanguage: ["English", "Spanish"] },
    });

    // HVAC Service schema — helps AI assistants find us for HVAC queries
    jsonLdBlocks.push({
      "@context": "https://schema.org",
      "@type": "Service",
      name: "HVAC Repair & Installation — Orlando Metro",
      description: "24/7 HVAC repair, AC installation, heating service, duct cleaning, and emergency air conditioning repair in Orlando Metro. Licensed, insured technicians. Same-day service available. Call (855) 901-2072.",
      provider: {
        "@type": "Organization",
        name: "UpTend",
        url: "https://uptendapp.com",
        telephone: "+1-855-901-2072",
      },
      areaServed: [
        "Lake Nona", "Windermere", "Avalon Park", "Dr. Phillips", "Winter Park",
        "College Park", "Baldwin Park", "Celebration", "Hunter's Creek", "Horizon West",
        "MetroWest", "Laureate Park", "Orlando",
      ].map(a => ({ "@type": "City", name: a, containedInPlace: { "@type": "State", name: "Florida" } })),
      serviceType: "HVAC",
      offers: {
        "@type": "Offer",
        price: "89",
        priceCurrency: "USD",
        description: "Diagnostic visit from $89. AC repair, heating, duct cleaning, maintenance plans.",
        url: "https://uptendapp.com/services/hvac",
      },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "HVAC Services",
        itemListElement: [
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "AC Repair", description: "Same-day AC repair. Compressors, refrigerant, motors, thermostats." } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Heating Repair", description: "Heat pump and furnace repair." } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "HVAC Installation", description: "Full system replacement and new installations." } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Duct Cleaning", description: "Full ductwork cleaning and inspection." } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Maintenance Plans", description: "Annual tune-ups and preventive maintenance." } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Emergency HVAC Service", description: "24/7 emergency AC and heating repair." } },
        ],
      },
    });

    // WebSite schema with search action (enables Google sitelinks searchbox)
    jsonLdBlocks.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "UpTend",
      url: "https://uptendapp.com",
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: "https://uptendapp.com/home-report?address={search_term_string}" },
        "query-input": "required name=search_term_string",
      },
    });

    // Partner page schemas
    if (reqPath.startsWith("/partners/comfort-solutions-tech")) {
      jsonLdBlocks.push({
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: "Comfort Solutions Tech LLC",
        description: "HVAC repair, installation, and maintenance in Orlando Metro. Vetted and verified through UpTend platform.",
        telephone: "(407) 860-8842",
        url: "https://uptendapp.com/partners/comfort-solutions-tech",
        priceRange: "$$",
        address: { "@type": "PostalAddress", addressLocality: "Orlando", addressRegion: "FL", addressCountry: "US" },
        areaServed: ["Lake Nona", "Windermere", "Avalon Park", "Dr. Phillips", "Winter Park"].map(a => ({ "@type": "City", name: a })),
        aggregateRating: { "@type": "AggregateRating", ratingValue: 4.8, bestRating: 5, ratingCount: 12 },
      });
    }

    // Neighborhood page schemas
    const neighborhoodMatch = reqPath.match(/^\/neighborhoods\/([a-z-]+)$/);
    if (neighborhoodMatch) {
      const name = neighborhoodMatch[1].split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      jsonLdBlocks.push({
        "@context": "https://schema.org",
        "@type": "Service",
        name: `Home Services in ${name}`,
        description: `Vetted, licensed home service professionals in ${name}, Orlando. HVAC, plumbing, electrical, cleaning, landscaping and more.`,
        provider: { "@type": "Organization", name: "UpTend", url: "https://uptendapp.com" },
        areaServed: [{ "@type": "City", name }],
        offers: { "@type": "AggregateOffer", lowPrice: 75, highPrice: 5000, priceCurrency: "USD" },
      });
    }

    // FAQ schema on main pages
    if (reqPath === "/" || reqPath.startsWith("/neighborhoods/") || reqPath.startsWith("/services/")) {
      jsonLdBlocks.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          { "@type": "Question", name: "What home services does UpTend offer in Orlando?", acceptedAnswer: { "@type": "Answer", text: "UpTend covers 13 home service categories: HVAC, plumbing, electrical, junk removal, pressure washing, gutter cleaning, home cleaning, handyman, landscaping, moving labor, painting, pool cleaning, and carpet cleaning." } },
          { "@type": "Question", name: "How is UpTend different from Angi or Thumbtack?", acceptedAnswer: { "@type": "Answer", text: "Unlike lead-generation sites that give you 5 random quotes, UpTend matches you with ONE vetted pro. Our AI George scopes work upfront for transparent pricing. One Price. One Pro. Done." } },
          { "@type": "Question", name: "How much does AC repair cost in Orlando?", acceptedAnswer: { "@type": "Answer", text: "AC repair in Orlando typically costs $89-$350 for common repairs. Complex issues like compressor replacement can run $1,500-$3,500. UpTend provides transparent pricing before work begins." } },
          { "@type": "Question", name: "Can I get an instant quote for home services?", acceptedAnswer: { "@type": "Answer", text: "Yes. Chat with George at uptendapp.com or call 1-855-901-2072. George can scope most jobs in under 5 minutes, including photo-based quotes." } },
          { "@type": "Question", name: "Is UpTend available outside Orlando?", acceptedAnswer: { "@type": "Answer", text: "UpTend currently serves the Orlando Metro area including Lake Nona, Windermere, Avalon Park, Dr. Phillips, Winter Park, and surrounding neighborhoods. Expanding to Tampa and Jacksonville in 2026." } },
        ],
      });
    }

    // Inject all JSON-LD blocks before </head>
    if (jsonLdBlocks.length > 0) {
      const scripts = jsonLdBlocks.map(block =>
        `<script type="application/ld+json">${JSON.stringify(block)}</script>`
      ).join("\n");
      html = html.replace("</head>", `${scripts}\n</head>`);
    }

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  });
}
