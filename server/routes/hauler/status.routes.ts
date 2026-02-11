import type { Express } from "express";
import { storage } from "../../storage";
import { isAuthenticated } from "../../replit_integrations/auth";

export function registerHaulerStatusRoutes(app: Express) {
  // Go online with location tracking
  app.post("/api/haulers/go-online", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.localAuth ? req.user.userId : req.user.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const profile = await storage.getHaulerProfile(userId);
      if (!profile) {
        return res.status(404).json({ error: "PYCKER profile not found" });
      }

      const { latitude, longitude, accuracy, locationConsent } = req.body;

      if (!latitude || !longitude) {
        return res.status(400).json({ error: "Location coordinates are required" });
      }

      // Florida labor law: workers can decline location tracking
      if (!locationConsent) {
        return res.status(400).json({
          error: "Location consent required",
          message: "Per Florida labor law, you must opt-in to location tracking while online"
        });
      }

      // Set expiry to 48 hours from now (privacy requirement)
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      const now = new Date().toISOString();

      const status = await storage.updatePyckerLocation({
        pyckerId: profile.id,
        userId: userId,
        latitude,
        longitude,
        accuracy: accuracy || null,
        status: "available",
        lastUpdated: now,
        expiresAt,
        locationConsentGiven: true,
        consentGivenAt: now,
        updateIntervalSeconds: 30,
      });

      // Also update hauler profile availability
      await storage.updateHaulerProfile(profile.id, {
        isAvailable: true,
        currentLat: latitude,
        currentLng: longitude,
        lastCheckedIn: now,
      });

      res.json({
        success: true,
        status,
        message: "You are now online and available for jobs",
        updateIntervalSeconds: 30,
      });
    } catch (error) {
      console.error("Go online error:", error);
      res.status(500).json({ error: "Failed to go online" });
    }
  });

  // Update location (called every 30 seconds while online)
  app.post("/api/haulers/update-location", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.localAuth ? req.user.userId : req.user.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const profile = await storage.getHaulerProfile(userId);
      if (!profile) {
        return res.status(404).json({ error: "PYCKER profile not found" });
      }

      const { latitude, longitude, accuracy, status } = req.body;

      if (!latitude || !longitude) {
        return res.status(400).json({ error: "Location coordinates are required" });
      }

      const existingStatus = await storage.getPyckerOnlineStatus(profile.id);
      if (!existingStatus) {
        return res.status(400).json({ error: "You must go online first" });
      }

      // Set expiry to 48 hours from now (rolling expiry)
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      const now = new Date().toISOString();

      const updatedStatus = await storage.updatePyckerLocation({
        pyckerId: profile.id,
        userId: userId,
        latitude,
        longitude,
        accuracy: accuracy || null,
        status: status || existingStatus.status,
        currentJobId: existingStatus.currentJobId,
        lastUpdated: now,
        expiresAt,
        locationConsentGiven: existingStatus.locationConsentGiven,
        consentGivenAt: existingStatus.consentGivenAt,
        updateIntervalSeconds: 30,
      });

      // Also update hauler profile location
      await storage.updateHaulerProfile(profile.id, {
        currentLat: latitude,
        currentLng: longitude,
        lastCheckedIn: now,
      });

      res.json({ success: true, status: updatedStatus });
    } catch (error) {
      console.error("Update location error:", error);
      res.status(500).json({ error: "Failed to update location" });
    }
  });

  // Go offline - stops GPS tracking
  app.post("/api/haulers/go-offline", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.localAuth ? req.user.userId : req.user.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const profile = await storage.getHaulerProfile(userId);
      if (!profile) {
        return res.status(404).json({ error: "PYCKER profile not found" });
      }

      // Remove from online status table
      await storage.setPyckerOffline(profile.id);

      // Update hauler profile
      await storage.updateHaulerProfile(profile.id, { isAvailable: false });

      res.json({
        success: true,
        message: "You are now offline. Location tracking has stopped."
      });
    } catch (error) {
      console.error("Go offline error:", error);
      res.status(500).json({ error: "Failed to go offline" });
    }
  });

  // Accept NDA / Non-Solicitation Agreement
  app.post("/api/haulers/accept-nda", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.localAuth ? req.user.userId : req.user.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const profile = await storage.getHaulerProfile(userId);
      if (!profile) {
        return res.status(404).json({ error: "PYCKER profile not found" });
      }

      const { signature, version } = req.body;
      if (!signature || !version) {
        return res.status(400).json({ error: "Signature and version are required" });
      }

      // Get IP address for legal record
      const ipAddress = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
                       req.socket?.remoteAddress ||
                       'unknown';

      // Update profile with NDA acceptance
      await storage.updateHaulerProfile(profile.id, {
        ndaAcceptedAt: new Date().toISOString(),
        ndaVersion: version,
        ndaIpAddress: ipAddress,
        ndaSignature: signature,
      });

      res.json({
        success: true,
        message: "Non-Solicitation Agreement accepted successfully.",
        acceptedAt: new Date().toISOString(),
        version,
      });
    } catch (error) {
      console.error("Accept NDA error:", error);
      res.status(500).json({ error: "Failed to accept agreement" });
    }
  });

  // Get PYCKER's current online status
  app.get("/api/haulers/online-status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.localAuth ? req.user.userId : req.user.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const profile = await storage.getHaulerProfile(userId);
      if (!profile) {
        return res.status(404).json({ error: "PYCKER profile not found" });
      }

      const status = await storage.getPyckerOnlineStatus(profile.id);

      res.json({
        isOnline: !!status,
        status: status || null,
        profile: {
          id: profile.id,
          companyName: profile.companyName,
          isAvailable: profile.isAvailable,
        }
      });
    } catch (error) {
      console.error("Get online status error:", error);
      res.status(500).json({ error: "Failed to get online status" });
    }
  });

  // Get nearby available Pros (for booking page)
  app.get("/api/pyckers/nearby", async (req, res) => {
    try {
      const { lat, lng, radius = 25 } = req.query;

      if (!lat || !lng) {
        return res.status(400).json({ error: "Latitude and longitude are required" });
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      const radiusMiles = parseFloat(radius as string);

      if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusMiles)) {
        return res.status(400).json({ error: "Invalid coordinates or radius" });
      }

      // Get all available hauler profiles
      const allProfiles = await storage.getAllHaulerProfiles();
      const availableProfiles = allProfiles.filter(p => p.isAvailable && p.currentLat && p.currentLng);

      // Calculate distance for each and filter by radius
      const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
        const R = 3959; // Earth's radius in miles
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      const nearbyPros = availableProfiles
        .map(profile => {
          const distance = calculateDistance(latitude, longitude, profile.currentLat!, profile.currentLng!);
          return { profile, distance };
        })
        .filter(({ distance }) => distance <= radiusMiles)
        .sort((a, b) => a.distance - b.distance)
        .map(({ profile, distance }) => ({
          id: profile.id,
          companyName: profile.companyName,
          rating: profile.rating,
          reviewCount: profile.reviewCount,
          distance: Math.round(distance * 10) / 10, // Round to 1 decimal
          serviceTypes: profile.serviceTypes,
          verified: profile.verified,
        }));

      res.json({
        count: nearbyPros.length,
        pros: nearbyPros,
      });
    } catch (error) {
      console.error("Get nearby pros error:", error);
      res.status(500).json({ error: "Failed to get nearby pros" });
    }
  });
}
