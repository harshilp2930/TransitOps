'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Play, CheckCircle, XCircle, Truck, User as UserIcon, Plus,
  Clock, AlertTriangle, Search, GripVertical, ArrowRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent, closestCenter
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';

type ApiError = { response?: { data?: { detail?: string } } };

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
  expected_return_date?: string | null;
}

interface BoardData {
  draft: Trip[];
  dispatched: Trip[];
  completed: Trip[];
  cancelled: Trip[];
}

interface VehicleOption { id: number; registration_number: string; }
interface DriverOption { id: number; name: string; license_number: string; }

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  Dispatched: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  Completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
};

const COLUMN_META: Record<string, { label: string; icon: React.ReactNode; color: string; headerBg: string }> = {
  draft: {
    label: 'Draft', icon: <Clock className="w-4 h-4" />,
    color: 'border-slate-300 dark:border-slate-700',
    headerBg: 'bg-slate-50 dark:bg-slate-800/60',
  },
  dispatched: {
    label: 'On Trip', icon: <Truck className="w-4 h-4 text-blue-500" />,
    color: 'border-blue-300 dark:border-blue-600/50',
    headerBg: 'bg-blue-50 dark:bg-blue-500/10',
  },
  completed: {
    label: 'Completed', icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
    color: 'border-emerald-300 dark:border-emerald-600/50',
    headerBg: 'bg-emerald-50 dark:bg-emerald-500/10',
  },
  cancelled: {
    label: 'Cancelled', icon: <XCircle className="w-4 h-4 text-red-400" />,
    color: 'border-red-200 dark:border-red-700/50',
    headerBg: 'bg-red-50 dark:bg-red-500/10',
  },
};

// --- Draggable Trip Card ---
function TripCard({
  trip, isDragging = false, onAction, actionLoading, canDispatch, router
}: {
  trip: Trip; isDragging?: boolean; onAction?: (tripId: number, action: string) => void;
  actionLoading: number | null; canDispatch: boolean; router: ReturnType<typeof useRouter>
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: trip.id });
  const style = transform ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)` } : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-slate-900 border ${isDragging ? 'border-blue-400 shadow-xl opacity-80' : 'border-slate-200 dark:border-slate-800'} rounded-xl p-4 space-y-3 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div {...attributes} {...listeners} className="text-slate-300 hover:text-slate-500 cursor-grab shrink-0">
            <GripVertical className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-slate-900 dark:text-white text-sm font-mono">{trip.trip_code}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
              <span className="truncate">{trip.source}</span>
              <ArrowRight className="w-3 h-3 shrink-0" />
              <span className="truncate">{trip.destination}</span>
            </div>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${STATUS_COLORS[trip.status] || STATUS_COLORS['Draft']}`}>
          {trip.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {trip.vehicle_reg && (
          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
            <Truck className="w-3 h-3 text-slate-400" />
            <span className="font-mono">{trip.vehicle_reg}</span>
          </div>
        )}
        {trip.driver_name && (
          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
            <UserIcon className="w-3 h-3 text-slate-400" />
            <span className="truncate">{trip.driver_name}</span>
          </div>
        )}
        <div className="text-slate-600 dark:text-slate-400">{trip.cargo_weight_kg} kg</div>
        <div className="text-emerald-600 dark:text-emerald-400 font-semibold">₹{Number(trip.revenue).toLocaleString()}</div>
      </div>

      {canDispatch && (
        <div className="flex gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          {trip.status === 'Draft' && (
            <button
              onClick={e => { e.stopPropagation(); onAction?.(trip.id, 'dispatch'); }}
              disabled={actionLoading === trip.id}
              className="flex-1 flex items-center justify-center gap-1 text-xs font-medium py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Play className="w-3 h-3" /> Dispatch
            </button>
          )}
          {trip.status === 'Dispatched' && (
            <>
              <button
                onClick={e => { e.stopPropagation(); router.push(`/trips/new?edit=${trip.id}`); }}
                className="flex-1 text-xs font-medium py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
              >
                Complete
              </button>
              <button
                onClick={e => { e.stopPropagation(); onAction?.(trip.id, 'cancel'); }}
                disabled={actionLoading === trip.id}
                className="px-3 text-xs font-medium py-1.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </>
          )}
          {trip.status === 'Draft' && (
            <button
              onClick={e => { e.stopPropagation(); onAction?.(trip.id, 'cancel'); }}
              disabled={actionLoading === trip.id}
              className="px-3 text-xs py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// --- Droppable Column ---
function KanbanColumn({
  id, trips, onAction, actionLoading, canDispatch, router
}: {
  id: string; trips: Trip[];
  onAction: (tripId: number, action: string) => void;
  actionLoading: number | null; canDispatch: boolean; router: ReturnType<typeof useRouter>
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const meta = COLUMN_META[id];
  return (
    <div className="flex flex-col min-w-[280px] flex-1">
      <div className={`flex items-center justify-between px-3 py-2.5 rounded-t-xl border ${meta.color} border-b-0 ${meta.headerBg}`}>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          {meta.icon} {meta.label}
        </div>
        <span className="text-xs font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full px-2 py-0.5 border border-slate-200 dark:border-slate-700">
          {trips.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 border ${meta.color} rounded-b-xl p-3 space-y-3 min-h-[400px] transition-colors ${isOver ? 'bg-blue-50/50 dark:bg-blue-500/5' : 'bg-slate-50/50 dark:bg-slate-900/30'}`}
      >
        {trips.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400 dark:text-slate-600">
            <div className="text-3xl mb-2 opacity-30">—</div>
            <div className="text-xs">Drop trips here</div>
          </div>
        )}
        {trips.map(trip => (
          <TripCard key={trip.id} trip={trip} onAction={onAction} actionLoading={actionLoading} canDispatch={canDispatch} router={router} />
        ))}
      </div>
    </div>
  );
}

export default function LiveBoardPage() {
  const router = useRouter();
  const [board, setBoard] = useState<BoardData>({ draft: [], dispatched: [], completed: [], cancelled: [] });
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);

  const { hasRole } = useAuth();
  const canDispatch = hasRole(['Dispatcher']);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createError, setCreateError] = useState('');
  const [form, setForm] = useState({
    source: '', destination: '', vehicle: '', driver: '',
    cargo_weight_kg: '0', planned_distance_km: '0', revenue: '0',
    load_type: '', freight_type: '',
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const fetchBoard = async () => {
    try {
      const res = await api.get('/trips/board/');
      setBoard(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchBoard();
    const loadOptions = async () => {
      try {
        const [vRes, dRes] = await Promise.all([api.get('/vehicles/?status=Available'), api.get('/drivers/?status=Available')]);
        setVehicles(vRes.data.results || vRes.data);
        setDrivers(dRes.data.results || dRes.data);
      } catch (err) { console.error(err); }
    };
    loadOptions();
  }, []);

  const handleAction = async (tripId: number, actionType: string) => {
    setActionLoading(tripId);
    try {
      await api.post(`/trips/${tripId}/${actionType}/`);
      await fetchBoard();
    } catch (err) {
      const apiErr = err as ApiError;
      alert(apiErr.response?.data?.detail || 'Action failed.');
    } finally { setActionLoading(null); }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const tripId = Number(event.active.id);
    const allTrips = [...board.draft, ...board.dispatched, ...board.completed, ...board.cancelled];
    setActiveTrip(allTrips.find(t => t.id === tripId) || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTrip(null);
    const { active, over } = event;
    if (!over || !canDispatch) return;
    const tripId = Number(active.id);
    const targetColumn = String(over.id);

    // Find current trip status
    const allTrips = [...board.draft, ...board.dispatched, ...board.completed, ...board.cancelled];
    const trip = allTrips.find(t => t.id === tripId);
    if (!trip) return;

    const currentStatus = trip.status.toLowerCase();
    if (currentStatus === targetColumn) return;

    // Only allow valid transitions via drag
    if (currentStatus === 'draft' && targetColumn === 'dispatched') {
      await handleAction(tripId, 'dispatch');
    } else if (currentStatus === 'dispatched' && targetColumn === 'cancelled') {
      await handleAction(tripId, 'cancel');
    } else if (currentStatus === 'draft' && targetColumn === 'cancelled') {
      await handleAction(tripId, 'cancel');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    try {
      await api.post('/trips/', {
        source: form.source, destination: form.destination,
        vehicle: Number(form.vehicle), driver: Number(form.driver),
        cargo_weight_kg: Number(form.cargo_weight_kg),
        planned_distance_km: Number(form.planned_distance_km),
        revenue: Number(form.revenue),
        load_type: form.load_type,
        freight_type: form.freight_type,
      });
      setShowCreate(false);
      setForm({ source: '', destination: '', vehicle: '', driver: '', cargo_weight_kg: '0', planned_distance_km: '0', revenue: '0', load_type: '', freight_type: '' });
      await fetchBoard();
    } catch (err) {
      const apiErr = err as ApiError;
      setCreateError(apiErr.response?.data?.detail || 'Failed to create trip.');
    }
  };

  // Filter trips for search
  const filterTrips = (trips: Trip[]) => {
    if (!debouncedSearch) return trips;
    const q = debouncedSearch.toLowerCase();
    return trips.filter(t =>
      t.trip_code.toLowerCase().includes(q) ||
      (t.vehicle_reg && t.vehicle_reg.toLowerCase().includes(q)) ||
      t.source.toLowerCase().includes(q) ||
      t.destination.toLowerCase().includes(q) ||
      (t.driver_name && t.driver_name.toLowerCase().includes(q))
    );
  };

  const filteredBoard = {
    draft: filterTrips(board.draft),
    dispatched: filterTrips(board.dispatched),
    completed: filterTrips(board.completed),
    cancelled: filterTrips(board.cancelled),
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-500" />
            Live Dispatch Board
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Drag & drop trips between columns to update their status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search trips..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full sm:w-56 pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-colors" />
          </div>
          <button onClick={() => router.push('/trips/new')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20 text-sm shrink-0">
            <Plus className="w-4 h-4" /> New Trip
          </button>
        </div>
      </div>

      {/* Quick Create */}
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4 animate-in fade-in duration-300">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">Quick Create Trip</h3>
          {createError && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-500/10 p-3 rounded-lg">{createError}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Source *</label>
              <input required value={form.source} onChange={e => setForm({...form, source: e.target.value})} placeholder="From..." className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Destination *</label>
              <input required value={form.destination} onChange={e => setForm({...form, destination: e.target.value})} placeholder="To..." className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Vehicle *</label>
              <select required value={form.vehicle} onChange={e => setForm({...form, vehicle: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500">
                <option value="">Select vehicle</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Driver *</label>
              <select required value={form.driver} onChange={e => setForm({...form, driver: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500">
                <option value="">Select driver</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-1">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm bg-slate-100 dark:bg-slate-800 rounded-lg font-medium text-slate-700 dark:text-slate-300">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium">Create Draft</button>
          </div>
        </form>
      )}

      {/* Kanban Board */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {(['draft', 'dispatched', 'completed', 'cancelled'] as const).map(col => (
              <KanbanColumn
                key={col}
                id={col}
                trips={filteredBoard[col]}
                onAction={handleAction}
                actionLoading={actionLoading}
                canDispatch={canDispatch}
                router={router}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTrip && (
              <TripCard trip={activeTrip} isDragging onAction={() => {}} actionLoading={null} canDispatch={false} router={router} />
            )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
