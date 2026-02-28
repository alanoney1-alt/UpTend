/**
 * Founding 100 Email Drip System
 * 
 * Sequence (both tracks):
 *   Email 1: Welcome (sent immediately on signup - already built in founding-members.routes.ts)
 *   Email 2: "Here's what's coming" - sent 2 days after signup
 *   Email 3: Weekly digest - sent every Tuesday
 *   Email 4: Launch announcement - triggered manually when we go live
 * 
 * Customer vs Pro tracks get different content.
 */

import { pool } from "../db";

const SG_KEY = process.env.SENDGRID_API_KEY;
const FROM = { email: "alan@uptendapp.com", name: "George from UpTend" };

// ─── EMAIL TEMPLATES ───

function email2_whats_coming(name: string, isPro: boolean): { subject: string; html: string } {
  const subject = isPro
    ? `${name}, here's how UpTend is going to change your business`
    : `${name}, here's what George is building for you`;

  const customerBody = `
    <h2 style="color:#1e293b;margin-top:0;">Here's What's Coming</h2>
    <p style="color:#64748b;font-size:16px;line-height:1.6;">
      Thanks for joining the Founding 100. Here's a quick look at what you're getting access to:
    </p>
    <div style="background:#f8fafc;border-radius:12px;padding:24px;margin:24px 0;">
      <h3 style="color:#1e293b;margin-top:0;">Meet George</h3>
      <p style="color:#64748b;font-size:14px;line-height:1.6;">
        George is your personal home expert. He lives inside the UpTend app and knows your home better than anyone. Snap a photo of a problem, and George will tell you what it is, what it costs, and whether you need a pro or can handle it yourself.
      </p>
    </div>
    <div style="background:#f8fafc;border-radius:12px;padding:24px;margin:24px 0;">
      <h3 style="color:#1e293b;margin-top:0;">How Booking Works</h3>
      <p style="color:#64748b;font-size:14px;line-height:1.6;">
        Tell us what you need. George matches you with one vetted pro at one locked price. No bidding wars, no price surprises. Track your pro in real time and pay only when the job is done.
      </p>
    </div>
    <div style="background:#f8fafc;border-radius:12px;padding:24px;margin:24px 0;">
      <h3 style="color:#1e293b;margin-top:0;">Price Protection Guarantee</h3>
      <p style="color:#64748b;font-size:14px;line-height:1.6;">
        The price you see is a ceiling, not an estimate. If the scope changes on site, your pro has to document it with photos and get your approval before any price adjustment. No exceptions.
      </p>
    </div>
    <p style="color:#64748b;font-size:16px;line-height:1.6;">
      We're putting the final touches on the platform now. As a Founding Member, you'll be the first to book when we launch.
    </p>
  `;

  const proBody = `
    <h2 style="color:#1e293b;margin-top:0;">Here's How UpTend Works for Pros</h2>
    <p style="color:#64748b;font-size:16px;line-height:1.6;">
      Thanks for joining the Founding 100 Pros. Here's what makes this different from every other platform you've tried:
    </p>
    <div style="background:#f8fafc;border-radius:12px;padding:24px;margin:24px 0;">
      <h3 style="color:#1e293b;margin-top:0;">You Keep 85%</h3>
      <p style="color:#64748b;font-size:14px;line-height:1.6;">
        Our platform fee is 15%. That's it. No lead fees. No pay-per-click. No bidding against 5 other pros for one job. You get matched with customers who are ready to book, and you keep the majority of every dollar.
      </p>
    </div>
    <div style="background:#f8fafc;border-radius:12px;padding:24px;margin:24px 0;">
      <h3 style="color:#1e293b;margin-top:0;">You Set Your Rates</h3>
      <p style="color:#64748b;font-size:14px;line-height:1.6;">
        You choose your rate within the market range for your area. George matches you with customers based on quality, reliability, and proximity, not just who's cheapest. Good work gets rewarded.
      </p>
    </div>
    <div style="background:#f8fafc;border-radius:12px;padding:24px;margin:24px 0;">
      <h3 style="color:#1e293b;margin-top:0;">Guaranteed Payment</h3>
      <p style="color:#64748b;font-size:14px;line-height:1.6;">
        Payments are processed through the platform. Complete the job, get paid. No chasing invoices. No bounced checks. Direct deposit to your account.
      </p>
    </div>
    <div style="background:#f8fafc;border-radius:12px;padding:24px;margin:24px 0;">
      <h3 style="color:#1e293b;margin-top:0;">Founding Pro Advantage</h3>
      <p style="color:#64748b;font-size:14px;line-height:1.6;">
        As a Founding Pro, your platform fee is 12% (not 15%) for your entire first year. You'll also get priority placement when customers search for pros in your area.
      </p>
    </div>
    <p style="color:#64748b;font-size:16px;line-height:1.6;">
      We're onboarding our first pros now. When we launch, Founding Pros are first in line for every job in their service area.
    </p>
  `;

  return {
    subject,
    html: wrapTemplate(isPro ? proBody : customerBody),
  };
}

function email3_weekly_digest(name: string, isPro: boolean, weekData: WeeklyData): { subject: string; html: string } {
  const subject = isPro
    ? `Pro Update: What happened this week at UpTend`
    : `Your weekly update from George`;

  const customerBody = `
    <h2 style="color:#1e293b;margin-top:0;">This Week at UpTend</h2>
    <p style="color:#64748b;font-size:16px;line-height:1.6;">
      Hey ${name}, here's what's new:
    </p>
    ${weekData.updates.map(u => `
      <div style="border-left:3px solid #F47C20;padding-left:16px;margin:16px 0;">
        <p style="color:#1e293b;font-weight:600;margin:0 0 4px;">${u.title}</p>
        <p style="color:#64748b;font-size:14px;margin:0;">${u.body}</p>
      </div>
    `).join("")}
    ${weekData.tip ? `
      <div style="background:#FFF7ED;border-radius:12px;padding:24px;margin:24px 0;">
        <h3 style="color:#1e293b;margin-top:0;">Tip from George</h3>
        <p style="color:#64748b;font-size:14px;line-height:1.6;">${weekData.tip}</p>
      </div>
    ` : ""}
    <div style="background:#f8fafc;border-radius:12px;padding:20px;text-align:center;margin:24px 0;">
      <p style="color:#1e293b;font-weight:bold;margin:0 0 4px;">Founding 100 Progress</p>
      <p style="color:#64748b;font-size:14px;margin:0;">${weekData.customerCount} customers + ${weekData.proCount} pros have signed up</p>
    </div>
  `;

  const proBody = `
    <h2 style="color:#1e293b;margin-top:0;">Pro Update</h2>
    <p style="color:#64748b;font-size:16px;line-height:1.6;">
      Hey ${name}, here's what's happening:
    </p>
    ${weekData.updates.map(u => `
      <div style="border-left:3px solid #F47C20;padding-left:16px;margin:16px 0;">
        <p style="color:#1e293b;font-weight:600;margin:0 0 4px;">${u.title}</p>
        <p style="color:#64748b;font-size:14px;margin:0;">${u.body}</p>
      </div>
    `).join("")}
    ${weekData.demandInsight ? `
      <div style="background:#FFF7ED;border-radius:12px;padding:24px;margin:24px 0;">
        <h3 style="color:#1e293b;margin-top:0;">Demand in Your Area</h3>
        <p style="color:#64748b;font-size:14px;line-height:1.6;">${weekData.demandInsight}</p>
      </div>
    ` : ""}
    <div style="background:#f8fafc;border-radius:12px;padding:20px;text-align:center;margin:24px 0;">
      <p style="color:#1e293b;font-weight:bold;margin:0 0 4px;">Founding 100 Progress</p>
      <p style="color:#64748b;font-size:14px;margin:0;">${weekData.customerCount} customers + ${weekData.proCount} pros have signed up</p>
    </div>
  `;

  return {
    subject,
    html: wrapTemplate(isPro ? proBody : customerBody),
  };
}

function email4_launch(name: string, isPro: boolean): { subject: string; html: string } {
  const subject = isPro
    ? `${name}, UpTend is LIVE. You're first in line.`
    : `${name}, UpTend is LIVE. Let's get your first service booked.`;

  const customerBody = `
    <h2 style="color:#1e293b;margin-top:0;">We're Live.</h2>
    <p style="color:#64748b;font-size:16px;line-height:1.6;">
      ${name}, the wait is over. UpTend is officially live in the Orlando metro area, and you're one of the first people with access.
    </p>
    <p style="color:#64748b;font-size:16px;line-height:1.6;">
      As a Founding Member, here's what's waiting for you:
    </p>
    <ul style="padding-left:20px;color:#475569;">
      <li style="margin-bottom:8px;"><strong>$25 credit on your first service</strong> (applied automatically)</li>
      <li style="margin-bottom:8px;"><strong>10% off your first 10 services</strong> (stacks with the $25 credit on job 1)</li>
      <li style="margin-bottom:8px;"><strong>Priority booking</strong> over non-founding members</li>
      <li style="margin-bottom:8px;"><strong>"Founding Member" badge</strong> on your profile forever</li>
    </ul>
    <div style="text-align:center;margin:32px 0;">
      <a href="https://uptendapp.com/book" style="background:#F47C20;color:white;padding:16px 40px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:18px;display:inline-block;">
        Book Your First Service
      </a>
    </div>
    <p style="color:#64748b;font-size:14px;line-height:1.6;">
      Have a question? Just ask George. He's ready and waiting at <a href="https://uptendapp.com" style="color:#F47C20;">uptendapp.com</a>.
    </p>
  `;

  const proBody = `
    <h2 style="color:#1e293b;margin-top:0;">We're Live. Time to Work.</h2>
    <p style="color:#64748b;font-size:16px;line-height:1.6;">
      ${name}, UpTend is officially live. Customers are booking right now, and as a Founding Pro, you're first in line for jobs in your area.
    </p>
    <p style="color:#64748b;font-size:16px;line-height:1.6;">
      Here's what to do next:
    </p>
    <ol style="padding-left:20px;color:#475569;">
      <li style="margin-bottom:12px;"><strong>Complete your profile</strong> at uptendapp.com/pro/dashboard. Add your rates, service area, and availability.</li>
      <li style="margin-bottom:12px;"><strong>Set your rates.</strong> You choose your price within the market range. Remember: your Founding Pro fee is 12%, not 15%.</li>
      <li style="margin-bottom:12px;"><strong>Go online.</strong> Toggle your status to "Online" and George will start matching you with customers.</li>
    </ol>
    <div style="text-align:center;margin:32px 0;">
      <a href="https://uptendapp.com/pro/login" style="background:#F47C20;color:white;padding:16px 40px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:18px;display:inline-block;">
        Go to Pro Dashboard
      </a>
    </div>
    <p style="color:#64748b;font-size:14px;line-height:1.6;">
      Questions? Reply to this email or chat with George at <a href="https://uptendapp.com" style="color:#F47C20;">uptendapp.com</a>.
    </p>
  `;

  return {
    subject,
    html: wrapTemplate(isPro ? proBody : customerBody),
  };
}

// ─── SHARED TEMPLATE WRAPPER ───

function wrapTemplate(body: string): string {
  return `
    <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif;">
      <div style="background:#1e293b;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
        <h1 style="color:white;margin:0;font-size:28px;">
          <span style="color:#F47C20;">Up</span>Tend
        </h1>
        <p style="color:#94a3b8;margin-top:8px;font-size:14px;">Home Intelligence</p>
      </div>
      <div style="background:white;padding:32px;border:1px solid #e2e8f0;border-top:none;">
        ${body}
      </div>
      <div style="padding:24px;text-align:center;color:#94a3b8;font-size:12px;">
        UpTend Services LLC | Orlando, FL<br>
        <a href="https://uptendapp.com" style="color:#94a3b8;">uptendapp.com</a><br>
        <a href="https://uptendapp.com/unsubscribe?email={{email}}" style="color:#94a3b8;font-size:11px;">Unsubscribe</a>
      </div>
    </div>
  `;
}

// ─── SEND HELPER ───

async function sendEmail(to: { email: string; name: string }, subject: string, html: string) {
  if (!SG_KEY) {
    console.log(`[Drip] Would send "${subject}" to ${to.email} (no SendGrid key)`);
    return;
  }
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${SG_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: [to] }],
      from: FROM,
      subject,
      content: [{ type: "text/html", value: html.replace("{{email}}", encodeURIComponent(to.email)) }],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SendGrid ${res.status}: ${text}`);
  }
  console.log(`[Drip] Sent "${subject}" to ${to.email}`);
}

// ─── DRIP RUNNER ───

interface WeeklyData {
  updates: Array<{ title: string; body: string }>;
  tip?: string;
  demandInsight?: string;
  customerCount: number;
  proCount: number;
}

/**
 * Run the drip sequence. Call this from a cron job (daily at 9 AM).
 * 
 * Logic:
 * - Members with drip_step=1 who signed up 2+ days ago → send Email 2, set drip_step=2
 * - Weekly digest (Email 3) is handled separately by runWeeklyDigest()
 * - Launch (Email 4) is triggered manually via triggerLaunchEmail()
 */
export async function runDripSequence() {
  console.log("[Drip] Running drip sequence...");

  // Ensure drip columns exist
  await ensureDripColumns();

  // Email 2: "What's coming" - for members 2+ days old, still on step 1
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const step1Members = await pool.query(
    `SELECT name, email, member_type FROM founding_members 
     WHERE COALESCE(drip_step, 1) = 1 AND created_at <= $1 AND COALESCE(unsubscribed, false) = false`,
    [twoDaysAgo]
  );

  let sent = 0;
  for (const member of step1Members.rows) {
    try {
      const isPro = member.member_type === "pro";
      const { subject, html } = email2_whats_coming(member.name, isPro);
      await sendEmail({ email: member.email, name: member.name }, subject, html);
      await pool.query("UPDATE founding_members SET drip_step = 2 WHERE email = $1", [member.email]);
      sent++;
    } catch (err) {
      console.error(`[Drip] Failed for ${member.email}:`, err);
    }
  }
  console.log(`[Drip] Email 2 sent to ${sent} members`);
}

/**
 * Send weekly digest to all members who are on step 2+.
 * Call this every Tuesday at 9 AM.
 */
export async function runWeeklyDigest(weekData: WeeklyData) {
  console.log("[Drip] Sending weekly digest...");

  await ensureDripColumns();

  const members = await pool.query(
    `SELECT name, email, member_type FROM founding_members 
     WHERE COALESCE(drip_step, 1) >= 2 AND COALESCE(unsubscribed, false) = false`
  );

  let sent = 0;
  for (const member of members.rows) {
    try {
      const isPro = member.member_type === "pro";
      const { subject, html } = email3_weekly_digest(member.name, isPro, weekData);
      await sendEmail({ email: member.email, name: member.name }, subject, html);
      sent++;
    } catch (err) {
      console.error(`[Drip] Weekly digest failed for ${member.email}:`, err);
    }
  }
  console.log(`[Drip] Weekly digest sent to ${sent} members`);
}

/**
 * Trigger launch email to ALL members. Call this once when we go live.
 */
export async function triggerLaunchEmail() {
  console.log("[Drip] Sending launch email to all members...");

  const members = await pool.query(
    `SELECT name, email, member_type FROM founding_members 
     WHERE COALESCE(unsubscribed, false) = false`
  );

  let sent = 0;
  for (const member of members.rows) {
    try {
      const isPro = member.member_type === "pro";
      const { subject, html } = email4_launch(member.name, isPro);
      await sendEmail({ email: member.email, name: member.name }, subject, html);
      await pool.query("UPDATE founding_members SET drip_step = 4 WHERE email = $1", [member.email]);
      sent++;
    } catch (err) {
      console.error(`[Drip] Launch email failed for ${member.email}:`, err);
    }
  }
  console.log(`[Drip] Launch email sent to ${sent} members`);
}

// ─── DB MIGRATION HELPER ───

async function ensureDripColumns() {
  try {
    await pool.query(`
      ALTER TABLE founding_members 
      ADD COLUMN IF NOT EXISTS drip_step INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS unsubscribed BOOLEAN DEFAULT false
    `);
  } catch (err) {
    // Columns already exist, fine
  }
}

// ─── UNSUBSCRIBE ───

export async function unsubscribeMember(email: string) {
  await pool.query("UPDATE founding_members SET unsubscribed = true WHERE email = $1", [email]);
}
