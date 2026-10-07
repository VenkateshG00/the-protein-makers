'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Dumbbell } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/lib/utils/format';
import type { MealPlan } from '@/types/database';

export default function CustomerPlansPage() {
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/plans')
      .then(res => res.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        setPlans(arr.filter((p: MealPlan) => p.is_active));
        setLoading(false);
      });
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Choose Your Plan</h1>
        <p className="text-gray-600 mt-1">Pick a meal plan that fits your fitness goals</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div key={plan.id} className="bg-white rounded-2xl border hover:shadow-lg transition-shadow overflow-hidden">
            <div className={`p-6 ${plan.plan_type === 'fixed' ? 'bg-brand-gold/30' : 'bg-brand-green/5'}`}>
              <div className="flex items-center gap-2 mb-3">
                <Dumbbell className="w-5 h-5 text-brand-green" />
                <Badge status={plan.plan_type === 'fixed' ? 'confirmed' : 'active'} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <p className="text-3xl font-bold text-brand-green mt-2">{formatCurrency(plan.price)}</p>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" /> {plan.duration_days} days
                </span>
                <span className="capitalize">{plan.duration_type.replace('_', ' ')}</span>
              </div>
              <Link
                href={`/customer/plans/${plan.id}`}
                className="block text-center bg-brand-green text-white py-2.5 rounded-lg font-medium hover:bg-brand-green-light transition-colors"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
