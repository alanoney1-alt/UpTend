import { Link2 } from "lucide-react";
import { LegalPage } from "./legal/legal-page";

export default function Affiliatedisclosure() {
  return (
    <LegalPage title="Affiliate Disclosure" icon={<Link2 className="w-12 h-12" />} lastUpdated="February 19, 2026">
      <div dangerouslySetInnerHTML={{ __html: `

<strong>UPYCK, Inc. d/b/a UpTend. Affiliate Disclosure</strong>
<strong>Effective Date: February 19, 2026</strong>

<p>This disclosure is made in compliance with the Federal Trade Commission's Guides Concerning the Use of Endorsements and Testimonials in Advertising (16 CFR Part 255).</p>

<h2>1. Affiliate Relationships</h2>

<p>UpTend participates in affiliate marketing programs. This means that when we link to products or services on third-party retail websites and you make a qualifying purchase, UpTend may earn a commission.</p>

<h2>2. Current Affiliate Partners</h2>

<ul>
<li><strong>Amazon Associates Program</strong>. UpTend is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com. Our affiliate tag is <strong>uptend20-20</strong>.</li>
</ul>
<p>We may add additional affiliate partners in the future (e.g., Walmart, Home Depot, Lowe's). This disclosure will be updated accordingly.</p>

<h2>3. How Affiliate Links Appear</h2>

<p>Affiliate links may appear in the following places on the UpTend Platform:</p>

<ul>
<li><strong>George AI recommendations</strong>. When George suggests a product (tool, cleaning supply, home improvement item), the link may be an affiliate link</li>
<li><strong>DIY Coaching guides</strong>. Product links in DIY instructions and guides</li>
<li><strong>Service recommendation pages</strong>. Links to recommended products or materials</li>
<li><strong>Blog content and educational articles</strong></li>
</ul>
<p>Affiliate links are not visually distinguished from non-affiliate links in most cases, but this disclosure serves as notice that product links on our Platform may be affiliate links.</p>

<h2>4. No Additional Cost to You</h2>

<strong>Purchasing through our affiliate links does not cost you anything extra.</strong> The price you pay is the same as if you navigated to the retailer directly. The commission is paid by the retailer, not by you.

<h2>5. Editorial Independence</h2>

<strong>Affiliate relationships do not influence our recommendations.</strong> Specifically:

<ul>
<li>George will never recommend an inferior or unsafe product because of an affiliate relationship</li>
<li>Safety recommendations are never influenced by affiliate commissions</li>
<li>We recommend products based on quality, value, suitability, and user reviews. not commission rates</li>
<li>We may recommend products from non-affiliate retailers when those products are superior for the user's needs</li>
</ul>
<h2>6. Your Choice</h2>

<p>You are never required to purchase products through our affiliate links. You are free to:</p>

<ul>
<li>Purchase from any retailer of your choice</li>
<li>Navigate to the retailer directly without using our link</li>
<li>Use your own preferred shopping methods</li>
</ul>
<h2>7. FTC Compliance Statement</h2>

<p>This page is provided to comply with the Federal Trade Commission's requirements for disclosing material connections between endorsers and the products or services they recommend. UpTend has a material financial connection to the companies whose products are linked on this Platform, as described above.</p>

<h2>8. Questions</h2>

<p>If you have questions about our affiliate relationships:</p>

<strong>Email:</strong> legal@uptendapp.com
<strong>Phone:</strong> (407) 338-3342

` }} />
    </LegalPage>
  );
}
