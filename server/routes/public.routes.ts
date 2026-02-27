/**
 * Public API Routes
 * 
 * Endpoints that don't require authentication
 */

import type { Express } from "express";
import { storage } from "../storage";
import { pool } from "../db";

export function registerPublicRoutes(app: Express) {
  // GET /api/health - Simple health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

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
        AND NOT (
          LOWER(u.email) LIKE '%test%'
          AND (LOWER(hp.bio) LIKE '%qa%' OR LOWER(hp.bio) LIKE '%test%')
        )
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

      // No pros in DB yet - show empty state instead of fake data
      res.json([]);
    } catch (error) {
      console.error("Error browsing pros:", error);
      res.status(500).json({ error: "Failed to browse pros" });
    }
  });

  // GET /api/services - Get available services
  app.get("/api/services", async (_req, res) => {
    try {
      // TODO: Get services from storage or config
      const services = [
        {
          id: "junk-removal",
          name: "Junk Removal",
          description: "Professional junk removal and disposal services",
          basePrice: 150,
          category: "removal"
        },
        {
          id: "debris-removal",
          name: "Debris Removal", 
          description: "Construction and yard debris removal",
          basePrice: 200,
          category: "removal"
        },
        {
          id: "appliance-removal",
          name: "Appliance Removal",
          description: "Safe removal and disposal of old appliances",
          basePrice: 100,
          category: "removal"
        },
        {
          id: "furniture-removal",
          name: "Furniture Removal",
          description: "Furniture pickup and donation services",
          basePrice: 120,
          category: "removal"
        },
        {
          id: "move-out-cleanout",
          name: "Move-Out Cleanout",
          description: "Complete property cleanout services",
          basePrice: 300,
          category: "cleanout"
        }
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