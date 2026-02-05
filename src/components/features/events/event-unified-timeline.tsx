'use client';

import { eventStatusConfig, severityConfig, formatEventDate } from '@/lib/status-utils';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Plus, Minus } from 'lucide-react';
import type { components } from '@/api/types.generated';

type Event = components['schemas']['Event'];
type EventUpdate = components['schemas']['EventUpdate'];
type EventServiceChange = components['schemas']['EventServiceChange'];
type Service = components['schemas']['Service'];
type ServiceGroup = components['schemas']['ServiceGroup'];

type GroupedServiceChange = {
  action: 'added' | 'removed';
  created_at: string;
  items: Array<{ type: 'service' | 'group'; name: string }>;
  reason?: string;
};

type TimelineEntry =
  | { type: 'status_update'; data: EventUpdate }
  | { type: 'service_change_group'; data: GroupedServiceChange };

interface EventUnifiedTimelineProps {
  event: Event;
  updates: EventUpdate[];
  changes: EventServiceChange[];
  services: Service[];
  groups: ServiceGroup[];
  isLoading?: boolean;
  error?: Error | null;
}

/**
 * Groups service changes by batch_id.
 * Falls back to action + timestamp for legacy records (before batch_id was added).
 */
function groupServiceChanges(
  changes: EventServiceChange[],
  serviceMap: Map<string, string>,
  groupMap: Map<string, string>
): GroupedServiceChange[] {
  const changeGroups = new Map<string, EventServiceChange[]>();

  for (const change of changes) {
    // batch_id takes priority, fallback to timestamp for legacy records
    const groupKey = change.batch_id
      ?? `legacy-${change.action}-${change.created_at.slice(0, 19)}`;
    if (!changeGroups.has(groupKey)) {
      changeGroups.set(groupKey, []);
    }
    changeGroups.get(groupKey)!.push(change);
  }

  const result: GroupedServiceChange[] = [];

  changeGroups.forEach((groupChanges) => {
    const first = groupChanges[0];
    const items = groupChanges.map((c: EventServiceChange) => {
      if (c.service_id) {
        return {
          type: 'service' as const,
          name: serviceMap.get(c.service_id) ?? c.service_id,
        };
      }
      return {
        type: 'group' as const,
        name: groupMap.get(c.group_id!) ?? c.group_id!,
      };
    });

    result.push({
      action: first.action,
      created_at: first.created_at,
      items,
      reason: first.reason,
    });
  });

  return result;
}

export function EventUnifiedTimeline({
  event,
  updates,
  changes,
  services,
  groups,
  isLoading = false,
  error = null,
}: EventUnifiedTimelineProps) {
  const serviceMap = new Map(services.map((s) => [s.id, s.name]));
  const groupMap = new Map(groups.map((g) => [g.id, g.name]));

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive py-4">
        <AlertCircle className="h-4 w-4" />
        <span>Failed to load timeline</span>
      </div>
    );
  }

  const groupedChanges = groupServiceChanges(changes, serviceMap, groupMap);

  // Merge and sort entries (newest first)
  const entries: TimelineEntry[] = [
    ...updates.map((u) => ({ type: 'status_update' as const, data: u })),
    ...groupedChanges.map((g) => ({ type: 'service_change_group' as const, data: g })),
  ].sort(
    (a, b) =>
      new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime()
  );

  // Get initial status from first update or event status
  const firstUpdate = updates.length > 0
    ? [...updates].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]
    : null;
  const initialStatus = firstUpdate?.status ?? event.status;
  const initialStatusConfig = eventStatusConfig[initialStatus];

  return (
    <div className="relative">
      {entries.map((entry) => {
        if (entry.type === 'status_update') {
          const update = entry.data;
          const config = eventStatusConfig[update.status];

          return (
            <div key={`update-${update.id}`} className="relative pl-6 pb-6">
              {/* Line segment connecting to next element */}
              <div className="absolute left-[9px] top-0 bottom-0 w-0.5 bg-border" />
              <div className="absolute left-0 top-1 h-[18px] w-[18px] rounded-full border-2 border-primary bg-background" />
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{config.label}</span>
                <span className="text-sm text-muted-foreground">
                  {formatEventDate(update.created_at)}
                </span>
              </div>
              <p className="text-muted-foreground">{update.message}</p>
            </div>
          );
        }

        // service_change_group
        const group = entry.data;
        const isAdded = group.action === 'added';
        const isSingle = group.items.length === 1;

        // Determine target type label
        const hasServices = group.items.some((i) => i.type === 'service');
        const hasGroups = group.items.some((i) => i.type === 'group');
        let targetTypeLabel: string;
        if (hasServices && hasGroups) {
          targetTypeLabel = isSingle ? 'item' : 'items';
        } else if (hasGroups) {
          targetTypeLabel = isSingle ? 'group' : 'groups';
        } else {
          targetTypeLabel = isSingle ? 'service' : 'services';
        }

        return (
          <div key={`change-${group.action}-${group.created_at}`} className="relative pl-6 pb-6">
            {/* Line segment connecting to next element */}
            <div className="absolute left-[9px] top-0 bottom-0 w-0.5 bg-border" />
            <div className="absolute left-0 top-1 h-[18px] w-[18px] rounded-full border bg-background flex items-center justify-center">
              {isAdded ? (
                <Plus className="h-3 w-3 text-muted-foreground" />
              ) : (
                <Minus className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
            <div className="rounded-md border bg-muted/30 px-3 py-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">
                  {isAdded ? 'Added' : 'Removed'} {targetTypeLabel}
                </span>
                {isSingle && <span>&quot;{group.items[0].name}&quot;</span>}
                <span className="text-muted-foreground ml-auto">
                  {formatEventDate(group.created_at)}
                </span>
              </div>
              {!isSingle && (
                <ul className="mt-1 space-y-0.5">
                  {group.items.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <span className="text-xs">•</span>
                      {item.name}
                    </li>
                  ))}
                </ul>
              )}
              {group.reason && (
                <p className="text-xs text-muted-foreground mt-1">
                  {group.reason}
                </p>
              )}
            </div>
          </div>
        );
      })}

      {/* Event created - timeline origin */}
      <div className="relative pl-6">
        <div className="absolute left-0 top-1 h-[18px] w-[18px] rounded-full border-2 border-primary bg-background" />
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium">Event created</span>
          <span className="text-sm text-muted-foreground">
            {formatEventDate(event.created_at)}
          </span>
        </div>
        <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
          <p className="font-medium">
            {event.type === 'incident' ? 'Incident' : 'Maintenance'}: {event.title}
          </p>
          {event.severity && (
            <p className="text-muted-foreground">
              Severity: {severityConfig[event.severity].label}
            </p>
          )}
          <p className="text-muted-foreground">
            Initial status: {initialStatusConfig.label}
          </p>
          {event.description && (
            <p className="text-muted-foreground mt-2">{event.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
