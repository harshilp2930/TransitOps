'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Truck, AlertTriangle, Route, IndianRupee, Activity, TrendingUp } from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardStats {
  active_vehicles: number;
  available_vehicles: number;
  vehicles_in_maintenance: number;
  active_trips: number;
  completed_trips_today: number;
  total_drivers_available: number;
}

interface AnalyticsStats {
  summary: {
    total_operational_cost: number;
    fuel_efficiency_kmpl: number;
    fleet_utilization_pct: number;
    vehicle_roi_pct: number;
  };
  monthly_revenue: { month: string; revenue: number }[];
  top_costliest_vehicles: { registration_number: string; total_cost: number }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { theme } = useTheme();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashRes, analyticRes] = await Promise.all([
          api.get('/reports/dashboard/'),
          api.get('/reports/analytics/')
        ]);
        setStats(dashRes.data);
        setAnalytics(analyticRes.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500/50 rounded-lg text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  }

  const isDark = theme === 'dark';
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const tickColor = isDark ? '#94a3b8' : '#64748b';

  const revenueData = {
    labels: analytics?.monthly_revenue?.map((d) => d.month) || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue (₹)',
        data: analytics?.monthly_revenue?.map((d) => d.revenue) || [120000, 150000, 140000, 180000, 200000, 220000],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.4,
      },
    ],
  };

  const costData = {
    labels: analytics?.top_costliest_vehicles?.map((d) => d.registration_number) || ['AU12AB4891', 'MH12AB1234', 'KA05CD5678'],
    datasets: [
      {
        label: 'Operational Cost (₹)',
        data: analytics?.top_costliest_vehicles?.map((d) => d.total_cost) || [25000, 18000, 15000],
        backgroundColor: '#ef4444',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: tickColor }
      }
    },
    scales: {
      x: { ticks: { color: tickColor }, grid: { color: gridColor } },
      y: { ticks: { color: tickColor }, grid: { color: gridColor } }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Overview</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Real-time metrics for your fleet operations</p>
        </div>
      </div>

      {/* KPI Stats Row 1 - Operational */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm dark:shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Route className="w-16 h-16 text-blue-500" />
          </div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Trips</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats?.active_trips}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm dark:shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Truck className="w-16 h-16 text-green-500" />
          </div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-green-50 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-lg">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Available Vehicles</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats?.available_vehicles}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm dark:shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertTriangle className="w-16 h-16 text-amber-500" />
          </div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">In Maintenance</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats?.vehicles_in_maintenance}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm dark:shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-16 h-16 text-purple-500" />
          </div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Trips Completed Today</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats?.completed_trips_today}</p>
        </div>
      </div>

      {/* Analytics Row 2 - Financial & Efficiency */}
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight mt-8 mb-4">Financial & Efficiency Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm dark:shadow-lg">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Operational Cost</h3>
          <p className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
            <IndianRupee className="w-5 h-5 mr-1 text-slate-400 dark:text-slate-500" />
            {analytics?.summary.total_operational_cost.toLocaleString() || '0'}
          </p>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm dark:shadow-lg">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Fleet Utilization</h3>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {analytics?.summary.fleet_utilization_pct.toFixed(1) || '0'}%
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm dark:shadow-lg">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Fuel Efficiency</h3>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {analytics?.summary.fuel_efficiency_kmpl.toFixed(2) || '0'} km/L
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm dark:shadow-lg">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Vehicle ROI (Avg)</h3>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {analytics?.summary.vehicle_roi_pct.toFixed(2) || '0'}%
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm dark:shadow-lg">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Monthly Revenue Trend</h3>
          <div className="h-72">
            <Line options={chartOptions} data={revenueData} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm dark:shadow-lg">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Top Costliest Vehicles</h3>
          <div className="h-72">
            <Bar options={chartOptions} data={costData} />
          </div>
        </div>
      </div>
      
    </div>
  );
}
