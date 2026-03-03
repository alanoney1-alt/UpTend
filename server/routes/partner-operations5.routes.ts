/**
 * Partner Operations Routes - Batch 5
 * Route Optimization + Call Tracking
 */

import { Router, Request, Response, type Express } from "express";
import * as routeOpt from "../services/route-optimization";
import * as callTracking from "../services/call-tracking";

export function registerPartnerOperations5Routes(app: Express) {
const router = Router();

// Route Optimization
router.post("/:slug/routes/optimize", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { techName, date, jobs } = req.body;
    const result = await routeOpt.optimizeRoute(slug, techName, date, jobs);
    res.json({ success: true, route: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:slug/routes/plan", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { techName, date } = req.query;
    const result = await routeOpt.getRoutePlan(slug, techName as string, date as string);
    res.json({ success: true, plan: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:slug/routes/daily", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { date } = req.query;
    const result = await routeOpt.getDailyRoutes(slug, date as string);
    res.json({ success: true, routes: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:slug/routes/savings", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { startDate, endDate } = req.query;
    const result = await routeOpt.getRouteSavingsReport(slug, startDate as string, endDate as string);
    res.json({ success: true, report: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Call Tracking
router.post("/:slug/calls/tracking-numbers", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { phoneNumber, source, campaign } = req.body;
    const result = await callTracking.addTrackingNumber(slug, phoneNumber, source, campaign);
    res.json({ success: true, trackingNumber: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:slug/calls/tracking-numbers", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const result = await callTracking.listTrackingNumbers(slug);
    res.json({ success: true, trackingNumbers: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/:slug/calls/log", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { trackingNumberId, callerPhone, callerName, durationSeconds, recordingUrl } = req.body;
    const result = await callTracking.logCall(slug, trackingNumberId, callerPhone, callerName, durationSeconds, recordingUrl);
    res.json({ success: true, call: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/:slug/calls/:callId/convert", async (req: Request, res: Response) => {
  try {
    const { callId } = req.params;
    const { notes } = req.body;
    const result = await callTracking.markCallConverted(parseInt(callId), notes);
    res.json({ success: true, call: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:slug/calls/report", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { startDate, endDate } = req.query;
    const result = await callTracking.getCallReport(slug, startDate as string, endDate as string);
    res.json({ success: true, report: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:slug/calls/roi", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const result = await callTracking.getMarketingROI(slug);
    res.json({ success: true, roi: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

  app.use("/api/partners", router);
}
