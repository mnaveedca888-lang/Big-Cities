import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { UserProfile } from '@/types';
import type { AuthSession } from '@/types/auth';
import { refreshSession, logout } from '@/services/auth';

type AuthContextValue = {
  user: UserProfile | null;
  isAuthenticated: boolean;
  session: AuthSession | null;
  isRefreshing: boolean;
  refresh: () => Promise<boolean>;
  signIn: (user: UserProfile, session?: Partial<AuthSession>, rememberMe?: boolean) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getAuthStorage() {
  if (window.localStorage.getItem('auth-session')) return window.localStorage;
  if (window.sessionStorage.getItem('auth-session')) return window.sessionStorage;
  if (window.localStorage.getItem('refresh-token')) return window.localStorage;
  if (window.sessionStorage.getItem('refresh-token')) return window.sessionStorage;
  return window.localStorage;
}

function clearAuthStorage(storage: Storage) {
  storage.removeItem('auth-session');
  storage.removeItem('auth-user');
  storage.removeItem('access-token');
  storage.removeItem('refresh-token');
}

function clearAllAuthStorage() {
  clearAuthStorage(window.localStorage);
  clearAuthStorage(window.sessionStorage);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => {
    const storedSession = window.localStorage.getItem('auth-session') ?? window.sessionStorage.getItem('auth-session');
    return storedSession ? (JSON.parse(storedSession) as AuthSession) : null;
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!session?.expiresAt) return;
    const remaining = session.expiresAt - Date.now();
    if (remaining <= 0) {
      setSession(null);
      clearAllAuthStorage();
      return;
    }
    const timer = window.setTimeout(() => {
      setSession(null);
      clearAllAuthStorage();
    }, remaining);
    return () => window.clearTimeout(timer);
  }, [session]);

  useEffect(() => {
    const handleSessionUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<AuthSession>;
      if (customEvent?.detail) {
        setSession(customEvent.detail);
      }
    };
    const handleSessionClear = () => {
      setSession(null);
    };
    window.addEventListener('auth:session:update', handleSessionUpdate);
    window.addEventListener('auth:session:clear', handleSessionClear);
    return () => {
      window.removeEventListener('auth:session:update', handleSessionUpdate);
      window.removeEventListener('auth:session:clear', handleSessionClear);
    };
  }, []);

  const refresh = useCallback(async () => {
    const storage = getAuthStorage();
    const activeSession = window.localStorage.getItem('auth-session') ?? window.sessionStorage.getItem('auth-session');
    const currentSession = activeSession ? (JSON.parse(activeSession) as AuthSession) : session;
    if (!currentSession?.refreshToken || isRefreshing) return false;
    setIsRefreshing(true);
    try {
      const nextSession = await refreshSession(currentSession.refreshToken);
      setSession(nextSession);
      const authStorage = getAuthStorage();
      authStorage.setItem('auth-session', JSON.stringify(nextSession));
      authStorage.setItem('auth-user', JSON.stringify(nextSession.user));
      authStorage.setItem('access-token', nextSession.accessToken);
      if (nextSession.refreshToken) authStorage.setItem('refresh-token', nextSession.refreshToken);
      return true;
    } catch {
      setSession(null);
      clearAllAuthStorage();
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, session]);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      isAuthenticated: Boolean(session?.user),
      session,
      isRefreshing,
      refresh,
      signIn: (nextUser: UserProfile, nextSession?: Partial<AuthSession>, rememberMe = true) => {
        const storedSession: AuthSession = { user: nextUser, accessToken: nextSession?.accessToken ?? '', refreshToken: nextSession?.refreshToken, expiresAt: nextSession?.expiresAt };
        setSession(storedSession);
        const storage = rememberMe ? window.localStorage : window.sessionStorage;
        const otherStorage = rememberMe ? window.sessionStorage : window.localStorage;
        clearAuthStorage(otherStorage);
        storage.setItem('auth-session', JSON.stringify(storedSession));
        storage.setItem('auth-user', JSON.stringify(nextUser));
        if (storedSession.accessToken) storage.setItem('access-token', storedSession.accessToken);
        if (storedSession.refreshToken) storage.setItem('refresh-token', storedSession.refreshToken);
      },
      signOut: () => {
        const refreshToken = window.localStorage.getItem('refresh-token') ?? window.sessionStorage.getItem('refresh-token');
        setSession(null);
        clearAllAuthStorage();
        if (refreshToken) {
          void logout(refreshToken).catch((err) => console.error('Logout request failed', err));
        }
      },
    }),
    [isRefreshing, refresh, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
