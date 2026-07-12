'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Save, FileText, IndianRupee, Droplets, Wrench, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function AddTripPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('lr_detail');
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<{id: number; registration_number: string}[]>([]);
  const [drivers, setDrivers] = useState<{id: number; name: string}[]>([]);

  // Core Trip Fields
  const [formData, setFormData] = useState({
    trip_date: '',
    trip_code: '',
    vehicle: '',
    driver: '',
    source: '',
    destination: '',
    arrival_date: '',
    arrival_km: '',
    departure_km: '',
    run_km: '',
    average_kmpl: '',
    planned_distance_km: '0',
    cargo_weight_kg: '0',
    revenue: '0',
    narration: '',
  });

  // LR Details State (Multiple)
  const [lrDetails, setLrDetails] = useState([{
    lr_number: '',
    lr_date: '',
    consignor: '',
    consignee: '',
    from_city: '',
    to_city: '',
    goods_description: '',
    loading_weight: '0',
    unloading_weight: '0',
    party_rate: '0',
    total_freight: '0',
    shortage_amount: '0'
  }]);

  const fetchLookups = async () => {
    try {
      const [vRes, dRes] = await Promise.all([
        api.get('/vehicles/'),
        api.get('/drivers/')
      ]);
      setVehicles(vRes.data.results || vRes.data);
      setDrivers(dRes.data.results || dRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line
    fetchLookups();
  }, []);



  const calculateTotalFreight = () => {
    return lrDetails.reduce((sum, lr) => sum + (parseFloat(lr.total_freight) || 0), 0);
  };

  const computeRunAndAverage = () => {
    const dep = parseFloat(formData.departure_km as string) || 0;
    const arr = parseFloat(formData.arrival_km as string) || 0;
    const run = (arr && dep) ? (arr - dep) : 0;
    const avg = 0; // average depends on fuel consumed at completion; left blank
    return { run, avg };
  };

  const handleLrChange = (index: number, field: string, value: string) => {
    const newLrs = [...lrDetails];
    (newLrs[index] as Record<string, string>)[field] = value;
    
    // Auto calculate freight = weight * rate
    if (field === 'loading_weight' || field === 'party_rate') {
       const wt = parseFloat(newLrs[index].loading_weight) || 0;
       const rate = parseFloat(newLrs[index].party_rate) || 0;
       newLrs[index].total_freight = (wt * rate).toString();
    }
    
    setLrDetails(newLrs);
  };

  const addLrRow = () => {
    setLrDetails([...lrDetails, {
      lr_number: '', lr_date: '', consignor: '', consignee: '', from_city: '', to_city: '', 
      goods_description: '', loading_weight: '0', unloading_weight: '0', party_rate: '0', 
      total_freight: '0', shortage_amount: '0'
    }]);
  };

  const removeLrRow = (index: number) => {
    if (lrDetails.length > 1) {
      const newLrs = [...lrDetails];
      newLrs.splice(index, 1);
      setLrDetails(newLrs);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Create Trip — sanitize types: send null for empty, numbers for numeric fields
      const payload = {
        source: formData.source || '',
        destination: formData.destination || '',
        vehicle: formData.vehicle ? Number(formData.vehicle) : null,
        driver: formData.driver ? Number(formData.driver) : null,
        trip_date: formData.trip_date || null,
        arrival_date: formData.arrival_date || null,
        arrival_km: formData.arrival_km ? Number(formData.arrival_km) : null,
        planned_distance_km: formData.planned_distance_km ? Number(formData.planned_distance_km) : 0,
        cargo_weight_kg: formData.cargo_weight_kg ? Number(formData.cargo_weight_kg) : 0,
        revenue: Number(calculateTotalFreight()) || 0,
        narration: formData.narration || '',
        planned_eta: formData.planned_eta || null,
      };
      const tripRes = await api.post('/trips/', payload);
      const tripId = tripRes.data.id;
      
      // 2. Create LR Details
      for (const lr of lrDetails) {
        if (lr.lr_number) {
          const lrPayload = {
            lr_number: lr.lr_number,
            lr_date: lr.lr_date || null,
            consignor: lr.consignor || '',
            consignee: lr.consignee || '',
            from_city: lr.from_city || '',
            to_city: lr.to_city || '',
            goods_description: lr.goods_description || '',
            loading_weight: lr.loading_weight ? Number(lr.loading_weight) : 0,
            unloading_weight: lr.unloading_weight ? Number(lr.unloading_weight) : 0,
            party_rate: lr.party_rate ? Number(lr.party_rate) : 0,
            total_freight: lr.total_freight ? Number(lr.total_freight) : 0,
            shortage_amount: lr.shortage_amount ? Number(lr.shortage_amount) : 0,
            trip: tripId,
          };
          await api.post('/trips/lr-details/', lrPayload);
        }
      }
      
      toast.success('Trip and LR Details saved successfully!');
      router.push('/trips');
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      toast.error('Failed to save trip. Check fields.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/trips" className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Add Trip Entry</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Create a comprehensive trip profile and load details</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => window.print()} className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium">Print</button>
          <Link href="/trips" className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium">
            Cancel
          </Link>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            <Save className="w-5 h-5 mr-2" />
            {loading ? 'Saving...' : 'Save & Close'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left/Top Area: Core Trip Details */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-3">
                <div>
                  <label className="block text-xs text-slate-500">Trip No.</label>
                  <input value={formData.trip_code} readOnly type="text" className="px-2 py-1 border rounded w-28 bg-slate-50 dark:bg-slate-900" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500">Lr No.(O)</label>
                  <div className="px-2 py-1 border rounded w-20 bg-white text-center">{lrDetails.length}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-slate-500 mr-2">Truck</label>
                <select value={formData.vehicle} onChange={e => setFormData({...formData, vehicle: e.target.value})} className="px-2 py-1 border rounded bg-slate-50 dark:bg-slate-950">
                  <option value="">Select</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
                </select>
                <button type="button" onClick={async () => {
                  if (!formData.vehicle) return;
                  try {
                    const v = await api.get(`/vehicles/${formData.vehicle}/`);
                    const od = (v.data.odometer_km ?? v.data.odometer) || 0;
                    setFormData(prev => ({...prev, departure_km: od?.toString() ?? ''}));
                  } catch (e) { console.error(e); }
                }} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 border rounded">Get</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Trip Date</label>
                  <input value={formData.trip_date} onChange={e => setFormData({...formData, trip_date: e.target.value})} type="date" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dept. Km</label>
                  <input value={formData.departure_km} onChange={e => setFormData({...formData, departure_km: e.target.value})} type="number" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vehicle</label>
                  <select value={formData.vehicle} onChange={e => setFormData({...formData, vehicle: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors">
                    <option value="">Select Vehicle</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Driver</label>
                  <select value={formData.driver} onChange={e => setFormData({...formData, driver: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors">
                    <option value="">Select Driver</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Source (From)</label>
                  <input value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} type="text" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Destination (To)</label>
                  <input value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})} type="text" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Planned Distance (Km)</label>
                  <input value={formData.planned_distance_km} onChange={e => setFormData({...formData, planned_distance_km: e.target.value})} type="number" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Arrival Date</label>
                  <input value={formData.arrival_date} onChange={e => setFormData({...formData, arrival_date: e.target.value})} type="date" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Arrival Km</label>
                  <input value={formData.arrival_km} onChange={e => setFormData({...formData, arrival_km: e.target.value})} type="number" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Run</label>
                  <input readOnly value={(() => { const r = computeRunAndAverage().run; return r ? r.toFixed(2) : ''; })()} type="text" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg" />
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Narration</label>
              <textarea value={formData.narration} onChange={e => setFormData({...formData, narration: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors h-20"></textarea>
            </div>
          </div>
        </div>

        {/* Right Area: Financial Rollup */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
             <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">Financials</h3>
             
             <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
               <span className="text-slate-600 dark:text-slate-400 text-sm">Total Diesel Rs.</span>
               <span className="font-medium">0.00</span>
             </div>
             <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
               <span className="text-slate-600 dark:text-slate-400 text-sm">Trip Expense Rs.</span>
               <span className="font-medium">0.00</span>
             </div>
             <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
               <span className="text-slate-600 dark:text-slate-400 text-sm font-bold">Total Freight Rs.</span>
               <span className="font-bold text-green-600 dark:text-green-400">₹{calculateTotalFreight().toLocaleString()}</span>
             </div>
             <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
               <span className="text-slate-600 dark:text-slate-400 text-sm">Total Expense Rs.</span>
               <span className="font-medium text-red-600 dark:text-red-400">0.00</span>
             </div>
             <div className="flex justify-between items-center py-2 bg-blue-50 dark:bg-blue-900/20 px-2 rounded-lg">
               <span className="font-bold text-slate-900 dark:text-white">Net Income Rs.</span>
               <span className="font-bold text-blue-600 dark:text-blue-400">₹{calculateTotalFreight().toLocaleString()}</span>
             </div>
          </div>
        </div>

        {/* Bottom Area: Tabs for Details */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden min-h-[400px]">
            {/* Tabs Header */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 overflow-x-auto hide-scrollbar">
              <button onClick={() => setActiveTab('lr_detail')} className={`px-6 py-4 text-sm font-medium flex items-center border-b-2 transition-colors whitespace-nowrap ${activeTab === 'lr_detail' ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                <FileText className="w-4 h-4 mr-2" />
                LR Detail
              </button>
              <button onClick={() => setActiveTab('pump')} className={`px-6 py-4 text-sm font-medium flex items-center border-b-2 transition-colors whitespace-nowrap ${activeTab === 'pump' ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                <Droplets className="w-4 h-4 mr-2" />
                Pump Detail
              </button>
              <button onClick={() => setActiveTab('expense')} className={`px-6 py-4 text-sm font-medium flex items-center border-b-2 transition-colors whitespace-nowrap ${activeTab === 'expense' ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                <Wrench className="w-4 h-4 mr-2" />
                Expense Detail
              </button>
              <button onClick={() => setActiveTab('payment')} className={`px-6 py-4 text-sm font-medium flex items-center border-b-2 transition-colors whitespace-nowrap ${activeTab === 'payment' ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                <IndianRupee className="w-4 h-4 mr-2" />
                Payment Detail
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-0">
              {activeTab === 'lr_detail' && (
                <div className="animate-in fade-in duration-300 overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-3 py-3 w-10">#</th>
                        <th className="px-3 py-3">LrNo</th>
                        <th className="px-3 py-3">Lr Date</th>
                        <th className="px-3 py-3">Consignor</th>
                        <th className="px-3 py-3">Consignee</th>
                        <th className="px-3 py-3">From</th>
                        <th className="px-3 py-3">To</th>
                        <th className="px-3 py-3">L. Weight</th>
                        <th className="px-3 py-3">Rate</th>
                        <th className="px-3 py-3">Total Freight</th>
                        <th className="px-3 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {lrDetails.map((lr, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="px-3 py-2 text-center text-slate-400">{idx + 1}</td>
                          <td className="px-1 py-1"><input value={lr.lr_number} onChange={e => handleLrChange(idx, 'lr_number', e.target.value)} type="text" className="w-full p-1.5 border rounded dark:bg-slate-900 dark:border-slate-700" /></td>
                          <td className="px-1 py-1"><input value={lr.lr_date} onChange={e => handleLrChange(idx, 'lr_date', e.target.value)} type="date" className="w-full p-1.5 border rounded dark:bg-slate-900 dark:border-slate-700 text-xs" /></td>
                          <td className="px-1 py-1"><input value={lr.consignor} onChange={e => handleLrChange(idx, 'consignor', e.target.value)} type="text" className="w-full p-1.5 border rounded dark:bg-slate-900 dark:border-slate-700" /></td>
                          <td className="px-1 py-1"><input value={lr.consignee} onChange={e => handleLrChange(idx, 'consignee', e.target.value)} type="text" className="w-full p-1.5 border rounded dark:bg-slate-900 dark:border-slate-700" /></td>
                          <td className="px-1 py-1"><input value={lr.from_city} onChange={e => handleLrChange(idx, 'from_city', e.target.value)} type="text" className="w-full p-1.5 border rounded dark:bg-slate-900 dark:border-slate-700" /></td>
                          <td className="px-1 py-1"><input value={lr.to_city} onChange={e => handleLrChange(idx, 'to_city', e.target.value)} type="text" className="w-full p-1.5 border rounded dark:bg-slate-900 dark:border-slate-700" /></td>
                          <td className="px-1 py-1"><input value={lr.loading_weight} onChange={e => handleLrChange(idx, 'loading_weight', e.target.value)} type="number" className="w-20 p-1.5 border rounded dark:bg-slate-900 dark:border-slate-700 text-right" /></td>
                          <td className="px-1 py-1"><input value={lr.party_rate} onChange={e => handleLrChange(idx, 'party_rate', e.target.value)} type="number" className="w-20 p-1.5 border rounded dark:bg-slate-900 dark:border-slate-700 text-right" /></td>
                          <td className="px-1 py-1"><input readOnly value={lr.total_freight} type="number" className="w-24 p-1.5 border rounded bg-slate-100 dark:bg-slate-800 dark:border-slate-700 text-right font-medium" /></td>
                          <td className="px-1 py-1 text-center">
                            <button onClick={() => removeLrRow(idx)} type="button" className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                    <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Records: {lrDetails.length}</span>
                    <button type="button" onClick={addLrRow} className="flex items-center text-sm text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-50 dark:hover:bg-blue-500/10 px-3 py-1.5 rounded transition-colors">
                      <Plus className="w-4 h-4 mr-1" /> Add Row
                    </button>
                  </div>
                </div>
              )}

              {activeTab !== 'lr_detail' && (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center h-64">
                   <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                     <Wrench className="w-8 h-8 text-slate-400" />
                   </div>
                   <p>This tab is currently under construction for the demo.</p>
                   <p className="text-sm mt-1">Full ERP functionality will load actual records here.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
