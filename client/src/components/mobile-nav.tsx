import { useLocation, Link } from "wouter";
import { Home, Truck, User, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface NavItem {
  path: string;
  label: string;
  icon: typeof Home;
}

const customerNavItems: NavItem[] = [
  { path: "/", label: "Home", icon: Home },
  { path: "/book", label: "Book", icon: Truck },
  { path: "/profile", label: "My Jobs", icon: Menu },
  { path: "/profile", label: "Profile", icon: User },
];

const pyckerNavItems: NavItem[] = [
  { path: "/", label: "Home", icon: Home },
  { path: "/hauler/dashboard", label: "Dashboard", icon: Truck },
  { path: "/profile", label: "Profile", icon: User },
];

export function MobileNav() {
  const [location] = useLocation();
  const { user } = useAuth();

  const hideOnPaths = [
    "/pycker-signup",
    "/customer-signup",
    "/customer-login",
    "/pycker-login",
    "/payment-setup",
    "/admin",
  ];

  if (hideOnPaths.some(path => location.startsWith(path))) {
    return null;
  }

  const isPycker = user?.role === "hauler";
  const navItems = isPycker ? pyckerNavItems : customerNavItems;

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border md:hidden pb-safe"
      data-testid="mobile-nav"
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.label}
              href={item.path}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full px-2 transition-colors",
                active 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <Icon className={cn("w-5 h-5", active && "text-primary")} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function MobileNavSpacer() {
  return <div className="h-16 md:hidden" />;
}
