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
    const initAuth = () => {
      const token = Cookies.get('access_token');
      const userData = Cookies.get('user_data');
      if (token && userData) {
        setUser(JSON.parse(userData));
        if (pathname === '/login') {
          router.push('/dashboard');
        }
      } else {
        // Only redirect if trying to access a protected route (anything not /login)
        if (pathname !== '/login') {
          router.push('/login');
        }
      }
      setLoading(false);
    };
    initAuth();
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
