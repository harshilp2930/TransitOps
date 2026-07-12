'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Save, FileText, IndianRupee, Droplets, Wrench, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function AddTripPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('lr_detail');
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<{id: number; registration_number: string; max_load_capacity_kg?: number}[]>([]);
  const [drivers, setDrivers] = useState<{id: number; name: string}[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const searchParams = useSearchParams();
  const tripIdParam = searchParams ? searchParams.get('tripId') : null;
  const [isEditing, setIsEditing] = useState(false);

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

  // Pump Details State (Multiple)
  const [pumpDetails, setPumpDetails] = useState([{
    id: undefined as number | undefined,
    date: '',
    litres: '',
    cost: '',
    odometer_at_fill: '',
    pump_name: 'HPCL',
  }]);

  // Expense Details State (Multiple)
  const [expenseDetails, setExpenseDetails] = useState([{
    id: undefined as number | undefined,
    date: '',
    category: 'Misc',
    amount: '',
    notes: '',
  }]);

  // Payment Details State (Multiple)
  const [paymentDetails, setPaymentDetails] = useState([{
    id: undefined as number | undefined,
    date: '',
    payment_type: 'Advance',
    amount: '',
    payment_mode: 'Cash',
    reference_no: '',
    remarks: '',
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

  const calculateTotalFreight = () => {
    return lrDetails.reduce((sum, lr) => sum + (parseFloat(lr.total_freight) || 0), 0);
  };

  const calculateTotalDiesel = () => {
    return pumpDetails.reduce((sum, p) => sum + (parseFloat(p.cost) || 0), 0);
  };

  const calculateTotalExpenseDetails = () => {
    return expenseDetails.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  };

  const calculateTotalExpenseCombined = () => {
    return calculateTotalDiesel() + calculateTotalExpenseDetails();
  };

  const calculateNetIncome = () => {
    return calculateTotalFreight() - calculateTotalExpenseCombined();
  };

  const computeRunAndAverage = () => {
    const dep = parseFloat(formData.departure_km as string) || 0;
    const arr = parseFloat(formData.arrival_km as string) || 0;
    const run = (arr && dep) ? (arr - dep) : 0;
    const avg = 0;
    return { run, avg };
  };

  useEffect(() => {
    // eslint-disable-next-line
    fetchLookups();
    // load saved locations from localStorage
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('trip_locations') : null;
      if (stored) setLocations(JSON.parse(stored));
    } catch (e) {
      console.error('failed to load locations', e);
    }
    // if editing via tripId query param, load trip and LR details
    if (tripIdParam) {
      setIsEditing(true);
      (async () => {
        try {
          const res = await api.get(`/trips/${tripIdParam}/`);
          const data = res.data;
          setFormData(prev => ({
            ...prev,
            trip_date: data.trip_date || prev.trip_date,
            trip_code: data.trip_code || prev.trip_code,
            vehicle: data.vehicle ? String(data.vehicle) : prev.vehicle,
            driver: data.driver ? String(data.driver) : prev.driver,
            source: data.source || prev.source,
            destination: data.destination || prev.destination,
            arrival_date: data.arrival_date || (data.completed_at ? data.completed_at.split('T')[0] : prev.arrival_date),
            arrival_km: data.arrival_km ?? data.final_odometer_km ?? prev.arrival_km,
            departure_km: data.departure_km ?? prev.departure_km,
            planned_distance_km: data.planned_distance_km ?? prev.planned_distance_km,
            cargo_weight_kg: data.cargo_weight_kg ?? prev.cargo_weight_kg,
            revenue: data.revenue ?? prev.revenue,
            narration: data.narration || prev.narration,
          }));
          // load LR details (if endpoint exists)
          try {
            const lr = await api.get(`/lr-details/?trip_id=${tripIdParam}`);
            if (lr.data && Array.isArray(lr.data) && lr.data.length) {
              setLrDetails(lr.data.map((r: any) => ({
                lr_number: r.lr_number || '',
                lr_date: r.lr_date || '',
                consignor: r.consignor || '',
                consignee: r.consignee || '',
                from_city: r.from_city || '',
                to_city: r.to_city || '',
                goods_description: r.goods_description || '',
                loading_weight: r.loading_weight ? String(r.loading_weight) : '0',
                unloading_weight: r.unloading_weight ? String(r.unloading_weight) : '0',
                party_rate: r.party_rate ? String(r.party_rate) : '0',
                total_freight: r.total_freight ? String(r.total_freight) : '0',
                shortage_amount: r.shortage_amount ? String(r.shortage_amount) : '0',
                id: r.id,
              })));
            }
          } catch (e) {
            // ignore missing lr endpoint
          }

          // load Pump details
          try {
            const pumpRes = await api.get(`/fuel-logs/?trip=${tripIdParam}`);
            const pumps = pumpRes.data.results || pumpRes.data || [];
            if (pumps.length) {
              setPumpDetails(pumps.map((r: any) => ({
                id: r.id,
                date: r.date || '',
                litres: String(r.litres || ''),
                cost: String(r.cost || ''),
                odometer_at_fill: String(r.odometer_at_fill || ''),
                pump_name: r.pump_name || 'HPCL',
              })));
            }
          } catch (e) {
            console.warn('failed to load fuel logs for trip', e);
          }

          // load Expense details
          try {
            const expRes = await api.get(`/expenses/?trip=${tripIdParam}`);
            const exps = expRes.data.results || expRes.data || [];
            if (exps.length) {
              setExpenseDetails(exps.map((r: any) => ({
                id: r.id,
                date: r.date || '',
                category: r.category || 'Misc',
                amount: String(r.amount || ''),
                notes: r.notes || '',
              })));
            }
          } catch (e) {
            console.warn('failed to load expenses for trip', e);
          }

          // load Payment details
          try {
            const payRes = await api.get(`/payments/?trip=${tripIdParam}`);
            const pays = payRes.data.results || payRes.data || [];
            if (pays.length) {
              setPaymentDetails(pays.map((r: any) => ({
                id: r.id,
                date: r.date || '',
                payment_type: r.payment_type || 'Advance',
                amount: String(r.amount || ''),
                payment_mode: r.payment_mode || 'Cash',
                reference_no: r.reference_no || '',
                remarks: r.remarks || '',
              })));
            }
          } catch (e) {
            console.warn('failed to load payments for trip', e);
          }
        } catch (err) {
          console.error('Failed to load trip for edit', err);
        }
      })();
    }
  }, []);

  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationFor, setLocationFor] = useState<'source' | 'destination'>('source');
  const [locationForm, setLocationForm] = useState({ name: '' });
  const [locationLoading, setLocationLoading] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({ registration_number: '', name_model: '', type: 'Truck', max_load_capacity_kg: '', odometer_km: '0', acquisition_cost: '0', region: '', owner_name: '', account_reference: '', status: 'Available' });
  const [driverForm, setDriverForm] = useState({ name: '', license_number: '', license_category: '', license_expiry_date: '', contact_number: '', safety_score: '100', status: 'Available' });
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [driverLoading, setDriverLoading] = useState(false);
  const createVehicle = async () => {
    setVehicleLoading(true);
    try {
      const res = await api.post('/vehicles/', vehicleForm);
      const v = res.data;
      const newV = { id: v.id, registration_number: v.registration_number || vehicleForm.registration_number };
      setVehicles(prev => [newV, ...prev]);
      setFormData(prev => ({ ...prev, vehicle: String(newV.id) }));
      setShowVehicleModal(false);
      setVehicleForm({ registration_number: '', name_model: '', type: 'Truck', max_load_capacity_kg: '', odometer_km: '0', acquisition_cost: '0', region: '', owner_name: '', account_reference: '', status: 'Available' });
      toast.success('Vehicle added');
    } catch (err: unknown) {
      const error = err as any;
      toast.error(error.response?.data?.registration_number?.[0] || 'Failed to add vehicle');
    } finally {
      setVehicleLoading(false);
    }
  };

  const addLrRow = () => {
    setLrDetails([...lrDetails, {
      lr_number: '', lr_date: '', consignor: '', consignee: '', from_city: '', to_city: '', 
      goods_description: '', loading_weight: '0', unloading_weight: '0', party_rate: '0', 
      total_freight: '0', shortage_amount: '0'
    }]);
  };

  const handleLrChange = (index: number, field: string, value: string) => {
    const newLrs = [...lrDetails];
    (newLrs[index] as any)[field] = value;
    
    if (field === 'loading_weight' || field === 'party_rate') {
      const weight = Number(newLrs[index].loading_weight) || 0;
      const rate = Number(newLrs[index].party_rate) || 0;
      newLrs[index].total_freight = String(weight * rate);
    }
    
    setLrDetails(newLrs);
  };

  const removeLrRow = (index: number) => {
    if (lrDetails.length > 1) {
      const newLrs = [...lrDetails];
      newLrs.splice(index, 1);
      setLrDetails(newLrs);
    }
  };

  const addPumpRow = () => {
    setPumpDetails([...pumpDetails, { id: undefined, date: '', litres: '', cost: '', odometer_at_fill: '', pump_name: 'HPCL' }]);
  };
  const removePumpRow = (index: number) => {
    if (pumpDetails.length > 1) {
      setPumpDetails(pumpDetails.filter((_, i) => i !== index));
    } else {
      setPumpDetails([{ id: undefined, date: '', litres: '', cost: '', odometer_at_fill: '' }]);
    }
  };
  const handlePumpChange = (index: number, field: string, val: string) => {
    const next = [...pumpDetails];
    next[index] = { ...next[index], [field]: val };
    setPumpDetails(next);
  };

  const addExpenseRow = () => {
    setExpenseDetails([...expenseDetails, { id: undefined, date: '', category: 'Misc', amount: '', notes: '' }]);
  };
  const removeExpenseRow = (index: number) => {
    if (expenseDetails.length > 1) {
      setExpenseDetails(expenseDetails.filter((_, i) => i !== index));
    } else {
      setExpenseDetails([{ id: undefined, date: '', category: 'Misc', amount: '', notes: '' }]);
    }
  };
  const handleExpenseChange = (index: number, field: string, val: string) => {
    const next = [...expenseDetails];
    next[index] = { ...next[index], [field]: val };
    setExpenseDetails(next);
  };

  const addPaymentRow = () => {
    setPaymentDetails([...paymentDetails, { id: undefined, date: '', payment_type: 'Advance', amount: '', payment_mode: 'Cash', reference_no: '', remarks: '' }]);
  };
  const removePaymentRow = (index: number) => {
    if (paymentDetails.length > 1) {
      setPaymentDetails(paymentDetails.filter((_, i) => i !== index));
    } else {
      setPaymentDetails([{ id: undefined, date: '', payment_type: 'Advance', amount: '', payment_mode: 'Cash', reference_no: '', remarks: '' }]);
    }
  };
  const handlePaymentChange = (index: number, field: string, val: string) => {
    const next = [...paymentDetails];
    next[index] = { ...next[index], [field]: val };
    setPaymentDetails(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Validation check for weight
      let totalWeight = 0;
      if (lrDetails.length > 0) {
        totalWeight = lrDetails.reduce((sum, lr) => sum + (parseFloat(lr.loading_weight) || 0), 0);
      }
      
      const selectedVehicle = vehicles.find(v => String(v.id) === String(formData.vehicle));
      if (selectedVehicle && selectedVehicle.max_load_capacity_kg) {
        if (totalWeight > selectedVehicle.max_load_capacity_kg) {
          toast.error(`Total weight (${totalWeight} kg) exceeds vehicle capacity (${selectedVehicle.max_load_capacity_kg} kg)`);
          setLoading(false);
          return;
        }
      }

      // 2. Create or update Trip — sanitize types
      const payload = {
        source: formData.source || '',
        destination: formData.destination || '',
        vehicle: formData.vehicle ? Number(formData.vehicle) : null,
        driver: formData.driver ? Number(formData.driver) : null,
        trip_date: formData.trip_date || null,
        arrival_date: formData.arrival_date || null,
        arrival_km: formData.arrival_km ? Number(formData.arrival_km) : null,
        planned_distance_km: formData.planned_distance_km ? Number(formData.planned_distance_km) : 0,
        cargo_weight_kg: totalWeight,
        revenue: Number(calculateTotalFreight()) || 0,
        narration: formData.narration || '',
        planned_eta: formData.planned_eta || null,
        trip_code: formData.trip_code || '',
      };

      if (isEditing && tripIdParam) {
        await api.patch(`/trips/${tripIdParam}/`, payload);
        // smarter LR sync: update existing rows, delete removed ones, create new ones
        try {
          const existingRes = await api.get(`/lr-details/?trip_id=${tripIdParam}`);
          const existing = existingRes.data || [];
          const existingById: Record<string, any> = {};
          for (const r of existing) existingById[String(r.id)] = r;

          // Delete server rows not present in lrDetails (no matching id)
          for (const r of existing) {
            const found = lrDetails.find(l => l.id && String(l.id) === String(r.id));
            if (!found) {
              await api.delete(`/lr-details/${r.id}/`);
            }
          }

          // Upsert local rows
          for (const lr of lrDetails) {
            if (!lr.lr_number) continue;
            const body = {
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
              trip: tripIdParam,
            };
            if (lr.id) {
              await api.patch(`/lr-details/${lr.id}/`, body);
            } else {
              await api.post('/lr-details/', body);
            }
          }
        } catch (e) {
          console.warn('LR sync issue', e);
        }

        // smarter Pump sync
        try {
          const existingPumpRes = await api.get(`/fuel-logs/?trip=${tripIdParam}`);
          const existingPumps = existingPumpRes.data.results || existingPumpRes.data || [];
          for (const p of existingPumps) {
            const found = pumpDetails.find(d => d.id && String(d.id) === String(p.id));
            if (!found) {
              await api.delete(`/fuel-logs/${p.id}/`);
            }
          }
          for (const p of pumpDetails) {
            if (!p.date || !p.litres || !p.cost) continue;
            const body = {
              date: p.date,
              litres: Number(p.litres),
              cost: Number(p.cost),
              odometer_at_fill: p.odometer_at_fill ? Number(p.odometer_at_fill) : 0,
              pump_name: p.pump_name || 'HPCL',
              vehicle: Number(formData.vehicle),
              trip: Number(tripIdParam),
            };
            if (p.id) {
              await api.patch(`/fuel-logs/${p.id}/`, body);
            } else {
              await api.post('/fuel-logs/', body);
            }
          }
        } catch (e) {
          console.warn('Pump sync issue', e);
        }

        // smarter Expense sync
        try {
          const existingExpRes = await api.get(`/expenses/?trip=${tripIdParam}`);
          const existingExps = existingExpRes.data.results || existingExpRes.data || [];
          for (const e of existingExps) {
            const found = expenseDetails.find(d => d.id && String(d.id) === String(e.id));
            if (!found) {
              await api.delete(`/expenses/${e.id}/`);
            }
          }
          for (const e of expenseDetails) {
            if (!e.date || !e.amount) continue;
            const body = {
              date: e.date,
              category: e.category,
              amount: Number(e.amount),
              notes: e.notes || '',
              vehicle: Number(formData.vehicle),
              trip: Number(tripIdParam),
            };
            if (e.id) {
              await api.patch(`/expenses/${e.id}/`, body);
            } else {
              await api.post('/expenses/', body);
            }
          }
        } catch (e) {
          console.warn('Expense sync issue', e);
        }

        // smarter Payment sync
        try {
          const existingPayRes = await api.get(`/payments/?trip=${tripIdParam}`);
          const existingPays = existingPayRes.data.results || existingPayRes.data || [];
          for (const p of existingPays) {
            const found = paymentDetails.find(d => d.id && String(d.id) === String(p.id));
            if (!found) {
              await api.delete(`/payments/${p.id}/`);
            }
          }
          for (const p of paymentDetails) {
            if (!p.date || !p.amount) continue;
            const body = {
              date: p.date,
              payment_type: p.payment_type,
              amount: Number(p.amount),
              payment_mode: p.payment_mode,
              reference_no: p.reference_no || '',
              remarks: p.remarks || '',
              vehicle: Number(formData.vehicle),
              trip: Number(tripIdParam),
            };
            if (p.id) {
              await api.patch(`/payments/${p.id}/`, body);
            } else {
              await api.post('/payments/', body);
            }
          }
        } catch (e) {
          console.warn('Payment sync issue', e);
        }

        toast.success('Trip updated');
        router.push('/trips');
      } else {
        const tripRes = await api.post('/trips/', payload);
        const tripId = tripRes.data.id;
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

        // save Pump details
        for (const p of pumpDetails) {
          if (p.date && p.litres && p.cost) {
            const body = {
              date: p.date,
              litres: Number(p.litres),
              cost: Number(p.cost),
              odometer_at_fill: p.odometer_at_fill ? Number(p.odometer_at_fill) : 0,
              pump_name: p.pump_name || 'HPCL',
              vehicle: Number(formData.vehicle),
              trip: tripId,
            };
            await api.post('/fuel-logs/', body);
          }
        }

        // save Expense details
        for (const e of expenseDetails) {
          if (e.date && e.amount) {
            const body = {
              date: e.date,
              category: e.category,
              amount: Number(e.amount),
              notes: e.notes || '',
              vehicle: Number(formData.vehicle),
              trip: tripId,
            };
            await api.post('/expenses/', body);
          }
        }

        // save Payment details
        for (const p of paymentDetails) {
          if (p.date && p.amount) {
            const body = {
              date: p.date,
              payment_type: p.payment_type,
              amount: Number(p.amount),
              payment_mode: p.payment_mode,
              reference_no: p.reference_no || '',
              remarks: p.remarks || '',
              vehicle: Number(formData.vehicle),
              trip: tripId,
            };
            await api.post('/payments/', body);
          }
        }

        toast.success('Trip and Details saved successfully!');
        router.push('/trips');
      }
    } catch (err: unknown) {
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
      {/* Inline Modals for quick add */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowVehicleModal(false)} />
          <div className="relative bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl p-5 w-full max-w-2xl shadow-lg">
            <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-white">Add Vehicle</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input placeholder="Registration (e.g. MH12AB1234)" value={vehicleForm.registration_number} onChange={e => setVehicleForm({...vehicleForm, registration_number: e.target.value.toUpperCase()})} className="w-full px-3 py-2 border rounded bg-slate-50 dark:bg-slate-800" />
              <input placeholder="Model Name" value={vehicleForm.name_model} onChange={e => setVehicleForm({...vehicleForm, name_model: e.target.value})} className="w-full px-3 py-2 border rounded bg-slate-50 dark:bg-slate-800" />
              <select value={vehicleForm.type} onChange={e => setVehicleForm({...vehicleForm, type: e.target.value})} className="w-full px-3 py-2 border rounded bg-slate-50 dark:bg-slate-800">
                <option>Truck</option>
                <option>Heavy-truck</option>
                <option>Van</option>
                <option>Mini-truck</option>
              </select>
              <input placeholder="Capacity (kg)" value={vehicleForm.max_load_capacity_kg} onChange={e => setVehicleForm({...vehicleForm, max_load_capacity_kg: e.target.value})} type="number" className="w-full px-3 py-2 border rounded bg-slate-50 dark:bg-slate-800" />
              <input placeholder="Initial Odometer (km)" value={vehicleForm.odometer_km} onChange={e => setVehicleForm({...vehicleForm, odometer_km: e.target.value})} type="number" className="w-full px-3 py-2 border rounded bg-slate-50 dark:bg-slate-800" />
              <input placeholder="Owner Name" value={vehicleForm.owner_name} onChange={e => setVehicleForm({...vehicleForm, owner_name: e.target.value})} className="w-full px-3 py-2 border rounded bg-slate-50 dark:bg-slate-800" />
              <input placeholder="Account Reference" value={vehicleForm.account_reference} onChange={e => setVehicleForm({...vehicleForm, account_reference: e.target.value})} className="w-full px-3 py-2 border rounded bg-slate-50 dark:bg-slate-800" />
              <input placeholder="Region" value={vehicleForm.region} onChange={e => setVehicleForm({...vehicleForm, region: e.target.value})} className="w-full px-3 py-2 border rounded bg-slate-50 dark:bg-slate-800" />
              <input placeholder="Acquisition Cost" value={vehicleForm.acquisition_cost} onChange={e => setVehicleForm({...vehicleForm, acquisition_cost: e.target.value})} type="number" className="w-full px-3 py-2 border rounded bg-slate-50 dark:bg-slate-800" />
              <select value={vehicleForm.status} onChange={e => setVehicleForm({...vehicleForm, status: e.target.value})} className="w-full px-3 py-2 border rounded bg-slate-50 dark:bg-slate-800">
                <option>Available</option>
                <option>On Trip</option>
                <option>Maintenance</option>
                <option>Inactive</option>
              </select>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button onClick={() => setShowVehicleModal(false)} className="px-3 py-2 bg-slate-200 dark:bg-slate-700 rounded">Cancel</button>
              <button onClick={createVehicle} disabled={vehicleLoading} className="px-3 py-2 bg-blue-600 text-white rounded">{vehicleLoading ? 'Saving...' : 'Save Vehicle'}</button>
            </div>
          </div>
        </div>
      )}

      {showDriverModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDriverModal(false)} />
          <div className="relative bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl p-5 w-full max-w-2xl shadow-lg">
            <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-white">Add Driver</h3>
            <form onSubmit={e => { e.preventDefault(); createDriver(); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input placeholder="Driver Name" value={driverForm.name} onChange={e => setDriverForm({...driverForm, name: e.target.value})} required className="w-full px-3 py-2 border rounded bg-slate-50 dark:bg-slate-800" />
                <input placeholder="License Number" value={driverForm.license_number} onChange={e => setDriverForm({...driverForm, license_number: e.target.value})} required className="w-full px-3 py-2 border rounded bg-slate-50 dark:bg-slate-800" />
                <input placeholder="License Category" value={driverForm.license_category} onChange={e => setDriverForm({...driverForm, license_category: e.target.value})} className="w-full px-3 py-2 border rounded bg-slate-50 dark:bg-slate-800" />
                <input type="date" placeholder="License Expiry" value={driverForm.license_expiry_date} onChange={e => setDriverForm({...driverForm, license_expiry_date: e.target.value})} className="w-full px-3 py-2 border rounded bg-slate-50 dark:bg-slate-800" />
                <input placeholder="Contact Number" value={driverForm.contact_number} onChange={e => setDriverForm({...driverForm, contact_number: e.target.value})} className="w-full px-3 py-2 border rounded bg-slate-50 dark:bg-slate-800" />
                <input placeholder="Safety Score" value={driverForm.safety_score} onChange={e => setDriverForm({...driverForm, safety_score: e.target.value})} type="number" className="w-full px-3 py-2 border rounded bg-slate-50 dark:bg-slate-800" />
                <select value={driverForm.status} onChange={e => setDriverForm({...driverForm, status: e.target.value})} className="w-full px-3 py-2 border rounded bg-slate-50 dark:bg-slate-800">
                  <option>Available</option>
                  <option>On Trip</option>
                  <option>Suspended</option>
                </select>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button type="button" onClick={() => setShowDriverModal(false)} className="px-3 py-2 bg-slate-200 dark:bg-slate-700 rounded">Cancel</button>
                <button type="submit" disabled={driverLoading} className="px-3 py-2 bg-blue-600 text-white rounded">{driverLoading ? 'Saving...' : 'Save Driver'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowLocationModal(false)} />
          <div className="relative bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl p-5 w-full max-w-md shadow-lg">
            <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-white">Add Location</h3>
            <div className="space-y-3">
              <label className="block text-sm text-slate-500">Name</label>
              <input value={locationForm.name} onChange={e => setLocationForm({ name: e.target.value })} placeholder="Location name" className="w-full px-3 py-2 border rounded bg-slate-50 dark:bg-slate-800" />
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button onClick={() => setShowLocationModal(false)} className="px-3 py-2 bg-slate-200 dark:bg-slate-700 rounded">Cancel</button>
              <button onClick={async () => {
                setLocationLoading(true);
                try {
                  const name = locationForm.name?.trim();
                  if (!name) { toast.error('Name required'); return; }
                  const next = [...locations, name];
                  setLocations(next);
                  try { localStorage.setItem('trip_locations', JSON.stringify(next)); } catch {}
                  if (locationFor === 'source') setFormData(prev => ({...prev, source: name}));
                  else setFormData(prev => ({...prev, destination: name}));
                  setShowLocationModal(false);
                } catch (e) { console.error(e); toast.error('Failed to add location'); }
                finally { setLocationLoading(false); }
              }} disabled={locationLoading} className="px-3 py-2 bg-blue-600 text-white rounded">{locationLoading ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left/Top Area: Core Trip Details */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-3">
                <div>
                  <label className="block text-xs text-slate-500">Trip No.</label>
                  <input value={formData.trip_code} onChange={e => setFormData({...formData, trip_code: e.target.value})} type="text" className="px-2 py-1 border rounded w-28 bg-slate-50 dark:bg-slate-900" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500">Lr No.(O)</label>
                  <div className="px-2 py-1 border rounded w-20 bg-white text-center">{lrDetails.length}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-slate-500 mr-2">Truck</label>
                <select value={formData.vehicle} onChange={e => {
                    const v = e.target.value;
                    if (v === '__add__') { setShowVehicleModal(true); return; }
                    setFormData({...formData, vehicle: v});
                  }} className="px-2 py-1 border rounded bg-slate-50 dark:bg-slate-950">
                  <option value="">Select</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
                  <option value="__add__">+ Add new...</option>
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
                  <select value={formData.vehicle} onChange={e => {
                      const v = e.target.value;
                      if (v === '__add__') { setShowVehicleModal(true); return; }
                      setFormData({...formData, vehicle: v});
                    }} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors">
                    <option value="">Select Vehicle</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
                    <option value="__add__">+ Add new...</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Driver</label>
                  <select value={formData.driver} onChange={e => {
                      const v = e.target.value;
                      if (v === '__add__') { setShowDriverModal(true); return; }
                      setFormData({...formData, driver: v});
                    }} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors">
                    <option value="">Select Driver</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    <option value="__add__">+ Add new...</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Source (From)</label>
                    <select value={formData.source} onChange={e => {
                        const v = e.target.value;
                        if (v === '__add__') {
                          setLocationFor('source');
                          setLocationForm({ name: '' });
                          setShowLocationModal(true);
                          return;
                        }
                        setFormData({...formData, source: v});
                      }} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                    <option value="">Select Source</option>
                    {locations.map((l, i) => <option key={i} value={l}>{l}</option>)}
                    <option value="__add__">+ Add new...</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Destination (To)</label>
                    <select value={formData.destination} onChange={e => {
                        const v = e.target.value;
                        if (v === '__add__') {
                          setLocationFor('destination');
                          setLocationForm({ name: '' });
                          setShowLocationModal(true);
                          return;
                        }
                        setFormData({...formData, destination: v});
                      }} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                    <option value="">Select Destination</option>
                    {locations.map((l, i) => <option key={i} value={l}>{l}</option>)}
                    <option value="__add__">+ Add new...</option>
                  </select>
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
               <span className="font-medium">₹{calculateTotalDiesel().toLocaleString()}</span>
             </div>
             <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
               <span className="text-slate-600 dark:text-slate-400 text-sm">Trip Expense Rs.</span>
               <span className="font-medium">₹{calculateTotalExpenseDetails().toLocaleString()}</span>
             </div>
             <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
               <span className="text-slate-600 dark:text-slate-400 text-sm font-bold">Total Freight Rs.</span>
               <span className="font-bold text-green-600 dark:text-green-400">₹{calculateTotalFreight().toLocaleString()}</span>
             </div>
             <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
               <span className="text-slate-600 dark:text-slate-400 text-sm font-bold text-red-600">Total Expense Rs.</span>
               <span className="font-bold text-red-600 dark:text-red-400">₹{calculateTotalExpenseCombined().toLocaleString()}</span>
             </div>
             <div className="flex justify-between items-center py-2 bg-blue-50 dark:bg-blue-900/20 px-2 rounded-lg">
               <span className="font-bold text-slate-900 dark:text-white">Net Income Rs.</span>
               <span className="font-bold text-blue-600 dark:text-blue-400">₹{calculateNetIncome().toLocaleString()}</span>
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

              {activeTab === 'pump' && (
                <div className="animate-in fade-in duration-300 overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-3 py-3 w-10">#</th>
                        <th className="px-3 py-3">Fueling Date</th>
                        <th className="px-3 py-3">Pump Name</th>
                        <th className="px-3 py-3">Litres</th>
                        <th className="px-3 py-3">Total Cost (Rs.)</th>
                        <th className="px-3 py-3">Odometer At Fill</th>
                        <th className="px-3 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {pumpDetails.map((pump, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="px-3 py-2 text-center text-slate-400">{idx + 1}</td>
                          <td className="px-1 py-1"><input value={pump.date} onChange={e => handlePumpChange(idx, 'date', e.target.value)} type="date" className="w-full p-1.5 border rounded dark:bg-slate-900 dark:border-slate-700 text-xs" /></td>
                          <td className="px-1 py-1">
                            <select value={pump.pump_name} onChange={e => handlePumpChange(idx, 'pump_name', e.target.value)} className="w-full p-1.5 border rounded dark:bg-slate-900 dark:border-slate-700">
                              <option value="HPCL">HPCL</option>
                              <option value="IOCL">IOCL</option>
                              <option value="BPCL">BPCL</option>
                              <option value="Reliance">Reliance</option>
                              <option value="Nayara">Nayara</option>
                              <option value="Shell">Shell</option>
                              <option value="Other">Other</option>
                            </select>
                          </td>
                          <td className="px-1 py-1"><input value={pump.litres} onChange={e => handlePumpChange(idx, 'litres', e.target.value)} type="number" className="w-full p-1.5 border rounded dark:bg-slate-900 dark:border-slate-700" placeholder="e.g. 50" /></td>
                          <td className="px-1 py-1"><input value={pump.cost} onChange={e => handlePumpChange(idx, 'cost', e.target.value)} type="number" className="w-full p-1.5 border rounded dark:bg-slate-900 dark:border-slate-700" placeholder="e.g. 4500" /></td>
                          <td className="px-1 py-1"><input value={pump.odometer_at_fill} onChange={e => handlePumpChange(idx, 'odometer_at_fill', e.target.value)} type="number" className="w-full p-1.5 border rounded dark:bg-slate-900 dark:border-slate-700" placeholder="e.g. 74100" /></td>
                          <td className="px-1 py-1 text-center">
                            <button onClick={() => removePumpRow(idx)} type="button" className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                    <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Records: {pumpDetails.length}</span>
                    <button type="button" onClick={addPumpRow} className="flex items-center text-sm text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-50 dark:hover:bg-blue-500/10 px-3 py-1.5 rounded transition-colors">
                      <Plus className="w-4 h-4 mr-1" /> Add Row
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'expense' && (
                <div className="animate-in fade-in duration-300 overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-3 py-3 w-10">#</th>
                        <th className="px-3 py-3">Expense Date</th>
                        <th className="px-3 py-3">Category</th>
                        <th className="px-3 py-3">Amount (Rs.)</th>
                        <th className="px-3 py-3">Notes/Remarks</th>
                        <th className="px-3 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {expenseDetails.map((exp, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="px-3 py-2 text-center text-slate-400">{idx + 1}</td>
                          <td className="px-1 py-1"><input value={exp.date} onChange={e => handleExpenseChange(idx, 'date', e.target.value)} type="date" className="w-full p-1.5 border rounded dark:bg-slate-900 dark:border-slate-700 text-xs" /></td>
                          <td className="px-1 py-1">
                            <select value={exp.category} onChange={e => handleExpenseChange(idx, 'category', e.target.value)} className="w-full p-1.5 border rounded dark:bg-slate-900 dark:border-slate-700">
                              <option value="Toll">Toll</option>
                              <option value="Misc">Miscellaneous</option>
                              <option value="Other">Other</option>
                            </select>
                          </td>
                          <td className="px-1 py-1"><input value={exp.amount} onChange={e => handleExpenseChange(idx, 'amount', e.target.value)} type="number" className="w-full p-1.5 border rounded dark:bg-slate-900 dark:border-slate-700" placeholder="Amount" /></td>
                          <td className="px-1 py-1"><input value={exp.notes} onChange={e => handleExpenseChange(idx, 'notes', e.target.value)} type="text" className="w-full p-1.5 border rounded dark:bg-slate-900 dark:border-slate-700" placeholder="Remarks" /></td>
                          <td className="px-1 py-1 text-center">
                            <button onClick={() => removeExpenseRow(idx)} type="button" className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                    <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Records: {expenseDetails.length}</span>
                    <button type="button" onClick={addExpenseRow} className="flex items-center text-sm text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-50 dark:hover:bg-blue-500/10 px-3 py-1.5 rounded transition-colors">
                      <Plus className="w-4 h-4 mr-1" /> Add Row
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'payment' && (
                <div className="animate-in fade-in duration-300 overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-3 py-3 w-10">#</th>
                        <th className="px-3 py-3">Payment Date</th>
                        <th className="px-3 py-3">Payment Type</th>
                        <th className="px-3 py-3">Amount (Rs.)</th>
                        <th className="px-3 py-3">Mode</th>
                        <th className="px-3 py-3">Reference No</th>
                        <th className="px-3 py-3">Remarks</th>
                        <th className="px-3 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {paymentDetails.map((pay, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="px-3 py-2 text-center text-slate-400">{idx + 1}</td>
                          <td className="px-1 py-1"><input value={pay.date} onChange={e => handlePaymentChange(idx, 'date', e.target.value)} type="date" className="w-full p-1.5 border rounded dark:bg-slate-900 dark:border-slate-700 text-xs" /></td>
                          <td className="px-1 py-1">
                            <select value={pay.payment_type} onChange={e => handlePaymentChange(idx, 'payment_type', e.target.value)} className="w-full p-1.5 border rounded dark:bg-slate-900 dark:border-slate-700">
                              <option value="Advance">Driver Advance</option>
                              <option value="Balance">Balance Payment</option>
                              <option value="Diesel Advance">Diesel Advance</option>
                              <option value="Other">Other</option>
                            </select>
                          </td>
                          <td className="px-1 py-1"><input value={pay.amount} onChange={e => handlePaymentChange(idx, 'amount', e.target.value)} type="number" className="w-full p-1.5 border rounded dark:bg-slate-900 dark:border-slate-700" placeholder="Amount" /></td>
                          <td className="px-1 py-1">
                            <select value={pay.payment_mode} onChange={e => handlePaymentChange(idx, 'payment_mode', e.target.value)} className="w-full p-1.5 border rounded dark:bg-slate-900 dark:border-slate-700">
                              <option value="Cash">Cash</option>
                              <option value="Bank Transfer">Bank Transfer</option>
                              <option value="GPay/UPI">GPay/UPI</option>
                              <option value="Cheque">Cheque</option>
                            </select>
                          </td>
                          <td className="px-1 py-1"><input value={pay.reference_no} onChange={e => handlePaymentChange(idx, 'reference_no', e.target.value)} type="text" className="w-full p-1.5 border rounded dark:bg-slate-900 dark:border-slate-700" placeholder="Ref No" /></td>
                          <td className="px-1 py-1"><input value={pay.remarks} onChange={e => handlePaymentChange(idx, 'remarks', e.target.value)} type="text" className="w-full p-1.5 border rounded dark:bg-slate-900 dark:border-slate-700" placeholder="Remarks" /></td>
                          <td className="px-1 py-1 text-center">
                            <button onClick={() => removePaymentRow(idx)} type="button" className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                    <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Records: {paymentDetails.length}</span>
                    <button type="button" onClick={addPaymentRow} className="flex items-center text-sm text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-50 dark:hover:bg-blue-500/10 px-3 py-1.5 rounded transition-colors">
                      <Plus className="w-4 h-4 mr-1" /> Add Row
                    </button>
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
