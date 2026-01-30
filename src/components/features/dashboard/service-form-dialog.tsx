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
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil } from 'lucide-react';
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

  const createMutation = useCreateService();
  const updateMutation = useUpdateService();

  const isEditing = !!service;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (data: CreateServiceFormData | UpdateServiceFormData) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ slug: service.slug, data: data as UpdateServiceFormData });
        toast({ title: 'Service updated successfully' });
      } else {
        await createMutation.mutateAsync(data as CreateServiceFormData);
        toast({ title: 'Service created successfully' });
      }
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
        <ServiceForm
          service={service}
          groups={groups ?? []}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
