import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { X, Cookie, Shield, BarChart3, Megaphone } from "lucide-react";

const STORAGE_KEY = "uptend_cookie_consent";

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

function getStoredConsent(): CookiePreferences | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveConsent(prefs: CookiePreferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const consent = getStoredConsent();
    if (!consent) {
      // Small delay so it doesn't flash on page load
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!visible) return null;

  const handleAcceptAll = () => {
    saveConsent({
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    });
    setVisible(false);
  };

  const handleSavePreferences = () => {
    saveConsent({
      essential: true,
      analytics,
      marketing,
      timestamp: new Date().toISOString(),
    });
    setVisible(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-4 duration-500">
      <div className="mx-auto max-w-2xl rounded-xl border bg-card shadow-2xl">
        {/* Main banner */}
        <div className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <Cookie className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-sm mb-1">Cookie Notice</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We use cookies to improve your experience and analyze site traffic. By continuing to use our site, you agree to our use of cookies.{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>

          {/* Preferences panel */}
          {showPreferences && (
            <div className="mb-4 space-y-3 border-t pt-4">
              {/* Essential */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Essential</p>
                    <p className="text-xs text-muted-foreground">Required for the site to function</p>
                  </div>
                </div>
                <div className="w-10 h-5 rounded-full bg-primary/30 flex items-center justify-end px-0.5 cursor-not-allowed opacity-60">
                  <div className="w-4 h-4 rounded-full bg-primary" />
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Analytics</p>
                    <p className="text-xs text-muted-foreground">Helps us understand site usage</p>
                  </div>
                </div>
                <button
                  onClick={() => setAnalytics(!analytics)}
                  className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors ${
                    analytics ? "bg-primary justify-end" : "bg-gray-300 dark:bg-gray-600 justify-start"
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow" />
                </button>
              </div>

              {/* Marketing */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Marketing</p>
                    <p className="text-xs text-muted-foreground">Personalized ads and content</p>
                  </div>
                </div>
                <button
                  onClick={() => setMarketing(!marketing)}
                  className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors ${
                    marketing ? "bg-primary justify-end" : "bg-gray-300 dark:bg-gray-600 justify-start"
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow" />
                </button>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <Button onClick={handleAcceptAll} size="sm" className="flex-1">
              Accept All
            </Button>
            {showPreferences ? (
              <Button onClick={handleSavePreferences} variant="outline" size="sm" className="flex-1">
                Save Preferences
              </Button>
            ) : (
              <Button onClick={() => setShowPreferences(true)} variant="outline" size="sm" className="flex-1">
                Manage Preferences
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
