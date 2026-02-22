/**
 * Public API Routes
 * 
 * Endpoints that don't require authentication
 */

import type { Express } from "express";
import { storage } from "../storage";
import { pool } from "../db";

export function registerPublicRoutes(app: Express) {
  // GET /api/pros/browse - Browse available pros (public)
  app.get("/api/pros/browse", async (req, res) => {
    try {
      const { service, sort = "rating", available = "anytime" } = req.query as Record<string, string>;

      // Query real pros from DB
      let orderClause = 'hp.rating DESC';
      if (sort === 'jobs') orderClause = 'hp.jobs_completed DESC';
      else if (sort === 'reviews') orderClause = 'hp.review_count DESC';

      let serviceFilter = '';
      const params: any[] = [];
      if (service) {
        params.push(service);
        serviceFilter = `AND $${params.length} = ANY(hp.service_types)`;
      }

      const { rows } = await pool.query(`
        SELECT 
          hp.id,
          u.first_name,
          SUBSTRING(u.last_name, 1, 1) as last_initial,
          hp.rating,
          hp.review_count,
          hp.jobs_completed,
          hp.service_types as services,
          hp.bio,
          hp.verified as is_verified,
          hp.insurance_coverage,
          hp.current_lat,
          hp.current_lng,
          hp.service_radius,
          u.created_at as member_since
        FROM hauler_profiles hp
        JOIN users u ON hp.user_id = u.id
        WHERE hp.can_accept_jobs = true
        ${serviceFilter}
        ORDER BY ${orderClause}
        LIMIT 50
      `, params);

      if (rows.length > 0) {
        const results = rows.map((row: any) => ({
          id: row.id,
          firstName: row.first_name || "Pro",
          lastInitial: row.last_initial || "",
          rating: parseFloat(row.rating) || 5.0,
          reviewCount: parseInt(row.review_count) || 0,
          jobsCompleted: parseInt(row.jobs_completed) || 0,
          services: row.services || [],
          certifications: [],
          bio: row.bio || "Verified UpTend Pro ready to help.",
          isVerified: row.is_verified || false,
          isInsured: !!row.insurance_coverage,
          memberSince: row.member_since ? new Date(row.member_since).toISOString().slice(0, 7) : "2025-01",
          approximateLocation: {
            lat: row.current_lat || 28.5383 + (Math.random() - 0.5) * 0.2,
            lng: row.current_lng || -81.3792 + (Math.random() - 0.5) * 0.2,
          },
        }));
        return res.json(results);
      }

      // No pros in DB yet — show empty state instead of fake data
      res.json([]);
    } catch (error) {
      console.error("Error browsing pros:", error);
      res.status(500).json({ error: "Failed to browse pros" });
    }
  });

  // GET /api/services - Get available services
  app.get("/api/services", async (_req, res) => {
    try {
      const services = [
        { id: "junk_removal", name: "Junk Removal", description: "Professional junk removal and hauling", startingPrice: 99, priceLabel: "from $99", category: "removal" },
        { id: "pressure_washing", name: "Pressure Washing", description: "Professional pressure washing for driveways, patios, and exteriors", startingPrice: 120, priceLabel: "from $120", category: "exterior" },
        { id: "gutter_cleaning", name: "Gutter Cleaning", description: "Thorough gutter cleaning and debris removal", startingPrice: 150, priceLabel: "from $150", category: "exterior" },
        { id: "handyman", name: "Handyman", description: "Skilled handyman for repairs, installations, and odd jobs", startingPrice: 75, priceLabel: "$75/hr", category: "repair" },
        { id: "moving_labor", name: "Moving Labor", description: "Professional moving help — loading, unloading, and rearranging", startingPrice: 65, priceLabel: "$65/hr", category: "labor" },
        { id: "light_demolition", name: "Light Demolition", description: "Interior demolition, tear-outs, and debris removal", startingPrice: 199, priceLabel: "from $199", category: "demolition" },
        { id: "home_cleaning", name: "Home Cleaning", description: "Professional home cleaning services", startingPrice: 99, priceLabel: "from $99", category: "cleaning" },
        { id: "pool_cleaning", name: "Pool Cleaning", description: "Recurring pool maintenance and cleaning", startingPrice: 120, priceLabel: "from $120/mo", category: "maintenance" },
        { id: "landscaping", name: "Landscaping", description: "Lawn care, trimming, and landscape maintenance", startingPrice: 49, priceLabel: "from $49", category: "exterior" },
        { id: "carpet_cleaning", name: "Carpet Cleaning", description: "Deep carpet cleaning — standard, deep clean, and pet treatment", startingPrice: 50, priceLabel: "from $50/room", category: "cleaning" },
        { id: "garage_cleanout", name: "Garage Cleanout", description: "Full garage cleanout and organization", startingPrice: 150, priceLabel: "from $150", category: "cleanout" },
        { id: "home_scan", name: "AI Home Scan", description: "AI-powered home health assessment with detailed report", startingPrice: 99, priceLabel: "from $99", category: "inspection" },
      ];

      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ error: "Failed to fetch services" });
    }
  });

  // GET /api/pricing - Get pricing information
  app.get("/api/pricing", async (_req, res) => {
    try {
      // TODO: Get dynamic pricing from storage
      const pricing = {
        baseRates: {
          "junk-removal": {
            minimum: 150,
            perCubicYard: 25,
            laborRate: 45
          },
          "debris-removal": {
            minimum: 200,
            perCubicYard: 30,
            laborRate: 50
          },
          "appliance-removal": {
            minimum: 100,
            perItem: 50,
            heavyAppliance: 75
          },
          "furniture-removal": {
            minimum: 120,
            perItem: 40,
            largeFurniture: 60
          }
        },
        surcharges: {
          stairs: 25,
          longCarry: 15,
          heavyItems: 20,
          sameDay: 50,
          weekendHoliday: 30
        },
        discounts: {
          recurring: 0.1,
          bulk: 0.15,
          nonprofit: 0.2,
          veteran: 0.1
        },
        zones: {
          zone1: { multiplier: 1.0, description: "Metro Orlando" },
          zone2: { multiplier: 1.2, description: "Greater Orlando" },
          zone3: { multiplier: 1.5, description: "Extended Service Area" }
        }
      };

      res.json(pricing);
    } catch (error) {
      console.error("Error fetching pricing:", error);
      res.status(500).json({ error: "Failed to fetch pricing" });
    }
  });

  // GET /api/public/services - Public services list
  app.get("/api/public/services", (_req, res) => {
    res.json([
      { id: "ai_home_scan", name: "AI Home Scan", startingAt: "$99", category: "featured" },
      { id: "handyman", name: "Handyman Services", startingAt: "$75/hr", category: "repairs" },
      { id: "junk_removal", name: "Junk Removal", startingAt: "$99", category: "removal" },
      { id: "pressure_washing", name: "Pressure Washing", startingAt: "$120", category: "exterior" },
      { id: "gutter_cleaning", name: "Gutter Cleaning", startingAt: "$150", category: "exterior" },
      { id: "home_cleaning", name: "Home Cleaning", startingAt: "$99", category: "cleaning" },
      { id: "landscaping", name: "Landscaping", startingAt: "$49", category: "exterior" },
      { id: "pool_cleaning", name: "Pool Cleaning", startingAt: "$120/mo", category: "cleaning" },
      { id: "moving_labor", name: "Moving Labor", startingAt: "$65/hr", category: "labor" },
      { id: "carpet_cleaning", name: "Carpet Cleaning", startingAt: "$50/room", category: "cleaning" },
      { id: "garage_cleanout", name: "Garage Cleanout", startingAt: "$150", category: "removal" },
      { id: "light_demolition", name: "Light Demolition", startingAt: "$199", category: "labor" },
    ]);
  });

  // GET /api/public/service-areas - Service areas
  app.get("/api/public/service-areas", (_req, res) => {
    res.json({
      primary: { name: "Orlando Metro", center: { lat: 28.5383, lng: -81.3792 }, radiusMiles: 30 },
      areas: [
        "Orlando", "Lake Nona", "Kissimmee", "Winter Park", "Altamonte Springs",
        "Sanford", "Oviedo", "Winter Garden", "Apopka", "Clermont",
        "Celebration", "Dr. Phillips", "Windermere", "Maitland", "Casselberry"
      ]
    });
  });

  // GET /api/ai/seasonal-advisories - Seasonal maintenance tips
  app.get("/api/ai/seasonal-advisories", (_req, res) => {
    const month = new Date().getMonth(); // 0-11
    const seasons: Record<string, any> = {
      winter: { months: [11, 0, 1], tips: [
        { title: "HVAC Filter Change", priority: "high", description: "Replace air filters for heating efficiency" },
        { title: "Pipe Insulation Check", priority: "medium", description: "Inspect exposed pipes before cold snaps" },
        { title: "Gutter Cleaning", priority: "high", description: "Clear leaves before winter rains" },
      ]},
      spring: { months: [2, 3, 4], tips: [
        { title: "AC Tune-Up", priority: "high", description: "Schedule before summer heat hits" },
        { title: "Pressure Wash Exterior", priority: "medium", description: "Remove pollen and winter grime" },
        { title: "Landscaping Refresh", priority: "medium", description: "Mulch, trim, and prep for growing season" },
      ]},
      summer: { months: [5, 6, 7], tips: [
        { title: "Pool Maintenance", priority: "high", description: "Weekly chemical balance and cleaning" },
        { title: "Hurricane Prep", priority: "high", description: "Trim trees, check shutters, stock supplies" },
        { title: "Pest Prevention", priority: "medium", description: "Seal entry points and schedule treatment" },
      ]},
      fall: { months: [8, 9, 10], tips: [
        { title: "Roof Inspection", priority: "high", description: "Check for damage before storm season ends" },
        { title: "Dryer Vent Cleaning", priority: "high", description: "Prevent fire hazards, improve efficiency" },
        { title: "Garage Cleanout", priority: "low", description: "Organize and donate before holidays" },
      ]},
    };
    const season = Object.entries(seasons).find(([_, s]) => s.months.includes(month));
    const current = season ? { season: season[0], ...season[1] } : { season: "spring", ...seasons.spring };
    res.json({ ...current, location: "Orlando, FL", generatedAt: new Date().toISOString() });
  });

  // POST /api/ai/smart-schedule - Smart scheduling suggestions
  app.post("/api/ai/smart-schedule", (req, res) => {
    res.status(503).json({
      status: "coming_soon",
      message: "Smart scheduling is coming soon. In the meantime, book directly and we'll match you with the best available pro.",
    });
  });

  // GET /api/pricing/estimate - Quick price estimate
  app.get("/api/pricing/estimate", (req, res) => {
    const { service } = req.query as Record<string, string>;
    const prices: Record<string, any> = {
      handyman: { startingAt: 75, unit: "hr", estimate: "$75-150" },
      junk_removal: { startingAt: 99, unit: "job", estimate: "$99-449" },
      pressure_washing: { startingAt: 120, unit: "job", estimate: "$120-350" },
      gutter_cleaning: { startingAt: 150, unit: "job", estimate: "$150-350" },
      home_cleaning: { startingAt: 99, unit: "visit", estimate: "$99-249" },
      landscaping: { startingAt: 49, unit: "visit", estimate: "$49-299" },
      pool_cleaning: { startingAt: 120, unit: "month", estimate: "$120-210/mo" },
      moving_labor: { startingAt: 65, unit: "hr/mover", estimate: "$65-130/hr" },
      carpet_cleaning: { startingAt: 50, unit: "room", estimate: "$50-89/room" },
      garage_cleanout: { startingAt: 150, unit: "job", estimate: "$150-499" },
      light_demolition: { startingAt: 199, unit: "job", estimate: "$199-999" },
      ai_home_scan: { startingAt: 99, unit: "scan", estimate: "$99-249" },
    };
    if (service && prices[service]) {
      return res.json({ service, ...prices[service] });
    }
    res.json({ services: prices });
  });

  // GET /api/marketplace - Public marketplace items
  app.get("/api/marketplace", async (_req, res) => {
    try {
      const { rows } = await pool.query(`
        SELECT id, title, description, price, condition, category, photos, created_at
        FROM marketplace_items 
        WHERE status = 'available' 
        ORDER BY created_at DESC 
        LIMIT 50
      `).catch(() => ({ rows: [] }));
      res.json(rows);
    } catch {
      res.json([]);
    }
  });

  // POST /api/launch-notify - Email signup for launch notifications
  app.post("/api/launch-notify", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email required" });
      await pool.query(
        `INSERT INTO launch_notifications (email, created_at) VALUES ($1, NOW()) ON CONFLICT (email) DO NOTHING`,
        [email]
      ).catch(() => {});
      res.json({ success: true, message: "You're on the list!" });
    } catch {
      res.json({ success: true, message: "You're on the list!" });
    }
  });

  // ─── Weather (public) ──────────────────────────────────────────
  app.get("/api/weather", async (_req, res) => {
    try {
      const weatherRes = await fetch("https://wttr.in/Orlando,FL?format=j1").then(r => r.json()).catch(() => null);
      if (!weatherRes?.current_condition?.[0]) {
        return res.json({ error: "Weather data unavailable", fallback: true, temp: 82, condition: "Partly Cloudy", humidity: 65, uvIndex: 7 });
      }
      const c = weatherRes.current_condition[0];
      const forecast = weatherRes.weather?.[0] || {};
      res.json({
        temp: parseInt(c.temp_F) || 82,
        feelsLike: parseInt(c.FeelsLikeF) || 84,
        condition: c.weatherDesc?.[0]?.value || "Clear",
        humidity: parseInt(c.humidity) || 65,
        uvIndex: parseInt(c.uvIndex) || 5,
        windMph: parseInt(c.windspeedMiles) || 8,
        precipChance: parseInt(forecast.hourly?.[0]?.chanceofrain) || 0,
        high: parseInt(forecast.maxtempF) || 88,
        low: parseInt(forecast.mintempF) || 72,
        sunrise: forecast.astronomy?.[0]?.sunrise || "6:45 AM",
        sunset: forecast.astronomy?.[0]?.sunset || "7:30 PM",
        location: "Orlando, FL",
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Weather API error:", error);
      res.json({ error: "Weather unavailable", temp: 82, condition: "Partly Cloudy", humidity: 65, uvIndex: 7, fallback: true });
    }
  });
}