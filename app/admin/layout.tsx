import { Suspense } from 'react';
import Sidebar from '@/components/layouts/Sidebar';
import { ToastProvider } from '@/components/ui/Toast';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-[#F9FAF8]">
        <Suspense>
          <Sidebar />
        </Suspense>
        <main className="flex-1 lg:ml-0">
          <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-6">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
