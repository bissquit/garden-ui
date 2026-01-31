'use client';

import { useEventServiceChanges } from '@/hooks/use-events';
import { formatEventDate } from '@/lib/status-utils';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import type { components } from '@/api/types.generated';

type Service = components['schemas']['Service'];
type ServiceGroup = components['schemas']['ServiceGroup'];

interface EventChangesTimelineProps {
  eventId: string;
  services: Service[];
  groups: ServiceGroup[];
}

export function EventChangesTimeline({ eventId, services, groups }: EventChangesTimelineProps) {
  const { data: changes, isLoading, error } = useEventServiceChanges(eventId);

  const serviceMap = new Map(services.map(s => [s.id, s.name]));
  const groupMap = new Map(groups.map(g => [g.id, g.name]));

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Change History</h3>
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Change History</h3>
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>Failed to load change history</span>
        </div>
      </div>
    );
  }

  if (!changes || changes.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Change History</h3>
        <p className="text-sm text-muted-foreground">No changes recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Change History</h3>
      <div className="space-y-3">
        {changes.map((change) => (
          <div key={change.id} className="flex items-start gap-3 text-sm">
            <div
              className={cn(
                'mt-1.5 h-2 w-2 rounded-full flex-shrink-0',
                change.action === 'added' ? 'bg-green-500' : 'bg-red-500'
              )}
            />
            <div className="flex-1 min-w-0">
              <p>
                <span className="font-medium">
                  {change.action === 'added' ? 'Added' : 'Removed'}
                </span>
                {': '}
                {change.service_id && (
                  <span>
                    service &quot;{serviceMap.get(change.service_id) ?? change.service_id}&quot;
                  </span>
                )}
                {change.group_id && (
                  <span>
                    group &quot;{groupMap.get(change.group_id) ?? change.group_id}&quot;
                  </span>
                )}
              </p>
              {change.reason && (
                <p className="text-muted-foreground">Reason: {change.reason}</p>
              )}
              <p className="text-muted-foreground text-xs">
                {formatEventDate(change.created_at)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
