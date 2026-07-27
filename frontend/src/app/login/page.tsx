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
    {
      label: 'Fleet Manager',
      fullName: 'Fleet Manager',
      email: 'fleet@transitops.com',
      password: 'transitops123',
      color: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 border-blue-200 dark:border-blue-500/30',
      text: 'text-blue-700 dark:text-blue-300',
      dot: 'bg-blue-500',
    },
    {
      label: 'Dispatcher',
      fullName: 'Trip Dispatcher',
      email: 'dispatcher@transitops.com',
      password: 'transitops123',
      color: 'from-violet-500 to-violet-600',
      bg: 'bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20 border-violet-200 dark:border-violet-500/30',
      text: 'text-violet-700 dark:text-violet-300',
      dot: 'bg-violet-500',
    },
    {
      label: 'Safety Officer',
      fullName: 'Safety Officer',
      email: 'safety@transitops.com',
      password: 'transitops123',
      color: 'from-amber-500 to-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 border-amber-200 dark:border-amber-500/30',
      text: 'text-amber-700 dark:text-amber-300',
      dot: 'bg-amber-500',
    },
    {
      label: 'Financial Analyst',
      fullName: 'Financial Analyst',
      email: 'finance@transitops.com',
      password: 'transitops123',
      color: 'from-emerald-500 to-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30',
      text: 'text-emerald-700 dark:text-emerald-300',
      dot: 'bg-emerald-500',
    },
    {
      label: 'Admin',
      fullName: 'Admin (Staff)',
      email: 'admin@transitops.com',
      password: 'transitops123',
      color: 'from-rose-500 to-rose-600',
      bg: 'bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border-rose-200 dark:border-rose-500/30',
      text: 'text-rose-700 dark:text-rose-300',
      dot: 'bg-rose-500',
    },
  ];

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: "url('/fleet-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-900/70"></div>
      
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-8 border border-slate-200 dark:border-slate-700 relative z-10">
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
            Quick Sign In — Demo Accounts
          </p>
          <div className="grid grid-cols-1 gap-2">
            {quickRoles.map((role) => (
              <button
                key={role.email}
                type="button"
                onClick={() => {
                  setEmail(role.email);
                  handleLogin(role.email, role.password);
                }}
                disabled={isLoading}
                className={`flex items-center gap-3 px-3 py-2.5 ${role.bg} border rounded-lg transition-all text-left disabled:opacity-50 group`}
              >
                <div className={`w-2 h-2 rounded-full ${role.dot} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-semibold ${role.text}`}>{role.label}</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{role.email}</div>
                </div>
                <Key className={`w-3 h-3 ${role.text} opacity-0 group-hover:opacity-100 transition-opacity shrink-0`} />
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-2">
            All accounts use password: <span className="font-mono font-semibold">transitops123</span>
          </p>
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
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-label="Password"
              className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="••••••••"
            />
            <div className="flex justify-end mt-1.5">
              <Link href="/forgot-password" className="text-xs text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                Forgot password?
              </Link>
            </div>
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
