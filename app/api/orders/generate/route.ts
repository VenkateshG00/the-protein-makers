import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { date } = await request.json();
  const targetDate = date || format(new Date(), 'yyyy-MM-dd');

  const { data: calendarEntries } = await supabase
    .from('subscription_calendar')
    .select('*, subscription:subscriptions(*, meal_plan:meal_plans(*), address:customer_addresses(*, delivery_zone:delivery_zones(*)), subscription_meals(*, meal:meals(*)))')
    .eq('date', targetDate)
    .eq('status', 'scheduled');

  if (!calendarEntries || calendarEntries.length === 0) {
    return NextResponse.json({ message: 'No scheduled entries for this date', generated: 0 });
  }

  const { data: existingOrders } = await supabase
    .from('orders')
    .select('subscription_id, order_date')
    .eq('order_date', targetDate);

  const existingSet = new Set(
    (existingOrders || []).map(o => `${o.subscription_id}_${o.order_date}`)
  );

  const { data: todayOrders } = await supabase
    .from('orders')
    .select('order_id')
    .like('order_id', `TPM-${targetDate.replace(/-/g, '')}-%`);

  let sequenceNumber = (todayOrders?.length || 0) + 1;
  let generated = 0;

  for (const entry of calendarEntries) {
    const key = `${entry.subscription_id}_${entry.date}`;
    if (existingSet.has(key)) continue;

    const sub = entry.subscription;
    if (!sub || sub.status !== 'active') continue;

    const orderId = `TPM-${targetDate.replace(/-/g, '')}-${String(sequenceNumber).padStart(3, '0')}`;
    const deliveryZoneId = sub.address?.delivery_zone_id;

    let meals = sub.subscription_meals || [];
    if (sub.meal_plan?.plan_type === 'fixed') {
      const { data: planItems } = await supabase
        .from('meal_plan_items')
        .select('*, meal:meals(*)')
        .eq('meal_plan_id', sub.meal_plan_id);
      meals = planItems || [];
    }

    let totalAmount = 0;
    const orderItems = meals.map((m: { meal_id: string; meal_time: string; quantity: number; meal?: { price: number } }) => {
      const price = m.meal?.price || 0;
      totalAmount += price * (m.quantity || 1);
      return {
        meal_id: m.meal_id,
        meal_time: m.meal_time,
        quantity: m.quantity || 1,
        unit_price: price,
      };
    });

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_id: orderId,
        subscription_id: entry.subscription_id,
        user_id: sub.user_id,
        calendar_id: entry.id,
        order_date: targetDate,
        status: 'pending',
        delivery_zone_id: deliveryZoneId,
        total_amount: totalAmount,
      })
      .select()
      .single();

    if (orderError) continue;

    if (orderItems.length > 0) {
      const items = orderItems.map((item: { meal_id: string; meal_time: string; quantity: number; unit_price: number }) => ({
        ...item,
        order_id: order.id,
      }));
      await supabase.from('order_items').insert(items);
    }

    sequenceNumber++;
    generated++;
  }

  return NextResponse.json({ message: `Generated ${generated} orders for ${targetDate}`, generated });
}
