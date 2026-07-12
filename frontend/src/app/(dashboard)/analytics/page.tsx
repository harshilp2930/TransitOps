'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Download, TrendingUp, BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const analyticsRes = await api.get('/reports/analytics/');
        setAnalyticsData(analyticsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12 h-64">
         <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Reports & Analytics</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Detailed operational costs, revenue, and fleet ROI</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExportCSV}
            className="flex items-center px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 mr-2 text-emerald-600" />
            Export CSV
          </button>
          <button 
            onClick={handleExportPDF}
            className="flex items-center px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 mr-2 text-red-500" />
            Export PDF
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Fuel Efficiency</div>
            <div className="text-2xl font-bold mt-2 text-blue-600 dark:text-blue-400">
              {analyticsData?.summary?.fuel_efficiency_kmpl ?? '0.00'} <span className="text-sm font-medium text-slate-500 dark:text-slate-400">km/L</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">Fleet average distance/fuel</div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Fleet Utilization</div>
            <div className="text-2xl font-bold mt-2 text-emerald-600 dark:text-emerald-400">
              {analyticsData?.summary?.fleet_utilization_pct ?? '0.0'}%
            </div>
            <div className="text-xs text-slate-400 mt-1">Vehicles active on trips</div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Operational Cost</div>
            <div className="text-2xl font-bold mt-2 text-red-600 dark:text-red-400">
              ₹{(analyticsData?.summary?.total_operational_cost ?? 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </div>
            <div className="text-xs text-slate-400 mt-1">Fuel + Maintenance costs</div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Fleet ROI</div>
            <div className="text-2xl font-bold mt-2 text-indigo-600 dark:text-indigo-400">
              {analyticsData?.summary?.vehicle_roi_pct ?? '0.00'}%
            </div>
            <div className="text-xs text-slate-400 mt-1">(Rev - Op Cost) / Acquisition</div>
          </div>
        </div>

        {/* Truckwise Performance Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Truckwise Performance</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Detailed metric rollup of each active and retired vehicle</p>
          </div>
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Reg Number</th>
                  <th className="px-6 py-4">Name/Model</th>
                  <th className="px-6 py-4 text-right">Trips</th>
                  <th className="px-6 py-4 text-right">Fuel Eff. (km/L)</th>
                  <th className="px-6 py-4 text-right">Fuel Cost</th>
                  <th className="px-6 py-4 text-right">Maint. Cost</th>
                  <th className="px-6 py-4 text-right">Other Exp.</th>
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
                      <td className="px-6 py-4 text-right">₹{(v.total_expense_cost ?? 0).toLocaleString()}</td>
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

        {/* Monthly Performance Trend */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Yearly / Monthly Performance Trend</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Chronological rollup of revenue and growth</p>
          </div>
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 max-w-2xl">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
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
    </div>
  );
}
