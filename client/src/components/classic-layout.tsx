import { Header } from "@/components/landing/header-classic";
import { Footer } from "@/components/landing/footer-classic";
import { useSiteMode } from "@/contexts/site-mode-context";

/**
 * Wraps any page with the original (814c125) header, footer, and AI toggle banner
 * when the site is in "classic" mode. In "george" mode, renders children as-is.
 */
export function ClassicLayout({ children }: { children: React.ReactNode }) {
  const { mode, toggle } = useSiteMode();

  if (mode !== "classic") return <>{children}</>;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
