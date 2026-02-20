'use client';

import { useAuth } from '@/hooks/use-auth';
import { useChannels } from '@/hooks/use-channels';
import { useNotificationsConfig } from '@/hooks/use-notifications-config';
import {
  ChannelsTable,
  ChannelFormDialog,
  SubscriptionEditor,
} from '@/components/features/dashboard';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, User, AlertCircle, BellOff } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const {
    data: channels,
    isLoading: channelsLoading,
    isError: channelsError,
  } = useChannels();
  const {
    data: notificationsConfig,
    isLoading: configLoading,
    isError: configError,
  } = useNotificationsConfig();

  const availableChannels = notificationsConfig?.available_channels;
  const telegramBotUsername =
    notificationsConfig?.telegram?.bot_username ?? undefined;
  const noChannelsAvailable =
    availableChannels !== undefined && availableChannels.length === 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and notification preferences
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Email
              </label>
              <p className="text-sm">{user?.email ?? 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Role
              </label>
              <p className="text-sm capitalize">{user?.role ?? 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Notification Channels Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Notification Channels</CardTitle>
              <CardDescription>
                Manage how you receive notifications
              </CardDescription>
            </div>
            {!noChannelsAvailable && (
              <ChannelFormDialog
                availableChannels={availableChannels}
                telegramBotUsername={telegramBotUsername}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {channelsLoading || configLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : channelsError || configError ? (
            <div className="flex flex-col items-center justify-center py-8">
              <AlertCircle className="h-8 w-8 text-destructive mb-2" />
              <p className="text-muted-foreground">Failed to load channels</p>
            </div>
          ) : noChannelsAvailable ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BellOff className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="font-medium">Notifications are not configured</p>
              <p className="text-sm text-muted-foreground mt-1">
                No notification channel types are currently enabled by the
                administrator.
              </p>
            </div>
          ) : (
            <ChannelsTable
              channels={channels ?? []}
              availableChannels={availableChannels}
            />
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Subscriptions Section */}
      <SubscriptionEditor />
    </div>
  );
}
