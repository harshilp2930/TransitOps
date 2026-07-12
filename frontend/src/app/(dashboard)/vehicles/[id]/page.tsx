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
    [key: string]: string | number;
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
              <p className="text-sm font-medium">Tyre replacement recommended (Driven &gt; 40,000km since last change).</p>
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
    </div>
  );
}
