import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  isAdmin: boolean;
  /** Set by server: can download all photos in full quality (admin grant). */
  fullAccess?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  guestMode: boolean;
  login: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestMode, setGuestMode] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => res.json())
      .then((data: { user: AuthUser | null }) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const enterGuestMode = () => setGuestMode(true);
  const exitGuestMode = () => setGuestMode(false);

  const login = async (credential: string) => {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ credential }),
    });
    if (!res.ok) throw new Error('Login failed');
    const data = (await res.json()) as { user: AuthUser };
    setUser(data.user);
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    setGuestMode(false);
  };

  const refreshUser = async () => {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (!res.ok) return;
    const data = (await res.json()) as { user: AuthUser | null };
    setUser(data.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, guestMode, login, logout, refreshUser, enterGuestMode, exitGuestMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
