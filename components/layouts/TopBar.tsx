'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, User as UserIcon, LogOut, Calendar, ShoppingCart, Home, UtensilsCrossed } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/types/database';

const navItems = [
  { href: '/customer/dashboard', label: 'Dashboard', icon: Home },
  { href: '/customer/plans', label: 'Plans', icon: UtensilsCrossed },
  { href: '/customer/calendar', label: 'Calendar', icon: Calendar },
  { href: '/customer/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/customer/profile', label: 'Profile', icon: UserIcon },
];

export default function TopBar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.from('users').select('*').single().then(({ data }) => {
      if (data) setUser(data as User);
    });
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="bg-white border-b sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link href="/customer/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-green rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">TPM</span>
              </div>
              <span className="text-lg font-semibold text-brand-green-dark hidden sm:block">
                The Protein Makers
              </span>
            </Link>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    active
                      ? 'bg-brand-gold text-brand-green-dark font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User menu */}
          <div className="flex items-center gap-3">
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                <div className="w-8 h-8 bg-brand-gold rounded-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-brand-green-dark" />
                </div>
                <span className="text-sm text-gray-700 hidden sm:block">
                  {user?.full_name || 'User'}
                </span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1">
                  <Link
                    href="/customer/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <UserIcon className="w-4 h-4" />
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-50 w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="md:hidden py-3 border-t">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
                    active
                      ? 'bg-brand-gold text-brand-green-dark font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}
