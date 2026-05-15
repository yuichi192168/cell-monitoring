"use client"

import React from 'react';
import { LayoutShell } from '@/components/layout-shell';
import { useAuth } from '@/hooks/use-auth';
import { AdminDashboard } from '@/components/dashboard/admin-view';
import { LeaderDashboard } from '@/components/dashboard/leader-view';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function DashboardDispatcher() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const renderView = () => {
    switch (user?.role) {
      case 'Admin':
        return <AdminDashboard />;
      case 'Leader':
        return <LeaderDashboard />;
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-6 animate-in fade-in duration-500">
            <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center shadow-inner">
              <Lock className="size-10 text-destructive" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-headline font-bold">Access Restricted</h2>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Only Leaders and Primary Leaders are permitted to access this system.
              </p>
            </div>
            <Button onClick={() => logout().then(() => router.push('/'))} variant="outline" size="lg" className="w-full max-w-xs">
              Return to Login
            </Button>
          </div>
        );
    }
  };

  return (
    <LayoutShell>
      {renderView()}
    </LayoutShell>
  );
}
