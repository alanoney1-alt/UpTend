/**
 * Health Check Endpoint
 * Returns 200 + uptime + version for monitoring
 */
import type { Express } from "express";
import { pool } from "../db";

const startTime = Date.now();

export function registerHealthRoutes(app: Express) {
  app.get("/api/health", async (_req, res) => {
    const uptimeMs = Date.now() - startTime;
    const uptimeSeconds = Math.floor(uptimeMs / 1000);

    let dbHealthy = false;
    try {
      await pool.query("SELECT 1");
      dbHealthy = true;
    } catch {
      // DB unreachable
    }

    const status = dbHealthy ? "healthy" : "degraded";
    const httpStatus = dbHealthy ? 200 : 503;

    res.status(httpStatus).json({
      status,
      uptime: uptimeSeconds,
      uptimeHuman: `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m`,
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      database: dbHealthy ? "connected" : "unreachable",
      timestamp: new Date().toISOString(),
    });
  });
}
