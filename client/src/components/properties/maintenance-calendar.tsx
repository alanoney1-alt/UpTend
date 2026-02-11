import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, Clock, AlertCircle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PropertyMaintenanceSchedule } from "@shared/schema";

interface MaintenanceCalendarProps {
  propertyId: string;
}

export function MaintenanceCalendar({ propertyId }: MaintenanceCalendarProps) {
  const [tasks, setTasks] = useState<PropertyMaintenanceSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"overdue" | "upcoming" | "completed">("overdue");

  useEffect(() => {
    fetchMaintenanceTasks();
  }, [propertyId]);

  async function fetchMaintenanceTasks() {
    try {
      const response = await fetch(`/api/properties/${propertyId}/maintenance-schedule`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error("Failed to fetch maintenance tasks:", error);
    } finally {
      setLoading(false);
    }
  }

  async function markTaskComplete(taskId: string) {
    try {
      const response = await fetch(`/api/maintenance-tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          lastCompletedDate: new Date().toISOString(),
          isOverdue: false,
          overdueDays: 0,
        }),
      });

      if (response.ok) {
        fetchMaintenanceTasks();
      }
    } catch (error) {
      console.error("Failed to mark task complete:", error);
    }
  }

  function getTaskIcon(priority?: string) {
    if (priority === "critical") return <AlertCircle className="h-5 w-5 text-red-600" />;
    if (priority === "high") return <AlertCircle className="h-5 w-5 text-orange-600" />;
    if (priority === "medium") return <Clock className="h-5 w-5 text-yellow-600" />;
    return <Clock className="h-5 w-5 text-blue-600" />;
  }

  function getPriorityColor(priority?: string) {
    if (priority === "critical") return "bg-red-100 text-red-800 border-red-300";
    if (priority === "high") return "bg-orange-100 text-orange-800 border-orange-300";
    if (priority === "medium") return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-blue-100 text-blue-800 border-blue-300";
  }

  function getFrequencyLabel(frequency?: string) {
    const labels: Record<string, string> = {
      weekly: "Weekly",
      monthly: "Monthly",
      quarterly: "Quarterly",
      biannual: "Every 6 Months",
      annual: "Annually",
      biennial: "Every 2 Years",
      custom: "Custom",
    };
    return labels[frequency || ""] || frequency;
  }

  const overdueTasks = tasks.filter((t) => t.isOverdue);
  const upcomingTasks = tasks.filter((t) => !t.isOverdue && !t.lastCompletedDate);
  const completedTasks = tasks.filter((t) => t.lastCompletedDate);

  const displayTasks =
    view === "overdue" ? overdueTasks : view === "upcoming" ? upcomingTasks : completedTasks;

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Maintenance Calendar</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                AI-generated maintenance schedule based on your property
              </p>
            </div>
            <Button disabled>
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Task
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div
              className={cn(
                "text-center p-4 rounded-lg border-2 cursor-pointer transition-all",
                view === "overdue"
                  ? "bg-red-50 border-red-300"
                  : "bg-gray-50 border-gray-200 hover:border-gray-300"
              )}
              onClick={() => setView("overdue")}
            >
              <p className="text-3xl font-bold text-red-600">{overdueTasks.length}</p>
              <p className="text-sm text-muted-foreground">Overdue</p>
            </div>
            <div
              className={cn(
                "text-center p-4 rounded-lg border-2 cursor-pointer transition-all",
                view === "upcoming"
                  ? "bg-blue-50 border-blue-300"
                  : "bg-gray-50 border-gray-200 hover:border-gray-300"
              )}
              onClick={() => setView("upcoming")}
            >
              <p className="text-3xl font-bold text-blue-600">{upcomingTasks.length}</p>
              <p className="text-sm text-muted-foreground">Upcoming</p>
            </div>
            <div
              className={cn(
                "text-center p-4 rounded-lg border-2 cursor-pointer transition-all",
                view === "completed"
                  ? "bg-green-50 border-green-300"
                  : "bg-gray-50 border-gray-200 hover:border-gray-300"
              )}
              onClick={() => setView("completed")}
            >
              <p className="text-3xl font-bold text-green-600">{completedTasks.length}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      {displayTasks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {view === "overdue"
                  ? "No overdue tasks"
                  : view === "upcoming"
                  ? "No upcoming tasks"
                  : "No completed tasks"}
              </h3>
              <p className="text-muted-foreground">
                {view === "overdue"
                  ? "You're all caught up!"
                  : view === "upcoming"
                  ? "Tasks will appear as they become due"
                  : "Complete tasks to see them here"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayTasks.map((task) => (
            <Card
              key={task.id}
              className={cn(
                "border-l-4",
                task.isOverdue && "border-red-500",
                !task.isOverdue && !task.lastCompletedDate && "border-blue-500",
                task.lastCompletedDate && "border-green-500"
              )}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getTaskIcon(task.priority)}
                      <div>
                        <h3 className="font-semibold">{task.taskName}</h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {task.category?.replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>

                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      {task.priority && (
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority} priority
                        </Badge>
                      )}
                      {task.frequency && (
                        <Badge variant="secondary">{getFrequencyLabel(task.frequency)}</Badge>
                      )}
                      {task.estimatedCost && (
                        <span className="text-muted-foreground">
                          Est. Cost: ${task.estimatedCost.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      {task.nextDueDate && (
                        <div>
                          Next Due:{" "}
                          <span className="font-medium">
                            {new Date(task.nextDueDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {task.lastCompletedDate && (
                        <div>
                          Last Completed:{" "}
                          <span className="font-medium">
                            {new Date(task.lastCompletedDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {task.isOverdue && task.overdueDays && (
                        <div className="text-red-600 font-medium">
                          {task.overdueDays} days overdue
                        </div>
                      )}
                    </div>

                    {task.seasonalRecommendation && (
                      <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-800">
                        💡 Best Season: {task.seasonalRecommendation}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {!task.lastCompletedDate && (
                      <Button
                        size="sm"
                        variant={task.isOverdue ? "default" : "outline"}
                        onClick={() => markTaskComplete(task.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Done
                      </Button>
                    )}
                    <Button size="sm" variant="outline" disabled>
                      Book Pro
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* AI Maintenance Tips */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-purple-900 mb-3">🤖 AI-Generated Schedule</h3>
          <p className="text-sm text-purple-800 mb-3">
            Your maintenance schedule is customized based on:
          </p>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• Property age, type, and location</li>
            <li>• Climate and seasonal weather patterns</li>
            <li>• Appliance ages and manufacturer recommendations</li>
            <li>• Historical maintenance data</li>
            <li>• Industry best practices and warranties</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
