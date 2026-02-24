'use client';

import { useEffect } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 px-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-semibold">Dashboard error</h2>
      <p className="text-muted-foreground text-center max-w-md">
        Something went wrong while loading the dashboard. Please try again.
      </p>
      <Button onClick={reset}>
        <RotateCcw className="mr-2 h-4 w-4" />
        Try again
      </Button>
    </div>
  );
}
