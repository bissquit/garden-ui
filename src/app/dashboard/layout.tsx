'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

  useEffect(() => {
    if (isLoading) return;

    // Not authenticated — redirect to login
    if (!user) {
      router.replace('/login');
      return;
    }

    // Dashboard requires operator+
    if (!hasMinRole('operator')) {
      router.replace('/');
    }
  }, [user, isLoading, hasMinRole, router]);

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

  // No permission — don't render content
  if (!hasMinRole('operator')) {
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
