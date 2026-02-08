import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Smartphone } from "lucide-react";
import { BeforeInstallPromptEvent, isPWAInstalled } from "@/lib/pwa";

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isPWAInstalled()) return;
    
    const dismissedAt = localStorage.getItem("pwa-prompt-dismissed");
    if (dismissedAt) {
      const dismissedDate = new Date(dismissedAt);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setDismissed(true);
        return;
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-prompt-dismissed", new Date().toISOString());
    setShowPrompt(false);
    setDismissed(true);
  };

  if (!showPrompt || dismissed || isPWAInstalled()) return null;

  return (
    <div 
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-primary text-primary-foreground rounded-lg shadow-lg p-4 z-50 animate-in slide-in-from-bottom-4"
      data-testid="pwa-install-prompt"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 p-2 bg-primary-foreground/20 rounded-lg">
          <Smartphone className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">Install UpTend App</h3>
          <p className="text-xs opacity-90 mt-1">
            Track your Pro via GPS, get instant updates, and manage your home from anywhere.
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleInstall}
              className="flex-1"
              data-testid="button-install-app"
            >
              <Download className="h-4 w-4 mr-1" />
              Install
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="text-primary-foreground"
              data-testid="button-dismiss-install"
            >
              Not now
            </Button>
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleDismiss}
          className="flex-shrink-0 text-primary-foreground"
          data-testid="button-close-install-prompt"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
