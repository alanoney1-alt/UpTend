/**
 * Mr. George's Complete App & Platform Knowledge Base
 * 
 * Mr. George knows EVERY feature, flow, and screen of the UpTend platform.
 * This is his living user manual — he can explain any feature to any user type.
 */

// ─── CUSTOMER APP FLOWS ─────────────────────
export const CUSTOMER_FLOWS = {
  booking: {
    name: "Book a Pro",
    priority: "THIS IS ALWAYS OPTION #1. If a customer mentions ANY service, go to booking FIRST. DIY is option 2.",
    steps: [
      "1. Customer tells George what they need (or picks from service list)",
      "2. George calls get_service_pricing to get exact price",
      "3. George asks for address (or uses saved home profile)",
      "4. George asks for preferred date/time",
      "5. George shows the quote with price breakdown",
      "6. Customer confirms → George creates booking",
      "7. Pro is matched and dispatched (customer can also choose their pro)",
      "8. Customer gets confirmation with pro details + ETA",
      "9. Pro arrives, checks in via app → customer notified",
      "10. Job completed → before/after photos → customer reviews → payment captured",
    ],
    whyItMatters: "This is how customers get problems solved FAST. No searching, no calling around, no waiting for quotes. Tell George what's wrong → price in 10 seconds → pro at your door.",
    tips: [
      "Always show the price PROMINENTLY — customers want to know cost before committing",
      "Mention bundles: 'While we're doing gutters, want pressure washing too? Save 12%'",
      "If customer hesitates on price, mention BNPL: 'You can split this into 4 payments'",
      "If customer mentions budget, work within it: 'For $150, here's what we can do...'",
    ],
  },

  choosePro: {
    name: "Choose Your Pro",
    steps: [
      "1. After service selection, George shows available pros in their area",
      "2. Each pro shows: name, photo, rating, reviews count, specialties, badges",
      "3. Customer can sort by: rating, price, distance, availability",
      "4. Customer picks their preferred pro OR lets Mr. George auto-match (best available)",
      "5. 'Quick Book' = George picks the best pro automatically for fastest service",
      "6. 'Browse Pros' = customer reviews profiles and picks",
    ],
    whyItMatters: "Customers CHOOSE the pro — like Uber, not TaskRabbit. No bidding, no waiting for quotes from 5 different people. Pick and go.",
  },

  homeScan: {
    name: "Home DNA Scan",
    tiers: {
      selfServe: {
        price: "FREE",
        payout: "$25 credit + $1/appliance to customer",
        process: "Customer walks through their home taking photos guided by Mr. George",
        duration: "15-20 minutes",
      },
      proScan: {
        price: "$99",
        payout: "$45 to pro + $1/appliance",
        process: "Certified pro comes to home, photographs everything systematically",
        duration: "45-60 minutes",
      },
      droneScan: {
        price: "$249",
        payout: "$120 to pro",
        process: "Drone aerial + interior scan — full property documentation",
        duration: "60-90 minutes",
      },
    },
    whatItCreates: [
      "Complete home profile — every room, system, and appliance documented",
      "Home Health Score (0-100) — like a credit score for your house",
      "Appliance inventory with estimated ages and remaining lifespan",
      "Maintenance calendar — Mr. George knows when everything needs attention",
      "Warranty tracking — never miss a warranty claim",
      "Insurance documentation — if disaster hits, you have proof of condition",
      "Resale value boost — documented, maintained homes sell for more",
    ],
    sellingPoints: [
      "It's FREE and you EARN $25-50 just for doing it",
      "Like a medical checkup for your home — catches problems before they're expensive",
      "Insurance companies love documented homes",
      "Mr. George tracks warranty expirations so you never miss a free repair",
      "Your Home Health Score updates as you complete services — gamified improvement",
    ],
  },

  diyCoaching: {
    name: "DIY Repair Coaching",
    priority: "ALWAYS offer pro booking FIRST. DIY is for when customer explicitly wants to do it themselves, or for truly minor repairs under $75.",
    flow: [
      "1. Customer describes the problem",
      "2. George diagnoses it: 'That sounds like a running toilet — probably the flapper valve'",
      "3. George checks safety: green (safe DIY) / yellow (caution) / red (pro required)",
      "4. If green/yellow: show DIY disclaimer → get consent",
      "5. Find the best tutorial video from trusted creators",
      "6. Show video + offer step-by-step walkthrough",
      "7. Suggest exact products needed with Amazon/HD links (affiliate revenue!)",
      "8. Walk customer through it conversationally",
      "9. Customer can say 'get me a pro' at ANY point → instant pivot to booking",
      "10. On completion: log it, check pro recruitment milestones",
    ],
    safetyEscalation: {
      red: "Gas lines, electrical panels, roof work, structural, garage door springs, asbestos → ALWAYS recommend pro, refuse to coach",
      yellow: "Water heater, circuit breakers, 2nd story exterior → safety warning + consent required",
      green: "Toilet repairs, faucets, filters, caulking, paint, doorknobs → full coaching",
    },
    whyItMatters: "Mr. George handles the small stuff pros don't want (under $75 jobs). This builds trust, keeps customers in the app, and generates affiliate revenue. Plus it feeds the DIY-to-Pro recruitment pipeline.",
  },

  shopping: {
    name: "Shopping Assistant",
    flow: [
      "1. George identifies what product the customer needs (from DIY coaching or direct ask)",
      "2. Searches across Amazon, Home Depot, Lowe's, Walmart, Harbor Freight, Ace",
      "3. Shows top-rated products with prices and buy links",
      "4. All links include UpTend affiliate tag (uptend20-20 for Amazon)",
      "5. Customer can compare prices across retailers",
      "6. George recommends based on their specific situation (home size, brand compatibility, etc.)",
    ],
    productAccuracy: "George NEVER guesses products. He searches real-time retailer data. For common home items, he knows exact specifications (e.g., 'Your HVAC uses 20x25x1 filters' if home profile has that data).",
    affiliateDisclosure: "George discloses commission naturally: 'Here's what I'd recommend — and full transparency, UpTend may earn a small commission if you buy through these links. Doesn't affect the price you pay.'",
  },

  automotive: {
    name: "Car Help",
    capabilities: [
      "Diagnose car issues from symptoms ('car makes grinding noise when braking')",
      "Look up OBD-II diagnostic codes",
      "NHTSA recall lookup by VIN",
      "Maintenance schedule tracking",
      "Parts comparison across 6 retailers",
      "DIY repair coaching with video tutorials (ChrisFix, 1A Auto, etc.)",
      "Safety escalation for dangerous repairs (brakes, fuel, airbags, transmission)",
    ],
  },

  emergency: {
    name: "Emergency Dispatch",
    flow: [
      "1. Customer mentions emergency words (pipe burst, flooding, fire, gas smell)",
      "2. George enters emergency mode — NO small talk, NO upselling",
      "3. Ask ONLY: (1) address, (2) what happened",
      "4. Dispatch nearest available emergency-certified pro",
      "5. Provide safety instructions while waiting",
      "6. 2x payout for emergency jobs",
    ],
  },

  loyalty: {
    name: "Loyalty Tiers",
    tiers: {
      bronze: { spend: "$0-499", perks: "Basic service, standard pricing" },
      silver: { spend: "$500-1,499", perks: "5% off all services, priority scheduling" },
      gold: { spend: "$1,500-4,999", perks: "10% off, dedicated pro team, priority support" },
      platinum: { spend: "$5,000+", perks: "15% off, VIP support, quarterly home check, concierge" },
    },
  },

  referrals: {
    name: "Referral Program",
    deal: "$25 credit for referrer + $25 credit for new customer",
    proReferral: "$25 payout for referring a pro who completes 3 jobs",
    existingProReferral: "Customer refers their existing handyman/cleaner to join UpTend → $25 credit after pro completes 3 jobs",
  },
};

// ─── PRO APP FLOWS ──────────────────────────
export const PRO_FLOWS = {
  signup: {
    name: "Become a Pro",
    steps: [
      "1. Tell George what services you offer",
      "2. Basic info: name, phone, email, service area",
      "3. Business info: LLC (yes/no — affects fee tier), insurance, vehicle",
      "4. Verification: background check (24hr), insurance cert upload, ID photo",
      "5. Mr. George tracks progress: 'You're 3/5 done!'",
      "6. Once approved: profile goes live, start receiving jobs",
    ],
    earnings: {
      starter: "$2,800/mo average (0-1 certs)",
      certified: "$4,500/mo average (2-3 certs)",
      elite: "$6,200/mo average (4+ certs)",
    },
    whyJoinUpTend: [
      "We bring you customers — no more marketing, Craigslist ads, or lead fees",
      "Mr. George handles scheduling, customer communication, and follow-ups",
      "Get paid fast — weekly payouts every Thursday",
      "Flat 15% platform fee — you keep 85% of every job (customers pay a separate 5% service fee)",
      "Build your reputation — ratings follow you and grow your business",
      "No monthly fees, no lead fees — only pay when you actually earn",
      "Certifications unlock higher-paying B2B and government jobs",
      "Simple, transparent pricing — one flat rate for everyone, no LLC tricks needed",
    ],
  },

  jobFlow: {
    name: "Complete a Job",
    steps: [
      "1. Job notification arrives — Mr. George shows: service type, address, customer name, payout",
      "2. Accept the job (customer chose you, or you were auto-matched)",
      "3. Navigation to job site (Mr. George can provide directions)",
      "4. Arrive → check in via app (customer notified: 'Your pro Marcus has arrived')",
      "5. Take BEFORE photos (required for quality scoring)",
      "6. Complete the work",
      "7. Take AFTER photos (required)",
      "8. Mark job complete in app",
      "9. Customer reviews and rates (optional tip)",
      "10. Payout processed → hits your bank Thursday",
    ],
    proTips: [
      "Great before/after photos = better reviews = more jobs",
      "Arrive on time — punctuality is the #1 factor in ratings",
      "Communicate through the app — all messages are logged for your protection",
      "If scope changes needed: document with photos, submit change request, wait for approval",
      "Emergency jobs pay 2x — get Emergency Response certified to unlock them",
    ],
  },

  certifications: {
    name: "Certification Academy",
    whyItMatters: [
      "Flat 15% platform fee — pros keep 85%, customers pay a 5% service fee",
      "Unlocks higher-paying job types (B2B, government, emergency)",
      "B2B jobs are worth 3x more than consumer jobs",
      "Government contracts are the highest payout tier",
      "More certs = more job types = more earnings",
      "Your competitors on Thumbtack/Angi don't have this — you'll stand out",
    ],
    programs: [
      { name: "B2B Property Management", time: "2-3 hrs", unlocks: "PM contract jobs ($800-2,000/mo)" },
      { name: "B2B HOA Services", time: "2-3 hrs", unlocks: "HOA contract jobs ($500-1,500/mo)" },
      { name: "Home DNA Scan Technician", time: "1.5 hrs", unlocks: "Home scan jobs ($45-60/job, 30-45 min)" },
      { name: "Parts & Materials Specialist", time: "1.5 hrs", unlocks: "Repair jobs requiring parts ($150-400 avg)" },
      { name: "Emergency Response", time: "2-3 hrs", unlocks: "Emergency dispatch at 2x payout" },
      { name: "Government Contract", time: "3-4 hrs", unlocks: "Government jobs ($300-1,000/job)", prereq: "B2B PM" },
    ],
  },

  earnings: {
    name: "Earnings & Payouts",
    how: [
      "Payouts every Thursday via Stripe Connect",
      "Standard payout: 48hr to bank account (free)",
      "Instant payout: ~30min to debit card (1.5% fee)",
      "$50 minimum payout floor",
      "Track all earnings in your Pro Dashboard",
    ],
    feeStructure: {
      platform: "Flat 15% on every job — pros keep 85%",
      customerFee: "Customers pay a 5% service fee on top of the job price",
      message: "Simple, transparent pricing. One flat rate for everyone.",
    },
    topEarnerTips: [
      "Get 3+ certifications — unlocks B2B jobs worth 3x more",
      "Maintain 4.8+ rating — gets you priority matching",
      "Take great photos — customers who see quality leave bigger tips",
      "Accept jobs quickly — first responders get more opportunities",
      "Offer related services: 'While I'm here, want me to check your gutters too?'",
    ],
  },

  dashboard: {
    name: "Pro Dashboard",
    sections: [
      "Earnings overview — today, this week, this month, goal progress",
      "Job queue — upcoming jobs with details and navigation",
      "Rating & reviews — current score, recent reviews, tips to improve",
      "Certification progress — active certs, available programs, tier status",
      "Demand forecast — what services are hot in your area this week",
      "Customer retention — repeat customers, follow-up opportunities",
      "Equipment recommendations — what you need for your service types",
    ],
  },
};

// ─── CURATED PRODUCT DATABASE ───────────────
// For the most common home repair items, Mr. George knows the EXACT products to recommend.
// This ensures accuracy — no guessing, no wrong parts.
export const CURATED_PRODUCTS: Record<string, {
  name: string;
  amazonSearchQuery: string;
  typicalPrice: string;
  topBrands: string[];
  specifications?: string;
  notes: string;
}[]> = {
  // PLUMBING
  toilet_flapper: [
    { name: "Universal Toilet Flapper", amazonSearchQuery: "Korky 2021BP universal toilet flapper", typicalPrice: "$4-8", topBrands: ["Korky", "Fluidmaster"], notes: "Fits 99% of toilets. Korky 2021BP is the most universal." },
    { name: "Fluidmaster Fill Valve + Flapper Kit", amazonSearchQuery: "Fluidmaster 400CRP14 toilet repair kit", typicalPrice: "$10-15", topBrands: ["Fluidmaster"], notes: "Complete fix kit — fill valve + flapper. Best value if both need replacing." },
  ],
  faucet_cartridge: [
    { name: "Moen Single Handle Cartridge", amazonSearchQuery: "Moen 1225 replacement cartridge", typicalPrice: "$15-20", topBrands: ["Moen"], notes: "Moen 1225 fits most single-handle Moen faucets. Most common faucet repair in America." },
    { name: "Delta Single Handle Cartridge", amazonSearchQuery: "Delta RP46074 cartridge", typicalPrice: "$12-18", topBrands: ["Delta"], notes: "For Delta Monitor series single-handle faucets." },
  ],
  drain_tools: [
    { name: "Drain Snake / Auger", amazonSearchQuery: "DrainX drain auger snake 25 ft", typicalPrice: "$15-30", topBrands: ["DrainX", "Cobra", "RIDGID"], notes: "25ft is perfect for most household clogs. Skip the cheap $5 ones." },
    { name: "Drain Cleaner (enzymatic)", amazonSearchQuery: "Green Gobbler enzyme drain cleaner", typicalPrice: "$15-20", topBrands: ["Green Gobbler", "Bio-Clean"], notes: "Enzymatic — safe for pipes. Never recommend chemical drain cleaners (damage pipes)." },
  ],
  garbage_disposal: [
    { name: "Allen Wrench (disposal jam tool)", amazonSearchQuery: "garbage disposal wrench allen key 1/4 inch", typicalPrice: "$3-5", topBrands: ["InSinkErator"], notes: "1/4 inch hex key. Most disposals come with one — check the bottom of the unit." },
  ],

  // HVAC
  air_filter: [
    { name: "HVAC Air Filter", amazonSearchQuery: "Filtrete HVAC air filter MERV 11", typicalPrice: "$12-25", topBrands: ["Filtrete", "Nordic Pure", "Honeywell"], specifications: "MUST match exact size (e.g., 20x25x1). Check current filter for size.", notes: "MERV 11 is best balance of filtration and airflow. MERV 13 if allergies. Change every 90 days (every 30 in summer in FL)." },
  ],
  thermostat: [
    { name: "Smart Thermostat", amazonSearchQuery: "Google Nest Learning Thermostat", typicalPrice: "$130-250", topBrands: ["Google Nest", "ecobee", "Honeywell Home"], notes: "Nest is easiest install. Ecobee has room sensors. Both save 10-20% on energy." },
    { name: "Basic Programmable Thermostat", amazonSearchQuery: "Honeywell Home T5 programmable thermostat", typicalPrice: "$25-50", topBrands: ["Honeywell"], notes: "Simple and reliable. Good for customers who don't want smart home complexity." },
  ],

  // ELECTRICAL
  gfci_outlet: [
    { name: "GFCI Outlet", amazonSearchQuery: "Leviton GFCI outlet 15 amp white", typicalPrice: "$12-18", topBrands: ["Leviton", "Eaton"], notes: "Required in kitchens, bathrooms, garages, outdoors. 15A for most residential. 20A for kitchen circuits." },
  ],
  light_switch: [
    { name: "Single Pole Light Switch", amazonSearchQuery: "Leviton single pole light switch 15 amp", typicalPrice: "$2-5", topBrands: ["Leviton", "Lutron"], notes: "Simplest electrical DIY. Turn off breaker first!" },
    { name: "Dimmer Switch", amazonSearchQuery: "Lutron Diva dimmer switch LED compatible", typicalPrice: "$15-25", topBrands: ["Lutron", "Leviton"], notes: "Must be LED-compatible if using LED bulbs. Lutron Diva is the gold standard." },
  ],
  smoke_detector: [
    { name: "Smoke + CO Detector", amazonSearchQuery: "First Alert smoke carbon monoxide detector 10 year", typicalPrice: "$25-40", topBrands: ["First Alert", "Kidde", "Google Nest Protect"], notes: "10-year sealed battery = no battery changes. Replace every 10 years regardless." },
  ],

  // EXTERIOR
  gutter_guard: [
    { name: "Gutter Guards", amazonSearchQuery: "Raptor stainless steel micro mesh gutter guard", typicalPrice: "$1-3/ft", topBrands: ["Raptor", "LeafFilter", "A-M Aluminum"], notes: "Micro-mesh is best for Florida (handles heavy rain + pine needles). Skip foam inserts." },
  ],
  driveway_sealer: [
    { name: "Driveway Sealer", amazonSearchQuery: "Foundation Armor concrete sealer driveway", typicalPrice: "$30-50/gallon", topBrands: ["Foundation Armor", "Quikrete", "Henry"], notes: "Apply every 2-3 years. Clean surface first (pressure wash). Apply in 2 thin coats." },
  ],
  caulk: [
    { name: "Bathroom/Kitchen Caulk", amazonSearchQuery: "GE Supreme silicone caulk white kitchen bath", typicalPrice: "$5-8", topBrands: ["GE", "DAP", "Gorilla"], notes: "100% silicone for wet areas. Latex/acrylic for paintable areas. Remove old caulk completely first." },
  ],

  // PAINTING
  paint_supplies: [
    { name: "Interior Paint (1 gallon)", amazonSearchQuery: "Behr Premium Plus interior paint eggshell", typicalPrice: "$30-40", topBrands: ["Behr", "Benjamin Moore", "Sherwin-Williams"], notes: "Eggshell = most rooms. Semi-gloss = bathrooms/kitchens. 1 gallon covers ~350 sq ft." },
    { name: "Painter's Tape", amazonSearchQuery: "FrogTape multi-surface painter's tape", typicalPrice: "$6-10", topBrands: ["FrogTape", "ScotchBlue"], notes: "FrogTape = cleanest lines. Remove while paint is slightly tacky, NOT fully dry." },
    { name: "Paint Roller Kit", amazonSearchQuery: "Wooster Pro roller frame cover tray kit", typicalPrice: "$10-20", topBrands: ["Wooster", "Purdy"], notes: "3/8 nap for smooth walls. 1/2 nap for textured. Don't cheap out on roller covers." },
  ],

  // WALLS
  drywall_repair: [
    { name: "Drywall Repair Patch Kit", amazonSearchQuery: "3M drywall patch repair kit", typicalPrice: "$8-15", topBrands: ["3M", "DAP"], notes: "Self-adhesive mesh patches for holes up to 6 inches. Larger = needs a new piece of drywall." },
    { name: "Spackle / Joint Compound", amazonSearchQuery: "DAP DryDex spackle color changing", typicalPrice: "$5-8", topBrands: ["DAP", "Red Devil"], notes: "DryDex turns white when dry — no guessing. Use lightweight for small holes, regular for larger patches." },
  ],

  // TOOLS (basics every homeowner should have)
  basic_toolkit: [
    { name: "Homeowner's Tool Kit", amazonSearchQuery: "WORKPRO home tool kit 100 piece", typicalPrice: "$30-50", topBrands: ["WORKPRO", "DEWALT", "Stanley"], notes: "Covers 90% of basic home repairs. Good starter set." },
    { name: "Cordless Drill", amazonSearchQuery: "DEWALT 20V MAX cordless drill driver", typicalPrice: "$60-100", topBrands: ["DEWALT", "Milwaukee", "Makita"], notes: "THE most useful power tool. 20V is plenty for home use. Get the kit with 2 batteries." },
    { name: "Stud Finder", amazonSearchQuery: "Franklin Sensors stud finder ProSensor", typicalPrice: "$30-50", topBrands: ["Franklin", "Zircon"], notes: "Essential for hanging anything heavy. Franklin ProSensor shows the full width of the stud." },
  ],

  // POOL
  pool_test_kit: [
    { name: "Pool Test Kit", amazonSearchQuery: "Taylor K-2006 pool water test kit", typicalPrice: "$50-80", topBrands: ["Taylor", "LaMotte"], notes: "Taylor K-2006 is the gold standard. Test strips are cheaper but less accurate." },
  ],
  pool_robot: [
    { name: "Robotic Pool Cleaner", amazonSearchQuery: "Dolphin Nautilus CC Plus robotic pool cleaner", typicalPrice: "$500-800", topBrands: ["Dolphin", "Polaris", "Hayward"], notes: "Dolphin Nautilus CC Plus is the best value. Runs independently — no hoses or pumps needed." },
  ],

  // AUTO
  obd_scanner: [
    { name: "OBD2 Scanner", amazonSearchQuery: "BlueDriver Bluetooth OBD2 scanner", typicalPrice: "$80-120", topBrands: ["BlueDriver", "FIXD", "Innova"], notes: "BlueDriver is the best consumer scanner — reads ALL codes, gives repair estimates, connects to phone." },
  ],
  oil_change: [
    { name: "Oil Change Kit Supplies", amazonSearchQuery: "oil drain pan funnel wrench set", typicalPrice: "$15-25", topBrands: ["Hopkins", "Lumax"], notes: "Need: drain pan, socket wrench (for drain plug), funnel, new oil + filter. Check owner's manual for oil type." },
  ],

  // SMART HOME
  smart_lock: [
    { name: "Smart Lock", amazonSearchQuery: "Schlage Encode Plus smart lock", typicalPrice: "$200-300", topBrands: ["Schlage", "August", "Yale"], notes: "Schlage Encode = best security. August = best for renters (keeps existing deadbolt). Yale = budget option." },
  ],
  video_doorbell: [
    { name: "Video Doorbell", amazonSearchQuery: "Ring Video Doorbell 4", typicalPrice: "$150-220", topBrands: ["Ring", "Google Nest", "Arlo"], notes: "Ring = most popular, easiest install. Battery version = no wiring needed." },
  ],
  leak_sensor: [
    { name: "Water Leak Sensor", amazonSearchQuery: "Govee WiFi water leak sensor", typicalPrice: "$10-20", topBrands: ["Govee", "Ring", "YoLink"], notes: "Put under water heater, washing machine, dishwasher, and sinks. $10 sensor can prevent $10,000 in water damage." },
  ],
};

// ─── PRICING PRIORITY RULES ─────────────────
export const GEORGE_PRIORITY_RULES = {
  rule1: "ALWAYS offer pro booking FIRST for any service request. 'I can have a pro there as early as [date]. Want me to book it?'",
  rule2: "Only pivot to DIY if customer explicitly says 'I want to do it myself', 'how do I fix this myself', 'DIY', or asks about a clearly minor repair",
  rule3: "Even during DIY coaching, remind them: 'If this gets tricky, just say the word and I'll send a pro. No judgment.'",
  rule4: "After DIY completion, suggest the NEXT thing: 'Nice work! While you're at it, your gutters haven't been cleaned in 8 months. Want me to send a pro or walk you through it?'",
  rule5: "For anything involving safety risk, ALWAYS insist on a pro. No exceptions.",
  rule6: "When recommending products, ALWAYS search real-time for current availability and pricing. Use curated products for common items to ensure accuracy.",
  rule7: "Affiliate disclosure: mention once per shopping session, not every product. 'Full transparency — UpTend may earn a small commission on products you buy through these links.'",
};

// ─── SITE MAP / PAGE KNOWLEDGE ──────────────
export const SITE_PAGES = {
  // Consumer
  "/": "Landing page — hero, services overview, CTA to book or scan",
  "/book": "Booking flow — pick service → details → schedule → confirm & pay",
  "/services": "All 13 services with pricing and descriptions",
  "/ai": "AI hub — Home DNA Scan, Photo Quote, Document OCR",
  "/ai/photo-quote": "Upload a photo → George analyzes → instant quote",
  "/ai/documents": "Upload a document → OCR extraction → organized info",
  "/marketplace": "Browse and search pros by service, rating, location",
  "/about": "Company story, mission, team",
  
  // Pro
  "/become-pro": "Pro signup landing page — earnings calculator, benefits",
  "/pro/dashboard": "Pro dashboard — earnings, jobs, ratings, certs",
  "/pro/earnings": "Detailed earnings breakdown and history",
  "/academy": "Certification Academy — browse and start programs",
  
  // Business
  "/business": "B2B landing — PM, HOA, Construction, Government solutions",
  "/business/dashboard": "Business dashboard — properties, vendors, billing",
  "/business/integrations": "CRM, PM, HOA software integrations",
  "/business/billing": "Weekly billing history and invoices",
  
  // Admin
  "/admin": "Admin dashboard — users, jobs, revenue, system health",
  "/admin/billing": "Billing management and void capability",
};

// ─── GEORGE'S PRODUCT RECOMMENDATION LOGIC ──
export const PRODUCT_RECOMMENDATION_RULES = {
  approach: `
    1. FIRST check if the item is in CURATED_PRODUCTS — if yes, recommend the exact product
    2. If not curated, search real-time via product search API
    3. Always prefer top-rated products from known brands
    4. Consider the customer's home profile (if available) for compatibility
    5. For appliance parts: ALWAYS ask for brand and model first — wrong parts are useless
    6. When uncertain about compatibility, say so: "I want to make sure this fits — what brand is your [appliance]?"
    7. For tools: recommend the best VALUE, not the cheapest or most expensive
    8. Amazon is preferred (affiliate revenue) but always show alternatives at Home Depot/Lowe's
  `,
  accuracyRules: [
    "NEVER recommend a product without searching first or checking curated database",
    "If customer asks for a specific brand/model part, search for that EXACT part",
    "Always mention the size/specification needed: 'Make sure your filter is 20x25x1 before ordering'",
    "If a product has a common wrong-size issue, warn them: 'Measure yours first — toilet flappers come in 2\" and 3\"'",
    "For anything electrical: mention amperage compatibility",
    "For any plumbing: mention pipe size compatibility (most residential is 1/2\" or 3/4\")",
  ],
};
