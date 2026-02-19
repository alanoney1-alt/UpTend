import { Accessibility } from "lucide-react";
import { LegalPage } from "./legal/legal-page";

export default function Accessibility() {
  return (
    <LegalPage title="Accessibility Statement" icon={<Accessibility className="w-12 h-12" />} lastUpdated="February 19, 2026">
      <div dangerouslySetInnerHTML={{ __html: `

<strong>UPYCK, Inc. d/b/a UpTend — Accessibility Statement</strong>
<strong>Effective Date: February 19, 2026</strong>

<h2>1. Our Commitment</h2>

<p>UpTend is committed to ensuring that our Platform is accessible to all users, including individuals with disabilities. We strive to conform to the <strong>Web Content Accessibility Guidelines (WCAG) 2.1, Level AA</strong>, as published by the World Wide Web Consortium (W3C).</p>

<h2>2. What We're Doing</h2>

<p>We are actively working to increase the accessibility and usability of our Platform by:</p>

<p>(a) Incorporating accessibility best practices into our design and development processes;</p>
<p>(b) Providing text alternatives for non-text content;</p>
<p>(c) Ensuring sufficient color contrast for readability;</p>
<p>(d) Making all functionality available via keyboard navigation;</p>
<p>(e) Ensuring compatibility with assistive technologies, including screen readers;</p>
<p>(f) Using clear, consistent navigation and layout;</p>
<p>(g) Providing form labels and error identification;</p>
<p>(h) Conducting regular accessibility audits and testing.</p>

<h2>3. Known Limitations</h2>

<p>While we strive for full WCAG 2.1 AA compliance, some areas of the Platform may have limitations:</p>

<p>(a) <strong>AI-generated content</strong> — Responses from George and AI Home Scan reports are dynamically generated and may not always meet all accessibility standards;</p>
<p>(b) <strong>Third-party integrations</strong> — Payment forms (Stripe), maps, and other third-party components may have their own accessibility limitations outside our control;</p>
<p>(c) <strong>User-submitted content</strong> — Photos, reviews, and other user-generated content may lack alternative text or other accessibility features;</p>
<p>(d) <strong>Real-time features</strong> — Live location tracking and real-time notifications may present challenges for some assistive technologies.</p>

<p>We are actively working to address these limitations.</p>

<h2>4. Feedback</h2>

<p>We welcome your feedback on the accessibility of the UpTend Platform. If you encounter accessibility barriers or have suggestions for improvement, please contact us:</p>

<strong>Email:</strong> accessibility@uptendapp.com
<strong>Phone:</strong> (407) 338-3342
<strong>Mail:</strong> UPYCK, Inc. d/b/a UpTend, Attn: Accessibility, Orlando, FL 32801

<p>We aim to respond to accessibility feedback within <strong>five (5) business days</strong>.</p>

<h2>5. Assistive Technology Support</h2>

<p>The Platform is designed to work with:</p>

<ul>
<li>Screen readers (NVDA, JAWS, VoiceOver, TalkBack)</li>
<li>Screen magnification software</li>
<li>Voice recognition software</li>
<li>Keyboard-only navigation</li>
<li>Switch devices and other assistive input methods</li>
</ul>
<h2>6. Ongoing Efforts</h2>

<p>Accessibility is an ongoing commitment. We regularly review and update our Platform to improve accessibility. This statement was last reviewed on February 19, 2026.</p>

` }} />
    </LegalPage>
  );
}
