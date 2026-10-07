'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Dumbbell } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/lib/utils/format';
import type { MealPlan } from '@/types/database';

export default function PlanDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/plans')
      .then(res => res.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        setPlan(arr.find((p: MealPlan) => p.id === id) || null);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <PageLoader />;
  if (!plan) return <div className="text-center py-12 text-gray-500">Plan not found</div>;

  const items = plan.meal_plan_items || [];
  const days = [...new Set(items.map(i => i.day_number))].sort((a, b) => a - b);

  return (
    <div>
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Plans
      </button>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className={`p-8 ${plan.plan_type === 'fixed' ? 'bg-brand-gold/30' : 'bg-brand-green/5'}`}>
          <div className="flex items-center gap-2 mb-3">
            <Dumbbell className="w-5 h-5 text-brand-green" />
            <Badge status={plan.plan_type === 'fixed' ? 'confirmed' : 'active'} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{plan.name}</h1>
          <p className="text-gray-600 mb-4">{plan.description}</p>
          <div className="flex items-center gap-6">
            <p className="text-4xl font-bold text-brand-green">{formatCurrency(plan.price)}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> {plan.duration_days} days
              </span>
              <span className="capitalize">{plan.duration_type.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        <div className="p-8">
          {plan.plan_type === 'fixed' && items.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Included Meals</h2>
              <div className="space-y-4">
                {days.map(day => {
                  const dayItems = items.filter(i => i.day_number === day);
                  return (
                    <div key={day} className="border rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">Day {day}</h3>
                      <div className="space-y-2">
                        {dayItems.map(item => (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{item.meal?.name || 'Meal'}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-gray-500 capitalize">{item.meal_time}</span>
                              <span className="text-gray-500">x{item.quantity}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {plan.plan_type === 'customized' && (
            <div className="mb-8 p-6 bg-brand-gold-light rounded-xl">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Customized Plan</h2>
              <p className="text-sm text-gray-600">
                With this plan, you choose your own meals from our full menu. Pick meals for morning, afternoon, and dinner based on your fitness goals.
              </p>
            </div>
          )}

          <Button
            size="lg"
            className="w-full"
            onClick={() => router.push(`/customer/subscribe?plan=${plan.id}`)}
          >
            Subscribe to this Plan — {formatCurrency(plan.price)}
          </Button>
        </div>
      </div>
    </div>
  );
}
