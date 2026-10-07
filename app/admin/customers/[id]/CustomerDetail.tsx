'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User, Mail, Phone, Calendar, CreditCard, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import Badge from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/lib/utils/format';
import { createClient } from '@/lib/supabase/client';
import type { User as UserType, Subscription, CustomerAddress } from '@/types/database';

export default function CustomerDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<UserType | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const [userRes, subRes, addrRes] = await Promise.all([
        supabase.from('users').select('*').eq('id', id).single(),
        supabase.from('subscriptions').select('*, meal_plan:meal_plans(name)').eq('user_id', id).order('created_at', { ascending: false }),
        supabase.from('customer_addresses').select('*, delivery_zone:delivery_zones(name)').eq('user_id', id),
      ]);
      setCustomer(userRes.data as UserType);
      setSubscriptions(subRes.data as Subscription[] || []);
      setAddresses(addrRes.data as CustomerAddress[] || []);
      setLoading(false);
    }
    fetchData();
  }, [id]);

  if (loading) return <PageLoader />;
  if (!customer) return <div className="text-center py-12 text-gray-500">Customer not found</div>;

  return (
    <div>
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Customers
      </button>

      <div className="bg-white rounded-xl border overflow-hidden mb-6">
        <div className="p-6 bg-gradient-to-r from-brand-green-dark to-brand-green text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{customer.full_name}</h1>
              <div className="flex items-center gap-4 text-sm text-green-200 mt-1">
                <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{customer.email}</span>
                {customer.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{customer.phone}</span>}
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Joined {format(new Date(customer.created_at), 'dd MMM yyyy')}</span>
          <Badge status={customer.is_active ? 'active' : 'inactive'} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Subscriptions ({subscriptions.length})
          </h2>
          {subscriptions.length === 0 ? (
            <p className="text-sm text-gray-500">No subscriptions yet.</p>
          ) : (
            <div className="space-y-3">
              {subscriptions.map(sub => (
                <div key={sub.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">{sub.meal_plan?.name}</span>
                    <Badge status={sub.status} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{format(new Date(sub.start_date), 'dd MMM')} — {format(new Date(sub.end_date), 'dd MMM yyyy')}</span>
                    <span className="font-semibold text-gray-700">{formatCurrency(sub.total_amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Addresses ({addresses.length})
          </h2>
          {addresses.length === 0 ? (
            <p className="text-sm text-gray-500">No addresses saved.</p>
          ) : (
            <div className="space-y-3">
              {addresses.map(addr => (
                <div key={addr.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">{addr.address_line1}</p>
                  {addr.address_line2 && <p className="text-xs text-gray-600">{addr.address_line2}</p>}
                  <p className="text-xs text-gray-500 mt-1">
                    {addr.city} - {addr.pincode} | Zone: {addr.delivery_zone?.name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
