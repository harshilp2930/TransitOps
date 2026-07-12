'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Truck, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/register/', {
        full_name: name,
        email: email,
        password: password,
        role_name: 'Dispatcher'
      });
      setIsSuccess(true);
    } catch (err: any) {
      console.error(err.response?.data);
      const data = err.response?.data;
      const msg = data ? Object.values(data).flat().join(' | ') : 'Failed to register. Email may already be in use.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
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
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-8 border border-slate-200 dark:border-slate-700 text-center relative z-10">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Registration Successful</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            Your account request has been submitted. An administrator will review and assign your role shortly.
          </p>
          <Link
            href="/login"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-block"
          >
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create an Account</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm text-center">
            Register to join your fleet operations team
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500/50 rounded-lg text-red-600 dark:text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Harshil Patel"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
              className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center mt-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Register'
            )}
          </button>
          
          <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
