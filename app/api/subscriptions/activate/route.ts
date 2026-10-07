import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { addDays, format } from 'date-fns';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const { subscription_id } = await request.json();

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, meal_plan:meal_plans(*)')
    .eq('id', subscription_id)
    .single();

  if (!subscription) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
  }

  if (subscription.status === 'active') {
    return NextResponse.json({ error: 'Already active' }, { status: 400 });
  }

  await supabase
    .from('subscriptions')
    .update({ status: 'active', payment_status: 'paid' })
    .eq('id', subscription_id);

  const { data: existing } = await supabase
    .from('subscription_calendar')
    .select('id')
    .eq('subscription_id', subscription_id)
    .limit(1);

  if (!existing || existing.length === 0) {
    const startDate = new Date(subscription.start_date);
    const calendarEntries = [];

    for (let i = 0; i < subscription.meal_plan.duration_days; i++) {
      calendarEntries.push({
        subscription_id: subscription.id,
        date: format(addDays(startDate, i), 'yyyy-MM-dd'),
        status: 'scheduled',
      });
    }

    await supabase.from('subscription_calendar').insert(calendarEntries);
  }

  return NextResponse.json({ success: true });
}
