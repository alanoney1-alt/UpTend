import { db } from "../../../db";
import {
  promotions,
  appPrioritySlots,
  promoCodes,
  promoCodeUsage,
  serviceRequests,
  type Promotion,
  type InsertPromotion,
  type AppPrioritySlot,
  type InsertAppPrioritySlot,
  type PromoCode,
  type InsertPromoCode,
  type PromoCodeUsage,
  type InsertPromoCodeUsage,
  type PriceQuote,
  type QuoteRequest,
  FIRST_JOB_DISCOUNT_AMOUNT,
  APP_PRIORITY_HOLD_HOURS
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export interface IPromotionsStorage {
  hasUsedFirstJobDiscount(userId: string): Promise<boolean>;
  createPromotion(promotion: InsertPromotion): Promise<Promotion>;
  getPromotionsByUser(userId: string): Promise<Promotion[]>;
  isSlotAvailableForApp(slotDate: string, slotTime: string): Promise<boolean>;
  reserveSlotForApp(slotDate: string, slotTime: string, userId: string): Promise<AppPrioritySlot>;
  getAvailablePrioritySlots(date: string): Promise<AppPrioritySlot[]>;
  isFirstTimeCustomer(userId: string): Promise<boolean>;
  calculateQuoteWithPromotions(request: QuoteRequest & { userId?: string; bookingSource?: string; promoCode?: string }): Promise<PriceQuote & { firstJobDiscount?: number; hasPriorityAccess?: boolean; promoDiscount?: number; promoCodeApplied?: string; loyaltyDiscount?: number; loyaltyTier?: string }>;
  createPromoCode(code: InsertPromoCode): Promise<PromoCode>;
  getPromoCodeByCode(code: string): Promise<PromoCode | undefined>;
  getAllPromoCodes(): Promise<PromoCode[]>;
  validateAndApplyPromoCode(code: string, userId: string, orderAmount: number, isApp: boolean): Promise<{ valid: boolean; discount: number; error?: string }>;
  recordPromoCodeUsage(promoCodeId: string, userId: string, serviceRequestId: string, discountApplied: number): Promise<PromoCodeUsage>;
}

export class PromotionsStorage implements IPromotionsStorage {
  async hasUsedFirstJobDiscount(userId: string): Promise<boolean> {
    const [existing] = await db.select().from(promotions)
      .where(and(
        eq(promotions.userId, userId),
        eq(promotions.promotionType, "first_job_discount")
      ));
    return !!existing;
  }

  async createPromotion(promotion: InsertPromotion): Promise<Promotion> {
    const [result] = await db.insert(promotions).values(promotion).returning();
    return result;
  }

  async getPromotionsByUser(userId: string): Promise<Promotion[]> {
    return db.select().from(promotions)
      .where(eq(promotions.userId, userId))
      .orderBy(desc(promotions.createdAt));
  }

  async isSlotAvailableForApp(slotDate: string, slotTime: string): Promise<boolean> {
    const today = new Date();
    const slotDateObj = new Date(slotDate);
    const dayOfWeek = slotDateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isSameDay = slotDateObj.toDateString() === today.toDateString();

    // Same-day and weekend slots are reserved for app bookings
    return isSameDay || isWeekend;
  }

  async reserveSlotForApp(slotDate: string, slotTime: string, userId: string): Promise<AppPrioritySlot> {
    const today = new Date();
    const slotDateObj = new Date(slotDate);
    const dayOfWeek = slotDateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isSameDay = slotDateObj.toDateString() === today.toDateString();

    const holdUntil = new Date();
    holdUntil.setHours(holdUntil.getHours() + APP_PRIORITY_HOLD_HOURS);

    const [slot] = await db.insert(appPrioritySlots).values({
      slotDate,
      slotTime,
      isSameDay,
      isWeekend,
      reservedForAppUntil: holdUntil.toISOString(),
      bookedBy: userId,
      bookingSource: "app",
      createdAt: new Date().toISOString(),
    }).returning();
    return slot;
  }

  async getAvailablePrioritySlots(date: string): Promise<AppPrioritySlot[]> {
    const slotDateObj = new Date(date);
    const dayOfWeek = slotDateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const today = new Date();
    const isSameDay = slotDateObj.toDateString() === today.toDateString();

    if (!isSameDay && !isWeekend) {
      return []; // No priority slots on regular weekdays
    }

    // Return available priority slots
    return db.select().from(appPrioritySlots)
      .where(eq(appPrioritySlots.slotDate, date));
  }

  async isFirstTimeCustomer(userId: string): Promise<boolean> {
    const completedJobs = await db.select().from(serviceRequests)
      .where(and(
        eq(serviceRequests.customerId, userId),
        eq(serviceRequests.status, "completed")
      ));
    return completedJobs.length === 0;
  }

  // NOTE: This method has a cross-domain dependency on calculateQuote from pricing-surge domain
  // and getUser from users domain. These will need to be injected or called via composition.
  async calculateQuoteWithPromotions(request: QuoteRequest & { userId?: string; bookingSource?: string; promoCode?: string }): Promise<PriceQuote & { firstJobDiscount?: number; hasPriorityAccess?: boolean; promoDiscount?: number; promoCodeApplied?: string; loyaltyDiscount?: number; loyaltyTier?: string }> {
    // TODO: This requires calculateQuote from pricing-surge domain
    // This should be handled at the composition layer (DatabaseStorage)
    throw new Error("calculateQuoteWithPromotions requires composition - use DatabaseStorage class");
  }

  async createPromoCode(code: InsertPromoCode): Promise<PromoCode> {
    const [promo] = await db.insert(promoCodes).values({
      ...code,
      createdAt: new Date().toISOString(),
    }).returning();
    return promo;
  }

  async getPromoCodeByCode(code: string): Promise<PromoCode | undefined> {
    const [promo] = await db.select().from(promoCodes)
      .where(eq(promoCodes.code, code.toUpperCase()));
    return promo;
  }

  async getAllPromoCodes(): Promise<PromoCode[]> {
    return db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt));
  }

  async validateAndApplyPromoCode(code: string, userId: string, orderAmount: number, isApp: boolean): Promise<{ valid: boolean; discount: number; error?: string }> {
    const promo = await this.getPromoCodeByCode(code.toUpperCase());

    if (!promo) {
      return { valid: false, discount: 0, error: "Invalid promo code" };
    }

    if (!promo.isActive) {
      return { valid: false, discount: 0, error: "Promo code is no longer active" };
    }

    if (promo.appOnly && !isApp) {
      return { valid: false, discount: 0, error: "This promo code is only valid in the app" };
    }

    if (promo.validFrom && new Date(promo.validFrom) > new Date()) {
      return { valid: false, discount: 0, error: "Promo code is not yet valid" };
    }

    if (promo.validUntil && new Date(promo.validUntil) < new Date()) {
      return { valid: false, discount: 0, error: "Promo code has expired" };
    }

    if (promo.maxUses && promo.currentUses && promo.currentUses >= promo.maxUses) {
      return { valid: false, discount: 0, error: "Promo code has reached its usage limit" };
    }

    if (promo.minOrderAmount && orderAmount < promo.minOrderAmount) {
      return { valid: false, discount: 0, error: `Minimum order amount is $${promo.minOrderAmount}` };
    }

    // Check if user has already used this code
    const [existingUsage] = await db.select().from(promoCodeUsage)
      .where(and(
        eq(promoCodeUsage.promoCodeId, promo.id),
        eq(promoCodeUsage.userId, userId)
      ));

    if (existingUsage) {
      return { valid: false, discount: 0, error: "You have already used this promo code" };
    }

    // Check first-time only restriction
    if (promo.firstTimeOnly) {
      const isFirstTime = await this.isFirstTimeCustomer(userId);
      if (!isFirstTime) {
        return { valid: false, discount: 0, error: "This promo code is only for first-time customers" };
      }
    }

    // Calculate discount
    let discount = 0;
    if (promo.discountType === "fixed") {
      discount = Math.min(promo.discountAmount, orderAmount);
    } else if (promo.discountType === "percent") {
      discount = orderAmount * (promo.discountAmount / 100);
    }

    return { valid: true, discount };
  }

  async recordPromoCodeUsage(promoCodeId: string, userId: string, serviceRequestId: string, discountApplied: number): Promise<PromoCodeUsage> {
    // Record the usage
    const [usage] = await db.insert(promoCodeUsage).values({
      promoCodeId,
      userId,
      serviceRequestId,
      discountApplied,
      usedAt: new Date().toISOString(),
    }).returning();

    // Increment the usage count on the promo code
    const promo = await this.getPromoCodeByCode(promoCodeId);
    if (promo) {
      await db.update(promoCodes)
        .set({ currentUses: (promo.currentUses || 0) + 1 })
        .where(eq(promoCodes.id, promo.id));
    }

    return usage;
  }
}
