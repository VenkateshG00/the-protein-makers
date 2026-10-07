import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { addDays, format } from 'date-fns';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, subscription_id } = await request.json();

  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    await supabase
      .from('payments')
      .update({ status: 'failed' })
      .eq('razorpay_order_id', razorpay_order_id);

    return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
  }

  await supabase
    .from('payments')
    .update({
      razorpay_payment_id,
      razorpay_signature,
      status: 'successful',
      payment_method: 'razorpay',
    })
    .eq('razorpay_order_id', razorpay_order_id);

  await supabase
    .from('subscriptions')
    .update({ status: 'active', payment_status: 'paid' })
    .eq('id', subscription_id);

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, meal_plan:meal_plans(*)')
    .eq('id', subscription_id)
    .single();

  if (subscription) {
    const startDate = new Date(subscription.start_date);
    const calendarEntries = [];

    for (let i = 0; i < subscription.meal_plan.duration_days; i++) {
      const date = addDays(startDate, i);
      calendarEntries.push({
        subscription_id: subscription.id,
        date: format(date, 'yyyy-MM-dd'),
        status: 'scheduled',
      });
    }

    await supabase.from('subscription_calendar').insert(calendarEntries);
  }

  return NextResponse.json({ success: true, subscription_id });
}
