import { FileText } from "lucide-react";
import { LegalPage } from "./legal/legal-page";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" icon={<FileText className="w-12 h-12" />} lastUpdated="February 19, 2026">
      <div dangerouslySetInnerHTML={{ __html: `

<strong>UPYCK, Inc. d/b/a UpTend. Terms of Service</strong>
<strong>Effective Date: February 19, 2026</strong>

<p>PLEASE READ THESE TERMS OF SERVICE ("TERMS") CAREFULLY. BY ACCESSING OR USING THE UPTEND PLATFORM, YOU AGREE TO BE BOUND BY THESE TERMS. IF YOU DO NOT AGREE, DO NOT USE THE PLATFORM.</p>

<p>THESE TERMS CONTAIN A BINDING ARBITRATION CLAUSE AND CLASS ACTION WAIVER IN SECTION 22, WHICH AFFECT YOUR LEGAL RIGHTS. PLEASE READ THEM CAREFULLY.</p>

<h2>1. Introduction and Platform Description</h2>

<h3>1.1 About UpTend</h3>

<p>UpTend is operated by UPYCK, Inc., a Delaware C-Corporation doing business as "UpTend," with its principal place of business at Orlando, FL 32801 ("UpTend," "we," "us," or "our"). UpTend operates a technology platform (the "Platform") accessible via our website at uptendapp.com and our mobile applications that connects customers seeking home services with independent service professionals ("Pros").</p>

<h3>1.2 Service Verticals</h3>

<p>The Platform facilitates connections for the following service categories (collectively, "Services"):</p>

<p>1. <strong>Junk Removal</strong>. Hauling and disposal of unwanted items, debris, and refuse</p>
<p>2. <strong>Pressure Washing</strong>. Exterior cleaning of surfaces using pressurized water</p>
<p>3. <strong>Gutter Cleaning</strong>. Cleaning, flushing, and minor repair of rain gutters and downspouts</p>
<p>4. <strong>Moving Labor</strong>. Loading, unloading, and furniture rearrangement (not transportation between locations)</p>
<p>5. <strong>Handyman Services</strong>. General home repairs, assembly, mounting, and minor maintenance</p>
<p>6. <strong>Demolition</strong>. Interior demolition, structure removal, and site preparation</p>
<p>7. <strong>Garage Cleanout</strong>. Organization, cleaning, and removal of unwanted items from garages</p>
<p>8. <strong>Home Cleaning</strong>. Residential interior cleaning, deep cleaning, and move-in/move-out cleaning</p>
<p>9. <strong>Pool Cleaning</strong>. Pool maintenance, chemical balancing, and equipment inspection</p>
<p>10. <strong>Landscaping</strong>. Lawn care, garden maintenance, tree trimming, and landscape design</p>
<p>11. <strong>Carpet Cleaning</strong>. Professional carpet, rug, and upholstery cleaning</p>
<p>12. <strong>Home DNA Scan</strong>. AI-assisted visual analysis of home conditions using photographs or drone-captured imagery (see Section 7)</p>
<p>13. <strong>General Home Consultation</strong>. Advisory consultations on home maintenance, improvement planning, and project scoping</p>

<h3>1.3 Business-to-Business Services</h3>

<p>UpTend also provides services to business clients ("B2B Services"), including Homeowners Associations ("HOAs"), Property Management companies, Construction firms, and Government entities. B2B Services are governed by these Terms and the additional B2B Terms of Service.</p>

<h3>1.4 AI-Powered Features</h3>

<p>The Platform includes artificial intelligence features, including the George AI Assistant (powered by Anthropic Claude), photo and vision analysis (powered by OpenAI), DIY Coaching, and Home DNA Scan. These features are described in detail in Sections 6 and 7.</p>

<h3>1.5 Platform Role</h3>

<strong>UpTend is a technology platform, not a home services provider.</strong> We do not perform any services ourselves. We facilitate connections between Customers and independent Pros. UpTend does not employ, supervise, direct, or control the work performed by any Pro. See Section 10 for details on Pro classification.

<h2>2. User Types and Accounts</h2>

<h3>2.1 User Types</h3>

<p>The Platform serves the following user types:</p>

<ul>
<li><strong>Customers</strong>. Individuals or households seeking home services</li>
<li><strong>Pros</strong>. Independent service professionals offering their services through the Platform</li>
<li><strong>Business Accounts</strong>. Organizations including HOAs, Property Management companies, Construction companies, and Government entities accessing B2B Services</li>
</ul>
<h3>2.2 Eligibility</h3>

<p>You must be at least eighteen (18) years of age and legally capable of entering into binding contracts to create an account or use the Platform. By creating an account, you represent and warrant that you meet these requirements.</p>

<h3>2.3 Account Creation</h3>

<p>To use certain features of the Platform, you must create an account. You agree to:</p>

<p>(a) Provide accurate, current, and complete information during registration;</p>
<p>(b) Maintain and promptly update your account information;</p>
<p>(c) Maintain the security and confidentiality of your login credentials;</p>
<p>(d) Accept responsibility for all activities that occur under your account;</p>
<p>(e) Notify us immediately at george@uptendapp.com if you suspect unauthorized access.</p>

<h3>2.4 Account Verification</h3>

<p>We may require identity verification, including but not limited to government-issued identification, email verification, phone verification, and for Pros, business documentation (LLC articles of organization, insurance certificates, licenses). We reserve the right to suspend or terminate accounts that fail verification or provide fraudulent information.</p>

<h3>2.5 One Account Per Person</h3>

<p>Each individual may maintain only one Customer account and one Pro account. Creating multiple accounts to circumvent Platform rules, suspensions, or rating systems is prohibited and grounds for permanent termination.</p>

<h2>3. Booking and Payment</h2>

<h3>3.1 How Bookings Work</h3>

<p>When a Customer requests a service through the Platform, our system generates an estimate based on the information provided. A Customer may book a service by selecting a time and confirming the booking. The booking becomes a binding commitment according to the cancellation terms in Section 11.</p>

<h3>3.2 Estimates and Pricing</h3>

<p>All prices displayed on the Platform are estimates unless otherwise stated. Estimates are generated based on information provided by the Customer, including property details, scope of work, photos, and AI analysis where applicable. <strong>The price shown includes all fees. no hidden charges.</strong> The displayed price is the total amount a Customer will pay, inclusive of all platform fees.</p>

<h3>3.3 Guaranteed Price Ceiling</h3>

<p>For services where an estimate range is provided (a low estimate and a high estimate), UpTend guarantees that the final price will not exceed the <strong>Guaranteed Price Ceiling</strong>, calculated as the high estimate multiplied by 1.15 (115% of the high estimate). If the actual scope of work, upon arrival, materially exceeds what was described during booking, the Pro may request a revised estimate, which the Customer must approve before additional work begins. If the Customer does not approve the revised estimate, the Pro will complete only the work covered by the original estimate.</p>

<h3>3.4 Payment Authorization and Capture</h3>

<p>UpTend uses Stripe to process all payments. When a Customer confirms a booking:</p>

<p>(a) A <strong>payment authorization</strong> (hold) is placed on the Customer's payment method for the estimated amount;</p>
<p>(b) No charge is captured until the service is <strong>completed and confirmed</strong>;</p>
<p>(c) Upon completion, the actual amount (which may be less than or equal to the authorized amount, but never more than the Guaranteed Price Ceiling) is captured;</p>
<p>(d) If the final amount is less than the authorized amount, the excess hold is released.</p>

<h3>3.5 Buy Now, Pay Later (BNPL)</h3>

<p>Customers may elect to pay using Klarna or Afterpay, facilitated through Stripe. BNPL transactions are subject to the terms and conditions of the respective BNPL provider. Approval for BNPL is at the sole discretion of the BNPL provider. UpTend is not responsible for BNPL approval decisions, interest charges, late fees, or any disputes between the Customer and the BNPL provider. Cancellation and refund terms in Section 11 apply to BNPL transactions; however, refund processing may take additional time due to the BNPL provider's processes.</p>

<h3>3.6 Platform Fees</h3>

<p>UpTend charges the following fees to sustain Platform operations, customer protections, insurance programs, and support:</p>

<strong>For Customers:</strong> The price displayed to Customers includes a Customer Protection Fee. This fee is incorporated into the displayed price and is never separately itemized on your receipt. <strong>What you see is what you pay.</strong>

<strong>For Pros:</strong> Pros pay a service fee on each completed job:
<ul>
<li><strong>All Pros:</strong> 15% of the job total</li>
</ul>
<p>Pro fees are automatically deducted from payouts. Full fee details are available in the Pro Dashboard and the Independent Contractor Agreement.</p>

<h3>3.7 Tips</h3>

<p>Customers may tip Pros through the Platform after service completion. Tips are 100% retained by the Pro. UpTend does not take any portion of tips.</p>

<h3>3.8 Payment Disputes</h3>

<p>If you believe a charge is incorrect, contact us at george@uptendapp.com within thirty (30) days of the charge. We will investigate and respond within ten (10) business days. Filing a chargeback with your bank or credit card company before contacting us may result in delays and may affect your account status.</p>

<h2>4. Price Match Policy</h2>

<p>UpTend offers a price match for eligible services. If a Customer provides verifiable written proof of a lower price from a licensed, insured competitor for a substantially identical service, UpTend may adjust the price, subject to a floor of 15% below our standard rate. The price match is applied as a savings to the Customer and is not publicly advertised. UpTend reserves sole discretion to approve or deny price match requests.</p>

<h2>5. Pro Classification and Insurance</h2>

<h3>5.1 Independent Contractor Status</h3>

<p>All Pros on the UpTend Platform are <strong>independent contractors</strong>. Pros are not employees, agents, joint venturers, or partners of UpTend. UpTend does not control the manner or means by which Pros perform services. Pros set their own schedules, use their own tools and equipment, and exercise independent judgment in performing their work. Nothing in these Terms creates an employment relationship between UpTend and any Pro.</p>

<h3>5.2 LLC-Verified Pros</h3>

<p>Pros who have registered a Limited Liability Company (LLC) or other business entity and have provided proof of:</p>

<p>(a) Active business registration;</p>
<p>(b) General liability insurance (minimum \$1,000,000 per occurrence); and</p>
<p>(c) Any applicable state or local licenses</p>

<p>are designated as <strong>"LLC-Verified"</strong> or <strong>"Verified"</strong> Pros on the Platform. Verified Pros carry their own insurance that covers their work.</p>

<h3>5.3 Independent (Non-LLC) Pros</h3>

<p>Pros who operate as sole proprietors without an LLC are designated as <strong>"Independent"</strong> Pros. All new Pros are covered by UpTend's platform liability policy at no additional cost while building their business on the platform. As Pros grow their earnings, they transition through a tiered insurance model: platform coverage (under $1,000 in earnings), per-job coverage recommended ($1,000-$5,000), and independent monthly GL policy required ($5,000+). This platform coverage is secondary to any insurance the Pro may carry individually and is subject to coverage limits, exclusions, and claims procedures established by UpTend's insurance provider.</p>

<h3>5.4 Insurance Disclosure to Customers</h3>

<p>Before confirming a booking, Customers can view the Pro's verification status (Verified or Independent). <strong>Verified Pros carry their own commercial insurance. Independent Pros are covered by UpTend's supplemental liability program with limited coverage.</strong> Customers are encouraged to review Pro profiles and choose the level of coverage appropriate for their needs.</p>

<h3>5.5 Background Checks and Vetting</h3>

<p>UpTend is committed to the safety and trustworthiness of Pros on our Platform. Pro vetting procedures may include manual review of identification, work history, references, and credentials. Where available and as our Pro network scales, UpTend utilizes third-party background check services (currently Checkr) for criminal background screening. <strong>Not all Pros have undergone third-party background checks.</strong> The Pro's profile will indicate the verifications that have been completed for that individual. Background checks, where performed, are a point-in-time screening and do not guarantee future conduct.</p>

<h3>5.6 Drone Operators</h3>

<p>Pros who perform Home DNA Scan services using drones are independent contractors who hold current Federal Aviation Administration (FAA) Part 107 Remote Pilot Certificates. Drone operations are conducted in compliance with applicable FAA regulations. UpTend verifies Part 107 certification prior to authorizing drone-based scan services.</p>

<h2>6. AI Features. George AI Assistant</h2>

<h3>6.1 What George Is</h3>

<p>George is UpTend's AI-powered assistant, built using Anthropic's Claude large language model. George can help you with:</p>

<ul>
<li>Getting service estimates and recommendations</li>
<li>Answering questions about home maintenance</li>
<li>Navigating the UpTend Platform</li>
<li>DIY coaching and guidance</li>
<li>Product recommendations</li>
<li>Scheduling and booking assistance</li>
</ul>
<h3>6.2 Limitations and Disclaimers</h3>

<strong>George is an AI-powered Home Service Agent, not a licensed professional.</strong> George does not provide and should not be relied upon for:

<p>(a) Professional engineering, architectural, or structural advice;</p>
<p>(b) Legal, financial, or tax advice;</p>
<p>(c) Medical or health-related guidance;</p>
<p>(d) Official home inspections or property appraisals;</p>
<p>(e) Electrical, plumbing, or HVAC advice that requires a licensed professional;</p>
<p>(f) Emergency services or safety-critical decisions.</p>

<p>George's responses are generated by artificial intelligence and may contain errors, inaccuracies, or outdated information. Always consult a qualified professional for decisions affecting safety, structural integrity, legal compliance, or significant financial expenditure.</p>

<h3>6.3 DIY Coaching</h3>

<p>George offers DIY coaching. educational guidance on home improvement and maintenance tasks that homeowners may choose to perform themselves. <strong>DIY Coaching is provided for educational and informational purposes only.</strong> By using DIY Coaching:</p>

<p>(a) You acknowledge that you are solely responsible for determining whether a task is within your skill level;</p>
<p>(b) You assume all risk of injury, property damage, or any other harm arising from your decision to perform work yourself;</p>
<p>(c) You agree that UpTend is not liable for any consequences of following or misinterpreting DIY guidance;</p>
<p>(d) You understand that some tasks require licensed professionals and applicable permits, and George will advise you to seek professional help when appropriate.</p>

<h3>6.4 Affiliate Product Recommendations</h3>

<p>George may recommend products and provide links to purchase them from third-party retailers. Some of these links are <strong>affiliate links</strong>, meaning UpTend earns a commission on qualifying purchases at no additional cost to you. See the Affiliate Disclosure (available on the Platform) for details. Affiliate relationships do not influence George's safety recommendations. George will never recommend an inferior or unsafe product because of an affiliate relationship.</p>

<h3>6.5 AI Data Usage and Privacy</h3>

<p><strong>Your data is yours. We will never sell it.</strong> UpTend does not sell, rent, license, or otherwise provide your personal information, home data, conversation history, photos, or Home DNA Scan results to any third party for their own commercial purposes. Period.</p>

<p><strong>How we use your data:</strong> Your interactions with George, including questions, descriptions of home conditions, photos submitted for analysis, and Home DNA Scan results, are used solely to (a) provide and improve the services you requested, (b) generate accurate estimates and recommendations for your home, (c) power your Home Health Score, maintenance timeline, and personalized alerts, and (d) improve the accuracy and quality of George's recommendations across the Platform.</p>

<p><strong>Third-party AI processors:</strong> To power George's capabilities, your conversations and photos are processed by our AI technology providers, currently Anthropic (Claude) for conversation and OpenAI (GPT) for photo/vision analysis. These providers process your data solely on our behalf to deliver the service to you. Under our agreements with these providers: (a) they do not use your data to train their general AI models, (b) they do not retain your data beyond what is necessary to process your request, and (c) they are contractually bound to keep your data confidential. We select AI providers that offer zero-data-retention or enterprise-grade data processing agreements. If we change AI providers, the same contractual protections will apply.</p>

<p><strong>Aggregated and anonymized data:</strong> We may use anonymized, aggregated data (which cannot be used to identify you or your specific property) to generate market insights, pricing intelligence, and general home maintenance trends. For example, "the average HVAC system in Lake Nona is 7.3 years old" is aggregated data. Your specific home's HVAC age is personal data that is never shared.</p>

<p><strong>Sponsored product recommendations:</strong> George may recommend products from brand partners who have a commercial relationship with UpTend. These recommendations are only made when the product is genuinely relevant to your home's needs. Sponsored relationships never compromise the accuracy or safety of George's recommendations. UpTend may earn revenue from these recommendations. No personal data is shared with sponsoring brands. they see only anonymized engagement metrics.</p>

<p><strong>Home DNA Scan data specifically:</strong> Your Home DNA Scan results, including photos, system inventories, appliance data, and condition assessments, are stored securely and associated with your account. This data is never shared with other users, your HOA, your property manager, or any third party without your explicit consent. If your home is part of a B2B account (HOA or property management partnership), your property manager or HOA may see aggregated portfolio-level data (e.g., "42% of units need gutter cleaning") but cannot access your individual scan details without your permission.</p>

<p><strong>Opt-out:</strong> You may request deletion of your Home DNA Scan data, conversation history, or entire account at any time by contacting george@uptendapp.com. Upon account deletion, we will delete your personal data within 30 days, except where retention is required by law or to resolve pending disputes.</p>

<h2>7. Home DNA Scan</h2>

<h3>7.1 What Home DNA Scan Is</h3>

<p>Home DNA Scan uses artificial intelligence (powered by OpenAI's vision models) to analyze photographs of your home. submitted by you or captured by a drone operator. to identify potential maintenance needs, damage, or improvement opportunities.</p>

<h3>7.2 What Home DNA Scan Is NOT</h3>

<strong>Home DNA Scan is NOT a home inspection.</strong> It is not performed by a licensed home inspector and does not constitute a home inspection under Florida law (Florida Statutes § 468.8311 et seq.) or the laws of any other state. Home DNA Scan:

<p>(a) Does not replace a professional home inspection;</p>
<p>(b) Should not be relied upon for real estate transactions, insurance claims, or legal proceedings;</p>
<p>(c) May not identify all issues, including issues not visible in photographs;</p>
<p>(d) Is informational only and provided "as-is" without warranty of accuracy or completeness;</p>
<p>(e) Cannot assess structural integrity, hidden damage, environmental hazards (mold, asbestos, lead), or systems not visible in images.</p>

<h3>7.3 Drone-Assisted Scans</h3>

<p>Where Home DNA Scan is performed using drone-captured imagery, the drone is operated by an independent contractor holding a current FAA Part 107 Remote Pilot Certificate. Drone scans are subject to weather conditions, airspace restrictions, and FAA regulations. UpTend does not guarantee the availability of drone scans in all areas.</p>

<h2>8. Affiliate Links and Product Recommendations</h2>

<h3>8.1 Disclosure</h3>

<p>UpTend participates in affiliate marketing programs, including the Amazon Associates Program (Affiliate Tag: uptend20-20) and may participate in additional programs in the future. When you click an affiliate link on our Platform or provided by George and make a qualifying purchase, UpTend earns a commission.</p>

<h3>8.2 No Additional Cost</h3>

<p>Affiliate commissions are paid by the retailer, not by you. Purchasing through our affiliate links does not increase the price you pay.</p>

<h3>8.3 FTC Compliance</h3>

<p>This disclosure is made in compliance with the Federal Trade Commission's Guides Concerning the Use of Endorsements and Testimonials in Advertising (16 CFR Part 255). For our complete Affiliate Disclosure, see the standalone document available on the Platform.</p>

<h2>9. Communications and Consent</h2>

<h3>9.1 Consent to Electronic Communications</h3>

<p>By creating an account, you consent to receive electronic communications from UpTend, including:</p>

<p>(a) <strong>Transactional messages</strong>. booking confirmations, payment receipts, service updates, Pro arrival notifications, and account security alerts;</p>
<p>(b) <strong>Service communications</strong>. platform updates, policy changes, and feature announcements;</p>
<p>(c) <strong>Marketing communications</strong>. promotions, offers, and recommendations (with opt-out).</p>

<h3>9.2 SMS/Text Messages (TCPA Compliance)</h3>

<p>By providing your phone number and using the Platform, you expressly consent to receive SMS/text messages from UpTend and its service providers (including Twilio) at the phone number provided. Messages may include booking confirmations, Pro status updates, service reminders, and marketing messages. Message frequency varies. Message and data rates may apply. <strong>Text STOP to any message to opt out of marketing messages. Text HELP for assistance.</strong> You cannot opt out of transactional messages (booking confirmations, payment receipts, safety alerts) while maintaining an active account. See our Electronic Communications Consent document for full terms.</p>

<h3>9.3 Email</h3>

<p>We send email communications via SendGrid. You may opt out of marketing emails using the unsubscribe link in any email. Transactional emails (receipts, confirmations, security alerts) cannot be opted out while maintaining an active account.</p>

<h3>9.4 Push Notifications</h3>

<p>If you enable push notifications on our mobile app, you will receive real-time updates about bookings, Pro status, and promotions. You may disable push notifications through your device settings at any time.</p>

<h2>10. Customer Responsibilities</h2>

<h3>10.1 Accurate Information</h3>

<p>Customers are responsible for providing accurate and complete information when requesting services, including:</p>

<p>(a) Accurate description of the scope of work;</p>
<p>(b) Accurate property details, including square footage, access information, and relevant conditions;</p>
<p>(c) Truthful photographs when requested;</p>
<p>(d) Disclosure of known hazards (e.g., asbestos, mold, structural instability, aggressive pets).</p>

<h3>10.2 Property Access</h3>

<p>Customers must ensure that the Pro has reasonable access to the work area at the scheduled time. Failure to provide access may result in a no-show fee (see Section 11).</p>

<h3>10.3 Safe Working Conditions</h3>

<p>Customers must provide a reasonably safe working environment. Customers must disclose any known hazards before the Pro arrives. If a Pro encounters unsafe conditions not disclosed by the Customer, the Pro may decline to perform the service, and the Customer may be charged a cancellation fee.</p>

<h3>10.4 Presence or Authorization</h3>

<p>For services performed at a Customer's property, the Customer or an authorized adult representative must be available at the start and end of service to authorize work and confirm completion, unless alternative arrangements are agreed upon through the Platform.</p>

<h2>11. Cancellation, Refund, and No-Show Policies</h2>

<h3>11.1 Customer Cancellation</h3>

<p>The following cancellation fees apply based on when the Customer cancels:</p>

<p>| Cancellation Timing | Fee |</p>
<p>|---|---|</p>
<p>| Before Pro accepts the booking | <strong>Free</strong>. no charge |</p>
<p>| After Pro accepts but before Pro is en route | <strong>Free</strong>. no charge |</p>
<p>| After Pro is en route to the job | <strong>\$25 cancellation fee</strong> |</p>
<p>| After Pro arrives at the job site | <strong>\$50 cancellation fee</strong> |</p>
<p>| After work has begun | <strong>Full charge</strong> for the estimated service amount |</p>

<h3>11.2 Pro Cancellation</h3>

<p>If a Pro cancels an accepted booking for any reason, the Customer receives a <strong>full refund</strong> of any amounts charged plus a <strong>\$25 UpTend credit</strong> for the inconvenience. UpTend will attempt to match the Customer with an available replacement Pro.</p>

<h3>11.3 Rescheduling</h3>

<p>Customers may reschedule a booking <strong>free of charge</strong> if the request is made at least <strong>two (2) hours</strong> before the scheduled service time. Rescheduling requests made less than two hours before the scheduled time are treated as cancellations under Section 11.1.</p>

<h3>11.4 Customer No-Show</h3>

<p>If a Pro arrives at the scheduled time and the Customer is not available:</p>

<p>(a) The Pro will wait for fifteen (15) minutes;</p>
<p>(b) During the wait, the Pro will attempt to contact the Customer via the Platform and by phone;</p>
<p>(c) If the Customer does not respond within 15 minutes, the booking is marked as a Customer no-show;</p>
<p>(d) A <strong>\$25 no-show fee</strong> is charged to the Customer.</p>

<h3>11.5 Pro No-Show</h3>

<p>If a Pro fails to arrive for a scheduled booking:</p>

<p>(a) The Customer receives a <strong>full refund</strong> of any amounts charged;</p>
<p>(b) The Customer receives a <strong>\$25 UpTend credit</strong>;</p>
<p>(c) UpTend will attempt to match the Customer with a replacement Pro.</p>

<h3>11.6 Pro Late Arrival</h3>

<p>If a Pro arrives late to a scheduled booking (measured from the end of the scheduled arrival window):</p>

<p>| Delay | Customer Remedy |</p>
<p>|---|---|</p>
<p>| 30 minutes to 59 minutes late | <strong>10% discount</strong> on the service |</p>
<p>| 60 minutes to 119 minutes late | <strong>25% discount</strong> on the service |</p>
<p>| 2 hours or more (or Pro does not arrive) | <strong>Full refund + \$25 credit</strong> (treated as Pro no-show) |</p>

<p>Discounts are applied automatically. If a Customer does not wish to wait, they may cancel at any time during the delay and receive a full refund.</p>

<h3>11.7 Estimate Accuracy</h3>

<p>If the actual scope of work differs from the estimate by more than 20%, either in excess or deficit, UpTend will investigate. If the discrepancy was caused by inaccurate information provided by the Customer, the revised price applies. If the discrepancy was caused by a Platform error, the Customer will be charged the lower amount and UpTend will absorb the difference.</p>

<h3>11.8 Refund Processing</h3>

<p>Refunds are processed as follows:</p>

<p>(a) <strong>Credit/debit card refunds:</strong> 5–10 business days, depending on your financial institution;</p>
<p>(b) <strong>BNPL refunds (Klarna/Afterpay):</strong> Processing times vary by provider, typically 5–14 business days;</p>
<p>(c) <strong>UpTend credits:</strong> Applied immediately and visible in your account;</p>
<p>(d) Refunds are returned to the original payment method used for the transaction.</p>

<h3>11.9 Special Circumstances</h3>

<p>UpTend may waive cancellation fees in cases of documented emergencies, severe weather events, natural disasters, or other extraordinary circumstances at our sole discretion. Customers should contact george@uptendapp.com as soon as possible with any relevant documentation.</p>

<h3>11.10 Subscription Cancellation</h3>

<p>If UpTend offers subscription-based services (e.g., recurring cleaning, lawn care plans), Customers may cancel subscriptions at any time through their account settings. Cancellation takes effect at the end of the current billing period. No refunds are issued for partial billing periods unless otherwise required by law.</p>

<h3>11.11 B2B Cancellation</h3>

<p>Business Account cancellation terms are governed by the B2B Terms of Service and any applicable service agreement.</p>

<h2>12. Service Guarantee</h2>

<h3>12.1 Price Transparency</h3>

<p>The price displayed at booking is your total price. There are no hidden fees, surcharges, or add-ons unless you approve additional work. Final charges will not exceed the Guaranteed Price Ceiling (Section 3.3).</p>

<h3>12.2 On-Time Arrival</h3>

<p>We guarantee that your Pro will arrive within the scheduled arrival window or you will receive automatic compensation as described in Section 11.6.</p>

<h3>12.3 Professionalism</h3>

<p>Every UpTend Pro is expected to conduct themselves professionally, treat your property with care, and communicate clearly. If a Pro's conduct falls below these standards, contact us within 48 hours and we will investigate and make it right, which may include partial or full refunds and credits.</p>

<h3>12.4 Satisfaction</h3>

<p>If you are not satisfied with the quality of work performed, contact us within 48 hours of service completion. We will work with you and the Pro to resolve the issue, which may include having the Pro return to address the concern at no additional cost, issuing a partial refund, or issuing an UpTend credit.</p>

<h3>12.5 Property Protection</h3>

<p>If a Pro causes damage to your property during a service:</p>

<p>(a) <strong>LLC-Verified Pros</strong> carry their own commercial general liability insurance (minimum \$1,000,000 per occurrence) that covers property damage during jobs;</p>
<p>(b) <strong>Independent Pros</strong> are covered by UpTend's supplemental liability program, which provides limited coverage for property damage during jobs;</p>
<p>(c) Report damage within 48 hours with photos and documentation to george@uptendapp.com;</p>
<p>(d) UpTend will facilitate the claims process between you and the applicable insurance.</p>

<h3>12.6 How to Make a Claim</h3>

<p>To make a claim under any guarantee:</p>

<p>(a) Contact george@uptendapp.com or use the in-app support feature within 48 hours of the incident;</p>
<p>(b) Provide your booking number, a description of the issue, and any supporting photos or documentation;</p>
<p>(c) We will respond within two (2) business days with next steps;</p>
<p>(d) Resolutions may include re-service, partial refund, full refund, UpTend credit, or insurance claim facilitation.</p>

<h2>13. Pro Accountability</h2>

<h3>13.1 Quality Standards</h3>

<p>Pros are expected to maintain professional quality standards. Consistent poor performance, as reflected in customer ratings, complaints, and claim frequency, may result in reduced booking visibility, temporary suspension, or permanent removal from the Platform.</p>

<h3>13.2 Rating System</h3>

<p>After each service, Customers may rate the Pro and leave a review. Pros may also rate Customers. Ratings are used to ensure quality and inform future bookings. Pros who consistently receive low ratings may be subject to additional training requirements, reduced visibility, or removal.</p>

<h3>13.3 Penalties</h3>

<p>Pros may be subject to the following consequences for policy violations:</p>

<p>(a) <strong>Warning</strong>. For first-time minor infractions;</p>
<p>(b) <strong>Temporary suspension</strong>. For repeated minor infractions or single serious violations;</p>
<p>(c) <strong>Permanent removal</strong>. For egregious conduct, fraud, safety violations, or repeated serious violations.</p>

<h2>14. Prohibited Items and Services</h2>

<h3>14.1 Prohibited Items</h3>

<p>Pros may not transport, handle, or dispose of the following through the Platform:</p>

<p>(a) Hazardous materials (chemicals, biohazards, radioactive materials, explosives);</p>
<p>(b) Controlled substances or drug paraphernalia;</p>
<p>(c) Firearms or ammunition;</p>
<p>(d) Medical waste;</p>
<p>(e) Asbestos-containing materials;</p>
<p>(f) Materials requiring specialized environmental remediation.</p>

<h3>14.2 Prohibited Services</h3>

<p>The Platform may not be used to book:</p>

<p>(a) Any illegal activity;</p>
<p>(b) Services requiring specific licenses not held by the Pro;</p>
<p>(c) Work that would violate building codes or require permits that have not been obtained;</p>
<p>(d) Emergency services (call 911 for emergencies);</p>
<p>(e) Services involving known structural or safety hazards without proper professional assessment.</p>

<h2>15. Ratings and Reviews</h2>

<h3>15.1 Review Policy</h3>

<p>Reviews must be honest, based on actual service experience, and not contain:</p>

<p>(a) False or misleading information;</p>
<p>(b) Personal attacks, threats, or harassment;</p>
<p>(c) Discriminatory language;</p>
<p>(d) Confidential information;</p>
<p>(e) Advertising or spam.</p>

<h3>15.2 Review Removal</h3>

<p>UpTend reserves the right to remove reviews that violate these Terms or our Acceptable Use Policy. We do not remove reviews simply because they are negative.</p>

<h3>15.3 Review Integrity</h3>

<p>Offering or accepting payment, discounts, or other incentives in exchange for reviews (positive or negative) is prohibited. Posting fake reviews is grounds for immediate account termination.</p>

<h2>16. Intellectual Property</h2>

<h3>16.1 UpTend IP</h3>

<p>The Platform, including its design, features, content, software, algorithms, AI models, trademarks (including "UpTend," "George," and the UpTend logo), and all related intellectual property, is owned by UPYCK, Inc. or its licensors. You may not copy, modify, distribute, reverse engineer, or create derivative works from any part of the Platform without our express written consent.</p>

<h3>16.2 User Content License</h3>

<p>By submitting content to the Platform (including reviews, photos, descriptions, and communications), you grant UpTend a non-exclusive, worldwide, royalty-free, perpetual, irrevocable, sublicensable license to use, reproduce, modify, adapt, publish, display, and distribute such content for the purposes of operating, improving, and promoting the Platform. You represent that you own or have the right to grant this license for any content you submit.</p>

<h3>16.3 Feedback</h3>

<p>Any feedback, suggestions, or ideas you provide about the Platform become the property of UpTend. We may use feedback without obligation or compensation to you.</p>

<h2>17. Privacy</h2>

<p>Your privacy is important to us. Our collection, use, and sharing of your personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the Platform, you consent to the practices described in the Privacy Policy.</p>

<h2>18. Third-Party Services</h2>

<h3>18.1 Integrated Services</h3>

<p>The Platform integrates with the following third-party services:</p>

<p>(a) <strong>Stripe</strong>. Payment processing, including BNPL (Klarna/Afterpay);</p>
<p>(b) <strong>Twilio</strong>. SMS and voice communications;</p>
<p>(c) <strong>SendGrid</strong>. Email delivery;</p>
<p>(d) <strong>Anthropic</strong>. Claude AI models powering George;</p>
<p>(e) <strong>OpenAI</strong>. GPT and vision models for photo analysis and Home DNA Scan;</p>
<p>(f) <strong>Amazon Associates</strong>. Affiliate product links;</p>
<p>(g) <strong>Checkr</strong>. Background check services (where applicable).</p>

<h3>18.2 Third-Party Terms</h3>

<p>Your use of third-party services integrated into the Platform is subject to those services' own terms and privacy policies. UpTend is not responsible for the practices of third-party services.</p>

<h3>18.3 Third-Party Links</h3>

<p>The Platform may contain links to third-party websites or services. UpTend does not endorse, control, or assume responsibility for the content or practices of any third-party site.</p>

<h2>19. Disclaimers</h2>

<h3>19.1 "As Is" and "As Available"</h3>

<p>THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR COURSE OF DEALING.</p>

<h3>19.2 No Guarantee of Availability</h3>

<p>We do not warrant that the Platform will be uninterrupted, error-free, secure, or free of viruses or other harmful components.</p>

<h3>19.3 No Guarantee of Pro Performance</h3>

<p>UPTEND DOES NOT GUARANTEE THE QUALITY, SAFETY, LEGALITY, OR TIMELINESS OF SERVICES PERFORMED BY PROS. UPTEND IS NOT RESPONSIBLE FOR THE ACTS OR OMISSIONS OF ANY PRO. While we provide the service guarantees described in Section 12, our remedies (refunds, credits, re-service) are your sole remedies.</p>

<h3>19.4 AI Disclaimers</h3>

<p>ALL AI-GENERATED CONTENT, INCLUDING RESPONSES FROM GEORGE, AI HOME SCAN RESULTS, AND DIY COACHING, IS PROVIDED FOR INFORMATIONAL PURPOSES ONLY AND MAY CONTAIN ERRORS. AI CONTENT DOES NOT CONSTITUTE PROFESSIONAL ADVICE AND SHOULD NOT BE RELIED UPON FOR DECISIONS AFFECTING SAFETY, HEALTH, STRUCTURAL INTEGRITY, OR LEGAL COMPLIANCE.</p>

<h3>19.5 Third-Party Products</h3>

<p>UpTend makes no warranties regarding products recommended through affiliate links or otherwise. Product claims, warranties, and returns are governed by the applicable retailer's policies.</p>

<h2>20. Limitation of Liability</h2>

<h3>20.1 Cap on Liability</h3>

<p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE TOTAL AGGREGATE LIABILITY OF UPTEND AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AND AFFILIATES, FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR YOUR USE OF THE PLATFORM, SHALL NOT EXCEED THE GREATER OF: (A) THE AMOUNTS PAID BY YOU TO UPTEND IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM; OR (B) ONE HUNDRED DOLLARS (\$100).</p>

<h3>20.2 Exclusion of Consequential Damages</h3>

<p>IN NO EVENT SHALL UPTEND BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA, OR OTHER INTANGIBLE LOSSES, REGARDLESS OF WHETHER UPTEND HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</p>

<h3>20.3 Exceptions</h3>

<p>The limitations in this Section do not apply to: (a) UpTend's obligation to pay amounts due under the cancellation and refund policies; (b) liability that cannot be excluded or limited under applicable law; or (c) claims arising from UpTend's gross negligence or willful misconduct.</p>

<h2>21. Indemnification</h2>

<h3>21.1 Customer Indemnification</h3>

<p>You agree to indemnify, defend, and hold harmless UpTend and its officers, directors, employees, agents, and affiliates from and against any claims, liabilities, damages, losses, costs, and expenses (including reasonable attorneys' fees) arising out of or relating to: (a) your use of the Platform; (b) your violation of these Terms; (c) your violation of any applicable law; (d) any content you submit to the Platform; or (e) your interaction with any Pro.</p>

<h3>21.2 Pro Indemnification</h3>

<p>Pros agree to indemnify, defend, and hold harmless UpTend and its officers, directors, employees, agents, and affiliates from and against any claims, liabilities, damages, losses, costs, and expenses (including reasonable attorneys' fees) arising out of or relating to: (a) services performed or failed to be performed; (b) violation of these Terms or the Independent Contractor Agreement; (c) violation of any applicable law, regulation, or licensing requirement; (d) personal injury or property damage caused by the Pro's acts or omissions; or (e) any employment or tax-related claim.</p>

<h2>22. Dispute Resolution and Arbitration</h2>

<h3>22.1 Informal Resolution</h3>

<p>Before initiating formal dispute resolution, you agree to contact us at legal@uptendapp.com and attempt to resolve the dispute informally for at least thirty (30) days.</p>

<h3>22.2 Binding Arbitration</h3>

<p>If informal resolution is unsuccessful, <strong>any dispute, claim, or controversy arising out of or relating to these Terms or the Platform shall be resolved by binding arbitration</strong> administered by the American Arbitration Association ("AAA") under its Consumer Arbitration Rules (or Commercial Arbitration Rules for B2B disputes), as in effect at the time the claim is filed.</p>

<h3>22.3 Arbitration Location</h3>

<p>Arbitration shall take place in <strong>Orange County, Florida</strong>, unless the parties mutually agree to a different location. For claims under \$25,000, arbitration may be conducted entirely by written submission or videoconference at the claimant's election.</p>

<h3>22.4 Arbitration Fees</h3>

<p>If you initiate arbitration, UpTend will pay all AAA filing and administration fees and arbitrator fees for claims under \$75,000, except that if the arbitrator finds the claim was frivolous, fees may be allocated as the arbitrator determines. For claims of \$75,000 or more, fees are allocated according to AAA rules.</p>

<h3>22.5 Arbitrator's Authority</h3>

<p>The arbitrator shall have exclusive authority to resolve all disputes, including the scope, enforceability, and arbitrability of this arbitration provision. The arbitrator may grant any remedy that would be available in court, except that the arbitrator may not award relief to anyone who is not a party to the arbitration.</p>

<h3>22.6 Opt-Out</h3>

<p>You may opt out of this arbitration provision by sending written notice to legal@uptendapp.com within thirty (30) days of first accepting these Terms. The notice must include your name, account email, and a clear statement that you wish to opt out of arbitration. If you opt out, you retain all rights to pursue claims in court.</p>

<h3>22.7 Survival</h3>

<p>This arbitration provision survives termination of your account and these Terms.</p>

<h2>23. Class Action Waiver</h2>

<strong>YOU AND UPTEND AGREE THAT EACH PARTY MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS, COLLECTIVE, CONSOLIDATED, OR REPRESENTATIVE PROCEEDING.</strong> The arbitrator may not consolidate more than one person's claims and may not preside over any form of representative or class proceeding. If this class action waiver is found to be unenforceable, then the entirety of Section 22 (Arbitration) shall be null and void, and the dispute shall be decided by a court.

<h2>24. Jury Trial Waiver</h2>

<strong>IF FOR ANY REASON A CLAIM PROCEEDS IN COURT RATHER THAN IN ARBITRATION, YOU AND UPTEND EACH WAIVE THE RIGHT TO A JURY TRIAL.</strong>

<h2>25. Governing Law</h2>

<p>These Terms shall be governed by and construed in accordance with the laws of the <strong>State of Florida</strong>, without regard to its conflict of law principles. To the extent court proceedings are permitted under these Terms, you consent to the exclusive jurisdiction and venue of the state and federal courts located in <strong>Orange County, Florida</strong>.</p>

<h2>26. General Provisions</h2>

<h3>26.1 Severability</h3>

<p>If any provision of these Terms is found to be invalid or unenforceable, that provision shall be enforced to the maximum extent permissible, and the remaining provisions shall continue in full force and effect.</p>

<h3>26.2 Entire Agreement</h3>

<p>These Terms, together with the Privacy Policy, Cancellation & Refund Policy, Service Guarantee, Acceptable Use Policy, Electronic Communications Consent, Cookie Policy, Affiliate Disclosure, and (for applicable users) the B2B Terms of Service and Independent Contractor Agreement, constitute the entire agreement between you and UpTend regarding the Platform.</p>

<h3>26.3 Modification</h3>

<p>We may modify these Terms at any time by posting the revised version on the Platform with an updated effective date. Material changes will be communicated via email or in-app notification at least thirty (30) days before taking effect. Your continued use of the Platform after the effective date constitutes acceptance of the modified Terms. If you do not agree to the changes, you must stop using the Platform and close your account.</p>

<h3>26.4 Assignment</h3>

<p>You may not assign or transfer your rights under these Terms without our prior written consent. UpTend may assign its rights and obligations under these Terms without restriction.</p>

<h3>26.5 Waiver</h3>

<p>The failure of UpTend to enforce any right or provision of these Terms shall not constitute a waiver of that right or provision.</p>

<h3>26.6 Force Majeure</h3>

<p>UpTend shall not be liable for any failure or delay in performance due to causes beyond its reasonable control, including natural disasters, pandemics, government actions, power outages, internet failures, or labor disputes.</p>

<h2>27. Termination</h2>

<h3>27.1 Termination by You</h3>

<p>You may terminate your account at any time by contacting george@uptendapp.com or through your account settings. Termination does not release you from obligations incurred prior to termination, including outstanding payments and pending disputes.</p>

<h3>27.2 Termination by UpTend</h3>

<p>We may suspend or terminate your account at any time, with or without cause, with or without notice. Grounds for termination include but are not limited to: violation of these Terms, fraudulent activity, abusive behavior, safety concerns, and failure to maintain required credentials (for Pros).</p>

<h3>27.3 Effect of Termination</h3>

<p>Upon termination: (a) your right to access the Platform ceases immediately; (b) outstanding payment obligations survive; (c) provisions that by their nature should survive (including Sections 16, 19, 20, 21, 22, 23, 24, 25, and 26) shall survive termination.</p>

<h2>28. Cookie Consent</h2>

<p>By using the Platform, you consent to the use of cookies and similar technologies as described in our Cookie Policy. You can manage your cookie preferences through the cookie settings on our Platform.</p>

<h2>29. Contact Information</h2>

<strong>UPYCK, Inc. d/b/a UpTend</strong>
<p>Orlando, FL 32801</p>
<p>Phone: (407) 338-3342</p>
<p>General Support: george@uptendapp.com</p>
<p>Legal Inquiries: legal@uptendapp.com</p>
<p>Privacy Inquiries: privacy@uptendapp.com</p>
<p>Website: https://uptendapp.com</p>
` }} />
    </LegalPage>
  );
}
