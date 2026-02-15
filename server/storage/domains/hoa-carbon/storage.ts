import { db } from "../../../db";
import {
  carbonCredits,
  hoaProperties,
  hoaViolations,
  hoaReferralPayments,
  violationCommunications,
  businessAccounts,
  type CarbonCredit,
  type InsertCarbonCredit,
  type HoaProperty,
  type InsertHoaProperty,
  type HoaViolation,
  type InsertHoaViolation,
  type HoaReferralPayment,
  type InsertHoaReferralPayment,
  type ViolationCommunication,
  type InsertViolationCommunication,
  type BusinessAccount,
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IHoaCarbonStorage {
  // Carbon Credits
  createCarbonCredit(credit: InsertCarbonCredit): Promise<CarbonCredit>;
  getCarbonCreditsByBusinessAccount(businessAccountId: string): Promise<CarbonCredit[]>;
  getCarbonCreditsByServiceRequest(serviceRequestId: string): Promise<CarbonCredit | undefined>;
  updateCarbonCredit(id: string, updates: Partial<CarbonCredit>): Promise<CarbonCredit | undefined>;

  // Business Accounts
  getBusinessAccount(id: string): Promise<BusinessAccount | undefined>;

  // HOA Properties
  createHoaProperty(property: InsertHoaProperty): Promise<HoaProperty>;
  getHoaProperty(id: string): Promise<HoaProperty | undefined>;
  getHoaPropertiesByBusinessAccount(businessAccountId: string): Promise<HoaProperty[]>;
  updateHoaProperty(id: string, updates: Partial<HoaProperty>): Promise<HoaProperty | undefined>;

  // HOA Violations
  createHoaViolation(violation: InsertHoaViolation): Promise<HoaViolation>;
  getHoaViolation(id: string): Promise<HoaViolation | undefined>;
  getHoaViolationsByBusinessAccount(businessAccountId: string): Promise<HoaViolation[]>;
  getHoaViolationsByProperty(propertyId: string): Promise<HoaViolation[]>;
  updateHoaViolation(id: string, updates: Partial<HoaViolation>): Promise<HoaViolation | undefined>;

  // HOA Referral Payments
  createHoaReferralPayment(payment: InsertHoaReferralPayment): Promise<HoaReferralPayment>;
  getHoaReferralPaymentsByBusinessAccount(businessAccountId: string): Promise<HoaReferralPayment[]>;
  updateHoaReferralPayment(id: string, updates: Partial<HoaReferralPayment>): Promise<HoaReferralPayment | undefined>;

  // Violation Communications
  createViolationCommunication(communication: InsertViolationCommunication): Promise<ViolationCommunication>;
  getViolationCommunicationsByViolation(violationId: string): Promise<ViolationCommunication[]>;
  getViolationCommunicationsByProperty(propertyId: string): Promise<ViolationCommunication[]>;
  updateViolationCommunication(id: string, updates: Partial<ViolationCommunication>): Promise<ViolationCommunication | undefined>;
}

export class HoaCarbonStorage implements IHoaCarbonStorage {
  // Carbon Credits
  async createCarbonCredit(credit: InsertCarbonCredit): Promise<CarbonCredit> {
    const [newCredit] = await db.insert(carbonCredits).values(credit).returning();
    return newCredit;
  }

  async getCarbonCreditsByBusinessAccount(businessAccountId: string): Promise<CarbonCredit[]> {
    return db.select().from(carbonCredits).where(eq(carbonCredits.businessAccountId, businessAccountId));
  }

  async getCarbonCreditsByServiceRequest(serviceRequestId: string): Promise<CarbonCredit | undefined> {
    const [credit] = await db.select().from(carbonCredits).where(eq(carbonCredits.serviceRequestId, serviceRequestId));
    return credit || undefined;
  }

  async updateCarbonCredit(id: string, updates: Partial<CarbonCredit>): Promise<CarbonCredit | undefined> {
    const [credit] = await db.update(carbonCredits)
      .set(updates)
      .where(eq(carbonCredits.id, id))
      .returning();
    return credit || undefined;
  }

  // Business Accounts
  async getBusinessAccount(id: string): Promise<BusinessAccount | undefined> {
    const [account] = await db.select().from(businessAccounts).where(eq(businessAccounts.id, id));
    return account || undefined;
  }

  // HOA Properties
  async createHoaProperty(property: InsertHoaProperty): Promise<HoaProperty> {
    const [newProperty] = await db.insert(hoaProperties).values(property).returning();
    return newProperty;
  }

  async getHoaProperty(id: string): Promise<HoaProperty | undefined> {
    const [property] = await db.select().from(hoaProperties).where(eq(hoaProperties.id, id));
    return property || undefined;
  }

  async getHoaPropertiesByBusinessAccount(businessAccountId: string): Promise<HoaProperty[]> {
    return db.select().from(hoaProperties).where(eq(hoaProperties.businessAccountId, businessAccountId));
  }

  async updateHoaProperty(id: string, updates: Partial<HoaProperty>): Promise<HoaProperty | undefined> {
    const [property] = await db.update(hoaProperties)
      .set(updates)
      .where(eq(hoaProperties.id, id))
      .returning();
    return property || undefined;
  }

  // HOA Violations
  async createHoaViolation(violation: InsertHoaViolation): Promise<HoaViolation> {
    const [newViolation] = await db.insert(hoaViolations).values(violation).returning();
    return newViolation;
  }

  async getHoaViolation(id: string): Promise<HoaViolation | undefined> {
    const [violation] = await db.select().from(hoaViolations).where(eq(hoaViolations.id, id));
    return violation || undefined;
  }

  async getHoaViolationsByBusinessAccount(businessAccountId: string): Promise<HoaViolation[]> {
    return db.select().from(hoaViolations).where(eq(hoaViolations.businessAccountId, businessAccountId));
  }

  async getHoaViolationsByProperty(propertyId: string): Promise<HoaViolation[]> {
    return db.select().from(hoaViolations).where(eq(hoaViolations.propertyId, propertyId));
  }

  async updateHoaViolation(id: string, updates: Partial<HoaViolation>): Promise<HoaViolation | undefined> {
    const [violation] = await db.update(hoaViolations)
      .set(updates)
      .where(eq(hoaViolations.id, id))
      .returning();
    return violation || undefined;
  }

  // HOA Referral Payments
  async createHoaReferralPayment(payment: InsertHoaReferralPayment): Promise<HoaReferralPayment> {
    const [newPayment] = await db.insert(hoaReferralPayments).values(payment).returning();
    return newPayment;
  }

  async getHoaReferralPaymentsByBusinessAccount(businessAccountId: string): Promise<HoaReferralPayment[]> {
    return db.select().from(hoaReferralPayments).where(eq(hoaReferralPayments.businessAccountId, businessAccountId));
  }

  async updateHoaReferralPayment(id: string, updates: Partial<HoaReferralPayment>): Promise<HoaReferralPayment | undefined> {
    const [payment] = await db.update(hoaReferralPayments)
      .set(updates)
      .where(eq(hoaReferralPayments.id, id))
      .returning();
    return payment || undefined;
  }

  // Violation Communications
  async createViolationCommunication(communication: InsertViolationCommunication): Promise<ViolationCommunication> {
    const [newCommunication] = await db.insert(violationCommunications).values(communication).returning();
    return newCommunication;
  }

  async getViolationCommunicationsByViolation(violationId: string): Promise<ViolationCommunication[]> {
    return db.select().from(violationCommunications).where(eq(violationCommunications.violationId, violationId));
  }

  async getViolationCommunicationsByProperty(propertyId: string): Promise<ViolationCommunication[]> {
    return db.select().from(violationCommunications).where(eq(violationCommunications.propertyId, propertyId));
  }

  async updateViolationCommunication(id: string, updates: Partial<ViolationCommunication>): Promise<ViolationCommunication | undefined> {
    const [communication] = await db.update(violationCommunications)
      .set(updates)
      .where(eq(violationCommunications.id, id))
      .returning();
    return communication || undefined;
  }
}
