'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import Badge from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/lib/utils/format';
import { ShoppingCart } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import type { Order } from '@/types/database';

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.json())
      .then(data => { setOrders(Array.isArray(data) ? data : []); setLoading(false); });
  }, []);

  const filtered = statusFilter ? orders.filter(o => o.status === statusFilter) : orders;

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order History</h1>
          <p className="text-sm text-gray-500 mt-1">{orders.length} orders</p>
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-green outline-none"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="preparing">Preparing</option>
          <option value="out_for_delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="No orders yet"
          description="Your orders will appear here once your subscription is active."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map(order => (
            <Link
              key={order.id}
              href={`/customer/orders/${order.id}`}
              className="block bg-white rounded-xl border p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-semibold text-brand-green">{order.order_id}</span>
                  <Badge status={order.status} />
                </div>
                <span className="text-sm text-gray-500">
                  {format(new Date(order.order_date), 'dd MMM yyyy')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {order.order_items?.map(item => (
                    <span key={item.id} className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                      {item.meal?.name} x{item.quantity}
                    </span>
                  ))}
                </div>
                <span className="font-semibold text-gray-900">{formatCurrency(order.total_amount)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
