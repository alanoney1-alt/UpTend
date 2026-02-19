/**
 * Email Campaign Sender via SendGrid
 * Run: npx tsx scripts/market-intel/send-outreach.ts [--date YYYY-MM-DD] [--send] [--limit N]
 * 
 * DRY RUN by default. Pass --send to actually send emails.
 * Max 50 emails per run (configurable with --limit).
 */

import fs from "fs";
import path from "path";
import os from "os";
import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";

dotenv.config({ path: path.join(import.meta.dirname, "../../.env") });

const PIPELINE_ROOT = path.join(os.homedir(), "Desktop", "Pro_Recruitment_Pipeline");
const OUTREACH_DIR = path.join(PIPELINE_ROOT, "outreach");
const SENT_LOG_PATH = path.join(PIPELINE_ROOT, "sent-log.json");
const dateArg = process.argv.find((_, i, a) => a[i - 1] === "--date") || new Date().toISOString().split("T")[0];
const doSend = process.argv.includes("--send");
const limitArg = process.argv.find((_, i, a) => a[i - 1] === "--limit");
const maxSend = limitArg ? parseInt(limitArg) : 50;

interface OutreachMessage {
  email: string;
  phone: string | null;
  name: string | null;
  serviceType: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  contactUrl: string;
}

interface SentRecord {
  email: string;
  sentAt: string;
  subject: string;
  serviceType: string;
  status: "sent" | "failed";
  error?: string;
}

function loadSentLog(): SentRecord[] {
  if (fs.existsSync(SENT_LOG_PATH)) {
    return JSON.parse(fs.readFileSync(SENT_LOG_PATH, "utf-8"));
  }
  return [];
}

function saveSentLog(log: SentRecord[]) {
  fs.writeFileSync(SENT_LOG_PATH, JSON.stringify(log, null, 2));
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.error("❌ SENDGRID_API_KEY not found in .env");
    process.exit(1);
  }

  if (!doSend) {
    console.log("🔒 DRY RUN MODE — pass --send to actually send emails\n");
  }

  sgMail.setApiKey(apiKey);

  const outreachPath = path.join(OUTREACH_DIR, `outreach-${dateArg}.json`);
  if (!fs.existsSync(outreachPath)) {
    console.error(`❌ No outreach file at ${outreachPath}. Run generate-outreach.ts first.`);
    process.exit(1);
  }

  const messages: OutreachMessage[] = JSON.parse(fs.readFileSync(outreachPath, "utf-8"));
  const sentLog = loadSentLog();
  const alreadySent = new Set(sentLog.map(r => r.email));

  const toSend = messages.filter(m => !alreadySent.has(m.email)).slice(0, maxSend);

  console.log(`📧 ${messages.length} total outreach messages`);
  console.log(`   ${alreadySent.size} already sent (skipping)`);
  console.log(`   ${toSend.length} to send this run (max: ${maxSend})\n`);

  if (toSend.length === 0) {
    console.log("✅ Nothing to send!");
    return;
  }

  let sentCount = 0;
  let failCount = 0;

  for (let i = 0; i < toSend.length; i++) {
    const msg = toSend[i];
    const label = `[${i + 1}/${toSend.length}] ${msg.email} (${msg.serviceType})`;

    if (!doSend) {
      console.log(`  📝 ${label} — would send: "${msg.subject}"`);
      continue;
    }

    try {
      await sgMail.send({
        to: msg.email,
        from: { email: "alan@uptendapp.com", name: "Alan Olsen" },
        subject: msg.subject,
        text: msg.textBody,
        html: msg.htmlBody,
        trackingSettings: {
          clickTracking: { enable: false },
          openTracking: { enable: false },
        },
      });

      sentLog.push({
        email: msg.email,
        sentAt: new Date().toISOString(),
        subject: msg.subject,
        serviceType: msg.serviceType,
        status: "sent",
      });
      sentCount++;
      console.log(`  ✅ ${label} — SENT`);
      await sleep(1200);
    } catch (err: any) {
      const errMsg = err?.response?.body?.errors?.[0]?.message || err.message || "Unknown error";
      sentLog.push({
        email: msg.email,
        sentAt: new Date().toISOString(),
        subject: msg.subject,
        serviceType: msg.serviceType,
        status: "failed",
        error: errMsg,
      });
      failCount++;
      console.log(`  ❌ ${label} — FAILED: ${errMsg}`);
    }

    if (doSend) saveSentLog(sentLog);
  }

  if (doSend) {
    saveSentLog(sentLog);
    console.log(`\n✅ Sent: ${sentCount} | Failed: ${failCount}`);
  } else {
    console.log(`\n📝 DRY RUN complete. Would have sent ${toSend.length} emails.`);
    console.log(`   Run with --send to actually send.`);
  }
}

main().catch(console.error);
