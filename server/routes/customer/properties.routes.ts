import type { Express, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

// In-memory store — TODO: migrate to DB using `properties` table from schema.ts
interface CustomerProperty {
  id: string;
  userId: string;
  address: string;
  nickname: string;
  relationship: "my_home" | "parents_home" | "rental_property" | "vacation_home";
  isPrimary: boolean;
  lastServiceDate: string | null;
  homeHealthScore: number | null;
  createdAt: string;
  updatedAt: string;
}

const customerProperties: CustomerProperty[] = [];

function requireAuth(req: Request, res: Response): string | null {
  const user = (req as any).user;
  if (!user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  return user.id;
}

export function registerCustomerPropertyRoutes(app: Express) {
  // List user's properties
  app.get("/api/customer/properties", (req: Request, res: Response) => {
    const userId = requireAuth(req, res);
    if (!userId) return;
    const props = customerProperties.filter((p) => p.userId === userId);
    // Sort: primary first, then by createdAt
    props.sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0) || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    res.json(props);
  });

  // Add property
  app.post("/api/customer/properties", (req: Request, res: Response) => {
    const userId = requireAuth(req, res);
    if (!userId) return;
    const { address, nickname, relationship } = req.body;
    if (!address || !nickname || !relationship) {
      return res.status(400).json({ error: "address, nickname, and relationship are required" });
    }
    const validRelationships = ["my_home", "parents_home", "rental_property", "vacation_home"];
    if (!validRelationships.includes(relationship)) {
      return res.status(400).json({ error: `relationship must be one of: ${validRelationships.join(", ")}` });
    }
    const userProps = customerProperties.filter((p) => p.userId === userId);
    const isPrimary = userProps.length === 0; // First property is auto-primary
    const now = new Date().toISOString();
    const prop: CustomerProperty = {
      id: uuidv4(),
      userId,
      address,
      nickname,
      relationship,
      isPrimary,
      lastServiceDate: null,
      homeHealthScore: null,
      createdAt: now,
      updatedAt: now,
    };
    customerProperties.push(prop);
    res.status(201).json(prop);
  });

  // Update property
  app.put("/api/customer/properties/:id", (req: Request, res: Response) => {
    const userId = requireAuth(req, res);
    if (!userId) return;
    const prop = customerProperties.find((p) => p.id === req.params.id && p.userId === userId);
    if (!prop) return res.status(404).json({ error: "Property not found" });
    const { address, nickname, relationship } = req.body;
    if (address) prop.address = address;
    if (nickname) prop.nickname = nickname;
    if (relationship) prop.relationship = relationship;
    prop.updatedAt = new Date().toISOString();
    res.json(prop);
  });

  // Delete property
  app.delete("/api/customer/properties/:id", (req: Request, res: Response) => {
    const userId = requireAuth(req, res);
    if (!userId) return;
    const idx = customerProperties.findIndex((p) => p.id === req.params.id && p.userId === userId);
    if (idx === -1) return res.status(404).json({ error: "Property not found" });
    const wasPrimary = customerProperties[idx].isPrimary;
    customerProperties.splice(idx, 1);
    // If deleted was primary, make the first remaining one primary
    if (wasPrimary) {
      const remaining = customerProperties.filter((p) => p.userId === userId);
      if (remaining.length > 0) remaining[0].isPrimary = true;
    }
    res.json({ success: true });
  });

  // Set as primary
  app.put("/api/customer/properties/:id/primary", (req: Request, res: Response) => {
    const userId = requireAuth(req, res);
    if (!userId) return;
    const prop = customerProperties.find((p) => p.id === req.params.id && p.userId === userId);
    if (!prop) return res.status(404).json({ error: "Property not found" });
    // Unset all, set this one
    customerProperties.filter((p) => p.userId === userId).forEach((p) => (p.isPrimary = false));
    prop.isPrimary = true;
    prop.updatedAt = new Date().toISOString();
    res.json(prop);
  });
}
