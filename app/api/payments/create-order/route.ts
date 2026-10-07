import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { subscription_id } = await request.json();

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', subscription_id)
    .eq('user_id', user.id)
    .single();

  if (!subscription) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });

  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const order = await razorpay.orders.create({
      amount: Math.round(subscription.total_amount * 100),
      currency: 'INR',
      receipt: `sub_${subscription.id.slice(0, 8)}`,
      notes: {
        subscription_id: subscription.id,
        user_id: user.id,
      },
    });

    const { data: payment } = await supabase
      .from('payments')
      .insert({
        subscription_id: subscription.id,
        user_id: user.id,
        amount: subscription.total_amount,
        currency: 'INR',
        razorpay_order_id: order.id,
        status: 'pending',
      })
      .select()
      .single();

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      payment_id: payment?.id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Payment creation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
