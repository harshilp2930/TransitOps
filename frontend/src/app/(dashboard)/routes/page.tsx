'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Navigation, Plus, Edit2, Trash2, Search, Route as RouteIcon, X, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';

interface Route {
  id: number;
  source: string;
  destination: string;
  standard_distance_km: string;
  standard_driver_allowance: string;
  estimated_tolls: string;
  estimated_fuel_cost: string;
  notes: string;
  is_active: boolean;
}

const emptyRoute = {
  source: '',
  destination: '',
  standard_distance_km: '0',
  standard_driver_allowance: '0',
  estimated_tolls: '0',
  estimated_fuel_cost: '0',
  notes: '',
  is_active: true,
};

export default function RoutesPage() {
  const { hasRole } = useAuth();
  const canEdit = hasRole(['Fleet Manager']);

  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const [showForm, setShowForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [formData, setFormData] = useState(emptyRoute);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchRoutes = async () => {
    try {
      const res = await api.get('/routes/');
      setRoutes(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoutes(); }, []);

  const filteredRoutes = routes.filter(r =>
    r.source.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    r.destination.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const openCreate = () => {
    setEditingRoute(null);
    setFormData(emptyRoute);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (route: Route) => {
    setEditingRoute(route);
    setFormData({
      source: route.source,
      destination: route.destination,
      standard_distance_km: route.standard_distance_km,
      standard_driver_allowance: route.standard_driver_allowance,
      estimated_tolls: route.estimated_tolls,
      estimated_fuel_cost: route.estimated_fuel_cost,
      notes: route.notes,
      is_active: route.is_active,
    });
    setFormError('');
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this route?')) return;
    try {
      await api.delete(`/routes/${id}/`);
      await fetchRoutes();
    } catch {
      alert('Failed to delete route.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        ...formData,
        standard_distance_km: Number(formData.standard_distance_km),
        standard_driver_allowance: Number(formData.standard_driver_allowance),
        estimated_tolls: Number(formData.estimated_tolls),
        estimated_fuel_cost: Number(formData.estimated_fuel_cost),
      };
      if (editingRoute) {
        await api.patch(`/routes/${editingRoute.id}/`, payload);
      } else {
        await api.post('/routes/', payload);
      }
      await fetchRoutes();
      setShowForm(false);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string; source?: string[] } } };
      setFormError(apiErr.response?.data?.detail || apiErr.response?.data?.source?.[0] || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const f = (val: string | number) => Number(val).toLocaleString('en-IN', { minimumFractionDigits: 0 });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Navigation className="w-6 h-6 text-blue-500" />
            Route Master
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Manage standard routes with pre-configured distances, tolls, and allowances for auto-filling trips.
          </p>
        </div>
        {canEdit && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20 text-sm shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Route
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by source or destination..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:w-80 pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-colors"
        />
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {editingRoute ? 'Edit Route' : 'Add New Route'}
            </h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {formError && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 p-3 rounded-lg border border-red-200 dark:border-transparent">
              {formError}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Source City *</label>
              <input required value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })}
                placeholder="e.g. Mumbai" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Destination City *</label>
              <input required value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value })}
                placeholder="e.g. Delhi" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Distance (km)</label>
              <input type="number" min="0" step="0.1" value={formData.standard_distance_km} onChange={e => setFormData({ ...formData, standard_distance_km: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Estimated Tolls (₹)</label>
              <input type="number" min="0" step="0.01" value={formData.estimated_tolls} onChange={e => setFormData({ ...formData, estimated_tolls: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Driver Allowance / Batta (₹)</label>
              <input type="number" min="0" step="0.01" value={formData.standard_driver_allowance} onChange={e => setFormData({ ...formData, standard_driver_allowance: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Est. Fuel Cost (₹)</label>
              <input type="number" min="0" step="0.01" value={formData.estimated_fuel_cost} onChange={e => setFormData({ ...formData, estimated_fuel_cost: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes</label>
              <input type="text" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any special notes about this route"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="flex gap-3 pt-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : editingRoute ? 'Update Route' : 'Create Route'}
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-4">Route</th>
                <th className="px-5 py-4 text-right">Distance</th>
                <th className="px-5 py-4 text-right">Tolls (₹)</th>
                <th className="px-5 py-4 text-right">Driver Batta (₹)</th>
                <th className="px-5 py-4 text-right">Est. Fuel (₹)</th>
                <th className="px-5 py-4 text-right">Total Est. Cost (₹)</th>
                <th className="px-5 py-4">Notes</th>
                {canEdit && <th className="px-5 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
              {filteredRoutes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <RouteIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <div className="font-medium">No routes found</div>
                    <div className="text-xs mt-1">{canEdit ? 'Click "Add Route" to create your first route master.' : 'No routes configured yet.'}</div>
                  </td>
                </tr>
              ) : filteredRoutes.map(route => {
                const totalCost = Number(route.estimated_tolls) + Number(route.standard_driver_allowance) + Number(route.estimated_fuel_cost);
                return (
                  <tr key={route.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-100 dark:bg-blue-500/10 rounded-full flex items-center justify-center">
                          <Navigation className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">{route.source} → {route.destination}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-400 font-mono">{f(route.standard_distance_km)} km</td>
                    <td className="px-5 py-3 text-right">₹{f(route.estimated_tolls)}</td>
                    <td className="px-5 py-3 text-right">₹{f(route.standard_driver_allowance)}</td>
                    <td className="px-5 py-3 text-right">₹{f(route.estimated_fuel_cost)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-amber-600 dark:text-amber-400">₹{f(totalCost)}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400 text-xs max-w-xs truncate">{route.notes || '—'}</td>
                    {canEdit && (
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(route)} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(route.id)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredRoutes.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-500">
              {filteredRoutes.length} route{filteredRoutes.length !== 1 ? 's' : ''} configured
            </div>
          )}
        </div>
      )}
    </div>
  );
}
