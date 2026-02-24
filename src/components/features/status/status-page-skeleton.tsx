import { Skeleton } from '@/components/ui/skeleton';

export function StatusPageSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Overall status banner */}
      <Skeleton className="h-24 w-full rounded-lg" />
      {/* Active incidents */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
      {/* Services */}
      <div className="space-y-3">
        <Skeleton className="h-8 w-32" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
