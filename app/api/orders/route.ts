import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  const searchParams = request.nextUrl.searchParams;
  const dateFilter = searchParams.get('date');
  const statusFilter = searchParams.get('status');

  let query = supabase
    .from('orders')
    .select('*, order_items(*, meal:meals(id, name, dietary_tag, photo_url)), user:users(id, full_name, email, phone), delivery_person:users!orders_delivery_person_id_fkey(id, full_name, phone), delivery_zone:delivery_zones(id, name)')
    .order('order_date', { ascending: false });

  if (profile?.role === 'customer') {
    query = query.eq('user_id', user.id);
  }

  if (dateFilter) query = query.eq('order_date', dateFilter);
  if (statusFilter) query = query.eq('status', statusFilter);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (!['admin', 'staff', 'delivery'].includes(profile?.role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { id, ...updates } = body;
  const { data, error } = await supabase.from('orders').update(updates).eq('id', id).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
