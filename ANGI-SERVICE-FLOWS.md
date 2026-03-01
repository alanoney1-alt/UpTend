# Angi Service Request Flows — Complete Question Mapping
*Researched February 28, 2026 via angi.com booking flows*

## Overview: Common Flow Structure

Every Angi service request follows this pattern:
1. **ZIP Code** → Location of project
2. **1-4 Service-Specific Questions** → Narrows down exact job type
3. **Timeline** → When work is needed
4. **Free Text Description** → "Tell us about your project" (optional, 2000 char max)
5. **Project Address** → Street, City, ZIP
6. **Contact Info** → First Name, Last Name, Phone/Email

Every question also has a **"Tell us in your own words..."** free-text button for custom input.

---

## 1. Junk Removal
**Task ID: 40375**

### Questions (in order)
1. **What do you have that needs to be removed?** (radio, single select)
   - General & bulky junk (incl. furniture & appliances)
   - Yard & lawn waste
   - Construction materials or scrap metal
   - Garbage pickup (incl. waste management)
   - Hazardous materials
   - Other

2. **When do you need this work done?** (radio, single select)
   - Within 2 weeks
   - More than 2 weeks
   - Not sure - still planning/budgeting

3. **Please tell us a little about your project.** (free text, optional, 2000 chars)

### Data Collected
- ZIP code / location
- Type of junk/waste
- Timeline urgency
- Free-text project description
- Full address
- Contact name, phone, email

### George Conversation Flow
> "What kind of stuff do you need removed? Is it mostly furniture and household items, yard waste, construction debris, or something else?"
> "How soon do you need this done — within the next couple weeks, or is this more of a planning stage?"
> "Anything else I should know about the job? Like how much stuff, what floor it's on, or any access issues?"

---

## 2. Pressure Washing
**Task ID: 40008**

### Questions (in order)
1. **Why do you need power/pressure washing?** (radio, single select)
   - Remove mold or moss
   - Prepare for painting
   - Remove surface stains
   - Other

2. **What area(s) do you need power/pressure washed?** (checkbox, multi-select)
   - Building exterior
   - Driveway/walkway/sidewalk
   - Patio/deck
   - Other

3. **What kind of location is this?** (radio, single select)
   - Home
   - Business

4. **When do you need this work done?** (radio, single select)
   - Within 2 weeks
   - More than 2 weeks
   - Not sure - still planning/budgeting

5. **Please tell us a little about your project.** (free text, optional, 2000 chars)

### Data Collected
- ZIP code / location
- Reason for washing
- Specific areas to wash (multiple)
- Property type (residential/commercial)
- Timeline urgency
- Free-text description
- Full address
- Contact info

### George Conversation Flow
> "What's the main reason you need pressure washing? Is there mold or moss buildup, stains, or are you prepping for painting?"
> "Which areas need washing? The house exterior, driveway, patio/deck, or something else? Could be more than one."
> "Is this for your home or a business property?"
> "How soon do you need it done?"

---

## 3. Gutter Cleaning
**Task ID: 40072**

### Questions (in order)
1. **Why do you need your gutters cleaned?** (checkbox, multi-select)
   - Water isn't draining
   - Water overflows
   - Gutters are clogged
   - Regular maintenance
   - Other

2. **How tall is your house/building?** (radio, single select)
   - Two or more stories
   - One story

3. **When do you need this work done?** (radio, single select)
   - Urgent (1-2 days)
   - Within 2 weeks
   - More than 2 weeks
   - Not sure - still planning/budgeting

4. **Please tell us a little about your project.** (free text, optional, 2000 chars)

### Data Collected
- ZIP code / location
- Reason for cleaning (can be multiple)
- Building height (stories)
- Timeline urgency (includes urgent option)
- Free-text description
- Full address
- Contact info

### George Conversation Flow
> "What's going on with your gutters? Are they clogged, overflowing, not draining properly, or is this just regular maintenance?"
> "How many stories is your house? One story or two-plus?"
> "Is this urgent — like water damage happening now — or can it wait a couple weeks?"

---

## 4. Moving / Moving Labor
**Category ID: 12050**

### Questions (in order)
1. **What kind of moving service do you need?** (radio, single select)
   - Move within the same state
   - Move to a different state
   - Organize or re-arrange my home (Preparing to move)

2. **What do you need help with?** (radio, single select)
   - Full-service moving
   - Just packing or loading
   - Renting a truck or container (no labor)
   - Moving special items (e.g., piano, safe)
   - Shipping a vehicle

3. **How big is your home?** (radio, single select)
   - 1 bedroom
   - 2–3 bedrooms
   - 4+ bedrooms
   - Only moving a few items

4. **When will you need help?** (calendar date picker — specific date selection)

5. **What ZIP code are you moving to?** (text input)

6. **Please tell us a little about your project.** (free text, optional, 2000 chars)

### Data Collected
- Origin ZIP code
- Move type (local/interstate/reorganize)
- Service level (full-service/loading only/truck/special items/vehicle)
- Home size (bedrooms)
- Specific move date
- Destination ZIP code
- Free-text description
- Full address
- Contact info

### George Conversation Flow
> "Are you moving within the same state, to a different state, or do you just need help rearranging things at home?"
> "Do you need full-service movers, or just help with loading/packing? Or maybe you're moving something special like a piano or safe?"
> "How big is your place — how many bedrooms are we talking?"
> "When's the move date?"
> "Where are you moving to?"

---

## 5. Handyman
**Task ID: 39794**

### Questions (in order)
1. **What do you need help with?** (checkbox, multi-select)
   - Hanging, mounting, or furniture assembly
   - Carpentry
   - Doors, hinges, or locks
   - Small electrical repairs or replacements
   - Small plumbing repairs or replacements
   - Yard work or gutters
   - Painting, siding, or drywall repairs
   - Appliance installation, replacement, or repair
   - A/C unit
   - Other

2. **When do you need this work done?** (radio, single select)
   - Urgent (1-2 days)
   - Within 2 weeks
   - More than 2 weeks
   - Not sure - still planning/budgeting

3. **Please tell us a little about your project.** (free text, optional, 2000 chars)

### Data Collected
- ZIP code / location
- Type(s) of work needed (multiple allowed)
- Timeline urgency
- Free-text description
- Full address
- Contact info

### George Conversation Flow
> "What kind of handyman work do you need? Things like hanging/mounting, carpentry, door repairs, small electrical or plumbing, painting, drywall, appliance install — or something else?"
> "You can have multiple things on the list — what all needs doing?"
> "How urgent is this? Need it in a day or two, within a couple weeks, or still planning?"

---

## 6. Light Demolition
**Task ID: 40207** (Angi categorizes as "Demolition")

### Questions (in order)
1. **What type of demolition do you need?** (radio, single select)
   - Total building demolition (e.g. house, mobile home, etc.)
   - Partial demolition (e.g. one room, flooring only, etc.)
   - Moving/Relocating a structure (e.g. shed, storage, etc.)
   - Junk removal (only removing debris/trash)
   - Swimming pool
   - Other

2. **When do you need this work done?** (radio, single select)
   - Within 2 weeks
   - More than 2 weeks
   - Not sure - still planning/budgeting

3. **Please tell us a little about your project.** (free text, optional, 2000 chars)

### Data Collected
- ZIP code / location
- Type of demolition
- Timeline urgency
- Free-text description
- Full address
- Contact info

### George Conversation Flow
> "What kind of demo work do you need? Are we talking about tearing out a room or section, removing a whole structure, relocating a shed, clearing debris, or something with a pool?"
> "How soon do you need this done?"
> "Can you describe what needs to be demolished and roughly how big the area is?"

---

## 7. Garage Cleanout
*Note: Angi does not have a dedicated "Garage Cleanout" category. This falls under Junk Removal (Task 40375) with "General & bulky junk" selected. The flow is identical to Junk Removal above.*

### Questions (in order)
Same as Junk Removal — customer would select "General & bulky junk" and describe garage cleanout in the free-text field.

### George Conversation Flow
> "For a garage cleanout, let me ask a few questions. Is it mostly general junk and bulky items like furniture, appliances, boxes?"
> "Roughly how full is the garage — quarter full, half, completely packed?"
> "Is there anything hazardous in there like paint, chemicals, or old batteries?"
> "How soon do you need it cleared out?"

---

## 8. Home Cleaning
**Category ID: 10205**

### Questions (in order)
1. **What kind of cleaning do you need?** (radio, single select)
   - General cleaning or housekeeping
   - Deep cleaning or move out cleaning
   - Clean a specific item (like carpets or windows)
   - Junk removal
   - Professional organizing
   - Other

2. **What kind of location is this?** (radio, single select)
   - Residential (house or apartment)
   - Commercial (office, retail, etc.)

3. **When do you need this work done?** (radio, single select)
   - Urgent (1-2 days)
   - Within 2 weeks
   - More than 2 weeks
   - Not sure - still planning or budgeting

4. **Please tell us a little about your project.** (free text, optional, 2000 chars)

### Data Collected
- ZIP code / location
- Type of cleaning
- Location type (residential/commercial)
- Timeline urgency
- Free-text description
- Full address
- Contact info

### George Conversation Flow
> "What kind of cleaning are you looking for? General housekeeping, a deep clean, move-out clean, or something specific like carpets or windows?"
> "Is this for a home or apartment, or a commercial space?"
> "How soon do you need this? Is it urgent, within a couple weeks, or still planning?"
> "How big is the space? How many bedrooms and bathrooms?"

---

## 9. Pool Cleaning
**Category ID: 12070** (Angi groups under "Swimming Pool Services")

### Questions (in order)
1. **How can we help?** (radio, single select)
   - New above-ground pool
   - New in-ground pool
   - Other pool services

2. *(If "New above-ground pool" selected):* **Have you already purchased the pool for this project?** (radio)
   - Yes
   - No

   *(If "Other pool services" selected — this branch covers cleaning/maintenance):*
   - Pool cleaning/maintenance
   - Pool repair
   - Pool renovation/remodel
   - Other

3. **When do you need this work done?** (radio, single select)
   - Within 2 weeks
   - More than 2 weeks
   - Not sure - still planning/budgeting

4. **Please tell us a little about your project.** (free text, optional, 2000 chars)

### Data Collected
- ZIP code / location
- Service type (new pool vs. service/repair/maintenance)
- Sub-service type
- Timeline
- Free-text description
- Full address
- Contact info

### George Conversation Flow
> "What's going on with your pool? Do you need regular cleaning and maintenance, a repair, a renovation, or something else?"
> "Is it an in-ground or above-ground pool?"
> "How soon do you need service — within a couple weeks or still planning?"
> "Anything specific going on — green water, broken pump, surface damage?"

---

## 10. Landscaping
**Category: Landscaping** (nearme/landscaping/)

### Questions (in order)
1. **What type of landscaping do you need?** (radio, single select)
   - New landscaping design and installation
   - Landscape maintenance
   - Lawn care (mowing, fertilizing, etc.)
   - Tree/shrub planting or removal
   - Hardscaping (pavers, retaining walls, etc.)
   - Irrigation/sprinkler system
   - Other

2. **What kind of location is this?** (radio, single select)
   - Home
   - Business

3. **When do you need this work done?** (radio, single select)
   - Within 2 weeks
   - More than 2 weeks
   - Not sure - still planning/budgeting

4. **Please tell us a little about your project.** (free text, optional, 2000 chars)

### Data Collected
- ZIP code / location
- Type of landscaping work
- Property type
- Timeline
- Free-text description
- Full address
- Contact info

### George Conversation Flow
> "What kind of landscaping help do you need? New design and planting, regular maintenance, lawn care, tree work, hardscaping like pavers or walls, or irrigation?"
> "Is this for your home or a business?"
> "How soon do you need this done?"
> "Can you describe the area — front yard, backyard, rough size?"

---

## 11. Carpet Cleaning
**Available via nearme/carpet-cleaning/**

### Questions (in order)
1. **What do you need cleaned?** (checkbox, multi-select)
   - Wall-to-wall carpet
   - Area rugs
   - Upholstery/furniture
   - Other

2. **How many rooms need cleaning?** (radio, single select)
   - 1-2 rooms
   - 3-4 rooms
   - 5+ rooms
   - Whole house

3. **When do you need this work done?** (radio, single select)
   - Urgent (1-2 days)
   - Within 2 weeks
   - More than 2 weeks
   - Not sure - still planning/budgeting

4. **Please tell us a little about your project.** (free text, optional, 2000 chars)

### Data Collected
- ZIP code / location
- What needs cleaning (carpet/rugs/upholstery)
- Number of rooms
- Timeline
- Free-text description (stain types, pet issues, etc.)
- Full address
- Contact info

### George Conversation Flow
> "What do you need cleaned — wall-to-wall carpet, area rugs, upholstery, or a combination?"
> "How many rooms are we talking? Just a couple, or the whole house?"
> "Any specific issues — pet stains, heavy traffic areas, allergies?"
> "How soon do you need it done?"

---

## 12. Home Inspection
**Closest Angi category: Home Inspection services**

### Questions (in order)
1. **What type of inspection do you need?** (radio, single select)
   - Pre-purchase home inspection
   - Pre-sale/listing inspection
   - New construction inspection
   - Radon testing
   - Mold inspection
   - Termite/pest inspection
   - Other

2. **What kind of property is it?** (radio, single select)
   - Single-family home
   - Condo/townhouse
   - Multi-family
   - Commercial

3. **When do you need this work done?** (radio, single select)
   - Urgent (1-2 days)
   - Within 2 weeks
   - More than 2 weeks
   - Not sure - still planning/budgeting

4. **Please tell us a little about your project.** (free text, optional, 2000 chars)

### Data Collected
- ZIP code / location
- Inspection type
- Property type
- Timeline
- Free-text description
- Full address
- Contact info

### George Conversation Flow (adapted for "Home DNA Scan")
> "What brings you in for a home inspection? Are you buying, selling, or just want to understand the health of your home?"
> "What type of property is it — single-family house, condo, townhouse?"
> "How old is the home? Any specific concerns — foundation, roof, plumbing, mold, pests?"
> "How soon do you need this done?"
> "Have you had an inspection before, or is this the first look at the home's condition?"

---

## Key Insights for George's Conversational Approach

### What Angi Does Well (Replicate)
1. **Starts broad, narrows down** — First question always identifies the job type/sub-type
2. **Multi-select where appropriate** — Handyman and gutter cleaning allow multiple selections
3. **Timeline is always asked** — Critical for urgency routing and pricing
4. **Free text is always optional** — But encouraged for better matching
5. **Keeps it short** — Most flows are only 2-4 service-specific questions

### What George Can Do Better (Conversational Advantage)
1. **Ask about property size** — Angi rarely asks this but it's critical for pricing (sq footage, # rooms, lot size)
2. **Ask about access/logistics** — Stairs, gated community, narrow driveway, HOA requirements
3. **Ask about budget expectations** — Angi never asks budget
4. **Photos** — George can request photos of the problem area (Angi doesn't in their main flow)
5. **Previous attempts** — "Have you tried to fix this yourself?" helps gauge complexity
6. **Frequency** — For recurring services (cleaning, pool, lawn), ask if they want one-time or ongoing
7. **Pet/household info** — Relevant for cleaning, pest, and chemical-use services

### Universal Questions George Should Always Ask
1. What service do you need? (maps to Angi's first question)
2. What's the specific issue or goal?
3. Property type and size
4. How urgent is this?
5. Any photos you can share?
6. What's your address/ZIP?
7. Best way to reach you?
8. Budget range? (Angi doesn't ask but George should)
9. One-time or recurring service?
