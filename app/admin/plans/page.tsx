'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/lib/utils/format';
import type { MealPlan } from '@/types/database';

const durationTypes = [
  { value: 'weekly', label: 'Weekly', days: 7 },
  { value: 'monthly', label: 'Monthly', days: 30 },
  { value: 'six_day', label: '6-Day Cycle', days: 6 },
  { value: 'twenty_six_day', label: '26-Day Plan', days: 26 },
  { value: 'custom', label: 'Custom', days: 0 },
];

export default function PlansPage() {
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MealPlan | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    plan_type: 'customized' as 'fixed' | 'customized',
    duration_type: 'weekly' as 'weekly' | 'monthly' | 'six_day' | 'twenty_six_day' | 'custom',
    duration_days: 7,
    price: 0,
  });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  async function fetchPlans() {
    const res = await fetch('/api/plans');
    const data = await res.json();
    setPlans(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { fetchPlans(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: '', description: '', plan_type: 'customized', duration_type: 'weekly', duration_days: 7, price: 0 });
    setModalOpen(true);
  }

  function openEdit(plan: MealPlan) {
    setEditing(plan);
    setForm({
      name: plan.name,
      description: plan.description || '',
      plan_type: plan.plan_type,
      duration_type: plan.duration_type,
      duration_days: plan.duration_days,
      price: plan.price,
    });
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const method = editing ? 'PUT' : 'POST';
    const body = editing ? { id: editing.id, ...form } : form;

    const res = await fetch('/api/plans', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      showToast(editing ? 'Plan updated' : 'Plan created');
      setModalOpen(false);
      fetchPlans();
    } else {
      const err = await res.json();
      showToast(err.error || 'Something went wrong', 'error');
    }
    setSaving(false);
  }

  async function toggleActive(plan: MealPlan) {
    await fetch('/api/plans', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: plan.id, is_active: !plan.is_active }),
    });
    showToast(`Plan ${plan.is_active ? 'deactivated' : 'activated'}`);
    fetchPlans();
  }

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meal Plans</h1>
          <p className="text-sm text-gray-500 mt-1">{plans.length} plans available</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Add Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div key={plan.id} className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge status={plan.plan_type === 'fixed' ? 'confirmed' : 'active'} />
                  <span className="text-xs text-gray-500 capitalize">{plan.duration_type.replace('_', ' ')}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-brand-green">{formatCurrency(plan.price)}</p>
                <p className="text-xs text-gray-500">{plan.duration_days} days</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{plan.description}</p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => openEdit(plan)}>
                <Edit2 className="w-3 h-3 mr-1" /> Edit
              </Button>
              <button onClick={() => toggleActive(plan)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                {plan.is_active ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Plan' : 'Add Plan'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
            <input
              type="text" required value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan Type</label>
              <select
                value={form.plan_type}
                onChange={e => setForm(f => ({ ...f, plan_type: e.target.value as typeof form.plan_type }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none"
              >
                <option value="fixed">Fixed</option>
                <option value="customized">Customized</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <select
                value={form.duration_type}
                onChange={e => {
                  const dt = e.target.value as typeof form.duration_type;
                  const preset = durationTypes.find(d => d.value === dt);
                  const days = preset?.days || form.duration_days;
                  setForm(f => ({ ...f, duration_type: dt, duration_days: days || 1 }));
                }}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none"
              >
                {durationTypes.map(d => (
                  <option key={d.value} value={d.value}>
                    {d.label}{d.days ? ` (${d.days} days)` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {form.duration_type === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Days</label>
              <input
                type="number" required min={1} max={365} value={form.duration_days}
                onChange={e => setForm(f => ({ ...f, duration_days: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
            <input
              type="number" required min={0} step={0.01} value={form.price}
              onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none"
            />
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
