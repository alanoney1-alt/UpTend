# Partner Social Media Onboarding System

## Overview
When a new partner joins UpTend, we set up their complete digital presence. Social media is included in every plan, not an add-on.

## Onboarding Checklist (Per Partner)

### Day 1: Account Setup
- [ ] Create Facebook Business Page (via Alan's Meta Business Suite)
  - Page name: [Partner Company Name]
  - Category: Match their trade (HVAC Contractor, Junk Removal, etc.)
  - Phone: (855) 901-2072 (UpTend number)
  - Website: uptendapp.com/partners/[slug]
  - About: Professional description with Orlando/service area focus
  - Profile photo: Partner's logo (they provide) or UpTend-generated brand
  - Cover photo: Real job photo or branded template
- [ ] Create Instagram Business Account (linked to FB page)
  - Username: @[partner-brand-name]
  - Bio: "[Service] in Orlando Metro. Book through UpTend. uptendapp.com/partners/[slug]"
- [ ] Add partner to PARTNER_CONFIGS in client/src/config/partner-configs.ts
- [ ] Create partner landing page at /partners/[slug]
- [ ] Add to sitemap.xml and llms.txt

### Day 1: Content Pipeline Setup
- [ ] Request 5-10 real job photos/videos from partner
- [ ] Set up photo submission method (email, text, or shared album)
- [ ] Create content calendar template (3 posts/week)
- [ ] Add partner to auto-poster rotation

### Week 1: Initial Content Push
- [ ] Post 3 real job photos with captions (before/after if possible)
- [ ] Post 1 "Meet the Team" or "About Us" intro post
- [ ] Post 1 tip/educational post related to their service
- [ ] Cross-post all to Instagram

### Ongoing (Weekly)
- [ ] Partner sends 5-10 photos/videos from real jobs
- [ ] UpTend posts 3/week to their FB + IG pages
- [ ] Content mix: 60% real job photos, 20% tips/education, 20% brand building
- [ ] Monitor and respond to comments on their posts
- [ ] Track engagement metrics in partner dashboard

## Content Rules

### Priority Order
1. **Real photos/videos from actual jobs** (ALWAYS first choice)
2. **AI-generated content** (only when no real photos available)
3. **Never use fake job photos**

### Voice
- Professional but approachable
- Service-specific expertise
- Orlando/local focus
- NEVER mention AI, apps, or platforms
- All posts say "Book through UpTend" or link to uptendapp.com/partners/[slug]

### Posting Schedule
- Monday: Before/after job photo
- Wednesday: Tip or educational content
- Friday: Customer win or team spotlight

## Competitor Intelligence (Per Partner)
- Identify top 3 local competitors for each partner's service
- Scrape their FB/IG for highest engagement posts weekly
- Mirror successful content types with partner's real photos
- Track what post formats work: carousel, video, single image, text-only

## Auto-Reply (Per Partner)
- When someone in a local FB group asks for [partner's service type]:
  - Reply pointing to uptendapp.com/partners/[slug]
  - Use partner's brand name in reply
  - Be helpful, not spammy

## Photo Submission System
Partners text/email photos to a designated number/address.
Photos stored in Cloudflare R2 bucket (uptendphotos).
Tagged by partner slug and date for easy retrieval.

## Accounts & Access
- All social accounts created under Alan's Meta Business Suite
- UpTend has Page Admin access to every partner's pages
- If partner leaves, pages stay with UpTend (per platform ownership rules)
- Partner gets Page Editor access (can see but not delete)

## Metrics Tracked (Real Data Only)
- Post reach and impressions
- Engagement rate (likes + comments + shares / reach)
- Click-throughs to uptendapp.com/partners/[slug]
- Follower growth
- Top performing post types
- All shown on partner's pro dashboard at /pro/[slug]
