'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, ShoppingCart, User, Pause, Dumbbell, Clock, ArrowRight } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { differenceInDays } from 'date-fns';
import type { Subscription } from '@/types/database';

export default function CustomerDashboard() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderCount, setOrderCount] = useState(0);
  const [deliveredCount, setDeliveredCount] = useState(0);

  useEffect(() => {
    async function fetchData() {
      const subRes = await fetch('/api/subscriptions');
      const subsData = await subRes.json();
      const subs = Array.isArray(subsData) ? subsData : [];
      const active = subs.find((s: Subscription) => s.status === 'active') || subs[0] || null;
      setSubscription(active);

      if (active) {
        const ordRes = await fetch('/api/orders');
        const ordData = await ordRes.json();
        const orders = Array.isArray(ordData) ? ordData : [];
        setOrderCount(orders.length);
        setDeliveredCount(orders.filter((o: { status: string }) => o.status === 'delivered').length);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return <PageLoader />;

  if (!subscription) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-brand-gold-light rounded-full flex items-center justify-center mx-auto mb-6">
          <Dumbbell className="w-10 h-10 text-brand-green" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to The Protein Makers!</h1>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Subscribe to a meal plan to start receiving premium protein-packed meals at your doorstep.
        </p>
        <Link href="/customer/plans">
          <Button size="lg">Browse Meal Plans</Button>
        </Link>
      </div>
    );
  }

  const daysRemaining = Math.max(0, differenceInDays(new Date(subscription.end_date), new Date()));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back! Here&apos;s your subscription overview.</p>
      </div>

      {/* Active subscription card */}
      <div className="bg-gradient-to-r from-brand-green-dark to-brand-green rounded-2xl p-6 text-white mb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge status={subscription.status} className="bg-white/20 text-white border-0" />
              <Badge status={subscription.payment_status} className="bg-white/20 text-white border-0" />
            </div>
            <h2 className="text-xl font-bold mb-1">{subscription.meal_plan?.name}</h2>
            <p className="text-green-200 text-sm">
              {formatDate(subscription.start_date)} — {formatDate(subscription.end_date)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{daysRemaining}</p>
            <p className="text-green-200 text-sm">days left</p>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-brand-green">{daysRemaining}</p>
          <p className="text-xs text-gray-500 mt-1">Days Remaining</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{deliveredCount}</p>
          <p className="text-xs text-gray-500 mt-1">Meals Delivered</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">{orderCount - deliveredCount}</p>
          <p className="text-xs text-gray-500 mt-1">Upcoming Meals</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-brand-green-dark">{formatCurrency(subscription.total_amount)}</p>
          <p className="text-xs text-gray-500 mt-1">Plan Amount</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { href: '/customer/calendar', icon: Calendar, label: 'View Calendar', desc: 'See your meal schedule' },
          { href: '/customer/calendar', icon: Pause, label: 'Pause Days', desc: 'Pause upcoming deliveries' },
          { href: '/customer/orders', icon: ShoppingCart, label: 'Order History', desc: 'Track your orders' },
          { href: '/customer/profile', icon: User, label: 'Profile', desc: 'Manage your account' },
        ].map(link => (
          <Link
            key={link.href + link.label}
            href={link.href}
            className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-brand-gold-light rounded-lg flex items-center justify-center shrink-0">
              <link.icon className="w-5 h-5 text-brand-green" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm">{link.label}</p>
              <p className="text-xs text-gray-500">{link.desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
