import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { subscription_id, pause_group_id, dates } = await request.json();

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  const isAdmin = profile?.role === 'admin';

  const { data: pausedDays } = await supabase
    .from('subscription_calendar')
    .select('*')
    .eq('subscription_id', subscription_id)
    .eq('pause_group_id', pause_group_id)
    .eq('status', 'paused')
    .order('date');

  if (!pausedDays || pausedDays.length === 0) {
    return NextResponse.json({ error: 'No paused days found for this group' }, { status: 404 });
  }

  if (!isAdmin && dates) {
    const remainingDates = pausedDays
      .filter(d => !dates.includes(d.date))
      .map(d => d.date);

    if (remainingDates.length > 0 && remainingDates.length < 5) {
      return NextResponse.json(
        { error: 'Remaining paused days must be at least 5 consecutive days, or un-pause the entire block' },
        { status: 400 }
      );
    }
  }

  const datesToUnpause = dates || pausedDays.map((d: { date: string }) => d.date);

  const { error } = await supabase
    .from('subscription_calendar')
    .update({ status: 'scheduled', pause_group_id: null })
    .eq('subscription_id', subscription_id)
    .eq('pause_group_id', pause_group_id)
    .in('date', datesToUnpause);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
