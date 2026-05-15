
"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection, useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Users, UserCheck, Activity } from 'lucide-react';
import { useMemoFirebase } from '@/hooks/use-memo-firebase';
import { useAuth } from '@/hooks/use-auth';

export function AdminDashboard() {
  const { user } = useAuth();
  const db = useFirestore();
  
  const allMembersQuery = useMemoFirebase(() => {
    if (!user || user.role !== 'Admin') return null;
    return collection(db, 'users');
  }, [db, user]);

  const { data: allMembers, loading: loadingAll } = useCollection(allMembersQuery);

  const stats = {
    totalUsers: allMembers.length,
    activeMembers: allMembers.filter(m => m.status === 'Active').length,
    leaders: allMembers.filter(m => m.role === 'Leader').length,
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1 sm:gap-2">
        <h1 className="text-2xl sm:text-3xl font-headline font-bold">Command Center</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Global telemetry for CellNexus ecosystem managed by Primary Leaders.</p>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard 
          title="Total Users" 
          value={loadingAll ? "..." : stats.totalUsers.toString()} 
          change="Registered in system"
          icon={Users}
        />
        <StatCard 
          title="Active Members" 
          value={loadingAll ? "..." : stats.activeMembers.toString()} 
          change="Real-time status"
          icon={UserCheck}
        />
        <StatCard 
          title="Cell Leaders" 
          value={loadingAll ? "..." : stats.leaders.toString()} 
          change="Assigned hierarchy"
          icon={Activity}
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, change, icon: Icon }: any) {
  return (
    <Card className="glass-card transition-all hover:scale-[1.02] active:scale-[0.98]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{title}</CardTitle>
        <div className="h-8 w-8 rounded-full bg-secondary/50 flex items-center justify-center border border-border/50">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 font-medium">{change}</p>
      </CardContent>
    </Card>
  );
}
