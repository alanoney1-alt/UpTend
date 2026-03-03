/**
 * Partner Proactive Outreach (#3)
 * 
 * George texts/emails partners proactively with business updates:
 * - Review alerts ("You got 3 new reviews this week")
 * - Ranking changes ("Your Google ranking moved from #8 to #5")
 * - Lead summaries ("12 leads this month, cost per lead $14")
 * - Competitor alerts (wired to competitor watchdog)
 * - Milestone celebrations ("You just hit 100 five-star reviews!")
 */

import { db } from "../db";
import { sql } from "drizzle-orm";

// ============================================================
// Types
// ============================================================

export interface PartnerContact {
  slug: string;
  companyName: string;
  ownerName: string;
  phone: string;
  email: string;
  preferredChannel: "sms" | "email" | "both";
}

export interface OutreachMessage {
  id?: number;
  partnerSlug: string;
  channel: "sms" | "email";
  messageType: "review_alert" | "ranking_change" | "lead_summary" | "competitor_alert" | "milestone" | "weekly_recap" | "custom";
  subject?: string;
  body: string;
  sentAt?: string;
  status: "queued" | "sent" | "failed";
}

// ============================================================
// Database Setup
// ============================================================

export async function ensureOutreachTables(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS partner_outreach_log (
        id SERIAL PRIMARY KEY,
        partner_slug TEXT NOT NULL,
        channel TEXT NOT NULL CHECK (channel IN ('sms', 'email')),
        message_type TEXT NOT NULL,
        subject TEXT,
        body TEXT NOT NULL,
        status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed')),
        sent_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS partner_contacts (
        id SERIAL PRIMARY KEY,
        partner_slug TEXT UNIQUE NOT NULL,
        company_name TEXT NOT NULL,
        owner_name TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        email TEXT DEFAULT '',
        preferred_channel TEXT DEFAULT 'both' CHECK (preferred_channel IN ('sms', 'email', 'both')),
        opted_in BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  } catch (err) {
    console.error("[ProactiveOutreach] Table creation error:", err);
  }
}

// ============================================================
// Contact Management
// ============================================================

export async function registerPartnerContact(contact: PartnerContact): Promise<void> {
  await ensureOutreachTables();
  await db.execute(sql`
    INSERT INTO partner_contacts (partner_slug, company_name, owner_name, phone, email, preferred_channel)
    VALUES (${contact.slug}, ${contact.companyName}, ${contact.ownerName}, ${contact.phone}, ${contact.email}, ${contact.preferredChannel})
    ON CONFLICT (partner_slug) DO UPDATE SET
      company_name = EXCLUDED.company_name,
      owner_name = EXCLUDED.owner_name,
      phone = EXCLUDED.phone,
      email = EXCLUDED.email,
      preferred_channel = EXCLUDED.preferred_channel
  `);
}

export async function getPartnerContact(slug: string): Promise<PartnerContact | null> {
  await ensureOutreachTables();
  const result = await db.execute(sql`
    SELECT * FROM partner_contacts WHERE partner_slug = ${slug} AND opted_in = true
  `);
  if (result.rows.length === 0) return null;
  const r: any = result.rows[0];
  return {
    slug: r.partner_slug,
    companyName: r.company_name,
    ownerName: r.owner_name,
    phone: r.phone,
    email: r.email,
    preferredChannel: r.preferred_channel,
  };
}

// ============================================================
// Message Generation (George's voice)
// ============================================================

export function generateReviewAlert(ownerName: string, newReviews: number, totalReviews: number, avgRating: number): string {
  const firstName = ownerName.split(" ")[0] || "there";
  if (newReviews === 1) {
    return `Hey ${firstName}, you just got a new review. That puts you at ${totalReviews} total with a ${avgRating} average. Keep that momentum going.`;
  }
  return `Hey ${firstName}, ${newReviews} new reviews this week. You're at ${totalReviews} total, ${avgRating} average. Your reputation is building itself at this point.`;
}

export function generateRankingChange(ownerName: string, keyword: string, oldRank: number, newRank: number): string {
  const firstName = ownerName.split(" ")[0] || "there";
  if (newRank < oldRank) {
    return `${firstName}, your Google ranking for "${keyword}" just moved from #${oldRank} to #${newRank}. That SEO is doing its thing.`;
  }
  return `Heads up ${firstName}, your ranking for "${keyword}" slipped from #${oldRank} to #${newRank}. I'm keeping an eye on it and adjusting your content strategy.`;
}

export function generateLeadSummary(ownerName: string, stats: {
  totalLeads: number;
  seoLeads: number;
  gbpLeads: number;
  referralLeads: number;
  costPerLead: number;
  industryAvgCPL: number;
}): string {
  const firstName = ownerName.split(" ")[0] || "there";
  const sources: string[] = [];
  if (stats.seoLeads > 0) sources.push(`${stats.seoLeads} from SEO pages`);
  if (stats.gbpLeads > 0) sources.push(`${stats.gbpLeads} from Google Business Profile`);
  if (stats.referralLeads > 0) sources.push(`${stats.referralLeads} from partner referrals`);
  
  let msg = `${firstName}, here's your month so far: ${stats.totalLeads} leads.`;
  if (sources.length > 0) msg += ` Breakdown: ${sources.join(", ")}.`;
  if (stats.costPerLead > 0) {
    msg += ` Your cost per lead is $${stats.costPerLead}`;
    if (stats.industryAvgCPL > stats.costPerLead) {
      msg += ` vs the industry average of $${stats.industryAvgCPL}. You're winning.`;
    } else {
      msg += `. We can do better. I'm on it.`;
    }
  }
  return msg;
}

export function generateCompetitorAlert(ownerName: string, competitorName: string, action: string): string {
  const firstName = ownerName.split(" ")[0] || "there";
  return `Heads up ${firstName}, ${competitorName} just ${action}. Want me to adjust your strategy?`;
}

export function generateMilestone(ownerName: string, milestone: string): string {
  const firstName = ownerName.split(" ")[0] || "there";
  return `${firstName}, milestone hit: ${milestone}. That's real growth. Keep going.`;
}

export function generateWeeklyRecap(ownerName: string, data: {
  leadsThisWeek: number;
  jobsCompleted: number;
  revenue: number;
  newReviews: number;
  rankingChanges: string[];
}): string {
  const firstName = ownerName.split(" ")[0] || "there";
  let msg = `Weekly recap, ${firstName}:\n`;
  msg += `- ${data.leadsThisWeek} new leads\n`;
  msg += `- ${data.jobsCompleted} jobs completed\n`;
  msg += `- $${data.revenue.toLocaleString()} in revenue\n`;
  if (data.newReviews > 0) msg += `- ${data.newReviews} new reviews\n`;
  if (data.rankingChanges.length > 0) {
    msg += `- Ranking moves: ${data.rankingChanges.join(", ")}\n`;
  }
  msg += `\nNeed anything? Just text back.`;
  return msg;
}

// ============================================================
// Send Messages
// ============================================================

export async function sendPartnerMessage(
  partnerSlug: string,
  messageType: OutreachMessage["messageType"],
  body: string,
  subject?: string
): Promise<void> {
  await ensureOutreachTables();
  
  const contact = await getPartnerContact(partnerSlug);
  if (!contact) {
    console.log(`[ProactiveOutreach] No contact for ${partnerSlug}, skipping`);
    return;
  }

  const channels: ("sms" | "email")[] = 
    contact.preferredChannel === "both" ? ["sms"] : // Default to SMS for proactive
    [contact.preferredChannel];

  for (const channel of channels) {
    // Log the message
    await db.execute(sql`
      INSERT INTO partner_outreach_log (partner_slug, channel, message_type, subject, body, status)
      VALUES (${partnerSlug}, ${channel}, ${messageType}, ${subject || ""}, ${body}, 'queued')
    `);

    if (channel === "email" && contact.email) {
      try {
        const sgApiKey = process.env.SENDGRID_API_KEY;
        const fromEmail = process.env.FROM_EMAIL || "alan@uptendapp.com";
        if (sgApiKey) {
          await fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${sgApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              personalizations: [{ to: [{ email: contact.email }] }],
              from: { email: fromEmail, name: "George at UpTend" },
              subject: subject || "Update from George at UpTend",
              content: [
                { type: "text/plain", value: body },
                { type: "text/html", value: `<div style="font-family: -apple-system, sans-serif; max-width: 500px; padding: 20px;"><p style="font-size: 16px; line-height: 1.6; color: #1a1a2e;">${body.replace(/\n/g, "<br>")}</p><p style="color: #666; font-size: 14px; margin-top: 20px;">-- George, your AI business advisor at UpTend</p></div>` },
              ],
            }),
          });
        }
        await db.execute(sql`
          UPDATE partner_outreach_log SET status = 'sent', sent_at = NOW()
          WHERE partner_slug = ${partnerSlug} AND channel = 'email' AND status = 'queued'
          ORDER BY created_at DESC LIMIT 1
        `);
      } catch (err) {
        console.error(`[ProactiveOutreach] Email failed for ${partnerSlug}:`, err);
      }
    }

    if (channel === "sms" && contact.phone) {
      // Twilio SMS — will work once Twilio is verified
      try {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromNumber = process.env.TWILIO_PHONE_NUMBER;
        
        if (accountSid && authToken && fromNumber) {
          const twilio = await import("twilio");
          const client = twilio.default(accountSid, authToken);
          await client.messages.create({
            body,
            from: fromNumber,
            to: contact.phone,
          });
          await db.execute(sql`
            UPDATE partner_outreach_log SET status = 'sent', sent_at = NOW()
            WHERE partner_slug = ${partnerSlug} AND channel = 'sms' AND status = 'queued'
            ORDER BY created_at DESC LIMIT 1
          `);
        } else {
          console.log(`[ProactiveOutreach] Twilio not configured, SMS queued for ${partnerSlug}`);
        }
      } catch (err) {
        console.error(`[ProactiveOutreach] SMS failed for ${partnerSlug}:`, err);
      }
    }
  }
}

// ============================================================
// Outreach History
// ============================================================

export async function getOutreachHistory(partnerSlug: string, limit: number = 20): Promise<OutreachMessage[]> {
  await ensureOutreachTables();
  const result = await db.execute(sql`
    SELECT * FROM partner_outreach_log
    WHERE partner_slug = ${partnerSlug}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `);
  return result.rows as any[];
}
