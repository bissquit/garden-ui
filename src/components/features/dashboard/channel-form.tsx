'use client';

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
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Mail, MessageSquare } from 'lucide-react';
import {
  createChannelSchema,
  type CreateChannelFormData,
} from '@/lib/validations/channel';

interface ChannelFormProps {
  onSubmit: (data: CreateChannelFormData) => void;
  isLoading?: boolean;
}

export function ChannelForm({ onSubmit, isLoading }: ChannelFormProps) {
  const form = useForm<CreateChannelFormData>({
    resolver: zodResolver(createChannelSchema),
    defaultValues: {
      type: 'email',
      target: '',
    },
  });

  const watchType = form.watch('type');

  const getPlaceholder = () => {
    switch (watchType) {
      case 'email':
        return 'Enter email address';
      case 'telegram':
        return 'Enter Telegram username';
      default:
        return 'Enter target';
    }
  };

  const getDescription = () => {
    switch (watchType) {
      case 'email':
        return 'We will send a verification email to this address.';
      case 'telegram':
        return 'Enter your Telegram username without the @ symbol.';
      default:
        return '';
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Channel Type</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  form.setValue('target', '');
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select channel type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="email">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="telegram">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>Telegram</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="target"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {watchType === 'email' ? 'Email Address' : 'Username'}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={getPlaceholder()}
                  type={watchType === 'email' ? 'email' : 'text'}
                />
              </FormControl>
              <FormDescription>{getDescription()}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Channel
          </Button>
        </div>
      </form>
    </Form>
  );
}
