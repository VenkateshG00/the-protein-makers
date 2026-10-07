import { Suspense } from 'react';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import ReportsView from './ReportsView';

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ReportsView />
    </Suspense>
  );
}
