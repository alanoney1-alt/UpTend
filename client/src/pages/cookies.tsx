import { Cookie } from "lucide-react";
import { LegalPage } from "./legal/legal-page";

export default function Cookies() {
  return (
    <LegalPage title="Cookie Policy" icon={<Cookie className="w-12 h-12" />} lastUpdated="February 19, 2026">
      <div dangerouslySetInnerHTML={{ __html: `

<strong>UPYCK, Inc. d/b/a UpTend. Cookie Policy</strong>
<strong>Effective Date: February 19, 2026</strong>

<p>This Cookie Policy explains how UPYCK, Inc. d/b/a UpTend ("UpTend," "we," "us") uses cookies and similar technologies on our Platform at uptendapp.com and our mobile applications.</p>

<h2>1. What Are Cookies?</h2>

<p>Cookies are small text files placed on your device when you visit a website. They help the website remember your preferences, understand how you use the site, and improve your experience. Similar technologies include pixels, web beacons, local storage, and device fingerprinting.</p>

<h2>2. Types of Cookies We Use</h2>

<h3>2.1 Essential Cookies</h3>

<p>These cookies are necessary for the Platform to function and cannot be disabled.</p>

<p>| Cookie | Purpose | Duration |</p>
<p>|---|---|---|</p>
<p>| Session ID | Maintains your login session | Session (deleted when browser closes) |</p>
<p>| Authentication token | Keeps you logged in | 30 days |</p>
<p>| CSRF token | Prevents cross-site request forgery | Session |</p>
<p>| Cookie consent | Remembers your cookie preferences | 12 months |</p>

<h3>2.2 Analytics Cookies</h3>

<p>These cookies help us understand how users interact with the Platform so we can improve it.</p>

<p>| Cookie | Provider | Purpose | Duration |</p>
<p>|---|---|---|---|</p>
<p>| Usage analytics | Platform analytics | Page views, feature usage, session duration | 12 months |</p>
<p>| Performance monitoring | Platform monitoring | Error tracking, load times | Session |</p>

<p>We process analytics data in aggregate form. We do not use Google Analytics.</p>

<h3>2.3 Marketing Cookies</h3>

<p>These cookies are used to deliver relevant communications and measure the effectiveness of our marketing efforts.</p>

<p>| Cookie | Purpose | Duration |</p>
<p>|---|---|---|</p>
<p>| Campaign tracking | Tracks which marketing campaign brought you to UpTend | 30 days |</p>
<p>| Referral tracking | Tracks referral sources | 30 days |</p>

<h3>2.4 Affiliate Tracking Cookies</h3>

<p>These cookies track purchases made through affiliate links so that commissions can be properly attributed.</p>

<p>| Cookie | Provider | Purpose | Duration |</p>
<p>|---|---|---|---|</p>
<p>| Amazon Associates | Amazon | Tracks qualifying purchases made through UpTend affiliate links (tag: uptend20-20) | 24 hours (Amazon's standard) |</p>
<p>| Future affiliate partners | Various | Will track qualifying purchases through respective affiliate programs | Varies by partner |</p>

<p>Affiliate cookies are placed when you click an affiliate link on our Platform or recommended by George. They do not collect personal information beyond what is necessary for purchase attribution.</p>

<h2>3. Third-Party Cookies</h2>

<p>Some cookies are placed by third-party services integrated into our Platform:</p>

<p>| Third Party | Purpose |</p>
<p>|---|---|</p>
<p>| <strong>Stripe</strong> | Payment processing, fraud prevention |</p>
<p>| <strong>Twilio</strong> | Communication delivery tracking |</p>
<p>| <strong>Amazon</strong> | Affiliate purchase tracking |</p>

<p>These third parties have their own cookie and privacy policies that govern their use of cookies.</p>

<h2>4. How to Manage Cookies</h2>

<h3>4.1 Cookie Consent Mechanism</h3>

<p>When you first visit our Platform, you will see a cookie consent banner that allows you to accept or customize your cookie preferences. You can change your preferences at any time through the "Cookie Settings" link in the Platform footer.</p>

<h3>4.2 Browser Settings</h3>

<p>Most browsers allow you to control cookies through their settings:</p>

<ul>
<li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies</li>
<li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies</li>
<li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
<li><strong>Edge:</strong> Settings → Privacy, search, and services → Cookies</li>
</ul>
<h3>4.3 Impact of Disabling Cookies</h3>

<ul>
<li><strong>Essential cookies</strong> cannot be disabled; they are required for the Platform to function</li>
<li>Disabling <strong>analytics cookies</strong> means we cannot improve the Platform based on your usage patterns</li>
<li>Disabling <strong>marketing cookies</strong> means you may see less relevant communications</li>
<li>Disabling <strong>affiliate cookies</strong> means affiliate commissions will not be tracked (this does not affect the price you pay)</li>
</ul>
<h2>5. Updates to This Cookie Policy</h2>

<p>We may update this Cookie Policy as our practices change or as new regulations require. Changes will be posted on this page with an updated effective date.</p>

<h2>6. Contact</h2>

<p>For questions about our use of cookies:</p>

<strong>Email:</strong> privacy@uptendapp.com
<strong>Phone:</strong> (407) 338-3342

` }} />
    </LegalPage>
  );
}
