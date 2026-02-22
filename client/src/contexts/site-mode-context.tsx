import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type SiteMode = "george" | "classic";

interface SiteModeContextType {
  mode: SiteMode;
  setMode: (mode: SiteMode) => void;
  toggle: () => void;
}

const SiteModeContext = createContext<SiteModeContextType>({
  mode: "classic",
  setMode: () => {},
  toggle: () => {},
});

export function useSiteMode() {
  return useContext(SiteModeContext);
}

const MODE_VERSION_KEY = "uptend-site-mode-v";
const CURRENT_VERSION = "2"; // bump to reset all users to classic

export function SiteModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<SiteMode>(() => {
    if (typeof window === "undefined") return "classic";
    // One-time migration: reset existing users to classic
    const version = localStorage.getItem(MODE_VERSION_KEY);
    if (version !== CURRENT_VERSION) {
      localStorage.setItem(MODE_VERSION_KEY, CURRENT_VERSION);
      localStorage.setItem("uptend-site-mode", "classic");
      return "classic";
    }
    return (localStorage.getItem("uptend-site-mode") as SiteMode) || "classic";
  });

  useEffect(() => {
    localStorage.setItem("uptend-site-mode", mode);
  }, [mode]);

  const setMode = (m: SiteMode) => setModeState(m);
  const toggle = () => setModeState((prev) => (prev === "george" ? "classic" : "george"));

  return (
    <SiteModeContext.Provider value={{ mode, setMode, toggle }}>
      {children}
    </SiteModeContext.Provider>
  );
}
