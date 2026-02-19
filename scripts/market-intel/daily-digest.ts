/**
 * Daily Digest Email — Sends a summary of today's scrape to alan@uptendapp.com
 * Run: npx tsx scripts/market-intel/daily-digest.ts [--date YYYY-MM-DD] [--dry-run]
 */

import fs from "fs";
import path from "path";
import os from "os";
import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";

dotenv.config({ path: path.join(import.meta.dirname, "../../.env") });

const REPORTS_DIR = path.join(import.meta.dirname, "reports");
const PIPELINE_ROOT = path.join(os.homedir(), "Desktop", "Pro_Recruitment_Pipeline");
const CONTACTS_DIR = path.join(PIPELINE_ROOT, "contacts");
const DIGESTS_DIR = path.join(PIPELINE_ROOT, "digests");
const dateArg = process.argv.find((_, i, a) => a[i - 1] === "--date") || new Date().toISOString().split("T")[0];
const dryRun = process.argv.includes("--dry-run");

interface Finding {
  source: string;
  type: string;
  title: string;
  detail: string;
  url: string;
  date: string;
}

interface Contact {
  url: string;
  title: string;
  serviceType: string;
  phones: string[];
  emails: string[];
  name: string | null;
  location: string | null;
}

function formatPhone(digits: string): string {
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function classifyFromTitle(title: string): string {
  const t = title.toLowerCase();
  if (/clean|maid|janitorial/i.test(t)) return "cleaning";
  if (/paint/i.test(t)) return "painting";
  if (/handyman|repair|mount/i.test(t)) return "handyman";
  if (/landscape|lawn|mow/i.test(t)) return "landscaping";
  if (/pressure|power wash/i.test(t)) return "pressure_washing";
  if (/pool/i.test(t)) return "pool_care";
  if (/junk|haul/i.test(t)) return "junk_removal";
  if (/plumb/i.test(t)) return "plumbing";
  if (/gutter/i.test(t)) return "gutter_cleaning";
  if (/mov/i.test(t)) return "moving_labor";
  if (/carpet/i.test(t)) return "carpet_cleaning";
  if (/demol/i.test(t)) return "demolition";
  return "general";
}

async function main() {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey && !dryRun) {
    console.error("❌ SENDGRID_API_KEY not found");
    process.exit(1);
  }

  fs.mkdirSync(DIGESTS_DIR, { recursive: true });

  // Load findings from scrape reports dir
  const findingsPath = path.join(REPORTS_DIR, `${dateArg}.json`);
  const findings: Finding[] = fs.existsSync(findingsPath)
    ? JSON.parse(fs.readFileSync(findingsPath, "utf-8"))
    : [];

  // Load contacts from Desktop pipeline dir
  const contactsPath = path.join(CONTACTS_DIR, `contacts-${dateArg}.json`);
  const contacts: Contact[] = fs.existsSync(contactsPath)
    ? JSON.parse(fs.readFileSync(contactsPath, "utf-8"))
    : [];

  const proRecruits = findings.filter(f => f.type === "pro_recruit");
  const customerLeads = findings.filter(f => f.type === "customer_lead");
  const demandSignals = findings.filter(f => f.type === "demand_signal");
  const withPhone = contacts.filter(c => c.phones.length > 0);
  const withEmail = contacts.filter(c => c.emails.length > 0);

  const byType: Record<string, number> = {};
  (contacts.length > 0 ? contacts : proRecruits).forEach(item => {
    const svc = 'serviceType' in item ? (item as Contact).serviceType : classifyFromTitle(item.title);
    byType[svc] = (byType[svc] || 0) + 1;
  });
  const sortedTypes = Object.entries(byType).sort((a, b) => b[1] - a[1]);

  const topProspects = contacts
    .filter(c => c.phones.length > 0 || c.emails.length > 0)
    .slice(0, 10);

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; color: #333;">

<h1 style="color: #2563eb; margin-bottom: 5px;">📊 UpTend Daily Intel — ${dateArg}</h1>
<p style="color: #666; margin-top: 0;">Orlando Market Intelligence Report</p>

<div style="background: #f0f9ff; border-radius: 12px; padding: 20px; margin: 20px 0;">
  <h2 style="margin-top: 0; font-size: 18px;">Summary</h2>
  <table style="width: 100%; border-collapse: collapse;">
    <tr><td style="padding: 6px 0;">🔨 Pro Recruitment Targets</td><td style="text-align: right; font-weight: bold;">${proRecruits.length}</td></tr>
    <tr><td style="padding: 6px 0;">📞 With Phone Numbers</td><td style="text-align: right; font-weight: bold;">${withPhone.length}</td></tr>
    <tr><td style="padding: 6px 0;">📧 With Email Addresses</td><td style="text-align: right; font-weight: bold;">${withEmail.length}</td></tr>
    <tr><td style="padding: 6px 0;">🎯 Customer Leads</td><td style="text-align: right; font-weight: bold;">${customerLeads.length}</td></tr>
    <tr><td style="padding: 6px 0;">📡 Demand Signals</td><td style="text-align: right; font-weight: bold;">${demandSignals.length}</td></tr>
    <tr><td style="padding: 6px 0;"><strong>Total Findings</strong></td><td style="text-align: right; font-weight: bold;">${findings.length}</td></tr>
  </table>
</div>

<h2 style="font-size: 18px;">📊 By Service Type</h2>
<table style="width: 100%; border-collapse: collapse;">
${sortedTypes.map(([type, count]) => {
  const pct = Math.round((count / Math.max(proRecruits.length, 1)) * 100);
  return `  <tr>
    <td style="padding: 4px 0;">${type.replace(/_/g, " ")}</td>
    <td style="width: 50%; padding: 4px 8px;"><div style="background: #2563eb; height: 16px; border-radius: 4px; width: ${Math.max(pct, 5)}%;"></div></td>
    <td style="text-align: right; font-weight: bold;">${count}</td>
  </tr>`;
}).join("\n")}
</table>

${topProspects.length > 0 ? `
<h2 style="font-size: 18px;">⭐ Top Prospects</h2>
<table style="width: 100%; border-collapse: collapse; font-size: 14px;">
  <tr style="background: #f3f4f6;">
    <th style="padding: 8px; text-align: left;">Name</th>
    <th style="padding: 8px; text-align: left;">Service</th>
    <th style="padding: 8px; text-align: left;">Contact</th>
  </tr>
${topProspects.map(c => `  <tr style="border-bottom: 1px solid #eee;">
    <td style="padding: 8px;">${c.name || "—"}</td>
    <td style="padding: 8px;">${c.serviceType.replace(/_/g, " ")}</td>
    <td style="padding: 8px;">${c.phones[0] ? "📞 " + formatPhone(c.phones[0]) : ""}${c.phones[0] && c.emails[0] ? "<br>" : ""}${c.emails[0] ? "📧 " + c.emails[0] : ""}</td>
  </tr>`).join("\n")}
</table>` : ""}

<div style="margin-top: 30px; padding: 16px; background: #fef3c7; border-radius: 8px;">
  <strong>🚀 Next Steps:</strong>
  <ul style="margin: 8px 0; padding-left: 20px;">
    ${withEmail.length > 0 ? `<li>Send outreach to ${withEmail.length} pros with email</li>` : ""}
    ${withPhone.length > 0 ? `<li>Call/text ${withPhone.length} pros with phone numbers</li>` : ""}
    ${customerLeads.length > 0 ? `<li>Respond to ${customerLeads.length} customer leads</li>` : ""}
    <li>Run: <code>npx tsx scripts/market-intel/send-outreach.ts --send</code></li>
  </ul>
</div>

<p style="font-size: 13px; color: #666; margin-top: 20px;">
  📂 Files on Desktop: <code>~/Desktop/Pro_Recruitment_Pipeline/</code>
</p>

<hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
<p style="font-size: 12px; color: #999;">
  UpTend Market Intelligence Pipeline | ${new Date().toISOString()}
</p>

</body>
</html>`;

  // Save digest HTML to Desktop
  const digestPath = path.join(DIGESTS_DIR, `digest-${dateArg}.html`);
  fs.writeFileSync(digestPath, html);
  console.log(`📄 Digest saved: ${digestPath}`);

  if (dryRun) {
    console.log("🔒 DRY RUN — not sending\n");
    console.log(`Subject: 📊 UpTend Intel ${dateArg}: ${proRecruits.length} pros, ${withPhone.length} phones, ${withEmail.length} emails`);
    console.log(`\nStats: ${proRecruits.length} pros | ${withPhone.length} phones | ${withEmail.length} emails | ${customerLeads.length} leads`);
    console.log("\nService breakdown:");
    sortedTypes.forEach(([t, n]) => console.log(`  ${t}: ${n}`));
    return;
  }

  sgMail.setApiKey(apiKey!);

  try {
    await sgMail.send({
      to: "alan@uptendapp.com",
      from: { email: "alan@uptendapp.com", name: "UpTend Intel Bot" },
      subject: `📊 UpTend Intel ${dateArg}: ${proRecruits.length} pros, ${withPhone.length} phones, ${withEmail.length} emails`,
      html,
      text: `UpTend Daily Intel — ${dateArg}\n\n${proRecruits.length} pro targets, ${withPhone.length} with phones, ${withEmail.length} with emails, ${customerLeads.length} customer leads.\n\nService breakdown:\n${sortedTypes.map(([t, n]) => `  ${t}: ${n}`).join("\n")}\n\nFiles on Desktop: ~/Desktop/Pro_Recruitment_Pipeline/`,
    });
    console.log(`✅ Digest sent to alan@uptendapp.com`);
  } catch (err: any) {
    console.error(`❌ Failed to send digest: ${err.message}`);
    if (err?.response?.body) console.error(JSON.stringify(err.response.body, null, 2));
  }
}

main().catch(console.error);
