import { useState } from "react";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Shield, CheckCircle, Phone, Radio, Users, Zap } from "lucide-react";

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  category: string;
}

const HURRICANE_CHECKLIST: ChecklistItem[] = [
  { id: "1", label: "Secure all pool furniture and loose items in common areas", completed: false, category: "Property" },
  { id: "2", label: "Board up clubhouse windows", completed: false, category: "Property" },
  { id: "3", label: "Test backup generators", completed: false, category: "Property" },
  { id: "4", label: "Clear all storm drains and gutters", completed: false, category: "Property" },
  { id: "5", label: "Send resident notification with safety instructions", completed: false, category: "Communication" },
  { id: "6", label: "Confirm emergency pro availability for post-storm cleanup", completed: false, category: "Dispatch" },
  { id: "7", label: "Distribute sandbags to ground-floor units", completed: false, category: "Property" },
  { id: "8", label: "Check on elderly and vulnerable residents", completed: false, category: "Communication" },
  { id: "9", label: "Document pre-storm condition of all common areas (photos)", completed: false, category: "Documentation" },
  { id: "10", label: "Confirm insurance coverage and emergency contacts", completed: false, category: "Admin" },
];

const FLOOD_CHECKLIST: ChecklistItem[] = [
  { id: "1", label: "Activate sump pumps in all common areas", completed: false, category: "Property" },
  { id: "2", label: "Move electronics and valuables above flood level", completed: false, category: "Property" },
  { id: "3", label: "Send flood warning to all residents", completed: false, category: "Communication" },
  { id: "4", label: "Stage water extraction equipment", completed: false, category: "Dispatch" },
  { id: "5", label: "Contact mold prevention specialist for standby", completed: false, category: "Dispatch" },
  { id: "6", label: "Document water levels and damage progression", completed: false, category: "Documentation" },
];

export default function BusinessEmergency() {
  const [emergencyType, setEmergencyType] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [instructions, setInstructions] = useState("");

  const activateProtocol = () => {
    if (!emergencyType) return;
    setIsActive(true);
    if (emergencyType === "hurricane") setChecklist(HURRICANE_CHECKLIST.map(i => ({ ...i })));
    else if (emergencyType === "flood") setChecklist(FLOOD_CHECKLIST.map(i => ({ ...i })));
    else setChecklist([
      { id: "1", label: "Assess immediate safety risks", completed: false, category: "Property" },
      { id: "2", label: "Notify all residents of emergency status", completed: false, category: "Communication" },
      { id: "3", label: "Dispatch emergency pros", completed: false, category: "Dispatch" },
      { id: "4", label: "Document all damage", completed: false, category: "Documentation" },
      { id: "5", label: "Contact insurance provider", completed: false, category: "Admin" },
    ]);
  };

  const toggleItem = (id: string) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const completedCount = checklist.filter(i => i.completed).length;
  const progress = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Emergency Protocols</h1>
            <p className="text-muted-foreground mt-1">Coordinate emergency response across your community</p>
          </div>
          {isActive && (
            <Badge variant="destructive" className="text-lg px-4 py-2 animate-pulse">
              <AlertTriangle className="w-5 h-5 mr-2" /> ACTIVE EMERGENCY
            </Badge>
          )}
        </div>

        {!isActive ? (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-500" />
                Activate Emergency Protocol
              </CardTitle>
              <CardDescription>
                This will notify all residents, create an emergency checklist, and activate priority dispatch for emergency pros.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Emergency Type</label>
                <Select value={emergencyType} onValueChange={setEmergencyType}>
                  <SelectTrigger><SelectValue placeholder="Select emergency type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hurricane">Hurricane</SelectItem>
                    <SelectItem value="flood">Flood</SelectItem>
                    <SelectItem value="fire">Fire</SelectItem>
                    <SelectItem value="power_outage">Power Outage</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Special Instructions for Residents</label>
                <Textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Any additional instructions to include in the resident notification..."
                  rows={3}
                />
              </div>
              <Button
                variant="destructive"
                size="lg"
                className="w-full"
                onClick={activateProtocol}
                disabled={!emergencyType}
              >
                <AlertTriangle className="w-5 h-5 mr-2" />
                Activate {emergencyType ? emergencyType.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase()) : "Emergency"} Protocol
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Status Banner */}
            <Card className="bg-red-50 border-red-300">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Radio className="w-6 h-6 text-red-500 animate-pulse" />
                    <div>
                      <p className="font-bold text-red-800">{emergencyType.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())} Protocol Active</p>
                      <p className="text-sm text-red-600">All residents notified. Emergency dispatch queue activated.</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => { setIsActive(false); setChecklist([]); }}>
                    Resolve Emergency
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Progress */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Checklist Progress</span>
                  <span className="text-sm text-muted-foreground">{completedCount}/{checklist.length} completed</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-green-500 h-3 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-1">
                <Users className="w-5 h-5" />
                <span className="text-sm">Blast All Residents</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-1">
                <Phone className="w-5 h-5" />
                <span className="text-sm">Call Emergency Pros</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-1">
                <Zap className="w-5 h-5" />
                <span className="text-sm">Dispatch Cleanup Crew</span>
              </Button>
            </div>

            {/* Checklist */}
            <Card>
              <CardHeader>
                <CardTitle>Emergency Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {checklist.map(item => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${item.completed ? "bg-green-50 border-green-200" : "hover:bg-gray-50"}`}
                      onClick={() => toggleItem(item.id)}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${item.completed ? "bg-green-500 border-green-500" : "border-gray-300"}`}>
                        {item.completed && <CheckCircle className="w-4 h-4 text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${item.completed ? "line-through text-muted-foreground" : "font-medium"}`}>{item.label}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
