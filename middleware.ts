import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const publicPaths = ['/', '/login', '/register', '/reset-password'];

const roleDashboards: Record<string, string> = {
  admin: '/admin/dashboard',
  staff: '/admin/dashboard',
  kitchen: '/kitchen/dashboard',
  delivery: '/delivery/dashboard',
  customer: '/customer/dashboard',
};

const rolePathPrefixes: Record<string, string[]> = {
  admin: ['/admin'],
  staff: ['/admin'],
  kitchen: ['/kitchen'],
  delivery: ['/delivery'],
  customer: ['/customer'],
};

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  if (publicPaths.includes(pathname) || pathname.startsWith('/api/')) {
    if (user && (pathname === '/login' || pathname === '/register')) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      const dashboard = roleDashboards[profile?.role || 'customer'];
      return NextResponse.redirect(new URL(dashboard, request.url));
    }
    return supabaseResponse;
  }

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role || 'customer';
  const allowedPrefixes = rolePathPrefixes[role] || ['/customer'];
  const isAllowed = allowedPrefixes.some(prefix => pathname.startsWith(prefix));

  if (!isAllowed) {
    const dashboard = roleDashboards[role];
    return NextResponse.redirect(new URL(dashboard, request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
