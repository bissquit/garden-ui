'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, ArrowRight } from 'lucide-react';
import { serviceStatusConfig } from '@/lib/status-utils';
import { cn } from '@/lib/utils';
import type { components } from '@/api/types.generated';

type ServiceStatus = components['schemas']['ServiceStatus'];

interface CurrentServiceEditorProps {
  serviceId: string;
  serviceName: string;
  originalStatus: ServiceStatus;
  currentStatus: ServiceStatus;
  onStatusChange: (status: ServiceStatus) => void;
  onRemove: () => void;
  isRemoved: boolean;
  onUndoRemove: () => void;
}

// Statuses available for editing services in events (includes operational for partial recovery)
const eventServiceStatuses: ServiceStatus[] = [
  'operational',
  'degraded',
  'partial_outage',
  'major_outage',
  'maintenance',
];

export function CurrentServiceEditor({
  serviceName,
  originalStatus,
  currentStatus,
  onStatusChange,
  onRemove,
  isRemoved,
  onUndoRemove,
}: CurrentServiceEditorProps) {
  const hasChanged = originalStatus !== currentStatus;
  const originalConfig = serviceStatusConfig[originalStatus];

  if (isRemoved) {
    return (
      <div className="flex items-center gap-3 py-2 px-3 bg-muted/50 rounded-md opacity-60">
        <span className="flex-1 text-sm line-through">{serviceName}</span>
        <span className="text-xs text-muted-foreground">Will be removed</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onUndoRemove}
        >
          Undo
        </Button>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-3 py-2 px-3 rounded-md",
      hasChanged && "bg-yellow-50 dark:bg-yellow-950/20"
    )}>
      <span className="flex-1 text-sm font-medium">{serviceName}</span>

      {hasChanged && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className={originalConfig.textClass}>{originalConfig.label}</span>
          <ArrowRight className="h-3 w-3" />
        </div>
      )}

      <Select
        value={currentStatus}
        onValueChange={(value) => onStatusChange(value as ServiceStatus)}
      >
        <SelectTrigger className={cn("w-40", hasChanged && "border-yellow-500")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {eventServiceStatuses.map((s) => (
            <SelectItem key={s} value={s}>
              {serviceStatusConfig[s].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
