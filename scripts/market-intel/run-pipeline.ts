/**
 * Master Pipeline Runner
 * Chains: scrape → extract contacts → generate outreach → send digest
 * 
 * Output lands on Desktop: ~/Desktop/Pro_Recruitment_Pipeline/
 * 
 * Run: npx tsx scripts/market-intel/run-pipeline.ts [--send-outreach] [--skip-scrape]
 */

import { execSync } from "child_process";
import path from "path";
import os from "os";

const SCRIPT_DIR = import.meta.dirname;
const PROJECT_ROOT = path.join(SCRIPT_DIR, "../..");
const PIPELINE_ROOT = path.join(os.homedir(), "Desktop", "Pro_Recruitment_Pipeline");
const today = new Date().toISOString().split("T")[0];
const sendOutreach = process.argv.includes("--send-outreach");
const skipScrape = process.argv.includes("--skip-scrape");

function run(label: string, cmd: string) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🚀 ${label}`);
  console.log("=".repeat(60));
  try {
    execSync(cmd, { stdio: "inherit", cwd: PROJECT_ROOT });
  } catch (err: any) {
    console.error(`❌ ${label} failed with exit code ${err.status}`);
    if (!label.includes("Scrape")) throw err;
  }
}

async function main() {
  console.log(`🔄 UpTend Recruitment Pipeline — ${today}`);
  console.log(`   Output: ${PIPELINE_ROOT}`);
  console.log(`   Send outreach: ${sendOutreach ? "YES" : "NO (dry run)"}`);
  console.log(`   Skip scrape: ${skipScrape}`);

  if (!skipScrape) {
    run("Step 1: Scrape Craigslist + Reddit + Google", `npx tsx scripts/market-intel/scrape.ts`);
  } else {
    console.log("\n⏭️  Skipping scrape (--skip-scrape)");
  }

  run("Step 2: Extract Contacts → Desktop", `npx tsx scripts/market-intel/extract-contacts.ts --date ${today}`);
  run("Step 3: Generate Outreach → Desktop", `npx tsx scripts/market-intel/generate-outreach.ts --date ${today}`);

  if (sendOutreach) {
    run("Step 4: Send Outreach Emails", `npx tsx scripts/market-intel/send-outreach.ts --date ${today} --send`);
  } else {
    run("Step 4: Outreach Dry Run", `npx tsx scripts/market-intel/send-outreach.ts --date ${today}`);
  }

  run("Step 5: Send Daily Digest", `npx tsx scripts/market-intel/daily-digest.ts --date ${today}`);

  console.log(`\n${"=".repeat(60)}`);
  console.log(`✅ Pipeline complete!`);
  console.log(`📂 All output: ${PIPELINE_ROOT}`);
  console.log("=".repeat(60));
}

main().catch(console.error);
