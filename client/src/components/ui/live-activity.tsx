import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

const ACTIVITIES = [
  "Mike cleaned gutters in Winter Park",
  "Sarah booked Junk Removal in Orlando",
  "Luis finished a Pressure Wash in Kissimmee",
  "David uploaded a Home Inventory in Altamonte",
  "Maria completed Moving Labor in Lake Nona",
  "James hauled debris in Windermere",
  "Ana scheduled a Home Scan in Dr. Phillips",
];

export function LiveActivity() {
  const [current, setCurrent] = useState(0);
  const [show, setShow] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const showNotification = useCallback(() => {
    setShow(true);
    const hideTimer = setTimeout(() => setShow(false), 4000);
    const advanceTimer = setTimeout(
      () => setCurrent((c) => (c + 1) % ACTIVITIES.length),
      4500,
    );
    timersRef.current.push(hideTimer, advanceTimer);
  }, []);

  useEffect(() => {
    const initialDelay = setTimeout(() => {
      showNotification();
    }, 5000);
    timersRef.current.push(initialDelay);

    const interval = setInterval(() => {
      showNotification();
    }, 14000);

    return () => {
      clearAllTimers();
      clearInterval(interval);
    };
  }, [showNotification, clearAllTimers]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          className="fixed bottom-6 left-6 bg-card/95 backdrop-blur border border-border p-3 rounded-lg shadow-xl flex items-center gap-3 z-50 max-w-xs"
          data-testid="live-activity-ticker"
        >
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center shrink-0">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <div className="text-xs">
            <p className="font-bold" data-testid="text-activity-label">Just Happened</p>
            <p className="text-muted-foreground" data-testid="text-activity-detail">
              {ACTIVITIES[current]}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
