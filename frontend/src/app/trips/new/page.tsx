"use client";

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function NewTripPage() {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [planned_distance_km, setPlannedDistance] = useState(0);
  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [driverId, setDriverId] = useState<number | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetch = async () => {
      try {
        const v = await api.get('/vehicles/available/');
        setVehicles(v.data);
        const d = await api.get('/drivers/');
        setDrivers(d.data);
      } catch (e) {
        console.error('Failed to load choices', e);
      }
    };
    fetch();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.post('/trips/', {
        source,
        destination,
        planned_distance_km,
        vehicle_id: vehicleId,
        driver_id: driverId,
      });
      router.push('/trips');
    } catch (err) {
      console.error('Failed to create trip', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Create Trip</h2>
      <form onSubmit={handleCreate} className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
        <div>
          <label className="block text-sm font-medium mb-1">Source</label>
          <input value={source} onChange={(e) => setSource(e.target.value)} required className="w-full px-3 py-2 rounded border" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Destination</label>
          <input value={destination} onChange={(e) => setDestination(e.target.value)} required className="w-full px-3 py-2 rounded border" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Planned Distance (km)</label>
          <input type="number" value={planned_distance_km} onChange={(e) => setPlannedDistance(Number(e.target.value))} className="w-full px-3 py-2 rounded border" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Vehicle</label>
            <select value={vehicleId ?? ''} onChange={(e) => setVehicleId(e.target.value ? Number(e.target.value) : null)} className="w-full px-3 py-2 rounded border">
              <option value="">-- Unassigned --</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.registration_number} - {v.name_model}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Driver</label>
            <select value={driverId ?? ''} onChange={(e) => setDriverId(e.target.value ? Number(e.target.value) : null)} className="w-full px-3 py-2 rounded border">
              <option value="">-- Unassigned --</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded">
            {isSaving ? 'Saving...' : 'Create Trip'}
          </button>
        </div>
      </form>
    </div>
  );
}
