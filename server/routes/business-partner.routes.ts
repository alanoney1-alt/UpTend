/**
 * Business Partner Routes
 *
 * Company onboarding, employee management, rates, dashboard, jobs, revenue
 * for home service companies that load their employees as pros on UpTend.
 */

import type { Express, Request, Response } from "express";
import { db } from "../db";
import {
  businessPartners,
  businessPartnerEmployees,
  businessPartnerRates,
  haulerProfiles,
  serviceRequests,
  haulerReviews,
} from "../../shared/schema";
import { users } from "../../shared/models/auth";
import { eq, and, sql, inArray, gte, lte, desc } from "drizzle-orm";
import { PLATFORM_SERVICE_RATES } from "./pro-pricing.routes";
import bcrypt from "bcrypt";

// Helper: get authenticated business partner
async function getBusinessPartner(req: Request) {
  if (!req.isAuthenticated?.() || !req.user) return null;
  const userId = (req.user as any).userId || (req.user as any).id;
  const [bp] = await db
    .select()
    .from(businessPartners)
    .where(and(eq(businessPartners.userId, userId), eq(businessPartners.isActive, true)))
    .limit(1);
  return bp || null;
}

export function registerBusinessPartnerRoutes(app: Express) {
  // ── POST /api/business-partner/register ──
  app.post("/api/business-partner/register", async (req: Request, res: Response) => {
    try {
      const {
        companyName, ownerName, email, phone, password,
        ein, insuranceProvider, insurancePolicyNumber, insuranceExpiration,
        yearsInBusiness, serviceTypes, serviceArea,
      } = req.body;

      if (!companyName || !ownerName || !email || !phone || !password) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check if email already exists
      const [existingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      let userId: string;

      if (existingUser) {
        // Check if already a business partner
        const [existingBp] = await db
          .select({ id: businessPartners.id })
          .from(businessPartners)
          .where(eq(businessPartners.userId, existingUser.id))
          .limit(1);
        if (existingBp) {
          return res.status(400).json({ error: "This email is already registered as a business partner" });
        }
        userId = existingUser.id;
      } else {
        // Create user account
        const hashedPassword = await bcrypt.hash(password, 10);
        const [newUser] = await db
          .insert(users)
          .values({
            email,
            password: hashedPassword,
            firstName: ownerName.split(" ")[0] || ownerName,
            lastName: ownerName.split(" ").slice(1).join(" ") || "",
            phone,
            role: "business_user",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .returning({ id: users.id });
        userId = newUser.id;
      }

      // Create business partner record
      const [bp] = await db
        .insert(businessPartners)
        .values({
          userId,
          companyName,
          ownerName,
          email,
          phone,
          ein: ein || null,
          insuranceProvider: insuranceProvider || null,
          insurancePolicyNumber: insurancePolicyNumber || null,
          insuranceExpiration: insuranceExpiration || null,
          yearsInBusiness: yearsInBusiness || 1,
          serviceTypes: serviceTypes || [],
          serviceArea: serviceArea || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning();

      res.json({ businessId: bp.id, message: "Business partner registered successfully" });
    } catch (error: any) {
      console.error("Business partner registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // ── GET /api/business-partner/profile ──
  app.get("/api/business-partner/profile", async (req: Request, res: Response) => {
    const bp = await getBusinessPartner(req);
    if (!bp) return res.status(401).json({ error: "Not a business partner" });
    res.json(bp);
  });

  // ── PUT /api/business-partner/profile ──
  app.put("/api/business-partner/profile", async (req: Request, res: Response) => {
    const bp = await getBusinessPartner(req);
    if (!bp) return res.status(401).json({ error: "Not a business partner" });

    const { companyName, ownerName, phone, ein, insuranceProvider, insurancePolicyNumber, insuranceExpiration, yearsInBusiness, serviceTypes, serviceArea } = req.body;

    const [updated] = await db
      .update(businessPartners)
      .set({
        ...(companyName && { companyName }),
        ...(ownerName && { ownerName }),
        ...(phone && { phone }),
        ...(ein !== undefined && { ein }),
        ...(insuranceProvider !== undefined && { insuranceProvider }),
        ...(insurancePolicyNumber !== undefined && { insurancePolicyNumber }),
        ...(insuranceExpiration !== undefined && { insuranceExpiration }),
        ...(yearsInBusiness !== undefined && { yearsInBusiness }),
        ...(serviceTypes && { serviceTypes }),
        ...(serviceArea !== undefined && { serviceArea }),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(businessPartners.id, bp.id))
      .returning();

    res.json(updated);
  });

  // ── POST /api/business-partner/employees ──
  app.post("/api/business-partner/employees", async (req: Request, res: Response) => {
    const bp = await getBusinessPartner(req);
    if (!bp) return res.status(401).json({ error: "Not a business partner" });

    const { firstName, lastName, email, phone, serviceTypes } = req.body;
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: "firstName, lastName, and email are required" });
    }

    try {
      // Check if user already exists
      const [existingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      let proUserId: string;

      if (existingUser) {
        proUserId = existingUser.id;
        // Check if already linked
        const [existingLink] = await db
          .select({ id: businessPartnerEmployees.id })
          .from(businessPartnerEmployees)
          .where(and(
            eq(businessPartnerEmployees.businessPartnerId, bp.id),
            eq(businessPartnerEmployees.proUserId, existingUser.id),
            eq(businessPartnerEmployees.isActive, true),
          ))
          .limit(1);
        if (existingLink) {
          return res.status(400).json({ error: "Employee is already linked to your business" });
        }
      } else {
        // Create user + hauler profile
        const tempPassword = Math.random().toString(36).slice(2, 10) + "A1!";
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        const [newUser] = await db
          .insert(users)
          .values({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            phone: phone || "",
            role: "hauler",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .returning({ id: users.id });
        proUserId = newUser.id;

        // Create hauler profile (auto-verified via business insurance)
        await db.insert(haulerProfiles).values({
          userId: proUserId,
          companyName: `${firstName} ${lastName}`,
          vehicleType: "none",
          capacity: "labor_only",
          serviceTypes: serviceTypes || bp.serviceTypes || ["junk_removal"],
          verified: true,
          hasInsurance: true,
          isAvailable: false,
          canAcceptJobs: true,
          businessPartnerId: bp.id,
          createdAt: new Date().toISOString(),
        } as any);
      }

      // Link employee to business
      await db.insert(businessPartnerEmployees).values({
        businessPartnerId: bp.id,
        proUserId,
        addedAt: new Date().toISOString(),
        isActive: true,
      });

      // Update hauler profile with business link
      await db
        .update(haulerProfiles)
        .set({ businessPartnerId: bp.id, verified: true, hasInsurance: true } as any)
        .where(eq(haulerProfiles.userId, proUserId));

      res.json({ proUserId, message: "Employee added successfully" });
    } catch (error: any) {
      console.error("Add employee error:", error);
      res.status(500).json({ error: "Failed to add employee" });
    }
  });

  // ── GET /api/business-partner/employees ──
  app.get("/api/business-partner/employees", async (req: Request, res: Response) => {
    const bp = await getBusinessPartner(req);
    if (!bp) return res.status(401).json({ error: "Not a business partner" });

    const employees = await db
      .select({
        proUserId: businessPartnerEmployees.proUserId,
        addedAt: businessPartnerEmployees.addedAt,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        isAvailable: haulerProfiles.isAvailable,
        rating: haulerProfiles.rating,
        jobsCompleted: haulerProfiles.jobsCompleted,
        serviceTypes: haulerProfiles.serviceTypes,
      })
      .from(businessPartnerEmployees)
      .innerJoin(users, eq(businessPartnerEmployees.proUserId, users.id))
      .leftJoin(haulerProfiles, eq(haulerProfiles.userId, businessPartnerEmployees.proUserId))
      .where(and(
        eq(businessPartnerEmployees.businessPartnerId, bp.id),
        eq(businessPartnerEmployees.isActive, true),
      ));

    res.json(employees);
  });

  // ── PUT /api/business-partner/employees/:proId ──
  app.put("/api/business-partner/employees/:proId", async (req: Request, res: Response) => {
    const bp = await getBusinessPartner(req);
    if (!bp) return res.status(401).json({ error: "Not a business partner" });

    const { proId } = req.params;
    const { serviceTypes } = req.body;

    if (serviceTypes) {
      await db
        .update(haulerProfiles)
        .set({ serviceTypes })
        .where(eq(haulerProfiles.userId, proId));
    }

    res.json({ message: "Employee updated" });
  });

  // ── DELETE /api/business-partner/employees/:proId ──
  app.delete("/api/business-partner/employees/:proId", async (req: Request, res: Response) => {
    const bp = await getBusinessPartner(req);
    if (!bp) return res.status(401).json({ error: "Not a business partner" });

    const { proId } = req.params;

    // Soft-unlink: set isActive=false on employee link, remove businessPartnerId from profile
    await db
      .update(businessPartnerEmployees)
      .set({ isActive: false })
      .where(and(
        eq(businessPartnerEmployees.businessPartnerId, bp.id),
        eq(businessPartnerEmployees.proUserId, proId),
      ));

    await db
      .update(haulerProfiles)
      .set({ businessPartnerId: null } as any)
      .where(eq(haulerProfiles.userId, proId));

    res.json({ message: "Employee removed from business. Their profile and reviews are preserved." });
  });

  // ── POST /api/business-partner/rates ──
  app.post("/api/business-partner/rates", async (req: Request, res: Response) => {
    const bp = await getBusinessPartner(req);
    if (!bp) return res.status(401).json({ error: "Not a business partner" });

    const { rates } = req.body; // [{serviceType, baseRate}]
    if (!Array.isArray(rates)) return res.status(400).json({ error: "rates must be an array" });

    const updated: any[] = [];
    const errors: string[] = [];

    for (const { serviceType, baseRate } of rates) {
      const platform = PLATFORM_SERVICE_RATES[serviceType];
      if (!platform) { errors.push(`Unknown: ${serviceType}`); continue; }
      if (typeof baseRate !== "number" || baseRate < platform.minRate || baseRate > platform.maxRate) {
        errors.push(`${serviceType} rate must be $${platform.minRate}-$${platform.maxRate}`);
        continue;
      }

      // Upsert
      const [existing] = await db
        .select({ id: businessPartnerRates.id })
        .from(businessPartnerRates)
        .where(and(
          eq(businessPartnerRates.businessPartnerId, bp.id),
          eq(businessPartnerRates.serviceType, serviceType),
        ))
        .limit(1);

      if (existing) {
        await db
          .update(businessPartnerRates)
          .set({ baseRate, updatedAt: new Date().toISOString() })
          .where(eq(businessPartnerRates.id, existing.id));
      } else {
        await db.insert(businessPartnerRates).values({
          businessPartnerId: bp.id,
          serviceType,
          baseRate,
          updatedAt: new Date().toISOString(),
        });
      }
      updated.push({ serviceType, baseRate });
    }

    res.json({ updated, errors: errors.length > 0 ? errors : undefined });
  });

  // ── GET /api/business-partner/rates ──
  app.get("/api/business-partner/rates", async (req: Request, res: Response) => {
    const bp = await getBusinessPartner(req);
    if (!bp) return res.status(401).json({ error: "Not a business partner" });

    const rates = await db
      .select()
      .from(businessPartnerRates)
      .where(eq(businessPartnerRates.businessPartnerId, bp.id));

    // Merge with platform defaults
    const result = (bp.serviceTypes || []).map((st: string) => {
      const platform = PLATFORM_SERVICE_RATES[st];
      const custom = rates.find(r => r.serviceType === st);
      return {
        serviceType: st,
        displayName: platform?.displayName || st,
        unit: platform?.unit || "per job",
        minRate: platform?.minRate || 50,
        maxRate: platform?.maxRate || 500,
        recommendedRate: platform?.recommendedRate || 150,
        currentRate: custom?.baseRate || platform?.recommendedRate || 150,
        isCustom: !!custom,
      };
    });

    res.json({ rates: result, rateMode: bp.rateMode });
  });

  // ── PUT /api/business-partner/rate-mode ──
  app.put("/api/business-partner/rate-mode", async (req: Request, res: Response) => {
    const bp = await getBusinessPartner(req);
    if (!bp) return res.status(401).json({ error: "Not a business partner" });

    const { rateMode } = req.body;
    if (!["company", "individual"].includes(rateMode)) {
      return res.status(400).json({ error: "rateMode must be 'company' or 'individual'" });
    }

    await db
      .update(businessPartners)
      .set({ rateMode, updatedAt: new Date().toISOString() })
      .where(eq(businessPartners.id, bp.id));

    res.json({ rateMode });
  });

  // ── GET /api/business-partner/dashboard ──
  app.get("/api/business-partner/dashboard", async (req: Request, res: Response) => {
    const bp = await getBusinessPartner(req);
    if (!bp) return res.status(401).json({ error: "Not a business partner" });

    // Get employee IDs
    const empRows = await db
      .select({ proUserId: businessPartnerEmployees.proUserId })
      .from(businessPartnerEmployees)
      .where(and(
        eq(businessPartnerEmployees.businessPartnerId, bp.id),
        eq(businessPartnerEmployees.isActive, true),
      ));
    const empIds = empRows.map(e => e.proUserId);

    // Online count
    let onlineCount = 0;
    if (empIds.length > 0) {
      const onlineRows = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(haulerProfiles)
        .where(and(
          inArray(haulerProfiles.userId, empIds),
          eq(haulerProfiles.isAvailable, true),
        ));
      onlineCount = onlineRows[0]?.count || 0;
    }

    // Jobs and revenue this week/month (business-routed only)
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let jobsThisWeek = 0, jobsThisMonth = 0, revenueThisWeek = 0, revenueThisMonth = 0;

    if (empIds.length > 0) {
      const weekJobs = await db
        .select({
          count: sql<number>`count(*)::int`,
          revenue: sql<number>`coalesce(sum(${serviceRequests.finalPrice}), 0)`,
        })
        .from(serviceRequests)
        .where(and(
          eq(serviceRequests.businessPartnerId as any, bp.id),
          sql`${serviceRequests.createdAt} >= ${weekStart.toISOString()}`,
        ));
      jobsThisWeek = weekJobs[0]?.count || 0;
      revenueThisWeek = weekJobs[0]?.revenue || 0;

      const monthJobs = await db
        .select({
          count: sql<number>`count(*)::int`,
          revenue: sql<number>`coalesce(sum(${serviceRequests.finalPrice}), 0)`,
        })
        .from(serviceRequests)
        .where(and(
          eq(serviceRequests.businessPartnerId as any, bp.id),
          sql`${serviceRequests.createdAt} >= ${monthStart.toISOString()}`,
        ));
      jobsThisMonth = monthJobs[0]?.count || 0;
      revenueThisMonth = monthJobs[0]?.revenue || 0;
    }

    // Avg rating
    let avgRating = 0;
    if (empIds.length > 0) {
      const ratingRows = await db
        .select({ avg: sql<number>`coalesce(avg(${haulerProfiles.rating}), 0)` })
        .from(haulerProfiles)
        .where(inArray(haulerProfiles.userId, empIds));
      avgRating = Math.round((ratingRows[0]?.avg || 0) * 10) / 10;
    }

    res.json({
      companyName: bp.companyName,
      totalEmployees: empIds.length,
      onlineCount,
      jobsThisWeek,
      jobsThisMonth,
      revenueThisWeek: Math.round(revenueThisWeek * 100) / 100,
      revenueThisMonth: Math.round(revenueThisMonth * 100) / 100,
      avgRating,
    });
  });

  // ── GET /api/business-partner/jobs ──
  app.get("/api/business-partner/jobs", async (req: Request, res: Response) => {
    const bp = await getBusinessPartner(req);
    if (!bp) return res.status(401).json({ error: "Not a business partner" });

    const { employee, status, from, to } = req.query;

    let conditions = [eq(serviceRequests.businessPartnerId as any, bp.id)];
    if (employee) conditions.push(eq(serviceRequests.assignedHaulerId, employee as string));
    if (status) conditions.push(eq(serviceRequests.status, status as string));
    if (from) conditions.push(sql`${serviceRequests.createdAt} >= ${from as string}`);
    if (to) conditions.push(sql`${serviceRequests.createdAt} <= ${to as string}`);

    const jobs = await db
      .select({
        id: serviceRequests.id,
        serviceType: serviceRequests.serviceType,
        status: serviceRequests.status,
        finalPrice: serviceRequests.finalPrice,
        priceEstimate: serviceRequests.priceEstimate,
        assignedHaulerId: serviceRequests.assignedHaulerId,
        pickupAddress: serviceRequests.pickupAddress,
        scheduledFor: serviceRequests.scheduledFor,
        completedAt: serviceRequests.completedAt,
        createdAt: serviceRequests.createdAt,
        proFirstName: users.firstName,
      })
      .from(serviceRequests)
      .leftJoin(users, eq(serviceRequests.assignedHaulerId, users.id))
      .where(and(...conditions))
      .orderBy(desc(serviceRequests.createdAt))
      .limit(100);

    res.json(jobs);
  });

  // ── GET /api/business-partner/revenue ──
  app.get("/api/business-partner/revenue", async (req: Request, res: Response) => {
    const bp = await getBusinessPartner(req);
    if (!bp) return res.status(401).json({ error: "Not a business partner" });

    // Get all completed business-routed jobs
    const jobs = await db
      .select({
        finalPrice: serviceRequests.finalPrice,
        serviceType: serviceRequests.serviceType,
        assignedHaulerId: serviceRequests.assignedHaulerId,
        completedAt: serviceRequests.completedAt,
        proFirstName: users.firstName,
      })
      .from(serviceRequests)
      .leftJoin(users, eq(serviceRequests.assignedHaulerId, users.id))
      .where(and(
        eq(serviceRequests.businessPartnerId as any, bp.id),
        eq(serviceRequests.status, "completed"),
      ));

    let grossRevenue = 0;
    const byEmployee: Record<string, { name: string; gross: number; jobs: number }> = {};
    const byService: Record<string, { gross: number; jobs: number }> = {};

    for (const job of jobs) {
      const price = job.finalPrice || 0;
      grossRevenue += price;

      const empKey = job.assignedHaulerId || "unknown";
      if (!byEmployee[empKey]) byEmployee[empKey] = { name: job.proFirstName || "Pro", gross: 0, jobs: 0 };
      byEmployee[empKey].gross += price;
      byEmployee[empKey].jobs += 1;

      const svcKey = job.serviceType;
      if (!byService[svcKey]) byService[svcKey] = { gross: 0, jobs: 0 };
      byService[svcKey].gross += price;
      byService[svcKey].jobs += 1;
    }

    const platformFee = Math.round(grossRevenue * 0.15 * 100) / 100;
    const netPayout = Math.round((grossRevenue - platformFee) * 100) / 100;

    res.json({
      grossRevenue: Math.round(grossRevenue * 100) / 100,
      platformFee,
      netPayout,
      byEmployee: Object.entries(byEmployee).map(([id, data]) => ({
        proId: id,
        name: data.name,
        grossRevenue: Math.round(data.gross * 100) / 100,
        platformFee: Math.round(data.gross * 0.15 * 100) / 100,
        netPayout: Math.round(data.gross * 0.85 * 100) / 100,
        jobs: data.jobs,
      })),
      byService: Object.entries(byService).map(([type, data]) => ({
        serviceType: type,
        grossRevenue: Math.round(data.gross * 100) / 100,
        jobs: data.jobs,
      })),
    });
  });

  // ── GET /api/business-partner/check ── (check if current user is a business partner OR an employee of one)
  app.get("/api/business-partner/check", async (req: Request, res: Response) => {
    if (!req.isAuthenticated?.() || !req.user) {
      return res.json({ isBusinessPartner: false, isEmployee: false, businessPartner: null });
    }
    const userId = (req.user as any).userId || (req.user as any).id;

    // Check if owner
    const bp = await getBusinessPartner(req);
    if (bp) {
      return res.json({ isBusinessPartner: true, isEmployee: false, businessPartner: bp });
    }

    // Check if employee
    const [empLink] = await db
      .select({
        businessPartnerId: businessPartnerEmployees.businessPartnerId,
      })
      .from(businessPartnerEmployees)
      .where(and(
        eq(businessPartnerEmployees.proUserId, userId),
        eq(businessPartnerEmployees.isActive, true),
      ))
      .limit(1);

    if (empLink) {
      const [bpRecord] = await db
        .select()
        .from(businessPartners)
        .where(eq(businessPartners.id, empLink.businessPartnerId))
        .limit(1);
      return res.json({ isBusinessPartner: false, isEmployee: true, businessPartner: bpRecord || null });
    }

    res.json({ isBusinessPartner: false, isEmployee: false, businessPartner: null });
  });
}
