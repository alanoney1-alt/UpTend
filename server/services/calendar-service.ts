/**
 * Calendar Service
 * 
 * Generates .ics files and Google Calendar URLs for service appointments.
 */

export interface CalendarEvent {
  jobId: string;
  serviceType: string;
  scheduledDate: string; // ISO date or "YYYY-MM-DD"
  scheduledTime?: string; // "HH:MM" or "HH:MM:SS"
  durationHours?: number;
  proName?: string;
  proPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  customerName?: string;
  notes?: string;
}

export class CalendarService {
  /**
   * Generate a .ics file string for a service appointment
   */
  generateICS(event: CalendarEvent): string {
    const { startDate, endDate } = this.parseDates(event);
    const location = this.buildLocation(event);
    const description = this.buildDescription(event);
    const summary = `UpTend: ${event.serviceType}`;
    const uid = `uptend-${event.jobId}@uptendapp.com`;

    const formatDT = (d: Date) =>
      d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

    const now = formatDT(new Date());

    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//UpTend//Calendar Service//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${formatDT(startDate)}`,
      `DTEND:${formatDT(endDate)}`,
      `SUMMARY:${this.escapeICS(summary)}`,
      `DESCRIPTION:${this.escapeICS(description)}`,
      location ? `LOCATION:${this.escapeICS(location)}` : "",
      "STATUS:CONFIRMED",
      "BEGIN:VALARM",
      "TRIGGER:-PT1H",
      "ACTION:DISPLAY",
      "DESCRIPTION:UpTend service appointment in 1 hour",
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .filter(Boolean)
      .join("\r\n");
  }

  /**
   * Generate a Google Calendar "add event" URL
   */
  getGoogleCalendarUrl(event: CalendarEvent): string {
    const { startDate, endDate } = this.parseDates(event);
    const location = this.buildLocation(event);
    const description = this.buildDescription(event);
    const summary = `UpTend: ${event.serviceType}`;

    const formatGCal = (d: Date) =>
      d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: summary,
      dates: `${formatGCal(startDate)}/${formatGCal(endDate)}`,
      details: description,
      location: location || "",
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  private parseDates(event: CalendarEvent): { startDate: Date; endDate: Date } {
    const dateStr = event.scheduledDate;
    const timeStr = event.scheduledTime || "09:00";
    const timePart = timeStr.length === 5 ? `${timeStr}:00` : timeStr;

    let startDate: Date;
    if (dateStr.includes("T")) {
      startDate = new Date(dateStr);
    } else {
      startDate = new Date(`${dateStr}T${timePart}`);
    }

    if (isNaN(startDate.getTime())) {
      startDate = new Date();
    }

    const durationMs = (event.durationHours || 2) * 60 * 60 * 1000;
    const endDate = new Date(startDate.getTime() + durationMs);

    return { startDate, endDate };
  }

  private buildLocation(event: CalendarEvent): string {
    return [event.address, event.city, event.state, event.zip]
      .filter(Boolean)
      .join(", ");
  }

  private buildDescription(event: CalendarEvent): string {
    const lines: string[] = [
      `${event.serviceType} service by UpTend`,
    ];
    if (event.proName) lines.push(`Pro: ${event.proName}`);
    if (event.proPhone) lines.push(`Pro Phone: ${event.proPhone}`);
    if (event.notes) lines.push(`Notes: ${event.notes}`);
    lines.push("");
    lines.push("Manage your booking: https://uptendapp.com/dashboard");
    lines.push("Questions? Chat with Mr. George in the app!");
    return lines.join("\n");
  }

  private escapeICS(text: string): string {
    return text
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");
  }
}

export const calendarService = new CalendarService();
