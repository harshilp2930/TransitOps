'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { IndianRupee, Fuel, Receipt, AlertTriangle, Plus, X } from 'lucide-react';
import { format } from 'date-fns';

interface FuelLog {
  id: number;
  vehicle_details?: { registration_number: string };
  trip_details?: { trip_code: string };
  date: string;
  litres: string;
  cost: string;
  odometer_at_fill: number;
}

interface Expense {
  id: number;
  vehicle_details?: { registration_number: string };
  category: string;
  amount: string;
  date: string;
  notes: string;
}

interface Vehicle { id: number; registration_number: string; name_model: string; status: string }

export default function FinancePage() {
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'fuel' | 'expenses'>('fuel');

  // Modal states
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  const [fuelForm, setFuelForm] = useState({
    vehicle_id: '',
    date: new Date().toISOString().split('T')[0],
    litres: '',
    cost: '',
    odometer_at_fill: ''
  });

  const [expenseForm, setExpenseForm] = useState({
    vehicle_id: '',
    category: 'Toll',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const fetchData = async () => {
    try {
      const [fuelRes, expRes, vehRes] = await Promise.all([
        api.get('/fuel-logs/'),
        api.get('/expenses/'),
        api.get('/vehicles/')
      ]);
      setFuelLogs(fuelRes.data.results || fuelRes.data);
      setExpenses(expRes.data.results || expRes.data);
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

  const handleLogFuel = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');
    try {
      await api.post('/fuel-logs/', {
        vehicle: parseInt(fuelForm.vehicle_id),
        date: fuelForm.date,
        litres: parseFloat(fuelForm.litres),
        cost: parseFloat(fuelForm.cost),
        odometer_at_fill: parseInt(fuelForm.odometer_at_fill)
      });
      setIsFuelModalOpen(false);
      setFuelForm({ vehicle_id: '', date: new Date().toISOString().split('T')[0], litres: '', cost: '', odometer_at_fill: '' });
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to log fuel');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');
    try {
      await api.post('/expenses/', {
        vehicle: expenseForm.vehicle_id ? parseInt(expenseForm.vehicle_id) : null,
        category: expenseForm.category,
        amount: parseFloat(expenseForm.amount),
        date: expenseForm.date,
        notes: expenseForm.notes
      });
      setIsExpenseModalOpen(false);
      setExpenseForm({ vehicle_id: '', category: 'Toll', amount: '', date: new Date().toISOString().split('T')[0], notes: '' });
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add expense');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Finance & Fuel Logs</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Track operational costs and fuel consumption</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsFuelModalOpen(true)} className="bg-amber-500 hover:bg-amber-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center shadow-lg shadow-amber-500/20">
            <Plus className="w-5 h-5 mr-2" /> Log Fuel
          </button>
          <button onClick={() => setIsExpenseModalOpen(true)} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center shadow-lg shadow-purple-500/20">
            <Plus className="w-5 h-5 mr-2" /> Add Expense
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm dark:shadow-xl">
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
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{log.vehicle_details?.registration_number || 'N/A'}</td>
                      <td className="px-6 py-4 font-mono text-xs text-blue-600 dark:text-blue-400">{log.trip_details?.trip_code || '-'}</td>
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
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{exp.vehicle_details?.registration_number || 'N/A'}</td>
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

      {/* Fuel Log Modal */}
      {isFuelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center"><Fuel className="w-5 h-5 mr-2 text-amber-500" /> Log Fuel</h3>
              <button onClick={() => setIsFuelModalOpen(false)} className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleLogFuel} className="p-4 space-y-4">
              {error && <div className="text-red-500 text-sm bg-red-50 dark:bg-red-500/10 p-2 rounded">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vehicle</label>
                <select required value={fuelForm.vehicle_id} onChange={e => setFuelForm({...fuelForm, vehicle_id: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white">
                  <option value="">Select a vehicle</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Litres</label>
                  <input required value={fuelForm.litres} onChange={e => setFuelForm({...fuelForm, litres: e.target.value})} type="number" step="0.1" className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cost (₹)</label>
                  <input required value={fuelForm.cost} onChange={e => setFuelForm({...fuelForm, cost: e.target.value})} type="number" className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Odometer</label>
                  <input required value={fuelForm.odometer_at_fill} onChange={e => setFuelForm({...fuelForm, odometer_at_fill: e.target.value})} type="number" className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                  <input required value={fuelForm.date} onChange={e => setFuelForm({...fuelForm, date: e.target.value})} type="date" className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" />
                </div>
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsFuelModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
                <button type="submit" disabled={submitLoading} className="px-4 py-2 text-sm font-medium bg-amber-500 hover:bg-amber-400 text-white rounded-lg transition-colors disabled:opacity-50">{submitLoading ? 'Saving...' : 'Save Fuel Log'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center"><Receipt className="w-5 h-5 mr-2 text-purple-500" /> Add Expense</h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddExpense} className="p-4 space-y-4">
              {error && <div className="text-red-500 text-sm bg-red-50 dark:bg-red-500/10 p-2 rounded">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vehicle (Optional)</label>
                <select value={expenseForm.vehicle_id} onChange={e => setExpenseForm({...expenseForm, vehicle_id: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white">
                  <option value="">None / General Expense</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select required value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white">
                    <option value="Toll">Toll</option>
                    <option value="Fines">Fines</option>
                    <option value="Misc">Misc</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount (₹)</label>
                  <input required value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} type="number" className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                <input required value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} type="date" className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes</label>
                <input value={expenseForm.notes} onChange={e => setExpenseForm({...expenseForm, notes: e.target.value})} type="text" placeholder="Description..." className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" />
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
                <button type="submit" disabled={submitLoading} className="px-4 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors disabled:opacity-50">{submitLoading ? 'Saving...' : 'Save Expense'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
