'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Fuel, Receipt, Plus, Download, TrendingUp, BarChart3 } from 'lucide-react';
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
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'fuel' | 'expenses' | 'reports'>('fuel');
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
        const [fuelRes, expRes, vehiclesRes, tripsRes, analyticsRes] = await Promise.all([
          api.get('/fuel-logs/'),
          api.get('/expenses/'),
          api.get('/vehicles/'),
          api.get('/trips/'),
          api.get('/reports/analytics/'),
        ]);
        setFuelLogs(fuelRes.data.results || fuelRes.data);
        setExpenses(expRes.data.results || expRes.data);
        setVehicles(vehiclesRes.data.results || vehiclesRes.data);
        setTrips(tripsRes.data.results || tripsRes.data);
        setAnalyticsData(analyticsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const refreshData = async () => {
    const [fuelRes, expRes, analyticsRes] = await Promise.all([
      api.get('/fuel-logs/'),
      api.get('/expenses/'),
      api.get('/reports/analytics/'),
    ]);
    setFuelLogs(fuelRes.data.results || fuelRes.data);
    setExpenses(expRes.data.results || expRes.data);
    setAnalyticsData(analyticsRes.data);
  };

  const handleExportCSV = async () => {
    try {
      const res = await api.get('/reports/export.csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transitops_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error(e);
      alert('Failed to export CSV');
    }
  };

  const handleExportPDF = async () => {
    try {
      const res = await api.get('/reports/export.pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transitops_report_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error(e);
      alert('Failed to export PDF');
    }
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
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          {activeTab === 'fuel' ? 'Add Fuel Log' : 'Add Expense'}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {activeTab === 'fuel' ? 'Create Fuel Log' : 'Create Expense'}
          </h3>
          {createError && <p className="text-sm text-red-600 dark:text-red-400">{createError}</p>}

          {activeTab === 'fuel' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select value={fuelForm.vehicle} onChange={(e) => setFuelForm((prev) => ({ ...prev, vehicle: e.target.value }))} required className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900">
                <option value="">Select vehicle</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registration_number} - {v.name_model}</option>)}
              </select>
              <select value={fuelForm.trip} onChange={(e) => setFuelForm((prev) => ({ ...prev, trip: e.target.value }))} className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900">
                <option value="">Link trip (optional)</option>
                {trips.map((t) => <option key={t.id} value={t.id}>{t.trip_code} ({t.source} to {t.destination})</option>)}
              </select>
              <input type="date" value={fuelForm.date} onChange={(e) => setFuelForm((prev) => ({ ...prev, date: e.target.value }))} required className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900" />
              <input type="number" min="0.01" step="0.01" value={fuelForm.litres} onChange={(e) => setFuelForm((prev) => ({ ...prev, litres: e.target.value }))} placeholder="Litres" required className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900" />
              <input type="number" min="0" step="0.01" value={fuelForm.cost} onChange={(e) => setFuelForm((prev) => ({ ...prev, cost: e.target.value }))} placeholder="Cost" required className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900" />
              <input type="number" min="0" step="0.01" value={fuelForm.odometer_at_fill} onChange={(e) => setFuelForm((prev) => ({ ...prev, odometer_at_fill: e.target.value }))} placeholder="Odometer at fill" required className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select value={expenseForm.vehicle} onChange={(e) => setExpenseForm((prev) => ({ ...prev, vehicle: e.target.value }))} required className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900">
                <option value="">Select vehicle</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registration_number} - {v.name_model}</option>)}
              </select>
              <select value={expenseForm.trip} onChange={(e) => setExpenseForm((prev) => ({ ...prev, trip: e.target.value }))} className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900">
                <option value="">Link trip (optional)</option>
                {trips.map((t) => <option key={t.id} value={t.id}>{t.trip_code} ({t.source} to {t.destination})</option>)}
              </select>
              <select value={expenseForm.category} onChange={(e) => setExpenseForm((prev) => ({ ...prev, category: e.target.value }))} className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900">
                <option value="Toll">Toll</option>
                <option value="Misc">Misc</option>
                <option value="Other">Other</option>
              </select>
              <input type="number" min="0.01" step="0.01" value={expenseForm.amount} onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))} placeholder="Amount" required className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900" />
              <input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm((prev) => ({ ...prev, date: e.target.value }))} required className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900" />
              <input type="text" value={expenseForm.notes} onChange={(e) => setExpenseForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Notes" className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900" />
            </div>
          )}

          <div className="flex gap-3">
            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg">Create</button>
            <button type="button" onClick={() => setShowCreate(false)} className="bg-slate-200 dark:bg-slate-700 px-4 py-2 rounded-lg">Cancel</button>
          </div>
        </form>
      )}

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
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 py-4 text-sm font-medium transition-colors flex items-center justify-center ${
              activeTab === 'reports' 
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 bg-indigo-50 dark:bg-indigo-500/5' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Reports & Analytics
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
          ) : activeTab === 'expenses' ? (
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
          ) : (
            <div className="p-6 space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Fuel Efficiency</div>
                  <div className="text-2xl font-bold mt-2 text-blue-600 dark:text-blue-400">
                    {analyticsData?.summary?.fuel_efficiency_kmpl ?? '0.00'} <span className="text-sm font-medium text-slate-500 dark:text-slate-400">km/L</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Fleet average distance/fuel</div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Fleet Utilization</div>
                  <div className="text-2xl font-bold mt-2 text-emerald-600 dark:text-emerald-400">
                    {analyticsData?.summary?.fleet_utilization_pct ?? '0.0'}%
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Vehicles active on trips</div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Operational Cost</div>
                  <div className="text-2xl font-bold mt-2 text-red-600 dark:text-red-400">
                    ₹{(analyticsData?.summary?.total_operational_cost ?? 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Fuel + Maintenance costs</div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Fleet ROI</div>
                  <div className="text-2xl font-bold mt-2 text-indigo-600 dark:text-indigo-400">
                    {analyticsData?.summary?.vehicle_roi_pct ?? '0.00'}%
                  </div>
                  <div className="text-xs text-slate-400 mt-1">(Rev - Op Cost) / Acquisition</div>
                </div>
              </div>

              {/* Export Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-md font-semibold text-slate-900 dark:text-white">Export & Download Reports</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Download tabular operations and financials summaries</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={handleExportCSV}
                    className="flex items-center px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2 text-emerald-600" />
                    Export CSV
                  </button>
                  <button 
                    onClick={handleExportPDF}
                    className="flex items-center px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2 text-red-500" />
                    Export PDF (Weasyprint)
                  </button>
                </div>
              </div>

              {/* Truckwise Performance Section */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Truckwise Performance</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Detailed metric rollup of each active and retired vehicle</p>
                </div>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="px-6 py-4">Reg Number</th>
                        <th className="px-6 py-4">Name/Model</th>
                        <th className="px-6 py-4 text-right">Trips</th>
                        <th className="px-6 py-4 text-right">Fuel Eff. (km/L)</th>
                        <th className="px-6 py-4 text-right">Fuel Cost</th>
                        <th className="px-6 py-4 text-right">Maint. Cost</th>
                        <th className="px-6 py-4 text-right">Total Op. Cost</th>
                        <th className="px-6 py-4 text-right">Revenue</th>
                        <th className="px-6 py-4 text-right">ROI</th>
                        <th className="px-6 py-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                      {analyticsData?.vehicle_analytics?.length > 0 ? (
                        analyticsData.vehicle_analytics.map((v: any) => (
                          <tr key={v.vehicle_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{v.registration_number}</td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{v.name_model} ({v.type})</td>
                            <td className="px-6 py-4 text-right">{v.total_trips}</td>
                            <td className="px-6 py-4 text-right font-medium text-blue-600 dark:text-blue-400">{v.fuel_efficiency_kmpl ?? '0.00'}</td>
                            <td className="px-6 py-4 text-right">₹{(v.total_fuel_cost ?? 0).toLocaleString()}</td>
                            <td className="px-6 py-4 text-right">₹{(v.total_maintenance_cost ?? 0).toLocaleString()}</td>
                            <td className="px-6 py-4 text-right font-semibold text-red-600 dark:text-red-400">₹{(v.total_operational_cost ?? 0).toLocaleString()}</td>
                            <td className="px-6 py-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">₹{(v.total_revenue ?? 0).toLocaleString()}</td>
                            <td className={`px-6 py-4 text-right font-bold ${v.roi_pct >= 0 ? 'text-green-600' : 'text-red-500'}`}>{v.roi_pct}%</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                v.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-transparent' :
                                v.status === 'On Trip' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-transparent' :
                                v.status === 'Maintenance' || v.status === 'In Shop' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-transparent' :
                                'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-transparent'
                              }`}>
                                {v.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={10} className="px-6 py-8 text-center text-slate-500">No vehicle data available.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Monthly Performance Trend / Yearly Performance */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Yearly / Monthly Performance Trend</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Chronological rollup of revenue and growth</p>
                </div>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl max-w-2xl">
                  <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="px-6 py-4">Timeframe (Month)</th>
                        <th className="px-6 py-4 text-right">Total Revenue</th>
                        <th className="px-6 py-4 text-center">Trend Indicator</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                      {analyticsData?.monthly_revenue?.length > 0 ? (
                        analyticsData.monthly_revenue.map((m: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{m.month}</td>
                            <td className="px-6 py-4 text-right font-medium text-emerald-600 dark:text-emerald-400">₹{(m.revenue ?? 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full">
                                <TrendingUp className="w-3.5 h-3.5 mr-1" /> Healthy
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-6 py-8 text-center text-slate-500">No trend data available.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
