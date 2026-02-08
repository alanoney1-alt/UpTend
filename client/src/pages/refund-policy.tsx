import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, RefreshCcw, Phone, Mail } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-background" data-testid="page-refund-policy">
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
          <RefreshCcw className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold mb-4">Refund and Cancellation Policy</h1>
          <p className="text-muted-foreground">
            Last Updated: January 17, 2026
          </p>
        </div>

        <Card className="p-8 prose prose-gray dark:prose-invert max-w-none">
          <h2>Overview</h2>
          <p>This Refund and Cancellation Policy explains how refunds and cancellations work on the UpTend platform. This policy is part of our Terms of Service.</p>

          <h2>Customer Cancellations</h2>

          <h3>Before Pro Accepts</h3>
          <p><strong>Free Cancellation</strong></p>
          <ul>
            <li>You may cancel for free anytime before a Pro accepts your job</li>
            <li>Payment authorization will be released immediately</li>
            <li>No charges to your card</li>
          </ul>

          <h3>After Pro Accepts (But Before Arrival)</h3>
          <p><strong>$25 Cancellation Fee</strong></p>
          <ul>
            <li>Once a Pro accepts and is en route, a $25 cancellation fee applies</li>
            <li>This compensates the Pro for time and fuel</li>
            <li>Remaining authorized amount released to you</li>
          </ul>

          <h3>Pro Has Arrived</h3>
          <p><strong>$50 Cancellation Fee</strong></p>
          <ul>
            <li>If Pro arrives at your location and you cancel, a $50 fee applies</li>
            <li>This covers the Pro's time, fuel, and lost opportunity</li>
            <li>Remaining authorized amount released to you</li>
          </ul>

          <h3>After Service Begins</h3>
          <p><strong>Full Charge</strong></p>
          <ul>
            <li>Once service has begun (loading has started), full job charge applies</li>
            <li>No refund for partially completed work</li>
            <li>You are responsible for full payment</li>
          </ul>

          <h2>Pro Cancellations</h2>

          <h3>Pro Cancels Before Arrival</h3>
          <p><strong>Full Refund</strong></p>
          <ul>
            <li>If Pro cancels for any reason, you receive a full refund</li>
            <li>Payment authorization released immediately</li>
            <li>Pro charged $25 penalty (credited to you if service rebooked)</li>
          </ul>

          <h3>Pro No-Show</h3>
          <p><strong>Full Refund + Priority Rebooking</strong></p>
          <ul>
            <li>If Pro doesn't arrive within 30 minutes of scheduled window</li>
            <li>Full refund issued</li>
            <li>Pro charged $25 penalty</li>
            <li>You receive priority matching for next booking</li>
          </ul>

          <h2>No-Show Situations</h2>

          <h3>Customer No-Show</h3>
          <p><strong>Full Charge</strong></p>
          <ul>
            <li>If you are not available at scheduled time</li>
            <li>Pro waits 15 minutes and attempts contact</li>
            <li>Full job charge applies if you don't respond</li>
            <li>No refund issued</li>
          </ul>

          <h3>Pro Late Arrival</h3>
          <p><strong>Partial Refund or Discount</strong></p>
          <ul>
            <li>Pro more than 30 minutes late: 10% discount</li>
            <li>Pro more than 60 minutes late: 25% discount</li>
            <li>Pro no-show (2+ hours late): Full refund</li>
          </ul>

          <h2>Service Quality Issues</h2>

          <h3>Incomplete or Poor Service</h3>
          <p>If you are unsatisfied with service quality:</p>
          <p><strong>Report Within 24 Hours:</strong></p>
          <ul>
            <li>Email support@uptend.app</li>
            <li>Provide photos or video evidence</li>
            <li>Describe the issue in detail</li>
          </ul>
          <p><strong>Resolution Options:</strong></p>
          <ol>
            <li><strong>Partial Refund:</strong> For partially completed work</li>
            <li><strong>Full Refund:</strong> For work not done as promised</li>
            <li><strong>Rescheduled Service:</strong> Free return visit to complete job</li>
            <li><strong>Credit:</strong> Platform credit for future bookings</li>
          </ol>
          <p><strong>Not Eligible for Refund:</strong></p>
          <ul>
            <li>Change of mind after service completion</li>
            <li>Items you wanted kept were disposed of (without Pro being informed)</li>
            <li>Normal wear and tear on property during service</li>
            <li>Difficulty accessing items (unless misrepresented by you)</li>
          </ul>

          <h3>Property Damage</h3>
          <p><strong>Pro Caused Damage:</strong></p>
          <ul>
            <li>Report immediately (within 24 hours)</li>
            <li>Provide photo evidence</li>
            <li>For Verified Pros: File claim with their insurance</li>
            <li>For Independent Pros: Work with Pro directly (UpTend facilitates but is not responsible)</li>
            <li>UpTend mediates disputes but does not guarantee resolution</li>
          </ul>
          <p><strong>Pre-existing Damage:</strong></p>
          <ul>
            <li>Not covered</li>
            <li>Report any pre-existing damage to Pro before service begins</li>
          </ul>

          <h2>Price Adjustments</h2>

          <h3>On-Site Price Changes</h3>
          <p><strong>Acceptable Changes:</strong></p>
          <ul>
            <li>Additional items found on-site (you agree to add them)</li>
            <li>Heavier load than estimated</li>
            <li>Stairs not disclosed in booking</li>
            <li>Access difficulties not mentioned</li>
          </ul>
          <p><strong>Unacceptable Changes:</strong></p>
          <ul>
            <li>Arbitrary price increases</li>
            <li>Pressure to pay more than quoted</li>
            <li>Hidden fees not disclosed upfront</li>
          </ul>
          <p><strong>Your Rights:</strong></p>
          <ul>
            <li>Accept the new price and proceed</li>
            <li>Decline additional services</li>
            <li>Cancel (subject to cancellation fees)</li>
            <li>Dispute the charge (we'll investigate)</li>
          </ul>

          <h3>Quote Accuracy</h3>
          <p><strong>AI Estimates:</strong></p>
          <ul>
            <li>Photo-based estimates are close but not guaranteed exact</li>
            <li>Final price based on actual volume</li>
            <li>If significantly different (20%+), we'll investigate</li>
            <li>Refund difference if estimate was unreasonably inaccurate</li>
          </ul>

          <h2>Refund Processing</h2>

          <h3>Timeline</h3>
          <ul>
            <li><strong>Payment Authorization Release:</strong> Immediate (within minutes)</li>
            <li><strong>Refund to Card:</strong> 5-10 business days (depends on your bank)</li>
            <li><strong>Platform Credits:</strong> Immediate (applied to your account instantly)</li>
          </ul>

          <h3>Refund Method</h3>
          <p>Refunds issued to original payment method:</p>
          <ul>
            <li>Credit/debit card: Refunded to card</li>
            <li>Platform credit: Applied to account balance</li>
            <li>Cash payments: Not accepted (N/A)</li>
          </ul>

          <h2>Tips</h2>
          <p><strong>Tips Are Non-Refundable</strong></p>
          <ul>
            <li>Tips are paid directly to Pros (100%, no platform fee)</li>
            <li>Tips cannot be refunded once paid</li>
            <li>If service quality was poor, request refund of base fare, not tip</li>
          </ul>
          <p><strong>Exception:</strong> If Pro no-shows or cancels, any tip paid is refunded.</p>

          <h2>Disputes</h2>

          <h3>Dispute Process</h3>
          <ol>
            <li><strong>Contact Support:</strong> Email support@uptend.app within 24 hours</li>
            <li><strong>Provide Details:</strong> Photos, description, booking ID</li>
            <li><strong>Investigation:</strong> We review within 1-3 business days</li>
            <li><strong>Resolution:</strong> Refund, credit, rescheduled service, or denied</li>
          </ol>

          <h3>Chargeback Policy</h3>
          <p><strong>Before Filing Chargeback:</strong> Contact us first at support@uptend.app. Most issues are resolved quickly.</p>
          <p><strong>If You File Chargeback:</strong></p>
          <ul>
            <li>Your account may be suspended pending investigation</li>
            <li>Abuse of chargebacks may result in permanent ban</li>
            <li>Legitimate chargebacks will be honored</li>
          </ul>

          <h2>Green Verified Rebates</h2>
          <p><strong>Pro Rebates Only:</strong></p>
          <ul>
            <li>Green Verified rebates are for Pros, not customers</li>
            <li>Customers benefit indirectly through verified eco-friendly disposal</li>
            <li>Rebates paid to Pros within 7 days of approval</li>
          </ul>

          <h2>Special Circumstances</h2>

          <h3>Weather or Emergencies</h3>
          <p><strong>Severe Weather:</strong></p>
          <ul>
            <li>Free rescheduling if unsafe to travel</li>
            <li>Applies to both customers and Pros</li>
            <li>No cancellation fees</li>
          </ul>
          <p><strong>Emergencies:</strong></p>
          <ul>
            <li>Medical emergencies, family emergencies: free cancellation</li>
            <li>Contact us immediately</li>
            <li>We may request documentation</li>
          </ul>

          <h3>Recurring Jobs</h3>
          <p><strong>Business Account Cancellations:</strong></p>
          <ul>
            <li>Cancel recurring job with 48 hours notice: no fee</li>
            <li>Less than 48 hours notice: one job charge</li>
            <li>Cancel account: no penalty after current billing cycle</li>
          </ul>

          <h2>Quick Reference</h2>
          <div className="overflow-x-auto not-prose">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4">Situation</th>
                  <th className="text-left py-2">Fee/Refund</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 pr-4">Cancel before Pro accepts</td>
                  <td className="py-2 text-green-600 dark:text-green-400">FREE (Full refund)</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Cancel after Pro accepts</td>
                  <td className="py-2 text-yellow-600 dark:text-yellow-400">$25 fee</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Cancel after Pro arrives</td>
                  <td className="py-2 text-yellow-600 dark:text-yellow-400">$50 fee</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Cancel after service starts</td>
                  <td className="py-2 text-red-600 dark:text-red-400">Full charge (No refund)</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Pro cancels</td>
                  <td className="py-2 text-green-600 dark:text-green-400">Full refund + Pro penalty</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Pro no-show</td>
                  <td className="py-2 text-green-600 dark:text-green-400">Full refund + priority rebooking</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Customer no-show</td>
                  <td className="py-2 text-red-600 dark:text-red-400">Full charge</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Pro late (30-60 min)</td>
                  <td className="py-2 text-green-600 dark:text-green-400">10% discount</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Pro late (60+ min)</td>
                  <td className="py-2 text-green-600 dark:text-green-400">25% discount</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Pro late (2+ hours)</td>
                  <td className="py-2 text-green-600 dark:text-green-400">Full refund</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Poor service quality</td>
                  <td className="py-2 text-blue-600 dark:text-blue-400">Partial/full refund (case by case)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Weather cancellation</td>
                  <td className="py-2 text-green-600 dark:text-green-400">Free reschedule</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>Contact for Refunds</h2>
          <p><strong>Email:</strong> support@uptend.app</p>
          <p><strong>Subject Line:</strong> "Refund Request - [Booking ID]"</p>
          <p><strong>Include:</strong></p>
          <ul>
            <li>Your name and account email</li>
            <li>Booking ID</li>
            <li>Reason for refund request</li>
            <li>Any supporting documentation (photos, screenshots)</li>
          </ul>
          <p><strong>Response Time:</strong> Within 24-48 hours (business days)</p>

          <div className="flex flex-col sm:flex-row gap-4 not-prose mt-6">
            <Button variant="outline" asChild data-testid="button-email-support">
              <a href="mailto:support@uptend.app">
                <Mail className="w-4 h-4 mr-2" />
                support@uptend.app
              </a>
            </Button>
            <Button asChild data-testid="button-call-support">
              <a href="tel:407-338-3342">
                <Phone className="w-4 h-4 mr-2" />
                (407) 338-3342
              </a>
            </Button>
          </div>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg text-xs text-muted-foreground not-prose">
            <strong>This policy is designed to be fair to both customers and Pros while maintaining platform integrity.</strong>
          </div>
        </Card>
      </main>

      <footer className="border-t py-8 mt-16">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} UpTend. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <Link href="/faq" className="hover:text-foreground">FAQ</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
