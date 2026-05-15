"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Circle, User, Mail, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useMemoFirebase } from '@/hooks/use-memo-firebase';
import { Button } from '@/components/ui/button';

export function LeaderDashboard() {
  const { user } = useAuth();
  const db = useFirestore();

  const podQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, 'users'), where('assignedLeaderId', '==', user.id));
  }, [db, user]);

  const { data: members, loading } = useCollection(podQuery);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground animate-pulse uppercase tracking-widest">Monitoring telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1 sm:gap-2">
        <h1 className="text-2xl sm:text-3xl font-headline font-bold">Pod Monitor</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Manage and coach your assigned members.</p>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {members.length > 0 ? (
          members.map((member) => (
            <Card key={member.id} className="glass-card flex flex-col group hover:border-accent/30 transition-colors">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center border border-border mb-3 group-hover:bg-accent/10 transition-colors">
                    <User className="size-6 text-muted-foreground group-hover:text-accent transition-colors" />
                  </div>
                  <Badge 
                    variant={member.status === 'Active' ? 'default' : 'outline'}
                    className="text-[10px] uppercase tracking-wide font-bold"
                  >
                    {member.status}
                  </Badge>
                </div>
                <CardTitle className="text-lg line-clamp-1">{member.name}</CardTitle>
                <CardDescription className="flex items-center gap-1.5 text-xs">
                  <Mail className="size-3" />
                  {member.email}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-6 pt-0">
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Growth Milestones</p>
                  <div className="flex flex-wrap gap-1.5">
                    {member.ladderOfSuccess?.length > 0 ? (
                      member.ladderOfSuccess.map((step: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-[9px] px-2 py-0 border-none bg-secondary/80">
                          {step}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No milestones yet</span>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Current Objectives</p>
                  <div className="space-y-2">
                    {member.targetToDo?.length > 0 ? (
                      member.targetToDo.map((todo: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 text-xs p-2 rounded-lg bg-secondary/20 border border-border/40">
                          <Circle className="size-3 text-accent mt-0.5 flex-shrink-0" />
                          <span className="leading-tight">{todo}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No active targets</span>
                    )}
                  </div>
                </div>
                <div className="pt-2">
                  <Button variant="ghost" size="sm" className="w-full justify-between text-xs group/btn">
                    Update Profile
                    <ChevronRight className="size-3 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-20 text-center glass-card rounded-2xl border-dashed">
            <div className="h-16 w-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
               <User className="size-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-bold">Registry Empty</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1">No members currently assigned to your pod monitoring frequency.</p>
          </div>
        )}
      </div>
    </div>
  );
}
