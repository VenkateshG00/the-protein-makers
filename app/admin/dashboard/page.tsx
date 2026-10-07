import { Suspense } from 'react';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import DashboardView from './DashboardView';

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <DashboardView />
    </Suspense>
  );
}
