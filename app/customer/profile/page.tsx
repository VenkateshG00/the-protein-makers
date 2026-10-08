'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Lock, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/lib/utils/format';
import { createClient } from '@/lib/supabase/client';
import type { User as UserType, CustomerAddress, PincodeDeliveryCharge } from '@/types/database';

const emptyAddr = {
  address_line1: '',
  address_line2: '',
  landmark: '',
  city: 'Hyderabad',
  pincode: '',
  is_default: false,
};

export default function ProfilePage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [addrModal, setAddrModal] = useState(false);
  const [editingAddr, setEditingAddr] = useState<CustomerAddress | null>(null);
  const [addrForm, setAddrForm] = useState(emptyAddr);
  const [addrSaving, setAddrSaving] = useState(false);
  const [pincodeInfo, setPincodeInfo] = useState<PincodeDeliveryCharge | null>(null);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const { showToast } = useToast();

  async function fetchData() {
    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { setLoading(false); return; }

    const { data: userData } = await supabase.from('users').select('*').eq('id', authUser.id).single();
    if (userData) {
      setUser(userData as UserType);
      setForm({ full_name: userData.full_name, phone: userData.phone || '' });
    }
    const { data: addrs } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false });
    setAddresses((addrs as CustomerAddress[]) || []);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  async function lookupPincode(pincode: string) {
    if (pincode.length !== 6) {
      setPincodeInfo(null);
      return;
    }
    setPincodeLoading(true);
    const res = await fetch(`/api/delivery-charge?pincode=${pincode}`);
    const data = await res.json();
    setPincodeInfo(data);
    setPincodeLoading(false);
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('users')
      .update({ full_name: form.full_name, phone: form.phone })
      .eq('id', user.id);
    if (error) {
      showToast('Failed to update profile', 'error');
    } else {
      showToast('Profile updated');
      setEditing(false);
      setUser(prev => prev ? { ...prev, ...form } : null);
    }
    setSaving(false);
  }

  function openAddAddr() {
    setEditingAddr(null);
    setAddrForm({ ...emptyAddr });
    setPincodeInfo(null);
    setAddrModal(true);
  }

  function openEditAddr(addr: CustomerAddress) {
    setEditingAddr(addr);
    setAddrForm({
      address_line1: addr.address_line1,
      address_line2: addr.address_line2 || '',
      landmark: addr.landmark || '',
      city: addr.city,
      pincode: addr.pincode,
      is_default: addr.is_default,
    });
    setPincodeInfo({
      pincode: addr.pincode,
      area_name: '',
      distance_tier: '',
      delivery_charge: addr.delivery_charge,
      is_serviceable: true,
    });
    setAddrModal(true);
    lookupPincode(addr.pincode);
  }

  async function handleAddrSave(e: React.FormEvent) {
    e.preventDefault();
    if (!pincodeInfo) {
      showToast('Please enter a valid pincode', 'error');
      return;
    }
    if (!pincodeInfo.is_serviceable) {
      showToast('Delivery not available in this area', 'error');
      return;
    }
    setAddrSaving(true);
    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const payload = {
      ...addrForm,
      user_id: authUser.id,
      delivery_charge: pincodeInfo.delivery_charge,
    };

    if (editingAddr) {
      const { error } = await supabase.from('customer_addresses').update(payload).eq('id', editingAddr.id);
      if (error) { showToast('Failed to update address', 'error'); }
      else { showToast('Address updated'); }
    } else {
      const { error } = await supabase.from('customer_addresses').insert(payload);
      if (error) { showToast('Failed to add address', 'error'); }
      else { showToast('Address added'); }
    }
    setAddrSaving(false);
    setAddrModal(false);
    fetchData();
  }

  async function handleDeleteAddr(id: string) {
    if (!confirm('Delete this address?')) return;
    const supabase = createClient();
    await supabase.from('customer_addresses').delete().eq('id', id);
    showToast('Address deleted');
    fetchData();
  }

  if (loading) return <PageLoader />;
  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile & Settings</h1>

      {/* Profile card */}
      <div className="bg-white rounded-xl border overflow-hidden mb-6">
        <div className="p-6 bg-gradient-to-r from-brand-green-dark to-brand-green text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{user.full_name}</h2>
              <p className="text-green-200 text-sm">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {editing ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{user.phone || 'Not set'}</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => setEditing(true)}>Edit Profile</Button>
            </>
          )}
        </div>
      </div>

      {/* Addresses */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Saved Addresses</h3>
          <Button size="sm" onClick={openAddAddr}>
            <Plus className="w-4 h-4 mr-1" /> Add Address
          </Button>
        </div>
        {addresses.length === 0 ? (
          <p className="text-sm text-gray-500">No saved addresses yet. Add one to get started.</p>
        ) : (
          <div className="space-y-3">
            {addresses.map(addr => (
              <div key={addr.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-brand-green mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{addr.address_line1}</p>
                    {addr.address_line2 && <p className="text-xs text-gray-600">{addr.address_line2}</p>}
                    {addr.landmark && <p className="text-xs text-gray-500">Near: {addr.landmark}</p>}
                    <p className="text-xs text-gray-500">{addr.city} - {addr.pincode}</p>
                    <p className="text-xs text-brand-green font-medium mt-0.5">
                      Delivery: {formatCurrency(addr.delivery_charge)}/order
                    </p>
                    {addr.is_default && (
                      <span className="text-[10px] bg-brand-green text-white px-2 py-0.5 rounded-full mt-1 inline-block">Default</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEditAddr(addr)} className="p-1.5 text-gray-400 hover:text-brand-green rounded">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeleteAddr(addr.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Account */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold text-gray-900 mb-2">Account</h3>
        <button className="flex items-center gap-3 w-full p-3 text-left hover:bg-gray-50 rounded-lg text-sm">
          <Lock className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700">Change Password</span>
        </button>
      </div>

      {/* Address Modal */}
      <Modal isOpen={addrModal} onClose={() => setAddrModal(false)} title={editingAddr ? 'Edit Address' : 'Add Address'}>
        <form onSubmit={handleAddrSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
            <input type="text" required value={addrForm.address_line1}
              onChange={e => setAddrForm(f => ({ ...f, address_line1: e.target.value }))}
              placeholder="House/flat number, building, street"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
            <input type="text" value={addrForm.address_line2}
              onChange={e => setAddrForm(f => ({ ...f, address_line2: e.target.value }))}
              placeholder="Area, colony (optional)"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Landmark</label>
            <input type="text" value={addrForm.landmark}
              onChange={e => setAddrForm(f => ({ ...f, landmark: e.target.value }))}
              placeholder="Near... (optional)"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input type="text" value={addrForm.city}
                onChange={e => setAddrForm(f => ({ ...f, city: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
              <input type="text" required value={addrForm.pincode}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setAddrForm(f => ({ ...f, pincode: val }));
                  if (val.length === 6) lookupPincode(val);
                  else setPincodeInfo(null);
                }}
                placeholder="500084"
                maxLength={6}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none" />
            </div>
          </div>

          {/* Auto-calculated delivery info */}
          {pincodeLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin" /> Checking delivery availability...
            </div>
          )}
          {pincodeInfo && !pincodeLoading && (
            <div className={`p-3 rounded-lg text-sm ${pincodeInfo.is_serviceable ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {pincodeInfo.is_serviceable ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-800">
                      {pincodeInfo.area_name} ({pincodeInfo.distance_tier})
                    </p>
                    <p className="text-green-600 text-xs">Delivery available in your area</p>
                  </div>
                  <p className="font-bold text-green-800">{formatCurrency(pincodeInfo.delivery_charge)}/order</p>
                </div>
              ) : (
                <p className="text-red-700 font-medium">
                  Sorry, delivery is not available in this area yet.
                </p>
              )}
            </div>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={addrForm.is_default}
              onChange={e => setAddrForm(f => ({ ...f, is_default: e.target.checked }))}
              className="rounded border-gray-300" />
            Set as default address
          </label>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={addrSaving || !pincodeInfo?.is_serviceable}>
              {addrSaving ? 'Saving...' : editingAddr ? 'Update' : 'Add Address'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setAddrModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
