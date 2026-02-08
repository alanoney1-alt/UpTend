import { db } from "../../../db";
import { pyckerVehicles, type PyckerVehicle, type InsertPyckerVehicle } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IVehiclesStorage {
  createPyckerVehicle(vehicle: InsertPyckerVehicle): Promise<PyckerVehicle>;
  getPyckerVehicles(haulerProfileId: string): Promise<PyckerVehicle[]>;
  getPyckerVehicle(id: string): Promise<PyckerVehicle | undefined>;
  updatePyckerVehicle(id: string, updates: Partial<PyckerVehicle>): Promise<PyckerVehicle | undefined>;
  deletePyckerVehicle(id: string): Promise<boolean>;
}

export class VehiclesStorage implements IVehiclesStorage {
  async createPyckerVehicle(vehicle: InsertPyckerVehicle): Promise<PyckerVehicle> {
    const [newVehicle] = await db.insert(pyckerVehicles).values(vehicle).returning();
    return newVehicle;
  }

  async getPyckerVehicles(haulerProfileId: string): Promise<PyckerVehicle[]> {
    return db.select().from(pyckerVehicles)
      .where(eq(pyckerVehicles.haulerProfileId, haulerProfileId));
  }

  async getPyckerVehicle(id: string): Promise<PyckerVehicle | undefined> {
    const [vehicle] = await db.select().from(pyckerVehicles)
      .where(eq(pyckerVehicles.id, id));
    return vehicle || undefined;
  }

  async updatePyckerVehicle(id: string, updates: Partial<PyckerVehicle>): Promise<PyckerVehicle | undefined> {
    const [vehicle] = await db.update(pyckerVehicles)
      .set(updates)
      .where(eq(pyckerVehicles.id, id))
      .returning();
    return vehicle || undefined;
  }

  async deletePyckerVehicle(id: string): Promise<boolean> {
    const result = await db.delete(pyckerVehicles)
      .where(eq(pyckerVehicles.id, id));
    return true;
  }
}
