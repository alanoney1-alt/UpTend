import type { Express } from "express";
import { storage } from "../../storage";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth";

const sendMessageSchema = z.object({
  recipientType: z.enum(["single", "all", "multiple"]),
  propertyId: z.string().uuid().optional(),
  propertyIds: z.array(z.string().uuid()).optional(),
  subject: z.string().min(1),
  message: z.string().min(1),
  sendVia: z.enum(["email", "sms", "both"]),
  messageType: z.enum(["violation", "announcement", "reminder", "emergency"]),
});

export function registerHoaCommunicationRoutes(app: Express) {
  // ==========================================
  // HOA COMMUNICATION ENGINE
  // ==========================================

  // Send message to homeowner(s)
  app.post("/api/business/:businessAccountId/communications", requireAuth, async (req, res) => {
    try {
      const { businessAccountId } = req.params;

      // Verify user owns this business account
      const businessAccount = await storage.getBusinessAccount(businessAccountId);
      if (!businessAccount || businessAccount.userId !== req.user!.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const data = sendMessageSchema.parse(req.body);

      // Determine recipient properties
      let recipientProperties: any[] = [];

      if (data.recipientType === "single" && data.propertyId) {
        const property = await storage.getHoaProperty(data.propertyId);
        if (property && property.businessAccountId === businessAccountId) {
          recipientProperties = [property];
        }
      } else if (data.recipientType === "all") {
        recipientProperties = await storage.getHoaPropertiesByBusinessAccount(businessAccountId);
      } else if (data.recipientType === "multiple" && data.propertyIds) {
        const properties = await storage.getHoaPropertiesByBusinessAccount(businessAccountId);
        recipientProperties = properties.filter(p => data.propertyIds!.includes(p.id));
      }

      if (recipientProperties.length === 0) {
        return res.status(400).json({ error: "No valid recipients found" });
      }

      // Process variable substitution and send messages
      const sentMessages: any[] = [];

      for (const property of recipientProperties) {
        // Replace variables in message
        let personalizedMessage = data.message
          .replace(/\{address\}/g, property.address)
          .replace(/\{owner_name\}/g, property.ownerName || "Homeowner")
          .replace(/\{hoa_name\}/g, businessAccount.businessName);

        const personalizedSubject = data.subject
          .replace(/\{address\}/g, property.address)
          .replace(/\{owner_name\}/g, property.ownerName || "Homeowner");

        // Create communication record
        const communication = await storage.createViolationCommunication({
          violationId: null, // Not linked to specific violation
          propertyId: property.id,
          businessAccountId,
          communicationType: data.messageType,
          method: data.sendVia,
          channel: data.sendVia, // Required: same as method
          recipient: property.ownerEmail || property.ownerPhone || "unknown", // Required: contact info
          subject: personalizedSubject,
          message: personalizedMessage,
          sentBy: req.user!.id,
          sentAt: new Date().toISOString(),
          status: "sent",
        });

        // TODO: Actually send email/SMS using notification service
        // For now, we're just logging the communication

        sentMessages.push({
          communicationId: communication.id,
          propertyId: property.id,
          propertyAddress: property.address,
          status: "sent",
        });
      }

      res.json({
        success: true,
        messagesSent: sentMessages.length,
        details: sentMessages,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Send communication error:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Get communication history for business account
  app.get("/api/business/:businessAccountId/communications", requireAuth, async (req, res) => {
    try {
      const { businessAccountId } = req.params;

      // Verify user owns this business account
      const businessAccount = await storage.getBusinessAccount(businessAccountId);
      if (!businessAccount || businessAccount.userId !== req.user!.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Get all properties to map addresses
      const properties = await storage.getHoaPropertiesByBusinessAccount(businessAccountId);
      const propertyMap = new Map(properties.map(p => [p.id, p]));

      // Get all communications (we'll query violation communications as proxy)
      // In production, you'd want a dedicated communications table
      const communications: any[] = [];

      // Get communications for each property
      for (const property of properties) {
        const propComms = await storage.getViolationCommunicationsByViolation(property.id);
        propComms.forEach(comm => {
          const prop = propertyMap.get(comm.propertyId || "");
          communications.push({
            id: comm.id,
            propertyId: comm.propertyId,
            propertyAddress: prop?.address || "Unknown",
            ownerName: prop?.ownerName || null,
            type: comm.communicationType || "announcement",
            subject: comm.subject || "",
            message: comm.message || "",
            sentVia: comm.method || "email",
            sentAt: comm.sentAt || comm.createdAt,
            status: comm.status || "sent",
          });
        });
      }

      // Sort by date (newest first)
      communications.sort((a, b) =>
        new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
      );

      res.json(communications);
    } catch (error) {
      console.error("Get communications error:", error);
      res.status(500).json({ error: "Failed to fetch communications" });
    }
  });

  // Get communications for a specific property
  app.get("/api/hoa/properties/:propertyId/communications", requireAuth, async (req, res) => {
    try {
      const { propertyId } = req.params;

      // Verify property exists and user owns it
      const property = await storage.getHoaProperty(propertyId);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }

      const businessAccount = await storage.getBusinessAccount(property.businessAccountId);
      if (!businessAccount || businessAccount.userId !== req.user!.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Get communications for this property
      const communications = await storage.getViolationCommunicationsByViolation(propertyId);

      res.json(communications.map(comm => ({
        id: comm.id,
        type: comm.communicationType,
        subject: comm.subject,
        message: comm.message,
        sentVia: comm.method,
        sentAt: comm.sentAt || comm.createdAt,
        status: comm.status,
      })));
    } catch (error) {
      console.error("Get property communications error:", error);
      res.status(500).json({ error: "Failed to fetch communications" });
    }
  });

  // Update communication status (mark as read, failed, etc.)
  app.patch("/api/hoa/communications/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !["sent", "delivered", "failed", "read"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      // Get communication to verify ownership
      // Using violation communication as proxy
      // TODO: In production, implement dedicated communications table

      const updated = await storage.updateViolationCommunication(id, { status });

      if (!updated) {
        return res.status(404).json({ error: "Communication not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Update communication error:", error);
      res.status(500).json({ error: "Failed to update communication" });
    }
  });
}
