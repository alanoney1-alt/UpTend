/**
 * 144 SEO Landing Pages — Every combination of 12 services × 12 cities
 * Auto-generated data with unique, city-specific content for each page.
 * Uses the existing SeoServicePage component for rendering.
 */
import { useParams } from "wouter";
import { SeoServicePage, type SeoServicePageData } from "./seo-service-page";
import {
  Trash2, Droplets, Home, Wrench, TreePine, Truck,
  Hammer, Warehouse, Waves, Sparkles, Search, Wind,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ── City Data ──────────────────────────────────────────────────────────
interface CityInfo {
  name: string;
  slug: string;
  landmarks: string[];
  neighborhoods: string[];
  homeTypes: string[];
  description: string;
  whyLocals: string[];
  isLive?: boolean;
}

const CITIES: CityInfo[] = [
  {
    name: "Lake Nona",
    slug: "lake-nona",
    isLive: true,
    landmarks: ["Lake Nona Town Center", "USTA National Campus", "Laureate Park", "Lake Nona Medical City", "Boxi Park"],
    neighborhoods: ["Laureate Park", "Village Walk", "Northlake Park", "Moss Park", "Eagle Creek", "Randal Park", "Storey Park", "Sunbridge", "Tavistock", "Lake Nona Golf & Country Club"],
    homeTypes: ["modern smart homes", "new-construction townhomes", "lakefront estates", "master-planned community homes"],
    description: "Lake Nona is one of Orlando's fastest-growing master-planned communities, known for cutting-edge smart homes, the USTA National Campus, and Medical City. Residents here expect premium service that matches their innovative neighborhood.",
    whyLocals: ["We know Lake Nona's HOA standards and community guidelines", "Same-day service for Laureate Park and Village Walk residents", "Trusted by hundreds of Lake Nona families since launch", "Familiar with new-construction home needs and warranty timelines", "Quick response times — our pros are based in East Orlando", "Eco-friendly practices that align with Lake Nona's sustainability mission"],
  },
  {
    name: "Winter Park",
    slug: "winter-park",
    landmarks: ["Park Avenue", "Rollins College", "Kraft Azalea Garden", "Winter Park Farmers' Market", "Charles Hosmer Morse Museum"],
    neighborhoods: ["Baldwin Park", "College Park", "Hannibal Square", "Via Tuscany", "Palmer Avenue Historic District", "Windsong", "Winter Park Pines", "Lake Killarney", "Orwin Manor", "Temple Drive"],
    homeTypes: ["1920s Mediterranean Revival estates", "historic bungalows", "lakefront mansions", "mid-century modern homes"],
    description: "Winter Park is Central Florida's premier historic community, famous for its brick-lined Park Avenue, oak canopies, and chain of lakes. Many homes here are historic properties requiring careful, knowledgeable service providers who respect original materials and finishes.",
    whyLocals: ["Experience with historic homes and delicate materials", "Trusted in Baldwin Park and along Park Avenue", "We respect Winter Park's strict code enforcement standards", "Familiar with mature tree root systems and older plumbing", "Premium service matching Winter Park's high standards", "Fully insured to work on historic and high-value properties"],
  },
  {
    name: "Dr. Phillips",
    slug: "dr-phillips",
    landmarks: ["Restaurant Row", "Dr. Phillips Center for the Performing Arts", "Sand Lake Road", "Mall at Millenia", "Universal Studios vicinity"],
    neighborhoods: ["Bay Hill", "Cypress Point", "Turkey Lake Shores", "Parkside Estates", "Dr. Phillips Village", "Phillips Landing", "Metrowest", "Sand Lake Hills", "Palm Lake", "The Cove at Bay Hill"],
    homeTypes: ["luxury pool homes", "gated community estates", "Mediterranean-style villas", "golf course properties"],
    description: "Dr. Phillips is an upscale Orlando suburb centered around Restaurant Row and Bay Hill, home to the famous Arnold Palmer Invitational. Properties here feature large lots, mature landscaping, and resort-style pools that require professional maintenance.",
    whyLocals: ["Experienced with Bay Hill and gated community access protocols", "Know the specific needs of large pool homes on Restaurant Row", "Trusted by Dr. Phillips HOAs and property managers", "Familiar with luxury finishes and high-end materials", "Quick routing from our base — Dr. Phillips is in our core zone", "Respect for quiet hours in residential golf communities"],
  },
  {
    name: "Windermere",
    slug: "windermere",
    landmarks: ["Windermere Town Hall", "Butler Chain of Lakes", "Isleworth Golf & Country Club", "West Orange Trail", "Lake Down"],
    neighborhoods: ["Isleworth", "Keene's Pointe", "Lake Butler Sound", "Windermere Trails", "Stoneybrook West", "Belmere Village", "Lake Crescent Estates", "The Reserve at Windermere", "Windermere Cay", "Oakland Park"],
    homeTypes: ["multi-million-dollar lakefront estates", "gated luxury homes", "custom-built mansions", "equestrian properties"],
    description: "Windermere is the crown jewel of Orlando luxury living, sitting on the Butler Chain of Lakes and home to some of Central Florida's most valuable real estate including Isleworth. Service providers here must meet exacting standards and often work alongside estate managers.",
    whyLocals: ["Trusted by Isleworth and Keene's Pointe estate managers", "Background-checked pros who pass gated community requirements", "Experience with high-value properties and premium finishes", "Familiar with lakefront property maintenance challenges", "Discrete, professional service for high-profile homeowners", "Fully insured for estates valued $1M+"],
  },
  {
    name: "Celebration",
    slug: "celebration",
    landmarks: ["Celebration Town Center", "Celebration Golf Club", "Celebration Lake", "Bohemian Hotel", "Water Tower"],
    neighborhoods: ["North Village", "South Village", "West Village", "Artisan Park", "Celebration Place", "Spring Lake", "Aquila Reserve", "Mirabella", "Celebration Residential Resort", "Mallard Point"],
    homeTypes: ["neo-traditional homes", "Victorian-style townhomes", "Craftsman cottages", "Disney-area estate homes"],
    description: "Originally developed by Disney, Celebration is a meticulously planned community known for its charming architecture, walkable streets, and picture-perfect Town Center. Homes follow strict architectural guidelines, and residents value services that maintain Celebration's distinctive aesthetic.",
    whyLocals: ["Familiar with Celebration's strict architectural review board standards", "Know the unique maintenance needs of neo-traditional and Craftsman homes", "Trusted by Celebration property management for years", "Experience navigating Celebration's specific access and parking rules", "Maintain the Disney-quality curb appeal residents expect", "Serve all three villages — North, South, and West"],
  },
  {
    name: "Kissimmee",
    slug: "kissimmee",
    landmarks: ["Old Town Kissimmee", "Lakefront Park", "Osceola County Courthouse", "Loop & Margaritaville Resort", "Shingle Creek Regional Park"],
    neighborhoods: ["Poinciana", "BellaVida", "Reunion Resort", "Champions Gate", "Paradise Palms", "Remington", "Buena Ventura Lakes", "Hunters Creek", "The Oaks", "Campbell"],
    homeTypes: ["vacation rental properties", "single-family starter homes", "resort-area condos", "ranch-style homes"],
    description: "Kissimmee is a vibrant city south of Orlando blending residential neighborhoods with one of the world's busiest vacation rental corridors. Many homeowners here also manage short-term rental properties that need quick turnaround services between guests.",
    whyLocals: ["Fast turnaround service ideal for vacation rental hosts", "Know the Osceola County permitting and code requirements", "Bilingual pros available (English and Spanish)", "Experience with both residential and short-term rental properties", "Affordable pricing that works for Kissimmee's cost-conscious market", "Cover Reunion, Champions Gate, and Poinciana areas"],
  },
  {
    name: "Winter Garden",
    slug: "winter-garden",
    landmarks: ["Winter Garden Village", "West Orange Trail", "Garden Theatre", "Downtown Winter Garden", "Crooked Can Brewing"],
    neighborhoods: ["Hamlin", "Horizons West", "Summerlake", "Waterleigh", "Johns Lake Pointe", "Hickory Nut", "Stoneybrook Hills", "Lakeshore at Narcoossee", "Oakland Trails", "Crown Point"],
    homeTypes: ["new-construction in master-planned communities", "historic downtown cottages", "large-lot family homes", "modern farmhouse-style builds"],
    description: "Winter Garden has transformed from a quiet citrus town into one of metro Orlando's most desirable suburbs, anchored by its revitalized downtown and the booming Horizons West corridor. New construction and growing families make this a high-demand service area.",
    whyLocals: ["Active in Hamlin, Horizons West, and Summerlake communities", "Understand new-construction builder warranty timelines", "Know Winter Garden's rapid growth means more homes need service", "Familiar with Horizon West's newer infrastructure and community rules", "Love supporting Winter Garden's small-town-meets-modern vibe", "Quick service from our West Side coverage team"],
  },
  {
    name: "Altamonte Springs",
    slug: "altamonte-springs",
    landmarks: ["Altamonte Mall", "Cranes Roost Park", "Uptown Altamonte", "SunRail Altamonte Station", "Spring Hammock Preserve"],
    neighborhoods: ["Spring Oaks", "Weathersfield", "Lake Brantley", "Forest City", "Jamestown", "The Springs", "Spring Valley", "Sabal Point", "North Shore at Lake Hart", "Eastmonte Park"],
    homeTypes: ["established 1980s-90s single-family homes", "lakefront ranch homes", "updated condos near Uptown", "townhomes near Cranes Roost"],
    description: "Altamonte Springs is a well-established city just north of Orlando, known for Cranes Roost Park and the newly developed Uptown district. Many homes here are from the 1980s-90s boom and need regular maintenance, updates, and occasional renovation support.",
    whyLocals: ["Know the older home systems common in Altamonte — aging HVAC, original gutters, mature landscaping", "Quick access via I-4 and 436 — fast response times", "Trusted by Spring Oaks, Weathersfield, and The Springs HOAs", "Experience with 30-40 year old homes that need TLC", "SunRail-adjacent — our team navigates Altamonte easily", "Affordable service for a community that values smart spending"],
  },
  {
    name: "Ocoee",
    slug: "ocoee",
    landmarks: ["Bill Breeze Park", "Ocoee Lakeshore Center", "West Oaks Mall", "Starke Lake", "Ocoee City Hall"],
    neighborhoods: ["Westyn Bay", "BlackLake", "Forest Brooke", "Meadow Woods", "Country Walk", "Clarke Shores", "Lakewood Estates", "Remington Pointe", "The Willows", "Fullers Cross"],
    homeTypes: ["newer suburban homes", "family-sized 4-bedroom builds", "lakefront homes on Starke Lake", "townhome communities"],
    description: "Ocoee is a growing West Orange County suburb where young families and established residents enjoy a mix of newer developments and established neighborhoods around Starke Lake. It's close to major highways making it easy for service pros to reach.",
    whyLocals: ["Cover all of Ocoee including Westyn Bay and BlackLake", "Fast routing from West Side — typically under 20 minutes", "Know Ocoee's family-friendly neighborhoods and their needs", "Experience with newer-build warranty issues common in the area", "Competitively priced for West Orange County", "Strong relationships with Ocoee property managers"],
  },
  {
    name: "Sanford",
    slug: "sanford",
    landmarks: ["Historic Downtown Sanford", "Sanford Riverwalk", "Central Florida Zoo", "Wayne Densch Performing Arts Center", "Lake Monroe"],
    neighborhoods: ["Rivella at Sanford", "Mayfair", "Sanford Historic District", "Hidden Lake", "Park Place", "Groveview Village", "Cameron City", "Lake Forest", "Brisson Avenue", "Georgetown"],
    homeTypes: ["historic Victorian and Craftsman homes", "waterfront properties on Lake Monroe", "new townhome developments", "renovated downtown lofts"],
    description: "Sanford is experiencing a renaissance with its revitalized downtown, craft breweries, and waterfront development along Lake Monroe. The city's blend of historic homes and new construction creates diverse service needs from careful restoration to modern maintenance.",
    whyLocals: ["Experience with Sanford's historic homes — some dating to the 1880s", "Know the specific challenges of Lake Monroe waterfront properties", "Serve the booming new developments in East Sanford", "Familiar with Sanford's historic preservation guidelines", "Fast service from our Seminole County coverage area", "Support Sanford's downtown revival — we love this community"],
  },
  {
    name: "Apopka",
    slug: "apopka",
    landmarks: ["Wekiwa Springs State Park", "Rock Springs Run", "Northwest Recreation Complex", "Apopka Amphitheater", "Lake Apopka Wildlife Drive"],
    neighborhoods: ["Errol Estate", "Piedmont Lakes", "Wekiva Run", "The Reserve at Apopka", "Marden Ridge", "Lake McCoy Estates", "Forest Lake", "Paradise Heights", "Sheeler Oaks", "Kelly Park Estates"],
    homeTypes: ["suburban family homes on large lots", "Wekiva-area nature properties", "horse-friendly rural estates", "newer subdivision homes"],
    description: "Apopka, known as the 'Indoor Foliage Capital of the World,' offers a more rural, spacious feel while staying connected to Orlando. Properties tend to have larger lots, more outdoor space, and often border natural preserves — creating unique service needs.",
    whyLocals: ["Understand the unique needs of Apopka's larger lots and rural properties", "Experience near Wekiwa Springs with nature-adjacent home maintenance", "Know Apopka's well water and septic system considerations", "Serve Errol Estate, Piedmont Lakes, and newer subdivisions", "Familiar with Apopka's nursery industry and its impact on local landscaping", "Fast coverage from our North Orlando service area"],
  },
  {
    name: "Clermont",
    slug: "clermont",
    landmarks: ["Clermont Waterfront Park", "Florida Citrus Tower", "Clermont Arts & Recreation Center", "Lake Minneola", "Lakeridge Winery"],
    neighborhoods: ["Olympus", "Hartwood Reserve", "Legends", "Cagan Crossings", "Kings Ridge", "Minneola Hills", "Palms of Serenoa", "Sawgrass Bay", "Cypress Key", "Summit Greens"],
    homeTypes: ["hilltop homes with elevation views", "55+ active adult communities", "lakefront properties", "newer large-family homes"],
    description: "Clermont sits in the rolling hills of South Lake County, offering some of Central Florida's only elevated terrain and lake views. The area is booming with new construction and active-adult communities, creating strong demand for reliable home services.",
    whyLocals: ["Know Clermont's hilly terrain and its impact on drainage and landscaping", "Serve Kings Ridge, Legends, and other 55+ communities with senior-friendly service", "Experience with Clermont's sandy soil and its effects on foundations", "Fast response from our West Side team — cover all of South Lake County", "Familiar with newer-build community standards in Olympus and Hartwood", "Understand the unique maintenance needs of hilltop and lakefront properties"],
  },
];

// ── Service Data ───────────────────────────────────────────────────────
interface ServiceInfo {
  name: string;
  slug: string;
  icon: LucideIcon;
  gradient: string;
  pricingLabel: string;
  startingAt: string;
  pricingDetails: string;
  features: string[];
  baseFaqs: { q: string; a: string }[];
  schemaServiceType: string;
  getDescription: (city: CityInfo) => string[];
}

const SERVICES: ServiceInfo[] = [
  {
    name: "Junk Removal",
    slug: "junk-removal",
    icon: Trash2,
    gradient: "from-orange-600 to-red-700",
    pricingLabel: "Junk Removal",
    startingAt: "From $99",
    pricingDetails: "Quarter truck from $99 · Half truck $179 · Full truck $299. Heavy items +$50. No hidden fees.",
    features: ["Same-day pickup available", "Furniture & appliance removal", "Construction debris hauling", "Eco-friendly disposal & donation", "Garage, attic & basement cleanouts", "Estate & foreclosure cleanups", "Yard waste removal", "Hot tub & shed demolition + removal"],
    baseFaqs: [
      { q: "What items do you accept?", a: "We take almost everything — furniture, appliances, electronics, yard waste, construction debris, and general household junk. We cannot accept hazardous materials like paint, chemicals, or medical waste." },
      { q: "How is pricing determined?", a: "Pricing is based on volume. A quarter truckload starts at $99, half truck at $179, and a full truck at $299. Heavy items like pianos or safes add $50. What you see is what you pay — no hidden fees." },
      { q: "Do you recycle or donate items?", a: "Absolutely. We sort every load and donate usable items to local charities. Recyclable materials go to certified facilities. We typically divert 60-70% of items from landfills." },
    ],
    schemaServiceType: "Junk Removal Service",
    getDescription: (city) => [
      `Need junk removed in ${city.name}? UpTend provides fast, affordable junk removal for ${city.homeTypes.join(", ")} throughout the ${city.name} area. From old furniture and appliances to yard debris and construction waste, our licensed and insured pros handle it all.`,
      `We serve every neighborhood in ${city.name} including ${city.neighborhoods.slice(0, 5).join(", ")}, and more. Whether you're decluttering before a move, cleaning out an estate, or just tired of that pile in the garage, we'll have it gone — often the same day you book.`,
      `Our ${city.name} junk removal team sorts every load, donating usable items to Central Florida charities and recycling what we can. Near ${city.landmarks[0]} or ${city.landmarks[1]}? We're just minutes away. Book online in 60 seconds and get a transparent price — no surprises.`,
    ],
  },
  {
    name: "Pressure Washing",
    slug: "pressure-washing",
    icon: Droplets,
    gradient: "from-blue-600 to-cyan-700",
    pricingLabel: "Pressure Washing",
    startingAt: "From $120",
    pricingDetails: "$0.25/sq ft · $120 minimum. Driveways, patios, pool decks, house exteriors, fences, and more.",
    features: ["Driveway & sidewalk cleaning", "House exterior soft washing", "Pool deck & patio restoration", "Fence & deck cleaning", "Roof soft washing", "Commercial pressure washing", "Pre-paint surface prep", "Mold & mildew removal"],
    baseFaqs: [
      { q: "How much does pressure washing cost?", a: "We charge $0.25 per square foot with a $120 minimum. A typical two-car driveway runs $120-$150. We'll give you an exact price before we start." },
      { q: "Will pressure washing damage my surfaces?", a: "Our pros adjust pressure settings for each surface. We use soft washing techniques for delicate materials like stucco and painted wood, and higher pressure for concrete and pavers." },
      { q: "How often should I pressure wash in Florida?", a: "In Florida's humid climate, we recommend pressure washing your home exterior, driveway, and walkways at least once a year. Pool decks and north-facing surfaces may need cleaning every 6 months." },
    ],
    schemaServiceType: "Pressure Washing Service",
    getDescription: (city) => [
      `Florida's humidity means ${city.name} homes battle mold, mildew, and algae year-round. UpTend's professional pressure washing service restores ${city.homeTypes.join(", ")} to like-new condition — driveways, walkways, pool decks, and full home exteriors.`,
      `Our ${city.name} pressure washing pros serve ${city.neighborhoods.slice(0, 4).join(", ")}, and surrounding areas. We adjust our approach for every surface — soft washing for stucco and painted surfaces, higher pressure for concrete and brick. Every job includes pre-treatment and eco-friendly detergents.`,
      `Living near ${city.landmarks[0]}? ${city.name}'s unique environment means your exterior surfaces collect grime faster than you'd think. Regular pressure washing not only boosts curb appeal but protects your home's value. Book online — pricing starts at just $0.25/sq ft with a $120 minimum.`,
    ],
  },
  {
    name: "Gutter Cleaning",
    slug: "gutter-cleaning",
    icon: Wind,
    gradient: "from-teal-600 to-green-700",
    pricingLabel: "Gutter Cleaning",
    startingAt: "From $129",
    pricingDetails: "1-story from $129 · 2-story from $199 · 3-story from $350. Large homes (150-250 ft) slightly more.",
    features: ["Full gutter debris removal", "Downspout flushing & clearing", "Gutter condition inspection", "Before & after photos", "Roof edge debris clearing", "Minor gutter repairs", "Gutter guard assessment", "Seasonal maintenance plans"],
    baseFaqs: [
      { q: "How much does gutter cleaning cost?", a: "A standard 1-story home (up to 150 linear feet) starts at $129. Larger 1-story homes run $179. 2-story homes start at $199 ($259 for larger), and 3-story homes start at $350." },
      { q: "How often should gutters be cleaned in Florida?", a: "We recommend at least twice a year — once after fall leaves drop and once after spring pollen season. Homes near oak trees or pines may need quarterly cleaning." },
      { q: "Do you repair gutters too?", a: "We handle minor repairs like reattaching loose sections and resealing joints during our cleaning visit. For major repairs or gutter replacement, we'll provide a separate quote." },
    ],
    schemaServiceType: "Gutter Cleaning Service",
    getDescription: (city) => [
      `Clogged gutters cause thousands in water damage — especially during ${city.name}'s summer storm season. UpTend's gutter cleaning service keeps the ${city.homeTypes.join(", ")} across ${city.name} protected from overflows, foundation damage, and roof leaks.`,
      `Our pros clean gutters across ${city.neighborhoods.slice(0, 5).join(", ")}, and every other ${city.name} neighborhood. Each visit includes full debris removal, downspout flushing, and a condition inspection with before-and-after photos so you can see the difference.`,
      `${city.name} homes near ${city.landmarks[0]} and ${city.landmarks[1]} are surrounded by mature trees that drop leaves, pine needles, and debris into gutters year-round. Don't wait for the next rainstorm to find out your gutters are clogged. Book a professional cleaning starting at just $129.`,
    ],
  },
  {
    name: "Home Cleaning",
    slug: "home-cleaning",
    icon: Sparkles,
    gradient: "from-pink-600 to-purple-700",
    pricingLabel: "Home Cleaning",
    startingAt: "From $99",
    pricingDetails: "2BR from $99 · 3BR $149 · 4BR $199 · 5BR+ $249. Deep clean and move-in/out available.",
    features: ["Kitchen deep clean", "Bathroom sanitization", "Floor mopping & vacuuming", "Dusting all surfaces", "Baseboard & trim cleaning", "Interior window cleaning", "Appliance exterior wiping", "Move-in / move-out cleans"],
    baseFaqs: [
      { q: "How much does home cleaning cost?", a: "Standard cleaning starts at $99 for 2 bedrooms, $149 for 3 bedrooms, $199 for 4 bedrooms, and $249 for 5+ bedrooms. Deep cleans and move-out cleans may cost more depending on condition." },
      { q: "What's included in a standard clean?", a: "Every clean includes kitchen and bathroom deep cleaning, vacuuming and mopping all floors, dusting surfaces and ceiling fans, wiping down appliances, and cleaning baseboards." },
      { q: "Do I need to be home during cleaning?", a: "No — many customers provide a door code or leave a key. Our pros are background-checked, insured, and trusted in hundreds of homes across Central Florida." },
    ],
    schemaServiceType: "House Cleaning Service",
    getDescription: (city) => [
      `Keep your ${city.name} home sparkling with UpTend's professional cleaning service. We clean ${city.homeTypes.join(", ")} throughout the area — from weekly maintenance to deep cleans and move-in/move-out turnovers.`,
      `Our cleaning pros serve ${city.neighborhoods.slice(0, 5).join(", ")}, and all ${city.name} neighborhoods. Every cleaner is background-checked, insured, and trained to our standards. We bring all supplies and equipment — you just enjoy a spotless home.`,
      `Whether you're near ${city.landmarks[0]} or across ${city.name}, booking a clean takes 60 seconds. ${city.name} residents love our transparent pricing — no hourly guessing, no surprise charges. Just a clean home, every time.`,
    ],
  },
  {
    name: "Handyman",
    slug: "handyman",
    icon: Wrench,
    gradient: "from-amber-600 to-orange-700",
    pricingLabel: "Handyman Services",
    startingAt: "$75/hour",
    pricingDetails: "$75/hour per pro · 1-hour minimum. TV mounting, furniture assembly, minor repairs, and more.",
    features: ["TV & shelf mounting", "Furniture assembly", "Door & lock repairs", "Drywall patching", "Light fixture installation", "Ceiling fan install/replace", "Caulking & weatherstripping", "Picture hanging & décor install"],
    baseFaqs: [
      { q: "How much does a handyman cost?", a: "Our handyman service is $75 per hour with a 1-hour minimum. Most small jobs (TV mounting, furniture assembly, minor repairs) take 1-2 hours. We'll estimate time before starting." },
      { q: "What can your handyman do?", a: "Our skilled pros handle TV mounting, furniture assembly, drywall repair, door and lock fixes, light fixture installation, ceiling fans, caulking, painting touch-ups, and dozens of other small to medium tasks." },
      { q: "Do I need to provide tools or materials?", a: "Our pros bring a full toolkit. For jobs requiring specific materials (special hardware, light fixtures, etc.), we'll let you know in advance so you can have them ready, or we can pick them up." },
    ],
    schemaServiceType: "Handyman Service",
    getDescription: (city) => [
      `Need a handyman in ${city.name}? UpTend connects you with skilled, background-checked pros who handle everything from TV mounting and furniture assembly to drywall repairs and fixture installations in ${city.homeTypes.join(", ")}.`,
      `Our handyman pros cover all of ${city.name} including ${city.neighborhoods.slice(0, 5).join(", ")}. At $75/hour with a 1-hour minimum, you get professional results without the hassle of finding a reliable contractor. Most jobs are done in a single visit.`,
      `Whether it's a honey-do list that's been growing for months or a quick fix near ${city.landmarks[0]}, UpTend's handyman service makes it easy. Book online, pick your time slot, and our pro shows up ready to work.`,
    ],
  },
  {
    name: "Landscaping",
    slug: "landscaping",
    icon: TreePine,
    gradient: "from-green-600 to-emerald-700",
    pricingLabel: "Landscaping",
    startingAt: "From $59",
    pricingDetails: "One-time mow from $59 · Mow & Go $99/mo · Full Service $159/mo · Premium $249/mo. Yard cleanup $149-$299.",
    features: ["Weekly lawn mowing", "Edging & trimming", "Hedge & bush trimming", "Mulch installation", "Flower bed maintenance", "Leaf removal & yard cleanup", "Sod installation", "Irrigation system checks"],
    baseFaqs: [
      { q: "What landscaping plans do you offer?", a: "We offer one-time mowing (from $59), Mow & Go monthly ($99/mo), Full Service monthly ($159/mo including trimming and edging), and Premium monthly ($249/mo with mulching and flower bed care). All prices for ¼ acre — larger lots slightly more." },
      { q: "Do you offer one-time yard cleanups?", a: "Yes! Yard cleanups range from $149 to $299 depending on size and condition. Great for overgrown yards, pre-sale prep, or seasonal cleanups." },
      { q: "How often do you mow?", a: "Our monthly plans include weekly mowing during growing season (March-October) and bi-weekly during winter months. Florida grass grows year-round, so consistent care is key." },
    ],
    schemaServiceType: "Landscaping Service",
    getDescription: (city) => [
      `Keep your ${city.name} yard looking pristine with UpTend's landscaping services. From weekly mowing to full-service landscape maintenance, we care for the ${city.homeTypes.join(", ")} across ${city.name} with plans starting at just $59.`,
      `Our landscaping crews serve ${city.neighborhoods.slice(0, 5).join(", ")}, and all surrounding ${city.name} neighborhoods. Florida's year-round growing season means your lawn needs consistent attention — our monthly plans keep it handled so you can enjoy your weekends.`,
      `${city.name}'s climate near ${city.landmarks[0]} means St. Augustine and Bermuda grass thrive but need regular cutting, edging, and feeding. Whether you need a one-time cleanup or year-round maintenance, UpTend's landscaping team has you covered.`,
    ],
  },
  {
    name: "Moving Labor",
    slug: "moving-labor",
    icon: Truck,
    gradient: "from-indigo-600 to-blue-700",
    pricingLabel: "Moving Labor",
    startingAt: "$65/hr per pro",
    pricingDetails: "$65/hour per crew member · 1-hour minimum. Loading, unloading, furniture rearrangement, and more.",
    features: ["Truck loading & unloading", "Furniture disassembly & reassembly", "Heavy item moving", "In-home furniture rearrangement", "Storage unit loading", "Apartment & condo moves", "Office & commercial moves", "Same-day availability"],
    baseFaqs: [
      { q: "How does moving labor pricing work?", a: "We charge $65 per hour per crew member with a 1-hour minimum. A typical 2-person crew for a 1-bedroom apartment takes 2-3 hours. You provide the truck — we provide the muscle." },
      { q: "Do you provide the truck?", a: "We provide the labor — loading, unloading, and heavy lifting. You can rent a truck from U-Haul, Penske, or Budget, and we'll load and unload it. We also help with in-home rearrangements and storage unit work." },
      { q: "Can you move heavy or awkward items?", a: "Yes! Our pros are trained and equipped for heavy items like pianos, safes, pool tables, and large appliances. We use furniture blankets, dollies, and straps to protect your items and property." },
    ],
    schemaServiceType: "Moving Labor Service",
    getDescription: (city) => [
      `Moving in ${city.name}? UpTend's moving labor service provides strong, professional crews to load and unload your truck, rearrange furniture, or help with any heavy lifting. We work with ${city.homeTypes.join(", ")} and know the area's stairs, elevators, and tight corners.`,
      `Our movers serve ${city.neighborhoods.slice(0, 5).join(", ")}, and every part of ${city.name}. At $65/hour per crew member, you get insured professionals who show up on time, protect your belongings, and get the job done efficiently.`,
      `Whether you're relocating near ${city.landmarks[0]} or moving across town, UpTend's labor-only model saves you money. Rent your truck, book our crew, and you're moved. Same-day availability in ${city.name} means you don't have to wait.`,
    ],
  },
  {
    name: "Light Demolition",
    slug: "light-demolition",
    icon: Hammer,
    gradient: "from-red-600 to-rose-800",
    pricingLabel: "Light Demolition",
    startingAt: "From $199",
    pricingDetails: "Starting at $199. Shed removal, deck tear-out, interior demo, drywall, flooring removal, and more.",
    features: ["Shed & playhouse removal", "Deck & fence tear-out", "Drywall removal", "Flooring & tile removal", "Cabinet & countertop demo", "Interior wall removal (non-structural)", "Hot tub removal", "Concrete breaking (small areas)"],
    baseFaqs: [
      { q: "What is light demolition?", a: "Light demolition covers removal of non-structural elements like sheds, decks, fences, drywall, flooring, cabinets, and other fixtures. We don't touch structural walls, roofing, or anything requiring engineering — those need a licensed general contractor." },
      { q: "How much does light demolition cost?", a: "Projects start at $199. A typical shed removal runs $199-$399. Deck tear-outs range $299-$599. Interior demo (drywall, flooring, cabinets) is quoted based on scope. We'll give you a firm price before starting." },
      { q: "Do you handle debris removal?", a: "Yes — our light demo service includes hauling away all debris. We sort materials for recycling when possible. You get a clean space ready for your next project." },
    ],
    schemaServiceType: "Light Demolition Service",
    getDescription: (city) => [
      `Planning a renovation in ${city.name}? UpTend's light demolition service handles shed removal, deck tear-outs, drywall demo, flooring removal, and more for the ${city.homeTypes.join(", ")} across the area. We demo it, haul it, and leave you a clean slate.`,
      `Our demo crews work throughout ${city.name} including ${city.neighborhoods.slice(0, 5).join(", ")}. Starting at $199, we provide the labor, tools, and debris removal so you can focus on the rebuild. Every project includes a firm price upfront — no cost creep.`,
      `Homeowners near ${city.landmarks[0]} and across ${city.name} trust UpTend for controlled demolition that respects neighboring properties and follows local codes. Whether it's a bathroom gut or a backyard shed, we make demo day easy.`,
    ],
  },
  {
    name: "Garage Cleanout",
    slug: "garage-cleanout",
    icon: Warehouse,
    gradient: "from-slate-600 to-zinc-800",
    pricingLabel: "Garage Cleanout",
    startingAt: "From $129",
    pricingDetails: "1-2 car garage from $129 · 3+ car garage from $199. Includes sorting, hauling, and sweeping.",
    features: ["Full garage clearing", "Sort & organize remaining items", "Junk hauling included", "Donation drop-off for usable items", "Floor sweeping & cleanup", "Shelf & rack organization", "Storage bin recommendations", "Before & after photos"],
    baseFaqs: [
      { q: "How much does a garage cleanout cost?", a: "A standard 1-2 car garage cleanout starts at $129. Larger 3+ car garages start at $199. Price includes labor, hauling, and cleanup. Extremely full garages or those with heavy items may cost more." },
      { q: "What happens to the items?", a: "We sort everything into keep, donate, and dispose categories. Usable items go to local charities, recyclables to proper facilities, and the rest is responsibly disposed of. You decide what stays." },
      { q: "How long does a garage cleanout take?", a: "Most 2-car garages take 2-3 hours. We show up with a crew, sort quickly, load up, and leave your garage clean and organized. You can supervise or let us handle it." },
    ],
    schemaServiceType: "Garage Cleanout Service",
    getDescription: (city) => [
      `Reclaim your garage in ${city.name}. UpTend's garage cleanout service transforms cluttered, unusable garages in ${city.homeTypes.join(", ")} back into functional space. We sort, haul, clean, and organize — you just point and direct.`,
      `Our cleanout teams serve all ${city.name} neighborhoods including ${city.neighborhoods.slice(0, 5).join(", ")}. Starting at $129, every cleanout includes junk removal, donation drop-off for usable items, and a swept, clean garage floor when we leave.`,
      `${city.name} residents near ${city.landmarks[0]} know how fast a garage fills up — especially in Florida where there's no basement. Stop parking in the driveway and book a garage cleanout today. Most jobs are done in one visit.`,
    ],
  },
  {
    name: "Pool Cleaning",
    slug: "pool-cleaning",
    icon: Waves,
    gradient: "from-cyan-600 to-blue-700",
    pricingLabel: "Pool Cleaning",
    startingAt: "From $99/mo",
    pricingDetails: "Basic $99/mo · Standard $165/mo · Full Service $210/mo · Deep clean (one-time) $249. All pool types.",
    features: ["Weekly chemical balancing", "Surface skimming & vacuuming", "Filter cleaning & monitoring", "Basket & pump clearing", "Tile & waterline cleaning", "Equipment health checks", "Green pool recovery", "Seasonal opening & closing"],
    baseFaqs: [
      { q: "What pool cleaning plans do you offer?", a: "Basic ($99/mo) covers weekly chemicals, surface skimming, and basket emptying. Standard ($165/mo) adds brushing, vacuuming, and filter checks. Full Service ($210/mo) includes tile cleaning, equipment monitoring, and full filter cleaning." },
      { q: "Can you fix a green pool?", a: "Yes — our deep clean service ($249 one-time) handles neglected and green pools. We shock, vacuum, clean filters, and restore water clarity. Usually takes 2-3 visits depending on severity." },
      { q: "How often do you service pools?", a: "All monthly plans include weekly service. Florida's heat and rain make weekly maintenance essential to prevent algae, imbalanced chemicals, and equipment issues." },
    ],
    schemaServiceType: "Pool Cleaning Service",
    getDescription: (city) => [
      `Keep your ${city.name} pool crystal clear with UpTend's professional pool cleaning service. We maintain pools in ${city.homeTypes.join(", ")} with weekly chemical balancing, skimming, vacuuming, and equipment monitoring — plans starting at just $99/month.`,
      `Our pool technicians serve ${city.neighborhoods.slice(0, 5).join(", ")}, and every pool in ${city.name}. Florida's intense sun and summer storms wreak havoc on pool chemistry. Our weekly service prevents algae, protects your equipment, and keeps your pool swim-ready year-round.`,
      `${city.name} homes near ${city.landmarks[0]} often have screened and unscreened pools that each need different care. Whether you need weekly maintenance or a one-time deep clean for a neglected pool ($249), UpTend's certified pool pros have you covered.`,
    ],
  },
  {
    name: "Carpet Cleaning",
    slug: "carpet-cleaning",
    icon: Sparkles,
    gradient: "from-violet-600 to-purple-800",
    pricingLabel: "Carpet Cleaning",
    startingAt: "From $50/room",
    pricingDetails: "Standard $50/room · Deep $75/room · Pet treatment $89/room · 3BR package $129 · 4-5BR package $215. $100 minimum.",
    features: ["Hot water extraction (steam clean)", "Pre-treatment & spot removal", "Deep soil agitation", "Pet odor enzyme treatment", "Scotchgard protection ($20/room)", "Hallway & stair cleaning", "Whole-house packages", "Quick 4-6 hour dry time"],
    baseFaqs: [
      { q: "How much does carpet cleaning cost?", a: "Standard steam cleaning is $50 per room. Deep cleaning with enzyme treatment is $75/room. Pet odor treatment is $89/room. We also offer whole-house packages: 3BR/2BA for $129 and 4-5BR for $215. $100 minimum per visit." },
      { q: "How long does carpet take to dry?", a: "Most carpets dry in 4-6 hours with proper ventilation. We use powerful extraction that removes most moisture. Opening windows and running fans speeds drying. We recommend staying off carpets for 4 hours." },
      { q: "Can you remove pet stains and odors?", a: "Yes — our pet treatment ($89/room) includes professional enzyme cleaners that break down urine proteins and eliminate odors at the source, not just mask them. Multiple treatments may be needed for severe cases." },
    ],
    schemaServiceType: "Carpet Cleaning Service",
    getDescription: (city) => [
      `Professional carpet cleaning in ${city.name} starting at just $50 per room. UpTend uses hot water extraction (steam cleaning) to deep-clean carpets in ${city.homeTypes.join(", ")} — removing dirt, allergens, pet dander, and stains that vacuuming alone can't touch.`,
      `We serve carpeted homes throughout ${city.name} including ${city.neighborhoods.slice(0, 5).join(", ")}. Florida's humidity traps allergens in carpet fibers, making professional cleaning essential for indoor air quality. Our process includes pre-treatment, deep extraction, and optional Scotchgard protection.`,
      `${city.name} residents near ${city.landmarks[0]} — whether you have kids, pets, or just high-traffic areas — trust UpTend for thorough, affordable carpet cleaning. Book a whole-house package (3BR for $129, 4-5BR for $215) and save compared to per-room pricing.`,
    ],
  },
  {
    name: "Home DNA Scan",
    slug: "home-dna-scan",
    icon: Search,
    gradient: "from-emerald-600 to-teal-700",
    pricingLabel: "Home DNA Scan",
    startingAt: "Free",
    pricingDetails: "Complimentary home health assessment. Our expert evaluates your home's condition and creates a personalized maintenance plan.",
    features: ["Full exterior inspection", "Interior systems assessment", "Roof & gutter visual check", "HVAC & plumbing overview", "Personalized maintenance plan", "Priority issue identification", "Cost estimates for repairs", "Digital report delivered same-day"],
    baseFaqs: [
      { q: "What is a Home DNA Scan?", a: "It's a comprehensive home health assessment where our expert walks through your property, evaluates its condition, and creates a prioritized maintenance plan. Think of it as an annual physical for your home." },
      { q: "Is it really free?", a: "Yes — the Home DNA Scan consultation is completely free with no obligation. We believe every homeowner deserves to know their home's true condition. If you choose to address issues we find, we'll provide competitive quotes." },
      { q: "How long does the scan take?", a: "A typical Home DNA Scan takes 45-60 minutes for an average home. Larger properties may take longer. You'll receive a digital report with photos and recommendations the same day." },
    ],
    schemaServiceType: "Home Inspection Service",
    getDescription: (city) => [
      `Discover what your ${city.name} home really needs with UpTend's free Home DNA Scan. Our trained experts assess ${city.homeTypes.join(", ")} throughout ${city.name}, identifying maintenance issues before they become expensive problems.`,
      `We conduct Home DNA Scans across all ${city.name} neighborhoods including ${city.neighborhoods.slice(0, 5).join(", ")}. Each scan includes an exterior inspection, interior systems review, and a personalized maintenance roadmap — delivered digitally the same day. No charge, no obligation.`,
      `Homes near ${city.landmarks[0]} in ${city.name} face unique challenges from Florida's heat, humidity, and storm season. Our scan identifies issues specific to your area — from moisture intrusion to aging roofing — so you can prioritize what matters most. Book your free scan today.`,
    ],
  },
];

// ── Generate all 144 page data objects ─────────────────────────────────
function generatePageData(service: ServiceInfo, city: CityInfo): SeoServicePageData {
  const slug = `${service.slug}-${city.slug}`;
  const h1 = `${service.name} in ${city.name}, FL`;
  const metaTitle = `${service.name} in ${city.name}, FL | ${service.startingAt} | UpTend`;
  const metaDescription = `Professional ${service.name.toLowerCase()} in ${city.name}, Florida. ${service.startingAt}. Licensed, insured, same-day available. Serving ${city.neighborhoods.slice(0, 3).join(", ")} & more. Book in 60 seconds.`;
  
  // City-specific FAQ
  const cityFaqs: { q: string; a: string }[] = [
    ...service.baseFaqs,
    {
      q: `Do you serve all of ${city.name}?`,
      a: `Yes! We serve every neighborhood in ${city.name} including ${city.neighborhoods.slice(0, 6).join(", ")}, and more. Our pros are familiar with the area and typically arrive within the scheduled window.`,
    },
    {
      q: `How quickly can you get to ${city.name}?`,
      a: `We offer same-day service in ${city.name} for most bookings made before 2 PM. Our ${city.name}-area pros are local, so response times are fast. Book online and select your preferred time slot.`,
    },
  ];

  return {
    slug,
    h1,
    metaTitle,
    metaDescription,
    heroTagline: `Professional, insured ${service.name.toLowerCase()} for ${city.name} homes. Book in 60 seconds — ${service.startingAt.toLowerCase()}.`,
    heroGradient: service.gradient,
    icon: service.icon,
    serviceDescription: service.getDescription(city),
    features: service.features,
    pricing: {
      label: service.pricingLabel,
      startingAt: service.startingAt,
      details: service.pricingDetails,
    },
    neighborhoods: city.neighborhoods,
    localContent: {
      areaName: city.name,
      whyLocalsChoose: city.whyLocals,
      areaDescription: city.description,
    },
    faqs: cityFaqs,
    schemaService: {
      serviceType: service.schemaServiceType,
      description: `Professional ${service.name.toLowerCase()} service in ${city.name}, FL. ${service.pricingDetails}`,
      areaServed: `${city.name}, FL`,
    },
    isLive: city.isLive ?? false,
  };
}

// Build the lookup map: slug → SeoServicePageData
const PAGE_MAP = new Map<string, SeoServicePageData>();

for (const service of SERVICES) {
  for (const city of CITIES) {
    const data = generatePageData(service, city);
    PAGE_MAP.set(data.slug, data);
  }
}

/** Get all 144 slugs (for sitemap generation, etc.) */
export function getAllSeoServiceCitySlugs(): string[] {
  return Array.from(PAGE_MAP.keys());
}

/** Get page data by slug */
export function getSeoServiceCityPageData(slug: string): SeoServicePageData | undefined {
  return PAGE_MAP.get(slug);
}

/** The routable component — reads :slug from URL params */
export default function SeoServiceCityPage() {
  const params = useParams<{ slug: string }>();
  const data = params.slug ? PAGE_MAP.get(params.slug) : undefined;

  if (!data) {
    // Fallback — will be caught by NotFound route in practice
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Page not found.</p>
      </div>
    );
  }

  return <SeoServicePage data={data} />;
}
