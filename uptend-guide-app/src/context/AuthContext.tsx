import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { getUser, customerLogin, proLogin, businessLogin, setToken, clearToken } from '../api/client';

type Role = 'customer' | 'pro' | 'business' | null;

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  companyName?: string;
  propertyCount?: number;
  [key: string]: any;
}

interface PendingAction {
  type: 'book' | 'subscribe' | 'favorite' | 'review';
  payload?: any;
}

interface AuthState {
  user: User | null;
  role: Role;
  loading: boolean;
  guestMode: boolean;
  guestSessionId: string | null;
  pendingAction: PendingAction | null;
  login: (email: string, password: string, role: 'customer' | 'pro' | 'business') => Promise<void>;
  signup: (data: { name: string; email: string; password: string; role: 'customer' | 'pro' | 'business'; companyName?: string; propertyCount?: number }) => Promise<void>;
  logout: () => Promise<void>;
  setPendingAction: (action: PendingAction | null) => void;
  requireAuth: (action: PendingAction) => boolean;
}

function generateGuestSessionId(): string {
  return 'guest_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

const AuthContext = createContext<AuthState>({
  user: null,
  role: null,
  loading: true,
  guestMode: true,
  guestSessionId: null,
  pendingAction: null,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  setPendingAction: () => {},
  requireAuth: () => false,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);
  const [guestSessionId] = useState<string>(generateGuestSessionId);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const guestMode = !user;

  useEffect(() => {
    (async () => {
      try {
        const u = await getUser();
        if (u) {
          setUser(u);
          setRole(u.role || 'customer');
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string, r: 'customer' | 'pro' | 'business') => {
    const fn = r === 'pro' ? proLogin : r === 'business' ? businessLogin : customerLogin;
    const res = await fn(email, password);
    await setToken(res.token);
    setUser(res.user);
    setRole(r);
  };

  const signup = async (data: { name: string; email: string; password: string; role: 'customer' | 'pro' | 'business'; companyName?: string; propertyCount?: number }) => {
    // Stub: in production this calls a signup endpoint
    const mockUser: User = {
      id: Date.now().toString(),
      name: data.name,
      email: data.email,
      role: data.role,
      companyName: data.companyName,
      propertyCount: data.propertyCount,
    };
    setUser(mockUser);
    setRole(data.role);
  };

  const logout = async () => {
    await clearToken();
    setUser(null);
    setRole(null);
  };

  // Returns true if auth is required (user is guest). Caller should show SignUpModal.
  const requireAuth = useCallback((action: PendingAction): boolean => {
    if (guestMode) {
      setPendingAction(action);
      return true;
    }
    return false;
  }, [guestMode]);

  return (
    <AuthContext.Provider value={{ user, role, loading, guestMode, guestSessionId, pendingAction, login, signup, logout, setPendingAction, requireAuth }}>
      {children}
    </AuthContext.Provider>
  );
}
