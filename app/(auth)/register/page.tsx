'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { registerSchema } from '@/lib/validations/schemas';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function updateField(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    setFieldErrors(prev => ({ ...prev, [field]: '' }));
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const result = registerSchema.safeParse(form);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        errors[issue.path[0] as string] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.full_name,
          phone: form.phone,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push('/customer/dashboard');
    router.refresh();
  }

  const fields = [
    { name: 'full_name', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
    { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: '9876543210' },
    { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
    { name: 'confirm_password', label: 'Confirm Password', type: 'password', placeholder: '••••••••' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Create your account</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        {fields.map(field => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
            <input
              type={field.type}
              required
              value={form[field.name as keyof typeof form]}
              onChange={(e) => updateField(field.name, e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-brand-green outline-none"
              placeholder={field.placeholder}
            />
            {fieldErrors[field.name] && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors[field.name]}</p>
            )}
          </div>
        ))}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-green text-white py-2.5 rounded-lg font-medium hover:bg-brand-green-light transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="text-brand-green font-medium hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}
