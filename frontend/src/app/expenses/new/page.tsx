"use client";

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function NewExpense() {
  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [category, setCategory] = useState('Misc');
  const [amount, setAmount] = useState(0);
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
      await api.post('/expenses/', { vehicle_id: vehicleId, category, amount });
      router.push('/expenses');
    } catch (err) {
      console.error('Failed to add expense', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Add Expense</h2>
      <form onSubmit={handleCreate} className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
        <div>
          <label className="block text-sm font-medium mb-1">Vehicle</label>
          <select value={vehicleId ?? ''} onChange={(e) => setVehicleId(e.target.value ? Number(e.target.value) : null)} className="w-full px-3 py-2 rounded border">
            <option value="">-- Select Vehicle --</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 rounded border" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Amount</label>
          <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full px-3 py-2 rounded border" />
        </div>
        <div>
          <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded">{isSaving ? 'Saving...' : 'Add'}</button>
        </div>
      </form>
    </div>
  );
}
