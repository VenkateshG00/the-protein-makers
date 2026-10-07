'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/lib/utils/format';
import { createClient } from '@/lib/supabase/client';

interface PincodeCharge {
  id: string;
  pincode: string;
  area_name: string;
  distance_tier: string;
  delivery_charge: number;
  is_serviceable: boolean;
}

const tiers = ['0-5 km', '5-9 km', '9-15 km', '15+ km'];

const emptyForm = {
  pincode: '',
  area_name: '',
  distance_tier: '0-5 km',
  delivery_charge: 100,
  is_serviceable: true,
};

export default function DeliveryChargesPage() {
  const [charges, setCharges] = useState<PincodeCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PincodeCharge | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  async function fetchData() {
    const supabase = createClient();
    const { data } = await supabase
      .from('pincode_delivery_charges')
      .select('*')
      .order('distance_tier, area_name');
    setCharges((data as PincodeCharge[]) || []);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  }

  function openEdit(item: PincodeCharge) {
    setEditing(item);
    setForm({
      pincode: item.pincode,
      area_name: item.area_name,
      distance_tier: item.distance_tier,
      delivery_charge: item.delivery_charge,
      is_serviceable: item.is_serviceable,
    });
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();

    if (editing) {
      const { error } = await supabase.from('pincode_delivery_charges').update(form).eq('id', editing.id);
      if (error) showToast(error.message, 'error');
      else showToast('Updated');
    } else {
      const { error } = await supabase.from('pincode_delivery_charges').insert(form);
      if (error) showToast(error.message, 'error');
      else showToast('Pincode added');
    }
    setSaving(false);
    setModalOpen(false);
    fetchData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this pincode entry?')) return;
    const supabase = createClient();
    await supabase.from('pincode_delivery_charges').delete().eq('id', id);
    showToast('Deleted');
    fetchData();
  }

  if (loading) return <PageLoader />;

  const grouped = tiers.map(tier => ({
    tier,
    items: charges.filter(c => c.distance_tier === tier),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Charges</h1>
          <p className="text-sm text-gray-500 mt-1">Pincode-based delivery pricing ({charges.length} pincodes)</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Add Pincode
        </Button>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-sm text-yellow-800">
        <strong>Default:</strong> Any pincode not listed here will be charged <strong>{formatCurrency(300)}/order</strong> (15+ km rate).
      </div>

      <div className="space-y-6">
        {grouped.map(group => (
          <div key={group.tier}>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-green" /> {group.tier}
            </h3>
            {group.items.length === 0 ? (
              <p className="text-sm text-gray-400 ml-6">No pincodes in this tier</p>
            ) : (
              <div className="bg-white rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Pincode</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Area</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Charge/Order</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Status</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {group.items.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-mono font-medium text-gray-900">{item.pincode}</td>
                        <td className="px-4 py-2 text-gray-700">{item.area_name}</td>
                        <td className="px-4 py-2 font-semibold text-brand-green">{formatCurrency(item.delivery_charge)}</td>
                        <td className="px-4 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${item.is_serviceable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {item.is_serviceable ? 'Active' : 'Not Serviceable'}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-1">
                            <button onClick={() => openEdit(item)} className="p-1.5 hover:bg-gray-100 rounded">
                              <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                            </button>
                            <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-gray-100 rounded">
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Pincode' : 'Add Pincode'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
              <input type="text" required value={form.pincode}
                onChange={e => setForm(f => ({ ...f, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none"
                placeholder="500084" maxLength={6} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area Name *</label>
              <input type="text" required value={form.area_name}
                onChange={e => setForm(f => ({ ...f, area_name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none"
                placeholder="Kondapur" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Distance Tier</label>
              <select value={form.distance_tier}
                onChange={e => setForm(f => ({ ...f, distance_tier: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none">
                {tiers.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Charge/Order (₹)</label>
              <input type="number" required min={0} value={form.delivery_charge}
                onChange={e => setForm(f => ({ ...f, delivery_charge: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_serviceable}
              onChange={e => setForm(f => ({ ...f, is_serviceable: e.target.checked }))}
              className="rounded border-gray-300" />
            Delivery available (serviceable)
          </label>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Add'}</Button>
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
