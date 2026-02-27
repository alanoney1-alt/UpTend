import type { Express } from "express";
import { pool } from "../../db";
import { requireAuth } from "../../middleware/auth";

export function registerAdminProMapRoutes(app: Express) {
  // GET /api/admin/pro-map - All pros with locations (admin only)
  app.get("/api/admin/pro-map", requireAuth, async (req: any, res) => {
    try {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const result = await pool.query(`
        SELECT 
          u.id, u.first_name, u.last_name, u.phone,
          hp.rating, hp.jobs_completed, hp.service_types,
          hp.current_lat, hp.current_lng,
          hp.is_available, hp.company_name,
          (SELECT COUNT(*) FROM service_requests sr 
           WHERE sr.assigned_hauler_id = u.id 
           AND sr.status IN ('in_progress', 'en_route')) as active_jobs
        FROM users u
        JOIN hauler_profiles hp ON u.id = hp.user_id
        WHERE hp.current_lat IS NOT NULL
        ORDER BY hp.is_available DESC, hp.rating DESC NULLS LAST
      `);

      const pros = result.rows.map(row => ({
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        phone: row.phone,
        companyName: row.company_name,
        rating: parseFloat(row.rating) || 0,
        jobsCompleted: row.jobs_completed || 0,
        serviceTypes: row.service_types || [],
        location: {
          latitude: parseFloat(row.current_lat),
          longitude: parseFloat(row.current_lng),
        },
        isAvailable: row.is_available,
        activeJobs: parseInt(row.active_jobs) || 0,
        status: row.active_jobs > 0 ? "on_job" : row.is_available ? "online" : "offline",
      }));

      return res.json({ pros });
    } catch (error) {
      console.error("Admin pro map error:", error);
      return res.status(500).json({ error: "Failed to fetch pro locations" });
    }
  });
}
