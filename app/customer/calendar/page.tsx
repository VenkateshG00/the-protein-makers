import { Suspense } from 'react';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import CalendarView from './CalendarView';

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <CalendarView />
    </Suspense>
  );
}
