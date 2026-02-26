import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Menu, X, Leaf, ChevronDown,
  UserCircle, LogOut, ShieldCheck,
} from "lucide-react";
// ServiceBagSheet moved to booking flow. not in global header
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { LanguageToggle } from "@/components/ui/lang-toggle";
import { Logo } from "@/components/ui/logo";
import { useTranslation } from "react-i18next";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const { t } = useTranslation();
  const [location] = useLocation();

  const isLanding = location === "/";

  // Scroll state
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 80);
      setPastHero(y > 500);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // initial check
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const userInitials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U"
    : "";

  const closeMenu = () => setMobileMenuOpen(false);

  // Background: transparent on landing at top, solid otherwise
  const showSolid = !isLanding || scrolled;

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#F47C20] focus:text-white focus:rounded-md focus:text-sm focus:font-bold"
      >
        Skip to main content
      </a>
      <nav
        aria-label="Main navigation"
        className={`fixed top-0 left-0 right-0 z-50 text-white transition-all duration-300 ease-out ${
          showSolid
            ? "bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-lg"
            : "bg-transparent border-b border-transparent"
        }`}
        style={{ willChange: "transform, background-color, padding" }}
        data-testid="header"
      >
      <div className={`max-w-7xl mx-auto px-4 md:px-6 lg:px-8 flex items-center relative transition-all duration-300 ease-out ${
        scrolled ? "h-16" : "h-20"
      }`}>

        {/* Left: Logo */}
        <div className="flex-shrink-0">
          <Link href="/" onClick={closeMenu} data-testid="link-logo">
            <Logo className="w-10 h-10" textClassName="text-2xl hidden lg:block" />
          </Link>
        </div>

        {/* Center: Nav Links. hidden on mobile when scrolled for clean look */}
        <div className="hidden lg:flex items-center justify-center gap-6 text-sm font-medium text-slate-300 flex-1">
          <Link href="/services">
            <span className="hover:text-white transition-colors cursor-pointer" data-testid="link-services">
              Services
            </span>
          </Link>
          <Link href="/about">
            <span className="hover:text-white transition-colors cursor-pointer" data-testid="link-about">
              About
            </span>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <span className="hover:text-white transition-colors cursor-pointer flex items-center gap-1" data-testid="link-b2b">
                For Business <ChevronDown className="w-3.5 h-3.5" />
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuItem asChild>
                <Link href="/business/communities" className="cursor-pointer" data-testid="link-hoa">
                  HOA Communities
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/business" className="cursor-pointer" data-testid="link-property-mgmt">
                  Property Management
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/business/construction" className="cursor-pointer" data-testid="link-construction">
                  Construction
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href="/business/partners">
            <span className="hover:text-white transition-colors cursor-pointer" data-testid="link-partner">
              Partner With Us
            </span>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <span className="hover:text-white transition-colors cursor-pointer flex items-center gap-1" data-testid="link-more">
                More <ChevronDown className="w-3.5 h-3.5" />
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/become-pro" className="cursor-pointer" data-testid="link-become-pro">
                  Become a Pro
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/blog" className="cursor-pointer" data-testid="link-blog">
                  Blog
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/faq" className="cursor-pointer" data-testid="link-faq">
                  FAQ
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/veterans" className="cursor-pointer" data-testid="link-veterans">
                  Veteran Pros
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/contact" className="cursor-pointer" data-testid="link-contact">
                  Contact
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right: Actions */}
        <div className="hidden lg:flex items-center gap-4 flex-shrink-0">
          <LanguageToggle />

          {isLoading ? (
            <div className="w-8 h-8 rounded-full bg-slate-700 animate-pulse" />
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              {user.role === "customer" && (
                <Link href="/dashboard" asChild>
                  <Button variant="ghost" className="text-slate-300" data-testid="button-customer-dashboard">
                    {t("nav.dashboard")}
                  </Button>
                </Link>
              )}
              {user.role === "hauler" && (
                <Link href="/pro/dashboard" asChild>
                  <Button variant="ghost" className="text-slate-300" data-testid="button-dashboard">
                    {t("nav.dashboard")}
                  </Button>
                </Link>
              )}
              {user.role === "admin" && (
                <Link href="/admin" asChild>
                  <Button variant="ghost" className="text-slate-300" data-testid="button-admin">
                    {t("nav.admin")}
                  </Button>
                </Link>
              )}
              <Link href="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity" data-testid="link-profile">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-slate-700 text-slate-200 text-xs">{userInitials}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden lg:block text-slate-200">
                  {user.firstName || "User"}
                </span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400"
                onClick={() => logout()}
                aria-label="Log out"
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-slate-300" data-testid="button-login-dropdown">
                    {t("nav.log_in")} <ChevronDown className="ml-1 w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" data-testid="menu-login-options">
                  <Link href="/login">
                    <DropdownMenuItem className="cursor-pointer p-3" data-testid="link-customer-login">
                      <UserCircle className="mr-2 w-4 h-4 text-primary" /> {t("nav.member_login")}
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/login?tab=pro">
                    <DropdownMenuItem className="cursor-pointer p-3" data-testid="link-pycker-login">
                      <ShieldCheck className="mr-2 w-4 h-4 text-green-500" /> {t("nav.pro_login")}
                    </DropdownMenuItem>
                  </Link>
                </DropdownMenuContent>
              </DropdownMenu>

              <Link href="/book" asChild>
                <Button
                  className="bg-white text-slate-900 font-bold px-6"
                  data-testid="button-book-now"
                >
                  {t("common.book_now")}
                </Button>
              </Link>
            </>
          )}

          {/* Slide-in Book Now CTA. appears after scrolling past hero (landing only) */}
          {isLanding && pastHero && !isAuthenticated && (
            <Link href="/book" asChild>
              <Button
                className="bg-[#F47C20] hover:bg-[#e06910] text-white font-bold px-5 animate-in slide-in-from-right-4 duration-300"
                data-testid="button-book-now-sticky"
              >
                {t("common.book_now")}
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile right side: Book Now CTA (scrolled) + hamburger */}
        <div className="lg:hidden flex items-center gap-2 ml-auto">
          {/* Slide-in Book Now on mobile after hero */}
          {pastHero && !isAuthenticated && (
            <Link href="/book" onClick={closeMenu}>
              <Button
                className="bg-[#F47C20] hover:bg-[#e06910] text-white font-bold text-sm px-4 py-1.5 h-auto animate-in slide-in-from-right-4 duration-300"
                data-testid="button-book-now-mobile-sticky"
              >
                {t("common.book_now")}
              </Button>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div role="menu" aria-label="Mobile navigation" className={`lg:hidden bg-slate-950/95 backdrop-blur-md border-t border-slate-800 absolute ${scrolled ? "top-16" : "top-20"} left-0 w-full p-6 flex flex-col gap-6 shadow-2xl z-50 transition-all duration-300 ease-out`}>

          <div className="flex flex-col gap-4 text-lg font-medium text-slate-300">
            <Link href="/services" onClick={closeMenu}>
              <span className="block p-2" data-testid="link-services-mobile">Services</span>
            </Link>
            <Link href="/about" onClick={closeMenu}>
              <span className="block p-2" data-testid="link-about-mobile">About</span>
            </Link>
            <p className="text-xs uppercase tracking-wider text-slate-500 px-2 pt-2">For Business</p>
            <Link href="/business/communities" onClick={closeMenu}>
              <span className="block p-2 pl-4" data-testid="link-hoa-mobile">HOA Communities</span>
            </Link>
            <Link href="/business" onClick={closeMenu}>
              <span className="block p-2 pl-4" data-testid="link-pm-mobile">Property Management</span>
            </Link>
            <Link href="/business/construction" onClick={closeMenu}>
              <span className="block p-2 pl-4" data-testid="link-construction-mobile">Construction</span>
            </Link>
            <Link href="/business/partners" onClick={closeMenu}>
              <span className="block p-2" data-testid="link-partner-mobile">Partner With Us</span>
            </Link>
            <Link href="/become-pro" onClick={closeMenu}>
              <span className="block p-2" data-testid="link-become-pro-mobile">Become a Pro</span>
            </Link>
            <Link href="/veterans" onClick={closeMenu}>
              <span className="block p-2" data-testid="link-veterans-mobile">Veteran Pros</span>
            </Link>
            <Link href="/blog" onClick={closeMenu}>
              <span className="block p-2" data-testid="link-blog-mobile">Blog</span>
            </Link>
            <Link href="/faq" onClick={closeMenu}>
              <span className="block p-2" data-testid="link-faq-mobile">FAQ</span>
            </Link>
            <Link href="/contact" onClick={closeMenu}>
              <span className="block p-2" data-testid="link-contact-mobile">Contact</span>
            </Link>
            {isAuthenticated && (
              <Link href={user?.role === "hauler" ? "/pro/dashboard" : "/dashboard"} onClick={closeMenu}>
                <span className="block p-2" data-testid="link-dashboard-mobile">Dashboard</span>
              </Link>
            )}
          </div>

          <div className="flex justify-end">
            <LanguageToggle />
          </div>

          <hr className="border-slate-800" />

          <div className="flex flex-col gap-3">
            {isAuthenticated && user ? (
              <>
                <Link href="/profile" onClick={closeMenu}>
                  <div className="flex items-center gap-3 p-2" data-testid="link-profile-mobile">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profileImageUrl || undefined} />
                      <AvatarFallback className="bg-slate-700 text-slate-200 text-xs">{userInitials}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-slate-200">{user.firstName} {user.lastName}</span>
                  </div>
                </Link>
                {user.role === "customer" && (
                  <Link href="/dashboard" onClick={closeMenu}>
                    <Button variant="outline" className="w-full border-slate-600 text-slate-300" data-testid="button-customer-dashboard-mobile">
                      {t("nav.dashboard")}
                    </Button>
                  </Link>
                )}
                {user.role === "hauler" && (
                  <Link href="/pro/dashboard" onClick={closeMenu}>
                    <Button variant="outline" className="w-full border-slate-600 text-slate-300" data-testid="button-dashboard-mobile">
                      {t("nav.dashboard")}
                    </Button>
                  </Link>
                )}
                <Button
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300"
                  onClick={() => { logout(); closeMenu(); }}
                  data-testid="button-logout-mobile"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {t("nav.log_out")}
                </Button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Link href="/login" onClick={closeMenu}>
                  <Button variant="outline" className="w-full border-slate-600 text-slate-300" data-testid="button-login-mobile">
                    {t("nav.log_in")}
                  </Button>
                </Link>
                <Link href="/book" onClick={closeMenu}>
                  <Button className="w-full bg-primary text-white font-bold" data-testid="button-book-mobile">
                    {t("common.book_now")}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
    </>
  );
}
