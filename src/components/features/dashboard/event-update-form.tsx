'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
import { Loader2 } from 'lucide-react';
import {
  addEventUpdateSchema,
  type AddEventUpdateFormData,
} from '@/lib/validations/event';
import { eventStatusConfig } from '@/lib/status-utils';
import type { components } from '@/api/types.generated';

type EventType = components['schemas']['EventType'];
type EventStatus = components['schemas']['EventStatus'];

interface EventUpdateFormProps {
  eventType: EventType;
  currentStatus: EventStatus;
  onSubmit: (data: AddEventUpdateFormData) => void;
  isLoading?: boolean;
}

const incidentStatuses = ['investigating', 'identified', 'monitoring', 'resolved'];
const maintenanceStatuses = ['scheduled', 'in_progress', 'completed'];

export function EventUpdateForm({
  eventType,
  currentStatus,
  onSubmit,
  isLoading,
}: EventUpdateFormProps) {
  const statuses = eventType === 'incident' ? incidentStatuses : maintenanceStatuses;

  const form = useForm<AddEventUpdateFormData>({
    resolver: zodResolver(addEventUpdateSchema),
    defaultValues: {
      status: currentStatus,
      message: '',
      notify_subscribers: false,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Update Message</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Describe the update..."
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post Update
          </Button>
        </div>
      </form>
    </Form>
  );
}
