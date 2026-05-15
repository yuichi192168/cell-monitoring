
"use client"

import React from 'react';
import { LayoutShell } from '@/components/layout-shell';
import { useAuth } from '@/hooks/use-auth';
import { AdminDashboard } from '@/components/dashboard/admin-view';
import { LeaderDashboard } from '@/components/dashboard/leader-view';
import { MemberDashboard } from '@/components/dashboard/member-view';

export default function DashboardDispatcher() {
  const { user } = useAuth();

  const renderView = () => {
    switch (user?.role) {
      case 'Admin':
        return <AdminDashboard />;
      case 'Leader':
        return <LeaderDashboard />;
      case 'Member':
        return <MemberDashboard />;
      default:
        return <div>Access Denied</div>;
    }
  };

  return (
    <LayoutShell>
      {renderView()}
    </LayoutShell>
  );
}
