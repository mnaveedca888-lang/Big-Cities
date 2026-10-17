import { Helmet } from 'react-helmet-async';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingPage() {
  return (
    <>
      <Helmet>
        <title>Loading | Big Cities Event Monitor</title>
      </Helmet>
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      </div>
    </>
  );
}

