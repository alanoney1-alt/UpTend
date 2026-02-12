import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, CheckCircle } from "lucide-react";

interface WarrantyItem {
  type: "appliance" | "service";
  name: string;
  brand?: string;
  provider?: string;
  expires: string;
}

interface WarrantyTrackerProps {
  warranties: WarrantyItem[];
}

export function WarrantyTracker({ warranties }: WarrantyTrackerProps) {
  const now = new Date();

  const getDaysUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getUrgency = (days: number) => {
    if (days <= 0) return "expired";
    if (days <= 14) return "critical";
    if (days <= 30) return "warning";
    return "ok";
  };

  if (warranties.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Shield className="w-5 h-5" /> Warranty Tracker</CardTitle></CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <p className="text-muted-foreground">No warranties expiring in the next 90 days. You're all set!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const sorted = [...warranties].sort((a, b) => getDaysUntil(a.expires) - getDaysUntil(b.expires));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Warranty Tracker
          <Badge variant="secondary" className="ml-auto">{warranties.length} expiring soon</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sorted.map((item, idx) => {
            const days = getDaysUntil(item.expires);
            const urgency = getUrgency(days);

            return (
              <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border ${
                urgency === "expired" ? "border-red-300 bg-red-50 dark:bg-red-950/20" :
                urgency === "critical" ? "border-orange-300 bg-orange-50 dark:bg-orange-950/20" :
                urgency === "warning" ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20" :
                "border-border bg-muted/50"
              }`}>
                <div className="flex items-center gap-3">
                  {urgency === "expired" || urgency === "critical" ? (
                    <AlertTriangle className={`w-5 h-5 ${urgency === "expired" ? "text-red-500" : "text-orange-500"}`} />
                  ) : (
                    <Shield className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.type === "appliance" ? item.brand : item.provider}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={urgency === "expired" ? "destructive" : urgency === "critical" ? "destructive" : "outline"}>
                    {days <= 0 ? "Expired" : `${days} days left`}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(item.expires).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
