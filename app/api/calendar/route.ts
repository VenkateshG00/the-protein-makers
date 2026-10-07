import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const subscriptionId = request.nextUrl.searchParams.get('subscription_id');

  let query = supabase
    .from('subscription_calendar')
    .select('*')
    .order('date', { ascending: true });

  if (subscriptionId) {
    query = query.eq('subscription_id', subscriptionId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
