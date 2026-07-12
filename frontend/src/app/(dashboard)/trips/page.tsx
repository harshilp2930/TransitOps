'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Play, CheckCircle, XCircle, Truck, User as UserIcon, Plus, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type ApiError = {
  response?: {
    data?: {
      detail?: string;
    };
  };
};

interface Trip {
  id: number;
  trip_code: string;
  source: string;
  destination: string;
  vehicle_reg?: string;
  driver_name?: string;
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



interface DriverOption {
  id: number;
  name: string;
  license_number: string;
}

export default function LiveBoardPage() {
  const [board, setBoard] = useState<BoardData>({ draft: [], dispatched: [], completed: [], cancelled: [] });
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [loading, setLoading] = useState(true);

  const { hasRole } = useAuth();
  const canDispatch = hasRole(['Dispatcher']);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createError, setCreateError] = useState('');
  const [form, setForm] = useState({
    source: '',
    destination: '',
    vehicle: '',
    driver: '',
    cargo_weight_kg: '0',
    planned_distance_km: '0',
    revenue: '0',
    load_type: '',
    freight_type: '',
  });

  const fetchBoard = async () => {
    try {
      const res = await api.get('/trips/board/');
      setBoard(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoard();
    const interval = setInterval(fetchBoard, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (id: number, action: 'dispatch' | 'complete' | 'cancel') => {
    if (!window.confirm(`Are you sure you want to ${action} this trip?`)) return;
    setActionLoading(id);
    try {
      let payload = {};
      if (action === 'complete') {
        const finalOdometer = window.prompt('Enter final odometer (km):');
        const fuelConsumed = window.prompt('Enter fuel consumed (litres):');
        const fuelCost = window.prompt('Enter fuel cost (optional, defaults to 0):', '0');

        if (!finalOdometer || !fuelConsumed) {
          setActionLoading(null);
          return;
        }

        payload = {
          final_odometer_km: Number(finalOdometer),
          fuel_consumed_l: Number(fuelConsumed),
          fuel_cost: Number(fuelCost || 0),
        };
      }
      await api.post(`/trips/${id}/${action}/`, payload);
      await fetchBoard();
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      alert(apiErr.response?.data?.detail || `Failed to ${action} trip`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    try {
      await api.post('/trips/', {
        ...form,
        vehicle: Number(form.vehicle),
        driver: Number(form.driver),
        cargo_weight_kg: Number(form.cargo_weight_kg),
        planned_distance_km: Number(form.planned_distance_km),
        revenue: Number(form.revenue),
      });
      setForm({
        source: '',
        destination: '',
        vehicle: '',
        driver: '',
        cargo_weight_kg: '0',
        planned_distance_km: '0',
        revenue: '0',
        load_type: '',
        freight_type: '',
      });
      setShowCreate(false);
      await fetchBoard();
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setCreateError(apiErr.response?.data?.detail || 'Failed to create trip.');
    }
  };

  const renderTripCard = (trip: Trip, col: string) => (
    <div key={trip.id} onClick={() => openTripModal(trip.id)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer">
      <div className="flex justify-between items-start mb-2">
        <EditableTripCode trip={trip} onUpdated={() => fetchBoard()} />
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">₹{parseFloat(trip.revenue).toLocaleString()}</span>
      </div>
      
      <div className="mb-3">
        <p className="text-sm font-medium text-slate-900 dark:text-white truncate" title={`${trip.source} to ${trip.destination}`}>
          {trip.source} → {trip.destination}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">{trip.cargo_weight_kg} kg</p>
      </div>

      <div className="space-y-1.5 mb-4">
        <div className="flex items-center text-xs text-slate-600 dark:text-slate-300">
          <Truck className="w-3.5 h-3.5 mr-2 text-slate-400 dark:text-slate-500" />
          {trip.vehicle_reg || 'Unassigned'}
        </div>
        <div className="flex items-center text-xs text-slate-600 dark:text-slate-300">
          <UserIcon className="w-3.5 h-3.5 mr-2 text-slate-400 dark:text-slate-500" />
          {trip.driver_name || 'Unassigned'}
        </div>
      </div>

      {canDispatch && col === 'draft' && (
        <button 
          onClick={(e) => { e.stopPropagation(); handleAction(trip.id, 'dispatch'); }}
          disabled={actionLoading === trip.id}
          className="w-full py-1.5 bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white rounded text-xs font-medium transition-colors flex justify-center items-center"
        >
          {actionLoading === trip.id ? 'Processing...' : <><Play className="w-3 h-3 mr-1" /> Dispatch</>}
        </button>
      )}

      {canDispatch && col === 'dispatched' && (
        <div className="flex gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); handleAction(trip.id, 'complete'); }}
            disabled={actionLoading === trip.id}
            className="flex-1 py-1.5 bg-green-50 dark:bg-green-600/20 text-green-600 dark:text-green-400 hover:bg-green-600 hover:text-white rounded text-xs font-medium transition-colors flex justify-center items-center"
          >
            {actionLoading === trip.id ? '...' : <><CheckCircle className="w-3 h-3 mr-1" /> Complete</>}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleAction(trip.id, 'cancel'); }}
            disabled={actionLoading === trip.id}
            className="flex-1 py-1.5 bg-red-50 dark:bg-red-600/20 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white rounded text-xs font-medium transition-colors flex justify-center items-center"
          >
            {actionLoading === trip.id ? '...' : <><XCircle className="w-3 h-3 mr-1" /> Cancel</>}
          </button>
        </div>
      )}
    </div>
  );

  // Trip modal state
  const [openTripId, setOpenTripId] = useState<number | null>(null);
  const [tripDetail, setTripDetail] = useState<any>(null);
  const [tripSaving, setTripSaving] = useState(false);

  const openTripModal = async (id: number) => {
    setOpenTripId(id);
    try {
      const res = await api.get(`/trips/${id}/`);
      setTripDetail(res.data);
    } catch (err) {
      alert('Failed to load trip details');
      setOpenTripId(null);
    }
  };

  const closeTripModal = () => {
    setOpenTripId(null);
    setTripDetail(null);
  };

  const saveTripDetail = async () => {
    if (!openTripId || !tripDetail) return;
    setTripSaving(true);
    try {
      await api.patch(`/trips/${openTripId}/`, tripDetail);
      await fetchBoard();
      closeTripModal();
    } catch (err) {
      alert((err as any)?.response?.data?.detail || 'Failed to save trip');
    } finally { setTripSaving(false); }
  };


  function EditableTripCode({ trip, onUpdated }: { trip: Trip; onUpdated?: () => void }) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(trip.trip_code);
    const [saving, setSaving] = useState(false);

    useEffect(() => setValue(trip.trip_code), [trip.trip_code]);

    const save = async () => {
      if (!value || value === trip.trip_code) { setEditing(false); return; }
      setSaving(true);
      try {
        await api.patch(`/trips/${trip.id}/set-code/`, { trip_code: value });
        setEditing(false);
        onUpdated && onUpdated();
      } catch (err) {
        alert((err as any)?.response?.data?.detail || 'Failed to update trip code');
      } finally { setSaving(false); }
    };

    return (
      <div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded">
            {trip.trip_code}
          </button>
        ) : (
          <div className="flex items-center">
            <input value={value} onChange={e => setValue(e.target.value)} className="font-mono text-xs font-bold px-2 py-1 w-28 border rounded mr-2" />
            <button onClick={save} disabled={saving} className="px-2 py-1 bg-blue-600 text-white rounded text-xs mr-1">{saving ? '...' : 'Save'}</button>
            <button onClick={() => { setEditing(false); setValue(trip.trip_code); }} className="px-2 py-1 bg-slate-200 rounded text-xs">Cancel</button>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Live Operations Board</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Kanban view of all trip lifecycles (auto-refreshes)</p>
        </div>
        {canDispatch && (
          <button 
            onClick={() => window.location.href = '/trips/new'}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Trip Entry
          </button>
        )}
      </div>

      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {/* Draft Column */}
        <div className="min-w-[300px] flex-1 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-100 dark:bg-slate-800/30 rounded-t-xl">
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-slate-500" /> Draft
            </h3>
            <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs px-2 py-0.5 rounded-full">{board.draft.length}</span>
          </div>
          <div className="p-3 flex-1 overflow-y-auto space-y-3">
            {board.draft.map(t => renderTripCard(t, 'draft'))}
            {board.draft.length === 0 && <p className="text-center text-sm text-slate-500 mt-4">No draft trips</p>}
          </div>
        </div>

        {/* Dispatched Column */}
        <div className="min-w-[300px] flex-1 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl flex flex-col">
          <div className="p-3 border-b border-blue-100 dark:border-blue-900/30 flex justify-between items-center bg-blue-100/50 dark:bg-blue-900/20 rounded-t-xl">
            <h3 className="font-semibold text-blue-700 dark:text-blue-400 flex items-center">
              <Play className="w-4 h-4 mr-2 text-blue-500" /> Dispatched
            </h3>
            <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full">{board.dispatched.length}</span>
          </div>
          <div className="p-3 flex-1 overflow-y-auto space-y-3">
            {board.dispatched.map(t => renderTripCard(t, 'dispatched'))}
            {board.dispatched.length === 0 && <p className="text-center text-sm text-blue-500/50 mt-4">No active trips</p>}
          </div>
        </div>

        {/* Completed Column */}
        <div className="min-w-[300px] flex-1 bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-xl flex flex-col">
          <div className="p-3 border-b border-green-100 dark:border-green-900/30 flex justify-between items-center bg-green-100/50 dark:bg-green-900/20 rounded-t-xl">
            <h3 className="font-semibold text-green-700 dark:text-green-400 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" /> Completed
            </h3>
            <span className="bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300 text-xs px-2 py-0.5 rounded-full">{board.completed.length}</span>
          </div>
          <div className="p-3 flex-1 overflow-y-auto space-y-3">
            {board.completed.map(t => renderTripCard(t, 'completed'))}
            {board.completed.length === 0 && <p className="text-center text-sm text-green-500/50 mt-4">No completed trips</p>}
          </div>
        </div>

        {/* Cancelled Column */}
        <div className="min-w-[300px] flex-1 bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl flex flex-col">
          <div className="p-3 border-b border-red-100 dark:border-red-900/30 flex justify-between items-center bg-red-100/50 dark:bg-red-900/20 rounded-t-xl">
            <h3 className="font-semibold text-red-700 dark:text-red-400 flex items-center">
              <XCircle className="w-4 h-4 mr-2 text-red-500" /> Cancelled
            </h3>
            <span className="bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300 text-xs px-2 py-0.5 rounded-full">{board.cancelled.length}</span>
          </div>
          <div className="p-3 flex-1 overflow-y-auto space-y-3">
            {board.cancelled.map(t => renderTripCard(t, 'cancelled'))}
            {board.cancelled.length === 0 && <p className="text-center text-sm text-red-500/50 mt-4">No cancelled trips</p>}
          </div>
        </div>
      </div>
      {/* Trip Details Modal */}
      {openTripId && tripDetail && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
          <div className="absolute inset-0 bg-black/40" onClick={closeTripModal} />
          <div className="relative bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl p-6 w-full max-w-3xl shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Edit Trip — {tripDetail.trip_code}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-500 mb-1">Trip Code</label>
                <input value={tripDetail.trip_code || ''} onChange={e => setTripDetail({...tripDetail, trip_code: e.target.value})} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm text-slate-500 mb-1">Source</label>
                <input value={tripDetail.source || ''} onChange={e => setTripDetail({...tripDetail, source: e.target.value})} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm text-slate-500 mb-1">Destination</label>
                <input value={tripDetail.destination || ''} onChange={e => setTripDetail({...tripDetail, destination: e.target.value})} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm text-slate-500 mb-1">Departure Km</label>
                <input value={tripDetail.departure_km ?? ''} onChange={e => setTripDetail({...tripDetail, departure_km: e.target.value})} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm text-slate-500 mb-1">Arrival Km</label>
                <input value={tripDetail.arrival_km ?? ''} onChange={e => setTripDetail({...tripDetail, arrival_km: e.target.value})} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm text-slate-500 mb-1">Narration</label>
                <input value={tripDetail.narration || ''} onChange={e => setTripDetail({...tripDetail, narration: e.target.value})} className="w-full px-3 py-2 border rounded" />
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button onClick={closeTripModal} className="px-3 py-2 bg-slate-200 rounded">Cancel</button>
              <button onClick={saveTripDetail} disabled={tripSaving} className="px-3 py-2 bg-blue-600 text-white rounded">{tripSaving ? 'Saving...' : 'Save changes'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
