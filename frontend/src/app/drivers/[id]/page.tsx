"use client";

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { parseISO, differenceInCalendarDays, format } from 'date-fns';

export default function DriverDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { user, loading } = useAuth();
  const [driver, setDriver] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/drivers/${id}/`);
        setDriver(res.data);
      } catch (e) {
        console.error('Failed to load driver', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [id, user]);

  if (loading || isLoading) return <div className="p-8">Loading...</div>;
  if (!driver) return <div className="p-8">Driver not found.</div>;

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">{driver.name}</h2>
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
        <p><strong>License:</strong> {driver.license_number}</p>
        <p><strong>Expiry:</strong> {driver.license_expiry_date ? format(parseISO(driver.license_expiry_date), 'yyyy-MM-dd') : '—'}</p>
        <p><strong>Expiry in:</strong> {driver.license_expiry_date ? `${differenceInCalendarDays(parseISO(driver.license_expiry_date), new Date())} days` : '—'}</p>
        <p><strong>Status:</strong> {driver.status}</p>

        {hasRole(['Fleet Manager','Safety Officer']) && (
          <div className="mt-4">
            {driver.status !== 'Suspended' ? (
              <button className="px-3 py-2 bg-red-600 text-white rounded" onClick={async () => {
                try {
                  await api.patch(`/drivers/${id}/`, { status: 'Suspended' });
                  setDriver({ ...driver, status: 'Suspended' });
                } catch (e) { console.error(e); }
              }}>Suspend</button>
            ) : (
              <button className="px-3 py-2 bg-green-600 text-white rounded" onClick={async () => {
                try {
                  await api.patch(`/drivers/${id}/`, { status: 'Available' });
                  setDriver({ ...driver, status: 'Available' });
                } catch (e) { console.error(e); }
              }}>Reinstate</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
