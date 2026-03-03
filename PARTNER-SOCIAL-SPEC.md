# Partner Social Media Automation Spec

## Overview

Each UpTend partner gets a fully managed social media presence powered by AI. We clone and configure our existing social autoposter engine (`social-autoposter/`) per partner, generating branded content daily and posting it to their Facebook and Instagram pages with zero effort from the partner.

## Architecture

### How It Works

The core social autoposter at `/Users/ao/.openclaw/workspace/social-autoposter/` handles content generation, image creation, and posting for UpTend's own accounts. For partners, we:

1. **Clone the config, not the code.** One shared autoposter engine serves all partners. Each partner gets a config entry (not a separate codebase).
2. **Partner configs** define everything unique: brand voice, service type, target neighborhoods, Facebook page ID, Instagram account, posting schedule, and content mix.
3. **n8n orchestrates** per-partner workflows using the shared engine's APIs (content generation, image gen, posting).

### Partner Social Config

Each partner config lives in the autoposter's `partner-configs/` directory:

```json
{
  "partnerId": "comfort-solutions-tech",
  "companyName": "Comfort Solutions Tech LLC",
  "serviceType": "HVAC",
  "brandVoice": "Friendly, knowledgeable, local expert. First-person plural ('we'). Casual but professional.",
  "facebookPageId": "123456789",
  "facebookAccessToken": "<encrypted>",
  "instagramAccountId": "987654321",
  "targetNeighborhoods": ["Lake Nona", "Dr. Phillips", "Winter Park", "Windermere", "Celebration", "Kissimmee"],
  "phone": "(407) 860-8842",
  "website": "https://uptend.app/partners/comfort-solutions-tech",
  "postingSchedule": {
    "morningTip": "08:00",
    "afternoonEngagement": "13:00",
    "eveningEducational": "18:30"
  },
  "contentMix": {
    "dailyTips": true,
    "beforeAfter": true,
    "makeUGC": true,
    "heyGen": true,
    "seasonal": true,
    "testimonials": true,
    "neighborhoodTargeted": true
  }
}
```

## Content Types

### 1. Daily Tips Posts

AI-generated, branded to the partner. Published every morning.

**Example:** "AC Tip from Comfort Solutions Tech: Change your filter every 30 days in Florida summer. A dirty filter makes your unit work 15% harder and drives your bill up. Need a tune up? Call us at (407) 860-8842."

- Generated via GPT with partner brand voice + service type
- Branded image generated via `image_gen.py` with partner logo/colors
- Rotates through tip categories (maintenance, efficiency, safety, cost saving)

### 2. Before/After Job Photos

Partner uploads job photos (via partner dashboard or WhatsApp). We format and post.

- Partner sends raw before/after photos
- Autoposter creates a branded split-image graphic (before | after)
- Caption generated with context: "Another Lake Nona AC install complete. This family was running a 15 year old unit that couldn't keep up. Now they're cool and saving 30% on energy."
- Posted to both Facebook and Instagram

### 3. MakeUGC Street Interview Videos

Professional-looking street interview videos featuring the partner's company name.

- Generated via MakeUGC platform
- Script references the partner by name: "We asked Orlando residents: what's the first thing you check when your AC stops working?"
- Partner branding in lower third/outro
- 2-3 videos per month per partner

### 4. HeyGen Talking Head Videos

AI-generated talking head videos with trade-specific tips.

- Uses Mr. George avatar or a partner-approved avatar
- Script pulls from the same tip engine but in video format
- Voice: David Castlemore (English) or appropriate multilingual voice
- 2-3 videos per week
- Branded intro/outro with partner name and phone number

### 5. Seasonal Content

Timely content tied to Florida seasons and events.

| Season/Event | HVAC Content | Plumbing Content |
|---|---|---|
| Hurricane season (Jun-Nov) | "Is your AC ready for storm season? Here's your pre-hurricane checklist." | "How to shut off your water main before a hurricane." |
| Summer peak (Jun-Sep) | "Why your bill spikes in July and how to fight it." | "Summer irrigation leaks: what to watch for." |
| Winter (Dec-Feb) | "Heat pump not switching to heat mode? Here's why." | "Pipe freeze prevention for Central Florida cold snaps." |
| Spring (Mar-May) | "Pre-summer AC tune up: what a tech actually checks." | "Spring plumbing inspection checklist." |
| Back to school | "Set it and forget it: programmable thermostat tips for busy families." | "Kids back in school? Time to fix that running toilet." |

### 6. Customer Testimonial Graphics

Automated pipeline from Google reviews to social posts.

- Monitor partner's Google Business Profile for new 5-star reviews
- Extract review text and customer first name
- Generate a branded testimonial graphic (quote + stars + partner logo)
- Post with caption: "Thank you [Name]! Reviews like this are why we do what we do."

### 7. Neighborhood Targeted Posts

Hyper-local content that builds relevance in specific areas.

**Example:** "Lake Nona homeowners, here's why your AC bill spikes in July. Those newer builds in Laureate Park have great insulation but undersized returns. If your upstairs is 5 degrees warmer than downstairs, that's why."

- Pulls from partner's `targetNeighborhoods` config
- Rotates neighborhoods weekly
- References local landmarks, developments, and common housing stock
- Drives local SEO and community engagement

## n8n Workflows Per Partner

### 1. Content Generation Workflow

**Trigger:** Daily at 06:00 AM  
**Steps:**
1. Load partner config
2. Determine today's content mix (tip day, video day, testimonial day, etc.)
3. Call GPT to generate post copy with partner brand voice
4. Call image gen engine for visual assets
5. Queue content for posting at scheduled times

### 2. Posting Schedule Workflow

**Trigger:** Three times daily per partner config  
**Schedule:**
- **Morning (8:00 AM):** Tips and educational content
- **Afternoon (1:00 PM):** Engagement posts (questions, polls, before/afters)
- **Evening (6:30 PM):** Educational content, videos, testimonials

**Steps:**
1. Pull next queued post for this time slot
2. Post to Facebook via Graph API
3. Post to Instagram via Graph API
4. Log post ID and timestamp
5. Error handling: retry once, then alert

### 3. Review to Social Pipeline

**Trigger:** Webhook from Google review monitor (every 30 min check)  
**Steps:**
1. Detect new 5-star Google review
2. Extract reviewer name and review text
3. Generate testimonial graphic via image gen engine
4. Generate caption with GPT (brand voice)
5. Queue for next available posting slot
6. Notify partner: "New 5-star review from [Name] posted to your socials!"

### 4. Engagement Monitoring Workflow

**Trigger:** Every 15 minutes  
**Steps:**
1. Check Facebook and Instagram for new comments on partner posts
2. Check for new DMs/message requests
3. Auto-respond to simple questions with templated answers (if enabled)
4. Alert partner via SMS/email for DMs requiring human response
5. Log all engagement metrics

### 5. Monthly Analytics Report

**Trigger:** 1st of each month at 9:00 AM  
**Steps:**
1. Pull all post metrics from Facebook and Instagram APIs (reach, engagement, clicks)
2. Calculate month-over-month growth
3. Identify top performing posts
4. Generate PDF report with charts
5. Email to partner with summary highlights
6. Store report in partner dashboard

## Pricing Model

**$500/month flat add-on**, available on any UpTend partner tier. One price, full package.

Includes:
- Daily AI-generated posts across Facebook + Instagram (+ Twitter if desired)
- Branded image generation via Gemini Premium (Imagen 3 / Nano Banana Pro)
- HeyGen talking head videos 2-3x/week (Mr. George or partner's face)
- Before/after content formatting
- Neighborhood targeting
- Seasonal content calendar
- Engagement monitoring via n8n
- Monthly analytics report

**Why this pricing works:**
- Typical social media agencies charge $1,500 to $3,000/mo for a single platform
- We deliver more content at higher consistency using AI
- Marginal cost per partner is low since the engine is shared
- Partners see ROI within 60 days via increased inbound calls and brand recognition

## Scaling Strategy

### One Engine, Many Partners

- **Single n8n instance** runs all partner workflows. Each workflow is parameterized by partner ID.
- **Shared image gen engine** (`image_gen.py`) renders branded graphics using partner config (logo, colors, fonts).
- **Shared content engine** (`content_bank.py`) generates copy per brand voice. Partner voice profiles are cached.
- **API rate limits** managed via a posting queue with per-account throttling.

### Adding a New Partner

1. Create partner config JSON in `partner-configs/`
2. Collect Facebook Page access token and Instagram account ID (via Meta Business Suite)
3. Set up Google review monitoring for their GBP listing
4. Clone n8n workflow template and set partner ID parameter
5. Run initial content generation to seed first week of posts
6. Activate posting schedule

**Time to onboard:** ~2 hours per partner once the system is running.

### Infrastructure

- n8n self-hosted on existing server
- Image gen via existing Stable Diffusion / DALL-E pipeline
- HeyGen API for video generation
- MakeUGC manual batch ordering (2x/month)
- Facebook/Instagram Graph API for posting
- Google Business Profile API for review monitoring
- All credentials encrypted at rest, per-partner access tokens stored in n8n credentials vault

## Future Enhancements

- **TikTok support** — add TikTok posting once partner base hits 10+
- **Nextdoor integration** — neighborhood posts on Nextdoor for hyper-local reach
- **AI comment replies** — George-powered responses to social comments
- **Ad boost automation** — auto-boost top performing organic posts with $5-10/day spend
- **Partner content approval** — optional approval queue before posting (for premium partners)
- **Cross-partner insights** — what content works best across all HVAC partners, all plumbing partners, etc.
