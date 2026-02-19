/**
 * App Data Routes — endpoints needed by the React Native app screens.
 * All query real Supabase data.
 */
import type { Express } from "express";
import { pool } from "../db";

export function registerAppDataRoutes(app: Express) {
  // Home health score
  app.get("/api/home-scan/health", async (req: any, res) => {
    try {
      const userId = (req.user as any)?.userId || (req.user as any)?.id;
      if (!userId) return res.json({ score: 0, systems: [], recommendations: ["Complete an AI Home Scan to get your health score."] });

      const { rows } = await pool.query(
        `SELECT * FROM home_scans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [userId]
      );
      if (!rows.length) return res.json({ score: 0, systems: [], recommendations: ["Complete an AI Home Scan to get started."] });

      const scan = rows[0];
      res.json({
        score: scan.overall_score || scan.score || 0,
        systems: scan.systems || [],
        recommendations: scan.recommendations || [],
        lastScanDate: scan.created_at,
      });
    } catch (e) {
      res.json({ score: 0, systems: [], recommendations: [] });
    }
  });

  // Home streaks
  app.get("/api/home-scan/streaks", async (req: any, res) => {
    try {
      const userId = (req.user as any)?.userId || (req.user as any)?.id;
      if (!userId) return res.json({ currentStreak: 0, milestones: [], leaderboard: [] });

      const { rows } = await pool.query(
        `SELECT current_streak, longest_streak_weeks FROM hauler_profiles WHERE user_id = $1
         UNION ALL
         SELECT 0, 0 WHERE NOT EXISTS (SELECT 1 FROM hauler_profiles WHERE user_id = $1)`,
        [userId]
      );
      // For customers, check service history
      const { rows: jobs } = await pool.query(
        `SELECT COUNT(*) as total FROM service_requests WHERE customer_id = $1 AND status = 'completed'`,
        [userId]
      );
      const totalJobs = parseInt(jobs[0]?.total || '0');
      const streak = Math.min(totalJobs, 52); // Approximate weekly streak

      res.json({
        currentStreak: streak,
        milestones: [
          { name: "First Service", weeks: 1, achieved: totalJobs >= 1, reward: "🎉" },
          { name: "4 Week Streak", weeks: 4, achieved: streak >= 4, reward: "$10 Credit" },
          { name: "12 Week Streak", weeks: 12, achieved: streak >= 12, reward: "$25 Credit" },
          { name: "52 Week Streak", weeks: 52, achieved: streak >= 52, reward: "Free Service" },
        ],
        leaderboard: [],
      });
    } catch (e) {
      res.json({ currentStreak: 0, milestones: [], leaderboard: [] });
    }
  });

  // Active subscriptions
  app.get("/api/subscriptions/active", async (req: any, res) => {
    try {
      const userId = (req.user as any)?.userId || (req.user as any)?.id;
      if (!userId) return res.json({ subscriptions: [] });

      const { rows } = await pool.query(
        `SELECT * FROM subscription_bookings WHERE customer_id = $1 AND status = 'active' ORDER BY created_at DESC`,
        [userId]
      );
      res.json({ subscriptions: rows });
    } catch (e) {
      res.json({ subscriptions: [] });
    }
  });

  // Business customers (CRM)
  app.get("/api/business/customers", async (req: any, res) => {
    try {
      const userId = (req.user as any)?.userId || (req.user as any)?.id;
      if (!userId) return res.json({ customers: [] });

      // Get customers this pro has served
      const { rows } = await pool.query(`
        SELECT DISTINCT ON (u.id)
          u.id, u.first_name, u.last_name, u.email, u.phone,
          sr.pickup_address as address, sr.service_type as last_service,
          sr.scheduled_date as last_service_date,
          (SELECT COUNT(*) FROM service_requests sr2 WHERE sr2.customer_id = u.id AND sr2.hauler_id = $1) as total_jobs,
          (SELECT AVG(hr.rating) FROM hauler_reviews hr WHERE hr.customer_id = u.id) as rating
        FROM service_requests sr
        JOIN users u ON sr.customer_id = u.id
        WHERE sr.hauler_id = $1
        ORDER BY u.id, sr.scheduled_date DESC
        LIMIT 100
      `, [userId]);

      res.json({
        customers: rows.map(r => ({
          id: r.id,
          name: `${r.first_name || ''} ${r.last_name || ''}`.trim(),
          address: r.address || '',
          lastService: r.last_service || '',
          lastServiceDate: r.last_service_date || '',
          totalJobs: parseInt(r.total_jobs || '0'),
          rating: parseFloat(r.rating || '0'),
          notes: '',
          flagged: false,
        })),
      });
    } catch (e) {
      res.json({ customers: [] });
    }
  });

  // Available jobs for pros
  app.get("/api/hauler/available-jobs", async (req: any, res) => {
    try {
      const { rows } = await pool.query(`
        SELECT id, service_type, pickup_address, scheduled_date, scheduled_time,
               estimated_price, status, pickup_lat, pickup_lng
        FROM service_requests
        WHERE status = 'pending' AND hauler_id IS NULL
        ORDER BY created_at DESC
        LIMIT 50
      `);

      res.json({
        jobs: rows.map(r => ({
          id: r.id,
          service_type: r.service_type,
          address: r.pickup_address || '',
          scheduled_date: r.scheduled_date,
          estimated_price: r.estimated_price,
          urgency: r.scheduled_date === new Date().toISOString().split('T')[0] ? 'Today' : 'Upcoming',
          lat: r.pickup_lat,
          lng: r.pickup_lng,
        })),
      });
    } catch (e) {
      res.json({ jobs: [] });
    }
  });
}
