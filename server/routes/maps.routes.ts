import type { Express } from "express";
import {
  autocompleteAddress,
  geocodeAddress,
  getDrivingDistance,
  getPlaceDetails,
} from "../services/google-maps";

export function registerMapsRoutes(app: Express) {
  // Address autocomplete
  app.get("/api/maps/autocomplete", async (req, res) => {
    try {
      const input = req.query.input as string;
      if (!input || input.length < 3) return res.json([]);

      const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
      const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
      const location = lat && lng ? { lat, lng } : undefined;

      const suggestions = await autocompleteAddress(input, location);
      res.json(suggestions);
    } catch (error) {
      console.error("Autocomplete error:", error);
      res.status(500).json({ error: "Autocomplete failed" });
    }
  });

  // Geocode address
  app.get("/api/maps/geocode", async (req, res) => {
    try {
      const address = req.query.address as string;
      if (!address) return res.status(400).json({ error: "address required" });

      const result = await geocodeAddress(address);
      if (!result) return res.status(404).json({ error: "Could not geocode address" });

      res.json(result);
    } catch (error) {
      console.error("Geocode error:", error);
      res.status(500).json({ error: "Geocode failed" });
    }
  });

  // Driving directions
  app.get("/api/maps/directions", async (req, res) => {
    try {
      const origin = (req.query.origin as string)?.split(",").map(Number);
      const destination = (req.query.destination as string)?.split(",").map(Number);

      if (!origin || origin.length !== 2 || !destination || destination.length !== 2) {
        return res.status(400).json({ error: "origin and destination required as lat,lng" });
      }

      const result = await getDrivingDistance(
        { lat: origin[0], lng: origin[1] },
        { lat: destination[0], lng: destination[1] }
      );

      if (!result) return res.status(404).json({ error: "Could not get directions" });
      res.json(result);
    } catch (error) {
      console.error("Directions error:", error);
      res.status(500).json({ error: "Directions failed" });
    }
  });

  // Place details
  app.get("/api/maps/place/:placeId", async (req, res) => {
    try {
      const result = await getPlaceDetails(req.params.placeId);
      if (!result) return res.status(404).json({ error: "Place not found" });
      res.json(result);
    } catch (error) {
      console.error("Place details error:", error);
      res.status(500).json({ error: "Place details failed" });
    }
  });
}
