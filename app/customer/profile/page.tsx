'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Lock } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { createClient } from '@/lib/supabase/client';
import type { User as UserType, CustomerAddress } from '@/types/database';

export default function ProfilePage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data: userData } = await supabase.from('users').select('*').single();
      if (userData) {
        setUser(userData as UserType);
        setForm({ full_name: userData.full_name, phone: userData.phone || '' });
      }
      const { data: addrs } = await supabase
        .from('customer_addresses')
        .select('*, delivery_zone:delivery_zones(name)')
        .order('created_at', { ascending: false });
      setAddresses(addrs as CustomerAddress[] || []);
      setLoading(false);
    }
    fetchData();
  }, []);

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

  if (loading) return <PageLoader />;
  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile & Settings</h1>

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
                <input
                  type="text" value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none"
                />
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
        <h3 className="font-semibold text-gray-900 mb-4">Saved Addresses</h3>
        {addresses.length === 0 ? (
          <p className="text-sm text-gray-500">No saved addresses yet.</p>
        ) : (
          <div className="space-y-3">
            {addresses.map(addr => (
              <div key={addr.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <MapPin className="w-4 h-4 text-brand-green mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{addr.address_line1}</p>
                  {addr.address_line2 && <p className="text-xs text-gray-600">{addr.address_line2}</p>}
                  <p className="text-xs text-gray-500">
                    {addr.city} - {addr.pincode} | Zone: {addr.delivery_zone?.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment history link */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold text-gray-900 mb-2">Account</h3>
        <div className="space-y-2">
          <button className="flex items-center gap-3 w-full p-3 text-left hover:bg-gray-50 rounded-lg text-sm">
            <Lock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-700">Change Password</span>
          </button>
        </div>
      </div>
    </div>
  );
}
