'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertTriangle, Truck } from 'lucide-react';

export default function VehicleDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [vehicle, setVehicle] = useState<{
    id: number;
    registration_number: string;
    status: string;
    max_load_capacity_kg: string;
    insurance_expiry?: string | null;
    fitness_expiry?: string | null;
    permit_expiry?: string | null;
    tyre_replacement_threshold?: string | number;
    category_expense_totals?: {
      fuel: number;
      maintenance: number;
      toll: number;
      misc: number;
      other: number;
      total: number;
    };
    [key: string]: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const res = await api.get(`/vehicles/${params.id}/`);
        setVehicle(res.data);
      } catch (err: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const error = err as any;
        console.error(error.response?.data?.detail || 'Failed to load vehicle details');
      } finally {
        setLoading(false);
      }
    };
    fetchVehicle();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!vehicle) {
    return <div className="text-center mt-20 text-slate-500">Vehicle not found.</div>;
  }

  const getExpiryStatus = (dateString?: string | null) => {
    if (!dateString) return { status: 'Missing', color: 'bg-slate-100 text-slate-600 border-slate-200' };
    const days = Math.ceil((new Date(dateString).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    if (days < 0) return { status: 'Expired', color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50', days };
    if (days <= 30) return { status: 'Expiring Soon', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50', days };
    return { status: 'Valid', color: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/50', days };
  };

  const insStatus = getExpiryStatus(vehicle.insurance_expiry);
  const fitStatus = getExpiryStatus(vehicle.fitness_expiry);
  const permStatus = getExpiryStatus(vehicle.permit_expiry);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Fleet
      </button>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Truck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{vehicle.registration_number}</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">{vehicle.name_model} • {vehicle.type}</p>
            </div>
          </div>
          <div className="text-right">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${vehicle.status === 'Available' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/50' : vehicle.status === 'In Shop' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50' : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50'}`}>
              {vehicle.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Odometer</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{parseFloat(vehicle.odometer_km).toLocaleString()} km</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Capacity</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{parseFloat(vehicle.max_load_capacity_kg).toLocaleString()} kg</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Operating Cost</p>
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400">₹{parseFloat(vehicle.total_operational_cost || '0').toLocaleString()}</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Region</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{vehicle.region || 'Unassigned'}</p>
          </div>
        </div>

        {/* Dynamic Alerts based on BRs */}
        <div className="mt-6 space-y-2">
          {vehicle.needs_tyre_change && (
            <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg text-red-700 dark:text-red-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">Tyre replacement recommended (Crossed {vehicle.tyre_replacement_threshold || '40,000'}km limit).</p>
            </div>
          )}
          {vehicle.is_depot_overdue && (
            <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">Vehicle is overdue for depot return (out for &gt; 7 days).</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Document Panel (BR13) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Compliance Documents
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Insurance', date: vehicle.insurance_expiry, st: insStatus },
              { label: 'Fitness Certificate', date: vehicle.fitness_expiry, st: fitStatus },
              { label: 'Permit', date: vehicle.permit_expiry, st: permStatus },
            ].map((doc, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{doc.label}</p>
                  <p className="text-xs text-slate-500">{doc.date || 'Not specified'}</p>
                </div>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${doc.st.color}`}>
                  {doc.st.status} {doc.st.days !== undefined ? `(${doc.st.days}d)` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Expense Rollup (Task 5) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Expense Breakdown
          </h2>
          {vehicle.category_expense_totals ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Lifetime Cost</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">₹{vehicle.category_expense_totals.total.toLocaleString()}</span>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Fuel', val: vehicle.category_expense_totals.fuel, color: 'bg-blue-500' },
                  { label: 'Maintenance', val: vehicle.category_expense_totals.maintenance, color: 'bg-amber-500' },
                  { label: 'Toll', val: vehicle.category_expense_totals.toll, color: 'bg-emerald-500' },
                  { label: 'Misc/Other', val: vehicle.category_expense_totals.misc + vehicle.category_expense_totals.other, color: 'bg-purple-500' },
                ].map((item, idx) => {
                  const pct = vehicle.category_expense_totals!.total > 0 ? (item.val / vehicle.category_expense_totals!.total) * 100 : 0;
                  return (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 w-32">
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        <span className="text-slate-600 dark:text-slate-300">{item.label}</span>
                      </div>
                      <div className="flex-1 mx-4 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color}`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="w-20 text-right font-medium text-slate-900 dark:text-white">
                        ₹{item.val.toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">No expense data available.</div>
          )}
        </div>
      </div>
    </div>
  );
}
