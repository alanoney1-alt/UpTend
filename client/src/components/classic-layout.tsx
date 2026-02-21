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
      {/* George AI toggle banner — sticky below the fixed header */}
      <div
        className="sticky top-[60px] z-40 bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 px-4 text-center cursor-pointer hover:from-amber-500 hover:to-orange-500 transition-colors shadow-lg"
        onClick={toggle}
      >
        <span className="text-sm md:text-base font-semibold">
          Try <strong>George AI</strong> — your intelligent home assistant.{" "}
          <span className="underline font-bold">Switch to AI Mode</span> &rarr;
        </span>
      </div>
      <main>{children}</main>
      <Footer />
    </div>
  );
}
