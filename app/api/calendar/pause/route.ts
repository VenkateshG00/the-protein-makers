import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function areDatesConsecutive(dates: string[]): boolean {
  const sorted = [...dates].sort();
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff !== 1) return false;
  }
  return true;
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { subscription_id, dates } = await request.json();

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  const isAdmin = profile?.role === 'admin';

  if (!isAdmin) {
    if (!dates || dates.length < 5) {
      return NextResponse.json(
        { error: 'Minimum 5 consecutive days required to pause' },
        { status: 400 }
      );
    }
    if (!areDatesConsecutive(dates)) {
      return NextResponse.json(
        { error: 'Paused days must be consecutive' },
        { status: 400 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const firstDate = new Date(dates.sort()[0]);
    if (firstDate <= today) {
      return NextResponse.json(
        { error: 'Cannot pause past or current day' },
        { status: 400 }
      );
    }
  }

  const pauseGroupId = crypto.randomUUID();

  const { error } = await supabase
    .from('subscription_calendar')
    .update({ status: 'paused', pause_group_id: pauseGroupId })
    .eq('subscription_id', subscription_id)
    .in('date', dates)
    .in('status', ['scheduled']);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('subscription_id', subscription_id)
    .in('order_date', dates)
    .in('status', ['pending', 'confirmed']);

  return NextResponse.json({ success: true, pause_group_id: pauseGroupId });
}
