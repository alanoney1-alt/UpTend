/**
 * Personalized Outreach Message Generator
 * Run: npx tsx scripts/market-intel/generate-outreach.ts [--date YYYY-MM-DD] [--output-dir PATH]
 */

import fs from "fs";
import path from "path";
import os from "os";

const PIPELINE_ROOT = path.join(os.homedir(), "Desktop", "Pro_Recruitment_Pipeline");
const DEFAULT_CONTACTS_DIR = path.join(PIPELINE_ROOT, "contacts");
const DEFAULT_OUTPUT_DIR = path.join(PIPELINE_ROOT, "outreach");
const dateArg = process.argv.find((_, i, a) => a[i - 1] === "--date") || new Date().toISOString().split("T")[0];
const outputDir = process.argv.find((_, i, a) => a[i - 1] === "--output-dir") || DEFAULT_OUTPUT_DIR;
const contactsDir = process.argv.find((_, i, a) => a[i - 1] === "--contacts-dir") || DEFAULT_CONTACTS_DIR;

interface Contact {
  url: string;
  title: string;
  serviceType: string;
  phones: string[];
  emails: string[];
  name: string | null;
  location: string | null;
}

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

interface ServiceTemplate {
  friendlyName: string;
  earningsProjection: string;
  painPoints: string[];
  certBenefits: string;
  subjectLines: string[];
}

const TEMPLATES: Record<string, ServiceTemplate> = {
  cleaning: {
    friendlyName: "cleaning",
    earningsProjection: "Top cleaning pros on UpTend earn $3,200–$6,200/mo with a full schedule — and you set your own hours",
    painPoints: [
      "No more Craigslist posting or chasing leads — jobs come to you through real-time matching",
      "No upfront costs or monthly fees to join",
      "Guaranteed pricing means no awkward negotiations — customers see the price, you get the payout",
    ],
    certBenefits: "Our free Certification Academy helps you stand out, earn more per job, and reduce your platform fee",
    subjectLines: [
      "Orlando cleaning pro? There's a better way to fill your schedule",
      "Stop chasing cleaning leads — let them come to you",
      "Cleaning pros in Orlando are earning $4,500+/mo on UpTend",
    ],
  },
  painting: {
    friendlyName: "painting",
    earningsProjection: "Painting pros on UpTend are earning $3,500–$6,200/mo — with zero lead generation costs",
    painPoints: [
      "Instant job matching — no more waiting for callbacks or lowball leads",
      "Zero upfront cost to join, no monthly subscriptions",
      "Our AI assistant George helps with estimates so you can focus on the work",
    ],
    certBenefits: "Get UpTend Certified (free) and unlock higher payouts and priority job matching",
    subjectLines: [
      "Orlando painter? Get matched with jobs automatically",
      "Painting jobs in Orlando — no more chasing estimates",
      "Painters are earning $4,500+/mo on UpTend — here's how",
    ],
  },
  handyman: {
    friendlyName: "handyman",
    earningsProjection: "Handyman pros on UpTend earn $2,800–$6,200/mo depending on certifications and volume",
    painPoints: [
      "Real-time job matching means your phone buzzes with new jobs — no more posting ads",
      "No upfront costs, no monthly fees, no contracts",
      "Guaranteed price ceiling — customers know the cost upfront, you get paid per job",
    ],
    certBenefits: "Complete our free Certification Academy and move from Starter ($2,800/mo avg) to Certified ($4,500/mo avg)",
    subjectLines: [
      "Handyman in Orlando? Jobs are waiting for you",
      "Stop advertising — start getting matched with handyman jobs",
      "Orlando handyman pros are earning more with UpTend",
    ],
  },
  landscaping: {
    friendlyName: "landscaping",
    earningsProjection: "Landscaping pros on UpTend earn $3,000–$6,200/mo — with recurring job opportunities built in",
    painPoints: [
      "Get matched with lawn, yard, and landscaping jobs in your area automatically",
      "No lead fees, no upfront costs — you only pay a small platform fee when you earn",
      "Build recurring customers through the platform without the marketing hassle",
    ],
    certBenefits: "Our free Certification Academy helps you qualify for premium landscaping jobs and lower platform fees",
    subjectLines: [
      "Landscaping pro in Orlando? Fill your schedule faster",
      "Orlando landscaping jobs — delivered to your phone",
      "How Orlando landscapers are earning $4,500+/mo without ads",
    ],
  },
  pressure_washing: {
    friendlyName: "pressure washing",
    earningsProjection: "Pressure washing pros earn $3,200–$6,200/mo on UpTend — driveway, patio, and house wash jobs daily",
    painPoints: [
      "Jobs matched to your location and availability — no more driving across town for a maybe",
      "No subscription fees, no lead purchase costs",
      "Professional booking flow means fewer no-shows and cancellations",
    ],
    certBenefits: "Get UpTend Certified (it's free) to unlock Elite earning potential at $6,200+/mo",
    subjectLines: [
      "Pressure washing pro? Orlando jobs are waiting",
      "Get pressure washing jobs without buying leads",
      "Orlando pressure washing pros: earn more, hustle less",
    ],
  },
  pool_care: {
    friendlyName: "pool care",
    earningsProjection: "Pool care pros on UpTend earn $3,000–$6,200/mo with steady recurring maintenance jobs",
    painPoints: [
      "Build a recurring client base through automatic matching — no door-knocking required",
      "Zero upfront costs and no contracts",
      "Guaranteed pricing means customers trust the quote and you get paid on time",
    ],
    certBenefits: "Our Certification Academy covers pool maintenance best practices and unlocks premium job tiers",
    subjectLines: [
      "Pool pro in Orlando? Get steady recurring clients",
      "Orlando pool care jobs — automatically matched to you",
      "Pool pros are building $4,500+/mo businesses on UpTend",
    ],
  },
  junk_removal: {
    friendlyName: "junk removal",
    earningsProjection: "Junk removal pros on UpTend earn $2,800–$6,200/mo — pickup and haul jobs matched daily",
    painPoints: [
      "Jobs sent straight to your phone — no more posting or waiting for calls",
      "No upfront fees, no monthly costs",
      "Clear pricing means no surprises — you know the payout before you accept",
    ],
    certBenefits: "Get Certified (free) and earn priority matching plus lower platform fees",
    subjectLines: [
      "Junk removal pro? Orlando jobs delivered to your phone",
      "Stop posting ads — start getting matched with junk removal jobs",
      "Junk removal pros earning $4,500+/mo in Orlando",
    ],
  },
  moving_labor: {
    friendlyName: "moving labor",
    earningsProjection: "Moving labor pros earn $2,800–$5,500/mo on UpTend with consistent job flow",
    painPoints: [
      "Get matched with local moving jobs automatically — no bidding wars",
      "No upfront costs, no lead fees",
      "Professional platform means reliable customers and on-time payouts",
    ],
    certBenefits: "Complete our free Certification Academy to access higher-paying moves and lower fees",
    subjectLines: [
      "Moving labor pro in Orlando? Get more jobs, less hassle",
      "Orlando movers: jobs matched to you automatically",
      "Moving pros earning more with UpTend — here's how",
    ],
  },
  carpet_cleaning: {
    friendlyName: "carpet cleaning",
    earningsProjection: "Carpet cleaning pros earn $2,800–$5,500/mo on UpTend with steady residential jobs",
    painPoints: [
      "Real-time matching means a full schedule without ad spend",
      "No monthly fees, no lead costs — just a small fee when you earn",
      "Customers book directly and pay through the platform",
    ],
    certBenefits: "Get Certified to earn more per job and reduce your platform fee",
    subjectLines: [
      "Carpet cleaning pro? Fill your Orlando schedule faster",
      "Orlando carpet cleaning jobs — no more chasing leads",
      "Carpet cleaners earning $4,500+/mo on UpTend",
    ],
  },
  gutter_cleaning: {
    friendlyName: "gutter cleaning",
    earningsProjection: "Gutter pros on UpTend earn $2,800–$5,500/mo — seasonal demand is through the roof",
    painPoints: [
      "Automatic job matching for gutter cleaning, repair, and guard installation",
      "No upfront costs or monthly subscriptions",
      "Our AI assistant helps estimate jobs so you spend time working, not quoting",
    ],
    certBenefits: "Complete our free Certification Academy and access premium gutter jobs",
    subjectLines: [
      "Gutter pro in Orlando? Jobs are stacking up",
      "Get gutter cleaning jobs without the marketing hassle",
      "Gutter pros earning more on UpTend — join free",
    ],
  },
  demolition: {
    friendlyName: "demolition",
    earningsProjection: "Demo pros on UpTend earn $3,000–$6,200/mo with teardown and clean-out jobs",
    painPoints: [
      "Get matched with demolition and cleanout jobs automatically",
      "No upfront fees — start earning immediately",
      "Clear pricing and professional booking flow",
    ],
    certBenefits: "Our Certification Academy helps you stand out and earn priority matching",
    subjectLines: [
      "Demo pro in Orlando? Get matched with jobs instantly",
      "Demolition jobs in Orlando — no more chasing leads",
      "Demo pros earning $4,500+/mo on UpTend",
    ],
  },
};

const DEFAULT_TEMPLATE: ServiceTemplate = {
  friendlyName: "home services",
  earningsProjection: "Home service pros on UpTend earn $2,800–$6,200/mo depending on certifications",
  painPoints: [
    "Real-time job matching — no more posting ads or chasing leads",
    "No upfront costs, no monthly fees, no contracts",
    "Guaranteed price ceiling means clear payouts per job",
  ],
  certBenefits: "Our free Certification Academy helps you level up: Starter → Certified ($4,500/mo avg) → Elite ($6,200/mo avg)",
  subjectLines: [
    "Orlando pro? There's a better way to get jobs",
    "Stop chasing leads — let jobs come to you",
    "Home service pros in Orlando are earning more with UpTend",
  ],
};

function getTemplate(serviceType: string): ServiceTemplate {
  return TEMPLATES[serviceType] || DEFAULT_TEMPLATE;
}

function pickSubject(template: ServiceTemplate, name: string | null): string {
  const subjects = template.subjectLines;
  const idx = name ? Math.abs(hashCode(name)) % subjects.length : Math.floor(Math.random() * subjects.length);
  return subjects[idx];
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

function generateHtml(contact: Contact, template: ServiceTemplate): string {
  const firstName = contact.name || "there";
  const signupUrl = "https://uptendapp.com/pro/signup";
  const unsubUrl = `https://uptendapp.com/unsubscribe?email=${encodeURIComponent(contact.emails[0] || "")}`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; line-height: 1.6;">

<p>Hey ${firstName},</p>

<p>I saw your ${template.friendlyName} listing on Craigslist and wanted to reach out. I'm Alan, founder of <strong>UpTend</strong> — a new home services platform launching in Orlando.</p>

<p>We're building something different for independent pros like you:</p>

<ul style="padding-left: 20px;">
${template.painPoints.map(p => `  <li style="margin-bottom: 8px;">${p}</li>`).join("\n")}
</ul>

<p><strong>${template.earningsProjection}.</strong></p>

<p>Here's how it works:</p>
<ol style="padding-left: 20px;">
  <li>Sign up free — takes 2 minutes</li>
  <li>Set your availability and service area</li>
  <li>Get matched with jobs in real time</li>
  <li>Complete the job, get paid — that's it</li>
</ol>

<p>🎓 <strong>Free Certification Academy:</strong> ${template.certBenefits}.</p>

<p>🤖 Plus, you get <strong>George</strong> — our AI assistant that helps with scheduling, estimates, and customer communication.</p>

<p style="text-align: center; margin: 30px 0;">
  <a href="${signupUrl}" style="background-color: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Join UpTend Free →</a>
</p>

<p>No contracts, no monthly fees. If you have any questions, just reply to this email — I read every one.</p>

<p>Best,<br>
<strong>Alan Olsen</strong><br>
Founder, UpTend<br>
<a href="https://uptendapp.com">uptendapp.com</a></p>

<hr style="margin-top: 40px; border: none; border-top: 1px solid #eee;">
<p style="font-size: 12px; color: #999;">
  You're receiving this because you posted a ${template.friendlyName} listing on Craigslist.
  <a href="${unsubUrl}" style="color: #999;">Unsubscribe</a> |
  UpTend Inc., Orlando, FL 32832
</p>

</body>
</html>`;
}

function generateText(contact: Contact, template: ServiceTemplate): string {
  const firstName = contact.name || "there";
  const unsubUrl = `https://uptendapp.com/unsubscribe?email=${encodeURIComponent(contact.emails[0] || "")}`;

  return `Hey ${firstName},

I saw your ${template.friendlyName} listing on Craigslist and wanted to reach out. I'm Alan, founder of UpTend — a new home services platform launching in Orlando.

We're building something different for independent pros like you:

${template.painPoints.map(p => `• ${p}`).join("\n")}

${template.earningsProjection}.

How it works:
1. Sign up free — takes 2 minutes
2. Set your availability and service area
3. Get matched with jobs in real time
4. Complete the job, get paid — that's it

Free Certification Academy: ${template.certBenefits}.

Plus, you get George — our AI assistant that helps with scheduling, estimates, and customer communication.

→ Join UpTend Free: https://uptendapp.com/pro/signup

No contracts, no monthly fees. If you have any questions, just reply to this email — I read every one.

Best,
Alan Olsen
Founder, UpTend
https://uptendapp.com

---
You're receiving this because you posted a ${template.friendlyName} listing on Craigslist.
Unsubscribe: ${unsubUrl}
UpTend Inc., Orlando, FL 32832`;
}

async function main() {
  const contactsPath = path.join(contactsDir, `contacts-${dateArg}.json`);
  if (!fs.existsSync(contactsPath)) {
    console.error(`❌ No contacts file at ${contactsPath}. Run extract-contacts.ts first.`);
    process.exit(1);
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const contacts: Contact[] = JSON.parse(fs.readFileSync(contactsPath, "utf-8"));
  const withEmail = contacts.filter(c => c.emails.length > 0);
  console.log(`📧 Generating outreach for ${withEmail.length} contacts with email addresses`);
  console.log(`📂 Output dir: ${outputDir}`);

  const messages: OutreachMessage[] = [];

  for (const contact of withEmail) {
    const template = getTemplate(contact.serviceType);
    const subject = pickSubject(template, contact.name);

    messages.push({
      email: contact.emails[0],
      phone: contact.phones[0] || null,
      name: contact.name,
      serviceType: contact.serviceType,
      subject,
      htmlBody: generateHtml(contact, template),
      textBody: generateText(contact, template),
      contactUrl: contact.url,
    });
  }

  const outPath = path.join(outputDir, `outreach-${dateArg}.json`);
  fs.writeFileSync(outPath, JSON.stringify(messages, null, 2));

  console.log(`\n✅ Generated ${messages.length} outreach messages`);
  console.log(`   📄 ${outPath}`);

  const byType: Record<string, number> = {};
  messages.forEach(m => { byType[m.serviceType] = (byType[m.serviceType] || 0) + 1; });
  console.log("\n📊 By service type:");
  Object.entries(byType).sort((a, b) => b[1] - a[1]).forEach(([t, n]) => console.log(`   ${t}: ${n}`));

  if (messages.length > 0) {
    console.log("\n--- PREVIEW (first message) ---");
    console.log(`To: ${messages[0].email}`);
    console.log(`Subject: ${messages[0].subject}`);
    console.log(`\n${messages[0].textBody.slice(0, 500)}...`);
  }
}

main().catch(console.error);
