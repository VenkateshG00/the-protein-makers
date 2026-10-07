import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (!['admin', 'staff', 'kitchen'].includes(profile?.role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const date = request.nextUrl.searchParams.get('date');
  if (!date) return NextResponse.json({ error: 'Date is required' }, { status: 400 });

  const { data: orderItems, error } = await supabase
    .from('order_items')
    .select(`
      meal_id,
      meal_time,
      quantity,
      meal:meals(id, name, category_id, dietary_tag, ingredients, category:categories(name))
    `)
    .eq('order_id', supabase.from('orders').select('id').eq('order_date', date).not('status', 'in', '("cancelled","failed")'));

  // Alternative approach: join through orders
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_id, status, order_items(*, meal:meals(id, name, category_id, dietary_tag, ingredients, category:categories(name)))')
    .eq('order_date', date)
    .not('status', 'in', '("cancelled","failed")');

  if (!orders) return NextResponse.json({ morning: [], afternoon: [], dinner: [], totals: { morning: 0, afternoon: 0, dinner: 0, total: 0 } });

  const mealAggregation: Record<string, Record<string, { meal_name: string; category: string; dietary_tag: string; quantity: number; ingredients: string }>> = {
    morning: {},
    afternoon: {},
    dinner: {},
  };

  for (const order of orders) {
    for (const item of order.order_items || []) {
      const time = item.meal_time as string;
      const key = item.meal_id;
      if (!mealAggregation[time]) mealAggregation[time] = {};
      if (!mealAggregation[time][key]) {
        mealAggregation[time][key] = {
          meal_name: item.meal?.name || 'Unknown',
          category: item.meal?.category?.name || 'Unknown',
          dietary_tag: item.meal?.dietary_tag || 'non_veg',
          quantity: 0,
          ingredients: item.meal?.ingredients || '',
        };
      }
      mealAggregation[time][key].quantity += item.quantity;
    }
  }

  const result = {
    morning: Object.values(mealAggregation.morning).sort((a, b) => b.quantity - a.quantity),
    afternoon: Object.values(mealAggregation.afternoon).sort((a, b) => b.quantity - a.quantity),
    dinner: Object.values(mealAggregation.dinner).sort((a, b) => b.quantity - a.quantity),
    totals: {
      morning: Object.values(mealAggregation.morning).reduce((sum, m) => sum + m.quantity, 0),
      afternoon: Object.values(mealAggregation.afternoon).reduce((sum, m) => sum + m.quantity, 0),
      dinner: Object.values(mealAggregation.dinner).reduce((sum, m) => sum + m.quantity, 0),
      total: Object.values(mealAggregation.morning).reduce((sum, m) => sum + m.quantity, 0) +
             Object.values(mealAggregation.afternoon).reduce((sum, m) => sum + m.quantity, 0) +
             Object.values(mealAggregation.dinner).reduce((sum, m) => sum + m.quantity, 0),
    },
    order_count: orders.length,
    date,
  };

  return NextResponse.json(result);
}
