import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  HelpCircle, X, Phone, Mail,
  ExternalLink, ChevronRight, AlertTriangle,
  Bug, CreditCard, Send, Loader2,
} from "lucide-react";
import { Link, useRoute } from "wouter";
import { useToast } from "@/hooks/use-toast";

export function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [urgentModalOpen, setUrgentModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState<"bug" | "billing">("bug");
  const [reportMessage, setReportMessage] = useState("");
  const [reportEmail, setReportEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const [isActiveJob] = useRoute("/job/:jobId/work");

  const handleToggle = () => {
    if (isActiveJob) {
      setUrgentModalOpen(true);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const handleSubmitReport = async () => {
    if (!reportMessage.trim()) return;
    setIsSending(true);
    await new Promise((r) => setTimeout(r, 1000));
    toast({ title: "Report Sent", description: "Our team will review your issue shortly." });
    setReportMessage("");
    setReportEmail("");
    setReportModalOpen(false);
    setIsSending(false);
  };

  return (
    <>
      <div className="fixed bottom-5 right-4 z-50" data-testid="support-widget">
        {isOpen && !isActiveJob && (
          <Card className="absolute bottom-16 right-0 w-80 shadow-lg animate-in slide-in-from-bottom-2 fade-in duration-200">
            <div className="p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  <span className="font-semibold">Need Help?</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  data-testid="button-close-support"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-primary-foreground/80 mt-1">
                We're here to help 7 AM - 10 PM daily
              </p>
            </div>

            <div className="p-4 space-y-3">
              <a
                href="tel:407-338-3342"
                className="flex items-center gap-3 p-3 rounded-lg hover-elevate bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                data-testid="link-widget-call"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex-shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">Call Us Now</div>
                  <div className="text-sm opacity-80">(407) 338-3342</div>
                </div>
                <ChevronRight className="w-5 h-5 opacity-60" />
              </a>

              <button
                onClick={() => { setReportType("bug"); setReportModalOpen(true); setIsOpen(false); }}
                className="flex items-center gap-3 p-3 rounded-lg hover-elevate border w-full text-left"
                data-testid="button-report-bug"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted flex-shrink-0">
                  <Bug className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Report a Bug</div>
                  <div className="text-sm text-muted-foreground">Something not working right?</div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              <button
                onClick={() => { setReportType("billing"); setReportModalOpen(true); setIsOpen(false); }}
                className="flex items-center gap-3 p-3 rounded-lg hover-elevate border w-full text-left"
                data-testid="button-billing-question"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Billing Question</div>
                  <div className="text-sm text-muted-foreground">Charges, refunds, or receipts</div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              <a
                href="mailto:support@uptendapp.com"
                className="flex items-center gap-3 p-3 rounded-lg hover-elevate border"
                data-testid="link-widget-email"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted flex-shrink-0">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Email Support</div>
                  <div className="text-sm text-muted-foreground">support@uptendapp.com</div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </a>

              <Link
                href="/faq"
                className="flex items-center gap-3 p-3 rounded-lg hover-elevate border"
                data-testid="link-widget-faq"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted flex-shrink-0">
                  <ExternalLink className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Browse FAQs</div>
                  <div className="text-sm text-muted-foreground">Find quick answers</div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            </div>
          </Card>
        )}

        <Button
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg"
          onClick={handleToggle}
          data-testid="button-support-toggle"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <HelpCircle className="w-6 h-6" />
          )}
        </Button>
      </div>

      <Dialog open={urgentModalOpen} onOpenChange={setUrgentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Urgent Issue
            </DialogTitle>
            <DialogDescription>
              You're currently on an active job. If you're experiencing an emergency or urgent problem, call dispatch immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <a href="tel:407-338-3342" className="block">
              <Button className="w-full gap-2" variant="destructive" data-testid="button-call-dispatch">
                <Phone className="w-4 h-4" />
                Call Dispatch. (407) 338-3342
              </Button>
            </a>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setUrgentModalOpen(false);
                setReportType("bug");
                setReportModalOpen(true);
              }}
              data-testid="button-report-issue-instead"
            >
              Report a Non-Urgent Issue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {reportType === "bug" ? (
                <><Bug className="w-5 h-5" /> Report a Bug</>
              ) : (
                <><CreditCard className="w-5 h-5" /> Billing Question</>
              )}
            </DialogTitle>
            <DialogDescription>
              {reportType === "bug"
                ? "Describe the issue you're experiencing and we'll look into it."
                : "Describe your billing concern and we'll review it promptly."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="report-email">Your Email</Label>
              <Input
                id="report-email"
                type="email"
                placeholder="you@email.com"
                value={reportEmail}
                onChange={(e) => setReportEmail(e.target.value)}
                data-testid="input-report-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-message">Message</Label>
              <Textarea
                id="report-message"
                placeholder={reportType === "bug" ? "Describe what happened..." : "Describe your billing question..."}
                value={reportMessage}
                onChange={(e) => setReportMessage(e.target.value)}
                className="min-h-[120px]"
                data-testid="input-report-message"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportModalOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmitReport}
              disabled={isSending || !reportMessage.trim()}
              data-testid="button-send-report"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
              Send Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
