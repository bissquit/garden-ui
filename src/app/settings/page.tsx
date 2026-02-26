'use client';

import { useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useChannels } from '@/hooks/use-channels';
import { useNotificationsConfig } from '@/hooks/use-notifications-config';
import { ChangePasswordForm } from '@/components/features/auth/change-password-form';
import { ProfileForm } from '@/components/features/auth/profile-form';
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
import { User, Lock, AlertCircle, BellOff } from 'lucide-react';
import { SettingsPageSkeleton } from '@/components/features/dashboard';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
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

  const handleProfileUpdateSuccess = useCallback(() => {
    toast({
      title: 'Profile updated',
      description: 'Your profile has been updated successfully.',
    });
  }, [toast]);

  const handlePasswordChangeSuccess = useCallback(async () => {
    toast({
      title: 'Password changed',
      description: 'Please log in with your new password.',
    });
    await logout();
    // logout() already redirects to /login
  }, [toast, logout]);

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
          {user ? (
            <ProfileForm user={user} onSuccess={handleProfileUpdateSuccess} />
          ) : (
            <p className="text-sm text-muted-foreground">Loading profile...</p>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Change Password Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your account password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm onSuccess={handlePasswordChangeSuccess} />
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
            <SettingsPageSkeleton />
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
