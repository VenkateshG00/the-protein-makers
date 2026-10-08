import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const bucket = (formData.get('bucket') as string) || 'meal-photos';

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });

  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) return NextResponse.json({ error: 'Only JPEG, PNG, and WebP allowed' }, { status: 400 });

  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, { contentType: file.type, upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);

  return NextResponse.json({ url: urlData.publicUrl });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { url, bucket = 'meal-photos' } = await request.json();
  if (!url) return NextResponse.json({ error: 'No URL provided' }, { status: 400 });

  const parts = url.split(`/storage/v1/object/public/${bucket}/`);
  if (parts.length < 2) return NextResponse.json({ error: 'Invalid storage URL' }, { status: 400 });

  const filePath = parts[1];
  const { error } = await supabase.storage.from(bucket).remove([filePath]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
