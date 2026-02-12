import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Wrench, DollarSign, FileText } from "lucide-react";

interface ServiceRecord {
  id: string;
  serviceType: string;
  provider?: string;
  date: string;
  cost?: string;
  notes?: string;
  warrantyExpiry?: string;
}

interface ServiceTimelineProps {
  history: ServiceRecord[];
}

export function ServiceTimeline({ history }: ServiceTimelineProps) {
  if (history.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-lg">Service Timeline</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-6">No service history yet. Add your first record to start tracking.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Clock className="w-5 h-5" /> Service Timeline</CardTitle></CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-6">
            {history.map((record, idx) => (
              <div key={record.id} className="relative pl-10">
                {/* Timeline dot */}
                <div className="absolute left-2.5 top-1 w-3 h-3 rounded-full bg-primary border-2 border-background" />

                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-primary" />
                        {record.serviceType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </h4>
                      {record.provider && <p className="text-sm text-muted-foreground">by {record.provider}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {new Date(record.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                      {record.cost && (
                        <p className="text-sm font-medium flex items-center gap-1 justify-end">
                          <DollarSign className="w-3 h-3" />{record.cost}
                        </p>
                      )}
                    </div>
                  </div>
                  {record.notes && <p className="text-sm text-muted-foreground">{record.notes}</p>}
                  {record.warrantyExpiry && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      <FileText className="w-3 h-3 mr-1" />
                      Warranty until {new Date(record.warrantyExpiry).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
