import { Skeleton } from '@/components/ui/skeleton';

function ArticleCardSkeleton() {
  return (
    <div className="block">
      <Skeleton className="aspect-29/19 rounded-xl" />
      <Skeleton className="mt-3 h-5 w-full" />
      <Skeleton className="mt-1 h-5 w-2/3" />
    </div>
  );
}

export default function Loading() {
  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20">
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <header className="mb-10">
          <Skeleton className="h-9 sm:h-10 w-64" />
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ArticleCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
