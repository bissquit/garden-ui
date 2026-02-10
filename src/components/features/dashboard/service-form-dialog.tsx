'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ServiceForm } from './service-form';
import { useCreateService, useUpdateService } from '@/hooks/use-services-mutations';
import { useGroups } from '@/hooks/use-public-status';
import { useServiceTags, useUpdateServiceTags } from '@/hooks/use-service-tags';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Loader2 } from 'lucide-react';
import type { components } from '@/api/types.generated';
import type { CreateServiceFormData, UpdateServiceFormData } from '@/lib/validations/service';

type Service = components['schemas']['Service'];

interface ServiceFormDialogProps {
  service?: Service;
  trigger?: React.ReactNode;
}

export function ServiceFormDialog({ service, trigger }: ServiceFormDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { data: groups } = useGroups();

  // Load tags for existing service (only when dialog is open)
  const { data: tagsData, isLoading: tagsLoading } = useServiceTags(
    open && service?.slug ? service.slug : ''
  );

  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const updateTagsMutation = useUpdateServiceTags();

  const isEditing = !!service;
  const isLoading = createMutation.isPending || updateMutation.isPending || updateTagsMutation.isPending;

  const handleSubmit = async (
    data: CreateServiceFormData | UpdateServiceFormData,
    tags?: Record<string, string>
  ) => {
    try {
      let slug: string;

      if (isEditing) {
        await updateMutation.mutateAsync({ slug: service.slug, data: data as UpdateServiceFormData });
        slug = service.slug;
      } else {
        await createMutation.mutateAsync(data as CreateServiceFormData);
        slug = (data as CreateServiceFormData).slug;
      }

      // Save tags if provided
      if (tags) {
        await updateTagsMutation.mutateAsync({ slug, tags });
      }

      toast({ title: isEditing ? 'Service updated successfully' : 'Service created successfully' });
      setOpen(false);
    } catch (error) {
      toast({
        title: isEditing ? 'Failed to update service' : 'Failed to create service',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            {isEditing ? (
              <>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Service
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Service' : 'Create Service'}
          </DialogTitle>
        </DialogHeader>
        {isEditing && tagsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ServiceForm
            key={service?.slug ?? 'new'}
            service={service}
            groups={groups ?? []}
            initialTags={isEditing ? tagsData : undefined}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            hasActiveEvents={service?.has_active_events}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
