import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar, Clock, MapPin, Cloud, CloudRain, Sun, Repeat, Users,
  ChevronLeft, ChevronRight, AlertTriangle, Zap, Star, Check
} from "lucide-react";

interface ServiceSchedulingProps {
  service?: string;
  zip?: string;
  onSchedule?: (data: { mode: string; date?: string; timeSlot?: string; recurring?: any }) => void;
}

type ScheduleMode = "asap" | "scheduled" | "recurring";

const FREQUENCIES = [
  { value: "weekly", label: "Weekly", discount: "15% off" },
  { value: "biweekly", label: "Every 2 Weeks", discount: "10% off" },
  { value: "monthly", label: "Monthly", discount: "5% off" },
  { value: "quarterly", label: "Quarterly", discount: "3% off" },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function ServiceScheduling({ service, zip, onSchedule }: ServiceSchedulingProps) {
  const [mode, setMode] = useState<ScheduleMode>("asap");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [recurringFreq, setRecurringFreq] = useState("monthly");
  const [recurringDay, setRecurringDay] = useState("Monday");
  const [recurringSlot, setRecurringSlot] = useState("08:00-10:00");

  // Availability query
  const { data: availability } = useQuery({
    queryKey: ["/api/scheduling/availability", service, selectedDate, zip],
    queryFn: () => fetch(`/api/scheduling/availability?service=${service}&date=${selectedDate}&zip=${zip}`).then(r => r.json()),
    enabled: !!selectedDate && mode === "scheduled",
  });

  // Neighborhood batch
  const { data: neighborhood } = useQuery({
    queryKey: ["/api/scheduling/neighborhood-batch", zip],
    queryFn: () => fetch(`/api/scheduling/neighborhood-batch?zip=${zip}`).then(r => r.json()),
    enabled: !!zip,
  });

  // Weather check
  const { data: weather } = useQuery({
    queryKey: ["/api/scheduling/weather-check", selectedDate, zip],
    queryFn: () => fetch(`/api/scheduling/weather-check?date=${selectedDate}&zip=${zip}`).then(r => r.json()),
    enabled: !!selectedDate && !!zip,
  });

  // Smart suggestions
  const { data: suggestions } = useQuery({
    queryKey: ["/api/scheduling/smart-suggest"],
    queryFn: () => fetch("/api/scheduling/smart-suggest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }).then(r => r.json()),
    enabled: mode === "recurring",
  });

  const handleConfirm = () => {
    if (mode === "asap") {
      onSchedule?.({ mode: "asap" });
    } else if (mode === "scheduled") {
      onSchedule?.({ mode: "scheduled", date: selectedDate, timeSlot: selectedSlot });
    } else {
      onSchedule?.({ mode: "recurring", recurring: { frequency: recurringFreq, preferredDay: recurringDay, preferredTimeSlot: recurringSlot } });
    }
  };

  // Calendar generation
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const days: { date: string; day: number; disabled: boolean }[] = [];
    const today = new Date().toISOString().split("T")[0];

    for (let d = 1; d <= last.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ date: dateStr, day: d, disabled: dateStr < today });
    }
    return { days, firstDayOfWeek: first.getDay(), monthLabel: first.toLocaleDateString("en-US", { month: "long", year: "numeric" }) };
  };

  const cal = getDaysInMonth(currentMonth);

  const slotColor = (avail: string) =>
    avail === "high" ? "bg-green-500/20 border-green-500/50 text-green-300" :
    avail === "medium" ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-300" :
    "bg-red-500/20 border-red-500/50 text-red-300";

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <div className="grid grid-cols-3 gap-3">
        {([
          { key: "asap" as const, icon: Zap, label: "ASAP", desc: "Next available pro" },
          { key: "scheduled" as const, icon: Calendar, label: "Schedule", desc: "Pick date and time" },
          { key: "recurring" as const, icon: Repeat, label: "Recurring", desc: "Set it and forget it" },
        ]).map(m => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              mode === m.key
                ? "border-[#F47C20] bg-[#F47C20]/10"
                : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
            }`}
          >
            <m.icon className={`w-5 h-5 mb-2 ${mode === m.key ? "text-[#F47C20]" : "text-zinc-400"}`} />
            <div className="font-semibold text-white text-sm">{m.label}</div>
            <div className="text-xs text-zinc-400 mt-1">{m.desc}</div>
          </button>
        ))}
      </div>

      {/* Neighborhood Batch Callout */}
      {neighborhood?.batchDiscount > 0 && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-start gap-3">
          <MapPin className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-green-300 font-semibold text-sm">Neighborhood Savings Available!</div>
            <div className="text-green-400/80 text-xs mt-1">{neighborhood.message}</div>
            <Badge className="mt-2 bg-green-500/20 text-green-300 border-green-500/40">Save ${neighborhood.batchDiscount}</Badge>
          </div>
        </div>
      )}

      {/* ASAP Mode */}
      {mode === "asap" && (
        <Card className="bg-zinc-900 border-zinc-800 p-6 text-center">
          <Zap className="w-12 h-12 text-[#F47C20] mx-auto mb-3" />
          <h3 className="text-xl font-bold text-white">Get Matched Now</h3>
          <p className="text-zinc-400 mt-2 text-sm">We'll find the best available pro in your area and get them headed your way.</p>
          <div className="mt-4 flex items-center justify-center gap-2 text-zinc-300">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Average wait: 45 minutes</span>
          </div>
        </Card>
      )}

      {/* Scheduled Mode - Calendar */}
      {mode === "scheduled" && (
        <div className="space-y-4">
          <Card className="bg-zinc-900 border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="p-1 hover:bg-zinc-800 rounded"><ChevronLeft className="w-5 h-5 text-zinc-400" /></button>
              <span className="font-semibold text-white">{cal.monthLabel}</span>
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="p-1 hover:bg-zinc-800 rounded"><ChevronRight className="w-5 h-5 text-zinc-400" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-zinc-500 mb-2">
              {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: cal.firstDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
              {cal.days.map(d => (
                <button
                  key={d.date}
                  disabled={d.disabled}
                  onClick={() => { setSelectedDate(d.date); setSelectedSlot(""); }}
                  className={`p-2 rounded-lg text-sm transition-all ${
                    d.disabled ? "text-zinc-700 cursor-not-allowed" :
                    d.date === selectedDate ? "bg-[#F47C20] text-white font-bold" :
                    "text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  {d.day}
                </button>
              ))}
            </div>
          </Card>

          {/* Weather Advisory */}
          {weather?.advisory && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
              {weather.forecast.rainChance > 50 ? <CloudRain className="w-5 h-5 text-yellow-400 shrink-0" /> :
               <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />}
              <div>
                <div className="text-yellow-300 font-semibold text-sm">Weather Advisory</div>
                <div className="text-yellow-400/80 text-xs mt-1">{weather.advisory}</div>
                <div className="flex gap-4 mt-2 text-xs text-zinc-400">
                  <span>🌡️ {weather.forecast.tempHigh}°F</span>
                  <span>🌧️ {weather.forecast.rainChance}% rain</span>
                  <span>{weather.forecast.conditions}</span>
                </div>
              </div>
            </div>
          )}

          {/* Time Slots */}
          {selectedDate && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-white">Available Time Slots</h4>
              {availability?.slots?.map((slot: any) => (
                <button
                  key={slot.time}
                  onClick={() => setSelectedSlot(slot.time)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                    selectedSlot === slot.time ? "border-[#F47C20] bg-[#F47C20]/10" :
                    `${slotColor(slot.availability)} hover:opacity-80`
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4" />
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">{slot.label}</div>
                      <div className="text-xs text-zinc-400">{slot.time}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3 text-zinc-400" />
                    <span className="text-xs text-zinc-400">{slot.proCount} pros</span>
                    {selectedSlot === slot.time && <Check className="w-4 h-4 text-[#F47C20]" />}
                  </div>
                </button>
              )) || (
                <div className="text-sm text-zinc-500 text-center py-4">Select a date to see available slots</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recurring Mode */}
      {mode === "recurring" && (
        <div className="space-y-4">
          <Card className="bg-zinc-900 border-zinc-800 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Repeat className="w-5 h-5 text-[#F47C20]" />
              <h4 className="font-semibold text-white">Set It and Forget It</h4>
            </div>
            <p className="text-zinc-400 text-sm mb-4">Schedule recurring service and save. We'll automatically book your preferred pro.</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 mb-2 block">Frequency</label>
                <div className="grid grid-cols-2 gap-2">
                  {FREQUENCIES.map(f => (
                    <button
                      key={f.value}
                      onClick={() => setRecurringFreq(f.value)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        recurringFreq === f.value ? "border-[#F47C20] bg-[#F47C20]/10" : "border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      <div className="text-sm font-medium text-white">{f.label}</div>
                      <div className="text-xs text-[#F47C20] mt-1">{f.discount}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 mb-2 block">Preferred Day</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(d => (
                    <button
                      key={d}
                      onClick={() => setRecurringDay(d)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        recurringDay === d ? "bg-[#F47C20] text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 mb-2 block">Preferred Time</label>
                <div className="grid grid-cols-2 gap-2">
                  {["08:00-10:00", "10:00-12:00", "14:00-16:00", "16:00-18:00"].map(t => (
                    <button
                      key={t}
                      onClick={() => setRecurringSlot(t)}
                      className={`p-2 rounded-lg text-xs font-medium transition-all ${
                        recurringSlot === t ? "bg-[#F47C20] text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Smart Suggestions */}
          {suggestions?.suggestions && (
            <Card className="bg-zinc-900 border-zinc-800 p-4">
              <h4 className="font-semibold text-white text-sm mb-3">💡 Suggested for Your Home</h4>
              <div className="space-y-2">
                {suggestions.suggestions.filter((s: any) => !s.alreadyScheduled).slice(0, 3).map((s: any) => (
                  <div key={s.service} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                    <div>
                      <div className="text-sm text-white font-medium">{s.service.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</div>
                      <div className="text-xs text-zinc-400 mt-0.5">{s.reason}</div>
                    </div>
                    <Badge className="bg-[#F47C20]/20 text-[#F47C20] border-[#F47C20]/40 text-xs">{s.frequency}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Confirm Button */}
      <Button
        onClick={handleConfirm}
        disabled={mode === "scheduled" && (!selectedDate || !selectedSlot)}
        className="w-full bg-[#F47C20] hover:bg-[#F47C20]/90 text-white font-semibold py-6 text-lg rounded-xl"
      >
        {mode === "asap" ? "Match Me Now" :
         mode === "scheduled" ? (selectedSlot ? `Book for ${selectedDate}` : "Select a Time Slot") :
         "Start Recurring Service"}
      </Button>
    </div>
  );
}
