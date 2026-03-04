import { Router, type Express } from "express";
import { db } from "../db";
import { discoveryLeads } from "../../shared/schema";
import { eq, desc, ilike, and, sql } from "drizzle-orm";

export function registerSalesLeadsRoutes(app: Express) {
  const router = Router();

  // POST /api/partners/discovery-lead — save a discovery lead
  app.post("/api/partners/discovery-lead", async (req, res) => {
    try {
      const { email, name, proposal, messages } = req.body;

      // Extract fields from proposal if available
      const p = proposal || {};
      const [lead] = await db.insert(discoveryLeads).values({
        companyName: p.businessName || p.companyName || name || null,
        serviceType: p.serviceType || p.industry || null,
        contactName: name || p.contactName || null,
        contactEmail: email || null,
        contactPhone: p.contactPhone || p.phone || null,
        collectedData: p.collectedData || p.extractedData || null,
        proposal: proposal || null,
        messages: messages || null,
        auditData: p.auditData || p.audit || null,
        status: "new",
      }).returning();

      res.json({ success: true, id: lead.id });
    } catch (error: any) {
      console.error("Discovery lead save error:", error);
      res.status(500).json({ error: "Failed to save lead" });
    }
  });

  // GET /api/sales/leads — list leads (paginated, trimmed)
  router.get("/", async (req, res) => {
    try {
      const { status, search } = req.query;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const offset = (page - 1) * limit;
      const conditions: any[] = [];

      if (status && status !== "all") {
        conditions.push(eq(discoveryLeads.status, status as string));
      }

      if (search && typeof search === "string" && search.trim()) {
        const term = `%${search.trim()}%`;
        conditions.push(
          sql`(${discoveryLeads.companyName} ILIKE ${term} OR ${discoveryLeads.contactName} ILIKE ${term} OR ${discoveryLeads.contactEmail} ILIKE ${term})`
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const [{ count: totalCount }] = await db.select({ count: sql<number>`count(*)` })
        .from(discoveryLeads)
        .where(whereClause);

      // Get paginated results — only summary fields for list view
      const leads = await db.select({
        id: discoveryLeads.id,
        companyName: discoveryLeads.companyName,
        serviceType: discoveryLeads.serviceType,
        contactName: discoveryLeads.contactName,
        contactEmail: discoveryLeads.contactEmail,
        contactPhone: discoveryLeads.contactPhone,
        status: discoveryLeads.status,
        proposal: discoveryLeads.proposal,
        createdAt: discoveryLeads.createdAt,
        updatedAt: discoveryLeads.updatedAt,
      }).from(discoveryLeads)
        .where(whereClause)
        .orderBy(desc(discoveryLeads.createdAt))
        .limit(limit)
        .offset(offset);

      // Trim proposal to just package/painPoints summary for list view
      const trimmedLeads = leads.map(l => ({
        ...l,
        proposal: l.proposal ? {
          suggestedPackage: (l.proposal as any).suggestedPackage || (l.proposal as any).package || (l.proposal as any).recommendedPackage,
          painPoints: (l.proposal as any).painPoints || (l.proposal as any).challenges,
          businessSummary: (l.proposal as any).businessSummary || (l.proposal as any).summary,
        } : null,
      }));

      res.json({
        leads: trimmedLeads,
        pagination: {
          page,
          limit,
          total: Number(totalCount),
          totalPages: Math.ceil(Number(totalCount) / limit),
        },
      });
    } catch (error: any) {
      console.error("Sales leads list error:", error);
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  // GET /api/sales/leads/:id — single lead
  router.get("/:id", async (req, res) => {
    try {
      const [lead] = await db.select().from(discoveryLeads)
        .where(eq(discoveryLeads.id, req.params.id))
        .limit(1);

      if (!lead) return res.status(404).json({ error: "Lead not found" });
      res.json({ lead });
    } catch (error: any) {
      console.error("Sales lead detail error:", error);
      res.status(500).json({ error: "Failed to fetch lead" });
    }
  });

  // PATCH /api/sales/leads/:id/status — update status
  router.patch("/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const validStatuses = ["new", "contacted", "consultation_scheduled", "closed_won", "closed_lost"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const [updated] = await db.update(discoveryLeads)
        .set({ status, updatedAt: new Date() })
        .where(eq(discoveryLeads.id, req.params.id))
        .returning();

      if (!updated) return res.status(404).json({ error: "Lead not found" });
      res.json({ lead: updated });
    } catch (error: any) {
      console.error("Sales lead status update error:", error);
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  app.use("/api/sales/leads", router);
}
