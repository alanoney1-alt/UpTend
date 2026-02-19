# UpTend Pro Recruitment Pipeline

Automated pipeline to find, contact, and recruit independent home service pros from Orlando Craigslist.

## Pipeline Flow

```
scrape.ts → extract-contacts.ts → generate-outreach.ts → send-outreach.ts
                                                              ↓
                                                        daily-digest.ts
```

## Scripts

| Script | Purpose | Command |
|--------|---------|---------|
| `scrape.ts` | Scrape Craigslist, Reddit, Google for leads | `npx tsx scripts/market-intel/scrape.ts` |
| `extract-contacts.ts` | Fetch listing pages, extract phone/email/name | `npx tsx scripts/market-intel/extract-contacts.ts` |
| `generate-outreach.ts` | Generate personalized emails per service type | `npx tsx scripts/market-intel/generate-outreach.ts` |
| `send-outreach.ts` | Send emails via SendGrid (dry run default) | `npx tsx scripts/market-intel/send-outreach.ts [--send]` |
| `daily-digest.ts` | Send summary digest to alan@uptendapp.com | `npx tsx scripts/market-intel/daily-digest.ts` |
| `run-pipeline.ts` | Run all steps in sequence | `npx tsx scripts/market-intel/run-pipeline.ts` |

## Options

All scripts accept `--date YYYY-MM-DD` to process a specific day (defaults to today).

- `send-outreach.ts --send` — Actually send emails (dry run by default)
- `send-outreach.ts --limit N` — Max emails per run (default: 50)
- `daily-digest.ts --dry-run` — Preview digest without sending
- `run-pipeline.ts --send-outreach` — Enable real sending in pipeline
- `run-pipeline.ts --skip-scrape` — Skip scraping step

## Output Files (in `reports/`)

- `YYYY-MM-DD.json` — Raw scrape findings
- `contacts-YYYY-MM-DD.json` — Extracted contacts with phone/email
- `contacts-YYYY-MM-DD.csv` — Same as above in CSV
- `outreach-YYYY-MM-DD.json` — Generated email messages
- `sent-log.json` — Cumulative log of all sent emails (prevents re-sends)

## Service Verticals

Templates exist for: cleaning, painting, handyman, landscaping, pressure washing, pool care, junk removal, moving labor, carpet cleaning, gutter cleaning, demolition.

## Compliance

- CAN-SPAM: All emails include unsubscribe link and physical address
- Rate limiting: 50 emails/day max, 1.2s between sends
- Craigslist: 1.5-2.5s delay between page fetches
- Deduplication: Contacts are deduped by phone/email
- Sent log prevents re-sending to the same address

## Environment

Requires `SENDGRID_API_KEY` in `~/uptend-openclaw/.env`. Verified sender: `alan@uptendapp.com`.
