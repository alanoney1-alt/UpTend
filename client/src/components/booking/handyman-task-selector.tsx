import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  HANDYMAN_TASKS,
  HANDYMAN_CATEGORIES,
  calculateHandymanQuoteTotal,
  type HandymanTask
} from "@shared/handyman-pricing";
import { Clock, DollarSign, ChevronDown, ChevronUp } from "lucide-react";

interface HandymanTaskSelectorProps {
  onComplete: (data: {
    selectedTasks: Array<{ taskId: string; variables?: Record<string, string> }>;
    total: number;
    estimatedTime: number;
  }) => void;
  onBack?: () => void;
}

export function HandymanTaskSelector({ onComplete, onBack }: HandymanTaskSelectorProps) {
  const [selectedTasks, setSelectedTasks] = useState<
    Array<{ taskId: string; variables?: Record<string, string> }>
  >([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('mounting');

  const toggleTask = (taskId: string) => {
    const isSelected = selectedTasks.some(t => t.taskId === taskId);

    if (isSelected) {
      setSelectedTasks(prev => prev.filter(t => t.taskId !== taskId));
    } else {
      setSelectedTasks(prev => [...prev, { taskId }]);
    }
  };

  const updateTaskVariable = (taskId: string, variableName: string, value: string) => {
    setSelectedTasks(prev => prev.map(t => {
      if (t.taskId === taskId) {
        return {
          ...t,
          variables: {
            ...t.variables,
            [variableName]: value,
          },
        };
      }
      return t;
    }));
  };

  const isTaskSelected = (taskId: string) => {
    return selectedTasks.some(t => t.taskId === taskId);
  };

  const getTaskVariables = (taskId: string): Record<string, string> | undefined => {
    return selectedTasks.find(t => t.taskId === taskId)?.variables;
  };

  const { total, estimatedTime, breakdown } = calculateHandymanQuoteTotal(selectedTasks);

  const tasksByCategory = Object.entries(HANDYMAN_CATEGORIES).map(([categoryId, category]) => ({
    id: categoryId,
    ...category,
    tasks: HANDYMAN_TASKS.filter(t => t.category === categoryId),
  }));

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">What needs fixing?</h2>
        <p className="text-muted-foreground">
          Select all tasks you need completed. Get transparent, fixed pricing for each.
        </p>
      </div>

      {/* Summary Card */}
      {selectedTasks.length > 0 && (
        <Card className="bg-primary/5 border-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Selected Tasks</p>
                <p className="text-2xl font-bold">{selectedTasks.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estimated Time</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  <Clock className="w-5 h-5" />
                  {Math.round(estimatedTime / 60)}h {estimatedTime % 60}m
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Estimate</p>
                <p className="text-3xl font-bold text-primary flex items-center gap-1">
                  <DollarSign className="w-6 h-6" />
                  {total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task Categories */}
      <div className="space-y-4">
        {tasksByCategory.map(category => (
          <Card key={category.id}>
            <CardContent className="p-4">
              <button
                onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{category.icon}</span>
                  <h3 className="text-lg font-semibold">{category.label}</h3>
                  <Badge variant="secondary">{category.tasks.length} tasks</Badge>
                </div>
                {expandedCategory === category.id ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>

              {expandedCategory === category.id && (
                <div className="mt-4 space-y-3">
                  {category.tasks.map(task => {
                    const selected = isTaskSelected(task.id);
                    const variables = getTaskVariables(task.id);

                    return (
                      <div
                        key={task.id}
                        className={`border rounded-lg p-4 transition-all ${
                          selected ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selected}
                            onCheckedChange={() => toggleTask(task.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <Label
                                htmlFor={task.id}
                                className="font-medium cursor-pointer"
                                onClick={() => toggleTask(task.id)}
                              >
                                {task.name}
                              </Label>
                              <div className="text-right shrink-0">
                                <p className="font-bold text-primary">${task.basePrice}</p>
                                <p className="text-xs text-muted-foreground">
                                  ~{task.estimatedTime} min
                                </p>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {task.description}
                            </p>

                            {/* Task Variables */}
                            {selected && task.variables && task.variables.length > 0 && (
                              <div className="mt-3 space-y-3 pt-3 border-t">
                                {task.variables.map(variable => (
                                  <div key={variable.name}>
                                    <Label className="text-xs font-medium mb-2 block">
                                      {variable.name.charAt(0).toUpperCase() + variable.name.slice(1)}:
                                    </Label>
                                    <RadioGroup
                                      value={variables?.[variable.name] || variable.options[0].value}
                                      onValueChange={(value) => updateTaskVariable(task.id, variable.name, value)}
                                      className="space-y-2"
                                    >
                                      {variable.options.map(option => (
                                        <div key={option.value} className="flex items-center space-x-2">
                                          <RadioGroupItem value={option.value} id={`${task.id}-${option.value}`} />
                                          <Label
                                            htmlFor={`${task.id}-${option.value}`}
                                            className="text-sm cursor-pointer"
                                          >
                                            {option.label}
                                          </Label>
                                        </div>
                                      ))}
                                    </RadioGroup>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Breakdown */}
      {selectedTasks.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Price Breakdown</h3>
            <div className="space-y-2">
              {breakdown.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.name}</span>
                  <span className="font-medium">${item.price}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-primary text-lg">${total}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              * Prices shown are estimates. Pro will confirm final pricing on-site if adjustments are needed.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            ← Back
          </Button>
        )}
        <Button
          onClick={() => onComplete({ selectedTasks, total, estimatedTime })}
          disabled={selectedTasks.length === 0}
          className="ml-auto"
          size="lg"
        >
          Continue with {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''} (${total})
        </Button>
      </div>
    </div>
  );
}
