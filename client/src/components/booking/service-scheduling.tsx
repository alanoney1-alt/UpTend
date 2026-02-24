import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Zap, Calendar as CalendarIcon, RefreshCw, Clock, ArrowRight } from "lucide-react";
import { format, addDays } from "date-fns";

interface ServiceSchedulingProps {
  onComplete: (schedulingData: SchedulingData) => void;
  onBack?: () => void;
  serviceName: string;
  defaultTiming?: string;
}

export interface SchedulingData {
  type: "asap" | "scheduled" | "recurring";
  scheduledDate?: Date;
  timeSlot?: "morning" | "afternoon" | "evening" | "flexible";
  recurringFrequency?: "weekly" | "biweekly" | "monthly";
  recurringStartDate?: Date;
}

export function ServiceScheduling({ onComplete, onBack, serviceName, defaultTiming }: ServiceSchedulingProps) {
  const { t } = useTranslation();
  const mapTiming = (t?: string): "asap" | "scheduled" | "recurring" => {
    if (t === "same-day") return "asap";
    if (t === "next-day" || t === "scheduled") return "scheduled";
    if (t === "recurring") return "recurring";
    return "asap";
  };
  const [schedulingType, setSchedulingType] = useState<"asap" | "scheduled" | "recurring">(mapTiming(defaultTiming));
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [timeSlot, setTimeSlot] = useState<"morning" | "afternoon" | "evening" | "flexible">("flexible");
  const [recurringFrequency, setRecurringFrequency] = useState<"weekly" | "biweekly" | "monthly">("weekly");
  const [recurringStartDate, setRecurringStartDate] = useState<Date | undefined>(addDays(new Date(), 1));

  const handleContinue = () => {
    const schedulingData: SchedulingData = {
      type: schedulingType,
    };

    if (schedulingType === "scheduled") {
      schedulingData.scheduledDate = selectedDate;
      schedulingData.timeSlot = timeSlot;
    } else if (schedulingType === "recurring") {
      schedulingData.recurringFrequency = recurringFrequency;
      schedulingData.recurringStartDate = recurringStartDate;
      schedulingData.timeSlot = timeSlot;
    }

    onComplete(schedulingData);
  };

  const isValid = () => {
    if (schedulingType === "asap") return true;
    if (schedulingType === "scheduled") return !!selectedDate;
    if (schedulingType === "recurring") return !!recurringStartDate;
    return false;
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">{t("booking.when_need")}</h2>
        <p className="text-muted-foreground">
          {serviceName} • Choose your preferred timing
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <RadioGroup value={schedulingType} onValueChange={(value: any) => setSchedulingType(value)} className="space-y-4">

            {/* ASAP Option */}
            <div
              className={`border rounded-lg p-5 cursor-pointer transition-all hover:border-primary ${
                schedulingType === "asap" ? "border-primary bg-primary/5" : "border-border"
              }`}
              onClick={() => setSchedulingType("asap")}
            >
              <div className="flex items-start gap-4">
                <RadioGroupItem value="asap" id="asap" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-orange-500" />
                    <Label htmlFor="asap" className="text-lg font-bold cursor-pointer">
                      {t("booking.asap")}
                    </Label>
                    <Badge variant="default" className="bg-orange-500">Recommended</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Next available Pro dispatched instantly • Typically arrives in 1-4 hours • Our signature same-day service
                  </p>
                </div>
              </div>
            </div>

            {/* Schedule for Later Option */}
            <div
              className={`border rounded-lg p-5 cursor-pointer transition-all hover:border-primary ${
                schedulingType === "scheduled" ? "border-primary bg-primary/5" : "border-border"
              }`}
              onClick={() => setSchedulingType("scheduled")}
            >
              <div className="flex items-start gap-4">
                <RadioGroupItem value="scheduled" id="scheduled" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarIcon className="w-5 h-5 text-blue-500" />
                    <Label htmlFor="scheduled" className="text-lg font-bold cursor-pointer">
                      {t("booking.schedule_later")}
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Pick a specific date and time that works for you
                  </p>

                  {schedulingType === "scheduled" && (
                    <div className="space-y-4 mt-4 border-t pt-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="mb-2 block">Select Date</Label>
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            disabled={(date) => date < new Date()}
                            className="rounded-md border"
                          />
                        </div>
                        <div className="space-y-4">
                          <div>
                            <Label className="mb-2 block">Preferred Time</Label>
                            <Select value={timeSlot} onValueChange={(value: any) => setTimeSlot(value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="morning">
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Morning (8am - 12pm)
                                  </div>
                                </SelectItem>
                                <SelectItem value="afternoon">
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Afternoon (12pm - 5pm)
                                  </div>
                                </SelectItem>
                                <SelectItem value="evening">
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Evening (5pm - 8pm)
                                  </div>
                                </SelectItem>
                                <SelectItem value="flexible">
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Flexible (Anytime)
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {selectedDate && (
                            <div className="p-3 bg-muted rounded-lg">
                              <p className="text-sm font-medium">Selected Date:</p>
                              <p className="text-lg font-bold">{format(selectedDate, "EEEE, MMMM d, yyyy")}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {timeSlot === "flexible" ? "Anytime that day" : `${timeSlot.charAt(0).toUpperCase() + timeSlot.slice(1)}`}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recurring Service Option */}
            <div
              className={`border rounded-lg p-5 cursor-pointer transition-all hover:border-primary ${
                schedulingType === "recurring" ? "border-primary bg-primary/5" : "border-border"
              }`}
              onClick={() => setSchedulingType("recurring")}
            >
              <div className="flex items-start gap-4">
                <RadioGroupItem value="recurring" id="recurring" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw className="w-5 h-5 text-green-500" />
                    <Label htmlFor="recurring" className="text-lg font-bold cursor-pointer">
                      {t("booking.recurring_service")}
                    </Label>
                    <Badge variant="secondary">Save 5-15%</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Automatic recurring service • Same Pro each visit • Priority scheduling • Discounted rates
                  </p>

                  {schedulingType === "recurring" && (
                    <div className="space-y-4 mt-4 border-t pt-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="mb-2 block">Frequency</Label>
                          <Select value={recurringFrequency} onValueChange={(value: any) => setRecurringFrequency(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">
                                <div>
                                  <div className="font-medium">Weekly</div>
                                  <div className="text-xs text-muted-foreground">Every 7 days • 15% off</div>
                                </div>
                              </SelectItem>
                              <SelectItem value="biweekly">
                                <div>
                                  <div className="font-medium">Bi-weekly</div>
                                  <div className="text-xs text-muted-foreground">Every 14 days • 10% off</div>
                                </div>
                              </SelectItem>
                              <SelectItem value="monthly">
                                <div>
                                  <div className="font-medium">Monthly</div>
                                  <div className="text-xs text-muted-foreground">Every 30 days • 5% off</div>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="mb-2 block">Preferred Time</Label>
                          <Select value={timeSlot} onValueChange={(value: any) => setTimeSlot(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="morning">Morning (8am - 12pm)</SelectItem>
                              <SelectItem value="afternoon">Afternoon (12pm - 5pm)</SelectItem>
                              <SelectItem value="evening">Evening (5pm - 8pm)</SelectItem>
                              <SelectItem value="flexible">Flexible (Anytime)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label className="mb-2 block">First Service Date</Label>
                        <Calendar
                          mode="single"
                          selected={recurringStartDate}
                          onSelect={setRecurringStartDate}
                          disabled={(date) => date < new Date()}
                          className="rounded-md border"
                        />
                      </div>
                      {recurringStartDate && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <p className="text-sm font-medium text-green-900 dark:text-green-300">Recurring Schedule:</p>
                          <p className="text-lg font-bold text-green-900 dark:text-green-300">
                            {recurringFrequency === "weekly" ? "Every week" : recurringFrequency === "biweekly" ? "Every 2 weeks" : "Every month"}
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                            Starting {format(recurringStartDate, "MMMM d, yyyy")} • {timeSlot === "flexible" ? "Flexible timing" : timeSlot}
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-500 mt-2">
                             Same Pro assigned •  Priority scheduling •  Cancel anytime
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </RadioGroup>

          <div className="flex items-center justify-between gap-4 mt-6 pt-6 border-t">
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                ← Back
              </Button>
            )}
            <Button
              onClick={handleContinue}
              disabled={!isValid()}
              className="ml-auto"
              size="lg"
            >
              Continue <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
