"use client";

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function NewMaintenance() {
  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [type, setType] = useState('Repair');
  const [cost, setCost] = useState(0);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/vehicles/');
        setVehicles(res.data);
      } catch (e) {
        console.error('Failed to load vehicles', e);
      }
    };
    fetch();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.post('/maintenance/', { vehicle_id: vehicleId, type, cost });
      router.push('/maintenance');
    } catch (err) {
      console.error('Failed to log maintenance', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Log Maintenance</h2>
      <form onSubmit={handleCreate} className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
        <div>
          <label className="block text-sm font-medium mb-1">Vehicle</label>
          <select value={vehicleId ?? ''} onChange={(e) => setVehicleId(e.target.value ? Number(e.target.value) : null)} className="w-full px-3 py-2 rounded border">
            <option value="">-- Select Vehicle --</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <input value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2 rounded border" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Cost</label>
          <input type="number" value={cost} onChange={(e) => setCost(Number(e.target.value))} className="w-full px-3 py-2 rounded border" />
        </div>
        <div>
          <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded">{isSaving ? 'Saving...' : 'Log'}</button>
        </div>
      </form>
    </div>
  );
}
