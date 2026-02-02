'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import type { Role } from '@/types';
import {
  LayoutDashboard,
  Server,
  FolderTree,
  AlertCircle,
  FileText,
  Settings,
} from 'lucide-react';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard, minRole: 'operator' as Role },
  { name: 'Services', href: '/dashboard/services', icon: Server, minRole: 'operator' as Role },
  { name: 'Groups', href: '/dashboard/groups', icon: FolderTree, minRole: 'operator' as Role },
  { name: 'Events', href: '/dashboard/events', icon: AlertCircle, minRole: 'operator' as Role },
  { name: 'Templates', href: '/dashboard/templates', icon: FileText, minRole: 'operator' as Role },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, minRole: 'user' as Role },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { hasMinRole } = useAuth();

  const visibleNavigation = navigation.filter((item) => hasMinRole(item.minRole));

  return (
    <aside className="w-64 border-r bg-card min-h-[calc(100vh-4rem)]">
      <nav className="p-4 space-y-1">
        {visibleNavigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
