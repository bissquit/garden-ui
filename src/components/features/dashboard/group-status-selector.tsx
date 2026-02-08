'use client';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { serviceStatusConfig, eventServiceStatuses } from '@/lib/status-utils';
import type { components } from '@/api/types.generated';

type ServiceStatus = components['schemas']['ServiceStatus'];

interface GroupStatusSelectorProps {
  groupId: string;
  groupName: string;
  serviceCount: number;
  selected: boolean;
  status: ServiceStatus;
  onSelectionChange: (selected: boolean) => void;
  onStatusChange: (status: ServiceStatus) => void;
  disabled?: boolean;
}

export function GroupStatusSelector({
  groupId,
  groupName,
  serviceCount,
  selected,
  status,
  onSelectionChange,
  onStatusChange,
  disabled,
}: GroupStatusSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={`group-${groupId}`}
        checked={selected}
        onCheckedChange={(checked) => onSelectionChange(checked === true)}
        disabled={disabled}
      />
      <label
        htmlFor={`group-${groupId}`}
        className="flex-1 text-sm font-medium cursor-pointer"
      >
        {groupName}
        <span className="text-muted-foreground ml-1">
          ({serviceCount} {serviceCount === 1 ? 'service' : 'services'})
        </span>
      </label>
      {selected && (
        <Select
          value={status}
          onValueChange={(value) => onStatusChange(value as ServiceStatus)}
        >
          <SelectTrigger className="h-5 w-28 text-xs px-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {eventServiceStatuses.map((s) => (
              <SelectItem key={s} value={s} className="text-xs">
                {serviceStatusConfig[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
