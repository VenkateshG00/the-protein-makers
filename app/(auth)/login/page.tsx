import { Suspense } from 'react';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import LoginForm from './LoginForm';

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <LoginForm />
    </Suspense>
  );
}
