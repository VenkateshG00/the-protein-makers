import { Suspense } from 'react';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import PlanDetail from './PlanDetail';

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <PlanDetail />
    </Suspense>
  );
}
