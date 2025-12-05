import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-[min(65ch,calc(100vw-2rem))] sm:max-w-[min(70ch,calc(100vw-3rem))] lg:max-w-[min(75ch,calc(100vw-4rem))]">
        {/* Back to list button skeleton */}
        <Skeleton className="h-9 w-24" />

        <article className="mt-3 sm:mt-4 md:mt-6">
          {/* Article title skeleton */}
          <Skeleton className="h-8 sm:h-9 md:h-10 w-full mb-2" />
          <Skeleton className="h-8 sm:h-9 md:h-10 w-3/4 mb-6" />

          {/* Article content paragraphs skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />

            <div className="my-6">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>

            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />

            {/* Image placeholder skeleton */}
            <Skeleton className="h-64 w-full my-6 rounded-lg" />

            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </article>
      </div>
    </div>
  );
}
