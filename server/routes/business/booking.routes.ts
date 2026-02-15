/**
 * Business Booking Routes
 * B2B booking flow for PMs and HOAs to book services against their properties.
 */

import { Router } from "express";
import { db } from "../../db";
import { eq, and, desc } from "drizzle-orm";
import {
  businessBookings,
  businessPreferredPros,
  businessAccounts,
  hoaProperties,
  type InsertBusinessBooking,
  type InsertBusinessPreferredPro,
} from "@shared/schema";
import { requireAuth } from "../../middleware/auth";

const router = Router();

// Helper: get business account for authenticated user
async function getBusinessAccountForUser(userId: string) {
  const [account] = await db
    .select()
    .from(businessAccounts)
    .where(eq(businessAccounts.userId, userId));
  return account || undefined;
}

// POST /api/business/bookings — create a single booking
router.post("/bookings", requireAuth, async (req, res) => {
  try {
    const userId = ((req.user as any).userId || (req.user as any).id);
    const account = await getBusinessAccountForUser(userId);
    if (!account) {
      return res.status(403).json({ error: "No business account found" });
    }

    const {
      propertyId, serviceType, address, city, state, zipCode,
      scheduledFor, scheduledTime, recurringFrequency, recurringEndDate,
      preferredProId, accessNotes, gateCode, specialInstructions,
      unitNotes, priceEstimate, billingMethod,
    } = req.body;

    if (!serviceType || !address || !city || !state || !zipCode || !scheduledFor) {
      return res.status(400).json({ error: "Missing required fields: serviceType, address, city, state, zipCode, scheduledFor" });
    }

    const [booking] = await db.insert(businessBookings).values({
      businessAccountId: account.id,
      propertyId: propertyId || null,
      serviceType,
      address,
      city,
      state,
      zipCode,
      scheduledFor,
      scheduledTime: scheduledTime || null,
      recurringFrequency: recurringFrequency || null,
      recurringEndDate: recurringEndDate || null,
      preferredProId: preferredProId || null,
      accessNotes: accessNotes || null,
      gateCode: gateCode || null,
      specialInstructions: specialInstructions || null,
      unitNotes: unitNotes || null,
      priceEstimate: priceEstimate || null,
      billingMethod: billingMethod || "business_account",
      createdBy: userId,
      status: "pending",
    } as InsertBusinessBooking).returning();

    res.status(201).json(booking);
  } catch (error) {
    console.error("Error creating business booking:", error);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

// GET /api/business/bookings — list all bookings for business account
router.get("/bookings", requireAuth, async (req, res) => {
  try {
    const userId = ((req.user as any).userId || (req.user as any).id);
    const account = await getBusinessAccountForUser(userId);
    if (!account) {
      return res.status(403).json({ error: "No business account found" });
    }

    const bookings = await db
      .select()
      .from(businessBookings)
      .where(eq(businessBookings.businessAccountId, account.id))
      .orderBy(desc(businessBookings.createdAt));

    res.json(bookings);
  } catch (error) {
    console.error("Error listing business bookings:", error);
    res.status(500).json({ error: "Failed to list bookings" });
  }
});

// GET /api/business/bookings/:id — booking detail
router.get("/bookings/:id", requireAuth, async (req, res) => {
  try {
    const userId = ((req.user as any).userId || (req.user as any).id);
    const account = await getBusinessAccountForUser(userId);
    if (!account) {
      return res.status(403).json({ error: "No business account found" });
    }

    const [booking] = await db
      .select()
      .from(businessBookings)
      .where(
        and(
          eq(businessBookings.id, req.params.id),
          eq(businessBookings.businessAccountId, account.id)
        )
      );

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json(booking);
  } catch (error) {
    console.error("Error getting business booking:", error);
    res.status(500).json({ error: "Failed to get booking" });
  }
});

// POST /api/business/bookings/bulk — bulk create across multiple properties
router.post("/bookings/bulk", requireAuth, async (req, res) => {
  try {
    const userId = ((req.user as any).userId || (req.user as any).id);
    const account = await getBusinessAccountForUser(userId);
    if (!account) {
      return res.status(403).json({ error: "No business account found" });
    }

    const { propertyIds, serviceType, scheduledFor, scheduledTime, recurringFrequency, recurringEndDate, preferredProId, accessNotes, specialInstructions, priceEstimate } = req.body;

    if (!propertyIds?.length || !serviceType || !scheduledFor) {
      return res.status(400).json({ error: "Missing required fields: propertyIds, serviceType, scheduledFor" });
    }

    // Fetch all selected properties
    const properties = await db
      .select()
      .from(hoaProperties)
      .where(
        and(
          eq(hoaProperties.businessAccountId, account.id),
          eq(hoaProperties.isActive, true)
        )
      );

    const propertyMap = new Map(properties.map(p => [p.id, p]));
    const bulkGroupId = crypto.randomUUID();
    const bookingsToCreate: InsertBusinessBooking[] = [];

    for (const propId of propertyIds) {
      const prop = propertyMap.get(propId);
      if (!prop) continue;

      bookingsToCreate.push({
        businessAccountId: account.id,
        propertyId: propId,
        serviceType,
        address: prop.address,
        city: prop.city,
        state: prop.state,
        zipCode: prop.zipCode,
        scheduledFor,
        scheduledTime: scheduledTime || null,
        recurringFrequency: recurringFrequency || null,
        recurringEndDate: recurringEndDate || null,
        preferredProId: preferredProId || null,
        accessNotes: accessNotes || null,
        specialInstructions: specialInstructions || null,
        priceEstimate: priceEstimate || null,
        billingMethod: "business_account",
        bulkBookingGroupId: bulkGroupId,
        createdBy: userId,
        status: "pending",
      } as InsertBusinessBooking);
    }

    if (bookingsToCreate.length === 0) {
      return res.status(400).json({ error: "No valid properties found" });
    }

    const created = await db.insert(businessBookings).values(bookingsToCreate).returning();
    res.status(201).json({ bulkGroupId: bulkGroupId, bookings: created });
  } catch (error) {
    console.error("Error creating bulk bookings:", error);
    res.status(500).json({ error: "Failed to create bulk bookings" });
  }
});

// PUT /api/business/bookings/:id/recurring — set up recurring schedule
router.put("/bookings/:id/recurring", requireAuth, async (req, res) => {
  try {
    const userId = ((req.user as any).userId || (req.user as any).id);
    const account = await getBusinessAccountForUser(userId);
    if (!account) {
      return res.status(403).json({ error: "No business account found" });
    }

    const { recurringFrequency, recurringEndDate } = req.body;

    const [updated] = await db
      .update(businessBookings)
      .set({
        recurringFrequency,
        recurringEndDate: recurringEndDate || null,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(businessBookings.id, req.params.id),
          eq(businessBookings.businessAccountId, account.id)
        )
      )
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Error updating recurring schedule:", error);
    res.status(500).json({ error: "Failed to update recurring schedule" });
  }
});

// GET /api/business/preferred-pros — get preferred pros for business
router.get("/preferred-pros", requireAuth, async (req, res) => {
  try {
    const userId = ((req.user as any).userId || (req.user as any).id);
    const account = await getBusinessAccountForUser(userId);
    if (!account) {
      return res.status(403).json({ error: "No business account found" });
    }

    const pros = await db
      .select()
      .from(businessPreferredPros)
      .where(eq(businessPreferredPros.businessAccountId, account.id));

    res.json(pros);
  } catch (error) {
    console.error("Error listing preferred pros:", error);
    res.status(500).json({ error: "Failed to list preferred pros" });
  }
});

// POST /api/business/preferred-pros — add a preferred pro
router.post("/preferred-pros", requireAuth, async (req, res) => {
  try {
    const userId = ((req.user as any).userId || (req.user as any).id);
    const account = await getBusinessAccountForUser(userId);
    if (!account) {
      return res.status(403).json({ error: "No business account found" });
    }

    const { proId, proName, serviceTypes, rating, notes } = req.body;

    if (!proId) {
      return res.status(400).json({ error: "proId is required" });
    }

    const [pro] = await db.insert(businessPreferredPros).values({
      businessAccountId: account.id,
      proId,
      proName: proName || null,
      serviceTypes: serviceTypes || null,
      rating: rating || null,
      notes: notes || null,
    } as InsertBusinessPreferredPro).returning();

    res.status(201).json(pro);
  } catch (error) {
    console.error("Error adding preferred pro:", error);
    res.status(500).json({ error: "Failed to add preferred pro" });
  }
});

// GET /api/business/properties — get properties for the business account
router.get("/properties", requireAuth, async (req, res) => {
  try {
    const userId = ((req.user as any).userId || (req.user as any).id);
    const account = await getBusinessAccountForUser(userId);
    if (!account) {
      return res.status(403).json({ error: "No business account found" });
    }

    const properties = await db
      .select()
      .from(hoaProperties)
      .where(
        and(
          eq(hoaProperties.businessAccountId, account.id),
          eq(hoaProperties.isActive, true)
        )
      );

    res.json(properties);
  } catch (error) {
    console.error("Error listing properties:", error);
    res.status(500).json({ error: "Failed to list properties" });
  }
});

export default router;
