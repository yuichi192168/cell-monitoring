
"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Circle, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useMemoFirebase } from '@/hooks/use-memo-firebase';

export function LeaderDashboard() {
  const { user } = useAuth();
  const db = useFirestore();

  const podQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, 'users'), where('assignedLeaderId', '==', user.id));
  }, [db, user]);

  const { data: members, loading } = useCollection(podQuery);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Monitoring telemetry...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-headline font-bold">Pod Monitor</h1>
        <p className="text-muted-foreground">Manage and coach your assigned members.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {members.length > 0 ? (
          members.map((member) => (
            <Card key={member.id} className="glass-card flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center border border-border mb-2">
                    <User className="size-6 text-muted-foreground" />
                  </div>
                  <Badge variant={member.status === 'Active' ? 'default' : 'outline'}>
                    {member.status}
                  </Badge>
                </div>
                <CardTitle>{member.name}</CardTitle>
                <CardDescription>{member.email}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2 tracking-wide">Milestones</p>
                  <div className="flex flex-wrap gap-1.5">
                    {member.ladderOfSuccess?.length > 0 ? (
                      member.ladderOfSuccess.map((step: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-[10px]">{step}</Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No milestones yet</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2 tracking-wide">Target To-Do</p>
                  <div className="space-y-1.5">
                    {member.targetToDo?.length > 0 ? (
                      member.targetToDo.map((todo: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <Circle className="size-3 text-muted-foreground" />
                          <span>{todo}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No active targets</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-12 text-center glass-card rounded-xl">
            <p className="text-muted-foreground italic">No members currently assigned to your pod.</p>
          </div>
        )}
      </div>
    </div>
  );
}
