
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-headline font-bold">Command Center</h1>
        <p className="text-muted-foreground">Global telemetry for CellNexus ecosystem.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{change}</p>
      </CardContent>
    </Card>
  );
}
