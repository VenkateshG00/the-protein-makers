'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Check, ChefHat, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/lib/utils/format';
import { createClient } from '@/lib/supabase/client';
import type { MealPlan, Meal, Category, PincodeDeliveryCharge } from '@/types/database';

type Step = 'meals' | 'address' | 'review';

interface SelectedMeal {
  meal_id: string;
  meal_time: 'morning' | 'afternoon' | 'dinner';
  quantity: number;
  meal?: Meal;
}

export default function SubscribePage() {
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan');
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>('meals');
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedMeals, setSelectedMeals] = useState<SelectedMeal[]>([]);

  const [address, setAddress] = useState({
    address_line1: '',
    address_line2: '',
    landmark: '',
    city: 'Hyderabad',
    pincode: '',
  });
  const [savedAddressId, setSavedAddressId] = useState('');
  const [pincodeInfo, setPincodeInfo] = useState<PincodeDeliveryCharge | null>(null);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState<{ coupon_id: string; discount_amount: number } | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/plans').then(r => r.json()),
      fetch('/api/meals').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
    ]).then(([plans, mealsData, catsData]) => {
      const planArr = Array.isArray(plans) ? plans : [];
      setPlan(planArr.find((p: MealPlan) => p.id === planId) || null);
      setMeals(Array.isArray(mealsData) ? mealsData : []);
      setCategories(Array.isArray(catsData) ? catsData : []);
      setLoading(false);
    });
  }, [planId]);

  async function lookupPincode(pincode: string) {
    if (pincode.length !== 6) {
      setPincodeInfo(null);
      return;
    }
    setPincodeLoading(true);
    const res = await fetch(`/api/delivery-charge?pincode=${pincode}`);
    const data = await res.json();
    setPincodeInfo(data);
    setPincodeLoading(false);
  }

  function toggleMeal(meal: Meal, mealTime: 'morning' | 'afternoon' | 'dinner') {
    setSelectedMeals(prev => {
      const exists = prev.find(m => m.meal_id === meal.id && m.meal_time === mealTime);
      if (exists) return prev.filter(m => !(m.meal_id === meal.id && m.meal_time === mealTime));
      return [...prev, { meal_id: meal.id, meal_time: mealTime, quantity: 1, meal }];
    });
  }

  function isMealSelected(mealId: string, mealTime: string) {
    return selectedMeals.some(m => m.meal_id === mealId && m.meal_time === mealTime);
  }

  async function applyCoupon() {
    if (!couponCode || !plan) return;
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponCode, amount: plan.price }),
    });
    if (res.ok) {
      const data = await res.json();
      setCouponResult(data);
      showToast('Coupon applied!');
    } else {
      const err = await res.json();
      showToast(err.error, 'error');
      setCouponResult(null);
    }
  }

  async function handleSubscribe() {
    if (!plan || !pincodeInfo) return;
    setProcessing(true);

    try {
      const supabase = createClient();

      const { data: addr, error: addrError } = await supabase
        .from('customer_addresses')
        .insert({
          ...address,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          delivery_charge: pincodeInfo.delivery_charge,
        })
        .select()
        .single();

      if (addrError) throw new Error(addrError.message);

      const subRes = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meal_plan_id: plan.id,
          address_id: addr.id,
          meals: plan.plan_type === 'customized' ? selectedMeals : [],
          coupon_id: couponResult?.coupon_id || null,
        }),
      });

      if (!subRes.ok) throw new Error('Failed to create subscription');
      const subscription = await subRes.json();

      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription_id: subscription.id }),
      });

      if (!orderRes.ok) throw new Error('Failed to create payment order');
      const orderData = await orderRes.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'The Protein Makers',
        description: `Subscription: ${plan.name}`,
        order_id: orderData.order_id,
        handler: async function (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) {
          const verifyRes = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...response,
              subscription_id: subscription.id,
            }),
          });

          if (verifyRes.ok) {
            showToast('Payment successful! Subscription activated.');
            router.push('/customer/dashboard');
          } else {
            showToast('Payment verification failed', 'error');
          }
          setProcessing(false);
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: { color: '#1B5E20' },
        modal: {
          ondismiss: function () {
            setProcessing(false);
          },
        },
      };

      const razorpay = new (window as unknown as { Razorpay: new (opts: typeof options) => { open: () => void } }).Razorpay(options);
      razorpay.open();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      showToast(message, 'error');
      setProcessing(false);
    }
  }

  if (loading) return <PageLoader />;
  if (!plan) return <div className="text-center py-12 text-gray-500">Plan not found</div>;

  const deliveryCharge = pincodeInfo?.delivery_charge || 0;
  const deliveryTotal = deliveryCharge * plan.duration_days;
  const discount = couponResult?.discount_amount || 0;
  const total = plan.price + deliveryTotal - discount;

  const steps: { key: Step; label: string }[] = [
    { key: 'meals', label: 'Select Meals' },
    { key: 'address', label: 'Delivery Address' },
    { key: 'review', label: 'Review & Pay' },
  ];

  return (
    <div>
      {/* Razorpay script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium cursor-pointer ${
                step === s.key ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-500'
              }`}
              onClick={() => {
                if (steps.findIndex(x => x.key === s.key) <= steps.findIndex(x => x.key === step)) {
                  setStep(s.key);
                }
              }}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
                {i + 1}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < steps.length - 1 && <div className="w-8 h-0.5 bg-gray-200 mx-1" />}
          </div>
        ))}
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Step 1: Meals */}
        {step === 'meals' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {plan.plan_type === 'fixed' ? 'Your Included Meals' : 'Choose Your Meals'}
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              {plan.plan_type === 'fixed'
                ? 'These meals are included in your fixed plan.'
                : 'Select meals for morning, afternoon, and dinner.'}
            </p>

            {plan.plan_type === 'customized' && (
              <>
                {['morning', 'afternoon', 'dinner'].map(time => (
                  <div key={time} className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 capitalize mb-4">{time} Meals</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {meals.map(meal => (
                        <div
                          key={`${meal.id}-${time}`}
                          onClick={() => toggleMeal(meal, time as 'morning' | 'afternoon' | 'dinner')}
                          className={`relative bg-white rounded-xl border p-4 cursor-pointer transition-all ${
                            isMealSelected(meal.id, time)
                              ? 'border-brand-green ring-2 ring-brand-green/20'
                              : 'hover:shadow-md'
                          }`}
                        >
                          {isMealSelected(meal.id, time) && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-brand-green rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                          <div className="flex items-start gap-3">
                            <div className="w-14 h-14 bg-brand-gold/30 rounded-lg flex items-center justify-center shrink-0">
                              <ChefHat className="w-6 h-6 text-brand-green/40" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 text-sm">{meal.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge status={meal.dietary_tag} />
                                <span className="text-xs text-gray-500">{meal.protein_grams}g protein</span>
                              </div>
                              <p className="text-sm font-semibold text-brand-green mt-1">{formatCurrency(meal.price)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}

            {plan.plan_type === 'fixed' && (
              <div className="bg-brand-gold-light rounded-xl p-6">
                <p className="text-sm text-gray-600">
                  Your fixed plan includes pre-selected meals for each day. No customization needed.
                </p>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <Button onClick={() => setStep('address')}>
                Continue to Address
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Address */}
        {step === 'address' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Delivery Address</h2>
            <div className="bg-white rounded-xl border p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
                <input
                  type="text" required value={address.address_line1}
                  onChange={e => setAddress(a => ({ ...a, address_line1: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none"
                  placeholder="Flat/House No, Building Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                <input
                  type="text" value={address.address_line2}
                  onChange={e => setAddress(a => ({ ...a, address_line2: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none"
                  placeholder="Street, Area"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Landmark</label>
                  <input
                    type="text" value={address.landmark}
                    onChange={e => setAddress(a => ({ ...a, landmark: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none"
                    placeholder="Near..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                  <input
                    type="text" required value={address.pincode}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setAddress(a => ({ ...a, pincode: val }));
                      if (val.length === 6) lookupPincode(val);
                      else setPincodeInfo(null);
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none"
                    placeholder="500084"
                    maxLength={6}
                  />
                </div>
              </div>

              {/* Auto-calculated delivery info */}
              {pincodeLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
                  <Loader2 className="w-4 h-4 animate-spin" /> Checking delivery availability...
                </div>
              )}
              {pincodeInfo && !pincodeLoading && (
                <div className={`p-4 rounded-lg ${pincodeInfo.is_serviceable ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  {pincodeInfo.is_serviceable ? (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-green-800">
                          {pincodeInfo.area_name} ({pincodeInfo.distance_tier})
                        </p>
                        <p className="font-bold text-green-800">{formatCurrency(pincodeInfo.delivery_charge)}/day</p>
                      </div>
                      <p className="text-xs text-green-600">
                        Total delivery for {plan.duration_days} days: {formatCurrency(pincodeInfo.delivery_charge * plan.duration_days)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-red-700 font-medium">
                      Sorry, delivery is not available in this area yet. Please contact us for assistance.
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep('meals')}>Back</Button>
              <Button
                onClick={() => setStep('review')}
                disabled={!address.address_line1 || !address.pincode || !pincodeInfo?.is_serviceable}
              >
                Continue to Review
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Pay */}
        {step === 'review' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Review</h2>
            <div className="bg-white rounded-xl border divide-y">
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Plan: {plan.name}</h3>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Badge status={plan.plan_type} />
                  <span>{plan.duration_days} days</span>
                </div>
              </div>

              {selectedMeals.length > 0 && (
                <div className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Selected Meals</h3>
                  <div className="space-y-2">
                    {selectedMeals.map((m, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{m.meal?.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-500 capitalize">{m.meal_time}</span>
                          <span className="font-medium">{formatCurrency(m.meal?.price || 0)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Delivery Address</h3>
                <p className="text-sm text-gray-600">
                  {address.address_line1}
                  {address.address_line2 && `, ${address.address_line2}`}
                  {address.landmark && ` (Near ${address.landmark})`}
                  <br />{address.city} - {address.pincode}
                </p>
                {pincodeInfo && (
                  <p className="text-sm text-brand-green font-medium mt-1">
                    {pincodeInfo.area_name} — {formatCurrency(deliveryCharge)}/day x {plan.duration_days} days = {formatCurrency(deliveryTotal)}
                  </p>
                )}
              </div>

              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Have a coupon?</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none text-sm"
                  />
                  <Button variant="outline" size="sm" onClick={applyCoupon}>Apply</Button>
                </div>
                {couponResult && (
                  <p className="text-sm text-green-600 mt-2">
                    Coupon applied! You save {formatCurrency(couponResult.discount_amount)}
                  </p>
                )}
              </div>

              <div className="p-6 bg-gray-50">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Meal Plan ({plan.duration_days} days)</span>
                    <span className="font-medium">{formatCurrency(plan.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery ({formatCurrency(deliveryCharge)}/day x {plan.duration_days})</span>
                    <span className="font-medium">{formatCurrency(deliveryTotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total</span>
                    <span className="text-brand-green">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep('address')}>Back</Button>
              <Button size="lg" onClick={handleSubscribe} disabled={processing}>
                {processing ? 'Processing...' : `Pay ${formatCurrency(total)}`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
