'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import Badge from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { ShoppingCart, ClipboardList } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import OrderStatusBadge from '@/components/ui/OrderStatusBadge';
import type { Order, Subscription } from '@/types/database';

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/orders').then(r => r.json()),
      fetch('/api/subscriptions').then(r => r.json()),
    ]).then(([ordData, subData]) => {
      setOrders(Array.isArray(ordData) ? ordData : []);
      setSubscriptions(Array.isArray(subData) ? subData : []);
      setLoading(false);
    });
  }, []);

  const filtered = statusFilter ? orders.filter(o => o.status === statusFilter) : orders;

  if (loading) return <PageLoader />;

  return (
    <div>
      {/* Subscriptions */}
      {subscriptions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-brand-green" /> My Subscriptions
          </h2>
          <div className="space-y-3">
            {subscriptions.map(sub => (
              <div key={sub.id} className="bg-white rounded-xl border p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{sub.meal_plan?.name || 'Meal Plan'}</h3>
                  <div className="flex items-center gap-2">
                    <Badge status={sub.status} />
                    <Badge status={sub.payment_status} />
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {formatDate(sub.start_date)} — {formatDate(sub.end_date)}
                  </span>
                  <span className="font-bold text-brand-green">{formatCurrency(sub.total_amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders */}
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
                  <OrderStatusBadge status={order.status} />
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
