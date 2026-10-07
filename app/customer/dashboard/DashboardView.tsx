'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, ShoppingCart, User, Dumbbell, Clock, ArrowRight, Utensils, Flame, Drumstick, Star, Wallet } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { differenceInDays } from 'date-fns';
import type { Subscription, Meal } from '@/types/database';

export default function CustomerDashboard() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderCount, setOrderCount] = useState(0);
  const [deliveredCount, setDeliveredCount] = useState(0);
  const [featuredMeals, setFeaturedMeals] = useState<Meal[]>([]);

  useEffect(() => {
    async function fetchData() {
      const [subRes, mealsRes] = await Promise.all([
        fetch('/api/subscriptions'),
        fetch('/api/meals'),
      ]);
      const subsData = await subRes.json();
      const subs = Array.isArray(subsData) ? subsData : [];
      const active = subs.find((s: Subscription) => s.status === 'active') || subs[0] || null;
      setSubscription(active);

      const mealsData = await mealsRes.json();
      const allMeals = Array.isArray(mealsData) ? mealsData : [];
      setFeaturedMeals(allMeals.filter((m: Meal) => m.is_available !== false).slice(0, 6));

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
      <div>
        {/* Hero section */}
        <div className="bg-gradient-to-br from-brand-green-dark via-brand-green to-brand-green-light rounded-2xl p-8 text-white mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Dumbbell className="w-6 h-6" />
              <span className="text-sm font-medium bg-white/20 px-3 py-0.5 rounded-full">The Protein Makers</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">Fuel Your Fitness Goals</h1>
            <p className="text-green-200 max-w-lg mb-6">
              Premium high-protein meals delivered to your doorstep. Fresh, delicious, and packed with the nutrition you need to perform at your best.
            </p>
            <Link href="/customer/plans">
              <Button size="lg" className="bg-white text-brand-green hover:bg-gray-100 font-bold">
                <Utensils className="w-5 h-5 mr-2" /> Explore Meal Plans
              </Button>
            </Link>
          </div>
        </div>

        {/* Why choose us */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Why The Protein Makers?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Drumstick, title: 'High Protein', desc: 'Every meal is protein-packed to support muscle growth and recovery' },
              { icon: Flame, title: 'Calorie Counted', desc: 'Precise macros so you know exactly what you\'re eating' },
              { icon: Star, title: 'Fresh Daily', desc: 'Prepared fresh every day with quality ingredients' },
            ].map(item => (
              <div key={item.title} className="bg-white rounded-xl border p-5 text-center">
                <div className="w-12 h-12 bg-brand-gold-light rounded-full flex items-center justify-center mx-auto mb-3">
                  <item.icon className="w-6 h-6 text-brand-green" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Featured meals */}
        {featuredMeals.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Our Menu</h2>
              <Link href="/customer/meals" className="text-sm text-brand-green font-medium hover:underline flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredMeals.map(meal => (
                <div key={meal.id} className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 bg-brand-gold-light rounded-xl flex items-center justify-center shrink-0">
                      <Utensils className="w-6 h-6 text-brand-green" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{meal.name}</h3>
                        <Badge status={meal.dietary_tag} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{meal.protein_grams}g protein</span>
                        <span>{meal.calories} kcal</span>
                      </div>
                      <p className="text-brand-green font-bold text-sm mt-1">{formatCurrency(meal.price)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-brand-gold-light rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ready to Start?</h2>
          <p className="text-gray-600 mb-4 max-w-md mx-auto">
            Subscribe to a 26-day meal plan and get premium protein meals delivered daily.
          </p>
          <Link href="/customer/plans">
            <Button size="lg">
              <Dumbbell className="w-5 h-5 mr-2" /> Browse Plans
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const daysRemaining = Math.max(0, differenceInDays(new Date(subscription.end_date), new Date()));
  const totalDays = subscription.meal_plan?.duration_days || 26;
  const progressPct = Math.min(100, Math.round(((totalDays - daysRemaining) / totalDays) * 100));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back! Here&apos;s your subscription overview.</p>
      </div>

      {/* Active subscription card */}
      <div className="bg-gradient-to-br from-brand-green-dark to-brand-green rounded-2xl p-6 text-white mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="flex items-start justify-between relative">
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
        {/* Progress bar */}
        <div className="mt-4 relative">
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="text-xs text-green-200 mt-1">{progressPct}% complete</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-4 text-center">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Clock className="w-5 h-5 text-brand-green" />
          </div>
          <p className="text-2xl font-bold text-brand-green">{daysRemaining}</p>
          <p className="text-xs text-gray-500 mt-1">Days Left</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-600">{deliveredCount}</p>
          <p className="text-xs text-gray-500 mt-1">Delivered</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Utensils className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-orange-600">{totalDays - deliveredCount}</p>
          <p className="text-xs text-gray-500 mt-1">Upcoming</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <div className="w-10 h-10 bg-brand-gold-light rounded-lg flex items-center justify-center mx-auto mb-2">
            <Wallet className="w-5 h-5 text-brand-green-dark" />
          </div>
          <p className="text-2xl font-bold text-brand-green-dark">{formatCurrency(subscription.total_amount)}</p>
          <p className="text-xs text-gray-500 mt-1">Plan Amount</p>
        </div>
      </div>

      {/* Quick links */}
      <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: '/customer/calendar', icon: Calendar, label: 'Calendar & Pause', desc: 'View schedule & pause days', color: 'bg-green-50' },
          { href: '/customer/orders', icon: ShoppingCart, label: 'Orders', desc: 'Track your deliveries', color: 'bg-blue-50' },
          { href: '/customer/profile', icon: User, label: 'Profile', desc: 'Manage your account', color: 'bg-purple-50' },
        ].map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow flex items-center gap-3"
          >
            <div className={`w-10 h-10 ${link.color} rounded-lg flex items-center justify-center shrink-0`}>
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
