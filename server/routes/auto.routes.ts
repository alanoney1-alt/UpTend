/**
 * Auto Services Routes - Vehicle profiles, maintenance, diagnosis, parts, OBD codes, tutorials
 */

import type { Express, Request, Response } from "express";
import {
  addVehicle, getCustomerVehicles, getVehicleById, lookupVehicleByVIN,
  getMaintenanceSchedule, logMaintenance, getMaintenanceDue,
  diagnoseIssue, searchAutoParts, findAutoTutorial, getOBDCodeInfo, estimateRepairCost,
  startVehicleDIYSession, checkVehicleRecalls, getMaintenanceHistory, comparePartsPrices,
} from "../services/auto-services.js";

export function registerAutoRoutes(app: Express) {
  // POST /api/auto/vehicles - add vehicle
  app.post("/api/auto/vehicles", async (req: Request, res: Response) => {
    try {
      const { customerId, ...vehicleData } = req.body;
      if (!customerId) return res.status(400).json({ error: "customerId required" });
      const vehicle = await addVehicle(customerId, vehicleData);
      res.json({ success: true, vehicle });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // GET /api/auto/vehicles/:customerId - list vehicles
  app.get("/api/auto/vehicles/:customerId", async (req: Request, res: Response) => {
    try {
      const vehicles = await getCustomerVehicles(req.params.customerId);
      res.json({ vehicles });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // GET /api/auto/vehicle/:vehicleId - vehicle detail
  app.get("/api/auto/vehicle/:vehicleId", async (req: Request, res: Response) => {
    try {
      const vehicle = await getVehicleById(req.params.vehicleId);
      if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });
      res.json({ vehicle });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /api/auto/vin-lookup - decode VIN
  app.post("/api/auto/vin-lookup", async (req: Request, res: Response) => {
    try {
      const { vin } = req.body;
      if (!vin) return res.status(400).json({ error: "vin required" });
      const decoded = await lookupVehicleByVIN(vin);
      res.json({ success: true, decoded });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // GET /api/auto/maintenance/:vehicleId - maintenance schedule
  app.get("/api/auto/maintenance/:vehicleId", async (req: Request, res: Response) => {
    try {
      const schedule = await getMaintenanceSchedule(req.params.vehicleId);
      res.json({ schedule });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /api/auto/maintenance/log - log service
  app.post("/api/auto/maintenance/log", async (req: Request, res: Response) => {
    try {
      const { customerId, vehicleId, ...entry } = req.body;
      if (!customerId || !vehicleId) return res.status(400).json({ error: "customerId and vehicleId required" });
      const log = await logMaintenance(customerId, vehicleId, entry);
      res.json({ success: true, log });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // GET /api/auto/maintenance-due/:customerId - what's due
  app.get("/api/auto/maintenance-due/:customerId", async (req: Request, res: Response) => {
    try {
      const due = await getMaintenanceDue(req.params.customerId);
      res.json({ due });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /api/auto/diagnose - diagnose issue
  app.post("/api/auto/diagnose", async (req: Request, res: Response) => {
    try {
      const { symptomDescription, vehicleInfo, photoUrl } = req.body;
      if (!symptomDescription) return res.status(400).json({ error: "symptomDescription required" });
      const diagnosis = await diagnoseIssue(symptomDescription, vehicleInfo, photoUrl);
      res.json({ success: true, diagnosis });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /api/auto/parts-search - search parts
  app.post("/api/auto/parts-search", async (req: Request, res: Response) => {
    try {
      const { partName, year, make, model, customerId, vehicleId } = req.body;
      if (!partName) return res.status(400).json({ error: "partName required" });
      const results = await searchAutoParts(partName, year, make, model, customerId, vehicleId);
      res.json({ success: true, results });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /api/auto/tutorial - find tutorial
  app.post("/api/auto/tutorial", async (req: Request, res: Response) => {
    try {
      const { task, year, make, model } = req.body;
      if (!task) return res.status(400).json({ error: "task required" });
      const tutorial = await findAutoTutorial(task, year, make, model);
      res.json({ success: true, tutorial });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // GET /api/auto/obd/:code - OBD code lookup
  app.get("/api/auto/obd/:code", async (req: Request, res: Response) => {
    try {
      const info = await getOBDCodeInfo(req.params.code);
      res.json({ success: true, info });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /api/auto/diy-start - start a vehicle DIY repair session
  app.post("/api/auto/diy-start", async (req: Request, res: Response) => {
    try {
      const { customerId, vehicleId, issue } = req.body;
      if (!customerId || !issue) return res.status(400).json({ error: "customerId and issue required" });
      const session = await startVehicleDIYSession(customerId, vehicleId, issue);
      res.json({ success: true, session });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // GET /api/auto/recalls/:vin - check NHTSA recalls
  app.get("/api/auto/recalls/:vin", async (req: Request, res: Response) => {
    try {
      const recalls = await checkVehicleRecalls(req.params.vin);
      res.json({ success: true, recalls });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // GET /api/auto/maintenance/history/:vehicleId - maintenance history
  app.get("/api/auto/maintenance/history/:vehicleId", async (req: Request, res: Response) => {
    try {
      const history = await getMaintenanceHistory(req.params.vehicleId);
      res.json({ success: true, history });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /api/auto/parts-price-compare - compare parts prices across retailers
  app.post("/api/auto/parts-price-compare", async (req: Request, res: Response) => {
    try {
      const { partName, year, make, model, customerId, vehicleId } = req.body;
      if (!partName) return res.status(400).json({ error: "partName required" });
      const comparison = await comparePartsPrices(partName, year, make, model, customerId, vehicleId);
      res.json({ success: true, comparison });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}
