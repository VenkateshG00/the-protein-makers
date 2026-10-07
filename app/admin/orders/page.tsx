'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/lib/utils/format';
import type { Order } from '@/types/database';

const statusFlow = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { showToast } = useToast();

  async function fetchOrders() {
    let url = '/api/orders?';
    if (dateFilter) url += `date=${dateFilter}&`;
    if (statusFilter) url += `status=${statusFilter}&`;
    const res = await fetch(url);
    const data = await res.json();
    setOrders(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { fetchOrders(); }, [dateFilter, statusFilter]);

  async function updateStatus(orderId: string, newStatus: string) {
    const res = await fetch('/api/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: orderId, status: newStatus }),
    });
    if (res.ok) {
      showToast(`Order status updated to ${newStatus}`);
      fetchOrders();
      setSelectedOrder(null);
    } else {
      showToast('Failed to update status', 'error');
    }
  }

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">{orders.length} orders</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-green outline-none"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-green outline-none"
        >
          <option value="">All Statuses</option>
          {statusFlow.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Order ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Customer</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Meals</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Amount</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Zone</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map(order => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-medium text-brand-green">{order.order_id}</td>
                <td className="px-4 py-3 text-gray-900">{order.user?.full_name}</td>
                <td className="px-4 py-3 text-gray-600">{format(new Date(order.order_date), 'dd MMM yyyy')}</td>
                <td className="px-4 py-3 text-gray-600">{order.order_items?.length || 0} items</td>
                <td className="px-4 py-3 font-medium">{formatCurrency(order.total_amount)}</td>
                <td className="px-4 py-3"><Badge status={order.status} /></td>
                <td className="px-4 py-3 text-gray-600">{order.delivery_zone?.name}</td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="ghost" onClick={() => setSelectedOrder(order)}>
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order ${selectedOrder?.order_id || ''}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Customer</p>
                <p className="font-medium">{selectedOrder.user?.full_name}</p>
                <p className="text-gray-500">{selectedOrder.user?.phone}</p>
              </div>
              <div>
                <p className="text-gray-500">Date</p>
                <p className="font-medium">{format(new Date(selectedOrder.order_date), 'dd MMM yyyy')}</p>
              </div>
              <div>
                <p className="text-gray-500">Amount</p>
                <p className="font-medium">{formatCurrency(selectedOrder.total_amount)}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <Badge status={selectedOrder.status} />
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Meals</h4>
              <div className="space-y-2">
                {selectedOrder.order_items?.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm border-b pb-2">
                    <div className="flex items-center gap-2">
                      <Badge status={item.meal?.dietary_tag || 'non_veg'} />
                      <span>{item.meal?.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-500">
                      <span className="capitalize">{item.meal_time}</span>
                      <span>x{item.quantity}</span>
                      <span className="font-medium text-gray-900">{formatCurrency(item.unit_price)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Update Status</h4>
              <div className="flex flex-wrap gap-2">
                {statusFlow.map(status => (
                  <Button
                    key={status}
                    size="sm"
                    variant={selectedOrder.status === status ? 'primary' : 'outline'}
                    onClick={() => updateStatus(selectedOrder.id, status)}
                    disabled={selectedOrder.status === status}
                  >
                    {status.replace('_', ' ')}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => updateStatus(selectedOrder.id, 'cancelled')}
                  disabled={selectedOrder.status === 'cancelled'}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
