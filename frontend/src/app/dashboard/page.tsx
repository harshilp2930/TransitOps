"use client";

import React, { useEffect, useState } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { api } from '@/lib/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [vehicleAnalytics, setVehicleAnalytics] = useState<any[]>([]);
  const [monthly, setMonthly] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const s = await api.get('/reports/analytics/');
        setSummary(s.data.summary);
        setVehicleAnalytics(s.data.vehicle_analytics || []);
        setMonthly(s.data.monthly_revenue || []);
      } catch (e) {
        console.error('Failed to load reports', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const downloadCSV = () => {
    window.open(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'}/reports/export.csv`, '_blank');
  };

  if (loading) return <div className="p-8">Loading dashboard...</div>;

  const revenueLabels = monthly.map((m: any) => m.month);
  const revenueData = monthly.map((m: any) => m.revenue);

  const doughnutData = {
    labels: vehicleAnalytics.slice(0,5).map(v => v.registration_number),
    datasets: [
      {
        data: vehicleAnalytics.slice(0,5).map(v => v.total_operational_cost),
        backgroundColor: ['#60A5FA','#34D399','#FCA5A5','#FBBF24','#A78BFA'],
      }
    ]
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-3">
          <button onClick={downloadCSV} className="px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded">Export CSV</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 p-4 rounded shadow-sm">
          <div className="text-sm text-slate-500">Fleet Efficiency (km/l)</div>
          <div className="text-2xl font-bold">{summary?.fuel_efficiency_kmpl ?? '—'}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded shadow-sm">
          <div className="text-sm text-slate-500">Fleet Utilization</div>
          <div className="text-2xl font-bold">{summary?.fleet_utilization_pct ?? '—'}%</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded shadow-sm">
          <div className="text-sm text-slate-500">Total Operational Cost</div>
          <div className="text-2xl font-bold">{summary?.total_operational_cost ?? '—'}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded shadow-sm">
          <h3 className="font-medium mb-3">Monthly Revenue (last 6 months)</h3>
          <Line data={{ labels: revenueLabels, datasets: [{ label: 'Revenue', data: revenueData, borderColor: '#60A5FA', backgroundColor: 'rgba(96,165,250,0.2)' }] }} />
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded shadow-sm">
          <h3 className="font-medium mb-3">Top Costliest Vehicles</h3>
          <Doughnut data={doughnutData} />
        </div>
      </div>
    </div>
  );
}
