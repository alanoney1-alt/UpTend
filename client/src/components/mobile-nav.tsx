import { useLocation, Link } from "wouter";
import { Home, Truck, User, Menu, Camera, Image, AlertCircle } from "lucide-react";
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
  { path: "/snap-quote", label: "Snap", icon: Camera },
  { path: "/my-jobs", label: "My Jobs", icon: Menu },
  { path: "/gallery", label: "Gallery", icon: Image },
  { path: "/profile", label: "Profile", icon: User },
];

const pyckerNavItems: NavItem[] = [
  { path: "/", label: "Home", icon: Home },
  { path: "/pro/dashboard", label: "Dashboard", icon: Truck },
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
        {/* Emergency SOS Button */}
        <Link
          href="/emergency-sos"
          className="absolute -top-3 right-4 z-50 flex items-center justify-center w-10 h-10 rounded-full bg-[#DC2626] shadow-lg shadow-red-600/30 hover:bg-red-700 transition-colors"
          data-testid="nav-emergency-sos"
        >
          <AlertCircle className="w-5 h-5 text-white" />
        </Link>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          const isSnap = item.label === "Snap";
          
          return (
            <Link
              key={item.label}
              href={item.path}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full px-2 transition-colors",
                isSnap
                  ? "relative -mt-4"
                  : active 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
              )}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {isSnap ? (
                <>
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center shadow-lg",
                    active ? "bg-amber-600" : "bg-amber-500"
                  )}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[10px] mt-1 font-semibold text-amber-600">Snap</span>
                </>
              ) : (
                <>
                  <Icon className={cn("w-5 h-5", active && "text-primary")} />
                  <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                </>
              )}
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
