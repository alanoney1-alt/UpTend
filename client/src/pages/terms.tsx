import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, FileText } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background" data-testid="page-terms">
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
          <FileText className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">
            Last Updated: January 17, 2026
          </p>
        </div>

        <Card className="p-8 prose prose-gray dark:prose-invert max-w-none">
          <h2>1. Agreement to Terms</h2>
          <p>
            Welcome to UpTend ("we," "us," or "our"). By accessing or using the UpTend platform at www.uptend.app (the "Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Platform.
          </p>
          <p>
            UpTend operates as a technology platform that connects customers seeking junk removal, moving, and hauling services with independent service providers ("Pros"). <strong>UpTend does not provide junk removal or hauling services directly.</strong>
          </p>

          <h2>2. Definitions</h2>
          <ul>
            <li><strong>"Customer"</strong> means any individual or business using the Platform to request services.</li>
            <li><strong>"Pro"</strong> means an independent contractor who provides junk removal, moving, or hauling services through the Platform.</li>
            <li><strong>"Services"</strong> means the junk removal, moving, hauling, and related services provided by Pros.</li>
            <li><strong>"Platform"</strong> means the UpTend website, mobile application, and related technology services.</li>
            <li><strong>"Verified Pro"</strong> means a Pro who has provided proof of commercial general liability insurance, business license, and passed background checks.</li>
            <li><strong>"Independent Pro"</strong> means a Pro who has passed background checks but operates without commercial insurance.</li>
          </ul>

          <h2>3. Eligibility</h2>
          <p>
            You must be at least 18 years old to use the Platform. By using the Platform, you represent and warrant that you meet this age requirement and have the legal capacity to enter into these Terms.
          </p>

          <h2>4. Platform Services</h2>
          
          <h3>4.1 Technology Platform</h3>
          <p>UpTend provides a technology platform that:</p>
          <ul>
            <li>Connects Customers with Pros</li>
            <li>Facilitates booking and scheduling</li>
            <li>Processes payments</li>
            <li>Provides real-time GPS tracking</li>
            <li>Offers AI-powered quote estimation</li>
            <li>Manages ratings and reviews</li>
          </ul>

          <h3>4.2 Not a Service Provider</h3>
          <p><strong>IMPORTANT:</strong> UpTend is a technology platform only. We do not:</p>
          <ul>
            <li>Provide junk removal, moving, or hauling services</li>
            <li>Employ Pros (they are independent contractors)</li>
            <li>Control how Pros perform their work</li>
            <li>Guarantee the quality, safety, or legality of Services</li>
            <li>Assume liability for Pros' actions or omissions</li>
          </ul>

          <h3>4.3 Pro Classification</h3>
          <p>The Platform offers two tiers of Pros:</p>
          <p><strong>Verified Pros:</strong></p>
          <ul>
            <li>Maintain commercial general liability insurance ($1M minimum coverage)</li>
            <li>Hold valid business licenses</li>
            <li>Have passed background checks</li>
            <li>Receive 80% of the job payment</li>
            <li>Are displayed with a "Verified Pro" badge</li>
          </ul>
          <p><strong>Independent Pros:</strong></p>
          <ul>
            <li>Have passed background checks</li>
            <li>Operate without commercial insurance (disclosed to Customers)</li>
            <li>Receive 75% of the job payment</li>
            <li>Are displayed with a standard badge</li>
            <li><strong>Customer Acknowledgment:</strong> When booking with an Independent Pro, you acknowledge that they may not carry commercial insurance and you assume additional risk.</li>
          </ul>
          <p>Customers may filter to show only Verified Pros during booking.</p>

          <h2>5. Customer Terms</h2>

          <h3>5.1 Booking Services</h3>
          <p>When you book a service:</p>
          <ul>
            <li>You provide accurate information about the job</li>
            <li>You authorize payment hold (not charged until Pro accepts)</li>
            <li>You agree to be available at the scheduled time</li>
            <li>You grant Pros access to the items for removal</li>
          </ul>

          <h3>5.2 Pricing</h3>
          <p>Prices are calculated based on:</p>
          <ul>
            <li>Service type (junk removal, moving, etc.)</li>
            <li>Load size and volume</li>
            <li>Distance to disposal facility</li>
            <li>Additional factors (stairs, heavy items, etc.)</li>
          </ul>
          <p><strong>Prices shown are estimates.</strong> Final prices may vary based on:</p>
          <ul>
            <li>Actual volume of items</li>
            <li>Additional services requested on-site</li>
            <li>Access difficulties</li>
            <li>Disposal fees</li>
          </ul>

          <h3>5.3 Payment</h3>
          <ul>
            <li>Payment is authorized when you book</li>
            <li>Payment is charged when a Pro accepts your job</li>
            <li>The Platform charges a 20% fee for Verified Pros (Pro receives 80%)</li>
            <li>The Platform charges a 25% fee for Independent Pros (Pro receives 75%)</li>
            <li>Tips are optional and go 100% to the Pro (no platform fee)</li>
            <li>You authorize charges for additional services agreed upon with the Pro</li>
          </ul>

          <h3>5.4 Cancellations and Refunds</h3>
          <p><strong>Customer Cancellations:</strong></p>
          <ul>
            <li>Free cancellation before Pro accepts</li>
            <li>$25 cancellation fee if cancelled after Pro is en route</li>
            <li>$50 fee if Pro arrives and customer is not available</li>
            <li>Full job charge if service begins and customer refuses completion</li>
          </ul>
          <p><strong>Pro Cancellations:</strong></p>
          <ul>
            <li>Full refund if Pro cancels</li>
            <li>Pro charged $25 penalty (credited to you)</li>
            <li>We will attempt to match you with another Pro</li>
          </ul>
          <p><strong>No-Shows:</strong></p>
          <ul>
            <li>If you are not available at scheduled time, full job charge applies</li>
            <li>If Pro doesn't show within 30 minutes of window, full refund</li>
          </ul>
          <p><strong>Service Disputes:</strong></p>
          <ul>
            <li>Issues must be reported within 24 hours</li>
            <li>Refunds evaluated case-by-case</li>
            <li>Photo/video evidence may be required</li>
          </ul>

          <h3>5.5 Your Responsibilities</h3>
          <p>You are responsible for:</p>
          <ul>
            <li>Providing accurate job descriptions and photos</li>
            <li>Ensuring items are accessible</li>
            <li>Removing hazardous materials before service</li>
            <li>Being present or having authorized representative present</li>
            <li>Paying for services rendered</li>
            <li>Treating Pros with respect</li>
          </ul>

          <h3>5.6 Prohibited Items</h3>
          <p>Pros cannot remove:</p>
          <ul>
            <li>Hazardous materials (chemicals, asbestos, medical waste)</li>
            <li>Illegal substances or items</li>
            <li>Live animals</li>
            <li>Items you don't own or have authority to dispose of</li>
            <li>Loaded firearms or explosives</li>
          </ul>

          <h2>6. Pro Terms</h2>

          <h3>6.1 Independent Contractor Status</h3>
          <p><strong>Pros are independent contractors, not employees of UpTend.</strong> This means:</p>
          <ul>
            <li>You control how you perform services</li>
            <li>You provide your own vehicle and equipment</li>
            <li>You pay your own taxes (1099 contractor)</li>
            <li>You maintain your own insurance (Verified Pros only)</li>
            <li>You set your own schedule</li>
            <li>UpTend does not withhold taxes or provide benefits</li>
          </ul>

          <h3>6.2 Pro Requirements</h3>
          <p>All Pros must:</p>
          <ul>
            <li>Be at least 18 years old</li>
            <li>Pass background checks</li>
            <li>Have valid driver's license</li>
            <li>Maintain reliable transportation</li>
            <li>Have smartphone with GPS</li>
            <li>Follow all applicable laws and regulations</li>
            <li>Maintain card on file for accountability</li>
          </ul>
          <p><strong>Additional Requirements for Verified Pro Status:</strong></p>
          <ul>
            <li>Commercial general liability insurance ($1M minimum)</li>
            <li>Business license</li>
            <li>Proof of vehicle insurance</li>
            <li>Workers compensation (if employing helpers)</li>
          </ul>

          <h3>6.3 Pro Obligations</h3>
          <p>When you accept a job, you agree to:</p>
          <ul>
            <li>Call customer within 5 minutes of acceptance</li>
            <li>Arrive within scheduled time window</li>
            <li>Provide professional, courteous service</li>
            <li>Complete the job as described</li>
            <li>Dispose of items legally and responsibly</li>
            <li>Clean up the area after removal</li>
            <li>Not solicit customers for off-platform services</li>
          </ul>

          <h3>6.4 Green Verified Disposal Program</h3>
          <p>Pros may participate in the Green Verified program:</p>
          <ul>
            <li>Submit disposal receipts within 48 hours</li>
            <li>Receipts must show: facility name, date, weight, fee</li>
            <li>Weight must match estimate ±20%</li>
            <li>Approved disposal facilities only</li>
            <li>Earn 10% rebate on dump fees (max $25 per job)</li>
            <li>AI validation with admin final approval</li>
            <li>No duplicate receipts allowed</li>
          </ul>

          <h3>6.5 Compensation</h3>
          <ul>
            <li>Verified Pros receive 80% of job payment</li>
            <li>Independent Pros receive 75% of job payment</li>
            <li>Tips are paid 100% to Pro (no platform fee)</li>
            <li>Payouts processed via Stripe Connect</li>
            <li>Instant payout attempted (may take 1-3 business days)</li>
            <li>Green Verified rebates paid within 7 days of approval</li>
          </ul>

          <h3>6.6 Pro Accountability</h3>
          <p>Pros are subject to:</p>
          <ul>
            <li>$25 penalty for cancellations after acceptance</li>
            <li>$25 penalty for no-shows</li>
            <li>$25 penalty for incomplete jobs</li>
            <li>Account suspension for violations</li>
            <li>Permanent ban for serious violations (theft, damage, harassment)</li>
          </ul>
          <p>Payment method on file will be charged for penalties.</p>

          <h3>6.7 Prohibited Conduct</h3>
          <p>Pros may not:</p>
          <ul>
            <li>Contact customers outside the Platform</li>
            <li>Request cash payments</li>
            <li>Solicit reviews in exchange for discounts</li>
            <li>Dump items illegally</li>
            <li>Misrepresent disposal methods</li>
            <li>Submit fraudulent receipts</li>
            <li>Discriminate based on protected characteristics</li>
            <li>Engage in harassment or inappropriate behavior</li>
          </ul>

          <h2>7. Ratings and Reviews</h2>

          <h3>7.1 Review System</h3>
          <p>Both Customers and Pros may rate and review each other after service completion.</p>
          <p><strong>Reviews must be:</strong></p>
          <ul>
            <li>Based on actual experience</li>
            <li>Honest and factual</li>
            <li>Respectful (no profanity, harassment, or threats)</li>
            <li>Relevant to the service</li>
          </ul>
          <p><strong>We reserve the right to remove reviews that:</strong></p>
          <ul>
            <li>Violate these Terms</li>
            <li>Contain false information</li>
            <li>Include personal attacks</li>
            <li>Contain promotional content</li>
            <li>Violate privacy</li>
          </ul>

          <h3>7.2 Impact of Ratings</h3>
          <ul>
            <li>Low-rated Pros may be suspended or removed</li>
            <li>Low-rated Customers may have booking restrictions</li>
            <li>Ratings affect matching algorithm priority</li>
          </ul>

          <h2>8. Intellectual Property</h2>

          <h3>8.1 Platform Content</h3>
          <p>The Platform and its content (text, graphics, logos, images, software) are owned by UpTend and protected by copyright, trademark, and other intellectual property laws.</p>
          <p>You may not:</p>
          <ul>
            <li>Copy, modify, or distribute Platform content</li>
            <li>Use our trademarks without permission</li>
            <li>Reverse engineer the Platform</li>
            <li>Create derivative works</li>
          </ul>

          <h3>8.2 User Content</h3>
          <p>You retain ownership of content you submit (photos, reviews, descriptions) but grant UpTend a worldwide, non-exclusive, royalty-free license to use, display, and distribute such content in connection with the Platform.</p>

          <h2>9. Privacy and Data</h2>
          <p>Your use of the Platform is subject to our <Link href="/privacy">Privacy Policy</Link>, which is incorporated into these Terms by reference. By using the Platform, you consent to our collection, use, and sharing of your information as described in the Privacy Policy.</p>

          <h2>10. Disclaimers and Limitation of Liability</h2>

          <h3>10.1 Platform "As Is"</h3>
          <p>THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.</p>

          <h3>10.2 No Guarantee of Services</h3>
          <p>UpTend DOES NOT GUARANTEE:</p>
          <ul>
            <li>Availability of Pros in your area</li>
            <li>Quality, safety, or legality of Services</li>
            <li>That Pros will complete jobs satisfactorily</li>
            <li>Accuracy of estimates or pricing</li>
            <li>That Services will meet your expectations</li>
          </ul>

          <h3>10.3 Independent Contractor Disclaimer</h3>
          <p><strong>IMPORTANT:</strong> Pros are independent contractors, not employees or agents of UpTend. UpTend:</p>
          <ul>
            <li>Does not control how Pros perform services</li>
            <li>Does not guarantee Pros' qualifications, licenses, or insurance</li>
            <li>Is not responsible for Pros' actions, omissions, or negligence</li>
            <li>Does not assume liability for property damage, personal injury, or other harm caused by Pros</li>
          </ul>
          <p><strong>Verified Pro vs Independent Pro:</strong></p>
          <ul>
            <li>Verified Pros maintain their own insurance</li>
            <li>Independent Pros may not have commercial insurance</li>
            <li>You are informed of Pro tier before booking</li>
            <li>You assume risk when booking Independent Pros</li>
          </ul>

          <h3>10.4 Limitation of Liability</h3>
          <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, UpTend AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR:</p>
          <ul>
            <li>Any indirect, incidental, special, consequential, or punitive damages</li>
            <li>Loss of profits, revenue, data, or business opportunities</li>
            <li>Property damage or personal injury caused by Pros</li>
            <li>Any damages exceeding the amount you paid for the specific service</li>
          </ul>
          <p>Some jurisdictions do not allow limitation of liability for personal injury, so this may not apply to you.</p>

          <h3>10.5 Insurance Disclaimer</h3>
          <p><strong>Verified Pros:</strong></p>
          <ul>
            <li>Maintain their own commercial general liability insurance</li>
            <li>Insurance claims must be filed directly with Pro's insurer</li>
            <li>UpTend is not responsible for insurance coverage disputes</li>
            <li>Verify coverage details with Pro before service</li>
          </ul>
          <p><strong>Independent Pros:</strong></p>
          <ul>
            <li>May not carry commercial insurance</li>
            <li>You are notified before booking</li>
            <li>You assume risk of no insurance coverage</li>
            <li>UpTend has no obligation to cover damages</li>
          </ul>
          <p><strong>Platform Insurance:</strong></p>
          <ul>
            <li>UpTend does not provide insurance coverage for services</li>
            <li>UpTend is not responsible for property damage or injury</li>
            <li>You should maintain your own insurance coverage</li>
          </ul>

          <h2>11. Indemnification</h2>
          <p>You agree to indemnify, defend, and hold harmless UpTend and its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including attorney fees) arising from:</p>
          <ul>
            <li>Your use of the Platform</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any law or regulation</li>
            <li>Content you submit to the Platform</li>
            <li>Services provided by or to you</li>
          </ul>

          <h2>12. Dispute Resolution</h2>

          <h3>12.1 Informal Resolution</h3>
          <p>Before filing a legal claim, you agree to contact us at support@uptend.app to attempt to resolve the dispute informally.</p>

          <h3>12.2 Arbitration Agreement</h3>
          <p><strong>PLEASE READ THIS SECTION CAREFULLY – IT AFFECTS YOUR LEGAL RIGHTS</strong></p>
          <p>Any dispute, claim, or controversy arising out of or relating to these Terms or the Platform shall be resolved by binding arbitration, rather than in court, except that:</p>
          <ul>
            <li>You may assert claims in small claims court if they qualify</li>
          </ul>

          <h2>13. Governing Law</h2>
          <p>These Terms shall be governed by and construed in accordance with the laws of the State of Florida, without regard to its conflict of law provisions.</p>

          <h2>14. Termination</h2>
          <p>UpTend may suspend or terminate your account at any time for violation of these Terms or for any other reason at our sole discretion. Upon termination, your right to use the Service immediately ceases.</p>

          <h2>15. Contact Information</h2>
          <p>For questions about these Terms, please contact us at:</p>
          <ul>
            <li>Email: legal@uptend.app</li>
            <li>Phone: (407) 338-3342</li>
            <li>Address: Orlando, FL 32801</li>
          </ul>
        </Card>
      </main>

      <footer className="border-t py-8 mt-16">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} UpTend. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <Link href="/refund-policy" className="hover:text-foreground">Refund Policy</Link>
            <Link href="/faq" className="hover:text-foreground">FAQ</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
