import type { Express } from "express";
import { pool } from "../../db";

export function registerActiveNearbyRoutes(app: Express) {
  // GET /api/pros/active-nearby?lat=X&lng=Y&radius=30
  // Public endpoint — returns active pros for the "Pros Near You" landing section
  app.get("/api/pros/active-nearby", async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          u.id, u.first_name, u.last_name,
          hp.rating, hp.jobs_completed, hp.service_types,
          hp.current_latitude, hp.current_longitude,
          hp.is_available
        FROM users u
        JOIN hauler_profiles hp ON u.id = hp.user_id
        WHERE hp.is_available = true
          AND hp.current_latitude IS NOT NULL
          AND hp.current_longitude IS NOT NULL
        ORDER BY hp.rating DESC NULLS LAST
        LIMIT 50
      `);

      const pros = result.rows.map(row => ({
        id: row.id,
        firstName: row.first_name || "Pro",
        lastName: row.last_name || "",
        rating: parseFloat(row.rating) || 4.8,
        jobsCompleted: row.jobs_completed || 0,
        serviceTypes: row.service_types || [],
        location: {
          latitude: parseFloat(row.current_latitude),
          longitude: parseFloat(row.current_longitude),
        },
        isAvailable: true,
      }));

      return res.json({
        pros,
        totalOnline: pros.length,
      });
    } catch (error) {
      console.error("Active nearby error:", error);
      // Return empty on error — frontend will show placeholders
      return res.json({ pros: [], totalOnline: 0 });
    }
  });
}
