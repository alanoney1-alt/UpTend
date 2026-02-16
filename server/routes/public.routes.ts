/**
 * Public API Routes
 * 
 * Endpoints that don't require authentication
 */

import type { Express } from "express";
import { storage } from "../storage";

export function registerPublicRoutes(app: Express) {
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