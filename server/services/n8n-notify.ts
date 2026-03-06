/**
 * n8n Webhook Notification Service
 * 
 * Fires webhooks to n8n for automated workflows:
 * - Partner email alerts
 * - Customer follow-ups
 * - Lead notifications
 * 
 * All calls are fire-and-forget (non-blocking).
 * Failures are logged but never crash the main request.
 */

const N8N_BASE_URL = process.env.N8N_WEBHOOK_URL || 'https://n8n.uptendapp.com';

interface PhotoQuotePayload {
  partnerSlug: string;
  partnerEmail: string;
  customerFirstName: string;
  area: string;
  serviceType: string;
  urgency: string;
  customerNotes?: string;
  quoteId?: string;
  serviceRequestId?: string;
}

interface ServiceRequestPayload {
  partnerSlug: string;
  partnerEmail: string;
  customerName: string;
  serviceType: string;
  area: string;
  notes?: string;
  source: string;
  serviceRequestId?: string;
}

async function fireWebhook(path: string, data: Record<string, any>): Promise<void> {
  try {
    const url = `${N8N_BASE_URL}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!resp.ok) {
      console.error(`[n8n] Webhook ${path} returned ${resp.status}`);
    } else {
      console.log(`[n8n] Webhook ${path} fired successfully`);
    }
  } catch (err: any) {
    console.error(`[n8n] Webhook ${path} failed:`, err.message);
  }
}

/**
 * Notify n8n when a photo quote is submitted
 */
export function notifyPhotoQuote(payload: PhotoQuotePayload): void {
  fireWebhook('/webhook/photo-quote-alert', payload);
}

/**
 * Notify n8n when a new service request is created (any source)
 */
export function notifyNewServiceRequest(payload: ServiceRequestPayload): void {
  fireWebhook('/webhook/new-service-request', payload);
}

/**
 * Generic webhook fire for future workflows
 */
export function notifyN8n(webhookPath: string, data: Record<string, any>): void {
  fireWebhook(webhookPath, data);
}
