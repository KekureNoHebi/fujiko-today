export default function Loading() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="h-8 w-48 bg-muted animate-pulse rounded mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <div className="aspect-video bg-muted animate-pulse rounded-lg" />
            <div className="h-6 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
