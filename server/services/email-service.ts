import nodemailer from "nodemailer";

// ─── Transport Setup ───────────────────────────────────────────────
let transporter: nodemailer.Transporter;

if (process.env.SENDGRID_API_KEY) {
 transporter = nodemailer.createTransport({
 host: "smtp.sendgrid.net",
 port: 587,
 auth: { user: "apikey", pass: process.env.SENDGRID_API_KEY },
 });
} else if (process.env.SMTP_HOST) {
 transporter = nodemailer.createTransport({
 host: process.env.SMTP_HOST,
 port: parseInt(process.env.SMTP_PORT || "587"),
 auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
 });
} else {
 // Dev fallback — log to console
 transporter = nodemailer.createTransport({ jsonTransport: true });
}

const FROM = process.env.FROM_EMAIL || "UpTend <noreply@uptendapp.com>";
const isDev = !process.env.SENDGRID_API_KEY && !process.env.SMTP_HOST;

// ─── Helpers ───────────────────────────────────────────────────────
function wrap(title: string, body: string): string {
 return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
<tr><td style="background:#F47C20;padding:24px 32px">
 <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700"> UpTend</h1>
</td></tr>
<tr><td style="padding:32px">
 <h2 style="margin:0 0 16px;color:#222;font-size:20px">${title}</h2>
 ${body}
</td></tr>
<tr><td style="padding:16px 32px;background:#fafafa;color:#999;font-size:12px;text-align:center">
 © ${new Date().getFullYear()} UpTend — Home services, simplified.
</td></tr>
</table></td></tr></table></body></html>`;
}

function money(dollars: number | string | null | undefined): string {
 const n = Number(dollars) || 0;
 return "$" + n.toFixed(2);
}

async function send(to: string, subject: string, html: string, text: string) {
 const info = await transporter.sendMail({ from: FROM, to, subject, html, text });
 if (isDev) {
 const parsed = JSON.parse(info.message);
 console.log(`[EMAIL] → ${parsed.to} | ${parsed.subject}`);
 console.log(`[EMAIL] Text: ${text.slice(0, 200)}...`);
 }
 return info;
}

// ─── Email Functions ───────────────────────────────────────────────
export async function sendBookingConfirmation(to: string, booking: any) {
 const html = wrap("Booking Confirmed! ", `
 <p style="color:#555;line-height:1.6">Your service request has been submitted and we're matching you with a pro.</p>
 <table style="width:100%;border-collapse:collapse;margin:16px 0">
 <tr><td style="padding:8px 0;color:#888;width:140px">Service</td><td style="padding:8px 0;font-weight:600">${booking.serviceType || "General"}</td></tr>
 <tr><td style="padding:8px 0;color:#888">Address</td><td style="padding:8px 0">${booking.pickupAddress || booking.address || "On file"}</td></tr>
 <tr><td style="padding:8px 0;color:#888">Load Size</td><td style="padding:8px 0">${booking.loadEstimate || "Standard"}</td></tr>
 <tr><td style="padding:8px 0;color:#888">Est. Price</td><td style="padding:8px 0;font-weight:600;color:#F47C20">${money(booking.priceEstimate || booking.livePrice)}</td></tr>
 </table>
 <p style="color:#555">We'll notify you as soon as a pro accepts your job.</p>
 `);
 const text = `Booking confirmed! Service: ${booking.serviceType}, Est. Price: ${money(booking.priceEstimate)}. We're matching you with a pro now.`;
 return send(to, "Your UpTend Booking is Confirmed!", html, text);
}

export async function sendJobAccepted(to: string, booking: any, pro: any) {
 const photoHtml = pro.profilePhoto
 ? `<img src="${pro.profilePhoto}" style="width:60px;height:60px;border-radius:50%;margin-right:12px" alt="">`
 : "";
 const html = wrap("A Pro Accepted Your Job! ", `
 <p style="color:#555;line-height:1.6">Great news — a pro is on the way.</p>
 <div style="display:flex;align-items:center;margin:16px 0;padding:16px;background:#f9f9f9;border-radius:8px">
 ${photoHtml}
 <div>
 <div style="font-weight:600;font-size:16px">${pro.firstName || pro.name || "Your Pro"}</div>
 <div style="color:#888">ETA: ~${pro.etaMinutes || 30} minutes</div>
 </div>
 </div>
 <table style="width:100%;border-collapse:collapse;margin:16px 0">
 <tr><td style="padding:8px 0;color:#888;width:140px">Service</td><td style="padding:8px 0">${booking.serviceType || "General"}</td></tr>
 <tr><td style="padding:8px 0;color:#888">Address</td><td style="padding:8px 0">${booking.pickupAddress || "On file"}</td></tr>
 </table>
 `);
 const text = `Your job was accepted by ${pro.firstName || "a pro"}! ETA: ~${pro.etaMinutes || 30} min.`;
 return send(to, "Your UpTend Pro is On the Way!", html, text);
}

export async function sendJobStarted(to: string, booking: any) {
 const html = wrap("Job In Progress ", `
 <p style="color:#555;line-height:1.6">Your pro has started working on your ${booking.serviceType || "service"} request.</p>
 <p style="color:#555">You'll receive a notification when the job is complete.</p>
 `);
 const text = `Your ${booking.serviceType || "service"} job is now in progress!`;
 return send(to, "Your UpTend Job Has Started!", html, text);
}

export async function sendJobCompleted(to: string, booking: any, receipt: any) {
 const serviceCost = Number(receipt.finalPrice || receipt.livePrice || 0);
 const platformFee = Number(receipt.platformFee || Math.round(serviceCost * 0.15));
 const total = serviceCost;

 const html = wrap("Job Complete — Receipt ", `
 <p style="color:#555;line-height:1.6">Your job has been completed. Here's your receipt:</p>
 <table style="width:100%;border-collapse:collapse;margin:16px 0">
 <tr><td style="padding:8px 0;color:#888">Service</td><td style="padding:8px 0;text-align:right">${booking.serviceType || "General"}</td></tr>
 <tr><td style="padding:8px 0;color:#888">Load Size</td><td style="padding:8px 0;text-align:right">${booking.loadEstimate || "Standard"}</td></tr>
 <tr style="border-top:1px solid #eee"><td style="padding:8px 0;color:#888">Service Cost</td><td style="padding:8px 0;text-align:right">${money(serviceCost - platformFee)}</td></tr>
 <tr><td style="padding:8px 0;color:#888">Platform Fee</td><td style="padding:8px 0;text-align:right">${money(platformFee)}</td></tr>
 <tr style="border-top:2px solid #F47C20"><td style="padding:12px 0;font-weight:700;font-size:16px">Total</td><td style="padding:12px 0;text-align:right;font-weight:700;font-size:16px;color:#F47C20">${money(total)}</td></tr>
 </table>
 <p style="color:#555">Thank you for using UpTend! We'd love your feedback.</p>
 `);
 const text = `Job complete! Total: ${money(total)}. Service: ${booking.serviceType}. Thanks for using UpTend!`;
 return send(to, "Your UpTend Receipt", html, text);
}

export async function sendProNewJob(to: string, job: any) {
 const html = wrap("New Job Available! ", `
 <p style="color:#555;line-height:1.6">A new job matching your profile is available.</p>
 <table style="width:100%;border-collapse:collapse;margin:16px 0">
 <tr><td style="padding:8px 0;color:#888;width:140px">Service</td><td style="padding:8px 0;font-weight:600">${job.serviceType || "General"}</td></tr>
 <tr><td style="padding:8px 0;color:#888">Load Size</td><td style="padding:8px 0">${job.loadEstimate || "Standard"}</td></tr>
 <tr><td style="padding:8px 0;color:#888">Location</td><td style="padding:8px 0">${job.pickupAddress || "See app"}</td></tr>
 <tr><td style="padding:8px 0;color:#888">Est. Payout</td><td style="padding:8px 0;font-weight:600;color:#F47C20">${money(job.priceEstimate || job.livePrice)}</td></tr>
 </table>
 <p style="color:#555">Open the UpTend app to accept this job before it's taken!</p>
 `);
 const text = `New ${job.serviceType} job available! Est. payout: ${money(job.priceEstimate)}. Open UpTend to accept.`;
 return send(to, "New UpTend Job Available!", html, text);
}

export async function sendDisputeAlert(to: string, dispute: any, job: any, customer: any) {
 const amt = money(dispute.amount / 100);
 const customerName = customer ? `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "Unknown" : "Unknown";
 const html = wrap(" Chargeback Dispute Alert", `
 <p style="color:#c00;font-weight:bold;font-size:16px">A chargeback dispute has been filed!</p>
 <table style="width:100%;border-collapse:collapse;margin:16px 0">
 <tr><td style="padding:8px 0;color:#555;border-bottom:1px solid #eee"><strong>Dispute ID</strong></td><td style="padding:8px 0;border-bottom:1px solid #eee">${dispute.id}</td></tr>
 <tr><td style="padding:8px 0;color:#555;border-bottom:1px solid #eee"><strong>Amount</strong></td><td style="padding:8px 0;border-bottom:1px solid #eee">${amt}</td></tr>
 <tr><td style="padding:8px 0;color:#555;border-bottom:1px solid #eee"><strong>Reason</strong></td><td style="padding:8px 0;border-bottom:1px solid #eee">${dispute.reason || "unknown"}</td></tr>
 <tr><td style="padding:8px 0;color:#555;border-bottom:1px solid #eee"><strong>Customer</strong></td><td style="padding:8px 0;border-bottom:1px solid #eee">${customerName} (${customer?.email || "N/A"})</td></tr>
 <tr><td style="padding:8px 0;color:#555;border-bottom:1px solid #eee"><strong>Service</strong></td><td style="padding:8px 0;border-bottom:1px solid #eee">${job?.serviceType || "N/A"}</td></tr>
 <tr><td style="padding:8px 0;color:#555;border-bottom:1px solid #eee"><strong>Job ID</strong></td><td style="padding:8px 0;border-bottom:1px solid #eee">${job?.id || "N/A"}</td></tr>
 <tr><td style="padding:8px 0;color:#555;border-bottom:1px solid #eee"><strong>TOS Accepted</strong></td><td style="padding:8px 0;border-bottom:1px solid #eee">${job?.tosAcceptedAt || "Not recorded"}</td></tr>
 <tr><td style="padding:8px 0;color:#555;border-bottom:1px solid #eee"><strong>Customer Signoff</strong></td><td style="padding:8px 0;border-bottom:1px solid #eee">${job?.customerSignoffAt || "Not signed"}</td></tr>
 </table>
 <p style="color:#555">Evidence has been automatically compiled and submitted to Stripe. Check your Stripe Dashboard for details.</p>
 `);
 const text = `DISPUTE ALERT: ${dispute.id} | Amount: ${amt} | Reason: ${dispute.reason} | Customer: ${customerName} | Job: ${job?.id}`;
 return send(to, " Chargeback Dispute — " + amt, html, text);
}

export async function sendWelcomeEmail(to: string, user: any) {
 const html = wrap("Welcome to UpTend! ", `
 <p style="color:#555;line-height:1.6">Hi ${user.firstName || "there"},</p>
 <p style="color:#555;line-height:1.6">Welcome to UpTend — home services, simplified. Here's how to get started:</p>
 <ol style="color:#555;line-height:2">
 <li><strong>Add a payment method</strong> — You won't be charged until you confirm a booking</li>
 <li><strong>Book a service</strong> — Junk removal, moving help, cleaning & more</li>
 <li><strong>Get matched</strong> — We'll connect you with a vetted local pro</li>
 <li><strong>Relax</strong> — Track your job in real-time</li>
 </ol>
 <div style="text-align:center;margin:24px 0">
 <a href="${process.env.APP_URL || 'https://uptend.com'}" style="background:#F47C20;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">Book Your First Service</a>
 </div>
 `);
 const text = `Welcome to UpTend, ${user.firstName || "there"}! Add a payment method, book a service, and get matched with a local pro. Visit uptend.com to get started.`;
 return send(to, "Welcome to UpTend! ", html, text);
}

export async function sendProEnRoute(to: string, booking: any, pro: any) {
 const html = wrap("Your Pro is On the Way! ", `
 <p style="color:#555;line-height:1.6">${pro.firstName || pro.name || "Your Pro"} is heading to your location now.</p>
 <table style="width:100%;border-collapse:collapse;margin:16px 0">
 <tr><td style="padding:8px 0;color:#888;width:140px">Service</td><td style="padding:8px 0">${booking.serviceType || "General"}</td></tr>
 <tr><td style="padding:8px 0;color:#888">Address</td><td style="padding:8px 0">${booking.pickupAddress || "On file"}</td></tr>
 <tr><td style="padding:8px 0;color:#888">ETA</td><td style="padding:8px 0;font-weight:600;color:#F47C20">~${pro.etaMinutes || 30} minutes</td></tr>
 </table>
 <p style="color:#555">Please be ready at the service location.</p>
 `);
 const text = `Your Pro ${pro.firstName || ""} is on the way! ETA: ~${pro.etaMinutes || 30} min.`;
 return send(to, "Your UpTend Pro is En Route!", html, text);
}

export async function sendReviewReceived(to: string, review: any, job: any) {
 const stars = "".repeat(review.rating);
 const html = wrap("You Received a Review! " + stars, `
 <p style="color:#555;line-height:1.6">A customer left you a review for your ${job.serviceType || "service"} job.</p>
 <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin:16px 0">
 <div style="font-size:20px;margin-bottom:8px">${stars}</div>
 ${review.comment ? `<p style="color:#555;font-style:italic">"${review.comment}"</p>` : ""}
 </div>
 <p style="color:#555">Keep up the great work!</p>
 `);
 const text = `You received a ${review.rating}-star review${review.comment ? `: "${review.comment}"` : ""}. Great job!`;
 return send(to, `New ${review.rating}-Star Review!`, html, text);
}

export async function sendProPaymentProcessed(to: string, payout: any) {
 const html = wrap("Payment Processed! ", `
 <p style="color:#555;line-height:1.6">Your payout has been processed and is on the way to your account.</p>
 <table style="width:100%;border-collapse:collapse;margin:16px 0">
 <tr><td style="padding:8px 0;color:#888;width:140px">Job</td><td style="padding:8px 0">${payout.serviceType || "Service"}</td></tr>
 <tr><td style="padding:8px 0;color:#888">Payout Amount</td><td style="padding:8px 0;font-weight:600;color:#F47C20">${money(payout.haulerPayout || payout.amount)}</td></tr>
 <tr><td style="padding:8px 0;color:#888">Completed</td><td style="padding:8px 0">${payout.completedAt ? new Date(payout.completedAt).toLocaleDateString() : "Today"}</td></tr>
 </table>
 <p style="color:#555">Funds typically arrive within 2-3 business days.</p>
 `);
 const text = `Payment of ${money(payout.haulerPayout || payout.amount)} processed for your ${payout.serviceType || "service"} job. Arriving in 2-3 business days.`;
 return send(to, "UpTend Payout Processed!", html, text);
}

export async function sendReviewReminder(to: string, booking: any) {
 const html = wrap("How Was Your Service? ", `
 <p style="color:#555;line-height:1.6">Your ${booking.serviceType || "service"} job was completed yesterday. We'd love to hear how it went!</p>
 <div style="text-align:center;margin:24px 0">
 <a href="${process.env.APP_URL || 'https://uptend.com'}/review/${booking.id}" style="background:#F47C20;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">Leave a Review</a>
 </div>
 <p style="color:#555">Your feedback helps pros improve and helps other customers choose the right pro.</p>
 `);
 const text = `How was your ${booking.serviceType || "service"} job? Leave a review at uptend.com. Your feedback matters!`;
 return send(to, "Rate Your UpTend Experience ", html, text);
}

export async function sendDisputeFiledCustomer(to: string, dispute: any, job: any) {
 const html = wrap("Dispute Filed", `
 <p style="color:#555;line-height:1.6">A dispute has been filed for your ${job.serviceType || "service"} job.</p>
 <table style="width:100%;border-collapse:collapse;margin:16px 0">
 <tr><td style="padding:8px 0;color:#888;width:140px">Job</td><td style="padding:8px 0">${job.serviceType || "Service"}</td></tr>
 <tr><td style="padding:8px 0;color:#888">Amount</td><td style="padding:8px 0">${money((dispute.amount || 0) / 100)}</td></tr>
 <tr><td style="padding:8px 0;color:#888">Reason</td><td style="padding:8px 0">${dispute.reason || "Under review"}</td></tr>
 </table>
 <p style="color:#555">Our team is reviewing this matter. You'll be contacted if we need additional information.</p>
 `);
 const text = `A dispute has been filed for your job. Amount: ${money((dispute.amount || 0) / 100)}. Our team is reviewing.`;
 return send(to, "UpTend Dispute Notice", html, text);
}

export async function sendAdminNewSignup(to: string, user: any) {
 const html = wrap("New User Signup ", `
 <p style="color:#555;line-height:1.6">A new user has registered on UpTend.</p>
 <table style="width:100%;border-collapse:collapse;margin:16px 0">
 <tr><td style="padding:8px 0;color:#888;width:140px">Name</td><td style="padding:8px 0">${user.firstName || ""} ${user.lastName || ""}</td></tr>
 <tr><td style="padding:8px 0;color:#888">Email</td><td style="padding:8px 0">${user.email}</td></tr>
 <tr><td style="padding:8px 0;color:#888">Role</td><td style="padding:8px 0">${user.role || "customer"}</td></tr>
 </table>
 `);
 const text = `New signup: ${user.firstName || ""} ${user.lastName || ""} (${user.email}) — ${user.role || "customer"}`;
 return send(to, "New UpTend Signup", html, text);
}

export async function sendAdminHighValueBooking(to: string, booking: any) {
 const html = wrap(" High-Value Booking Alert", `
 <p style="color:#555;line-height:1.6">A high-value booking has been created.</p>
 <table style="width:100%;border-collapse:collapse;margin:16px 0">
 <tr><td style="padding:8px 0;color:#888;width:140px">Service</td><td style="padding:8px 0">${booking.serviceType || "General"}</td></tr>
 <tr><td style="padding:8px 0;color:#888">Estimated Price</td><td style="padding:8px 0;font-weight:600;color:#F47C20">${money(booking.priceEstimate || booking.livePrice)}</td></tr>
 <tr><td style="padding:8px 0;color:#888">Customer</td><td style="padding:8px 0">${booking.customerEmail || "Unknown"}</td></tr>
 <tr><td style="padding:8px 0;color:#888">Address</td><td style="padding:8px 0">${booking.pickupAddress || "On file"}</td></tr>
 </table>
 `);
 const text = `High-value booking: ${booking.serviceType} — ${money(booking.priceEstimate || booking.livePrice)} from ${booking.customerEmail}`;
 return send(to, " High-Value Booking — " + money(booking.priceEstimate || booking.livePrice), html, text);
}

export async function sendBackgroundCheckStatus(to: string, check: any) {
 const statusLabels: Record<string, string> = { clear: " Cleared", flagged: " Flagged", failed: " Failed", pending: " Pending" };
 const label = statusLabels[check.status] || check.status;
 const html = wrap("Background Check Update", `
 <p style="color:#555;line-height:1.6">Your background check status has been updated.</p>
 <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin:16px 0;text-align:center">
 <div style="font-size:20px;font-weight:600">${label}</div>
 </div>
 ${check.status === "clear" ? '<p style="color:#555">You\'re all set! You can now accept jobs on UpTend.</p>' : '<p style="color:#555">If you have questions, please contact our support team.</p>'}
 `);
 const text = `Background check update: ${label}. ${check.status === "clear" ? "You can now accept jobs." : "Contact support with questions."}`;
 return send(to, "Background Check Update — " + label, html, text);
}

export async function sendScopeChangeEmail(to: string, scopeChange: any, job: any) {
 const html = wrap("Scope Change Requested ", `
 <p style="color:#555;line-height:1.6">Your Pro has requested a scope change for your ${job.serviceType || "service"} job.</p>
 <table style="width:100%;border-collapse:collapse;margin:16px 0">
 <tr><td style="padding:8px 0;color:#888;width:140px">Original Price</td><td style="padding:8px 0">${money(scopeChange.originalCeiling)}</td></tr>
 <tr><td style="padding:8px 0;color:#888">Proposed Price</td><td style="padding:8px 0;font-weight:600;color:#F47C20">${money(scopeChange.proposedCeiling)}</td></tr>
 <tr><td style="padding:8px 0;color:#888">Reason</td><td style="padding:8px 0">${scopeChange.reason || "See app for details"}</td></tr>
 </table>
 <p style="color:#c00;font-weight:600">This request expires in 15 minutes. Please respond in the app.</p>
 <div style="text-align:center;margin:24px 0">
 <a href="${process.env.APP_URL || 'https://uptend.com'}" style="background:#F47C20;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">Review & Respond</a>
 </div>
 `);
 const text = `Scope change requested: ${money(scopeChange.originalCeiling)} → ${money(scopeChange.proposedCeiling)}. Reason: ${scopeChange.reason}. Respond within 15 min in the app.`;
 return send(to, "Scope Change Request — Action Needed!", html, text);
}

export async function sendB2BWelcome(to: string, account: any) {
 const html = wrap("Welcome to UpTend for Business! ", `
 <p style="color:#555;line-height:1.6">Hi ${account.contactName || "there"},</p>
 <p style="color:#555;line-height:1.6">Welcome to UpTend's business platform. Your account <strong>${account.businessName || ""}</strong> is set up and ready to go.</p>
 <ul style="color:#555;line-height:2">
 <li>Schedule recurring services</li>
 <li>Manage your team's access</li>
 <li>Track spending with consolidated invoicing</li>
 <li>Priority pro matching for business accounts</li>
 </ul>
 <div style="text-align:center;margin:24px 0">
 <a href="${process.env.APP_URL || 'https://uptend.com'}/business" style="background:#F47C20;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">Go to Business Dashboard</a>
 </div>
 `);
 const text = `Welcome to UpTend for Business, ${account.contactName || "there"}! Your account ${account.businessName || ""} is ready. Visit uptend.com/business to get started.`;
 return send(to, "Welcome to UpTend for Business! ", html, text);
}

// ─── Customer Post-Job Sequence ────────────────────────────────────

const APP_URL = () => process.env.APP_URL || "https://uptendapp.com";

export async function sendReviewRequest(to: string, data: { customerName: string; proFirstName: string; proName: string; serviceType: string; jobId: string }) {
  const html = wrap(`How did ${data.proFirstName} do?`, `
  <p style="color:#555;line-height:1.6">Hi ${data.customerName},</p>
  <p style="color:#555;line-height:1.6">Your ${data.serviceType} was completed yesterday by ${data.proName}. We hope everything looks great!</p>
  <p style="color:#555;line-height:1.6">Your feedback helps other homeowners choose the right pro — and helps ${data.proName} grow their business.</p>
  <div style="text-align:center;margin:24px 0">
    <a href="${APP_URL()}/review/${data.jobId}" style="background:#F47C20;color:#fff;padding:14px 36px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;font-size:16px">Leave a Review</a>
  </div>
  <p style="color:#555;line-height:1.6">Your honest review takes 30 seconds and makes a real difference.</p>
  <p style="color:#888;font-size:13px;margin-top:24px">Questions about your service? Reply to this email or call us at (407) 338-3342</p>
  `);
  const text = `Hi ${data.customerName}, your ${data.serviceType} was completed yesterday by ${data.proName}. Leave a review at ${APP_URL()}/review/${data.jobId} — it takes 30 seconds and makes a real difference.`;
  return send(to, `How did ${data.proFirstName} do?`, html, text);
}

export async function sendHomeScoreUpdate(to: string, data: { customerName: string; serviceType: string; pointsAdded: number; totalScore: number }) {
  const html = wrap("Your home just leveled up", `
  <p style="color:#555;line-height:1.6">Hi ${data.customerName},</p>
  <p style="color:#555;line-height:1.6">Your ${data.serviceType} job added ${data.pointsAdded} points to your UpTend Property Score.</p>
  <div style="text-align:center;margin:24px 0;padding:24px;background:#f9f9f9;border-radius:8px">
    <div style="color:#888;font-size:13px;margin-bottom:4px">Your Score</div>
    <div style="font-size:42px;font-weight:700;color:#F47C20">${data.totalScore}</div>
    <div style="color:#888;font-size:13px">/ 850</div>
  </div>
  <p style="color:#555;line-height:1.6">Every completed service builds your home's verified maintenance history — like a Carfax for your home.</p>
  <p style="color:#555;line-height:1.6">Want a complete picture? A Home DNA Scan maps out everything your home needs.</p>
  <div style="text-align:center;margin:24px 0">
    <a href="${APP_URL()}/profile" style="background:#F47C20;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">View Your Home Report</a>
  </div>
  <div style="text-align:center;margin:8px 0">
    <a href="${APP_URL()}/home-dna-scan" style="color:#F47C20;text-decoration:underline;font-weight:600">Learn About Home DNA Scan</a>
  </div>
  `);
  const text = `Hi ${data.customerName}, your ${data.serviceType} job added ${data.pointsAdded} points to your UpTend Property Score. Your Score: ${data.totalScore} / 850. View your home report at ${APP_URL()}/profile`;
  return send(to, "Your home just leveled up", html, text);
}

export async function sendSeasonalRecommendation(to: string, data: { customerName: string; season: string; zip: string; services: { name: string; description: string }[] }) {
  const serviceListHtml = data.services.map(s => `
    <tr><td style="padding:12px 0;border-bottom:1px solid #eee">
      <div style="font-weight:600;color:#222">${s.name}</div>
      <div style="color:#888;font-size:13px">${s.description}</div>
    </td></tr>
  `).join("");

  const html = wrap(`What Orlando homes need this ${data.season}`, `
  <p style="color:#555;line-height:1.6">Hi ${data.customerName},</p>
  <p style="color:#555;line-height:1.6">Based on your home in ${data.zip}, here's what most homeowners are booking this ${data.season}:</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    ${serviceListHtml}
  </table>
  <p style="color:#555;line-height:1.6">Your Price Protection Guarantee applies to every booking — your price is locked, guaranteed.</p>
  <div style="text-align:center;margin:24px 0">
    <a href="${APP_URL()}/book" style="background:#F47C20;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">Book Your Next Service</a>
  </div>
  `);
  const text = `Hi ${data.customerName}, based on your home in ${data.zip}, here's what Orlando homeowners are booking this ${data.season}: ${data.services.map(s => s.name).join(", ")}. Book at ${APP_URL()}/book`;
  return send(to, `What Orlando homes need this ${data.season}`, html, text);
}

export async function sendReferralPrompt(to: string, data: { customerName: string; referralCode: string }) {
  const html = wrap("Give $25, Get $25", `
  <p style="color:#555;line-height:1.6">Hi ${data.customerName},</p>
  <p style="color:#555;line-height:1.6">Know someone who could use a great home service pro?</p>
  <p style="color:#555;line-height:1.6">Share your referral code and you both get $25 off your next booking.</p>
  <div style="text-align:center;margin:24px 0;padding:20px;background:#f9f9f9;border-radius:8px;border:2px dashed #F47C20">
    <div style="color:#888;font-size:13px;margin-bottom:4px">Your Referral Code</div>
    <div style="font-size:28px;font-weight:700;color:#F47C20;letter-spacing:2px">${data.referralCode}</div>
  </div>
  <div style="text-align:center;margin:24px 0">
    <a href="${APP_URL()}/profile" style="background:#F47C20;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">Share Your Code</a>
  </div>
  <p style="color:#555;line-height:1.6">Thanks for being part of the UpTend community.</p>
  `);
  const text = `Hi ${data.customerName}, give $25, get $25! Share your referral code ${data.referralCode} and you both save on your next booking. Share at ${APP_URL()}/profile`;
  return send(to, "Give $25, Get $25", html, text);
}

// ─── Pro Onboarding Sequence ───────────────────────────────────────

export async function sendProWelcomeVerified(to: string, data: { proName: string }) {
  const html = wrap("You're verified — welcome to UpTend", `
  <p style="color:#555;line-height:1.6">Hi ${data.proName},</p>
  <p style="color:#555;line-height:1.6">Your background check is complete and your profile is live on UpTend.</p>
  <p style="color:#555;line-height:1.6">Here's how to start earning:</p>
  <ol style="color:#555;line-height:2">
    <li><strong>Complete your profile</strong> — Add your photo, experience, and service areas. Complete profiles get 3x more bookings.</li>
    <li><strong>Set your availability</strong> — Let us know when you're ready to work.</li>
    <li><strong>Wait for your first match</strong> — We'll notify you instantly when a job fits your skills and area.</li>
  </ol>
  <p style="color:#555;line-height:1.6">Remember: You keep 80% of every job. No lead fees. Same-day payouts via Stripe.</p>
  <div style="text-align:center;margin:24px 0">
    <a href="${APP_URL()}/profile" style="background:#F47C20;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">Complete Your Profile</a>
  </div>
  <p style="color:#888;font-size:13px;margin-top:24px">Questions? Call us at (407) 338-3342 or reply to this email.</p>
  `);
  const text = `Hi ${data.proName}, your background check is complete and your profile is live on UpTend. Complete your profile, set your availability, and wait for your first match. You keep 80% of every job. No lead fees. Same-day payouts via Stripe. Complete your profile at ${APP_URL()}/profile`;
  return send(to, "You're verified — welcome to UpTend", html, text);
}

export async function sendProProfileNudge(to: string, data: { proName: string; missingItems: string[] }) {
  const checklistHtml = data.missingItems.map(item => `
    <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#555">
      <span style="color:#ccc;margin-right:8px">&#9744;</span> ${item}
    </td></tr>
  `).join("");

  const html = wrap("Complete your profile — get matched faster", `
  <p style="color:#555;line-height:1.6">Hi ${data.proName},</p>
  <p style="color:#555;line-height:1.6">Pros with complete profiles get matched with 3x more jobs. Here's what's missing:</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    ${checklistHtml}
  </table>
  <p style="color:#555;line-height:1.6">It takes 2 minutes and makes a big difference in how customers see you.</p>
  <div style="text-align:center;margin:24px 0">
    <a href="${APP_URL()}/profile" style="background:#F47C20;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">Finish Your Profile</a>
  </div>
  `);
  const text = `Hi ${data.proName}, pros with complete profiles get 3x more jobs. Missing: ${data.missingItems.join(", ")}. Finish your profile at ${APP_URL()}/profile`;
  return send(to, "Complete your profile — get matched faster", html, text);
}

export async function sendProTips(to: string, data: { proName: string }) {
  const html = wrap("How top UpTend Pros earn more", `
  <p style="color:#555;line-height:1.6">Hi ${data.proName},</p>
  <p style="color:#555;line-height:1.6">Here are 3 things our highest-rated pros do:</p>
  <ol style="color:#555;line-height:2">
    <li><strong>Respond fast</strong> — Pros who accept jobs within 15 minutes get priority matching.</li>
    <li><strong>Send before/after photos</strong> — Customers love seeing the transformation. It also boosts your reviews.</li>
    <li><strong>Ask for reviews</strong> — A simple "If you were happy with the work, a review really helps me out" goes a long way.</li>
  </ol>
  <p style="color:#555;line-height:1.6">New: Some jobs now come with Photo Quotes — you'll see the customer's photo, AI scope analysis, and equipment checklist. Review the details before heading out to arrive fully prepared.</p>
  <p style="color:#555;line-height:1.6">Keep doing great work. Your reputation is your business.</p>
  <div style="text-align:center;margin:24px 0">
    <a href="${APP_URL()}/career" style="background:#F47C20;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">View Your Dashboard</a>
  </div>
  `);
  const text = `Hi ${data.proName}, here are 3 things top UpTend pros do: 1) Respond fast — accept jobs within 15 minutes. 2) Send before/after photos. 3) Ask for reviews. View your dashboard at ${APP_URL()}/career`;
  return send(to, "How top UpTend Pros earn more", html, text);
}

// ─── Academy / Certification Emails ────────────────────────────────

export async function sendCertificationNudgeEmail(to: string, data: {
  proName: string;
  missedCount: number;
  certNames: string[];
}) {
  const certList = data.certNames.map(name => `<li style="color:#555">${name}</li>`).join("");
  const html = wrap(`You missed ${data.missedCount} premium jobs this week`, `
  <p style="color:#555;line-height:1.6">Hi ${data.proName},</p>
  <p style="color:#555;line-height:1.6">This week, <strong>${data.missedCount} premium B2B jobs</strong> were available in your area — but you weren't eligible because you're missing these certifications:</p>
  <ul style="line-height:2">${certList}</ul>
  <p style="color:#555;line-height:1.6">Get certified to unlock higher-paying jobs from property managers and HOAs.</p>
  <div style="text-align:center;margin:24px 0">
    <a href="${APP_URL()}/academy" style="background:#F47C20;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">Start Certification</a>
  </div>
  `);
  const text = `Hi ${data.proName}, you missed ${data.missedCount} premium jobs this week. Get ${data.certNames[0]} certified to unlock them. Visit ${APP_URL()}/academy`;
  return send(to, `You missed ${data.missedCount} premium jobs this week`, html, text);
}

export async function sendCertExpiringEmail(to: string, data: {
  proName: string;
  certName: string;
  expiresAt: string;
}) {
  const html = wrap(`Your ${data.certName} certification expires soon`, `
  <p style="color:#555;line-height:1.6">Hi ${data.proName},</p>
  <p style="color:#555;line-height:1.6">Your <strong>${data.certName}</strong> certification expires on <strong>${new Date(data.expiresAt).toLocaleDateString()}</strong>.</p>
  <p style="color:#555;line-height:1.6">Renew now to keep access to premium B2B jobs.</p>
  <div style="text-align:center;margin:24px 0">
    <a href="${APP_URL()}/academy" style="background:#F47C20;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">Renew Certification</a>
  </div>
  `);
  const text = `Hi ${data.proName}, your ${data.certName} certification expires on ${new Date(data.expiresAt).toLocaleDateString()}. Renew at ${APP_URL()}/academy`;
  return send(to, `Your ${data.certName} certification expires soon`, html, text);
}

export async function sendCertCompletionEmail(to: string, data: {
  proName: string;
  certName: string;
}) {
  const html = wrap(`Congratulations! You're ${data.certName} certified`, `
  <p style="color:#555;line-height:1.6">Hi ${data.proName},</p>
  <p style="color:#555;line-height:1.6">You've completed the <strong>${data.certName}</strong> certification. You now have access to premium B2B jobs in your area.</p>
  <div style="text-align:center;margin:24px 0">
    <a href="${APP_URL()}/career" style="background:#F47C20;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">View Available Jobs</a>
  </div>
  `);
  const text = `Congratulations ${data.proName}! You're now ${data.certName} certified. View premium jobs at ${APP_URL()}/career`;
  return send(to, `Congratulations! You're ${data.certName} certified`, html, text);
}

export async function sendFeeReductionEmail(to: string, data: {
  proName: string;
  oldPercent: number;
  newPercent: number;
  monthlySavings: number;
}) {
  const html = wrap(`🎉 Your platform fee just dropped to ${data.newPercent}%!`, `
  <p style="color:#555;line-height:1.6">Hi ${data.proName},</p>
  <p style="color:#555;line-height:1.6">Great news — your platform fee just dropped from <strong>${data.oldPercent}%</strong> to <strong>${data.newPercent}%</strong>!</p>
  <div style="text-align:center;margin:24px 0;padding:24px;background:#f9f9f9;border-radius:8px">
    <div style="color:#888;font-size:13px;margin-bottom:4px">Estimated Monthly Savings</div>
    <div style="font-size:36px;font-weight:700;color:#F47C20">${money(data.monthlySavings)}</div>
  </div>
  <p style="color:#555;line-height:1.6">Keep earning certifications to lower your fee even further.</p>
  <div style="text-align:center;margin:24px 0">
    <a href="${APP_URL()}/academy" style="background:#F47C20;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">View Certifications</a>
  </div>
  `);
  const text = `Hi ${data.proName}, your platform fee dropped from ${data.oldPercent}% to ${data.newPercent}%! Estimated monthly savings: ${money(data.monthlySavings)}. View certifications at ${APP_URL()}/academy`;
  return send(to, `🎉 Your platform fee just dropped to ${data.newPercent}%!`, html, text);
}

// ─── Payment Failed ────────────────────────────────────────────────

export async function sendPaymentFailed(to: string, data: {
  jobId: string;
  serviceType: string;
  amount: number;
  failureCode?: string;
  failureMessage?: string;
}) {
  const reasonText = data.failureMessage || data.failureCode || "Your payment method was declined";
  const html = wrap("Payment Failed", `
  <p style="color:#555;line-height:1.6">We were unable to process payment for your recent service.</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:8px 0;color:#888;width:140px">Service</td><td style="padding:8px 0">${data.serviceType || "General"}</td></tr>
    <tr><td style="padding:8px 0;color:#888">Amount</td><td style="padding:8px 0;font-weight:600;color:#c00">${money(data.amount)}</td></tr>
    <tr><td style="padding:8px 0;color:#888">Reason</td><td style="padding:8px 0">${reasonText}</td></tr>
  </table>
  <p style="color:#555;line-height:1.6">Please update your payment method to avoid service interruptions.</p>
  <div style="text-align:center;margin:24px 0">
    <a href="${APP_URL()}/settings/billing" style="background:#F47C20;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">Update Payment Method</a>
  </div>
  <p style="color:#888;font-size:13px;margin-top:24px">Questions? Reply to this email or call us at (407) 338-3342</p>
  `);
  const text = `Payment of ${money(data.amount)} failed for your ${data.serviceType} service. Reason: ${reasonText}. Please update your payment method at ${APP_URL()}/settings/billing`;
  return send(to, "Payment Failed — Action Required", html, text);
}
