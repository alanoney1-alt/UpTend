import { Footer as ClassicFooter } from "./footer-classic";
import { Footer as GeorgeFooter } from "./footer-george";
import { useSiteMode } from "@/contexts/site-mode-context";

export function Footer() {
  const { mode } = useSiteMode();
  if (mode === "george") return <GeorgeFooter />;
  return <ClassicFooter />;
}
