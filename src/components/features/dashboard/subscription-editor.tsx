'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Bell, BellOff, AlertCircle } from 'lucide-react';
import { useSubscription } from '@/hooks/use-subscriptions';
import { useUpdateSubscription, useDeleteSubscription } from '@/hooks/use-subscriptions-mutations';
import { useServices, useGroups } from '@/hooks/use-public-status';
import { useToast } from '@/hooks/use-toast';
import {
  updateSubscriptionSchema,
  type UpdateSubscriptionFormData,
} from '@/lib/validations/subscription';
import type { components } from '@/api/types.generated';

type Service = components['schemas']['Service'];
type ServiceGroup = components['schemas']['ServiceGroup'];

interface GroupedServices {
  group: ServiceGroup | null;
  services: Service[];
}

function groupServicesByGroup(services: Service[], groups: ServiceGroup[]): GroupedServices[] {
  const groupMap = new Map<string, ServiceGroup>();
  groups.forEach((g) => groupMap.set(g.id, g));

  const grouped = new Map<string | null, Service[]>();

  // Initialize with null for ungrouped services
  grouped.set(null, []);

  services.forEach((service) => {
    if (!service.archived_at) {
      const groupIds = service.group_ids ?? [];
      if (groupIds.length === 0) {
        grouped.get(null)!.push(service);
      } else {
        // Add to first group only to avoid duplicates
        const firstGroupId = groupIds[0];
        if (!grouped.has(firstGroupId)) {
          grouped.set(firstGroupId, []);
        }
        grouped.get(firstGroupId)!.push(service);
      }
    }
  });

  const result: GroupedServices[] = [];

  // Add grouped services
  groups.forEach((group) => {
    const groupServices = grouped.get(group.id) ?? [];
    if (groupServices.length > 0 && !group.archived_at) {
      result.push({ group, services: groupServices });
    }
  });

  // Add ungrouped services
  const ungrouped = grouped.get(null) ?? [];
  if (ungrouped.length > 0) {
    result.push({ group: null, services: ungrouped });
  }

  return result;
}

export function SubscriptionEditor() {
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);

  const { data: subscription, isLoading: subscriptionLoading, isError: subscriptionError } = useSubscription();
  const { data: services, isLoading: servicesLoading, isError: servicesError } = useServices();
  const { data: groups } = useGroups();

  const updateMutation = useUpdateSubscription();
  const deleteMutation = useDeleteSubscription();

  const form = useForm<UpdateSubscriptionFormData>({
    resolver: zodResolver(updateSubscriptionSchema),
    defaultValues: {
      service_ids: [],
    },
  });

  // Update form when subscription data loads
  useEffect(() => {
    if (subscription) {
      form.reset({ service_ids: subscription.service_ids });
    }
  }, [subscription, form]);

  // Track changes
  const watchedServiceIds = form.watch('service_ids');
  useEffect(() => {
    const originalIds = subscription?.service_ids ?? [];
    const currentIds = watchedServiceIds ?? [];
    const changed =
      originalIds.length !== currentIds.length ||
      !originalIds.every((id) => currentIds.includes(id));
    setHasChanges(changed);
  }, [watchedServiceIds, subscription]);

  const isLoading = subscriptionLoading || servicesLoading;
  const isError = subscriptionError || servicesError;
  const isSaving = updateMutation.isPending || deleteMutation.isPending;

  const handleSubmit = async (data: UpdateSubscriptionFormData) => {
    try {
      if (data.service_ids.length === 0) {
        // If no services selected, delete subscription
        if (subscription) {
          await deleteMutation.mutateAsync();
          toast({ title: 'Subscription removed' });
        }
      } else {
        await updateMutation.mutateAsync(data);
        toast({ title: 'Subscription updated' });
      }
      setHasChanges(false);
    } catch (error) {
      toast({
        title: 'Failed to update subscription',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleSelectAll = () => {
    const allServiceIds = (services ?? [])
      .filter((s) => !s.archived_at)
      .map((s) => s.id);
    form.setValue('service_ids', allServiceIds);
  };

  const handleDeselectAll = () => {
    form.setValue('service_ids', []);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-8 w-8 text-destructive mb-2" />
          <p className="text-muted-foreground">Failed to load subscription settings</p>
        </CardContent>
      </Card>
    );
  }

  const groupedServices = groupServicesByGroup(services ?? [], groups ?? []);
  const activeServices = (services ?? []).filter((s) => !s.archived_at);
  const selectedCount = (watchedServiceIds ?? []).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Service Subscriptions
            </CardTitle>
            <CardDescription>
              Choose which services you want to receive notifications about.
            </CardDescription>
          </div>
          <div className="text-sm text-muted-foreground">
            {selectedCount} of {activeServices.length} selected
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                Select All
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDeselectAll}
              >
                Deselect All
              </Button>
            </div>

            <FormField
              control={form.control}
              name="service_ids"
              render={({ field }) => (
                <FormItem>
                  <div className="space-y-6">
                    {groupedServices.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <BellOff className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No services available</p>
                      </div>
                    ) : (
                      groupedServices.map((group, idx) => (
                        <div key={group.group?.id ?? `ungrouped-${idx}`}>
                          <FormLabel className="text-base font-semibold">
                            {group.group?.name ?? 'Other Services'}
                          </FormLabel>
                          <div className="mt-2 space-y-2">
                            {group.services.map((service) => (
                              <div
                                key={service.id}
                                className="flex items-center space-x-3 rounded-md border p-3"
                              >
                                <Checkbox
                                  id={`service-${service.id}`}
                                  checked={field.value?.includes(service.id)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value ?? [];
                                    if (checked) {
                                      field.onChange([...current, service.id]);
                                    } else {
                                      field.onChange(
                                        current.filter((id) => id !== service.id)
                                      );
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`service-${service.id}`}
                                  className="flex-1 cursor-pointer"
                                >
                                  <div className="font-medium">{service.name}</div>
                                  {service.description && (
                                    <div className="text-sm text-muted-foreground">
                                      {service.description}
                                    </div>
                                  )}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="submit" disabled={isSaving || !hasChanges}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
