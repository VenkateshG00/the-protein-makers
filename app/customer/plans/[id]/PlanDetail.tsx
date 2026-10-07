'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Dumbbell, Flame, Drumstick, IndianRupee, Utensils } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/lib/utils/format';
import type { MealPlan, Meal } from '@/types/database';

const durationLabels: Record<string, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  six_day: '6-Day Cycle',
  twenty_six_day: '26-Day Plan',
  custom: 'Custom',
};

export default function PlanDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/plans').then(r => r.json()),
      fetch('/api/meals').then(r => r.json()),
    ]).then(([planData, mealData]) => {
      const planArr = Array.isArray(planData) ? planData : [];
      setPlan(planArr.find((p: MealPlan) => p.id === id) || null);
      setMeals(Array.isArray(mealData) ? mealData.filter((m: Meal) => m.is_available !== false) : []);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <PageLoader />;
  if (!plan) return <div className="text-center py-12 text-gray-500">Plan not found</div>;

  const items = plan.meal_plan_items || [];
  const days = [...new Set(items.map(i => i.day_number))].sort((a, b) => a - b);
  const perDay = plan.duration_days > 0 ? Math.round(plan.price / plan.duration_days) : 0;

  const breakfastMeals = meals.filter(m => m.meal_type === 'breakfast');
  const lunchMeals = meals.filter(m => m.meal_type === 'lunch');
  const dinnerMeals = meals.filter(m => m.meal_type === 'dinner');
  const snackMeals = meals.filter(m => m.meal_type === 'snack' || m.meal_type === 'pre_workout' || m.meal_type === 'add_on');

  return (
    <div>
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Plans
      </button>

      <div className="bg-white rounded-2xl border overflow-hidden mb-6">
        {/* Header */}
        <div className="p-8 bg-gradient-to-br from-brand-green-dark to-brand-green text-white">
          <div className="flex items-center gap-2 mb-3">
            <Dumbbell className="w-5 h-5" />
            <span className="text-sm font-medium bg-white/20 px-3 py-0.5 rounded-full">
              {plan.plan_type === 'fixed' ? 'Fixed Plan' : 'Customized Plan'}
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{plan.name}</h1>
          <p className="text-green-200 mb-6">{plan.description}</p>
          <div className="flex flex-wrap items-end gap-6">
            <div>
              <p className="text-green-200 text-sm">Total Price</p>
              <p className="text-4xl font-bold">{formatCurrency(plan.price)}</p>
            </div>
            <div>
              <p className="text-green-200 text-sm">Per Day</p>
              <p className="text-2xl font-bold">~{formatCurrency(perDay)}</p>
            </div>
            <div className="flex items-center gap-4 text-sm text-green-200">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> {plan.duration_days} days
              </span>
              <span>{durationLabels[plan.duration_type] || plan.duration_type}</span>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* What's Included - for fixed plans with linked items */}
          {plan.plan_type === 'fixed' && items.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Meal Schedule</h2>
              <div className="space-y-4">
                {days.map(day => {
                  const dayItems = items.filter(i => i.day_number === day);
                  return (
                    <div key={day} className="border rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">Day {day}</h3>
                      <div className="space-y-2">
                        {dayItems.map(item => (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Badge status={item.meal?.dietary_tag || 'non_veg'} />
                              <span className="text-gray-700">{item.meal?.name || 'Meal'}</span>
                            </div>
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

          {/* Show available meals from the menu */}
          {meals.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {plan.plan_type === 'fixed' && items.length > 0 ? 'Full Menu' : "What's on the Menu"}
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                {plan.plan_type === 'customized'
                  ? 'Choose your daily meals from our curated menu'
                  : 'Premium protein-packed meals included in this plan'}
              </p>

              {[
                { label: 'Breakfast', icon: '🌅', items: breakfastMeals },
                { label: 'Lunch', icon: '☀️', items: lunchMeals },
                { label: 'Dinner', icon: '🌙', items: dinnerMeals },
                { label: 'Snacks & Add-ons', icon: '💪', items: snackMeals },
              ].filter(g => g.items.length > 0).map(group => (
                <div key={group.label} className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span>{group.icon}</span> {group.label}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {group.items.map(meal => (
                      <div key={meal.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-12 h-12 bg-brand-gold-light rounded-lg flex items-center justify-center shrink-0">
                          <Utensils className="w-5 h-5 text-brand-green" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 text-sm truncate">{meal.name}</p>
                            <Badge status={meal.dietary_tag} />
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                            <span className="flex items-center gap-0.5">
                              <Drumstick className="w-3 h-3" /> {meal.protein_grams}g protein
                            </span>
                            <span className="flex items-center gap-0.5">
                              <Flame className="w-3 h-3" /> {meal.calories} kcal
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-semibold text-brand-green text-sm">{formatCurrency(meal.price)}</p>
                          <p className="text-[10px] text-gray-400">+ delivery</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {plan.plan_type === 'customized' && (
            <div className="mb-8 p-5 bg-brand-gold-light/50 rounded-xl border border-brand-gold/30">
              <h2 className="font-semibold text-gray-900 mb-1">Fully Customizable</h2>
              <p className="text-sm text-gray-600">
                Pick your own meals for breakfast, lunch, and dinner each day. Change them anytime during your subscription.
              </p>
            </div>
          )}

          {/* Price breakdown */}
          <div className="bg-gray-50 rounded-xl p-5 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Price Breakdown</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Per day cost (meals + delivery)</span>
                <span className="font-medium">~{formatCurrency(perDay)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration</span>
                <span className="font-medium">{plan.duration_days} days</span>
              </div>
              <div className="flex justify-between text-xs text-green-600">
                <span>Delivery charges</span>
                <span>Included in price</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-brand-green text-lg">{formatCurrency(plan.price)}</span>
              </div>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={() => router.push(`/customer/subscribe?plan=${plan.id}`)}
          >
            Subscribe Now — {formatCurrency(plan.price)}
          </Button>
        </div>
      </div>
    </div>
  );
}
