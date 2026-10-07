'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import Badge from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { Users, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/types/database';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchCustomers() {
      const supabase = createClient();
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'customer')
        .order('created_at', { ascending: false });
      setCustomers(data as User[] || []);
      setLoading(false);
    }
    fetchCustomers();
  }, []);

  const filtered = customers.filter(c =>
    !search ||
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <span className="text-sm text-gray-500">{customers.length} total</span>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text" placeholder="Search by name, email, or phone..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-green outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No customers found" description="No customers match your search." />
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(customer => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{customer.full_name}</td>
                    <td className="px-4 py-3 text-gray-600">{customer.email}</td>
                    <td className="px-4 py-3 text-gray-600">{customer.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge status={customer.is_active ? 'active' : 'inactive'} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {format(new Date(customer.created_at), 'dd MMM yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="text-brand-green hover:underline text-sm font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
