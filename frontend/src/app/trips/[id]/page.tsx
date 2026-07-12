"use client";

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function TripDetail({ params }: { params: { id: string } }) {
  const { id } = params;
  const { user, loading } = useAuth();
  const [trip, setTrip] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetch = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/trips/${id}/`);
      setTrip(res.data);
    } catch (e) {
      console.error('Failed to load trip', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetch();
  }, [user]);

  const doAction = async (action: 'dispatch' | 'complete' | 'cancel') => {
    if (action === 'complete') {
      const odo = window.prompt('Final odometer (km):');
      const fuel = window.prompt('Fuel consumed (litres):');
      if (!odo || !fuel) return;
      try {
        await api.post(`/trips/${id}/complete/`, { final_odometer_km: Number(odo), fuel_consumed_l: Number(fuel) });
        fetch();
      } catch (e) {
        alert('Failed: ' + (e as any)?.response?.data?.detail || e);
      }
      return;
    }
    try {
      await api.post(`/trips/${id}/${action}/`);
      fetch();
    } catch (e) {
      alert('Failed: ' + (e as any)?.response?.data?.detail || e);
    }
  };

  if (loading || isLoading) return <div className="p-8">Loading trip...</div>;
  if (!trip) return <div className="p-8">Trip not found.</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">{trip.trip_code || `#${trip.id}`}</h2>
          <p className="text-sm text-slate-500">{trip.source} → {trip.destination}</p>
        </div>
        <div className="space-x-2">
          {trip.status === 'Draft' && <button onClick={() => doAction('dispatch')} className="px-3 py-2 bg-green-600 text-white rounded">Dispatch</button>}
          {trip.status === 'Dispatched' && (
            <>
              <button onClick={() => doAction('complete')} className="px-3 py-2 bg-blue-600 text-white rounded">Complete</button>
              <button onClick={() => doAction('cancel')} className="px-3 py-2 bg-red-600 text-white rounded">Cancel</button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
        <p><strong>Vehicle:</strong> {trip.vehicle?.registration_number || '—'}</p>
        <p><strong>Driver:</strong> {trip.driver?.name || '—'}</p>
        <p><strong>Status:</strong> {trip.status}</p>
        <p><strong>Planned Distance:</strong> {trip.planned_distance_km}</p>
      </div>
    </div>
  );
}
