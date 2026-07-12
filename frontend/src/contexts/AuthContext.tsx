'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { api } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role_name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (access: string, refresh: string, user: User) => void;
  logout: () => void;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initAuth = async () => {
      const token = Cookies.get('access_token');
      const userData = Cookies.get('user_data');
      const publicPaths = ['/login', '/register', '/forgot-password'];
      if (!token) {
        if (!publicPaths.includes(pathname)) router.push('/login');
        setLoading(false);
        return;
      }

      try {
        // Validate token with server and refresh server-side user info
        const res = await api.get('/auth/me/');
        const serverUser = res.data;
        Cookies.set('user_data', JSON.stringify(serverUser), { expires: 7 });
        setUser(serverUser);
        if (pathname === '/login') router.push('/dashboard');
      } catch (e) {
        // api interceptor will attempt refresh; if still failing, clear and redirect
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        Cookies.remove('user_data');
        const publicPaths = ['/login', '/register', '/forgot-password'];
        if (!publicPaths.includes(pathname)) router.push('/login');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    void initAuth();
    // Silent refresh interval: attempt refresh every 25 minutes to keep session alive
    const interval = setInterval(async () => {
      const refresh = Cookies.get('refresh_token');
      if (!refresh) return;
      try {
        const resp = await api.post('/auth/refresh/', { refresh });
        const nextAccess = resp.data.access;
        Cookies.set('access_token', nextAccess, { expires: 1/24 });
      } catch (e) {
        // On refresh failure, clear auth and redirect to login
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        Cookies.remove('user_data');
        setUser(null);
        const publicPaths = ['/login', '/register', '/forgot-password'];
        if (typeof window !== 'undefined' && !publicPaths.includes(window.location.pathname)) {
          window.location.href = '/login';
        }
      }
    }, 25 * 60 * 1000);

    return () => clearInterval(interval);
  }, [pathname, router]);

  const login = (access: string, refresh: string, userData: User) => {
    Cookies.set('access_token', access, { expires: 1/24 }); // 1 hour
    Cookies.set('refresh_token', refresh, { expires: 7 }); // 7 days
    Cookies.set('user_data', JSON.stringify(userData), { expires: 7 });
    setUser(userData);
    router.push('/dashboard');
  };

  const logout = async () => {
    const refresh = Cookies.get('refresh_token');
    if (refresh) {
      try {
        await api.post('/auth/logout/', { refresh });
      } catch (e) {
        console.error("Logout failed on server:", e);
      }
    }
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    Cookies.remove('user_data');
    setUser(null);
    router.push('/login');
  };

  const hasRole = (roles: string[]) => {
    if (!user || !user.role_name) return false;
    return roles.includes(user.role_name);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
