
"use client"

import React from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-auto flex items-center gap-4">
            <div className="text-sm text-right hidden sm:block">
              <p className="font-medium">{user.name}</p>
              <p className="text-muted-foreground text-xs">{user.role}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-secondary border border-border flex items-center justify-center overflow-hidden">
               <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
