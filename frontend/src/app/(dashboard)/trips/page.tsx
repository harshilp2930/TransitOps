'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Play, CheckCircle, XCircle, Clock, Truck, User as UserIcon } from 'lucide-react';
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

export default function LiveBoardPage() {
  const [board, setBoard] = useState<BoardData>({ draft: [], dispatched: [], completed: [], cancelled: [] });
  const [loading, setLoading] = useState(true);
  const { hasRole } = useAuth();
  const canDispatch = hasRole(['Dispatcher']);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

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
        payload = {
          final_odometer_km: 1000,
          fuel_consumed_l: 20,
          fuel_cost: 2500
        };
      }
      await api.post(`/trips/${id}/${action}/`, payload);
      await fetchBoard();
    } catch (err: any) {
      alert(err.response?.data?.detail || `Failed to ${action} trip`);
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
        <p className="text-sm font-medium text-slate-900 dark:text-white truncate" title={`${trip.source} to ${trip.destination}`}>
          {trip.source} → {trip.destination}
        </p>
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
        <button 
          onClick={() => handleAction(trip.id, 'dispatch')}
          disabled={actionLoading === trip.id}
          className="w-full py-1.5 bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white rounded text-xs font-medium transition-colors flex justify-center items-center"
        >
          {actionLoading === trip.id ? 'Processing...' : <><Play className="w-3 h-3 mr-1" /> Dispatch</>}
        </button>
      )}

      {canDispatch && col === 'dispatched' && (
        <div className="flex gap-2">
          <button 
            onClick={() => handleAction(trip.id, 'complete')}
            disabled={actionLoading === trip.id}
            className="flex-1 py-1.5 bg-green-50 dark:bg-green-600/20 text-green-600 dark:text-green-400 hover:bg-green-600 hover:text-white rounded text-xs font-medium transition-colors flex justify-center items-center"
          >
            {actionLoading === trip.id ? '...' : <><CheckCircle className="w-3 h-3 mr-1" /> Complete</>}
          </button>
          <button 
            onClick={() => handleAction(trip.id, 'cancel')}
            disabled={actionLoading === trip.id}
            className="flex-1 py-1.5 bg-red-50 dark:bg-red-600/20 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white rounded text-xs font-medium transition-colors flex justify-center items-center"
          >
            {actionLoading === trip.id ? '...' : <><XCircle className="w-3 h-3 mr-1" /> Cancel</>}
          </button>
        </div>
      )}
    </div>
  );

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
      </div>
    </div>
  );
}
