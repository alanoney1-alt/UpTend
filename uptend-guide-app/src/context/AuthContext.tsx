import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import * as authService from '../services/auth';
import { setToken as storeToken, clearToken as removeToken, setOnUnauthorized } from '../services/api';

type Role = 'customer' | 'pro' | 'business' | null;

interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'pro' | 'business';
  companyName?: string;
  propertyCount?: number;
  phone?: string;
  firstName?: string;
  lastName?: string;
  homeSpecs?: {
    bedrooms?: number;
    bathrooms?: number;
    sqft?: number;
    yearBuilt?: number;
  };
  [key: string]: any;
}

interface PendingAction {
  type: 'book' | 'subscribe' | 'favorite' | 'review';
  payload?: any;
}

interface AuthState {
  user: User | null;
  token: string | null;
  role: Role;
  loading: boolean;
  isAuthenticated: boolean;
  guestMode: boolean;
  guestSessionId: string | null;
  pendingAction: PendingAction | null;
  login: (email: string, password: string, role: 'customer' | 'pro' | 'business') => Promise<void>;
  signup: (data: { name: string; email: string; password: string; role: 'customer' | 'pro' | 'business'; companyName?: string; propertyCount?: number }) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  setPendingAction: (action: PendingAction | null) => void;
  requireAuth: (action: PendingAction) => boolean;
  refreshUser: () => Promise<void>;
}

function generateGuestSessionId(): string {
  return 'guest_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

const AuthContext = createContext<AuthState>({
  user: null,
  token: null,
  role: null,
  loading: true,
  isAuthenticated: false,
  guestMode: true,
  guestSessionId: null,
  pendingAction: null,
  login: async () => {},
  signup: async () => {},
  register: async () => {},
  logout: async () => {},
  loginWithGoogle: async () => {},
  setPendingAction: () => {},
  requireAuth: () => false,
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

function buildUser(u: any, r: Role): User {
  return {
    id: u.id || u._id,
    name: u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u.name || u.email,
    email: u.email,
    role: (r || u.role || 'customer') as 'customer' | 'pro' | 'business',
    phone: u.phone,
    firstName: u.firstName,
    lastName: u.lastName,
    homeSpecs: u.homeSpecs,
    ...u,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);
  const [guestSessionId] = useState<string>(generateGuestSessionId);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const guestMode = !user;
  const isAuthenticated = !!user && !!token;

  // Handle 401 responses — auto-logout
  const handleUnauthorized = useCallback(() => {
    setUser(null);
    setTokenState(null);
    setRole(null);
    authService.logout();
  }, []);

  useEffect(() => {
    setOnUnauthorized(handleUnauthorized);
    return () => setOnUnauthorized(null);
  }, [handleUnauthorized]);

  const refreshUser = useCallback(async () => {
    try {
      const u = await authService.getUser();
      if (u) {
        const r = (u.role || 'customer') as Role;
        setUser(buildUser(u, r));
        setRole(r);
      }
    } catch {
      // Token may be expired
    }
  }, []);

  // Auto-check stored auth on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await authService.getStoredAuth();
        if (stored?.token && stored?.user) {
          setTokenState(stored.token);
          const r = (stored.user.role || 'customer') as Role;
          setUser(buildUser(stored.user, r));
          setRole(r);
          // Refresh user from server in background
          try {
            const fresh = await authService.getUser();
            if (fresh) {
              const fr = (fresh.role || 'customer') as Role;
              setUser(buildUser(fresh, fr));
              setRole(fr);
            }
          } catch {
            // Stored data is still usable
          }
        }
      } catch {
        // No active session — stay in guest mode
      }
      setLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string, r: 'customer' | 'pro' | 'business') => {
    const res = await authService.login(email, password, r);
    if (res.token) {
      setTokenState(res.token);
    }
    const u = res.user;
    setUser(buildUser(u, r));
    setRole(r);
  };

  const signup = async (data: { name: string; email: string; password: string; role: 'customer' | 'pro' | 'business'; companyName?: string; propertyCount?: number }) => {
    const res = await authService.register(data.name, data.email, data.password);
    if (res.token) {
      setTokenState(res.token);
    }
    const u = res.user;
    setUser(buildUser(u, data.role));
    setRole(data.role);
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    const res = await authService.register(name, email, password, phone);
    if (res.token) {
      setTokenState(res.token);
    }
    const u = res.user;
    setUser(buildUser(u, 'customer'));
    setRole('customer');
  };

  const loginWithGoogle = async (idToken: string) => {
    const res = await authService.googleOAuthMobile(idToken);
    if (res.token) {
      await storeToken(res.token);
      setTokenState(res.token);
    }
    const u = res.user;
    setUser(buildUser(u, 'customer'));
    setRole('customer');
  };

  const logout = async () => {
    await authService.logout();
    await removeToken();
    setUser(null);
    setTokenState(null);
    setRole(null);
  };

  const requireAuth = useCallback((action: PendingAction): boolean => {
    if (guestMode) {
      setPendingAction(action);
      return true;
    }
    return false;
  }, [guestMode]);

  return (
    <AuthContext.Provider value={{ user, token, role, loading, isAuthenticated, guestMode, guestSessionId, pendingAction, login, signup, register, logout, loginWithGoogle, setPendingAction, requireAuth, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
