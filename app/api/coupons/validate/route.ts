import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { code, amount } = await request.json();

  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single();

  if (error || !coupon) {
    return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 });
  }

  const today = new Date().toISOString().split('T')[0];
  if (coupon.valid_from > today || coupon.valid_until < today) {
    return NextResponse.json({ error: 'Coupon has expired' }, { status: 400 });
  }

  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
    return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 });
  }

  if (coupon.min_order_amount && amount < coupon.min_order_amount) {
    return NextResponse.json(
      { error: `Minimum order amount is ₹${coupon.min_order_amount}` },
      { status: 400 }
    );
  }

  let discount = 0;
  if (coupon.discount_type === 'percentage') {
    discount = (amount * coupon.discount_value) / 100;
  } else {
    discount = coupon.discount_value;
  }

  return NextResponse.json({
    coupon_id: coupon.id,
    discount_type: coupon.discount_type,
    discount_value: coupon.discount_value,
    discount_amount: Math.min(discount, amount),
  });
}
