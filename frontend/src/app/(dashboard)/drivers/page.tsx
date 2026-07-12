'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Plus, Search, Filter, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { format, isPast, isBefore, addDays } from 'date-fns';

type ApiError = {
  response?: {
    data?: {
      detail?: string;
    };
  };
};

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

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createError, setCreateError] = useState('');
  const [form, setForm] = useState({
    name: '',
    license_number: '',
    license_category: '',
    license_expiry_date: '',
    contact_number: '',
    safety_score: '100',
    status: 'Available',
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { hasRole } = useAuth();
  const canEdit = hasRole(['Fleet Manager', 'Safety Officer']);

  const fetchDrivers = async () => {
    try {
      const res = await api.get('/drivers/');
      if (res.data.results) {
        setDrivers(res.data.results);
      } else {
        setDrivers(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchDrivers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    try {
      await api.post('/drivers/', form);
      setForm({
        name: '',
        license_number: '',
        license_category: '',
        license_expiry_date: '',
        contact_number: '',
        safety_score: '100',
        status: 'Available',
      });
      setShowCreate(false);
      await fetchDrivers();
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setCreateError(apiErr.response?.data?.detail || 'Failed to create driver.');
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Available': return 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20';
      case 'On Trip': return 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20';
      case 'Suspended': return 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20';
      default: return 'bg-slate-50 dark:bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-500/20';
    }
  };

  const getSafetyScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 75) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const isLicenseExpiringSoon = (dateStr: string) => {
    const expiry = new Date(dateStr);
    return isBefore(expiry, addDays(new Date(), 30)) && !isPast(expiry);
  };

  const filteredDrivers = drivers.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || 
                          d.license_number.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? d.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Drivers & Safety</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage driver profiles and compliance</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowCreate((prev) => !prev)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Driver
          </button>
        )}
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm dark:shadow-lg space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Register Driver</h3>
          {createError && <p className="text-sm text-red-600 dark:text-red-400">{createError}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Driver Name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900" />
            <input type="text" placeholder="License Number" value={form.license_number} onChange={(e) => setForm((prev) => ({ ...prev, license_number: e.target.value }))} required className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900" />
            <input type="text" placeholder="License Category" value={form.license_category} onChange={(e) => setForm((prev) => ({ ...prev, license_category: e.target.value }))} className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900" />
            <input type="date" value={form.license_expiry_date} onChange={(e) => setForm((prev) => ({ ...prev, license_expiry_date: e.target.value }))} required className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900" />
            <input type="text" placeholder="Contact Number" value={form.contact_number} onChange={(e) => setForm((prev) => ({ ...prev, contact_number: e.target.value }))} className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900" />
            <input type="number" min="0" max="100" step="0.01" placeholder="Safety Score" value={form.safety_score} onChange={(e) => setForm((prev) => ({ ...prev, safety_score: e.target.value }))} className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900" />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg">Create</button>
            <button type="button" onClick={() => setShowCreate(false)} className="bg-slate-200 dark:bg-slate-700 px-4 py-2 rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm dark:shadow-xl">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 bg-slate-50 dark:bg-slate-800/30">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by Name or License..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="relative w-full sm:w-48">
            <Filter className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none"
            >
              <option value="">All Statuses</option>
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
               <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">License Details</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Safety Score</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                {filteredDrivers.length > 0 ? (
                  filteredDrivers.map((driver) => {
                    const isExpired = isPast(new Date(driver.license_expiry_date));
                    const isWarning = isLicenseExpiringSoon(driver.license_expiry_date);

                    return (
                      <tr key={driver.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{driver.name}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-slate-900 dark:text-slate-200">{driver.license_number} ({driver.license_category})</span>
                            <span className={`text-xs flex items-center mt-1 ${isExpired ? 'text-red-600 dark:text-red-400 font-medium' : isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>
                              {isExpired || isWarning ? <ShieldAlert className="w-3 h-3 mr-1" /> : <ShieldCheck className="w-3 h-3 mr-1" />}
                              Exp: {format(new Date(driver.license_expiry_date), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{driver.contact_number}</td>
                        <td className="px-6 py-4 font-semibold">
                          <span className={getSafetyScoreColor(driver.safety_score)}>
                            {driver.safety_score}/100
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full border text-xs font-medium ${getStatusColor(driver.status)}`}>
                            {driver.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No drivers found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
