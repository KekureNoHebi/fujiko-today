'use client';

import { Button } from '@/components/ui/button';
import { T } from 'gt-next';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container mx-auto py-16 px-4 text-center">
      <h2 className="text-2xl font-semibold mb-4">
        <T>Something went wrong</T>
      </h2>
      <p className="text-muted-foreground mb-6">{error.message}</p>
      <Button onClick={reset}>
        <T>Try again</T>
      </Button>
    </div>
  );
}
