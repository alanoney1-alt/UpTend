import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Truck, ArrowLeft, ChevronDown, ChevronUp, Search,
  HelpCircle, Package, DollarSign, Clock, Shield, Users, Building2
} from "lucide-react";
import { Input } from "@/components/ui/input";

type FAQCategory = "customers" | "pyckers" | "pricing" | "safety" | "b2b";

interface FAQ {
  question: string;
  answer: string;
  category: FAQCategory;
}

const faqs: FAQ[] = [
  // === CUSTOMERS ===
  {
    category: "customers",
    question: "How does UpTend work?",
    answer: "It's simple! 1) Take photos of items or select from our item list, 2) Get an instant price quote, 3) Choose your pickup time, 4) A verified Pro arrives and hauls everything away. You can track their arrival in real-time and pay securely through the app."
  },
  {
    category: "customers",
    question: "What items can you pick up?",
    answer: "We can haul most household items including furniture, appliances, electronics, yard waste, construction debris, and general junk. We cannot accept hazardous materials (chemicals, paint, asbestos), medical waste, or extremely heavy items (hot tubs, pianos over 500 lbs) without special arrangements."
  },
  {
    category: "customers",
    question: "How soon can you pick up my items?",
    answer: "We offer same-day pickup in most areas! When you book, you'll see available time slots. Many customers get pickups within 2-4 hours during peak times. Weekend and evening slots are available."
  },
  {
    category: "customers",
    question: "Do I need to be home for the pickup?",
    answer: "Yes, someone 18 or older should be present to show the Pro which items to take and to verify the final price. If items are outside and easily accessible, you can arrange a contactless pickup by noting this in your booking."
  },
  {
    category: "customers",
    question: "What if there are more items than I listed?",
    answer: "Our Pros verify items on arrival. If there are additional items, you'll be notified of the adjusted price and must approve it before the job starts. We believe in transparent pricing — no surprise charges after the fact."
  },
  {
    category: "customers",
    question: "What is the AI Home Scan and how does it work?",
    answer: "The AI Home Scan is our comprehensive home scan service starting at $99. A certified inspector conducts a room-by-room walkthrough documenting your home's condition with photos and detailed notes. The Aerial tier ($199) includes drone footage for roof, gutters, and property perimeter. You receive a digital report perfect for insurance, pre-sale documentation, or rental property management."
  },
  {
    category: "customers",
    question: "Can I cancel or reschedule my service?",
    answer: "Yes! Cancel or reschedule free of charge up to 2 hours before your scheduled time. Cancellations within 2 hours of service incur a $25 fee. Same-day reschedules are subject to availability. You can manage bookings directly in the app."
  },
  {
    category: "customers",
    question: "What happens if it rains on my scheduled service day?",
    answer: "For outdoor services (landscaping, pressure washing, gutter cleaning), we monitor weather and will proactively contact you if conditions are unsafe. You can reschedule at no charge for weather-related issues. Indoor services proceed as scheduled regardless of weather."
  },
  {
    category: "customers",
    question: "Do you offer recurring services?",
    answer: "Absolutely! Set up weekly, bi-weekly, or monthly recurring services for landscaping, home cleaning, pool maintenance, and more. Recurring customers receive priority scheduling and discounted rates (5-15% off depending on frequency). Manage your recurring schedule anytime in the app."
  },
  {
    category: "customers",
    question: "Can I bundle multiple services together?",
    answer: "Yes! Bundling services often saves you money. For example, book AI Home Scan + Gutter Cleaning + Pressure Washing together and receive 10-20% off the total. Our smart booking system will suggest relevant bundle deals based on your property and season."
  },
  {
    category: "customers",
    question: "What if I'm not satisfied with the work?",
    answer: "Your satisfaction is guaranteed. If you're unhappy with any service, report it through the app within 24 hours. We'll send the Pro back to fix the issue at no charge, or issue a full refund if the problem can't be resolved. Our Pros' ratings depend on your satisfaction."
  },
  {
    category: "customers",
    question: "How long does each service typically take?",
    answer: "Times vary by service: Junk removal (1-3 hours), Home Cleaning (2-4 hours), Landscaping (1-2 hours), Pressure Washing (2-5 hours), Gutter Cleaning (1-2 hours), Pool Cleaning (45-90 min), Carpet Cleaning (2-4 hours), AI Home Scan Standard (45-90 min), AI Home Scan Aerial (90-120 min). Your Pro provides an estimated completion time upon arrival."
  },
  {
    category: "customers",
    question: "Do Pros bring their own equipment and supplies?",
    answer: "Yes! All Pros arrive fully equipped with professional-grade tools, supplies, and safety gear. You don't need to provide anything. For specialized services like pressure washing or carpet cleaning, Pros use commercial equipment for superior results."
  },
  {
    category: "customers",
    question: "Can you work if I'm not home?",
    answer: "For outdoor services (landscaping, pressure washing, gutter cleaning, pool cleaning), yes! Arrange contactless service by leaving gates unlocked and providing access notes in your booking. For indoor services or junk removal, someone 18+ must be present. You'll still receive before/after photos and notifications."
  },
  {
    category: "customers",
    question: "Do you provide before and after photos?",
    answer: "Yes! Pros document all work with timestamped before/after photos uploaded to your job record. This provides proof of completion, quality verification, and a visual record for your files. Photos are especially valuable for AI Home Scan, pressure washing, and junk removal services."
  },
  {
    category: "customers",
    question: "What areas do you serve?",
    answer: "We currently serve the greater Orlando area including Orange, Seminole, Osceola, and Lake Counties. Coverage includes Orlando, Winter Park, Altamonte Springs, Kissimmee, Oviedo, Winter Garden, and surrounding cities. Check service availability by entering your address in the booking flow."
  },
  {
    category: "customers",
    question: "Are there any items you absolutely cannot take?",
    answer: "We cannot accept: hazardous materials (paint, chemicals, asbestos, pesticides), medical waste (needles, biohazards), tires, concrete/bricks, propane tanks, ammunition/firearms, dead animals. Everything else can typically be hauled with proper arrangements for heavy items (pianos 500+ lbs, hot tubs, safes)."
  },
  {
    category: "customers",
    question: "How do you handle item disposal? Is it eco-friendly?",
    answer: "We prioritize sustainability! Items are sorted into recycle, donate, resell, and landfill categories. Over 70% of materials are diverted from landfills through partnerships with local charities, recyclers, and resale centers. You receive a sustainability report showing your environmental impact (CO2 saved, items donated, recycling rate)."
  },
  {
    category: "customers",
    question: "Can I request a specific Pro?",
    answer: "Yes! After a job, you can favorite a Pro and request them for future bookings. While we can't guarantee availability, the system prioritizes matching you with favorited Pros when possible. Recurring service customers are automatically matched with the same Pro for consistency."
  },
  {
    category: "customers",
    question: "What if my Pro is running late?",
    answer: "You'll receive real-time tracking notifications if your Pro is delayed. Pros must notify you and UpTend if they're running more than 15 minutes late. For significant delays (30+ minutes), you can reschedule at no charge or accept the delay with a 10% service discount applied automatically."
  },
  {
    category: "customers",
    question: "Do you offer seasonal services?",
    answer: "Yes! Seasonal offerings include: Spring (yard cleanup, gutter flush, pressure washing), Summer (pool opening, AC area cleaning, garage cleanout), Fall (leaf removal, gutter prep, holiday light prep), Winter (holiday light installation, storm prep, property winterization). Seasonal bundles save 15-25%."
  },
  {
    category: "customers",
    question: "Can I leave special instructions for my Pro?",
    answer: "Absolutely! During booking, there's a notes section for special instructions (gate codes, pet warnings, parking info, specific requests). Pros review these before arrival. You can also message your Pro directly after booking through the app's secure messaging."
  },
  {
    category: "customers",
    question: "How do I know my Pro is legitimate and safe?",
    answer: "Every Pro is verified through: comprehensive background check (criminal history, sex offender registry), driving record check, identity verification (SSN, driver's license), vehicle registration and insurance verification, in-person vehicle inspection. You can view your Pro's verification badges, rating, and completed job count in the app."
  },
  {
    category: "customers",
    question: "What if I need to add items during the service?",
    answer: "No problem! Communicate with your Pro on-site. They'll assess the additional items, provide a price adjustment through the app, and you approve before proceeding. This ensures transparency and no surprise charges. Common for estate cleanouts or when customers discover more items than expected."
  },
  {
    category: "customers",
    question: "Do you offer gift certificates?",
    answer: "Yes! Gift certificates available in $50, $100, $250, and custom amounts. Perfect for new homeowners, elderly relatives, busy professionals, or anyone who needs help with home services. Purchase through the app or website. Recipients can apply gift certificates to any service, never expire."
  },

  // === B2B / BUSINESSES ===
  {
    category: "b2b",
    question: "Do you offer property management accounts?",
    answer: "Yes! We have dedicated accounts for property managers, landlords, and real estate investors. Features include: centralized billing across multiple properties, priority scheduling, dedicated account manager, volume pricing (15-30% off), custom reporting, and same-day emergency services. Contact us at business@uptend.app to set up."
  },
  {
    category: "b2b",
    question: "Can HOAs and community associations use UpTend?",
    answer: "Absolutely! We serve many HOAs for common area maintenance, bulk trash events, storm cleanup, and recurring landscaping. Benefits include: contract pricing, scheduled service days, invoice billing with net-30 terms, board reporting, and dedicated Pro teams familiar with your community standards."
  },
  {
    category: "b2b",
    question: "What business services do you offer?",
    answer: "Commercial services include: office cleaning, retail space maintenance, warehouse cleanouts, construction debris removal, commercial landscaping, parking lot maintenance, seasonal decorations, and emergency cleanup. We serve offices, retail stores, warehouses, medical facilities, restaurants, and more."
  },
  {
    category: "b2b",
    question: "How does invoice billing work for business accounts?",
    answer: "Business accounts can opt for invoice billing with net-15 or net-30 terms (subject to credit approval). Invoices include detailed job breakdowns, photos, timestamps, and sustainability metrics. Multiple properties roll up to a single monthly invoice. ACH, wire, and credit card payments accepted."
  },
  {
    category: "b2b",
    question: "Do you provide COI (Certificate of Insurance) for vendors?",
    answer: "Yes! All UpTend Pros carry $1M general liability insurance and vehicle insurance. We provide Certificates of Insurance (COI) with your company named as additional insured for property access and vendor compliance. COIs are typically delivered within 24 hours of request."
  },
  {
    category: "b2b",
    question: "Can I manage multiple properties under one account?",
    answer: "Yes! Our multi-property dashboard lets you manage unlimited properties from one account. Features: property-specific service history, budget tracking per property, tag properties by portfolio/region, assign different billing codes, and generate per-property or consolidated reports. Perfect for property managers and investors."
  },
  {
    category: "b2b",
    question: "Do you offer volume discounts?",
    answer: "Yes! Volume pricing tiers: 5-10 jobs/month (10% off), 11-25 jobs/month (15% off), 26-50 jobs/month (20% off), 51+ jobs/month (25% off). Discounts apply automatically as you book throughout the month. Annual contracts receive additional 5-10% off with guaranteed service levels."
  },
  {
    category: "b2b",
    question: "How do you handle tenant turnover services?",
    answer: "We specialize in turnover! Services include: junk removal of abandoned items, deep cleaning, carpet cleaning, minor repairs, yard restoration, and AI Home Scan documentation. Book as a bundle for 20% off. Average turnover time: 1-3 days depending on property condition. Perfect for property managers with tight timelines."
  },
  {
    category: "b2b",
    question: "Can we get a dedicated account manager?",
    answer: "Yes! Business accounts with 10+ monthly jobs receive a dedicated account manager who knows your properties, preferences, and standards. Benefits: direct phone line, priority support, custom service packages, quarterly business reviews, and proactive scheduling for recurring needs."
  },
  {
    category: "b2b",
    question: "Do you provide reporting for business accounts?",
    answer: "Comprehensive reporting available: monthly spend summaries, job completion rates, average service times, sustainability metrics (CO2 saved, landfill diversion), per-property cost analysis, and custom reports for board meetings or owner reporting. Export to PDF, Excel, or integrate with your property management software."
  },
  {
    category: "b2b",
    question: "What are your business hours for commercial accounts?",
    answer: "We accommodate business schedules! Services available: Early morning (6am-8am), business hours (8am-5pm), after-hours (5pm-9pm), and weekends. Many commercial clients prefer after-hours or weekend service to avoid disrupting operations. 24/7 emergency services available for urgent situations (floods, storm damage, health hazards)."
  },
  {
    category: "b2b",
    question: "Can we create custom service packages?",
    answer: "Absolutely! Work with your account manager to design custom packages tailored to your needs. Examples: Monthly maintenance package (landscaping + pool + gutter check), Seasonal bundle (spring/fall yard services), Turnover package (clean + haul + inspect), Emergency response retainer. Custom pricing and guaranteed response times."
  },
  {
    category: "b2b",
    question: "How do you handle emergency commercial services?",
    answer: "Business emergencies (floods, storm damage, health hazards, tenant incidents) receive priority dispatch within 2 hours. Emergency services include: water damage cleanup, debris removal, hazard mitigation, board-up services, and temporary repairs. Business accounts can opt for 24/7 emergency retainers with guaranteed 90-minute response times."
  },
  {
    category: "b2b",
    question: "Do you integrate with property management software?",
    answer: "We're building integrations with major PM platforms (Buildium, AppFolio, Rent Manager). Currently available: CSV export of all job data for import into your system, API access for custom integrations (contact us), and Zapier connections for automated workflows. Roadmap includes native integrations by Q3 2026."
  },
  {
    category: "b2b",
    question: "What is your business account onboarding process?",
    answer: "Quick and easy! 1) Request business account at business@uptend.app, 2) We'll schedule a 30-minute call to understand your needs, 3) Set up your multi-property account with custom settings, 4) Add users/managers with different permission levels, 5) Receive onboarding training for your team. Most accounts are live within 48 hours. First month receives 20% new client discount."
  },

  // === PRICING ===
  {
    category: "pricing",
    question: "How is pricing calculated?",
    answer: "We offer two pricing methods: 1) Item-based pricing where you select specific items (couch $75, mattress $40, etc.), or 2) Load-based pricing for mixed junk ($99 minimum up to $499 for a full truck). Both methods show you the exact price before you book — no hidden fees."
  },
  {
    category: "pricing",
    question: "Are there any hidden fees?",
    answer: "No! The price you see is the price you pay. We don't charge booking fees, fuel surcharges, or environmental fees. The only time your price might change is if there are more items than originally listed, and you must approve any changes before the job starts."
  },
  {
    category: "pricing",
    question: "What payment methods do you accept?",
    answer: "We accept all major credit and debit cards through our secure payment system. Payment is processed only after the job is completed to your satisfaction. We do not accept cash or checks."
  },
  {
    category: "pricing",
    question: "Can I tip my Pro?",
    answer: "Absolutely! Tips are optional but appreciated. 100% of tips go directly to your Pro — we don't take any cut. You can add a tip through the app after the job is completed."
  },
  {
    category: "pricing",
    question: "Do you charge extra for stairs or difficult access?",
    answer: "Standard pricing includes up to 3 flights of stairs and normal access. For extreme situations (4+ flights, no elevator, narrow doorways, long carries 100+ feet), a small surcharge ($25-$50) may apply. Your Pro will assess on arrival and you must approve before work begins."
  },
  {
    category: "pricing",
    question: "Are there discounts for seniors or military?",
    answer: "Yes! We offer 10% off all services for seniors (65+), active military, veterans, teachers, healthcare workers, and first responders. Verify your status in the app settings to automatically apply discounts to all future bookings. Not combinable with other promotional offers."
  },
  {
    category: "pricing",
    question: "What is your pricing for the AI Home Scan?",
    answer: "AI Home Scan Standard (interior only) is $99 flat rate. AI Home Scan Aerial (interior + drone exterior) is $199 flat rate. Both include comprehensive photo documentation, detailed inspection notes, and digital report delivery within 24 hours. Add-ons available: rush delivery (3-hour report) +$25, extra property photos +$20."
  },
  {
    category: "pricing",
    question: "How much does recurring service cost?",
    answer: "Recurring services receive automatic discounts: weekly service (15% off), bi-weekly (10% off), monthly (5% off). For example, weekly landscaping normally $75 becomes $63.75/visit. Discounts apply automatically when you set up recurring schedule. Cancel anytime with no penalties or commitments."
  },
  {
    category: "pricing",
    question: "What if the Pro quotes a higher price on-site?",
    answer: "This only happens if there are more items or larger scope than originally listed. The Pro documents the discrepancy with photos and submits a revised quote through the app. You review and must approve the new price before any work begins. You can always decline and only pay the original quote if items were accurately listed."
  },
  {
    category: "pricing",
    question: "Can I get a refund if I cancel?",
    answer: "Cancellations more than 2 hours before scheduled time receive full refund (no charge). Cancellations within 2 hours incur a $25 fee (covers Pro's drive time and opportunity cost). If the Pro is already on route (within 30 minutes), the fee is $50. Cancel through the app anytime."
  },

  // === SAFETY & TRUST ===
  {
    category: "safety",
    question: "How do you verify Pros?",
    answer: "Every Pro undergoes a comprehensive background check including criminal history, driving record, and identity verification. They must also provide proof of insurance and vehicle registration. We take your safety seriously."
  },
  {
    category: "safety",
    question: "What happens if something gets damaged?",
    answer: "All Pros carry liability insurance. If any damage occurs during the job, report it immediately through the app. We'll investigate and work with the Pro's insurance to resolve the issue."
  },
  {
    category: "safety",
    question: "How do I contact my Pro?",
    answer: "Once a Pro accepts your job, you can message them through the app. Phone numbers are masked for privacy — calls go through our system so your personal number stays private."
  },
  {
    category: "safety",
    question: "What if my Pro doesn't show up?",
    answer: "No-shows are extremely rare (less than 1% of jobs) thanks to our Pro accountability system. If a Pro doesn't arrive within 15 minutes of the scheduled window, contact support immediately. We'll find you another Pro ASAP or provide a full refund plus a $50 credit toward your next service."
  },
  {
    category: "safety",
    question: "Are Pros employees or contractors?",
    answer: "Pros are independent contractors, not employees. However, they must meet UpTend's strict verification, insurance, and service standards. This model allows Pros to earn more (75% of every job) while maintaining flexibility, and allows us to keep prices low for customers."
  },
  {
    category: "safety",
    question: "How does the rating system work?",
    answer: "After each job, you rate your Pro (1-5 stars) and provide optional feedback. Pros with ratings below 4.5 receive coaching. Consistent low ratings (below 4.0) or serious violations result in removal from the platform. You can view your Pro's average rating and total completed jobs before they arrive."
  },
  {
    category: "safety",
    question: "What happens if I have a dispute with my Pro?",
    answer: "Contact support immediately through the app. We investigate all disputes with photos, messages, and both parties' accounts. Resolution options include: Pro returns to fix issue (no charge), partial refund, full refund, or Pro accountability action. Most disputes resolve within 24-48 hours. Serious violations (theft, harassment, damage) are escalated to legal action."
  },
  {
    category: "safety",
    question: "Do Pros have access to my personal information?",
    answer: "No! Pros only see your first name, service address, and job details. Your phone number, email, payment info, and full address history are never shared. In-app messaging and calls are routed through our system to protect both parties' privacy. After job completion, your address is removed from the Pro's view."
  },

  // === PROS / PYCKERS ===
  {
    category: "pyckers",
    question: "How do I become a Pro?",
    answer: "Apply on our website! You'll need a truck or large vehicle (2010 or newer), valid driver's license, vehicle insurance, and to pass a background check. The application takes about 10 minutes, and most approvals happen within 2-3 business days."
  },
  {
    category: "pyckers",
    question: "How much can I earn as a Pro?",
    answer: "Earnings vary based on your area and how often you work. Active Pros in Orlando earn $800-$2,000+ per week. You keep 75% of every job plus 100% of tips. There are no lead fees, subscription fees, or hidden charges."
  },
  {
    category: "pyckers",
    question: "When do I get paid?",
    answer: "You get paid instantly after each job is completed! Funds are transferred to your connected bank account via Stripe. Most banks show the deposit within 1-2 business days, though some support instant transfer."
  },
  {
    category: "pyckers",
    question: "What if a customer has more items than listed?",
    answer: "You'll verify items on arrival using the app. If there are discrepancies, you can adjust the item list and send the new price to the customer for approval. The job won't start until they accept — protecting both you and them."
  },
  {
    category: "pyckers",
    question: "What happens if I can't complete a job?",
    answer: "We understand things happen! If you need to cancel, do so as early as possible through the app. Repeated cancellations or no-shows may result in penalties. Incomplete jobs without valid reason incur a $25 fee."
  },
  {
    category: "pyckers",
    question: "What vehicle do I need to become a Pro?",
    answer: "You need a truck or large cargo vehicle (pickup truck, box truck, cargo van, or large SUV with trailer). Vehicle must be 2010 or newer, pass safety inspection, have current registration and insurance ($100k+ liability), and be capable of hauling at least 10 cubic yards. Vehicle photos required during application."
  },
  {
    category: "pyckers",
    question: "What insurance do I need as a Pro?",
    answer: "Required: $1M general liability insurance (covers customer property damage), vehicle insurance with $100k+ liability, vehicle registration, and valid driver's license. We partner with insurance providers offering Pro-specific policies at discounted rates ($80-$150/month). COI (Certificate of Insurance) must be uploaded annually."
  },
  {
    category: "pyckers",
    question: "Is there training or an academy?",
    answer: "Yes! All new Pros complete UpTend Academy (free, 2-3 hours online). Training covers: customer service best practices, safety protocols, item handling techniques, app usage, pricing adjustments, dispute resolution, sustainability sorting, and business tips. Certification required before accepting jobs. Ongoing courses available for advanced skills and specialty services."
  },
  {
    category: "pyckers",
    question: "Can I choose which jobs to accept?",
    answer: "Yes! You have full control over which jobs you accept. The app shows job details (service type, location, price, estimated time) before you commit. You can filter by distance, price minimum, service types you prefer. However, consistent job declines (over 60%) may lower your priority in job matching."
  },
  {
    category: "pyckers",
    question: "How does job matching work?",
    answer: "Our algorithm considers: your location, service availability, vehicle type, ratings, completed jobs, and historical acceptance rate. Higher-rated Pros with better acceptance rates get first access to jobs. You can set your service radius (5-30 miles) and receive push notifications for nearby jobs in real-time."
  },
  {
    category: "pyckers",
    question: "What equipment do I need to provide?",
    answer: "Basic equipment required: work gloves, dolly/hand truck, tie-down straps, tarps, bungee cords, basic tools (screwdriver, wrench), and cleaning supplies. Specialized services require additional equipment: pressure washer (commercial grade 3000+ PSI), carpet cleaner (commercial extractor), landscaping tools (mower, edger, blower), pool equipment (skimmer, vacuum, test kit). We provide equipment purchase discounts through partner vendors."
  },
  {
    category: "pyckers",
    question: "Can I offer multiple services?",
    answer: "Absolutely! Many successful Pros offer 3-5 services to maximize bookings. You must complete service-specific training and have appropriate equipment for each. Popular combos: junk removal + moving labor, landscaping + pressure washing, home cleaning + carpet cleaning. Multi-service Pros earn 30-40% more on average."
  },
  {
    category: "pyckers",
    question: "What if a customer isn't home?",
    answer: "Contact them immediately via in-app messaging or masked phone call. Wait 15 minutes, then contact UpTend support. If customer is a no-show, you receive a $25 cancellation fee (50% of base). For recurring or pre-arranged contactless jobs (exterior only), proceed as scheduled and document with photos."
  },
  {
    category: "pyckers",
    question: "How are bonuses and incentives calculated?",
    answer: "Earn bonuses through: Weekly volume (20+ jobs gets $100 bonus), high ratings (maintain 4.8+ for month gets $50), referral program ($200 per Pro you recruit who completes 10 jobs), seasonal promotions (double earnings on major holidays), and loyalty tiers (Gold/Platinum Pros earn +5-10% on all jobs). Bonuses paid monthly."
  },
  {
    category: "pyckers",
    question: "Can I work in multiple cities?",
    answer: "Yes, if you're willing to travel! Set your service radius up to 50 miles. Some Pros cover multiple metro areas. However, focus on one region initially to build reputation and efficiency. Expanding to new territories once you're established (50+ jobs, 4.7+ rating) is recommended."
  },
  {
    category: "pyckers",
    question: "What happens if a customer disputes the price?",
    answer: "All pricing is documented with photos and approved through the app before work begins. If a customer disputes after job completion, UpTend reviews the photo evidence and approval records. Legitimate disputes (Pro error) result in partial refund and Pro education. Fraudulent disputes are rejected and customer is flagged. Pros are protected when proper documentation is followed."
  },
  {
    category: "pyckers",
    question: "Do I need to wear a uniform?",
    answer: "Not required, but recommended! Wear professional attire: clean work clothes, closed-toe boots/shoes, and UpTend branded gear (optional, but customers rate uniformed Pros 0.3 stars higher on average). We offer branded t-shirts, hats, and vehicle magnets in the Pro store at cost. Professional appearance directly impacts tips and ratings."
  },
  {
    category: "pyckers",
    question: "How do I handle disposal and recycling?",
    answer: "UpTend promotes sustainability! Sort items into: recycle (metal, wood, cardboard), donate (furniture, appliances, clothing), resell (valuable items), e-waste (electronics), and landfill (last resort). We partner with local recyclers, donation centers, and resale shops. The app shows nearby drop-off locations. Pros who maintain 70%+ diversion rate receive sustainability bonuses ($50-$200/month)."
  },
  {
    category: "pyckers",
    question: "What support is available for Pros?",
    answer: "Pro support available 7 days/week: In-app chat (instant), phone support (priority line), email (support@uptend.app), and community forum. Issues handled: customer disputes, app bugs, payment questions, insurance queries, safety concerns, job clarifications. Average response time: 15 minutes during business hours, 1 hour evenings/weekends."
  },
  {
    category: "pyckers",
    question: "How do I get better ratings?",
    answer: "Top-rated Pros follow these practices: arrive on-time (or communicate delays early), professional appearance, clear communication, document everything with photos, clean up work area, exceed expectations (take extra items for same price, spot clean while there), send thank-you message after job, follow up on satisfaction. Pros with 4.8+ ratings earn 30% more due to customer preference and platform priority."
  },
  {
    category: "pyckers",
    question: "Can I bring a helper?",
    answer: "Yes! Many Pros bring helpers for larger jobs (full truckloads, heavy items, estate cleanouts). You're responsible for paying your helper from your earnings (75% payout). Helpers don't need UpTend approval, but you're liable for their conduct and safety. Two-person crews can complete jobs 40-50% faster, allowing more jobs per day."
  },
];

const categories = [
  { id: "customers" as const, label: "For Customers", icon: Users },
  { id: "b2b" as const, label: "For Businesses", icon: Building2 },
  { id: "pricing" as const, label: "Pricing", icon: DollarSign },
  { id: "safety" as const, label: "Safety & Trust", icon: Shield },
  { id: "pyckers" as const, label: "For Pros", icon: Truck },
];

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<FAQCategory | "all">("all");
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (question: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(question)) {
      newOpenItems.delete(question);
    } else {
      newOpenItems.add(question);
    }
    setOpenItems(newOpenItems);
  };

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
    const matchesSearch = searchQuery === "" || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground">
              <Truck className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold">UpTend</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <HelpCircle className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Find answers to common questions about UpTend, pricing, and becoming a Pro.
          </p>
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-faq-search"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          <Button
            variant={activeCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory("all")}
            data-testid="button-category-all"
          >
            All Questions
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat.id)}
              data-testid={`button-category-${cat.id}`}
            >
              <cat.icon className="w-4 h-4 mr-2" />
              {cat.label}
            </Button>
          ))}
        </div>

        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No questions match your search. Try different keywords.</p>
            </Card>
          ) : (
            filteredFaqs.map((faq) => (
              <Card key={faq.question} className="overflow-hidden">
                <button
                  className="w-full p-4 flex items-start justify-between gap-4 text-left hover-elevate"
                  onClick={() => toggleItem(faq.question)}
                  data-testid={`faq-toggle-${faq.question.slice(0, 20).replace(/\s/g, '-')}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">
                        {categories.find(c => c.id === faq.category)?.label}
                      </Badge>
                    </div>
                    <h3 className="font-medium">{faq.question}</h3>
                  </div>
                  {openItems.has(faq.question) ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
                {openItems.has(faq.question) && (
                  <div className="px-4 pb-4 pt-0">
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>

        <Card className="p-6 mt-12 text-center bg-primary/5 border-primary/20">
          <h2 className="text-xl font-semibold mb-2">Still have questions?</h2>
          <p className="text-muted-foreground mb-4">
            Our support team is here to help you 7 days a week.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" asChild>
              <a href="mailto:support@uptend.app">Email Support</a>
            </Button>
            <Button asChild>
              <a href="tel:407-338-3342">Call (407) 338-3342</a>
            </Button>
          </div>
        </Card>
      </main>

      <footer className="border-t py-8 mt-16">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} UpTend. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/about" className="hover:text-foreground">About</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
