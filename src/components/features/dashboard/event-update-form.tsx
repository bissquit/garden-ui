'use client';

import { useState, useMemo } from 'react';
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
import { Label } from '@/components/ui/label';
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
import { CurrentServiceEditor } from './current-service-editor';
import { AddServicesSection } from './add-services-section';
import { addEventUpdateSchema, type AddEventUpdateFormData } from '@/lib/validations/event';
import { eventStatusConfig } from '@/lib/status-utils';
import type { components } from '@/api/types.generated';

type Event = components['schemas']['Event'];
type Service = components['schemas']['Service'];
type ServiceGroup = components['schemas']['ServiceGroup'];
type ServiceStatus = components['schemas']['ServiceStatus'];
type EventStatus = components['schemas']['EventStatus'];

interface EventUpdateFormProps {
  event: Event;
  services: Service[];
  groups: ServiceGroup[];
  onSubmit: (data: AddEventUpdateFormData) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

interface CurrentServiceState {
  serviceId: string;
  serviceName: string;
  originalStatus: ServiceStatus;
  currentStatus: ServiceStatus;
  isRemoved: boolean;
}

const incidentStatuses = ['investigating', 'identified', 'monitoring', 'resolved'];
const maintenanceStatuses = ['scheduled', 'in_progress', 'completed'];

export function EventUpdateForm({
  event,
  services,
  groups,
  onSubmit,
  isLoading,
  onCancel,
}: EventUpdateFormProps) {
  const isIncident = event.type === 'incident';
  const statuses = isIncident ? incidentStatuses : maintenanceStatuses;

  const form = useForm<AddEventUpdateFormData>({
    resolver: zodResolver(addEventUpdateSchema),
    defaultValues: {
      status: event.status,
      message: '',
      notify_subscribers: false,
      reason: '',
    },
  });

  // Current services state - initialized from event.service_ids
  const [currentServices, setCurrentServices] = useState<CurrentServiceState[]>(() => {
    const serviceIds = event.service_ids ?? [];
    return serviceIds.map(id => {
      const service = services.find(s => s.id === id);
      // Use effective_status as approximation for service status in this event
      // TODO: API should return per-event service statuses
      const status = (service?.effective_status ?? 'degraded') as ServiceStatus;
      return {
        serviceId: id,
        serviceName: service?.name ?? 'Unknown',
        originalStatus: status,
        currentStatus: status,
        isRemoved: false,
      };
    });
  });

  // State for adding new services
  const [addServices, setAddServices] = useState<Map<string, ServiceStatus>>(new Map());
  const [addGroups, setAddGroups] = useState<Map<string, ServiceStatus>>(new Map());

  // IDs of services already in event (for excluding from "Add" section)
  const existingServiceIds = useMemo(() => {
    const ids = new Set<string>();
    currentServices.forEach(cs => {
      if (!cs.isRemoved) ids.add(cs.serviceId);
    });
    return ids;
  }, [currentServices]);

  // Handlers for current services
  const handleCurrentStatusChange = (serviceId: string, status: ServiceStatus) => {
    setCurrentServices(prev =>
      prev.map(cs =>
        cs.serviceId === serviceId ? { ...cs, currentStatus: status } : cs
      )
    );
  };

  const handleRemoveService = (serviceId: string) => {
    setCurrentServices(prev =>
      prev.map(cs =>
        cs.serviceId === serviceId ? { ...cs, isRemoved: true } : cs
      )
    );
  };

  const handleUndoRemove = (serviceId: string) => {
    setCurrentServices(prev =>
      prev.map(cs =>
        cs.serviceId === serviceId ? { ...cs, isRemoved: false } : cs
      )
    );
  };

  // Handlers for adding services
  const handleAddServiceToggle = (serviceId: string, selected: boolean) => {
    setAddServices(prev => {
      const next = new Map(prev);
      if (selected) {
        next.set(serviceId, 'degraded');
      } else {
        next.delete(serviceId);
      }
      return next;
    });
  };

  const handleAddServiceStatus = (serviceId: string, status: ServiceStatus) => {
    setAddServices(prev => new Map(prev).set(serviceId, status));
  };

  const handleAddGroupToggle = (groupId: string, selected: boolean) => {
    setAddGroups(prev => {
      const next = new Map(prev);
      if (selected) {
        next.set(groupId, 'degraded');
      } else {
        next.delete(groupId);
      }
      return next;
    });
  };

  const handleAddGroupStatus = (groupId: string, status: ServiceStatus) => {
    setAddGroups(prev => new Map(prev).set(groupId, status));
  };

  // Count changes
  const changesCount = useMemo(() => {
    const statusUpdates = currentServices.filter(
      cs => !cs.isRemoved && cs.originalStatus !== cs.currentStatus
    ).length;
    const removed = currentServices.filter(cs => cs.isRemoved).length;
    const added = addServices.size + addGroups.size;
    return { statusUpdates, removed, added, total: statusUpdates + removed + added };
  }, [currentServices, addServices, addGroups]);

  // reason is only needed for add/remove operations (recorded in event_service_changes)
  // status updates don't create change records, so reason is not applicable
  const needsReason = changesCount.added + changesCount.removed > 0;

  // Reset form to initial state
  const resetFormState = () => {
    form.reset({
      status: event.status,
      message: '',
      notify_subscribers: false,
      reason: '',
    });
    // Reset current services to match updated event
    const serviceIds = event.service_ids ?? [];
    setCurrentServices(serviceIds.map(id => {
      const service = services.find(s => s.id === id);
      const status = (service?.effective_status ?? 'degraded') as ServiceStatus;
      return {
        serviceId: id,
        serviceName: service?.name ?? 'Unknown',
        originalStatus: status,
        currentStatus: status,
        isRemoved: false,
      };
    }));
    setAddServices(new Map());
    setAddGroups(new Map());
  };

  // Build submit data
  const handleFormSubmit = async (formData: AddEventUpdateFormData) => {
    const data: AddEventUpdateFormData = {
      status: formData.status,
      message: formData.message,
      notify_subscribers: formData.notify_subscribers,
    };

    // service_updates: services with changed statuses
    const serviceUpdates = currentServices
      .filter(cs => !cs.isRemoved && cs.originalStatus !== cs.currentStatus)
      .map(cs => ({ service_id: cs.serviceId, status: cs.currentStatus }));
    if (serviceUpdates.length > 0) {
      data.service_updates = serviceUpdates;
    }

    // remove_service_ids
    const removeIds = currentServices
      .filter(cs => cs.isRemoved)
      .map(cs => cs.serviceId);
    if (removeIds.length > 0) {
      data.remove_service_ids = removeIds;
    }

    // add_services
    if (addServices.size > 0) {
      data.add_services = Array.from(addServices.entries()).map(
        ([service_id, status]) => ({ service_id, status })
      );
    }

    // add_groups
    if (addGroups.size > 0) {
      data.add_groups = Array.from(addGroups.entries()).map(
        ([group_id, status]) => ({ group_id, status })
      );
    }

    // reason
    if (formData.reason && formData.reason.trim()) {
      data.reason = formData.reason.trim();
    }

    await onSubmit(data);
    resetFormState();
  };

  // Build changes summary text
  const getChangesSummary = () => {
    const parts: string[] = [];
    if (changesCount.statusUpdates > 0) {
      parts.push(`${changesCount.statusUpdates} updated`);
    }
    if (changesCount.added > 0) {
      parts.push(`${changesCount.added} added`);
    }
    if (changesCount.removed > 0) {
      parts.push(`${changesCount.removed} removed`);
    }
    return parts.join(', ');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Status */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {eventStatusConfig[status as EventStatus]?.label ?? status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Message */}
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Describe what's happening..."
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Current Services */}
        {currentServices.length > 0 && (
          <div className="space-y-2">
            <Label>Current Services</Label>
            <p className="text-sm text-muted-foreground">
              Update status or remove services from this event
            </p>
            <div className="space-y-1 border rounded-md p-2">
              {currentServices.map((cs) => (
                <CurrentServiceEditor
                  key={cs.serviceId}
                  serviceId={cs.serviceId}
                  serviceName={cs.serviceName}
                  originalStatus={cs.originalStatus}
                  currentStatus={cs.currentStatus}
                  onStatusChange={(status) => handleCurrentStatusChange(cs.serviceId, status)}
                  onRemove={() => handleRemoveService(cs.serviceId)}
                  isRemoved={cs.isRemoved}
                  onUndoRemove={() => handleUndoRemove(cs.serviceId)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Add Services */}
        <AddServicesSection
          allServices={services}
          allGroups={groups}
          excludeServiceIds={existingServiceIds}
          selectedServices={addServices}
          selectedGroups={addGroups}
          onServiceToggle={handleAddServiceToggle}
          onServiceStatusChange={handleAddServiceStatus}
          onGroupToggle={handleAddGroupToggle}
          onGroupStatusChange={handleAddGroupStatus}
        />

        {/* Changes Summary */}
        {changesCount.total > 0 && (
          <div className="flex items-center gap-2 text-sm bg-muted p-3 rounded-md">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span>
              <strong>Changes:</strong> {getChangesSummary()}
            </span>
          </div>
        )}

        {/* Reason (if changes) */}
        {needsReason && (
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reason for Changes</FormLabel>
                <FormDescription>
                  Explain why services are being changed (for audit log)
                </FormDescription>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., Database identified as root cause"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Notify */}
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

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post Update
          </Button>
        </div>
      </form>
    </Form>
  );
}
