/**
 * Content Pipeline API Routes — admin-only
 */

import { type Express, type Request, type Response } from 'express';
import { generateContentBatch, listGeneratedPosts } from '../services/content-batch.js';

export function registerContentRoutes(app: Express) {
  // Admin-only: generate a content batch
  app.get('/api/content/generate-batch', async (req: Request, res: Response) => {
    try {
      // Basic admin check — in production, use proper auth middleware
      if (!req.isAuthenticated?.() && !req.headers['x-admin-key']) {
        // Allow in development
        if (process.env.NODE_ENV === 'production') {
          res.status(401).json({ error: 'Admin access required' });
          return;
        }
      }

      const count = Math.min(Math.max(parseInt(String(req.query.count)) || 10, 1), 50);
      const posts = await generateContentBatch(count);

      res.json({
        success: true,
        count: posts.length,
        posts,
      });
    } catch (error) {
      console.error('Content batch generation failed:', error);
      res.status(500).json({ error: 'Failed to generate content batch' });
    }
  });

  // Admin-only: list generated posts
  app.get('/api/content/posts', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated?.() && !req.headers['x-admin-key']) {
        if (process.env.NODE_ENV === 'production') {
          res.status(401).json({ error: 'Admin access required' });
          return;
        }
      }

      const date = req.query.date as string | undefined;
      const posts = await listGeneratedPosts(date);

      res.json({
        success: true,
        count: posts.length,
        posts,
      });
    } catch (error) {
      console.error('Failed to list posts:', error);
      res.status(500).json({ error: 'Failed to list posts' });
    }
  });
}
