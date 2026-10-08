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
  const mealTimeFilter = searchParams.get('meal_time');

  let query = supabase
    .from('orders')
    .select('*, order_items(*, meal:meals(id, name, dietary_tag, photo_url, meal_type)), user:users!orders_user_id_fkey(id, full_name, email, phone)')
    .order('order_date', { ascending: false });

  if (profile?.role === 'customer') {
    query = query.eq('user_id', user.id);
  }

  if (dateFilter) query = query.eq('order_date', dateFilter);
  if (statusFilter) query = query.eq('status', statusFilter);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let result = Array.isArray(data) ? data : [];

  if (mealTimeFilter) {
    result = result.map(order => ({
      ...order,
      order_items: (order.order_items || []).filter((item: { meal_time: string }) => item.meal_time === mealTimeFilter),
    })).filter(order => order.order_items.length > 0);
  }

  return NextResponse.json(result);
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (!['admin', 'staff', 'delivery', 'kitchen'].includes(profile?.role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();

  const statusFlow = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];

  async function syncOrderStatus(orderIds: string[]) {
    const unique = [...new Set(orderIds)];
    for (const orderId of unique) {
      const { data: items } = await supabase
        .from('order_items')
        .select('status')
        .eq('order_id', orderId);
      if (!items || items.length === 0) continue;
      const statuses = items.map(i => i.status || 'pending');
      const uniqueStatuses = [...new Set(statuses)];
      let overall: string;
      if (uniqueStatuses.length === 1) {
        overall = uniqueStatuses[0];
      } else {
        const lowestIdx = Math.min(
          ...uniqueStatuses.map(s => statusFlow.indexOf(s)).filter(i => i >= 0)
        );
        overall = lowestIdx >= 0 ? statusFlow[lowestIdx] : statuses[0];
      }
      await supabase.from('orders').update({ status: overall }).eq('id', orderId);
    }
  }

  // Batch update: specific item IDs or all items for a meal_time + date
  if (body.batch_update) {
    const { item_ids, status, date, meal_time } = body.batch_update;

    if (item_ids && item_ids.length > 0) {
      const { data: updated, error } = await supabase
        .from('order_items')
        .update({ status })
        .in('id', item_ids)
        .select();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      const affectedOrderIds = (updated || []).map((i: any) => i.order_id);
      await syncOrderStatus(affectedOrderIds);
      return NextResponse.json({ updated: updated?.length || 0 });
    }

    const { data: orders } = await supabase
      .from('orders')
      .select('id')
      .eq('order_date', date);

    if (!orders || orders.length === 0) {
      return NextResponse.json({ error: 'No orders for this date' }, { status: 404 });
    }

    const orderIds = orders.map(o => o.id);
    const { data: updated, error } = await supabase
      .from('order_items')
      .update({ status })
      .in('order_id', orderIds)
      .eq('meal_time', meal_time)
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await syncOrderStatus(orderIds);
    return NextResponse.json({ updated: updated?.length || 0 });
  }

  // Single item status update
  if (body.item_id) {
    const { item_id, status } = body;
    const { data, error } = await supabase
      .from('order_items')
      .update({ status })
      .eq('id', item_id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await syncOrderStatus([data.order_id]);
    return NextResponse.json(data);
  }

  // Order-level update (existing)
  const { id, ...updates } = body;
  const { data, error } = await supabase.from('orders').update(updates).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await request.json();

  await supabase.from('order_items').delete().eq('order_id', id);
  const { error } = await supabase.from('orders').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
