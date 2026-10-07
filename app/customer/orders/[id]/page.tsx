import { Suspense } from 'react';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import OrderDetail from './OrderDetail';

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <OrderDetail />
    </Suspense>
  );
}
