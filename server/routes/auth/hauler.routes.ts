import type { Express } from "express";
import { storage } from "../../storage";
import { isAuthenticated } from "../../replit_integrations/auth";
import bcrypt from "bcrypt";
import { z } from "zod";
import passport from "passport";
import { sendVerificationEmail, isEmailConfigured } from "../../services/notifications";
import { getProLoginGreeting } from "../../services/george-events";
import { pool } from "../../db";

// Pro registration schema
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
  // Insurance fields (optional - higher commission without insurance)
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  generalLiabilityProvider: z.string().optional(),
  generalLiabilityPolicyNumber: z.string().optional(),
  generalLiabilityExpiration: z.string().optional(),
  vehicleInsuranceProvider: z.string().optional(),
  vehicleInsurancePolicyNumber: z.string().optional(),
  vehicleInsuranceExpiration: z.string().optional(),
  // Services
  serviceTypes: z.array(z.string()).optional(),
  supportedServices: z.array(z.string()).optional(),
  // Additional photo uploads
  selfiePhotoUrl: z.string().optional(),
  idPhotoUrl: z.string().optional(),
  generalLiabilityDocUrl: z.string().optional(),
  vehicleInsuranceDocUrl: z.string().optional(),
  aboutYou: z.string().optional(),
  agreeTerms: z.boolean(),
  agreeBackgroundCheck: z.boolean(),
  // Photo uploads
  profilePhotoUrl: z.string().url().optional(),
  driversLicensePhotoUrl: z.string().url().optional(),
  // B2B Commercial Licensing
  b2bLicensed: z.boolean().optional(),
  licenseNumber: z.string().optional(),
  b2bRates: z.record(z.string(), z.object({ min: z.number(), max: z.number() })).optional(),
});

/**
 * Pro Authentication Routes
 * Handles Pro registration, login, logout, and email verification
 */
export async function registerProAuthRoutes(app: Express): Promise<void> {
  // Pro check-username endpoint
  app.post("/api/pros/check-username", async (req, res) => {
    const { username } = req.body;
    if (!username || username.length < 3) {
      return res.status(400).json({ error: "Username must be at least 3 characters" });
    }
    const existingUser = await storage.getUserByUsername(username);
    res.json({ available: !existingUser });
  });

  // Legacy hauler endpoint (backward compatibility)
  app.post("/api/haulers/check-username", async (req, res) => {
    const { username } = req.body;
    if (!username || username.length < 3) {
      return res.status(400).json({ error: "Username must be at least 3 characters" });
    }
    const existingUser = await storage.getUserByUsername(username);
    res.json({ available: !existingUser });
  });

  // Pro send verification code
  app.post("/api/pros/send-verification", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || !z.string().email().safeParse(email).success) {
        return res.status(400).json({ error: "Valid email required" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "An account with this email already exists" });
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await storage.createEmailVerificationCode(email, code, expiresAt);
      console.log(`[EMAIL VERIFICATION] Code sent to ${email}`);

      // Send actual email if configured
      let emailSent = false;
      if (isEmailConfigured()) {
        const result = await sendVerificationEmail(email, code);
        emailSent = result.success;
        if (!result.success) {
          console.warn(`Email sending failed: ${result.error}`);
        }
      }

      res.json({
        success: true,
        message: emailSent ? "Verification code sent to your email" : "Verification code generated (email service not configured)",
        emailSent,
        ...(process.env.NODE_ENV === "development" ? { devCode: code } : {}),
      });
    } catch (error) {
      console.error("Error sending verification:", error);

      const dbError = error as any;
      if (dbError.code === '23505') {
        return res.status(409).json({ error: "Verification code already exists" });
      }
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }
      if (dbError.name === 'ValidationError') {
        return res.status(400).json({ error: dbError.message });
      }

      res.status(500).json({ error: "Failed to send verification code" });
    }
  });

  // Legacy hauler endpoint (backward compatibility)
  app.post("/api/haulers/send-verification", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || !z.string().email().safeParse(email).success) {
        return res.status(400).json({ error: "Valid email required" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "An account with this email already exists" });
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await storage.createEmailVerificationCode(email, code, expiresAt);
      console.log(`[EMAIL VERIFICATION] Code sent to ${email}`);

      // Send actual email if configured
      let emailSent = false;
      if (isEmailConfigured()) {
        const result = await sendVerificationEmail(email, code);
        emailSent = result.success;
        if (!result.success) {
          console.warn(`Email sending failed: ${result.error}`);
        }
      }

      res.json({
        success: true,
        message: emailSent ? "Verification code sent to your email" : "Verification code generated (email service not configured)",
        emailSent,
        ...(process.env.NODE_ENV === "development" ? { devCode: code } : {}),
      });
    } catch (error) {
      console.error("Error sending verification:", error);

      const dbError = error as any;
      if (dbError.code === '23505') {
        return res.status(409).json({ error: "Verification code already exists" });
      }
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }
      if (dbError.name === 'ValidationError') {
        return res.status(400).json({ error: dbError.message });
      }

      res.status(500).json({ error: "Failed to send verification code" });
    }
  });

  // Pro verify email code
  app.post("/api/pros/verify-email", async (req, res) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        return res.status(400).json({ error: "Email and code required" });
      }

      const stored = await storage.getEmailVerificationCode(email);
      if (!stored) {
        return res.status(400).json({ error: "No verification code found. Please request a new one." });
      }

      if (new Date() > stored.expiresAt) {
        await storage.deleteEmailVerificationCode(email);
        return res.status(400).json({ error: "Verification code expired. Please request a new one." });
      }

      if (stored.code !== code) {
        return res.status(400).json({ error: "Invalid verification code" });
      }

      await storage.markEmailVerified(email);
      res.json({ verified: true, message: "Email verified successfully" });
    } catch (error) {
      console.error("Error verifying email:", error);

      const dbError = error as any;
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }

      res.status(500).json({ error: "Failed to verify email" });
    }
  });

  // Legacy hauler endpoint (backward compatibility)
  app.post("/api/haulers/verify-email", async (req, res) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        return res.status(400).json({ error: "Email and code required" });
      }

      const stored = await storage.getEmailVerificationCode(email);
      if (!stored) {
        return res.status(400).json({ error: "No verification code found. Please request a new one." });
      }

      if (new Date() > stored.expiresAt) {
        await storage.deleteEmailVerificationCode(email);
        return res.status(400).json({ error: "Verification code expired. Please request a new one." });
      }

      if (stored.code !== code) {
        return res.status(400).json({ error: "Invalid verification code" });
      }

      await storage.markEmailVerified(email);
      res.json({ verified: true, message: "Email verified successfully" });
    } catch (error) {
      console.error("Error verifying email:", error);

      const dbError = error as any;
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }

      res.status(500).json({ error: "Failed to verify email" });
    }
  });

  // Pro registration
  app.post("/api/pros/register", async (req, res) => {
    try {
      const parsed = proRegistrationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid registration data", details: parsed.error.issues });
      }

      const data = parsed.data;

      // Check if email was verified using database storage
      const storedVerification = await storage.getEmailVerificationCode(data.email);
      if (!storedVerification || !storedVerification.verified) {
        return res.status(400).json({ error: "Please verify your email before registering" });
      }

      if (new Date() > storedVerification.expiresAt) {
        await storage.deleteEmailVerificationCode(data.email);
        return res.status(400).json({ error: "Email verification expired. Please verify your email again." });
      }

      // Check for existing email
      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail) {
        return res.status(400).json({ error: "An account with this email already exists" });
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);

      await storage.deleteEmailVerificationCode(data.email);

      const user = await storage.createUser({
        username: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: "hauler",
        email: data.email,
        phone: data.phone,
      });

      const vehicleCapacity = data.vehicleType === "pickup" || data.vehicleType === "cargo_van" ? "medium" :
                              data.vehicleType === "box_truck_small" ? "large" : "extra_large";

      // Determine if pro has insurance docs
      const hasInsurance = !!(data.generalLiabilityProvider || data.insuranceProvider);

      const registrationDetails = JSON.stringify({
        streetAddress: data.streetAddress,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        vehicleYear: data.vehicleYear,
        vehicleMake: data.vehicleMake,
        vehicleModel: data.vehicleModel,
        licensePlate: data.licensePlate,
        driversLicense: data.driversLicense,
        insuranceProvider: data.insuranceProvider || data.generalLiabilityProvider,
        insurancePolicyNumber: data.insurancePolicyNumber || data.generalLiabilityPolicyNumber,
        generalLiabilityProvider: data.generalLiabilityProvider,
        generalLiabilityPolicyNumber: data.generalLiabilityPolicyNumber,
        generalLiabilityExpiration: data.generalLiabilityExpiration,
        vehicleInsuranceProvider: data.vehicleInsuranceProvider,
        vehicleInsurancePolicyNumber: data.vehicleInsurancePolicyNumber,
        vehicleInsuranceExpiration: data.vehicleInsuranceExpiration,
        aboutYou: data.aboutYou,
        submittedAt: new Date().toISOString(),
      });

      const profile = await storage.createHaulerProfile({
        userId: user.id,
        companyName: data.companyName,
        vehicleType: data.vehicleType,
        capacity: vehicleCapacity,
        bio: registrationDetails,
        rating: 5.0,
        reviewCount: 0,
        hourlyRate: 50,
        isAvailable: false,
        backgroundCheckStatus: "pending",
        hasCardOnFile: false,
        canAcceptJobs: false,
        profilePhotoUrl: data.profilePhotoUrl || null,
        driversLicensePhotoUrl: data.driversLicensePhotoUrl || null,
        serviceTypes: data.serviceTypes || data.supportedServices || [],
        hasOwnLiabilityInsurance: hasInsurance,
        icaAcceptedAt: req.body.icaAcceptedAt || null,
        icaSignedName: req.body.icaSignedName || null,
        icaVersion: req.body.icaVersion || null,
        b2bLicensed: data.b2bLicensed || false,
        licenseNumber: data.licenseNumber || null,
        b2bRates: data.b2bRates || {},
      });

      // Update social profiles if provided
      if (req.body.facebookUrl || req.body.instagramUrl || req.body.linkedinUrl || req.body.tiktokUrl || req.body.nextdoorUrl) {
        const { pool: dbPool } = await import('../../db');
        await (dbPool || pool).query(
          `UPDATE hauler_profiles SET facebook_url = \$1, instagram_url = \$2, linkedin_url = \$3, tiktok_url = \$4, nextdoor_url = \$5 WHERE user_id = \$6`,
          [req.body.facebookUrl || null, req.body.instagramUrl || null, req.body.linkedinUrl || null, req.body.tiktokUrl || null, req.body.nextdoorUrl || null, user.id]
        );
      }

      // Create vehicles from registration data
      const vehicles = (req.body.vehicles as any[]) || [];
      const createdVehicles = [];

      for (const v of vehicles) {
        const vehicle = await storage.createPyckerVehicle({
          haulerProfileId: profile.id,
          vehicleType: v.vehicleType,
          vehicleName: v.vehicleName || `${v.make || ''} ${v.model || ''}`.trim() || v.vehicleType,
          year: v.year,
          make: v.make,
          model: v.model,
          licensePlate: v.licensePlate,
          capacity: v.capacity || "medium",
          isEnclosed: v.isEnclosed || false,
          hasTrailer: v.hasTrailer || false,
          trailerSize: v.trailerSize,
          bedLength: v.bedLength,
          description: v.description,
          createdAt: new Date().toISOString(),
          photoUrls: v.photoUrls || [],
        });
        createdVehicles.push(vehicle);
      }

      // If no vehicles were provided in array, create one from legacy fields
      if (vehicles.length === 0 && data.vehicleType) {
        const vehicle = await storage.createPyckerVehicle({
          haulerProfileId: profile.id,
          vehicleType: data.vehicleType,
          vehicleName: `${data.vehicleMake || ''} ${data.vehicleModel || ''}`.trim() || data.vehicleType,
          year: data.vehicleYear,
          make: data.vehicleMake,
          model: data.vehicleModel,
          licensePlate: data.licensePlate,
          capacity: vehicleCapacity,
          isEnclosed: false,
          hasTrailer: false,
          createdAt: new Date().toISOString(),
        });
        createdVehicles.push(vehicle);
      }

      res.json({
        success: true,
        message: "Registration successful. Background check pending.",
        userId: user.id,
        profileId: profile.id,
        vehicles: createdVehicles,
      });
    } catch (error) {
      console.error("Registration error:", error);

      // Handle specific database errors
      const dbError = error as any;
      if (dbError.code === '23505') {
        return res.status(409).json({ error: "Email or username already registered" });
      }
      if (dbError.code === '23503') {
        return res.status(400).json({ error: "Invalid reference data" });
      }
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }
      if (dbError.name === 'ValidationError') {
        return res.status(400).json({ error: dbError.message });
      }

      res.status(500).json({ error: "Failed to complete registration" });
    }
  });

  // Legacy hauler endpoint (backward compatibility)
  app.post("/api/haulers/register", async (req, res) => {
    try {
      const parsed = proRegistrationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid registration data", details: parsed.error.issues });
      }

      const data = parsed.data;

      // Check if email was verified using database storage
      const storedVerification = await storage.getEmailVerificationCode(data.email);
      if (!storedVerification || !storedVerification.verified) {
        return res.status(400).json({ error: "Please verify your email before registering" });
      }

      if (new Date() > storedVerification.expiresAt) {
        await storage.deleteEmailVerificationCode(data.email);
        return res.status(400).json({ error: "Email verification expired. Please verify your email again." });
      }

      // Check for existing email
      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail) {
        return res.status(400).json({ error: "An account with this email already exists" });
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);

      await storage.deleteEmailVerificationCode(data.email);

      const user = await storage.createUser({
        username: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: "hauler",
        email: data.email,
        phone: data.phone,
      });

      const vehicleCapacity = data.vehicleType === "pickup" || data.vehicleType === "cargo_van" ? "medium" :
                              data.vehicleType === "box_truck_small" ? "large" : "extra_large";

      const hasInsurance = !!(data.generalLiabilityProvider || data.insuranceProvider);

      const registrationDetails = JSON.stringify({
        streetAddress: data.streetAddress,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        vehicleYear: data.vehicleYear,
        vehicleMake: data.vehicleMake,
        vehicleModel: data.vehicleModel,
        licensePlate: data.licensePlate,
        driversLicense: data.driversLicense,
        insuranceProvider: data.insuranceProvider || data.generalLiabilityProvider,
        insurancePolicyNumber: data.insurancePolicyNumber || data.generalLiabilityPolicyNumber,
        generalLiabilityProvider: data.generalLiabilityProvider,
        generalLiabilityPolicyNumber: data.generalLiabilityPolicyNumber,
        generalLiabilityExpiration: data.generalLiabilityExpiration,
        vehicleInsuranceProvider: data.vehicleInsuranceProvider,
        vehicleInsurancePolicyNumber: data.vehicleInsurancePolicyNumber,
        vehicleInsuranceExpiration: data.vehicleInsuranceExpiration,
        aboutYou: data.aboutYou,
        submittedAt: new Date().toISOString(),
      });

      const profile = await storage.createHaulerProfile({
        userId: user.id,
        companyName: data.companyName,
        vehicleType: data.vehicleType,
        capacity: vehicleCapacity,
        bio: registrationDetails,
        rating: 5.0,
        reviewCount: 0,
        hourlyRate: 50,
        isAvailable: false,
        backgroundCheckStatus: "pending",
        hasCardOnFile: false,
        canAcceptJobs: false,
        profilePhotoUrl: data.profilePhotoUrl || null,
        driversLicensePhotoUrl: data.driversLicensePhotoUrl || null,
        serviceTypes: data.serviceTypes || data.supportedServices || [],
        hasOwnLiabilityInsurance: hasInsurance,
        icaAcceptedAt: req.body.icaAcceptedAt || null,
        icaSignedName: req.body.icaSignedName || null,
        icaVersion: req.body.icaVersion || null,
        b2bLicensed: data.b2bLicensed || false,
        licenseNumber: data.licenseNumber || null,
        b2bRates: data.b2bRates || {},
      });

      // Update social profiles if provided
      if (req.body.facebookUrl || req.body.instagramUrl || req.body.linkedinUrl || req.body.tiktokUrl || req.body.nextdoorUrl) {
        const { pool: dbPool } = await import('../../db');
        await (dbPool || pool).query(
          `UPDATE hauler_profiles SET facebook_url = \$1, instagram_url = \$2, linkedin_url = \$3, tiktok_url = \$4, nextdoor_url = \$5 WHERE user_id = \$6`,
          [req.body.facebookUrl || null, req.body.instagramUrl || null, req.body.linkedinUrl || null, req.body.tiktokUrl || null, req.body.nextdoorUrl || null, user.id]
        );
      }

      // Create vehicles from registration data
      const vehicles = (req.body.vehicles as any[]) || [];
      const createdVehicles = [];

      for (const v of vehicles) {
        const vehicle = await storage.createPyckerVehicle({
          haulerProfileId: profile.id,
          vehicleType: v.vehicleType,
          vehicleName: v.vehicleName || `${v.make || ''} ${v.model || ''}`.trim() || v.vehicleType,
          year: v.year,
          make: v.make,
          model: v.model,
          licensePlate: v.licensePlate,
          capacity: v.capacity || "medium",
          isEnclosed: v.isEnclosed || false,
          hasTrailer: v.hasTrailer || false,
          trailerSize: v.trailerSize,
          bedLength: v.bedLength,
          description: v.description,
          createdAt: new Date().toISOString(),
          photoUrls: v.photoUrls || [],
        });
        createdVehicles.push(vehicle);
      }

      // If no vehicles were provided in array, create one from legacy fields
      if (vehicles.length === 0 && data.vehicleType) {
        const vehicle = await storage.createPyckerVehicle({
          haulerProfileId: profile.id,
          vehicleType: data.vehicleType,
          vehicleName: `${data.vehicleMake || ''} ${data.vehicleModel || ''}`.trim() || data.vehicleType,
          year: data.vehicleYear,
          make: data.vehicleMake,
          model: data.vehicleModel,
          licensePlate: data.licensePlate,
          capacity: vehicleCapacity,
          isEnclosed: false,
          hasTrailer: false,
          createdAt: new Date().toISOString(),
        });
        createdVehicles.push(vehicle);
      }

      res.json({
        success: true,
        message: "Registration successful. Background check pending.",
        userId: user.id,
        profileId: profile.id,
        vehicles: createdVehicles,
      });
    } catch (error) {
      console.error("Registration error:", error);

      // Handle specific database errors
      const dbError = error as any;
      if (dbError.code === '23505') {
        return res.status(409).json({ error: "Email or username already registered" });
      }
      if (dbError.code === '23503') {
        return res.status(400).json({ error: "Invalid reference data" });
      }
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }
      if (dbError.name === 'ValidationError') {
        return res.status(400).json({ error: dbError.message });
      }

      res.status(500).json({ error: "Failed to complete registration" });
    }
  });

  // Pro Login endpoint - validates Pro role
  app.post("/api/pros/login", async (req, res, next) => {
    passport.authenticate("local", async (err: any, user: any, info: any) => {
      if (err) {
        console.error("Pro login error:", err);
        const dbError = err as any;
        if (dbError.code === 'ECONNREFUSED') {
          return res.status(503).json({ error: "Database connection failed" });
        }
        return res.status(500).json({ error: "Login failed" });
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || "Invalid credentials" });
      }

      try {
        // Validate that this is a Pro account
        const fullUser = await storage.getUser(user.userId);
        if (fullUser?.role !== "hauler" && fullUser?.role !== "admin") {
          return res.status(401).json({ error: "Please use the customer login" });
        }

        req.login(user, async (loginErr) => {
          if (loginErr) {
            console.error("Session creation error:", loginErr);
            return res.status(500).json({ error: "Login failed" });
          }
          // Fetch proId from hauler_profiles
          const userId = user.userId || user.id;
          let proId: string | null = null;
          try {
            const { rows: profiles } = await pool.query(
              `SELECT id FROM hauler_profiles WHERE user_id = $1 LIMIT 1`,
              [userId]
            );
            proId = profiles[0]?.id || null;
          } catch {}

          // George: attach pro greeting to login response (non-blocking)
          getProLoginGreeting(userId).then(georgeGreeting => {
            return res.json({
              success: true,
              message: "Login successful",
              role: fullUser?.role,
              proId,
              george: georgeGreeting,
            });
          }).catch(() => {
            return res.json({
              success: true,
              message: "Login successful",
              role: fullUser?.role,
              proId,
            });
          });
        });
      } catch (error) {
        console.error("Error during login:", error);
        const dbError = error as any;
        if (dbError.code === 'ECONNREFUSED') {
          return res.status(503).json({ error: "Database connection failed" });
        }
        return res.status(500).json({ error: "Login failed" });
      }
    })(req, res, next);
  });

  // Legacy hauler endpoint (backward compatibility)
  app.post("/api/haulers/login", async (req, res, next) => {
    passport.authenticate("local", async (err: any, user: any, info: any) => {
      if (err) {
        console.error("Pro login error:", err);
        const dbError = err as any;
        if (dbError.code === 'ECONNREFUSED') {
          return res.status(503).json({ error: "Database connection failed" });
        }
        return res.status(500).json({ error: "Login failed" });
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || "Invalid credentials" });
      }

      try {
        // Validate that this is a Pro account
        const fullUser = await storage.getUser(user.userId);
        if (fullUser?.role !== "hauler" && fullUser?.role !== "admin") {
          return res.status(401).json({ error: "Please use the customer login" });
        }

        req.login(user, async (loginErr) => {
          if (loginErr) {
            console.error("Session creation error:", loginErr);
            return res.status(500).json({ error: "Login failed" });
          }
          // Fetch proId from hauler_profiles
          const legacyUserId = user.userId || user.id;
          let legacyProId: string | null = null;
          try {
            const { rows: lp } = await pool.query(
              `SELECT id FROM hauler_profiles WHERE user_id = $1 LIMIT 1`,
              [legacyUserId]
            );
            legacyProId = lp[0]?.id || null;
          } catch {}

          // George: attach pro greeting to login response (non-blocking)
          getProLoginGreeting(legacyUserId).then(georgeGreeting => {
            return res.json({
              success: true,
              message: "Login successful",
              role: fullUser?.role,
              proId: legacyProId,
              george: georgeGreeting,
            });
          }).catch(() => {
            return res.json({
              success: true,
              message: "Login successful",
              role: fullUser?.role,
              proId: legacyProId,
            });
          });
        });
      } catch (error) {
        console.error("Error during login:", error);
        const dbError = error as any;
        if (dbError.code === 'ECONNREFUSED') {
          return res.status(503).json({ error: "Database connection failed" });
        }
        return res.status(500).json({ error: "Login failed" });
      }
    })(req, res, next);
  });

  // Pro Logout endpoint
  app.post("/api/pros/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true, message: "Logged out successfully" });
    });
  });

  // Accept ICA (for existing pros who haven't signed)
  app.post("/api/auth/accept-ica", async (req, res) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { signedName, acceptedAt, icaVersion } = req.body;
      if (!signedName || !acceptedAt || !icaVersion) {
        return res.status(400).json({ error: "Missing required fields: signedName, acceptedAt, icaVersion" });
      }

      const user = req.user as any;
      const profile = await storage.getHaulerProfile(user.id);
      if (!profile) {
        return res.status(404).json({ error: "Pro profile not found" });
      }
      await storage.updateHaulerProfile(profile.id, {
        icaAcceptedAt: acceptedAt,
        icaSignedName: signedName,
        icaVersion: icaVersion,
      });

      res.json({ success: true, message: "ICA accepted successfully" });
    } catch (error) {
      console.error("ICA acceptance error:", error);
      res.status(500).json({ error: "Failed to save ICA acceptance" });
    }
  });

  // Legacy hauler endpoint (backward compatibility)
  app.post("/api/haulers/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true, message: "Logged out successfully" });
    });
  });
  // ===== Pro Pricing Feedback (onboarding market intelligence) =====
  app.post("/api/pros/pricing-feedback", async (req, res) => {
    try {
      const userId = (req.user as any)?.userId || (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });

      const { feedbackItems, zipCode } = req.body;
      if (!Array.isArray(feedbackItems) || feedbackItems.length === 0) {
        return res.status(400).json({ error: "feedbackItems required" });
      }

      const { pool: dbPool } = await import('../../db');
      const db = dbPool || pool;

      // Get hauler profile
      const profileResult = await db.query(
        `SELECT id FROM hauler_profiles WHERE user_id = $1 LIMIT 1`,
        [userId]
      );
      if (profileResult.rows.length === 0) {
        return res.status(404).json({ error: "Pro profile not found" });
      }
      const profileId = profileResult.rows[0].id;

      for (const item of feedbackItems) {
        await db.query(
          `INSERT INTO pro_pricing_feedback (hauler_profile_id, user_id, service_type, typical_charge_low, typical_charge_high, years_experience, notes, zip_code)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [profileId, userId, item.serviceType, item.chargeLow || null, item.chargeHigh || null, item.yearsExperience || null, item.notes || null, zipCode || null]
        );
      }

      res.json({ success: true, message: "Thanks for the pricing insight - this helps us keep rates competitive for your market." });
    } catch (error) {
      console.error("Pricing feedback error:", error);
      res.status(500).json({ error: "Failed to save pricing feedback" });
    }
  });

  // Get aggregated pricing feedback (admin/internal)
  app.get("/api/admin/pricing-feedback", async (req, res) => {
    try {
      const { pool: dbPool } = await import('../../db');
      const db = dbPool || pool;
      const result = await db.query(`
        SELECT service_type, zip_code,
               COUNT(*) as responses,
               ROUND(AVG(typical_charge_low)) as avg_low,
               ROUND(AVG(typical_charge_high)) as avg_high,
               ROUND(AVG(years_experience), 1) as avg_experience
        FROM pro_pricing_feedback
        GROUP BY service_type, zip_code
        ORDER BY service_type, zip_code
      `);
      res.json({ data: result.rows });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pricing feedback" });
    }
  });
}

// Legacy export for backward compatibility
export const registerHaulerAuthRoutes = registerProAuthRoutes;
