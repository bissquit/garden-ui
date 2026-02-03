'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Header } from '@/components/layout/header';
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, hasMinRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    // Not authenticated — redirect to login
    if (!user) {
      router.replace('/login');
      return;
    }

    // Settings is accessible to all authenticated users
    if (pathname === '/dashboard/settings') {
      return;
    }

    // Other dashboard pages require operator+
    if (!hasMinRole('operator')) {
      router.replace('/dashboard/settings');
    }
  }, [user, isLoading, hasMinRole, pathname, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Not authenticated — don't render content
  if (!user) {
    return null;
  }

  // No permission for this page — don't render content
  if (pathname !== '/dashboard/settings' && !hasMinRole('operator')) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <DashboardSidebar />
        <main className="flex-1 p-6 bg-background">{children}</main>
      </div>
    </div>
  );
}
