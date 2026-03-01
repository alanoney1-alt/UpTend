# Pro Recruitment Playbook — Orlando, Florida

> **Purpose:** Comprehensive, actionable guide to finding and recruiting home service professionals in the Orlando metro area.
> **Last Updated:** 2026-02-28

---

## Table of Contents

1. [Craigslist Orlando](#1-craigslist-orlando)
2. [Facebook Marketplace & Groups](#2-facebook-marketplace--groups)
3. [Nextdoor](#3-nextdoor)
4. [Thumbtack](#4-thumbtack)
5. [Angi / HomeAdvisor](#5-angi--homeadvisor)
6. [TaskRabbit](#6-taskrabbit)
7. [Yelp](#7-yelp)
8. [Google Maps / Google Business](#8-google-maps--google-business)
9. [Florida DBPR (Contractor Licenses)](#9-florida-dbpr-contractor-licenses)
10. [Florida Sunbiz (LLC Registrations)](#10-florida-sunbiz-llc-registrations)
11. [BBB (Better Business Bureau)](#11-bbb-better-business-bureau)
12. [Alignable](#12-alignable)
13. [LinkedIn](#13-linkedin)
14. [Instagram / TikTok](#14-instagram--tiktok)
15. [Jobber / Housecall Pro Directories](#15-jobber--housecall-pro-directories)
16. [Porch.com, Bark.com, Handy.com](#16-porchcom-barkcom-handycom)
17. [Home Depot / Lowe's Pro Networks](#17-home-depot--lowes-pro-networks)
18. [Orlando Permit Records](#18-orlando-permit-records)
19. [Yellow Pages / Manta / Whitepages](#19-yellow-pages--manta--whitepages)
20. [Reddit r/orlando](#20-reddit-rorlando)
21. [Local Trade Schools](#21-local-trade-schools)
22. [Day Labor Centers / Worker Centers](#22-day-labor-centers--worker-centers)
23. [Church Bulletin Boards / Community Centers](#23-church-bulletin-boards--community-centers)
24. [Lawn Care / Cleaning Apps](#24-lawn-care--cleaning-apps)
25. [Scraping Tools & Lead Gen Services](#25-scraping-tools--lead-gen-services)
26. [Legal Considerations Summary](#26-legal-considerations-summary)

---

## 1. Craigslist Orlando

### Exact URLs (Bookmark These)

| Section | URL | What You'll Find |
|---------|-----|-----------------|
| **Services > Skilled Trade** | `https://orlando.craigslist.org/search/sks` | Pros advertising their services (plumbers, electricians, handymen, painters) |
| **Services > Household** | `https://orlando.craigslist.org/search/hss` | Cleaners, organizers, movers |
| **Services > Labor/Hauling** | `https://orlando.craigslist.org/search/lbs` | Junk haulers, movers, general labor |
| **Services > Garden/Lawn** | `https://orlando.craigslist.org/search/gds` | Landscapers, lawn care, tree services |
| **Gigs > Labor** | `https://orlando.craigslist.org/search/lbg` | People looking for labor gigs |
| **Gigs > Skilled Trade** | `https://orlando.craigslist.org/search/trd` | Skilled workers seeking gig work |
| **Gigs > Domestic** | `https://orlando.craigslist.org/search/dmg` | Cleaning, housekeeping gigs |
| **Jobs > Skilled Trade/Craft** | `https://orlando.craigslist.org/search/trd` | Companies hiring trades (find the workers applying) |

### Data Available
- **Name:** Sometimes first name or business name in post
- **Phone:** Often included in ad text (sometimes as image to avoid scraping)
- **Email:** Craigslist anonymizes by default (relay address), but many include real email in body
- **Business Name:** Frequently listed
- **Services Offered:** Detailed in post

### Extraction Method
- **Manual:** Browse daily, copy contact info from posts — best for quality
- **Scraping:** Use Python + `requests` + `BeautifulSoup`. Craigslist has no official API but the HTML is simple. Search results are paginated at 120/page
- **Tools:** 
  - `craigslist` Python package (unofficial): `pip install python-craigslist`
  - Parsehub or Octoparse for no-code scraping
- **RSS Feeds:** Each search has an RSS feed (orange icon) — monitor for new posts automatically

### Volume Estimate
- ~50-100 active service posts per week across all sections
- Gigs sections refresh constantly; skilled trade services section has 20-40 active at any time

### Legal Notes
- Craigslist's ToS prohibits scraping. They've sued scrapers (Craigslist v. 3Taps). Use at your own risk for personal lead gen; don't resell data.

---

## 2. Facebook Marketplace & Groups

### Facebook Marketplace
- **URL:** `https://www.facebook.com/marketplace/orlando/services`
- **Search terms:** "handyman Orlando", "cleaning service", "junk removal", "lawn care", "pressure washing", "painting"
- **Data:** Name, profile link, sometimes phone/business page. Messenger contact always available.

### Key Facebook Groups to Join (Search These Exact Names)

| Group Name / Search Term | Type |
|--------------------------|------|
| "Orlando Handyman Services" | Service providers posting |
| "Orlando Home Services & Contractors" | Contractors networking |
| "Orlando Florida Buy Sell Trade" | Mixed, service pros advertise |
| "Lake Nona Community" | Neighborhood group, pros get recommended |
| "Orlando Moms" / "Orlando Mom Collective" | Frequent contractor recommendations |
| "Junk Removal Orlando" | Junk haulers specifically |
| "Central Florida Contractors" | Contractor networking |
| "Orlando Landscaping & Lawn Care" | Landscapers |
| "Orlando Real Estate Investors" | They know every contractor in town |
| "Orlando Property Management" | Same — contractor referral goldmine |
| "Se Busca / Se Ofrece Orlando" (Spanish) | Huge for labor/cleaning/landscaping |
| "Trabajos en Orlando Florida" | Spanish-language job/service group |

### Extraction Method
- **Manual (recommended):** Join groups, post "looking for [service] pros" — they'll DM you
- **Scraping:** Facebook aggressively blocks scraping. Don't automate. Will get account banned.
- **Best approach:** Post in 5-10 groups: "We're hiring home service pros — handymen, cleaners, haulers, landscapers. Flexible schedule, good pay. DM me." Collect responses.

### Volume Estimate
- 200-500+ active service pros across Orlando Facebook groups
- Spanish-language groups are underutilized goldmines — many skilled workers, less competition for recruitment

### Legal Notes
- Do NOT scrape Facebook. Violates ToS and potentially CFAA. Manual outreach only.

---

## 3. Nextdoor

### URL & Method
- **URL:** `https://nextdoor.com` (must verify address in Orlando area)
- **Business Search:** `https://nextdoor.com/find-business/`
- Search by category: Handyman, Plumber, Electrician, House Cleaning, Landscaping, Junk Removal, etc.

### Data Available
- Business name, service categories, neighborhood endorsements/recommendations count
- Some profiles show website/phone
- Recommendation threads have pro names + contact info in comments

### Extraction Method
- **Manual only.** Nextdoor is extremely locked down — no scraping possible
- Join as a resident, browse "Recommendations" section, search business directory
- Post asking for recommendations — neighbors will tag pros

### Volume Estimate
- 100-300 recommended pros across Orlando neighborhoods

### Legal Notes
- Scraping violates ToS. Manual browsing and outreach only.

---

## 4. Thumbtack

### Exact URLs

| Category | URL |
|----------|-----|
| All Orlando Services | `https://www.thumbtack.com/fl/orlando/` |
| Handyman | `https://www.thumbtack.com/fl/orlando/handyman` |
| House Cleaning | `https://www.thumbtack.com/fl/orlando/house-cleaning` |
| Landscaping | `https://www.thumbtack.com/fl/orlando/landscaping` |
| Junk Removal | `https://www.thumbtack.com/fl/orlando/junk-removal` |
| Painting | `https://www.thumbtack.com/fl/orlando/interior-painting` |
| Plumbing | `https://www.thumbtack.com/fl/orlando/plumbing` |
| Pressure Washing | `https://www.thumbtack.com/fl/orlando/pressure-washing` |
| Moving | `https://www.thumbtack.com/fl/orlando/local-moving` |
| Electrical | `https://www.thumbtack.com/fl/orlando/electrician` |

URL pattern: `https://www.thumbtack.com/fl/orlando/{category-slug}`

Full category list: `https://www.thumbtack.com/more-services`

### Data Available
- Business name, owner first name, rating, review count, years in business
- Profile photo, services list, price range
- **No direct phone/email** — contact is through Thumbtack messaging
- BUT: Business name → Google search → find their direct contact

### Extraction Method
- **Scraping:** Thumbtack renders via JavaScript. Use Playwright/Puppeteer to scroll and extract.
- **Thumbtack Partner API:** `https://developers.thumbtack.com/docs/businesses-search` — official API that returns pro profiles with business name, rating, URL, image. May require partnership application.
- **Manual enrichment:** Take business names from Thumbtack → search Google/Facebook for direct phone/email

### Volume Estimate
- 50-200 pros per category, 20+ categories = **1,000-3,000+ unique pros** in Orlando

### Legal Notes
- Scraping violates ToS. The Partner API is the legal route. Business names are public info you can Google.

---

## 5. Angi / HomeAdvisor

### Exact URLs
- **Angi:** `https://www.angi.com/companylist/orlando/`
- **Search:** `https://www.angi.com/companylist/orlando/handyman.htm`
- Replace `handyman.htm` with: `plumbing.htm`, `house-cleaning.htm`, `landscaping.htm`, `painting.htm`, `junk-hauling.htm`, `electrician.htm`, `pressure-washing.htm`, etc.

### Data Available
- Business name, address, phone number (often shown), rating, review count
- Years in business, license info, service descriptions
- Some show owner name

### Extraction Method
- **Scraping:** HTML is relatively clean. Python + BeautifulSoup or Scrapy. Pages are server-rendered.
- **Outscraper** has an Angi scraper module
- **Manual:** Browse category pages, each listing shows phone directly

### Volume Estimate
- 100-500+ listings per major category. Total across all home service categories: **2,000-5,000+ businesses**

### Legal Notes
- Angi ToS prohibits scraping. Phone numbers displayed publicly are fair game for manual collection.

---

## 6. TaskRabbit

### URL
- `https://www.taskrabbit.com/locations/orlando`
- Browse by category: Handyman, Cleaning, Moving, Yard Work, etc.

### Data Available
- Tasker first name + last initial, profile photo, hourly rate, rating, reviews
- Task categories, "Elite Tasker" badge
- **No phone/email** — TaskRabbit messaging only

### Extraction Method
- **Manual:** Browse profiles, note names and specialties. Cross-reference with Facebook/Google to find direct contact.
- **Scraping:** JS-rendered. Playwright required. Limited value since no contact info shown.

### Volume Estimate
- 50-150 active taskers in Orlando across all categories

### Legal Notes
- ToS prohibits scraping. Low ROI due to lack of contact info.

---

## 7. Yelp

### Exact URLs
- `https://www.yelp.com/search?find_desc=handyman&find_loc=Orlando%2C+FL`
- `https://www.yelp.com/search?find_desc=junk+removal&find_loc=Orlando%2C+FL`
- `https://www.yelp.com/search?find_desc=house+cleaning&find_loc=Orlando%2C+FL`
- `https://www.yelp.com/search?find_desc=landscaping&find_loc=Lake+Nona%2C+Orlando%2C+FL`
- Replace `find_desc` with any service category

### Data Available
- **Business name, phone number, address, website, hours, rating, review count**
- Owner name sometimes visible on business page
- Photos, service descriptions

### Extraction Method
- **Yelp Fusion API:** `https://docs.developer.yelp.com/` — Free tier: 500 API calls/day. Returns business name, phone, address, rating, URL. **This is the legal route.**
- **Scraping:** Yelp aggressively blocks scrapers. Use API instead.
- **Outscraper** also offers Yelp scraping as a service

### Volume Estimate
- 200-1,000+ per major category. Total: **3,000-8,000+ home service businesses** in Orlando metro

### Legal Notes
- Yelp API is legal and generous. Scraping is against ToS and Yelp has sent cease-and-desists. Use the API.

---

## 8. Google Maps / Google Business

### ⭐ THIS IS THE #1 HIGHEST-ROI SOURCE ⭐

### Search Method
- Go to `https://www.google.com/maps`
- Search: "handyman Orlando FL", "junk removal Orlando", "house cleaning Orlando FL", "landscaping Orlando FL", etc.
- Or use Google Search: `handyman near orlando fl` → Local Pack results

### Data Available
- **Business name, phone, website, address, hours, rating, review count, Google Business Profile link**
- Owner name often on website
- Email often on website (scrape the website from GMB listing)

### Extraction Method — **USE OUTSCRAPER** (Best Tool)
- **Outscraper Google Maps Scraper:** `https://outscraper.com/google-maps-scraper/`
  - Input: "handyman Orlando FL" (and 20+ other queries)
  - Output: CSV with name, phone, website, email (enriched), address, rating, reviews
  - **Cost:** ~$0.003/record. 1,000 records = $3
  - Free tier: 500 records/month
- **Alternative Tools:**
  - **PhantomBuster** Google Maps scraper
  - **Apify** Google Maps scraper (`https://apify.com/compass/google-maps-scraper`)
  - **SerpAPI** (`https://serpapi.com/`) — Google Maps API, returns structured data
  - **D7 Lead Finder** (`https://d7leadfinder.com/`) — specifically designed for local business lead gen

### Recommended Search Queries for Orlando
```
handyman Orlando FL
junk removal Orlando FL
house cleaning Orlando FL
lawn care Orlando FL
landscaping Orlando FL
pressure washing Orlando FL
painting contractor Orlando FL
plumber Orlando FL
electrician Orlando FL
HVAC Orlando FL
appliance repair Orlando FL
fence installation Orlando FL
flooring Orlando FL
roofing Orlando FL
tree service Orlando FL
pool service Orlando FL
pest control Orlando FL
carpet cleaning Orlando FL
gutter cleaning Orlando FL
drywall repair Orlando FL
concrete Orlando FL
home remodeling Orlando FL
maid service Orlando FL
moving company Orlando FL
garage door repair Orlando FL
```

Run each through Outscraper. Deduplicate results.

### Volume Estimate
- **5,000-15,000+ unique home service businesses** in Orlando metro on Google Maps
- This is your single largest source of structured, contactable pro data

### Legal Notes
- Google Maps data is publicly displayed. Outscraper and similar tools are widely used. Bulk automated scraping may violate Google ToS but enforcement is rare for small-scale use. Don't republish the data as a directory.

---

## 9. Florida DBPR (Contractor Licenses)

### ⭐ PUBLIC RECORDS GOLDMINE ⭐

### URL
- **License Search:** `https://www.myfloridalicense.com/wl11.asp?mode=0&SID=`
- **Alternate:** `https://www2.myfloridalicense.com/`

### How to Search
1. Go to license search
2. Select License Type: "Construction" → subcategories include:
   - Certified General Contractor
   - Certified Building Contractor
   - Certified Residential Contractor
   - Certified Plumbing Contractor
   - Certified Electrical Contractor
   - Certified HVAC Contractor
   - Certified Roofing Contractor
   - Certified Pool Contractor
   - Registered Specialty Contractor
3. Filter by County: **Orange County** (Orlando), **Osceola County**, **Seminole County**
4. Status: Active

### Data Available
- **Full legal name, business name, license number, license type, status, expiration date, address, county**
- This is PUBLIC RECORD under Florida Sunshine Law

### Extraction Method
- **Manual:** Search and export results from the website
- **Public Records Request:** Email DBPR at `Call.Center@myfloridalicense.com` or use their public records form. Request: "All active construction-related licenses in Orange, Osceola, and Seminole counties in CSV/Excel format"
  - Florida law requires they fulfill this. They may charge a nominal fee.
- **Scraping:** The search form can be automated with Selenium/Playwright. Paginate through results.

### Volume Estimate
- **10,000-20,000+ active licensed contractors** in the Orlando tri-county area
- Includes all licensed trades: GC, plumbing, electrical, HVAC, roofing, etc.

### Legal Notes
- **100% legal.** Florida Sunshine Law (Chapter 119, F.S.) makes all government records public. You have a legal right to this data. DBPR must provide it upon request.

---

## 10. Florida Sunbiz (LLC Registrations)

### URL
- **Search:** `https://search.sunbiz.org/Inquiry/CorporationSearch/ByName`

### How to Search
- Search business names containing keywords: "handyman", "cleaning", "landscaping", "junk", "hauling", "painting", "plumbing", "construction", "home services", "lawn", "pressure washing"
- Filter by status: Active
- Each result shows the registered agent, principal address, and filing history

### Data Available
- **Business name, registered agent name, principal address, mailing address, filing date, status, annual report history**
- Registered agent is often the owner
- Addresses are public

### Extraction Method
- **Manual:** Search one keyword at a time, browse results
- **Public Records Request:** Email `corphelp@dos.state.fl.us` — request bulk data extract of active LLCs/Corps with specific SIC/NAICS codes or keyword filters
- **Bulk Data:** Sunbiz sells bulk data files: `https://dos.fl.gov/sunbiz/other-services/data-downloads/`
  - Includes ALL Florida corporations/LLCs. Filter by registered agent address in Orange/Osceola/Seminole counties + keywords
  - Cost: varies, but reasonable for public records
- **Scraping:** Search results are HTML. Automate with Selenium.

### Volume Estimate
- Thousands of home-service LLCs registered in Orlando metro area
- Cross-reference with DBPR data for licensed contractors who also have LLCs

### Legal Notes
- **100% legal.** Public records. Bulk downloads officially offered by the state.

---

## 11. BBB (Better Business Bureau)

### URL
- `https://www.bbb.org/search?find_country=US&find_loc=Orlando%2C%20FL&find_type=Category&find_text=handyman`
- Replace `find_text=` with: `plumber`, `electrician`, `landscaping`, `cleaning`, `junk+removal`, etc.

### Data Available
- Business name, phone, address, website, BBB rating, accreditation status, complaint history
- Owner/principal name on some listings

### Extraction Method
- **Manual:** Browse search results, click through to profiles
- **Scraping:** Standard HTML, can be scraped with BeautifulSoup. Limited pagination.

### Volume Estimate
- 200-800 accredited + non-accredited home service businesses in Orlando

### Legal Notes
- BBB data is publicly displayed. Reasonable scraping for personal use is low risk.

---

## 12. Alignable

### URL
- `https://www.alignable.com/orlando-fl`
- Search for: contractors, handymen, cleaners, landscapers

### Data Available
- Business name, owner name, industry, location
- Some show phone/email/website
- Connection/recommendation count

### Extraction Method
- **Manual:** Create a free business profile, search and connect with local pros
- **Networking approach:** Join Orlando business groups on Alignable, post that you're looking for pros

### Volume Estimate
- 50-200 home service businesses in Orlando on Alignable (smaller platform)

### Legal Notes
- Manual networking only. Low volume doesn't warrant scraping.

---

## 13. LinkedIn

### Search Method
- **People Search:** `https://www.linkedin.com/search/results/people/?keywords=handyman%20orlando&origin=GLOBAL_SEARCH_HEADER`
- Search queries:
  - "handyman Orlando"
  - "contractor Orlando Florida"
  - "cleaning business owner Orlando"
  - "landscaping Orlando"
  - "junk removal Orlando"
  - "home services Orlando"
  - "general contractor Orlando"
  - Filter by: Location = Orlando, FL Metropolitan Area

- **Company Search:** Search for companies with "handyman", "cleaning", "landscaping" in Orlando

### Data Available
- Full name, job title, company, location
- Sometimes phone/email (if connected or with Sales Navigator)
- Company page: website, employee count, about section

### Extraction Method
- **LinkedIn Sales Navigator** ($99/mo): Advanced filters, InMail credits, lead lists
  - Filter: Industry = Construction, Location = Orlando, Company Size = 1-10
- **Manual:** Connect and message pros directly
- **PhantomBuster LinkedIn Scraper:** Automates profile data extraction (against ToS but widely used)
- **Apollo.io / ZoomInfo:** Cross-reference LinkedIn profiles with email/phone databases

### Volume Estimate
- 500-2,000+ home service professionals/owners in Orlando on LinkedIn

### Legal Notes
- LinkedIn aggressively enforces anti-scraping (hiQ Labs v. LinkedIn case established some legal scraping rights for public profiles, but LinkedIn still restricts it). Manual outreach and Sales Navigator are safest.

---

## 14. Instagram / TikTok

### Instagram Search Method
- Search hashtags:
  - `#orlandohandyman` `#orlandocontractor` `#orlandocleaning`
  - `#orlandolandscaping` `#orlandopressurewashing` `#orlandopainter`
  - `#orlandojunkremoval` `#orlandoplumber` `#orlandoelectrician`
  - `#orlandohomeservices` `#centralfloridacontractor`
  - `#lakenona` + service keywords
- Search location tags: Orlando, FL + service keywords
- **URL pattern:** `https://www.instagram.com/explore/tags/orlandohandyman/`

### TikTok Search Method
- Search: "Orlando handyman", "Orlando contractor", "day in the life contractor Orlando"
- Many pros post before/after content
- **URL:** `https://www.tiktok.com/search?q=orlando+handyman`

### Data Available
- Username (often includes business name), bio (often has phone/email/website)
- DM capability
- Content shows quality of work

### Extraction Method
- **Manual:** Search hashtags, review profiles, DM interesting pros
- **Tools:** 
  - **Apify Instagram Scraper** — extracts profiles from hashtag searches
  - **Export followers** of Orlando home service company accounts
- **Best tactic:** Follow/DM pros who are actively posting their work — they're hungry for business

### Volume Estimate
- 200-500+ pros actively posting on Instagram with Orlando location tags
- TikTok: 50-200 active pros

### Legal Notes
- Manual DM outreach is fine. Automated scraping violates both platforms' ToS.

---

## 15. Jobber / Housecall Pro Directories

### Jobber
- Jobber does NOT have a public pro directory. It's business management software.
- **Indirect approach:** Search Google for "powered by Jobber" + Orlando — finds businesses using Jobber for online booking. These are established, tech-savvy pros.

### Housecall Pro
- **No public directory** either.
- Same indirect approach: Google `"powered by housecallpro" orlando` or `site:housecallpro.com orlando`

### Data Available
- Business name, services, booking page (which has phone/address)

### Volume Estimate
- 50-100 discoverable through Google searches

---

## 16. Porch.com, Bark.com, Handy.com

### Porch.com
- **URL pattern:** `https://pro.porch.com/orlando-fl/{category}/cp`
- Categories: `handyman`, `house-cleaning`, `landscaping`, `plumbing`, `electricians`, `home-builders`, `painters`, `roofing`, etc.
- **Data:** Business name, phone, address, rating, reviews, years in business, license info
- **Volume:** 500-2,000+ pros across categories
- **Extraction:** HTML scraping with BeautifulSoup. Contact info is displayed publicly.

### Bark.com
- **URL:** `https://www.bark.com/en/us/professionals/handyman/orlando--fl/`
- Replace `handyman` with other categories
- **Data:** Business name, description, rating. Contact requires Bark messaging.
- **Volume:** 100-300 pros

### Handy.com
- **URL:** `https://www.handy.com/services/handyman/orlando`
- Handy is more of a marketplace — you book through them. No direct pro directory to scrape.
- **Alternative use:** Post a job on Handy, see who responds, recruit directly (gray area with their ToS)
- **Volume:** 50-200 active Handy pros in Orlando

---

## 17. Home Depot / Lowe's Pro Networks

### Home Depot Pro Referral
- **URL:** `https://www.homedepot.com/services/` (then select service + Orlando zip: 32801, 32827 for Lake Nona, etc.)
- Home Depot partners with vetted contractors. Listings show business name and sometimes phone.
- Limited volume but high-quality, vetted pros.

### Lowe's
- `https://www.lowes.com/l/services` — similar setup
- Lowe's Foundation recently granted Valencia College $500K for skilled trades — potential partnership angle for recruiting graduates

### Extraction
- Manual browsing. These are curated networks, not large directories.

### Volume Estimate
- 50-100 pros per service category in Orlando

---

## 18. Orlando Permit Records

### ⭐ UNDERUTILIZED PUBLIC RECORDS SOURCE ⭐

### URLs
- **City of Orlando:** `https://permitlookup.cityoforlando.net/WebPermits/`
- **Orange County (unincorporated):** `https://fasttrack.ocfl.net/OnlineServices/`
  - Licensed Contractor Lookup
  - Permit Search (by contractor name, address, date range)
- **City of Orlando Open Data:** `https://www.orlando.gov/Building-Development/Permits-Inspections/Other/View-Permitting-Data`

### How to Use for Recruitment
1. Search recent permits (last 6-12 months) for residential work
2. Each permit lists the **contractor name/company, license number, and project type**
3. Cross-reference contractor name with DBPR for full contact info
4. Contractors pulling many permits = active, established businesses

### Data Available
- Contractor name/company, license number, permit type, project address, dates
- Cross-reference yields: phone, address, email

### Extraction Method
- **Orange County FastTrack:** Has a "Licensed Contractors" search — browse and export
- **Open Data Portal:** May offer bulk CSV downloads of permit data
- **Public Records Request:** Request all residential permits pulled in last 12 months in CSV format from City of Orlando Building Department

### Volume Estimate
- Thousands of permits per year = hundreds of unique active contractors

### Legal Notes
- **100% legal.** Public records under Florida Sunshine Law.

---

## 19. Yellow Pages / Manta / Whitepages

### Yellow Pages
- **URL:** `https://www.yellowpages.com/orlando-fl/handyman`
- Replace `handyman` with: `plumbers`, `electricians`, `landscaping`, `house-cleaning`, `junk-removal`, etc.
- **Data:** Business name, phone, address, website, years in business, BBB rating
- **Scraping:** HTML is clean. BeautifulSoup works well.

### Manta
- **URL:** `https://www.manta.com/search?search=handyman&search_location=Orlando%2C+FL`
- **Data:** Business name, phone, address, revenue estimate, employee count, owner name
- **Scraping:** Standard HTML, easy to scrape

### Whitepages
- **URL:** `https://www.whitepages.com/business/FL/Orlando/handyman`
- **Data:** Business name, phone, address
- **Reverse lookup:** If you have a phone number, find the business owner

### Volume Estimate
- YP: 200-500 per category
- Manta: 100-300 per category
- Combined unique: **1,000-3,000+ businesses**

### Legal Notes
- These directories publish data publicly. Scraping for personal use is generally acceptable.

---

## 20. Reddit r/orlando

### URLs
- `https://www.reddit.com/r/orlando/search/?q=handyman`
- `https://www.reddit.com/r/orlando/search/?q=contractor+recommendation`
- `https://www.reddit.com/r/orlando/search/?q=cleaning+service`
- `https://www.reddit.com/r/orlando/search/?q=lawn+care`
- `https://www.reddit.com/r/orlando/search/?q=junk+removal`

### How to Use
- Search recommendation threads — residents name specific pros with contact info
- Sort by New to find recent recommendations
- Post asking for recommendations (will get 10-50 responses)
- Also check: `r/lakemary`, `r/centralflorida`

### Data Available
- Business names, sometimes phone/website in comments
- Quality signals from community upvotes

### Extraction Method
- **Reddit API** (free, requires app registration): Search posts and comments
- **Manual:** Browse search results, collect mentioned businesses

### Volume Estimate
- 50-200 unique businesses mentioned in recommendation threads

---

## 21. Local Trade Schools

### Valencia College — Accelerated Skills Training
- **URL:** `https://valenciacollege.edu/students/career-pathways/`
- **Programs:** Carpentry, Construction, HVAC, Electrical, Plumbing, Appliance Repair
- **Received $500K Lowe's Foundation grant** for skilled trades
- **Contact:** Workforce & Career Education department
- **Approach:** Partner with them for graduate placement. Offer to be listed as an employer for their graduates. Attend career fairs.

### Orange Technical College
- **URL:** `https://orangetechcollege.net/programs-home`
- **Campuses:** Avalon Park, Downtown Orlando, Mid-Florida, Westside, Winter Park
- **Programs:** Electricity, HVAC, Plumbing, Carpentry, Welding, Automotive
- **Approach:** Contact career services, offer internships/jobs, recruit at graduation

### Other Schools
- **Tulsa Welding School (Jacksonville campus)** — welders who may relocate to Orlando
- **Florida Technical College** — various trade programs
- **Universal Technical Institute (UTI)** — automotive/HVAC

### Recruitment Strategy
1. Contact career services at each school
2. Offer to post on their job boards
3. Attend career fairs and graduation events
4. Offer apprenticeships — schools love placing students

### Volume Estimate
- Valencia + Orange Tech graduate hundreds of trade students per year in Orlando metro

---

## 22. Day Labor Centers / Worker Centers

### Specific Locations

| Name | Address | Notes |
|------|---------|-------|
| **Labor Finders - Orlando** | 401 W Kaley St, Orlando, FL | Blue collar/industrial temp staffing |
| **PeopleReady - Orlando** | Multiple locations | On-demand labor, app-based (JobStack) |
| **HireQuest / Snelling of Orlando** | 6100 S Orange Ave, Suite K, Orlando, FL 32809 | Temp staffing agency |
| **Informal day labor spots** | OBT (Orange Blossom Trail) & Colonial Dr area, Home Depot parking lots (especially S. OBT, Hwy 50) | Early morning, workers gather looking for day jobs |

### Approach
- Visit Labor Finders/PeopleReady — tell them you're looking to hire directly (not through their agency)
- For informal spots: show up at 6-7am, speak to workers directly (Spanish helpful), offer fair rates
- Many of these workers have real skills (painting, drywall, landscaping, demolition) but lack marketing

### Volume Estimate
- 100-500+ day laborers available on any given day in Orlando metro

### Legal Notes
- Hiring independent contractors directly is legal. Ensure proper 1099 documentation. Be aware of immigration status — don't ask, but ensure I-9 compliance if W-2.

---

## 23. Church Bulletin Boards / Community Centers

### Strategy
- **Target Hispanic churches** (largest source of informal home service workers in Orlando):
  - Iglesia de Dios Pentecostal — multiple Orlando locations
  - Iglesia Bautista — multiple locations
  - Catholic churches in Azalea Park, Pine Hills, Kissimmee areas
- **Community Centers:**
  - Colonialtown Community Center
  - Dover Shores Community Center
  - Various HOA community centers in Lake Nona, Hunters Creek
- **Approach:** Post flyers in Spanish and English: "¡Buscamos trabajadores de servicios del hogar!" / "Hiring Home Service Pros!"
- Include QR code linking to application form

### Volume Estimate
- Highly variable. 10-50 responses per flyer campaign.

---

## 24. Lawn Care / Cleaning Apps

### Lawn Care Platforms (pros are already on these — recruit them)
| Platform | URL | Notes |
|----------|-----|-------|
| **LawnStarter** | `https://www.lawnstarter.com/orlando-fl-lawn-care` | Browse pro profiles. Business name often shown. |
| **Lawn Love** | `https://lawnlove.com/orlando-fl-lawn-care` | Similar to LawnStarter |
| **GreenPal** | `https://www.yourgreenpal.com/lawn-mowing/orlando-fl` | "Uber for lawn care" — pros bid on jobs |
| **Plowz & Mowz** | `https://plowzandmowz.com/` | Lawn + snow services |

### Cleaning Platforms
| Platform | URL | Notes |
|----------|-----|-------|
| **Molly Maid** | `https://www.mollymaid.com/orlando/` | Franchise — pros are employees, not recruitable |
| **The Maids** | `https://www.maids.com/orlando/` | Same — franchise employees |
| **MaidPro** | `https://www.maidpro.com/orlando/` | Franchise |
| **Homeaglow** | `https://homeaglow.com/` | Independent cleaners, has profiles |
| **Turno (TurnoverBnB)** | `https://turno.com/` | Airbnb cleaning marketplace — Orlando is huge for vacation rentals |

### Extraction Method
- Browse pro profiles on LawnStarter/GreenPal/Homeaglow
- Cross-reference business names with Google for direct contact
- **Turno is key** — Orlando vacation rental cleaning is a massive market

### Volume Estimate
- 100-300 pros per platform, significant overlap

---

## 25. Scraping Tools & Lead Gen Services

### DIY Scraping Tools

| Tool | URL | Best For | Cost |
|------|-----|----------|------|
| **Outscraper** | `https://outscraper.com/` | Google Maps, Yelp, YP | $0.003/record, 500 free |
| **Apify** | `https://apify.com/` | Any website, pre-built scrapers for Google Maps, Instagram, Facebook | Pay-per-use |
| **PhantomBuster** | `https://phantombuster.com/` | LinkedIn, Instagram, Google Maps | $69/mo+ |
| **Octoparse** | `https://octoparse.com/` | Visual no-code scraper for any site | Free tier + $89/mo |
| **ParseHub** | `https://parsehub.com/` | Visual scraper, good for complex sites | Free tier + $189/mo |
| **ScrapeHero** | `https://www.scrapehero.com/` | Managed scraping service | Custom pricing |
| **Bright Data** | `https://brightdata.com/` | Proxies + scraping infrastructure | Enterprise |
| **SerpAPI** | `https://serpapi.com/` | Google Maps API results | $50/mo+ |
| **D7 Lead Finder** | `https://d7leadfinder.com/` | Local business lead gen specifically | $27/search |

### Lead Generation Services (They Do the Work)

| Service | URL | What They Do | Cost |
|---------|-----|--------------|------|
| **LeadScrape** | `https://www.leadscrape.com/` | Desktop app, scrapes business directories | $97 one-time |
| **iWeb Scraping** | `https://www.iwebscraping.com/` | Managed Angi/Yelp/Google scraping service | Custom |
| **ScrapingHome** | `https://scrapinghome.com/` | Managed web scraping services | Custom |
| **UpLead** | `https://www.uplead.com/` | B2B contact database with email/phone | $99/mo |
| **Apollo.io** | `https://www.apollo.io/` | Business contact database, email finder | Free tier + $49/mo |
| **ZoomInfo** | `https://www.zoominfo.com/` | Enterprise contact database | $$$$ |
| **Hunter.io** | `https://hunter.io/` | Find emails by domain | Free tier + $49/mo |
| **Snov.io** | `https://snov.io/` | Email finder + outreach | Free tier + $39/mo |

### Recommended Stack for Orlando Pro Recruitment

1. **Outscraper** → Scrape Google Maps for all 25 home service categories in Orlando ($50-100 total)
2. **DBPR Public Records Request** → Get all licensed contractors in Orange/Osceola/Seminole counties (free or nominal fee)
3. **Sunbiz Bulk Data** → Cross-reference LLC registrations
4. **Apollo.io** → Enrich business names with owner email/phone
5. **Facebook Groups** → Manual outreach in 10-15 groups
6. **Craigslist RSS** → Monitor new posts automatically
7. **Hunter.io** → Find email addresses from business websites

---

## 26. Legal Considerations Summary

### ✅ Fully Legal (Public Records)
- Florida DBPR license database
- Florida Sunbiz LLC registrations
- Orange County / City of Orlando permit records
- Any Florida government database (Sunshine Law)

### ✅ Legal (Public Data, Use Responsibly)
- Google Maps business listings (publicly displayed)
- Yelp (use official API)
- Yellow Pages / Manta / BBB (publicly displayed)
- LinkedIn (manual browsing, Sales Navigator)
- Craigslist (manual browsing)

### ⚠️ Gray Area (Against ToS, Low Enforcement Risk)
- Scraping Thumbtack, Angi, Porch.com profiles
- Automated Google Maps scraping (Outscraper does this at scale)
- PhantomBuster on LinkedIn/Instagram
- Craigslist scraping (they've litigated but mainly against competitors)

### 🔴 High Risk (Don't Do)
- Facebook scraping (aggressive enforcement, potential CFAA liability)
- Nextdoor scraping (locked down, small upside)
- Misrepresenting yourself to gain access to locked platforms
- Reselling scraped data as a product

### General Rules
1. **CAN-SPAM Act:** If you email scraped contacts, include opt-out, physical address, honest subject lines
2. **TCPA:** If you call/text scraped phone numbers, don't use auto-dialers without consent. Manual calls are fine.
3. **Florida Telephone Solicitation Act:** Check Florida Do Not Call list before cold calling
4. **Best practice:** Use scraped data for initial research, then do personalized manual outreach

---

## Quick-Start Action Plan

### Week 1: Low-Hanging Fruit
1. [ ] File DBPR public records request for all active contractors in Orange/Osceola/Seminole counties
2. [ ] Run Outscraper on 25 Google Maps queries (~$50, get 5,000+ businesses with phone/email)
3. [ ] Join 10 Facebook groups, post recruitment messages
4. [ ] Set up Craigslist RSS feeds for all service sections
5. [ ] Browse Thumbtack Orlando — note top 100 pros, Google their business names for direct contact

### Week 2: Medium Effort
6. [ ] Use Yelp Fusion API to pull Orlando home service listings
7. [ ] Search Sunbiz for home service LLCs, cross-reference with DBPR
8. [ ] Request Orlando permit records for last 12 months
9. [ ] LinkedIn Sales Navigator search + outreach to Orlando home service owners
10. [ ] Instagram hashtag search, DM active pros

### Week 3: Community Outreach
11. [ ] Contact Valencia College & Orange Technical College career services
12. [ ] Visit Labor Finders, PeopleReady
13. [ ] Post flyers at community centers and churches (bilingual)
14. [ ] Post on r/orlando
15. [ ] Browse Porch.com, Bark.com, Angi — collect any remaining pros

### Ongoing
- Monitor Craigslist RSS daily
- Check Facebook groups weekly
- Refresh Outscraper data monthly
- Maintain master spreadsheet of all contacted pros + status

---

*Total estimated reachable Orlando home service pros across all channels: **10,000-25,000+***
