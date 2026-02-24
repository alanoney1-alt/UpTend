import { Shield } from "lucide-react";
import { LegalPage } from "./legal/legal-page";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" icon={<Shield className="w-12 h-12" />} lastUpdated="February 19, 2026">
      <div dangerouslySetInnerHTML={{ __html: `

<strong>UPYCK, Inc. d/b/a UpTend — Privacy Policy</strong>
<strong>Effective Date: February 19, 2026</strong>

<p>This Privacy Policy describes how UPYCK, Inc. d/b/a UpTend ("UpTend," "we," "us," or "our") collects, uses, shares, and protects your personal information when you use our platform at uptendapp.com and our mobile applications (collectively, the "Platform"). By using the Platform, you agree to the practices described in this Privacy Policy.</p>

<h2>1. Information We Collect</h2>

<h3>1.1 Information You Provide</h3>

<strong>Account Information:</strong>
<ul>
<li>Name, email address, phone number, mailing address or ZIP code</li>
<li>Password (stored in hashed form)</li>
<li>Profile photo (optional)</li>
<li>For Pros: business name, LLC documentation, insurance certificates, licenses, tax identification (EIN or SSN for 1099 purposes), bank account information for payouts, FAA Part 107 certification (if applicable)</li>
<li>For Business Accounts: company name, business address, tax ID, authorized representative information, billing contact</li>
</ul>
<strong>Booking and Service Information:</strong>
<ul>
<li>Service requests, descriptions, property details, photos submitted with bookings</li>
<li>Scheduling preferences, booking history</li>
<li>Communications with Pros through the Platform messaging system</li>
<li>Ratings, reviews, and feedback</li>
</ul>
<strong>Payment Information:</strong>
<ul>
<li>Credit/debit card details, bank account information (collected and processed by Stripe — UpTend does not store full payment card numbers)</li>
<li>Billing address</li>
<li>Transaction history, refund records</li>
</ul>
<strong>AI Interaction Data:</strong>
<ul>
<li>Conversations with Mr. George AI Assistant, including questions, prompts, and descriptions</li>
<li>Photos and images submitted for Home DNA Scan analysis</li>
<li>DIY Coaching queries and interaction history</li>
<li>Home profile data passively gathered from your interactions with Mr. George (e.g., home age, known issues, maintenance history you've discussed)</li>
<li>Mr. George's audience profiling signals (communication style preferences such as senior-friendly, Gen-Z casual, busy-professional concise, or detail-oriented — used solely to adapt Mr. George's communication style to your preferences)</li>
</ul>
<strong>Communications:</strong>
<ul>
<li>Emails, chat messages, and support requests you send to us</li>
<li>Phone call records (we may record calls for quality assurance with notice)</li>
</ul>
<h3>1.2 Information Collected Automatically</h3>

<strong>Device and Technical Information:</strong>
<ul>
<li>Device type, operating system, browser type and version</li>
<li>IP address, unique device identifiers</li>
<li>App version, crash reports, performance data</li>
</ul>
<strong>Usage Information:</strong>
<ul>
<li>Pages visited, features used, time spent on pages</li>
<li>Search queries within the Platform</li>
<li>Clickstream data, referral URLs</li>
</ul>
<strong>Location Information:</strong>
<ul>
<li><strong>Customers:</strong> ZIP code or city-level location for service matching (we do not track precise Customer GPS location)</li>
<li><strong>Pros:</strong> Precise GPS location during active jobs only (from job acceptance to job completion), used to provide Customers with arrival estimates and to verify job completion. Pros may disable location sharing when not on active jobs.</li>
</ul>
<strong>Cookie and Tracking Data:</strong>
<ul>
<li>See our Cookie Policy for details on cookies and similar technologies</li>
</ul>
<h3>1.3 Information from Third Parties</h3>

<ul>
<li><strong>Stripe:</strong> Payment confirmation, fraud signals</li>
<li><strong>Checkr:</strong> Background check results (where applicable)</li>
<li><strong>Public databases:</strong> Business registration verification, license verification</li>
<li><strong>Amazon Associates:</strong> Aggregate purchase and commission data (no individual purchase details)</li>
</ul>
<h2>2. How We Use Your Information</h2>

<p>We use your information for the following purposes:</p>

<h3>2.1 Platform Operations</h3>
<ul>
<li>Creating and managing your account</li>
<li>Facilitating service bookings and matching Customers with Pros</li>
<li>Processing payments, refunds, and payouts</li>
<li>Sending transactional communications (booking confirmations, receipts, service updates)</li>
<li>Providing customer support</li>
</ul>
<h3>2.2 AI Features</h3>
<ul>
<li>Powering Mr. George AI Assistant responses</li>
<li>Performing Home DNA Scan analysis</li>
<li>Providing DIY Coaching</li>
<li>Adapting Mr. George's communication style to your preferences (audience profiling)</li>
<li>Building and maintaining your home profile for personalized recommendations</li>
</ul>
<h3>2.3 AI Training and Improvement</h3>
<ul>
<li>With your consent, using your AI interactions (conversations with Mr. George, submitted photos, queries) to improve our AI features, train models, and enhance accuracy of estimates and recommendations</li>
<li>AI training data is anonymized and aggregated where possible</li>
<li><strong>You may opt out of AI training data usage through your account settings without affecting your ability to use AI features</strong></li>
</ul>
<h3>2.4 Safety and Trust</h3>
<ul>
<li>Verifying Pro credentials, insurance, and licenses</li>
<li>Conducting background checks (where applicable)</li>
<li>Detecting and preventing fraud, abuse, and policy violations</li>
<li>Ensuring compliance with our Terms of Service and Acceptable Use Policy</li>
</ul>
<h3>2.5 Communications</h3>
<ul>
<li>Sending service-related SMS messages via Twilio</li>
<li>Sending emails via SendGrid</li>
<li>Sending push notifications (if enabled)</li>
<li>Marketing communications (with consent and opt-out)</li>
</ul>
<h3>2.6 Analytics and Improvement</h3>
<ul>
<li>Understanding how users interact with the Platform</li>
<li>Improving features, performance, and user experience</li>
<li>Conducting research and analysis</li>
</ul>
<h3>2.7 Legal and Compliance</h3>
<ul>
<li>Complying with legal obligations, tax reporting (1099s for Pros), and regulatory requirements</li>
<li>Responding to legal process (subpoenas, court orders)</li>
<li>Protecting our rights, property, and safety</li>
</ul>
<h2>3. How We Share Your Information</h2>

<h3>3.1 With Pros (When You Book a Service)</h3>
<p>When you book a service, we share your first name, service address, phone number, service details, and any photos or notes you provided with the assigned Pro. We do not share your payment information with Pros.</p>

<h3>3.2 With Customers (When You Accept a Job as a Pro)</h3>
<p>When a Pro accepts a booking, we share the Pro's first name, profile photo, rating, verification status, and real-time location (during active jobs) with the Customer.</p>

<h3>3.3 Service Providers</h3>
<p>We share information with third-party service providers who perform services on our behalf:</p>

<p>| Provider | Purpose | Data Shared |</p>
<p>|---|---|---|</p>
<p>| <strong>Stripe</strong> | Payment processing, BNPL | Payment details, transaction data |</p>
<p>| <strong>Twilio</strong> | SMS/voice communications | Phone numbers, message content |</p>
<p>| <strong>SendGrid</strong> | Email delivery | Email addresses, email content |</p>
<p>| <strong>Anthropic (Claude)</strong> | Mr. George AI Assistant | Conversation content, user queries |</p>
<p>| <strong>OpenAI (GPT-5.2)</strong> | Photo analysis, Home DNA Scan | Photos, image data, analysis queries |</p>
<p>| <strong>Railway</strong> | Platform hosting | All platform data (encrypted in transit and at rest) |</p>
<p>| <strong>Supabase</strong> | Database services | All platform data (encrypted at rest) |</p>
<p>| <strong>Checkr</strong> | Background checks | Pro name, SSN, date of birth (with Pro consent) |</p>
<p>| <strong>Amazon Associates</strong> | Affiliate tracking | Affiliate link click data, cookies |</p>

<h3>3.4 Legal Requirements</h3>
<p>We may disclose information if required by law, regulation, legal process, or governmental request, or if we believe disclosure is necessary to protect our rights, your safety, or the safety of others, or to detect, prevent, or address fraud or security issues.</p>

<h3>3.5 Business Transfers</h3>
<p>If UpTend is involved in a merger, acquisition, bankruptcy, or sale of all or a portion of its assets, your information may be transferred as part of that transaction. We will notify you of any such change and any choices you may have regarding your information.</p>

<h3>3.6 With Your Consent</h3>
<p>We may share your information in other ways if you specifically consent.</p>

<h3>3.7 Aggregated/De-Identified Data</h3>
<p>We may share aggregated or de-identified data that cannot reasonably be used to identify you for any purpose, including research, analytics, and marketing.</p>

<h2>4. Cookies and Tracking Technologies</h2>

<p>We use cookies and similar technologies on the Platform. For full details, see our standalone Cookie Policy. Categories include:</p>

<ul>
<li><strong>Essential Cookies</strong> — Required for Platform functionality (authentication, session management, security)</li>
<li><strong>Analytics Cookies</strong> — Help us understand usage patterns and improve the Platform</li>
<li><strong>Marketing Cookies</strong> — Used to deliver relevant advertising and measure campaign effectiveness</li>
<li><strong>Affiliate Cookies</strong> — Track purchases made through affiliate links (e.g., Amazon Associates) to attribute commissions</li>
</ul>
<p>You can manage cookie preferences through the cookie consent mechanism on our Platform and through your browser settings.</p>

<h2>5. Location Tracking</h2>

<h3>5.1 Customer Location</h3>
<p>We collect Customer location at the ZIP code or city level only, based on the service address provided. We do not track Customers' precise GPS location.</p>

<h3>5.2 Pro Location</h3>
<p>With Pro consent, we collect precise GPS location during active jobs (from job acceptance to job completion) for the following purposes:</p>
<ul>
<li>Providing Customers with real-time arrival estimates</li>
<li>Verifying job site arrival and departure</li>
<li>Route optimization</li>
<li>Safety and dispute resolution</li>
</ul>
<p>Pros may disable location sharing when not on active jobs through their device or app settings. Disabling location during active jobs may result in reduced booking eligibility.</p>

<h2>6. Data Retention</h2>

<p>We retain your information for as long as necessary to fulfill the purposes described in this Privacy Policy, unless a longer retention period is required by law.</p>

<p>| Data Type | Retention Period |</p>
<p>|---|---|</p>
<p>| Account information | Duration of account + 3 years after deletion |</p>
<p>| Booking and transaction records | 7 years (tax and legal compliance) |</p>
<p>| AI conversation history | 2 years (or until you delete it) |</p>
<p>| Home DNA Scan photos | 3 years (or until you delete them) |</p>
<p>| Pro GPS location data | 90 days after job completion |</p>
<p>| Payment card data | Retained by Stripe per their policies; not stored by UpTend |</p>
<p>| Background check results | Duration of Pro's active account |</p>
<p>| Support communications | 3 years |</p>
<p>| Marketing preferences | Duration of account |</p>

<p>You may request deletion of your data as described in Section 8.</p>

<h2>7. Data Security</h2>

<p>We implement reasonable administrative, technical, and physical security measures to protect your information, including:</p>

<ul>
<li>Encryption of data in transit (TLS 1.2+) and at rest</li>
<li>Secure authentication with hashed passwords</li>
<li>Access controls limiting employee access to personal data on a need-to-know basis</li>
<li>Regular security assessments and monitoring</li>
<li>Secure cloud infrastructure (Railway, Supabase)</li>
</ul>
<p>No method of transmission or storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.</p>

<h2>8. Your Privacy Rights</h2>

<h3>8.1 All Users</h3>

<p>All users may:</p>
<ul>
<li><strong>Access</strong> your personal information by contacting privacy@uptendapp.com</li>
<li><strong>Correct</strong> inaccurate information through your account settings or by contacting us</li>
<li><strong>Delete</strong> your account and associated data by contacting privacy@uptendapp.com</li>
<li><strong>Opt out</strong> of marketing communications (email unsubscribe, SMS STOP, push notification settings)</li>
<li><strong>Opt out</strong> of AI training data usage through account settings</li>
</ul>
<p>We will respond to access and deletion requests within <strong>thirty (30) days</strong>.</p>

<h3>8.2 California Residents (CCPA/CPRA)</h3>

<p>If you are a California resident, you have the following additional rights under the California Consumer Privacy Act, as amended by the California Privacy Rights Act:</p>

<ul>
<li><strong>Right to Know:</strong> You may request the categories and specific pieces of personal information we have collected about you, the sources, purposes, and categories of third parties with whom we share it.</li>
<li><strong>Right to Delete:</strong> You may request deletion of your personal information, subject to exceptions (e.g., legal compliance, completing transactions).</li>
<li><strong>Right to Correct:</strong> You may request correction of inaccurate personal information.</li>
<li><strong>Right to Opt Out of Sale/Sharing:</strong> UpTend does not sell personal information. We do not share personal information for cross-context behavioral advertising as defined under the CPRA.</li>
<li><strong>Right to Limit Use of Sensitive Personal Information:</strong> You may request that we limit use of sensitive personal information to purposes necessary to provide the services.</li>
<li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising any CCPA/CPRA rights.</li>
</ul>
<p>To exercise these rights, contact privacy@uptendapp.com or call (407) 338-3342. We will verify your identity before processing requests. You may designate an authorized agent to make requests on your behalf.</p>

<strong>Categories of Personal Information Collected (CCPA Categories):</strong>
<ul>
<li>Identifiers (name, email, phone, address)</li>
<li>Customer records (payment information, service history)</li>
<li>Commercial information (booking history, transaction records)</li>
<li>Internet/electronic activity (usage data, cookies, device information)</li>
<li>Geolocation data (Pro GPS during jobs, Customer ZIP)</li>
<li>Professional/employment information (Pro credentials, licenses)</li>
<li>Inferences (audience profiling, home profile)</li>
<li>Sensitive personal information (account login credentials, precise geolocation of Pros)</li>
</ul>
<h3>8.3 Virginia Residents (VCDPA)</h3>

<p>Virginia residents have the right to access, correct, delete, and obtain a copy of their personal data, and to opt out of the processing of personal data for targeted advertising, sale, or profiling. To exercise these rights, contact privacy@uptendapp.com. If we decline your request, you may appeal by contacting us with the subject line "VCDPA Appeal."</p>

<h3>8.4 Colorado Residents (CPA)</h3>

<p>Colorado residents have similar rights to access, correct, delete, and opt out of targeted advertising, sale, or profiling. To exercise these rights, contact privacy@uptendapp.com. You may appeal a declined request by contacting us.</p>

<h3>8.5 Connecticut Residents (CTDPA)</h3>

<p>Connecticut residents have the right to access, correct, delete, obtain a copy of, and opt out of the processing of personal data for targeted advertising, sale, or profiling. Contact privacy@uptendapp.com to exercise these rights.</p>

<h3>8.6 Utah Residents (UCPA)</h3>

<p>Utah residents have the right to access and delete their personal data and to opt out of the sale of personal data or targeted advertising. Contact privacy@uptendapp.com.</p>

<h3>8.7 GDPR (European Economic Area)</h3>

<p>UpTend's services are currently offered within the United States. If you access the Platform from the European Economic Area, United Kingdom, or Switzerland, the General Data Protection Regulation (GDPR) or UK GDPR may apply. We process data based on contractual necessity, legitimate interests, and consent. You may have rights to access, rectification, erasure, restriction, data portability, and objection. Contact privacy@uptendapp.com to exercise these rights. If you believe your rights have been violated, you may lodge a complaint with your local supervisory authority.</p>

<h2>9. Children's Privacy</h2>

<p>The Platform is not directed to individuals under the age of eighteen (18). We do not knowingly collect personal information from anyone under 18. If we learn that we have collected information from a child under 18, we will delete it promptly. If you believe a child under 18 has provided us with personal information, contact privacy@uptendapp.com.</p>

<h2>10. Do Not Track</h2>

<p>Some browsers offer a "Do Not Track" ("DNT") signal. There is no industry-standard protocol for DNT. Currently, the Platform does not respond to DNT signals. We will update this policy if a uniform standard is established.</p>

<h2>11. Smart Home and Vehicle Data (Planned)</h2>

<p>UpTend may in the future offer integrations with smart home platforms (e.g., Nest, Ring) via OAuth and vehicle maintenance features. When these features become available:</p>

<ul>
<li><strong>Smart Home Data:</strong> Device status, sensor data, and alerts from connected devices will be used solely to provide proactive home maintenance recommendations and will be stored securely.</li>
<li><strong>Vehicle Data:</strong> Vehicle make, model, year, mileage, and maintenance history will be used to provide maintenance reminders and service recommendations.</li>
</ul>
<p>We will update this Privacy Policy before launching these features to provide specific details on data collection, use, and sharing.</p>

<h2>12. Changes to This Privacy Policy</h2>

<p>We may update this Privacy Policy from time to time. We will notify you of material changes via email or in-app notification at least thirty (30) days before the changes take effect. The updated policy will be posted on the Platform with the revised effective date. Your continued use after the effective date constitutes acceptance.</p>

<h2>13. Contact Us</h2>

<strong>Privacy Inquiries:</strong>
<p>UPYCK, Inc. d/b/a UpTend</p>
<p>Orlando, FL 32801</p>
<p>Email: privacy@uptendapp.com</p>
<p>Phone: (407) 338-3342</p>
` }} />
    </LegalPage>
  );
}
