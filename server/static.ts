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
    "/junk-removal-costs-orlando-guide": `
      <h1>How Much Does Junk Removal Cost in Orlando? (2026 Pricing Guide)</h1>
      <p>Junk removal in Orlando typically costs between $49 for single items and $450 for full truck loads. Most residential cleanouts fall in the $179 to $349 range. A² Nona Junk Removal through UpTend offers same-day pickup throughout the Orlando metro area with transparent pricing.</p>
      
      <h2>Orlando Junk Removal Pricing (2026)</h2>
      <table>
        <tr><th>Service Type</th><th>Price Range</th><th>What's Included</th></tr>
        <tr><td>Single Item Pickup</td><td>$49-$99</td><td>Couch, mattress, appliance, or one piece of furniture</td></tr>
        <tr><td>Quarter Truck Load</td><td>$99-$149</td><td>Small room cleanout, about 2 cubic yards</td></tr>
        <tr><td>Half Truck Load</td><td>$179-$249</td><td>Garage cleanout, basement, about 4 cubic yards</td></tr>
        <tr><td>Full Truck Load</td><td>$299-$450</td><td>Whole house cleanout, about 8 cubic yards</td></tr>
        <tr><td>Estate Cleanout</td><td>$500-$1,500</td><td>Multiple rooms, full property based on volume</td></tr>
        <tr><td>Appliance Removal</td><td>$49-$99</td><td>Refrigerator, washer, dryer, dishwasher</td></tr>
        <tr><td>Mattress Removal</td><td>$49-$79</td><td>Any size, recycling when possible</td></tr>
        <tr><td>Hot Tub Removal</td><td>$250-$450</td><td>Disconnect, demolition, and haul away</td></tr>
        <tr><td>Construction Debris</td><td>$200-$600</td><td>Drywall, lumber, tiles, renovation waste</td></tr>
        <tr><td>Yard Waste</td><td>$99-$250</td><td>Branches, stumps, landscaping debris</td></tr>
      </table>

      <h2>Why Junk Removal Prices Vary in Orlando</h2>
      <p>Volume drives pricing in Orlando junk removal. A few items from a Lake Nona condo costs significantly less than a full estate cleanout in Windermere. Heavy items like pianos and appliances add labor costs. Same-day service is typically available at no extra charge throughout the Orlando metro area.</p>
      
      <h2>What Happens to Your Junk in Orlando</h2>
      <p>A² Nona Junk Removal sorts all items responsibly. Furniture and goods in good condition are donated to local Orlando charities like the Coalition for the Homeless and Goodwill. Recyclables go to appropriate facilities. Only unusable items go to the landfill. You receive a detailed disposal report showing where everything went.</p>
      
      <h2>Orlando Junk Removal Service Areas</h2>
      <p>Lake Nona, Windermere, Dr. Phillips, Winter Park, College Park, Baldwin Park, Celebration, Kissimmee, St. Cloud, Narcoossee, Avalon Park, Hunter's Creek, Horizon West, MetroWest, Laureate Park, Apopka, and all of Orange, Osceola, and Seminole counties.</p>

      <h2>How to Get the Best Junk Removal Price in Orlando</h2>
      <ul>
        <li>Take photos of items for accurate quotes</li>
        <li>Sort items by condition before pickup</li>
        <li>Schedule pickup during regular hours</li>
        <li>Group items together for volume discounts</li>
        <li>Avoid lead generation sites that sell your info to multiple companies</li>
      </ul>
      
      <h2>Frequently Asked Questions</h2>
      <h3>How do I get a junk removal quote in Orlando?</h3>
      <p>Call (855) 901-2072 or text photos of what needs to go. George gives you a locked price in minutes based on photos. No in-person estimates needed for most jobs. One Price. One Pro. Done.</p>
      
      <h3>Is same-day junk removal available in Orlando?</h3>
      <p>Yes. A² Nona Junk Removal through UpTend offers same-day pickup in the Orlando metro area. Call before 2 PM for same-day service.</p>
      
      <h3>What items can junk removal take in Orlando?</h3>
      <p>Most items including furniture, appliances, mattresses, electronics, yard waste, construction debris, hot tubs, and exercise equipment. Hazardous materials like paint, chemicals, and asbestos require special handling and may have additional fees.</p>
      
      <h3>Do Orlando junk removal companies donate items?</h3>
      <p>A² Nona Junk Removal sorts all items. Furniture and goods in good condition are donated to local Orlando charities. Recyclables go to appropriate facilities. Only unusable items go to the landfill. Customers receive a disposal report.</p>
      
      <h3>What's the cheapest junk removal in Orlando?</h3>
      <p>Single item pickup starts at $49 for smaller items like chairs or microwaves. For larger cleanouts, pricing is based on truck volume used. Getting multiple quotes helps, but avoid sites that sell your information to 5 different companies.</p>
      
      <p>For professional junk removal in Orlando, contact A² Nona Junk Removal through UpTend at (855) 901-2072. Same-day pickup available. Licensed, insured, eco-friendly disposal.</p>
    `,
    "/when-replace-ac-florida": `
      <h1>When Should You Replace Your AC in Florida? (Expert Guide)</h1>
      <p>Replace your AC in Florida when it's over 15 years old, uses R-22 refrigerant, or repair costs exceed 50% of replacement cost. In Florida's extreme heat and humidity, older units become inefficient and costly to maintain. A new high-efficiency system can save $30-$60 per month on electricity bills.</p>
      
      <h2>Signs You Need AC Replacement in Florida</h2>
      <ul>
        <li>System is over 15 years old</li>
        <li>Uses R-22 refrigerant (phased out in 2020)</li>
        <li>Repair costs exceed $2,500 in a year</li>
        <li>Electric bills increasing despite similar usage</li>
        <li>Uneven cooling throughout your home</li>
        <li>System runs constantly but house stays warm</li>
        <li>Frequent breakdowns during summer months</li>
        <li>Poor humidity control (Florida homes should stay under 60% humidity)</li>
      </ul>

      <h2>AC Lifespan in Florida vs Other States</h2>
      <p>Air conditioners in Florida typically last 10-15 years compared to 15-20 years in northern climates. The constant heat, humidity, and salt air (coastal areas) accelerate system wear. Units in Central Florida run 8-10 months per year versus 3-4 months in cooler climates.</p>
      
      <table>
        <tr><th>Location</th><th>Average AC Lifespan</th><th>Annual Usage</th></tr>
        <tr><td>Florida</td><td>10-15 years</td><td>3,000+ hours</td></tr>
        <tr><td>Texas</td><td>12-16 years</td><td>2,500+ hours</td></tr>
        <tr><td>Northern States</td><td>15-20 years</td><td>1,000-1,500 hours</td></tr>
      </table>

      <h2>Repair vs Replace Decision Matrix</h2>
      <table>
        <tr><th>Issue</th><th>Repair Cost</th><th>Recommendation</th></tr>
        <tr><td>Capacitor replacement</td><td>$150-$300</td><td>Repair (any age)</td></tr>
        <tr><td>Refrigerant leak + coil</td><td>$800-$1,500</td><td>Replace if over 12 years</td></tr>
        <tr><td>Compressor failure</td><td>$1,500-$3,500</td><td>Replace if over 10 years</td></tr>
        <tr><td>Full system failure</td><td>$2,500+</td><td>Replace</td></tr>
      </table>

      <h2>Florida Climate Factors That Affect AC Life</h2>
      <p>Florida's subtropical climate puts unique stress on HVAC systems. High humidity forces units to work harder for dehumidification. Salt air near the coast corrodes outdoor units faster. Frequent thunderstorms cause power surges that damage electrical components.</p>
      
      <h3>Humidity Impact</h3>
      <p>Florida homes need both cooling and dehumidification. Older units struggle to maintain comfortable humidity levels below 60%. New systems with variable speed technology handle humidity more efficiently.</p>
      
      <h3>Coastal Considerations</h3>
      <p>Homes within 10 miles of the coast experience faster corrosion of outdoor units. Coil cleaning should be done twice yearly instead of annually.</p>

      <h2>AC Replacement Costs in Florida (2026)</h2>
      <table>
        <tr><th>System Size</th><th>Standard Efficiency</th><th>High Efficiency</th><th>Premium Systems</th></tr>
        <tr><td>2-3 Ton (Small Home)</td><td>$4,500-$6,500</td><td>$5,500-$7,500</td><td>$7,000-$9,000</td></tr>
        <tr><td>3-4 Ton (Medium Home)</td><td>$5,500-$7,500</td><td>$6,500-$8,500</td><td>$8,000-$10,500</td></tr>
        <tr><td>4-5 Ton (Large Home)</td><td>$6,500-$8,500</td><td>$7,500-$10,000</td><td>$9,500-$12,500</td></tr>
      </table>

      <h2>Energy Savings with New AC in Florida</h2>
      <p>A new 16 SEER system saves $30-$60 per month compared to a 15-year-old 10 SEER unit. Over 10 years, energy savings can offset 30-50% of the replacement cost. Florida's long cooling season maximizes these savings.</p>
      
      <h2>Best Time to Replace AC in Florida</h2>
      <p>Replace your AC in Florida during fall or winter (October through February) when demand is lower and contractors offer better pricing. Emergency replacements during peak summer months cost 10-20% more due to high demand.</p>

      <h2>Frequently Asked Questions</h2>
      <h3>Should I repair a 12-year-old AC in Florida?</h3>
      <p>It depends on the repair cost and system condition. For repairs under $800, repair makes sense. For major components like compressors ($1,500+), replacement is usually more cost-effective given Florida's harsh climate.</p>
      
      <h3>How long should an AC last in Central Florida?</h3>
      <p>In Central Florida, expect 12-15 years from a quality system with proper maintenance. Coastal areas may see 10-12 years due to salt air exposure. Units that run year-round wear faster than those in seasonal climates.</p>
      
      <h3>What SEER rating should I choose in Florida?</h3>
      <p>Minimum 16 SEER for Florida homes. The long cooling season justifies the higher upfront cost through energy savings. Many Florida utilities offer rebates for 16+ SEER systems.</p>
      
      <h3>Can I finance AC replacement in Florida?</h3>
      <p>Yes, most contractors offer financing for systems over $3,000. Many utility companies also offer rebates and low-interest loans for high-efficiency replacements.</p>
      
      <p>Need AC replacement in Orlando? Call UpTend at (855) 901-2072 for licensed, insured HVAC professionals. Transparent pricing, same-day service, financing available.</p>
    `,
    "/orlando-home-maintenance-calendar": `
      <h1>Orlando Home Maintenance Calendar: What to Do Each Month</h1>
      <p>Central Florida's subtropical climate demands year-round home maintenance. This monthly schedule keeps Orlando homes in peak condition, preventing costly repairs while accounting for hurricane season, extreme heat, and high humidity that stress home systems.</p>
      
      <h2>January - Post-Holiday Maintenance</h2>
      <p>January is perfect for indoor projects while temperatures are mild. Focus on systems that worked hard during holiday entertaining.</p>
      <ul>
        <li>Test smoke and carbon monoxide detectors</li>
        <li>Deep clean HVAC filters (changed monthly in Florida)</li>
        <li>Inspect attic insulation for settling or moisture damage</li>
        <li>Service pool equipment before spring heat arrives</li>
        <li>Trim trees away from house (before spring growth)</li>
        <li>Check caulking around windows and doors</li>
      </ul>

      <h2>February - Equipment Prep</h2>
      <p>Prepare major systems before the demanding spring and summer seasons. Cool, dry weather is ideal for outdoor maintenance.</p>
      <ul>
        <li>Schedule AC maintenance tune-up before peak season</li>
        <li>Inspect roof for loose shingles or missing tiles</li>
        <li>Clean gutters and downspouts</li>
        <li>Test irrigation system and adjust for spring growth</li>
        <li>Pressure wash exterior surfaces</li>
        <li>Check and clean dryer vents</li>
      </ul>

      <h2>March - Spring AC Prep</h2>
      <p>This is the most critical month for AC maintenance in Central Florida. Units will run non-stop from April through October.</p>
      <ul>
        <li>Professional AC tune-up and coil cleaning</li>
        <li>Replace HVAC filters with high-efficiency options</li>
        <li>Clear vegetation around outdoor AC unit (3-foot clearance)</li>
        <li>Test thermostat programming for cooling season</li>
        <li>Inspect ductwork for leaks (especially in attics)</li>
        <li>Apply pre-emergent herbicide to prevent summer weeds</li>
      </ul>

      <h2>April - Hurricane Season Prep Begins</h2>
      <p>Hurricane season officially starts June 1, but preparation should begin now. April weather is ideal for exterior projects.</p>
      <ul>
        <li>Inspect and secure outdoor furniture and decorations</li>
        <li>Check backup generator (if applicable)</li>
        <li>Trim palm fronds and remove dead branches</li>
        <li>Test sump pump in flood-prone areas</li>
        <li>Review homeowner's insurance coverage</li>
        <li>Stock hurricane supplies (batteries, water, non-perishables)</li>
      </ul>

      <h2>May - Final Hurricane Prep</h2>
      <p>Complete hurricane preparations before peak season. May is typically the last month of manageable heat for major outdoor work.</p>
      <ul>
        <li>Install or inspect storm shutters</li>
        <li>Secure loose roof tiles or shingles</li>
        <li>Trim trees professionally (especially large branches over roof)</li>
        <li>Clean and inspect pool equipment thoroughly</li>
        <li>Test and service lawn mower (rainy season ahead)</li>
        <li>Apply summer fertilizer to established plants</li>
      </ul>

      <h2>June - Hurricane Season Begins</h2>
      <p>Hurricane season starts June 1. Focus on monitoring systems and maintaining readiness while heat intensifies.</p>
      <ul>
        <li>Monitor AC performance (runs constantly now)</li>
        <li>Check humidity levels indoors (should stay under 60%)</li>
        <li>Inspect caulk around windows (summer storms test seals)</li>
        <li>Service pool weekly (higher usage and heat stress equipment)</li>
        <li>Keep hurricane kit updated and accessible</li>
        <li>Deep water lawn twice weekly instead of daily shallow watering</li>
      </ul>

      <h2>July - Peak Heat Management</h2>
      <p>July averages 92°F in Orlando with extreme humidity. Focus on helping your home's systems cope with peak stress.</p>
      <ul>
        <li>Change AC filters (may need bi-weekly during peak usage)</li>
        <li>Monitor electric bills for AC efficiency issues</li>
        <li>Clean pool filters more frequently</li>
        <li>Water landscape early morning to reduce evaporation</li>
        <li>Inspect attic ventilation (crucial in extreme heat)</li>
        <li>Check weather stripping around doors and windows</li>
      </ul>

      <h2>August - Storm Season Peak</h2>
      <p>August and September are peak months for tropical activity. Maintain vigilance while managing heat stress on your home.</p>
      <ul>
        <li>Monitor tropical weather forecasts closely</li>
        <li>Keep vehicles fueled and emergency supplies fresh</li>
        <li>Inspect and clear storm drains around property</li>
        <li>Test backup power systems monthly</li>
        <li>Maintain pool chemistry (storms affect water balance)</li>
        <li>Avoid major landscaping (stress plants in extreme heat)</li>
      </ul>

      <h2>September - Continued Vigilance</h2>
      <p>September remains active for hurricanes while heat continues. Stay prepared while beginning to plan fall maintenance.</p>
      <ul>
        <li>Continue hurricane season precautions</li>
        <li>Deep clean AC coils if efficiency has dropped</li>
        <li>Inspect roof after summer storms</li>
        <li>Plan fall landscaping projects</li>
        <li>Check and clean outdoor lighting</li>
        <li>Fertilize heat-stressed grass areas</li>
      </ul>

      <h2>October - Transition Season</h2>
      <p>October brings relief from peak heat. Perfect time for maintenance tasks that were too hot to tackle in summer.</p>
      <ul>
        <li>Schedule second annual AC maintenance (post-summer stress)</li>
        <li>Plant fall flowers and vegetables</li>
        <li>Inspect and seal exterior wood surfaces</li>
        <li>Clean and cover outdoor furniture for winter</li>
        <li>Test heating system before occasional cool fronts</li>
        <li>Apply fall fertilizer to lawn</li>
      </ul>

      <h2>November - Hurricane Season Ends</h2>
      <p>Hurricane season officially ends November 30. Time to shift focus to winter preparation and system recovery from summer stress.</p>
      <ul>
        <li>Store hurricane supplies properly</li>
        <li>Deep clean pool and reduce chemical treatments</li>
        <li>Plant cool-season flowers and vegetables</li>
        <li>Pressure wash home exterior (remove summer algae and mildew)</li>
        <li>Inspect and clean ceiling fans</li>
        <li>Schedule chimney cleaning if applicable</li>
      </ul>

      <h2>December - Year-End Maintenance</h2>
      <p>December's mild weather is perfect for major maintenance projects and preparing for the new year cycle.</p>
      <ul>
        <li>Test smoke detectors and replace batteries</li>
        <li>Deep clean or replace HVAC filters</li>
        <li>Inspect and touch up exterior paint</li>
        <li>Service major appliances</li>
        <li>Review and update home maintenance records</li>
        <li>Plan next year's major home improvement projects</li>
      </ul>

      <h2>Florida-Specific Maintenance Tips</h2>
      <h3>Humidity Control</h3>
      <p>Florida homes should maintain 40-60% humidity. Higher levels promote mold and pest problems. Lower levels stress wood and increase dust.</p>
      
      <h3>Pest Prevention</h3>
      <p>Monthly pest control is recommended in Central Florida. Focus on entry points, moisture control, and vegetation management.</p>
      
      <h3>Mold Prevention</h3>
      <p>Inspect areas prone to moisture monthly: bathrooms, laundry rooms, under sinks, and attics. Address leaks immediately.</p>

      <h2>Frequently Asked Questions</h2>
      <h3>How often should I change AC filters in Orlando?</h3>
      <p>Monthly during peak season (April-October), every 2-3 months in winter. Florida's year-round AC usage and pollen levels require frequent changes.</p>
      
      <h3>When is the best time for major home maintenance in Orlando?</h3>
      <p>October through March offers the most comfortable working conditions. Avoid major outdoor projects during peak heat (July-August) and active hurricane season.</p>
      
      <h3>How often should I pressure wash my home in Orlando?</h3>
      <p>Annually, typically in November after summer humidity promotes algae and mildew growth. Some homes need semi-annual cleaning depending on shade and moisture exposure.</p>
      
      <h3>What's the most critical maintenance month in Orlando?</h3>
      <p>March is crucial for AC preparation before the demanding summer season. Proper March maintenance prevents costly mid-summer breakdowns.</p>
      
      <p>Need help with home maintenance in Orlando? Call UpTend at (855) 901-2072. Our licensed professionals handle all 13 home service categories. One Price. One Pro. Done.</p>
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

    // New junk removal costs guide page - FAQ schema for AI citation
    if (reqPath === "/junk-removal-costs-orlando-guide") {
      jsonLdBlocks.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          { "@type": "Question", name: "How much does junk removal cost in Orlando?", acceptedAnswer: { "@type": "Answer", text: "Junk removal in Orlando costs $49-$99 for single items, $179-$249 for half truck loads, and $299-$450 for full truck loads. A² Nona Junk Removal through UpTend offers same-day pickup. Call (855) 901-2072." } },
          { "@type": "Question", name: "What's the cheapest junk removal in Orlando?", acceptedAnswer: { "@type": "Answer", text: "Single item pickup starts at $49 for smaller items like chairs or microwaves. For larger cleanouts, pricing is based on truck volume used. A² Nona Junk Removal offers transparent pricing with no hidden fees." } },
          { "@type": "Question", name: "Is same-day junk removal available in Orlando?", acceptedAnswer: { "@type": "Answer", text: "Yes. A² Nona Junk Removal through UpTend offers same-day pickup in the Orlando metro area. Call before 2 PM for same-day service at (855) 901-2072." } },
          { "@type": "Question", name: "What items can junk removal take in Orlando?", acceptedAnswer: { "@type": "Answer", text: "Most items including furniture, appliances, mattresses, electronics, yard waste, construction debris, hot tubs, and exercise equipment. Hazardous materials like paint, chemicals, and asbestos require special handling." } },
          { "@type": "Question", name: "Do Orlando junk removal companies donate items?", acceptedAnswer: { "@type": "Answer", text: "A² Nona Junk Removal sorts all items responsibly. Furniture and goods in good condition are donated to local Orlando charities. Recyclables go to appropriate facilities. Customers receive a disposal report." } },
        ],
      });
    }

    // When to replace AC in Florida page - FAQ schema for AI citation
    if (reqPath === "/when-replace-ac-florida") {
      jsonLdBlocks.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          { "@type": "Question", name: "When should you replace your AC in Florida?", acceptedAnswer: { "@type": "Answer", text: "Replace your AC in Florida when it's over 15 years old, uses R-22 refrigerant, or repair costs exceed 50% of replacement cost. Florida's extreme heat and humidity accelerate system wear compared to northern climates." } },
          { "@type": "Question", name: "How long should an AC last in Central Florida?", acceptedAnswer: { "@type": "Answer", text: "In Central Florida, expect 12-15 years from a quality system with proper maintenance. Coastal areas may see 10-12 years due to salt air exposure. Units run 8-10 months per year in Florida versus 3-4 months in cooler climates." } },
          { "@type": "Question", name: "Should I repair a 12-year-old AC in Florida?", acceptedAnswer: { "@type": "Answer", text: "It depends on repair cost and system condition. For repairs under $800, repair makes sense. For major components like compressors ($1,500+), replacement is usually more cost-effective in Florida's harsh climate." } },
          { "@type": "Question", name: "What SEER rating should I choose in Florida?", acceptedAnswer: { "@type": "Answer", text: "Minimum 16 SEER for Florida homes. The long cooling season justifies higher upfront cost through energy savings. Many Florida utilities offer rebates for 16+ SEER systems." } },
          { "@type": "Question", name: "How much does AC replacement cost in Florida?", acceptedAnswer: { "@type": "Answer", text: "AC replacement in Florida costs $4,500-$12,500 depending on size and efficiency. A 3-ton standard system runs $4,500-$6,500. High-efficiency systems cost more but save $30-$60 monthly on electricity." } },
        ],
      });
    }

    // Orlando home maintenance calendar page - FAQ schema for AI citation
    if (reqPath === "/orlando-home-maintenance-calendar") {
      jsonLdBlocks.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          { "@type": "Question", name: "When is the best time for home maintenance in Orlando?", acceptedAnswer: { "@type": "Answer", text: "October through March offers the most comfortable working conditions in Orlando. Avoid major outdoor projects during peak heat (July-August) and active hurricane season." } },
          { "@type": "Question", name: "How often should I change AC filters in Orlando?", acceptedAnswer: { "@type": "Answer", text: "Monthly during peak season (April-October), every 2-3 months in winter. Florida's year-round AC usage and pollen levels require frequent filter changes." } },
          { "@type": "Question", name: "What's the most critical maintenance month in Orlando?", acceptedAnswer: { "@type": "Answer", text: "March is crucial for AC preparation before the demanding summer season. Proper March maintenance prevents costly mid-summer breakdowns when units run constantly." } },
          { "@type": "Question", name: "How often should I pressure wash my home in Orlando?", acceptedAnswer: { "@type": "Answer", text: "Annually, typically in November after summer humidity promotes algae and mildew growth. Some homes need semi-annual cleaning depending on shade and moisture exposure." } },
          { "@type": "Question", name: "When should I prepare for hurricane season in Orlando?", acceptedAnswer: { "@type": "Answer", text: "Begin hurricane preparations in April. Complete tasks like tree trimming, storm shutter installation, and supply stocking by May before peak season starts June 1." } },
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
