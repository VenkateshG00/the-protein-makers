import { Suspense } from 'react';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import SubscribeFlow from './SubscribeFlow';

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <SubscribeFlow />
    </Suspense>
  );
}
