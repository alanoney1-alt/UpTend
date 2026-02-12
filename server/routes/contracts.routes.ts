import type { Express } from "express";
import { requireAuth } from "../auth-middleware";
import { db } from "../db";
import { serviceContracts } from "@shared/schema";
import { eq } from "drizzle-orm";

export function registerContractRoutes(app: Express) {
  // Get contract for a service request
  app.get("/api/contracts/:serviceRequestId", requireAuth, async (req, res) => {
    try {
      const { serviceRequestId } = req.params;
      const [contract] = await db.select()
        .from(serviceContracts)
        .where(eq(serviceContracts.serviceRequestId, serviceRequestId));

      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }

      res.json(contract);
    } catch (error) {
      console.error("Error fetching contract:", error);
      res.status(500).json({ error: "Failed to fetch contract" });
    }
  });

  // Create a contract (auto-generated when pro accepts job)
  app.post("/api/contracts", requireAuth, async (req, res) => {
    try {
      const { serviceRequestId, customerId, haulerId, scopeOfWork, agreedPrice } = req.body;

      if (!serviceRequestId || !customerId || !haulerId || !scopeOfWork || !agreedPrice) {
        return res.status(400).json({ error: "All fields required: serviceRequestId, customerId, haulerId, scopeOfWork, agreedPrice" });
      }

      const [contract] = await db.insert(serviceContracts).values({
        serviceRequestId,
        customerId,
        haulerId,
        scopeOfWork,
        agreedPrice: Number(agreedPrice),
        status: "pending_customer",
      }).returning();

      res.status(201).json(contract);
    } catch (error) {
      console.error("Error creating contract:", error);
      res.status(500).json({ error: "Failed to create contract" });
    }
  });

  // Sign a contract (role-aware: customer or pro)
  app.post("/api/contracts/:id/sign", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { id } = req.params;
      const { signature } = req.body;

      if (!signature) {
        return res.status(400).json({ error: "Signature (base64) is required" });
      }

      const [contract] = await db.select()
        .from(serviceContracts)
        .where(eq(serviceContracts.id, id));

      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }

      if (contract.status === "voided") {
        return res.status(400).json({ error: "Contract has been voided" });
      }

      if (contract.status === "signed") {
        return res.status(400).json({ error: "Contract is already fully signed" });
      }

      const isCustomer = user.id === contract.customerId;
      const isPro = user.id === contract.haulerId;

      if (!isCustomer && !isPro) {
        return res.status(403).json({ error: "You are not a party to this contract" });
      }

      const now = new Date().toISOString();
      const updates: any = { updatedAt: now };

      if (isCustomer) {
        if (contract.customerSignature) {
          return res.status(400).json({ error: "Customer has already signed" });
        }
        updates.customerSignature = signature;
        updates.customerSignedAt = now;
        // If pro already signed, contract is fully signed
        updates.status = contract.proSignature ? "signed" : "pending_pro";
      } else {
        if (contract.proSignature) {
          return res.status(400).json({ error: "Pro has already signed" });
        }
        updates.proSignature = signature;
        updates.proSignedAt = now;
        updates.status = contract.customerSignature ? "signed" : "pending_customer";
      }

      const [updated] = await db.update(serviceContracts)
        .set(updates)
        .where(eq(serviceContracts.id, id))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Error signing contract:", error);
      res.status(500).json({ error: "Failed to sign contract" });
    }
  });
}
