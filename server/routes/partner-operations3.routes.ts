/**
 * Partner Operations 3 API Routes
 *
 * QuickBooks integration, Google Calendar sync, Timesheet tracking.
 */

import { Router, type Express } from "express";
import {
  getAuthUrl as qbGetAuthUrl,
  handleCallback as qbHandleCallback,
  refreshToken as qbRefreshToken,
  getConnectionStatus as qbGetConnectionStatus,
  disconnectQuickBooks,
  syncInvoicesToQB,
  syncPaymentsFromQB,
  syncCustomers,
  getSyncHistory,
  triggerFullSync,
} from "../services/quickbooks-integration";
import {
  getAuthUrl as calGetAuthUrl,
  handleCallback as calHandleCallback,
  getConnectionStatus as calGetConnectionStatus,
  disconnectCalendar,
  syncJobToCalendar,
  removeJobFromCalendar,
  getCalendarEvents,
} from "../services/google-calendar-sync";
import {
  clockIn,
  clockOut,
  startBreak,
  endBreak,
  logTimeEntry,
  getActiveTimesheets,
  getTimesheetHistory,
  getWeeklyHours,
  getLabourCostReport,
  approveTimesheet,
} from "../services/timesheet-tracking";

export function registerPartnerOperations3Routes(app: Express) {
  const router = Router();

  // ============================================================
  // QuickBooks Integration
  // ============================================================

  router.get("/:slug/quickbooks/auth-url", async (req, res) => {
    try {
      const url = await qbGetAuthUrl(req.params.slug);
      res.json({ url });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  router.post("/:slug/quickbooks/callback", async (req, res) => {
    try {
      const { authCode, realmId } = req.body;
      const connection = await qbHandleCallback(req.params.slug, authCode, realmId);
      res.json(connection);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  router.post("/:slug/quickbooks/refresh-token", async (req, res) => {
    try {
      const result = await qbRefreshToken(req.params.slug);
      res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  router.get("/:slug/quickbooks/status", async (req, res) => {
    try {
      const status = await qbGetConnectionStatus(req.params.slug);
      res.json({ connected: !!status, connection: status });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  router.post("/:slug/quickbooks/disconnect", async (req, res) => {
    try {
      const result = await disconnectQuickBooks(req.params.slug);
      res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  router.post("/:slug/quickbooks/sync/invoices", async (req, res) => {
    try {
      const result = await syncInvoicesToQB(req.params.slug);
      res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  router.post("/:slug/quickbooks/sync/payments", async (req, res) => {
    try {
      const result = await syncPaymentsFromQB(req.params.slug);
      res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  router.post("/:slug/quickbooks/sync/customers", async (req, res) => {
    try {
      const result = await syncCustomers(req.params.slug);
      res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  router.get("/:slug/quickbooks/sync/history", async (req, res) => {
    try {
      const logs = await getSyncHistory(req.params.slug);
      res.json(logs);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  router.post("/:slug/quickbooks/sync/full", async (req, res) => {
    try {
      const result = await triggerFullSync(req.params.slug);
      res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ============================================================
  // Google Calendar Sync
  // ============================================================

  router.get("/:slug/calendar/auth-url", async (req, res) => {
    try {
      const url = await calGetAuthUrl(req.params.slug);
      res.json({ url });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  router.post("/:slug/calendar/callback", async (req, res) => {
    try {
      const { authCode } = req.body;
      const connection = await calHandleCallback(req.params.slug, authCode);
      res.json(connection);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  router.get("/:slug/calendar/status", async (req, res) => {
    try {
      const status = await calGetConnectionStatus(req.params.slug);
      res.json({ connected: !!status, connection: status });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  router.post("/:slug/calendar/disconnect", async (req, res) => {
    try {
      const result = await disconnectCalendar(req.params.slug);
      res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  router.post("/:slug/calendar/sync-job", async (req, res) => {
    try {
      const event = await syncJobToCalendar(req.params.slug, req.body);
      res.json(event);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  router.delete("/:slug/calendar/jobs/:jobId", async (req, res) => {
    try {
      const result = await removeJobFromCalendar(req.params.slug, req.params.jobId);
      res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  router.get("/:slug/calendar/events", async (req, res) => {
    try {
      const { start, end } = req.query;
      const dateRange = start && end ? { start: start as string, end: end as string } : undefined;
      const events = await getCalendarEvents(req.params.slug, dateRange);
      res.json(events);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ============================================================
  // Timesheet Tracking
  // ============================================================

  router.post("/:slug/timesheets/clock-in", async (req, res) => {
    try {
      const { techName, notes } = req.body;
      const ts = await clockIn(req.params.slug, techName, notes);
      res.json(ts);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  router.post("/:slug/timesheets/clock-out", async (req, res) => {
    try {
      const { techName, notes } = req.body;
      const ts = await clockOut(req.params.slug, techName, notes);
      res.json(ts);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  router.post("/:slug/timesheets/break/start", async (req, res) => {
    try {
      const { techName } = req.body;
      const entry = await startBreak(req.params.slug, techName);
      res.json(entry);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  router.post("/:slug/timesheets/break/end", async (req, res) => {
    try {
      const { techName } = req.body;
      const entry = await endBreak(req.params.slug, techName);
      res.json(entry);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  router.post("/:slug/timesheets/log-entry", async (req, res) => {
    try {
      const { techName, jobId, activity, startTime, endTime, notes } = req.body;
      const entry = await logTimeEntry(req.params.slug, techName, jobId, activity, startTime, endTime, notes);
      res.json(entry);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  router.get("/:slug/timesheets/active", async (req, res) => {
    try {
      const sheets = await getActiveTimesheets(req.params.slug);
      res.json(sheets);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  router.get("/:slug/timesheets/history", async (req, res) => {
    try {
      const { techName, start, end } = req.query;
      const dateRange = start && end ? { start: start as string, end: end as string } : undefined;
      const sheets = await getTimesheetHistory(req.params.slug, techName as string | undefined, dateRange);
      res.json(sheets);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  router.get("/:slug/timesheets/weekly-hours", async (req, res) => {
    try {
      const { techName, weekOf } = req.query;
      const hours = await getWeeklyHours(req.params.slug, techName as string | undefined, weekOf as string | undefined);
      res.json(hours);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  router.get("/:slug/timesheets/labour-cost", async (req, res) => {
    try {
      const { start, end } = req.query;
      const dateRange = start && end ? { start: start as string, end: end as string } : undefined;
      const report = await getLabourCostReport(req.params.slug, dateRange);
      res.json(report);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  router.post("/:slug/timesheets/:timesheetId/approve", async (req, res) => {
    try {
      const ts = await approveTimesheet(parseInt(req.params.timesheetId));
      res.json(ts);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  app.use("/api/partners", router);
}
