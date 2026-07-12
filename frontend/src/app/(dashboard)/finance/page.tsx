'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { IndianRupee, Fuel, Receipt, AlertTriangle } from 'lucide-react';
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

export default function FinancePage() {
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'fuel' | 'expenses'>('fuel');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fuelRes, expRes] = await Promise.all([
          api.get('/fuel-logs/'),
          api.get('/expenses/')
        ]);
        setFuelLogs(fuelRes.data.results || fuelRes.data);
        setExpenses(expRes.data.results || expRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Finance & Fuel Logs</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Track operational costs and fuel consumption</p>
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
    </div>
  );
}
