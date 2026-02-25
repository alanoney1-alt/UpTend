import { Shield } from "lucide-react";
import { LegalPage } from "./legal/legal-page";

export default function ServiceguaranteePage() {
  return (
    <LegalPage title="Service Guarantee" icon={<Shield className="w-12 h-12" />} lastUpdated="February 19, 2026">
      <div dangerouslySetInnerHTML={{ __html: `

<strong>UPYCK, Inc. d/b/a UpTend. Service Guarantee</strong>
<strong>Effective Date: February 19, 2026</strong>

<p>At UpTend, we stand behind every service booked through our Platform. This Service Guarantee outlines our commitments to you.</p>

<h2>1. Price Transparency Guarantee</h2>

<strong>What you see is what you pay.</strong> The price displayed at booking is your total price, inclusive of all platform fees. There are no hidden charges, surprise fees, or post-service surcharges. The only exception is if <strong>you</strong> approve additional work beyond the original scope. and that requires your explicit approval through the Platform before any additional charges apply.

<p>Your final price will never exceed the <strong>Guaranteed Price Ceiling</strong> (115% of the high estimate), regardless of circumstances.</p>

<h2>2. On-Time Arrival Guarantee</h2>

<p>Your Pro will arrive within the scheduled arrival window. If they don't, you are automatically compensated:</p>

<ul>
<li><strong>30–59 minutes late:</strong> 10% off your service</li>
<li><strong>60–119 minutes late:</strong> 25% off your service</li>
<li><strong>2+ hours late or no-show:</strong> Full refund plus a \$25 UpTend credit</li>
</ul>
<p>You don't need to request these discounts. they are applied automatically. You may also cancel for a full refund at any point during a delay.</p>

<h2>3. Professionalism Guarantee</h2>

<p>Every UpTend Pro is expected to:</p>

<ul>
<li>Communicate clearly and courteously</li>
<li>Arrive prepared with appropriate tools and equipment</li>
<li>Treat your property with care and respect</li>
<li>Complete work to a professional standard</li>
<li>Clean up the work area upon completion</li>
</ul>
<p>If a Pro fails to meet these standards, contact us within 48 hours. We will investigate and may provide a partial or full refund, credit, or re-service.</p>

<h2>4. Satisfaction Guarantee</h2>

<p>If you are not satisfied with the quality of work performed:</p>

<p>1. Contact us within <strong>48 hours</strong> of service completion</p>
<p>2. Describe the issue and provide photos if possible</p>
<p>3. We will work with you and the Pro to make it right</p>

<p>Resolutions may include:</p>
<ul>
<li><strong>Re-service</strong> at no additional cost (Pro returns to address the issue)</li>
<li><strong>Partial refund</strong> for work not completed to standard</li>
<li><strong>Full refund</strong> in cases of significant quality failure</li>
<li><strong>UpTend credit</strong> for future services</li>
</ul>
<h2>5. Property Protection</h2>

<p>We take the protection of your property seriously.</p>

<h3>5.1 LLC-Verified Pros</h3>
<p>LLC-Verified Pros carry their own <strong>commercial general liability insurance</strong> with a minimum of \$1,000,000 per occurrence. This insurance covers property damage and bodily injury that may occur during the performance of services at your home.</p>

<h3>5.2 Independent Pros</h3>
<p>Independent Pros are covered by <strong>UpTend's supplemental liability program</strong>, which provides limited coverage for property damage during jobs. This coverage has lower limits than the insurance carried by LLC-Verified Pros.</p>

<h3>5.3 How to File a Property Damage Claim</h3>
<p>1. Document the damage with photos and a written description</p>
<p>2. Contact support@uptendapp.com within <strong>48 hours</strong> of the incident</p>
<p>3. Include your booking number and Pro name</p>
<p>4. We will initiate the claims process and guide you through next steps</p>

<h2>6. Environmental Responsibility</h2>

<p>UpTend encourages environmentally responsible practices:</p>

<ul>
<li><strong>Junk removal:</strong> We encourage Pros to donate usable items and recycle materials when feasible</li>
<li><strong>Pressure washing:</strong> We encourage the use of environmentally safe cleaning solutions</li>
<li><strong>Landscaping:</strong> We support sustainable landscaping practices</li>
</ul>
<p>While we cannot guarantee every Pro's environmental practices, we promote and incentivize responsible behavior through our platform.</p>

<h2>7. What This Guarantee Does Not Cover</h2>

<p>This Service Guarantee does not cover:</p>

<ul>
<li>Pre-existing conditions or damage not caused by the Pro</li>
<li>Damage resulting from inaccurate or incomplete information provided by the Customer</li>
<li>Issues reported more than 48 hours after service completion</li>
<li>Normal wear and tear or cosmetic imperfections inherent to the work type</li>
<li>Work performed outside the scope of the original booking</li>
<li>Third-party products or materials (covered by manufacturer warranties)</li>
<li>Force majeure events (natural disasters, severe weather)</li>
</ul>
<h2>8. Contact</h2>

<p>To make a guarantee claim:</p>

<strong>Email:</strong> support@uptendapp.com
<strong>Phone:</strong> (407) 338-3342
<strong>In-App:</strong> Use the Help & Support feature
<strong>Response time:</strong> Within 2 business days
` }} />
    </LegalPage>
  );
}
