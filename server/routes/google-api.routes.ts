import type { Express } from "express";

/**
 * Google API Routes
 * Serves Google API keys securely
 */
export function registerGoogleApiRoutes(app: Express) {
  // Get Google Places API key
  app.get("/api/google/places-key", (req, res) => {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Google Places API key not configured"
      });
    }

    res.json({ apiKey });
  });
}
