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
import { Input } from '@/components/ui/input';
import {
  Loader2,
  Bell,
  BellOff,
  AlertCircle,
  Search,
} from 'lucide-react';
import { useSubscriptionsMatrix } from '@/hooks/use-subscriptions';
import { useSetChannelSubscriptions } from '@/hooks/use-subscriptions-mutations';
import { useServices, useGroups } from '@/hooks/use-public-status';
import { useToast } from '@/hooks/use-toast';
import { channelTypeShortLabel } from '@/lib/status-utils';
import type { components } from '@/api/types.generated';

type ChannelWithSubscriptions = components['schemas']['ChannelWithSubscriptions'];
type Service = components['schemas']['Service'];
type ServiceGroup = components['schemas']['ServiceGroup'];

interface ChannelState {
  subscribeToAll: boolean;
  serviceIds: Set<string>;
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
  const [searchQuery, setSearchQuery] = useState('');

  const activeChannels = useMemo(() => {
    if (!channelsData) return [];
    return channelsData;
  }, [channelsData]);

  const isChannelInteractive = useCallback(
    (channelId: string) => {
      const ch = channelsData?.find((c) => c.channel.id === channelId);
      return ch?.channel.is_verified === true && ch?.channel.is_enabled === true;
    },
    [channelsData]
  );

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
      if (!isChannelInteractive(channelId)) return;
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
    [isChannelInteractive]
  );

  const handleServiceChange = useCallback(
    (channelId: string, serviceId: string, checked: boolean) => {
      if (!isChannelInteractive(channelId)) return;
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
    [isChannelInteractive]
  );

  const handleGroupChange = useCallback(
    (channelId: string, serviceIds: string[], checked: boolean) => {
      if (!isChannelInteractive(channelId)) return;
      setLocalState((prev) => {
        const newState = new Map(prev);
        const current = newState.get(channelId);
        if (current && !current.subscribeToAll) {
          const newServiceIds = new Set(current.serviceIds);
          if (checked) {
            serviceIds.forEach((id) => newServiceIds.add(id));
          } else {
            serviceIds.forEach((id) => newServiceIds.delete(id));
          }
          newState.set(channelId, { ...current, serviceIds: newServiceIds });
        }
        return newState;
      });
      setDirtyChannels((prev) => new Set(prev).add(channelId));
    },
    [isChannelInteractive]
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

  const groupedServices = useMemo(
    () => groupServicesByGroup(services ?? [], groups ?? []),
    [services, groups]
  );

  const allGroupServiceIdsMap = useMemo(() => {
    const map = new Map<string | null, string[]>();
    groupedServices.forEach((g) => {
      const key = g.group?.id ?? null;
      map.set(key, g.services.map((s) => s.id));
    });
    return map;
  }, [groupedServices]);

  const filteredGroupedServices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return groupedServices;

    return groupedServices
      .map((group) => ({
        ...group,
        services: group.services.filter(
          (service) =>
            service.name.toLowerCase().includes(query) ||
            (service.description?.toLowerCase().includes(query) ?? false)
        ),
      }))
      .filter((group) => group.services.length > 0);
  }, [groupedServices, searchQuery]);

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

  if (!channelsData || channelsData.length === 0) {
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
              No channels available.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Add a notification channel first.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
        <div className="relative max-w-sm mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm pl-9"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-medium">Service</th>
                {activeChannels.map((ch) => {
                  const interactive = isChannelInteractive(ch.channel.id);
                  const statusLabel = !ch.channel.is_verified
                    ? 'Unverified'
                    : !ch.channel.is_enabled
                      ? 'Disabled'
                      : null;
                  const tooltipText = statusLabel
                    ? `This channel is ${statusLabel.toLowerCase()}. Verify and enable it to manage subscriptions.`
                    : ch.channel.target;

                  const displayText =
                    ch.channel.type === 'email'
                      ? ch.channel.target.split('@')[0]
                      : ch.channel.target.length > 12
                        ? ch.channel.target.slice(0, 12) + '...'
                        : ch.channel.target;

                  return (
                    <th
                      key={ch.channel.id}
                      className="text-center py-3 px-2 font-medium"
                    >
                      <div
                        className={`flex flex-col items-center gap-1 ${!interactive ? 'opacity-50' : ''}`}
                        title={tooltipText}
                      >
                        <span className="text-xs text-muted-foreground font-medium">
                          {channelTypeShortLabel[ch.channel.type]}
                        </span>
                        {statusLabel ? (
                          <span className="text-xs text-amber-500">
                            {statusLabel}
                          </span>
                        ) : (
                          <span className="text-xs truncate max-w-[80px]">
                            {displayText}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
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
                    <td key={ch.channel.id} className="py-3 px-2">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={state?.subscribeToAll ?? false}
                          onCheckedChange={(checked) =>
                            handleSubscribeToAllChange(
                              ch.channel.id,
                              checked === true
                            )
                          }
                          disabled={!isChannelInteractive(ch.channel.id)}
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Grouped Services */}
              {filteredGroupedServices.length > 0 ? (
                filteredGroupedServices.map((group, groupIdx) => (
                  <GroupRows
                    key={group.group?.id ?? `ungrouped-${groupIdx}`}
                    group={group}
                    allGroupServiceIds={
                      allGroupServiceIdsMap.get(group.group?.id ?? null) ?? []
                    }
                    activeChannels={activeChannels}
                    localState={localState}
                    onServiceChange={handleServiceChange}
                    onGroupChange={handleGroupChange}
                    isChannelInteractive={isChannelInteractive}
                  />
                ))
              ) : searchQuery.trim() ? (
                <tr>
                  <td
                    colSpan={activeChannels.length + 1}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No services match your search
                  </td>
                </tr>
              ) : null}
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
  allGroupServiceIds: string[];
  activeChannels: ChannelWithSubscriptions[];
  localState: Map<string, ChannelState>;
  onServiceChange: (
    channelId: string,
    serviceId: string,
    checked: boolean
  ) => void;
  onGroupChange: (
    channelId: string,
    serviceIds: string[],
    checked: boolean
  ) => void;
  isChannelInteractive: (channelId: string) => boolean;
}

function GroupRows({
  group,
  allGroupServiceIds,
  activeChannels,
  localState,
  onServiceChange,
  onGroupChange,
  isChannelInteractive,
}: GroupRowsProps) {
  return (
    <>
      {/* Group Header */}
      <tr className="border-b bg-muted/30">
        <td className="py-3 px-2">
          <span className="font-semibold">
            {group.group?.name ?? 'Other Services'}
          </span>
        </td>
        {activeChannels.map((ch) => {
          const state = localState.get(ch.channel.id);
          const isSubscribedToAll = state?.subscribeToAll ?? false;
          const interactive = isChannelInteractive(ch.channel.id);

          if (isSubscribedToAll && interactive) {
            return (
              <td key={ch.channel.id} className="py-3 px-2">
                <div className="flex justify-center">
                  <span className="text-muted-foreground">&mdash;</span>
                </div>
              </td>
            );
          }

          const subscribedCount = allGroupServiceIds.filter(
            (id) => state?.serviceIds.has(id) ?? false
          ).length;
          const totalCount = allGroupServiceIds.length;
          const allChecked = totalCount > 0 && subscribedCount === totalCount;
          const someChecked = subscribedCount > 0 && !allChecked;

          return (
            <td key={ch.channel.id} className="py-3 px-2">
              <div className="flex justify-center">
                <Checkbox
                  checked={
                    allChecked ? true : someChecked ? 'indeterminate' : false
                  }
                  onCheckedChange={(checked) =>
                    onGroupChange(
                      ch.channel.id,
                      allGroupServiceIds,
                      checked === true
                    )
                  }
                  disabled={!interactive || isSubscribedToAll}
                />
              </div>
            </td>
          );
        })}
      </tr>

      {/* Services in Group */}
      {group.services.map((service) => (
        <tr key={service.id} className="border-b hover:bg-muted/30">
          <td className="py-2 px-2 pl-6">
            <div>{service.name}</div>
            {service.description && (
              <div className="text-xs text-muted-foreground truncate">
                {service.description}
              </div>
            )}
          </td>
          {activeChannels.map((ch) => {
            const state = localState.get(ch.channel.id);
            const isSubscribedToAll = state?.subscribeToAll ?? false;
            const isSubscribed = state?.serviceIds.has(service.id) ?? false;
            const interactive = isChannelInteractive(ch.channel.id);

            return (
              <td key={ch.channel.id} className="py-2 px-2">
                <div className="flex justify-center">
                  {isSubscribedToAll && interactive ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <Checkbox
                      checked={isSubscribedToAll ? false : isSubscribed}
                      onCheckedChange={(checked) =>
                        onServiceChange(ch.channel.id, service.id, checked === true)
                      }
                      disabled={!interactive || isSubscribedToAll}
                    />
                  )}
                </div>
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
