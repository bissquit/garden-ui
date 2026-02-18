'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Loader2,
  Bell,
  BellOff,
  AlertCircle,
  Mail,
  MessageSquare,
  Hash,
} from 'lucide-react';
import { useSubscriptionsMatrix } from '@/hooks/use-subscriptions';
import { useSetChannelSubscriptions } from '@/hooks/use-subscriptions-mutations';
import { useServices, useGroups } from '@/hooks/use-public-status';
import { useToast } from '@/hooks/use-toast';
import type { components } from '@/api/types.generated';

type ChannelWithSubscriptions = components['schemas']['ChannelWithSubscriptions'];
type Service = components['schemas']['Service'];
type ServiceGroup = components['schemas']['ServiceGroup'];

interface ChannelState {
  subscribeToAll: boolean;
  serviceIds: Set<string>;
}

function ChannelIcon({ type }: { type: string }) {
  switch (type) {
    case 'email':
      return <Mail className="h-4 w-4" />;
    case 'telegram':
      return <MessageSquare className="h-4 w-4" />;
    case 'mattermost':
      return <Hash className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
}

interface GroupedServices {
  group: ServiceGroup | null;
  services: Service[];
}

function groupServicesByGroup(
  services: Service[],
  groups: ServiceGroup[]
): GroupedServices[] {
  const grouped = new Map<string | null, Service[]>();
  grouped.set(null, []);

  services.forEach((service) => {
    if (service.archived_at) return;

    const groupIds = service.group_ids ?? [];
    if (groupIds.length === 0) {
      grouped.get(null)!.push(service);
    } else {
      const firstGroupId = groupIds[0];
      if (!grouped.has(firstGroupId)) {
        grouped.set(firstGroupId, []);
      }
      grouped.get(firstGroupId)!.push(service);
    }
  });

  const result: GroupedServices[] = [];

  groups.forEach((group) => {
    if (group.archived_at) return;
    const groupServices = grouped.get(group.id) ?? [];
    if (groupServices.length > 0) {
      result.push({ group, services: groupServices });
    }
  });

  const ungrouped = grouped.get(null) ?? [];
  if (ungrouped.length > 0) {
    result.push({ group: null, services: ungrouped });
  }

  return result;
}

export function SubscriptionEditor() {
  const { toast } = useToast();

  const {
    data: channelsData,
    isLoading: channelsLoading,
    isError: channelsError,
  } = useSubscriptionsMatrix();
  const { data: services, isLoading: servicesLoading } = useServices();
  const { data: groups } = useGroups();

  const setSubscriptionsMutation = useSetChannelSubscriptions();

  const [localState, setLocalState] = useState<Map<string, ChannelState>>(
    new Map()
  );
  const [dirtyChannels, setDirtyChannels] = useState<Set<string>>(new Set());

  const activeChannels = useMemo(() => {
    if (!channelsData) return [];
    return channelsData.filter(
      (ch) => ch.channel.is_verified && ch.channel.is_enabled
    );
  }, [channelsData]);

  useEffect(() => {
    if (!channelsData) return;

    const newState = new Map<string, ChannelState>();

    channelsData.forEach((ch) => {
      newState.set(ch.channel.id, {
        subscribeToAll: ch.subscribe_to_all_services,
        serviceIds: new Set(ch.subscribed_service_ids),
      });
    });

    setLocalState(newState);
    setDirtyChannels(new Set());
  }, [channelsData]);

  const handleSubscribeToAllChange = useCallback(
    (channelId: string, checked: boolean) => {
      setLocalState((prev) => {
        const newState = new Map(prev);
        const current = newState.get(channelId);
        if (current) {
          newState.set(channelId, {
            subscribeToAll: checked,
            serviceIds: checked ? new Set() : current.serviceIds,
          });
        }
        return newState;
      });
      setDirtyChannels((prev) => new Set(prev).add(channelId));
    },
    []
  );

  const handleServiceChange = useCallback(
    (channelId: string, serviceId: string, checked: boolean) => {
      setLocalState((prev) => {
        const newState = new Map(prev);
        const current = newState.get(channelId);
        if (current && !current.subscribeToAll) {
          const newServiceIds = new Set(current.serviceIds);
          if (checked) {
            newServiceIds.add(serviceId);
          } else {
            newServiceIds.delete(serviceId);
          }
          newState.set(channelId, { ...current, serviceIds: newServiceIds });
        }
        return newState;
      });
      setDirtyChannels((prev) => new Set(prev).add(channelId));
    },
    []
  );

  const handleSave = async () => {
    const promises = Array.from(dirtyChannels).map(async (channelId) => {
      const state = localState.get(channelId);
      if (!state) return;

      await setSubscriptionsMutation.mutateAsync({
        channelId,
        data: {
          subscribe_to_all_services: state.subscribeToAll,
          service_ids: state.subscribeToAll ? [] : Array.from(state.serviceIds),
        },
      });
    });

    try {
      await Promise.all(promises);
      toast({ title: 'Subscriptions updated' });
      setDirtyChannels(new Set());
    } catch (error) {
      toast({
        title: 'Failed to update subscriptions',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const isLoading = channelsLoading || servicesLoading;
  const isSaving = setSubscriptionsMutation.isPending;
  const hasChanges = dirtyChannels.size > 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (channelsError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-8 w-8 text-destructive mb-2" />
          <p className="text-muted-foreground">Failed to load subscriptions</p>
        </CardContent>
      </Card>
    );
  }

  if (activeChannels.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Service Subscriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <BellOff className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No verified channels available.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Add and verify a notification channel first.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const groupedServices = groupServicesByGroup(services ?? [], groups ?? []);

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
              Choose which services to receive notifications about for each
              channel.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-medium">Service</th>
                {activeChannels.map((ch) => (
                  <th
                    key={ch.channel.id}
                    className="text-center py-3 px-4 font-medium"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <ChannelIcon type={ch.channel.type} />
                      <span
                        className="text-xs truncate max-w-[100px]"
                        title={ch.channel.target}
                      >
                        {ch.channel.type === 'email'
                          ? ch.channel.target.split('@')[0]
                          : ch.channel.target.length > 10
                            ? ch.channel.target.slice(0, 10) + '...'
                            : ch.channel.target}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* All Services Row */}
              <tr className="border-b bg-muted/50">
                <td className="py-3 px-2">
                  <div className="font-medium">All services</div>
                  <div className="text-xs text-muted-foreground">
                    Including future services
                  </div>
                </td>
                {activeChannels.map((ch) => {
                  const state = localState.get(ch.channel.id);
                  return (
                    <td key={ch.channel.id} className="text-center py-3 px-4">
                      <Checkbox
                        checked={state?.subscribeToAll ?? false}
                        onCheckedChange={(checked) =>
                          handleSubscribeToAllChange(
                            ch.channel.id,
                            checked === true
                          )
                        }
                      />
                    </td>
                  );
                })}
              </tr>

              {/* Grouped Services */}
              {groupedServices.map((group, groupIdx) => (
                <GroupRows
                  key={group.group?.id ?? `ungrouped-${groupIdx}`}
                  group={group}
                  activeChannels={activeChannels}
                  localState={localState}
                  onServiceChange={handleServiceChange}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-2 pt-6 border-t mt-6">
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface GroupRowsProps {
  group: GroupedServices;
  activeChannels: ChannelWithSubscriptions[];
  localState: Map<string, ChannelState>;
  onServiceChange: (
    channelId: string,
    serviceId: string,
    checked: boolean
  ) => void;
}

function GroupRows({
  group,
  activeChannels,
  localState,
  onServiceChange,
}: GroupRowsProps) {
  return (
    <>
      {/* Group Header */}
      <tr className="border-b">
        <td colSpan={activeChannels.length + 1} className="py-2 px-2">
          <span className="font-semibold text-sm">
            {group.group?.name ?? 'Other Services'}
          </span>
        </td>
      </tr>

      {/* Services in Group */}
      {group.services.map((service) => (
        <tr key={service.id} className="border-b hover:bg-muted/30">
          <td className="py-2 px-2 pl-6">
            <div>{service.name}</div>
            {service.description && (
              <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                {service.description}
              </div>
            )}
          </td>
          {activeChannels.map((ch) => {
            const state = localState.get(ch.channel.id);
            const isSubscribedToAll = state?.subscribeToAll ?? false;
            const isSubscribed = state?.serviceIds.has(service.id) ?? false;

            return (
              <td key={ch.channel.id} className="text-center py-2 px-4">
                {isSubscribedToAll ? (
                  <span className="text-muted-foreground">—</span>
                ) : (
                  <Checkbox
                    checked={isSubscribed}
                    onCheckedChange={(checked) =>
                      onServiceChange(ch.channel.id, service.id, checked === true)
                    }
                  />
                )}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
