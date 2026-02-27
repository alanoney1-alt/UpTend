/**
 * George Calendar Integration
 *
 * Google Calendar OAuth + sync for scheduling awareness.
 * Works with or without a connected calendar.
 */

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const REDIRECT_URI = process.env.GOOGLE_CALENDAR_REDIRECT_URI ||
  (process.env.NODE_ENV === "production"
    ? "https://uptend.app/api/calendar/callback"
    : "http://localhost:5000/api/calendar/callback");

// Calendar scopes needed
const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

export interface TimeSlot {
  start: string; // ISO
  end: string;   // ISO
  label: string; // "Tuesday 2–5 PM"
}

export interface CalendarSuggestion {
  suggestedSlot: TimeSlot | null;
  reason: string;
  alternatives: TimeSlot[];
  weatherNote?: string;
  proAvailabilityNote: string;
}

// ─────────────────────────────────────────────
// OAuth Flow
// ─────────────────────────────────────────────

export function getCalendarAuthUrl(userId: string): string {
  if (!GOOGLE_CLIENT_ID) {
    return "";
  }

  const params = new URLSearchParams({
    client_id:     GOOGLE_CLIENT_ID,
    redirect_uri:  REDIRECT_URI,
    response_type: "code",
    scope:         SCOPES,
    access_type:   "offline",
    prompt:        "consent",
    state:         userId, // Pass userId through OAuth state
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function handleCalendarCallback(
  code: string,
  userId: string,
  storage?: any
): Promise<{ success: boolean; error?: string }> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return { success: false, error: "Google Calendar not configured" };
  }

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id:     GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri:  REDIRECT_URI,
        grant_type:    "authorization_code",
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[Calendar] Token exchange failed:", err);
      return { success: false, error: "Token exchange failed" };
    }

    const tokens: any = await res.json();

    // Store tokens - save to a calendar_tokens table or user profile
    if (storage) {
      await storage.upsertCalendarTokens?.({
        userId,
        accessToken:  tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        expiresAt:    new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
        scope:        tokens.scope || SCOPES,
      }).catch((e: any) => console.warn("[Calendar] Failed to save tokens:", e.message));
    }

    return { success: true };
  } catch (err: any) {
    console.error("[Calendar] OAuth callback error:", err.message);
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────
// Token Refresh
// ─────────────────────────────────────────────

async function getValidAccessToken(userId: string, storage?: any): Promise<string | null> {
  if (!storage) return null;

  try {
    const tokens = await storage.getCalendarTokens?.(userId).catch(() => null);
    if (!tokens) return null;

    // If not expired, return existing token
    if (tokens.expiresAt && new Date(tokens.expiresAt) > new Date(Date.now() + 60000)) {
      return tokens.accessToken;
    }

    // Refresh if we have a refresh token
    if (!tokens.refreshToken || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) return null;

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id:     GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: tokens.refreshToken,
        grant_type:    "refresh_token",
      }),
    });

    if (!res.ok) return null;

    const refreshed: any = await res.json();
    const newExpiry = new Date(Date.now() + (refreshed.expires_in || 3600) * 1000).toISOString();

    await storage.upsertCalendarTokens?.({
      userId,
      accessToken:  refreshed.access_token,
      refreshToken: tokens.refreshToken,
      expiresAt:    newExpiry,
      scope:        tokens.scope,
    }).catch(() => {});

    return refreshed.access_token;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// Sync Job to Customer's Calendar
// ─────────────────────────────────────────────

export async function syncJobToCalendar(
  userId: string,
  job: any,
  storage?: any
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  const accessToken = await getValidAccessToken(userId, storage);

  if (!accessToken) {
    return { success: false, error: "Calendar not connected" };
  }

  const serviceLabel = (job.serviceType || "Home Service")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

  const proName = job.proName || job.haulerName || "Your UpTend Pro";
  const scheduledFor = job.scheduledFor ? new Date(job.scheduledFor) : new Date();
  const endTime = new Date(scheduledFor.getTime() + 2 * 60 * 60 * 1000); // 2-hour default window

  const trackingUrl = `https://uptend.app/track/${job.id}`;

  const event = {
    summary: `UpTend: ${serviceLabel}`,
    description: [
      `Your UpTend pro ${proName} is scheduled for ${serviceLabel}.`,
      ``,
      `📍 Address: ${job.serviceAddress || job.address || "Your address on file"}`,
      `⏰ Arrival window: ${job.timeWindow || "Morning"}`,
      ``,
      `Track live: ${trackingUrl}`,
      ``,
      `Questions? Reply to this event or open the UpTend app.`,
    ].join("\n"),
    start: {
      dateTime: scheduledFor.toISOString(),
      timeZone: "America/New_York",
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: "America/New_York",
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 60 },
        { method: "popup", minutes: 1440 }, // Day before
      ],
    },
    colorId: "5", // Banana yellow - matches UpTend brand
  };

  try {
    const res = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("[Calendar] Event creation failed:", err);
      return { success: false, error: "Failed to create calendar event" };
    }

    const created: any = await res.json();
    return { success: true, eventId: created.id };
  } catch (err: any) {
    console.error("[Calendar] Sync error:", err.message);
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────
// Read Customer Calendar for Availability
// ─────────────────────────────────────────────

export async function getCustomerAvailability(
  userId: string,
  dateRange: { start: Date; end: Date },
  storage?: any
): Promise<TimeSlot[]> {
  const accessToken = await getValidAccessToken(userId, storage);

  if (!accessToken) {
    // Return default available slots without calendar data
    return generateDefaultSlots(dateRange);
  }

  try {
    const params = new URLSearchParams({
      timeMin: dateRange.start.toISOString(),
      timeMax: dateRange.end.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "50",
    });

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok) return generateDefaultSlots(dateRange);

    const data: any = await res.json();
    const busyBlocks = (data.items || [])
      .filter((e: any) => e.start?.dateTime) // Skip all-day events
      .map((e: any) => ({
        start: new Date(e.start.dateTime),
        end:   new Date(e.end.dateTime),
      }));

    return findFreeSlots(dateRange, busyBlocks);
  } catch {
    return generateDefaultSlots(dateRange);
  }
}

function generateDefaultSlots(dateRange: { start: Date; end: Date }): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const current = new Date(dateRange.start);
  const dayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  while (current <= dateRange.end && slots.length < 6) {
    const dow = current.getDay();
    // Skip Sundays, offer mornings and afternoons on weekdays/Saturday
    if (dow !== 0) {
      const morning = new Date(current);
      morning.setHours(9, 0, 0, 0);
      const morningEnd = new Date(current);
      morningEnd.setHours(12, 0, 0, 0);

      slots.push({
        start: morning.toISOString(),
        end:   morningEnd.toISOString(),
        label: `${dayLabels[dow]} morning (9 AM–12 PM)`,
      });

      if (dow !== 6) { // No afternoon on Saturday
        const afternoon = new Date(current);
        afternoon.setHours(13, 0, 0, 0);
        const afternoonEnd = new Date(current);
        afternoonEnd.setHours(17, 0, 0, 0);
        slots.push({
          start: afternoon.toISOString(),
          end:   afternoonEnd.toISOString(),
          label: `${dayLabels[dow]} afternoon (1–5 PM)`,
        });
      }
    }
    current.setDate(current.getDate() + 1);
  }

  return slots.slice(0, 4);
}

function findFreeSlots(
  dateRange: { start: Date; end: Date },
  busyBlocks: Array<{ start: Date; end: Date }>
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const current = new Date(dateRange.start);
  const dayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  while (current <= dateRange.end && slots.length < 4) {
    const dow = current.getDay();
    if (dow === 0) { current.setDate(current.getDate() + 1); continue; }

    for (const [startH, endH, label] of [
      [9, 12, "morning (9 AM–12 PM)"],
      [13, 17, "afternoon (1–5 PM)"],
    ] as Array<[number, number, string]>) {
      if (dow === 6 && startH === 13) continue;

      const slotStart = new Date(current);
      slotStart.setHours(startH, 0, 0, 0);
      const slotEnd = new Date(current);
      slotEnd.setHours(endH, 0, 0, 0);

      const isBlocked = busyBlocks.some(
        b => b.start < slotEnd && b.end > slotStart
      );

      if (!isBlocked) {
        slots.push({
          start: slotStart.toISOString(),
          end:   slotEnd.toISOString(),
          label: `${dayLabels[dow]} ${label}`,
        });
      }
    }
    current.setDate(current.getDate() + 1);
  }

  return slots.slice(0, 4);
}

// ─────────────────────────────────────────────
// Suggest Best Booking Time
// ─────────────────────────────────────────────

// Services that are best done in cooler parts of the day
const MORNING_PREFERRED_SERVICES = ["pressure_washing", "landscaping", "gutter_cleaning", "pool_cleaning"];
// Services where weather matters
const WEATHER_SENSITIVE_SERVICES = ["pressure_washing", "landscaping", "exterior_painting", "gutter_cleaning"];

export async function suggestBestTime(
  userId: string,
  serviceId: string,
  storage?: any
): Promise<CalendarSuggestion> {
  const start = new Date();
  start.setDate(start.getDate() + 1); // Start from tomorrow
  const end = new Date();
  end.setDate(end.getDate() + 14);   // Look 2 weeks out

  const freeSlots = await getCustomerAvailability(userId, { start, end }, storage);

  if (freeSlots.length === 0) {
    return {
      suggestedSlot: null,
      reason: "No availability found in your calendar",
      alternatives: [],
      proAvailabilityNote: "Our pros are generally available Mon–Sat with 24–48hr booking window",
    };
  }

  // Prefer morning for outdoor services
  const preferMorning = MORNING_PREFERRED_SERVICES.includes(serviceId);
  const weatherSensitive = WEATHER_SENSITIVE_SERVICES.includes(serviceId);

  let suggested = preferMorning
    ? freeSlots.find(s => s.label.includes("morning")) || freeSlots[0]
    : freeSlots[0];

  const reasons: string[] = [];
  if (preferMorning && suggested.label.includes("morning")) {
    reasons.push("morning is best for this service - cooler temperatures improve results");
  }
  if (weatherSensitive) {
    reasons.push("weather looks good for this time of year");
  }

  // Service-specific advice
  const serviceNotes: Record<string, string> = {
    pressure_washing: "Best done in the morning when surfaces are cooler - results last longer",
    landscaping:      "Morning appointments avoid afternoon heat and thunderstorm risk",
    gutter_cleaning:  "Great to do before rainy season or after heavy storms",
    pool_cleaning:    "Any time works - morning slots tend to fill up faster",
    home_cleaning:    "Either morning or afternoon works well",
    handyman:         "Afternoon slots often have less demand - easier to schedule",
  };

  const reason = reasons.length > 0
    ? reasons.join(", and ")
    : serviceNotes[serviceId] || "This time works well based on your calendar";

  return {
    suggestedSlot: suggested,
    reason: reason.charAt(0).toUpperCase() + reason.slice(1),
    alternatives: freeSlots.filter(s => s !== suggested).slice(0, 3),
    weatherNote: weatherSensitive
      ? "I'll check weather closer to the date and alert you if conditions look rough"
      : undefined,
    proAvailabilityNote: "Our pros are available Mon–Sat. I'll match you with someone rated 4.8+ in your area.",
  };
}
