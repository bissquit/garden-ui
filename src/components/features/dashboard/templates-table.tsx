'use client';

import { DataTable } from './data-table';
import { EmptyState } from './empty-state';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { formatEventDate } from '@/lib/status-utils';
import type { components } from '@/api/types.generated';

type EventTemplate = components['schemas']['EventTemplate'];

interface TemplatesTableProps {
  templates: (EventTemplate & { actions?: React.ReactNode })[];
}

export function TemplatesTable({ templates }: TemplatesTableProps) {
  const columns = [
    {
      key: 'name',
      header: 'Name',
      cell: (template: EventTemplate & { actions?: React.ReactNode }) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{template.slug}</span>
            <Badge variant={template.type === 'incident' ? 'destructive' : 'secondary'}>
              {template.type}
            </Badge>
          </div>
        </div>
      ),
    },
    {
      key: 'title_template',
      header: 'Title Template',
      cell: (template: EventTemplate & { actions?: React.ReactNode }) => (
        <span className="text-muted-foreground">
          {template.title_template.length > 50
            ? `${template.title_template.slice(0, 50)}...`
            : template.title_template}
        </span>
      ),
    },
    {
      key: 'updated',
      header: 'Updated',
      cell: (template: EventTemplate & { actions?: React.ReactNode }) => (
        <span className="text-muted-foreground text-sm">
          {formatEventDate(template.updated_at)}
        </span>
      ),
      className: 'hidden md:table-cell',
    },
    {
      key: 'actions',
      header: '',
      cell: (template: EventTemplate & { actions?: React.ReactNode }) =>
        template.actions ?? null,
      className: 'w-24',
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={templates}
      emptyState={
        <EmptyState
          icon={FileText}
          title="No templates"
          description="No event templates have been created yet."
        />
      }
    />
  );
}
