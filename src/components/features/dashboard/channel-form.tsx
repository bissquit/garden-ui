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
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, MessageSquare, Hash, AlertTriangle } from 'lucide-react';
import {
  createChannelSchema,
  type CreateChannelFormData,
} from '@/lib/validations/channel';
import type { AvailableChannelType } from '@/hooks/use-notifications-config';

interface ChannelFormProps {
  onSubmit: (data: CreateChannelFormData) => void;
  isLoading?: boolean;
  availableChannels?: AvailableChannelType[];
  telegramBotUsername?: string;
}

export function ChannelForm({
  onSubmit,
  isLoading,
  availableChannels = ['email', 'telegram', 'mattermost'],
  telegramBotUsername,
}: ChannelFormProps) {
  const defaultType = availableChannels[0] ?? 'email';
  const form = useForm<CreateChannelFormData>({
    resolver: zodResolver(createChannelSchema),
    defaultValues: {
      type: defaultType,
      target: '',
    },
  });

  const watchType = form.watch('type');

  const getPlaceholder = () => {
    switch (watchType) {
      case 'email':
        return 'Enter email address';
      case 'telegram':
        return 'Enter Telegram ID';
      case 'mattermost':
        return 'https://mattermost.example.com/hooks/xxx';
      default:
        return 'Enter target';
    }
  };

  const getDescription = () => {
    switch (watchType) {
      case 'email':
        return 'We will send a verification code to this address.';
      case 'telegram':
        if (telegramBotUsername) {
          return null;
        }
        return (
          <span>
            Use{' '}
            <a
              href="https://t.me/userinfobot"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              @userinfobot
            </a>{' '}
            to find your chat ID.
          </span>
        );
      case 'mattermost':
        return 'Create an Incoming Webhook in Mattermost and paste the URL here.';
      default:
        return '';
    }
  };

  const renderTelegramAlert = () => {
    if (watchType !== 'telegram' || !telegramBotUsername) return null;

    return (
      <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertTitle className="text-amber-800 dark:text-amber-200">
          Setup required
        </AlertTitle>
        <AlertDescription className="text-amber-700 dark:text-amber-300">
          <ol className="list-decimal list-inside space-y-1 mt-1">
            <li>
              Start the bot — send{' '}
              <code className="rounded bg-amber-100 px-1 py-0.5 text-xs font-mono dark:bg-amber-900/50">
                /start
              </code>{' '}
              to{' '}
              <a
                href={`https://t.me/${telegramBotUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:opacity-80"
              >
                @{telegramBotUsername}
              </a>
            </li>
            <li>
              Get your chat ID — send any message to{' '}
              <a
                href="https://t.me/userinfobot"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:opacity-80"
              >
                @userinfobot
              </a>
            </li>
          </ol>
        </AlertDescription>
      </Alert>
    );
  };

  const getInputLabel = () => {
    switch (watchType) {
      case 'email':
        return 'Email Address';
      case 'telegram':
        return 'Username';
      case 'mattermost':
        return 'Webhook URL';
      default:
        return 'Target';
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
                  {availableChannels.includes('email') && (
                    <SelectItem value="email">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>Email</span>
                      </div>
                    </SelectItem>
                  )}
                  {availableChannels.includes('telegram') && (
                    <SelectItem value="telegram">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>Telegram</span>
                      </div>
                    </SelectItem>
                  )}
                  {availableChannels.includes('mattermost') && (
                    <SelectItem value="mattermost">
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        <span>Mattermost</span>
                      </div>
                    </SelectItem>
                  )}
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
              <FormLabel>{getInputLabel()}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={getPlaceholder()}
                  type={watchType === 'email' ? 'email' : 'text'}
                />
              </FormControl>
              {getDescription() && (
                <FormDescription>{getDescription()}</FormDescription>
              )}
              {renderTelegramAlert()}
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
