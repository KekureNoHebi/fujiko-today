'use client';

import { BackButton } from '@/components/back-button';
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
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <BackButton />

      <div className="text-center py-16">
        <h2 className="text-2xl font-semibold mb-4">
          <T>Failed to load article</T>
        </h2>
        <p className="text-muted-foreground mb-6">{error.message}</p>
        <Button onClick={reset}>
          <T>Try again</T>
        </Button>
      </div>
    </div>
  );
}
