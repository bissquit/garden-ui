'use client';

import { DataTable } from './data-table';
import { EmptyState } from './empty-state';
import { StatusIndicator } from '@/components/features/status';
import { serviceStatusConfig, formatEventDate } from '@/lib/status-utils';
import { Badge } from '@/components/ui/badge';
import { Server, Zap } from 'lucide-react';
import type { components } from '@/api/types.generated';

type Service = components['schemas']['Service'];

interface ServicesTableProps {
  services: Service[];
  groups: Array<{ id: string; name: string }>;
}

export function ServicesTable({ services, groups }: ServicesTableProps) {
  const groupMap = new Map(groups.map((g) => [g.id, g.name]));

  const columns = [
    {
      key: 'name',
      header: 'Name',
      cell: (service: Service & { actions?: React.ReactNode }) => (
        <div className={service.archived_at ? 'opacity-60' : ''}>
          <div className="flex items-center gap-2">
            <span className="font-medium">{service.name}</span>
            {service.archived_at && (
              <Badge variant="outline" className="text-muted-foreground">
                Archived
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">{service.slug}</div>
        </div>
      ),
    },
    {
      key: 'groups',
      header: 'Groups',
      cell: (service: Service & { actions?: React.ReactNode }) => {
        const groupIds = service.group_ids ?? [];
        if (groupIds.length === 0) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {groupIds.map((id) => (
              <Badge key={id} variant="secondary">
                {groupMap.get(id) ?? id}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      cell: (service: Service & { actions?: React.ReactNode }) => {
        // Use effective_status (includes active events) with fallback to status
        const displayStatus = service.effective_status ?? service.status;
        const config = serviceStatusConfig[displayStatus];
        return (
          <div className="flex items-center gap-2">
            <StatusIndicator status={displayStatus} />
            <span className={config.textClass}>{config.label}</span>
            {service.has_active_events && (
              <span title="Has active events">
                <Zap
                  className="h-3.5 w-3.5 text-yellow-500"
                  aria-label="Has active events"
                />
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'updated',
      header: 'Last Updated',
      cell: (service: Service & { actions?: React.ReactNode }) => (
        <span className="text-muted-foreground text-sm">
          {formatEventDate(service.updated_at)}
        </span>
      ),
      className: 'hidden md:table-cell',
    },
    {
      key: 'actions',
      header: '',
      cell: (service: Service & { actions?: React.ReactNode }) => service.actions ?? null,
      className: 'w-24',
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={services}
      emptyState={
        <EmptyState
          icon={Server}
          title="No services"
          description="No services have been created yet."
        />
      }
    />
  );
}
