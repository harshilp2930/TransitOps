'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User as UserIcon, ShieldAlert, ShieldCheck, MapPin } from 'lucide-react';
import { format, isPast, isBefore, addDays } from 'date-fns';

export default function DriverDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [driver, setDriver] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchDriver = async () => {
      try {
        const res = await api.get(`/drivers/${id}/`);
        setDriver(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDriver();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!driver) {
    return <div className="text-center mt-20 text-slate-500">Driver not found.</div>;
  }

  const isExpired = isPast(new Date(driver.license_expiry_date));
  const isWarning = isBefore(new Date(driver.license_expiry_date), addDays(new Date(), 30)) && !isPast(new Date(driver.license_expiry_date));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Drivers
      </button>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400">
              <UserIcon className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{driver.name}</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center">
                <MapPin className="w-4 h-4 mr-1" /> {driver.contact_number}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${driver.status === 'Available' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/50' : driver.status === 'Suspended' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50' : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50'}`}>
              {driver.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Safety Score</p>
            <p className={`text-2xl font-bold ${driver.safety_score >= 90 ? 'text-green-600' : driver.safety_score >= 75 ? 'text-amber-600' : 'text-red-600'}`}>
              {driver.safety_score}<span className="text-sm font-normal text-slate-500">/100</span>
            </p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">License No.</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{driver.license_number}</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Category</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{driver.license_category}</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Joined Date</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{format(new Date(driver.created_at), 'MMM dd, yyyy')}</p>
          </div>
        </div>

        {/* License Expiry Alert */}
        <div className="mt-6">
          {(isExpired || isWarning) && (
            <div className={`flex items-center gap-3 p-3 rounded-lg border ${isExpired ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50'}`}>
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">
                {isExpired ? 'Driver license has EXPIRED. Dispatching is blocked.' : 'Driver license is expiring soon (within 30 days).'}
              </p>
            </div>
          )}
          {!isExpired && !isWarning && (
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/50">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">Driver license is active. Expires on {format(new Date(driver.license_expiry_date), 'MMM dd, yyyy')}.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
