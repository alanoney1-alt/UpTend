import { Header as ClassicHeader } from "./header-classic";
import { Header as GeorgeHeader } from "./header-george";
import { useSiteMode } from "@/contexts/site-mode-context";

export function Header() {
  const { mode } = useSiteMode();
  // Default is "classic" — only show George header if explicitly in george mode
  if (mode === "george") return <GeorgeHeader />;
  return <ClassicHeader />;
}
