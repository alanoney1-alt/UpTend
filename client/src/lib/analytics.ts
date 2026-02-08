import { apiRequest } from "./queryClient";

export type AnalyticsEventType = 
  | "app_install"
  | "app_open"
  | "job_posted"
  | "job_booked"
  | "job_completed"
  | "promo_applied"
  | "payment_completed";

interface TrackEventParams {
  eventType: AnalyticsEventType;
  userId?: string;
  sessionId?: string;
  eventData?: Record<string, unknown>;
  referralSource?: string;
}

const SESSION_KEY = "honkiq_session_id";
const INSTALL_KEY = "honkiq_installed";

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua)) return "mobile";
  return "desktop";
}

function getPlatform(): string {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  return "web";
}

export async function trackEvent(params: TrackEventParams): Promise<void> {
  try {
    const sessionId = getSessionId();
    
    await apiRequest("POST", "/api/analytics/track", {
      eventType: params.eventType,
      userId: params.userId,
      sessionId,
      eventData: params.eventData ? JSON.stringify(params.eventData) : null,
      deviceType: getDeviceType(),
      platform: getPlatform(),
      appVersion: "1.0.0",
      referralSource: params.referralSource || document.referrer || null,
    });
  } catch (error) {
    console.error("Failed to track event:", error);
  }
}

export async function trackInstall(userId?: string): Promise<void> {
  const hasInstalled = localStorage.getItem(INSTALL_KEY);
  if (hasInstalled) {
    await trackEvent({ eventType: "app_open", userId });
    return;
  }
  
  localStorage.setItem(INSTALL_KEY, new Date().toISOString());
  await trackEvent({ eventType: "app_install", userId });
}

export async function trackJobPosted(userId: string, jobData: Record<string, unknown>): Promise<void> {
  await trackEvent({
    eventType: "job_posted",
    userId,
    eventData: jobData,
  });
}

export async function trackJobBooked(userId: string, jobData: Record<string, unknown>): Promise<void> {
  await trackEvent({
    eventType: "job_booked",
    userId,
    eventData: jobData,
  });
}

export async function trackPromoApplied(userId: string, promoCode: string, discount: number): Promise<void> {
  await trackEvent({
    eventType: "promo_applied",
    userId,
    eventData: { promoCode, discount },
  });
}

export async function trackPaymentCompleted(userId: string, amount: number, jobId: string): Promise<void> {
  await trackEvent({
    eventType: "payment_completed",
    userId,
    eventData: { amount, jobId },
  });
}
