import { db } from "../../db";
import {
  certificationPrograms,
  certificationModules,
  certificationQuestions,
} from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedCertificationPrograms() {
  // Check if already seeded
  const existing = await db.select({ id: certificationPrograms.id }).from(certificationPrograms);
  if (existing.length > 0) return;

  console.log("[Academy] Seeding certification programs...");

  // 1. B2B Property Management
  const [pmCert] = await db.insert(certificationPrograms).values({
    name: "B2B Property Management",
    slug: "b2b-property-management",
    description: "Master the protocols and communication standards required to work with property management companies. Learn work order management, tenant interaction best practices, and property access procedures.",
    category: "b2b",
    requiredScore: 80,
    modulesCount: 4,
    estimatedMinutes: 45,
    expirationDays: 365,
    badgeIcon: "building",
    badgeColor: "#f59e0b",
  }).returning();

  // 2. B2B HOA Operations
  const [hoaCert] = await db.insert(certificationPrograms).values({
    name: "B2B HOA Operations",
    slug: "b2b-hoa-operations",
    description: "Understand HOA governance, common area maintenance standards, and professional communication with boards and residents. Required for all HOA service contracts.",
    category: "b2b",
    requiredScore: 80,
    modulesCount: 4,
    estimatedMinutes: 40,
    expirationDays: 365,
    badgeIcon: "home",
    badgeColor: "#d97706",
  }).returning();

  // 3. AI Home Scan Specialist
  const [aiCert] = await db.insert(certificationPrograms).values({
    name: "AI Home Scan Specialist",
    slug: "ai-home-scan-specialist",
    description: "Learn UpTend's AI-powered home assessment methodology. Master photo documentation, condition reporting, and generating actionable maintenance plans for homeowners.",
    category: "specialty",
    requiredScore: 85,
    modulesCount: 3,
    estimatedMinutes: 30,
    expirationDays: 365,
    badgeIcon: "scan",
    badgeColor: "#ea580c",
  }).returning();

  // 4. Parts & Materials Handler
  const [partsCert] = await db.insert(certificationPrograms).values({
    name: "Parts & Materials Handler",
    slug: "parts-materials-handler",
    description: "Get certified to handle jobs requiring parts sourcing, receipt documentation, and installation verification. Essential for complex repair and maintenance jobs.",
    category: "specialty",
    requiredScore: 80,
    modulesCount: 3,
    estimatedMinutes: 25,
    expirationDays: 365,
    badgeIcon: "wrench",
    badgeColor: "#b45309",
  }).returning();

  // 5. Emergency Response
  const [emergCert] = await db.insert(certificationPrograms).values({
    name: "Emergency Response",
    slug: "emergency-response",
    description: "Qualify for emergency dispatch jobs with rapid response protocols, safety-first assessment procedures, and emergency communication standards.",
    category: "specialty",
    requiredScore: 90,
    modulesCount: 3,
    estimatedMinutes: 35,
    expirationDays: 365,
    badgeIcon: "alert-triangle",
    badgeColor: "#dc2626",
  }).returning();

  // 6. Government Contract Ready (prereq: PM cert)
  const [govCert] = await db.insert(certificationPrograms).values({
    name: "Government Contract Ready",
    slug: "government-contract-ready",
    description: "Meet compliance requirements for government and municipal contracts. Covers prevailing wage, Davis-Bacon Act, documentation standards, and OSHA requirements.",
    category: "government",
    prerequisiteCertId: pmCert.id,
    requiredScore: 85,
    modulesCount: 5,
    estimatedMinutes: 75,
    expirationDays: 365,
    badgeIcon: "landmark",
    badgeColor: "#1d4ed8",
  }).returning();

  // ===== MODULES =====

  // PM Modules
  await db.insert(certificationModules).values([
    {
      certificationId: pmCert.id,
      moduleNumber: 1,
      title: "PM Communication Standards",
      estimatedMinutes: 12,
      content: `# Property Management Communication Standards

## Why Communication Matters

Property Management companies are your primary point of contact — not the tenants, not the property owners. Understanding the chain of command is critical to maintaining professional relationships and repeat business.

## Key Principles

### 1. Single Point of Contact
- Always communicate through the PM's designated contact or portal
- Never go directly to property owners unless explicitly instructed
- If a tenant contacts you directly about scope changes, redirect them to the PM

### 2. Response Time Expectations
- **Urgent requests**: Respond within 15 minutes during business hours
- **Standard requests**: Respond within 2 hours
- **Scheduling inquiries**: Respond same business day
- Late responses erode trust faster than anything else

### 3. Professional Documentation
Every interaction should be documented:
- Pre-job photos (minimum 4 angles)
- During-job progress photos
- Post-job completion photos
- Time stamps on all entries
- Notes on any unexpected findings

### 4. Status Updates
- Send arrival confirmation when you reach the property
- Provide mid-job updates for jobs exceeding 2 hours
- Send completion notification with summary and photos
- Flag any issues or recommended follow-up work

## Communication Templates

### Arrival Notification
> "Hi [PM Name], this is [Your Name] with UpTend. I've arrived at [Property Address] for the scheduled [Service Type]. Starting work now. Estimated completion: [Time]. I'll send an update when complete."

### Completion Notification  
> "Hi [PM Name], [Service Type] at [Property Address] is complete. [Brief summary of work done]. Photos attached. Please let me know if you need anything else."

### Issue Discovery
> "Hi [PM Name], while performing [Service Type] at [Property Address], I noticed [Issue]. This is outside the current scope but may need attention. Would you like me to provide a quote, or would you prefer to handle separately?"

## Red Flags to Avoid
- ❌ Discussing pricing with tenants
- ❌ Making scope changes without PM approval
- ❌ Sharing PM contact info with tenants
- ❌ Posting property photos on social media
- ❌ Accepting cash payments from anyone on-site`,
    },
    {
      certificationId: pmCert.id,
      moduleNumber: 2,
      title: "Work Order Protocols",
      estimatedMinutes: 12,
      content: `# Work Order Protocols

## Understanding Work Orders

A work order is your contract for each job. It defines exactly what you're authorized to do, and more importantly, what you're NOT authorized to do.

## Work Order Lifecycle

### 1. Receiving a Work Order
When a work order comes in through UpTend:
- Review the full scope before accepting
- Note the **NTE (Not-to-Exceed)** amount — this is your budget ceiling
- Check the property address and access instructions
- Verify the scheduled date and time window
- Identify any special instructions or tenant considerations

### 2. Pre-Job Preparation
- Confirm you have the right tools and materials
- Review the property history if available
- Check weather conditions for outdoor work
- Plan your route to arrive 5-10 minutes early

### 3. On-Site Execution
- Follow the scope exactly as written
- If additional work is needed, STOP and get approval
- Document everything with time-stamped photos
- Track your time accurately — start and end times matter

### 4. Scope Change Protocol
When you discover work beyond the original scope:
1. Stop work on the additional item
2. Document the finding with photos
3. Submit a scope change request through UpTend
4. Include estimated additional time and cost
5. Wait for written approval before proceeding
6. **Never exceed the NTE without prior written approval**

### 5. Completion & Close-Out
- Complete the work order checklist
- Upload all required photos
- Note actual time spent
- Flag any recommended follow-up maintenance
- Submit for review

## NTE (Not-to-Exceed) Rules

The NTE amount is sacred in PM work:
- **Under NTE**: Complete the work and invoice actual amount
- **At NTE**: Complete what you can within budget, document remaining items
- **Over NTE**: You MUST get written approval before spending over the limit
- Exceeding NTE without approval means you may not get paid for the overage

## Common Work Order Types
| Type | Typical NTE | Time Window |
|------|-------------|-------------|
| Make-Ready / Turnover | $500-$2,000 | 3-5 days |
| Emergency Repair | $300-$500 | Same day |
| Preventive Maintenance | $150-$400 | Scheduled |
| Inspection | $75-$150 | 1-2 hours |
| Landscaping/Exterior | $200-$600 | Scheduled |`,
    },
    {
      certificationId: pmCert.id,
      moduleNumber: 3,
      title: "Tenant Interaction Rules",
      estimatedMinutes: 10,
      content: `# Tenant Interaction Rules

## Your Role at the Property

You're a service professional representing both UpTend and the PM company. Tenants will see you as an extension of their management company.

## Golden Rules

### 1. You Are Not the Landlord
- Don't comment on property conditions beyond your scope
- Don't discuss rent, lease terms, or property management decisions
- Don't promise future services or repairs
- Don't give opinions on disputes between tenants and PMs

### 2. Professional Boundaries
- Introduce yourself: "Hi, I'm [Name] from UpTend, here for the scheduled [service]"
- Be courteous but maintain professional distance
- Don't accept food, drinks, or tips from tenants (company policy)
- Don't share personal phone numbers — all communication through the platform

### 3. Privacy & Respect
- Only access areas specified in the work order
- Knock and announce before entering any room
- If a tenant is uncomfortable with your presence, step outside and notify the PM
- Never photograph personal belongings or people
- Respect quiet hours (before 8 AM, after 8 PM)

### 4. When Tenants Ask Questions
**"When will this be fixed?"**
> "The property management team has this scheduled and will keep you updated on the timeline."

**"Can you also fix [something else]?"**
> "I'd love to help, but I need to check with the property management team first. I'll let them know you mentioned it."

**"The landlord never fixes anything around here."**
> "I understand that can be frustrating. I'll make sure my report is thorough so the team has full visibility."

### 5. Safety Concerns
If you encounter:
- **Unsanitary/hoarding conditions**: Document, complete your scope if safe, report to PM
- **Illegal activity**: Leave immediately, call PM, do not confront
- **Aggressive tenant**: De-escalate, leave if needed, call PM
- **Children/pets unattended**: Note in report, proceed with caution
- **Structural damage**: Stop work if unsafe, document, notify PM immediately

## Documentation
After every tenant interaction that's noteworthy:
- Note it in the job log
- Include time and nature of interaction
- If a tenant made a request, include it in your completion notes`,
    },
    {
      certificationId: pmCert.id,
      moduleNumber: 4,
      title: "Property Access & Security",
      estimatedMinutes: 11,
      content: `# Property Access & Security

## Access Methods

PM properties use various access methods. Know them all:

### Lockbox
- Most common for vacant units
- Get the code from the work order or PM
- Always re-secure the lockbox when leaving
- Never share lockbox codes with anyone
- Report if a lockbox is missing or damaged

### Key Pickup/Drop-Off
- Pick up from the PM office or designated location
- Return keys the same day unless told otherwise
- Never make copies of keys
- If you lose a key, report immediately — this triggers a re-key at your expense

### Tenant-Present Access
- Arrive within the scheduled time window
- If tenant isn't home, wait 15 minutes, then call PM
- Don't leave without documenting the attempt
- Never enter without tenant permission when they're expected to be present

### Smart Lock / Electronic Access
- Temporary codes may expire — verify before heading out
- Don't share electronic access with others
- Report any access issues immediately

## Security Protocols

### Upon Arrival
1. Verify the address matches the work order
2. Check for signs of unauthorized entry or damage
3. Take exterior photos before entering
4. Test locks and doors — note if anything is unsecured

### During Work
- Keep doors locked if working inside a vacant unit
- Don't leave tools or equipment unattended in common areas
- Secure the property if you step out (even briefly)
- If you notice security cameras, work professionally — you're on film

### Upon Departure
1. Ensure all doors are locked
2. All windows closed and locked
3. HVAC set to the temperature specified (or 72°F default for vacant)
4. Lights off (unless specified otherwise)
5. Lockbox re-secured / keys returned
6. Take exterior departure photos

### Alarm Systems
- Get alarm codes with the work order
- If an alarm triggers: don't panic, enter the code, call PM
- If you can't disarm, leave the property and call PM
- Always ask about alarms before entering

## Liability Protection
- Never let unauthorized people into a property
- If someone claims to be the owner/tenant, verify through the PM
- Document the condition of the property before AND after your work
- If something was already damaged, photograph it before touching anything`,
    },
  ]);

  // HOA Modules
  await db.insert(certificationModules).values([
    {
      certificationId: hoaCert.id,
      moduleNumber: 1,
      title: "HOA Governance Basics",
      estimatedMinutes: 10,
      content: `# HOA Governance Basics

## What is an HOA?

A Homeowners Association (HOA) is a governing body that manages a residential community. They enforce rules (CC&Rs — Covenants, Conditions & Restrictions) and maintain common areas.

## Why This Matters to You

As a service pro working with HOAs, you need to understand:
- **Who makes decisions**: The Board of Directors, not individual homeowners
- **What governs the work**: The CC&Rs and community guidelines
- **Who pays**: The HOA management company, not individual homeowners
- **Your chain of command**: HOA Management → Board → You

## HOA Structure

### Board of Directors
- Volunteer homeowners elected by the community
- They approve budgets, vendors, and major decisions
- You may interact with board members during inspections
- Always be professional — they're your client's client

### HOA Management Company
- Your direct client — they manage day-to-day operations
- They issue work orders, handle payments, and coordinate access
- All communication goes through them unless directed otherwise

### Community Manager
- Your primary point of contact
- Handles scheduling, approvals, and scope changes
- Treat them like a PM — responsive, professional communication

## Common HOA Service Categories
- **Common Area Maintenance**: Pools, clubhouses, playgrounds, landscaping
- **Exterior Maintenance**: Building facades, roofs, gutters, pressure washing
- **Seasonal Work**: Holiday decorations, seasonal plantings, winterization
- **Emergency Repairs**: Storm damage, plumbing failures, electrical issues
- **Inspections**: Annual property assessments, code compliance checks

## Key Differences from Regular Jobs
1. **Visibility**: You're working in shared spaces — residents are watching
2. **Standards**: HOAs have specific aesthetic standards (colors, materials, methods)
3. **Timing**: Work may be restricted to certain hours to minimize disruption
4. **Documentation**: More thorough than residential — boards want detailed reports
5. **Recurring**: HOA work is often ongoing contracts, not one-off jobs`,
    },
    {
      certificationId: hoaCert.id,
      moduleNumber: 2,
      title: "Common Area Maintenance Standards",
      estimatedMinutes: 10,
      content: `# Common Area Maintenance Standards

## What Are Common Areas?

Common areas are shared spaces owned and maintained by the HOA:
- Swimming pools and pool decks
- Clubhouses and community centers
- Playgrounds and parks
- Walking trails and sidewalks
- Parking structures and lots
- Landscaped areas and medians
- Fitness centers
- Mailroom areas

## Maintenance Standards

### Cleanliness
- Common areas should be guest-ready at all times
- Remove debris, trash, and organic matter during every visit
- Pressure wash surfaces on schedule (quarterly minimum)
- Report graffiti, vandalism, or damage immediately

### Safety First
- **Trip hazards**: Uneven pavement, raised roots, broken tiles — flag immediately
- **Lighting**: Burned-out bulbs in common areas are a liability — replace or report
- **Water hazards**: Standing water, broken sprinklers, pool issues — critical priority
- **Structural**: Loose railings, broken fencing, damaged stairs — document and escalate

### Work Quality Standards
When working in common areas:
- **Leave no trace**: Clean up all materials, dust, debris
- **Protect surfaces**: Use drop cloths, tape, protective coverings
- **Minimize disruption**: Use low-noise equipment during restricted hours
- **Safety barriers**: Set up cones, caution tape, or barriers when needed
- **ADA compliance**: Never block accessible pathways or entrances

### Seasonal Considerations
**Spring**: Focus on landscaping refresh, pressure washing, pool prep
**Summer**: Pool maintenance priority, irrigation checks, pest control
**Fall**: Gutter cleaning, leaf removal, winterization prep
**Winter**: Snow/ice management, heating system checks, holiday decor

## Reporting
After every common area visit:
1. Document condition with photos (before/after)
2. Note any new issues discovered
3. Rate condition: Good / Fair / Needs Attention / Critical
4. Estimate time/cost for any recommended follow-up work
5. Submit through UpTend within 24 hours`,
    },
    {
      certificationId: hoaCert.id,
      moduleNumber: 3,
      title: "Violation Documentation",
      estimatedMinutes: 10,
      content: `# Violation Documentation

## Your Role in Violation Documentation

Some HOA contracts include property inspection and violation documentation. This is sensitive work that requires objectivity and precision.

## What Are HOA Violations?

Violations are breaches of the community's CC&Rs. Common examples:
- Unapproved exterior modifications (paint colors, structures, fencing)
- Lawn maintenance failures (overgrown grass, dead landscaping)
- Parking violations (boats, RVs, commercial vehicles)
- Trash/debris visible from the street
- Unauthorized signage
- Pet violations
- Noise complaints (documented evidence only)

## Documentation Standards

### Photography Requirements
- **Clear, well-lit photos** — take multiple angles
- **Include context**: Show the property address or unit number in frame
- **Date/time stamped**: Use the UpTend app camera for automatic timestamps
- **Objective framing**: Don't zoom in to exaggerate — capture the full picture
- **No people**: Never photograph residents in violation photos

### Written Documentation
Each violation report should include:
1. **Date and time** of observation
2. **Property address / unit number**
3. **Specific CC&R section** being violated (if known)
4. **Objective description**: "12-inch grass height measured at front lawn" NOT "Homeowner doesn't care about their yard"
5. **Number of photos** attached
6. **Repeat violation?** Note if previously documented

### What NOT to Do
- ❌ Confront homeowners about violations
- ❌ Discuss violations with neighbors
- ❌ Add personal opinions to reports
- ❌ Photograph inside homes or private areas
- ❌ Trespass to get a better photo
- ❌ Share violation data with anyone except the management company

## Objectivity is Everything

Your reports may be used in legal proceedings. Keep them:
- **Factual**: Only document what you can see and measure
- **Consistent**: Use the same standards for every property
- **Professional**: Business language only
- **Complete**: Don't skip properties because you know the homeowner

## Inspection Routes
- Follow the assigned route — don't skip or reorder
- Document EVERY property, even compliant ones (note "No violations observed")
- Complete the full route in one session when possible
- If weather prevents inspection, reschedule through the management company`,
    },
    {
      certificationId: hoaCert.id,
      moduleNumber: 4,
      title: "Resident Communication",
      estimatedMinutes: 10,
      content: `# Resident Communication in HOA Communities

## The Unique Challenge

Unlike PM work where you interact with individual tenants, HOA work puts you in front of an entire community. Any resident can approach you, and word travels fast.

## Professional Presence

### Appearance
- Clean, branded uniform or UpTend apparel
- Visible ID badge
- Clean, organized vehicle and equipment
- No loud music from vehicles or equipment

### Behavior
- Park in designated areas (not in resident spots)
- Don't block driveways or fire lanes
- Keep noise to a minimum
- Clean as you go — residents notice mess

## Common Resident Interactions

### "What are you working on?"
> "I'm with UpTend, contracted by [Management Company] for [general description]. If you have any questions, [Management Company] can help!"

### "Can you also do [personal request] at my house?"
> "I appreciate the interest! My current contract is with the HOA for common areas. For personal service, you can book through UpTend at uptend.app — we'd love to help!"

### "I have a complaint about [issue]."
> "I understand your concern. The best way to get that addressed is through your community manager at [Management Company]. They track all requests and can prioritize accordingly."

### "The HOA is terrible / wasting money."
> "I understand community management can be complex. I focus on making sure the work I do meets the highest standards for your community."

## Board Meeting Attendance
Occasionally you may be asked to attend a board meeting to:
- Present maintenance reports
- Propose service plans or budgets
- Answer questions about completed work

**If invited:**
- Dress professionally
- Prepare a brief, factual presentation
- Bring before/after photos
- Be ready for tough questions — boards are budget-conscious
- Don't take criticism personally — it's business
- Follow up with a written summary

## Social Media Policy
- Never post about specific HOA communities without written permission
- Don't engage with community social media groups or forums
- If residents post about your work (good or bad), let the management company handle it
- You can share general (non-identifying) work photos on your own professional profiles with management approval`,
    },
  ]);

  // AI Home Scan Modules
  await db.insert(certificationModules).values([
    {
      certificationId: aiCert.id,
      moduleNumber: 1,
      title: "Home Assessment Methodology",
      estimatedMinutes: 10,
      content: `# Home Assessment Methodology

## What is an AI Home Scan?

UpTend's AI Home Scan is a comprehensive property assessment that uses your on-site expertise combined with AI analysis to generate actionable maintenance recommendations for homeowners.

## The Assessment Process

### 1. Pre-Visit Preparation
- Review the property details (square footage, age, type)
- Check local weather history for recent events
- Prepare your assessment kit (camera, measuring tape, flashlight, moisture meter if available)
- Plan your inspection route: Exterior → Interior → Systems

### 2. Exterior Assessment (30-40 minutes)
Systematically inspect and document:

**Roof & Gutters**
- Visible shingle/tile damage or wear
- Gutter condition, blockages, proper drainage
- Flashing around vents, chimneys, skylights
- Signs of water intrusion (staining on fascia)

**Foundation & Structure**
- Visible cracks (measure width with a reference — coin or ruler in photo)
- Settlement or heaving
- Grading — does water flow away from the foundation?
- Crawl space vents (open/closed/blocked)

**Exterior Surfaces**
- Siding condition (rot, damage, missing pieces)
- Paint condition (peeling, fading, chalking)
- Trim and caulking around windows and doors
- Deck/patio condition

**Landscaping & Drainage**
- Tree limbs near structure or power lines
- Irrigation system function
- Drainage patterns and problem areas
- Fence condition

### 3. Interior Assessment (30-40 minutes)
**Room by Room**
- Ceiling stains or damage (indicates roof/plumbing issues)
- Wall condition (cracks, nail pops, moisture)
- Floor condition (warping, squeaking, damage)
- Windows and doors (operation, seals, locks)
- Electrical outlets (test with outlet tester)

**Wet Areas (Kitchen, Bathrooms, Laundry)**
- Under-sink inspection for leaks
- Caulk/grout condition
- Ventilation (exhaust fans working?)
- Water pressure and drainage speed

### 4. Systems Check (15-20 minutes)
- HVAC: Filter condition, unusual noises, age of unit
- Water heater: Age, condition, temperature setting
- Electrical panel: Proper labeling, no double-tapped breakers
- Smoke/CO detectors: Present, functional, battery status

## Scoring
Rate each area on a 1-5 scale:
- **5**: Excellent — no action needed
- **4**: Good — minor maintenance recommended within 12 months
- **3**: Fair — maintenance needed within 6 months
- **2**: Poor — repair needed within 3 months
- **1**: Critical — immediate attention required`,
    },
    {
      certificationId: aiCert.id,
      moduleNumber: 2,
      title: "Photo Documentation Standards",
      estimatedMinutes: 10,
      content: `# Photo Documentation Standards

## Why Photos Matter

Your photos feed the AI analysis engine. Better photos = better recommendations = happier homeowners = repeat business.

## Photo Requirements

### Technical Standards
- **Resolution**: Minimum 8MP (most modern phones exceed this)
- **Lighting**: Use flash for dark areas, but also take a natural-light version
- **Focus**: Tap to focus on the subject, ensure sharp images
- **Orientation**: Landscape for wide shots, portrait for tall elements
- **Steady**: Use both hands, brace against something if needed

### Required Photo Set (Minimum 35-50 photos per assessment)

**Exterior — Minimum 15 photos:**
- Front of home (full view)
- Back of home (full view)
- Each side of home
- Roof (from ground level, multiple angles)
- Gutters (close-up showing condition)
- Foundation (close-up of any cracks or issues)
- Driveway and walkways
- Deck/patio
- Fence
- HVAC exterior unit
- Electrical meter area

**Interior — Minimum 15 photos:**
- Each room (wide shot showing overall condition)
- Kitchen appliances (age stickers if visible)
- Bathroom fixtures and caulk lines
- Under sinks (all)
- Water heater (data plate)
- HVAC filter
- Electrical panel (cover open + labels)
- Attic access (if accessible)
- Any visible damage or concerns

**Issue Documentation — As needed:**
- Wide shot showing location/context
- Close-up showing the specific issue
- Reference object for scale (coin, hand, ruler)
- Multiple angles if the issue is 3-dimensional

### Photo Naming Convention
The UpTend app auto-tags photos, but add notes:
- Location: "Master Bath - Under Sink"
- Issue: "Crack in foundation - east wall - approx 1/8 inch"
- System: "HVAC outdoor unit - model plate"

### Common Mistakes
- ❌ Blurry photos (reshoot immediately)
- ❌ Fingers in frame
- ❌ Too dark without flash
- ❌ Missing context (close-up without a wide shot showing location)
- ❌ Personal items prominently featured (privacy concern)
- ❌ Photos of people (especially children)`,
    },
    {
      certificationId: aiCert.id,
      moduleNumber: 3,
      title: "Report Generation",
      estimatedMinutes: 10,
      content: `# Report Generation

## The AI Home Scan Report

After your assessment, UpTend's AI combines your photos, notes, and scores to generate a comprehensive maintenance report. Your input quality directly determines report quality.

## Your Role in Report Generation

### 1. Completing the Assessment Form
The UpTend app guides you through each section:
- Rate each area (1-5 scale)
- Add notes for anything rated 3 or below
- Tag photos to the correct assessment area
- Estimate urgency (immediate / 3 months / 6 months / 12 months)
- Note approximate repair costs if you can estimate

### 2. Priority Flagging
Flag items that are:
- **Safety hazards** (electrical issues, structural concerns, tripping hazards)
- **Water intrusion risks** (roof damage, foundation cracks, plumbing leaks)
- **Code violations** (smoke detectors, handrails, GFCI outlets)
- **Efficiency issues** (insulation, old HVAC, drafty windows)

### 3. Professional Recommendations
For each issue, provide:
- What the problem is (in plain language)
- Why it matters (consequences of inaction)
- Recommended solution
- Rough timeline for repair
- Whether it's a DIY fix or professional service needed

### 4. Review Before Submission
Before submitting your assessment:
- ✅ All required photos uploaded and tagged
- ✅ Every section rated
- ✅ Notes added for any rating of 3 or below
- ✅ Safety hazards flagged with urgency
- ✅ Contact info correct
- ✅ No personal opinions — just professional observations

## The Homeowner Experience

Understanding what the homeowner sees helps you do better work:

1. **Executive Summary**: Overall health score (A-F grade), top 3 priorities
2. **Category Breakdown**: Roof, Foundation, Exterior, Interior, Systems — each scored
3. **Action Items**: Prioritized list with estimated costs and timelines
4. **Photo Evidence**: Your photos organized by category
5. **Maintenance Calendar**: AI-generated schedule based on findings
6. **UpTend Service Links**: Direct booking for recommended services

## Quality Metrics
Your assessments are rated by:
- **Completeness**: Did you cover every section?
- **Photo Quality**: Clear, well-tagged, sufficient quantity
- **Accuracy**: Do your ratings match what photos show?
- **Timeliness**: Assessment submitted within 24 hours of visit
- **Customer Feedback**: Homeowner satisfaction with the assessment

Maintaining a 4.5+ quality score keeps you eligible for premium AI Home Scan assignments.`,
    },
  ]);

  // Parts & Materials Modules
  await db.insert(certificationModules).values([
    {
      certificationId: partsCert.id,
      moduleNumber: 1,
      title: "Parts Identification & Sourcing",
      estimatedMinutes: 8,
      content: `# Parts Identification & Sourcing

## When Parts Are Needed

Some jobs require you to source and install specific parts. This certification ensures you handle the process correctly, protecting both you and the customer.

## Identification Protocol

### 1. Assess What's Needed
Before leaving the job site:
- Take photos of the existing part/component (including model/serial numbers)
- Note the brand, model, and specifications
- Measure dimensions if relevant
- Check if the part is still under manufacturer warranty

### 2. Sourcing Priority
Always source parts in this order:
1. **Customer-provided**: If they already have the part, use it
2. **Manufacturer/OEM parts**: Preferred for warranty compliance
3. **Authorized distributors**: Home Depot, Lowe's, Grainger, Ferguson
4. **Compatible alternatives**: Only with customer/PM approval

### 3. Cost Approval
**Before purchasing anything:**
- Get written approval from the customer or PM
- Provide at least 2 options when possible (good/better)
- Include part cost + any markup (per UpTend guidelines, max 15% markup)
- Note if expedited shipping is needed and the additional cost

### 4. Documentation
For every part purchase:
- Keep the original receipt (photo + physical)
- Note the vendor, part number, and cost
- Record any warranty information
- Tag the receipt to the job in UpTend

## Common Parts Categories
- **Plumbing**: Faucets, valves, supply lines, fittings, garbage disposals
- **HVAC**: Filters, capacitors, contactors, thermostats
- **Electrical**: Outlets, switches, breakers, fixtures
- **Hardware**: Locks, hinges, door closers, cabinet hardware
- **Appliance**: Belts, elements, igniters, seals

## Pro Tips
- Build relationships with local supply houses — pro pricing saves everyone money
- Keep common parts in your vehicle (standard filters, faucet cartridges, outlet covers)
- Know your limits — if a part requires a licensed trade to install, refer to the right pro`,
    },
    {
      certificationId: partsCert.id,
      moduleNumber: 2,
      title: "Receipt Documentation & Reimbursement",
      estimatedMinutes: 8,
      content: `# Receipt Documentation & Reimbursement

## Why This Matters

Proper receipt documentation ensures you get reimbursed quickly and protects against disputes. Sloppy documentation is the #1 reason for reimbursement delays.

## Receipt Requirements

### What Must Be on Every Receipt
- Store name and location
- Date of purchase
- Itemized list of parts purchased
- Individual prices and total
- Payment method used
- Your name or business name

### How to Document
1. **Physical receipt**: Keep it until the job is fully closed
2. **Photo of receipt**: Upload immediately through UpTend app
3. **Tag to job**: Associate the receipt with the correct work order
4. **Add notes**: Which part is for what purpose

### Digital vs. Physical
- Digital receipts (email) are acceptable — forward to your UpTend job file
- If buying online, screenshot the order confirmation AND the shipping confirmation
- Credit card statements alone are NOT sufficient — need itemized receipts

## Reimbursement Process

### For PM / B2B Jobs
1. Purchase parts with your own funds (or company card)
2. Upload receipt to the work order
3. Note the total parts cost in your job completion form
4. Reimbursement is included in your job payment
5. Markup is calculated automatically per the contract rate

### For Direct Consumer Jobs
1. Discuss parts cost with the customer before purchasing
2. Get approval in the UpTend chat (creates a record)
3. Purchase and document
4. Customer is charged parts + service fee
5. You're reimbursed in your next payout

## Returns & Unused Parts
- Return unused parts within 48 hours of job completion
- Upload the return receipt
- Adjust the parts total on the work order
- Never keep unused parts purchased for a specific job

## Common Issues
- ❌ **No receipt**: No reimbursement. Period.
- ❌ **Wrong job tagged**: Delays payment and creates accounting issues
- ❌ **Personal items on receipt**: Separate transactions for personal and job purchases
- ❌ **Unapproved purchases**: If you buy without approval, you may not be reimbursed`,
    },
    {
      certificationId: partsCert.id,
      moduleNumber: 3,
      title: "Installation Verification",
      estimatedMinutes: 9,
      content: `# Installation Verification

## Confirming Proper Installation

After installing any part or component, you must verify and document that it's working correctly. This protects you from callbacks and liability.

## Verification Checklist

### General (All Parts)
- [ ] Part matches what was approved
- [ ] Installed per manufacturer specifications
- [ ] No visible damage to surrounding area
- [ ] All connections secure and tight
- [ ] Old part removed and disposed of properly
- [ ] Area cleaned up

### Plumbing
- [ ] No leaks (check all connections after 15 minutes)
- [ ] Proper water flow and pressure
- [ ] Hot/cold functioning correctly
- [ ] Drain flowing properly
- [ ] No drips under pressure

### Electrical
- [ ] Proper voltage verified with meter
- [ ] No buzzing or arcing
- [ ] Switch/outlet functioning correctly
- [ ] Cover plate installed properly
- [ ] GFCI tested (if applicable)

### HVAC
- [ ] System cycles on and off correctly
- [ ] Proper airflow from vents
- [ ] No unusual noises
- [ ] Thermostat responding correctly
- [ ] Filter seated properly

### Hardware
- [ ] Door/window operates smoothly
- [ ] Lock engages and disengages properly
- [ ] Hinges aligned, no binding
- [ ] Handle/knob secure

## Documentation

### Photo Proof
Take these photos after installation:
1. **Wide shot**: Shows the installed part in context
2. **Close-up**: Shows the specific part installed correctly
3. **Working proof**: Photo or short video showing the part functioning
4. **Old part**: Photo of the removed part (proof of replacement)

### Customer/PM Sign-Off
- Walk the customer through what was installed
- Demonstrate it's working
- Get verbal confirmation (note it in the app)
- For PM jobs, note in completion report

## Warranty Handling
- Note any manufacturer warranty on the installed part
- Provide warranty info to the customer/PM
- If you installed it, you own the workmanship warranty for 30 days (UpTend standard)
- Keep records of the part and installation date for warranty claims

## Callbacks
If called back for a part you installed:
1. Respond within 24 hours
2. Diagnose whether it's a part defect or installation issue
3. If it's your installation: fix at no charge
4. If it's a defective part: process warranty claim, replace
5. Document everything — callbacks are tracked in your quality score`,
    },
  ]);

  // Emergency Response Modules
  await db.insert(certificationModules).values([
    {
      certificationId: emergCert.id,
      moduleNumber: 1,
      title: "Emergency Dispatch Protocols",
      estimatedMinutes: 12,
      content: `# Emergency Dispatch Protocols

## What Qualifies as Emergency?

Emergency dispatch jobs have a 2-hour or less response window. They include:
- **Water damage**: Active leaks, flooding, burst pipes
- **Storm damage**: Tree falls, roof damage, broken windows (during/after severe weather)
- **Fire damage**: Board-up, tarping, immediate safety measures (AFTER fire dept clears)
- **Lock-outs / Security**: Broken locks, broken windows, unsecured properties
- **HVAC failure**: Extreme heat (>95°F) or cold (<32°F) with vulnerable occupants

## Dispatch Response Protocol

### 1. Acknowledgment (Within 5 minutes)
When you receive an emergency dispatch:
- Accept or decline immediately — do not let it sit
- If you accept, confirm your ETA
- If you decline, it goes to the next available pro instantly
- False accepts (accepting then no-showing) result in certification suspension

### 2. En Route (Communication)
- Send "On my way" notification through the app
- If you'll be delayed, update your ETA immediately
- If traffic/weather prevents timely arrival, call UpTend dispatch to reassign
- Never go dark on an emergency call

### 3. Arrival Assessment (First 10 minutes)
Upon arrival:
1. **Safety first**: Assess for personal safety hazards
2. **Document**: Take arrival photos immediately
3. **Triage**: Determine immediate vs. secondary priorities
4. **Communicate**: Update the customer/PM on what you see and your plan
5. **Stabilize**: Begin mitigation to prevent further damage

### 4. Emergency Mitigation
Your job in an emergency is to **stop the bleeding**, not perform a full repair:
- **Water**: Shut off the water source, begin extraction if possible, set up drying
- **Storm**: Tarp exposed areas, board up openings, remove hazards
- **Security**: Secure the property (board up, temporary locks, tarps)
- **HVAC**: Provide temporary heating/cooling solution or emergency repair

### 5. Documentation During Emergency
Even in a rush, document:
- Arrival time
- Initial condition photos (before you touch anything)
- Actions taken
- Materials used
- Time stamps throughout
- Departure condition

### 6. Follow-Up
Within 2 hours of completing emergency stabilization:
- Submit your emergency report through UpTend
- Note any follow-up work needed
- Provide a rough estimate for permanent repairs
- Flag if the property is habitable or not`,
    },
    {
      certificationId: emergCert.id,
      moduleNumber: 2,
      title: "Safety-First Assessment",
      estimatedMinutes: 12,
      content: `# Safety-First Assessment

## Your Safety Comes First. Always.

No property, no deadline, no amount of money is worth your life or health. If a scene is unsafe, DO NOT ENTER.

## Scene Safety Protocol

### Before Entering
Ask yourself:
1. **Is there active danger?** (fire, live electrical, gas smell, structural collapse)
2. **Have emergency services cleared the scene?** (if applicable)
3. **Do I have the right PPE?** (personal protective equipment)
4. **Is there a safe exit route?**

### Red Flags — DO NOT ENTER
- 🔴 Smell of gas (natural gas or propane) — call 911, move away
- 🔴 Active fire or smoke — wait for fire department
- 🔴 Standing water with electrical components nearby
- 🔴 Visible structural damage (sagging roof, leaning walls, cracked foundation)
- 🔴 Downed power lines on or near the property
- 🔴 Evidence of hazardous materials (chemical spills, asbestos debris)
- 🔴 Aggressive animals or hostile individuals

### Yellow Flags — Proceed with Extreme Caution
- ⚠️ Water damage with unknown depth
- ⚠️ Storm damage with unstable debris
- ⚠️ Old buildings (pre-1978 — potential lead/asbestos)
- ⚠️ Confined spaces (crawl spaces, attics)
- ⚠️ Working at heights (>6 feet)

## Required PPE by Situation

### Water Damage
- Rubber boots (waterproof, non-slip)
- Rubber gloves
- N95 mask (if mold is visible)
- Eye protection

### Storm / Debris
- Hard hat
- Steel-toe boots
- Heavy work gloves
- Safety glasses
- High-visibility vest

### Fire / Smoke Damage
- N95 or P100 respirator
- Full-coverage clothing
- Eye protection
- Gloves (chemical-resistant)
- Boot covers

## Injury Protocol
If you're injured on-site:
1. Stop work immediately
2. Administer first aid if possible
3. Call 911 if the injury is serious
4. Notify UpTend dispatch
5. Document the injury (photos, written account)
6. Seek medical attention — even for "minor" injuries
7. File an incident report within 24 hours

## Refusing Unsafe Work
You have the absolute right to refuse unsafe work:
- Document why you're refusing (photos of the hazard)
- Notify dispatch immediately
- Never let a customer or PM pressure you into an unsafe situation
- UpTend backs your safety decisions — no penalties for refusing unsafe work`,
    },
    {
      certificationId: emergCert.id,
      moduleNumber: 3,
      title: "Rapid Response Communication",
      estimatedMinutes: 11,
      content: `# Rapid Response Communication

## Communication in Emergencies

During emergencies, clear and fast communication prevents further damage, reduces liability, and keeps everyone informed.

## Communication Timeline

### Minute 0-5: Acknowledgment
- Accept the dispatch
- Confirm your ETA
- Note any equipment you'll bring

### Minute 5-30: En Route
- Share live location (UpTend app)
- If delayed, update ETA immediately
- Call dispatch if major delay (>15 minutes past ETA)

### Arrival: Initial Report
Within 5 minutes of arrival, send:
> "Arrived at [address]. Initial assessment: [brief description]. [Active/Contained/Stable]. Beginning [action]. Will update in [timeframe]."

**Example:**
> "Arrived at 123 Oak St. Initial assessment: Burst pipe in upstairs bathroom, active water flow to first floor. Water supply is being shut off now. Will update in 15 minutes."

### During Work: Progress Updates
Every 30 minutes (or when significant changes occur):
> "[Time] Update: [What's been done]. [Current status]. [Next steps]. Estimated completion: [time]."

### Completion: Final Report
> "Emergency stabilization complete at [time]. Summary: [actions taken]. Property is [secured/habitable/needs follow-up]. Detailed report to follow within 2 hours."

## Who to Communicate With

### Customer/Tenant
- Keep it simple and reassuring
- Don't make promises about costs or timelines for full repair
- Explain what you're doing and why
- Tell them what happens next

### Property Manager (B2B)
- More detailed, technical communication
- Include NTE impact
- Flag if the scope exceeds original authorization
- Document everything — PMs need it for insurance claims

### UpTend Dispatch
- Use the in-app communication channel
- For critical issues, call the emergency line
- Update status in real-time
- Flag if additional pros are needed

### Insurance (if applicable)
- Do NOT communicate directly with insurance companies
- Document everything thoroughly — your photos and notes may be used in claims
- Note pre-existing vs. emergency-caused damage
- Keep all receipts and time logs

## De-Escalation
Homeowners in emergencies are stressed. Practice:
- **Listen first**: Let them explain before jumping to solutions
- **Acknowledge**: "I understand this is stressful. That's why I'm here."
- **Inform**: "Here's what I'm going to do right now..."
- **Reassure**: "We'll get this stabilized. Let me focus on stopping the damage first."
- **Never argue**: If they're being difficult, stay professional and document`,
    },
  ]);

  // Government Contract Modules
  await db.insert(certificationModules).values([
    {
      certificationId: govCert.id,
      moduleNumber: 1,
      title: "Prevailing Wage Compliance",
      estimatedMinutes: 15,
      content: `# Prevailing Wage Compliance

## What is Prevailing Wage?

Government contracts often require that workers are paid the "prevailing wage" — the standard wage rate for a particular type of work in a specific geographic area. This is set by the Department of Labor.

## Why It Matters

- It's the law — violations carry heavy penalties
- Underpaying on government jobs can result in debarment (banned from future contracts)
- Both you and UpTend can be held liable

## Key Concepts

### Wage Determination
- Each government contract includes a Wage Determination (WD)
- The WD lists the minimum hourly rate + fringe benefits for each labor classification
- You MUST be paid at least this rate for the hours worked on the project

### Labor Classifications
Common classifications for UpTend service types:
- **Laborer**: General junk removal, moving, clean-out
- **Painter**: Pressure washing, painting
- **Electrician**: Electrical work (must also be licensed)
- **Plumber**: Plumbing work (must also be licensed)
- **HVAC Mechanic**: HVAC services (must also be licensed)
- **Landscaping Laborer**: Landscaping, lawn care

### Fringe Benefits
The prevailing wage includes:
1. **Base hourly rate**: Cash paid to you
2. **Fringe benefit rate**: Can be paid as cash OR through benefits (health, retirement)
3. **Total rate**: Base + Fringe = What you should receive

### Certified Payroll
Government contracts require certified payroll reports:
- Weekly submission of hours worked, classifications, and wages paid
- Must be accurate — falsifying certified payroll is a federal crime
- UpTend handles the payroll reporting, but you must submit accurate time records

## Your Responsibilities
1. **Accurate time tracking**: Log start/stop times for every government job
2. **Correct classification**: Make sure your work matches the labor classification
3. **No volunteering**: Every hour on-site must be logged and paid
4. **Breaks**: Follow the required break schedule
5. **Report issues**: If you think you're being underpaid, contact UpTend compliance`,
    },
    {
      certificationId: govCert.id,
      moduleNumber: 2,
      title: "Davis-Bacon Act Basics",
      estimatedMinutes: 15,
      content: `# Davis-Bacon Act Basics

## What is the Davis-Bacon Act?

The Davis-Bacon Act (1931) requires that workers on federally funded construction projects be paid the local prevailing wage. It applies to contracts over $2,000 for construction, alteration, or repair of public buildings/works.

## Does It Apply to UpTend Work?

**Yes, when:**
- The job is for a federal, state, or local government entity
- The project involves construction, renovation, or maintenance of public property
- The contract value exceeds $2,000 (including subcontracts)
- Federal funding is involved in any part of the project

**No, when:**
- Private residential work
- Private commercial work without government funding
- Supply-only contracts (no labor)

## Key Requirements

### For You (The Worker)
1. **You must be paid weekly** — no bi-weekly or monthly pay on Davis-Bacon jobs
2. **Overtime**: 1.5x rate for hours over 40/week on the project
3. **Classification accuracy**: If you do multiple types of work, the highest-paying classification applies when tasks are mixed
4. **Apprentice exception**: Lower rates only if enrolled in a registered apprenticeship program

### Posting Requirements
- Wage determinations must be posted at the job site
- You should be able to see what rate applies to your classification
- If they're not posted, ask — it's required by law

### Record Keeping
Keep your own records:
- Hours worked each day on government projects
- Labor classification for each task
- Pay received (check stubs or direct deposit records)
- Any deductions taken

## Common Violations
1. **Misclassification**: Calling a skilled tradesperson a "laborer" to pay less
2. **Unpaid overtime**: Not paying 1.5x for over 40 hours
3. **Kickbacks**: Requiring workers to return part of their wages
4. **Off-the-clock work**: Making workers arrive early or stay late unpaid
5. **Incorrect fringe**: Not paying the full fringe benefit rate

## Whistleblower Protection
If you see violations:
- You are protected from retaliation under federal law
- Report to UpTend compliance first
- You can also report to the Department of Labor Wage and Hour Division
- Keep copies of all your records`,
    },
    {
      certificationId: govCert.id,
      moduleNumber: 3,
      title: "Government Documentation Requirements",
      estimatedMinutes: 15,
      content: `# Government Documentation Requirements

## A Higher Standard

Government contracts require more thorough documentation than private sector work. Every action, every expense, every hour must be documented and verifiable.

## Required Documentation

### Pre-Job
- [ ] Signed contract/work order with scope and specifications
- [ ] Wage determination for your labor classification
- [ ] Safety plan (for jobs > 1 day)
- [ ] Insurance certificates (UpTend provides)
- [ ] Background check clearance confirmation
- [ ] Required licenses and certifications

### During Job
- [ ] Daily time logs (start, breaks, stop — to the minute)
- [ ] Daily progress photos (time-stamped)
- [ ] Material/parts receipts (itemized)
- [ ] Any change orders (scope changes) — approved IN WRITING before proceeding
- [ ] Safety incident reports (if any, even minor)
- [ ] Weather delay documentation (if applicable)

### Post-Job
- [ ] Completion certificate/report
- [ ] Before/after photos (full set)
- [ ] Final time summary
- [ ] Material cost summary with receipts
- [ ] Quality inspection sign-off
- [ ] Warranty documentation for installed parts

## Change Orders

Change orders on government jobs are different:
1. **Stop work** on the changed scope item
2. **Document** the issue or change in writing with photos
3. **Submit** through UpTend to the contracting officer
4. **Wait** for written authorization — verbal approval is NOT sufficient
5. **Track** additional time and materials separately
6. **Never exceed the contract amount without written modification**

## Record Retention
- Keep all records for a minimum of **3 years** after project completion
- Government auditors can request records at any time during this period
- UpTend stores digital records, but keep your own copies
- Include: work logs, invoices, receipts, photos, communications, certifications

## Audit Readiness
Government contracts may be audited. Be prepared for:
- Time verification (did your hours match the payroll?)
- Cost verification (do receipts match invoiced amounts?)
- Scope verification (did the work match the contract?)
- Quality verification (does the completed work meet specifications?)
- Compliance verification (were all regulations followed?)

## Tips for Success
- Over-document rather than under-document
- When in doubt, put it in writing
- Save all communications (emails, texts, app messages)
- Never backdate or alter records
- Ask questions before you start — not after there's a problem`,
    },
    {
      certificationId: govCert.id,
      moduleNumber: 4,
      title: "Security Clearance Protocols",
      estimatedMinutes: 15,
      content: `# Security Clearance Protocols

## Working in Government Facilities

Some government jobs require you to work in or near sensitive facilities. Understanding security protocols is mandatory.

## Levels of Access

### Public Areas
- Government buildings open to the public (post offices, DMV, parks)
- No special clearance needed beyond UpTend's standard background check
- Still subject to building security (bag checks, metal detectors)

### Controlled Access Areas
- Government offices not open to the public
- Requires a visitor badge and escort
- Background check must be completed and cleared
- Must be on an approved vendor list

### Restricted Areas
- Military installations, federal courthouses, law enforcement facilities
- Requires security clearance (UpTend facilitates the process)
- Extended background investigation
- May include fingerprinting and drug testing

## Background Check Requirements

### UpTend Standard (All Pros)
- Criminal history check (7-year lookback)
- Sex offender registry check
- Identity verification
- Right-to-work verification

### Government Enhanced (Government Cert)
- All standard checks PLUS:
- Federal criminal database check
- Credit history review
- Employment history verification (5 years)
- Reference checks
- Drug screening (may be required per contract)

### Additional (Facility-Specific)
Some facilities may require:
- Fingerprint-based FBI background check
- Military installation access authorization (DBIDS)
- TSA PreCheck for airport-related work
- Specific agency background investigations

## On-Site Security Rules

### Do's
- ✅ Always wear your visitor badge visibly
- ✅ Follow your escort's instructions exactly
- ✅ Keep your phone in your pocket (some facilities prohibit photos)
- ✅ Only access areas specified in your work order
- ✅ Report anything suspicious through proper channels
- ✅ Sign in and out at security checkpoints

### Don'ts
- ❌ Never photograph classified or restricted areas
- ❌ Don't discuss facility security measures with anyone
- ❌ Don't bring prohibited items (varies by facility — check before you go)
- ❌ Don't leave tools or equipment unattended
- ❌ Don't prop open secure doors
- ❌ Don't allow tailgating (others following you through a secure door)

## If Something Goes Wrong
- Lost your badge? Report immediately to security and your escort
- Accidentally entered a restricted area? Stop, don't touch anything, report
- Confronted by security? Comply immediately, stay calm, contact UpTend after`,
    },
    {
      certificationId: govCert.id,
      moduleNumber: 5,
      title: "OSHA Standards",
      estimatedMinutes: 15,
      content: `# OSHA Standards for Service Professionals

## What is OSHA?

The Occupational Safety and Health Administration (OSHA) sets and enforces workplace safety standards. Government contracts have strict OSHA compliance requirements.

## Your OSHA Rights
1. **Safe workplace**: You have the right to work in conditions free of known dangers
2. **Training**: You must receive training on workplace hazards
3. **Information**: You can request inspection results and injury/illness records
4. **Complaints**: You can file a confidential complaint with OSHA
5. **No retaliation**: You're protected from punishment for exercising safety rights

## Common OSHA Standards for Service Pros

### Fall Protection (29 CFR 1926.501)
- Required for work at heights of **6 feet or more** (construction) or **4 feet** (general industry)
- Use guardrails, safety nets, or personal fall arrest systems
- Ladder safety: 3-point contact, proper angle (4:1 ratio), secured at top
- Never stand on the top two rungs of a ladder
- Roof work requires fall protection planning before you go up

### Hazard Communication (29 CFR 1910.1200)
- Know the chemicals you work with (cleaning agents, solvents, adhesives)
- Read Safety Data Sheets (SDS) before using any chemical product
- Wear appropriate PPE for each chemical
- Never mix chemicals unless you know it's safe
- Store chemicals properly — no leaking containers in your vehicle

### Electrical Safety (29 CFR 1910 Subpart S)
- De-energize equipment before working on it when possible
- Use lockout/tagout procedures for energy isolation
- Never work on live circuits unless trained and authorized
- Use GFCI protection for all power tools in wet conditions
- Inspect power cords before each use — replace damaged cords

### PPE (29 CFR 1910 Subpart I)
- Eye protection: Safety glasses or goggles when there's a flying debris risk
- Hand protection: Gloves appropriate to the hazard
- Foot protection: Steel-toe boots for heavy lifting, non-slip for wet conditions
- Head protection: Hard hat when overhead hazards exist
- Respiratory: N95 or better when dust, mold, or chemicals are present

### Housekeeping
- Keep work areas clean and organized
- Clean up spills immediately
- Properly dispose of waste materials
- Keep walkways and exits clear
- Secure tools and materials when not in use

## Reporting Injuries
OSHA requires reporting:
- **Fatalities**: Within 8 hours
- **Hospitalizations, amputations, eye loss**: Within 24 hours
- All injuries should be documented, even minor ones

## Government Job Specifics
- Government sites may have their own safety officer — introduce yourself
- Follow site-specific safety plans (they override your general practices when stricter)
- Attend any required safety briefings before starting work
- Hard hats and high-vis vests are mandatory on most government construction sites
- Maintain your own safety training records — government auditors may ask for them

## Consequences of Non-Compliance
- OSHA fines range from $15,625 per violation to $156,259 for willful violations
- Government contract termination
- UpTend certification revocation
- Personal liability for injuries caused by safety violations`,
    },
  ]);

  // ===== QUIZ QUESTIONS =====

  // PM Questions (8 questions)
  await db.insert(certificationQuestions).values([
    {
      certificationId: pmCert.id,
      moduleNumber: 1,
      question: "When a tenant asks you to perform work outside the original scope, what should you do?",
      optionA: "Complete the extra work to provide good customer service",
      optionB: "Redirect the tenant to contact their property management company",
      optionC: "Call the property owner directly for approval",
      optionD: "Add it to your invoice as a line item",
      correctOption: "b",
      explanation: "All scope changes and additional work requests must go through the PM company. Never go directly to the property owner or perform unauthorized work.",
    },
    {
      certificationId: pmCert.id,
      moduleNumber: 1,
      question: "What is the expected response time for urgent PM requests during business hours?",
      optionA: "Within 1 hour",
      optionB: "Within 15 minutes",
      optionC: "Same business day",
      optionD: "Within 30 minutes",
      correctOption: "b",
      explanation: "Urgent requests from property management companies require a response within 15 minutes during business hours. Late responses erode trust faster than anything else.",
    },
    {
      certificationId: pmCert.id,
      moduleNumber: 2,
      question: "What does NTE stand for in property management work orders?",
      optionA: "Non-Transferable Estimate",
      optionB: "Net Total Expense",
      optionC: "Not-to-Exceed",
      optionD: "New Tenant Evaluation",
      correctOption: "c",
      explanation: "NTE means Not-to-Exceed — it's the maximum budget for the job. You must get written approval before spending over this amount.",
    },
    {
      certificationId: pmCert.id,
      moduleNumber: 2,
      question: "You're working a job and realize the cost will exceed the NTE. What do you do?",
      optionA: "Finish the job and explain later",
      optionB: "Stop, document, submit a scope change request, and wait for written approval",
      optionC: "Call the tenant and ask them to pay the difference",
      optionD: "Reduce the quality of work to stay within budget",
      correctOption: "b",
      explanation: "You must stop, document the need for additional work, submit a scope change request, and wait for written approval before exceeding the NTE.",
    },
    {
      certificationId: pmCert.id,
      moduleNumber: 3,
      question: "A tenant invites you to stay for coffee after finishing a job. What's the appropriate response?",
      optionA: "Accept — it's good customer relationship building",
      optionB: "Politely decline and maintain professional distance",
      optionC: "Accept only if the job took more than 4 hours",
      optionD: "Accept but don't bill for the time",
      correctOption: "b",
      explanation: "Company policy requires maintaining professional boundaries. Politely decline food, drinks, and tips from tenants.",
    },
    {
      certificationId: pmCert.id,
      moduleNumber: 4,
      question: "When leaving a vacant property after completing work, what temperature should the HVAC be set to?",
      optionA: "Turn it off to save energy",
      optionB: "68°F",
      optionC: "72°F (unless specified otherwise)",
      optionD: "Leave it wherever it was",
      correctOption: "c",
      explanation: "The default HVAC setting for vacant properties is 72°F unless the work order specifies otherwise. This prevents pipe freezing and mold growth.",
    },
    {
      certificationId: pmCert.id,
      moduleNumber: 4,
      question: "Someone at the property claims to be the homeowner and asks you to let them in. What should you do?",
      optionA: "Let them in if they show ID",
      optionB: "Let them in — they probably live there",
      optionC: "Verify their identity through the property management company",
      optionD: "Give them the lockbox code so they can enter themselves",
      correctOption: "c",
      explanation: "Never let unauthorized people into a property. Always verify identity through the PM company, regardless of what someone claims.",
    },
    {
      certificationId: pmCert.id,
      moduleNumber: 1,
      question: "What should be included in every property management job documentation?",
      optionA: "Just the final completion photos",
      optionB: "Pre-job photos, progress photos, post-job photos, and time-stamped notes",
      optionC: "A written summary email to the property owner",
      optionD: "Only photos of areas where you found problems",
      correctOption: "b",
      explanation: "Every PM job requires pre-job, during-job, and post-job photos with time stamps, plus notes on any unexpected findings.",
    },
  ]);

  // HOA Questions (8 questions)
  await db.insert(certificationQuestions).values([
    {
      certificationId: hoaCert.id,
      moduleNumber: 1,
      question: "Who is your primary point of contact for HOA work?",
      optionA: "The HOA Board President",
      optionB: "Individual homeowners",
      optionC: "The Community Manager at the HOA Management Company",
      optionD: "The on-site maintenance person",
      correctOption: "c",
      explanation: "Your direct client is the HOA Management Company, and the Community Manager is your primary point of contact.",
    },
    {
      certificationId: hoaCert.id,
      moduleNumber: 1,
      question: "What makes HOA work different from regular residential jobs?",
      optionA: "Higher visibility, stricter standards, more documentation, and often recurring contracts",
      optionB: "It pays more per hour",
      optionC: "You only work indoors",
      optionD: "You report directly to homeowners",
      correctOption: "a",
      explanation: "HOA work is more visible (residents are watching), requires stricter aesthetic standards, more thorough documentation, and is often part of ongoing contracts.",
    },
    {
      certificationId: hoaCert.id,
      moduleNumber: 2,
      question: "You notice a trip hazard (raised sidewalk section) while working on an HOA property. What do you do?",
      optionA: "Ignore it — it's not part of your job",
      optionB: "Fix it yourself and add it to the invoice",
      optionC: "Flag it immediately in your report as a safety concern and notify the management company",
      optionD: "Tell a nearby resident to be careful",
      correctOption: "c",
      explanation: "Safety hazards like trip hazards must be flagged immediately and reported to the management company. They are liability issues.",
    },
    {
      certificationId: hoaCert.id,
      moduleNumber: 3,
      question: "When documenting HOA violations, what should you NEVER do?",
      optionA: "Take multiple angles of the violation",
      optionB: "Include the property address in the photo",
      optionC: "Add personal opinions to the report",
      optionD: "Note if it's a repeat violation",
      correctOption: "c",
      explanation: "Violation reports must be objective and factual. Personal opinions can compromise the report's validity, especially in legal proceedings.",
    },
    {
      certificationId: hoaCert.id,
      moduleNumber: 3,
      question: "A homeowner approaches you during a violation inspection and asks what violations you've found on their neighbor's property. You should:",
      optionA: "Share the information since they're both community members",
      optionB: "Refuse to discuss any violations and direct them to the management company",
      optionC: "Show them the photos you've taken",
      optionD: "Give them a general summary without specifics",
      correctOption: "b",
      explanation: "Violation data is confidential and should only be shared with the management company. Never discuss violations with residents.",
    },
    {
      certificationId: hoaCert.id,
      moduleNumber: 4,
      question: "A resident asks you to do some personal work at their home while you're on-site for HOA work. What's the best response?",
      optionA: "Do it — more revenue for you",
      optionB: "Refer them to book through UpTend for personal service",
      optionC: "Do it after hours",
      optionD: "Give them your personal phone number",
      correctOption: "b",
      explanation: "Direct them to book through UpTend. This keeps everything documented and professional while maintaining your HOA work boundaries.",
    },
    {
      certificationId: hoaCert.id,
      moduleNumber: 2,
      question: "After completing common area maintenance, what should your report include?",
      optionA: "Just a text saying 'work complete'",
      optionB: "Before/after photos, condition rating, any new issues discovered, and recommended follow-up",
      optionC: "Only photos of areas that needed attention",
      optionD: "A verbal summary to the nearest resident",
      correctOption: "b",
      explanation: "Reports should include before/after photos, condition ratings, any new issues discovered, and estimated time/cost for recommended follow-up work.",
    },
    {
      certificationId: hoaCert.id,
      moduleNumber: 4,
      question: "You're invited to present at an HOA board meeting. What should you NOT do?",
      optionA: "Bring before/after photos",
      optionB: "Dress professionally",
      optionC: "Take criticism personally and argue with board members",
      optionD: "Follow up with a written summary",
      correctOption: "c",
      explanation: "Board meetings can involve tough questions and budget scrutiny. Stay professional, don't take criticism personally, and focus on facts.",
    },
  ]);

  // AI Home Scan Questions (7 questions)
  await db.insert(certificationQuestions).values([
    {
      certificationId: aiCert.id,
      moduleNumber: 1,
      question: "What is the correct inspection order for an AI Home Scan?",
      optionA: "Interior → Systems → Exterior",
      optionB: "Systems → Exterior → Interior",
      optionC: "Exterior → Interior → Systems",
      optionD: "Whatever order feels right",
      correctOption: "c",
      explanation: "The standard assessment flow is Exterior → Interior → Systems. This ensures a systematic approach and prevents missed areas.",
    },
    {
      certificationId: aiCert.id,
      moduleNumber: 1,
      question: "A condition rated '2' on the 1-5 scale means:",
      optionA: "Excellent — no action needed",
      optionB: "Poor — repair needed within 3 months",
      optionC: "Fair — maintenance needed within 6 months",
      optionD: "Critical — immediate attention required",
      correctOption: "b",
      explanation: "A rating of 2 means 'Poor — repair needed within 3 months.' Rating 1 is Critical (immediate), 3 is Fair (6 months), 4 is Good (12 months), 5 is Excellent.",
    },
    {
      certificationId: aiCert.id,
      moduleNumber: 2,
      question: "What is the minimum number of photos required for a complete AI Home Scan?",
      optionA: "10-15 photos",
      optionB: "20-25 photos",
      optionC: "35-50 photos",
      optionD: "100+ photos",
      correctOption: "c",
      explanation: "A complete AI Home Scan requires a minimum of 35-50 photos: at least 15 exterior, 15 interior, plus additional issue documentation photos.",
    },
    {
      certificationId: aiCert.id,
      moduleNumber: 2,
      question: "When photographing a foundation crack, what must you include for scale?",
      optionA: "Your thumb for comparison",
      optionB: "A reference object like a coin, hand, or ruler",
      optionC: "Nothing — the AI can determine size from the photo",
      optionD: "A tape measure extended to 6 feet",
      correctOption: "b",
      explanation: "Always include a reference object (coin, hand, or ruler) in close-up photos of damage to provide scale for accurate assessment.",
    },
    {
      certificationId: aiCert.id,
      moduleNumber: 3,
      question: "What quality score must you maintain to remain eligible for premium AI Home Scan assignments?",
      optionA: "3.0+",
      optionB: "3.5+",
      optionC: "4.0+",
      optionD: "4.5+",
      correctOption: "d",
      explanation: "A quality score of 4.5+ is required to remain eligible for premium AI Home Scan assignments.",
    },
    {
      certificationId: aiCert.id,
      moduleNumber: 3,
      question: "When should you submit your AI Home Scan assessment after the site visit?",
      optionA: "Within 1 hour",
      optionB: "Within 24 hours",
      optionC: "Within 48 hours",
      optionD: "Within 1 week",
      correctOption: "b",
      explanation: "Assessments must be submitted within 24 hours of the site visit. Timeliness is one of the quality metrics your assessments are rated on.",
    },
    {
      certificationId: aiCert.id,
      moduleNumber: 1,
      question: "During a home scan, you notice water stains on a first-floor ceiling. What should you prioritize investigating?",
      optionA: "The paint color to match for a touch-up",
      optionB: "Upstairs plumbing and the roof above for potential leak sources",
      optionC: "Whether the homeowner has renters insurance",
      optionD: "The age of the drywall",
      correctOption: "b",
      explanation: "Ceiling stains on lower floors typically indicate roof or plumbing issues above. Investigate upstairs plumbing and roof condition to identify the source.",
    },
  ]);

  // Parts & Materials Questions (6 questions)
  await db.insert(certificationQuestions).values([
    {
      certificationId: partsCert.id,
      moduleNumber: 1,
      question: "What is the correct order for sourcing parts?",
      optionA: "Cheapest option → Brand name → Customer preference",
      optionB: "Customer-provided → OEM parts → Authorized distributors → Compatible alternatives",
      optionC: "Amazon → Home Depot → Specialty suppliers",
      optionD: "Whatever you have in your truck → Local store → Online",
      correctOption: "b",
      explanation: "Always check if the customer has the part first, then OEM parts, then authorized distributors, and finally compatible alternatives (with approval).",
    },
    {
      certificationId: partsCert.id,
      moduleNumber: 1,
      question: "What is the maximum parts markup allowed per UpTend guidelines?",
      optionA: "25%",
      optionB: "20%",
      optionC: "15%",
      optionD: "No markup allowed",
      correctOption: "c",
      explanation: "UpTend guidelines allow a maximum 15% markup on parts. This must be disclosed and approved before purchase.",
    },
    {
      certificationId: partsCert.id,
      moduleNumber: 2,
      question: "A credit card statement showing a purchase amount is sufficient for reimbursement. True or false?",
      optionA: "True — it shows the amount paid",
      optionB: "False — an itemized receipt from the store is required",
      optionC: "True — as long as the date matches",
      optionD: "True — if combined with a photo of the part",
      correctOption: "b",
      explanation: "Credit card statements are NOT sufficient. You need an itemized receipt showing store name, date, individual items, prices, and total.",
    },
    {
      certificationId: partsCert.id,
      moduleNumber: 2,
      question: "When should unused parts be returned?",
      optionA: "Keep them for future jobs",
      optionB: "Within 48 hours of job completion",
      optionC: "Within 30 days",
      optionD: "Only if the customer asks",
      correctOption: "b",
      explanation: "Unused parts purchased for a specific job must be returned within 48 hours of job completion, with the return receipt uploaded.",
    },
    {
      certificationId: partsCert.id,
      moduleNumber: 3,
      question: "After installing a new faucet, what is the standard workmanship warranty period?",
      optionA: "7 days",
      optionB: "14 days",
      optionC: "30 days",
      optionD: "90 days",
      correctOption: "c",
      explanation: "UpTend's standard workmanship warranty is 30 days. If called back for an installation issue within that period, you must fix it at no additional charge.",
    },
    {
      certificationId: partsCert.id,
      moduleNumber: 3,
      question: "You installed a part and get a callback 2 weeks later. The part isn't working. What's your first step?",
      optionA: "Tell the customer to contact the manufacturer",
      optionB: "Ignore it — it's been too long",
      optionC: "Respond within 24 hours and diagnose whether it's a defect or installation issue",
      optionD: "Charge for a new service call",
      correctOption: "c",
      explanation: "Respond within 24 hours. Diagnose whether it's a part defect (process warranty claim) or installation issue (fix at no charge under your 30-day warranty).",
    },
  ]);

  // Emergency Response Questions (7 questions)
  await db.insert(certificationQuestions).values([
    {
      certificationId: emergCert.id,
      moduleNumber: 1,
      question: "How quickly must you accept or decline an emergency dispatch?",
      optionA: "Within 30 minutes",
      optionB: "Within 15 minutes",
      optionC: "Within 5 minutes",
      optionD: "Within 1 hour",
      correctOption: "c",
      explanation: "Emergency dispatches must be accepted or declined within 5 minutes. If you accept, you must also confirm your ETA.",
    },
    {
      certificationId: emergCert.id,
      moduleNumber: 1,
      question: "What happens if you accept an emergency dispatch and then no-show?",
      optionA: "Nothing — emergencies are unpredictable",
      optionB: "A warning on your first offense",
      optionC: "Your Emergency Response certification may be suspended",
      optionD: "A small fine",
      correctOption: "c",
      explanation: "False accepts (accepting then no-showing) on emergency dispatches result in certification suspension. This is critical — someone is depending on you.",
    },
    {
      certificationId: emergCert.id,
      moduleNumber: 2,
      question: "You arrive at a property and smell natural gas. What do you do?",
      optionA: "Open windows to ventilate, then proceed with the job",
      optionB: "Leave immediately, move away from the property, and call 911",
      optionC: "Turn off the HVAC system and continue working",
      optionD: "Call the property manager for instructions",
      correctOption: "b",
      explanation: "Gas smell is a RED FLAG — do not enter, leave immediately if inside, move away from the property, and call 911. Never attempt to fix a gas leak yourself.",
    },
    {
      certificationId: emergCert.id,
      moduleNumber: 2,
      question: "You have the right to refuse unsafe work. Will UpTend penalize you for refusing?",
      optionA: "Yes — you should complete every job you accept",
      optionB: "No — UpTend backs your safety decisions with no penalties",
      optionC: "Only if you refuse more than twice per month",
      optionD: "Yes — but the penalty is reduced",
      correctOption: "b",
      explanation: "You have the absolute right to refuse unsafe work. UpTend backs your safety decisions with no penalties for refusing unsafe work.",
    },
    {
      certificationId: emergCert.id,
      moduleNumber: 3,
      question: "What should your initial report include when you arrive at an emergency?",
      optionA: "Just a text saying 'I'm here'",
      optionB: "A detailed cost estimate",
      optionC: "Address, initial assessment, whether it's active/contained/stable, and your planned action",
      optionD: "A selfie to prove you arrived",
      correctOption: "c",
      explanation: "Your arrival report should include: address, initial assessment, status (active/contained/stable), and what action you're taking.",
    },
    {
      certificationId: emergCert.id,
      moduleNumber: 3,
      question: "A homeowner during an emergency is upset and yelling. The best approach is:",
      optionA: "Yell back to establish authority",
      optionB: "Listen, acknowledge their stress, inform them of your plan, and reassure them",
      optionC: "Ignore them and focus on the work",
      optionD: "Leave and tell dispatch you can't work with difficult customers",
      correctOption: "b",
      explanation: "De-escalation protocol: Listen first, acknowledge ('I understand this is stressful'), inform ('Here's what I'm going to do'), and reassure ('We'll get this stabilized').",
    },
    {
      certificationId: emergCert.id,
      moduleNumber: 1,
      question: "Your primary goal during emergency mitigation is to:",
      optionA: "Perform a complete, permanent repair",
      optionB: "Stop further damage and stabilize the situation",
      optionC: "Generate the highest possible invoice",
      optionD: "Document everything and leave",
      correctOption: "b",
      explanation: "Emergency mitigation means 'stopping the bleeding' — prevent further damage and stabilize. Full repairs come later.",
    },
  ]);

  // Government Contract Questions (10 questions)
  await db.insert(certificationQuestions).values([
    {
      certificationId: govCert.id,
      moduleNumber: 1,
      question: "What is a 'prevailing wage'?",
      optionA: "The average wage in your company",
      optionB: "The standard wage rate for a type of work in a specific geographic area, set by the Department of Labor",
      optionC: "The minimum wage set by federal law",
      optionD: "Whatever the contractor decides to pay",
      correctOption: "b",
      explanation: "Prevailing wage is the standard wage rate for a particular type of work in a specific geographic area, determined by the Department of Labor.",
    },
    {
      certificationId: govCert.id,
      moduleNumber: 1,
      question: "The total prevailing wage rate includes:",
      optionA: "Just the base hourly rate",
      optionB: "Base hourly rate plus fringe benefit rate",
      optionC: "Base hourly rate plus overtime",
      optionD: "Whatever's on your invoice",
      correctOption: "b",
      explanation: "The total prevailing wage = Base hourly rate + Fringe benefit rate. The fringe can be paid as cash or through actual benefits.",
    },
    {
      certificationId: govCert.id,
      moduleNumber: 2,
      question: "The Davis-Bacon Act applies to federally funded construction projects over what amount?",
      optionA: "$1,000",
      optionB: "$2,000",
      optionC: "$5,000",
      optionD: "$10,000",
      correctOption: "b",
      explanation: "The Davis-Bacon Act applies to contracts over $2,000 for construction, alteration, or repair of public buildings and works.",
    },
    {
      certificationId: govCert.id,
      moduleNumber: 2,
      question: "On a Davis-Bacon project, how often must you be paid?",
      optionA: "Monthly",
      optionB: "Bi-weekly",
      optionC: "Weekly",
      optionD: "Upon project completion",
      correctOption: "c",
      explanation: "Workers on Davis-Bacon projects must be paid weekly. No bi-weekly or monthly payment schedules are allowed.",
    },
    {
      certificationId: govCert.id,
      moduleNumber: 3,
      question: "You discover a scope change on a government job. Verbal approval from the project manager is sufficient to proceed. True or false?",
      optionA: "True — verbal approval is binding",
      optionB: "False — you need written authorization before proceeding",
      optionC: "True — as long as you document the conversation",
      optionD: "True — for changes under $500",
      correctOption: "b",
      explanation: "On government jobs, verbal approval is NOT sufficient for scope changes. You must receive written authorization before proceeding.",
    },
    {
      certificationId: govCert.id,
      moduleNumber: 3,
      question: "How long must you retain records from a government contract?",
      optionA: "1 year",
      optionB: "2 years",
      optionC: "3 years after project completion",
      optionD: "5 years",
      correctOption: "c",
      explanation: "All records from government contracts must be retained for a minimum of 3 years after project completion. Auditors can request them anytime during this period.",
    },
    {
      certificationId: govCert.id,
      moduleNumber: 4,
      question: "You're working in a controlled-access government building and lose your visitor badge. What do you do?",
      optionA: "Continue working and report it at the end of the day",
      optionB: "Report it immediately to security and your escort",
      optionC: "Ask a colleague to lend you theirs",
      optionD: "Leave the building and come back tomorrow",
      correctOption: "b",
      explanation: "A lost badge must be reported immediately to security and your escort. This is a security issue that requires immediate attention.",
    },
    {
      certificationId: govCert.id,
      moduleNumber: 4,
      question: "Which of these is PROHIBITED at most government facilities?",
      optionA: "Wearing a visible ID badge",
      optionB: "Following your escort's instructions",
      optionC: "Photographing restricted areas",
      optionD: "Signing in at security checkpoints",
      correctOption: "c",
      explanation: "Photographing classified or restricted areas is strictly prohibited. Some facilities may prohibit all photography.",
    },
    {
      certificationId: govCert.id,
      moduleNumber: 5,
      question: "At what height does OSHA require fall protection for construction work?",
      optionA: "4 feet",
      optionB: "6 feet",
      optionC: "8 feet",
      optionD: "10 feet",
      correctOption: "b",
      explanation: "OSHA requires fall protection at 6 feet or more for construction work, and 4 feet for general industry.",
    },
    {
      certificationId: govCert.id,
      moduleNumber: 5,
      question: "What is the maximum OSHA fine for a willful safety violation?",
      optionA: "$15,625",
      optionB: "$50,000",
      optionC: "$100,000",
      optionD: "$156,259",
      correctOption: "d",
      explanation: "OSHA fines for willful violations can reach $156,259 per violation. Standard violations can be up to $15,625.",
    },
  ]);

  console.log("[Academy] Certification programs seeded successfully!");
}
