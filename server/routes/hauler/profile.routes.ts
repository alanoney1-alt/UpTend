import type { Express } from "express";
import { storage } from "../../storage";
import { haulerCheckInSchema, haulerProfileUpdateSchema } from "@shared/schema";
import { requireAuth, requireHauler } from "../../auth-middleware";
import { db } from "../../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Contact masking helper - masks customer/hauler contact info until payment is received
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

  // Customers can't see PYCKER contact info until payment
  if (role === 'customer' && result.assignedHauler) {
    result.assignedHauler = {
      ...result.assignedHauler,
      phone: null,
      email: null,
    };
  }

  // PYCKERs can't see customer contact info until payment
  if (role === 'hauler') {
    result.customerPhone = null;
    result.customerEmail = null;
  }

  return result;
}

const pyckerRegistrationSchema = z.object({
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

export function registerHaulerProfileRoutes(app: Express) {
  // Get hauler profile by userId
  app.get("/api/haulers/:userId/profile", async (req, res) => {
    try {
      const profile = await storage.getHaulerProfile(req.params.userId);
      if (!profile) {
        return res.status(404).json({ error: "Hauler profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching hauler profile:", error);

      const dbError = error as any;
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }

      res.status(500).json({ error: "Failed to fetch hauler profile" });
    }
  });

  // Update hauler profile
  app.patch("/api/hauler/profile", requireAuth, requireHauler, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const profile = await storage.getHaulerProfile(userId);
      if (!profile) return res.status(404).json({ error: "Hauler profile not found" });

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
      console.error("Error updating hauler profile:", error);

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

  // Update hauler availability
  app.patch("/api/haulers/:profileId/availability", requireAuth, requireHauler, async (req, res) => {
    try {
      const { isAvailable } = req.body;
      const profile = await storage.updateHaulerProfile(req.params.profileId, { isAvailable });
      if (!profile) {
        return res.status(404).json({ error: "Hauler profile not found" });
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

  // Hauler check-in with location
  app.post("/api/haulers/:profileId/check-in", requireAuth, requireHauler, async (req, res) => {
    try {
      const parsed = haulerCheckInSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
      }
      const { lat, lng } = parsed.data;
      const profile = await storage.checkInHauler(req.params.profileId, lat, lng);
      if (!profile) {
        return res.status(404).json({ error: "Hauler profile not found" });
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
        return res.status(404).json({ error: "Hauler profile not found" });
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
        return res.status(404).json({ error: "Hauler profile not found" });
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

  // Get reviews for hauler
  app.get("/api/haulers/:haulerId/reviews", async (req, res) => {
    try {
      const reviews = await storage.getReviewsByHauler(req.params.haulerId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });
}
