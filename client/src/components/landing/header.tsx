import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Menu, X, ChevronDown, UserCircle, LogOut, ShieldCheck, MessageCircle,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { LanguageToggle } from "@/components/ui/lang-toggle";
import { useTranslation } from "react-i18next";

/* ─── Design Tokens ─── */
const T = {
  bg: "#FFFBF5",
  primary: "#F59E0B",
  primaryDark: "#D97706",
  text: "#1E293B",
  textMuted: "#64748B",
};

function openGeorge(message?: string) {
  window.dispatchEvent(new CustomEvent("george:open", { detail: message ? { message } : undefined }));
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const { t } = useTranslation();

  const userInitials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U"
    : "";

  const closeMenu = () => setMobileMenuOpen(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/book", label: "Book" },
    { href: "/haulers", label: "Find a Pro" },
    { href: "/meet-george", label: "Meet George" },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b border-amber-100 backdrop-blur-md"
      style={{ background: `${T.bg}ee` }}
      data-testid="header"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-16 flex items-center relative">

        {/* Left: George Logo */}
        <div className="flex-shrink-0">
          <Link href="/" onClick={closeMenu} data-testid="link-logo" className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md"
              style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})` }}
            >
              G
            </div>
            <span className="font-bold text-lg hidden sm:block" style={{ color: T.text }}>UpTend</span>
          </Link>
        </div>

        {/* Center: Nav Links */}
        <div className="hidden lg:flex items-center justify-center gap-8 text-sm font-medium flex-1" style={{ color: T.textMuted }}>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <span className="hover:text-amber-600 transition-colors cursor-pointer" style={{ color: T.textMuted }}>
                {link.label}
              </span>
            </Link>
          ))}
        </div>

        {/* Right: George avatar + auth */}
        <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
          {/* George chat trigger */}
          <button
            onClick={() => openGeorge()}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:ring-2 ring-amber-200 transition-all"
            style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})` }}
            aria-label="Chat with George"
            data-testid="button-george-chat"
          >
            <MessageCircle className="w-4 h-4 text-white" />
          </button>

          <LanguageToggle />

          {isLoading ? (
            <div className="w-8 h-8 rounded-full bg-amber-100 animate-pulse" />
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              {user.role === "customer" && (
                <Link href="/dashboard" asChild>
                  <Button variant="ghost" size="sm" className="text-sm" style={{ color: T.textMuted }} data-testid="button-customer-dashboard">
                    Dashboard
                  </Button>
                </Link>
              )}
              {user.role === "hauler" && (
                <Link href="/pro/dashboard" asChild>
                  <Button variant="ghost" size="sm" className="text-sm" style={{ color: T.textMuted }} data-testid="button-dashboard">
                    Dashboard
                  </Button>
                </Link>
              )}
              {user.role === "admin" && (
                <Link href="/admin" asChild>
                  <Button variant="ghost" size="sm" className="text-sm" style={{ color: T.textMuted }} data-testid="button-admin">
                    Admin
                  </Button>
                </Link>
              )}
              <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity" data-testid="link-profile">
                <Avatar className="h-8 w-8 ring-2 ring-amber-200">
                  <AvatarImage src={user.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-amber-100 text-amber-700 text-xs font-bold">{userInitials}</AvatarFallback>
                </Avatar>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                style={{ color: T.textMuted }}
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
                  <Button variant="ghost" size="sm" className="text-sm" style={{ color: T.textMuted }} data-testid="button-login-dropdown">
                    {t("nav.log_in")} <ChevronDown className="ml-1 w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" data-testid="menu-login-options">
                  <Link href="/login">
                    <DropdownMenuItem className="cursor-pointer p-3" data-testid="link-customer-login">
                      <UserCircle className="mr-2 w-4 h-4" style={{ color: T.primary }} /> {t("nav.member_login")}
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
                  className="text-white font-bold px-5 rounded-full shadow-md hover:shadow-lg transition-all"
                  style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})` }}
                  data-testid="button-book-now"
                >
                  {t("common.book_now")}
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="lg:hidden flex items-center gap-2 ml-auto">
          <button
            onClick={() => openGeorge()}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})` }}
            aria-label="Chat with George"
          >
            <MessageCircle className="w-4 h-4 text-white" />
          </button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden absolute top-16 left-0 w-full p-6 flex flex-col gap-6 shadow-xl z-50 border-t border-amber-100"
          style={{ background: T.bg }}
        >
          <div className="flex flex-col gap-3 text-lg font-medium" style={{ color: T.text }}>
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={closeMenu}>
                <span className="block p-2 rounded-xl hover:bg-amber-50 transition-colors">{link.label}</span>
              </Link>
            ))}
            {isAuthenticated && (
              <Link href={user?.role === "hauler" ? "/pro/dashboard" : "/dashboard"} onClick={closeMenu}>
                <span className="block p-2 rounded-xl hover:bg-amber-50 transition-colors">Dashboard</span>
              </Link>
            )}
          </div>

          <div className="flex justify-end">
            <LanguageToggle />
          </div>

          <hr className="border-amber-100" />

          <div className="flex flex-col gap-3">
            {isAuthenticated && user ? (
              <>
                <Link href="/profile" onClick={closeMenu}>
                  <div className="flex items-center gap-3 p-2" data-testid="link-profile-mobile">
                    <Avatar className="h-8 w-8 ring-2 ring-amber-200">
                      <AvatarImage src={user.profileImageUrl || undefined} />
                      <AvatarFallback className="bg-amber-100 text-amber-700 text-xs font-bold">{userInitials}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium" style={{ color: T.text }}>{user.firstName} {user.lastName}</span>
                  </div>
                </Link>
                <Button
                  variant="outline"
                  className="w-full border-amber-200"
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
                  <Button variant="outline" className="w-full border-amber-200" data-testid="button-login-mobile">
                    {t("nav.log_in")}
                  </Button>
                </Link>
                <Link href="/book" onClick={closeMenu}>
                  <Button
                    className="w-full text-white font-bold"
                    style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})` }}
                    data-testid="button-book-mobile"
                  >
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
