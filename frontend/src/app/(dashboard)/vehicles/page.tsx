'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Plus, Search, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type ApiError = {
  response?: {
    data?: {
      registration_number?: string[];
      detail?: string;
    };
  };
};

interface Vehicle {
  id: number;
  registration_number: string;
  name_model: string;
  type: string;
  max_load_capacity_kg: string;
  odometer_km: string;
  acquisition_cost: string;
  status: string;
  region: string;
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createError, setCreateError] = useState('');
  const [form, setForm] = useState({
    registration_number: '',
    name_model: '',
    type: 'Van',
    max_load_capacity_kg: '0',
    odometer_km: '0',
    acquisition_cost: '0',
    status: 'Available',
    region: '',
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { hasRole } = useAuth();
  const canEdit = hasRole(['Fleet Manager']);

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/vehicles/');
      if (res.data.results) {
        setVehicles(res.data.results);
      } else {
        setVehicles(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchVehicles();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    try {
      await api.post('/vehicles/', form);
      setForm({
        registration_number: '',
        name_model: '',
        type: 'Van',
        max_load_capacity_kg: '0',
        odometer_km: '0',
        acquisition_cost: '0',
        status: 'Available',
        region: '',
      });
      setShowCreate(false);
      await fetchVehicles();
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setCreateError(apiErr.response?.data?.registration_number?.[0] || apiErr.response?.data?.detail || 'Failed to create vehicle.');
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Available': return 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20';
      case 'On Trip': return 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20';
      case 'In Shop': return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20';
      case 'Retired': return 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20';
      default: return 'bg-slate-50 dark:bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-500/20';
    }
  };

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.registration_number.toLowerCase().includes(search.toLowerCase()) || 
                          v.name_model.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? v.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Vehicle Registry</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your fleet inventory and statuses</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowCreate((prev) => !prev)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Vehicle
          </button>
        )}
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm dark:shadow-lg space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Register Vehicle</h3>
          {createError && <p className="text-sm text-red-600 dark:text-red-400">{createError}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Registration Number" value={form.registration_number} onChange={(e) => setForm((prev) => ({ ...prev, registration_number: e.target.value }))} required className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900" />
            <input type="text" placeholder="Name / Model" value={form.name_model} onChange={(e) => setForm((prev) => ({ ...prev, name_model: e.target.value }))} required className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900" />
            <select value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))} className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900">
              <option value="Van">Van</option>
              <option value="Truck">Truck</option>
              <option value="Mini">Mini</option>
              <option value="Bus">Bus</option>
              <option value="Other">Other</option>
            </select>
            <input type="number" min="0" step="0.01" placeholder="Max Load Capacity (kg)" value={form.max_load_capacity_kg} onChange={(e) => setForm((prev) => ({ ...prev, max_load_capacity_kg: e.target.value }))} required className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900" />
            <input type="number" min="0" step="0.01" placeholder="Odometer (km)" value={form.odometer_km} onChange={(e) => setForm((prev) => ({ ...prev, odometer_km: e.target.value }))} required className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900" />
            <input type="number" min="0" step="0.01" placeholder="Acquisition Cost" value={form.acquisition_cost} onChange={(e) => setForm((prev) => ({ ...prev, acquisition_cost: e.target.value }))} required className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900" />
            <input type="text" placeholder="Region" value={form.region} onChange={(e) => setForm((prev) => ({ ...prev, region: e.target.value }))} className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900" />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg">Create</button>
            <button type="button" onClick={() => setShowCreate(false)} className="bg-slate-200 dark:bg-slate-700 px-4 py-2 rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm dark:shadow-xl">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 bg-slate-50 dark:bg-slate-800/30">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by Registration or Model..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="relative w-full sm:w-48">
            <Filter className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none"
            >
              <option value="">All Statuses</option>
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="In Shop">In Shop</option>
              <option value="Retired">Retired</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
               <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4">Reg. Number</th>
                  <th className="px-6 py-4">Model & Type</th>
                  <th className="px-6 py-4">Capacity (kg)</th>
                  <th className="px-6 py-4">Region</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                {filteredVehicles.length > 0 ? (
                  filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{vehicle.registration_number}</td>
                      <td className="px-6 py-4">
                        {vehicle.name_model}
                        <span className="block text-xs text-slate-500">{vehicle.type}</span>
                      </td>
                      <td className="px-6 py-4">{vehicle.max_load_capacity_kg}</td>
                      <td className="px-6 py-4">{vehicle.region || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full border text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                          {vehicle.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No vehicles found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
