'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';
import { format } from 'date-fns';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/lib/utils/format';
import EmptyState from '@/components/ui/EmptyState';
import { Ticket } from 'lucide-react';
import type { Coupon } from '@/types/database';

const emptyForm = {
  code: '',
  discount_type: 'percentage' as 'percentage' | 'fixed',
  discount_value: 10,
  min_order_amount: 0,
  max_uses: 0,
  valid_from: format(new Date(), 'yyyy-MM-dd'),
  valid_until: '',
  is_active: true,
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  async function fetchData() {
    const res = await fetch('/api/coupons');
    const data = await res.json();
    setCoupons(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, valid_until: '' });
    setModalOpen(true);
  }

  function openEdit(coupon: Coupon) {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      discount_type: coupon.discount_type as 'percentage' | 'fixed',
      discount_value: coupon.discount_value,
      min_order_amount: coupon.min_order_amount || 0,
      max_uses: coupon.max_uses || 0,
      valid_from: coupon.valid_from,
      valid_until: coupon.valid_until,
      is_active: coupon.is_active,
    });
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const method = editing ? 'PUT' : 'POST';
    const body = editing ? { id: editing.id, ...form } : form;
    if (!form.min_order_amount) (body as Record<string, unknown>).min_order_amount = null;
    if (!form.max_uses) (body as Record<string, unknown>).max_uses = null;

    const res = await fetch('/api/coupons', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      showToast(editing ? 'Coupon updated' : 'Coupon created');
      setModalOpen(false);
      fetchData();
    } else {
      const err = await res.json();
      showToast(err.error || 'Something went wrong', 'error');
    }
    setSaving(false);
  }

  async function toggleActive(coupon: Coupon) {
    await fetch('/api/coupons', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: coupon.id, is_active: !coupon.is_active }),
    });
    showToast(`Coupon ${coupon.is_active ? 'deactivated' : 'activated'}`);
    fetchData();
  }

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
          <p className="text-sm text-gray-500 mt-1">{coupons.length} coupons</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Add Coupon
        </Button>
      </div>

      {coupons.length === 0 ? (
        <EmptyState icon={Ticket} title="No coupons" description="Create your first coupon code." />
      ) : (
        <div className="bg-white rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Code</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Discount</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Min Order</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Usage</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Valid</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {coupons.map(coupon => {
                const today = new Date().toISOString().split('T')[0];
                const isExpired = coupon.valid_until < today;
                return (
                  <tr key={coupon.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-bold text-brand-green">{coupon.code}</td>
                    <td className="px-4 py-3 text-gray-900">
                      {coupon.discount_type === 'percentage'
                        ? `${coupon.discount_value}%`
                        : formatCurrency(coupon.discount_value)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {coupon.min_order_amount ? formatCurrency(coupon.min_order_amount) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {coupon.used_count}{coupon.max_uses ? ` / ${coupon.max_uses}` : ' / ∞'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {format(new Date(coupon.valid_from), 'dd MMM')} — {format(new Date(coupon.valid_until), 'dd MMM yyyy')}
                      {isExpired && <span className="text-red-500 ml-1">(expired)</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={coupon.is_active ? 'active' : 'inactive'} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(coupon)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </button>
                        <button onClick={() => toggleActive(coupon)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                          {coupon.is_active ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Coupon' : 'Add Coupon'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code *</label>
              <input
                type="text" required value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none font-mono"
                placeholder="PROTEIN20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
              <select
                value={form.discount_type}
                onChange={e => setForm(f => ({ ...f, discount_type: e.target.value as typeof form.discount_type }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount Value {form.discount_type === 'percentage' ? '(%)' : '(₹)'}
              </label>
              <input
                type="number" required min={0} step={form.discount_type === 'percentage' ? 1 : 0.01}
                max={form.discount_type === 'percentage' ? 100 : undefined}
                value={form.discount_value}
                onChange={e => setForm(f => ({ ...f, discount_value: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Amount (₹)</label>
              <input
                type="number" min={0} value={form.min_order_amount}
                onChange={e => setForm(f => ({ ...f, min_order_amount: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none"
                placeholder="0 = no minimum"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses</label>
              <input
                type="number" min={0} value={form.max_uses}
                onChange={e => setForm(f => ({ ...f, max_uses: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none"
                placeholder="0 = unlimited"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid From *</label>
              <input
                type="date" required value={form.valid_from}
                onChange={e => setForm(f => ({ ...f, valid_from: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until *</label>
              <input
                type="date" required value={form.valid_until}
                onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
