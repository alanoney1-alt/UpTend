/**
 * B2B Partner Portal Routes
 *
 * Endpoints:
 * - POST /api/partners/register  - partner signup
 * - POST /api/partners/login     - partner login
 * - GET  /api/partners/dashboard - partner stats
 * - POST /api/partners/book      - create booking on behalf of client
 */

import { Router, type Express, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { db } from "../db";
import { partners, partnerBookings } from "../../shared/schema";
import { eq, sql, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";

// Partner API key auth middleware
export async function requirePartnerAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers["x-partner-api-key"] as string;
  if (!apiKey) {
    return res.status(401).json({ error: "Missing X-Partner-API-Key header" });
  }

  try {
    const [partner] = await db.select().from(partners).where(eq(partners.apiKey, apiKey)).limit(1);
    if (!partner) {
      return res.status(401).json({ error: "Invalid API key" });
    }
    if (partner.status !== "active") {
      return res.status(403).json({ error: `Partner account is ${partner.status}` });
    }
    (req as any).partner = partner;
    next();
  } catch (error) {
    return res.status(500).json({ error: "Authentication failed" });
  }
}

export function registerPartnerRoutes(app: Express) {
  const router = Router();

  const partnerAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many attempts. Please try again later." },
  });

  // ==========================================
  // POST /api/partners/register
  // ==========================================
  const registerSchema = z.object({
    companyName: z.string().min(2),
    contactName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(10),
    password: z.string().min(8),
    type: z.enum(["property_manager", "airbnb_host", "real_estate", "other"]),
  });

  router.post("/register", partnerAuthLimiter, async (req, res) => {
    try {
      const validated = registerSchema.parse(req.body);

      // Check existing
      const [existing] = await db.select().from(partners).where(eq(partners.email, validated.email)).limit(1);
      if (existing) {
        return res.status(409).json({ error: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(validated.password, 10);
      const apiKey = `uptend_partner_${nanoid(32)}`;

      const [partner] = await db.insert(partners).values({
        companyName: validated.companyName,
        contactName: validated.contactName,
        email: validated.email,
        phone: validated.phone,
        passwordHash: hashedPassword,
        type: validated.type,
        apiKey,
        status: "pending",
        createdAt: new Date().toISOString(),
      }).returning();

      res.status(201).json({
        success: true,
        partner: {
          id: partner.id,
          companyName: partner.companyName,
          email: partner.email,
          type: partner.type,
          status: partner.status,
          apiKey: partner.apiKey,
        },
        message: "Registration submitted! Your account is pending approval. You'll receive your API key once activated.",
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Partner register error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // ==========================================
  // POST /api/partners/login
  // ==========================================
  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
  });

  router.post("/login", partnerAuthLimiter, async (req, res) => {
    try {
      const validated = loginSchema.parse(req.body);
      const [partner] = await db.select().from(partners).where(eq(partners.email, validated.email)).limit(1);

      if (!partner || !partner.passwordHash) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const valid = await bcrypt.compare(validated.password, partner.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      res.json({
        success: true,
        partner: {
          id: partner.id,
          companyName: partner.companyName,
          contactName: partner.contactName,
          email: partner.email,
          type: partner.type,
          status: partner.status,
          apiKey: partner.apiKey,
        },
      });
    } catch (error: any) {
      console.error("Partner login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // ==========================================
  // GET /api/partners/dashboard
  // Partner stats - requires API key auth
  // ==========================================
  router.get("/dashboard", requirePartnerAuth, async (req, res) => {
    try {
      const partner = (req as any).partner;

      const bookings = await db.select().from(partnerBookings)
        .where(eq(partnerBookings.partnerId, partner.id))
        .orderBy(desc(partnerBookings.createdAt));

      const totalBookings = bookings.length;
      const totalSpend = bookings.reduce((sum, b) => sum + (Number(b.originalAmount) || 0), 0);
      const totalSaved = bookings.reduce((sum, b) => sum + (Number(b.discountAmount) || 0), 0);

      res.json({
        success: true,
        partner: {
          id: partner.id,
          companyName: partner.companyName,
          contactName: partner.contactName,
          type: partner.type,
          status: partner.status,
          createdAt: partner.createdAt,
        },
        stats: {
          totalBookings,
          totalSpend: totalSpend.toFixed(2),
          totalSaved: totalSaved.toFixed(2),
          discountRate: "10%",
        },
        recentBookings: bookings.slice(0, 20).map((b) => ({
          id: b.id,
          serviceRequestId: b.serviceRequestId,
          originalAmount: b.originalAmount,
          discountAmount: b.discountAmount,
          finalAmount: b.finalAmount,
          notes: b.notes,
          createdAt: b.createdAt,
        })),
      });
    } catch (error: any) {
      console.error("Partner dashboard error:", error);
      res.status(500).json({ error: "Failed to load dashboard" });
    }
  });

  // ==========================================
  // POST /api/partners/book
  // Create booking on behalf of tenant/client
  // Partners get 10% bulk discount
  // ==========================================
  const bookSchema = z.object({
    serviceType: z.string().min(1),
    address: z.string().min(5),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    clientName: z.string().min(2),
    clientPhone: z.string().optional(),
    clientEmail: z.string().email().optional(),
    preferredDate: z.string().optional(),
    notes: z.string().optional(),
    estimatedAmount: z.number().positive().optional(),
  });

  router.post("/book", requirePartnerAuth, async (req, res) => {
    try {
      const validated = bookSchema.parse(req.body);
      const partner = (req as any).partner;

      // Apply 10% partner discount
      const PARTNER_DISCOUNT_RATE = 0.10;
      const originalAmount = validated.estimatedAmount || 0;
      const discountAmount = originalAmount * PARTNER_DISCOUNT_RATE;
      const finalAmount = originalAmount - discountAmount;

      // Create a partner booking record
      const [booking] = await db.insert(partnerBookings).values({
        partnerId: partner.id,
        serviceType: validated.serviceType,
        clientName: validated.clientName,
        clientPhone: validated.clientPhone || null,
        clientEmail: validated.clientEmail || null,
        address: validated.address,
        city: validated.city || null,
        state: validated.state || null,
        zip: validated.zip || null,
        preferredDate: validated.preferredDate || null,
        originalAmount: originalAmount.toString(),
        discountAmount: discountAmount.toString(),
        finalAmount: finalAmount.toString(),
        commissionRate: PARTNER_DISCOUNT_RATE.toString(),
        notes: validated.notes || null,
        status: "pending",
        createdAt: new Date().toISOString(),
      }).returning();

      res.status(201).json({
        success: true,
        booking: {
          id: booking.id,
          serviceType: booking.serviceType,
          clientName: booking.clientName,
          originalAmount: originalAmount.toFixed(2),
          discountAmount: discountAmount.toFixed(2),
          finalAmount: finalAmount.toFixed(2),
          status: booking.status,
        },
        message: `Booking created with 10% partner discount. You saved $${discountAmount.toFixed(2)}!`,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Partner book error:", error);
      res.status(500).json({ error: "Booking failed" });
    }
  });

  app.use("/api/partners", router);
}
