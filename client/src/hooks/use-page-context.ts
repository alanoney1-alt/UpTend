import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export interface PageContext {
  page: string;
  section: string;
  userRole: "customer" | "pro" | "visitor";
  userName: string | null;
  relevantData: {
    activeJobs?: number;
    onboardingProgress?: number;
    currentService?: string;
  };
}

export function usePageContext(): PageContext {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const userRole: "customer" | "pro" | "visitor" = !isAuthenticated
    ? "visitor"
    : user?.role === "hauler"
      ? "pro"
      : "customer";

  const userName = (user as any)?.firstName || (user as any)?.fullName || (user as any)?.username || null;

  // Determine section from path
  let section = "general";
  if (location.startsWith("/book")) section = "booking";
  else if (location.startsWith("/services")) section = "services";
  else if (location.startsWith("/pricing")) section = "services";
  else if (location.startsWith("/dashboard")) section = "customer-dashboard";
  else if (location.startsWith("/pro/dashboard") || location.startsWith("/hauler/dashboard")) section = "pro-dashboard";
  else if (location.startsWith("/ai")) section = "ai-tools";
  else if (location.startsWith("/quote")) section = "quote";
  else if (location === "/") section = "home";

  return {
    page: location,
    section,
    userRole,
    userName,
    relevantData: {},
  };
}
