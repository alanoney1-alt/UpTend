import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";
import { isPWAInstalled, BeforeInstallPromptEvent } from "@/lib/pwa";
import upyckLogo from "@assets/upyck-logo.png";

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isPWAInstalled()) return;

    const dismissedAt = localStorage.getItem("install-banner-dismissed");
    if (dismissedAt) {
      const daysSince = (Date.now() - new Date(dismissedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 3) return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem("install-banner-dismissed", new Date().toISOString());
    setVisible(false);
  };

  if (!visible || isPWAInstalled()) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t p-3 shadow-lg animate-in slide-in-from-bottom-4"
      data-testid="install-banner"
    >
      <div className="max-w-lg mx-auto flex items-center gap-3">
        <img src={upyckLogo} alt="UpTend" className="w-8 h-8 flex-shrink-0" data-testid="img-install-logo" />
        <p className="flex-1 text-sm" data-testid="text-install-message">
          Install UpTend for Real-Time GPS Tracking &amp; Job Alerts.
        </p>
        <Button size="sm" onClick={handleInstall} className="gap-1 shrink-0" data-testid="button-add-to-home">
          <Plus className="w-4 h-4" />
          Add to Home Screen
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleDismiss}
          data-testid="button-dismiss-banner"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
