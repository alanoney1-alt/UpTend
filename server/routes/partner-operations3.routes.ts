/**
 * Partner Operations 3 Routes
 * QuickBooks, Google Calendar, and Timesheet Tracking
 */

import type { Express } from "express";
import * as quickbooks from "../services/quickbooks-integration";
import * as calendar from "../services/google-calendar-sync";
import * as timesheets from "../services/timesheet-tracking";

export function registerPartnerOperations3Routes(app: Express) {
  // ============================================================
  // QuickBooks Routes
  // ============================================================

  app.get("/api/partners/:slug/quickbooks/auth-url", async (req, res) => {
    try {
      const url = await quickbooks.getAuthUrl(req.params.slug);
      res.json({ url });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/partners/:slug/quickbooks/callback", async (req, res) => {
    try {
      const { code, realmId } = req.body;
      const connection = await quickbooks.handleCallback(req.params.slug, code, realmId);
      res.json(connection);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/partners/:slug/quickbooks/status", async (req, res) => {
    try {
      const status = await quickbooks.getConnectionStatus(req.params.slug);
      res.json({ connected: !!status, connection: status });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/partners/:slug/quickbooks/disconnect", async (req, res) => {
    try {
      const result = await quickbooks.disconnectQuickBooks(req.params.slug);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/partners/:slug/quickbooks/refresh-token", async (req, res) => {
    try {
      const result = await quickbooks.refreshToken(req.params.slug);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/partners/:slug/quickbooks/sync/invoices", async (req, res) => {
    try {
      const result = await quickbooks.syncInvoicesToQB(req.params.slug);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/partners/:slug/quickbooks/sync/payments", async (req, res) => {
    try {
      const result = await quickbooks.syncPaymentsFromQB(req.params.slug);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/partners/:slug/quickbooks/sync/customers", async (req, res) => {
    try {
      const result = await quickbooks.syncCustomers(req.params.slug);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/partners/:slug/quickbooks/sync/full", async (req, res) => {
    try {
      const result = await quickbooks.triggerFullSync(req.params.slug);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/partners/:slug/quickbooks/sync/history", async (req, res) => {
    try {
      const history = await quickbooks.getSyncHistory(req.params.slug);
      res.json(history);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ============================================================
  // Google Calendar Routes
  // ============================================================

  app.get("/api/partners/:slug/calendar/auth-url", async (req, res) => {
    try {
      const url = await calendar.getAuthUrl(req.params.slug);
      res.json({ url });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/partners/:slug/calendar/callback", async (req, res) => {
    try {
      const { code } = req.body;
      const connection = await calendar.handleCallback(req.params.slug, code);
      res.json(connection);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/partners/:slug/calendar/status", async (req, res) => {
    try {
      const status = await calendar.getConnectionStatus(req.params.slug);
      res.json({ connected: !!status, connection: status });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/partners/:slug/calendar/disconnect", async (req, res) => {
    try {
      const result = await calendar.disconnectCalendar(req.params.slug);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/partners/:slug/calendar/sync-job", async (req, res) => {
    try {
      const event = await calendar.syncJobToCalendar(req.params.slug, req.body);
      res.json(event);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/partners/:slug/calendar/jobs/:jobId", async (req, res) => {
    try {
      const result = await calendar.removeJobFromCalendar(req.params.slug, req.params.jobId);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/partners/:slug/calendar/events", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const events = await calendar.getCalendarEvents(req.params.slug, startDate as string, endDate as string);
      res.json(events);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ============================================================
  // Timesheet Routes
  // ============================================================

  app.post("/api/partners/:slug/timesheets/clock-in", async (req, res) => {
    try {
      const { techName, notes } = req.body;
      const result = await timesheets.clockIn(req.params.slug, techName, notes);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/partners/:slug/timesheets/clock-out", async (req, res) => {
    try {
      const { techName, notes } = req.body;
      const result = await timesheets.clockOut(req.params.slug, techName, notes);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/partners/:slug/timesheets/break/start", async (req, res) => {
    try {
      const { techName } = req.body;
      const result = await timesheets.startBreak(req.params.slug, techName);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/partners/:slug/timesheets/break/end", async (req, res) => {
    try {
      const { techName } = req.body;
      const result = await timesheets.endBreak(req.params.slug, techName);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/partners/:slug/timesheets/entries", async (req, res) => {
    try {
      const { techName, jobId, activity, startTime, endTime, notes } = req.body;
      const result = await timesheets.logTimeEntry(req.params.slug, techName, jobId, activity, startTime, endTime, notes);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/partners/:slug/timesheets/active", async (req, res) => {
    try {
      const result = await timesheets.getActiveTimesheets(req.params.slug);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/partners/:slug/timesheets/history", async (req, res) => {
    try {
      const { techName, startDate, endDate } = req.query;
      const dateRange = startDate && endDate ? { start: startDate as string, end: endDate as string } : undefined;
      const result = await timesheets.getTimesheetHistory(req.params.slug, techName as string, dateRange);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/partners/:slug/timesheets/weekly-hours", async (req, res) => {
    try {
      const { techName, weekOf } = req.query;
      const result = await timesheets.getWeeklyHours(req.params.slug, techName as string, weekOf as string);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/partners/:slug/timesheets/:timesheetId/approve", async (req, res) => {
    try {
      const result = await timesheets.approveTimesheet(parseInt(req.params.timesheetId));
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });
}
