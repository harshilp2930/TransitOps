'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Play, CheckCircle, XCircle, Clock, Truck, User as UserIcon, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Trip {
  id: number;
  trip_code: string;
  source: string;
  destination: string;
  vehicle_details: { registration_number: string; name_model: string };
  driver_details: { name: string; contact_number: string };
  status: string;
  cargo_weight_kg: string;
  revenue: string;
}

interface BoardData {
  draft: Trip[];
  dispatched: Trip[];
  completed: Trip[];
  cancelled: Trip[];
}

interface Vehicle { id: number; registration_number: string; status: string; max_load_capacity_kg: string }
interface Driver { id: number; name: string; status: string }

export default function TripsPage() {
  const [board, setBoard] = useState<BoardData>({ draft: [], dispatched: [], completed: [], cancelled: [] });
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [formData, setFormData] = useState({
    source: '',
    destination: '',
    vehicle_id: '',
    driver_id: '',
    cargo_weight_kg: '',
    planned_distance_km: '',
    revenue: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  const { hasRole } = useAuth();
  const canDispatch = hasRole(['Dispatcher']);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const [boardRes, vehRes, drvRes] = await Promise.all([
        api.get('/trips/board/'),
        api.get('/vehicles/'),
        api.get('/drivers/')
      ]);
      setBoard(boardRes.data);
      setVehicles(vehRes.data.results || vehRes.data);
      setDrivers(drvRes.data.results || drvRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      api.get('/trips/board/').then(res => setBoard(res.data)).catch(console.error);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');
    try {
      await api.post('/trips/', {
        ...formData,
        status: 'Draft',
        load_type: 'Full',
        freight_type: 'General',
        vehicle: formData.vehicle_id ? parseInt(formData.vehicle_id) : null,
        driver: formData.driver_id ? parseInt(formData.driver_id) : null,
        cargo_weight_kg: parseInt(formData.cargo_weight_kg),
        planned_distance_km: parseFloat(formData.planned_distance_km),
        revenue: parseFloat(formData.revenue)
      });
      setFormData({ source: '', destination: '', vehicle_id: '', driver_id: '', cargo_weight_kg: '', planned_distance_km: '', revenue: '' });
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.non_field_errors?.[0] || err.response?.data?.detail || 'Failed to create trip');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAction = async (id: number, action: 'dispatch' | 'complete' | 'cancel') => {
    if (!window.confirm(`Are you sure you want to ${action} this trip?`)) return;
    setActionLoading(id);
    try {
      let payload = {};
      if (action === 'complete') {
        payload = { final_odometer_km: 1000, fuel_consumed_l: 20, fuel_cost: 2500 };
      }
      await api.post(`/trips/${id}/${action}/`, payload);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || err.response?.data?.error || `Failed to ${action} trip`);
    } finally {
      setActionLoading(null);
    }
  };

  const renderTripCard = (trip: Trip, col: string) => (
    <div key={trip.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded">
          {trip.trip_code}
        </span>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">₹{parseFloat(trip.revenue).toLocaleString()}</span>
      </div>
      <div className="mb-3">
        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{trip.source} → {trip.destination}</p>
        <p className="text-xs text-slate-500 mt-0.5">{trip.cargo_weight_kg} kg</p>
      </div>
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center text-xs text-slate-600 dark:text-slate-300">
          <Truck className="w-3.5 h-3.5 mr-2 text-slate-400 dark:text-slate-500" />
          {trip.vehicle_details?.registration_number || 'Unassigned'}
        </div>
        <div className="flex items-center text-xs text-slate-600 dark:text-slate-300">
          <UserIcon className="w-3.5 h-3.5 mr-2 text-slate-400 dark:text-slate-500" />
          {trip.driver_details?.name || 'Unassigned'}
        </div>
      </div>
      {canDispatch && col === 'draft' && (
        <button onClick={() => handleAction(trip.id, 'dispatch')} disabled={actionLoading === trip.id} className="w-full py-1.5 bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white rounded text-xs font-medium transition-colors flex justify-center items-center">
          {actionLoading === trip.id ? 'Processing...' : <><Play className="w-3 h-3 mr-1" /> Dispatch</>}
        </button>
      )}
      {canDispatch && col === 'dispatched' && (
        <div className="flex gap-2">
          <button onClick={() => handleAction(trip.id, 'complete')} disabled={actionLoading === trip.id} className="flex-1 py-1.5 bg-green-50 dark:bg-green-600/20 text-green-600 dark:text-green-400 hover:bg-green-600 hover:text-white rounded text-xs font-medium transition-colors flex justify-center items-center">
            {actionLoading === trip.id ? '...' : <><CheckCircle className="w-3 h-3 mr-1" /> Complete</>}
          </button>
          <button onClick={() => handleAction(trip.id, 'cancel')} disabled={actionLoading === trip.id} className="flex-1 py-1.5 bg-red-50 dark:bg-red-600/20 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white rounded text-xs font-medium transition-colors flex justify-center items-center">
            {actionLoading === trip.id ? '...' : <><XCircle className="w-3 h-3 mr-1" /> Cancel</>}
          </button>
        </div>
      )}
    </div>
  );

  const availableVehicles = vehicles.filter(v => v.status === 'Available');
  const availableDrivers = drivers.filter(d => d.status === 'Available');

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Trip Dispatcher</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Create and manage trip lifecycles</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
        {/* Create Trip Form Sidebar (matches Excalidraw) */}
        {canDispatch && (
          <div className="w-full lg:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col h-full shrink-0">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-t-xl">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
                <Plus className="w-4 h-4 mr-2 text-blue-500" /> Create Trip
              </h3>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <form onSubmit={handleCreateTrip} className="space-y-4">
                {error && <div className="text-red-500 text-xs bg-red-50 dark:bg-red-500/10 p-2 rounded">{error}</div>}
                
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Source</label>
                  <input required value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} type="text" placeholder="e.g. Gandhinagar Depot" className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Destination</label>
                  <input required value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})} type="text" placeholder="e.g. Ahmedabad Hub" className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Vehicle (Available Only)</label>
                  <select value={formData.vehicle_id} onChange={e => setFormData({...formData, vehicle_id: e.target.value})} className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white">
                    <option value="">Select a vehicle (optional)</option>
                    {availableVehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.registration_number} - {v.max_load_capacity_kg}kg</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Driver (Available Only)</label>
                  <select value={formData.driver_id} onChange={e => setFormData({...formData, driver_id: e.target.value})} className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white">
                    <option value="">Select a driver (optional)</option>
                    {availableDrivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Cargo (kg)</label>
                    <input required value={formData.cargo_weight_kg} onChange={e => setFormData({...formData, cargo_weight_kg: e.target.value})} type="number" className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Distance (km)</label>
                    <input required value={formData.planned_distance_km} onChange={e => setFormData({...formData, planned_distance_km: e.target.value})} type="number" step="0.1" className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Expected Revenue (₹)</label>
                  <input required value={formData.revenue} onChange={e => setFormData({...formData, revenue: e.target.value})} type="number" className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" />
                </div>

                <button type="submit" disabled={submitLoading} className="w-full py-2 mt-4 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                  {submitLoading ? 'Creating...' : 'Create Trip as Draft'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Live Board Kanban Area */}
        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col min-w-0">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-t-xl">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
              <Play className="w-4 h-4 mr-2 text-blue-500" /> Live Board
            </h3>
          </div>
          <div className="p-4 flex-1 flex gap-4 overflow-x-auto">
            {/* Draft */}
            <div className="w-72 shrink-0 flex flex-col bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-lg">
              <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex justify-between">
                <span className="font-medium text-sm text-slate-700 dark:text-slate-300">Draft</span>
                <span className="bg-slate-200 dark:bg-slate-700 text-xs px-2 rounded-full flex items-center">{board.draft.length}</span>
              </div>
              <div className="p-3 flex-1 overflow-y-auto space-y-3">
                {board.draft.map(t => renderTripCard(t, 'draft'))}
              </div>
            </div>
            {/* Dispatched */}
            <div className="w-72 shrink-0 flex flex-col bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50 rounded-lg">
              <div className="p-3 border-b border-blue-100 dark:border-blue-800/50 flex justify-between">
                <span className="font-medium text-sm text-blue-700 dark:text-blue-400">Dispatched</span>
                <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs px-2 rounded-full flex items-center">{board.dispatched.length}</span>
              </div>
              <div className="p-3 flex-1 overflow-y-auto space-y-3">
                {board.dispatched.map(t => renderTripCard(t, 'dispatched'))}
              </div>
            </div>
            {/* Completed */}
            <div className="w-72 shrink-0 flex flex-col bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/50 rounded-lg">
              <div className="p-3 border-b border-green-100 dark:border-green-800/50 flex justify-between">
                <span className="font-medium text-sm text-green-700 dark:text-green-400">Completed</span>
                <span className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs px-2 rounded-full flex items-center">{board.completed.length}</span>
              </div>
              <div className="p-3 flex-1 overflow-y-auto space-y-3">
                {board.completed.map(t => renderTripCard(t, 'completed'))}
              </div>
            </div>
            {/* Cancelled */}
            <div className="w-72 shrink-0 flex flex-col bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-lg">
              <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex justify-between">
                <span className="font-medium text-sm text-slate-500 dark:text-slate-400">Cancelled</span>
                <span className="bg-slate-200 dark:bg-slate-700 text-slate-500 text-xs px-2 rounded-full flex items-center">{board.cancelled.length}</span>
              </div>
              <div className="p-3 flex-1 overflow-y-auto space-y-3">
                {board.cancelled.map(t => renderTripCard(t, 'cancelled'))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
