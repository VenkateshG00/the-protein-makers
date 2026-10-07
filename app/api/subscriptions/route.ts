import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { addDays, format } from 'date-fns';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();

  let query = supabase
    .from('subscriptions')
    .select('*, meal_plan:meal_plans(*), address:customer_addresses(*, delivery_zone:delivery_zones(*)), user:users(id, full_name, email, phone)')
    .order('created_at', { ascending: false });

  if (profile?.role === 'customer') {
    query = query.eq('user_id', user.id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { meal_plan_id, address_id, meals: selectedMeals, coupon_id, start_date } = body;

  const { data: plan } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('id', meal_plan_id)
    .single();

  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

  const { data: address } = await supabase
    .from('customer_addresses')
    .select('*')
    .eq('id', address_id)
    .single();

  if (!address) return NextResponse.json({ error: 'Address not found' }, { status: 404 });

  const deliveryCharge = 0;
  let discountAmount = 0;

  if (coupon_id) {
    const { data: coupon } = await supabase.from('coupons').select('*').eq('id', coupon_id).single();
    if (coupon) {
      if (coupon.discount_type === 'percentage') {
        discountAmount = (plan.price * coupon.discount_value) / 100;
      } else {
        discountAmount = coupon.discount_value;
      }
      discountAmount = Math.min(discountAmount, plan.price);
    }
  }

  const totalAmount = plan.price + deliveryCharge - discountAmount;
  const startDate = start_date || format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const endDate = format(addDays(new Date(startDate), plan.duration_days - 1), 'yyyy-MM-dd');

  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .insert({
      user_id: user.id,
      meal_plan_id,
      address_id,
      start_date: startDate,
      end_date: endDate,
      status: 'pending',
      total_amount: totalAmount,
      delivery_charge: deliveryCharge,
      discount_amount: discountAmount,
      coupon_id: coupon_id || null,
      payment_status: 'pending',
    })
    .select()
    .single();

  if (subError) return NextResponse.json({ error: subError.message }, { status: 500 });

  if (selectedMeals?.length > 0) {
    const subMeals = selectedMeals.map((m: { meal_id: string; meal_time: string; quantity?: number }) => ({
      subscription_id: subscription.id,
      meal_id: m.meal_id,
      meal_time: m.meal_time,
      quantity: m.quantity || 1,
    }));
    await supabase.from('subscription_meals').insert(subMeals);
  }

  if (coupon_id) {
    try { await supabase.rpc('increment_coupon_usage', { coupon_uuid: coupon_id }); } catch { /* ignore */ }
  }

  return NextResponse.json(subscription, { status: 201 });
}
