import { XCircle } from "lucide-react";
import { LegalPage } from "./legal/legal-page";

export default function CancellationpolicyPage() {
  return (
    <LegalPage title="Cancellation & Refund Policy" icon={<XCircle className="w-12 h-12" />} lastUpdated="February 19, 2026">
      <div dangerouslySetInnerHTML={{ __html: `

<strong>UPYCK, Inc. d/b/a UpTend. Cancellation & Refund Policy</strong>
<strong>Effective Date: February 19, 2026</strong>

<p>This is the <strong>sole and definitive</strong> cancellation and refund policy for UpTend. In the event of any conflict with summaries or descriptions elsewhere on the Platform, this document controls.</p>

<h2>1. Customer Cancellation Fees</h2>

<p>| When You Cancel | What You Pay |</p>
<p>|---|---|</p>
<p>| <strong>Before the Pro accepts</strong> your booking | Nothing. free cancellation |</p>
<p>| <strong>After the Pro accepts</strong> but before the Pro is en route | Nothing. free cancellation |</p>
<p>| <strong>After the Pro is en route</strong> to your location | \$25 cancellation fee |</p>
<p>| <strong>After the Pro arrives</strong> at your location | \$50 cancellation fee |</p>
<p>| <strong>After work has begun</strong> | Full charge for the estimated service amount |</p>

<p>Cancellation fees are charged to the payment method on file. UpTend credits cannot be used to offset cancellation fees.</p>

<h2>2. Pro Cancellation</h2>

<p>If a Pro cancels an accepted booking at any time before or during the scheduled service:</p>

<ul>
<li><strong>Customer receives:</strong> Full refund of any amounts charged <strong>plus</strong> a \$25 UpTend credit</li>
<li><strong>UpTend will:</strong> Attempt to match the Customer with a replacement Pro as quickly as possible</li>
</ul>
<p>Pros who frequently cancel accepted bookings are subject to account penalties, including reduced visibility, suspension, or removal.</p>

<h2>3. Customer No-Show</h2>

<p>If a Customer is not present or does not provide access at the scheduled time:</p>

<p>1. The Pro will wait for <strong>fifteen (15) minutes</strong></p>
<p>2. During the wait, the Pro will attempt to contact the Customer via the Platform and by phone</p>
<p>3. If the Customer is unreachable after 15 minutes, the job is marked as a Customer no-show</p>
<p>4. <strong>A \$25 no-show fee</strong> is charged to the Customer</p>

<h2>4. Pro No-Show</h2>

<p>If a Pro fails to arrive for a scheduled booking:</p>

<ul>
<li><strong>Customer receives:</strong> Full refund of any amounts charged <strong>plus</strong> a \$25 UpTend credit</li>
<li><strong>UpTend will:</strong> Attempt to assign a replacement Pro</li>
</ul>
<h2>5. Pro Late Arrival</h2>

<p>Late arrival is measured from the <strong>end</strong> of the scheduled arrival window:</p>

<p>| How Late | Your Automatic Discount |</p>
<p>|---|---|</p>
<p>| 30–59 minutes | 10% off the service price |</p>
<p>| 60–119 minutes | 25% off the service price |</p>
<p>| 2+ hours (or Pro does not arrive) | Full refund + \$25 UpTend credit |</p>

<p>Discounts are applied automatically. You do not need to request them. If you prefer not to wait, you may cancel at any time during the delay for a <strong>full refund</strong> regardless of how long the Pro is late.</p>

<h2>6. Rescheduling</h2>

<p>You may reschedule any booking <strong>free of charge</strong> if you request the change at least <strong>two (2) hours</strong> before the scheduled service time. Rescheduling requests made less than two hours before the scheduled time are treated as cancellations and subject to the fees in Section 1.</p>

<h2>7. Special Circumstances</h2>

<p>UpTend may waive cancellation fees in the following circumstances at our sole discretion:</p>

<ul>
<li><strong>Documented personal or family emergencies</strong> (medical emergency, death in family)</li>
<li><strong>Severe weather events</strong> that make service unsafe or impractical</li>
<li><strong>Natural disasters</strong> affecting the service area</li>
<li><strong>Government-mandated restrictions</strong> (evacuation orders, stay-at-home orders)</li>
</ul>
<p>Contact george@uptendapp.com as soon as possible with any relevant documentation. Approval of fee waivers is not guaranteed.</p>

<h2>8. Estimate Accuracy</h2>

<p>If the actual service price differs from the original estimate by more than <strong>20%</strong> (higher or lower):</p>

<ul>
<li>UpTend will investigate the discrepancy</li>
<li>If the discrepancy was caused by <strong>inaccurate or incomplete information</strong> provided by the Customer, the revised price applies</li>
<li>If the discrepancy was caused by a <strong>Platform error or AI estimate inaccuracy</strong>, the Customer will be charged the lower of the original estimate or actual price, and UpTend will absorb the difference</li>
<li>In all cases, the <strong>Guaranteed Price Ceiling</strong> (high estimate × 1.15) is the maximum a Customer can be charged</li>
</ul>
<h2>9. Refund Processing Timeline</h2>

<p>| Refund Method | Timeline |</p>
<p>|---|---|</p>
<p>| Credit/debit card | 5–10 business days |</p>
<p>| Klarna | 5–14 business days (varies by Klarna) |</p>
<p>| Afterpay | 5–14 business days (varies by Afterpay) |</p>
<p>| UpTend credits | Immediate |</p>

<p>Refunds are returned to the original payment method. UpTend credits do not expire and are applied automatically to future bookings.</p>

<h2>10. Subscription Service Cancellation</h2>

<p>For recurring or subscription-based services (e.g., weekly cleaning, monthly lawn care):</p>

<ul>
<li>Cancel at any time through your account settings or by contacting support</li>
<li>Cancellation takes effect at the <strong>end of the current billing period</strong></li>
<li>No refunds for partial billing periods unless required by law</li>
<li>Any upcoming scheduled service within a cancelled subscription will be cancelled without fee if not yet assigned to a Pro</li>
</ul>
<h2>11. B2B Contract Cancellation</h2>

<p>Business Account cancellation terms are governed by:</p>

<ul>
<li>The <strong>B2B Terms of Service</strong></li>
<li>Any individual <strong>Service Level Agreement (SLA)</strong> or contract between UpTend and the Business Account</li>
<li>B2B cancellation terms may differ from consumer terms and are specified in the applicable agreement</li>
</ul>
<h2>12. Contact</h2>

<p>For cancellations, refund inquiries, or special circumstances:</p>

<strong>Email:</strong> george@uptendapp.com
<strong>Phone:</strong> (407) 338-3342
<strong>In-App:</strong> Use the Help & Support feature in the UpTend app
` }} />
    </LegalPage>
  );
}
