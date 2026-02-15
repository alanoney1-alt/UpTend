import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Play, Square } from "lucide-react";

interface TimeFlowProps {
  onComplete: (elapsedSeconds: number) => void;
  hourlyRate?: number;
}

function formatTime(totalSeconds: number) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function TimeFlow({ onComplete, hourlyRate = 45 }: TimeFlowProps) {
  const [working, setWorking] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (working) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [working]);

  const currentCost = ((seconds / 3600) * hourlyRate).toFixed(2);

  if (!working) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 p-6" data-testid="time-step-idle">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-6">
          <Clock className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2" data-testid="text-time-title">Moving Labor</h2>
        <p className="text-muted-foreground mb-2 text-center max-w-sm">
          Start the timer when you begin. It tracks your billable hours at ${hourlyRate}/hr.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Customer is billed per quarter-hour.
        </p>
        <Button
          size="lg"
          className="w-full max-w-sm gap-2"
          onClick={() => setWorking(true)}
          data-testid="button-start-timer"
        >
          <Play className="w-5 h-5" /> Start Timer
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-between flex-1 p-6" data-testid="time-step-running">
      <Card className="w-full max-w-sm mt-8">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Time Elapsed
          </p>
          <div className="text-5xl font-mono font-bold tracking-tight" data-testid="text-timer">
            {formatTime(seconds)}
          </div>
          <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400" data-testid="text-running-cost">
            ${currentCost}
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm text-muted-foreground">Timer running</span>
          </div>
        </CardContent>
      </Card>

      <Button
        size="lg"
        variant="destructive"
        className="w-full max-w-sm gap-2 mt-8"
        onClick={() => {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onComplete(seconds);
        }}
        data-testid="button-stop-timer"
      >
        <Square className="w-5 h-5" /> Stop &amp; Complete
      </Button>
    </div>
  );
}
