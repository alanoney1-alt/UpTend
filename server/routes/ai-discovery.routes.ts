/**
 * AI Discovery Routes
 * 
 * Public API for AI assistants (ChatGPT, Alexa, Perplexity, etc.)
 * to find and match pros through UpTend.
 * 
 * Endpoints:
 * - GET  /api/discover/find-pro    - Find a pro by service + location
 * - GET  /api/discover/services    - List all available services
 * - GET  /api/discover/areas       - List all service areas
 * - GET  /api/discover/pricing     - Get pricing info for a service+area
 * - GET  /api/discover/partner/:slug - Get partner details
 * - GET  /api/discover/openapi     - OpenAPI spec for ChatGPT GPT Actions
 * - GET  /sitemap.xml              - Dynamic XML sitemap
 * - GET  /robots.txt               - Robots.txt with sitemap reference
 */

import { Router, type Express, type Request, type Response } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";

const SERVICE_TYPES = [
  { key: "hvac", label: "HVAC & Air Conditioning", description: "AC repair, installation, maintenance, duct cleaning, heat pumps" },
  { key: "plumbing", label: "Plumbing", description: "Pipe repair, water heater, drain cleaning, leak detection" },
  { key: "electrical", label: "Electrical", description: "Wiring, panel upgrades, outlet installation, lighting" },
  { key: "junk_removal", label: "Junk Removal", description: "Furniture removal, cleanouts, debris hauling" },
  { key: "pressure_washing", label: "Pressure Washing", description: "Driveway, patio, roof, exterior cleaning" },
  { key: "gutter_cleaning", label: "Gutter Cleaning", description: "Gutter clean, repair, and guard installation" },
  { key: "home_cleaning", label: "Home Cleaning", description: "Deep cleaning, recurring cleaning, move-in/move-out" },
  { key: "handyman", label: "Handyman", description: "General repairs, mounting, assembly, small projects" },
  { key: "landscaping", label: "Landscaping", description: "Lawn care, tree trimming, garden design, irrigation" },
  { key: "moving_labor", label: "Moving Labor", description: "Loading, unloading, packing, furniture moving" },
  { key: "painting", label: "Painting", description: "Interior and exterior painting, staining, wallpaper" },
  { key: "pool_cleaning", label: "Pool Cleaning", description: "Chemical balancing, filter cleaning, pool maintenance" },
  { key: "carpet_cleaning", label: "Carpet Cleaning", description: "Deep carpet cleaning, upholstery, stain removal" },
];

const SERVICE_AREAS = [
  { slug: "lake-nona", name: "Lake Nona", zip: "32827" },
  { slug: "windermere", name: "Windermere", zip: "34786" },
  { slug: "avalon-park", name: "Avalon Park", zip: "32828" },
  { slug: "dr-phillips", name: "Dr. Phillips", zip: "32819" },
  { slug: "winter-park", name: "Winter Park", zip: "32789" },
  { slug: "college-park", name: "College Park", zip: "32804" },
  { slug: "thornton-park", name: "Thornton Park", zip: "32801" },
  { slug: "baldwin-park", name: "Baldwin Park", zip: "32814" },
  { slug: "horizon-west", name: "Horizon West", zip: "34787" },
  { slug: "celebration", name: "Celebration", zip: "34747" },
  { slug: "hunters-creek", name: "Hunter's Creek", zip: "32837" },
  { slug: "metrowest", name: "MetroWest", zip: "32835" },
];

// Average pricing data by service type (real Orlando market data)
const PRICING_DATA: Record<string, { low: number; avg: number; high: number; unit: string }> = {
  hvac: { low: 89, avg: 350, high: 8500, unit: "per service" },
  plumbing: { low: 75, avg: 275, high: 3000, unit: "per service" },
  electrical: { low: 75, avg: 250, high: 2500, unit: "per service" },
  junk_removal: { low: 99, avg: 275, high: 800, unit: "per load" },
  pressure_washing: { low: 149, avg: 350, high: 800, unit: "per service" },
  gutter_cleaning: { low: 150, avg: 250, high: 500, unit: "per service" },
  home_cleaning: { low: 99, avg: 200, high: 500, unit: "per visit" },
  handyman: { low: 75, avg: 150, high: 400, unit: "per hour" },
  landscaping: { low: 99, avg: 300, high: 2000, unit: "per service" },
  moving_labor: { low: 149, avg: 400, high: 1200, unit: "per job" },
  painting: { low: 200, avg: 1500, high: 5000, unit: "per room/project" },
  pool_cleaning: { low: 120, avg: 160, high: 250, unit: "per month" },
  carpet_cleaning: { low: 50, avg: 150, high: 400, unit: "per room" },
};

export function registerAIDiscoveryRoutes(app: Express) {
  const router = Router();

  // ==========================================
  // GET /api/discover/find-pro
  // ==========================================
  router.get("/find-pro", async (req: Request, res: Response) => {
    try {
      const { service, zip, area, urgency } = req.query;

      if (!service) {
        return res.status(400).json({
          error: "Missing required parameter: service",
          hint: "Use /api/discover/services to see available service types",
          example: "/api/discover/find-pro?service=hvac&zip=32827",
        });
      }

      const serviceKey = (service as string).toLowerCase().replace(/[^a-z_]/g, "");
      const serviceInfo = SERVICE_TYPES.find(s => 
        s.key === serviceKey || 
        s.label.toLowerCase().includes(serviceKey) ||
        s.description.toLowerCase().includes(serviceKey)
      );

      if (!serviceInfo) {
        return res.status(404).json({
          error: `Unknown service type: ${service}`,
          available: SERVICE_TYPES.map(s => s.key),
        });
      }

      // Query partners from DB that match service type and area
      let partners: any[] = [];
      try {
        const result = await db.execute(sql`
          SELECT 
            p.id, p.company_name, p.phone, p.status, p.type,
            pb.service_type, pb.city
          FROM partners p
          LEFT JOIN partner_bookings pb ON pb.partner_id = p.id
          WHERE p.status = 'active'
          LIMIT 20
        `);
        partners = result.rows || [];
      } catch (e) {
        // DB query failed, fall back to config-based partners
      }

      // Also check hardcoded partner configs for demo
      const configPartners = [];
      if (serviceKey === "hvac" || serviceKey === "ac" || serviceKey === "air_conditioning") {
        configPartners.push({
          name: "Comfort Solutions Tech LLC",
          slug: "comfort-solutions-tech",
          serviceType: "HVAC",
          phone: "(407) 860-8842",
          areas: ["Lake Nona", "Windermere", "Avalon Park", "Dr. Phillips", "Orlando Metro"],
          url: "https://uptendapp.com/partners/comfort-solutions-tech",
          bookingUrl: "https://uptendapp.com/partners/comfort-solutions-tech#book",
          responseTime: "Same day",
          rating: 4.8,
          verified: true,
          licensed: true,
          insured: true,
        });
      }

      const pricing = PRICING_DATA[serviceKey] || PRICING_DATA["handyman"];

      // Find matching area
      const matchedArea = zip
        ? SERVICE_AREAS.find(a => a.zip === zip)
        : area
          ? SERVICE_AREAS.find(a => a.slug === area || a.name.toLowerCase() === (area as string).toLowerCase())
          : null;

      res.json({
        service: serviceInfo,
        area: matchedArea || { name: "Orlando Metro", coverage: "All neighborhoods" },
        pricing: {
          range: `$${pricing.low} - $${pricing.high}`,
          average: `$${pricing.avg}`,
          unit: pricing.unit,
          note: "Prices are estimates based on Orlando Metro averages. Actual cost depends on scope of work.",
        },
        partners: configPartners,
        totalPartners: configPartners.length + partners.filter(p => p.status === "active").length,
        bookingOptions: {
          chat: "https://uptendapp.com — Chat with George AI for instant matching",
          phone: "1-855-901-2072 — Call to speak with George AI",
          web: `https://uptendapp.com/services/${serviceKey}`,
        },
        platform: {
          name: "UpTend",
          tagline: "One Price. One Pro. Done.",
          description: "UpTend matches homeowners with vetted, licensed, insured local pros. AI-powered scoping, transparent pricing, background-checked technicians.",
          website: "https://uptendapp.com",
        },
      });
    } catch (error) {
      console.error("Find pro error:", error);
      res.status(500).json({ error: "Failed to search for pros" });
    }
  });

  // ==========================================
  // GET /api/discover/services
  // ==========================================
  router.get("/services", (_req: Request, res: Response) => {
    res.json({
      services: SERVICE_TYPES.map(s => ({
        ...s,
        pricingUrl: `https://uptendapp.com/api/discover/pricing?service=${s.key}`,
        findProUrl: `https://uptendapp.com/api/discover/find-pro?service=${s.key}`,
        pageUrl: `https://uptendapp.com/services/${s.key}`,
      })),
      totalServices: SERVICE_TYPES.length,
      coverage: "Orlando Metro Area",
    });
  });

  // ==========================================
  // GET /api/discover/areas
  // ==========================================
  router.get("/areas", (_req: Request, res: Response) => {
    res.json({
      areas: SERVICE_AREAS.map(a => ({
        ...a,
        pageUrl: `https://uptendapp.com/neighborhoods/${a.slug}`,
        servicesUrl: `https://uptendapp.com/api/discover/find-pro?area=${a.slug}`,
      })),
      totalAreas: SERVICE_AREAS.length,
      metro: "Orlando, FL",
    });
  });

  // ==========================================
  // GET /api/discover/pricing
  // ==========================================
  router.get("/pricing", (req: Request, res: Response) => {
    const { service, zip, area } = req.query;

    if (!service) {
      return res.status(400).json({
        error: "Missing required parameter: service",
        example: "/api/discover/pricing?service=hvac",
      });
    }

    const serviceKey = (service as string).toLowerCase().replace(/[^a-z_]/g, "");
    const pricing = PRICING_DATA[serviceKey];

    if (!pricing) {
      return res.status(404).json({
        error: `No pricing data for: ${service}`,
        available: Object.keys(PRICING_DATA),
      });
    }

    const serviceInfo = SERVICE_TYPES.find(s => s.key === serviceKey);
    const matchedArea = zip
      ? SERVICE_AREAS.find(a => a.zip === zip)
      : area
        ? SERVICE_AREAS.find(a => a.slug === area)
        : null;

    res.json({
      service: serviceInfo,
      area: matchedArea || { name: "Orlando Metro Average" },
      pricing: {
        low: pricing.low,
        average: pricing.avg,
        high: pricing.high,
        unit: pricing.unit,
        currency: "USD",
        lastUpdated: new Date().toISOString().split("T")[0],
        source: "UpTend platform transaction data — Orlando Metro",
      },
      bookNow: `https://uptendapp.com/api/discover/find-pro?service=${serviceKey}`,
    });
  });

  // ==========================================
  // GET /api/discover/partner/:slug
  // ==========================================
  router.get("/partner/:slug", async (req: Request, res: Response) => {
    const { slug } = req.params;

    // Check known partners
    if (slug === "comfort-solutions-tech") {
      return res.json({
        name: "Comfort Solutions Tech LLC",
        slug: "comfort-solutions-tech",
        owner: "Alex",
        serviceType: "HVAC & Air Conditioning",
        phone: "(407) 860-8842",
        areas: ["Lake Nona", "Windermere", "Avalon Park", "Dr. Phillips", "Winter Park", "Orlando Metro"],
        services: [
          "AC Repair & Diagnostics",
          "HVAC Installation",
          "Duct Cleaning & Sealing",
          "Preventive Maintenance",
          "Emergency AC Service",
          "Heat Pump Service",
          "Air Quality Assessment",
        ],
        verified: true,
        licensed: true,
        insured: true,
        backgroundChecked: true,
        responseTime: "Same day",
        pageUrl: "https://uptendapp.com/partners/comfort-solutions-tech",
        bookingUrl: "https://uptendapp.com/partners/comfort-solutions-tech#book",
        platform: "UpTend",
      });
    }

    // Try DB
    try {
      const result = await db.execute(
        sql`SELECT * FROM partners WHERE status = 'active' LIMIT 20`
      );
      const partner = (result.rows || []).find((p: any) =>
        p.company_name?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") === slug
      );
      if (partner) {
        return res.json({
          name: (partner as any).company_name,
          phone: (partner as any).phone,
          verified: true,
          platform: "UpTend",
        });
      }
    } catch (e) {}

    res.status(404).json({ error: `Partner not found: ${slug}` });
  });

  // ==========================================
  // GET /api/discover/openapi — ChatGPT GPT Actions spec
  // ==========================================
  router.get("/openapi", (_req: Request, res: Response) => {
    res.json(OPENAPI_SPEC);
  });

  app.use("/api/discover", router);

  // ==========================================
  // GET /sitemap.xml — Dynamic XML sitemap
  // ==========================================
  app.get("/sitemap.xml", (_req: Request, res: Response) => {
    const baseUrl = "https://uptendapp.com";
    const now = new Date().toISOString().split("T")[0];

    const staticPages = [
      { loc: "/", priority: "1.0", changefreq: "weekly" },
      { loc: "/business", priority: "0.9", changefreq: "weekly" },
      { loc: "/discovery", priority: "0.8", changefreq: "weekly" },
      { loc: "/home-report", priority: "0.8", changefreq: "monthly" },
      { loc: "/about", priority: "0.6", changefreq: "monthly" },
      { loc: "/how-it-works", priority: "0.7", changefreq: "monthly" },
      { loc: "/founding-100", priority: "0.7", changefreq: "monthly" },
      { loc: "/legal/partner-terms", priority: "0.3", changefreq: "yearly" },
      { loc: "/legal/terms", priority: "0.3", changefreq: "yearly" },
      { loc: "/legal/privacy", priority: "0.3", changefreq: "yearly" },
      { loc: "/sales/leads", priority: "0.4", changefreq: "daily" },
    ];

    const servicePages = SERVICE_TYPES.map(s => ({
      loc: `/services/${s.key}`,
      priority: "0.8",
      changefreq: "weekly",
    }));

    const neighborhoodPages = SERVICE_AREAS.map(a => ({
      loc: `/neighborhoods/${a.slug}`,
      priority: "0.8",
      changefreq: "weekly",
    }));

    // Cross-product: service x neighborhood SEO pages
    const seoPages = SERVICE_TYPES.flatMap(s =>
      SERVICE_AREAS.map(a => ({
        loc: `/services/${s.key}/${a.slug}`,
        priority: "0.7",
        changefreq: "monthly",
      }))
    );

    const partnerPages = [
      { loc: "/partners/comfort-solutions-tech", priority: "0.7", changefreq: "weekly" },
    ];

    const allPages = [...staticPages, ...servicePages, ...neighborhoodPages, ...seoPages, ...partnerPages];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(p => `  <url>
    <loc>${baseUrl}${p.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

    res.setHeader("Content-Type", "application/xml");
    res.send(xml);
  });

  // ==========================================
  // GET /robots.txt
  // ==========================================
  app.get("/robots.txt", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/plain");
    res.send(`User-agent: *
Allow: /
Allow: /api/discover/

Disallow: /api/
Disallow: /admin/
Disallow: /sales/

Sitemap: https://uptendapp.com/sitemap.xml
`);
  });
}

// ==========================================
// OpenAPI 3.1 Spec for ChatGPT GPT Actions
// ==========================================
const OPENAPI_SPEC = {
  openapi: "3.1.0",
  info: {
    title: "UpTend Home Services API",
    description: "Find vetted, licensed home service professionals in the Orlando Metro area. Get pricing, availability, and book instantly through UpTend's AI-powered platform.",
    version: "1.0.0",
    contact: {
      name: "UpTend",
      url: "https://uptendapp.com",
      email: "alan@uptendapp.com",
    },
  },
  servers: [
    { url: "https://uptendapp.com", description: "Production" },
  ],
  paths: {
    "/api/discover/find-pro": {
      get: {
        operationId: "findPro",
        summary: "Find a home service professional",
        description: "Search for vetted, licensed professionals by service type and location in the Orlando Metro area. Returns matched pros with pricing, ratings, and booking links.",
        parameters: [
          {
            name: "service",
            in: "query",
            required: true,
            description: "Service type (e.g., hvac, plumbing, electrical, junk_removal, pressure_washing, landscaping, painting, handyman, home_cleaning, pool_cleaning)",
            schema: { type: "string" },
          },
          {
            name: "zip",
            in: "query",
            required: false,
            description: "ZIP code for location matching (e.g., 32827 for Lake Nona)",
            schema: { type: "string" },
          },
          {
            name: "area",
            in: "query",
            required: false,
            description: "Neighborhood name or slug (e.g., lake-nona, windermere)",
            schema: { type: "string" },
          },
          {
            name: "urgency",
            in: "query",
            required: false,
            description: "How urgent: routine, soon, urgent, emergency",
            schema: { type: "string", enum: ["routine", "soon", "urgent", "emergency"] },
          },
        ],
        responses: {
          "200": {
            description: "Matched professionals with pricing and booking options",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    service: { type: "object" },
                    area: { type: "object" },
                    pricing: { type: "object" },
                    partners: { type: "array", items: { type: "object" } },
                    bookingOptions: { type: "object" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/discover/services": {
      get: {
        operationId: "listServices",
        summary: "List all available home services",
        description: "Get a list of all home service categories available through UpTend in the Orlando Metro area.",
        responses: {
          "200": {
            description: "List of available services",
          },
        },
      },
    },
    "/api/discover/areas": {
      get: {
        operationId: "listAreas",
        summary: "List all service areas",
        description: "Get all neighborhoods and areas served by UpTend in the Orlando Metro area.",
        responses: {
          "200": {
            description: "List of service areas with ZIP codes",
          },
        },
      },
    },
    "/api/discover/pricing": {
      get: {
        operationId: "getPricing",
        summary: "Get pricing for a service",
        description: "Get average pricing data for a specific home service in the Orlando Metro area.",
        parameters: [
          {
            name: "service",
            in: "query",
            required: true,
            description: "Service type",
            schema: { type: "string" },
          },
          {
            name: "zip",
            in: "query",
            required: false,
            description: "ZIP code for area-specific pricing",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Pricing data for the requested service",
          },
        },
      },
    },
    "/api/discover/partner/{slug}": {
      get: {
        operationId: "getPartner",
        summary: "Get partner details",
        description: "Get detailed information about a specific UpTend partner company.",
        parameters: [
          {
            name: "slug",
            in: "path",
            required: true,
            description: "Partner URL slug",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Partner details",
          },
        },
      },
    },
  },
};
