'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .single();

    const roleDashboards: Record<string, string> = {
      admin: '/admin/dashboard',
      staff: '/admin/dashboard',
      kitchen: '/kitchen/dashboard',
      delivery: '/delivery/dashboard',
      customer: '/customer/dashboard',
    };

    const destination = redirect || roleDashboards[profile?.role || 'customer'];
    router.push(destination);
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#E6DEC8]">
      <h2 className="text-xl font-extrabold text-[#0A4828] text-center mb-1">Welcome back</h2>
      <p className="text-xs text-stone-500 text-center mb-6">Sign in to manage your daily protein meals</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-brand-green outline-none"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-brand-green outline-none"
            placeholder="••••••••"
          />
        </div>
        <div className="flex items-center justify-between text-sm">
          <Link href="/reset-password" className="text-brand-green hover:underline">
            Forgot password?
          </Link>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#0A4828] text-[#E3BA82] py-2.5 rounded-lg font-bold hover:bg-[#145934] transition-colors disabled:opacity-50 shadow"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-brand-green font-medium hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
