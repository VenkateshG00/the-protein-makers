'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, UtensilsCrossed, Tags, ClipboardList,
  ShoppingCart, Truck, MapPin, FileText, CreditCard, Ticket,
  Settings, ScrollText, Menu, X, LogOut, ChevronDown
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import BrandLogo from '@/components/ui/BrandLogo';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/meals', label: 'Meals', icon: UtensilsCrossed },
  { href: '/admin/categories', label: 'Categories', icon: Tags },
  { href: '/admin/plans', label: 'Meal Plans', icon: ClipboardList },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: ShoppingCart },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/delivery-charges', label: 'Delivery Charges', icon: MapPin },
  { href: '/admin/deliveries', label: 'Deliveries', icon: Truck },
  { href: '/admin/reports', label: 'Reports', icon: FileText },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const nav = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-[#E3BA82]/20">
        <BrandLogo placement="sidebar" href="/admin/dashboard" collapsed={collapsed} />
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-[#E3BA82]/15 text-[#E3BA82] border-l-4 border-[#E3BA82] font-bold'
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-[#E3BA82]/20">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-sm text-white/75 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-brand-green text-white rounded-lg shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-brand-green-dark transform transition-transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1 text-white/70 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
        {nav}
      </aside>

      {/* Desktop sidebar */}
      <aside className={`hidden lg:block ${collapsed ? 'w-20' : 'w-64'} bg-brand-green-dark min-h-screen transition-all shrink-0`}>
        <button
          onClick={() => setCollapsed(c => !c)}
          className="absolute top-4 -right-3 z-10 w-6 h-6 bg-brand-green rounded-full flex items-center justify-center text-white shadow"
        >
          <ChevronDown className={`w-3 h-3 transition-transform ${collapsed ? '-rotate-90' : 'rotate-90'}`} />
        </button>
        <div className="sticky top-0 h-screen overflow-hidden">
          {nav}
        </div>
      </aside>
    </>
  );
}
