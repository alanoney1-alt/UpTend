/**
 * Smart Home OAuth Routes
 *
 * GET    /api/smart-home/platforms          - list available platforms
 * GET    /api/smart-home/auth/:platform     - get OAuth URL
 * GET    /api/smart-home/callback/:platform - OAuth callback
 * GET    /api/smart-home/devices            - list connected devices
 * DELETE /api/smart-home/:platform          - disconnect
 * GET    /api/smart-home/alerts             - recent alerts
 */

import { Router, type Express } from "express";
import { pool } from "../db";
import {
  getAuthUrl,
  handleCallback,
  getConnectedDevices,
  disconnectPlatform,
  getSupportedPlatforms,
  type SmartHomePlatform,
} from "../services/smart-home-oauth";

const router = Router();

const VALID_PLATFORMS = ["nest", "ring", "august", "ecobee", "myq"] as const;

router.get("/platforms", async (req, res) => {
  try {
    const customerId = req.query.customerId as string;
    const platforms = getSupportedPlatforms();

    if (customerId) {
      const connections = await getConnectedDevices(customerId);
      const connMap = new Map(connections.map((c: any) => [c.platform, c.status]));
      const enriched = platforms.map(p => ({ ...p, status: connMap.get(p.id) || "not_connected" }));
      return res.json(enriched);
    }

    res.json(platforms.map(p => ({ ...p, status: "not_connected" })));
  } catch (err) {
    res.status(500).json({ error: "Failed to list platforms" });
  }
});

router.get("/auth/:platform", (req, res) => {
  try {
    const platform = req.params.platform as SmartHomePlatform;
    if (!VALID_PLATFORMS.includes(platform as any)) {
      return res.status(400).json({ error: "Unsupported platform" });
    }

    const customerId = req.query.customerId as string;
    if (!customerId) return res.status(400).json({ error: "customerId required" });

    const redirectUri = `${process.env.APP_URL || req.protocol + "://" + req.get("host")}/api/smart-home/callback/${platform}`;
    const url = getAuthUrl(platform, customerId, redirectUri);
    res.json({ authUrl: url });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate auth URL" });
  }
});

router.get("/callback/:platform", async (req, res) => {
  try {
    const platform = req.params.platform as SmartHomePlatform;
    const { code, state } = req.query as { code: string; state: string };

    if (!code || !state) return res.status(400).json({ error: "Missing code or state" });

    const [customerId] = state.split(":");
    const result = await handleCallback(platform, code, customerId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error("Smart home callback error:", err);
    res.status(500).json({ error: err.message || "OAuth callback failed" });
  }
});

router.get("/devices", async (req, res) => {
  try {
    const customerId = req.query.customerId as string;
    if (!customerId) return res.status(400).json({ error: "customerId required" });
    const devices = await getConnectedDevices(customerId);
    res.json(devices);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch devices" });
  }
});

router.delete("/:platform", async (req, res) => {
  try {
    const customerId = req.query.customerId as string || req.body?.customerId;
    if (!customerId) return res.status(400).json({ error: "customerId required" });
    const removed = await disconnectPlatform(customerId, req.params.platform as SmartHomePlatform);
    res.json({ success: removed });
  } catch (err) {
    res.status(500).json({ error: "Failed to disconnect" });
  }
});

router.get("/alerts", async (req, res) => {
  try {
    const customerId = req.query.customerId as string;
    if (!customerId) return res.status(400).json({ error: "customerId required" });

    const { rows } = await pool.query(
      `SELECT * FROM smart_home_alerts WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [customerId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

export function registerSmartHomeRoutes(app: Express) {
  app.use("/api/smart-home", router);
}
