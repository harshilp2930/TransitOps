"use client";

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function DriversPage() {
  const { user, loading } = useAuth();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setIsLoading(true);
      try {
        const res = await api.get('/drivers/');
        setDrivers(res.data);
      } catch (e) {
        console.error('Failed to load drivers', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [user]);

  if (loading || isLoading) return <div className="p-8">Loading drivers...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Drivers</h2>
        <Link href="/drivers/new" className="text-sm text-blue-600">Add Driver</Link>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">License No.</th>
              <th className="text-left px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d.id} className="border-t border-slate-100 dark:border-slate-700">
                <td className="px-4 py-3">
                  <Link href={`/drivers/${d.id}`} className="text-blue-600">{d.name}</Link>
                </td>
                <td className="px-4 py-3">{d.license_number}</td>
                <td className="px-4 py-3">{d.status}</td>
              </tr>
            ))}
            {drivers.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-500">No drivers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
