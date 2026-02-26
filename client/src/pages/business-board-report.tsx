import { useState } from "react";
import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Download, Mail, FileText, DollarSign,
  Users, Shield, Calendar, TrendingUp, BarChart3, CheckCircle
} from "lucide-react";

const quarters = ["Q1", "Q2", "Q3", "Q4"];
const years = ["2024", "2025", "2026"];

const demoSpending = [
  { category: "Landscaping", amount: 12400, budget: 15000 },
  { category: "Pool Maintenance", amount: 4800, budget: 5000 },
  { category: "Pest Control", amount: 3200, budget: 3500 },
  { category: "General Repairs", amount: 8900, budget: 10000 },
  { category: "Cleaning Services", amount: 6100, budget: 7000 },
];

const demoVendors = [
  { name: "GreenScape Pros", service: "Landscaping", rating: 4.8, onTime: 96, jobs: 24 },
  { name: "AquaClear Pool Co", service: "Pool Maintenance", rating: 4.5, onTime: 92, jobs: 12 },
  { name: "PestShield LLC", service: "Pest Control", rating: 4.9, onTime: 100, jobs: 4 },
  { name: "FixIt General", service: "Repairs", rating: 4.2, onTime: 85, jobs: 18 },
];

const demoCompliance = {
  totalUnits: 142,
  compliant: 124,
  pendingViolations: 11,
  resolvedThisQuarter: 28,
  inspectionsCompleted: 89,
};

const demoCalendar = [
  { date: "Mar 1", event: "HOA Dues Deadline" },
  { date: "Mar 5", event: "Pool Resurfacing Complete" },
  { date: "Mar 10", event: "Batch Pressure Washing" },
  { date: "Mar 15", event: "Quarterly Pest Control" },
  { date: "Mar 22", event: "Board Meeting" },
  { date: "Mar 30", event: "Landscaping Inspection" },
];

export default function BusinessBoardReport() {
  const { toast } = useToast();
  const [quarter, setQuarter] = useState("Q1");
  const [year, setYear] = useState("2026");

  const totalSpent = demoSpending.reduce((s, i) => s + i.amount, 0);
  const totalBudget = demoSpending.reduce((s, i) => s + i.budget, 0);
  const complianceRate = Math.round((demoCompliance.compliant / demoCompliance.totalUnits) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/40 to-white">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href="/business/dashboard">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Board Report Generator</h1>
              <p className="text-sm text-slate-500">Generate quarterly reports for the board</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => toast({ title: "Downloading PDF", description: "Your report is being generated." })}>
              <Download className="h-4 w-4 mr-2" />Download PDF
            </Button>
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => toast({ title: "Email sent", description: "Board report has been emailed to all board members." })}>
              <Mail className="h-4 w-4 mr-2" />Email to Board
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Period Selector */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-2">
                <Label>Quarter</Label>
                <Select value={quarter} onValueChange={setQuarter}>
                  <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {quarters.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label>Year</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Badge variant="outline" className="text-sm">
                <FileText className="h-3.5 w-3.5 mr-1" />
                Report: {quarter} {year}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Spending Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" />Spending Summary</CardTitle>
            <CardDescription>
              Total spent: ${totalSpent.toLocaleString()} of ${totalBudget.toLocaleString()} budget ({Math.round((totalSpent / totalBudget) * 100)}% utilized)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {demoSpending.map((item) => (
                <div key={item.category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700">{item.category}</span>
                    <span className="text-slate-500">${item.amount.toLocaleString()} / ${item.budget.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${item.amount / item.budget > 0.9 ? "bg-red-500" : "bg-amber-500"}`}
                      style={{ width: `${Math.min((item.amount / item.budget) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Vendor Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Vendor Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {demoVendors.map((vendor) => (
                <div key={vendor.name} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-slate-900">{vendor.name}</h4>
                    <Badge variant="outline">{vendor.service}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-amber-700">{vendor.rating}</p>
                      <p className="text-xs text-slate-500">Rating</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-900">{vendor.onTime}%</p>
                      <p className="text-xs text-slate-500">On Time</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-900">{vendor.jobs}</p>
                      <p className="text-xs text-slate-500">Jobs</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Compliance Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Compliance Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-700">{complianceRate}%</p>
                <p className="text-xs text-slate-500 mt-1">Compliance Rate</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-3xl font-bold text-red-600">{demoCompliance.pendingViolations}</p>
                <p className="text-xs text-slate-500 mt-1">Pending Violations</p>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <p className="text-3xl font-bold text-amber-700">{demoCompliance.resolvedThisQuarter}</p>
                <p className="text-xs text-slate-500 mt-1">Resolved This Quarter</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">{demoCompliance.inspectionsCompleted}</p>
                <p className="text-xs text-slate-500 mt-1">Inspections Done</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />Maintenance Calendar</CardTitle>
            <CardDescription>Upcoming scheduled maintenance and events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {demoCalendar.map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50">
                  <div className="w-16 text-center">
                    <p className="text-sm font-semibold text-amber-700">{item.date}</p>
                  </div>
                  <div className="w-px h-8 bg-slate-200" />
                  <p className="text-sm text-slate-700">{item.event}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
