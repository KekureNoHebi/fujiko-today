import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background animate-in fade-in duration-300">
      <div className="mx-auto w-full max-w-[min(65ch,calc(100vw-2rem))] sm:max-w-[min(70ch,calc(100vw-3rem))] lg:max-w-[min(75ch,calc(100vw-4rem))]">
        {/* Back to list button skeleton */}
        <Skeleton className="h-9 w-24 rounded-md" />

        <article className="mt-3 sm:mt-4 md:mt-6">
          {/* Article title skeleton - with staggered animation */}
          <div className="space-y-3 mb-8 sm:mb-10">
            <Skeleton
              className="h-8 sm:h-9 md:h-10 w-full rounded-md animate-pulse"
              style={{ animationDelay: '100ms' }}
            />
            <Skeleton
              className="h-8 sm:h-9 md:h-10 w-4/5 rounded-md animate-pulse"
              style={{ animationDelay: '150ms' }}
            />
          </div>

          {/* Metadata skeleton */}
          <div className="flex items-center gap-3 mb-8">
            <Skeleton
              className="h-5 w-20 rounded-full animate-pulse"
              style={{ animationDelay: '200ms' }}
            />
            <Skeleton
              className="h-5 w-24 rounded-full animate-pulse"
              style={{ animationDelay: '250ms' }}
            />
          </div>

          {/* Article content paragraphs skeleton */}
          <div className="space-y-3">
            {/* First paragraph */}
            <div
              className="space-y-2.5 animate-pulse"
              style={{ animationDelay: '300ms' }}
            >
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-[92%] rounded" />
            </div>

            {/* Second paragraph */}
            <div
              className="space-y-2.5 pt-3 animate-pulse"
              style={{ animationDelay: '350ms' }}
            >
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-[88%] rounded" />
              <Skeleton className="h-4 w-[95%] rounded" />
            </div>

            {/* Image placeholder skeleton with shimmer effect */}
            <div
              className="py-6 sm:py-8 animate-pulse"
              style={{ animationDelay: '400ms' }}
            >
              <Skeleton className="h-48 sm:h-64 md:h-72 w-full rounded-xl" />
              <Skeleton className="h-3 w-48 mt-2 rounded" />
            </div>

            {/* Third paragraph */}
            <div
              className="space-y-2.5 animate-pulse"
              style={{ animationDelay: '450ms' }}
            >
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-[85%] rounded" />
            </div>

            {/* Fourth paragraph */}
            <div
              className="space-y-2.5 pt-3 animate-pulse"
              style={{ animationDelay: '500ms' }}
            >
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-[90%] rounded" />
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
