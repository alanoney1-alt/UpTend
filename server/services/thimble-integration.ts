/**
 * Thimble / Next Insurance Integration Framework
 *
 * Referral link generation, per-job coverage (mock), and webhook handling.
 * Mock mode when no API credentials are present.
 */

// -- Configuration --

const THIMBLE_PARTNER_ID = process.env.THIMBLE_PARTNER_ID || "uptend_placeholder";
const THIMBLE_API_KEY = process.env.THIMBLE_API_KEY || "";
const NEXT_INSURANCE_PARTNER_ID = process.env.NEXT_INSURANCE_PARTNER_ID || "uptend_placeholder";

const TRADE_MAP: Record<string, string> = {
  junk_removal: "hauling",
  pressure_washing: "pressure-washing",
  gutter_cleaning: "gutter-cleaning",
  landscaping: "landscaping",
  home_cleaning: "cleaning",
  pool_cleaning: "pool-service",
  handyman: "handyman",
  carpet_cleaning: "carpet-cleaning",
  moving_labor: "moving",
  light_demolition: "demolition",
  garage_cleanout: "hauling",
};

// -- Referral Link Generation --

export function generateThimbleLink(
  proId: string,
  proEmail: string,
  proName: string,
  serviceTypes: string[]
): string {
  const trade = serviceTypes.length > 0
    ? TRADE_MAP[serviceTypes[0]] || "general-contractor"
    : "general-contractor";

  const params = new URLSearchParams({
    partner: THIMBLE_PARTNER_ID,
    email: proEmail,
    trade,
    utm_source: "uptend",
    utm_medium: "platform",
    utm_campaign: "pro_insurance",
    ref: proId,
  });

  return `https://www.thimble.com/get-a-quote?${params.toString()}`;
}

export function generateNextInsuranceLink(
  proId: string,
  proEmail: string,
  serviceTypes: string[]
): string {
  const industry = serviceTypes.length > 0
    ? TRADE_MAP[serviceTypes[0]] || "general-contractor"
    : "general-contractor";

  const params = new URLSearchParams({
    partner: NEXT_INSURANCE_PARTNER_ID,
    email: proEmail,
    industry,
    utm_source: "uptend",
    ref: proId,
  });

  return `https://www.nextinsurance.com/get-a-quote?${params.toString()}`;
}

// -- Per-Job Coverage (Mock / Future API) --

export interface PerJobCoverageResult {
  covered: boolean;
  premium: number;
  policyId: string;
  coverageAmount: number;
  mock: boolean;
}

export async function requestPerJobCoverage(
  proId: string,
  jobId: string,
  serviceType: string,
  jobValue: number
): Promise<PerJobCoverageResult> {
  // If real API key is configured, call Thimble API
  if (THIMBLE_API_KEY) {
    // TODO: Implement real Thimble API call when partnership is established
    // For now, fall through to mock
  }

  // Mock mode
  const premium = Math.round((5 + Math.random() * 7) * 100) / 100; // $5-12 range
  return {
    covered: true,
    premium,
    policyId: `mock_${jobId}_${Date.now()}`,
    coverageAmount: 500000,
    mock: true,
  };
}

// -- Webhook Handler --

export interface ThimbleWebhookEvent {
  event: "policy.activated" | "policy.cancelled" | "policy.renewed" | "policy.expired";
  proId: string;
  policyId: string;
  provider: string;
  policyNumber: string;
  expirationDate: string;
  coverageAmount: number;
}

export async function handleThimbleWebhook(
  payload: ThimbleWebhookEvent
): Promise<{ processed: boolean }> {
  // Import here to avoid circular dependency
  const { updateInsurance, verifyInsurance } = await import("./insurance-service");

  switch (payload.event) {
    case "policy.activated":
    case "policy.renewed":
      await updateInsurance(payload.proId, {
        provider: payload.provider || "Thimble",
        policyNumber: payload.policyNumber,
        expirationDate: payload.expirationDate,
        coverageAmount: payload.coverageAmount || 500000,
      });
      // Auto-verify since it comes from the provider directly
      await verifyInsurance(payload.proId);
      return { processed: true };

    case "policy.cancelled":
    case "policy.expired":
      // Update insurance to reflect cancellation
      await updateInsurance(payload.proId, {
        provider: payload.provider || "Thimble",
        policyNumber: payload.policyNumber,
        expirationDate: new Date().toISOString(), // Set to now (expired)
        coverageAmount: 0,
      });
      return { processed: true };

    default:
      return { processed: false };
  }
}

// -- Webhook Route Handler (for use in routes) --

import type { Express, Request, Response } from "express";

export function registerThimbleWebhookRoute(app: Express) {
  app.post("/api/insurance/webhook/thimble", async (req: Request, res: Response) => {
    try {
      // TODO: Verify webhook signature when real partnership is established
      const payload = req.body as ThimbleWebhookEvent;

      if (!payload.event || !payload.proId) {
        return res.status(400).json({ error: "Invalid webhook payload" });
      }

      const result = await handleThimbleWebhook(payload);
      res.json(result);
    } catch (error: any) {
      console.error("Thimble webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });
}
