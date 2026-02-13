import type { Express } from "express";
import { storage } from "../../storage";
import { isAuthenticated } from "../../replit_integrations/auth";
import bcrypt from "bcrypt";
import { z } from "zod";
import passport from "passport";
import { sendVerificationEmail, isEmailConfigured } from "../../services/notifications";

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
      });

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
      });

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

        req.login(user, (loginErr) => {
          if (loginErr) {
            console.error("Session creation error:", loginErr);
            return res.status(500).json({ error: "Login failed" });
          }
          return res.json({
            success: true,
            message: "Login successful",
            role: fullUser?.role,
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

        req.login(user, (loginErr) => {
          if (loginErr) {
            console.error("Session creation error:", loginErr);
            return res.status(500).json({ error: "Login failed" });
          }
          return res.json({
            success: true,
            message: "Login successful",
            role: fullUser?.role,
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

  // Legacy hauler endpoint (backward compatibility)
  app.post("/api/haulers/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true, message: "Logged out successfully" });
    });
  });
}

// Legacy export for backward compatibility
export const registerHaulerAuthRoutes = registerProAuthRoutes;
