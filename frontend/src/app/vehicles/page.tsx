"use client";

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface Vehicle {
  id: number;
  registration_number: string;
  name_model: string;
  status: string;
  type: string;
  odometer_km: number;
}

export default function VehiclesPage() {
  const { user, loading } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchVehicles = async () => {
      setIsLoading(true);
      try {
        const res = await api.get('/vehicles/');
        setVehicles(res.data);
      } catch (e) {
        console.error('Failed to load vehicles', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVehicles();
  }, [user]);

  if (loading || isLoading) {
    return <div className="p-8">Loading vehicles...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Vehicles</h2>
        <Link href="/vehicles/new" className="text-sm text-blue-600">Add Vehicle</Link>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900">
            <tr>
              <th className="text-left px-4 py-3">Registration</th>
              <th className="text-left px-4 py-3">Model</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">Odometer (km)</th>
              <th className="text-left px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id} className="border-t border-slate-100 dark:border-slate-700">
                <td className="px-4 py-3">
                  <Link href={`/vehicles/${v.id}`} className="text-blue-600">{v.registration_number}</Link>
                </td>
                <td className="px-4 py-3">{v.name_model}</td>
                <td className="px-4 py-3">{v.type}</td>
                <td className="px-4 py-3">{v.odometer_km}</td>
                <td className="px-4 py-3">{v.status}</td>
              </tr>
            ))}
            {vehicles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">No vehicles found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
