import { Header as ClassicHeader } from "./header-classic";
import { Header as GeorgeHeader } from "./header-george";

export function Header() {
  const mode = typeof window !== "undefined" ? localStorage.getItem("uptend-site-mode") : null;
  if (mode === "classic") return <ClassicHeader />;
  return <GeorgeHeader />;
}
