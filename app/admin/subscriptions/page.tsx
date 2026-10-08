'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/utils/format';
import EmptyState from '@/components/ui/EmptyState';
import { CreditCard, Search, CheckCircle, XCircle } from 'lucide-react';
import type { Subscription } from '@/types/database';

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activating, setActivating] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const { showToast } = useToast();

  function fetchData() {
    fetch('/api/subscriptions')
      .then(r => r.json())
      .then(data => { setSubscriptions(Array.isArray(data) ? data : []); setLoading(false); });
  }

  useEffect(() => { fetchData(); }, []);

  async function handleActivate(subId: string) {
    setActivating(subId);
    const res = await fetch('/api/subscriptions/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription_id: subId }),
    });
    if (res.ok) {
      showToast('Subscription activated');
      fetchData();
    } else {
      const err = await res.json();
      showToast(err.error || 'Failed to activate', 'error');
    }
    setActivating(null);
  }

  async function handleCancel(subId: string) {
    if (confirmCancel !== subId) {
      setConfirmCancel(subId);
      return;
    }
    setConfirmCancel(null);
    setCancelling(subId);
    const res = await fetch('/api/subscriptions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: subId, status: 'cancelled' }),
    });
    if (res.ok) {
      showToast('Subscription cancelled');
      fetchData();
    } else {
      const err = await res.json();
      showToast(err.error || 'Failed to cancel', 'error');
    }
    setCancelling(null);
  }

  const filtered = subscriptions.filter(s => {
    const matchSearch = !search ||
      s.user?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.user?.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
        <span className="text-sm text-gray-500">{subscriptions.length} total</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" placeholder="Search by name or email..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-green outline-none"
          />
        </div>
        <select
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-green outline-none"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={CreditCard} title="No subscriptions found" description="No subscriptions match your filters." />
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-3 sm:px-4 py-3">Customer</th>
                  <th className="px-3 sm:px-4 py-3 hidden sm:table-cell">Plan</th>
                  <th className="px-3 sm:px-4 py-3">Status</th>
                  <th className="px-3 sm:px-4 py-3 hidden sm:table-cell">Payment</th>
                  <th className="px-3 sm:px-4 py-3 hidden sm:table-cell">Duration</th>
                  <th className="px-3 sm:px-4 py-3">Amount</th>
                  <th className="px-3 sm:px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(sub => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-4 py-3">
                      <p className="font-medium text-gray-900">{sub.user?.full_name}</p>
                      <p className="text-xs text-gray-500">{sub.user?.email}</p>
                      <p className="text-xs text-gray-400 sm:hidden">{sub.meal_plan?.name || '—'}</p>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-gray-700 hidden sm:table-cell">{sub.meal_plan?.name || '—'}</td>
                    <td className="px-3 sm:px-4 py-3">
                      <Badge status={sub.status} />
                      <span className="block sm:hidden mt-1"><Badge status={sub.payment_status} /></span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 hidden sm:table-cell"><Badge status={sub.payment_status} /></td>
                    <td className="px-3 sm:px-4 py-3 text-gray-600 text-xs hidden sm:table-cell">
                      {format(new Date(sub.start_date), 'dd MMM')} — {format(new Date(sub.end_date), 'dd MMM yyyy')}
                    </td>
                    <td className="px-3 sm:px-4 py-3 font-semibold text-gray-900">{formatCurrency(sub.total_amount)}</td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {sub.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleActivate(sub.id)}
                            disabled={activating === sub.id}
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            {activating === sub.id ? 'Activating...' : 'Activate'}
                          </Button>
                        )}
                        {(sub.status === 'pending' || sub.status === 'active') && (
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={cancelling === sub.id}
                            onClick={() => handleCancel(sub.id)}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            {cancelling === sub.id ? 'Cancelling...' : confirmCancel === sub.id ? 'Sure?' : 'Cancel'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
