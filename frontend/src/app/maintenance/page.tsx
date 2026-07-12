"use client";

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function MaintenanceList() {
  const { user, loading } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setIsLoading(true);
      try {
        const res = await api.get('/maintenance/');
        setRecords(res.data);
      } catch (e) {
        console.error('Failed to load maintenance', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [user]);

  if (loading || isLoading) return <div className="p-8">Loading maintenance records...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Maintenance</h2>
        <Link href="/maintenance/new" className="text-sm text-blue-600">Log Maintenance</Link>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900">
            <tr>
              <th className="text-left px-4 py-3">Vehicle</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">Cost</th>
              <th className="text-left px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id} className="border-t border-slate-100 dark:border-slate-700">
                <td className="px-4 py-3">{r.vehicle?.registration_number || '—'}</td>
                <td className="px-4 py-3">{r.type}</td>
                <td className="px-4 py-3">{r.cost}</td>
                <td className="px-4 py-3">{r.performed_at?.slice(0,10) || r.created_at?.slice(0,10)}</td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">No maintenance records.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
