# Design Guidelines: On-Demand Hauling & Moving Platform

## Design Approach
**Reference-Based:** Drawing from Uber, TaskRabbit, and Thumbtack - prioritizing trust, speed, and clarity for real-time service booking.

## Core Design Principles
1. **Immediate Clarity**: Users should understand value and action within 3 seconds
2. **Trust First**: Prominent provider verification, ratings, and transparent pricing
3. **Speed Optimized**: Streamlined booking flow minimizing steps to confirmation
4. **Real-Time Confidence**: Clear availability indicators and ETA displays

## Typography System
**Primary Font**: Inter (Google Fonts) - clean, modern, excellent readability
**Secondary Font**: Space Grotesk (Google Fonts) - for headings and impact moments

**Hierarchy**:
- Hero Headlines: text-5xl lg:text-7xl, font-bold
- Section Headers: text-3xl lg:text-5xl, font-bold
- Provider Names: text-xl, font-semibold
- Body Text: text-base lg:text-lg
- Pricing/Stats: text-2xl lg:text-3xl, font-bold (tabular numbers)
- Labels/Metadata: text-sm, font-medium

## Layout & Spacing
**Tailwind Units**: Use 2, 4, 6, 8, 12, 16, 20, 24 for consistent rhythm
**Container**: max-w-7xl with px-4 md:px-6 lg:px-8
**Section Padding**: py-12 md:py-20 lg:py-28
**Component Gaps**: gap-4 for tight groupings, gap-8 for section divisions

## Page Structure

### Landing Page (8 Sections)

**1. Hero Section** (h-screen)
- Large hero image: Truck being loaded with junk/furniture in urban setting, bright daylight
- Centered booking widget overlay with blurred background (backdrop-blur-lg bg-white/90)
- Widget includes: Service type selector, ZIP code input, "Get Quote Now" CTA
- Trust indicators below: "15,000+ Jobs Completed" "4.9★ Average Rating" "Licensed & Insured"

**2. How It Works** (3-column grid)
Cards with icons (Heroicons), numbers, titles, descriptions:
- Request → Match → Complete
- Include small illustrative images showing the process

**3. Service Types** (2-column lg:4-column grid)
Feature cards with images:
- Junk Removal
- Furniture Moving
- Appliance Hauling  
- Estate Cleanouts
Each with icon, title, starting price, and "Book Now" link

**4. Live Availability Map**
Interactive section showing service coverage with available haulers
Real-time provider cards with: Photo, name, rating, truck type, ETA, price estimate

**5. Pricing Calculator**
Interactive component with:
- Item type selector (checkboxes with images)
- Volume estimator (slider)
- Instant price range display
- Transparent breakdown

**6. Trust & Safety** (3-column)
- Background Checked Providers
- $1M Insurance Coverage
- Secure Payment Processing
Each with icon, stat, and description

**7. Provider Showcase** (carousel/grid)
Featured hauler profiles with:
- Profile photo, company name, specialty
- Rating (stars + review count)
- "Years in Business" badge
- Sample customer review quote

**8. CTA Section**
Split layout:
- Left: Bold headline, feature bullets, download app buttons
- Right: Phone mockup showing app interface

**Footer**: Multi-column
- Quick Links (For Customers, For Haulers, Company)
- Contact info with phone/email/hours
- Social media links
- Trust badges (BBB, licenses)
- Newsletter signup: "Get $20 off your first booking"

### Dashboard (Hauler Side)

**Header**: 
- Logo, job requests counter, earnings today, notifications, profile dropdown

**Main Layout**: Sidebar + Content

**Sidebar** (w-64):
- Active Jobs (count badge)
- Job Requests
- Schedule
- Earnings
- Profile & Settings

**Content Area**:
Job Cards (grid lg:grid-cols-2):
- Customer name, location (map thumbnail)
- Service type, estimated load
- Pickup time window
- Distance from current location
- Price offer
- "Accept" / "View Details" actions

**Active Job View**:
Full-width map with route, customer details panel, timer, photo upload, completion checklist

### Customer Booking Flow

**Step 1 - Service Selection**:
Large cards with images, immediate availability badge

**Step 2 - Details**:
Form with photo upload zones, item list builder, access notes

**Step 3 - Matching**:
Loading state with "Finding available haulers..." then provider cards appear with Accept/Decline countdown

**Step 4 - Confirmation**:
Provider details, route map, ETA, final price, contact options, tracking link

## Component Library

**Buttons**:
- Primary: Solid, rounded-lg, px-8 py-4, font-semibold
- Secondary: Outline, same sizing
- Text: Minimal padding, underline on hover

**Cards**:
- Standard: rounded-xl, shadow-lg, p-6
- Provider: Include avatar, rating stars, badge overlays
- Job: Status indicator stripe (left border), hover lift effect

**Forms**:
- Inputs: rounded-lg, border-2, px-4 py-3, focus ring
- Labels: font-medium, mb-2
- Helper text: text-sm, text-gray-600

**Badges**:
- Status: rounded-full, px-3 py-1, text-xs font-semibold
- Verification: Icon + text, inline-flex items-center

**Icons**: Font Awesome via CDN
- Truck, box, star, shield, clock, map-marker, check-circle

## Images

**Hero**: Wide-angle shot of professional moving truck with crew loading furniture, urban residential setting, natural light

**Service Type Cards**: 
- Close-up of junk pile ready for removal
- Furniture being carefully moved
- Large appliance (fridge/washer)
- Estate cleanout scene

**How It Works**: Simple illustrated icons or photos showing phone interaction, truck arrival, completion

**Provider Photos**: Professional headshots with trucks/equipment visible

**App Mockups**: iPhone showing booking interface on transparent/gradient background

## Responsive Behavior
- Mobile: Single column, sticky booking button, collapsible filters
- Tablet: 2-column grids, persistent sidebar in drawer
- Desktop: Full multi-column layouts, side-by-side comparisons