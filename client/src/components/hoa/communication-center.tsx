/**
 * HOA Communication Center
 *
 * Allows HOA/Property Managers to communicate with homeowners:
 * - Send violation notifications (automated)
 * - Community announcements
 * - Service reminders
 * - Emergency alerts
 * - Communication history tracking
 * - Template library
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  MessageSquare, Send, Mail, Phone, AlertTriangle, Megaphone,
  Bell, Clock, CheckCircle, Home, FileText, Plus
} from "lucide-react";
import { format } from "date-fns";
import type { HoaProperty, ViolationCommunication } from "@shared/schema";

interface CommunicationTemplate {
  id: string;
  name: string;
  type: "violation" | "announcement" | "reminder" | "emergency";
  subject: string;
  body: string;
}

interface CommunicationHistory {
  id: string;
  propertyId: string;
  propertyAddress: string;
  ownerName: string;
  type: string;
  subject: string;
  message: string;
  sentVia: "email" | "sms" | "both";
  sentAt: string;
  status: "sent" | "delivered" | "failed";
}

interface HoaCommunicationCenterProps {
  businessAccountId: string;
}

const TEMPLATES: CommunicationTemplate[] = [
  {
    id: "violation-initial",
    name: "Initial Violation Notice",
    type: "violation",
    subject: "Community Guidelines Violation Notice",
    body: "Dear Homeowner,\n\nThis is to notify you of a community guidelines violation at your property located at {address}.\n\nViolation Type: {violation_type}\nDescription: {description}\nDeadline for Resolution: {deadline}\n\nPlease address this matter promptly to maintain our community standards.\n\nBest regards,\n{hoa_name}"
  },
  {
    id: "violation-reminder",
    name: "Violation Reminder",
    type: "violation",
    subject: "Reminder: Outstanding Violation",
    body: "Dear Homeowner,\n\nThis is a friendly reminder about the outstanding violation at {address}.\n\nOriginal Notice Date: {original_date}\nDeadline: {deadline}\n\nPlease resolve this matter to avoid further action.\n\nThank you,\n{hoa_name}"
  },
  {
    id: "announcement-general",
    name: "General Announcement",
    type: "announcement",
    subject: "Community Announcement",
    body: "Dear Residents,\n\n{message}\n\nThank you for being part of our community.\n\nBest regards,\n{hoa_name}"
  },
  {
    id: "emergency-alert",
    name: "Emergency Alert",
    type: "emergency",
    subject: "URGENT: Community Alert",
    body: "URGENT NOTICE\n\n{message}\n\nPlease take immediate action as advised.\n\n{hoa_name}"
  },
];

export function HoaCommunicationCenter({ businessAccountId }: HoaCommunicationCenterProps) {
  const { toast } = useToast();
  const [isComposeDialogOpen, setIsComposeDialogOpen] = useState(false);

  // Fetch properties
  const { data: properties } = useQuery<HoaProperty[]>({
    queryKey: [`/api/business/${businessAccountId}/properties`],
  });

  // Fetch communication history
  const { data: history, isLoading: historyLoading } = useQuery<CommunicationHistory[]>({
    queryKey: [`/api/business/${businessAccountId}/communications`],
  });

  const handleComposeSuccess = () => {
    setIsComposeDialogOpen(false);
    toast({ title: "Success", description: "Message sent successfully" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <CardTitle>Communication Center</CardTitle>
                <CardDescription>
                  Send messages to homeowners via email and SMS
                </CardDescription>
              </div>
            </div>

            <Dialog open={isComposeDialogOpen} onOpenChange={setIsComposeDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Compose Message
                </Button>
              </DialogTrigger>
              <ComposeMessageDialog
                businessAccountId={businessAccountId}
                properties={properties || []}
                templates={TEMPLATES}
                onSuccess={handleComposeSuccess}
              />
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="history" className="space-y-6">
        <TabsList>
          <TabsTrigger value="history">
            <Clock className="w-4 h-4 mr-1" />
            History
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="w-4 h-4 mr-1" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Bell className="w-4 h-4 mr-1" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Communication History</CardTitle>
              <CardDescription>
                All messages sent to homeowners
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : !history || history.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Messages Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start communicating with homeowners by composing your first message
                  </p>
                  <Button onClick={() => setIsComposeDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Send First Message
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((comm) => (
                    <div key={comm.id} className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Home className="w-4 h-4 text-muted-foreground shrink-0" />
                            <h4 className="font-medium truncate">{comm.propertyAddress}</h4>
                            <Badge
                              variant={
                                comm.type === "emergency"
                                  ? "destructive"
                                  : comm.type === "violation"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {comm.type}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium mb-1">{comm.subject}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {comm.message}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <Badge
                            variant={
                              comm.status === "delivered"
                                ? "default"
                                : comm.status === "failed"
                                ? "destructive"
                                : "secondary"
                            }
                            className="mb-2"
                          >
                            {comm.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(comm.sentAt), "MMM d, h:mm a")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground pl-6">
                        <span className="flex items-center gap-1">
                          {comm.sentVia === "email" || comm.sentVia === "both" ? (
                            <Mail className="w-3 h-3" />
                          ) : null}
                          {comm.sentVia === "sms" || comm.sentVia === "both" ? (
                            <Phone className="w-3 h-3" />
                          ) : null}
                          <span className="capitalize">{comm.sentVia}</span>
                        </span>
                        {comm.ownerName && <span>• To: {comm.ownerName}</span>}
                      </div>
                      <Separator />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Message Templates</CardTitle>
              <CardDescription>
                Pre-built templates for common communications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {TEMPLATES.map((template) => (
                  <Card key={template.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <Badge
                          variant={
                            template.type === "emergency"
                              ? "destructive"
                              : template.type === "violation"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs capitalize"
                        >
                          {template.type}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Subject:</p>
                          <p className="text-sm font-medium">{template.subject}</p>
                        </div>
                        <Separator />
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {template.body.substring(0, 150)}...
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure default communication preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">Email Notifications</p>
                    <p className="text-xs text-muted-foreground">
                      Send communications via email by default
                    </p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300" />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">SMS Notifications</p>
                    <p className="text-xs text-muted-foreground">
                      Send communications via SMS by default
                    </p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300" />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">Auto-Send Violation Notices</p>
                    <p className="text-xs text-muted-foreground">
                      Automatically notify homeowners when violations are submitted
                    </p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300" />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">Violation Reminders</p>
                    <p className="text-xs text-muted-foreground">
                      Send automatic reminders 3 days before violation deadline
                    </p>
                  </div>
                  <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Default Signature</Label>
                <Textarea
                  placeholder="Your HOA name and contact information..."
                  rows={3}
                  defaultValue="Best regards,\n[Your HOA Name]\n[Contact Information]"
                />
              </div>

              <Button className="w-full">Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ComposeMessageDialog({
  businessAccountId,
  properties,
  templates,
  onSuccess,
}: {
  businessAccountId: string;
  properties: HoaProperty[];
  templates: CommunicationTemplate[];
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [formData, setFormData] = useState({
    recipientType: "single" as "single" | "all" | "multiple",
    propertyId: "",
    subject: "",
    message: "",
    sendVia: "both" as "email" | "sms" | "both",
    messageType: "announcement" as "violation" | "announcement" | "reminder" | "emergency",
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      apiRequest("POST", `/api/business/${businessAccountId}/communications`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/business/${businessAccountId}/communications`] });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive"
      });
    },
  });

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData({
        ...formData,
        subject: template.subject,
        message: template.body,
        messageType: template.type,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject.trim() || !formData.message.trim()) {
      toast({ title: "Error", description: "Subject and message are required", variant: "destructive" });
      return;
    }

    if (formData.recipientType === "single" && !formData.propertyId) {
      toast({ title: "Error", description: "Please select a property", variant: "destructive" });
      return;
    }

    sendMessageMutation.mutate(formData);
  };

  return (
    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Compose Message</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Template Selection */}
        <div className="space-y-2">
          <Label>Use Template (Optional)</Label>
          <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a template..." />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Recipients */}
        <div className="space-y-2">
          <Label>Recipients</Label>
          <Select
            value={formData.recipientType}
            onValueChange={(value: any) => setFormData({ ...formData, recipientType: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single Property</SelectItem>
              <SelectItem value="all">All Properties</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.recipientType === "single" && (
          <div className="space-y-2">
            <Label>Property</Label>
            <Select
              value={formData.propertyId}
              onValueChange={(value) => setFormData({ ...formData, propertyId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select property..." />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.address} {property.ownerName && `(${property.ownerName})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Message Type */}
        <div className="space-y-2">
          <Label>Message Type</Label>
          <Select
            value={formData.messageType}
            onValueChange={(value: any) => setFormData({ ...formData, messageType: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="announcement">Announcement</SelectItem>
              <SelectItem value="reminder">Reminder</SelectItem>
              <SelectItem value="violation">Violation Notice</SelectItem>
              <SelectItem value="emergency">Emergency Alert</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Subject */}
        <div className="space-y-2">
          <Label htmlFor="subject">Subject *</Label>
          <Input
            id="subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="Message subject..."
            required
          />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <Label htmlFor="message">Message *</Label>
          <Textarea
            id="message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Your message to homeowners..."
            rows={8}
            required
          />
          <p className="text-xs text-muted-foreground">
            Variables: {"{address}"}, {"{owner_name}"}, {"{deadline}"}, {"{hoa_name}"}
          </p>
        </div>

        {/* Send Via */}
        <div className="space-y-2">
          <Label>Send Via</Label>
          <Select
            value={formData.sendVia}
            onValueChange={(value: any) => setFormData({ ...formData, sendVia: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="both">Email & SMS</SelectItem>
              <SelectItem value="email">Email Only</SelectItem>
              <SelectItem value="sms">SMS Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button type="submit" disabled={sendMessageMutation.isPending}>
            {sendMessageMutation.isPending ? (
              "Sending..."
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
