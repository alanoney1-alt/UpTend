/**
 * Calendar Integration Routes
 * 
 * .ics file download, Google Calendar links, and upcoming appointments.
 */

import type { Express } from "express";
import { calendarService, type CalendarEvent } from "../services/calendar-service";
import { pool } from "../db";

async function getJobCalendarEvent(jobId: string): Promise<CalendarEvent | null> {
  try {
    const result = await pool.query(
      `SELECT sr.id, sr.service_type, sr.scheduled_for, sr.pickup_address,
              sr.pickup_city, sr.pickup_zip, sr.description,
              u.full_name as pro_name, u.phone as pro_phone
       FROM service_requests sr
       LEFT JOIN users u ON u.id = sr.assigned_hauler_id
       WHERE sr.id = $1`,
      [jobId]
    );

    if (!result.rows[0]) return null;
    const job = result.rows[0];

    // Parse scheduled_for into date and time
    let scheduledDate = job.scheduled_for || new Date().toISOString();
    let scheduledTime: string | undefined;
    if (scheduledDate.includes("T")) {
      const d = new Date(scheduledDate);
      scheduledDate = d.toISOString().split("T")[0];
      scheduledTime = d.toTimeString().slice(0, 5);
    }

    return {
      jobId: job.id,
      serviceType: job.service_type || "Home Service",
      scheduledDate,
      scheduledTime,
      proName: job.pro_name,
      proPhone: job.pro_phone,
      address: job.pickup_address,
      city: job.pickup_city,
      zip: job.pickup_zip,
      notes: job.description,
    };
  } catch (error: any) {
    console.error("[Calendar] Error fetching job:", error.message);
    return null;
  }
}

export function registerCalendarRoutes(app: Express): void {
  /**
   * GET /api/calendar/ics/:jobId
   * Download .ics file for a job
   */
  app.get("/api/calendar/ics/:jobId", async (req, res) => {
    try {
      const event = await getJobCalendarEvent(req.params.jobId);
      if (!event) {
        return res.status(404).json({ error: "Job not found" });
      }

      const icsContent = calendarService.generateICS(event);

      res.setHeader("Content-Type", "text/calendar; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="uptend-booking-${event.jobId}.ics"`);
      return res.send(icsContent);
    } catch (error: any) {
      console.error("[Calendar] ICS error:", error);
      return res.status(500).json({ error: "Failed to generate calendar file" });
    }
  });

  /**
   * GET /api/calendar/google-link/:jobId
   * Get Google Calendar add-event URL
   */
  app.get("/api/calendar/google-link/:jobId", async (req, res) => {
    try {
      const event = await getJobCalendarEvent(req.params.jobId);
      if (!event) {
        return res.status(404).json({ error: "Job not found" });
      }

      const url = calendarService.getGoogleCalendarUrl(event);
      return res.json({ googleCalendarUrl: url });
    } catch (error: any) {
      console.error("[Calendar] Google link error:", error);
      return res.status(500).json({ error: "Failed to generate Google Calendar link" });
    }
  });

  /**
   * GET /api/calendar/upcoming
   * Get upcoming service appointments for the authenticated user
   */
  app.get("/api/calendar/upcoming", async (req, res) => {
    try {
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = req.user as any;
      const userId = user?.userId || user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not found" });
      }

      let appointments: any[] = [];
      try {
        const result = await pool.query(
          `SELECT sr.id, sr.service_type, sr.scheduled_for, sr.status,
                  sr.pickup_address, sr.pickup_city, sr.pickup_zip,
                  COALESCE(u.name, u.username) as pro_name
           FROM service_requests sr
           LEFT JOIN users u ON u.id = sr.assigned_hauler_id
           WHERE (sr.customer_id = $1 OR sr.assigned_hauler_id = $1)
             AND sr.status NOT IN ('completed', 'cancelled')
           ORDER BY sr.scheduled_for ASC NULLS LAST
           LIMIT 20`,
          [userId]
        );
        appointments = result.rows.map((row: any) => ({
          jobId: row.id,
          serviceType: row.service_type,
          scheduledFor: row.scheduled_for,
          status: row.status,
          address: row.pickup_address,
          city: row.pickup_city,
          proName: row.pro_name,
          icsUrl: `/api/calendar/ics/${row.id}`,
          googleCalendarUrl: `/api/calendar/google-link/${row.id}`,
        }));
      } catch (queryErr: any) {
        console.error("[Calendar] Query failed, returning empty:", queryErr.message);
      }

      return res.json({ appointments });
    } catch (error: any) {
      console.error("[Calendar] Upcoming error:", error);
      return res.status(500).json({ error: "Failed to fetch upcoming appointments" });
    }
  });
}
