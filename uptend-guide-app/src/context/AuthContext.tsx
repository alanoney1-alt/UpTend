import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import * as authService from '../services/auth';

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
  loginWithGoogle: (idToken: string) => Promise<void>;
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
  loginWithGoogle: async () => {},
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
        const token = await authService.getToken();
        if (token) {
          const u = await authService.getUser();
          if (u) {
            setUser({
              id: u.id || u._id,
              name: u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u.name || u.email,
              email: u.email,
              role: u.role || 'customer',
              ...u,
            });
            setRole(u.role || 'customer');
          }
        }
      } catch {
        // Token expired or invalid — stay in guest mode
        await authService.clearToken();
      }
      setLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string, r: 'customer' | 'pro' | 'business') => {
    const fn = r === 'pro' ? authService.proLogin : r === 'business' ? authService.businessLogin : authService.customerLogin;
    const res = await fn(email, password);
    await authService.setToken(res.token);
    const u = res.user;
    setUser({
      id: u.id || (u as any)._id,
      name: u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : (u as any).name || u.email,
      email: u.email,
      role: r,
      ...u,
    });
    setRole(r);
  };

  const signup = async (data: { name: string; email: string; password: string; role: 'customer' | 'pro' | 'business'; companyName?: string; propertyCount?: number }) => {
    const [firstName, ...lastParts] = data.name.split(' ');
    const lastName = lastParts.join(' ');
    const res = await authService.customerRegister({
      email: data.email,
      password: data.password,
      firstName,
      lastName,
    });
    await authService.setToken(res.token);
    const u = res.user;
    setUser({
      id: u.id || (u as any)._id,
      name: data.name,
      email: u.email,
      role: data.role,
      ...u,
    });
    setRole(data.role);
  };

  const loginWithGoogle = async (idToken: string) => {
    const res = await authService.googleOAuthMobile(idToken);
    await authService.setToken(res.token);
    const u = res.user;
    setUser({
      id: u.id || (u as any)._id,
      name: u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : (u as any).name || u.email,
      email: u.email,
      role: 'customer',
      ...u,
    });
    setRole('customer');
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
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
    <AuthContext.Provider value={{ user, role, loading, guestMode, guestSessionId, pendingAction, login, signup, logout, loginWithGoogle, setPendingAction, requireAuth }}>
      {children}
    </AuthContext.Provider>
  );
}
