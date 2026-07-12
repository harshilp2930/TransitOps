"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function VehicleDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { user, loading } = useAuth();
  const [vehicle, setVehicle] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/vehicles/${id}/`);
        setVehicle(res.data);
      } catch (e) {
        console.error('Failed to load vehicle', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [id, user]);

  if (loading || isLoading) return <div className="p-8">Loading...</div>;
  if (!vehicle) return <div className="p-8">Vehicle not found.</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">{vehicle.registration_number}</h2>
          <p className="text-sm text-slate-500">{vehicle.name_model}</p>
        </div>
        <div className="space-x-2">
          <button onClick={() => router.push(`/vehicles/${id}/edit`)} className="px-3 py-2 bg-blue-600 text-white rounded">Edit</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
          <h3 className="font-medium mb-2">Details</h3>
          <dl className="text-sm text-slate-700 dark:text-slate-200">
            <dt className="font-medium">Type</dt>
            <dd className="mb-2">{vehicle.type}</dd>
            <dt className="font-medium">Status</dt>
            <dd className="mb-2">{vehicle.status}</dd>
            <dt className="font-medium">Odometer (km)</dt>
            <dd className="mb-2">{vehicle.odometer_km}</dd>
            <dt className="font-medium">Acquisition Cost</dt>
            <dd className="mb-2">{vehicle.acquisition_cost}</dd>
          </dl>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
          <h3 className="font-medium mb-2">Documents</h3>
          {vehicle.documents && vehicle.documents.length > 0 ? (
            <ul className="text-sm text-slate-700 dark:text-slate-200 space-y-2">
              {vehicle.documents.map((d: any) => (
                <li key={d.id} className="flex justify-between">
                  <div>
                    <div className="font-medium">{d.doc_type}</div>
                    <div className="text-xs text-slate-500">Expires: {d.expiry_date || '—'}</div>
                  </div>
                  <div className="text-xs text-slate-400">{d.expiry_status}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-slate-500">No documents attached.</div>
          )}
        </div>
      </div>
    </div>
  );
}
