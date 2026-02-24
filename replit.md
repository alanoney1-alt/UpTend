# UpTend - The Home Value OS

## Overview
UpTend (trade name of uPYCK Inc.) is an AI-native platform positioned as "The Home Value OS," connecting homeowners with verified service providers (Pros) for on-demand home services. Every job is framed as a data point for Value Protection or Sustainability Impact. The platform is built around three core pillars: Protect (investment documentation), Connect (verified Pros), and Sustain (measured environmental impact). It leverages AI for demand prediction, optimized routing, ESG compliance, photo analysis, and load estimation.

## User Preferences
I prefer detailed explanations and iterative development. Ask before making major changes. Do not make changes to folder `Z` and file `Y`.

## Brand Messaging
- **Primary Tagline**: "Home intelligence. Instant service. Proven sustainability."
- **Site Mantra**: "Home Protection. Pro Empowerment. Proven Impact."
- **Three Pillars**: Protect, Connect, Sustain
- **Pro Hook**: "Stop being a 'gig worker.' Build a verified green track record."
- **Pro Benefit Statement**: "UpTend matches you with real jobs, pays you fairly, and automatically builds your verified green track record."
- **Vocabulary**: Use "verified", "transparent", "accountability", "impact" over jargon. Scrub: "disrupt", "synergy", "game-changer", "revolutionary".
- **Terminology**: Service providers = "Pros" (user-facing), "PYCKER" remains in code identifiers/routes/data-testid only
- **Legal**: "uPYCK Inc." and "uPYCK, LLC" preserved in legal documents and footer

## System Architecture

### UI/UX Decisions
- **Branding**: "UpTend" with tagline "Home intelligence. Instant service. Proven sustainability."; service providers are "Pros".
- **Color Scheme**: uPYCK Orange (#F47C20), Deep Purple (#3B1D5A), and White, with dark mode support.
- **Typography**: Inter for body text, Space Grotesk for headings.
- **Components**: Utilizes shadcn/ui for a consistent and modern design system.

### Technical Implementations
- **Frontend**: React, TypeScript, and Vite, styled with Tailwind CSS; uses TanStack Query for data fetching and Wouter for routing.
- **Backend**: Express.js with WebSockets for real-time communication.
- **Database**: PostgreSQL with Drizzle ORM.
- **Mobile Strategy**: Implemented as a Progressive Web App (PWA) and deployable on iOS/Android via Capacitor.
- **AI Integration**: Leverages OpenAI GPT for advanced features like photo analysis, load estimation, item classification, sentiment analysis, and dispute resolution.
- **Smart Matching & Dispatch**: Algorithms consider PYCKER ratings, proximity, capacity, and language, featuring a "PYCKER Swiper" and "Bounty Hunter Mode." Includes a Carbon-Intelligent Dispatcher for job batching.
- **Dynamic Pricing Engine**: Calculates prices based on service type, load size, distance, and specific item characteristics.
- **Instant Home DNA Scan (Estimator)**: A no-login address-based estimator in the Hero section that provides instant estimates for Essential 5 services and shows protected value potential. After results appear, a Florida "Green-Light" pre-storm checklist modal auto-appears with urgency-based CTAs. Both feed into the auth redirect flow with address/bundle params.
- **Customer Booking Flow**: A multi-step wizard incorporating live price quotes, à la carte item selection, and AI photo analysis.
- **PYCKER On-Site Verification**: PYCKERs use AI photo analysis to verify items and finalize pricing.
- **Two-Tier PYCKER System**: "Verified Pro" (80% payout) and "Independent" (75% payout) with a career ladder for progression.
- **ESG & Sustainability**: Generates Environmental Impact Certificates per job, detailing disposal breakdown and carbon footprint, with automatic carbon offset purchases. Features a Circular Economy Agent for item classification (donation, recycling, resale).
- **AI Safety Co-Pilot**: Analyzes job photos for hazardous materials and provides safety instructions.
- **Agentic Brain**: Comprises an Instant Triage Agent, Smart Dispatch, Revenue Protector (sentiment analysis), and Conflict Shield (damage dispute resolution).
- **Compliance & Security**: Includes SOC 2 audit logging, PII masking, and a Legal Modal for contractor agreements.
- **Growth & Engagement Features**: Offers an Insurance Vault for AI-powered home inventory, a Reseller Marketplace, Smart Lock Integration, Carbon Offset Upsell, and a Green Guarantee Rebate System.
- **Vision Vault**: Collects ground truth data for proprietary AI model training.
- **Field Audit Protocol**: Ensures workers verify job scope on arrival, with quick-add options for common extras and digital handshake for price locking.
- **Pricing Transparency**: Emphasizes "Visual Quote" framing and explains potential price adjustments via a "Price Promise" modal.
- **Ghost Buster Protocol**: Anti-leakage system with GPS geofencing, risk scoring, and auto-ban thresholds for off-platform transaction attempts.
- **SafeComms Privacy Firewall**: In-app chat with phone number redaction and keyword detection to prevent leakage.
- **Insurance Gate**: Dual-mode insurance options (uPYCK blanket coverage or external API integration).
- **AI Agent Manifest**: Supports AI-to-AI booking via an OpenAI plugin manifest.
- **Property History ("Carfax for Homes")**: Address-centric data model tracking property maintenance, generating transferable reports, and contributing to a "Home Score."
- **Home Score (FICO for Homes)**: A gamified 0-850 property scoring system based on maintenance, documentation, and safety.
- **Commitment Credit Consultations**: Master-level haulers conduct home health assessments, with consultation fees convertible to job credits.
- **White Glove Auto-Inventory**: GPT-4o Vision analyzes photos to catalog home items with valuations.
- **Deferred Jobs with Nudge Engine**: Automatically creates and sends reminders for recommended maintenance tasks.
- **Unlicensed 5 Service Verticals**: Expands service offerings to include pressure washing, gutter cleaning, moving labor, light demolition, and home consultation, supported by a polymorphic pricing engine.
- **PYCKER Academy**: In-app certification for role-based training and skill validation.
- **Unified Auth Page**: A single login page with separate tabs for Homeowners and PYCKERs.
- **PWA Install Banner**: Role-based prompts for app installation.
- **Universal Job Wizard**: A four-phase, full-screen wizard guiding PYCKERs through job execution from "En Route" to "Completion," including photo uploads and safety code verification.
- **Customer Dashboard ("Home OS")**: A customer-facing dashboard displaying Home Score, Digital Inventory, active job tracking, and job history.
- **Rookie Mode**: First 3 jobs require manual review before payout release.
- **Video Inventory Scanner**: Enables video-based room scanning for item detection and volume estimation.
- **AI Resale Generator**: AI-powered tool for generating marketplace listings from item photos.
- **Manifest Scanner**: Video recording with audio narration during loading for liability and chain of custody.
- **Digital Handshake**: Canvas-based signature capture for job completion verification.
- **App Simulator**: Gamified training module for new PYCKERs.
- **Bilingual Engine**: Supports English and Spanish with auto-detection and manual toggle.
- **Hauler Earnings Page**: Displays detailed earnings and job history for PYCKERs.

## External Dependencies
- **Stripe**: Payment processing and Payouts (Stripe Connect).
- **Replit Auth**: User authentication system.
- **OpenAI GPT**: AI models for various functionalities (e.g., GPT-4o Vision).
- **WebSocket (ws library)**: Real-time communication.
- **Browser Geolocation API**: PYCKER tracking.