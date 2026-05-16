"use client"

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import { User, Settings, LogOut, ChevronDown, LayoutDashboard, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading, isInitialized } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Optimized auth guard: Only redirect if fully initialized and no user is found
  React.useEffect(() => {
    if (isInitialized && !user && !isLoading) {
      router.push('/');
    }
  }, [user, isLoading, isInitialized, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const getRoleDisplay = (role: string) => {
    if (role === 'Admin') return 'Primary Leader';
    if (role === 'Leader') return 'Cell Leader';
    return 'Cell Member';
  };

  // Improved loading state: Don't show a blocker if we're just restoring session offline
  if (!isInitialized || (isLoading && !user)) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Restoring Session...</p>
        </div>
      </div>
    );
  }

  // If we're on the login page, don't wrap in shell
  if (pathname === '/') return <>{children}</>;

  const navigation = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      url: "/dashboard",
      roles: ["Admin", "Leader"],
    },
    {
      title: "Member",
      icon: Users,
      url: "/members",
      roles: ["Admin", "Leader"],
    },
  ];

  const filteredNav = navigation.filter(item => 
    item.roles.includes(user?.role || "")
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 flex h-20 shrink-0 items-center border-b bg-background/80 backdrop-blur-md px-4 sm:px-8 transition-all duration-300">
        <div className="flex items-center gap-6 sm:gap-10 w-full max-w-7xl mx-auto">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="bg-primary text-primary-foreground h-10 w-10 rounded-xl flex items-center justify-center font-bold shadow-lg shadow-primary/20 group-active:scale-95 transition-all">
              CGT
            </div>
            <span className="text-xl font-headline font-black tracking-tighter hidden sm:block italic">Cell Group Tracker</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {filteredNav.map((item) => {
              const isActive = pathname === item.url;
              return (
                <Link 
                  key={item.title} 
                  href={item.url}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95",
                    isActive 
                      ? "bg-secondary text-primary shadow-inner" 
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <item.icon className="size-4" />
                  {item.title}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-secondary/50 h-auto sm:gap-3 rounded-2xl p-1.5">
                  <div className="text-sm text-right hidden sm:block">
                    <p className="font-black leading-none">{user?.name || 'User'}</p>
                    <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold mt-1">{user ? getRoleDisplay(user.role) : 'Offline'}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-secondary border border-white/5 flex items-center justify-center relative shadow-inner overflow-hidden">
                    <User className="size-5 text-muted-foreground" />
                  </div>
                  <ChevronDown className="size-4 text-muted-foreground hidden sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-[1.75rem] p-2.5 border-white/10 shadow-2xl">
                <DropdownMenuLabel className="p-3">
                  <div className="flex flex-col space-y-1">
                    <p className="font-black leading-none">{user?.name || 'User'}</p>
                    <p className="text-[10px] leading-none text-muted-foreground uppercase tracking-widest font-bold mt-1">{user ? getRoleDisplay(user.role) : 'Offline Mode'}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="mx-2 opacity-50" />
                <div className="md:hidden">
                  <DropdownMenuLabel className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60 font-black px-3 pt-3">Navigation</DropdownMenuLabel>
                  {filteredNav.map((item) => (
                    <DropdownMenuItem key={item.title} onClick={() => router.push(item.url)} className="gap-3 p-4 rounded-xl cursor-pointer">
                      <item.icon className="size-5" />
                      <span className="font-bold">{item.title}</span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator className="mx-2 opacity-50" />
                </div>
                <DropdownMenuItem onClick={() => router.push('/settings')} className="gap-3 p-4 rounded-xl cursor-pointer hover:bg-secondary transition-all">
                  <Settings className="size-5" />
                  <span className="font-bold">Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="mx-2 opacity-50" />
                <DropdownMenuItem onClick={handleLogout} className="gap-3 p-4 rounded-xl cursor-pointer text-destructive focus:text-destructive hover:bg-destructive/10 transition-all">
                  <LogOut className="size-5" />
                  <span className="font-bold">Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-x-hidden p-4 sm:p-8">
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </main>

      {/* Mobile Navigation Bar (Bottom) */}
      <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] glass-card rounded-[2.5rem] p-2 flex items-center justify-around z-50 shadow-2xl border-white/10 backdrop-blur-2xl">
        {filteredNav.map((item) => {
          const isActive = pathname === item.url;
          return (
            <Link 
              key={item.title} 
              href={item.url}
              className={cn(
                "flex flex-col items-center gap-1 px-6 py-3 rounded-[2rem] transition-all active:scale-90",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-105" 
                  : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("size-6", isActive ? "animate-pulse" : "")} />
              <span className="text-[10px] font-black uppercase tracking-widest">{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}