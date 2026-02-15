/**
 * Cleaning Checklists API Routes
 *
 * Handles PolishUp room-by-room task completion tracking
 */

import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { requireAuth } from "../auth-middleware";
import { z } from "zod";

const updateTaskSchema = z.object({
  completed: z.boolean().optional(),
  skipped: z.boolean().optional(),
  skipReason: z.string().optional(),
  completedAt: z.string().optional(),
});

export function registerCleaningChecklistRoutes(app: Express) {
  /**
   * Get checklist for a service request
   * GET /api/cleaning-checklists/:serviceRequestId
   */
  app.get("/api/cleaning-checklists/:serviceRequestId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { serviceRequestId } = req.params;
      const checklist = await storage.getCleaningChecklistsByRequest(serviceRequestId);

      res.json(checklist);
    } catch (error) {
      console.error("Error fetching cleaning checklist:", error);
      res.status(500).json({ error: "Failed to fetch checklist" });
    }
  });

  /**
   * Update a single checklist task
   * PUT /api/cleaning-checklists/:serviceRequestId/tasks/:taskId
   */
  app.put("/api/cleaning-checklists/:serviceRequestId/tasks/:taskId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { taskId } = req.params;
      const data = updateTaskSchema.parse(req.body);

      const updated = await storage.updateCleaningChecklistTask(taskId, data);

      if (!updated) {
        return res.status(404).json({ error: "Task not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating checklist task:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid update data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update task" });
      }
    }
  });

  /**
   * Get checklist completion progress
   * GET /api/cleaning-checklists/:serviceRequestId/progress
   */
  app.get("/api/cleaning-checklists/:serviceRequestId/progress", requireAuth, async (req: Request, res: Response) => {
    try {
      const { serviceRequestId } = req.params;
      const checklist = await storage.getCleaningChecklistsByRequest(serviceRequestId);

      const totalTasks = checklist.length;
      const completedTasks = checklist.filter(t => t.completed).length;
      const skippedTasks = checklist.filter(t => t.skipped).length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const progressWithSkipped = totalTasks > 0 ? Math.round(((completedTasks + skippedTasks) / totalTasks) * 100) : 0;

      res.json({
        totalTasks,
        completedTasks,
        skippedTasks,
        completionRate,
        progressWithSkipped,
        canComplete: completionRate >= 85, // Minimum 85% completion required
      });
    } catch (error) {
      console.error("Error calculating progress:", error);
      res.status(500).json({ error: "Failed to calculate progress" });
    }
  });

  /**
   * Bulk create checklist tasks
   * POST /api/cleaning-checklists/:serviceRequestId/bulk
   */
  app.post("/api/cleaning-checklists/:serviceRequestId/bulk", requireAuth, async (req: Request, res: Response) => {
    try {
      const { serviceRequestId } = req.params;
      const { tasks } = req.body;

      if (!Array.isArray(tasks)) {
        return res.status(400).json({ error: "tasks must be an array" });
      }

      // Add serviceRequestId to each task
      const tasksWithRequestId = tasks.map(task => ({
        ...task,
        serviceRequestId,
      }));

      const created = await storage.bulkCreateCleaningChecklists(tasksWithRequestId);

      res.json(created);
    } catch (error) {
      console.error("Error creating checklist tasks:", error);
      res.status(500).json({ error: "Failed to create checklist tasks" });
    }
  });
}
