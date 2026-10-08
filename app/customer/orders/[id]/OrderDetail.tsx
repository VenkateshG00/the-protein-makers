'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/lib/utils/format';
import OrderProgressStepper from '@/components/ui/OrderProgressStepper';
import type { Order } from '@/types/database';

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        setOrder(arr.find((o: Order) => o.id === id) || null);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <PageLoader />;
  if (!order) return <div className="text-center py-12 text-gray-500">Order not found</div>;

  return (
    <div>
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </button>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="p-6 bg-brand-green text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-200">Order</p>
              <h1 className="text-2xl font-bold font-mono">{order.order_id}</h1>
            </div>
            <div className="text-right">
              <p className="text-sm text-green-200">Date</p>
              <p className="font-semibold">{format(new Date(order.order_date), 'dd MMM yyyy')}</p>
            </div>
          </div>
        </div>

        {/* Animated Order Progress Stepper */}
        <OrderProgressStepper status={order.status} orderId={order.order_id} items={order.order_items} />

        {/* Meals */}
        <div className="p-6 border-b">
          <h3 className="font-semibold text-gray-900 mb-3">Meals</h3>
          <div className="space-y-3">
            {order.order_items?.map(item => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge status={item.meal?.dietary_tag || 'non_veg'} />
                  <div>
                    <p className="font-medium text-gray-900">{item.meal?.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{item.meal_time} | x{item.quantity}</p>
                  </div>
                </div>
                <span className="font-medium">{formatCurrency(item.unit_price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="p-6 bg-gray-50 flex items-center justify-between">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="text-xl font-bold text-brand-green">{formatCurrency(order.total_amount)}</span>
        </div>
      </div>
    </div>
  );
}
