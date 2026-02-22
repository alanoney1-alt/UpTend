import { useState } from "react";
import { Link } from "wouter";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { ArrowRight, Home, Menu, X } from "lucide-react";

export function BusinessHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Left: Logo → Home */}
        <Link href="/">
          <Logo className="w-9 h-9" textClassName="text-xl" />
        </Link>

        {/* Center: Nav links (desktop) */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#integrations" className="hover:text-white transition-colors">Integrations</a>
        </div>

        {/* Right: Actions (desktop) */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <Home className="w-4 h-4 mr-1.5" /> Home
            </Button>
          </Link>
          <Link href="/business/login">
            <Button variant="ghost" size="sm" className="text-slate-300">Log In</Button>
          </Link>
          <Link href="/business/onboarding">
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white font-semibold">
              Get Started <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-slate-900 border-t border-slate-800 p-6 flex flex-col gap-4">
          <a href="#pricing" onClick={() => setMobileOpen(false)} className="text-slate-300 font-medium py-2">Pricing</a>
          <a href="#features" onClick={() => setMobileOpen(false)} className="text-slate-300 font-medium py-2">Features</a>
          <a href="#integrations" onClick={() => setMobileOpen(false)} className="text-slate-300 font-medium py-2">Integrations</a>
          <hr className="border-slate-800" />
          <Link href="/" onClick={() => setMobileOpen(false)}>
            <Button variant="outline" className="w-full border-slate-600 text-slate-300">
              <Home className="w-4 h-4 mr-2" /> Back to Home
            </Button>
          </Link>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/business/login" onClick={() => setMobileOpen(false)}>
              <Button variant="outline" className="w-full border-slate-600 text-slate-300">Log In</Button>
            </Link>
            <Link href="/business/onboarding" onClick={() => setMobileOpen(false)}>
              <Button className="w-full bg-amber-500 text-white font-semibold">Get Started</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
