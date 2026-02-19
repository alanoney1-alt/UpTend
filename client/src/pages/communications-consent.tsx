import { MessageSquare } from "lucide-react";
import { LegalPage } from "./legal/legal-page";

export default function Communicationsconsent() {
  return (
    <LegalPage title="Electronic Communications Consent" icon={<MessageSquare className="w-12 h-12" />} lastUpdated="February 19, 2026">
      <div dangerouslySetInnerHTML={{ __html: `

<strong>UPYCK, Inc. d/b/a UpTend — Electronic Communications Consent</strong>
<strong>Effective Date: February 19, 2026</strong>

<p>By creating an account on the UpTend Platform, you consent to receive electronic communications from UPYCK, Inc. d/b/a UpTend ("UpTend") as described below. This consent is provided in compliance with the Telephone Consumer Protection Act ("TCPA"), the CAN-SPAM Act, and applicable state laws.</p>

<h2>1. Types of Communications</h2>

<h3>1.1 Transactional Communications</h3>

<p>These are messages directly related to your use of the Platform and cannot be opted out while maintaining an active account:</p>

<ul>
<li>Booking confirmations and updates</li>
<li>Payment receipts and refund notifications</li>
<li>Pro assignment and arrival notifications</li>
<li>Service completion confirmations</li>
<li>Account security alerts (password changes, suspicious activity)</li>
<li>Policy updates and Terms of Service changes</li>
<li>Responses to your support inquiries</li>
</ul>
<h3>1.2 Service Communications</h3>

<p>These are messages about Platform features and improvements:</p>

<ul>
<li>New feature announcements</li>
<li>Service area expansions</li>
<li>Platform maintenance notifications</li>
<li>Seasonal service reminders</li>
</ul>
<h3>1.3 Marketing Communications</h3>

<p>These are promotional messages:</p>

<ul>
<li>Special offers and discounts</li>
<li>Referral program information</li>
<li>Seasonal promotions</li>
<li>Partner offers</li>
<li>George AI recommendations and tips</li>
</ul>
<h2>2. Communication Channels</h2>

<h3>2.1 SMS/Text Messages</h3>

<strong>By providing your phone number, you expressly consent to receive SMS/text messages from UpTend and its service providers (Twilio) at the number provided.</strong>

<ul>
<li><strong>Message frequency:</strong> Varies. Transactional messages are sent as needed (typically 3–10 per booking). Marketing messages are limited to no more than 8 per month.</li>
<li><strong>Message and data rates may apply.</strong> Contact your wireless carrier for details about your plan.</li>
<li><strong>Text STOP</strong> to any message to opt out of marketing messages. You will receive a confirmation message. Transactional messages will continue.</li>
<li><strong>Text HELP</strong> to any message for assistance, or contact support@uptendapp.com.</li>
<li><strong>Supported carriers:</strong> All major U.S. carriers are supported. UpTend is not responsible for delayed or undelivered messages caused by carrier issues.</li>
</ul>
<h3>2.2 Email</h3>

<p>We send emails via SendGrid to the email address associated with your account.</p>

<ul>
<li><strong>Transactional emails</strong> are sent automatically and cannot be opted out while your account is active</li>
<li><strong>Marketing emails</strong> include an <strong>unsubscribe link</strong> at the bottom of every message — click it to opt out</li>
<li>We honor unsubscribe requests within <strong>ten (10) business days</strong> as required by the CAN-SPAM Act</li>
</ul>
<h3>2.3 Push Notifications</h3>

<p>If you install our mobile app and enable push notifications:</p>

<ul>
<li>You will receive real-time updates about bookings, Pro status, and time-sensitive service information</li>
<li>You may also receive promotional notifications</li>
<li><strong>To opt out:</strong> Disable push notifications in your device settings (iOS: Settings → Notifications → UpTend; Android: Settings → Apps → UpTend → Notifications)</li>
</ul>
<h3>2.4 In-App Messages</h3>

<p>We may display messages, banners, and notifications within the Platform interface. These cannot be separately opted out as they are part of the Platform experience.</p>

<h2>3. How to Opt Out</h2>

<p>| Channel | Marketing Opt-Out | Transactional Opt-Out |</p>
<p>|---|---|---|</p>
<p>| <strong>SMS</strong> | Text STOP to any message | Cannot opt out while account is active |</p>
<p>| <strong>Email</strong> | Click unsubscribe link in any marketing email | Cannot opt out while account is active |</p>
<p>| <strong>Push Notifications</strong> | Disable in device settings | Disable in device settings (may affect service experience) |</p>
<p>| <strong>In-App Messages</strong> | Not available | Not available |</p>

<strong>To stop all communications:</strong> Close your account by contacting support@uptendapp.com. After account closure, you will receive no further messages except as required by law (e.g., tax documents).

<h2>4. Consent Withdrawal</h2>

<p>You may withdraw your consent to marketing communications at any time using the methods described above. Withdrawal of consent to transactional communications requires account closure. Withdrawal does not affect the lawfulness of communications sent before withdrawal.</p>

<h2>5. Contact</h2>

<p>For questions about electronic communications:</p>

<strong>Email:</strong> support@uptendapp.com
<strong>Phone:</strong> (407) 338-3342
<strong>Text HELP</strong> for SMS assistance

` }} />
    </LegalPage>
  );
}
