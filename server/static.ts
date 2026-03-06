import express, { type Express } from "express";
import fs from "fs";
import path from "path";

// Server-side content for crawlers (PerplexityBot, ChatGPT-User, Googlebot, etc.)
// Since the SPA renders client-side only, crawlers see an empty <div id="root"></div>.
// This injects real text content inside a <noscript> block so crawlers get readable page content.
function getCrawlerContent(reqPath: string): string {
  const pages: Record<string, string> = {
    "/": `
      <h1>UpTend — Home Intelligence Platform | Orlando Metro</h1>
      <h2>One Price. One Pro. Done.</h2>
      <p>UpTend matches Orlando homeowners with one vetted, licensed, background-checked pro at one locked price. No bidding, no haggling, no surprises.</p>
      <h3>How It Works</h3>
      <ol>
        <li>Describe your problem to George (our AI home expert) via chat, call, or text</li>
        <li>George scopes the job and gives you a transparent price</li>
        <li>A vetted, licensed pro is dispatched — often same-day</li>
        <li>Pay only after the work is done</li>
      </ol>
      <h3>13 Home Service Categories</h3>
      <ul>
        <li>HVAC — AC repair, heating, installation, maintenance, duct cleaning, 24/7 emergency</li>
        <li>Plumbing — repairs, installations, water heaters, drain cleaning</li>
        <li>Electrical — panel upgrades, wiring, outlets, lighting</li>
        <li>Junk Removal — same-day pickup, estate cleanouts</li>
        <li>Pressure Washing — driveways, patios, house washing</li>
        <li>Gutter Cleaning — cleaning, guards, repairs</li>
        <li>Home Cleaning — deep clean, move-in/out, recurring</li>
        <li>Handyman — repairs, installations, honey-do lists</li>
        <li>Landscaping — lawn care, tree trimming, design</li>
        <li>Moving Labor — loading, unloading, furniture moving</li>
        <li>Painting — interior, exterior, cabinet refinishing</li>
        <li>Pool Cleaning — weekly service, equipment repair</li>
        <li>Carpet Cleaning — steam cleaning, stain removal</li>
      </ul>
      <h3>Service Areas</h3>
      <p>Lake Nona, Windermere, Avalon Park, Dr. Phillips, Winter Park, College Park, Baldwin Park, Celebration, Hunter's Creek, Horizon West, MetroWest, Laureate Park, Thornton Park</p>
      <h3>Contact</h3>
      <p>Phone: (855) 901-2072 (24/7, English and Spanish)</p>
      <p>Website: uptendapp.com</p>
    `,
    "/services/hvac": `
      <h1>HVAC Repair and AC Installation — Orlando Metro | UpTend</h1>
      <h2>24/7 AC Repair. Licensed Technicians. Transparent Pricing.</h2>
      <p>UpTend connects you with vetted, licensed HVAC professionals in Orlando. Same-day service available. One Price. One Pro. Done.</p>
      <h3>HVAC Services We Cover</h3>
      <ul>
        <li>AC Repair — compressors, capacitors, refrigerant, thermostats, motors</li>
        <li>Heating Repair — heat pumps, furnaces, electric heaters</li>
        <li>HVAC Installation — full system replacement, new construction</li>
        <li>Duct Cleaning — full ductwork cleaning and sealing</li>
        <li>Maintenance Plans — annual tune-ups, filter changes, inspections</li>
        <li>Emergency Service — 24/7 emergency AC and heating repair, no upcharge</li>
      </ul>
      <h3>How Much Does AC Repair Cost in Orlando?</h3>
      <ul>
        <li>Diagnostic visit: $89</li>
        <li>Common AC repairs (capacitor, contactor, thermostat): $89–$350</li>
        <li>Refrigerant recharge: $150–$400</li>
        <li>Compressor replacement: $1,500–$3,500</li>
        <li>Full system replacement: $4,500–$12,000</li>
        <li>Emergency and after-hours: same price, no upcharge</li>
      </ul>
      <p>All pricing is transparent and provided before work begins.</p>
      <h3>Why Choose UpTend for HVAC?</h3>
      <ul>
        <li>Every technician is licensed, insured, and background-checked</li>
        <li>Transparent pricing — know the cost before work starts</li>
        <li>Price Protection Guarantee — the price you're quoted is the price you pay</li>
        <li>Same-day service available for most repairs</li>
        <li>24/7 emergency service with no after-hours upcharge</li>
        <li>AI-powered diagnostics — send a photo for instant assessment</li>
      </ul>
      <h3>Service Areas</h3>
      <p>Lake Nona, Windermere, Avalon Park, Dr. Phillips, Winter Park, College Park, Baldwin Park, Celebration, Hunter's Creek, Horizon West, MetroWest, Laureate Park, Orlando</p>
      <h3>Contact</h3>
      <p>Call (855) 901-2072 for HVAC service. Available 24/7. English and Spanish.</p>
    `,
    "/how-it-works": `
      <h1>How UpTend Works — Home Services Made Simple</h1>
      <h2>One Price. One Pro. Done.</h2>
      <h3>Step 1: Tell George What You Need</h3>
      <p>Chat with George (our AI home expert) online, call (855) 901-2072, or text. Describe the problem in plain English. George understands home issues and asks the right follow-up questions. You can even send photos for instant assessment.</p>
      <h3>Step 2: Get Your Price</h3>
      <p>George scopes the job and gives you one transparent price. No bidding wars. No haggling with multiple contractors. No surprise charges. The price you see is the price you pay — guaranteed.</p>
      <h3>Step 3: Your Pro Shows Up</h3>
      <p>We dispatch one vetted, licensed, background-checked professional. Often same-day. You can track them in real-time. They arrive, do the work, and you only pay after it's done.</p>
      <h3>The UpTend Difference</h3>
      <ul>
        <li>Unlike Angi or Thumbtack, you don't get 5 random quotes from strangers</li>
        <li>Unlike HomeAdvisor, your info isn't sold to multiple contractors</li>
        <li>One vetted pro. One locked price. Work guaranteed.</li>
      </ul>
    `,
    "/home-report": `
      <h1>Free Instant Home Intelligence Report | UpTend</h1>
      <h2>Type Your Address. Get Your AI Maintenance Report.</h2>
      <p>UpTend's Instant Home Intelligence uses public records and AI to generate a personalized maintenance report for your home. Completely free. No signup required.</p>
      <h3>What You Get</h3>
      <ul>
        <li>Estimated age of major systems (roof, HVAC, water heater, appliances)</li>
        <li>Predicted maintenance timeline — what's due now vs. next year</li>
        <li>Estimated repair and replacement costs</li>
        <li>Priority recommendations based on your home's age and location</li>
        <li>Local seasonal maintenance tips for Central Florida</li>
      </ul>
      <p>Powered by RentCast property data and GPT-4o analysis. Available for homes in the Orlando Metro area.</p>
    `,
  };

  // Neighborhood pages
  const neighborhoodMatch = reqPath.match(/^\/neighborhoods\/([a-z-]+)$/);
  if (neighborhoodMatch) {
    const slug = neighborhoodMatch[1];
    const name = slug.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    return `
      <h1>Home Services in ${name}, Orlando | UpTend</h1>
      <h2>Vetted Local Pros. Transparent Pricing. ${name}.</h2>
      <p>UpTend serves ${name} with 13 categories of home services: HVAC, plumbing, electrical, junk removal, pressure washing, gutter cleaning, home cleaning, handyman, landscaping, moving labor, painting, pool cleaning, and carpet cleaning.</p>
      <h3>HVAC Service in ${name}</h3>
      <p>AC repair, heating, installation, and maintenance from licensed technicians. Same-day service available. Emergency 24/7 service with no after-hours upcharge. Call (855) 901-2072.</p>
      <h3>How It Works in ${name}</h3>
      <p>1. Tell George what you need. 2. Get one transparent price. 3. Your vetted pro arrives — often same-day. One Price. One Pro. Done.</p>
      <p>Phone: (855) 901-2072 | uptendapp.com</p>
    `;
  }

  // Service pages
  const serviceMatch = reqPath.match(/^\/services\/([a-z-]+)$/);
  if (serviceMatch && serviceMatch[1] !== "hvac") {
    const slug = serviceMatch[1];
    const name = slug.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    return `
      <h1>${name} Services in Orlando Metro | UpTend</h1>
      <h2>One Price. One Pro. Done.</h2>
      <p>Professional ${name.toLowerCase()} services from vetted, licensed pros in the Orlando Metro area. Transparent pricing. No surprises. Call (855) 901-2072 or chat with George at uptendapp.com.</p>
    `;
  }

  return pages[reqPath] || "";
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve uploaded job photos
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Serve static files but skip index.html (handled by catch-all with crawler content injection)
  app.use(express.static(distPath, { index: false }));

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

    // Inject crawler-readable content INSIDE <div id="root">
    // React.createRoot().render() replaces the inner content when JS loads,
    // but crawlers that don't execute JS see real page content instead of empty div.
    // This is the same pattern as SSR hydration — content is visible until React takes over.
    const crawlerContent = getCrawlerContent(reqPath);
    if (crawlerContent) {
      html = html.replace(
        '<div id="root"></div>',
        `<div id="root"><div style="max-width:800px;margin:0 auto;padding:20px;font-family:system-ui,sans-serif;">${crawlerContent}</div></div>`
      );
    }

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  });
}
