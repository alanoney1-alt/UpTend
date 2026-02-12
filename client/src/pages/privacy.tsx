import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Shield } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background" data-testid="page-privacy">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Logo className="w-8 h-8" textClassName="text-xl" />
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Shield className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last Updated: January 17, 2026
          </p>
        </div>

        <Card className="p-8 prose prose-gray dark:prose-invert max-w-none">
          <h2>Introduction</h2>
          <p>
            Welcome to UpTend ("we," "us," "our," or "UpTend"). We are committed to protecting your privacy and being transparent about how we collect, use, and share your information.
          </p>
          <p>This Privacy Policy explains:</p>
          <ul>
            <li>What information we collect</li>
            <li>How we use your information</li>
            <li>When we share your information</li>
            <li>Your privacy rights and choices</li>
            <li>How we protect your information</li>
          </ul>
          <p><strong>By using the UpTend platform at www.uptend.app (the "Platform"), you agree to this Privacy Policy.</strong></p>

          <h2>1. Information We Collect</h2>

          <h3>1.1 Information You Provide</h3>
          <p><strong>Account Information:</strong></p>
          <ul>
            <li>Name (first and last)</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Password (encrypted)</li>
            <li>Profile photo (optional)</li>
            <li>User role (customer, Pro, admin)</li>
          </ul>

          <p><strong>Customer Booking Information:</strong></p>
          <ul>
            <li>Service address (pickup location)</li>
            <li>Service details (items to remove, job description)</li>
            <li>Photos of items</li>
            <li>Preferred language</li>
            <li>Payment information (processed by Stripe)</li>
            <li>Special instructions or notes</li>
          </ul>

          <p><strong>Pro Information:</strong></p>
          <ul>
            <li>Business name</li>
            <li>Service area (ZIP codes)</li>
            <li>Vehicle information (type, make, model, license plate, photos)</li>
            <li>Driver's license information</li>
            <li>Insurance information (Verified Pros)</li>
            <li>Business license information</li>
            <li>Background check consent and results</li>
            <li>Bank account information (for payouts via Stripe)</li>
            <li>Tax information (W-9 for 1099 reporting)</li>
            <li>Incident payment method (card on file for accountability)</li>
          </ul>

          <p><strong>Communications:</strong></p>
          <ul>
            <li>Messages sent through the Platform</li>
            <li>Customer service inquiries</li>
            <li>Reviews and ratings</li>
            <li>Feedback and survey responses</li>
          </ul>

          <h3>1.2 Information Automatically Collected</h3>
          <p><strong>Device and Usage Information:</strong></p>
          <ul>
            <li>IP address</li>
            <li>Device type (phone, tablet, computer)</li>
            <li>Operating system (iOS, Android, Windows, etc.)</li>
            <li>Browser type and version</li>
            <li>Mobile device identifiers</li>
            <li>Pages viewed and features used</li>
            <li>Time and date of visits</li>
            <li>Referring website or app</li>
            <li>Crash reports and error logs</li>
          </ul>

          <p><strong>Location Information:</strong></p>
          <ul>
            <li><strong>Customers:</strong> ZIP code for service area verification</li>
            <li><strong>Pros:</strong> Real-time GPS location during active jobs (for tracking and navigation)</li>
            <li><strong>Both:</strong> Approximate location based on IP address</li>
          </ul>

          <p><strong>Cookies and Similar Technologies:</strong></p>
          <ul>
            <li>Session cookies (for login authentication)</li>
            <li>Preference cookies (remember your settings)</li>
            <li>Analytics cookies (understand Platform usage)</li>
            <li>Advertising cookies (show relevant ads)</li>
          </ul>

          <h3>1.3 Information from Third Parties</h3>
          <p><strong>Background Check Providers:</strong></p>
          <ul>
            <li>Criminal history</li>
            <li>Sex offender registry status</li>
            <li>Motor vehicle records (for Pros)</li>
          </ul>

          <p><strong>Payment Processors (Stripe):</strong></p>
          <ul>
            <li>Payment transaction details</li>
            <li>Card type and last 4 digits (for display only)</li>
            <li>Payment success/failure status</li>
          </ul>

          <p><strong>Social Media:</strong></p>
          <ul>
            <li>If you sign in with Facebook or Google, we receive your basic profile information (name, email, photo)</li>
          </ul>

          <p><strong>Analytics Providers:</strong></p>
          <ul>
            <li>Aggregated usage statistics</li>
            <li>Performance metrics</li>
            <li>Conversion tracking data</li>
          </ul>

          <h2>2. How We Use Your Information</h2>

          <h3>2.1 To Provide Platform Services</h3>
          <ul>
            <li>Create and manage your account</li>
            <li>Process bookings and payments</li>
            <li>Match Customers with Pros</li>
            <li>Provide real-time GPS tracking</li>
            <li>Send booking confirmations and updates</li>
            <li>Enable communication between Customers and Pros</li>
            <li>Process Green Verified disposal rebates</li>
            <li>Calculate loyalty points and rewards</li>
            <li>Generate environmental impact certificates</li>
          </ul>

          <h3>2.2 To Improve Our Services</h3>
          <ul>
            <li>Analyze Platform usage and user behavior</li>
            <li>Develop new features and improvements</li>
            <li>Conduct AI-powered photo analysis for load estimation</li>
            <li>Optimize matching algorithms</li>
            <li>Personalize your experience</li>
            <li>Conduct research and analytics</li>
            <li>Test new features (A/B testing)</li>
          </ul>

          <h3>2.3 For Safety and Security</h3>
          <ul>
            <li>Verify identities and prevent fraud</li>
            <li>Conduct background checks on Pros</li>
            <li>Detect and prevent abuse or violations</li>
            <li>Enforce our Terms of Service</li>
            <li>Protect against security threats</li>
            <li>Investigate and resolve disputes</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h3>2.4 For Communication</h3>
          <ul>
            <li>Send booking confirmations and receipts</li>
            <li>Notify you of Pro arrival and job status</li>
            <li>Send account-related notifications</li>
            <li>Respond to customer support inquiries</li>
            <li>Send marketing communications (with your consent)</li>
            <li>Conduct surveys and request feedback</li>
            <li>Send important updates about the Platform</li>
          </ul>

          <h3>2.5 For Legal and Compliance</h3>
          <ul>
            <li>Comply with laws and regulations</li>
            <li>Respond to legal requests and court orders</li>
            <li>Protect our rights and property</li>
            <li>Enforce our Terms of Service</li>
            <li>Process tax reporting (1099s for Pros)</li>
            <li>Maintain records as required by law</li>
          </ul>

          <h2>3. How We Share Your Information</h2>

          <h3>3.1 With Pros (When You Book)</h3>
          <p>When you book a service, we share with the matched Pro:</p>
          <ul>
            <li>Your name and phone number (after they accept the job)</li>
            <li>Service address</li>
            <li>Job details and photos</li>
            <li>Real-time location (if you enable tracking)</li>
            <li>Your rating and review history (if applicable)</li>
          </ul>
          <p><strong>Note:</strong> Phone numbers are masked until Pro accepts to prevent spam.</p>

          <h3>3.2 With Customers (For Pros)</h3>
          <p>When a Pro accepts a job, we share with the Customer:</p>
          <ul>
            <li>Pro name and company name</li>
            <li>Phone number</li>
            <li>Vehicle information</li>
            <li>Photo and bio</li>
            <li>Rating and reviews</li>
            <li>Real-time GPS location during active job</li>
            <li>Pro tier (Verified Pro or Independent)</li>
            <li>Insurance status (for Verified Pros)</li>
          </ul>

          <h3>3.3 With Service Providers</h3>
          <p>We share information with third-party service providers who help us operate the Platform:</p>
          <p><strong>Stripe (Payment Processing):</strong></p>
          <ul>
            <li>Name, email, payment information</li>
            <li>Transaction amounts and dates</li>
            <li>Bank account information (Pros)</li>
          </ul>
          <p><strong>Twilio (SMS Notifications):</strong></p>
          <ul>
            <li>Phone numbers</li>
            <li>Message content (booking confirmations, alerts)</li>
          </ul>
          <p><strong>SendGrid (Email Communications):</strong></p>
          <ul>
            <li>Email addresses</li>
            <li>Name</li>
            <li>Email content (confirmations, receipts, marketing)</li>
          </ul>
          <p><strong>Background Check Providers:</strong></p>
          <ul>
            <li>Name, date of birth, Social Security number</li>
            <li>Driver's license information</li>
            <li>Address history</li>
          </ul>
          <p><strong>Cloud Hosting (Replit/AWS):</strong></p>
          <ul>
            <li>All data stored on Platform infrastructure</li>
          </ul>
          <p><strong>Analytics Providers (Google Analytics):</strong></p>
          <ul>
            <li>Device and usage information</li>
            <li>Aggregated, anonymized data</li>
          </ul>
          <p><strong>OpenAI (AI Services):</strong></p>
          <ul>
            <li>Photos of items (for load estimation)</li>
            <li>Photos of disposal receipts (for Green Verified validation)</li>
          </ul>

          <h3>3.4 For Legal Reasons</h3>
          <p>We may share your information:</p>
          <ul>
            <li>To comply with laws, regulations, or legal process</li>
            <li>To respond to government or law enforcement requests</li>
            <li>To protect the rights, property, or safety of UpTend, users, or the public</li>
            <li>To enforce our Terms of Service</li>
            <li>In connection with legal proceedings or investigations</li>
          </ul>

          <h3>3.5 Business Transfers</h3>
          <p>If UpTend is involved in a merger, acquisition, sale of assets, or bankruptcy, your information may be transferred to the successor entity.</p>

          <h3>3.6 With Your Consent</h3>
          <p>We may share your information for other purposes with your explicit consent.</p>

          <h3>3.7 Public Information</h3>
          <p>The following information is publicly visible on the Platform:</p>
          <ul>
            <li>Pro profiles (name, company, photo, bio, ratings)</li>
            <li>Reviews and ratings you post</li>
            <li>Environmental certificates (with job details anonymized)</li>
          </ul>
          <p>We never publicly share:</p>
          <ul>
            <li>Email addresses</li>
            <li>Phone numbers (until job acceptance)</li>
            <li>Physical addresses</li>
            <li>Payment information</li>
            <li>Private messages</li>
          </ul>

          <h2>4. Your Privacy Rights and Choices</h2>

          <h3>4.1 Access and Update</h3>
          <p>You can access and update your information by:</p>
          <ul>
            <li>Logging into your account settings</li>
            <li>Contacting us at privacy@uptend.app</li>
          </ul>

          <h3>4.2 Delete Your Account</h3>
          <p>You can request account deletion by:</p>
          <ul>
            <li>Emailing support@uptend.app</li>
            <li>We will delete your personal information within 30 days, except:</li>
            <ul>
              <li>Transaction records (required for tax/legal compliance - 7 years)</li>
              <li>Aggregated, anonymized data</li>
              <li>Information needed for legal claims or compliance</li>
            </ul>
          </ul>

          <h3>4.3 Marketing Communications</h3>
          <p>You can opt out of marketing emails by:</p>
          <ul>
            <li>Clicking "Unsubscribe" in any marketing email</li>
            <li>Adjusting settings in your account</li>
            <li>Emailing marketing@uptend.app</li>
          </ul>
          <p><strong>Note:</strong> You will still receive transactional emails (booking confirmations, receipts, account notifications).</p>

          <h3>4.4 SMS Notifications</h3>
          <p>You can opt out of SMS notifications by:</p>
          <ul>
            <li>Replying STOP to any SMS message</li>
            <li>Adjusting settings in your account</li>
            <li>Emailing support@uptend.app</li>
          </ul>
          <p><strong>Note:</strong> Opting out may affect service delivery (e.g., Pro arrival notifications).</p>

          <h3>4.5 Location Tracking</h3>
          <p><strong>Customers:</strong> Location is used only for ZIP code verification and is not tracked in real-time.</p>
          <p><strong>Pros:</strong> Real-time GPS tracking is required during active jobs. You can:</p>
          <ul>
            <li>Disable tracking when not on a job</li>
            <li>Stop accepting jobs if you don't want to be tracked</li>
          </ul>

          <h3>4.6 Cookie Preferences</h3>
          <p>You can control cookies through:</p>
          <ul>
            <li>Browser settings (block all cookies or third-party cookies)</li>
            <li>Our cookie preference center (if available)</li>
          </ul>
          <p><strong>Note:</strong> Disabling cookies may affect Platform functionality.</p>

          <h3>4.7 Do Not Track</h3>
          <p>Our Platform does not currently respond to Do Not Track (DNT) browser signals.</p>

          <h2>5. State-Specific Privacy Rights</h2>

          <h3>5.1 California Residents (CCPA/CPRA)</h3>
          <p>If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):</p>
          <p><strong>Right to Know:</strong></p>
          <ul>
            <li>Request what personal information we collect, use, and share</li>
            <li>Request the categories of sources and purposes</li>
          </ul>
          <p><strong>Right to Delete:</strong></p>
          <ul>
            <li>Request deletion of your personal information (with exceptions)</li>
          </ul>
          <p><strong>Right to Opt-Out:</strong></p>
          <ul>
            <li>Opt out of "sale" or "sharing" of personal information</li>
            <li>Note: We do not sell personal information in the traditional sense</li>
          </ul>
          <p><strong>Right to Non-Discrimination:</strong></p>
          <ul>
            <li>We will not discriminate against you for exercising your privacy rights</li>
          </ul>
          <p><strong>Right to Correct:</strong></p>
          <ul>
            <li>Request correction of inaccurate personal information</li>
          </ul>
          <p><strong>To Exercise Your Rights:</strong></p>
          <ul>
            <li>Email: privacy@uptend.app</li>
            <li>Verify your identity (we may ask for confirming information)</li>
            <li>Response within 45 days (may extend 45 more days if needed)</li>
          </ul>

          <h3>5.2 Virginia Residents (VCDPA)</h3>
          <p>Virginia residents have similar rights under the Virginia Consumer Data Protection Act:</p>
          <ul>
            <li>Right to access personal data</li>
            <li>Right to correct inaccuracies</li>
            <li>Right to delete personal data</li>
            <li>Right to data portability</li>
            <li>Right to opt out of targeted advertising and profiling</li>
          </ul>

          <h3>5.3 Colorado, Connecticut, Utah Residents</h3>
          <p>Residents of Colorado (CPA), Connecticut (CTDPA), and Utah (UCPA) have similar rights to CCPA/VCDPA.</p>

          <p><strong>To Exercise State Privacy Rights:</strong> Email privacy@uptend.app with "State Privacy Request" in the subject line.</p>

          <h2>6. Children's Privacy</h2>
          <p>UpTend is not intended for children under 18. We do not knowingly collect information from children under 18.</p>
          <p>If we learn we have collected information from a child under 18, we will delete it immediately.</p>
          <p>If you believe a child has provided us with personal information, contact us at privacy@uptend.app.</p>

          <h2>7. Data Security</h2>
          <p>We implement reasonable security measures to protect your information:</p>
          <p><strong>Technical Safeguards:</strong></p>
          <ul>
            <li>Encryption in transit (HTTPS/TLS)</li>
            <li>Encryption at rest for sensitive data</li>
            <li>Secure password hashing (bcrypt)</li>
            <li>Payment data handled by PCI-compliant Stripe</li>
            <li>Regular security audits and updates</li>
          </ul>
          <p><strong>Organizational Safeguards:</strong></p>
          <ul>
            <li>Access controls (role-based access)</li>
            <li>Employee training on privacy and security</li>
            <li>Confidentiality agreements</li>
            <li>Incident response procedures</li>
          </ul>
          <p><strong>However:</strong></p>
          <ul>
            <li>No system is 100% secure</li>
            <li>You are responsible for protecting your password</li>
            <li>Use strong, unique passwords</li>
            <li>Enable two-factor authentication if available</li>
            <li>Report suspicious activity immediately</li>
          </ul>

          <h2>8. Cookies and Tracking Technologies</h2>
          <p>We use cookies and similar tracking technologies to enhance your experience on our platform:</p>
          <ul>
            <li><strong>Essential Cookies:</strong> Required for the site to function properly, including session management and authentication.</li>
            <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our platform, allowing us to improve our services. These collect anonymized usage data.</li>
            <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements and track campaign performance across platforms.</li>
          </ul>
          <p>You can manage your cookie preferences at any time using the cookie consent banner on our site. Essential cookies cannot be disabled as they are necessary for the platform to function. Disabling analytics or marketing cookies will not affect your ability to use our services.</p>
          <p>We may also use web beacons, pixel tags, and similar technologies to collect information about your interactions with our emails and platform.</p>

          <h2>9. Data Retention</h2>
          <p>We retain your personal information for as long as your account is active or as needed to provide services. We may retain certain information for legal compliance, dispute resolution, and enforcement of our agreements.</p>

          <h2>10. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on our platform and updating the "Last updated" date.</p>

          <h2>11. Contact Us</h2>
          <p>If you have questions or concerns about this Privacy Policy, please contact us:</p>
          <ul>
            <li>Email: privacy@uptend.app</li>
            <li>Phone: (407) 338-3342</li>
            <li>Address: Orlando, FL 32801</li>
          </ul>
        </Card>
      </main>

      <footer className="border-t py-8 mt-16">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} UpTend. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
            <Link href="/refund-policy" className="hover:text-foreground">Refund Policy</Link>
            <Link href="/faq" className="hover:text-foreground">FAQ</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
