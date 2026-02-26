import { useState } from "react";
import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, TrendingUp, TrendingDown, Send, Users, Home,
  Activity, DollarSign, Megaphone, Clock, Tag
} from "lucide-react";

const demoBlastHistory = [
  { id: 1, message: "Quarterly pest control scheduled for March 15. Please ensure access to units.", channel: "email", target: "all", sentAt: "2026-02-24 10:30 AM", recipients: 142 },
  { id: 2, message: "Pool area closed for resurfacing Feb 28 through Mar 5.", channel: "sms", target: "all", sentAt: "2026-02-20 2:15 PM", recipients: 142 },
  { id: 3, message: "Reminder: HOA dues are due by March 1. Late fees apply after the 5th.", channel: "both", target: "owners", sentAt: "2026-02-18 9:00 AM", recipients: 98 },
];

const demoActivityFeed = [
  { id: 1, text: "12 homes booked pressure washing this month", time: "2 hours ago" },
  { id: 2, text: "Community compliance: 87%", time: "5 hours ago" },
  { id: 3, text: "3 new maintenance requests submitted today", time: "6 hours ago" },
  { id: 4, text: "Batch lawn care deal: 24 of 30 slots filled", time: "1 day ago" },
  { id: 5, text: "Emergency protocol drill completed successfully", time: "2 days ago" },
];

const demoBatchDeals = [
  { id: 1, service: "Pressure Washing", pricePerUnit: 89, regularPrice: 129, enrolled: 24, capacity: 30, deadline: "2026-03-10" },
  { id: 2, service: "Gutter Cleaning", pricePerUnit: 65, regularPrice: 95, enrolled: 18, capacity: 40, deadline: "2026-03-20" },
];

export default function BusinessCommunityHub() {
  const { toast } = useToast();
  const [blastMessage, setBlastMessage] = useState("");
  const [blastChannel, setBlastChannel] = useState("email");
  const [blastTarget, setBlastTarget] = useState("all");

  const handleSendBlast = () => {
    if (!blastMessage.trim()) {
      toast({ title: "Message required", description: "Please enter a message to send.", variant: "destructive" });
      return;
    }
    toast({ title: "Blast sent", description: `Message sent via ${blastChannel} to ${blastTarget} residents.` });
    setBlastMessage("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/40 to-white">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center gap-3 px-4">
          <Link href="/business/dashboard">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Community Hub</h1>
            <p className="text-sm text-slate-500">Manage communications and community health</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Community Health Score */}
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-white">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="text-center">
                <p className="text-6xl font-bold text-amber-700">87</p>
                <p className="text-sm text-slate-500 mt-1">Community Health Score</p>
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="h-5 w-5" />
                <span className="text-sm font-medium">+3 from last month</span>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-4 sm:ml-8">
                <div className="text-center p-3 bg-white rounded-lg border">
                  <p className="text-2xl font-bold text-slate-900">142</p>
                  <p className="text-xs text-slate-500">Units Serviced</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border">
                  <p className="text-2xl font-bold text-red-600">7</p>
                  <p className="text-xs text-slate-500">Overdue Items</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Community Blast */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5" />Community Blast</CardTitle>
              <CardDescription>Send announcements to residents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Message</Label>
                <Textarea placeholder="Type your announcement here..." rows={4} value={blastMessage} onChange={(e) => setBlastMessage(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Channel</Label>
                  <Select value={blastChannel} onValueChange={setBlastChannel}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Target</Label>
                  <Select value={blastTarget} onValueChange={setBlastTarget}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Residents</SelectItem>
                      <SelectItem value="owners">Owners Only</SelectItem>
                      <SelectItem value="renters">Renters Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSendBlast} className="w-full bg-amber-600 hover:bg-amber-700">
                <Send className="h-4 w-4 mr-2" />Send Blast
              </Button>
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Community Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {demoActivityFeed.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-700">{item.text}</p>
                      <p className="text-xs text-slate-400 mt-1">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Blast History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" />Blast History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {demoBlastHistory.map((blast) => (
                <div key={blast.id} className="p-4 border rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{blast.channel.toUpperCase()}</Badge>
                      <Badge variant="secondary">{blast.target}</Badge>
                      <span className="text-xs text-slate-400">{blast.recipients} recipients</span>
                    </div>
                    <span className="text-xs text-slate-400">{blast.sentAt}</span>
                  </div>
                  <p className="text-sm text-slate-700">{blast.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Batch Pricing */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Tag className="h-5 w-5" />Batch Pricing</CardTitle>
              <CardDescription>Active batch opportunities for the community</CardDescription>
            </div>
            <Button variant="outline"><DollarSign className="h-4 w-4 mr-2" />Create Batch Deal</Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {demoBatchDeals.map((deal) => (
                <div key={deal.id} className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-slate-900">{deal.service}</h4>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-amber-700">${deal.pricePerUnit}</span>
                    <span className="text-sm text-slate-400 line-through">${deal.regularPrice}</span>
                    <span className="text-xs text-green-600 font-medium">
                      {Math.round((1 - deal.pricePerUnit / deal.regularPrice) * 100)}% off
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>{deal.enrolled} of {deal.capacity} enrolled</span>
                      <span>Deadline: {deal.deadline}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${(deal.enrolled / deal.capacity) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
