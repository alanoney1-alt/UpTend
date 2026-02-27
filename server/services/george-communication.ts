/**
 * George Communication Tools
 * Email, Voice, WhatsApp, Push Notifications, Calendar, GPS, Quotes
 */

import twilio from 'twilio';
// @ts-ignore — twilio ESM compat
import { pool } from '../db.js';
import { sendEmail, sendSms } from './notifications.js';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_API_KEY_SID = process.env.TWILIO_API_KEY_SID;
const TWILIO_API_KEY_SECRET = process.env.TWILIO_API_KEY_SECRET;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '+18559012072';

const twilioClient = TWILIO_API_KEY_SID && TWILIO_API_KEY_SECRET && TWILIO_ACCOUNT_SID
 ? twilio(TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, { accountSid: TWILIO_ACCOUNT_SID })
 : TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN
 ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
 : null;

// ─── Helpers ───

async function getCustomerInfo(customerId: string) {
 const result = await pool.query(
 `SELECT id, email, phone, full_name, first_name FROM users WHERE id = $1`,
 [customerId]
 );
 return result.rows[0] || null;
}

function brandedEmailTemplate(title: string, bodyHtml: string, customerName?: string): string {
 const greeting = customerName ? `Hi ${customerName},` : 'Hi there,';
 return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
 <div style="max-width:600px;margin:0 auto;background:#fff;">
 <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:24px 32px;text-align:center;">
 <h1 style="color:#fff;margin:0;font-size:24px;"> George</h1>
 <p style="color:rgba(255,255,255,0.9);margin:4px 0 0;font-size:14px;">Your Home Expert from UpTend</p>
 </div>
 <div style="padding:32px;">
 <h2 style="color:#1a1a2e;margin:0 0 16px;font-size:20px;">${title}</h2>
 <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">${greeting}</p>
 ${bodyHtml}
 </div>
 <div style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;">
 <p style="color:#9ca3af;font-size:12px;margin:0;">UpTend · Home Services, Finally Done Right</p>
 <p style="color:#9ca3af;font-size:12px;margin:4px 0 0;"><a href="https://uptendapp.com" style="color:#f97316;">uptendapp.com</a> · (407) 338-3342</p>
 </div>
 </div>
</body>
</html>`;
}

// ─── 1. SEND EMAIL ───

export async function sendEmailToCustomer(params: {
 customerId: string;
 subject: string;
 emailType: 'quote' | 'booking' | 'scan_results' | 'receipt' | 'referral' | 'custom';
 customMessage: string;
 quoteDetails?: any;
}): Promise<object> {
 const customer = await getCustomerInfo(params.customerId);
 if (!customer?.email) {
 return { success: false, error: 'Customer email not found. Ask them to provide their email address.' };
 }

 let bodyHtml = '';
 const name = customer.first_name || customer.full_name?.split(' ')[0] || '';

 switch (params.emailType) {
 case 'quote':
 bodyHtml = `<div style="background:#fffbeb;border-left:4px solid #f97316;padding:16px;margin:16px 0;border-radius:4px;">
 <p style="color:#92400e;font-size:18px;font-weight:700;margin:0;">${params.customMessage}</p>
 </div>
 <p style="color:#374151;font-size:15px;line-height:1.6;">This quote includes insured, background-checked pros with our Guaranteed Price Ceiling — the price won't go up once booked.</p>
 <div style="text-align:center;margin:24px 0;">
 <a href="https://uptendapp.com/book" style="background:#f97316;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">Book Now</a>
 </div>`;
 break;
 case 'booking':
 bodyHtml = `<p style="color:#374151;font-size:15px;line-height:1.6;">${params.customMessage}</p>
 <div style="text-align:center;margin:24px 0;">
 <a href="https://uptendapp.com/dashboard" style="background:#f97316;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;">View Booking</a>
 </div>`;
 break;
 case 'scan_results':
 bodyHtml = `<p style="color:#374151;font-size:15px;line-height:1.6;">${params.customMessage}</p>
 <div style="text-align:center;margin:24px 0;">
 <a href="https://uptendapp.com/dashboard" style="background:#22c55e;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;">View Full Report</a>
 </div>`;
 break;
 case 'referral':
 bodyHtml = `<p style="color:#374151;font-size:15px;line-height:1.6;">${params.customMessage}</p>
 <div style="background:#f0fdf4;padding:16px;border-radius:8px;text-align:center;margin:16px 0;">
 <p style="color:#166534;font-size:16px;font-weight:600;margin:0;">You both get $25 credit! </p>
 </div>
 <div style="text-align:center;margin:24px 0;">
 <a href="https://uptendapp.com/register" style="background:#f97316;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;">Get Started</a>
 </div>`;
 break;
 default:
 bodyHtml = `<p style="color:#374151;font-size:15px;line-height:1.6;">${params.customMessage}</p>`;
 }

 const html = brandedEmailTemplate(params.subject, bodyHtml, name);

 const result = await sendEmail({
 to: customer.email,
 subject: `${params.subject} — George`,
 html,
 });

 return {
 success: result.success,
 message: result.success
 ? `Email sent to ${customer.email}`
 : `Failed to send email: ${result.error}`,
 emailType: params.emailType,
 };
}

// ─── 2. VOICE CALLS ───

export async function callCustomer(params: {
 customerId: string;
 message: string;
 urgent?: boolean;
}): Promise<object> {
 const customer = await getCustomerInfo(params.customerId);
 if (!customer?.phone) {
 return { success: false, error: 'Customer phone not found.' };
 }

 if (!twilioClient) {
 return { success: false, error: 'Voice calling not configured. Twilio credentials missing.' };
 }

 try {
 const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
 <Say voice="Polly.Matthew" language="en-US">Hello${customer.first_name ? ', ' + customer.first_name : ''}. This is George from UpTend. ${params.message}. If you need anything, just open the UpTend app or call us back at 4 0 7, 3 3 8, 3 3 4 2. Have a great day!</Say>
</Response>`;

 const call = await twilioClient.calls.create({
 twiml,
 to: customer.phone,
 from: TWILIO_PHONE_NUMBER,
 statusCallback: `${process.env.BASE_URL || 'https://uptendapp.com'}/api/voice/status`,
 statusCallbackEvent: ['completed', 'busy', 'no-answer', 'failed'],
 });

 return {
 success: true,
 callSid: call.sid,
 status: call.status,
 message: `Calling ${customer.first_name || 'customer'} now...`,
 };
 } catch (error: any) {
 return { success: false, error: `Call failed: ${error.message}` };
 }
}

export async function getCallStatus(params: { callSid: string }): Promise<object> {
 if (!twilioClient) return { success: false, error: 'Twilio not configured' };
 try {
 const call = await twilioClient.calls(params.callSid).fetch();
 return { success: true, status: call.status, duration: call.duration, direction: call.direction };
 } catch (error: any) {
 return { success: false, error: error.message };
 }
}

// ─── 3. QUOTE EMAIL (richly formatted) ───

export async function sendQuoteEmail(params: {
 customerId: string;
 serviceType: string;
 totalPrice: number;
 breakdown?: { item: string; amount: number }[];
 notes?: string;
}): Promise<object> {
 const customer = await getCustomerInfo(params.customerId);
 if (!customer?.email) {
 return { success: false, error: 'Customer email not found.' };
 }

 const name = customer.first_name || customer.full_name?.split(' ')[0] || '';

 let breakdownHtml = '';
 if (params.breakdown?.length) {
 const rows = params.breakdown.map(b =>
 `<tr><td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#374151;">${b.item}</td><td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right;color:#374151;font-weight:600;">$${b.amount.toFixed(2)}</td></tr>`
 ).join('');
 breakdownHtml = `<table style="width:100%;border-collapse:collapse;margin:16px 0;">
 <tr style="background:#f9fafb;"><th style="padding:8px 12px;text-align:left;color:#6b7280;font-size:13px;">Item</th><th style="padding:8px 12px;text-align:right;color:#6b7280;font-size:13px;">Amount</th></tr>
 ${rows}
 <tr style="background:#f97316;"><td style="padding:12px;color:#fff;font-weight:700;">Total</td><td style="padding:12px;text-align:right;color:#fff;font-weight:700;font-size:18px;">$${params.totalPrice.toFixed(2)}</td></tr>
 </table>`;
 }

 const bodyHtml = `
 <div style="background:#1a1a2e;color:#fff;padding:20px;border-radius:8px;text-align:center;margin:16px 0;">
 <p style="margin:0;font-size:14px;color:#9ca3af;">Your Quote for</p>
 <p style="margin:4px 0;font-size:22px;font-weight:700;">${params.serviceType}</p>
 <p style="margin:8px 0 0;font-size:36px;font-weight:800;color:#f97316;">$${params.totalPrice.toFixed(2)}</p>
 </div>
 ${breakdownHtml}
 <div style="background:#f0fdf4;border-radius:8px;padding:16px;margin:16px 0;">
 <p style="color:#166534;margin:0;font-size:14px;"> Insured, background-checked pro</p>
 <p style="color:#166534;margin:4px 0;font-size:14px;"> Guaranteed Price Ceiling — won't go up</p>
 <p style="color:#166534;margin:4px 0;font-size:14px;"> Satisfaction guarantee</p>
 <p style="color:#166534;margin:4px 0;font-size:14px;"> Before & after photo documentation</p>
 </div>
 ${params.notes ? `<p style="color:#6b7280;font-size:13px;font-style:italic;">Note: ${params.notes}</p>` : ''}
 <div style="text-align:center;margin:24px 0;">
 <a href="https://uptendapp.com/book?service=${encodeURIComponent(params.serviceType)}" style="background:#f97316;color:#fff;padding:16px 40px;border-radius:8px;text-decoration:none;font-weight:700;font-size:18px;">Book Now →</a>
 </div>
 <p style="color:#9ca3af;font-size:12px;text-align:center;">This quote is valid for 7 days.</p>`;

 const html = brandedEmailTemplate(`Your ${params.serviceType} Quote`, bodyHtml, name);

 const result = await sendEmail({
 to: customer.email,
 subject: `Your ${params.serviceType} Quote: $${params.totalPrice.toFixed(2)} — George`,
 html,
 });

 return {
 success: result.success,
 message: result.success
 ? `Quote emailed to ${customer.email} — $${params.totalPrice.toFixed(2)} for ${params.serviceType}`
 : `Failed to send: ${result.error}`,
 };
}

// ─── 4. LIVE PRO GPS TRACKING ───

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
 const R = 3959; // miles
 const dLat = (lat2 - lat1) * Math.PI / 180;
 const dLon = (lon2 - lon1) * Math.PI / 180;
 const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
 return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function getProLiveLocation(params: {
 customerId: string;
 bookingId?: string;
}): Promise<object> {
 try {
 // Find active job for this customer
 let query = `
 SELECT sr.id, sr.hauler_id, sr.service_type, sr.status, sr.pickup_address,
 sr.pickup_lat, sr.pickup_lng,
 hp.current_lat, hp.current_lng, hp.vehicle_type, hp.vehicle_color, hp.vehicle_make,
 u.full_name, u.first_name, u.phone
 FROM service_requests sr
 JOIN hauler_profiles hp ON hp.user_id = sr.hauler_id
 JOIN users u ON u.id = sr.hauler_id
 WHERE sr.customer_id = $1 AND sr.status IN ('accepted', 'en_route', 'in_progress', 'started')
 `;
 const queryParams: any[] = [params.customerId];

 if (params.bookingId) {
 query += ` AND sr.id = $2`;
 queryParams.push(params.bookingId);
 }
 query += ` ORDER BY sr.created_at DESC LIMIT 1`;

 const result = await pool.query(query, queryParams);
 if (!result.rows[0]) {
 return { success: false, error: 'No active job found. Your pro hasn\'t started heading your way yet.' };
 }

 const job = result.rows[0];
 const proName = job.first_name || job.full_name?.split(' ')[0] || 'Your pro';

 if (!job.current_lat || !job.current_lng) {
 return {
 success: true,
 proName,
 status: job.status,
 message: `${proName} has accepted your job but we don't have their live location yet. They'll be on their way soon!`,
 vehicle: job.vehicle_color && job.vehicle_make ? `${job.vehicle_color} ${job.vehicle_make}` : null,
 };
 }

 const distance = (job.pickup_lat && job.pickup_lng)
 ? haversineDistance(job.current_lat, job.current_lng, job.pickup_lat, job.pickup_lng)
 : null;
 const etaMinutes = distance ? Math.round(distance / 0.5) : null; // ~30mph average

 return {
 success: true,
 proName,
 proPhone: job.phone,
 status: job.status,
 currentLat: job.current_lat,
 currentLng: job.current_lng,
 distanceMiles: distance ? Math.round(distance * 10) / 10 : null,
 etaMinutes,
 vehicle: job.vehicle_color && job.vehicle_make
 ? `${job.vehicle_color} ${job.vehicle_make}${job.vehicle_type ? ' ' + job.vehicle_type : ''}`
 : null,
 message: distance
 ? `${proName} is ${distance.toFixed(1)} miles away${etaMinutes ? `, about ${etaMinutes} minutes out` : ''}${job.vehicle_color && job.vehicle_make ? `. Look for a ${job.vehicle_color} ${job.vehicle_make}.` : '.'}`
 : `${proName} is on the way!`,
 };
 } catch (error: any) {
 return { success: false, error: `Couldn't get pro location: ${error.message}` };
 }
}

// ─── 5. CALENDAR INTEGRATION ───

export async function addToCalendar(params: {
 customerId: string;
 bookingId: string;
}): Promise<object> {
 try {
 const result = await pool.query(
 `SELECT sr.id, sr.service_type, sr.scheduled_date, sr.scheduled_time, sr.pickup_address,
 sr.pickup_city, sr.pickup_state, sr.pickup_zip,
 u.full_name as pro_name, u.phone as pro_phone
 FROM service_requests sr
 LEFT JOIN users u ON u.id = sr.hauler_id
 WHERE sr.id = $1 AND sr.customer_id = $2`,
 [params.bookingId, params.customerId]
 );

 if (!result.rows[0]) {
 return { success: false, error: 'Booking not found.' };
 }

 const booking = result.rows[0];
 const customer = await getCustomerInfo(params.customerId);

 // Parse date/time
 const dateStr = booking.scheduled_date;
 const timeStr = booking.scheduled_time || '09:00';
 const startDate = new Date(`${dateStr}T${timeStr}:00`);
 const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2hr default

 const formatICS = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

 const location = [booking.pickup_address, booking.pickup_city, booking.pickup_state, booking.pickup_zip]
 .filter(Boolean).join(', ');

 const description = `${booking.service_type} service by UpTend${booking.pro_name ? `\\nPro: ${booking.pro_name}` : ''}${booking.pro_phone ? `\\nPro Phone: ${booking.pro_phone}` : ''}\\n\\nManage your booking: https://uptendapp.com/dashboard\\nQuestions? Chat with George in the app!`;

 const icsContent = [
 'BEGIN:VCALENDAR',
 'VERSION:2.0',
 'PRODID:-//UpTend//George//EN',
 'BEGIN:VEVENT',
 `DTSTART:${formatICS(startDate)}`,
 `DTEND:${formatICS(endDate)}`,
 `SUMMARY:${booking.service_type} — UpTend`,
 `DESCRIPTION:${description}`,
 `LOCATION:${location}`,
 `STATUS:CONFIRMED`,
 'END:VEVENT',
 'END:VCALENDAR',
 ].join('\r\n');

 // Google Calendar link
 const gcalStart = startDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
 const gcalEnd = endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
 const googleCalLink = `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(booking.service_type + ' — UpTend')}&dates=${gcalStart}/${gcalEnd}&location=${encodeURIComponent(location)}&details=${encodeURIComponent(description.replace(/\\n/g, '\n'))}`;

 // Send .ics via email if customer has email
 if (customer?.email) {
 const bodyHtml = `<p style="color:#374151;font-size:15px;line-height:1.6;">Your <strong>${booking.service_type}</strong> is booked! I've attached a calendar invite so you don't forget.</p>
 <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:16px 0;">
 <p style="margin:0;color:#374151;"><strong> Date:</strong> ${startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
 <p style="margin:4px 0;color:#374151;"><strong> Time:</strong> ${startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
 <p style="margin:4px 0;color:#374151;"><strong> Address:</strong> ${location}</p>
 ${booking.pro_name ? `<p style="margin:4px 0;color:#374151;"><strong> Pro:</strong> ${booking.pro_name}</p>` : ''}
 </div>
 <div style="text-align:center;margin:24px 0;">
 <a href="${googleCalLink}" style="background:#4285f4;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">Add to Google Calendar</a>
 </div>`;

 const html = brandedEmailTemplate('Your Booking is Confirmed! ', bodyHtml, customer.first_name || customer.full_name?.split(' ')[0]);

 // SendGrid with attachment
 const sgMail = (await import('@sendgrid/mail')) as any;
 const mailer = sgMail.default || sgMail;
 if (process.env.SENDGRID_API_KEY) {
 mailer.setApiKey(process.env.SENDGRID_API_KEY);
 await mailer.send({
 to: customer.email,
 from: process.env.FROM_EMAIL || 'alan@uptendapp.com',
 subject: ` ${booking.service_type} Booked — Calendar Invite`,
 html,
 attachments: [{
 content: Buffer.from(icsContent).toString('base64'),
 filename: 'uptend-booking.ics',
 type: 'text/calendar',
 disposition: 'attachment',
 }],
 });
 }
 }

 return {
 success: true,
 message: customer?.email
 ? `Calendar invite sent to ${customer.email}! Also here's a direct link:`
 : `Here's your calendar link:`,
 googleCalendarLink: googleCalLink,
 icsAvailable: true,
 };
 } catch (error: any) {
 return { success: false, error: `Calendar error: ${error.message}` };
 }
}

// ─── 6. WHATSAPP MESSAGING ───

export async function sendWhatsAppMessage(params: {
 customerId: string;
 message: string;
}): Promise<object> {
 const customer = await getCustomerInfo(params.customerId);
 if (!customer?.phone) {
 return { success: false, error: 'Customer phone not found.' };
 }

 if (!twilioClient) {
 return { success: false, error: 'Messaging not configured.' };
 }

 try {
 // Try WhatsApp first
 const waResult = await twilioClient.messages.create({
 body: ` George from UpTend: ${params.message}`,
 to: `whatsapp:${customer.phone}`,
 from: `whatsapp:${TWILIO_PHONE_NUMBER}`,
 });

 return {
 success: true,
 channel: 'whatsapp',
 sid: waResult.sid,
 message: `WhatsApp sent to ${customer.first_name || 'customer'}`,
 };
 } catch (waError: any) {
 // Fallback to SMS
 console.log('[George WhatsApp] WhatsApp failed, falling back to SMS:', waError.message);
 try {
 const smsResult = await sendSms({
 to: customer.phone,
 message: ` George from UpTend: ${params.message}`,
 });

 return {
 success: smsResult.success,
 channel: 'sms_fallback',
 message: smsResult.success
 ? `Sent via SMS (WhatsApp unavailable) to ${customer.first_name || 'customer'}`
 : `Failed to send: ${smsResult.error}`,
 };
 } catch (smsError: any) {
 return { success: false, error: `Both WhatsApp and SMS failed: ${smsError.message}` };
 }
 }
}

// ─── 7. PUSH NOTIFICATIONS (Expo) ───

export async function sendPushNotification(params: {
 customerId: string;
 title: string;
 body: string;
 action?: 'open_chat' | 'open_booking' | 'open_scan' | 'open_dashboard';
}): Promise<object> {
 try {
 // Get push token
 const result = await pool.query(
 `SELECT expo_push_token FROM users WHERE id = $1`,
 [params.customerId]
 );

 const token = result.rows[0]?.expo_push_token;
 if (!token) {
 return { success: false, error: 'Customer hasn\'t registered for push notifications yet (no mobile app installed or token not registered).' };
 }

 // Send via Expo Push API
 const response = await fetch('https://exp.host/--/api/v2/push/send', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 to: token,
 title: params.title,
 body: params.body,
 sound: 'default',
 data: { action: params.action || 'open_chat' },
 channelId: 'uptend-george',
 }),
 });

 const data = await response.json();

 if (data.data?.status === 'ok') {
 return { success: true, message: `Push notification sent: "${params.title}"` };
 } else {
 return { success: false, error: `Push failed: ${JSON.stringify(data.data?.details?.error || data)}` };
 }
 } catch (error: any) {
 return { success: false, error: `Push error: ${error.message}` };
 }
}
