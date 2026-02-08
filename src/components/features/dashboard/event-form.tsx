'use client';

import { useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Info } from 'lucide-react';
import {
  createEventSchema,
  type CreateEventFormData,
} from '@/lib/validations/event';
import { eventStatusConfig, severityConfig } from '@/lib/status-utils';
import { ServiceStatusSelector } from './service-status-selector';
import { GroupStatusSelector } from './group-status-selector';
import type { components } from '@/api/types.generated';

type Service = components['schemas']['Service'];
type ServiceGroup = components['schemas']['ServiceGroup'];
type ServiceStatus = components['schemas']['ServiceStatus'];

interface EventFormProps {
  services: Service[];
  groups: ServiceGroup[];
  onSubmit: (data: CreateEventFormData) => void;
  isLoading?: boolean;
}

const incidentStatuses = ['investigating', 'identified', 'monitoring', 'resolved'];
const maintenanceStatuses = ['scheduled', 'in_progress', 'completed'];

const DEFAULT_SERVICE_STATUS: ServiceStatus = 'degraded';

// Helper to convert Map to array for form value
function mapToAffectedServices(map: Map<string, ServiceStatus>) {
  return Array.from(map.entries()).map(([service_id, status]) => ({ service_id, status }));
}

function mapToAffectedGroups(map: Map<string, ServiceStatus>) {
  return Array.from(map.entries()).map(([group_id, status]) => ({ group_id, status }));
}

export function EventForm({ services, groups, onSubmit, isLoading }: EventFormProps) {
  const form = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: '',
      type: 'incident',
      status: 'investigating',
      severity: 'minor',
      description: '',
      notify_subscribers: false,
      affected_services: [],
      affected_groups: [],
    },
  });

  // Local state for service selections: Map<service_id, status>
  const [serviceSelections, setServiceSelections] = useState<Map<string, ServiceStatus>>(
    new Map()
  );

  // Local state for group selections: Map<group_id, status>
  const [groupSelections, setGroupSelections] = useState<Map<string, ServiceStatus>>(
    new Map()
  );

  const watchType = form.watch('type');
  const watchStatus = form.watch('status');
  const statuses = watchType === 'incident' ? incidentStatuses : maintenanceStatuses;

  // Calculate total affected services
  const totalAffectedServices = useMemo(() => {
    const serviceSet = new Set(Array.from(serviceSelections.keys()));

    // Add services from selected groups
    for (const groupId of Array.from(groupSelections.keys())) {
      for (const service of services) {
        if (service.group_ids?.includes(groupId)) {
          serviceSet.add(service.id);
        }
      }
    }

    return serviceSet.size;
  }, [serviceSelections, groupSelections, services]);

  // Get service count in a group
  const getServicesCountInGroup = useCallback((groupId: string) => {
    return services.filter(s => s.group_ids?.includes(groupId)).length;
  }, [services]);

  // Handlers for service selection - sync form immediately
  const handleServiceToggle = useCallback((serviceId: string, selected: boolean) => {
    setServiceSelections(prev => {
      const next = new Map(prev);
      if (selected) {
        next.set(serviceId, DEFAULT_SERVICE_STATUS);
      } else {
        next.delete(serviceId);
      }
      form.setValue('affected_services', mapToAffectedServices(next));
      return next;
    });
  }, [form]);

  const handleServiceStatusChange = useCallback((serviceId: string, status: ServiceStatus) => {
    setServiceSelections(prev => {
      const next = new Map(prev);
      next.set(serviceId, status);
      form.setValue('affected_services', mapToAffectedServices(next));
      return next;
    });
  }, [form]);

  // Handlers for group selection - sync form immediately
  const handleGroupToggle = useCallback((groupId: string, selected: boolean) => {
    setGroupSelections(prev => {
      const next = new Map(prev);
      if (selected) {
        next.set(groupId, DEFAULT_SERVICE_STATUS);
      } else {
        next.delete(groupId);
      }
      form.setValue('affected_groups', mapToAffectedGroups(next));
      return next;
    });
  }, [form]);

  const handleGroupStatusChange = useCallback((groupId: string, status: ServiceStatus) => {
    setGroupSelections(prev => {
      const next = new Map(prev);
      next.set(groupId, status);
      form.setValue('affected_groups', mapToAffectedGroups(next));
      return next;
    });
  }, [form]);

  // Reset status when type changes
  const handleTypeChange = (type: 'incident' | 'maintenance') => {
    form.setValue('type', type);
    form.setValue('status', type === 'incident' ? 'investigating' : 'scheduled');
    if (type === 'maintenance') {
      form.setValue('severity', undefined);
    } else {
      form.setValue('severity', 'minor');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Event title" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select
                onValueChange={handleTypeChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="incident">Incident</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {eventStatusConfig[status as keyof typeof eventStatusConfig]?.label ?? status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {watchType === 'incident' && (
          <FormField
            control={form.control}
            name="severity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Severity</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(severityConfig).map(([value, config]) => (
                      <SelectItem key={value} value={value}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Describe the event..."
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {watchType === 'maintenance' && (
          <>
            <FormField
              control={form.control}
              name="scheduled_start_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scheduled Start</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scheduled_end_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scheduled End</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {/* Resolved at for past incidents */}
        {watchType === 'incident' && watchStatus === 'resolved' && (
          <FormField
            control={form.control}
            name="resolved_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resolved At</FormLabel>
                <FormDescription>
                  For past incidents that are already resolved
                </FormDescription>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Affected Groups */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">Affected Groups</label>
          <p className="text-sm text-muted-foreground">
            Select groups — all their services will get the selected status
          </p>
          <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
            {groups.length === 0 ? (
              <p className="text-sm text-muted-foreground">No groups available</p>
            ) : (
              groups.map((group) => (
                <GroupStatusSelector
                  key={group.id}
                  groupId={group.id}
                  groupName={group.name}
                  serviceCount={getServicesCountInGroup(group.id)}
                  selected={groupSelections.has(group.id)}
                  status={groupSelections.get(group.id) ?? DEFAULT_SERVICE_STATUS}
                  onSelectionChange={(selected) => handleGroupToggle(group.id, selected)}
                  onStatusChange={(status) => handleGroupStatusChange(group.id, status)}
                />
              ))
            )}
          </div>
        </div>

        {/* Affected Services */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">Additional Services</label>
          <p className="text-sm text-muted-foreground">
            Select individual services with specific statuses
          </p>
          <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
            {services.length === 0 ? (
              <p className="text-sm text-muted-foreground">No services available</p>
            ) : (
              services.map((service) => (
                <ServiceStatusSelector
                  key={service.id}
                  serviceId={service.id}
                  serviceName={service.name}
                  selected={serviceSelections.has(service.id)}
                  status={serviceSelections.get(service.id) ?? DEFAULT_SERVICE_STATUS}
                  onSelectionChange={(selected) => handleServiceToggle(service.id, selected)}
                  onStatusChange={(status) => handleServiceStatusChange(service.id, status)}
                />
              ))
            )}
          </div>
        </div>

        {/* Preview of total affected services */}
        {(serviceSelections.size > 0 || groupSelections.size > 0) && (
          <div className="flex items-center gap-2 text-sm bg-muted p-3 rounded-md">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span>
              <strong>Total affected:</strong> {totalAffectedServices} service{totalAffectedServices !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        <FormField
          control={form.control}
          name="notify_subscribers"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="font-normal">Notify subscribers</FormLabel>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Event
          </Button>
        </div>
      </form>
    </Form>
  );
}
