/**
 * Public API Routes
 * 
 * Endpoints that don't require authentication
 */

import type { Express } from "express";
import { storage } from "../storage";

export function registerPublicRoutes(app: Express) {
  // GET /api/pros/browse - Browse available pros (public)
  app.get("/api/pros/browse", async (req, res) => {
    try {
      const { service, sort = "rating", available = "anytime" } = req.query as Record<string, string>;

      // Mock pro data — replace with real DB queries when pros exist
      const mockPros = [
        { id: "pro-001", firstName: "Marcus", lastInitial: "R", rating: 4.9, reviewCount: 47, jobsCompleted: 156, services: ["handyman", "pressure_washing", "light_demolition"], certifications: ["b2b_pm", "osha_10"], bio: "10 years of experience in home repairs and renovations across Orlando.", isVerified: true, isInsured: true, memberSince: "2025-06", approximateLocation: { lat: 28.54, lng: -81.38 } },
        { id: "pro-002", firstName: "David", lastInitial: "L", rating: 4.8, reviewCount: 89, jobsCompleted: 234, services: ["junk_removal", "garage_cleanout", "moving_labor"], certifications: ["sustainability"], bio: "Eco-friendly junk removal specialist. 90%+ diversion rate.", isVerified: true, isInsured: true, memberSince: "2025-03", approximateLocation: { lat: 28.60, lng: -81.20 } },
        { id: "pro-003", firstName: "Carlos", lastInitial: "M", rating: 5.0, reviewCount: 62, jobsCompleted: 203, services: ["landscaping", "pressure_washing", "gutter_cleaning"], certifications: ["senior_pro", "sustainability"], bio: "Master landscaper with 15 years in Central Florida.", isVerified: true, isInsured: true, memberSince: "2025-01", approximateLocation: { lat: 28.48, lng: -81.46 } },
        { id: "pro-004", firstName: "James", lastInitial: "W", rating: 4.7, reviewCount: 31, jobsCompleted: 78, services: ["home_cleaning", "carpet_cleaning"], certifications: [], bio: "Detail-oriented cleaning professional. Eco-friendly products only.", isVerified: true, isInsured: true, memberSince: "2025-09", approximateLocation: { lat: 28.69, lng: -81.31 } },
        { id: "pro-005", firstName: "Miguel", lastInitial: "S", rating: 4.9, reviewCount: 55, jobsCompleted: 145, services: ["pool_cleaning", "pressure_washing", "landscaping"], certifications: ["lead_safe"], bio: "Pool and exterior specialist. Certified pool operator.", isVerified: true, isInsured: true, memberSince: "2025-04", approximateLocation: { lat: 28.34, lng: -81.42 } },
        { id: "pro-006", firstName: "Anthony", lastInitial: "J", rating: 4.6, reviewCount: 18, jobsCompleted: 42, services: ["junk_removal", "light_demolition", "moving_labor"], certifications: [], bio: "Former Marine. Strong, fast, and always on time.", isVerified: true, isInsured: true, memberSince: "2025-11", approximateLocation: { lat: 28.55, lng: -81.53 } },
        { id: "pro-007", firstName: "Robert", lastInitial: "K", rating: 4.8, reviewCount: 73, jobsCompleted: 189, services: ["handyman", "gutter_cleaning", "home_consultation"], certifications: ["b2b_pm", "senior_pro"], bio: "Licensed contractor turned UpTend Pro.", isVerified: true, isInsured: true, memberSince: "2025-02", approximateLocation: { lat: 28.41, lng: -81.30 } },
        { id: "pro-008", firstName: "Daniel", lastInitial: "P", rating: 4.7, reviewCount: 44, jobsCompleted: 112, services: ["pressure_washing", "gutter_cleaning", "home_cleaning"], certifications: ["sustainability"], bio: "Exterior cleaning expert. Soft wash specialist.", isVerified: true, isInsured: true, memberSince: "2025-07", approximateLocation: { lat: 28.61, lng: -81.44 } },
        { id: "pro-009", firstName: "Jason", lastInitial: "L", rating: 5.0, reviewCount: 91, jobsCompleted: 267, services: ["junk_removal", "garage_cleanout", "light_demolition", "moving_labor"], certifications: ["senior_pro", "osha_10"], bio: "Top-rated Pro with 250+ jobs. Safety-first approach.", isVerified: true, isInsured: true, memberSince: "2025-01", approximateLocation: { lat: 28.39, lng: -81.18 } },
        { id: "pro-010", firstName: "Kevin", lastInitial: "B", rating: 4.8, reviewCount: 36, jobsCompleted: 94, services: ["pool_cleaning", "landscaping", "home_cleaning"], certifications: [], bio: "Full-service home exterior maintenance.", isVerified: true, isInsured: true, memberSince: "2025-08", approximateLocation: { lat: 28.51, lng: -81.15 } },
      ];

      let results = mockPros;

      // Filter by service
      if (service) {
        results = results.filter((p) => p.services.includes(service));
      }

      // Sort
      switch (sort) {
        case "rating":
          results.sort((a, b) => b.rating - a.rating);
          break;
        case "jobs":
          results.sort((a, b) => b.jobsCompleted - a.jobsCompleted);
          break;
        case "reviews":
          results.sort((a, b) => b.reviewCount - a.reviewCount);
          break;
      }

      res.json(results);
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
}