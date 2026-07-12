"use client";

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

type Trip = any;

export default function TripsBoard() {
  const { user, loading } = useAuth();
  const [board, setBoard] = useState<Record<string, Trip[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchBoard = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/trips/board/');
      setBoard(res.data);
    } catch (e) {
      console.error('Failed to load board', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchBoard();
  }, [user]);

  const doAction = async (id: number, action: 'dispatch' | 'complete' | 'cancel') => {
    if (action === 'complete') {
      const odo = window.prompt('Final odometer (km):');
      const fuel = window.prompt('Fuel consumed (litres):');
      if (!odo || !fuel) return;
      try {
        await api.post(`/trips/${id}/complete/`, { final_odometer_km: Number(odo), fuel_consumed_l: Number(fuel) });
        fetchBoard();
      } catch (e) {
        alert('Action failed: ' + (e as any)?.response?.data?.detail || e);
      }
      return;
    }

    try {
      await api.post(`/trips/${id}/${action}/`);
      fetchBoard();
    } catch (e) {
      alert('Action failed: ' + (e as any)?.response?.data?.detail || e);
    }
  };

  if (loading || isLoading) return <div className="p-8">Loading trips...</div>;

  const columns = [
    { key: 'draft', title: 'Draft' },
    { key: 'dispatched', title: 'Dispatched' },
    { key: 'completed', title: 'Completed' },
    { key: 'cancelled', title: 'Cancelled' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Live Board</h2>
        <Link href="/trips/new" className="text-sm text-blue-600">Create Trip</Link>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {columns.map((col) => (
          <div key={col.key} className="bg-white dark:bg-slate-800 p-3 rounded shadow-sm">
            <h3 className="font-semibold mb-3">{col.title} ({(board[col.key]||[]).length})</h3>
            <div className="space-y-2">
              {(board[col.key] || []).map((t: Trip) => (
                <div key={t.id} className="p-2 border border-slate-100 dark:border-slate-700 rounded">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium"><Link href={`/trips/${t.id}`} className="text-blue-600">{t.trip_code || `#${t.id}`}</Link></div>
                      <div className="text-xs text-slate-500">{t.source} → {t.destination}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs">{t.vehicle?.registration_number || '—'}</div>
                      <div className="text-xs text-slate-500">{t.driver?.name || 'Unassigned'}</div>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    {col.key === 'draft' && (
                      <button onClick={() => doAction(t.id, 'dispatch')} className="px-2 py-1 bg-green-600 text-white rounded text-sm">Dispatch</button>
                    )}
                    {col.key === 'dispatched' && (
                      <>
                        <button onClick={() => doAction(t.id, 'complete')} className="px-2 py-1 bg-blue-600 text-white rounded text-sm">Complete</button>
                        <button onClick={() => doAction(t.id, 'cancel')} className="px-2 py-1 bg-red-600 text-white rounded text-sm">Cancel</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
