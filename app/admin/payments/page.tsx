'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import Badge from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/lib/utils/format';
import EmptyState from '@/components/ui/EmptyState';
import { CreditCard } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Payment {
  id: string;
  subscription_id: string;
  amount: number;
  status: string;
  payment_method: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
  subscription?: { user?: { full_name: string; email: string }; meal_plan?: { name: string } };
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPayments() {
      const supabase = createClient();
      const { data } = await supabase
        .from('payments')
        .select('*, subscription:subscriptions(user:users(full_name, email), meal_plan:meal_plans(name))')
        .order('created_at', { ascending: false })
        .limit(50);
      setPayments((data as Payment[]) || []);
      setLoading(false);
    }
    fetchPayments();
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500 mt-1">{payments.length} payments</p>
        </div>
      </div>

      {payments.length === 0 ? (
        <EmptyState icon={CreditCard} title="No payments yet" description="Payment records will appear here." />
      ) : (
        <div className="bg-white rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Customer</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Plan</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Method</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Razorpay ID</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{p.subscription?.user?.full_name || '—'}</p>
                    <p className="text-xs text-gray-500">{p.subscription?.user?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{p.subscription?.meal_plan?.name || '—'}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(p.amount)}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{p.payment_method || '—'}</td>
                  <td className="px-4 py-3"><Badge status={p.status} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{format(new Date(p.created_at), 'dd MMM yyyy, HH:mm')}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.razorpay_payment_id || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
