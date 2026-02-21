import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type SiteMode = "george" | "classic";

interface SiteModeContextType {
  mode: SiteMode;
  setMode: (mode: SiteMode) => void;
  toggle: () => void;
}

const SiteModeContext = createContext<SiteModeContextType>({
  mode: "george",
  setMode: () => {},
  toggle: () => {},
});

export function useSiteMode() {
  return useContext(SiteModeContext);
}

export function SiteModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<SiteMode>(() => {
    if (typeof window === "undefined") return "george";
    return (localStorage.getItem("uptend-site-mode") as SiteMode) || "george";
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
