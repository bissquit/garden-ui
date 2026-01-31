'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAddServicesToEvent, useRemoveServicesFromEvent } from '@/hooks/use-events-mutations';
import { useToast } from '@/hooks/use-toast';
import { Plus, Minus, Loader2 } from 'lucide-react';
import type { components } from '@/api/types.generated';

type Event = components['schemas']['Event'];
type Service = components['schemas']['Service'];
type ServiceGroup = components['schemas']['ServiceGroup'];

interface EventServicesManagerProps {
  event: Event;
  services: Service[];
  groups: ServiceGroup[];
}

export function EventServicesManager({ event, services, groups }: EventServicesManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);

  const addMutation = useAddServicesToEvent();
  const removeMutation = useRemoveServicesFromEvent();
  const { toast } = useToast();

  // Services associated with the event
  const eventServices = services.filter(s =>
    event.service_ids?.includes(s.id)
  );

  // Groups associated with the event
  const eventGroups = groups.filter(g =>
    event.group_ids?.includes(g.id)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Affected Services</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
          {eventServices.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRemoveDialogOpen(true)}
            >
              <Minus className="h-4 w-4 mr-1" />
              Remove
            </Button>
          )}
        </div>
      </div>

      {/* Show selected groups */}
      {eventGroups.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">Selected groups:</p>
          <div className="flex flex-wrap gap-2">
            {eventGroups.map(group => (
              <Badge key={group.id} variant="secondary">
                {group.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Show services list */}
      <div>
        <p className="text-sm text-muted-foreground mb-2">
          Services ({eventServices.length}):
        </p>
        <div className="flex flex-wrap gap-2">
          {eventServices.map(service => (
            <Badge key={service.id} variant="outline">
              {service.name}
            </Badge>
          ))}
          {eventServices.length === 0 && (
            <p className="text-sm text-muted-foreground">No services</p>
          )}
        </div>
      </div>

      {/* Add Services Dialog */}
      <AddServicesDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        event={event}
        services={services}
        groups={groups}
        onSubmit={async (data) => {
          try {
            await addMutation.mutateAsync({ eventId: event.id, data });
            toast({ title: 'Services added successfully' });
            setIsAddDialogOpen(false);
          } catch (error) {
            toast({
              title: 'Failed to add services',
              description: error instanceof Error ? error.message : 'Unknown error',
              variant: 'destructive',
            });
          }
        }}
        isSubmitting={addMutation.isPending}
      />

      {/* Remove Services Dialog */}
      <RemoveServicesDialog
        open={isRemoveDialogOpen}
        onOpenChange={setIsRemoveDialogOpen}
        eventServices={eventServices}
        onSubmit={async (serviceIds, reason) => {
          try {
            await removeMutation.mutateAsync({
              eventId: event.id,
              data: { service_ids: serviceIds, reason },
            });
            toast({ title: 'Services removed successfully' });
            setIsRemoveDialogOpen(false);
          } catch (error) {
            toast({
              title: 'Failed to remove services',
              description: error instanceof Error ? error.message : 'Unknown error',
              variant: 'destructive',
            });
          }
        }}
        isSubmitting={removeMutation.isPending}
      />
    </div>
  );
}

// Add Services Dialog
interface AddServicesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
  services: Service[];
  groups: ServiceGroup[];
  onSubmit: (data: { service_ids?: string[]; group_ids?: string[]; reason?: string }) => void;
  isSubmitting: boolean;
}

function AddServicesDialog({
  open,
  onOpenChange,
  event,
  services,
  groups,
  onSubmit,
  isSubmitting,
}: AddServicesDialogProps) {
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [reason, setReason] = useState('');

  // Services not yet in the event
  const availableServices = services.filter(s => !event.service_ids?.includes(s.id));
  // Groups not yet selected for the event
  const availableGroups = groups.filter(g => !event.group_ids?.includes(g.id));

  const handleSubmit = () => {
    if (selectedServiceIds.length === 0 && selectedGroupIds.length === 0) return;
    onSubmit({
      service_ids: selectedServiceIds.length > 0 ? selectedServiceIds : undefined,
      group_ids: selectedGroupIds.length > 0 ? selectedGroupIds : undefined,
      reason: reason || undefined,
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedServiceIds([]);
      setSelectedGroupIds([]);
      setReason('');
    }
    onOpenChange(isOpen);
  };

  const getServicesCountInGroup = (groupId: string) => {
    return services.filter(s => s.group_ids?.includes(groupId)).length;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Services</DialogTitle>
          <DialogDescription>
            Select services and/or groups to add to this event.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Groups selection */}
          {availableGroups.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Groups</Label>
              <p className="text-sm text-muted-foreground mb-2">
                All services in the group will be added
              </p>
              <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                {availableGroups.map((group) => (
                  <div key={group.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`add-group-${group.id}`}
                      checked={selectedGroupIds.includes(group.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedGroupIds([...selectedGroupIds, group.id]);
                        } else {
                          setSelectedGroupIds(selectedGroupIds.filter(id => id !== group.id));
                        }
                      }}
                    />
                    <label htmlFor={`add-group-${group.id}`} className="text-sm cursor-pointer">
                      {group.name}
                      <span className="text-muted-foreground ml-1">
                        ({getServicesCountInGroup(group.id)} services)
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Services selection */}
          {availableServices.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Individual Services</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2 mt-2">
                {availableServices.map((service) => (
                  <div key={service.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`add-service-${service.id}`}
                      checked={selectedServiceIds.includes(service.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedServiceIds([...selectedServiceIds, service.id]);
                        } else {
                          setSelectedServiceIds(selectedServiceIds.filter(id => id !== service.id));
                        }
                      }}
                    />
                    <label htmlFor={`add-service-${service.id}`} className="text-sm cursor-pointer">
                      {service.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {availableServices.length === 0 && availableGroups.length === 0 && (
            <p className="text-sm text-muted-foreground">
              All services and groups are already added to this event.
            </p>
          )}

          {/* Reason input */}
          <div>
            <Label htmlFor="add-reason">Reason (optional)</Label>
            <Input
              id="add-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are these services being added?"
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (selectedServiceIds.length === 0 && selectedGroupIds.length === 0)}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Services
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Remove Services Dialog
interface RemoveServicesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventServices: Service[];
  onSubmit: (serviceIds: string[], reason?: string) => void;
  isSubmitting: boolean;
}

function RemoveServicesDialog({
  open,
  onOpenChange,
  eventServices,
  onSubmit,
  isSubmitting,
}: RemoveServicesDialogProps) {
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (selectedServiceIds.length === 0) return;
    onSubmit(selectedServiceIds, reason || undefined);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedServiceIds([]);
      setReason('');
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Remove Services</DialogTitle>
          <DialogDescription>
            Select services to remove from this event.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Services selection */}
          <div>
            <Label className="text-sm font-medium">Select services to remove</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2 mt-2">
              {eventServices.map((service) => (
                <div key={service.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`remove-service-${service.id}`}
                    checked={selectedServiceIds.includes(service.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedServiceIds([...selectedServiceIds, service.id]);
                      } else {
                        setSelectedServiceIds(selectedServiceIds.filter(id => id !== service.id));
                      }
                    }}
                  />
                  <label htmlFor={`remove-service-${service.id}`} className="text-sm cursor-pointer">
                    {service.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Reason input */}
          <div>
            <Label htmlFor="remove-reason">Reason (optional)</Label>
            <Input
              id="remove-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are these services being removed?"
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting || selectedServiceIds.length === 0}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Remove {selectedServiceIds.length > 0 ? `(${selectedServiceIds.length})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
