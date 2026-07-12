'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Plus, Wrench, Calendar, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

type ApiError = {
  response?: {
    data?: {
      detail?: string;
    };
  };
};

interface MaintenanceRecord {
  id: number;
  vehicle_reg: string;
  vehicle_name: string;
  service_type: string;
  cost: string;
  date: string;
  notes: string;
  status: string;
}

interface VehicleOption {
  id: number;
  registration_number: string;
  name_model: string;
}

export default function MaintenancePage() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [closingId, setClosingId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createError, setCreateError] = useState('');
  const [form, setForm] = useState({
    vehicle_id: '',
    service_type: '',
    cost: '0',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  });

  const fetchRecords = async () => {
    try {
      const res = await api.get('/maintenance/');
      setRecords(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/vehicles/?status=Available');
      setVehicles(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchRecords();
    void fetchVehicles();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    try {
      await api.post('/maintenance/', {
        vehicle_id: Number(form.vehicle_id),
        service_type: form.service_type,
        cost: form.cost,
        date: form.date,
        notes: form.notes,
      });
      setForm({
        vehicle_id: '',
        service_type: '',
        cost: '0',
        date: format(new Date(), 'yyyy-MM-dd'),
        notes: '',
      });
      setShowCreate(false);
      await Promise.all([fetchRecords(), fetchVehicles()]);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setCreateError(apiErr.response?.data?.detail || 'Failed to create maintenance log.');
    }
  };

  const handleClose = async (id: number) => {
    if (!window.confirm("Mark this maintenance as completed? This will set the vehicle back to 'Available'.")) return;
    setClosingId(id);
    try {
      await api.patch(`/maintenance/${id}/close/`);
      await fetchRecords();
    } catch {
      alert("Failed to close maintenance record.");
    } finally {
      setClosingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Maintenance Logs</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Track vehicle repairs and servicing</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-5 h-5 mr-2" />
          Log Service
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-sm dark:shadow-lg">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Create Maintenance Record</h3>
          {createError && (
            <p className="text-sm text-red-600 dark:text-red-400">{createError}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={form.vehicle_id}
              onChange={(e) => setForm((prev) => ({ ...prev, vehicle_id: e.target.value }))}
              required
              className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
            >
              <option value="">Select vehicle</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.registration_number} - {v.name_model}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Service type"
              value={form.service_type}
              onChange={(e) => setForm((prev) => ({ ...prev, service_type: e.target.value }))}
              required
              className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Cost"
              value={form.cost}
              onChange={(e) => setForm((prev) => ({ ...prev, cost: e.target.value }))}
              required
              className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
            />
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
              required
              className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
            />
          </div>
          <textarea
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
          />
          <div className="flex gap-3">
            <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg">
              Create
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="bg-slate-200 dark:bg-slate-700 px-4 py-2 rounded-lg">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
           <div className="col-span-full flex justify-center py-12">
             <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
           </div>
        ) : records.length > 0 ? (
          records.map((record) => (
            <div key={record.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm dark:shadow-lg flex flex-col">
              <div className={`p-4 border-b ${record.status === 'In Shop' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/50' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center">
                      <Wrench className={`w-5 h-5 mr-2 ${record.status === 'In Shop' ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500'}`} />
                      {record.vehicle_reg}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{record.vehicle_name}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${record.status === 'In Shop' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' : 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20'}`}>
                    {record.status}
                  </span>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-300">{record.service_type}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-500 mt-1 line-clamp-2">{record.notes}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-auto">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-transparent">
                    <p className="text-xs text-slate-500 mb-1 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" /> Date
                    </p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{format(new Date(record.date), 'MMM dd, yyyy')}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-transparent">
                    <p className="text-xs text-slate-500 mb-1">Cost</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">₹{parseFloat(record.cost).toLocaleString()}</p>
                  </div>
                </div>

                {record.status === 'In Shop' && (
                  <button 
                    onClick={() => handleClose(record.id)}
                    disabled={closingId === record.id}
                    className="w-full mt-4 bg-green-50 dark:bg-green-600/20 text-green-700 dark:text-green-400 hover:bg-green-600 hover:text-white py-2 rounded-lg text-sm font-medium transition-colors flex justify-center items-center"
                  >
                    {closingId === record.id ? 'Processing...' : <><CheckCircle className="w-4 h-4 mr-2" /> Mark Completed</>}
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
             <Wrench className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
             <p className="text-slate-500 dark:text-slate-400">No maintenance records found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
