/**
 * Push Notification Routes — Expo push token registration
 */
import type { Express, Request, Response } from 'express';
import { pool } from '../db.js';

export function registerPushRoutes(app: Express) {
  // Ensure column exists on startup
  pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS expo_push_token TEXT`).catch(() => {});

  // Register Expo push token
  app.post('/api/push/register', async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.userId || (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: 'Not authenticated' });

      const { token } = req.body;
      if (!token) return res.status(400).json({ error: 'Token required' });

      await pool.query(`UPDATE users SET expo_push_token = $1 WHERE id = $2`, [token, userId]);
      res.json({ success: true });
    } catch (error: any) {
      console.error('[Push Register]', error.message);
      res.status(500).json({ error: 'Failed to register token' });
    }
  });
}
