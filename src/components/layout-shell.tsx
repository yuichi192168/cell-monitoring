
"use client"

import React from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const getRoleDisplay = (role: string) => {
    if (role === 'Admin') return 'Primary Leader';
    if (role === 'Leader') return 'Cell Leader';
    return 'Cell Member';
  };

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
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-md px-4 transition-all duration-300">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-secondary/50 h-auto sm:gap-3">
                  <div className="text-sm text-right hidden sm:block">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-muted-foreground text-[10px] uppercase tracking-wider">{getRoleDisplay(user.role)}</p>
                  </div>
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-secondary border border-border flex items-center justify-center relative">
                    <User className="size-4 sm:size-5 text-muted-foreground" />
                  </div>
                  <ChevronDown className="size-3 sm:size-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="sm:hidden">
                  <div className="flex flex-col space-y-1">
                    <p className="font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground uppercase">{getRoleDisplay(user.role)}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="sm:hidden" />
                <DropdownMenuLabel className="hidden sm:block">Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/settings')} className="gap-2 cursor-pointer py-3 sm:py-2">
                  <Settings className="size-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="gap-2 text-destructive focus:text-destructive cursor-pointer py-3 sm:py-2">
                  <LogOut className="size-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
