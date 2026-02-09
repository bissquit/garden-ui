'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { ServiceStatusSelector } from './service-status-selector';
import { GroupStatusSelector } from './group-status-selector';
import type { components } from '@/api/types.generated';

type Service = components['schemas']['Service'];
type ServiceGroup = components['schemas']['ServiceGroup'];
type ServiceStatus = components['schemas']['ServiceStatus'];

interface AddServicesSectionProps {
  allServices: Service[];
  allGroups: ServiceGroup[];
  excludeServiceIds: Set<string>;
  selectedServices: Map<string, ServiceStatus>;
  selectedGroups: Map<string, ServiceStatus>;
  onServiceToggle: (serviceId: string, selected: boolean) => void;
  onServiceStatusChange: (serviceId: string, status: ServiceStatus) => void;
  onGroupToggle: (groupId: string, selected: boolean) => void;
  onGroupStatusChange: (groupId: string, status: ServiceStatus) => void;
}

export function AddServicesSection({
  allServices,
  allGroups,
  excludeServiceIds,
  selectedServices,
  selectedGroups,
  onServiceToggle,
  onServiceStatusChange,
  onGroupToggle,
  onGroupStatusChange,
}: AddServicesSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter services not yet in the event
  const availableServices = allServices.filter(
    s => !excludeServiceIds.has(s.id)
  );

  const getServicesCountInGroup = (groupId: string) => {
    return allServices.filter(s => s.group_ids?.includes(groupId)).length;
  };

  const hasSelections = selectedServices.size > 0 || selectedGroups.size > 0;

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full justify-between"
      >
        <span className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Services
          {hasSelections && (
            <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
              {selectedServices.size + selectedGroups.size}
            </span>
          )}
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {isExpanded && (
        <div className="border rounded-md p-3 space-y-4">
          {/* Groups */}
          {allGroups.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Add Groups</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {allGroups.map((group) => (
                  <GroupStatusSelector
                    key={group.id}
                    groupId={group.id}
                    groupName={group.name}
                    serviceCount={getServicesCountInGroup(group.id)}
                    selected={selectedGroups.has(group.id)}
                    status={selectedGroups.get(group.id) ?? 'degraded'}
                    onSelectionChange={(sel) => onGroupToggle(group.id, sel)}
                    onStatusChange={(st) => onGroupStatusChange(group.id, st)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Services */}
          {availableServices.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Add Individual Services</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {availableServices.map((service) => (
                  <ServiceStatusSelector
                    key={service.id}
                    serviceId={service.id}
                    serviceName={service.name}
                    selected={selectedServices.has(service.id)}
                    status={selectedServices.get(service.id) ?? 'degraded'}
                    onSelectionChange={(sel) => onServiceToggle(service.id, sel)}
                    onStatusChange={(st) => onServiceStatusChange(service.id, st)}
                  />
                ))}
              </div>
            </div>
          )}

          {availableServices.length === 0 && allGroups.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              All services are already in this event
            </p>
          )}
        </div>
      )}
    </div>
  );
}
