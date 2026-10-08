import { Suspense } from 'react';
import TopBar from '@/components/layouts/TopBar';
import { ToastProvider } from '@/components/ui/Toast';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#F9FAF8]">
        <Suspense>
          <TopBar />
        </Suspense>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
