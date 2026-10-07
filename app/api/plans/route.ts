import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('meal_plans')
    .select('*, meal_plan_items(*, meal:meals(id, name, price, protein_grams, calories, dietary_tag, photo_url))')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { items, ...planData } = body;

  const { data: plan, error: planError } = await supabase
    .from('meal_plans')
    .insert(planData)
    .select()
    .single();

  if (planError) return NextResponse.json({ error: planError.message }, { status: 500 });

  if (items?.length > 0) {
    const planItems = items.map((item: { meal_id: string; day_number: number; meal_time: string; quantity?: number }) => ({
      ...item,
      meal_plan_id: plan.id,
    }));
    const { error: itemsError } = await supabase.from('meal_plan_items').insert(planItems);
    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  return NextResponse.json(plan, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { id, items, ...updates } = body;

  const { data, error } = await supabase.from('meal_plans').update(updates).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (items !== undefined) {
    await supabase.from('meal_plan_items').delete().eq('meal_plan_id', id);
    if (items.length > 0) {
      const planItems = items.map((item: { meal_id: string; day_number: number; meal_time: string; quantity?: number }) => ({
        ...item,
        meal_plan_id: id,
      }));
      await supabase.from('meal_plan_items').insert(planItems);
    }
  }

  return NextResponse.json(data);
}
