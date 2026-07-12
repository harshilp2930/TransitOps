'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Save, Truck, FileText, ShieldAlert, CreditCard, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

export default function EditVehiclePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState('registration');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Core Fields
  const [formData, setFormData] = useState({
    registration_number: '',
    name_model: '',
    type: 'Truck',
    max_load_capacity_kg: '',
    odometer_km: '0',
    acquisition_cost: '0',
    region: '',
    owner_name: '',
    account_reference: '',
    status: 'Available',
  });

  const [documents, setDocuments] = useState({
    rto_road_tax_date: '',
    rto_permit_no: '',
    rto_permit_date: '',
    rto_national_permit_no: '',
    rto_national_permit_date: '',
    rto_fitness_no: '',
    rto_fitness_date: '',
    puc_no: '',
    puc_date: '',
    insurance_policy_no: '',
    insurance_provider: '',
    insurance_expiry: '',
    finance_emi_amount: '',
    finance_bank: '',
  });

  useEffect(() => {
    if (!id) return;
    const fetchVehicle = async () => {
      try {
        const res = await api.get(`/vehicles/${id}/`);
        const data = res.data;
        setFormData({
          registration_number: data.registration_number || '',
          name_model: data.name_model || '',
          type: data.type || 'Truck',
          max_load_capacity_kg: data.max_load_capacity_kg || '',
          odometer_km: data.odometer_km || '0',
          acquisition_cost: data.acquisition_cost || '0',
          region: data.region || '',
          owner_name: data.owner_name || '',
          account_reference: data.account_reference || '',
          status: data.status || 'Available',
        });
      } catch (err) {
        console.error(err);
        toast.error('Failed to load vehicle details');
      } finally {
        setFetching(false);
      }
    };
    fetchVehicle();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/vehicles/${id}/`, formData);
      toast.success('Vehicle updated successfully!');
      router.push('/vehicles');
    } catch (err: unknown) {
      const error = err as any;
      toast.error(error.response?.data?.registration_number?.[0] || 'Failed to update vehicle');
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
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/vehicles" className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Edit Truck Master</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Update vehicle profile details</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Link href="/vehicles" className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium">
            Cancel
          </Link>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            <Save className="w-5 h-5 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Core Fields */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Primary Details</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Truck No. (Reg)</label>
                <input value={formData.registration_number} onChange={e => setFormData({...formData, registration_number: e.target.value.toUpperCase()})} type="text" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Owner Name</label>
                <input value={formData.owner_name} onChange={e => setFormData({...formData, owner_name: e.target.value})} type="text" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Account Reference</label>
                <input value={formData.account_reference} onChange={e => setFormData({...formData, account_reference: e.target.value})} type="text" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors" />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors">
                    <option>Truck</option>
                    <option>Heavy-truck</option>
                    <option>Van</option>
                    <option>Mini-truck</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Capacity (kg)</label>
                  <input value={formData.max_load_capacity_kg} onChange={e => setFormData({...formData, max_load_capacity_kg: e.target.value})} type="number" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm text-center">
             <div className="w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                <ImageIcon className="w-8 h-8 mb-2 text-blue-500" />
                <span className="text-sm font-medium">Click Here To Upload Image</span>
             </div>
          </div>
        </div>

        {/* Right Column: Tabbed Data Entry */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden h-full">
            {/* Tabs Header */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 overflow-x-auto hide-scrollbar">
              <button onClick={() => setActiveTab('registration')} className={`px-6 py-4 text-sm font-medium flex items-center border-b-2 transition-colors whitespace-nowrap ${activeTab === 'registration' ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                <FileText className="w-4 h-4 mr-2" />
                Registration
              </button>
              <button onClick={() => setActiveTab('rto')} className={`px-6 py-4 text-sm font-medium flex items-center border-b-2 transition-colors whitespace-nowrap ${activeTab === 'rto' ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                <ShieldAlert className="w-4 h-4 mr-2" />
                RTO & Permits
              </button>
              <button onClick={() => setActiveTab('insurance')} className={`px-6 py-4 text-sm font-medium flex items-center border-b-2 transition-colors whitespace-nowrap ${activeTab === 'insurance' ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                <ShieldAlert className="w-4 h-4 mr-2" />
                Insurance
              </button>
              <button onClick={() => setActiveTab('finance')} className={`px-6 py-4 text-sm font-medium flex items-center border-b-2 transition-colors whitespace-nowrap ${activeTab === 'finance' ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                <CreditCard className="w-4 h-4 mr-2" />
                Finance
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-6">
              {activeTab === 'registration' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h4 className="font-medium text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">Registration Details</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Model Name</label>
                      <input value={formData.name_model} onChange={e => setFormData({...formData, name_model: e.target.value})} type="text" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Current Odometer (km)</label>
                      <input value={formData.odometer_km} onChange={e => setFormData({...formData, odometer_km: e.target.value})} type="number" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Region</label>
                      <input value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} type="text" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                      <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors">
                        <option>Available</option>
                        <option>On Trip</option>
                        <option>In Shop</option>
                        <option>Retired</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'rto' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h4 className="font-medium text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">RTO Information</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Road Tax Due Date</label>
                      <input value={documents.rto_road_tax_date} onChange={e => setDocuments({...documents, rto_road_tax_date: e.target.value})} type="date" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">PUC No</label>
                      <input value={documents.puc_no} onChange={e => setDocuments({...documents, puc_no: e.target.value})} type="text" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Permit No.</label>
                      <input value={documents.rto_permit_no} onChange={e => setDocuments({...documents, rto_permit_no: e.target.value})} type="text" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Permit Due Date</label>
                      <input value={documents.rto_permit_date} onChange={e => setDocuments({...documents, rto_permit_date: e.target.value})} type="date" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">National Permit No</label>
                      <input value={documents.rto_national_permit_no} onChange={e => setDocuments({...documents, rto_national_permit_no: e.target.value})} type="text" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">National Permit Due Dt</label>
                      <input value={documents.rto_national_permit_date} onChange={e => setDocuments({...documents, rto_national_permit_date: e.target.value})} type="date" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fitness No.</label>
                      <input value={documents.rto_fitness_no} onChange={e => setDocuments({...documents, rto_fitness_no: e.target.value})} type="text" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fitness Due Date</label>
                      <input value={documents.rto_fitness_date} onChange={e => setDocuments({...documents, rto_fitness_date: e.target.value})} type="date" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'insurance' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                   <h4 className="font-medium text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">Insurance Details</h4>
                   <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Policy Number</label>
                      <input value={documents.insurance_policy_no} onChange={e => setDocuments({...documents, insurance_policy_no: e.target.value})} type="text" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Provider Company</label>
                      <input value={documents.insurance_provider} onChange={e => setDocuments({...documents, insurance_provider: e.target.value})} type="text" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Policy Expiry</label>
                      <input value={documents.insurance_expiry} onChange={e => setDocuments({...documents, insurance_expiry: e.target.value})} type="date" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors" />
                    </div>
                   </div>
                </div>
              )}

              {activeTab === 'finance' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                   <h4 className="font-medium text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">Financial & Acquisition</h4>
                   <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Total Acquisition Cost</label>
                      <input value={formData.acquisition_cost} onChange={e => setFormData({...formData, acquisition_cost: e.target.value})} type="number" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bank / Financer</label>
                      <input value={documents.finance_bank} onChange={e => setDocuments({...documents, finance_bank: e.target.value})} type="text" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Monthly EMI Amount</label>
                      <input value={documents.finance_emi_amount} onChange={e => setDocuments({...documents, finance_emi_amount: e.target.value})} type="number" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors" />
                    </div>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
