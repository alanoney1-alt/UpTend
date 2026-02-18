/**
 * george-cron.routes.ts
 *
 * HTTP endpoints for George's scheduled background jobs.
 * Protected by CRON_API_KEY env var — set this on Railway or your cron provider.
 *
 * Routes:
 *   GET /api/cron/maintenance-reminders  → checkMaintenanceReminders()
 *   GET /api/cron/seasonal-campaign      → sendSeasonalCampaign()
 */

import type { Express, Request, Response } from 'express';
import { checkMaintenanceReminders, sendSeasonalCampaign } from '../services/george-events';

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
