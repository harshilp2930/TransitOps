'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plus, Search, Filter, Building2, Phone, MapPin, 
  CreditCard, CheckCircle2, XCircle, Edit2, Save, X, ChevronDown
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface Party {
  id: number;
  name: string;
  party_type: string;
  gstin: string;
  pan: string;
  city: string;
  state: string;
  mobile: string;
  contact_person: string;
  balance: string;
  credit_limit: string;
  credit_days: number;
  is_active: boolean;
  email: string;
  address: string;
  pincode: string;
  mobile2: string;
  notes: string;
}

const PARTY_TYPES = ['Consignor', 'Consignee', 'Transporter', 'Broker'];
const EMPTY_FORM = {
  name: '', party_type: 'Consignor', gstin: '', pan: '',
  address: '', city: '', state: '', pincode: '',
  contact_person: '', mobile: '', mobile2: '', email: '',
  credit_limit: '0', credit_days: '0', notes: '',
};

const partyTypeColors: Record<string, string> = {
  'Consignor': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
  'Consignee': 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20',
  'Transporter': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20',
  'Broker': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
};

export default function PartiesPage() {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [typeFilter, setTypeFilter] = useState('');
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const { hasRole } = useAuth();
  const canEdit = hasRole(['Fleet Manager']);

  const fetchParties = useCallback(async () => {
    try {
      const res = await api.get('/parties/');
      setParties(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParties();
  }, [fetchParties]);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setEditId(null);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (party: Party) => {
    setForm({
      name: party.name, party_type: party.party_type,
      gstin: party.gstin || '', pan: party.pan || '',
      address: party.address || '', city: party.city || '',
      state: party.state || '', pincode: party.pincode || '',
      contact_person: party.contact_person || '',
      mobile: party.mobile || '', mobile2: party.mobile2 || '',
      email: party.email || '', credit_limit: party.credit_limit || '0',
      credit_days: party.credit_days?.toString() || '0', notes: party.notes || '',
    });
    setEditId(party.id);
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError('Name is required.'); return; }
    setSaving(true);
    setFormError('');
    try {
      if (editId) {
        await api.patch(`/parties/${editId}/`, form);
      } else {
        await api.post('/parties/', form);
      }
      await fetchParties();
      setShowForm(false);
    } catch (err: any) {
      setFormError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const filteredParties = parties.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
                          (p.city && p.city.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
                          (p.gstin && p.gstin.toLowerCase().includes(debouncedSearch.toLowerCase()));
    const matchesType = typeFilter ? p.party_type === typeFilter : true;
    return matchesSearch && matchesType;
  });

  // Totals
  const totalReceivable = parties.filter(p => parseFloat(p.balance) > 0).reduce((s, p) => s + parseFloat(p.balance), 0);
  const totalPayable = parties.filter(p => parseFloat(p.balance) < 0).reduce((s, p) => s + Math.abs(parseFloat(p.balance)), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-purple-500" />
            Party Management
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Consignors, Consignees, Transporters & Brokers
          </p>
        </div>
        {canEdit && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            Add Party
          </button>
        )}
      </div>

      {/* Balance KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Parties', value: parties.length, color: 'text-slate-900 dark:text-white', icon: Building2, iconBg: 'bg-slate-100 dark:bg-slate-800' },
          { label: 'Consignors', value: parties.filter(p => p.party_type === 'Consignor').length, color: 'text-blue-600 dark:text-blue-400', icon: Building2, iconBg: 'bg-blue-50 dark:bg-blue-500/10' },
          { label: 'Total Receivable', value: `₹${totalReceivable.toLocaleString('en-IN')}`, color: 'text-green-600 dark:text-green-400', icon: CreditCard, iconBg: 'bg-green-50 dark:bg-green-500/10' },
          { label: 'Total Payable', value: `₹${totalPayable.toLocaleString('en-IN')}`, color: 'text-red-600 dark:text-red-400', icon: CreditCard, iconBg: 'bg-red-50 dark:bg-red-500/10' },
        ].map(card => (
          <div key={card.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${card.iconBg}`}>
                <card.icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{card.label}</span>
            </div>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {/* Filters */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 bg-slate-50 dark:bg-slate-800/30">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, city, GSTIN, mobile..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="relative w-full sm:w-44">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="">All Types</option>
              {PARTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full text-sm text-left text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-4">Party Name</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Location</th>
                  <th className="px-5 py-4">Contact</th>
                  <th className="px-5 py-4">GSTIN</th>
                  <th className="px-5 py-4">Balance</th>
                  {canEdit && <th className="px-5 py-4">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                {filteredParties.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 7 : 6} className="px-5 py-10 text-center text-slate-400">
                      <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p>No parties found. {canEdit && 'Click "Add Party" to create one.'}</p>
                    </td>
                  </tr>
                ) : (
                  filteredParties.map((party: Party) => (
                    <tr key={party.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {party.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{party.name}</p>
                            {party.contact_person && (
                              <p className="text-xs text-slate-500">{party.contact_person}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${partyTypeColors[party.party_type] || 'bg-slate-100 text-slate-600'}`}>
                          {party.party_type}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {party.city ? (
                          <div className="flex items-center gap-1 text-xs">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{party.city}{party.state ? `, ${party.state}` : ''}</span>
                          </div>
                        ) : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-5 py-3">
                        {party.mobile ? (
                          <div className="flex items-center gap-1 text-xs">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {party.mobile}
                          </div>
                        ) : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                          {party.gstin || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {parseFloat(party.balance) !== 0 ? (
                          <span className={`text-sm font-semibold ${parseFloat(party.balance) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {parseFloat(party.balance) > 0 ? '+' : ''}₹{Math.abs(parseFloat(party.balance)).toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Settled</span>
                        )}
                      </td>
                      {canEdit && (
                        <td className="px-5 py-3">
                          <button
                            onClick={() => openEdit(party)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-500" />
                {editId ? 'Edit Party' : 'Add New Party'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {formError && (
                <div className="px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 text-sm rounded-lg">
                  {formError}
                </div>
              )}

              {/* Basic Info */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Basic Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Party Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Ramesh Transport Co."
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Party Type *</label>
                    <select
                      value={form.party_type}
                      onChange={e => setForm({ ...form, party_type: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 appearance-none"
                    >
                      {PARTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Contact Person</label>
                    <input type="text" value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })}
                      placeholder="Name" className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors" />
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Contact Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Mobile</label>
                    <input type="text" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })}
                      placeholder="Primary mobile" className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Mobile 2 (Alt.)</label>
                    <input type="text" value={form.mobile2} onChange={e => setForm({ ...form, mobile2: e.target.value })}
                      placeholder="Secondary mobile" className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Email</label>
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="email@example.com" className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors" />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Address</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Street Address</label>
                    <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                      placeholder="Full address" className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">City</label>
                    <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
                      placeholder="City" className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">State</label>
                    <input type="text" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })}
                      placeholder="State" className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Pincode</label>
                    <input type="text" value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })}
                      placeholder="6-digit pincode" className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors" />
                  </div>
                </div>
              </div>

              {/* GST & Finance */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">GST & Finance</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">GSTIN</label>
                    <input type="text" value={form.gstin} onChange={e => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                      placeholder="15-digit GSTIN" maxLength={15}
                      className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">PAN</label>
                    <input type="text" value={form.pan} onChange={e => setForm({ ...form, pan: e.target.value.toUpperCase() })}
                      placeholder="10-char PAN" maxLength={10}
                      className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Credit Limit (₹)</label>
                    <input type="number" value={form.credit_limit} onChange={e => setForm({ ...form, credit_limit: e.target.value })}
                      min="0" className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Credit Days</label>
                    <input type="number" value={form.credit_days} onChange={e => setForm({ ...form, credit_days: e.target.value })}
                      min="0" className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Notes</label>
                    <input type="text" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                      placeholder="Any additional notes" className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 sticky bottom-0 bg-white dark:bg-slate-900">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {editId ? 'Update Party' : 'Create Party'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
