'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Plus, Trash2 } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/lib/utils/format';
import { MEAL_TIMINGS, type MealSlot } from '@/lib/constants/timings';
import OrderStatusBadge from '@/components/ui/OrderStatusBadge';
import type { Order } from '@/types/database';

const statusFlow = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
const allStatuses = [...statusFlow, 'cancelled'];

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-orange-100 text-orange-700',
  ready: 'bg-indigo-100 text-indigo-700',
  out_for_delivery: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-500',
};

const mealTimeSlots = [
  { key: 'morning' as const, label: 'Breakfast' },
  { key: 'afternoon' as const, label: 'Lunch' },
  { key: 'dinner' as const, label: 'Dinner' },
];

const mealTimeOrder: Record<string, number> = { morning: 0, afternoon: 1, dinner: 2 };

type SlotItem = {
  orderId: string;
  orderDisplayId: string;
  customerName: string;
  mealName: string;
  itemId: string;
  itemStatus: string;
  dietaryTag: string;
};

type ViewMode = 'orders' | 'batch';

function getOverallStatus(items: any[]): string {
  if (!items || items.length === 0) return 'pending';
  const statuses = items.map((i: any) => i.status || 'pending');
  const unique = [...new Set(statuses)];
  if (unique.length === 1) return unique[0];
  const lowestIdx = Math.min(...unique.map(s => statusFlow.indexOf(s)).filter(i => i >= 0));
  if (lowestIdx >= 0) return statusFlow[lowestIdx];
  return statuses[0];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [mealTimeFilter, setMealTimeFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('batch');
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Record<string, Set<string>>>({});
  const { showToast } = useToast();

  async function fetchOrders() {
    let url = '/api/orders?';
    if (dateFilter) url += `date=${dateFilter}&`;
    if (statusFilter) url += `status=${statusFilter}&`;
    if (mealTimeFilter) url += `meal_time=${mealTimeFilter}&`;
    const res = await fetch(url);
    const data = await res.json();
    setOrders(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    if (!dateFilter) {
      setDateFilter(format(new Date(), 'yyyy-MM-dd'));
      return;
    }
    fetchOrders();
  }, [dateFilter, statusFilter, mealTimeFilter]);

  async function generateOrders() {
    if (!dateFilter) return;
    setGenerating(true);
    const res = await fetch('/api/orders/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: dateFilter }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(`Generated ${data.generated} orders for ${dateFilter}`);
      fetchOrders();
    } else {
      showToast(data.error || data.message || 'Failed to generate orders', 'error');
    }
    setGenerating(false);
  }

  async function updateItemStatus(itemId: string, newStatus: string) {
    const res = await fetch('/api/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: itemId, status: newStatus }),
    });
    if (res.ok) {
      showToast(`Status updated to ${newStatus.replace(/_/g, ' ')}`);
      if (selectedOrder) {
        setSelectedOrder({
          ...selectedOrder,
          order_items: selectedOrder.order_items?.map((item: any) =>
            item.id === itemId ? { ...item, status: newStatus } : item
          ),
        });
      }
      fetchOrders();
    } else {
      showToast('Failed to update', 'error');
    }
  }

  async function deleteOrder(orderId: string, orderDisplayId: string) {
    const res = await fetch('/api/orders', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: orderId }),
    });
    if (res.ok) {
      showToast(`Order ${orderDisplayId} deleted`);
      fetchOrders();
      setSelectedOrder(null);
    } else {
      showToast('Failed to delete order', 'error');
    }
  }

  function toggleItemSelection(slotKey: string, itemId: string) {
    setSelectedItems(prev => {
      const current = new Set(prev[slotKey] || []);
      if (current.has(itemId)) current.delete(itemId);
      else current.add(itemId);
      return { ...prev, [slotKey]: current };
    });
  }

  function toggleAllInSlot(slotKey: string, slotItems: SlotItem[]) {
    setSelectedItems(prev => {
      const current = new Set(prev[slotKey] || []);
      const allSelected = slotItems.every(i => current.has(i.itemId));
      if (allSelected) {
        return { ...prev, [slotKey]: new Set() };
      } else {
        return { ...prev, [slotKey]: new Set(slotItems.map(i => i.itemId)) };
      }
    });
  }

  async function batchUpdateSelected(slotKey: string, newStatus: string) {
    const selected = selectedItems[slotKey];
    if (!selected || selected.size === 0) {
      showToast('Select at least one customer', 'error');
      return;
    }
    setBatchProcessing(true);
    const res = await fetch('/api/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batch_update: { item_ids: [...selected], status: newStatus } }),
    });
    if (res.ok) {
      const data = await res.json();
      showToast(`Updated ${data.updated} items to "${newStatus.replace(/_/g, ' ')}"`);
      setSelectedItems(prev => ({ ...prev, [slotKey]: new Set() }));
      fetchOrders();
    } else {
      showToast('Batch update failed', 'error');
    }
    setBatchProcessing(false);
  }

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">{orders.length} orders</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={viewMode === 'batch' ? 'primary' : 'outline'}
            onClick={() => setViewMode('batch')}
          >
            Batch Update
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'orders' ? 'primary' : 'outline'}
            onClick={() => setViewMode('orders')}
          >
            All Orders
          </Button>
        </div>
      </div>

      {/* Filters + Generate */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-green outline-none"
        />
        {viewMode === 'orders' && (
          <>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-green outline-none"
            >
              <option value="">All Statuses</option>
              {statusFlow.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={mealTimeFilter}
              onChange={e => setMealTimeFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-green outline-none"
            >
              <option value="">All Meals</option>
              {mealTimeSlots.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={generateOrders}
          disabled={generating || !dateFilter}
        >
          <Plus className="w-4 h-4 mr-1" />
          {generating ? 'Generating...' : 'Generate Orders'}
        </Button>
      </div>

      {/* Batch Update View */}
      {viewMode === 'batch' && (
        <div className="space-y-6">
          {mealTimeSlots.map(slot => {
            const timing = MEAL_TIMINGS[slot.key];
            const slotItems: SlotItem[] = [];

            orders.forEach(order => {
              (order.order_items || []).forEach((item: any) => {
                if (item.meal_time === slot.key) {
                  slotItems.push({
                    orderId: order.id,
                    orderDisplayId: order.order_id,
                    customerName: order.user?.full_name || 'Unknown',
                    mealName: item.meal?.name || 'Meal',
                    itemId: item.id,
                    itemStatus: item.status || order.status || 'pending',
                    dietaryTag: item.meal?.dietary_tag || 'non_veg',
                  });
                }
              });
            });

            if (slotItems.length === 0) return null;

            const selected = selectedItems[slot.key] || new Set<string>();
            const allSelected = slotItems.length > 0 && slotItems.every(i => selected.has(i.itemId));
            const someSelected = selected.size > 0;

            const selectedStatuses = slotItems
              .filter(i => selected.has(i.itemId))
              .map(i => i.itemStatus);
            const selectedAllSame = selectedStatuses.length > 0 && selectedStatuses.every(s => s === selectedStatuses[0]);
            const nextStatusForSelected = selectedAllSame
              ? statusFlow[statusFlow.indexOf(selectedStatuses[0]) + 1]
              : undefined;

            return (
              <div key={slot.key} className="bg-white rounded-xl border overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 sm:px-4 py-3 bg-gray-50 border-b">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span className="text-xl shrink-0">{timing.icon}</span>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900">{slot.label}</h3>
                      <p className="text-xs text-gray-500">
                        Prep: {timing.prepStart}–{timing.prepEnd} | Delivery: {timing.deliveryStart}–{timing.deliveryEnd}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                      {slotItems.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {someSelected && nextStatusForSelected && (
                      <Button
                        size="sm"
                        onClick={() => batchUpdateSelected(slot.key, nextStatusForSelected)}
                        disabled={batchProcessing}
                      >
                        Update {selected.size} &rarr; {nextStatusForSelected.replace(/_/g, ' ')}
                      </Button>
                    )}
                    {someSelected && (
                      <select
                        onChange={e => {
                          if (e.target.value) {
                            batchUpdateSelected(slot.key, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="px-2 py-1.5 rounded-lg text-xs font-medium border outline-none cursor-pointer bg-white"
                        defaultValue=""
                      >
                        <option value="" disabled>Set status...</option>
                        {allStatuses.map(s => (
                          <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50/50 border-b">
                    <tr>
                      <th className="px-3 sm:px-4 py-2 w-10">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={() => toggleAllInSlot(slot.key, slotItems)}
                          className="w-4 h-4 rounded border-gray-300 text-brand-green focus:ring-brand-green cursor-pointer"
                        />
                      </th>
                      <th className="px-3 sm:px-4 py-2 text-left font-medium text-gray-500">Customer</th>
                      <th className="px-3 sm:px-4 py-2 text-left font-medium text-gray-500">Meal</th>
                      <th className="px-3 sm:px-4 py-2 text-left font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {slotItems.map(item => (
                      <tr key={item.itemId} className={`hover:bg-gray-50 ${selected.has(item.itemId) ? 'bg-brand-green/5' : ''}`}>
                        <td className="px-3 sm:px-4 py-2.5">
                          <input
                            type="checkbox"
                            checked={selected.has(item.itemId)}
                            onChange={() => toggleItemSelection(slot.key, item.itemId)}
                            className="w-4 h-4 rounded border-gray-300 text-brand-green focus:ring-brand-green cursor-pointer"
                          />
                        </td>
                        <td className="px-3 sm:px-4 py-2.5">
                          <p className="font-medium text-gray-900">{item.customerName}</p>
                          <p className="text-xs text-gray-400 font-mono">{item.orderDisplayId}</p>
                        </td>
                        <td className="px-3 sm:px-4 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <span>{item.mealName}</span>
                            <Badge status={item.dietaryTag} />
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-2.5">
                          <select
                            value={item.itemStatus}
                            onChange={e => updateItemStatus(item.itemId, e.target.value)}
                            className={`px-1.5 sm:px-2 py-1 rounded-lg text-[11px] sm:text-xs font-medium border outline-none cursor-pointer ${statusColors[item.itemStatus] || 'bg-gray-100'}`}
                          >
                            {allStatuses.map(s => (
                              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </div>
            );
          })}

          {orders.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg font-medium">No orders for this date</p>
              <p className="text-sm mt-1">Click &quot;Generate Orders&quot; to create orders for scheduled subscriptions</p>
            </div>
          )}
        </div>
      )}

      {/* All Orders View */}
      {viewMode === 'orders' && (
        <div className="bg-white rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Order ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Customer</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Meals</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Progress</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map(order => {
                const items = order.order_items || [];
                const overall = getOverallStatus(items);
                const deliveredCount = items.filter((i: any) => i.status === 'delivered').length;
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-medium text-brand-green">{order.order_id}</td>
                    <td className="px-4 py-3 text-gray-900">{order.user?.full_name}</td>
                    <td className="px-4 py-3 text-gray-600">{format(new Date(order.order_date), 'dd MMM yyyy')}</td>
                    <td className="px-4 py-3 text-gray-600">{items.length} items</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(order.total_amount)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <OrderStatusBadge status={overall} />
                        <span className="text-xs text-gray-400">{deliveredCount}/{items.length}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setSelectedOrder(order)}>View</Button>
                        <button
                          onClick={() => deleteOrder(order.id, order.order_id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Order detail modal — per-meal status only, no order-level status */}
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
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => deleteOrder(selectedOrder.id, selectedOrder.order_id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Order
              </button>
            </div>

            <div>
              <h4 className="font-medium mb-2">Meals</h4>
              <div className="space-y-2">
                {[...(selectedOrder.order_items || [])].sort((a: any, b: any) => {
                  return (mealTimeOrder[a.meal_time] ?? 9) - (mealTimeOrder[b.meal_time] ?? 9);
                }).map((item: any) => {
                  const timing = MEAL_TIMINGS[item.meal_time as MealSlot];
                  return (
                    <div key={item.id} className="flex items-center justify-between text-sm border rounded-lg p-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Badge status={item.meal?.dietary_tag || 'non_veg'} />
                        <div>
                          <span className="font-medium">{item.meal?.name}</span>
                          {timing && (
                            <p className="text-[10px] text-gray-400">{timing.icon} {timing.label} · {timing.deliveryStart}–{timing.deliveryEnd}</p>
                          )}
                        </div>
                      </div>
                      <select
                        value={item.status || 'pending'}
                        onChange={e => updateItemStatus(item.id, e.target.value)}
                        className={`px-2 py-1 rounded-lg text-xs font-medium border outline-none cursor-pointer shrink-0 ${statusColors[item.status || 'pending'] || 'bg-gray-100'}`}
                      >
                        {allStatuses.map(s => (
                          <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
