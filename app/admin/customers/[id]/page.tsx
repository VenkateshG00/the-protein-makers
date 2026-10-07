import { Suspense } from 'react';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import CustomerDetail from './CustomerDetail';

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <CustomerDetail />
    </Suspense>
  );
}
