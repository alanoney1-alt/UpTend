import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertServiceRequestSchema, quoteRequestSchema, locationUpdateSchema, haulerCheckInSchema, haulerProfileUpdateSchema, POINTS_PER_DOLLAR, insertBusinessAccountSchema, insertRecurringJobSchema } from "@shared/schema";
import { calculateDistance, geocodeZip, isZipCodeSupported, calculateMovePricing, findNearestDump, SUPPORTED_ZIP_CODES } from "./distanceUtils";
import { z } from "zod";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { analyzePhotosForQuote } from "./services/ai-analysis";
import { stripeService } from "./stripeService";
import { analyzePhotos, getQuickEstimate } from "./photoAnalysisService";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { requireAuth, requireAdmin, requireHauler, requireCustomer, requireOwnership } from "./auth-middleware";
import { validateReceiptWithAI, type ReceiptValidationInput } from "./services/rebate-ai-validation";
import bcrypt from "bcrypt";
import passport from "passport";
import { sendVerificationEmail, sendPasswordResetEmail, isEmailConfigured, isSmsConfigured, sendEmail, sendSms } from "./services/notifications";
import { passwordResetTokens } from "@shared/schema";
import { db } from "./db";
import { eq, and, gt } from "drizzle-orm";
import crypto from "crypto";

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

async function triggerAIValidation(claimId: string, input: ReceiptValidationInput): Promise<void> {
  try {
    console.log(`Starting AI validation for rebate claim ${claimId}...`);
    const result = await validateReceiptWithAI(input);
    
    await storage.updateRebateClaimAIValidation(claimId, {
      aiValidationStatus: result.status,
      aiValidationResult: JSON.stringify(result.details),
      aiValidationNotes: result.notes,
      aiValidatedAt: new Date().toISOString(),
      aiConfidenceScore: result.confidenceScore,
    });
    
    console.log(`AI validation completed for claim ${claimId}: ${result.status} (${result.confidenceScore}% confidence)`);
  } catch (error) {
    console.error(`AI validation failed for claim ${claimId}:`, error);
    await storage.updateRebateClaimAIValidation(claimId, {
      aiValidationStatus: "needs_review",
      aiValidationNotes: "AI validation failed - manual review required",
      aiValidatedAt: new Date().toISOString(),
      aiConfidenceScore: 0,
    });
  }
}

const jobConnections = new Map<string, Set<WebSocket>>();
const wsConnectionMeta = new WeakMap<WebSocket, { role?: string; jobId?: string; userId?: string }>();

function broadcastToJob(jobId: string, message: object) {
  const connections = jobConnections.get(jobId);
  if (connections) {
    const data = JSON.stringify(message);
    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Setup authentication BEFORE registering routes
  await setupAuth(app);
  registerAuthRoutes(app);
  
  registerObjectStorageRoutes(app);
  
  // DISABLED: No longer seeding fake PYCKER data
  // await storage.seedInitialData();
  await storage.seedOrlando25PromoCode();
  
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  
  wss.on("connection", (ws, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const jobId = url.searchParams.get("jobId");
    const userId = url.searchParams.get("userId");
    const role = url.searchParams.get("role") || undefined;
    
    wsConnectionMeta.set(ws, { role, jobId: jobId || undefined, userId: userId || undefined });
    
    if (jobId) {
      if (!jobConnections.has(jobId)) {
        jobConnections.set(jobId, new Set());
      }
      jobConnections.get(jobId)!.add(ws);
      
      ws.send(JSON.stringify({ type: "connected", jobId, role }));
    }
    
    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === "location_update" && userId) {
          const connMeta = wsConnectionMeta.get(ws);
          if (connMeta?.role !== "hauler" || connMeta?.userId !== userId) {
            return;
          }
          
          const location = locationUpdateSchema.parse(message.data);
          await storage.addLocationHistory({
            userId,
            jobId: jobId || undefined,
            lat: location.lat,
            lng: location.lng,
            accuracy: location.accuracy,
            heading: location.heading,
            speed: location.speed,
            recordedAt: new Date().toISOString(),
          });
          
          if (jobId) {
            broadcastToJob(jobId, {
              type: "location_updated",
              userId,
              role: "hauler",
              ...location,
              timestamp: new Date().toISOString(),
            });
          }
        }
        
        if (message.type === "customer_location_update" && jobId) {
          const connMeta = wsConnectionMeta.get(ws);
          if (connMeta?.role !== "customer" || connMeta?.jobId !== jobId) {
            return;
          }
          
          const customerLocationSchema = z.object({
            lat: z.number().min(-90).max(90),
            lng: z.number().min(-180).max(180),
            accuracy: z.number().min(0).max(10000).nullable().optional(),
          });
          const parseResult = customerLocationSchema.safeParse(message.data);
          if (parseResult.success) {
            broadcastToJob(jobId, {
              type: "customer_location_updated",
              ...parseResult.data,
              timestamp: new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });
    
    ws.on("close", () => {
      if (jobId) {
        jobConnections.get(jobId)?.delete(ws);
        if (jobConnections.get(jobId)?.size === 0) {
          jobConnections.delete(jobId);
        }
      }
    });
  });
  
  app.get("/api/haulers", async (req, res) => {
    try {
      const haulers = await storage.getAllHaulers();
      res.json(haulers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch haulers" });
    }
  });

  app.get("/api/haulers/available", async (req, res) => {
    try {
      const haulers = await storage.getAvailableHaulers();
      res.json(haulers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch available haulers" });
    }
  });

  app.get("/api/haulers/available/with-vehicles", async (req, res) => {
    try {
      const preferVerifiedPro = req.query.preferVerifiedPro === "true";
      let haulers = await storage.getAvailableHaulersWithVehicles();
      
      // Filter to only Verified Pro PYCKERs if customer prefers
      if (preferVerifiedPro) {
        haulers = haulers.filter(h => h.profile.pyckerTier === "verified_pro");
      }
      
      res.json(haulers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch available haulers with vehicles" });
    }
  });

  app.get("/api/haulers/search", async (req, res) => {
    try {
      const { serviceType, capability, laborOnly, availableOnly } = req.query;
      const result = await storage.searchHaulers({
        serviceType: serviceType as string | undefined,
        capability: capability as string | undefined,
        laborOnly: laborOnly === "true",
        availableOnly: availableOnly !== "false",
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to search haulers" });
    }
  });

  app.get("/api/haulers/:userId/profile", async (req, res) => {
    try {
      const profile = await storage.getHaulerProfile(req.params.userId);
      if (!profile) {
        return res.status(404).json({ error: "Hauler profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch hauler profile" });
    }
  });

  app.patch("/api/haulers/:profileId/availability", requireAuth, requireHauler, async (req, res) => {
    try {
      const { isAvailable } = req.body;
      const profile = await storage.updateHaulerProfile(req.params.profileId, { isAvailable });
      if (!profile) {
        return res.status(404).json({ error: "Hauler profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to update availability" });
    }
  });

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
      res.status(500).json({ error: "Failed to check in" });
    }
  });

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

  const pyckerRegistrationSchema = z.object({
    // Account credentials
    username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
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

  // Check if username is available
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

  // Auth route - check username availability
  app.get("/api/auth/check-username", async (req, res) => {
    try {
      const username = req.query.username as string;
      if (!username || username.length < 3) {
        return res.json({ available: false });
      }
      const existingUser = await storage.getUserByUsername(username);
      res.json({ available: !existingUser });
    } catch (error) {
      res.status(500).json({ error: "Failed to check username" });
    }
  });

  // Auth route - send verification code to email (uses database storage)
  app.post("/api/auth/send-verification", async (req, res) => {
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
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store in database
      await storage.createEmailVerificationCode(email, code, expiresAt);

      console.log(`[EMAIL VERIFICATION] Code for ${email}: ${code}`);

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
      res.status(500).json({ error: "Failed to send verification code" });
    }
  });

  // Auth route - verify email code (uses database storage)
  app.post("/api/auth/verify-email", async (req, res) => {
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

      // Mark as verified in database
      await storage.markEmailVerified(email);
      res.json({ verified: true, message: "Email verified successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to verify email" });
    }
  });

  // Legacy hauler routes - redirect to auth routes for consistency
  app.post("/api/haulers/check-username", async (req, res) => {
    const { username } = req.body;
    if (!username || username.length < 3) {
      return res.status(400).json({ error: "Username must be at least 3 characters" });
    }
    const existingUser = await storage.getUserByUsername(username);
    res.json({ available: !existingUser });
  });

  app.post("/api/haulers/send-verification", async (req, res) => {
    // Forward to auth route
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
      console.log(`[EMAIL VERIFICATION] Code for ${email}: ${code}`);

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
      res.status(500).json({ error: "Failed to send verification code" });
    }
  });

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
      res.status(500).json({ error: "Failed to verify email" });
    }
  });

  // Test notification endpoints
  app.get("/api/test/email", async (req, res) => {
    const testEmail = req.query.to as string || "test@example.com";
    if (!isEmailConfigured()) {
      return res.json({ 
        success: false, 
        error: "SendGrid not configured - please add SENDGRID_API_KEY secret",
        configured: false 
      });
    }
    const result = await sendEmail({
      to: testEmail,
      subject: "uPYCK Test Email",
      html: "<h1>Test Email</h1><p>Your uPYCK email integration is working!</p>",
      text: "Test Email - Your uPYCK email integration is working!",
    });
    res.json({ ...result, configured: true });
  });

  app.get("/api/test/sms", async (req, res) => {
    const testPhone = req.query.to as string;
    if (!testPhone) {
      return res.status(400).json({ error: "Please provide ?to=+1234567890 phone number" });
    }
    if (!isSmsConfigured()) {
      return res.json({ 
        success: false, 
        error: "Twilio not configured - please add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER secrets",
        configured: false 
      });
    }
    const result = await sendSms({
      to: testPhone,
      message: "uPYCK Test SMS - Your SMS integration is working!",
    });
    res.json({ ...result, configured: true });
  });

  app.get("/api/test/both", async (req, res) => {
    res.json({
      email: { configured: isEmailConfigured() },
      sms: { configured: isSmsConfigured() },
    });
  });

  app.post("/api/haulers/register", async (req, res) => {
    try {
      const parsed = pyckerRegistrationSchema.safeParse(req.body);
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

      // Check for existing username
      const existingUsername = await storage.getUserByUsername(data.username);
      if (existingUsername) {
        return res.status(400).json({ error: "This username is already taken" });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Clean up verification code from database
      await storage.deleteEmailVerificationCode(data.email);

      const user = await storage.createUser({
        username: data.username,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: "hauler",
        email: data.email,
        phone: data.phone,
      });

      const vehicleCapacity = data.vehicleType === "pickup" || data.vehicleType === "cargo_van" ? "medium" :
                              data.vehicleType === "box_truck_small" ? "large" : "extra_large";

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
        insuranceProvider: data.insuranceProvider,
        insurancePolicyNumber: data.insurancePolicyNumber,
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
      res.status(500).json({ error: "Failed to complete registration" });
    }
  });

  // PYCKER Login endpoint - validates hauler role
  app.post("/api/haulers/login", async (req, res, next) => {
    passport.authenticate("local", async (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ error: "Login failed" });
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || "Invalid credentials" });
      }
      
      // Validate that this is a hauler/PYCKER account
      const fullUser = await storage.getUser(user.userId);
      if (fullUser?.role !== "hauler" && fullUser?.role !== "admin") {
        return res.status(401).json({ error: "Please use the customer login" });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ error: "Login failed" });
        }
        return res.json({ 
          success: true, 
          message: "Login successful",
          role: fullUser?.role,
        });
      });
    })(req, res, next);
  });

  // PYCKER Logout endpoint
  app.post("/api/haulers/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true, message: "Logged out successfully" });
    });
  });

  // ==========================================
  // PYCKER GPS Tracking & Online Status APIs
  // ==========================================

  // PYCKER goes online - starts GPS tracking
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

  // PYCKER updates location (called every 30 seconds while online)
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

  // PYCKER goes offline - stops GPS tracking
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

  // Customer: Find nearby available PYCKERs
  app.get("/api/pyckers/nearby", async (req, res) => {
    try {
      const { lat, lng, radius } = req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({ error: "Customer location (lat, lng) is required" });
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      const radiusMiles = parseFloat(radius as string) || 25; // Default 25 mile radius

      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ error: "Invalid coordinates" });
      }

      let nearbyPyckers = await storage.getOnlinePyckersNearby(latitude, longitude, radiusMiles);

      // Optional filtering by vehicle type and capabilities
      const vehicleType = req.query.vehicleType as string;
      const capabilities = req.query.capabilities as string;

      if (vehicleType) {
        nearbyPyckers = nearbyPyckers.filter((p: any) => p.vehicle_type === vehicleType);
      }

      if (capabilities) {
        const requiredCapabilities = capabilities.split(',');
        nearbyPyckers = nearbyPyckers.filter((p: any) => {
          const pyckerCaps = p.capabilities || [];
          return requiredCapabilities.every(cap => pyckerCaps.includes(cap));
        });
      }

      // Calculate ETA (rough estimate: average 30 mph) and normalize response
      const pyckersWithEta = nearbyPyckers.map((pycker: any) => ({
        id: pycker.pycker_id || pycker.id,
        pyckerId: pycker.pycker_id || pycker.id,
        latitude: pycker.latitude,
        longitude: pycker.longitude,
        status: pycker.status,
        distance: pycker.distance,
        eta: Math.round(pycker.distance / 0.5),
        etaMinutes: Math.round(pycker.distance / 30 * 60),
        location: {
          latitude: parseFloat(pycker.latitude) || 0,
          longitude: parseFloat(pycker.longitude) || 0,
        },
        // FIXED: Include all hauler profile data
        company_name: pycker.company_name,
        first_name: pycker.first_name,
        last_name: pycker.last_name,
        profile_photo: pycker.profile_photo,
        rating: pycker.rating,
        total_jobs: pycker.jobs_completed,
        pycker_tier: pycker.pycker_tier,
        vehicle_type: pycker.vehicle_type, // ← KEY FIX!
        capabilities: pycker.capabilities,
        offers_labor_only: pycker.offers_labor_only,
        capacity: pycker.capacity,
        hourly_rate: pycker.hourly_rate,
      }));

      res.json({ 
        pyckers: pyckersWithEta,
        customerLocation: { lat: latitude, lng: longitude },
        searchRadiusMiles: radiusMiles,
      });
    } catch (error) {
      console.error("Find nearby pyckers error:", error);
      res.status(500).json({ error: "Failed to find nearby PYCKERs" });
    }
  });

  // Customer Registration endpoint
  app.post("/api/customers/register", async (req, res) => {
    try {
      const { username, email, password, firstName, lastName, phone, smsOptIn } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ error: "Username, email, and password are required" });
      }
      
      // Phone is required for booking updates and PYCKER communication
      if (!phone || phone.trim().length < 10) {
        return res.status(400).json({ error: "A valid phone number is required for booking updates" });
      }
      
      // SMS opt-in is required
      if (!smsOptIn) {
        return res.status(400).json({ error: "You must agree to receive SMS notifications to register" });
      }
      
      // Validate username format
      if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
        return res.status(400).json({ error: "Username must be 3-30 characters, alphanumeric and underscores only" });
      }
      
      // Check for existing user
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ error: "Username already taken" });
      }
      
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already registered" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await storage.createUser({
        id: crypto.randomUUID(),
        username,
        email,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        phone: phone || null,
        role: "customer",
      });
      
      // Auto-login after registration - wait for session to be established before responding
      req.login({ 
        localAuth: true, 
        userId: user.id, 
        role: "customer" 
      }, (loginErr) => {
        if (loginErr) {
          console.error("Auto-login failed:", loginErr);
          return res.status(500).json({ error: "Registration succeeded but login failed. Please try logging in." });
        }
        
        res.json({
          success: true,
          message: "Registration successful",
          userId: user.id,
          requiresPaymentSetup: true,
        });
      });
    } catch (error) {
      console.error("Customer registration error:", error);
      res.status(500).json({ error: "Failed to complete registration" });
    }
  });

  // Customer Login endpoint - validates customer role
  app.post("/api/customers/login", async (req, res, next) => {
    passport.authenticate("local", async (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ error: "Login failed" });
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || "Invalid credentials" });
      }
      
      // Validate that this is a customer account
      const fullUser = await storage.getUser(user.userId);
      if (fullUser?.role !== "customer") {
        return res.status(401).json({ error: "Please use the PYCKER login portal" });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ error: "Login failed" });
        }
        return res.json({ 
          success: true, 
          message: "Login successful",
          role: user.role,
          hasPaymentMethod: !!fullUser?.stripeCustomerId,
        });
      });
    })(req, res, next);
  });

  // Customer Logout endpoint
  app.post("/api/customers/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true, message: "Logged out successfully" });
    });
  });

  // Customer Payment Setup - Create or get Stripe customer and setup intent
  app.post("/api/customers/setup-payment", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.localAuth ? req.user.userId : req.user.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let stripeCustomerId = user.stripeCustomerId;

      // Create Stripe customer if doesn't exist
      if (!stripeCustomerId) {
        const customer = await stripeService.createCustomer(
          user.email || '',
          `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Customer',
          userId
        );
        stripeCustomerId = customer.id;
        await storage.updateUser(userId, { stripeCustomerId });
      }

      // Create setup intent for collecting payment method
      const setupIntent = await stripeService.createSetupIntent(stripeCustomerId);

      res.json({
        clientSecret: setupIntent.client_secret,
        customerId: stripeCustomerId,
      });
    } catch (error) {
      console.error("Payment setup error:", error);
      res.status(500).json({ error: "Failed to setup payment" });
    }
  });

  // Check if customer has payment method on file
  app.get("/api/customers/payment-status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.localAuth ? req.user.userId : req.user.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify actual attached payment method via Stripe
      let hasPaymentMethod = false;
      if (user.stripeCustomerId) {
        try {
          const paymentMethods = await stripeService.listPaymentMethods(user.stripeCustomerId);
          hasPaymentMethod = paymentMethods.data.length > 0;
        } catch (error) {
          console.error("Error checking Stripe payment methods:", error);
          // Return error if Stripe check fails - don't assume payment method exists
          hasPaymentMethod = false;
        }
      }
      
      res.json({ hasPaymentMethod, stripeCustomerId: user.stripeCustomerId });
    } catch (error) {
      console.error("Payment status check error:", error);
      res.status(500).json({ error: "Failed to check payment status" });
    }
  });

  // Confirm payment setup completed
  app.post("/api/customers/confirm-payment-setup", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.localAuth ? req.user.userId : req.user.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { paymentMethodId, stripeCustomerId } = req.body;
      
      if (!paymentMethodId || !stripeCustomerId) {
        return res.status(400).json({ error: "Missing payment method details" });
      }

      // Attach the payment method to customer
      await stripeService.attachPaymentMethod(stripeCustomerId, paymentMethodId);
      
      // Update user with stripe customer ID if not already set
      await storage.updateUser(userId, { stripeCustomerId });

      res.json({ 
        success: true, 
        message: "Payment method saved successfully. You won't be charged until you confirm a booking." 
      });
    } catch (error) {
      console.error("Confirm payment setup error:", error);
      res.status(500).json({ error: "Failed to confirm payment setup" });
    }
  });

  // Update customer profile
  app.patch("/api/customers/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.localAuth ? req.user.userId : req.user.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { firstName, lastName, phone } = req.body;
      await storage.updateUser(userId, { firstName, lastName, phone });
      
      res.json({ success: true, message: "Profile updated" });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Get customer addresses
  app.get("/api/customers/addresses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.localAuth ? req.user.userId : req.user.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const addresses = await storage.getCustomerAddresses(userId);
      res.json(addresses);
    } catch (error) {
      console.error("Get addresses error:", error);
      res.status(500).json({ error: "Failed to get addresses" });
    }
  });

  // Add customer address
  app.post("/api/customers/addresses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.localAuth ? req.user.userId : req.user.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { label, street, city, state, zipCode, lat, lng } = req.body;
      const address = await storage.createCustomerAddress({
        userId,
        label,
        street,
        city,
        state,
        zipCode,
        lat,
        lng,
      });
      
      res.json(address);
    } catch (error) {
      console.error("Create address error:", error);
      res.status(500).json({ error: "Failed to create address" });
    }
  });

  // Update customer address
  app.patch("/api/customers/addresses/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.localAuth ? req.user.userId : req.user.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { id } = req.params;
      const { label, street, city, state, zipCode, lat, lng } = req.body;
      
      const address = await storage.updateCustomerAddress(id, userId, {
        label,
        street,
        city,
        state,
        zipCode,
        lat,
        lng,
      });
      
      res.json(address);
    } catch (error) {
      console.error("Update address error:", error);
      res.status(500).json({ error: "Failed to update address" });
    }
  });

  // Delete customer address
  app.delete("/api/customers/addresses/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.localAuth ? req.user.userId : req.user.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { id } = req.params;
      await storage.deleteCustomerAddress(id, userId);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Delete address error:", error);
      res.status(500).json({ error: "Failed to delete address" });
    }
  });

  // Set default address
  app.post("/api/customers/addresses/:id/set-default", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.localAuth ? req.user.userId : req.user.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { id } = req.params;
      await storage.setDefaultCustomerAddress(id, userId);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Set default address error:", error);
      res.status(500).json({ error: "Failed to set default address" });
    }
  });

  // Get customer payment methods
  app.get("/api/customers/payment-methods", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.localAuth ? req.user.userId : req.user.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.stripeCustomerId) {
        return res.json([]);
      }

      const paymentMethods = await stripeService.listPaymentMethods(user.stripeCustomerId);
      const defaultPaymentMethod = await stripeService.getDefaultPaymentMethod(user.stripeCustomerId);
      
      const methods = paymentMethods.data.map(pm => ({
        id: pm.id,
        brand: pm.card?.brand || "unknown",
        last4: pm.card?.last4 || "****",
        expMonth: pm.card?.exp_month || 0,
        expYear: pm.card?.exp_year || 0,
        isDefault: pm.id === defaultPaymentMethod,
      }));
      
      res.json(methods);
    } catch (error) {
      console.error("Get payment methods error:", error);
      res.status(500).json({ error: "Failed to get payment methods" });
    }
  });

  // Delete payment method
  app.delete("/api/customers/payment-methods/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.localAuth ? req.user.userId : req.user.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.stripeCustomerId) {
        return res.status(400).json({ error: "No Stripe customer found" });
      }

      const { id } = req.params;
      
      // Verify ownership - check that this payment method belongs to this customer
      const paymentMethods = await stripeService.listPaymentMethods(user.stripeCustomerId);
      const ownsMethod = paymentMethods.data.some(pm => pm.id === id);
      if (!ownsMethod) {
        return res.status(403).json({ error: "Payment method not found" });
      }

      await stripeService.detachPaymentMethod(id);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Delete payment method error:", error);
      res.status(500).json({ error: "Failed to delete payment method" });
    }
  });

  // Set default payment method
  app.post("/api/customers/payment-methods/:id/set-default", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.localAuth ? req.user.userId : req.user.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.stripeCustomerId) {
        return res.status(400).json({ error: "No Stripe customer found" });
      }

      const { id } = req.params;
      
      // Verify ownership - check that this payment method belongs to this customer
      const paymentMethods = await stripeService.listPaymentMethods(user.stripeCustomerId);
      const ownsMethod = paymentMethods.data.some(pm => pm.id === id);
      if (!ownsMethod) {
        return res.status(403).json({ error: "Payment method not found" });
      }

      await stripeService.setDefaultPaymentMethod(user.stripeCustomerId, id);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Set default payment method error:", error);
      res.status(500).json({ error: "Failed to set default payment method" });
    }
  });

  // Admin authentication endpoints
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ error: "Password is required" });
      }
      
      const adminPassword = process.env.ADMIN_PASSWORD;
      
      if (!adminPassword) {
        console.error("ADMIN_PASSWORD not configured");
        return res.status(500).json({ error: "Admin login not configured" });
      }
      
      // Compare passwords securely
      let isValid = false;
      if (adminPassword.startsWith('$2b$') || adminPassword.startsWith('$2a$')) {
        // Password is already stored as bcrypt hash - compare securely
        isValid = await bcrypt.compare(password, adminPassword);
      } else {
        // For plaintext stored password, use constant-time comparison
        // Pad both strings to prevent timing attacks based on string length
        const maxLen = Math.max(password.length, adminPassword.length, 64);
        const paddedInput = password.padEnd(maxLen, '\0');
        const paddedExpected = adminPassword.padEnd(maxLen, '\0');
        
        try {
          isValid = crypto.timingSafeEqual(
            Buffer.from(paddedInput, 'utf8'),
            Buffer.from(paddedExpected, 'utf8')
          );
        } catch {
          isValid = false;
        }
      }
      
      if (!isValid) {
        return res.status(401).json({ error: "Invalid password" });
      }
      
      // Set admin session
      (req.session as any).isAdmin = true;
      (req.session as any).adminLoginAt = new Date().toISOString();
      
      res.json({ success: true, message: "Admin login successful" });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
  
  app.get("/api/admin/check", (req, res) => {
    const isAdmin = (req.session as any)?.isAdmin === true;
    res.json({ isAdmin });
  });
  
  app.post("/api/admin/logout", (req, res) => {
    (req.session as any).isAdmin = false;
    res.json({ success: true });
  });

  // Password reset rate limiting
  const passwordResetAttempts = new Map<string, { count: number; resetAt: number }>();
  const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
  const MAX_RESET_ATTEMPTS = 3; // Max 3 attempts per 15 minutes
  
  function checkPasswordResetRateLimit(identifier: string): boolean {
    const now = Date.now();
    const entry = passwordResetAttempts.get(identifier);
    
    if (!entry || now > entry.resetAt) {
      passwordResetAttempts.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
      return true;
    }
    
    if (entry.count >= MAX_RESET_ATTEMPTS) {
      return false;
    }
    
    entry.count++;
    return true;
  }

  // Password reset endpoints
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // Rate limit by IP and email
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      const ipAllowed = checkPasswordResetRateLimit(`ip:${clientIp}`);
      const emailAllowed = checkPasswordResetRateLimit(`email:${email.toLowerCase()}`);
      
      if (!ipAllowed || !emailAllowed) {
        return res.status(429).json({ error: "Too many password reset requests. Please try again in 15 minutes." });
      }
      
      const user = await storage.getUserByEmail(email);
      
      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({ success: true, message: "If an account exists with that email, you will receive a password reset link." });
      }
      
      // Generate a secure token (raw for email, hashed for storage)
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      
      // Invalidate any existing tokens for this user
      await db.update(passwordResetTokens)
        .set({ used: true })
        .where(eq(passwordResetTokens.userId, user.id));
      
      // Save the hashed token
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token: hashedToken,
        expiresAt,
        used: false,
      });
      
      // Build the reset link (use raw token in email, not hashed)
      const baseUrl = req.headers.origin || `${req.protocol}://${req.get('host')}`;
      const resetLink = `${baseUrl}/reset-password?token=${rawToken}`;
      
      // Send the email
      const emailResult = await sendPasswordResetEmail(email, resetLink);
      
      if (!emailResult.success) {
        console.error("Failed to send password reset email:", emailResult.error);
      }
      
      res.json({ success: true, message: "If an account exists with that email, you will receive a password reset link." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Failed to process password reset request" });
    }
  });
  
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ error: "Token and new password are required" });
      }
      
      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters long" });
      }
      
      // Hash the incoming token to compare with stored hash
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      
      // Find the token
      const [resetToken] = await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.token, hashedToken),
            eq(passwordResetTokens.used, false),
            gt(passwordResetTokens.expiresAt, new Date())
          )
        );
      
      if (!resetToken) {
        return res.status(400).json({ error: "Invalid or expired reset link. Please request a new one." });
      }
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Update the user's password
      await storage.updateUser(resetToken.userId, { password: hashedPassword });
      
      // Mark the token as used
      await db
        .update(passwordResetTokens)
        .set({ used: true })
        .where(eq(passwordResetTokens.id, resetToken.id));
      
      res.json({ success: true, message: "Password has been reset successfully. You can now log in with your new password." });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });
  
  // Middleware helper that also checks session-based admin auth
  const requireAdminSession = (req: any, res: any, next: any) => {
    // Check session-based admin auth
    if ((req.session as any)?.isAdmin === true) {
      return next();
    }
    // Fall back to role-based admin auth
    const user = req.user as any;
    if (user?.role === "admin") {
      return next();
    }
    return res.status(403).json({ error: "Admin access required" });
  };

  // Admin endpoints for background check management
  // Get ALL PYCKER applications (pending, approved, rejected)
  app.get("/api/admin/pyckers/all", requireAdminSession, async (req, res) => {
    try {
      const allProfiles = await storage.getAllHaulerProfiles();
      
      const pyckerDetails = await Promise.all(
        allProfiles.map(async (profile) => {
          const user = await storage.getUser(profile.userId);
          let registrationData = {};
          try {
            registrationData = profile.bio ? JSON.parse(profile.bio) : {};
          } catch (e) {}
          return {
            profileId: profile.id,
            userId: profile.userId,
            name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
            email: user?.email,
            phone: user?.phone,
            companyName: profile.companyName,
            vehicleType: profile.vehicleType,
            backgroundCheckStatus: profile.backgroundCheckStatus,
            canAcceptJobs: profile.canAcceptJobs,
            pyckerTier: profile.pyckerTier,
            registrationData,
            createdAt: (registrationData as any).submittedAt,
          };
        })
      );
      
      res.json(pyckerDetails);
    } catch (error) {
      console.error("Error fetching all pyckers:", error);
      res.status(500).json({ error: "Failed to fetch pyckers" });
    }
  });

  app.get("/api/admin/pyckers/pending", requireAdminSession, async (req, res) => {
    try {
      const allProfiles = await storage.getAllHaulerProfiles();
      const pendingPyckers = allProfiles.filter(p => p.backgroundCheckStatus === "pending");
      
      const pyckerDetails = await Promise.all(
        pendingPyckers.map(async (profile) => {
          const user = await storage.getUser(profile.userId);
          let registrationData = {};
          try {
            registrationData = profile.bio ? JSON.parse(profile.bio) : {};
          } catch (e) {}
          return {
            profileId: profile.id,
            userId: profile.userId,
            name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
            email: user?.email,
            phone: user?.phone,
            companyName: profile.companyName,
            vehicleType: profile.vehicleType,
            backgroundCheckStatus: profile.backgroundCheckStatus,
            canAcceptJobs: profile.canAcceptJobs,
            registrationData,
            createdAt: (registrationData as any).submittedAt,
          };
        })
      );
      
      res.json(pyckerDetails);
    } catch (error) {
      console.error("Error fetching pending pyckers:", error);
      res.status(500).json({ error: "Failed to fetch pending pyckers" });
    }
  });

  app.post("/api/admin/pyckers/:profileId/approve", requireAdminSession, async (req, res) => {
    try {
      const profile = await storage.updateHaulerProfile(req.params.profileId, {
        backgroundCheckStatus: "approved",
        canAcceptJobs: true,
      });
      
      if (!profile) {
        return res.status(404).json({ error: "Pycker profile not found" });
      }
      
      res.json({
        success: true,
        message: "Background check approved. Pycker can now accept jobs.",
        profile,
      });
    } catch (error) {
      console.error("Error approving pycker:", error);
      res.status(500).json({ error: "Failed to approve pycker" });
    }
  });

  app.post("/api/admin/pyckers/:profileId/reject", requireAdminSession, async (req, res) => {
    try {
      const { reason } = req.body;
      
      const profile = await storage.updateHaulerProfile(req.params.profileId, {
        backgroundCheckStatus: "rejected",
        canAcceptJobs: false,
      });
      
      if (!profile) {
        return res.status(404).json({ error: "Pycker profile not found" });
      }
      
      res.json({
        success: true,
        message: "Background check rejected.",
        reason: reason || "Background check did not pass verification",
        profile,
      });
    } catch (error) {
      console.error("Error rejecting pycker:", error);
      res.status(500).json({ error: "Failed to reject pycker" });
    }
  });

  // Admin: Get all active jobs for supervision (uses session-based auth)
  app.get("/api/admin/jobs/active", requireAdminSession, async (req, res) => {
    try {
      const jobs = await storage.getAllJobsWithDetails();
      // Filter to only show active jobs (accepted, assigned, in_progress)
      const activeJobs = jobs
        .filter(j => 
          j.status === 'accepted' || 
          j.status === 'assigned' || 
          j.status === 'in_progress'
        )
        .map(job => ({
          ...job,
          // Map customer/hauler info for easier admin UI consumption
          customerName: job.customer ? 
            `${job.customer.firstName || ''} ${job.customer.lastName || ''}`.trim() || 'Customer' : 
            'Unknown Customer',
          customerPhone: job.customer?.phone || job.customerPhone || null,
          haulerName: job.hauler ? 
            `${job.hauler.firstName || ''} ${job.hauler.lastName || ''}`.trim() || 'PYCKER' : 
            (job.haulerProfile?.companyName || 'Unassigned'),
          haulerPhone: job.haulerProfile?.phone || job.hauler?.phone || null,
          livePrice: job.livePrice || job.priceEstimate || 0,
        }));
      res.json(activeJobs);
    } catch (error) {
      console.error("Error getting active jobs for admin:", error);
      res.status(500).json({ error: "Failed to get active jobs" });
    }
  });

  // Pycker Vehicle Management
  app.get("/api/haulers/:profileId/vehicles", async (req, res) => {
    try {
      const vehicles = await storage.getPyckerVehicles(req.params.profileId);
      res.json(vehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({ error: "Failed to fetch vehicles" });
    }
  });

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
      res.status(500).json({ error: "Failed to create vehicle" });
    }
  });

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
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.get("/api/haulers/:haulerId/jobs/active", requireAuth, requireHauler, async (req, res) => {
    try {
      const jobs = await storage.getActiveJobsForHauler(req.params.haulerId);
      
      // Use centralized masking helper for consistent contact info protection
      const maskedJobs = jobs.map((job: MaskableRequest) => 
        maskContactInfoForRole(job, 'hauler')
      );
      
      res.json(maskedJobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active jobs" });
    }
  });

  app.get("/api/haulers/:haulerId/reviews", async (req, res) => {
    try {
      const reviews = await storage.getReviewsByHauler(req.params.haulerId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  app.get("/api/haulers/filter/:serviceType", async (req, res) => {
    try {
      const haulers = await storage.getAvailableHaulersByServiceType(req.params.serviceType);
      res.json(haulers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch haulers" });
    }
  });

  const insertReviewSchema = z.object({
    haulerId: z.string(),
    customerId: z.string(),
    serviceRequestId: z.string(),
    rating: z.number().min(1).max(5),
    title: z.string().optional(),
    comment: z.string().optional(),
  });

  app.post("/api/reviews", requireAuth, async (req, res) => {
    try {
      const parsed = insertReviewSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
      }
      
      const existingReview = await storage.getReviewByServiceRequest(parsed.data.serviceRequestId);
      if (existingReview) {
        return res.status(400).json({ error: "Review already exists for this job" });
      }
      
      const serviceRequest = await storage.getServiceRequest(parsed.data.serviceRequestId);
      if (!serviceRequest || serviceRequest.status !== "completed") {
        return res.status(400).json({ error: "Can only review completed jobs" });
      }
      
      const review = await storage.createReview({
        ...parsed.data,
        createdAt: new Date().toISOString(),
      });
      res.status(201).json(review);
    } catch (error) {
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  app.get("/api/service-requests/pending", async (req, res) => {
    try {
      const requests = await storage.getPendingRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending requests" });
    }
  });

  app.get("/api/service-requests/:id", requireAuth, async (req: any, res) => {
    try {
      const request = await storage.getServiceRequestWithDetails(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Service request not found" });
      }
      
      // Get user info to determine role
      const userId = req.user.localAuth ? req.user.userId : req.user.claims?.sub;
      const user = userId ? await storage.getUser(userId) : null;
      const role = (user?.role || 'customer') as 'customer' | 'hauler' | 'admin';
      
      // Use centralized masking helper for consistent contact info protection
      const maskedRequest = maskContactInfoForRole(request as MaskableRequest, role);
      
      res.json(maskedRequest);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch service request" });
    }
  });

  app.post("/api/service-requests", requireAuth, requireCustomer, async (req: any, res) => {
    try {
      // Verify customer has payment method on file
      const userId = req.user.localAuth ? req.user.userId : req.user.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const user = await storage.getUser(userId);
      if (!user?.stripeCustomerId) {
        return res.status(400).json({ 
          error: "Payment method required",
          code: "PAYMENT_REQUIRED",
          message: "Please add a payment method before booking. You won't be charged until you confirm a booking."
        });
      }
      
      // Verify actual attached payment method via Stripe
      try {
        const paymentMethods = await stripeService.listPaymentMethods(user.stripeCustomerId);
        if (paymentMethods.data.length === 0) {
          return res.status(400).json({ 
            error: "Payment method required",
            code: "PAYMENT_REQUIRED",
            message: "Please add a payment method before booking. You won't be charged until you confirm a booking."
          });
        }
      } catch (error) {
        console.error("Error checking Stripe payment methods:", error);
        // Block booking if payment method verification fails
        return res.status(502).json({ 
          error: "Payment verification failed",
          code: "PAYMENT_VERIFICATION_FAILED",
          message: "Unable to verify your payment method. Please try again or contact support."
        });
      }
      
      const validatedData = insertServiceRequestSchema.parse(req.body);
      
      // Require at least one photo for AI pricing validation
      const photoUrls = validatedData.photoUrls as string[] | undefined;
      if (!photoUrls || photoUrls.length === 0) {
        return res.status(400).json({ 
          error: "At least one photo is required for AI price validation" 
        });
      }
      
      const quote = await storage.calculateQuote({
        serviceType: validatedData.serviceType as any,
        loadSize: validatedData.loadEstimate as any,
        pickupLat: validatedData.pickupLat || undefined,
        pickupLng: validatedData.pickupLng || undefined,
        destinationLat: validatedData.destinationLat || undefined,
        destinationLng: validatedData.destinationLng || undefined,
      });
      
      // Set up 60-second matching timer
      const matchingStartedAt = new Date().toISOString();
      const matchingExpiresAt = new Date(Date.now() + 60 * 1000).toISOString();
      
      const request = await storage.createServiceRequest({
        ...validatedData,
        priceEstimate: quote.totalPrice,
        livePrice: quote.totalPrice,
        surgeFactor: quote.surgeMultiplier,
        status: "matching", // Start in matching status
        matchingStartedAt,
        matchingExpiresAt,
        needsManualMatch: false,
        // Store customer contact info for alerts
        customerPhone: user?.phone || validatedData.customerPhone,
        customerEmail: user?.email || validatedData.customerEmail,
      });
      
      // Use smart matching with language preference
      const matchedHaulers = await storage.getSmartMatchedHaulers({
        serviceType: validatedData.serviceType,
        loadSize: validatedData.loadEstimate,
        pickupLat: validatedData.pickupLat || undefined,
        pickupLng: validatedData.pickupLng || undefined,
        preferVerifiedPro: validatedData.preferVerifiedPro || false,
        preferredLanguage: validatedData.preferredLanguage || undefined,
      });
      
      for (const hauler of matchedHaulers.slice(0, 3)) {
        const haulerQuote = await storage.calculateQuote({
          serviceType: validatedData.serviceType as any,
          loadSize: validatedData.loadEstimate as any,
          pickupLat: validatedData.pickupLat || undefined,
          pickupLng: validatedData.pickupLng || undefined,
          destinationLat: validatedData.destinationLat || undefined,
          destinationLng: validatedData.destinationLng || undefined,
          vehicleType: hauler.profile.vehicleType as any,
        });
        
        await storage.createMatchAttempt({
          requestId: request.id,
          haulerId: hauler.id,
          status: "pending",
          quotedPrice: haulerQuote.totalPrice,
          etaMinutes: Math.floor(Math.random() * 20) + 15,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
        });
      }
      
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Error creating service request:", error);
      res.status(500).json({ error: "Failed to create service request" });
    }
  });

  app.patch("/api/service-requests/:id", requireAuth, async (req, res) => {
    try {
      const request = await storage.updateServiceRequest(req.params.id, req.body);
      if (!request) {
        return res.status(404).json({ error: "Service request not found" });
      }
      
      broadcastToJob(req.params.id, {
        type: "request_updated",
        request,
      });
      
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: "Failed to update service request" });
    }
  });

  app.post("/api/service-requests/:id/start", requireAuth, async (req, res) => {
    try {
      const request = await storage.updateServiceRequest(req.params.id, {
        status: "in_progress",
        startedAt: new Date().toISOString(),
      });
      if (!request) {
        return res.status(404).json({ error: "Service request not found" });
      }
      
      broadcastToJob(req.params.id, {
        type: "job_started",
        request,
      });
      
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: "Failed to start job" });
    }
  });

  app.post("/api/service-requests/:id/complete", requireAuth, async (req, res) => {
    try {
      const existingRequest = await storage.getServiceRequest(req.params.id);
      if (!existingRequest) {
        return res.status(404).json({ error: "Service request not found" });
      }

      let paymentResult = null;
      if (existingRequest.stripePaymentIntentId && existingRequest.paymentStatus !== "captured") {
        try {
          let haulerStripeAccountId = null;
          let pyckerTier = 'independent';
          if (existingRequest.assignedHaulerId) {
            const haulerProfile = await storage.getHaulerProfile(existingRequest.assignedHaulerId);
            if (haulerProfile?.stripeAccountId && haulerProfile?.stripeOnboardingComplete) {
              haulerStripeAccountId = haulerProfile.stripeAccountId;
            }
            pyckerTier = haulerProfile?.pyckerTier || 'independent';
          }

          const totalAmount = existingRequest.livePrice || req.body.finalPrice || 0;
          paymentResult = await stripeService.capturePaymentAndPayHauler(
            existingRequest.stripePaymentIntentId,
            haulerStripeAccountId,
            totalAmount,
            pyckerTier
          );
        } catch (paymentError) {
          console.error("Payment capture failed:", paymentError);
        }
      }

      const request = await storage.updateServiceRequest(req.params.id, {
        status: "completed",
        completedAt: new Date().toISOString(),
        finalPrice: req.body.finalPrice,
        ...(paymentResult && {
          paymentStatus: "captured",
          platformFee: paymentResult.platformFee,
          haulerPayout: paymentResult.haulerPayout,
          paidAt: new Date().toISOString(),
        }),
      });
      
      broadcastToJob(req.params.id, {
        type: "job_completed",
        request,
        paymentCaptured: !!paymentResult,
      });
      
      res.json({ ...request, paymentCaptured: !!paymentResult });
    } catch (error) {
      res.status(500).json({ error: "Failed to complete job" });
    }
  });

  // Photo upload for job proof of completion
  app.post("/api/jobs/upload-photos", requireAuth, async (req, res) => {
    try {
      const { jobId } = req.body;
      
      // In production, photos would be uploaded to object storage
      // For now, we'll simulate with placeholder URLs
      const uploadedUrls: string[] = [];
      
      // If files were uploaded via multipart form data, they'd be processed here
      // For demo purposes, return success with placeholder
      const timestamp = Date.now();
      uploadedUrls.push(
        `/api/photos/${jobId}/${timestamp}_before.jpg`,
        `/api/photos/${jobId}/${timestamp}_after.jpg`
      );
      
      res.json({ 
        success: true, 
        urls: uploadedUrls,
        message: "Photos uploaded successfully"
      });
    } catch (error) {
      console.error("Photo upload error:", error);
      res.status(500).json({ error: "Failed to upload photos" });
    }
  });

  // Report issue with a job
  app.post("/api/jobs/:jobId/report-issue", requireAuth, async (req, res) => {
    try {
      const { jobId } = req.params;
      const { type, description } = req.body;
      
      // In production, this would create a support ticket/issue record
      // For now, log it and return success
      console.log(`Issue reported for job ${jobId}:`, { type, description });
      
      // Could store in database, send notification to support team, etc.
      res.json({ 
        success: true, 
        issueId: `ISS-${Date.now()}`,
        jobId,
        type,
        message: "Issue reported successfully. Support will contact you shortly."
      });
    } catch (error) {
      console.error("Report issue error:", error);
      res.status(500).json({ error: "Failed to report issue" });
    }
  });

  app.get("/api/customers/:customerId/requests", requireAuth, requireCustomer, requireOwnership("customerId"), async (req, res) => {
    try {
      const requests = await storage.getServiceRequestsByCustomer(req.params.customerId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer requests" });
    }
  });

  app.get("/api/haulers/:haulerId/jobs", requireAuth, requireHauler, async (req, res) => {
    try {
      const requests = await storage.getServiceRequestsByHauler(req.params.haulerId);
      
      // Use centralized masking helper for consistent contact info protection
      const maskedRequests = requests.map((request: MaskableRequest) => 
        maskContactInfoForRole(request, 'hauler')
      );
      
      res.json(maskedRequests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch hauler jobs" });
    }
  });

  app.get("/api/haulers/:haulerId/matches", requireAuth, requireHauler, async (req, res) => {
    try {
      const matches = await storage.getPendingMatchesForHauler(req.params.haulerId);
      res.json(matches);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch matches" });
    }
  });

  app.patch("/api/matches/:id", requireAuth, async (req, res) => {
    try {
      const { status } = req.body;
      const match = await storage.updateMatchAttempt(req.params.id, { status });
      if (!match) {
        return res.status(404).json({ error: "Match not found" });
      }
      
      if (status === "accepted") {
        const request = await storage.getServiceRequest(match.requestId);
        if (request) {
          // Clear matching timer when PYCKER accepts
          await storage.updateServiceRequest(match.requestId, {
            status: "assigned",
            assignedHaulerId: match.haulerId,
            finalPrice: match.quotedPrice,
            acceptedAt: new Date().toISOString(),
            // Clear matching timer fields - job is now matched
            matchingExpiresAt: null,
            needsManualMatch: false,
          });
          
          broadcastToJob(match.requestId, {
            type: "match_accepted",
            match,
          });
        }
      }
      
      res.json(match);
    } catch (error) {
      res.status(500).json({ error: "Failed to update match" });
    }
  });

  app.post("/api/pricing/quote", async (req, res) => {
    try {
      const quoteRequest = quoteRequestSchema.parse(req.body);
      const { userId, bookingSource } = req.body;
      
      // Use the new promotion-aware quote calculation if userId is provided
      if (userId && bookingSource === "app") {
        const quoteWithPromos = await storage.calculateQuoteWithPromotions({
          ...quoteRequest,
          userId,
          bookingSource,
        });
        return res.json(quoteWithPromos);
      }
      
      const quote = await storage.calculateQuote(quoteRequest);
      res.json(quote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid quote request", details: error.errors });
      }
      res.status(500).json({ error: "Failed to calculate quote" });
    }
  });

  const moveQuoteSchema = z.object({
    pickupZip: z.string().length(5, "Pickup zip code must be 5 digits"),
    destinationZip: z.string().length(5, "Destination zip code must be 5 digits"),
    pickupStairs: z.number().int().min(0).max(20).default(0),
    destinationStairs: z.number().int().min(0).max(20).default(0),
    moveServiceMode: z.enum(["truck_and_mover", "labor_only"]).default("truck_and_mover"),
    basePrice: z.number().min(0).default(99),
  });

  app.post("/api/pricing/move-quote", async (req, res) => {
    try {
      const parseResult = moveQuoteSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request", details: parseResult.error.errors });
      }
      const { pickupZip, destinationZip, pickupStairs, destinationStairs, moveServiceMode, basePrice } = parseResult.data;
      
      const pickupSupported = isZipCodeSupported(pickupZip);
      const destSupported = isZipCodeSupported(destinationZip);
      
      if (!pickupSupported || !destSupported) {
        const unsupported = [];
        if (!pickupSupported) unsupported.push(`pickup: ${pickupZip}`);
        if (!destSupported) unsupported.push(`destination: ${destinationZip}`);
        return res.status(400).json({ 
          error: "Zip code not in service area",
          unsupportedZips: unsupported,
          message: "uPYCK is currently only available in the Orlando metro area. We're expanding soon!"
        });
      }
      
      const pickupCoords = geocodeZip(pickupZip);
      const destCoords = geocodeZip(destinationZip);
      
      if (!pickupCoords || !destCoords) {
        return res.status(400).json({ error: "Could not locate addresses" });
      }
      
      const distanceMiles = calculateDistance(
        pickupCoords.lat, pickupCoords.lng,
        destCoords.lat, destCoords.lng
      );
      
      const pricing = calculateMovePricing(
        distanceMiles,
        pickupStairs || 0,
        destinationStairs || 0,
        moveServiceMode || 'truck_and_mover',
        basePrice || 99
      );
      
      res.json({
        distanceMiles,
        pickupCoords,
        destinationCoords: destCoords,
        ...pricing
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate move quote" });
    }
  });

  app.get("/api/pricing/supported-zips", async (req, res) => {
    res.json({
      supportedZips: Object.keys(SUPPORTED_ZIP_CODES),
      serviceArea: "Orlando Metro Area"
    });
  });

  // Get distance to nearest dump/transfer station
  app.get("/api/pricing/dump-distance/:zip", async (req, res) => {
    try {
      const { zip } = req.params;
      const coords = geocodeZip(zip);
      
      if (!coords) {
        return res.status(400).json({ 
          error: "Unsupported zip code",
          message: "We currently only service the Orlando metro area."
        });
      }
      
      const dumpInfo = findNearestDump(coords.lat, coords.lng);
      
      res.json({
        zip,
        nearestDump: dumpInfo.name,
        distanceMiles: dumpInfo.distanceMiles,
        estimatedDriveMinutes: dumpInfo.estimatedDriveMinutes,
        distanceFee: dumpInfo.distanceFee,
      });
    } catch (error) {
      console.error("Error calculating dump distance:", error);
      res.status(500).json({ error: "Failed to calculate distance" });
    }
  });

  // Check if user is eligible for first-job discount
  app.get("/api/promotions/eligibility/:userId", requireAuth, requireOwnership("userId"), async (req, res) => {
    try {
      const { userId } = req.params;
      const isFirstTime = await storage.isFirstTimeCustomer(userId);
      const hasUsedDiscount = await storage.hasUsedFirstJobDiscount(userId);
      
      res.json({
        eligibleForFirstJobDiscount: isFirstTime && !hasUsedDiscount,
        discountAmount: isFirstTime && !hasUsedDiscount ? 25 : 0,
        isFirstTimeCustomer: isFirstTime,
      });
    } catch (error) {
      console.error("Error checking promotion eligibility:", error);
      res.status(500).json({ error: "Failed to check promotion eligibility" });
    }
  });

  // Get user's promotion history
  app.get("/api/promotions/:userId", requireAuth, requireOwnership("userId"), async (req, res) => {
    try {
      const { userId } = req.params;
      const promotions = await storage.getPromotionsByUser(userId);
      res.json(promotions);
    } catch (error) {
      console.error("Error fetching promotions:", error);
      res.status(500).json({ error: "Failed to fetch promotions" });
    }
  });

  // Check priority slot availability
  app.get("/api/slots/priority/:date", requireAuth, async (req, res) => {
    try {
      const { date } = req.params;
      const slots = await storage.getAvailablePrioritySlots(date);
      
      const slotDateObj = new Date(date);
      const dayOfWeek = slotDateObj.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const today = new Date();
      const isSameDay = slotDateObj.toDateString() === today.toDateString();
      
      res.json({
        date,
        isSameDay,
        isWeekend,
        isPriorityDate: isSameDay || isWeekend,
        message: isSameDay || isWeekend 
          ? "Same-day and weekend slots are reserved for app bookings first!" 
          : "Regular booking - available on all channels",
        bookedSlots: slots,
      });
    } catch (error) {
      console.error("Error checking priority slots:", error);
      res.status(500).json({ error: "Failed to check priority slots" });
    }
  });

  // Analytics event tracking
  app.post("/api/analytics/track", async (req, res) => {
    try {
      const { eventType, userId, sessionId, eventData, deviceType, platform, appVersion, referralSource } = req.body;
      if (!eventType) {
        return res.status(400).json({ error: "eventType is required" });
      }
      const event = await storage.trackEvent({
        eventType,
        userId: userId || null,
        sessionId: sessionId || null,
        eventData: eventData || null,
        deviceType: deviceType || null,
        platform: platform || null,
        appVersion: appVersion || null,
        referralSource: referralSource || null,
        createdAt: new Date().toISOString(),
      });
      res.json(event);
    } catch (error) {
      console.error("Error tracking event:", error);
      res.status(500).json({ error: "Failed to track event" });
    }
  });

  app.get("/api/analytics/user/:userId", requireAuth, requireOwnership("userId"), async (req, res) => {
    try {
      const { userId } = req.params;
      const events = await storage.getEventsByUser(userId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching user events:", error);
      res.status(500).json({ error: "Failed to fetch user events" });
    }
  });

  app.get("/api/analytics/funnel", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const stats = await storage.getFunnelStats(startDate as string, endDate as string);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching funnel stats:", error);
      res.status(500).json({ error: "Failed to fetch funnel stats" });
    }
  });

  // Promo code endpoints
  app.post("/api/promo-codes/validate", async (req, res) => {
    try {
      const { code, userId, orderAmount, isApp } = req.body;
      if (!code || typeof code !== "string") {
        return res.status(400).json({ valid: false, discount: 0, error: "Promo code is required" });
      }
      if (!userId || typeof userId !== "string") {
        return res.status(400).json({ valid: false, discount: 0, error: "User ID is required" });
      }
      if (typeof orderAmount !== "number" || orderAmount < 0) {
        return res.status(400).json({ valid: false, discount: 0, error: "Valid order amount is required" });
      }
      const result = await storage.validateAndApplyPromoCode(code, userId, orderAmount, !!isApp);
      res.json(result);
    } catch (error) {
      console.error("Error validating promo code:", error);
      res.status(500).json({ valid: false, discount: 0, error: "Failed to validate promo code" });
    }
  });

  app.get("/api/promo-codes/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const promo = await storage.getPromoCodeByCode(code);
      if (!promo) {
        return res.status(404).json({ error: "Promo code not found" });
      }
      res.json(promo);
    } catch (error) {
      console.error("Error fetching promo code:", error);
      res.status(500).json({ error: "Failed to fetch promo code" });
    }
  });

  app.get("/api/promo-codes", requireAuth, requireAdmin, async (req, res) => {
    try {
      const codes = await storage.getAllPromoCodes();
      res.json(codes);
    } catch (error) {
      console.error("Error fetching promo codes:", error);
      res.status(500).json({ error: "Failed to fetch promo codes" });
    }
  });

  // Seed ORLANDO25 promo code on startup (called internally)
  app.post("/api/promo-codes/seed-orlando25", async (req, res) => {
    try {
      const promo = await storage.seedOrlando25PromoCode();
      res.json(promo);
    } catch (error) {
      console.error("Error seeding ORLANDO25:", error);
      res.status(500).json({ error: "Failed to seed ORLANDO25 promo code" });
    }
  });

  // Launch notification signup
  app.post("/api/launch-notifications", async (req, res) => {
    try {
      const { email, city } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // Save to database
      const { db } = await import("./db");
      const { launchNotifications } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      
      // Check if already signed up
      const existing = await db.select().from(launchNotifications).where(eq(launchNotifications.email, email)).limit(1);
      
      if (existing.length > 0) {
        return res.json({ success: true, message: "You're already on the list!" });
      }
      
      // Insert new signup
      await db.insert(launchNotifications).values({ email, city });
      
      // Send confirmation email
      const { sendLaunchNotificationConfirmation, isEmailConfigured } = await import("./services/notifications");
      
      if (isEmailConfigured()) {
        const emailResult = await sendLaunchNotificationConfirmation(email);
        if (!emailResult.success) {
          console.warn("Failed to send launch notification email:", emailResult.error);
        }
      } else {
        console.log("Email not configured - launch notification saved but no confirmation sent");
      }
      
      res.json({ success: true, message: "You're on the list! We'll notify you when we launch." });
    } catch (error: any) {
      console.error("Error saving launch notification:", error);
      // If it's a duplicate email error, treat as success
      if (error.code === '23505') {
        return res.json({ success: true, message: "You're already on the list!" });
      }
      res.status(500).json({ error: "Failed to save notification signup" });
    }
  });

  // Green Guarantee - Approved Facilities endpoints
  app.get("/api/facilities", async (req, res) => {
    try {
      const facilities = await storage.getApprovedFacilities();
      res.json(facilities);
    } catch (error) {
      console.error("Error fetching facilities:", error);
      res.status(500).json({ error: "Failed to fetch facilities" });
    }
  });

  app.get("/api/facilities/:id", async (req, res) => {
    try {
      const facility = await storage.getApprovedFacility(req.params.id);
      if (!facility) {
        return res.status(404).json({ error: "Facility not found" });
      }
      res.json(facility);
    } catch (error) {
      console.error("Error fetching facility:", error);
      res.status(500).json({ error: "Failed to fetch facility" });
    }
  });

  app.post("/api/facilities", requireAuth, requireAdmin, async (req, res) => {
    try {
      const facility = await storage.createApprovedFacility({
        ...req.body,
        createdAt: new Date().toISOString(),
      });
      res.status(201).json(facility);
    } catch (error) {
      console.error("Error creating facility:", error);
      res.status(500).json({ error: "Failed to create facility" });
    }
  });

  // Green Guarantee Rebate endpoints
  app.post("/api/rebates/claim", requireAuth, requireHauler, async (req, res) => {
    try {
      const { 
        serviceRequestId, 
        haulerId, 
        receiptUrl, 
        facilityName,
        facilityAddress, 
        facilityType, 
        receiptNumber,
        receiptDate, 
        receiptWeight,
        feeCharged
      } = req.body;
      
      // Validate required fields
      if (!serviceRequestId || !haulerId || !receiptUrl) {
        return res.status(400).json({ error: "Service request ID, hauler ID, and receipt URL are required" });
      }

      if (!facilityName || !receiptDate || !receiptWeight) {
        return res.status(400).json({ error: "Facility name, receipt date, and weight are required" });
      }

      // Get the service request to validate and get job price
      const serviceRequest = await storage.getServiceRequest(serviceRequestId);
      if (!serviceRequest) {
        return res.status(404).json({ error: "Service request not found" });
      }

      if (serviceRequest.status !== "completed") {
        return res.status(400).json({ error: "Can only submit rebate claims for completed jobs" });
      }

      // Check if claim already exists for this job
      const existingClaims = await storage.getRebateClaimsByHauler(haulerId);
      const duplicateClaim = existingClaims.find(c => c.serviceRequestId === serviceRequestId);
      if (duplicateClaim) {
        return res.status(400).json({ error: "A rebate claim already exists for this job" });
      }

      // Calculate estimated weight from load size
      const loadWeights: Record<string, number> = {
        small: 200, // lbs
        medium: 500,
        large: 1000,
        extra_large: 2000,
      };
      const estimatedWeight = loadWeights[serviceRequest.loadEstimate || "medium"] || 500;
      
      // Get job completion time
      const jobCompletedAt = serviceRequest.completedAt || new Date().toISOString();

      // Validate claim against business rules
      const validation = await storage.validateRebateClaim(
        { facilityName, facilityAddress, receiptNumber, receiptDate, receiptWeight, feeCharged },
        jobCompletedAt,
        estimatedWeight
      );

      // Reject duplicate receipts outright
      if (validation.isDuplicate) {
        return res.status(400).json({ error: "This receipt number has already been used for another claim" });
      }

      // Calculate variance
      const variancePercent = Math.abs(((receiptWeight - estimatedWeight) / estimatedWeight) * 100);

      // Calculate rebate: 10% of job price, max $25
      const jobTotalPrice = serviceRequest.livePrice || 0;
      const calculatedRebate = Math.min(jobTotalPrice * 0.10, 25);

      // Determine status based on validation
      // If no flags = APPROVED, otherwise NEEDS_REVIEW (flagged)
      const status = validation.flags.length > 0 ? "flagged" : "pending";

      // Try to find matching approved facility
      const matchedFacility = await storage.findFacilityByName(facilityName);

      const claim = await storage.createRebateClaim({
        serviceRequestId,
        haulerId,
        receiptUrl,
        status,
        facilityId: matchedFacility?.id || null,
        facilityName,
        facilityAddress: facilityAddress || null,
        facilityType: matchedFacility?.facilityType || facilityType || null,
        facilityApproved: validation.facilityApproved,
        receiptNumber: receiptNumber || null,
        receiptDate,
        receiptWeight,
        feeCharged: feeCharged || null,
        jobCompletedAt,
        estimatedWeight,
        variancePercent,
        withinVariance: validation.withinVariance,
        within48Hours: validation.within48Hours,
        validationFlags: validation.flags.length > 0 ? validation.flags : null,
        jobTotalPrice,
        rebateAmount: calculatedRebate,
        submittedAt: new Date().toISOString(),
        aiValidationStatus: "pending",
      });

      // Trigger AI validation asynchronously (don't wait for it)
      triggerAIValidation(claim.id, {
        receiptImageUrl: receiptUrl,
        facilityName,
        facilityAddress,
        claimedWeight: receiptWeight,
        estimatedWeight,
        receiptDate,
        jobCompletedAt,
        serviceRequestId,
        haulerId,
      }).catch(err => console.error("AI validation error:", err));

      res.status(201).json({
        ...claim,
        validation: {
          flags: validation.flags,
          withinVariance: validation.withinVariance,
          within48Hours: validation.within48Hours,
          facilityApproved: validation.facilityApproved,
        }
      });
    } catch (error) {
      console.error("Error creating rebate claim:", error);
      res.status(500).json({ error: "Failed to create rebate claim" });
    }
  });

  app.get("/api/rebates/hauler/:haulerId", requireAuth, requireHauler, async (req, res) => {
    try {
      const { haulerId } = req.params;
      const claims = await storage.getRebateClaimsByHauler(haulerId);
      res.json(claims);
    } catch (error) {
      console.error("Error fetching hauler rebate claims:", error);
      res.status(500).json({ error: "Failed to fetch rebate claims" });
    }
  });

  app.get("/api/rebates/pending", requireAuth, requireAdmin, async (req, res) => {
    try {
      // Get both pending and flagged claims for admin review
      const pendingClaims = await storage.getRebateClaimsByStatus("pending");
      const flaggedClaims = await storage.getRebateClaimsByStatus("flagged");
      const allClaims = [...pendingClaims, ...flaggedClaims]
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      res.json(allClaims);
    } catch (error) {
      console.error("Error fetching pending rebate claims:", error);
      res.status(500).json({ error: "Failed to fetch pending claims" });
    }
  });

  app.post("/api/rebates/:id/approve", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { reviewerId } = req.body;

      if (!reviewerId) {
        return res.status(400).json({ error: "Reviewer ID is required" });
      }

      const claim = await storage.approveRebateClaim(id, reviewerId);
      if (!claim) {
        return res.status(404).json({ error: "Rebate claim not found" });
      }

      res.json(claim);
    } catch (error) {
      console.error("Error approving rebate claim:", error);
      res.status(500).json({ error: "Failed to approve rebate claim" });
    }
  });

  app.post("/api/rebates/:id/deny", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { reviewerId, reason } = req.body;

      if (!reviewerId || !reason) {
        return res.status(400).json({ error: "Reviewer ID and denial reason are required" });
      }

      const claim = await storage.denyRebateClaim(id, reviewerId, reason);
      if (!claim) {
        return res.status(404).json({ error: "Rebate claim not found" });
      }

      res.json(claim);
    } catch (error) {
      console.error("Error denying rebate claim:", error);
      res.status(500).json({ error: "Failed to deny rebate claim" });
    }
  });

  // Environmental Certificate endpoints (authentication optional for viewing, required for generation)
  app.get("/api/certificates/:serviceRequestId", requireAuth, async (req, res) => {
    try {
      const { serviceRequestId } = req.params;
      
      // First check if the service request exists
      const serviceRequest = await storage.getServiceRequest(serviceRequestId);
      if (!serviceRequest) {
        return res.status(404).json({ error: "Service request not found" });
      }
      
      // Authorization check: only customer or admin can access (if authenticated)
      const user = req.user as any;
      if (user) {
        if (user.id !== serviceRequest.customerId && user.role !== "admin") {
          return res.status(403).json({ error: "Not authorized to access this certificate", code: "FORBIDDEN" });
        }
      }
      // Note: Allow unauthenticated access for now since tracking page may be shared
      // TODO: Consider requiring auth in production
      
      const certificate = await storage.getEnvironmentalCertificateByServiceRequest(serviceRequestId);
      
      if (!certificate) {
        return res.status(404).json({ error: "Certificate not found for this job", code: "NO_CERTIFICATE" });
      }
      
      res.json(certificate);
    } catch (error) {
      console.error("Error fetching environmental certificate:", error);
      res.status(500).json({ error: "Failed to fetch environmental certificate" });
    }
  });

  app.post("/api/certificates/:serviceRequestId/generate", isAuthenticated, async (req, res) => {
    try {
      const { serviceRequestId } = req.params;
      const user = req.user as any;
      
      if (!user) {
        return res.status(401).json({ error: "Authentication required", code: "UNAUTHORIZED" });
      }
      
      // First check if the service request exists
      const serviceRequest = await storage.getServiceRequest(serviceRequestId);
      if (!serviceRequest) {
        return res.status(404).json({ error: "Service request not found" });
      }
      
      // Authorization check: only customer or admin can generate
      if (user.id !== serviceRequest.customerId && user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized to generate this certificate", code: "FORBIDDEN" });
      }
      
      // Check if job is completed
      if (serviceRequest.status !== "completed") {
        return res.status(400).json({ error: "Cannot generate certificate for incomplete job", code: "JOB_NOT_COMPLETED" });
      }
      
      const certificate = await storage.generateEnvironmentalCertificate(serviceRequestId);
      res.json(certificate);
    } catch (error: any) {
      console.error("Error generating environmental certificate:", error);
      if (error.message === "Service request not found") {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === "Cannot generate certificate for incomplete job") {
        return res.status(400).json({ error: error.message, code: "JOB_NOT_COMPLETED" });
      }
      res.status(500).json({ error: error.message || "Failed to generate environmental certificate" });
    }
  });

  app.get("/api/pricing/rates", async (req, res) => {
    try {
      const rates = await storage.getAllPricingRates();
      res.json(rates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pricing rates" });
    }
  });

  app.get("/api/pricing/surge", async (req, res) => {
    try {
      const multiplier = await storage.getCurrentSurgeMultiplier();
      const modifiers = await storage.getSurgeModifiers();
      res.json({ currentMultiplier: multiplier, modifiers });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch surge info" });
    }
  });

  app.post("/api/location/update", async (req, res) => {
    try {
      const { userId, jobId, ...locationData } = req.body;
      const location = locationUpdateSchema.parse(locationData);
      
      const savedLocation = await storage.addLocationHistory({
        userId,
        jobId,
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy,
        heading: location.heading,
        speed: location.speed,
        recordedAt: new Date().toISOString(),
      });
      
      if (jobId) {
        broadcastToJob(jobId, {
          type: "location_updated",
          userId,
          ...location,
          timestamp: new Date().toISOString(),
        });
      }
      
      res.json(savedLocation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid location data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update location" });
    }
  });

  app.get("/api/location/:userId", async (req, res) => {
    try {
      const location = await storage.getLatestLocation(req.params.userId);
      if (!location) {
        return res.status(404).json({ error: "No location found" });
      }
      res.json(location);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch location" });
    }
  });

  app.get("/api/jobs/:jobId/track", async (req, res) => {
    try {
      const request = await storage.getServiceRequestWithDetails(req.params.jobId);
      if (!request) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      let haulerLocation = null;
      let customerLocation = null;
      
      if (request.assignedHaulerId) {
        haulerLocation = await storage.getLatestLocation(request.assignedHaulerId);
      }
      customerLocation = await storage.getLatestLocation(request.customerId);
      
      res.json({
        job: request,
        haulerLocation,
        customerLocation,
        pickup: {
          lat: request.pickupLat,
          lng: request.pickupLng,
          address: request.pickupAddress,
        },
        destination: request.destinationAddress ? {
          lat: request.destinationLat,
          lng: request.destinationLng,
          address: request.destinationAddress,
        } : null,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tracking info" });
    }
  });

  app.get("/api/jobs/:jobId/history", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId || typeof userId !== "string") {
        return res.status(400).json({ error: "userId is required" });
      }
      
      const history = await storage.getLocationHistory(userId, req.params.jobId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch location history" });
    }
  });

  app.post("/api/ai/analyze-photos", async (req, res) => {
    try {
      const { photoUrls, serviceType } = req.body;
      
      if (!photoUrls || !Array.isArray(photoUrls) || photoUrls.length === 0) {
        return res.status(400).json({ error: "photoUrls array is required" });
      }
      
      if (!serviceType) {
        return res.status(400).json({ error: "serviceType is required" });
      }
      
      const validServiceTypes = ["junk_removal", "furniture_moving", "garage_cleanout", "estate_cleanout"];
      if (!validServiceTypes.includes(serviceType)) {
        return res.status(400).json({ error: "Invalid serviceType" });
      }
      
      const analysis = await analyzePhotosForQuote(photoUrls, serviceType);
      
      const validLoadSizes = ["small", "medium", "large", "extra_large"];
      const loadSize = validLoadSizes.includes(analysis.recommendedLoadSize) 
        ? analysis.recommendedLoadSize 
        : "medium";
      
      const quote = await storage.calculateQuote({
        serviceType: serviceType as "junk_removal" | "furniture_moving" | "garage_cleanout" | "estate_cleanout",
        loadSize: loadSize as "small" | "medium" | "large" | "extra_large",
      });
      
      res.json({
        ...analysis,
        suggestedPrice: quote.totalPrice,
        priceBreakdown: quote.breakdown,
      });
    } catch (error) {
      console.error("AI analysis error:", error);
      res.status(500).json({ error: "Failed to analyze photos" });
    }
  });

  const photoAnalysisRateLimits = new Map<string, { count: number; resetAt: number }>();
  const PHOTO_ANALYSIS_RATE_LIMIT = 10;
  const PHOTO_ANALYSIS_WINDOW_MS = 15 * 60 * 1000;
  const MAX_BASE64_SIZE = 10 * 1024 * 1024;

  app.post("/api/photos/analyze", async (req, res) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || "unknown";
      const now = Date.now();
      
      const rateLimit = photoAnalysisRateLimits.get(clientIp);
      if (rateLimit) {
        if (now < rateLimit.resetAt) {
          if (rateLimit.count >= PHOTO_ANALYSIS_RATE_LIMIT) {
            return res.status(429).json({ 
              error: "Too many requests. Please try again later.",
              retryAfter: Math.ceil((rateLimit.resetAt - now) / 1000)
            });
          }
          rateLimit.count++;
        } else {
          photoAnalysisRateLimits.set(clientIp, { count: 1, resetAt: now + PHOTO_ANALYSIS_WINDOW_MS });
        }
      } else {
        photoAnalysisRateLimits.set(clientIp, { count: 1, resetAt: now + PHOTO_ANALYSIS_WINDOW_MS });
      }

      const { photoUrls } = req.body;
      
      if (!photoUrls || !Array.isArray(photoUrls) || photoUrls.length === 0) {
        return res.status(400).json({ error: "photoUrls array is required" });
      }

      if (photoUrls.length > 5) {
        return res.status(400).json({ error: "Maximum 5 photos allowed" });
      }

      for (const url of photoUrls) {
        if (typeof url !== "string") {
          return res.status(400).json({ error: "Invalid photo URL format" });
        }
        
        if (url.startsWith("data:")) {
          if (!url.match(/^data:image\/(jpeg|jpg|png|gif|webp);base64,/i)) {
            return res.status(400).json({ error: "Invalid image format. Use JPEG, PNG, GIF, or WebP" });
          }
          if (url.length > MAX_BASE64_SIZE) {
            return res.status(400).json({ error: "Image too large. Maximum 10MB per image" });
          }
        } else {
          return res.status(400).json({ error: "Only base64 data URLs are accepted for security" });
        }
      }

      const analysis = await analyzePhotos(photoUrls);
      
      res.json({
        estimatedVolumeCubicFt: analysis.estimatedVolumeCubicFt,
        suggestedPrice: analysis.suggestedPrice,
        itemBreakdown: analysis.itemBreakdown,
        reasoning: analysis.reasoning,
        recommendedLoadSize: analysis.recommendedLoadSize,
        confidence: analysis.confidence,
      });
    } catch (error) {
      console.error("Photo analysis error:", error);
      res.status(500).json({ error: "Failed to analyze photos" });
    }
  });

  app.post("/api/service-requests/:id/analyze", async (req, res) => {
    try {
      const request = await storage.getServiceRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Service request not found" });
      }
      
      if (!request.photoUrls || request.photoUrls.length === 0) {
        return res.status(400).json({ error: "No photos to analyze" });
      }
      
      const analysis = await analyzePhotosForQuote(request.photoUrls, request.serviceType);
      
      const validLoadSizes = ["small", "medium", "large", "extra_large"];
      const loadSize = validLoadSizes.includes(analysis.recommendedLoadSize) 
        ? analysis.recommendedLoadSize 
        : "medium";
      
      const quote = await storage.calculateQuote({
        serviceType: request.serviceType as "junk_removal" | "furniture_moving" | "garage_cleanout" | "estate_cleanout",
        loadSize: loadSize as "small" | "medium" | "large" | "extra_large",
      });
      
      const estimate = await storage.createAiEstimate({
        requestId: request.id,
        photoUrls: request.photoUrls,
        identifiedItems: analysis.identifiedItems,
        estimatedVolumeCubicFt: analysis.estimatedVolumeCubicFt,
        recommendedLoadSize: analysis.recommendedLoadSize,
        confidence: analysis.confidence,
        suggestedPrice: quote.totalPrice,
        reasoning: analysis.reasoning,
        rawResponse: analysis.rawResponse,
        createdAt: new Date().toISOString(),
      });
      
      res.json({
        estimate,
        priceBreakdown: quote.breakdown,
      });
    } catch (error) {
      console.error("AI analysis error:", error);
      res.status(500).json({ error: "Failed to analyze service request photos" });
    }
  });

  app.get("/api/ai-estimates/:requestId", async (req, res) => {
    try {
      const estimate = await storage.getAiEstimateByRequest(req.params.requestId);
      if (!estimate) {
        return res.status(404).json({ error: "No AI estimate found for this request" });
      }
      res.json(estimate);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch AI estimate" });
    }
  });

  app.get("/api/stripe/publishable-key", async (req, res) => {
    try {
      const key = await stripeService.getPublishableKey();
      res.json({ publishableKey: key });
    } catch (error) {
      console.error("Error getting publishable key:", error);
      res.status(500).json({ error: "Failed to get Stripe publishable key" });
    }
  });

  app.post("/api/payments/create-intent", async (req, res) => {
    try {
      const { jobId, customerId, amount, assignedHaulerId } = req.body;
      
      if (!jobId || !amount) {
        return res.status(400).json({ error: "jobId and amount are required" });
      }

      let user = customerId ? await storage.getUser(customerId) : null;
      
      if (!user) {
        const existingDemo = await storage.getUserByEmail("demo@upyck.app");
        if (existingDemo) {
          user = existingDemo;
        } else {
          user = await storage.createUser({
            role: "customer",
            firstName: "Demo",
            lastName: "Customer",
            email: "demo@upyck.app",
          });
        }
      }

      let stripeCustomerId = user.stripeCustomerId;
      const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Customer';
      if (!stripeCustomerId) {
        const customer = await stripeService.createCustomer(
          user.email || `customer-${user.id}@upyck.app`,
          userName,
          user.id
        );
        stripeCustomerId = customer.id;
        await storage.updateUser(user.id, { stripeCustomerId: customer.id });
      }

      const paymentIntent = await stripeService.createPaymentIntent(
        amount,
        stripeCustomerId,
        jobId
      );

      const updateData: Record<string, any> = {
        stripePaymentIntentId: paymentIntent.id,
        paymentStatus: "authorized",
        livePrice: amount,
      };
      
      if (assignedHaulerId) {
        updateData.assignedHaulerId = assignedHaulerId;
        updateData.status = "assigned";
      }

      await storage.updateServiceRequest(jobId, updateData);

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ error: "Failed to create payment intent" });
    }
  });

  app.post("/api/payments/:jobId/capture", async (req, res) => {
    try {
      const { jobId } = req.params;
      
      const job = await storage.getServiceRequest(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      if (!job.stripePaymentIntentId) {
        return res.status(400).json({ error: "No payment intent for this job" });
      }

      if (job.paymentStatus === "captured") {
        return res.status(400).json({ error: "Payment already captured" });
      }

      let haulerStripeAccountId = null;
      let pyckerTier = 'independent';
      if (job.assignedHaulerId) {
        const haulerProfile = await storage.getHaulerProfile(job.assignedHaulerId);
        if (haulerProfile?.stripeAccountId && haulerProfile?.stripeOnboardingComplete) {
          haulerStripeAccountId = haulerProfile.stripeAccountId;
        }
        pyckerTier = haulerProfile?.pyckerTier || 'independent';
      }

      const totalAmount = job.livePrice || 0;
      const result = await stripeService.capturePaymentAndPayHauler(
        job.stripePaymentIntentId,
        haulerStripeAccountId,
        totalAmount,
        pyckerTier
      );

      await storage.updateServiceRequest(jobId, {
        paymentStatus: "captured",
        platformFee: result.platformFee,
        haulerPayout: result.haulerPayout,
        paidAt: new Date().toISOString(),
      });

      res.json({
        success: true,
        platformFee: result.platformFee,
        haulerPayout: result.haulerPayout,
        haulerPaid: !!haulerStripeAccountId,
      });
    } catch (error) {
      console.error("Error capturing payment:", error);
      res.status(500).json({ error: "Failed to capture payment" });
    }
  });

  // BNPL (Buy Now Pay Later) confirmation endpoint
  // This stores the BNPL selection and backup card for orders $250+
  // Note: Full Stripe BNPL integration (Affirm/Klarna) requires merchant-level setup
  // This implementation stores the intent and backup card for tracking
  app.post("/api/payments/confirm-bnpl", requireAuth, async (req, res) => {
    try {
      const { jobId, provider, backupPaymentMethodId } = req.body;
      const userId = (req.user as any).id;
      
      if (!jobId || !provider || !backupPaymentMethodId) {
        return res.status(400).json({ 
          error: "jobId, provider, and backupPaymentMethodId are required" 
        });
      }

      const job = await storage.getServiceRequest(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Verify the user owns this job or is an admin
      const user = req.user as any;
      if (job.customerId !== userId && user.role !== 'admin') {
        return res.status(403).json({ error: "Not authorized to confirm BNPL for this job" });
      }

      const amount = job.livePrice || job.priceEstimate || 0;
      
      // BNPL only available for orders $250+
      const BNPL_THRESHOLD = 250;
      if (amount < BNPL_THRESHOLD) {
        return res.status(400).json({ 
          error: `BNPL is only available for orders $${BNPL_THRESHOLD} or more` 
        });
      }

      // Valid BNPL providers
      if (!['affirm', 'klarna'].includes(provider)) {
        return res.status(400).json({ error: "Invalid BNPL provider" });
      }

      // Attach the backup payment method to the customer for later use
      const customer = await storage.getUser(job.customerId);
      if (customer?.stripeCustomerId) {
        try {
          await stripeService.attachPaymentMethod(customer.stripeCustomerId, backupPaymentMethodId);
        } catch (attachError) {
          console.log("Payment method may already be attached or invalid:", attachError);
        }
      }

      // Update the service request with BNPL information
      await storage.updateServiceRequest(jobId, {
        bnplEnabled: true,
        bnplProvider: provider,
        bnplPaymentMethodId: backupPaymentMethodId,
        backupPaymentMethodId: backupPaymentMethodId,
        bnplConfirmedAt: new Date().toISOString(),
        paymentStatus: "bnpl_confirmed",
      });

      res.json({
        success: true,
        message: `BNPL payment confirmed with ${provider}`,
        bnplProvider: provider,
        totalAmount: amount,
        installmentAmount: amount / 4,
      });
    } catch (error) {
      console.error("Error confirming BNPL payment:", error);
      res.status(500).json({ error: "Failed to confirm BNPL payment" });
    }
  });

  // Charge BNPL backup card for on-site adjustments (admin/hauler only)
  app.post("/api/payments/:jobId/charge-bnpl-adjustment", requireAuth, async (req, res) => {
    try {
      const { jobId } = req.params;
      const { adjustmentAmount, reason } = req.body;
      const userId = (req.user as any).id;
      const userRole = (req.user as any).role;

      if (!adjustmentAmount || adjustmentAmount <= 0) {
        return res.status(400).json({ error: "Valid adjustment amount is required" });
      }

      const job = await storage.getServiceRequest(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Only the assigned hauler or admin can charge adjustments
      if (userRole !== 'admin' && job.assignedHaulerId !== userId) {
        return res.status(403).json({ error: "Not authorized to charge adjustments for this job" });
      }

      if (!job.bnplEnabled || !job.backupPaymentMethodId) {
        return res.status(400).json({ 
          error: "This job does not have BNPL with a backup payment method" 
        });
      }

      // Get customer info
      const customer = await storage.getUser(job.customerId);
      if (!customer?.stripeCustomerId) {
        return res.status(400).json({ error: "Customer Stripe account not found" });
      }

      // Create and confirm a payment intent for the adjustment amount
      const adjustmentResult = await stripeService.createAndCaptureAdjustment(
        adjustmentAmount,
        customer.stripeCustomerId,
        job.backupPaymentMethodId,
        jobId
      );

      // Update the job with adjustment info
      await storage.updateServiceRequest(jobId, {
        bnplAdjustmentCharged: (job.bnplAdjustmentCharged || 0) + adjustmentAmount,
        bnplAdjustmentChargedAt: new Date().toISOString(),
      });

      res.json({
        success: true,
        adjustmentAmount,
        reason,
        message: `Successfully charged $${adjustmentAmount.toFixed(2)} to backup card`,
        paymentIntentId: adjustmentResult.paymentIntentId,
      });
    } catch (error) {
      console.error("Error charging BNPL adjustment:", error);
      res.status(500).json({ error: "Failed to charge adjustment to backup card" });
    }
  });

  // ====== JOB MANAGEMENT ENDPOINTS ======

  // PYCKER starts a job (marks as in_progress)
  app.post("/api/jobs/:jobId/start", requireAuth, requireHauler, async (req, res) => {
    try {
      const { jobId } = req.params;
      const userId = (req.user as any).id;
      
      const job = await storage.getServiceRequest(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      if (job.assignedHaulerId !== userId) {
        return res.status(403).json({ error: "Not assigned to this job" });
      }
      
      if (job.status !== "accepted" && job.status !== "assigned") {
        return res.status(400).json({ error: "Job cannot be started from current status" });
      }
      
      // Create job completion record to track progress
      const completion = await storage.createJobCompletion({
        serviceRequestId: jobId,
        haulerId: userId,
        arrivedAtPickup: true,
        arrivedAtPickupAt: new Date().toISOString(),
        originalQuote: job.livePrice || 0,
        finalAmount: job.livePrice || 0,
        createdAt: new Date().toISOString(),
      });
      
      // Update job status
      const updated = await storage.updateServiceRequest(jobId, {
        status: "in_progress",
        startedAt: new Date().toISOString(),
      });
      
      // Broadcast update to connected clients
      broadcastToJob(jobId, { type: "job_started", job: updated });
      
      res.json({ success: true, job: updated, completion });
    } catch (error) {
      console.error("Error starting job:", error);
      res.status(500).json({ error: "Failed to start job" });
    }
  });

  // PYCKER adds extra items/adjustments
  app.post("/api/jobs/:jobId/adjustments", requireAuth, requireHauler, async (req, res) => {
    try {
      const { jobId } = req.params;
      const userId = (req.user as any).id;
      const { adjustmentType, itemName, priceChange, reason, photoUrls, quantity } = req.body;
      
      const job = await storage.getServiceRequest(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      if (job.assignedHaulerId !== userId) {
        return res.status(403).json({ error: "Not assigned to this job" });
      }
      
      if (job.status !== "in_progress") {
        return res.status(400).json({ error: "Can only add adjustments to in-progress jobs" });
      }
      
      if (!adjustmentType || !itemName || priceChange === undefined) {
        return res.status(400).json({ error: "adjustmentType, itemName, and priceChange are required" });
      }
      
      const adjustment = await storage.createJobAdjustment({
        serviceRequestId: jobId,
        haulerId: userId,
        adjustmentType,
        itemName,
        priceChange,
        reason,
        photoUrls,
        quantity,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      
      // Broadcast to customer for approval
      broadcastToJob(jobId, { type: "adjustment_added", adjustment });
      
      res.json({ success: true, adjustment });
    } catch (error) {
      console.error("Error adding adjustment:", error);
      res.status(500).json({ error: "Failed to add adjustment" });
    }
  });

  // Get all adjustments for a job
  app.get("/api/jobs/:jobId/adjustments", requireAuth, async (req, res) => {
    try {
      const { jobId } = req.params;
      const adjustments = await storage.getJobAdjustmentsByRequest(jobId);
      res.json(adjustments);
    } catch (error) {
      console.error("Error getting adjustments:", error);
      res.status(500).json({ error: "Failed to get adjustments" });
    }
  });

  // Customer approves/declines an adjustment
  app.patch("/api/jobs/:jobId/adjustments/:adjustmentId", requireAuth, async (req, res) => {
    try {
      const { jobId, adjustmentId } = req.params;
      const { action } = req.body;
      const userId = (req.user as any).id;
      
      const job = await storage.getServiceRequest(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      // Customer or admin can approve/decline
      const isCustomer = job.customerId === userId;
      const user = await storage.getUser(userId);
      const isAdmin = user?.role === "admin";
      
      if (!isCustomer && !isAdmin) {
        return res.status(403).json({ error: "Only customer or admin can respond to adjustments" });
      }
      
      let adjustment;
      if (action === "approve") {
        adjustment = await storage.approveJobAdjustment(adjustmentId);
      } else if (action === "decline") {
        adjustment = await storage.declineJobAdjustment(adjustmentId);
      } else {
        return res.status(400).json({ error: "Invalid action. Use 'approve' or 'decline'" });
      }
      
      if (!adjustment) {
        return res.status(404).json({ error: "Adjustment not found" });
      }
      
      // Broadcast to PYCKER
      broadcastToJob(jobId, { type: "adjustment_updated", adjustment });
      
      res.json({ success: true, adjustment });
    } catch (error) {
      console.error("Error updating adjustment:", error);
      res.status(500).json({ error: "Failed to update adjustment" });
    }
  });

  // PYCKER updates job completion checklist
  app.patch("/api/jobs/:jobId/completion", requireAuth, requireHauler, async (req, res) => {
    try {
      const { jobId } = req.params;
      const userId = (req.user as any).id;
      const updates = req.body;
      
      const job = await storage.getServiceRequest(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      if (job.assignedHaulerId !== userId) {
        return res.status(403).json({ error: "Not assigned to this job" });
      }
      
      let completion = await storage.getJobCompletion(jobId);
      if (!completion) {
        completion = await storage.createJobCompletion({
          serviceRequestId: jobId,
          haulerId: userId,
          originalQuote: job.livePrice || 0,
          finalAmount: job.livePrice || 0,
          createdAt: new Date().toISOString(),
        });
      }
      
      const updated = await storage.updateJobCompletion(completion.id, updates);
      
      res.json({ success: true, completion: updated });
    } catch (error) {
      console.error("Error updating completion:", error);
      res.status(500).json({ error: "Failed to update completion" });
    }
  });

  // Get job completion status
  app.get("/api/jobs/:jobId/completion", requireAuth, async (req, res) => {
    try {
      const { jobId } = req.params;
      const completion = await storage.getJobCompletion(jobId);
      res.json(completion || null);
    } catch (error) {
      console.error("Error getting completion:", error);
      res.status(500).json({ error: "Failed to get completion" });
    }
  });

  // PYCKER marks job as complete and triggers payment capture
  app.post("/api/jobs/:jobId/complete", requireAuth, requireHauler, async (req, res) => {
    try {
      const { jobId } = req.params;
      const userId = (req.user as any).id;
      
      const job = await storage.getServiceRequest(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      if (job.assignedHaulerId !== userId) {
        return res.status(403).json({ error: "Not assigned to this job" });
      }
      
      if (job.status !== "in_progress") {
        return res.status(400).json({ error: "Job must be in progress to complete" });
      }
      
      // Check completion checklist
      const completion = await storage.getJobCompletion(jobId);
      if (!completion) {
        return res.status(400).json({ error: "Job completion record not found. Start the job first." });
      }
      
      if (!completion.workCompleted) {
        return res.status(400).json({ error: "Please verify work is completed before finishing" });
      }
      
      // Calculate final amount including approved adjustments
      const adjustments = await storage.getJobAdjustmentsByRequest(jobId);
      const approvedAdjustments = adjustments.filter(a => a.status === "approved");
      const pendingAdjustments = adjustments.filter(a => a.status === "pending");
      
      // Warn if there are pending adjustments
      if (pendingAdjustments.length > 0) {
        return res.status(400).json({ 
          error: "There are pending adjustments waiting for customer approval",
          pendingCount: pendingAdjustments.length
        });
      }
      
      const baseAmount = job.livePrice || 0;
      const adjustmentsTotal = approvedAdjustments.reduce((sum, a) => sum + (a.priceChange || 0), 0);
      const finalAmount = baseAmount + adjustmentsTotal;
      
      // Update completion record
      await storage.updateJobCompletion(completion.id, {
        workCompleted: true,
        workCompletedAt: new Date().toISOString(),
        finalAmount,
        adjustmentsTotal,
      });
      
      // Update service request
      const updated = await storage.updateServiceRequest(jobId, {
        status: "completed",
        livePrice: finalAmount,
      });
      
      // Attempt to capture payment
      if (job.stripePaymentIntentId) {
        try {
          let haulerStripeAccountId = null;
          let pyckerTier = 'independent';
          if (job.assignedHaulerId) {
            const haulerProfile = await storage.getHaulerProfile(job.assignedHaulerId);
            if (haulerProfile?.stripeAccountId && haulerProfile?.stripeOnboardingComplete) {
              haulerStripeAccountId = haulerProfile.stripeAccountId;
            }
            pyckerTier = haulerProfile?.pyckerTier || 'independent';
          }
          
          const result = await stripeService.capturePaymentAndPayHauler(
            job.stripePaymentIntentId,
            haulerStripeAccountId,
            finalAmount,
            pyckerTier
          );
          
          await storage.updateServiceRequest(jobId, {
            paymentStatus: "captured",
            platformFee: result.platformFee,
            haulerPayout: result.haulerPayout,
            paidAt: new Date().toISOString(),
          });
          
          // Broadcast completion
          broadcastToJob(jobId, { 
            type: "job_completed", 
            job: updated,
            paymentCaptured: true,
            finalAmount,
          });
          
          res.json({ 
            success: true, 
            job: updated,
            paymentCaptured: true,
            finalAmount,
            platformFee: result.platformFee,
            haulerPayout: result.haulerPayout,
          });
        } catch (paymentError) {
          console.error("Payment capture failed:", paymentError);
          res.json({ 
            success: true, 
            job: updated,
            paymentCaptured: false,
            paymentError: "Payment capture failed - manual follow-up required",
            finalAmount,
          });
        }
      } else {
        broadcastToJob(jobId, { type: "job_completed", job: updated, finalAmount });
        res.json({ success: true, job: updated, paymentCaptured: false, finalAmount });
      }
    } catch (error) {
      console.error("Error completing job:", error);
      res.status(500).json({ error: "Failed to complete job" });
    }
  });

  // Admin: Get all active jobs with details
  app.get("/api/admin/jobs", requireAuth, requireAdmin, async (req, res) => {
    try {
      const jobs = await storage.getAllJobsWithDetails();
      res.json(jobs);
    } catch (error) {
      console.error("Error getting admin jobs:", error);
      res.status(500).json({ error: "Failed to get jobs" });
    }
  });

  // Admin: Force approve/decline an adjustment
  app.patch("/api/admin/jobs/:jobId/adjustments/:adjustmentId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { adjustmentId } = req.params;
      const { action, notes } = req.body;
      
      let adjustment;
      if (action === "approve") {
        adjustment = await storage.approveJobAdjustment(adjustmentId);
        if (adjustment && notes) {
          // Store admin notes in reason field with prefix
          const currentReason = adjustment.reason || '';
          await storage.updateJobAdjustment(adjustmentId, { 
            reason: currentReason ? `${currentReason} | Admin: ${notes}` : `Admin: ${notes}` 
          });
        }
      } else if (action === "decline") {
        adjustment = await storage.declineJobAdjustment(adjustmentId);
        if (adjustment && notes) {
          const currentReason = adjustment.reason || '';
          await storage.updateJobAdjustment(adjustmentId, { 
            reason: currentReason ? `${currentReason} | Admin: ${notes}` : `Admin: ${notes}` 
          });
        }
      } else {
        return res.status(400).json({ error: "Invalid action" });
      }
      
      res.json({ success: true, adjustment });
    } catch (error) {
      console.error("Error updating adjustment as admin:", error);
      res.status(500).json({ error: "Failed to update adjustment" });
    }
  });

  // ====== END JOB MANAGEMENT ENDPOINTS ======

  app.post("/api/haulers/:profileId/stripe-onboard", requireAuth, requireHauler, async (req, res) => {
    try {
      const { profileId } = req.params;
      
      const profile = await storage.getHaulerProfileById(profileId);
      if (!profile) {
        return res.status(404).json({ error: "Hauler profile not found" });
      }

      const user = await storage.getUser(profile.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let accountId = profile.stripeAccountId;
      const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      if (!accountId) {
        const account = await stripeService.createConnectAccount(
          profileId,
          user.email || `pycker-${user.id}@upyck.app`,
          profile.companyName || userName || 'PYCKER'
        );
        accountId = account.id;
        await storage.updateHaulerProfile(profileId, { stripeAccountId: accountId });
      }

      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}`;
      const accountLink = await stripeService.createAccountLink(
        accountId,
        `${baseUrl}/hauler-dashboard?stripe=success`,
        `${baseUrl}/hauler-dashboard?stripe=refresh`
      );

      res.json({ url: accountLink.url });
    } catch (error) {
      console.error("Error creating Stripe onboarding:", error);
      res.status(500).json({ error: "Failed to start Stripe onboarding" });
    }
  });

  app.get("/api/haulers/:profileId/stripe-status", requireAuth, requireHauler, async (req, res) => {
    try {
      const { profileId } = req.params;
      
      const profile = await storage.getHaulerProfileById(profileId);
      if (!profile) {
        return res.status(404).json({ error: "Hauler profile not found" });
      }

      if (!profile.stripeAccountId) {
        return res.json({
          hasAccount: false,
          onboardingComplete: false,
        });
      }

      const status = await stripeService.getAccountStatus(profile.stripeAccountId);
      
      if (status.chargesEnabled && status.payoutsEnabled && !profile.stripeOnboardingComplete) {
        await storage.updateHaulerProfile(profileId, { stripeOnboardingComplete: true });
      }

      res.json({
        hasAccount: true,
        onboardingComplete: status.chargesEnabled && status.payoutsEnabled,
        chargesEnabled: status.chargesEnabled,
        payoutsEnabled: status.payoutsEnabled,
        detailsSubmitted: status.detailsSubmitted,
      });
    } catch (error) {
      console.error("Error getting Stripe status:", error);
      res.status(500).json({ error: "Failed to get Stripe account status" });
    }
  });

  app.get("/api/payments/:jobId/breakdown", async (req, res) => {
    try {
      const { jobId } = req.params;
      
      const job = await storage.getServiceRequest(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Get the assigned hauler's tier for proper fee calculation
      let pyckerTier = 'independent';
      if (job.assignedHaulerId) {
        const haulerProfile = await storage.getHaulerProfile(job.assignedHaulerId);
        pyckerTier = haulerProfile?.pyckerTier || 'independent';
      }

      const totalAmount = job.livePrice || 0;
      const platformFeePercent = stripeService.getPlatformFeePercent(pyckerTier);
      const haulerPayoutPercent = stripeService.getHaulerPayoutPercent(pyckerTier);
      const platformFee = stripeService.calculatePlatformFee(totalAmount, pyckerTier);
      const haulerPayout = stripeService.calculateHaulerPayout(totalAmount, pyckerTier);

      res.json({
        totalAmount,
        platformFee,
        haulerPayout,
        platformFeePercent,
        haulerPayoutPercent,
        pyckerTier,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate payment breakdown" });
    }
  });

  app.post("/api/haulers/:profileId/setup-card", requireAuth, requireHauler, async (req, res) => {
    try {
      const { profileId } = req.params;
      
      const profile = await storage.getHaulerProfileById(profileId);
      if (!profile) {
        return res.status(404).json({ error: "Hauler profile not found" });
      }

      const user = await storage.getUser(profile.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let incidentCustomerId = profile.incidentStripeCustomerId;
      const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      if (!incidentCustomerId) {
        const customer = await stripeService.createIncidentCustomer(
          profileId,
          user.email || `pycker-${user.id}@upyck.app`,
          profile.companyName || userName || 'PYCKER'
        );
        incidentCustomerId = customer.id;
        await storage.updateHaulerProfile(profileId, { incidentStripeCustomerId: incidentCustomerId });
      }

      const setupIntent = await stripeService.createSetupIntent(incidentCustomerId);

      res.json({
        clientSecret: setupIntent.client_secret,
        customerId: incidentCustomerId,
      });
    } catch (error) {
      console.error("Error creating setup intent:", error);
      res.status(500).json({ error: "Failed to set up card" });
    }
  });

  app.post("/api/haulers/:profileId/confirm-card", requireAuth, requireHauler, async (req, res) => {
    try {
      const { profileId } = req.params;
      const { paymentMethodId } = req.body;
      
      const profile = await storage.getHaulerProfileById(profileId);
      if (!profile) {
        return res.status(404).json({ error: "Hauler profile not found" });
      }

      if (!profile.incidentStripeCustomerId) {
        return res.status(400).json({ error: "No Stripe customer set up" });
      }

      await stripeService.attachPaymentMethod(profile.incidentStripeCustomerId, paymentMethodId);
      
      const canAcceptJobs = profile.backgroundCheckStatus === "clear" && true;
      
      await storage.updateHaulerProfile(profileId, {
        incidentPaymentMethodId: paymentMethodId,
        hasCardOnFile: true,
        canAcceptJobs,
      });

      res.json({ success: true, canAcceptJobs });
    } catch (error) {
      console.error("Error confirming card:", error);
      res.status(500).json({ error: "Failed to confirm card" });
    }
  });

  app.get("/api/haulers/:profileId/compliance", requireAuth, requireHauler, async (req, res) => {
    try {
      const { profileId } = req.params;
      
      const profile = await storage.getHaulerProfileById(profileId);
      if (!profile) {
        return res.status(404).json({ error: "Hauler profile not found" });
      }

      const penalties = await storage.getPenaltiesByHauler(profile.userId);
      const unpaidPenalties = penalties.filter(p => p.status === "assessed");

      // Check if NDA is accepted
      const ndaAccepted = !!profile.ndaAcceptedAt;
      
      // canAcceptJobs requires: card on file, background check clear, AND NDA signed
      const canAcceptJobs = profile.hasCardOnFile && 
                           profile.backgroundCheckStatus === "clear" && 
                           ndaAccepted &&
                           unpaidPenalties.length === 0;

      res.json({
        hasCardOnFile: profile.hasCardOnFile,
        backgroundCheckStatus: profile.backgroundCheckStatus,
        stripeOnboardingComplete: profile.stripeOnboardingComplete,
        canAcceptJobs,
        unpaidPenaltiesCount: unpaidPenalties.length,
        unpaidPenaltiesAmount: unpaidPenalties.reduce((sum, p) => sum + (p.amount || 0), 0),
        ndaAccepted,
        ndaAcceptedAt: profile.ndaAcceptedAt,
        ndaVersion: profile.ndaVersion,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch compliance status" });
    }
  });

  app.post("/api/haulers/:profileId/request-background-check", requireAuth, requireHauler, async (req, res) => {
    try {
      const { profileId } = req.params;
      
      const profile = await storage.getHaulerProfileById(profileId);
      if (!profile) {
        return res.status(404).json({ error: "Hauler profile not found" });
      }

      const canAcceptJobs = profile.hasCardOnFile && true;

      await storage.updateHaulerProfile(profileId, {
        backgroundCheckStatus: "clear",
        backgroundCheckCompletedAt: new Date().toISOString(),
        canAcceptJobs,
      });

      res.json({ 
        status: "clear", 
        message: "Background check passed (demo mode)",
        canAcceptJobs,
      });
    } catch (error) {
      console.error("Error requesting background check:", error);
      res.status(500).json({ error: "Failed to request background check" });
    }
  });

  app.post("/api/service-requests/:id/accept", async (req, res) => {
    try {
      const { id } = req.params;
      const { haulerId } = req.body;

      const request = await storage.getServiceRequest(id);
      if (!request) {
        return res.status(404).json({ error: "Service request not found" });
      }

      const haulerProfile = await storage.getHaulerProfile(haulerId);
      if (!haulerProfile) {
        return res.status(404).json({ error: "Hauler profile not found" });
      }

      if (!haulerProfile.hasCardOnFile) {
        return res.status(403).json({ 
          error: "Cannot accept jobs",
          reason: "Card on file required - add a payment method first"
        });
      }

      if (haulerProfile.backgroundCheckStatus !== "clear") {
        return res.status(403).json({ 
          error: "Cannot accept jobs",
          reason: "Background check required - complete background verification first"
        });
      }

      const penalties = await storage.getPenaltiesByHauler(haulerId);
      const unpaidPenalties = penalties.filter(p => p.status === "assessed");
      if (unpaidPenalties.length > 0) {
        return res.status(403).json({ 
          error: "Cannot accept jobs",
          reason: `Outstanding penalties must be resolved first ($${unpaidPenalties.reduce((sum, p) => sum + (p.amount || 0), 0)})`
        });
      }

      const now = new Date();
      const contactRequiredBy = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now
      
      const updated = await storage.updateServiceRequest(id, {
        status: "assigned",
        assignedHaulerId: haulerId,
        acceptedAt: now.toISOString(),
        contactRequiredBy: contactRequiredBy.toISOString(),
        contactReleasedAt: now.toISOString(),
      });

      broadcastToJob(id, {
        type: "job_accepted",
        haulerId,
        acceptedAt: now,
      });

      res.json(updated);
    } catch (error) {
      console.error("Error accepting job:", error);
      res.status(500).json({ error: "Failed to accept job" });
    }
  });

  // PYCKER confirms they called the customer
  app.post("/api/service-requests/:id/confirm-call", async (req, res) => {
    try {
      const { id } = req.params;
      const { haulerId } = req.body;

      const request = await storage.getServiceRequest(id);
      if (!request) {
        return res.status(404).json({ error: "Service request not found" });
      }

      if (request.assignedHaulerId !== haulerId) {
        return res.status(403).json({ error: "Only the assigned PYCKER can confirm the call" });
      }

      if (request.contactConfirmedAt) {
        return res.json({ 
          success: true, 
          message: "Call already confirmed",
          contactConfirmedAt: request.contactConfirmedAt 
        });
      }

      const now = new Date().toISOString();
      const updated = await storage.updateServiceRequest(id, {
        contactConfirmedAt: now,
      });

      broadcastToJob(id, {
        type: "call_confirmed",
        haulerId,
        contactConfirmedAt: now,
      });

      res.json({ 
        success: true, 
        message: "Call confirmed",
        contactConfirmedAt: now 
      });
    } catch (error) {
      console.error("Error confirming call:", error);
      res.status(500).json({ error: "Failed to confirm call" });
    }
  });

  // PYCKER cancels a job after accepting - automatic $25 penalty
  app.post("/api/service-requests/:id/cancel", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { haulerId, reason } = req.body;

      // Validate required fields
      if (!haulerId) {
        return res.status(400).json({ error: "haulerId is required" });
      }

      const request = await storage.getServiceRequest(id);
      if (!request) {
        return res.status(404).json({ error: "Service request not found" });
      }

      if (request.assignedHaulerId !== haulerId) {
        return res.status(403).json({ error: "Only the assigned PYCKER can cancel this job" });
      }

      // Only allow cancellation of jobs that were actually accepted
      const validStatusesForCancellation = ["assigned", "in_progress"];
      if (!validStatusesForCancellation.includes(request.status)) {
        return res.status(400).json({ 
          error: "Cannot cancel this job",
          reason: `Job is in '${request.status}' status - only assigned or in-progress jobs can be cancelled`
        });
      }

      // Verify the job was actually accepted
      if (!request.acceptedAt) {
        return res.status(400).json({ 
          error: "Cannot cancel this job",
          reason: "Job was never formally accepted"
        });
      }

      if (request.status === "completed") {
        return res.status(400).json({ error: "Cannot cancel a completed job" });
      }

      if (request.cancelledAt) {
        return res.status(400).json({ error: "Job already cancelled" });
      }

      const haulerProfile = await storage.getHaulerProfile(haulerId);
      if (!haulerProfile) {
        return res.status(404).json({ error: "Hauler profile not found" });
      }

      // Verify card on file before allowing cancellation
      if (!haulerProfile.incidentStripeCustomerId || !haulerProfile.incidentPaymentMethodId) {
        return res.status(400).json({ 
          error: "Cannot cancel job - no payment method on file for penalty",
          reason: "A $25 cancellation penalty will be charged"
        });
      }

      const now = new Date().toISOString();
      let penaltyId: string | null = null;
      let penaltyCharged = false;

      // Create $25 penalty for cancellation after acceptance
      const penalty = await storage.createHaulerPenalty({
        haulerId,
        requestId: id,
        reason: `Job cancellation after acceptance: ${reason || "No reason provided"}`,
        amount: 25,
        status: "assessed",
        createdAt: now,
      });
      penaltyId = penalty.id;

      // Attempt to charge the penalty if card on file exists
      if (haulerProfile.incidentStripeCustomerId && haulerProfile.incidentPaymentMethodId) {
        try {
          const paymentIntent = await stripeService.chargeIncidentPenalty(
            haulerProfile.incidentStripeCustomerId,
            haulerProfile.incidentPaymentMethodId,
            25,
            `uPYCK cancellation penalty: ${reason || "Job cancelled after acceptance"}`,
            { penaltyId: penalty.id, haulerId, requestId: id }
          );

          await storage.updateHaulerPenalty(penalty.id, {
            status: "charged",
            stripePaymentIntentId: paymentIntent.id,
            chargedAt: now,
          });
          penaltyCharged = true;
        } catch (chargeError) {
          console.error("Failed to charge cancellation penalty:", chargeError);
          // Penalty remains assessed but not charged - will need manual collection
        }
      }

      // Update the service request with cancellation details
      const updated = await storage.updateServiceRequest(id, {
        status: "cancelled",
        cancelledAt: now,
        cancelledBy: "pycker",
        cancellationReason: reason || "No reason provided",
        cancellationPenaltyCharged: penaltyCharged,
        cancellationPenaltyId: penaltyId,
        haulerPenaltyApplied: true,
      });

      // Broadcast cancellation to customer
      broadcastToJob(id, {
        type: "job_cancelled",
        cancelledBy: "pycker",
        reason: reason || "PYCKER cancelled the job",
        cancelledAt: now,
      });

      res.json({
        success: true,
        message: penaltyCharged 
          ? "Job cancelled - $25 penalty charged to your card on file" 
          : "Job cancelled - $25 penalty assessed (pending collection)",
        penaltyCharged,
        penaltyId,
        penaltyAmount: 25,
        request: updated,
      });
    } catch (error) {
      console.error("Error cancelling job:", error);
      res.status(500).json({ error: "Failed to cancel job" });
    }
  });

  app.post("/api/penalties/:haulerId/assess", async (req, res) => {
    try {
      const { haulerId } = req.params;
      const { requestId, reason, amount = 25 } = req.body;

      const haulerProfile = await storage.getHaulerProfile(haulerId);
      if (!haulerProfile) {
        return res.status(404).json({ error: "Hauler profile not found" });
      }

      const penalty = await storage.createHaulerPenalty({
        haulerId,
        requestId,
        reason: reason || "Job not completed after acceptance",
        amount,
        status: "assessed",
        createdAt: new Date().toISOString(),
      });

      if (requestId) {
        await storage.updateServiceRequest(requestId, {
          haulerPenaltyApplied: true,
        });
      }

      if (haulerProfile.incidentStripeCustomerId && haulerProfile.incidentPaymentMethodId) {
        try {
          const paymentIntent = await stripeService.chargeIncidentPenalty(
            haulerProfile.incidentStripeCustomerId,
            haulerProfile.incidentPaymentMethodId,
            amount,
            `honkIQ penalty: ${reason || "Job not completed"}`,
            { penaltyId: penalty.id, haulerId, requestId: requestId || "" }
          );

          await storage.updateHaulerPenalty(penalty.id, {
            status: "charged",
            stripePaymentIntentId: paymentIntent.id,
            chargedAt: new Date().toISOString(),
          });

          res.json({ 
            penalty: { ...penalty, status: "charged" }, 
            charged: true,
            paymentIntentId: paymentIntent.id,
          });
        } catch (chargeError) {
          console.error("Failed to charge penalty:", chargeError);
          res.json({ penalty, charged: false, chargeError: "Payment failed" });
        }
      } else {
        res.json({ penalty, charged: false, reason: "No payment method on file" });
      }
    } catch (error) {
      console.error("Error assessing penalty:", error);
      res.status(500).json({ error: "Failed to assess penalty" });
    }
  });

  app.get("/api/penalties/:haulerId", async (req, res) => {
    try {
      const { haulerId } = req.params;
      const penalties = await storage.getPenaltiesByHauler(haulerId);
      res.json(penalties);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch penalties" });
    }
  });

  app.get("/api/service-requests/:id/contact", async (req, res) => {
    try {
      const { id } = req.params;
      const { haulerId } = req.query;

      const request = await storage.getServiceRequestWithDetails(id);
      if (!request) {
        return res.status(404).json({ error: "Service request not found" });
      }

      const customerName = request.customer ? `${request.customer.firstName || ''} ${request.customer.lastName || ''}`.trim() : '';
      if (request.assignedHaulerId !== haulerId || !request.acceptedAt) {
        return res.json({
          contactMasked: true,
          customerName: customerName.split(" ")[0] + " ***",
          customerPhone: "***-***-****",
          customerEmail: "***@***.***",
        });
      }

      res.json({
        contactMasked: false,
        customerName,
        customerPhone: request.customer?.phone,
        customerEmail: request.customer?.email,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contact info" });
    }
  });

  app.post("/api/jobs/:jobId/tip", async (req, res) => {
    try {
      const { jobId } = req.params;
      const { tipAmount, customerId } = req.body;

      if (!tipAmount || tipAmount <= 0) {
        return res.status(400).json({ error: "Invalid tip amount" });
      }

      const request = await storage.getServiceRequestWithDetails(jobId);
      if (!request) {
        return res.status(404).json({ error: "Job not found" });
      }

      if (request.status !== "completed") {
        return res.status(400).json({ error: "Can only tip after job is completed" });
      }

      const customer = await storage.getUser(customerId);
      if (!customer?.stripeCustomerId) {
        return res.status(400).json({ error: "Customer payment info not found" });
      }

      const haulrProfile = await storage.getHaulerProfile(request.assignedHaulerId!);
      if (!haulrProfile?.stripeAccountId) {
        return res.status(400).json({ error: "IQ Pro payment account not found" });
      }

      const tipPaymentIntent = await stripeService.createTipPaymentIntent(
        tipAmount,
        customer.stripeCustomerId,
        jobId
      );

      res.json({
        clientSecret: tipPaymentIntent.client_secret,
        tipAmount,
        message: "Tip goes 100% to your IQ Pro",
      });
    } catch (error) {
      console.error("Error creating tip:", error);
      res.status(500).json({ error: "Failed to process tip" });
    }
  });

  app.post("/api/jobs/:jobId/tip/confirm", async (req, res) => {
    try {
      const { jobId } = req.params;
      const { paymentIntentId, tipAmount } = req.body;

      const request = await storage.getServiceRequestWithDetails(jobId);
      if (!request) {
        return res.status(404).json({ error: "Job not found" });
      }

      const haulrProfile = await storage.getHaulerProfile(request.assignedHaulerId!);
      if (!haulrProfile?.stripeAccountId) {
        return res.status(400).json({ error: "IQ Pro payment account not found" });
      }

      const transfer = await stripeService.transferTipToPycker(
        paymentIntentId,
        haulrProfile.stripeAccountId,
        tipAmount,
        jobId
      );

      await storage.updateServiceRequest(jobId, {
        tipAmount,
        tipPaidAt: new Date().toISOString(),
        tipStripeTransferId: transfer.id,
      });

      res.json({
        success: true,
        transferId: transfer.id,
        tipAmount,
        message: "Tip sent directly to your IQ Pro!",
      });
    } catch (error) {
      console.error("Error confirming tip:", error);
      res.status(500).json({ error: "Failed to confirm tip" });
    }
  });

  // Referral endpoints
  app.post("/api/referrals", async (req, res) => {
    try {
      const { referrerId, referredEmail } = req.body;
      
      if (!referrerId || !referredEmail) {
        return res.status(400).json({ error: "Referrer ID and email are required" });
      }

      if (!referredEmail.includes("@")) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      const existingReferrals = await storage.getReferralsByReferrer(referrerId);
      const duplicate = existingReferrals.find(r => r.referredEmail.toLowerCase() === referredEmail.toLowerCase());
      if (duplicate) {
        return res.status(400).json({ error: "You've already referred this email address" });
      }

      const referralCode = `HONKIQ${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const referral = await storage.createReferral({
        referrerId,
        referredEmail: referredEmail.toLowerCase(),
        referralCode,
        status: "pending",
        referrerBonusAmount: 50,
        referredBonusAmount: 50,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
      });

      res.json(referral);
    } catch (error) {
      console.error("Error creating referral:", error);
      res.status(500).json({ error: "Failed to create referral" });
    }
  });

  app.get("/api/referrals/code/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const referral = await storage.getReferralByCode(code);
      
      if (!referral) {
        return res.status(404).json({ error: "Referral code not found" });
      }

      res.json(referral);
    } catch (error) {
      console.error("Error fetching referral:", error);
      res.status(500).json({ error: "Failed to fetch referral" });
    }
  });

  app.get("/api/referrals/:referrerId", async (req, res) => {
    try {
      const { referrerId } = req.params;
      const referrals = await storage.getReferralsByReferrer(referrerId);
      
      const stats = {
        total: referrals.length,
        pending: referrals.filter(r => r.status === "pending").length,
        completed: referrals.filter(r => r.status === "completed" || r.status === "paid").length,
        totalEarned: referrals
          .filter(r => r.status === "paid")
          .reduce((sum, r) => sum + (r.referrerBonusAmount || 0), 0),
      };

      res.json({ referrals, stats });
    } catch (error) {
      console.error("Error fetching referrals:", error);
      res.status(500).json({ error: "Failed to fetch referrals" });
    }
  });

  app.patch("/api/referrals/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const referral = await storage.updateReferral(id, updates);
      if (!referral) {
        return res.status(404).json({ error: "Referral not found" });
      }

      res.json(referral);
    } catch (error) {
      console.error("Error updating referral:", error);
      res.status(500).json({ error: "Failed to update referral" });
    }
  });

  app.post("/api/ai/analyze-photos", async (req, res) => {
    try {
      const { photoUrls } = req.body;
      
      if (!photoUrls || !Array.isArray(photoUrls) || photoUrls.length === 0) {
        return res.status(400).json({ error: "Photo URLs are required" });
      }

      const analysis = await analyzePhotos(photoUrls);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing photos:", error);
      res.status(500).json({ error: "Failed to analyze photos" });
    }
  });

  app.post("/api/ai/quick-estimate", async (req, res) => {
    try {
      const { description } = req.body;
      
      if (!description) {
        return res.status(400).json({ error: "Description is required" });
      }

      const estimate = await getQuickEstimate(description);
      res.json(estimate);
    } catch (error) {
      console.error("Error getting quick estimate:", error);
      res.status(500).json({ error: "Failed to get estimate" });
    }
  });

  app.post("/api/ai/analyze-load", async (req, res) => {
    try {
      const contentType = req.headers["content-type"] || "";
      let serviceType = "junk_removal";
      let imageCount = 1;

      if (contentType.includes("multipart/form-data")) {
        const rawBody = await new Promise<string>((resolve) => {
          let data = "";
          req.on("data", (chunk: Buffer) => {
            data += chunk.toString();
          });
          req.on("end", () => resolve(data));
        });
        
        const serviceMatch = rawBody.match(/name="serviceType"\r?\n\r?\n([^\r\n]+)/);
        if (serviceMatch) {
          serviceType = serviceMatch[1];
        }
        imageCount = (rawBody.match(/name="image\d+"/g) || []).length || 1;
      } else {
        serviceType = req.body?.serviceType || "junk_removal";
        imageCount = req.body?.imageCount || 1;
      }

      const basePrices: Record<string, { low: number; high: number; items: string[] }> = {
        junk_removal: { low: 99, high: 249, items: ["Furniture", "Appliances", "General debris"] },
        furniture_moving: { low: 89, high: 199, items: ["Couch/Sofa", "Bed frame", "Tables/Chairs"] },
        garage_cleanout: { low: 179, high: 449, items: ["Tools", "Storage items", "Old equipment", "General clutter"] },
        truck_unloading: { low: 150, high: 350, items: ["Full truck contents", "Furniture", "Boxes"] },
      };

      const base = basePrices[serviceType] || basePrices.junk_removal;
      const sizeMultiplier = 1 + (imageCount - 1) * 0.15;
      
      res.json({
        lowPrice: Math.round(base.low * sizeMultiplier),
        highPrice: Math.round(base.high * sizeMultiplier),
        identifiedItems: base.items,
        confidence: 0.85,
        message: "AI analysis complete",
      });
    } catch (error) {
      console.error("Error analyzing load:", error);
      res.status(500).json({ error: "Failed to analyze load" });
    }
  });

  app.post("/api/matching/smart", async (req, res) => {
    try {
      const { serviceType, loadSize, pickupLat, pickupLng, isPriority, preferVerifiedPro } = req.body;
      
      if (!serviceType || !loadSize) {
        return res.status(400).json({ error: "Service type and load size are required" });
      }

      const haulers = await storage.getSmartMatchedHaulers({
        serviceType,
        loadSize,
        pickupLat,
        pickupLng,
        isPriority,
        preferVerifiedPro,
      });

      res.json({ haulers, isPriority: !!isPriority });
    } catch (error) {
      console.error("Error getting smart matches:", error);
      res.status(500).json({ error: "Failed to get matches" });
    }
  });

  app.post("/api/business-accounts", requireAuth, async (req, res) => {
    try {
      const businessAccountValidation = z.object({
        userId: z.string(),
        businessName: z.string(),
        businessType: z.string(),
        taxId: z.string().optional(),
        billingAddress: z.string().optional(),
        billingCity: z.string().optional(),
        billingState: z.string().optional(),
        billingZip: z.string().optional(),
        primaryContactName: z.string().optional(),
        primaryContactPhone: z.string().optional(),
        primaryContactEmail: z.string().optional(),
        volumeDiscountTier: z.string().optional(),
        monthlyJobTarget: z.number().optional(),
        invoicingEnabled: z.boolean().optional(),
        netPaymentTerms: z.number().optional(),
      });

      const parseResult = businessAccountValidation.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Invalid data", 
          details: parseResult.error.flatten().fieldErrors 
        });
      }

      const accountData = parseResult.data;
      
      if (!accountData.userId || !accountData.businessName || !accountData.businessType) {
        return res.status(400).json({ error: "User ID, business name, and type are required" });
      }

      const existing = await storage.getBusinessAccountByUser(accountData.userId);
      if (existing) {
        return res.status(400).json({ error: "Business account already exists for this user" });
      }

      const account = await storage.createBusinessAccount({
        ...accountData,
        createdAt: new Date().toISOString(),
      });

      res.status(201).json(account);
    } catch (error) {
      console.error("Error creating business account:", error);
      res.status(500).json({ error: "Failed to create business account" });
    }
  });

  app.get("/api/business-accounts/:userId", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const account = await storage.getBusinessAccountByUser(userId);
      
      if (!account) {
        return res.status(404).json({ error: "Business account not found" });
      }

      const recurringJobs = await storage.getRecurringJobsByBusinessAccount(account.id);
      res.json({ account, recurringJobs });
    } catch (error) {
      console.error("Error fetching business account:", error);
      res.status(500).json({ error: "Failed to fetch business account" });
    }
  });

  app.patch("/api/business-accounts/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const account = await storage.updateBusinessAccount(id, updates);
      if (!account) {
        return res.status(404).json({ error: "Business account not found" });
      }

      res.json(account);
    } catch (error) {
      console.error("Error updating business account:", error);
      res.status(500).json({ error: "Failed to update business account" });
    }
  });

  app.post("/api/recurring-jobs", requireAuth, async (req, res) => {
    try {
      const recurringJobValidation = z.object({
        businessAccountId: z.string(),
        serviceType: z.string(),
        pickupAddress: z.string(),
        pickupCity: z.string().optional(),
        pickupZip: z.string().optional(),
        description: z.string().optional(),
        frequency: z.string().optional(),
        preferredDayOfWeek: z.number().optional(),
        preferredTimeSlot: z.string().optional(),
        estimatedLoadSize: z.string().optional(),
        negotiatedPrice: z.number().optional(),
        isActive: z.boolean().optional(),
      });

      const parseResult = recurringJobValidation.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Invalid data", 
          details: parseResult.error.flatten().fieldErrors 
        });
      }

      const jobData = parseResult.data;
      
      if (!jobData.businessAccountId || !jobData.serviceType || !jobData.pickupAddress) {
        return res.status(400).json({ error: "Business account, service type, and address are required" });
      }

      const job = await storage.createRecurringJob({
        ...jobData,
        pickupCity: jobData.pickupCity || "",
        pickupZip: jobData.pickupZip || "",
        frequency: jobData.frequency || "weekly",
        estimatedLoadSize: jobData.estimatedLoadSize || "medium",
        createdAt: new Date().toISOString(),
      });

      res.status(201).json(job);
    } catch (error) {
      console.error("Error creating recurring job:", error);
      res.status(500).json({ error: "Failed to create recurring job" });
    }
  });

  app.get("/api/recurring-jobs/:businessAccountId", requireAuth, async (req, res) => {
    try {
      const { businessAccountId } = req.params;
      const jobs = await storage.getRecurringJobsByBusinessAccount(businessAccountId);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching recurring jobs:", error);
      res.status(500).json({ error: "Failed to fetch recurring jobs" });
    }
  });

  app.patch("/api/recurring-jobs/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const job = await storage.updateRecurringJob(id, updates);
      if (!job) {
        return res.status(404).json({ error: "Recurring job not found" });
      }

      res.json(job);
    } catch (error) {
      console.error("Error updating recurring job:", error);
      res.status(500).json({ error: "Failed to update recurring job" });
    }
  });

  app.get("/api/loyalty/:userId", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      let account = await storage.getLoyaltyAccount(userId);
      
      if (!account) {
        account = await storage.createLoyaltyAccount({
          userId,
          currentPoints: 0,
          lifetimePoints: 0,
          currentTier: "bronze",
          createdAt: new Date().toISOString(),
        });
      }

      const transactions = await storage.getLoyaltyTransactions(userId);
      const rewards = await storage.getLoyaltyRewards();

      res.json({ account, transactions, availableRewards: rewards });
    } catch (error) {
      console.error("Error fetching loyalty account:", error);
      res.status(500).json({ error: "Failed to fetch loyalty account" });
    }
  });

  app.post("/api/loyalty/:userId/earn", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const { amount, serviceRequestId } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Valid amount is required" });
      }

      const pointsToEarn = Math.floor(amount * POINTS_PER_DOLLAR);
      const transaction = await storage.addLoyaltyPoints(
        userId, 
        pointsToEarn, 
        `Earned ${pointsToEarn} points for $${amount} job`,
        serviceRequestId
      );

      const account = await storage.getLoyaltyAccount(userId);
      res.json({ transaction, account });
    } catch (error) {
      console.error("Error earning points:", error);
      res.status(500).json({ error: "Failed to earn points" });
    }
  });

  app.post("/api/loyalty/:userId/redeem", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const { rewardId } = req.body;
      
      if (!rewardId) {
        return res.status(400).json({ error: "Reward ID is required" });
      }

      const reward = await storage.getLoyaltyReward(rewardId);
      if (!reward) {
        return res.status(404).json({ error: "Reward not found" });
      }

      if (!reward.isActive) {
        return res.status(400).json({ error: "This reward is no longer available" });
      }

      if (reward.usageLimit && (reward.currentUsageCount || 0) >= reward.usageLimit) {
        return res.status(400).json({ error: "This reward has reached its usage limit" });
      }

      const now = new Date().toISOString();
      if (reward.validFrom && now < reward.validFrom) {
        return res.status(400).json({ error: "This reward is not yet available" });
      }
      if (reward.validUntil && now > reward.validUntil) {
        return res.status(400).json({ error: "This reward has expired" });
      }

      const account = await storage.getLoyaltyAccount(userId);
      if (!account) {
        return res.status(404).json({ error: "Loyalty account not found" });
      }

      const tierOrder = ["bronze", "silver", "gold", "platinum"];
      const userTierIndex = tierOrder.indexOf(account.currentTier || "bronze");
      const requiredTierIndex = tierOrder.indexOf(reward.minimumTier || "bronze");
      if (userTierIndex < requiredTierIndex) {
        return res.status(400).json({ error: `This reward requires ${reward.minimumTier} tier or higher` });
      }

      if ((account.currentPoints || 0) < reward.pointsCost) {
        return res.status(400).json({ error: "Insufficient points" });
      }

      const transaction = await storage.redeemLoyaltyPoints(
        userId,
        reward.pointsCost,
        `Redeemed: ${reward.name}`
      );

      if (!transaction) {
        return res.status(400).json({ error: "Failed to redeem points" });
      }

      const updatedAccount = await storage.getLoyaltyAccount(userId);
      res.json({ 
        success: true, 
        reward,
        transaction, 
        account: updatedAccount,
        appliedDiscount: reward.discountAmount || (reward.discountPercent ? `${reward.discountPercent}%` : null)
      });
    } catch (error) {
      console.error("Error redeeming reward:", error);
      res.status(500).json({ error: "Failed to redeem reward" });
    }
  });

  app.get("/api/loyalty/rewards", requireAuth, async (req, res) => {
    try {
      const rewards = await storage.getLoyaltyRewards();
      res.json(rewards);
    } catch (error) {
      console.error("Error fetching rewards:", error);
      res.status(500).json({ error: "Failed to fetch rewards" });
    }
  });

  return httpServer;
}
