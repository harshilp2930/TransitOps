'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Plus, Wrench, Calendar, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface MaintenanceRecord {
  id: number;
  vehicle_details: { registration_number: string; name_model: string };
  service_type: string;
  cost: string;
  date: string;
  notes: string;
  status: string;
}

interface Vehicle { id: number; registration_number: string; name_model: string; status: string }

export default function MaintenancePage() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [closingId, setClosingId] = useState<number | null>(null);

  // Form State
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    service_type: '',
    cost: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [maintRes, vehRes] = await Promise.all([
        api.get('/maintenance/'),
        api.get('/vehicles/')
      ]);
      setRecords(maintRes.data.results || maintRes.data);
      setVehicles(vehRes.data.results || vehRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');
    try {
      await api.post('/maintenance/', {
        vehicle: parseInt(formData.vehicle_id),
        service_type: formData.service_type,
        cost: parseFloat(formData.cost),
        date: formData.date,
        notes: formData.notes
      });
      setFormData({ vehicle_id: '', service_type: '', cost: '', date: new Date().toISOString().split('T')[0], notes: '' });
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.non_field_errors?.[0] || err.response?.data?.detail || 'Failed to log service record');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleClose = async (id: number) => {
    if (!window.confirm("Mark this maintenance as completed? This will set the vehicle back to 'Available'.")) return;
    setClosingId(id);
    try {
      await api.patch(`/maintenance/${id}/close/`);
      await fetchData();
    } catch (err) {
      alert("Failed to close maintenance record.");
    } finally {
      setClosingId(null);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Maintenance Logs</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Track vehicle repairs and servicing</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
        {/* Log Service Form Sidebar */}
        <div className="w-full lg:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col h-full shrink-0">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-t-xl">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
              <Plus className="w-4 h-4 mr-2 text-amber-500" /> Log Service Record
            </h3>
          </div>
          <div className="p-4 overflow-y-auto flex-1">
            <form onSubmit={handleCreateRecord} className="space-y-4">
              {error && <div className="text-red-500 text-xs bg-red-50 dark:bg-red-500/10 p-2 rounded">{error}</div>}
              
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Vehicle</label>
                <select required value={formData.vehicle_id} onChange={e => setFormData({...formData, vehicle_id: e.target.value})} className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white">
                  <option value="">Select a vehicle</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.registration_number}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Service Type</label>
                <input required value={formData.service_type} onChange={e => setFormData({...formData, service_type: e.target.value})} type="text" placeholder="e.g. Oil Change" className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Cost (₹)</label>
                <input required value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} type="number" className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                <input required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} type="date" className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Notes</label>
                <textarea rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Optional notes..." className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white resize-none" />
              </div>

              <button type="submit" disabled={submitLoading} className="w-full py-2 mt-4 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                {submitLoading ? 'Saving...' : 'Save Record'}
              </button>
            </form>
          </div>
        </div>

        {/* Maintenance Records Table */}
        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col min-w-0">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-t-xl">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
              <Wrench className="w-4 h-4 mr-2 text-slate-500" /> Service Log
            </h3>
          </div>
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              </div>
            ) : (
              <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 sticky top-0">
                  <tr>
                    <th className="px-6 py-4">Vehicle</th>
                    <th className="px-6 py-4">Service</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Cost</th>
                    <th className="px-6 py-4">Status / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                  {records.length > 0 ? (
                    records.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{record.vehicle_details?.registration_number}</td>
                        <td className="px-6 py-4">{record.service_type}</td>
                        <td className="px-6 py-4">{format(new Date(record.date), 'MMM dd, yyyy')}</td>
                        <td className="px-6 py-4 font-medium">₹{parseFloat(record.cost).toLocaleString()}</td>
                        <td className="px-6 py-4">
                          {record.status === 'In Shop' ? (
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 rounded-full border text-xs font-medium bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20">
                                In Shop
                              </span>
                              <button 
                                onClick={() => handleClose(record.id)}
                                disabled={closingId === record.id}
                                className="text-xs px-2 py-1 bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-600/20 dark:text-green-400 dark:hover:bg-green-600/40 rounded transition-colors"
                              >
                                {closingId === record.id ? '...' : 'Mark Completed'}
                              </button>
                            </div>
                          ) : (
                            <span className="px-2 py-1 rounded-full border text-xs font-medium bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20">
                              Completed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                        No service records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
