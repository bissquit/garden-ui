import { Skeleton } from '@/components/ui/skeleton';

export function EventDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Title + badges */}
      <div className="space-y-3">
        <Skeleton className="h-8 w-96" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
      {/* Details card */}
      <Skeleton className="h-48 w-full rounded-lg" />
      {/* Timeline */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
