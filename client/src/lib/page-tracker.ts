/**
 * Partner Page View Tracker
 *
 * Lightweight module for tracking real partner page analytics.
 * Replaces estimated metrics with actual tracked data.
 */

type PageType = 'partner_profile' | 'photo_quote' | 'seo_page' | 'confirm' | 'booking';

interface UTMParams {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
}

interface PageViewData {
  partnerSlug: string;
  pagePath: string;
  pageType: PageType;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  sessionId: string;
}

const SESSION_KEY = "uptend_tracking_session";

/**
 * Generate a tracking session ID
 */
function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get or create a session ID
 */
function getSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Extract UTM parameters from URL search params
 */
function extractUTMParams(): UTMParams {
  const urlParams = new URLSearchParams(window.location.search);

  return {
    source: urlParams.get('utm_source') || undefined,
    medium: urlParams.get('utm_medium') || undefined,
    campaign: urlParams.get('utm_campaign') || undefined,
    content: urlParams.get('utm_content') || undefined,
  };
}

/**
 * Auto-detect partner slug from URL path
 */
function extractPartnerSlug(): string | null {
  const path = window.location.pathname;

  // Match patterns like /partners/:slug or /p/:slug
  const partnerMatch = path.match(/^\/(?:partners|p)\/([^\/]+)/);
  if (partnerMatch) {
    return partnerMatch[1];
  }

  return null;
}

/**
 * Auto-detect page type from URL pattern
 */
function detectPageType(): PageType | null {
  const path = window.location.pathname;

  if (path.match(/^\/(?:partners|p)\/[^\/]+\/quote/)) return 'photo_quote';
  if (path.match(/^\/(?:partners|p)\/[^\/]+\/seo\//)) return 'seo_page';
  if (path.match(/^\/(?:partners|p)\/[^\/]+$/)) return 'partner_profile';
  if (path.match(/^\/confirm\//)) return 'confirm';
  if (path.match(/^\/book/)) return 'booking';

  return null;
}

/**
 * Send page view data to tracking endpoint
 */
async function sendPageView(data: PageViewData): Promise<void> {
  try {
    // Use fetch with sendBeacon as fallback for non-blocking fire-and-forget
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      navigator.sendBeacon('/api/track/pageview', blob);
    } else {
      // Fallback to fetch for older browsers
      fetch('/api/track/pageview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true
      }).catch(() => {
        // Silently ignore errors to prevent breaking the page
      });
    }
  } catch (error) {
    // Silently ignore errors to prevent breaking the page
    console.debug('Page tracking failed:', error);
  }
}

/**
 * Track a page view for a partner page
 */
export async function trackPageView(partnerSlug?: string, pageType?: PageType): Promise<void> {
  // Don't track pro dashboard pages (that's the partner viewing their own dashboard)
  if (window.location.pathname.includes('/pro/')) {
    return;
  }

  const slug = partnerSlug || extractPartnerSlug();
  const type = pageType || detectPageType();

  if (!slug || !type) {
    console.debug('Page tracking skipped: could not determine partner slug or page type');
    return;
  }

  const utm = extractUTMParams();
  const sessionId = getSessionId();

  const pageViewData: PageViewData = {
    partnerSlug: slug,
    pagePath: window.location.pathname,
    pageType: type,
    referrer: document.referrer || undefined,
    utmSource: utm.source,
    utmMedium: utm.medium,
    utmCampaign: utm.campaign,
    utmContent: utm.content,
    sessionId
  };

  await sendPageView(pageViewData);
}

/**
 * Get current UTM parameters (useful for form submissions)
 */
export function getCurrentUTMParams(): UTMParams {
  return extractUTMParams();
}

/**
 * Get current session ID (useful for form submissions)
 */
export function getCurrentSessionId(): string {
  return getSessionId();
}