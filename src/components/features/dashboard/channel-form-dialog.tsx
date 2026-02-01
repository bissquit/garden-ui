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
import { ChannelForm } from './channel-form';
import { useCreateChannel } from '@/hooks/use-channels-mutations';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import type { CreateChannelFormData } from '@/lib/validations/channel';

interface ChannelFormDialogProps {
  trigger?: React.ReactNode;
}

export function ChannelFormDialog({ trigger }: ChannelFormDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const createMutation = useCreateChannel();

  const handleSubmit = async (data: CreateChannelFormData) => {
    try {
      await createMutation.mutateAsync(data);
      toast({
        title: 'Channel added successfully',
        description: 'Please check your inbox to verify the channel.',
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: 'Failed to add channel',
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
            Add Channel
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Notification Channel</DialogTitle>
        </DialogHeader>
        <ChannelForm
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
