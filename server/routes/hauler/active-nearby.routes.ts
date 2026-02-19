import type { Express } from "express";
import { pool } from "../../db";

export function registerActiveNearbyRoutes(app: Express) {
  // GET /api/find-pro?service=lawn_mowing — find pros by service type
  app.get("/api/find-pro", async (req, res) => {
    try {
      const { service } = req.query;
      const result = await pool.query(`
        SELECT
          u.id, u.first_name, u.last_name,
          hp.rating, hp.jobs_completed, hp.service_types,
          hp.company_name, hp.is_available
        FROM users u
        JOIN hauler_profiles hp ON u.id = hp.user_id
        WHERE hp.is_available = true
        ORDER BY hp.rating DESC NULLS LAST
        LIMIT 20
      `);
      const pros = result.rows
        .filter((row: any) => {
          if (!service) return true;
          const services: string[] = row.service_types || [];
          return services.some((s) => s.toLowerCase().includes((service as string).toLowerCase()));
        })
        .map((row: any) => ({
          id: row.id,
          firstName: row.first_name || "Pro",
          lastName: row.last_name || "",
          companyName: row.company_name || "",
          rating: parseFloat(row.rating) || 4.8,
          jobsCompleted: row.jobs_completed || 0,
          serviceTypes: row.service_types || [],
          isAvailable: true,
        }));
      res.json({ pros, total: pros.length });
    } catch (error) {
      console.error("Find pro error:", error);
      res.json({ pros: [], total: 0 });
    }
  });

  // GET /api/pros/active-nearby?lat=X&lng=Y&radius=30
  // Public endpoint — returns active pros for the "Pros Near You" landing section
  app.get("/api/pros/active-nearby", async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          u.id, u.first_name, u.last_name,
          hp.rating, hp.jobs_completed, hp.service_types,
          hp.current_lat, hp.current_lng,
          hp.is_available
        FROM users u
        JOIN hauler_profiles hp ON u.id = hp.user_id
        WHERE hp.is_available = true
          AND hp.current_lat IS NOT NULL
          AND hp.current_lng IS NOT NULL
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
          latitude: parseFloat(row.current_lat),
          longitude: parseFloat(row.current_lng),
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
