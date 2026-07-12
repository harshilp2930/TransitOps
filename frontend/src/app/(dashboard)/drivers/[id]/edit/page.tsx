'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Save, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function EditDriverPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [form, setForm] = useState({
    name: '',
    license_number: '',
    license_category: '',
    license_expiry_date: '',
    contact_number: '',
    safety_score: '100',
    status: 'Available',
  });

  useEffect(() => {
    if (!id) return;
    const fetchDriver = async () => {
      try {
        const res = await api.get(`/drivers/${id}/`);
        const data = res.data;
        // Format the date for the input type="date"
        let expiryDate = data.license_expiry_date || '';
        if (expiryDate && expiryDate.includes('T')) {
          expiryDate = expiryDate.split('T')[0];
        } else if (expiryDate) {
          try {
            expiryDate = format(new Date(expiryDate), 'yyyy-MM-dd');
          } catch(e) {
            console.error('Date parsing failed', e);
          }
        }

        setForm({
          name: data.name || '',
          license_number: data.license_number || '',
          license_category: data.license_category || '',
          license_expiry_date: expiryDate,
          contact_number: data.contact_number || '',
          safety_score: data.safety_score?.toString() || '100',
          status: data.status || 'Available',
        });
      } catch (err) {
        console.error(err);
        toast.error('Failed to load driver details');
      } finally {
        setFetching(false);
      }
    };
    fetchDriver();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/drivers/${id}/`, form);
      toast.success('Driver updated successfully!');
      router.push('/drivers');
    } catch (err: unknown) {
      const error = err as any;
      toast.error(error.response?.data?.detail || 'Failed to update driver');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/drivers" className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Edit Driver</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Update driver profile details</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center space-x-3 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
              <UserIcon className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Driver Details</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Driver Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">License Number *</label>
              <input type="text" value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} required className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">License Category</label>
              <input type="text" value={form.license_category} onChange={(e) => setForm({ ...form, license_category: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">License Expiry Date *</label>
              <input type="date" value={form.license_expiry_date} onChange={(e) => setForm({ ...form, license_expiry_date: e.target.value })} required className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contact Number</label>
              <input type="text" value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Safety Score</label>
              <input type="number" min="0" max="100" step="0.01" value={form.safety_score} onChange={(e) => setForm({ ...form, safety_score: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500">
                <option value="Available">Available</option>
                <option value="On Trip">On Trip</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4 justify-end">
            <Link href="/drivers" className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg font-medium transition-colors">
              Cancel
            </Link>
            <button 
              type="submit"
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              <Save className="w-5 h-5 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
