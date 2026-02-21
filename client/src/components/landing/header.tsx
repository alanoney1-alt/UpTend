import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Menu, X, Leaf, ChevronDown,
  UserCircle, LogOut, ShieldCheck,
} from "lucide-react";
// ServiceBagSheet moved to booking flow — not in global header
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

  const userInitials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U"
    : "";

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800"
      data-testid="header"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-20 flex items-center relative">

        {/* Left: Logo */}
        <div className="flex-shrink-0">
          <Link href="/" onClick={closeMenu} data-testid="link-logo">
            <Logo className="w-10 h-10" textClassName="text-2xl hidden lg:block" />
          </Link>
        </div>

        {/* Center: Nav Links — clean, minimal */}
        <div className="hidden lg:flex items-center justify-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-300 flex-1">
          <Link href="/services">
            <span className="hover:text-primary-500 transition-colors duration-150 cursor-pointer" data-testid="link-services">
              {t("nav.services")}
            </span>
          </Link>
          <Link href="/pricing">
            <span className="hover:text-primary-500 transition-colors duration-150 cursor-pointer" data-testid="link-pricing">
              {t("nav.pricing")}
            </span>
          </Link>
          <Link href="/about">
            <span className="hover:text-primary-500 transition-colors duration-150 cursor-pointer" data-testid="link-about">
              {t("nav.about")}
            </span>
          </Link>
          <Link href="/business">
            <span className="hover:text-primary-500 transition-colors duration-150 cursor-pointer" data-testid="link-business">
              {t("nav.for_business", "For Business")}
            </span>
          </Link>
        </div>

        {/* Right: Actions */}
        <div className="hidden lg:flex items-center gap-4 flex-shrink-0">
          <LanguageToggle />

          {isLoading ? (
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              {user.role === "customer" && (
                <Link href="/dashboard" asChild>
                  <Button variant="ghost" className="text-gray-600 dark:text-gray-300 hover:text-primary-500" data-testid="button-customer-dashboard">
                    {t("nav.dashboard")}
                  </Button>
                </Link>
              )}
              {user.role === "hauler" && (
                <Link href="/pro/dashboard" asChild>
                  <Button variant="ghost" className="text-gray-600 dark:text-gray-300 hover:text-primary-500" data-testid="button-dashboard">
                    {t("nav.dashboard")}
                  </Button>
                </Link>
              )}
              {user.role === "admin" && (
                <Link href="/admin" asChild>
                  <Button variant="ghost" className="text-gray-600 dark:text-gray-300 hover:text-primary-500" data-testid="button-admin">
                    {t("nav.admin")}
                  </Button>
                </Link>
              )}
              <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity" data-testid="link-profile">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-primary-100 text-primary-700 text-xs">{userInitials}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden lg:block text-gray-800 dark:text-gray-200">
                  {user.firstName || "User"}
                </span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
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
                  <Button variant="ghost" className="text-gray-600 dark:text-gray-300 hover:text-primary-500" data-testid="button-login-dropdown">
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
                  className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-6 rounded-xl transition-all duration-150"
                  data-testid="button-book-now"
                >
                  {t("common.book_now")}
                </Button>
              </Link>
            </>
          )}
        </div>

        <div className="lg:hidden flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-700 dark:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 absolute top-20 left-0 w-full p-6 flex flex-col gap-6 shadow-xl z-50 animate-slide-down">

          <div className="flex flex-col gap-4 text-lg font-medium text-gray-600 dark:text-gray-300">
            <Link href="/services" onClick={closeMenu}>
              <span className="block p-2" data-testid="link-services-mobile">{t("nav.services")}</span>
            </Link>
            <Link href="/pricing" onClick={closeMenu}>
              <span className="block p-2" data-testid="link-pricing-mobile">{t("nav.pricing")}</span>
            </Link>
            <Link href="/about" onClick={closeMenu}>
              <span className="block p-2" data-testid="link-about-mobile">{t("nav.about")}</span>
            </Link>
            <Link href="/business" onClick={closeMenu}>
              <span className="block p-2" data-testid="link-business-mobile">{t("nav.for_business", "For Business")}</span>
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

          <hr className="border-gray-100 dark:border-gray-800" />

          <div className="flex flex-col gap-3">
            {isAuthenticated && user ? (
              <>
                <Link href="/profile" onClick={closeMenu}>
                  <div className="flex items-center gap-3 p-2" data-testid="link-profile-mobile">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profileImageUrl || undefined} />
                      <AvatarFallback className="bg-primary-100 text-primary-700 text-xs">{userInitials}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{user.firstName} {user.lastName}</span>
                  </div>
                </Link>
                {user.role === "customer" && (
                  <Link href="/dashboard" onClick={closeMenu}>
                    <Button variant="outline" className="w-full border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300" data-testid="button-customer-dashboard-mobile">
                      {t("nav.dashboard")}
                    </Button>
                  </Link>
                )}
                {user.role === "hauler" && (
                  <Link href="/pro/dashboard" onClick={closeMenu}>
                    <Button variant="outline" className="w-full border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300" data-testid="button-dashboard-mobile">
                      {t("nav.dashboard")}
                    </Button>
                  </Link>
                )}
                <Button
                  variant="outline"
                  className="w-full border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"
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
                  <Button variant="outline" className="w-full border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300" data-testid="button-login-mobile">
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
  );
}
