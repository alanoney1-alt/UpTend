import { Footer as ClassicFooter } from "./footer-classic";
import { Footer as GeorgeFooter } from "./footer-george";

export function Footer() {
  const mode = typeof window !== "undefined" ? localStorage.getItem("uptend-site-mode") : null;
  if (mode === "classic") return <ClassicFooter />;
  return <GeorgeFooter />;
}
