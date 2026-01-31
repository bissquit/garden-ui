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
import { TemplateForm } from './template-form';
import { useCreateTemplate } from '@/hooks/use-templates-mutations';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import type { CreateTemplateFormData } from '@/lib/validations/template';

interface TemplateFormDialogProps {
  trigger?: React.ReactNode;
}

export function TemplateFormDialog({ trigger }: TemplateFormDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createMutation = useCreateTemplate();

  const handleSubmit = async (data: CreateTemplateFormData) => {
    try {
      await createMutation.mutateAsync(data);
      toast({ title: 'Template created successfully' });
      setOpen(false);
    } catch (error) {
      toast({
        title: 'Failed to create template',
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
            <Plus className="mr-2 h-4 w-4" />
            Add Template
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Template</DialogTitle>
        </DialogHeader>
        <TemplateForm
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
