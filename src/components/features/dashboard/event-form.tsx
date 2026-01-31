'use client';

import { useMemo } from 'react';
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
import type { components } from '@/api/types.generated';

type Service = components['schemas']['Service'];
type ServiceGroup = components['schemas']['ServiceGroup'];

interface EventFormProps {
  services: Service[];
  groups: ServiceGroup[];
  onSubmit: (data: CreateEventFormData) => void;
  isLoading?: boolean;
}

const incidentStatuses = ['investigating', 'identified', 'monitoring', 'resolved'];
const maintenanceStatuses = ['scheduled', 'in_progress', 'completed'];

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
      service_ids: [],
      group_ids: [],
    },
  });

  const watchType = form.watch('type');
  const statuses = watchType === 'incident' ? incidentStatuses : maintenanceStatuses;

  // Watch selected services and groups for preview
  const watchedServiceIds = form.watch('service_ids');
  const watchedGroupIds = form.watch('group_ids');

  const selectedServiceIds = useMemo(
    () => watchedServiceIds ?? [],
    [watchedServiceIds]
  );
  const selectedGroupIds = useMemo(
    () => watchedGroupIds ?? [],
    [watchedGroupIds]
  );

  // Calculate total affected services
  const totalAffectedServices = useMemo(() => {
    const serviceSet = new Set(selectedServiceIds);

    // Add services from selected groups
    for (const groupId of selectedGroupIds) {
      for (const service of services) {
        if (service.group_ids?.includes(groupId)) {
          serviceSet.add(service.id);
        }
      }
    }

    return serviceSet.size;
  }, [selectedServiceIds, selectedGroupIds, services]);

  // Get service count in a group
  const getServicesCountInGroup = (groupId: string) => {
    return services.filter(s => s.group_ids?.includes(groupId)).length;
  };

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

        <FormField
          control={form.control}
          name="group_ids"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Affected Groups</FormLabel>
              <FormDescription>
                Select groups — all their services will be added automatically
              </FormDescription>
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                {groups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No groups available</p>
                ) : (
                  groups.map((group) => (
                    <div key={group.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`event-group-${group.id}`}
                        checked={field.value?.includes(group.id)}
                        onCheckedChange={(checked) => {
                          const current = field.value ?? [];
                          if (checked) {
                            field.onChange([...current, group.id]);
                          } else {
                            field.onChange(current.filter((id) => id !== group.id));
                          }
                        }}
                      />
                      <label
                        htmlFor={`event-group-${group.id}`}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {group.name}
                        <span className="text-muted-foreground ml-1">
                          ({getServicesCountInGroup(group.id)} services)
                        </span>
                      </label>
                    </div>
                  ))
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="service_ids"
          render={() => (
            <FormItem>
              <FormLabel>Additional Services</FormLabel>
              <FormDescription>
                Select individual services (in addition to groups)
              </FormDescription>
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {services.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No services available</p>
                ) : (
                  services.map((service) => (
                    <FormField
                      key={service.id}
                      control={form.control}
                      name="service_ids"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(service.id)}
                              onCheckedChange={(checked) => {
                                const current = field.value ?? [];
                                if (checked) {
                                  field.onChange([...current, service.id]);
                                } else {
                                  field.onChange(current.filter((id) => id !== service.id));
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            {service.name}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  ))
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Preview of total affected services */}
        {(selectedServiceIds.length > 0 || selectedGroupIds.length > 0) && (
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
