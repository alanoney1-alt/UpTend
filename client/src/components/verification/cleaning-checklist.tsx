/**
 * PolishUp Cleaning Checklist Component
 *
 * Pro dashboard interface for completing room-by-room cleaning tasks
 * Real-time progress tracking and skip functionality with reasons
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, XCircle, Clock, AlertTriangle, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ChecklistTask } from "@shared/polishup-checklists";

interface CleaningChecklistProps {
  serviceRequestId: string;
  checklist: (ChecklistTask & {
    completed: boolean;
    skipped: boolean;
    skipReason?: string;
  })[];
  onComplete: () => void;
}

interface SkipDialogState {
  open: boolean;
  task: (ChecklistTask & { completed: boolean; skipped: boolean; skipReason?: string }) | null;
}

export function CleaningChecklist({ serviceRequestId, checklist, onComplete }: CleaningChecklistProps) {
  const queryClient = useQueryClient();
  const [localChecklist, setLocalChecklist] = useState(checklist);
  const [skipDialog, setSkipDialog] = useState<SkipDialogState>({ open: false, task: null });
  const [skipReason, setSkipReason] = useState("");

  // Group checklist by room type
  const groupedChecklist = localChecklist.reduce((acc, task) => {
    if (!acc[task.roomType]) {
      acc[task.roomType] = [];
    }
    acc[task.roomType].push(task);
    return acc;
  }, {} as Record<string, typeof localChecklist>);

  const roomTypeLabels: Record<string, string> = {
    kitchen: "Kitchen",
    bathroom: "Bathrooms",
    bedroom: "Bedrooms",
    living_room: "Living Areas",
    dining_room: "Dining Room",
    office: "Office",
    general: "General Tasks",
  };

  // Calculate progress
  const totalTasks = localChecklist.length;
  const completedTasks = localChecklist.filter(t => t.completed).length;
  const skippedTasks = localChecklist.filter(t => t.skipped).length;
  const completionRate = Math.round((completedTasks / totalTasks) * 100);
  const progressWithSkipped = Math.round(((completedTasks + skippedTasks) / totalTasks) * 100);

  // Minimum completion rate required
  const MINIMUM_COMPLETION_RATE = 85;
  const canComplete = completionRate >= MINIMUM_COMPLETION_RATE;

  const updateTaskMutation = useMutation({
    mutationFn: async ({
      taskId,
      completed,
      skipped,
      skipReason,
    }: {
      taskId: string;
      completed: boolean;
      skipped: boolean;
      skipReason?: string;
    }) => {
      const response = await apiRequest("PUT", `/api/cleaning-checklists/${serviceRequestId}/tasks/${taskId}`, {
        completed,
        skipped,
        skipReason,
        completedAt: completed ? new Date().toISOString() : null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cleaning-checklists/${serviceRequestId}`] });
    },
  });

  const handleToggleTask = (taskId: string, currentCompleted: boolean) => {
    // Toggle completion
    setLocalChecklist(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, completed: !currentCompleted, skipped: false } : task
      )
    );

    updateTaskMutation.mutate({
      taskId,
      completed: !currentCompleted,
      skipped: false,
    });
  };

  const handleSkipTask = (task: typeof localChecklist[0]) => {
    setSkipDialog({ open: true, task });
    setSkipReason("");
  };

  const confirmSkip = () => {
    if (!skipDialog.task || !skipReason.trim()) return;

    const taskId = skipDialog.task.id;

    setLocalChecklist(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, skipped: true, completed: false, skipReason } : task
      )
    );

    updateTaskMutation.mutate({
      taskId,
      completed: false,
      skipped: true,
      skipReason,
    });

    setSkipDialog({ open: false, task: null });
    setSkipReason("");
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Cleaning Checklist
              </CardTitle>
              <CardDescription className="mt-1">
                {completedTasks} of {totalTasks} tasks completed
                {skippedTasks > 0 && ` • ${skippedTasks} skipped`}
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{completionRate}%</p>
              <p className="text-xs text-muted-foreground">completion rate</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={completionRate} className="h-3" />

          {!canComplete && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-900 dark:text-yellow-100">
                  {MINIMUM_COMPLETION_RATE}% completion required
                </p>
                <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                  Complete at least {Math.ceil(totalTasks * (MINIMUM_COMPLETION_RATE / 100))} tasks before finishing the job.
                </p>
              </div>
            </div>
          )}

          {canComplete && progressWithSkipped === 100 && (
            <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-900 dark:text-green-100">
                  Checklist complete! Ready to finish job.
                </p>
                <p className="text-green-700 dark:text-green-300 mt-1">
                  Take after photos and complete the job verification.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Room-by-Room Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks by Room</CardTitle>
          <CardDescription>Check off tasks as you complete each room</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={Object.keys(groupedChecklist)} className="w-full">
            {Object.entries(groupedChecklist).map(([roomType, tasks]) => {
              const roomCompleted = tasks.filter(t => t.completed).length;
              const roomSkipped = tasks.filter(t => t.skipped).length;
              const roomTotal = tasks.length;
              const roomProgress = Math.round((roomCompleted / roomTotal) * 100);
              const roomDone = roomCompleted + roomSkipped === roomTotal;

              return (
                <AccordionItem key={roomType} value={roomType}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        {roomDone ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <Clock className="w-5 h-5 text-muted-foreground" />
                        )}
                        <span className="font-medium">{roomTypeLabels[roomType]}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          {roomCompleted}/{roomTotal}
                        </span>
                        <Badge variant={roomDone ? "default" : "secondary"}>
                          {roomProgress}%
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pt-2">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                            task.completed
                              ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                              : task.skipped
                              ? "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800 opacity-60"
                              : "bg-background hover:bg-accent"
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <Checkbox
                              checked={task.completed}
                              disabled={task.skipped}
                              onCheckedChange={() => handleToggleTask(task.id, task.completed)}
                              className="shrink-0"
                            />
                            <div className="flex-1">
                              <p
                                className={`text-sm ${
                                  task.completed
                                    ? "line-through text-muted-foreground"
                                    : task.skipped
                                    ? "line-through text-muted-foreground"
                                    : ""
                                }`}
                              >
                                {task.taskName}
                              </p>
                              {task.skipped && task.skipReason && (
                                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                                  Skipped: {task.skipReason}
                                </p>
                              )}
                            </div>
                          </div>
                          {!task.completed && !task.skipped && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSkipTask(task)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              Skip
                            </Button>
                          )}
                          {task.completed && (
                            <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                          )}
                          {task.skipped && (
                            <XCircle className="w-5 h-5 text-yellow-500 shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* Skip Task Dialog */}
      <Dialog open={skipDialog.open} onOpenChange={(open) => setSkipDialog({ open, task: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Skip Task</DialogTitle>
            <DialogDescription>
              Please provide a reason for skipping this task. This will be visible to the customer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {skipDialog.task && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">{skipDialog.task.taskName}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="skip-reason">Reason for skipping</Label>
              <Input
                id="skip-reason"
                placeholder="e.g., Customer asked to skip, Area inaccessible, etc."
                value={skipReason}
                onChange={(e) => setSkipReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSkipDialog({ open: false, task: null })}>
              Cancel
            </Button>
            <Button onClick={confirmSkip} disabled={!skipReason.trim()}>
              Confirm Skip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Button */}
      {canComplete && (
        <Button
          onClick={onComplete}
          className="w-full"
          size="lg"
          disabled={progressWithSkipped < 100}
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          Continue to After Photos
        </Button>
      )}
    </div>
  );
}
