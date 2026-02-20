/**
 * george-cron.routes.ts
 *
 * HTTP endpoints for Mr. George's scheduled background jobs.
 * Protected by CRON_API_KEY env var — set this on Railway or your cron provider.
 *
 * Routes:
 *   GET /api/cron/maintenance-reminders  → checkMaintenanceReminders()
 *   GET /api/cron/seasonal-campaign      → sendSeasonalCampaign()
 */

import type { Express, Request, Response } from 'express';
import {
  checkMaintenanceReminders,
  sendSeasonalCampaign,
  sendPostServiceFollowUp,
  sendWeatherHeadsUp,
  sendMaintenanceNudge,
  sendHomeScanPromo,
  scanGovernmentContracts,
} from '../services/george-events';

function requireCronKey(req: Request, res: Response): boolean {
  const cronKey = process.env.CRON_API_KEY;
  if (!cronKey) {
    // If no key is configured, only allow in non-production
    if (process.env.NODE_ENV === 'production') {
      res.status(503).json({ error: 'CRON_API_KEY not configured' });
      return false;
    }
    return true;
  }

  const provided = req.headers['x-cron-key'] || req.query.key;
  if (provided !== cronKey) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

export function registerGeorgeCronRoutes(app: Express): void {
  // Daily at 9 AM EST: check maintenance reminders
  app.get('/api/cron/maintenance-reminders', async (req, res) => {
    if (!requireCronKey(req, res)) return;

    console.log('[George Cron] Running maintenance reminders...');
    try {
      const result = await checkMaintenanceReminders();
      res.json({ success: true, ...result });
    } catch (err: any) {
      console.error('[George Cron] Maintenance reminders error:', err.message);
      res.status(500).json({ error: 'Failed to run maintenance reminders' });
    }
  });

  // Every 12 hours: post-service follow-up (48hr check-ins)
  app.get('/api/george-cron/post-service-followup', async (req, res) => {
    if (!requireCronKey(req, res)) return;

    console.log('[George Cron] Running post-service follow-up...');
    try {
      const result = await sendPostServiceFollowUp();
      res.json({ success: true, ...result });
    } catch (err: any) {
      console.error('[George Cron] Post-service follow-up error:', err.message);
      res.status(500).json({ error: 'Failed to run post-service follow-up' });
    }
  });

  // Every 2 hours: check weather alerts and notify customers
  app.get('/api/george-cron/weather-alerts', async (req, res) => {
    if (!requireCronKey(req, res)) return;

    console.log('[George Cron] Running weather alerts check...');
    try {
      const result = await sendWeatherHeadsUp();
      res.json({ success: true, ...result });
    } catch (err: any) {
      console.error('[George Cron] Weather alerts error:', err.message);
      res.status(500).json({ error: 'Failed to run weather alerts' });
    }
  });

  // Daily at 10 AM EST: maintenance nudge
  app.get('/api/george-cron/maintenance-nudge', async (req, res) => {
    if (!requireCronKey(req, res)) return;

    console.log('[George Cron] Running maintenance nudge...');
    try {
      const result = await sendMaintenanceNudge();
      res.json({ success: true, ...result });
    } catch (err: any) {
      console.error('[George Cron] Maintenance nudge error:', err.message);
      res.status(500).json({ error: 'Failed to run maintenance nudge' });
    }
  });

  // Twice weekly: home scan promo for inactive users
  app.get('/api/george-cron/home-scan-promo', async (req, res) => {
    if (!requireCronKey(req, res)) return;

    console.log('[George Cron] Running home scan promo...');
    try {
      const result = await sendHomeScanPromo();
      res.json({ success: true, ...result });
    } catch (err: any) {
      console.error('[George Cron] Home scan promo error:', err.message);
      res.status(500).json({ error: 'Failed to run home scan promo' });
    }
  });

  // Daily 7 AM: government contract scan (emails admin only)
  app.get('/api/george-cron/gov-contracts', async (req, res) => {
    if (!requireCronKey(req, res)) return;

    console.log('[George Cron] Running government contract scan...');
    try {
      const result = await scanGovernmentContracts();
      res.json({ success: true, ...result });
    } catch (err: any) {
      console.error('[George Cron] Gov contract scan error:', err.message);
      res.status(500).json({ error: 'Failed to run gov contract scan' });
    }
  });

  // 1st of each month: seasonal campaign
  app.get('/api/cron/seasonal-campaign', async (req, res) => {
    if (!requireCronKey(req, res)) return;

    console.log('[George Cron] Running seasonal campaign...');
    try {
      const result = await sendSeasonalCampaign();
      res.json({ success: true, ...result });
    } catch (err: any) {
      console.error('[George Cron] Seasonal campaign error:', err.message);
      res.status(500).json({ error: 'Failed to run seasonal campaign' });
    }
  });
}
