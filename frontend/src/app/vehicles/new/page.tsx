"use client";

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function NewVehiclePage() {
  const [registration, setRegistration] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('Truck');
  const [odometer, setOdometer] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.post('/vehicles/', {
        registration_number: registration,
        name_model: name,
        type,
        odometer_km: odometer,
      });
      router.push('/vehicles');
    } catch (err) {
      console.error('Failed to create vehicle', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Add Vehicle</h2>
      <form onSubmit={handleCreate} className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
        <div>
          <label className="block text-sm font-medium mb-1">Registration Number</label>
          <input value={registration} onChange={(e) => setRegistration(e.target.value)} required className="w-full px-3 py-2 rounded border" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Model Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 rounded border" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2 rounded border">
              <option>Truck</option>
              <option>Van</option>
              <option>Bus</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Odometer (km)</label>
            <input type="number" value={odometer} onChange={(e) => setOdometer(Number(e.target.value))} className="w-full px-3 py-2 rounded border" />
          </div>
        </div>

        <div>
          <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded">
            {isSaving ? 'Saving...' : 'Create Vehicle'}
          </button>
        </div>
      </form>
    </div>
  );
}
