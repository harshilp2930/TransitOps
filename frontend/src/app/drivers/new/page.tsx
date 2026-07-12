"use client";

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function NewDriverPage() {
  const [name, setName] = useState('');
  const [license, setLicense] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.post('/drivers/', { name, license_number: license });
      router.push('/drivers');
    } catch (err) {
      console.error('Failed to create driver', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Add Driver</h2>
      <form onSubmit={handleCreate} className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 rounded border" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">License Number</label>
          <input value={license} onChange={(e) => setLicense(e.target.value)} required className="w-full px-3 py-2 rounded border" />
        </div>
        <div>
          <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded">
            {isSaving ? 'Saving...' : 'Create Driver'}
          </button>
        </div>
      </form>
    </div>
  );
}
