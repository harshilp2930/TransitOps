'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Truck, ShieldAlert, Key } from 'lucide-react';
import Link from 'next/link';

type ApiError = {
  response?: {
    status?: number;
  };
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('transitops123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (loginEmail: string, loginPass: string) => {
    setError('');
    setIsLoading(true);

    try {
      const res = await api.post('/auth/login/', { email: loginEmail, password: loginPass });
      const { access, refresh, user_id, full_name, role } = res.data;
      
      login(access, refresh, {
        id: user_id,
        email: loginEmail,
        full_name: full_name,
        role_name: role
      });
      
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      console.error(err);
      if (apiErr.response?.status === 401) {
        setError('Invalid credentials or account locked.');
      } else {
        setError('An error occurred during login. Please try again.');
      }
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin(email, password);
  };

  const quickRoles = [
    { label: 'Fleet Manager', email: 'fleet@transitops.com' },
    { label: 'Dispatcher', email: 'dispatcher@transitops.com' },
    { label: 'Safety Officer', email: 'safety@transitops.com' },
    { label: 'Financial Analyst', email: 'finance@transitops.com' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-8 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-blue-600 p-3 rounded-full mb-4 shadow-lg shadow-blue-500/20">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">TransitOps</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm text-center">
            Sign in to access your fleet operations dashboard
          </p>
        </div>

        {/* Quick Login Options */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 text-center">
            Quick Sign In
          </p>
          <div className="grid grid-cols-2 gap-2">
            {quickRoles.map((role) => (
              <button
                key={role.email}
                type="button"
                onClick={() => {
                  setEmail(role.email);
                  handleLogin(role.email, 'transitops123');
                }}
                disabled={isLoading}
                className="flex items-center justify-center px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg transition-colors border border-slate-200 dark:border-transparent"
              >
                <Key className="w-3 h-3 mr-1.5 opacity-70" />
                {role.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">Or continue with email</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500/50 rounded-lg flex items-center text-red-600 dark:text-red-400 text-sm">
            <ShieldAlert className="w-4 h-4 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-label="Email address"
              className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="name@transitops.com"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <Link href="/forgot-password" className="text-xs text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-label="Password"
              className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            aria-disabled={isLoading}
            aria-label="Sign in"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center mt-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Sign In'
            )}
          </button>
          
          <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            Don't have an account?{' '}
            <Link href="/register" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
              Register here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
