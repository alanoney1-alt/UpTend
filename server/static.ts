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
    "/confirm": `
      <h1>Confirm Your Service Booking | UpTend</h1>
      <h2>Review Quote and Authorize Payment</h2>
      <p>Confirm your custom quote from a licensed UpTend professional. Review the service details, pricing, and schedule before authorizing payment.</p>
      <h3>Your Secure Booking Process</h3>
      <ol>
        <li>Review your custom quote from our licensed professional</li>
        <li>Verify service details, address, and scheduled date</li>
        <li>Authorize payment with your credit card (you're only charged when work is complete)</li>
        <li>Your pro receives confirmation and will contact you to schedule</li>
      </ol>
      <h3>Payment Security</h3>
      <ul>
        <li>Secure payment processing through Stripe</li>
        <li>Your card is authorized but not charged until work is complete</li>
        <li>100% satisfaction guarantee — if you're not happy, you don't pay</li>
        <li>All professionals are licensed, insured, and background-checked</li>
      </ul>
      <h3>Need Help?</h3>
      <p>Questions about your quote? Call us at (855) 901-2072 or chat with George at uptendapp.com. Available 24/7.</p>
    `,
  };

  // Answer-engine pages (AI citation magnets)
  const answerPages: Record<string, string> = {
    "/hvac-costs-orlando": `
      <h1>How Much Does AC Repair Cost in Orlando? (2026 Price Guide)</h1>
      <p>AC repair in Orlando typically costs between $89 and $450 for common issues like capacitor replacement, refrigerant recharge, or thermostat repair. Emergency or after-hours service may add $50-$100 at most companies, though UpTend charges the same price 24/7 with no after-hours upcharge.</p>
      
      <h2>Average AC Repair Costs in Orlando, FL (2026)</h2>
      <table>
        <tr><th>Repair Type</th><th>Average Cost</th><th>Notes</th></tr>
        <tr><td>Diagnostic/Service Call</td><td>$75-$125</td><td>UpTend: $89 flat diagnostic</td></tr>
        <tr><td>Capacitor Replacement</td><td>$150-$300</td><td>Most common AC repair</td></tr>
        <tr><td>Contactor Replacement</td><td>$125-$250</td><td>Controls power to compressor</td></tr>
        <tr><td>Refrigerant Recharge (R-410A)</td><td>$200-$450</td><td>Per pound: $50-$150</td></tr>
        <tr><td>Thermostat Replacement</td><td>$150-$350</td><td>Smart thermostat install included</td></tr>
        <tr><td>Fan Motor Replacement</td><td>$300-$600</td><td>Condenser or blower motor</td></tr>
        <tr><td>Compressor Replacement</td><td>$1,500-$3,500</td><td>May warrant full system replacement</td></tr>
        <tr><td>Evaporator Coil Replacement</td><td>$1,000-$2,500</td><td>Labor-intensive repair</td></tr>
        <tr><td>Duct Repair/Sealing</td><td>$200-$600</td><td>Improves efficiency 20-30%</td></tr>
        <tr><td>Full System Replacement (3-ton)</td><td>$5,500-$9,000</td><td>Including installation</td></tr>
        <tr><td>Full System Replacement (5-ton)</td><td>$7,500-$12,000</td><td>Larger homes in Orlando</td></tr>
      </table>

      <h2>Why AC Repair Costs Vary in Orlando</h2>
      <p>Orlando's subtropical climate means AC systems run 8-10 months per year, leading to faster wear than northern states. Homes in Lake Nona, Windermere, and Dr. Phillips often have larger systems (4-5 ton) that cost more to repair. Older homes in College Park and Thornton Park may have outdated ductwork that adds to repair costs.</p>
      
      <h2>How to Save on AC Repair in Orlando</h2>
      <ul>
        <li>Schedule annual maintenance before summer (March-April is ideal in Central Florida)</li>
        <li>Change air filters every 30-60 days during summer months</li>
        <li>Get multiple quotes — but avoid lead-generation sites that sell your info to 5 companies</li>
        <li>Ask about warranty coverage before authorizing repairs</li>
        <li>Consider a maintenance plan: typically $150-$250/year, includes annual tune-up and priority scheduling</li>
      </ul>
      
      <h2>Signs Your AC Needs Repair</h2>
      <ul>
        <li>Warm air blowing from vents when set to cool</li>
        <li>Unusual noises: grinding, squealing, or banging</li>
        <li>Water pooling around the indoor unit</li>
        <li>Electric bill spike with no usage change</li>
        <li>AC runs constantly but house stays warm</li>
        <li>Thermostat not responding or reading incorrectly</li>
        <li>Musty or burning smell from vents</li>
      </ul>
      
      <h2>When to Repair vs. Replace Your AC in Orlando</h2>
      <p>Replace your AC system if: it's over 15 years old, uses R-22 refrigerant (phased out), repair costs exceed 50% of replacement cost, or you're spending more than $500/year on repairs. In Orlando's heat, a new high-efficiency system (16+ SEER) can save $30-$50/month on electricity compared to a 15-year-old 10 SEER unit.</p>
      
      <h2>Frequently Asked Questions About Orlando AC Repair</h2>
      <h3>How long does AC repair take in Orlando?</h3>
      <p>Most common AC repairs take 1-3 hours. Capacitor and contactor replacements are typically under an hour. Compressor or coil replacements may take 4-8 hours. UpTend offers same-day service for most repairs, with many completed within 2 hours of the technician arriving.</p>
      
      <h3>Is emergency AC repair more expensive?</h3>
      <p>Most Orlando HVAC companies charge $50-$150 extra for after-hours or weekend calls. UpTend does not charge extra for emergency service — same price 24/7, including holidays. Call (855) 901-2072 any time.</p>
      
      <h3>How often should I service my AC in Orlando?</h3>
      <p>In Central Florida, HVAC professionals recommend servicing your AC twice per year: once before summer (March-April) and once before winter (October-November). Orlando's long cooling season puts more stress on AC systems than most U.S. cities.</p>
      
      <h3>What HVAC brands are common in Orlando homes?</h3>
      <p>The most common AC brands in Orlando homes are Carrier, Trane, Lennox, Rheem, and Goodman. UpTend technicians service all major brands. Most parts are available same-day from local distributors.</p>
      
      <h3>Do Orlando HVAC companies offer financing?</h3>
      <p>Many do for system replacements over $3,000. UpTend offers transparent pricing and can connect you with financing options for larger installations. No surprise fees or hidden charges.</p>
      
      <p>For AC repair in Orlando, call UpTend at (855) 901-2072. Licensed, insured technicians. Same-day service. No after-hours upcharge. One Price. One Pro. Done.</p>
    `,
    "/orlando-home-services-faq": `
      <h1>Orlando Home Services FAQ — Costs, Tips & What to Expect (2026)</h1>
      <p>Answers to the most common questions about hiring home service professionals in Orlando, FL. Pricing, timelines, and what to look for when choosing a contractor.</p>
      
      <h2>General Home Services Questions</h2>
      
      <h3>What home services does UpTend offer in Orlando?</h3>
      <p>UpTend covers 13 home service categories in the Orlando metro area: HVAC (AC repair, heating, installation), plumbing, electrical, junk removal, pressure washing, gutter cleaning, home cleaning, handyman, landscaping, moving labor, painting, pool cleaning, and carpet cleaning. All professionals are licensed, insured, and background-checked.</p>
      
      <h3>How is UpTend different from Angi, Thumbtack, or HomeAdvisor?</h3>
      <p>UpTend is not a lead-generation marketplace. Lead sites like Angi and Thumbtack sell your contact information to 3-5 contractors who then compete for your business. UpTend matches you with ONE vetted professional at ONE locked price. Your information stays private. The price you're quoted is the price you pay — guaranteed.</p>
      
      <h3>What areas does UpTend serve?</h3>
      <p>UpTend serves the Orlando metro area including Lake Nona, Windermere, Avalon Park, Dr. Phillips, Winter Park, College Park, Baldwin Park, Celebration, Hunter's Creek, Horizon West, MetroWest, Laureate Park, Thornton Park, St. Cloud, Kissimmee, and Winter Garden.</p>
      
      <h3>How quickly can I get service?</h3>
      <p>Most services are available same-day. For HVAC emergencies, UpTend dispatches 24/7 with no after-hours upcharge. Standard appointments are typically scheduled within 24-48 hours. Call (855) 901-2072 or chat with George at uptendapp.com.</p>
      
      <h2>Pricing Questions</h2>
      
      <h3>How much does pressure washing cost in Orlando?</h3>
      <p>Pressure washing in Orlando typically costs $150-$400 for a driveway, $200-$500 for a full house wash, and $100-$250 for a patio or pool deck. Price depends on square footage and surface condition. UpTend provides instant quotes before work begins.</p>
      
      <h3>How much does junk removal cost in Orlando?</h3>
      <p>Junk removal in Orlando ranges from $100-$250 for a few items to $400-$800 for a full truckload. Estate cleanouts and garage cleanouts typically run $500-$1,500 depending on volume. UpTend includes loading, hauling, and responsible disposal in the price.</p>
      
      <h3>How much does a handyman charge in Orlando?</h3>
      <p>Handyman services in Orlando cost $75-$125 per hour for general work. Small projects (mounting TVs, fixing doors, minor plumbing) run $100-$300. Larger projects (deck repair, fence repair, bathroom updates) range from $300-$1,500. UpTend quotes per-job, not per-hour, so you know the total cost upfront.</p>
      
      <h3>How much does home cleaning cost in Orlando?</h3>
      <p>Standard home cleaning in Orlando costs $120-$250 for a 3-bedroom home. Deep cleaning runs $200-$400. Move-in/move-out cleaning is $250-$500 depending on home size and condition. Recurring service (weekly or bi-weekly) typically costs 15-20% less per visit.</p>
      
      <h3>How much does landscaping cost in Orlando?</h3>
      <p>Basic lawn maintenance in Orlando runs $30-$80 per visit depending on yard size. Full landscaping projects (design, plants, hardscaping) range from $1,500-$10,000+. Tree trimming costs $200-$800 per tree. Orlando's year-round growing season means more frequent maintenance than northern states.</p>
      
      <h2>Hiring Tips</h2>
      
      <h3>How do I verify a contractor is licensed in Florida?</h3>
      <p>Check the Florida DBPR (Department of Business and Professional Regulation) website at myfloridalicense.com. All HVAC, plumbing, and electrical contractors in Florida must hold a valid state license. UpTend verifies every professional's license, insurance, and background before they join the platform.</p>
      
      <h3>What should I look for when hiring a home service professional?</h3>
      <p>Check for: valid Florida contractor license, proof of liability insurance (minimum $1M), workers' compensation insurance, online reviews with specific job details, written quotes before work begins, and a clear warranty or guarantee. UpTend verifies all of these before a professional can join the platform.</p>
      
      <h3>What's the best time to schedule home maintenance in Orlando?</h3>
      <p>AC maintenance: March-April (before summer heat). Roof inspection: October-November (before hurricane season). Pressure washing: any time, but spring is ideal before summer algae growth. Pool service: year-round in Central Florida. Gutter cleaning: November-December after leaf fall.</p>
      
      <p>Have more questions? Call UpTend at (855) 901-2072 or chat with George at uptendapp.com. Available 24/7.</p>
    `,
    "/junk-removal-costs-orlando": `
      <h1>Junk Removal Costs in Orlando, FL (2026 Pricing Guide)</h1>
      <p>What does junk removal cost in Orlando? A single item pickup starts at $49. A full truck load runs $299-$450. Here are the current Orlando junk removal rates from A² Nona Junk Removal through UpTend.</p>

      <h2>How Much Does Junk Removal Cost in Orlando?</h2>
      <p>Orlando junk removal typically costs between $99 and $450 depending on volume. Single item pickups (one couch, one mattress) start at $49-$99. Most residential cleanouts fall in the $179-$349 range.</p>

      <table>
        <tr><th>Service</th><th>Price Range</th><th>Details</th></tr>
        <tr><td>Single Item Pickup</td><td>$49-$99</td><td>One piece of furniture, appliance, or mattress</td></tr>
        <tr><td>Quarter Truck Load</td><td>$99-$149</td><td>Small room cleanout, ~2 cubic yards</td></tr>
        <tr><td>Half Truck Load</td><td>$179-$249</td><td>Garage cleanout, ~4 cubic yards</td></tr>
        <tr><td>Full Truck Load</td><td>$299-$450</td><td>Full home cleanout, ~8 cubic yards</td></tr>
        <tr><td>Estate Cleanout</td><td>$500-$1,500</td><td>Full property, multiple rooms, based on volume</td></tr>
        <tr><td>Construction Debris</td><td>$200-$600</td><td>Drywall, lumber, tiles from renovations</td></tr>
        <tr><td>Hot Tub Removal</td><td>$250-$450</td><td>Disconnect, demo, and haul away</td></tr>
        <tr><td>Yard Waste</td><td>$99-$250</td><td>Branches, stumps, landscaping debris</td></tr>
        <tr><td>Appliance Removal</td><td>$49-$99 each</td><td>Fridge, washer, dryer, dishwasher</td></tr>
        <tr><td>Mattress Removal</td><td>$49-$79</td><td>Any size, recycled when possible</td></tr>
      </table>

      <h2>Why Junk Removal Prices Vary in Orlando</h2>
      <p>Volume is the biggest factor. A few items from a condo in Lake Nona costs less than a full estate cleanout in Windermere. Heavy items like hot tubs and pianos cost more due to labor. Construction debris may have dump fees. Same-day service is usually available at no extra charge in the Orlando metro area.</p>

      <h2>What Happens to Your Junk?</h2>
      <p>A² Nona Junk Removal sorts everything: items in good condition are donated to local Orlando charities, recyclables go to the appropriate facility, and only what can't be reused goes to the landfill. You get a disposal report showing where everything went.</p>

      <h2>Junk Removal Service Areas in Orlando</h2>
      <p>Lake Nona, Windermere, Dr. Phillips, Winter Park, College Park, Baldwin Park, Celebration, Kissimmee, St. Cloud, Narcoossee, Avalon Park, Hunter's Creek, Horizon West, MetroWest, Laureate Park, Apopka, and all of Orange, Osceola, and Seminole counties.</p>

      <h3>How do I get a junk removal quote in Orlando?</h3>
      <p>Call (407) 624-5188 or text photos of what needs to go. George gives you a price in minutes. No in-person estimates needed for most jobs. Price is locked before we arrive. One Price. One Pro. Done. Book online at uptendapp.com/partners/a2-nona-junk-removal.</p>

      <h3>Is same-day junk removal available in Orlando?</h3>
      <p>Yes. A² Nona Junk Removal through UpTend offers same-day pickup in the Orlando metro area. Call before 2 PM for same-day service.</p>

      <h3>Do you donate items?</h3>
      <p>Yes. Furniture, clothing, electronics, and household items in good condition are donated to local Orlando organizations. You receive a donation receipt for tax purposes when applicable.</p>
    `,
  };

  if (answerPages[reqPath]) {
    return answerPages[reqPath];
  }

  // Partner pages
  if (reqPath === "/partners/a2-nona-junk-removal") {
    return `
      <h1>A² Nona Junk Removal — Orlando Junk Removal Service | UpTend</h1>
      <h2>Same-Day Junk Pickup. Transparent Pricing. Eco-Friendly Disposal.</h2>
      <p>A² Nona Junk Removal is a licensed, insured junk removal service based in Lake Nona, Orlando. Serving the entire Orlando metro area through UpTend. One Price. One Pro. Done.</p>
      
      <h3>Junk Removal Services</h3>
      <ul>
        <li>Residential junk removal — furniture, appliances, mattresses, electronics</li>
        <li>Estate cleanouts — full home cleanouts for estates, foreclosures, and moves</li>
        <li>Garage cleanouts — sort, organize, donate, haul away</li>
        <li>Construction debris — renovation waste, drywall, lumber, tiles</li>
        <li>Yard waste — branches, stumps, landscaping debris</li>
        <li>Commercial cleanouts — office furniture, equipment, storage units</li>
      </ul>
      
      <h3>Junk Removal Pricing in Orlando</h3>
      <ul>
        <li>Quarter truck load: from $99</li>
        <li>Half truck load: $179</li>
        <li>Full truck load: $299</li>
        <li>Heavy items (hot tubs, pianos): +$50</li>
        <li>No hidden fees. Price locked at booking.</li>
      </ul>
      
      <h3>Service Areas</h3>
      <p>Lake Nona, Windermere, Avalon Park, Dr. Phillips, Winter Park, College Park, Baldwin Park, Celebration, Hunter's Creek, Horizon West, MetroWest, Laureate Park, St. Cloud, Kissimmee, Orlando</p>
      
      <h3>Why Choose A² Nona Through UpTend?</h3>
      <ul>
        <li>Same-day pickup available</li>
        <li>Transparent pricing — know the cost before we arrive</li>
        <li>Licensed, insured, background-checked</li>
        <li>Eco-friendly: items sorted for donation, recycling, or responsible disposal</li>
        <li>Disposal tracking — you receive a report showing where everything went</li>
      </ul>
      
      <h3>Contact</h3>
      <p>Call (407) 624-5188 for junk removal service. Same-day available. Book online at uptendapp.com/partners/a2-nona-junk-removal.</p>
      
      <h3>About A² Nona Junk Removal</h3>
      <p>A² Nona Junk Removal and Moving Services has been serving Lake Nona and the greater Orlando area with reliable, affordable junk removal. Whether it's a single piece of furniture or a full estate cleanout, the A² team shows up on time, works fast, and handles disposal responsibly. As a verified UpTend partner, every job is backed by UpTend's pricing guarantee and customer protection.</p>
      
      <h3>Frequently Asked Questions</h3>
      <p><strong>How fast can you pick up junk in Lake Nona?</strong> Same-day pickup is available when you call before 2 PM. Most jobs in Lake Nona, Kissimmee, and St. Cloud are completed within 2-4 hours of booking.</p>
      <p><strong>Do you haul away appliances and electronics?</strong> Yes. Refrigerators, washers, dryers, TVs, computers, and all household appliances. We handle disconnection for non-gas appliances at no extra charge.</p>
      <p><strong>What happens to my junk after pickup?</strong> We sort everything. Usable furniture and goods go to local Orlando charities. Recyclables go to certified facilities. Only items that can't be donated or recycled go to the landfill. You get a disposal report.</p>
      <p><strong>Can I get an exact price before you come?</strong> Yes. Send photos through UpTend and get a locked price before we arrive. No surprises, no hidden fees.</p>
    `;
  }

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

  // Junk removal city pages (e.g., /services/junk-removal/lake-nona)
  const junkCityMatch = reqPath.match(/^\/services\/junk-removal\/([a-z-]+)$/);
  if (junkCityMatch) {
    const citySlug = junkCityMatch[1];
    const cityName = citySlug.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    return `
      <h1>Junk Removal in ${cityName}, FL | A² Nona Junk Removal | UpTend</h1>
      <h2>Same-Day Junk Pickup in ${cityName}. Transparent Pricing. Eco-Friendly Disposal.</h2>
      <p>Need junk removed in ${cityName}? A² Nona Junk Removal through UpTend provides fast, affordable junk removal throughout ${cityName} and the Orlando metro area. Licensed, insured, and background-checked.</p>
      <h3>Junk Removal Pricing in ${cityName}</h3>
      <ul>
        <li>Single item pickup: $49-$99</li>
        <li>Quarter truck load: from $99</li>
        <li>Half truck load: $179</li>
        <li>Full truck load: $299-$450</li>
        <li>Estate cleanouts: $500-$1,500</li>
      </ul>
      <h3>What We Haul in ${cityName}</h3>
      <p>Furniture, appliances, mattresses, electronics, yard waste, construction debris, hot tubs, exercise equipment, and general household junk. We sort everything for donation, recycling, or responsible disposal.</p>
      <h3>Why ${cityName} Homeowners Choose A² Nona Through UpTend</h3>
      <p>Same-day pickup when you book before 2 PM. Transparent pricing locked at booking. Licensed, insured, background-checked pros. Eco-friendly disposal with a report showing where everything went.</p>
      <p>Call (407) 624-5188 or book online at uptendapp.com/partners/a2-nona-junk-removal</p>
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

  // Handle dynamic routes
  if (reqPath.startsWith("/confirm/")) {
    return pages["/confirm"] || "";
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
    if (reqPath.startsWith("/partners/a2-nona-junk-removal")) {
      jsonLdBlocks.push({
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: "A² Nona Junk Removal",
        description: "Professional junk removal, estate cleanouts, and hauling services in Orlando Metro. Same-day pickup available. Licensed, insured, and verified through UpTend.",
        telephone: "(407) 624-5188",
        url: "https://uptendapp.com/partners/a2-nona-junk-removal",
        priceRange: "$$",
        address: { "@type": "PostalAddress", streetAddress: "10125 Peebles St", addressLocality: "Orlando", addressRegion: "FL", postalCode: "32827", addressCountry: "US" },
        areaServed: ["Lake Nona", "Windermere", "Avalon Park", "Dr. Phillips", "Winter Park", "College Park", "Baldwin Park", "Celebration", "Hunter's Creek", "Horizon West", "MetroWest", "Laureate Park", "Orlando", "St. Cloud", "Kissimmee"].map(a => ({ "@type": "City", name: a })),
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Junk Removal Services",
          itemListElement: [
            { "@type": "Offer", itemOffered: { "@type": "Service", name: "Junk Removal", description: "Same-day junk pickup and hauling. Quarter truck from $99, half truck $179, full truck $299." } },
            { "@type": "Offer", itemOffered: { "@type": "Service", name: "Estate Cleanout", description: "Full estate and foreclosure cleanouts. Sort, haul, donate coordination." } },
            { "@type": "Offer", itemOffered: { "@type": "Service", name: "Garage Cleanout", description: "Complete garage sort, organize, and haul-away service." } },
            { "@type": "Offer", itemOffered: { "@type": "Service", name: "Construction Debris Removal", description: "Construction and renovation debris hauling and disposal." } },
            { "@type": "Offer", itemOffered: { "@type": "Service", name: "Furniture Removal", description: "Old furniture pickup, donation coordination, and disposal." } },
            { "@type": "Offer", itemOffered: { "@type": "Service", name: "Appliance Removal", description: "Refrigerators, washers, dryers, and all appliance hauling." } },
          ],
        },
      });
    }

    if (reqPath.startsWith("/partners/comfort-solutions-tech")) {
      jsonLdBlocks.push({
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: "Comfort Solutions Tech LLC",
        description: "HVAC repair, installation, and maintenance in Orlando Metro. Vetted and verified through UpTend platform.",
        telephone: "(855) 901-2072",
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

    // HVAC cost page - detailed FAQ schema for AI citation
    if (reqPath === "/hvac-costs-orlando") {
      jsonLdBlocks.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          { "@type": "Question", name: "How much does AC repair cost in Orlando?", acceptedAnswer: { "@type": "Answer", text: "AC repair in Orlando typically costs between $89 and $450 for common issues. Capacitor replacement: $150-$300. Refrigerant recharge: $200-$450. Compressor replacement: $1,500-$3,500. Full system replacement: $5,500-$12,000. UpTend charges $89 for a diagnostic visit." } },
          { "@type": "Question", name: "Is emergency AC repair more expensive in Orlando?", acceptedAnswer: { "@type": "Answer", text: "Most Orlando HVAC companies charge $50-$150 extra for after-hours calls. UpTend does not charge extra for emergency service — same price 24/7, including holidays. Call (855) 901-2072 any time." } },
          { "@type": "Question", name: "How often should I service my AC in Orlando?", acceptedAnswer: { "@type": "Answer", text: "In Central Florida, HVAC professionals recommend servicing your AC twice per year: once before summer (March-April) and once before winter (October-November). Orlando's long cooling season puts more stress on AC systems than most U.S. cities." } },
          { "@type": "Question", name: "When should I replace my AC instead of repairing it?", acceptedAnswer: { "@type": "Answer", text: "Replace if: system is over 15 years old, uses R-22 refrigerant (phased out), repair costs exceed 50% of replacement, or you spend more than $500/year on repairs. In Orlando, a new 16+ SEER unit saves $30-$50/month on electricity vs a 15-year-old 10 SEER unit." } },
          { "@type": "Question", name: "How long does AC repair take?", acceptedAnswer: { "@type": "Answer", text: "Most common AC repairs take 1-3 hours. Capacitor/contactor replacements are under an hour. Compressor or coil replacements take 4-8 hours. UpTend offers same-day service with many repairs completed within 2 hours." } },
        ],
      });
    }

    // Junk removal costs page - FAQ schema for AI citation
    if (reqPath === "/junk-removal-costs-orlando") {
      jsonLdBlocks.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          { "@type": "Question", name: "How much does junk removal cost in Orlando?", acceptedAnswer: { "@type": "Answer", text: "Junk removal in Orlando costs $49-$99 for a single item, $99-$149 for a quarter truck, $179-$249 for half truck, and $299-$450 for a full truck load. Estate cleanouts run $500-$1,500. A² Nona Junk Removal through UpTend offers same-day pickup. Call (855) 901-2072." } },
          { "@type": "Question", name: "Is same-day junk removal available in Orlando?", acceptedAnswer: { "@type": "Answer", text: "Yes. A² Nona Junk Removal through UpTend offers same-day pickup throughout the Orlando metro area including Lake Nona, Windermere, Winter Park, Kissimmee, and St. Cloud. Call before 2 PM for same-day service at (855) 901-2072." } },
          { "@type": "Question", name: "What items can junk removal take in Orlando?", acceptedAnswer: { "@type": "Answer", text: "Most items: furniture, appliances, mattresses, electronics, yard waste, construction debris, hot tubs, exercise equipment, and general household junk. Hazardous materials (paint, chemicals, asbestos) require special handling. Call for details." } },
          { "@type": "Question", name: "Do Orlando junk removal companies donate items?", acceptedAnswer: { "@type": "Answer", text: "A² Nona Junk Removal sorts all items: furniture and goods in good condition are donated to local Orlando charities, recyclables go to appropriate facilities, and only unusable items go to landfill. Customers receive a disposal report." } },
          { "@type": "Question", name: "How do I get a junk removal quote in Orlando?", acceptedAnswer: { "@type": "Answer", text: "Call (855) 901-2072 or text photos of what needs to go. George gives you a locked price in minutes based on photos — no in-person estimate needed for most jobs. One Price. One Pro. Done." } },
        ],
      });
    }

    // Orlando home services FAQ page schema
    if (reqPath === "/orlando-home-services-faq") {
      jsonLdBlocks.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          { "@type": "Question", name: "What home services does UpTend offer in Orlando?", acceptedAnswer: { "@type": "Answer", text: "UpTend covers 13 home service categories: HVAC, plumbing, electrical, junk removal, pressure washing, gutter cleaning, home cleaning, handyman, landscaping, moving labor, painting, pool cleaning, and carpet cleaning. All professionals are licensed, insured, and background-checked." } },
          { "@type": "Question", name: "How is UpTend different from Angi or Thumbtack?", acceptedAnswer: { "@type": "Answer", text: "UpTend is not a lead-generation marketplace. Lead sites sell your info to 3-5 contractors. UpTend matches you with ONE vetted professional at ONE locked price. Your information stays private. One Price. One Pro. Done." } },
          { "@type": "Question", name: "How much does pressure washing cost in Orlando?", acceptedAnswer: { "@type": "Answer", text: "Pressure washing in Orlando: $150-$400 for a driveway, $200-$500 for a full house wash, $100-$250 for a patio or pool deck." } },
          { "@type": "Question", name: "How much does junk removal cost in Orlando?", acceptedAnswer: { "@type": "Answer", text: "Junk removal in Orlando: $100-$250 for a few items, $400-$800 for a full truckload. Estate/garage cleanouts: $500-$1,500." } },
          { "@type": "Question", name: "How much does a handyman charge in Orlando?", acceptedAnswer: { "@type": "Answer", text: "Handyman rates: $75-$125/hour. Small projects $100-$300. Larger projects $300-$1,500. UpTend quotes per-job, not per-hour." } },
          { "@type": "Question", name: "How do I verify a contractor is licensed in Florida?", acceptedAnswer: { "@type": "Answer", text: "Check myfloridalicense.com (Florida DBPR). All HVAC, plumbing, and electrical contractors must hold a valid state license. UpTend verifies every professional's license, insurance, and background." } },
        ],
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
