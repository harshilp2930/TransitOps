'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { 
  ShieldCheck, ShieldAlert, AlertTriangle, Clock, CheckCircle2,
  User, Truck, FileText, TrendingDown, TrendingUp, RefreshCw,
  Calendar, Phone, Award, XCircle
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';

interface ExpiryAlert {
  id: number;
  name?: string;
  registration_number?: string;
  license_expiry_date?: string;
  expiry_date?: string;
  doc_type?: string;
  days_remaining: number;
}

interface Driver {
  id: number;
  name: string;
  license_number: string;
  license_category: string;
  license_expiry_date: string;
  contact_number: string;
  safety_score: number;
  status: string;
}

interface Vehicle {
  id: number;
  registration_number: string;
  name_model: string;
  insurance_expiry?: string;
  fitness_expiry?: string;
  permit_expiry?: string;
  needs_tyre_change?: boolean;
  is_depot_overdue?: boolean;
  status: string;
}

interface ComplianceData {
  drivers: { id: number; name: string; license_expiry_date: string }[];
  vehicle_documents: { id: number; vehicle_registration: string; doc_type: string; expiry_date: string }[];
}

const getDaysColor = (days: number) => {
  if (days < 0) return { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-200 dark:border-red-500/20', badge: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300' };
  if (days <= 15) return { text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-500/20', badge: 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300' };
  if (days <= 30) return { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20', badge: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300' };
  return { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-500/10', border: 'border-green-200 dark:border-green-500/20', badge: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300' };
};

const getDaysLabel = (days: number) => {
  if (days < 0) return `Expired ${Math.abs(days)} days ago`;
  if (days === 0) return 'Expires today!';
  return `${days} days remaining`;
};

export default function CompliancePage() {
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'drivers' | 'vehicles' | 'scores'>('overview');

  const fetchAll = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [complianceRes, driversRes, vehiclesRes] = await Promise.all([
        api.get('/notifications/expiries/'),
        api.get('/drivers/'),
        api.get('/vehicles/'),
      ]);
      setComplianceData(complianceRes.data);
      setDrivers(driversRes.data.results || driversRes.data || []);
      setVehicles(vehiclesRes.data.results || vehiclesRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading compliance data...</p>
        </div>
      </div>
    );
  }

  // Compute compliance stats
  const today = new Date();
  
  const expiredLicenses = drivers.filter(d => {
    if (!d.license_expiry_date) return false;
    return differenceInDays(parseISO(d.license_expiry_date), today) < 0;
  });
  
  const expiringLicenses30 = drivers.filter(d => {
    if (!d.license_expiry_date) return false;
    const days = differenceInDays(parseISO(d.license_expiry_date), today);
    return days >= 0 && days <= 30;
  });

  const suspendedDrivers = drivers.filter(d => d.status === 'Suspended');
  const offDutyDrivers = drivers.filter(d => d.status === 'Off Duty');
  const availableDrivers = drivers.filter(d => d.status === 'Available');
  
  const tyreAlerts = vehicles.filter(v => v.needs_tyre_change);
  const depotOverdue = vehicles.filter(v => v.is_depot_overdue);

  const vehicleDocAlerts = vehicles.filter(v => {
    const checkDate = (d?: string) => {
      if (!d) return false;
      return differenceInDays(parseISO(d), today) <= 30;
    };
    return checkDate(v.insurance_expiry) || checkDate(v.fitness_expiry) || checkDate(v.permit_expiry);
  });

  // Safety leaderboard
  const driverLeaderboard = [...drivers]
    .sort((a, b) => parseFloat(b.safety_score?.toString() || '0') - parseFloat(a.safety_score?.toString() || '0'))
    .slice(0, 10);

  const totalAlerts = expiredLicenses.length + expiringLicenses30.length + suspendedDrivers.length + tyreAlerts.length + (complianceData?.vehicle_documents?.length || 0);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ShieldCheck },
    { id: 'drivers', label: 'Driver Compliance', icon: User },
    { id: 'vehicles', label: 'Vehicle Docs', icon: Truck },
    { id: 'scores', label: 'Safety Scores', icon: Award },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-500" />
            Compliance Center
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            License validity, document expiries, driver safety monitoring
          </p>
        </div>
        <button
          onClick={() => fetchAll(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Alert Banner */}
      {totalAlerts > 0 && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">
              {totalAlerts} compliance issue{totalAlerts !== 1 ? 's' : ''} require your attention
            </p>
            <p className="text-amber-700 dark:text-amber-400 text-xs mt-0.5">
              {expiredLicenses.length > 0 && `${expiredLicenses.length} expired license${expiredLicenses.length !== 1 ? 's' : ''} · `}
              {expiringLicenses30.length > 0 && `${expiringLicenses30.length} expiring soon · `}
              {suspendedDrivers.length > 0 && `${suspendedDrivers.length} suspended · `}
              {tyreAlerts.length > 0 && `${tyreAlerts.length} tyre alerts`}
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-red-50 dark:bg-red-500/10 rounded-lg">
              <XCircle className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Expired Licenses</span>
          </div>
          <p className={`text-3xl font-bold ${expiredLicenses.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
            {expiredLicenses.length}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-amber-50 dark:bg-amber-500/10 rounded-lg">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Expiring (30d)</span>
          </div>
          <p className={`text-3xl font-bold ${expiringLicenses30.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
            {expiringLicenses30.length}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-orange-50 dark:bg-orange-500/10 rounded-lg">
              <ShieldAlert className="w-4 h-4 text-orange-500" />
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Suspended Drivers</span>
          </div>
          <p className={`text-3xl font-bold ${suspendedDrivers.length > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-900 dark:text-white'}`}>
            {suspendedDrivers.length}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-green-50 dark:bg-green-500/10 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Compliant Drivers</span>
          </div>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            {drivers.length - expiredLicenses.length - suspendedDrivers.length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="flex gap-0 -mb-px overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Driver License Status */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" />
                License Status
              </h3>
              <div className="flex gap-2">
                <span className="text-xs px-2 py-1 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 rounded-full">
                  {availableDrivers.length} active
                </span>
                <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">
                  {offDutyDrivers.length} off duty
                </span>
              </div>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {drivers.length === 0 ? (
                <div className="px-5 py-8 text-center text-slate-400 text-sm">No drivers registered</div>
              ) : (
                drivers.slice(0, 8).map(driver => {
                  const days = driver.license_expiry_date
                    ? differenceInDays(parseISO(driver.license_expiry_date), today)
                    : null;
                  const colors = days !== null ? getDaysColor(days) : getDaysColor(999);
                  return (
                    <div key={driver.id} className="flex items-center justify-between px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-400">
                          {driver.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{driver.name}</p>
                          <p className="text-xs text-slate-500">{driver.license_number}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {days !== null ? (
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${colors.badge}`}>
                            {getDaysLabel(days)}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">No expiry set</span>
                        )}
                        <p className="text-xs text-slate-400 mt-0.5">
                          {driver.license_expiry_date ? format(parseISO(driver.license_expiry_date), 'dd MMM yyyy') : '—'}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Vehicle Document Status */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-500" />
                Vehicle Document Expiries
              </h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {vehicles.length === 0 ? (
                <div className="px-5 py-8 text-center text-slate-400 text-sm">No vehicles registered</div>
              ) : (
                vehicles.slice(0, 8).map(vehicle => {
                  const docs = [
                    { label: 'Insurance', date: vehicle.insurance_expiry },
                    { label: 'Fitness', date: vehicle.fitness_expiry },
                    { label: 'Permit', date: vehicle.permit_expiry },
                  ].filter(d => d.date);

                  const minDays = docs.reduce((min, d) => {
                    if (!d.date) return min;
                    const days = differenceInDays(parseISO(d.date), today);
                    return days < min ? days : min;
                  }, 9999);

                  const hasAlert = minDays <= 30;
                  const colors = getDaysColor(minDays === 9999 ? 999 : minDays);

                  return (
                    <div key={vehicle.id} className="flex items-center justify-between px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${hasAlert ? 'bg-amber-50 dark:bg-amber-500/10' : 'bg-slate-100 dark:bg-slate-800'}`}>
                          <Truck className={`w-4 h-4 ${hasAlert ? 'text-amber-500' : 'text-slate-500'}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{vehicle.registration_number}</p>
                          <p className="text-xs text-slate-500">{vehicle.name_model}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {hasAlert ? (
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${colors.badge}`}>
                            {getDaysLabel(minDays)}
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 rounded-full font-medium">
                            Compliant
                          </span>
                        )}
                        {vehicle.needs_tyre_change && (
                          <p className="text-xs text-orange-500 mt-0.5">⚠ Tyre change due</p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Tyre & Depot Alerts */}
          {(tyreAlerts.length > 0 || depotOverdue.length > 0) && (
            <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-500/30 rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Fleet Alerts
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {tyreAlerts.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Tyre Change Required</p>
                    <div className="space-y-2">
                      {tyreAlerts.map(v => (
                        <div key={v.id} className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-500/10 rounded-lg">
                          <Truck className="w-4 h-4 text-orange-500 flex-shrink-0" />
                          <span className="text-sm text-orange-800 dark:text-orange-300 font-medium">{v.registration_number}</span>
                          <span className="text-xs text-orange-600 dark:text-orange-400">{v.name_model}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {depotOverdue.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Depot Return Overdue (&gt;7 days)</p>
                    <div className="space-y-2">
                      {depotOverdue.map(v => (
                        <div key={v.id} className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-500/10 rounded-lg">
                          <Truck className="w-4 h-4 text-red-500 flex-shrink-0" />
                          <span className="text-sm text-red-800 dark:text-red-300 font-medium">{v.registration_number}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'drivers' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-4">Driver</th>
                  <th className="px-5 py-4">License #</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Expiry Date</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Contact</th>
                  <th className="px-5 py-4">Compliance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {drivers.map(driver => {
                  const days = driver.license_expiry_date
                    ? differenceInDays(parseISO(driver.license_expiry_date), today)
                    : null;
                  const colors = days !== null ? getDaysColor(days) : getDaysColor(999);
                  const statusColors: Record<string, string> = {
                    'Available': 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20',
                    'On Trip': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
                    'Off Duty': 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20',
                    'Suspended': 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
                  };
                  return (
                    <tr key={driver.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-sm font-bold">
                            {driver.name.charAt(0)}
                          </div>
                          <span className="font-medium text-slate-900 dark:text-white">{driver.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs">{driver.license_number}</td>
                      <td className="px-5 py-3">{driver.license_category || '—'}</td>
                      <td className="px-5 py-3">
                        {driver.license_expiry_date ? format(parseISO(driver.license_expiry_date), 'dd MMM yyyy') : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusColors[driver.status] || 'bg-slate-50 text-slate-600'}`}>
                          {driver.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Phone className="w-3 h-3" />
                          {driver.contact_number || '—'}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {days !== null ? (
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${colors.badge}`}>
                            {getDaysLabel(days)}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">No expiry</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'vehicles' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-4">Vehicle</th>
                  <th className="px-5 py-4">Insurance</th>
                  <th className="px-5 py-4">Fitness</th>
                  <th className="px-5 py-4">Permit</th>
                  <th className="px-5 py-4">Tyre Alert</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {vehicles.map(vehicle => {
                  const renderDate = (dateStr?: string) => {
                    if (!dateStr) return <span className="text-xs text-slate-400">Not set</span>;
                    const days = differenceInDays(parseISO(dateStr), today);
                    const colors = getDaysColor(days);
                    return (
                      <div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.badge}`}>
                          {days < 0 ? 'Expired' : days <= 30 ? `${days}d` : 'OK'}
                        </span>
                        <p className="text-xs text-slate-400 mt-0.5">{format(parseISO(dateStr), 'dd MMM yy')}</p>
                      </div>
                    );
                  };
                  return (
                    <tr key={vehicle.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{vehicle.registration_number}</p>
                          <p className="text-xs text-slate-500">{vehicle.name_model}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3">{renderDate(vehicle.insurance_expiry)}</td>
                      <td className="px-5 py-3">{renderDate(vehicle.fitness_expiry)}</td>
                      <td className="px-5 py-3">{renderDate(vehicle.permit_expiry)}</td>
                      <td className="px-5 py-3">
                        {vehicle.needs_tyre_change ? (
                          <span className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 rounded-full font-medium">
                            ⚠ Due
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">OK</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs text-slate-500">{vehicle.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'scores' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Driver Safety Leaderboard
            </h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {driverLeaderboard.map((driver, index) => {
              const score = parseFloat(driver.safety_score?.toString() || '0');
              const scoreColor = score >= 90 ? 'text-green-600 dark:text-green-400' : score >= 75 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';
              const barColor = score >= 90 ? 'bg-green-500' : score >= 75 ? 'bg-amber-500' : 'bg-red-500';
              return (
                <div key={driver.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-slate-100 text-slate-600' : index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {driver.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-slate-900 dark:text-white text-sm">{driver.name}</p>
                      <p className={`text-sm font-bold ${scoreColor}`}>{score.toFixed(0)}/100</p>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all ${barColor}`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-500">{driver.status}</span>
                      {score >= 90 && <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1"><TrendingUp className="w-3 h-3" />Excellent</span>}
                      {score < 75 && <span className="text-xs text-red-500 flex items-center gap-1"><TrendingDown className="w-3 h-3" />Needs attention</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
