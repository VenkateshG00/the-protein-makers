import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const DEFAULT_CHARGE = 300;

export async function GET(request: NextRequest) {
  const pincode = request.nextUrl.searchParams.get('pincode');
  if (!pincode) return NextResponse.json({ error: 'Pincode required' }, { status: 400 });

  const supabase = await createClient();
  const { data } = await supabase
    .from('pincode_delivery_charges')
    .select('*')
    .eq('pincode', pincode.trim())
    .single();

  if (data) {
    return NextResponse.json({
      pincode: data.pincode,
      area_name: data.area_name,
      distance_tier: data.distance_tier,
      delivery_charge: data.delivery_charge,
      is_serviceable: data.is_serviceable,
    });
  }

  return NextResponse.json({
    pincode: pincode.trim(),
    area_name: 'Other Area',
    distance_tier: '15+ km',
    delivery_charge: DEFAULT_CHARGE,
    is_serviceable: true,
  });
}
