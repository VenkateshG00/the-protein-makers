'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, ShoppingCart, CreditCard, Truck, AlertTriangle, ChefHat } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/lib/utils/format';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';

interface Stats {
  totalCustomers: number;
  activeSubscriptions: number;
  todayOrders: number;
  pendingDeliveries: number;
  todayRevenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalCustomers: 0,
    activeSubscriptions: 0,
    todayOrders: 0,
    pendingDeliveries: 0,
    todayRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient();
      const today = format(new Date(), 'yyyy-MM-dd');

      const [customers, subscriptions, orders, payments] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
        supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('orders').select('id, status, total_amount').eq('order_date', today),
        supabase.from('payments').select('amount').eq('status', 'successful'),
      ]);

      const todayOrdersList = orders.data || [];
      const todayRevenue = todayOrdersList.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const pendingDeliveries = todayOrdersList.filter(o => !['delivered', 'cancelled', 'failed'].includes(o.status)).length;

      setStats({
        totalCustomers: customers.count || 0,
        activeSubscriptions: subscriptions.count || 0,
        todayOrders: todayOrdersList.length,
        pendingDeliveries,
        todayRevenue,
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  if (loading) return <PageLoader />;

  const statCards = [
    { label: 'Total Customers', value: stats.totalCustomers, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Active Subscriptions', value: stats.activeSubscriptions, icon: ShoppingCart, color: 'bg-green-50 text-green-600' },
    { label: "Today's Orders", value: stats.todayOrders, icon: ChefHat, color: 'bg-orange-50 text-orange-600' },
    { label: 'Pending Deliveries', value: stats.pendingDeliveries, icon: Truck, color: 'bg-purple-50 text-purple-600' },
    { label: "Today's Revenue", value: formatCurrency(stats.todayRevenue), icon: CreditCard, color: 'bg-brand-gold text-brand-green-dark' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of today&apos;s operations — {format(new Date(), 'EEEE, dd MMM yyyy')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl border p-5">
              <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/admin/reports" className="flex items-center gap-3 p-3 bg-brand-gold-light rounded-lg hover:bg-brand-gold transition-colors">
              <ChefHat className="w-5 h-5 text-brand-green" />
              <div>
                <p className="font-medium text-gray-900">Kitchen Report</p>
                <p className="text-xs text-gray-500">Generate and print tomorrow&apos;s prep plan</p>
              </div>
            </Link>
            <Link href="/admin/orders" className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <ShoppingCart className="w-5 h-5 text-brand-green" />
              <div>
                <p className="font-medium text-gray-900">Manage Orders</p>
                <p className="text-xs text-gray-500">View and update order statuses</p>
              </div>
            </Link>
            <Link href="/admin/customers" className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <Users className="w-5 h-5 text-brand-green" />
              <div>
                <p className="font-medium text-gray-900">Customer Management</p>
                <p className="text-xs text-gray-500">View customer details and subscriptions</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Alerts</h2>
          <div className="space-y-3">
            {stats.pendingDeliveries > 0 && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">{stats.pendingDeliveries} pending deliveries</p>
                  <p className="text-xs text-yellow-600">Orders awaiting delivery today</p>
                </div>
              </div>
            )}
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-500">
              No critical alerts at this time.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
