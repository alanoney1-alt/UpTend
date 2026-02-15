import type { Express } from "express";
import { storage } from "../../storage";
import { haulerCheckInSchema, haulerProfileUpdateSchema } from "@shared/schema";
import { requireAuth, requireHauler } from "../../auth-middleware";
import { db, pool } from "../../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Contact masking helper - masks customer/Pro contact info until payment is received
interface MaskableRequest {
  paymentStatus: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  assignedHauler?: {
    phone?: string | null;
    email?: string | null;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
}

function maskContactInfoForRole<T extends MaskableRequest>(
  request: T,
  role: 'customer' | 'hauler' | 'admin'
): T {
  const paymentReceived = request.paymentStatus && ["authorized", "captured", "completed"].includes(request.paymentStatus);

  if (paymentReceived || role === 'admin') {
    return request; // Admin always sees everything, others see after payment
  }

  const result = { ...request };

  // Customers can't see Pro contact info until payment
  if (role === 'customer' && result.assignedHauler) {
    result.assignedHauler = {
      ...result.assignedHauler,
      phone: null,
      email: null,
    };
  }

  // Pros can't see customer contact info until payment
  if (role === 'hauler') {
    result.customerPhone = null;
    result.customerEmail = null;
  }

  return result;
}

const proRegistrationSchema = z.object({
  // Account credentials
  password: z.string().min(8, "Password must be at least 8 characters"),
  emailVerified: z.boolean().optional(), // Flag indicating email was verified
  // Personal info
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  companyName: z.string().min(2),
  streetAddress: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  zipCode: z.string().min(5),
  vehicleType: z.string().min(1),
  vehicleYear: z.string().optional(),
  vehicleMake: z.string().optional(),
  vehicleModel: z.string().optional(),
  licensePlate: z.string().optional(),
  driversLicense: z.string().min(5),
  insuranceProvider: z.string().min(2),
  insurancePolicyNumber: z.string().min(5),
  aboutYou: z.string().optional(),
  agreeTerms: z.boolean(),
  agreeBackgroundCheck: z.boolean(),
  // Photo uploads
  profilePhotoUrl: z.string().url().optional(),
  driversLicensePhotoUrl: z.string().url().optional(),
});

export function registerProProfileRoutes(app: Express) {
  // Get current authenticated Pro with profile (used by Pro dashboard)
  app.get("/api/pros", requireAuth, requireHauler, async (req: any, res) => {
    try {
      const user = req.user;
      const profile = await storage.getHaulerProfile(user.id);
      if (!profile) {
        return res.json([]);
      }
      const proWithProfile = {
        ...user,
        profile,
        haulerInfo: profile,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
      };
      res.json([proWithProfile]);
    } catch (error) {
      console.error("Error fetching current Pro:", error);
      res.status(500).json({ error: "Failed to fetch Pro data" });
    }
  });

  // Get available pros with vehicles (for booking flow pro selection)
  app.get("/api/pros/available/with-vehicles", async (req, res) => {
    try {
      const allProfiles = await db.select().from(users).where(eq(users.role, "hauler"));
      const prosWithProfiles = [];
      for (const user of allProfiles.slice(0, 20)) {
        const profile = await storage.getHaulerProfile(user.id);
        if (profile) {
          prosWithProfiles.push({
            ...user,
            profile,
            haulerInfo: profile,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
          });
        }
      }
      res.json(prosWithProfiles);
    } catch (error) {
      console.error("Error fetching available pros:", error);
      res.status(500).json({ error: "Failed to fetch available pros" });
    }
  });

  // Get Pro profile by userId
  app.get("/api/pros/:userId/profile", async (req, res) => {
    try {
      const profile = await storage.getHaulerProfile(req.params.userId);
      if (!profile) {
        return res.status(404).json({ error: "Pro profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching Pro profile:", error);

      const dbError = error as any;
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }

      res.status(500).json({ error: "Failed to fetch Pro profile" });
    }
  });

  // Legacy hauler endpoint (backward compatibility)
  app.get("/api/haulers/:userId/profile", async (req, res) => {
    try {
      const profile = await storage.getHaulerProfile(req.params.userId);
      if (!profile) {
        return res.status(404).json({ error: "Pro profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching Pro profile:", error);

      const dbError = error as any;
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }

      res.status(500).json({ error: "Failed to fetch Pro profile" });
    }
  });

  // Update Pro profile
  app.patch("/api/pro/profile", requireAuth, requireHauler, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const profile = await storage.getHaulerProfile(userId);
      if (!profile) return res.status(404).json({ error: "Pro profile not found" });

      const allowedFields: Record<string, any> = {};
      if (req.body.languagesSpoken && Array.isArray(req.body.languagesSpoken)) {
        const validLangs = ["en", "es", "pt", "fr", "ht", "vi", "zh"];
        allowedFields.languagesSpoken = req.body.languagesSpoken.filter((l: string) => validLangs.includes(l));
        if (!allowedFields.languagesSpoken.includes("en")) {
          allowedFields.languagesSpoken.unshift("en");
        }
      }
      if (req.body.profilePhotoUrl !== undefined) allowedFields.profilePhotoUrl = req.body.profilePhotoUrl;
      if (req.body.bio !== undefined) allowedFields.bio = req.body.bio;
      if (req.body.funFact !== undefined) allowedFields.funFact = req.body.funFact;

      const updated = await storage.updateHaulerProfile(profile.id, allowedFields);
      res.json(updated);
    } catch (error) {
      console.error("Error updating Pro profile:", error);

      const dbError = error as any;
      if (dbError.code === '23505') {
        return res.status(409).json({ error: "Duplicate entry" });
      }
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }

      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Legacy hauler endpoint (backward compatibility)
  app.patch("/api/hauler/profile", requireAuth, requireHauler, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const profile = await storage.getHaulerProfile(userId);
      if (!profile) return res.status(404).json({ error: "Pro profile not found" });

      const allowedFields: Record<string, any> = {};
      if (req.body.languagesSpoken && Array.isArray(req.body.languagesSpoken)) {
        const validLangs = ["en", "es", "pt", "fr", "ht", "vi", "zh"];
        allowedFields.languagesSpoken = req.body.languagesSpoken.filter((l: string) => validLangs.includes(l));
        if (!allowedFields.languagesSpoken.includes("en")) {
          allowedFields.languagesSpoken.unshift("en");
        }
      }
      if (req.body.profilePhotoUrl !== undefined) allowedFields.profilePhotoUrl = req.body.profilePhotoUrl;
      if (req.body.bio !== undefined) allowedFields.bio = req.body.bio;
      if (req.body.funFact !== undefined) allowedFields.funFact = req.body.funFact;

      const updated = await storage.updateHaulerProfile(profile.id, allowedFields);
      res.json(updated);
    } catch (error) {
      console.error("Error updating Pro profile:", error);

      const dbError = error as any;
      if (dbError.code === '23505') {
        return res.status(409).json({ error: "Duplicate entry" });
      }
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }

      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Update user profile image
  app.patch("/api/user/profile-image", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const { imageUrl, type } = req.body;
      if (!imageUrl) return res.status(400).json({ error: "imageUrl is required" });

      if (type === "vehicle") {
        const profile = await storage.getHaulerProfile(userId);
        if (profile) {
          await storage.updateHaulerProfile(profile.id, { profilePhotoUrl: imageUrl });
        }
      } else {
        await db.update(users).set({ profileImageUrl: imageUrl }).where(eq(users.id, userId));
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating profile image:", error);

      const dbError = error as any;
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }

      res.status(500).json({ error: "Failed to update profile image" });
    }
  });

  // Update Pro availability
  app.patch("/api/pros/:profileId/availability", requireAuth, requireHauler, async (req, res) => {
    try {
      const { isAvailable } = req.body;
      const profile = await storage.updateHaulerProfile(req.params.profileId, { isAvailable });
      if (!profile) {
        return res.status(404).json({ error: "Pro profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error updating availability:", error);

      const dbError = error as any;
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }

      res.status(500).json({ error: "Failed to update availability" });
    }
  });

  // Legacy hauler endpoint (backward compatibility)
  app.patch("/api/haulers/:profileId/availability", requireAuth, requireHauler, async (req, res) => {
    try {
      const { isAvailable } = req.body;
      const profile = await storage.updateHaulerProfile(req.params.profileId, { isAvailable });
      if (!profile) {
        return res.status(404).json({ error: "Pro profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error updating availability:", error);

      const dbError = error as any;
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }

      res.status(500).json({ error: "Failed to update availability" });
    }
  });

  // Pro check-in with location
  app.post("/api/pros/:profileId/check-in", requireAuth, requireHauler, async (req, res) => {
    try {
      const parsed = haulerCheckInSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
      }
      const { lat, lng } = parsed.data;
      const profile = await storage.checkInHauler(req.params.profileId, lat, lng);
      if (!profile) {
        return res.status(404).json({ error: "Pro profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error checking in:", error);

      const dbError = error as any;
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }

      res.status(500).json({ error: "Failed to check in" });
    }
  });

  // Legacy hauler check-in endpoint (backward compatibility)
  app.post("/api/haulers/:profileId/check-in", requireAuth, requireHauler, async (req, res) => {
    try {
      const parsed = haulerCheckInSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
      }
      const { lat, lng } = parsed.data;
      const profile = await storage.checkInHauler(req.params.profileId, lat, lng);
      if (!profile) {
        return res.status(404).json({ error: "Pro profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error checking in:", error);

      const dbError = error as any;
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }

      res.status(500).json({ error: "Failed to check in" });
    }
  });

  // Hauler check-out
  app.post("/api/haulers/:profileId/check-out", requireAuth, requireHauler, async (req, res) => {
    try {
      const profile = await storage.checkOutHauler(req.params.profileId);
      if (!profile) {
        return res.status(404).json({ error: "Pro profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to check out" });
    }
  });

  // Check username availability
  app.post("/api/haulers/check-username", async (req, res) => {
    try {
      const { username } = req.body;
      if (!username || username.length < 3) {
        return res.status(400).json({ error: "Username must be at least 3 characters" });
      }
      const existingUser = await storage.getUserByUsername(username);
      res.json({ available: !existingUser });
    } catch (error) {
      res.status(500).json({ error: "Failed to check username" });
    }
  });

  // Get vehicles for hauler profile
  app.get("/api/haulers/:profileId/vehicles", async (req, res) => {
    try {
      const vehicles = await storage.getPyckerVehicles(req.params.profileId);
      res.json(vehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({ error: "Failed to fetch vehicles" });
    }
  });

  // Create vehicle for hauler profile
  app.post("/api/haulers/:profileId/vehicles", requireAuth, requireHauler, async (req, res) => {
    try {
      const { vehicleType, vehicleName, year, make, model, licensePlate, capacity, isEnclosed, hasTrailer, trailerSize, bedLength, description } = req.body;

      if (!vehicleType || !vehicleName) {
        return res.status(400).json({ error: "Vehicle type and name are required" });
      }

      const vehicle = await storage.createPyckerVehicle({
        haulerProfileId: req.params.profileId,
        vehicleType,
        vehicleName,
        year,
        make,
        model,
        licensePlate,
        capacity: capacity || "medium",
        isEnclosed: isEnclosed || false,
        hasTrailer: hasTrailer || false,
        trailerSize,
        bedLength,
        description,
        createdAt: new Date().toISOString(),
      });

      res.json(vehicle);
    } catch (error) {
      console.error("Error creating vehicle:", error);

      const dbError = error as any;
      if (dbError.code === '23505') {
        return res.status(409).json({ error: "Vehicle with this license plate already exists" });
      }
      if (dbError.code === '23503') {
        return res.status(400).json({ error: "Invalid hauler profile reference" });
      }
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }

      res.status(500).json({ error: "Failed to create vehicle" });
    }
  });

  // Update vehicle
  app.patch("/api/vehicles/:vehicleId", requireAuth, requireHauler, async (req, res) => {
    try {
      const vehicle = await storage.updatePyckerVehicle(req.params.vehicleId, req.body);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error) {
      console.error("Error updating vehicle:", error);
      res.status(500).json({ error: "Failed to update vehicle" });
    }
  });

  // Delete vehicle
  app.delete("/api/vehicles/:vehicleId", requireAuth, requireHauler, async (req, res) => {
    try {
      await storage.deletePyckerVehicle(req.params.vehicleId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      res.status(500).json({ error: "Failed to delete vehicle" });
    }
  });

  // Go Online endpoint - set active vehicle and travel radius
  app.post("/api/haulers/:profileId/go-online", requireAuth, requireHauler, async (req, res) => {
    try {
      const { vehicleId, travelRadius } = req.body;

      if (!vehicleId) {
        return res.status(400).json({ error: "You must select a vehicle to go online" });
      }

      if (!travelRadius || travelRadius < 5 || travelRadius > 100) {
        return res.status(400).json({ error: "Travel radius must be between 5 and 100 miles" });
      }

      // Verify the vehicle belongs to this profile
      const vehicle = await storage.getPyckerVehicle(vehicleId);
      if (!vehicle || vehicle.haulerProfileId !== req.params.profileId) {
        return res.status(400).json({ error: "Invalid vehicle selected" });
      }

      const profile = await storage.updateHaulerProfile(req.params.profileId, {
        isAvailable: true,
        activeVehicleId: vehicleId,
        activeTravelRadius: travelRadius,
        lastCheckedIn: new Date().toISOString(),
      });

      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      res.json({
        success: true,
        message: "You are now online",
        profile,
        activeVehicle: vehicle,
      });
    } catch (error) {
      console.error("Error going online:", error);
      res.status(500).json({ error: "Failed to go online" });
    }
  });

  // Go Offline endpoint
  app.post("/api/haulers/:profileId/go-offline", requireAuth, requireHauler, async (req, res) => {
    try {
      const profile = await storage.updateHaulerProfile(req.params.profileId, {
        isAvailable: false,
        activeVehicleId: null,
      });

      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      res.json({
        success: true,
        message: "You are now offline",
        profile,
      });
    } catch (error) {
      console.error("Error going offline:", error);
      res.status(500).json({ error: "Failed to go offline" });
    }
  });

  // Update hauler profile with schema validation
  app.patch("/api/haulers/:profileId/profile", requireAuth, requireHauler, async (req, res) => {
    try {
      const parsed = haulerProfileUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
      }
      const profile = await storage.updateHaulerProfile(req.params.profileId, parsed.data);
      if (!profile) {
        return res.status(404).json({ error: "Pro profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error updating profile:", error);

      const dbError = error as any;
      if (dbError.code === '23505') {
        return res.status(409).json({ error: "Duplicate entry" });
      }
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }

      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Pro earnings (computed from completed jobs)
  app.get("/api/pro/earnings", requireAuth, requireHauler, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const profile = await storage.getHaulerProfile(userId);
      if (!profile) return res.json({ total: 0, weekly: 0, monthly: 0, today: 0, pending: 0, jobsThisWeek: 0, history: [] });

      const completedJobs = await storage.getCompletedJobsForHauler(userId);

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const startOfWeek = startOfDay - now.getDay() * 86400000;
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

      const payoutPct = profile.payoutPercentage || 0.75;

      let total = 0, weekly = 0, monthly = 0, today = 0, pending = 0, jobsThisWeek = 0;
      const history: any[] = [];

      for (const job of (completedJobs || [])) {
        const price = job.livePrice || job.priceEstimate || 0;
        const earnings = Math.round(price * payoutPct);
        const completedAt = job.completedAt ? new Date(job.completedAt).getTime() : 0;

        if (job.status === "completed") {
          total += earnings;
          if (completedAt >= startOfMonth) monthly += earnings;
          if (completedAt >= startOfWeek) { weekly += earnings; jobsThisWeek++; }
          if (completedAt >= startOfDay) today += earnings;
        } else {
          pending += earnings;
        }

        history.push({
          id: job.id,
          serviceType: job.serviceType || "junk_removal",
          address: job.pickupAddress || "",
          date: job.completedAt || job.createdAt || now.toISOString(),
          amount: earnings,
          status: job.status === "completed" ? "paid" : "pending",
        });
      }

      history.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

      res.json({ total, weekly, monthly, today, pending, jobsThisWeek, history: history.slice(0, 20) });
    } catch (error) {
      console.error("Error fetching earnings:", error);
      res.json({ total: 0, weekly: 0, monthly: 0, today: 0, pending: 0, jobsThisWeek: 0, history: [] });
    }
  });

  // Get vehicles for pro profile (alias)
  app.get("/api/pros/:profileId/vehicles", async (req, res) => {
    try {
      const vehicles = await storage.getPyckerVehicles(req.params.profileId);
      res.json(vehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({ error: "Failed to fetch vehicles" });
    }
  });

  // Go Online endpoint (pro alias)
  app.post("/api/pros/:profileId/go-online", requireAuth, requireHauler, async (req, res) => {
    try {
      const { vehicleId, travelRadius } = req.body;

      if (!vehicleId) {
        return res.status(400).json({ error: "You must select a vehicle to go online" });
      }

      if (!travelRadius || travelRadius < 5 || travelRadius > 100) {
        return res.status(400).json({ error: "Travel radius must be between 5 and 100 miles" });
      }

      const vehicle = await storage.getPyckerVehicle(vehicleId);
      if (!vehicle || vehicle.haulerProfileId !== req.params.profileId) {
        return res.status(400).json({ error: "Invalid vehicle selected" });
      }

      const profile = await storage.updateHaulerProfile(req.params.profileId, {
        isAvailable: true,
        activeVehicleId: vehicleId,
        activeTravelRadius: travelRadius,
        lastCheckedIn: new Date().toISOString(),
      });

      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      res.json({ success: true, message: "You are now online", profile, activeVehicle: vehicle });
    } catch (error) {
      console.error("Error going online:", error);
      res.status(500).json({ error: "Failed to go online" });
    }
  });

  // Go Offline endpoint (pro alias)
  app.post("/api/pros/:profileId/go-offline", requireAuth, requireHauler, async (req, res) => {
    try {
      const profile = await storage.updateHaulerProfile(req.params.profileId, {
        isAvailable: false,
        activeVehicleId: null,
      });

      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      res.json({ success: true, message: "You are now offline", profile });
    } catch (error) {
      console.error("Error going offline:", error);
      res.status(500).json({ error: "Failed to go offline" });
    }
  });

  // Get active jobs for pro (alias)
  app.get("/api/pros/:haulerId/jobs/active", requireAuth, requireHauler, async (req, res) => {
    try {
      const jobs = await storage.getActiveJobsForHauler(req.params.haulerId);
      const maskedJobs = jobs.map((job: MaskableRequest) =>
        maskContactInfoForRole(job, 'hauler')
      );
      res.json(maskedJobs);
    } catch (error) {
      console.error("Error fetching active jobs:", error);
      res.status(500).json({ error: "Failed to fetch active jobs" });
    }
  });

  // Get active jobs for hauler
  app.get("/api/haulers/:haulerId/jobs/active", requireAuth, requireHauler, async (req, res) => {
    try {
      const jobs = await storage.getActiveJobsForHauler(req.params.haulerId);

      // Use centralized masking helper for consistent contact info protection
      const maskedJobs = jobs.map((job: MaskableRequest) =>
        maskContactInfoForRole(job, 'hauler')
      );

      res.json(maskedJobs);
    } catch (error) {
      console.error("Error fetching active jobs:", error);

      const dbError = error as any;
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }

      res.status(500).json({ error: "Failed to fetch active jobs" });
    }
  });

  // Get reviews for Pro
  app.get("/api/pros/:proId/reviews", async (req, res) => {
    try {
      const reviews = await storage.getReviewsByHauler(req.params.proId);
      // Calculate summary stats
      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0
        ? Math.round((reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / totalReviews) * 10) / 10
        : 0;
      res.json({ reviews, averageRating, totalReviews });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  // Legacy hauler endpoint (backward compatibility)
  app.get("/api/haulers/:haulerId/reviews", async (req, res) => {
    try {
      const reviews = await storage.getReviewsByHauler(req.params.haulerId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });
  // Pro ESG Impact Summary
  app.get("/api/pros/:proId/esg-summary", async (req, res) => {
    try {
      const { proId } = req.params;
      const result = await pool.query(`
        SELECT 
          COALESCE(SUM(water_saved_gallons), 0) as gallons_saved,
          COALESCE(SUM(carbon_saved_lbs * 0.4536), 0) as co2_saved,
          COALESCE(AVG(diversion_rate), 0) as avg_esg_score,
          COUNT(*) as total_jobs
        FROM esg_impact_logs 
        WHERE hauler_id = $1
      `, [proId]);

      const row = result.rows[0];
      res.json({
        gallonsSaved: parseFloat(row.gallons_saved) || 0,
        co2Saved: parseFloat(row.co2_saved) || 0,
        avgEsgScore: Math.round(parseFloat(row.avg_esg_score) || 0),
        totalJobs: parseInt(row.total_jobs) || 0,
      });
    } catch (error) {
      console.error("ESG summary error:", error);
      res.json({ gallonsSaved: 0, co2Saved: 0, avgEsgScore: 0, totalJobs: 0 });
    }
  });
}

// Legacy export for backward compatibility
export const registerHaulerProfileRoutes = registerProProfileRoutes;
