'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Fuel, Receipt, Plus } from 'lucide-react';
import { format } from 'date-fns';

type ApiError = {
  response?: {
    data?: {
      detail?: string;
    };
  };
};

interface FuelLog {
  id: number;
  vehicle_reg?: string;
  trip_code?: string;
  date: string;
  litres: string;
  cost: string;
  odometer_at_fill: number;
}

interface Expense {
  id: number;
  vehicle_reg?: string;
  category: string;
  amount: string;
  date: string;
  notes: string;
}

interface VehicleOption {
  id: number;
  registration_number: string;
  name_model: string;
}

interface TripOption {
  id: number;
  trip_code: string;
  source: string;
  destination: string;
}

export default function FinancePage() {
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [trips, setTrips] = useState<TripOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'fuel' | 'expenses'>('fuel');
  const [showCreate, setShowCreate] = useState(false);
  const [createError, setCreateError] = useState('');
  
  const [fuelForm, setFuelForm] = useState({
    vehicle: '',
    trip: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    litres: '0',
    cost: '0',
    odometer_at_fill: '0',
  });
  const [expenseForm, setExpenseForm] = useState({
    vehicle: '',
    trip: '',
    category: 'Misc',
    amount: '0',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fuelRes, expRes, vehiclesRes, tripsRes] = await Promise.all([
          api.get('/fuel-logs/'),
          api.get('/expenses/'),
          api.get('/vehicles/'),
          api.get('/trips/'),
        ]);
        setFuelLogs(fuelRes.data.results || fuelRes.data);
        setExpenses(expRes.data.results || expRes.data);
        setVehicles(vehiclesRes.data.results || vehiclesRes.data);
        setTrips(tripsRes.data.results || tripsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const refreshData = async () => {
    const [fuelRes, expRes] = await Promise.all([
      api.get('/fuel-logs/'),
      api.get('/expenses/'),
    ]);
    setFuelLogs(fuelRes.data.results || fuelRes.data);
    setExpenses(expRes.data.results || expRes.data);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    try {
      if (activeTab === 'fuel') {
        await api.post('/fuel-logs/', {
          vehicle: Number(fuelForm.vehicle),
          trip: fuelForm.trip ? Number(fuelForm.trip) : null,
          date: fuelForm.date,
          litres: Number(fuelForm.litres),
          cost: Number(fuelForm.cost),
          odometer_at_fill: Number(fuelForm.odometer_at_fill),
        });
      } else {
        await api.post('/expenses/', {
          vehicle: Number(expenseForm.vehicle),
          trip: expenseForm.trip ? Number(expenseForm.trip) : null,
          category: expenseForm.category,
          amount: Number(expenseForm.amount),
          date: expenseForm.date,
          notes: expenseForm.notes,
        });
      }
      setShowCreate(false);
      await refreshData();
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setCreateError(apiErr.response?.data?.detail || 'Failed to create record.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Finance & Fuel Logs</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Track operational costs and fuel consumption</p>
        </div>
        <button
          onClick={() => setShowCreate((prev) => !prev)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          {activeTab === 'fuel' ? 'Add Fuel Log' : 'Add Expense'}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">
            {activeTab === 'fuel' ? 'Create Fuel Log' : 'Create Expense'}
          </h3>
          {createError && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 p-3 rounded-lg border border-red-200 dark:border-transparent">{createError}</p>}

          {activeTab === 'fuel' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vehicle *</label>
                <select value={fuelForm.vehicle} onChange={(e) => setFuelForm((prev) => ({ ...prev, vehicle: e.target.value }))} required className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500">
                  <option value="">Select vehicle</option>
                  {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registration_number} - {v.name_model}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Trip (Optional)</label>
                <select value={fuelForm.trip} onChange={(e) => setFuelForm((prev) => ({ ...prev, trip: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500">
                  <option value="">Link trip (optional)</option>
                  {trips.map((t) => <option key={t.id} value={t.id}>{t.trip_code} ({t.source} to {t.destination})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date *</label>
                <input type="date" value={fuelForm.date} onChange={(e) => setFuelForm((prev) => ({ ...prev, date: e.target.value }))} required className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Litres *</label>
                <input type="number" min="0.01" step="0.01" value={fuelForm.litres} onChange={(e) => setFuelForm((prev) => ({ ...prev, litres: e.target.value }))} placeholder="Litres" required className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Total Cost (₹) *</label>
                <input type="number" min="0" step="0.01" value={fuelForm.cost} onChange={(e) => setFuelForm((prev) => ({ ...prev, cost: e.target.value }))} placeholder="Cost" required className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Odometer Reading *</label>
                <input type="number" min="0" step="0.01" value={fuelForm.odometer_at_fill} onChange={(e) => setFuelForm((prev) => ({ ...prev, odometer_at_fill: e.target.value }))} placeholder="Odometer at fill" required className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vehicle *</label>
                <select value={expenseForm.vehicle} onChange={(e) => setExpenseForm((prev) => ({ ...prev, vehicle: e.target.value }))} required className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500">
                  <option value="">Select vehicle</option>
                  {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registration_number} - {v.name_model}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Trip (Optional)</label>
                <select value={expenseForm.trip} onChange={(e) => setExpenseForm((prev) => ({ ...prev, trip: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500">
                  <option value="">Link trip (optional)</option>
                  {trips.map((t) => <option key={t.id} value={t.id}>{t.trip_code} ({t.source} to {t.destination})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category *</label>
                <select value={expenseForm.category} onChange={(e) => setExpenseForm((prev) => ({ ...prev, category: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500">
                  <option value="Toll">Toll</option>
                  <option value="Misc">Misc</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount (₹) *</label>
                <input type="number" min="0.01" step="0.01" value={expenseForm.amount} onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))} placeholder="Amount" required className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date *</label>
                <input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm((prev) => ({ ...prev, date: e.target.value }))} required className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="md:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes</label>
                <input type="text" value={expenseForm.notes} onChange={(e) => setExpenseForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Notes" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 justify-end">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20">Save Record</button>
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
          <button
            onClick={() => setActiveTab('fuel')}
            className={`flex-1 py-4 text-sm font-medium transition-colors flex items-center justify-center ${
              activeTab === 'fuel' 
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 bg-blue-50 dark:bg-blue-500/5' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            <Fuel className="w-4 h-4 mr-2" />
            Fuel Logs
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex-1 py-4 text-sm font-medium transition-colors flex items-center justify-center ${
              activeTab === 'expenses' 
                ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-500 bg-purple-50 dark:bg-purple-500/5' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            <Receipt className="w-4 h-4 mr-2" />
            Other Expenses
          </button>
        </div>

        <div className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
               <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : activeTab === 'fuel' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Vehicle</th>
                    <th className="px-6 py-4">Trip Code</th>
                    <th className="px-6 py-4">Volume (L)</th>
                    <th className="px-6 py-4">Cost (₹)</th>
                    <th className="px-6 py-4">Odometer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                  {fuelLogs.length > 0 ? fuelLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">{format(new Date(log.date), 'MMM dd, yyyy')}</td>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{log.vehicle_reg || 'N/A'}</td>
                      <td className="px-6 py-4 font-mono text-xs text-blue-600 dark:text-blue-400">{log.trip_code || '-'}</td>
                      <td className="px-6 py-4 text-blue-600 dark:text-blue-300">{log.litres}</td>
                      <td className="px-6 py-4 font-medium text-amber-600 dark:text-amber-400">₹{parseFloat(log.cost).toLocaleString()}</td>
                      <td className="px-6 py-4">{log.odometer_at_fill.toLocaleString()} km</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No fuel logs found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Vehicle</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Amount (₹)</th>
                    <th className="px-6 py-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                  {expenses.length > 0 ? expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">{format(new Date(exp.date), 'MMM dd, yyyy')}</td>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{exp.vehicle_reg || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-transparent">
                          {exp.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-amber-600 dark:text-amber-400">₹{parseFloat(exp.amount).toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate" title={exp.notes}>{exp.notes || '-'}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No expenses found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
