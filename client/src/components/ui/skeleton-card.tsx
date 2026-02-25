import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  lines?: number;
  avatar?: boolean;
  className?: string;
}

export function SkeletonCard({ lines = 3, avatar = false, className }: SkeletonCardProps) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5 animate-pulse", className)}>
      {avatar && (
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-muted shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-2/3" />
            <div className="h-3 bg-muted rounded w-1/3" />
          </div>
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className="h-3 bg-muted rounded"
            style={{ width: i === lines - 1 ? "60%" : i === 0 ? "90%" : "75%" }}
          />
        ))}
      </div>
    </div>
  );
}
