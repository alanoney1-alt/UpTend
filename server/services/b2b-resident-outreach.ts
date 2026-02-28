/**
 * B2B Resident Outreach Service
 * 
 * When an HOA, PM, or Construction company provides their resident/tenant list,
 * George blasts an email + SMS to every person introducing:
 * - Free Home DNA Scan
 * - $25 credit on first service
 * - Why it matters for their home
 * - Link to site or app download
 */

import { db } from "../db";
import { sql } from "drizzle-orm";

const SENDGRID_API = "https://api.sendgrid.com/v3/mail/send";

interface Resident {
  name: string;
  email?: string;
  phone?: string;
  unit?: string; // unit number, door number, lot number
}

interface OutreachConfig {
  businessName: string;       // "Lake Nona HOA" or "ABC Property Management"
  businessType: "hoa" | "pm" | "construction";
  communityName?: string;     // "Laureate Park" etc
  residents: Resident[];
  senderName?: string;        // defaults to "George from UpTend"
}

/**
 * Send outreach emails to all residents in a B2B account
 */
export async function sendResidentOutreachEmails(config: OutreachConfig): Promise<{ sent: number; failed: number }> {
  const sgApiKey = process.env.SENDGRID_API_KEY;
  if (!sgApiKey) {
    console.log(`[B2B Outreach] No SendGrid key. Would send to ${config.residents.length} residents.`);
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const resident of config.residents) {
    if (!resident.email) continue;

    try {
      const html = buildOutreachEmail(resident, config);
      const subject = config.businessType === "hoa"
        ? `Your home just got smarter - Free Home DNA Scan from ${config.communityName || config.businessName}`
        : config.businessType === "pm"
        ? `Free Home DNA Scan for your rental - courtesy of ${config.businessName}`
        : `Your new home comes with a free Home DNA Scan`;

      const response = await fetch(SENDGRID_API, {
        method: "POST",
        headers: { Authorization: `Bearer ${sgApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: resident.email, name: resident.name }] }],
          from: { email: "alan@uptendapp.com", name: config.senderName || "George from UpTend" },
          subject,
          content: [{ type: "text/html", value: html }],
        }),
      });

      if (response.ok) {
        sent++;
      } else {
        failed++;
        console.error(`[B2B Outreach] Failed for ${resident.email}: ${response.status}`);
      }

      // Rate limit: 100ms between emails
      await new Promise(r => setTimeout(r, 100));
    } catch (err: any) {
      failed++;
      console.error(`[B2B Outreach] Error for ${resident.email}:`, err.message);
    }
  }

  // Log the outreach
  try {
    await db.execute(sql`
      INSERT INTO b2b_outreach_log (business_name, business_type, total_residents, emails_sent, emails_failed, created_at)
      VALUES (${config.businessName}, ${config.businessType}, ${config.residents.length}, ${sent}, ${failed}, NOW())
    `);
  } catch { /* table may not exist yet, that's fine */ }

  console.log(`[B2B Outreach] ${config.businessName}: ${sent} sent, ${failed} failed out of ${config.residents.length} residents`);
  return { sent, failed };
}

/**
 * Send outreach SMS to all residents
 */
export async function sendResidentOutreachSMS(config: OutreachConfig): Promise<{ sent: number; failed: number }> {
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!twilioSid || !twilioAuth || !twilioPhone) {
    console.log(`[B2B Outreach SMS] No Twilio config. Would text ${config.residents.length} residents.`);
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const resident of config.residents) {
    if (!resident.phone) continue;

    try {
      const message = buildOutreachSMS(resident, config);

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: "Basic " + Buffer.from(`${twilioSid}:${twilioAuth}`).toString("base64"),
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: resident.phone,
            From: twilioPhone,
            Body: message,
          }),
        }
      );

      if (response.ok) {
        sent++;
      } else {
        failed++;
      }

      // Rate limit
      await new Promise(r => setTimeout(r, 200));
    } catch (err: any) {
      failed++;
      console.error(`[B2B Outreach SMS] Error for ${resident.phone}:`, err.message);
    }
  }

  console.log(`[B2B Outreach SMS] ${config.businessName}: ${sent} sent, ${failed} failed`);
  return { sent, failed };
}

function buildOutreachEmail(resident: Resident, config: OutreachConfig): string {
  const firstName = resident.name.split(" ")[0];
  const isHOA = config.businessType === "hoa";
  const isPM = config.businessType === "pm";
  const isConstruction = config.businessType === "construction";

  const contextLine = isHOA
    ? `${config.communityName || config.businessName} has partnered with UpTend to bring Home Intelligence to every home in your community.`
    : isPM
    ? `${config.businessName} has partnered with UpTend to make home maintenance effortless for every property in their portfolio.`
    : `Your new home from ${config.businessName} comes with something no other builder offers: a complete Home Intelligence profile.`;

  const scanBenefits = isHOA
    ? `<li>Know exactly what shape your home's systems are in (HVAC, roof, plumbing, appliances)</li>
       <li>Get alerts BEFORE something breaks, not after</li>
       <li>Stay compliant with HOA maintenance requirements automatically</li>
       <li>See your Home Health Score and how your home compares</li>`
    : isPM
    ? `<li>Report maintenance issues instantly through George (no more phone tag)</li>
       <li>Track every system in your home so problems get caught early</li>
       <li>Get seasonal maintenance reminders specific to Florida</li>
       <li>See your Home Health Score and what needs attention</li>`
    : `<li>Your home's complete health profile from day one</li>
       <li>Every system, every appliance tracked with warranty dates</li>
       <li>George monitors your home and alerts you before problems start</li>
       <li>Think of it as a birth certificate for your house</li>`;

  return `
    <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif;">
      <div style="background:#1e293b;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
        <h1 style="color:white;margin:0;font-size:28px;">
          <span style="color:#F47C20;">Up</span>Tend
        </h1>
        <p style="color:#94a3b8;margin-top:8px;font-size:14px;">Home Intelligence</p>
      </div>
      <div style="background:white;padding:32px;border:1px solid #e2e8f0;border-top:none;">
        <h2 style="color:#1e293b;margin-top:0;">Hey ${firstName}, your free Home DNA Scan is ready.</h2>
        
        <p style="color:#64748b;font-size:16px;line-height:1.6;">
          ${contextLine}
        </p>

        <p style="color:#64748b;font-size:16px;line-height:1.6;">
          That means you get a <strong style="color:#1e293b;">free Home DNA Scan</strong> - a complete health profile for your home, built by George, our Home Service Agent. It takes about 10 minutes and here's what you get:
        </p>

        <ul style="padding-left:20px;color:#475569;font-size:15px;line-height:1.8;">
          ${scanBenefits}
        </ul>

        <!-- $25 Credit Callout -->
        <div style="background:#FFF7ED;border:2px solid #F47C20;border-radius:12px;padding:20px;text-align:center;margin:24px 0;">
          <p style="color:#F47C20;font-weight:800;font-size:24px;margin:0 0 4px;">$25 Credit</p>
          <p style="color:#64748b;font-size:14px;margin:0;">On your first home service. Just for completing your scan.</p>
        </div>

        <p style="color:#64748b;font-size:16px;line-height:1.6;">
          George is not a chatbot. He's a real Home Service Agent who knows Florida homes inside and out. Ask him anything about your home - repairs, maintenance, costs, DIY tips. He's got 176 tools and he's ready to help.
        </p>

        <div style="text-align:center;margin-top:32px;">
          <a href="https://uptendapp.com" style="background:#F47C20;color:white;padding:16px 40px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block;">
            Start Your Free Scan
          </a>
        </div>

        <p style="color:#94a3b8;font-size:13px;text-align:center;margin-top:24px;">
          Visit <a href="https://uptendapp.com" style="color:#F47C20;">uptendapp.com</a> or download the app to get started.
        </p>
      </div>
      <div style="padding:24px;text-align:center;color:#94a3b8;font-size:12px;">
        UpTend Services LLC | Orlando, FL<br>
        <a href="https://uptendapp.com" style="color:#94a3b8;">uptendapp.com</a><br>
        <a href="https://uptendapp.com/api/founding-members/unsubscribe?email=${encodeURIComponent(resident.email || "")}" style="color:#94a3b8;font-size:11px;">Unsubscribe</a>
      </div>
    </div>
  `;
}

function buildOutreachSMS(resident: Resident, config: OutreachConfig): string {
  const firstName = resident.name.split(" ")[0];
  const isHOA = config.businessType === "hoa";
  const isPM = config.businessType === "pm";

  const context = isHOA
    ? `${config.communityName || config.businessName}`
    : isPM
    ? `your property manager ${config.businessName}`
    : `${config.businessName}`;

  return `Hey ${firstName}! I'm George from UpTend. ${context} partnered with us to bring Home Intelligence to your home. You've got a free Home DNA Scan ready - I'll build a complete health profile for your home in about 10 minutes. Plus you get $25 off your first service. Start here: https://uptendapp.com`;
}
