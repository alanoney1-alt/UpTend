import { db } from "../../../db";
import { customerAddresses, type CustomerAddress, type InsertCustomerAddress } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export interface ICustomerAddressesStorage {
  getCustomerAddresses(userId: string): Promise<CustomerAddress[]>;
  createCustomerAddress(data: InsertCustomerAddress): Promise<CustomerAddress>;
  updateCustomerAddress(id: string, userId: string, updates: Partial<CustomerAddress>): Promise<CustomerAddress | undefined>;
  deleteCustomerAddress(id: string, userId: string): Promise<void>;
  setDefaultCustomerAddress(id: string, userId: string): Promise<void>;
}

export class CustomerAddressesStorage implements ICustomerAddressesStorage {
  async getCustomerAddresses(userId: string): Promise<CustomerAddress[]> {
    return await db.select().from(customerAddresses)
      .where(eq(customerAddresses.userId, userId))
      .orderBy(desc(customerAddresses.isDefault), desc(customerAddresses.createdAt));
  }

  async createCustomerAddress(data: InsertCustomerAddress): Promise<CustomerAddress> {
    const [address] = await db.insert(customerAddresses).values(data).returning();
    return address;
  }

  async updateCustomerAddress(id: string, userId: string, updates: Partial<CustomerAddress>): Promise<CustomerAddress | undefined> {
    const [address] = await db.update(customerAddresses)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(customerAddresses.id, id), eq(customerAddresses.userId, userId)))
      .returning();
    return address || undefined;
  }

  async deleteCustomerAddress(id: string, userId: string): Promise<void> {
    await db.delete(customerAddresses)
      .where(and(eq(customerAddresses.id, id), eq(customerAddresses.userId, userId)));
  }

  async setDefaultCustomerAddress(id: string, userId: string): Promise<void> {
    // First, unset all defaults for this user
    await db.update(customerAddresses)
      .set({ isDefault: false })
      .where(eq(customerAddresses.userId, userId));
    // Then set the selected address as default
    await db.update(customerAddresses)
      .set({ isDefault: true })
      .where(and(eq(customerAddresses.id, id), eq(customerAddresses.userId, userId)));
  }
}
