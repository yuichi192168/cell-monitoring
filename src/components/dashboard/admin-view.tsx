
"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MOCK_STATS, MOCK_MEMBERS } from '@/lib/mock-data';
import { Users, UserCheck, TrendingUp, Activity, MoreHorizontal } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const chartData = [
  { name: 'Jan', users: 400, cells: 24 },
  { name: 'Feb', users: 600, cells: 32 },
  { name: 'Mar', users: 800, cells: 48 },
  { name: 'Apr', users: 1000, cells: 64 },
  { name: 'May', users: 1450, cells: 128 },
];

export function AdminDashboard() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-headline font-bold">Command Center</h1>
        <p className="text-muted-foreground">Global telemetry for CellNexus ecosystem.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Users" 
          value={MOCK_STATS.totalUsers.toLocaleString()} 
          change="+12% from last month"
          icon={Users}
        />
        <StatCard 
          title="Cell Members" 
          value={MOCK_STATS.totalCellMembers.toString()} 
          change="+18% growth"
          icon={UserCheck}
        />
        <StatCard 
          title="Growth Rate" 
          value={`${MOCK_STATS.growthRate}%`} 
          change="Positive trajectory"
          icon={TrendingUp}
        />
        <StatCard 
          title="Active Sessions" 
          value={MOCK_STATS.activeSessions.toString()} 
          change="Live status"
          icon={Activity}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 glass-card">
          <CardHeader>
            <CardTitle>Member Expansion</CardTitle>
            <CardDescription>Visualizing user and cell growth over 5 months.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="name" stroke="#a3a3a3" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a3a3a3" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', color: '#fff' }}
                />
                <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 glass-card">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest member registrations.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-6">
               {MOCK_MEMBERS.slice(0, 4).map((member) => (
                 <div key={member.id} className="flex items-center gap-4">
                   <div className="h-9 w-9 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-xs">
                     {member.name.substring(0, 2)}
                   </div>
                   <div className="flex-1 space-y-1">
                     <p className="text-sm font-medium leading-none">{member.name}</p>
                     <p className="text-xs text-muted-foreground">{member.email}</p>
                   </div>
                   <Badge variant="outline" className="text-[10px] h-5">{member.status}</Badge>
                 </div>
               ))}
             </div>
             <Button variant="link" className="w-full mt-6 text-xs" asChild>
               <a href="/members">View All Records</a>
             </Button>
          </CardContent>
        </Card>
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
