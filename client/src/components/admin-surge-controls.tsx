import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface SurgeModifier {
  id: number;
  dayOfWeek: number | null;
  startHour: number;
  endHour: number;
  multiplier: number;
  reason: string;
  active: boolean;
}

interface SurgeData {
  modifiers: SurgeModifier[];
  currentMultiplier: number;
}

const defaultForm = { dayOfWeek: "any", startHour: 0, endHour: 23, multiplier: 1.5, reason: "", active: true };

export function AdminSurgeControls() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(defaultForm);

  const { data, isLoading } = useQuery<SurgeData>({
    queryKey: ["/api/admin/surge-modifiers"],
  });

  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/surge-modifiers"] });
    setShowForm(false);
    setEditingId(null);
    setForm(defaultForm);
  };

  const createMutation = useMutation({
    mutationFn: (data: unknown) => apiRequest("POST", "/api/admin/surge-modifiers", data),
    onSuccess: () => { onSuccess(); toast({ title: "Surge rule created" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: unknown }) => apiRequest("PATCH", `/api/admin/surge-modifiers/${id}`, data),
    onSuccess: () => { onSuccess(); toast({ title: "Surge rule updated" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/surge-modifiers/${id}`),
    onSuccess: () => { onSuccess(); toast({ title: "Surge rule deleted" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = () => {
    const payload = {
      dayOfWeek: form.dayOfWeek === "any" ? null : Number(form.dayOfWeek),
      startHour: Number(form.startHour),
      endHour: Number(form.endHour),
      multiplier: Number(form.multiplier),
      reason: form.reason,
      active: form.active,
    };
    if (editingId !== null) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const startEdit = (mod: SurgeModifier) => {
    setEditingId(mod.id);
    setForm({
      dayOfWeek: mod.dayOfWeek !== null ? String(mod.dayOfWeek) : "any",
      startHour: mod.startHour,
      endHour: mod.endHour,
      multiplier: mod.multiplier,
      reason: mod.reason,
      active: mod.active,
    });
    setShowForm(true);
  };

  if (isLoading) {
    return <Card data-testid="surge-loading"><CardContent className="p-6">Loading surge data...</CardContent></Card>;
  }

  return (
    <Card data-testid="surge-controls">
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle>Surge Pricing Controls</CardTitle>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Current Multiplier:</span>
          <Badge data-testid="current-multiplier" variant="secondary" className="text-lg">
            {data?.currentMultiplier?.toFixed(2) ?? "1.00"}x
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-end">
          <Button data-testid="button-add-surge-rule" onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(defaultForm); }}>
            {showForm ? "Cancel" : "Add Surge Rule"}
          </Button>
        </div>

        {showForm && (
          <Card data-testid="surge-form">
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-sm text-muted-foreground">Day of Week</label>
                  <Select value={form.dayOfWeek} onValueChange={(v) => setForm({ ...form, dayOfWeek: v })}>
                    <SelectTrigger data-testid="select-day">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Day</SelectItem>
                      {DAYS.map((d, i) => <SelectItem key={d} value={String(i)}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Start Hour</label>
                  <Input data-testid="input-start-hour" type="number" min={0} max={23} value={form.startHour} onChange={(e) => setForm({ ...form, startHour: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">End Hour</label>
                  <Input data-testid="input-end-hour" type="number" min={0} max={23} value={form.endHour} onChange={(e) => setForm({ ...form, endHour: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Multiplier</label>
                  <Input data-testid="input-multiplier" type="number" min={0.5} max={5.0} step={0.1} value={form.multiplier} onChange={(e) => setForm({ ...form, multiplier: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Reason</label>
                  <Input data-testid="input-reason" placeholder="e.g., Weekend peak" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
                </div>
                <div className="flex items-end gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input data-testid="checkbox-active" type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="rounded" />
                    Active
                  </label>
                </div>
              </div>
              <Button data-testid="button-submit-surge" onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId !== null ? "Update Rule" : "Create Rule"}
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="surge-table">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Day</th>
                <th className="text-left p-2">Start Hour</th>
                <th className="text-left p-2">End Hour</th>
                <th className="text-left p-2">Multiplier</th>
                <th className="text-left p-2">Reason</th>
                <th className="text-left p-2">Active</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.modifiers?.length === 0 && (
                <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">No surge rules configured</td></tr>
              )}
              {data?.modifiers?.map((mod) => (
                <tr key={mod.id} className="border-b" data-testid={`surge-row-${mod.id}`}>
                  <td className="p-2">{mod.dayOfWeek !== null ? DAYS[mod.dayOfWeek] : "Any Day"}</td>
                  <td className="p-2">{mod.startHour}</td>
                  <td className="p-2">{mod.endHour}</td>
                  <td className="p-2">{mod.multiplier}x</td>
                  <td className="p-2">{mod.reason}</td>
                  <td className="p-2">
                    <Badge variant={mod.active ? "default" : "secondary"} data-testid={`badge-active-${mod.id}`}>
                      {mod.active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="p-2 flex gap-1 flex-wrap">
                    <Button size="sm" variant="outline" data-testid={`button-edit-${mod.id}`} onClick={() => startEdit(mod)}>Edit</Button>
                    <Button size="sm" variant="destructive" data-testid={`button-delete-${mod.id}`} onClick={() => deleteMutation.mutate(mod.id)} disabled={deleteMutation.isPending}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}